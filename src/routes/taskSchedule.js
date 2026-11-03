const router = require("express").Router();
const taskScheduleController = require("../controllers/taskScheduleController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateTaskSchedule } = require("../validators/taskScheduleValidator.js");
const uploadMiddleware = require("../middlewares/uploadMiddleware"); 

router.get("/", taskScheduleController.getAllTaskSchedules);
router.get("/:id", taskScheduleController.getTaskScheduleById);


router.post(
  "/",
  authMiddleware,
  uploadMiddleware.none(),
  validateTaskSchedule,
  taskScheduleController.createTaskSchedule
);

router.put(
  "/:id",
  authMiddleware,
  uploadMiddleware.none(),
  validateTaskSchedule,
  taskScheduleController.updateTaskSchedule
);

router.delete("/:id", authMiddleware, taskScheduleController.deleteTaskSchedule);

module.exports = router;