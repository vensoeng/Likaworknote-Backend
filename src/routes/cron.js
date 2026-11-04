const express = require("express");
const router = express.Router();

const verifyCronSecret = require("../middlewares/verifyCronSecret");

const {
    sendMorning,
    sendEvening
} = require("../controllers/cronController");

router.post("/morning", verifyCronSecret, sendMorning);
router.post("/evening", verifyCronSecret, sendEvening);

module.exports = router;