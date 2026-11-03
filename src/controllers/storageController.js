// const dotenv = require("dotenv");
// dotenv.config();
// const axios = require("axios");
// const path = require("path");

// const USERNAME = process.env.OWNER || "vensoeng";
// const REPO = process.env.REPO || "worknote";
// const BRANCH = process.env.BRANCH || "main";
// const UPLOADS_DIR = process.env.UPLOADS_DIR || "storage";

// exports.getImages = async (req, res) => {
//     try {
//         const filename = req.params.filename;
        
//         const ext = path.extname(filename).toLowerCase();

//         const githubApiUrl =
//             `https://api.github.com/repos/${USERNAME}/${REPO}/contents/${UPLOADS_DIR}/${filename}?ref=${BRANCH}`;


//         const isHtml = ext === '.html' || ext === '.htm';
        
//         const response = await axios.get(githubApiUrl, {
//             headers: {
//                 Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
//                 Accept: "application/vnd.github.v3.raw"
//             },
//             responseType: isHtml ? "text" : "arraybuffer"
//         });

//         if (isHtml) {
//             res.set("Content-Type", "text/html; charset=utf-8");
//         } else if (ext === '.png') {
//             res.set("Content-Type", "image/png");
//         } else if (ext === '.gif') {
//             res.set("Content-Type", "image/gif");
//         } else {
//             res.set("Content-Type", "image/jpeg");
//         }

//         res.send(response.data);

//     } catch (error) {
//         console.log(error.response?.data || error.message);
//         res.status(500).json({
//             success: false,
//             message: "File or Image not found"
//         });
//     }
// };


const dotenv = require("dotenv");
dotenv.config();

const axios = require("axios");
const path = require("path");

const USERNAME = process.env.OWNER || "vensoeng";
const REPO = process.env.REPO || "worknote";
const BRANCH = process.env.BRANCH || "main";
const UPLOADS_DIR = process.env.UPLOADS_DIR || "storage";

// Cache image in server memory
const imageCache = new Map();

// Cache for 10 minutes
// const CACHE_TTL = 10 * 60 * 1000;

const CACHE_TTL = 3600;

exports.getImages = async (req, res) => {
  try {
    const filename = req.params.filename;

    // =========================
    // 1. CHECK CACHE
    // =========================
    const cached = imageCache.get(filename);

    if (cached && cached.expiresAt > Date.now()) {
      console.log("IMAGE CACHE HIT:", filename);

      res.set("Content-Type", cached.contentType);

      // Browser cache
      res.set(
        "Cache-Control",
        "public, max-age=600"
      );

      return res.send(cached.data);
    }

    // Remove expired cache
    if (cached) {
      imageCache.delete(filename);
    }

    // =========================
    // 2. GET FILE EXTENSION
    // =========================
    const ext = path.extname(filename).toLowerCase();

    const githubApiUrl =
      `https://api.github.com/repos/${USERNAME}/${REPO}/contents/${UPLOADS_DIR}/${filename}?ref=${BRANCH}`;

    const isHtml = ext === ".html" || ext === ".htm";

    // =========================
    // 3. REQUEST GITHUB
    // =========================
    console.log("GITHUB REQUEST:", filename);

    const response = await axios.get(githubApiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw",
      },
      responseType: isHtml ? "text" : "arraybuffer",
    });

    // =========================
    // 4. CONTENT TYPE
    // =========================
    let contentType = "image/jpeg";

    if (isHtml) {
      contentType = "text/html; charset=utf-8";
    } else if (ext === ".png") {
      contentType = "image/png";
    } else if (ext === ".gif") {
      contentType = "image/gif";
    } else if (ext === ".webp") {
      contentType = "image/webp";
    } else if (ext === ".svg") {
      contentType = "image/svg+xml";
    }

    // =========================
    // 5. SAVE TO CACHE
    // =========================
    imageCache.set(filename, {
      data: response.data,
      contentType,
      expiresAt: Date.now() + CACHE_TTL,
    });

    // =========================
    // 6. RESPONSE
    // =========================
    res.set("Content-Type", contentType);

    // Tell browser to cache for 10 minutes
    res.set(
      "Cache-Control",
      "public, max-age=600"
    );

    return res.send(response.data);

  } catch (error) {
    console.log(
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "File or Image not found",
    });
  }
};