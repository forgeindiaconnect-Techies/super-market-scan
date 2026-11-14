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
        logoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80",
      });
      console.log("✓ Created Supermarket A: GrocerEase Supermarket (STR-001)");
    } else {
      storeA.name = "GrocerEase Supermarket";
      storeA.adminUsername = "pooja";
      storeA.adminPassword = "pooja@123";
      storeA.adminName = "Pooja V";
      storeA.email = "poojasree@gmail.com";
      storeA.status = "Active";
      storeA.startDate = storeA.startDate || new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      storeA.expiryDate = storeA.expiryDate || new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      storeA.subscriptionAmount = 34999;
      storeA.billingCycle = "Monthly";
      if (!storeA.logoUrl) storeA.logoUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80";
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
        logoUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80",
      });
      console.log("✓ Created Supermarket B: FreshMart Supermarket (STR-002)");
    } else {
      storeB.name = "FreshMart Supermarket";
      storeB.adminUsername = "storeb";
      storeB.adminPassword = "StoreB@123";
      storeB.adminName = "Rohan Gupta";
      storeB.email = "storeb@freshmart.store";
      storeB.status = "Active";
      storeB.startDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
      storeB.expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // EXPIRES TOMORROW (24 hours) for real-time alert testing
      storeB.subscriptionAmount = 9999;
      storeB.billingCycle = "Monthly";
      if (!storeB.logoUrl) storeB.logoUrl = "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80";
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

    // =========================================================================
    // 7. ENSURE SUPERMARKET AKSHAYA (SM-7087) with Exact Catalog Products (Attachment 4)
    // =========================================================================
    let storeAkshaya = await Supermarket.findOne({
      $or: [{ code: "SM-7087" }, { slug: "akshaya" }, { adminUsername: "akshaya" }],
    });

    if (!storeAkshaya) {
      storeAkshaya = await Supermarket.create({
        name: "Akshaya",
        code: "SM-7087",
        slug: "akshaya",
        tagline: "Smart Supermarket & Instant Gate Clearance",
        address: "Begur",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        phone: "+91 6789098765",
        email: "akshaya@gmail.com",
        ownerName: "Akshaya",
        contactPerson: "Akshaya Admin",
        adminUsername: "akshaya",
        adminPassword: "Akshaya@123",
        adminName: "Akshaya Admin",
        status: "Active",
        plan: "Basic",
        themeColor: "#16a34a",
        logoUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80",
        subscriptionAmount: 4999,
        billingCycle: "Monthly",
        startDate: new Date("2026-11-14T00:00:00.000Z"),
        expiryDate: new Date("2026-12-14T00:00:00.000Z"),
      });
      console.log("✓ Created Supermarket: Akshaya (SM-7087)");
    } else {
      storeAkshaya.name = "Akshaya";
      storeAkshaya.code = "SM-7087";
      storeAkshaya.ownerName = "Akshaya";
      storeAkshaya.contactPerson = "Akshaya Admin";
      storeAkshaya.adminName = "Akshaya Admin";
      storeAkshaya.email = "akshaya@gmail.com";
      storeAkshaya.phone = "+91 6789098765";
      storeAkshaya.address = "Begur";
      storeAkshaya.city = "Bangalore";
      storeAkshaya.state = "Karnataka";
      storeAkshaya.pincode = "560001";
      storeAkshaya.plan = "Basic";
      storeAkshaya.status = "Active";
      await storeAkshaya.save();
    }

    // Ensure Store Admin User for Akshaya
    let adminAkshaya = await User.findOne({ username: "akshaya" });
    if (!adminAkshaya) {
      adminAkshaya = await User.create({
        name: "Akshaya Admin",
        username: "akshaya",
        email: "akshaya@gmail.com",
        password: "Akshaya@123",
        role: "STORE_ADMIN",
        supermarket: storeAkshaya._id,
        supermarketCode: storeAkshaya.code,
        supermarketName: storeAkshaya.name,
        phone: "+91 6789098765",
        status: "Active",
      });
      console.log("✓ Created Store Admin for Akshaya: akshaya / Akshaya@123");
    } else {
      adminAkshaya.name = "Akshaya Admin";
      adminAkshaya.supermarket = storeAkshaya._id;
      adminAkshaya.supermarketCode = storeAkshaya.code;
      adminAkshaya.supermarketName = storeAkshaya.name;
      adminAkshaya.status = "Active";
      await adminAkshaya.save();
    }

    // Ensure Akshaya Catalog Products ("Mens Wear" barcode 2002124937529 and "Power Provisions" barcode 010032289056)
    const akshayaProducts = [
      {
        name: "Mens Wear",
        category: "Mens Wear / Cinemaflex",
        brand: "Cinemaflex",
        barcode: "2002124937529",
        price: 9999.0,
        costPrice: 7500.0,
        stock: 5,
        lowStockThreshold: 10,
        imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80",
        description: "Premium casual and formal men's apparel collection.",
        supermarket: storeAkshaya._id,
        supermarketCode: storeAkshaya.code,
        isActive: true,
      },
      {
        name: "Power Provisions Soup Cp Chck Veg Bw Brth - CS of 6/ 1.25 OZ",
        category: "Power Food, Beverages & Tobacco > Food Items > Soups & Broths",
        brand: "Power Provisions",
        barcode: "010032289056",
        price: 506.0,
        costPrice: 420.0,
        stock: 10,
        lowStockThreshold: 5,
        imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&auto=format&fit=crop&q=80",
        description: "Chicken vegetable bone broth keto friendly instant soup cups.",
        supermarket: storeAkshaya._id,
        supermarketCode: storeAkshaya.code,
        isActive: true,
      },
    ];

    for (const prodItem of akshayaProducts) {
      const existing = await Product.findOne({
        $or: [
          { barcode: prodItem.barcode },
          { name: prodItem.name, supermarket: storeAkshaya._id },
        ],
      });

      if (!existing) {
        await Product.create(prodItem);
        console.log(`✓ Seeded product: ${prodItem.name} (${prodItem.barcode}) for Akshaya.`);
      } else {
        existing.barcode = prodItem.barcode;
        existing.price = prodItem.price;
        existing.stock = prodItem.stock;
        existing.supermarket = storeAkshaya._id;
        existing.supermarketCode = storeAkshaya.code;
        existing.isActive = true;
        await existing.save();
      }
    }

    // 8. STRICT MULTI-TENANT ISOLATION OF PRODUCTS, ORDERS AND NOTIFICATIONS
    // Strictly isolate Akshaya products, orders and cart activities
    await Product.updateMany(
      { barcode: { $in: ["2002124937529", "010032289056"] } },
      { $set: { supermarket: storeAkshaya._id, supermarketCode: storeAkshaya.code } }
    );

    await Order.updateMany(
      {
        $or: [
          { "items.barcode": { $in: ["2002124937529", "010032289056"] } },
          { supermarketCode: "SM-7087" },
        ],
      },
      {
        $set: {
          supermarket: storeAkshaya._id,
          supermarketCode: storeAkshaya.code,
          supermarketName: storeAkshaya.name,
        },
      }
    );

    await CartActivity.updateMany(
      {
        $or: [
          { productName: { $regex: /mens wear|power provisions|soup cup/i } },
          { supermarketCode: "SM-7087" },
        ],
      },
      {
        $set: {
          supermarket: storeAkshaya._id,
          supermarketCode: storeAkshaya.code,
        },
      }
    );

    // Assign any remaining unassigned records to Store A (Pooja / STR-001)
    await Product.updateMany(
      {
        $or: [{ supermarket: null }, { supermarket: { $exists: false } }],
        barcode: { $nin: ["2002124937529", "010032289056"] },
      },
      { $set: { supermarket: storeA._id, supermarketCode: storeA.code } }
    );

    await Order.updateMany(
      {
        $or: [{ supermarket: null }, { supermarket: { $exists: false } }],
        supermarketCode: { $ne: "SM-7087" },
      },
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
      {
        $or: [{ supermarket: null }, { supermarket: { $exists: false } }],
        supermarketCode: { $ne: "SM-7087" },
      },
      {
        $set: {
          supermarket: storeA._id,
          supermarketCode: storeA.code,
        },
      }
    );

    console.log("✓ Multi-Tenant SaaS platform seeding complete:");
    console.log("  - Super Admin: admin / Admin@123");
    console.log("  - Supermarket A (STR-001): pooja / pooja@123 (Pooja Admin)");
    console.log("  - Supermarket B (STR-002): storeb / StoreB@123 (Rohan Gupta)");
    console.log("  - Supermarket Akshaya (SM-7087): akshaya / Akshaya@123 (Akshaya Admin)");
  } catch (err) {
    console.error("Multi-tenant seeding error:", err);
  }
}

module.exports = { seedSaaSPlatformData };
