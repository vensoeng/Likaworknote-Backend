const router = require("express").Router();
const telegramController = require("../controllers/telegramController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { validateTelegram } = require("../validators/telegramValidator.js");
const uploadMiddleware = require("../middlewares/uploadMiddleware.js"); 
const permission = require("../middlewares/permissionMiddleware");

router.get("/",
  authMiddleware, 
  permission("telegram.view"),
  telegramController.getAllTelegrams
);
router.get("/:id", 
  authMiddleware, 
  permission("telegram.view"),
  telegramController.getTelegramById
);


router.post(
  "/",
  authMiddleware,
  permission("telegram.create"),
  uploadMiddleware.none(),
  validateTelegram,
  telegramController.createTelegram
);

router.put(
  "/:id",
  authMiddleware,
  permission("telegram.update"),
  uploadMiddleware.none(),
  validateTelegram,
  telegramController.updateTelegram
);

router.delete("/:id", 
  authMiddleware,
  permission("telegram.delete"),
  telegramController.deleteTelegram
);

module.exports = router;