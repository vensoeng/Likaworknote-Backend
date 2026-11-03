const express = require("express");
const router = express.Router();

const getImages = require("../controllers/storageController");

router.get("/:filename", getImages.getImages);

module.exports = router;