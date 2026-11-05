const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Fix for Windows DNS SRV lookup failure (querySrv ECONNREFUSED)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err.message));
}

app.get("/", (req, res) => {
  res.json({ success: true, message: "Smart Supermarket Backend is running!" });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is working",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
