const Supermarket = require("../models/Supermarket");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const CartActivity = require("../models/CartActivity");

async function seedSaaSPlatformData() {
  try {
    // =========================================================================
    // 1. ENSURE PLATFORM SUPER ADMIN EXISTS (admin / Admin@123)
    // =========================================================================
    let superAdmin = await User.findOne({ username: "admin" });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: "Super Admin",
        username: "admin",
        email: "superadmin@grocerease.store",
        password: "Admin@123",
        role: "SUPER_ADMIN",
        status: "Active",
      });
      console.log("✓ Created Platform Super Admin: admin / Admin@123");
    } else {
      superAdmin.role = "SUPER_ADMIN";
      superAdmin.password = "Admin@123";
      await superAdmin.save();
    }

    // =========================================================================
    // 2. ENSURE SUPERMARKET A (STR-001 - GrocerEase Supermarket)
    // =========================================================================
    let storeA = await Supermarket.findOne({ code: "STR-001" });
    if (!storeA) {
      storeA = await Supermarket.create({
        name: "GrocerEase Supermarket",
        code: "STR-001",
        slug: "grocerease-supermarket",
        tagline: "Autonomous Smart Retail & High-Speed Clearance",
        address: "100ft Road, HAL 2nd Stage, Indiranagar",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560038",
        phone: "+91 98450 12345",
        email: "poojasree@gmail.com",
        adminUsername: "pooja",
        adminPassword: "pooja@123",
        adminName: "Pooja V",
        status: "Active",
        plan: "Enterprise",
        themeColor: "#1455d9",
      });
      console.log("✓ Created Supermarket A: GrocerEase Supermarket (STR-001)");
    } else {
      storeA.name = "GrocerEase Supermarket";
      storeA.adminUsername = "pooja";
      storeA.adminPassword = "pooja@123";
      storeA.adminName = "Pooja V";
      storeA.email = "poojasree@gmail.com";
      storeA.status = "Active";
      await storeA.save();
    }

    // Ensure Store Admin User for Supermarket A
    let adminA = await User.findOne({ username: "pooja" });
    if (!adminA) {
      adminA = await User.create({
        name: "Pooja V",
        username: "pooja",
        email: "poojasree@gmail.com",
        password: "pooja@123",
        role: "STORE_ADMIN",
        supermarket: storeA._id,
        supermarketCode: storeA.code,
        supermarketName: storeA.name,
        status: "Active",
      });
      console.log("✓ Created Store Admin A: pooja / pooja@123");
    } else {
      adminA.name = "Pooja V";
      adminA.password = "pooja@123";
      adminA.role = "STORE_ADMIN";
      adminA.supermarket = storeA._id;
      adminA.supermarketCode = storeA.code;
      adminA.supermarketName = storeA.name;
      adminA.status = "Active";
      await adminA.save();
    }

    // =========================================================================
    // 3. ENSURE SUPERMARKET B (STR-002 - FreshMart Supermarket)
    // =========================================================================
    let storeB = await Supermarket.findOne({ code: "STR-002" });
    if (!storeB) {
      storeB = await Supermarket.create({
        name: "FreshMart Supermarket",
        code: "STR-002",
        slug: "freshmart-supermarket",
        tagline: "Farm Fresh Groceries & Express Clearance",
        address: "80ft Road, 4th Block, Koramangala",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560034",
        phone: "+91 98451 98765",
        email: "storeb@freshmart.store",
        adminUsername: "storeb",
        adminPassword: "StoreB@123",
        adminName: "Rohan Gupta",
        status: "Active",
        plan: "Professional",
        themeColor: "#059669",
      });
      console.log("✓ Created Supermarket B: FreshMart Supermarket (STR-002)");
    } else {
      storeB.name = "FreshMart Supermarket";
      storeB.adminUsername = "storeb";
      storeB.adminPassword = "StoreB@123";
      storeB.adminName = "Rohan Gupta";
      storeB.email = "storeb@freshmart.store";
      storeB.status = "Active";
      await storeB.save();
    }

    // Ensure Store Admin User for Supermarket B
    let adminB = await User.findOne({ username: "storeb" });
    if (!adminB) {
      adminB = await User.create({
        name: "Rohan Gupta",
        username: "storeb",
        email: "storeb@freshmart.store",
        password: "StoreB@123",
        role: "STORE_ADMIN",
        supermarket: storeB._id,
        supermarketCode: storeB.code,
        supermarketName: storeB.name,
        status: "Active",
      });
      console.log("✓ Created Store Admin B: storeb / StoreB@123");
    } else {
      adminB.name = "Rohan Gupta";
      adminB.password = "StoreB@123";
      adminB.role = "STORE_ADMIN";
      adminB.supermarket = storeB._id;
      adminB.supermarketCode = storeB.code;
      adminB.supermarketName = storeB.name;
      adminB.status = "Active";
      await adminB.save();
    }

    // =========================================================================
    // 4. CLEANUP LEGACY DUMMY USERS (only unused old usernames)
    // =========================================================================
    await User.deleteMany({
      username: { $in: ["store1", "anita", "anitadesai", "ramesh", "freshmart"] },
    });

    // Clean up only known seeded mock test records
    await Order.deleteMany({
      $or: [
        { orderNumber: { $in: ["ORD-948102-1001", "ORD-772109-2001", "ORD-289409", "ORD-289410", "ORD-STR001-1001", "ORD-STR002-2001"] } },
        { "customer.name": { $in: ["Kavitha R", "Vikram Mehta", "Arun Kumar", "Priya Sharma", "Neha Patel", "Rahul Verma"] } },
        { totalAmount: { $in: [510, 9450] } },
      ],
    });

    await CartActivity.deleteMany({
      $or: [
        { customerName: { $in: ["Kavitha R", "Vikram Mehta", "Arun Kumar", "Priya Sharma", "Neha Patel", "Rahul Verma"] } },
        { sessionId: { $in: ["live-priya-sharma", "live-neha-patel", "live-rahul-verma"] } },
      ],
    });

    // =========================================================================
    // 5. SEED PRODUCTS SPECIFIC TO SUPERMARKET A (STR-001)
    // =========================================================================
    const storeAProductsCount = await Product.countDocuments({
      supermarket: storeA._id,
      isActive: { $ne: false },
    });

    if (storeAProductsCount === 0) {
      const storeAProducts = [
        {
          name: "Cadbury Dairy Milk Chocolate",
          brand: "Cadbury",
          category: "Beverages",
          barcode: "87654367",
          price: 352.0,
          costPrice: 280.0,
          stock: 15,
          lowStockThreshold: 5,
          imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=120&auto=format&fit=crop&q=80",
          description: "Premium rich milk chocolate.",
          supermarket: storeA._id,
          supermarketCode: storeA.code,
          isActive: true,
        },
        {
          name: "Dove Daily Moisture Shampoo 180ml",
          brand: "Dove",
          category: "Household",
          barcode: "1234561",
          price: 250.0,
          costPrice: 195.0,
          stock: 20,
          lowStockThreshold: 5,
          imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=120&auto=format&fit=crop&q=80",
          description: "Nourishing daily moisture hair shampoo.",
          supermarket: storeA._id,
          supermarketCode: storeA.code,
          isActive: true,
        },
        {
          name: "Daawat Rozana Basmati Rice 5kg",
          brand: "Daawat",
          category: "Groceries",
          barcode: "1234566",
          price: 2500.0,
          costPrice: 2100.0,
          stock: 10,
          lowStockThreshold: 3,
          imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80",
          description: "Long grain aromatic basmati rice.",
          supermarket: storeA._id,
          supermarketCode: storeA.code,
          isActive: true,
        },
      ];
      await Product.insertMany(storeAProducts);
      console.log("✓ Seeded distinct products for Supermarket A (STR-001).");
    }

    // =========================================================================
    // 6. SEED PRODUCTS SPECIFIC TO SUPERMARKET B (STR-002) - COMPLETELY DIFFERENT
    // =========================================================================
    const storeBProductsCount = await Product.countDocuments({
      supermarket: storeB._id,
      isActive: { $ne: false },
    });

    if (storeBProductsCount === 0) {
      const storeBProducts = [
        {
          name: "Organic Himalayan Green Tea 250g",
          brand: "EcoHerbs",
          category: "Beverages",
          barcode: "8901020304051",
          price: 320.0,
          costPrice: 240.0,
          stock: 30,
          lowStockThreshold: 8,
          imageUrl: "https://images.unsplash.com/photo-1508253578933-20b529302151?w=120&auto=format&fit=crop&q=80",
          description: "Fresh handpicked whole leaf organic green tea.",
          supermarket: storeB._id,
          supermarketCode: storeB.code,
          isActive: true,
        },
        {
          name: "Pure Alphonso Mango Juice 1L",
          brand: "TropicFresh",
          category: "Beverages",
          barcode: "8901020304068",
          price: 160.0,
          costPrice: 120.0,
          stock: 25,
          lowStockThreshold: 6,
          imageUrl: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=120&auto=format&fit=crop&q=80",
          description: "100% natural Alphonso mango fruit juice.",
          supermarket: storeB._id,
          supermarketCode: storeB.code,
          isActive: true,
        },
        {
          name: "California Roasted Almonds 500g",
          brand: "NutriDelight",
          category: "Snacks",
          barcode: "8901020304075",
          price: 480.0,
          costPrice: 380.0,
          stock: 18,
          lowStockThreshold: 5,
          imageUrl: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=120&auto=format&fit=crop&q=80",
          description: "Lightly salted crunchy California roasted almonds.",
          supermarket: storeB._id,
          supermarketCode: storeB.code,
          isActive: true,
        },
      ];
      await Product.insertMany(storeBProducts);
      console.log("✓ Seeded distinct products for Supermarket B (STR-002).");
    }

    // Assign all legacy unassigned products, orders and cart activities to Pooja's Supermarket (Store A)
    await Product.updateMany(
      { $or: [{ supermarket: null }, { supermarket: { $exists: false } }] },
      { $set: { supermarket: storeA._id, supermarketCode: storeA.code } }
    );

    await Order.updateMany(
      { $or: [{ supermarket: null }, { supermarket: { $exists: false } }] },
      {
        $set: {
          supermarket: storeA._id,
          supermarketCode: storeA.code,
          supermarketName: storeA.name,
          paymentStatus: "Completed",
        },
      }
    );

    await CartActivity.updateMany(
      { $or: [{ supermarket: null }, { supermarket: { $exists: false } }] },
      {
        $set: {
          supermarket: storeA._id,
          supermarketCode: storeA.code,
        },
      }
    );

    console.log("✓ Multi-Tenant SaaS platform seeding complete:");
    console.log("  - Super Admin: admin / Admin@123");
    console.log("  - Supermarket A (STR-001): pooja / pooja@123 (Zero dummy orders, real-time ready)");
    console.log("  - Supermarket B (STR-002): storeb / StoreB@123 (Zero dummy orders, real-time ready)");
  } catch (err) {
    console.error("Multi-tenant seeding error:", err);
  }
}

module.exports = { seedSaaSPlatformData };
