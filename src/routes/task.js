const router = require("express").Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateCreateTask, validateUpdateTask } = require("../validators/taskValidator.js");

const permission = require("../middlewares/permissionMiddleware");

const uploadMiddleware = require("../middlewares/uploadMiddleware"); 

router.get(
  "/",
  authMiddleware,
  permission("tasks.view"),
  taskController.getAllTasks
);

router.get(
  "/:id",
  authMiddleware, 
  permission("tasks.view"), 
  taskController.getTaskById
);

router.post("/", 
  authMiddleware, 
  permission("tasks.create"),
  uploadMiddleware.none(),
  validateCreateTask, 
  taskController.createTask
);

router.put("/:id", 
  authMiddleware, 
  permission("tasks.update"), 
  uploadMiddleware.none(), 
  validateUpdateTask, 
  taskController.updateTask
);

router.delete("/:id",
  authMiddleware,
  permission("tasks.delete"),
  taskController.deleteTask
);


module.exports = router;