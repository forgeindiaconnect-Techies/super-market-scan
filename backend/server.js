const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Ensure high-resolution supermarket hero banner & sidebar images are copied to frontend assets & public
try {
  const brainDir = "C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\fb582fb9-2b2b-411c-ac43-40149f4c94a9";
  const assetsDir = path.join(__dirname, "../frontend/src/assets");
  const publicDir = path.join(__dirname, "../frontend/public");
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const syncList = [
    { src: path.join(brainDir, "sidebar_abstract_blue_waves_1794046512095.jpg"), names: ["sidebar-waves-bg.jpg", "sidebar_abstract_blue_waves.jpg"] },
    { src: path.join(brainDir, "grocery_basket_3d_1794046555765.jpg"), names: ["grocery-basket-3d.jpg", "grocery_basket_3d.jpg"] },
    { src: path.join(brainDir, "storefront_3d_supermarket_1794046532029.jpg"), names: ["storefront-3d.jpg", "storefront_3d.jpg"] },
    { src: path.join(brainDir, "dashboard_hero_banner_art_1794046675903.jpg"), names: ["hero-banner-art.jpg", "dashboard_hero_banner_art.jpg"] },
    { src: path.join(brainDir, "dashboard_hero_fresh_cart_aisle_1794053392050.jpg"), names: ["dashboard-hero-fresh-cart.jpg", "hero-aisle-cart.jpg"] },
    { src: path.join(brainDir, "blue_shopping_bag_3d_1794053871902.jpg"), names: ["blue-shopping-bag-3d.jpg"] },
    { src: path.join(brainDir, "gift_box_3d_icon_1794053425724.jpg"), names: ["gift-box-3d.jpg"] },
  ];

  for (const item of syncList) {
    if (fs.existsSync(item.src)) {
      for (const name of item.names) {
        fs.copyFileSync(item.src, path.join(assetsDir, name));
        fs.copyFileSync(item.src, path.join(publicDir, name));
      }
      console.log(`✓ Synced asset: ${item.names[0]}`);
    }
  }
} catch (e) {
  console.warn("Asset sync:", e.message);
}

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const Product = require("./models/Product");

// Seed initial products if DB is empty so real-time CRUD and stock updates persist permanently
async function seedInitialProductsIfEmpty() {
  try {
    const count = await Product.countDocuments({ isActive: { $ne: false } });
    if (count === 0) {
      console.log("Database empty. Seeding real supermarket products...");
      const initialProducts = [
        {
          name: "Chocolate",
          brand: "Zero Sugar",
          category: "Beverages",
          barcode: "87654367",
          price: 352.0,
          costPrice: 280.0,
          stock: 5,
          lowStockThreshold: 10,
          imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=120&auto=format&fit=crop&q=80",
          description: "Premium dark chocolate with zero added sugar.",
        },
        {
          name: "Lays",
          brand: "NO 1",
          category: "Beverages",
          barcode: "12356",
          price: 10.0,
          costPrice: 8.0,
          stock: 27,
          lowStockThreshold: 5,
          imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120&auto=format&fit=crop&q=80",
          description: "Crispy salted potato chips.",
        },
        {
          name: "Shmapoo 180 ml",
          brand: "Dove",
          category: "Household",
          barcode: "1234561",
          price: 250.0,
          costPrice: 200.0,
          stock: 8,
          lowStockThreshold: 5,
          imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=120&auto=format&fit=crop&q=80",
          description: "Nourishing daily shampoo for smooth hair.",
        },
        {
          name: "Rice",
          brand: "Rice no 1",
          category: "Groceries",
          barcode: "1234566",
          price: 2500.0,
          costPrice: 2100.0,
          stock: 20,
          lowStockThreshold: 5,
          imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80",
          description: "Superior long grain aromatic basmati rice.",
        },
        {
          name: "Rice",
          brand: "Rice no 1",
          category: "Groceries",
          barcode: "1234567",
          price: 2500.0,
          costPrice: 2100.0,
          stock: 20,
          lowStockThreshold: 5,
          imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80",
          description: "Everyday fine grain polished rice 5kg pack.",
        },
      ];
      await Product.insertMany(initialProducts);
      console.log("✓ 5 real supermarket products successfully seeded into MongoDB Atlas.");
    } else {
      console.log(`Database already has ${count} real products.`);
    }
  } catch (err) {
    console.error("Seed error:", err.message);
  }
}

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
    .then(async () => {
      console.log("MongoDB connected successfully");
      await seedInitialProductsIfEmpty();
    })
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

app.get("/api/banner", (req, res) => {
  const bannerPath = path.join(__dirname, "../frontend/src/assets/hero-banner-art.jpg");
  const fallbackPath = "C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\854d9c17-1fe6-4371-834d-7baab097676a\\supermarket_saas_banner_1793941573073.jpg";
  if (fs.existsSync(bannerPath)) {
    return res.sendFile(bannerPath);
  }
  if (fs.existsSync(fallbackPath)) {
    return res.sendFile(fallbackPath);
  }
  res.status(404).send("Banner not found");
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
