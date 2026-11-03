const express = require("express");
const router = express.Router();

const RateLimit = require("../controllers/requestuCounController");

router.get("/", RateLimit.checkRateLimit);

module.exports = router;