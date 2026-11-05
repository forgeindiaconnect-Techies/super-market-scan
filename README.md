# Smart Supermarket – Scan • Shop • Pay

A modern, full-stack Smart Supermarket self-checkout solution consisting of:
1. **Backend Server (`backend/`):** Express.js & MongoDB REST API providing product inventory, automatic barcode management, cart calculations, orders, and exit verification.
2. **Super Admin Dashboard (`frontend/`):** React & Vite web application featuring live inventory management, automatic Code-128 / EAN barcode generator, stock alerts, and customer transaction logs.
3. **Customer Mobile Application (`mobile-app/`):** Expo React Native mobile app featuring live barcode scanning, real-time product identification, interactive shopping cart, secure payments (UPI QR, Card, Cash at Exit), digital receipt generation, and order history with turnstile exit barcodes.

---

## 🛠 Tech Stack

- **Mobile App:** Expo React Native (Expo Router, TypeScript, Expo Camera, Lucide/Vector Icons)
- **Super Admin Frontend:** React, Vite, Tailwind CSS, JsBarcode
- **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose)
- **Architecture:** Monorepo (`backend`, `frontend`, `mobile-app`)

---

## 🚀 Getting Started

### 1. Backend Server Setup
```bash
cd backend
npm install
# Configure your MongoDB URI in .env (see .env.example)
npm start
# Runs on http://localhost:5001
```

### 2. Super Admin Web Dashboard
```bash
cd frontend
npm install
npm run dev
# Accessible at http://localhost:5173
```

### 3. Customer Mobile Application
```bash
cd mobile-app
npm install
# Set EXPO_PUBLIC_API_URL in .env (e.g., http://<YOUR_LAN_IP>:5001/api)
npx expo start -c
```
Scan the QR code with **Expo Go** on iOS or Android.

---

## 📱 Customer 8-Step Shopping Workflow

1. **Home / Welcome:** Brand intro & "Get Started" call to action.
2. **Barcode Scanner:** Real-time camera viewfinder with animated laser line and corner alignment brackets.
3. **Product Details:** Live database lookup showing image, brand, category, price, discount tags, stock indicator, and stepper.
4. **My Cart:** Dynamic item rows with steppers, subtotal, discounts, total bill, and 5-tab bottom navigation.
5. **Checkout:** Order item overview, price breakdown, and payment method selection.
6. **Secure Payment:** Dynamic UPI QR Code, 5-minute countdown timer, and 256-bit security badge.
7. **Payment Successful:** Festive confetti, green checkmark, digital receipt, and friendly shopping mascot.
8. **My Orders:** All/Pending/Completed filters, item thumbnail rows, and gate exit pass barcode modal.

---

## 📄 License
ISC
