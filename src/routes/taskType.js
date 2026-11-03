const router = require("express").Router();
const taskTypeController = require("../controllers/taskTypeController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateTaskType } = require("../validators/taskTypeValidator");

const permission = require("../middlewares/permissionMiddleware");

const uploadMiddleware = require("../middlewares/uploadMiddleware"); 



router.get("/", 
  authMiddleware,
  permission("taskTypes.view"),
  taskTypeController.getAllTaskTypes
);
router.get("/:id", 
  authMiddleware,
  permission("taskTypes.view"),
  taskTypeController.getTaskTypeById
);


router.post(
  "/",
  authMiddleware,
  permission("taskTypes.create"),
  uploadMiddleware.none(),
  validateTaskType,
  taskTypeController.createTaskType
);

router.put(
  "/:id",
  authMiddleware,
  permission("taskTypes.update"),
  uploadMiddleware.none(),
  validateTaskType,
  taskTypeController.updateTaskType
);

router.delete(
  "/:id",
  authMiddleware,
  permission("taskTypes.delete"),
  taskTypeController.deleteTaskType
);

module.exports = router;