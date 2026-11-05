const router = require("express").Router();

const taskStatusController = require("../controllers/taskStatusController.js");

const authMiddleware = require("../middlewares/authMiddleware.js");
const adminMiddleware = require("../middlewares/adminMiddleware.js");

const {
  validateTaskStatus
} = require("../validators/taskStatusValidator.js");

const uploadMiddleware = require("../middlewares/uploadMiddleware.js");

router.get("/", authMiddleware, taskStatusController.getAllTaskStatuss);
router.get("/:id", authMiddleware, taskStatusController.getTaskStatusById);

// WRITE: Admin only
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware.none(),
  validateTaskStatus,
  taskStatusController.createTaskStatus
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware.none(),
  validateTaskStatus,
  taskStatusController.updateTaskStatus
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  taskStatusController.deleteTaskStatus
);

module.exports = router;