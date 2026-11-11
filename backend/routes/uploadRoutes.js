const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { cloudinary, checkCloudinaryConnection } = require("../config/cloudinary");

const router = express.Router();

// In-memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Helper for direct REST upload if Cloudinary SDK is not installed
async function directRestUpload(bufferOrData, folder = "smart_supermarket") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new FormData();
  if (Buffer.isBuffer(bufferOrData)) {
    const blob = new Blob([bufferOrData]);
    formData.append("file", blob);
  } else {
    formData.append("file", bufferOrData);
  }
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("folder", folder);
  formData.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to upload to Cloudinary");
  }
  return data;
}

// Helper to resolve and fetch image buffer from any web link (Google, Bing, direct, etc.)
async function resolveAndFetchImageBuffer(rawUrl) {
  let targetUrl = rawUrl.trim();

  // 1. Check if it's a search URL with mediaurl / imgurl parameters
  try {
    const parsed = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
    if (parsed.searchParams.has("mediaurl")) {
      targetUrl = decodeURIComponent(parsed.searchParams.get("mediaurl"));
    } else if (parsed.searchParams.has("imgurl")) {
      targetUrl = decodeURIComponent(parsed.searchParams.get("imgurl"));
    }
  } catch (_) {}

  // 2. Fetch with standard browser headers to bypass CORS and anti-hotlink blocks
  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });

  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  // 3. If direct image, return buffer immediately
  if (contentType.startsWith("image/")) {
    const arrayBuf = await response.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  // 4. If HTML (e.g. Bing or Google image result page), extract real image URL
  if (contentType.includes("html")) {
    const html = await response.text();

    // Check Bing murl pattern: murl&quot;:&quot;https:...
    const murlMatch = html.match(/murl(?:&quot;|"):&quot;?(https?:[^&"\s>]+)/i);
    if (murlMatch && murlMatch[1]) {
      const realImgUrl = decodeURIComponent(murlMatch[1].replace(/&amp;/g, "&"));
      const imgRes = await fetch(realImgUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        return Buffer.from(buf);
      }
    }

    // Check OpenGraph og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
      const ogUrl = ogMatch[1].startsWith("http") ? ogMatch[1] : new URL(ogMatch[1], targetUrl).href;
      const imgRes = await fetch(ogUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        return Buffer.from(buf);
      }
    }
  }

  // Default fallback: return arrayBuffer
  const fallbackBuf = await response.arrayBuffer();
  return Buffer.from(fallbackBuf);
}

/**
 * @route   GET /api/upload/status
 * @desc    Test Cloudinary connection status
 */
router.get("/status", async (req, res) => {
  const status = await checkCloudinaryConnection();
  return res.json({
    success: status.connected,
    ...status,
  });
});

/**
 * @route   POST /api/upload
 * @desc    Upload product or banner image to Cloudinary
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary credentials not configured in backend .env",
      });
    }

    const folder = req.body.folder || "smart_supermarket/products";

    // 1. Check if multipart file is uploaded
    if (req.file) {
      if (cloudinary) {
        // Upload buffer via Cloudinary SDK stream
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: "auto",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        return res.status(200).json({
          success: true,
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
        });
      } else {
        // Direct REST upload fallback
        const result = await directRestUpload(req.file.buffer, folder);
        return res.status(200).json({
          success: true,
          imageUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    }

    // 2. Check if base64 or URL is provided in JSON body
    const imagePayload = req.body.image || req.body.imageUrl || req.body.dataUrl;
    if (imagePayload) {
      let uploadTarget = imagePayload;

      // If it's a web URL, resolve and fetch buffer server-side to bypass CORS & anti-hotlinking
      if (typeof imagePayload === "string" && (imagePayload.startsWith("http://") || imagePayload.startsWith("https://"))) {
        try {
          uploadTarget = await resolveAndFetchImageBuffer(imagePayload);
        } catch (fetchErr) {
          console.warn("Could not fetch remote URL buffer, falling back to direct upload:", fetchErr.message);
          uploadTarget = imagePayload;
        }
      }

      if (cloudinary) {
        let result;
        if (Buffer.isBuffer(uploadTarget)) {
          result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder, resource_type: "auto" },
              (error, res) => (error ? reject(error) : resolve(res))
            );
            stream.end(uploadTarget);
          });
        } else {
          result = await cloudinary.uploader.upload(uploadTarget, {
            folder,
            resource_type: "auto",
          });
        }

        return res.status(200).json({
          success: true,
          imageUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      } else {
        const result = await directRestUpload(uploadTarget, folder);
        return res.status(200).json({
          success: true,
          imageUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: "Please provide an image file (multipart/form-data) or a base64 image string (JSON)",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Image upload failed",
    });
  }
});

module.exports = router;

