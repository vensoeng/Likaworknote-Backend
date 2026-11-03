// const path = require("path");
// const TaskCategory = require("../models/TaskCategory");
// const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");

// const TASKCATEGORY_FILE_PATH = process.env.TASKCATEGORY_FILE_PATH || "src/db/taskCategory.json";

// const { getOrSetCache, clearCache } = require("../helper/cacheService");

// const formatBackendDate = (dateInput) => {
//   if (!dateInput) return '-';
//   const d = new Date(dateInput);
//   if (isNaN(d.getTime())) return '-';
//   return d.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric'
//   }); 
// };

// exports.createTaskCategory = async (req, res) => {
//   try {
//     const taskCategoryData = req.body || {};
//     const { title, des } = taskCategoryData;

//     // const taskCategoryList = await readJsonFile(TASKCATEGORY_FILE_PATH, []);
//     let taskCategoryList = await getOrSetCache("categorys_data", () => readJsonFile(TASKCATEGORY_FILE_PATH, []));


//     const newTaskCategory = new TaskCategory({
//       id: Date.now(),
//       user_id: req.user?.id || null,
//       title: title,
//       des: des,
//       created_at: new Date(),
//       updated_at: new Date()
//     });

//     taskCategoryList.push(newTaskCategory);
    
//     await writeJsonFile(TASKCATEGORY_FILE_PATH, taskCategoryList, `Task category: created ${title || 'New Task Type demo'}`);

//     clearCache("categorys_data");

//     return res.status(201).json({ 
//       success: true,
//       message: "បង្កើត Task category បានជោគជ័យ", 
//       data: newTaskCategory 
//     });

//   } catch (err) {
//     console.error("CREATE_TASK_TYPE_ERROR:", err);
//     return res.status(500).json({ 
//       success: false,
//       message: "Server error", 
//       error: err.message 
//     });
//   }
// };

// exports.updateTaskCategory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const taskCategoryData = req.body || {};

//     const currentUserId = req.user?.id;

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     // const taskCategoryList = await readJsonFile(TASKCATEGORY_FILE_PATH,[]);
//     let taskCategoryList = await getOrSetCache("categorys_data", () => readJsonFile(TASKCATEGORY_FILE_PATH, []));

//     const taskCategoryIndex = taskCategoryList.findIndex(
//       (item) => String(item.id) === String(id)
//     );

//     if (taskCategoryIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "រកមិនឃើញ Task category ដែលត្រូវកែប្រែឡើយ!",
//       });
//     }

//     const oldTaskCategory = taskCategoryList[taskCategoryIndex];

//     // =========================
//     // CHECK DATA OWNERSHIP
//     // =========================

//     const isOwner =
//       String(oldTaskCategory.user_id) ===
//       String(currentUserId);


//     if (!isOwner) {
//       return res.status(403).json({
//         success: false,
//         message: "អ្នកមិនមានសិទ្ធិកែប្រែ Task category នេះទេ!",
//       });
//     }

//     // =========================
//     // UPDATE
//     // =========================

//     const updatedTaskCategory = {
//       ...oldTaskCategory,
//       ...taskCategoryData,

//       user_id: oldTaskCategory.user_id,

//       updated_at: new Date().toISOString(),
//     };

//     taskCategoryList[taskCategoryIndex] =
//       updatedTaskCategory;

//     await writeJsonFile(
//       TASKCATEGORY_FILE_PATH,
//       taskCategoryList,
//       `Task category: updated ${updatedTaskCategory.title || id}`
//     );

//     clearCache("categorys_data");

//     return res.status(200).json({
//       success: true,
//       message: "ធ្វើបច្ចុប្បន្នភាព Task category បានជោគជ័យ",
//       data: updatedTaskCategory,
//     });

//   } catch (err) {
//     console.error("UPDATE_TASK_CATEGORY_ERROR:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };

// exports.deleteTaskCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const currentUserId = req.user?.id;

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     // const taskCategoryList = await readJsonFile(TASKCATEGORY_FILE_PATH,[]);
//     let taskCategoryList = await getOrSetCache("categorys_data", () => readJsonFile(TASKCATEGORY_FILE_PATH, []));

//     const taskCategoryIndex =
//       taskCategoryList.findIndex(
//         (item) => String(item.id) === String(id)
//       );

//     if (taskCategoryIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "រកមិនឃើញ Task category ដែលត្រូវលុបឡើយ!",
//       });
//     }

//     const taskCategoryToDelete =
//       taskCategoryList[taskCategoryIndex];

//     // =========================
//     // CHECK DATA OWNERSHIP
//     // =========================

//     const isOwner =
//       String(taskCategoryToDelete.user_id) ===
//       String(currentUserId);

//     if (!isOwner) {
//       return res.status(403).json({
//         success: false,
//         message: "អ្នកមិនមានសិទ្ធិលុប Task category នេះទេ!",
//       });
//     }

//     // =========================
//     // DELETE
//     // =========================

//     const filteredTaskCategorys =
//       taskCategoryList.filter(
//         (item) => String(item.id) !== String(id)
//       );

//     await writeJsonFile(
//       TASKCATEGORY_FILE_PATH,
//       filteredTaskCategorys,
//       `Task category: deleted task category with ID ${id}`
//     );

//     clearCache("categorys_data");

//     return res.status(200).json({
//       success: true,
//       message: "លុប Task category បានជោគជ័យ",
//     });

//   } catch (err) {
//     console.error("DELETE_TASK_CATEGORY_ERROR:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };

// const shuffleArray = (array) => {
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]];
//   }
//   return array;
// };

// exports.getAllTaskCategorys = async (req, res) => {
//   try {

//     const currentUserId = req.user?.id;
//     const currentUserRole = Number(req.user?.role);

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     // let taskCategorys = await readJsonFile( TASKCATEGORY_FILE_PATH,[]);
//     let taskCategorys = await getOrSetCache("categorys_data", () => readJsonFile(TASKCATEGORY_FILE_PATH, []));

//     // Super Admin
//     if (currentUserRole === 1) {
      
//     }
//     else {
//       taskCategorys = taskCategorys.filter(
//         (item) =>
//           String(item.user_id) === String(currentUserId)
//       );
//     }

//     const { search, page, limit, random } = req.query;

//     if (search) {
//       const searchLower = search.toLowerCase();

//       taskCategorys = taskCategorys.filter((item) =>
//         (item.title &&
//           item.title.toLowerCase().includes(searchLower)) ||

//         (item.des &&
//           item.des.toLowerCase().includes(searchLower)) 
//       );
//     }

//     if (random === "true") {
//       taskCategorys = shuffleArray(taskCategorys);
//     } else {
//       taskCategorys.sort(
//         (a, b) =>
//           new Date(b.created_at || 0) -
//           new Date(a.created_at || 0)
//       );
//     }

//     const formattedTaskCategorys = taskCategorys.map(
//       (item) => ({
//         ...item,
//         created_at: formatBackendDate(item.created_at),
//         updated_at: formatBackendDate(item.updated_at),
//       })
//     );

//     const totalItems = formattedTaskCategorys.length;

//     if (page || limit) {
//       const currentPage = parseInt(page) || 1;
//       const pageSize = parseInt(limit) || 10;

//       const startIndex =
//         (currentPage - 1) * pageSize;

//       const endIndex =
//         startIndex + pageSize;

//       const paginatedData =
//         formattedTaskCategorys.slice(
//           startIndex,
//           endIndex
//         );

//       return res.json({
//         success: true,
//         meta: {
//           total_items: totalItems,
//           current_page: currentPage,
//           limit: pageSize,
//           total_pages: Math.ceil(
//             totalItems / pageSize
//           ),
//         },
//         data: paginatedData,
//       });
//     }

//     return res.json({
//       success: true,
//       total: totalItems,
//       data: formattedTaskCategorys,
//     });

//   } catch (err) {
//     console.error(
//       "GET_ALL_TASK_CATEGORY_ERROR:",
//       err
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };

// exports.getTaskCategoryById = async (req, res) => {
//   try {
//     const currentUserId = req.user?.id;

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const { id } = req.params;
//     // const taskCategorys = await readJsonFile(TASKCATEGORY_FILE_PATH, []);
//     let taskCategorys = await getOrSetCache("categorys_data", () => readJsonFile(TASKCATEGORY_FILE_PATH, []));

//     const taskCategory = taskCategorys.find((s) => String(s.id) === String(id) &&  String(s.user_id) === String(currentUserId));

//     if (!taskCategory) {
//       return res.status(404).json({ success: false, message: "រកមិនឃើញ task category នេះឡើយ" });
//     }

//     const formattedTaskCategory = {
//       ...taskCategory,
//       created_at: formatBackendDate(taskCategory.created_at),
//       updated_at: formatBackendDate(taskCategory.updated_at)
//     };

//     return res.json({
//       success: true,
//       data: formattedTaskCategory
//     });
    
//   } catch (err) {
//     console.error("GET_TASK_TYPE_BY_ID_ERROR:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };



const TaskCategory = require("../models/TaskCategory");
const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");
const { getOrSetCache, clearCache } = require("../helper/cacheService");
const { getUserFilePaths } = require("../helper/userFileService");

const formatBackendDate = (dateInput) => {
  if (!dateInput) return "-";

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Get user's category file and cache key
const getCategoryStorage = (userId) => {
  const userFiles = getUserFilePaths(userId);

  return {
    filePath: userFiles.categories,
    cacheKey: `categories_${userId}`,
  };
};

// Read category data for current user
const getUserCategories = async (userId) => {
  const { filePath, cacheKey } = getCategoryStorage(userId);

  const categories = await getOrSetCache(
    cacheKey,
    () => readJsonFile(filePath, [])
  );

  return categories;
};

// Save category data for current user
const saveUserCategories = async (userId, categories, message) => {
  const { filePath, cacheKey } = getCategoryStorage(userId);

  await writeJsonFile(filePath, categories, message);
  clearCache(cacheKey);
};

// CREATE
exports.createTaskCategory = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { title, des } = req.body || {};

    const taskCategoryList = await getUserCategories(currentUserId);

    const newTaskCategory = new TaskCategory({
      id: Date.now(),
      user_id: currentUserId,
      title,
      des,
      created_at: new Date(),
      updated_at: new Date(),
    });

    taskCategoryList.push(newTaskCategory);

    await saveUserCategories(
      currentUserId,
      taskCategoryList,
      `Task category: created ${title || "New Task Category"}`
    );

    return res.status(201).json({
      success: true,
      message: "បង្កើត Task category បានជោគជ័យ",
      data: newTaskCategory,
    });

  } catch (err) {
    console.error("CREATE_TASK_CATEGORY_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// UPDATE
exports.updateTaskCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const taskCategoryList = await getUserCategories(currentUserId);

    const taskCategoryIndex = taskCategoryList.findIndex(
      (item) => String(item.id) === String(id)
    );

    if (taskCategoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task category ដែលត្រូវកែប្រែឡើយ!",
      });
    }

    const oldTaskCategory = taskCategoryList[taskCategoryIndex];

    const updatedTaskCategory = {
      ...oldTaskCategory,
      ...req.body,

      // Prevent changing ownership
      id: oldTaskCategory.id,
      user_id: currentUserId,

      updated_at: new Date().toISOString(),
    };

    taskCategoryList[taskCategoryIndex] = updatedTaskCategory;

    await saveUserCategories(
      currentUserId,
      taskCategoryList,
      `Task category: updated ${updatedTaskCategory.title || id}`
    );

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព Task category បានជោគជ័យ",
      data: updatedTaskCategory,
    });

  } catch (err) {
    console.error("UPDATE_TASK_CATEGORY_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// DELETE
exports.deleteTaskCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const taskCategoryList = await getUserCategories(currentUserId);

    const taskCategoryIndex = taskCategoryList.findIndex(
      (item) => String(item.id) === String(id)
    );

    if (taskCategoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task category ដែលត្រូវលុបឡើយ!",
      });
    }

    const filteredTaskCategories = taskCategoryList.filter(
      (item) => String(item.id) !== String(id)
    );

    await saveUserCategories(
      currentUserId,
      filteredTaskCategories,
      `Task category: deleted ${id}`
    );

    return res.status(200).json({
      success: true,
      message: "លុប Task category បានជោគជ័យ",
    });

  } catch (err) {
    console.error("DELETE_TASK_CATEGORY_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Shuffle
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

// GET ALL
exports.getAllTaskCategorys = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Read only current user's categories
    let taskCategorys = await getUserCategories(currentUserId);

    const { search, page, limit, random } = req.query;

    if (search) {
      const searchLower = search.toLowerCase();

      taskCategorys = taskCategorys.filter((item) =>
        (item.title &&
          item.title.toLowerCase().includes(searchLower)) ||
        (item.des &&
          item.des.toLowerCase().includes(searchLower))
      );
    }

    if (random === "true") {
      taskCategorys = shuffleArray(taskCategorys);
    } else {
      taskCategorys.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
    }

    const formattedTaskCategorys = taskCategorys.map((item) => ({
      ...item,
      created_at: formatBackendDate(item.created_at),
      updated_at: formatBackendDate(item.updated_at),
    }));

    const totalItems = formattedTaskCategorys.length;

    if (page || limit) {
      const currentPage = Math.max(parseInt(page) || 1, 1);
      const pageSize = Math.max(parseInt(limit) || 10, 1);

      const startIndex = (currentPage - 1) * pageSize;
      const paginatedData = formattedTaskCategorys.slice(
        startIndex,
        startIndex + pageSize
      );

      return res.json({
        success: true,
        meta: {
          total_items: totalItems,
          current_page: currentPage,
          limit: pageSize,
          total_pages: Math.ceil(totalItems / pageSize),
        },
        data: paginatedData,
      });
    }

    return res.json({
      success: true,
      total: totalItems,
      data: formattedTaskCategorys,
    });

  } catch (err) {
    console.error("GET_ALL_TASK_CATEGORY_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// GET BY ID
exports.getTaskCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Only read current user's category file
    const taskCategorys = await getUserCategories(currentUserId);

    const taskCategory = taskCategorys.find(
      (item) => String(item.id) === String(id)
    );

    if (!taskCategory) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ task category នេះឡើយ",
      });
    }

    const formattedTaskCategory = {
      ...taskCategory,
      created_at: formatBackendDate(taskCategory.created_at),
      updated_at: formatBackendDate(taskCategory.updated_at),
    };

    return res.json({
      success: true,
      data: formattedTaskCategory,
    });

  } catch (err) {
    console.error("GET_TASK_CATEGORY_BY_ID_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


