const crypto = require("crypto");
const { promisify } = require("util");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");
const { UserModel } = require("../model/UserModel");
const { requireAuth, requireRole, setSessionCookie, clearSessionCookie, publicUser } = require("../middleware/auth");

const router = express.Router();
const scrypt = promisify(crypto.scrypt);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
let appleJwks;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAdminEmail(email) {
  return (process.env.ADMIN_EMAILS || "").split(",").map(normalizeEmail).filter(Boolean).includes(email);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt}$${key.toString("hex")}`;
}

async function checkPassword(password, encoded) {
  const [scheme, n, r, p, salt, hash] = (encoded || "").split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function validateNonce(nonce) {
  return typeof nonce === "string" && nonce.length >= 16 && nonce.length <= 256;
}

function finishLogin(res, user) {
  setSessionCookie(res, user);
  return res.status(200).json({ user: publicUser(user) });
}

async function findOrCreateProviderUser({ provider, subject, email, name }) {
  const subjectField = provider === "google" ? "googleSub" : "appleSub";
  let user = await UserModel.findOne({ [subjectField]: subject });
  if (user) return user;

  user = await UserModel.findOne({ email });
  if (user) {
    if (user[subjectField] && user[subjectField] !== subject) throw Object.assign(new Error("This email is linked to a different provider account."), { status: 409 });
    user[subjectField] = subject;
    if (!user.name && name) user.name = name.slice(0, 80);
    await user.save();
    return user;
  }

  return UserModel.create({
    email,
    name: (name || "").slice(0, 80),
    [subjectField]: subject,
    role: isAdminEmail(email) ? "admin" : "user",
  });
}

router.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    if (!name || name.length > 80 || !validEmail(email) || typeof password !== "string" || password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: "Enter your name, a valid email, and a password between 12 and 128 characters." });
    }

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({ name, email, passwordHash, role: isAdminEmail(email) ? "admin" : "user" });
    return finishLogin(res, user);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with that email already exists." });
    return next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    if (!validEmail(email) || typeof password !== "string" || password.length > 128) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    const user = await UserModel.findOne({ email }).select("+passwordHash");
    if (!user || !(await checkPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }
    return finishLogin(res, user);
  } catch (error) {
    return next(error);
  }
});

router.post("/google", authLimiter, async (req, res, next) => {
  try {
    const { credential, nonce } = req.body;
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: "Google sign-in has not been configured." });
    if (typeof credential !== "string" || !validateNonce(nonce)) return res.status(400).json({ message: "Google sign-in response is invalid." });
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const claims = ticket.getPayload();
    if (!claims?.sub || !claims.email || claims.email_verified !== true || claims.nonce !== nonce) {
      return res.status(401).json({ message: "Google could not verify this sign-in." });
    }
    const email = normalizeEmail(claims.email);
    const user = await findOrCreateProviderUser({ provider: "google", subject: claims.sub, email, name: claims.name || "" });
    return finishLogin(res, user);
  } catch (error) {
    if (error.status === 409) return res.status(409).json({ message: error.message });
    return next(error);
  }
});

router.post("/apple", authLimiter, async (req, res, next) => {
  try {
    const { identityToken, nonce, name } = req.body;
    if (!process.env.APPLE_CLIENT_ID) return res.status(503).json({ message: "Apple sign-in has not been configured." });
    if (typeof identityToken !== "string" || !validateNonce(nonce)) return res.status(400).json({ message: "Apple sign-in response is invalid." });
    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    appleJwks ||= createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
    const { payload } = await jwtVerify(identityToken, appleJwks, {
      issuer: "https://appleid.apple.com",
      audience: process.env.APPLE_CLIENT_ID,
    });
    const verified = payload.email_verified === true || payload.email_verified === "true";
    const expectedNonce = crypto.createHash("sha256").update(nonce).digest("hex");
    if (!payload.sub || !payload.email || !verified || payload.nonce !== expectedNonce) {
      return res.status(401).json({ message: "Apple could not verify this sign-in." });
    }
    const email = normalizeEmail(payload.email);
    const displayName = [name?.firstName, name?.lastName].filter((part) => typeof part === "string" && part.trim()).join(" ");
    const user = await findOrCreateProviderUser({ provider: "apple", subject: payload.sub, email, name: displayName });
    return finishLogin(res, user);
  } catch (error) {
    if (error.status === 409) return res.status(409).json({ message: error.message });
    return next(error);
  }
});

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  return res.status(204).end();
});
router.get("/admin/users", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const users = await UserModel.find({}).select("name email role createdAt").sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
