const os = require('os');
const fs = require('fs');
const path = require('path');

// 1. Detect current active Wi-Fi / Ethernet IPv4 address
const ifaces = os.networkInterfaces();
let localIp = '127.0.0.1';

for (const name of Object.keys(ifaces)) {
  for (const net of ifaces[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      // Prioritize Wi-Fi or standard 192.168.x / 10.x LAN adapters
      if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
        localIp = net.address;
        break;
      }
      localIp = net.address;
    }
  }
  if (localIp !== '127.0.0.1' && localIp.startsWith('192.168.')) break;
}

console.log(`📡 Detected Laptop Active IP: ${localIp}`);

// 2. Update mobile-app\.env
const envPath = 'd:\\PROJECTS\\Super market\\mobile-app\\.env';
const envContent = `EXPO_PUBLIC_API_URL=http://${localIp}:5001/api\n`;
fs.writeFileSync(envPath, envContent, 'utf8');
console.log(`✅ Updated mobile-app/.env with: ${envContent.trim()}`);

// 3. Update mobile-app\src\constants\api.ts fallback
const apiTsPath = 'd:\\PROJECTS\\Super market\\mobile-app\\src\\constants\\api.ts';
let apiContent = fs.readFileSync(apiTsPath, 'utf8');
apiContent = apiContent.replace(
  /const DEFAULT_SERVER_URL = "http:\/\/[^:]+:5001\/api";/,
  `const DEFAULT_SERVER_URL = "http://${localIp}:5001/api";`
);
fs.writeFileSync(apiTsPath, apiContent, 'utf8');
console.log(`✅ Updated mobile-app/src/constants/api.ts with IP: ${localIp}`);

// 4. Check if backend port 5001 is active
const http = require('http');
const req = http.get(`http://127.0.0.1:5001/api/products`, (res) => {
  console.log(`🟢 Backend Server is ACTIVE on port 5001 (Status: ${res.statusCode})`);
}).on('error', () => {
  console.log(`⚠️  Backend Server is NOT running on port 5001! Please run: cd backend; npm start`);
});
