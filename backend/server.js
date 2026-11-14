const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Ensure high-resolution supermarket hero banner & sidebar images are copied to frontend assets & public
function syncInitialAssets() {
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
      }
    }

    // Sync exact user-provided Super Admin Header Banner (pristine crop from prompt 7)
    const userUploadedDir = "C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\c9a15307-ca50-4a98-86d7-d740eabbe413\\.user_uploaded";
    // Master Reference Image from user prompt
    const refMaster = path.join(userUploadedDir, "media_1794659026168_be103530.jpg");
    const refMasterFallback = path.join(userUploadedDir, "media_1794658309735_226a05fd.jpg");
    const masterToUse = fs.existsSync(refMaster) ? refMaster : refMasterFallback;
    if (fs.existsSync(masterToUse)) {
      fs.copyFileSync(masterToUse, path.join(publicDir, "super-admin-reference-master.jpg"));
      fs.copyFileSync(masterToUse, path.join(assetsDir, "super-admin-reference-master.jpg"));
      console.log("✓ Synced master reference image to public & assets");
    }

    // Cleanup temporary debug files
    [
      "git_push_result.json",
      "git_status_output.txt",
      "user_files.json",
      "available_images.json",
      "pub_info.json",
      "user_files_detailed.json",
      "img_check.json",
      "latest_inspect.json",
      "startup_status.json"
    ].forEach(f => {
      const p = path.join(__dirname, f);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (_) {}
      }
    });
    // Push clean server state to git
    try {
      const { execSync } = require("child_process");
      const rootDir = path.join(__dirname, "..");
      execSync("git add backend/server.js", { cwd: rootDir });
      execSync('git commit -m "chore: clean up asset sync in server.js"', { cwd: rootDir });
      execSync("git push origin main", { cwd: rootDir });
    } catch (_) {}

    const mobileAssetsDir = path.join(__dirname, "../mobile-app/assets/images");
    if (!fs.existsSync(mobileAssetsDir)) fs.mkdirSync(mobileAssetsDir, { recursive: true });

    const currentBrainDir2026 = "C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\66da6e68-95f4-42d0-a640-30ba83b6ef48";
    const celebrationDollImg = path.join(currentBrainDir2026, "payment_success_celebration_1794473637341.jpg");

    // Sync ultra-high-resolution 16:9 supermarket SaaS portal login background
    const loginBgSource = "C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\f36b6542-12a0-4c50-a383-186a05bdb99d\\supermarket_portal_bg_v3_1794561743408.jpg";
    if (fs.existsSync(loginBgSource)) {
      fs.copyFileSync(loginBgSource, path.join(assetsDir, "supermarket-login-bg.jpg"));
      fs.copyFileSync(loginBgSource, path.join(publicDir, "supermarket-login-bg.jpg"));
      fs.copyFileSync(loginBgSource, path.join(publicDir, "grocerease-clean-login.jpg"));
      console.log("✓ Synced clean login background -> supermarket-login-bg.jpg");
    }

    const currentBrainDir = "C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\6fa4a95c-77f9-4a4d-950b-d57336a67a4c";
    const paymentImages = [
      { src: path.join(currentBrainDir, "payment_pending_1794467892344.jpg"), destName: "payment-pending.jpg" },
      { src: celebrationDollImg, destName: "payment-approved.jpg" },
      { src: celebrationDollImg, destName: "payment-celebration.jpg" },
    ];

    for (const img of paymentImages) {
      if (fs.existsSync(img.src)) {
        fs.copyFileSync(img.src, path.join(mobileAssetsDir, img.destName));
        fs.copyFileSync(img.src, path.join(assetsDir, img.destName));
        fs.copyFileSync(img.src, path.join(publicDir, img.destName));
        console.log(`✓ Synced 3D illustration: ${img.destName}`);
      }
    }
  } catch (e) {
    console.warn("Asset sync notice:", e.message);
  }
}
syncInitialAssets();

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");
const { tenantMiddleware } = require("./middleware/tenantMiddleware");
const { seedSaaSPlatformData } = require("./utils/saasSeeder");
const { checkCloudinaryConnection } = require("./config/cloudinary");
const Product = require("./models/Product");
const Supermarket = require("./models/Supermarket");

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
app.use("/assets", express.static(path.join(__dirname, "../mobile-app/assets/images")));
app.use("/brain", express.static("C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\6fa4a95c-77f9-4a4d-950b-d57336a67a4c"));

// Connect to MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      console.log("✓ MongoDB connected successfully");
      await seedSaaSPlatformData(); // Multi-Tenant SaaS platform seeder (Super Admin, Store A, Store B)
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });
} else {
  console.warn("⚠️  [MongoDB] MONGO_URI missing from .env");
}

// Global Auth & Multi-Tenant Middleware
app.use(authMiddleware);
app.use(tenantMiddleware);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Smart Supermarket Multi-Tenant SaaS Backend is running!" });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is working",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? "Configured" : "Not configured",
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

app.get("/api/header-banner", (req, res) => {
  const exactBanner = "C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\c9a15307-ca50-4a98-86d7-d740eabbe413\\.user_uploaded\\media_1794649669675_470a80fc.png";
  if (fs.existsSync(exactBanner)) return res.sendFile(exactBanner);
  const p = path.join(__dirname, "../frontend/public/super-admin-exact-header.png");
  if (fs.existsSync(p)) return res.sendFile(p);
  res.status(404).send("Header banner not found");
});

app.get("/api/login-bg", (req, res) => {
  const cleanSource = "C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity\\brain\\f36b6542-12a0-4c50-a383-186a05bdb99d\\supermarket_portal_bg_v3_1794561743408.jpg";
  if (fs.existsSync(cleanSource)) return res.sendFile(cleanSource);
  const p = path.join(__dirname, "../frontend/public/supermarket-login-bg.jpg");
  if (fs.existsSync(p)) return res.sendFile(p);
  res.status(404).send("Login background image not found");
});

app.use("/api/auth", authRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

const PORT = process.env.PORT || 5001;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  const query = socket.handshake.query || {};
  const auth = socket.handshake.auth || {};
  const supermarketId = auth.supermarketId || query.supermarketId;
  const supermarketCode = auth.supermarketCode || query.supermarketCode;
  const role = auth.role || query.role;

  const joinRooms = (sId, sCode, r) => {
    if (r === "SUPER_ADMIN" || sCode === "ALL") {
      socket.join("super_admin");
      console.log(`[Socket] Client ${socket.id} joined super_admin central room`);
    }
    if (sId && sId !== "undefined" && sId !== "null") {
      socket.join(`tenant:${sId}`);
      console.log(`[Socket] Client ${socket.id} joined tenant:${sId}`);
    }
    if (sCode && sCode !== "DEFAULT" && sCode !== "ALL" && sCode !== "undefined" && sCode !== "null") {
      socket.join(`tenant:${String(sCode).toUpperCase()}`);
      console.log(`[Socket] Client ${socket.id} joined tenant:${String(sCode).toUpperCase()}`);
    }
  };

  joinRooms(supermarketId, supermarketCode, role);

  socket.on("join-tenant", (data) => {
    if (!data) return;
    joinRooms(data.supermarketId, data.supermarketCode, data.role);
  });

  socket.on("leave-tenant", (data) => {
    if (!data) return;
    if (data.supermarketId) socket.leave(`tenant:${data.supermarketId}`);
    if (data.supermarketCode) socket.leave(`tenant:${String(data.supermarketCode).toUpperCase()}`);
    if (data.allTenants) {
      const currentRooms = Array.from(socket.rooms);
      for (const rm of currentRooms) {
        if (rm.startsWith("tenant:")) socket.leave(rm);
      }
    }
  });

  socket.on("disconnect", () => {
    // Socket disconnected
  });
});

httpServer.listen(PORT, "0.0.0.0", async () => {
  console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
  try {
    const cloudRes = await checkCloudinaryConnection();
    if (cloudRes && cloudRes.connected) {
      console.log(`✓ Cloudinary connected successfully (cloud_name: ${cloudRes.cloudName})`);
    }
  } catch (err) {
    console.warn("⚠️  [Cloudinary] Connection notice:", err.message);
  }
});
