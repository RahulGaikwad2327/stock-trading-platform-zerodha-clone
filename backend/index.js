require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { requireAuth } = require("./middleware/auth");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = Number(process.env.PORT) || 3002;
const MONGO_URL = process.env.MONGO_URL;
app.set("trust proxy", 1);
let databaseConnection;

function connectDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (!databaseConnection) {
    databaseConnection = mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 10000 }).catch((error) => {
      databaseConnection = null;
      throw error;
    });
  }
  return databaseConnection;
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const serviceOrigin = process.env.RENDER_EXTERNAL_URL;

function isLocalDevelopmentOrigin(origin) {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === "http:" && ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients and configured frontends.
    if (!origin || origin === serviceOrigin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
}));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));
app.use(express.json({ limit: "10kb" }));
app.use((req, res, next) => { req.body ||= {}; next(); });

app.get("/health", async (req, res) => {
  try {
    if (!MONGO_URL) return res.status(503).json({ status: "error", database: "not configured" });
    await connectDatabase();
    return res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check database connection failed:", error.message);
    return res.status(503).json({ status: "error", database: "disconnected" });
  }
});

// Vercel invokes the exported Express app without running startServer().
// Connect lazily and reuse Mongoose's connection between warm function calls.
app.use(["/auth", "/allHoldings", "/allHolding", "/allPositions", "/allPosition", "/allOrders", "/newOrder"], async (req, res, next) => {
  try {
    if (!MONGO_URL) return res.status(503).json({ message: "Database is not configured." });
    await connectDatabase();
    return next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return res.status(503).json({ message: "Database is temporarily unavailable." });
  }
});
app.use("/auth", authRoutes);

async function getHoldings(req, res) {
  try {
    const holdings = await HoldingsModel.find({}).lean();
    return res.status(200).json(holdings);
  } catch (err) {
    console.error("Error fetching holdings:", err);
    return res.status(500).json({ message: "Failed to fetch holdings" });
  }
}

async function getPositions(req, res) {
  try {
    const positions = await PositionsModel.find({}).lean();
    return res.status(200).json(positions);
  } catch (err) {
    console.error("Error fetching positions:", err);
    return res.status(500).json({ message: "Failed to fetch positions" });
  }
}

// Keep the original singular URLs available for existing clients.
app.get(["/allHoldings", "/allHolding"], requireAuth, getHoldings);
app.get(["/allPositions", "/allPosition"], requireAuth, getPositions);

app.get("/allOrders", requireAuth, async (req, res) => {
  try {
    const orders = await OrdersModel.find({ userId: req.auth.id }).sort({ _id: -1 }).lean();
    return res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
});

app.post("/newOrder", requireAuth, async (req, res) => {
  const { name, qty, price, mode } = req.body;
  const quantity = Number(qty);
  const orderPrice = Number(price);

  if (typeof name !== "string" || !name.trim() || !Number.isFinite(quantity) || quantity <= 0 ||
      !Number.isFinite(orderPrice) || orderPrice < 0 || !["BUY", "SELL"].includes(mode)) {
    return res.status(400).json({ message: "Provide a name, positive quantity, valid price, and BUY or SELL mode." });
  }

  try {
    const order = await OrdersModel.create({ name: name.trim(), qty: quantity, price: orderPrice, mode, userId: req.auth.id });
    return res.status(201).json({ message: "Order saved", order });
  } catch (err) {
    console.error("Error saving order:", err);
    return res.status(500).json({ message: "Failed to save order" });
  }
});

const dashboardBuild = path.resolve(__dirname, "../dashboard/build");
app.use(express.static(dashboardBuild));
app.get(/.*/, (req, res, next) => {
  if (req.accepts("html") && require("fs").existsSync(path.join(dashboardBuild, "index.html"))) {
    return res.sendFile(path.join(dashboardBuild, "index.html"));
  }
  return next();
});

app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ message: "Request body is too large" });
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Request body must be valid JSON" });
  }
  console.error("Request error:", err);
  return res.status(500).json({ message: "Internal server error" });
});

async function startServer() {
  if (!MONGO_URL) {
    console.error("MONGO_URL is required. Set it in backend/.env for local development or in the deployment environment.");
    process.exit(1);
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    console.error("SESSION_SECRET is required and must contain at least 32 characters.");
    process.exit(1);
  }

  try {
    await connectDatabase();
    console.log("Database is connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`API listening on port ${PORT}`));
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

if (require.main === module) startServer();

module.exports = app;
