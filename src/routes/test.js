const router = require("express").Router();
const testController = require("../controllers/testController");

router.post("/", testController.test);

module.exports = router;