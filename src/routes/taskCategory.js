const router = require("express").Router();
const permission = require("../middlewares/permissionMiddleware");
const taskCategoryController = require("../controllers/taskCategoryController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateTaskCategory } = require("../validators/taskCategoryValidator.js");
const uploadMiddleware = require("../middlewares/uploadMiddleware"); 

router.get("/", 
  authMiddleware,
  permission("category.view"),
  taskCategoryController.getAllTaskCategorys
);
router.get("/:id",
  authMiddleware,
  permission("category.view"),
  taskCategoryController.getTaskCategoryById
);


router.post(
  "/",
  authMiddleware,
  permission("category.create"),        
  uploadMiddleware.none(),
  validateTaskCategory,
  taskCategoryController.createTaskCategory
);

router.put(
  "/:id",
  authMiddleware,
  permission("category.update"),
  uploadMiddleware.none(),
  validateTaskCategory,
  taskCategoryController.updateTaskCategory
);

router.delete("/:id", 
  authMiddleware,
  permission("category.delete"),
  taskCategoryController.deleteTaskCategory
);

module.exports = router;