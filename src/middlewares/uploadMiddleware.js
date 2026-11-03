const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/octet-stream"
];

const allowedExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;

const fileFilter = (req, file, cb) => {

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    console.log("========== UPLOAD FILE ==========");
    console.log("Original name:", file.originalname);
    console.log("MIME type:", file.mimetype);
    console.log("Extension:", extension);
    console.log("=================================");

    // Check extension
    if (!allowedExtensions.test(file.originalname)) {
        return cb(
            new Error(
                "Only JPG, JPEG, PNG, WEBP and GIF images are allowed."
            ),
            false
        );
    }

    // Allow normal image MIME types
    // Also allow application/octet-stream because Postman may send it
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
            new Error(
                `File MIME type is not allowed: ${file.mimetype}`
            ),
            false
        );
    }

    cb(null, true);
};

const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = uploadMiddleware;