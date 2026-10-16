require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");

const app = express();
const PORT = Number(process.env.PORT) || 3002;
const MONGO_URL = process.env.MONGO_URL;

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients and configured frontends.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

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
app.get(["/allHoldings", "/allHolding"], getHoldings);
app.get(["/allPositions", "/allPosition"], getPositions);

app.post("/newOrder", async (req, res) => {
  const { name, qty, price, mode } = req.body;
  const quantity = Number(qty);
  const orderPrice = Number(price);

  if (typeof name !== "string" || !name.trim() || !Number.isFinite(quantity) || quantity <= 0 ||
      !Number.isFinite(orderPrice) || orderPrice < 0 || !["BUY", "SELL"].includes(mode)) {
    return res.status(400).json({ message: "Provide a name, positive quantity, valid price, and BUY or SELL mode." });
  }

  try {
    const order = await OrdersModel.create({ name: name.trim(), qty: quantity, price: orderPrice, mode });
    return res.status(201).json({ message: "Order saved", order });
  } catch (err) {
    console.error("Error saving order:", err);
    return res.status(500).json({ message: "Failed to save order" });
  }
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

  try {
    await mongoose.connect(MONGO_URL);
    console.log("Database is connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`API listening on port ${PORT}`));
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

if (require.main === module) startServer();

module.exports = app;
