const crypto = require("crypto");
const { UserModel } = require("../model/UserModel");

const SESSION_COOKIE = "zerodha_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const configuredSameSite = (process.env.SESSION_COOKIE_SAME_SITE || "lax").toLowerCase();
const SESSION_COOKIE_SAME_SITE = ["lax", "strict", "none"].includes(configuredSameSite) ? configuredSameSite : "lax";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signSession(user) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: String(user._id), role: user.role, iat: now, exp: now + SESSION_TTL_SECONDS }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function verifySession(token) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac("sha256", secret).update(unsigned).digest();
  let received;
  try { received = Buffer.from(parts[2], "base64url"); } catch { return null; }
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (header.alg !== "HS256" || !payload.sub || !Number.isInteger(payload.exp) || payload.exp <= Date.now() / 1000) return null;
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

function readCookie(req, name) {
  const pair = (req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!pair) return null;
  try { return decodeURIComponent(pair.slice(name.length + 1)); } catch { return null; }
}

async function requireAuth(req, res, next) {
  const session = verifySession(readCookie(req, SESSION_COOKIE));
  if (!session) return res.status(401).json({ message: "Please sign in to continue." });
  try {
    const user = await UserModel.findById(session.id).select("name email role");
    if (!user) return res.status(401).json({ message: "Please sign in to continue." });
    req.auth = { id: String(user._id), role: user.role };
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) return res.status(403).json({ message: "You do not have permission to access this resource." });
    return next();
  };
}

function setSessionCookie(res, user) {
  res.cookie(SESSION_COOKIE, signSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: SESSION_COOKIE_SAME_SITE,
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: SESSION_COOKIE_SAME_SITE,
    path: "/",
  });
}

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

module.exports = { requireAuth, requireRole, setSessionCookie, clearSessionCookie, publicUser, SESSION_TTL_SECONDS };
