const router = require("express").Router();
const taskStatusController = require("../controllers/taskStatusController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { validateTaskStatus } = require("../validators/taskStatusValidator.js");
const uploadMiddleware = require("../middlewares/uploadMiddleware.js"); 

router.get("/", taskStatusController.getAllTaskStatuss);
router.get("/:id", taskStatusController.getTaskStatusById);


router.post(
  "/",
  authMiddleware,
  uploadMiddleware.none(),
  validateTaskStatus,
  taskStatusController.createTaskStatus
);

router.put(
  "/:id",
  authMiddleware,
  uploadMiddleware.none(),
  validateTaskStatus,
  taskStatusController.updateTaskStatus
);

router.delete("/:id", authMiddleware, taskStatusController.deleteTaskStatus);

module.exports = router;