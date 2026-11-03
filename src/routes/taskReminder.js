const router = require("express").Router();
const taskReminderController = require("../controllers/taskReminderController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { validateTaskReminder } = require("../validators/taskTaskReminderValidator.js");
const uploadMiddleware = require("../middlewares/uploadMiddleware.js"); 

router.get("/", taskReminderController.getAllTaskReminders);
router.get("/:id", taskReminderController.getTaskReminderById);


router.post(
  "/",
  authMiddleware,
  uploadMiddleware.none(),
  validateTaskReminder,
  taskReminderController.createTaskReminder
);

router.put(
  "/:id",
  authMiddleware,
  uploadMiddleware.none(),
  validateTaskReminder,
  taskReminderController.updateTaskReminder
);

router.delete("/:id", 
  authMiddleware,
  taskReminderController.deleteTaskReminder
);

module.exports = router;