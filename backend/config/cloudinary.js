const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

let cloudinary = null;

try {
  cloudinary = require("cloudinary").v2;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }
} catch (e) {
  cloudinary = null;
}

/**
 * Verify connectivity and credentials with Cloudinary
 */
async function checkCloudinaryConnection() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("⚠️  [Cloudinary] Missing configuration in .env");
    return {
      connected: false,
      message: "Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET",
    };
  }

  // 1. Try SDK ping if installed
  if (cloudinary) {
    try {
      const res = await cloudinary.api.ping();
      if (res && res.status === "ok") {
        console.log(`✓ Cloudinary connected successfully (cloud_name: ${cloudName})`);
        return { connected: true, cloudName, method: "sdk" };
      }
    } catch (err) {
      console.error(`⚠️  [Cloudinary SDK] Ping failed: ${err.message}`);
    }
  }

  // 2. Direct HTTP ping fallback (works even before `npm install cloudinary` finishes)
  try {
    const authHeader = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const pingUrl = `https://api.cloudinary.com/v1_1/${cloudName}/ping`;
    const res = await fetch(pingUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (res.ok) {
      console.log(`✓ Cloudinary connected successfully via API (cloud_name: ${cloudName})`);
      return { connected: true, cloudName, method: "http" };
    } else {
      const text = await res.text();
      console.warn(`⚠️  [Cloudinary] HTTP check status ${res.status}: ${text}`);
      return { connected: false, message: text, status: res.status };
    }
  } catch (httpErr) {
    console.error(`⚠️  [Cloudinary] Ping error: ${httpErr.message}`);
    return { connected: false, message: httpErr.message };
  }
}

module.exports = {
  cloudinary,
  checkCloudinaryConnection,
};

