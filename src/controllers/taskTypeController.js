// const path = require("path");
// const TaskType = require("../models/TaskType");
// const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");
// const {getOrSetCache, clearCache} = require("../helper/cacheService");
// const TASKTYPE_FILE_PATH = process.env.TASKTYPE_FILE_PATH || "src/db/tasktype.json";

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

// exports.createTaskType = async (req, res) => {
//   try {
//     const taskTypeData = req.body || {};
//     const { title, des } = taskTypeData;

//     // const taskTypeList = await readJsonFile(TASKTYPE_FILE_PATH, []);
//     let taskTypeList  = await getOrSetCache("taskTypes_data", () => readJsonFile(TASKTYPE_FILE_PATH,[]));

//     const newTaskType = new TaskType({
//       id: Date.now(),
//       user_id: req.user?.id || null,
//       title: title,
//       des: des,
//       created_at: new Date(),
//       updated_at: new Date()
//     });

//     taskTypeList.push(newTaskType);
    
//     await writeJsonFile(TASKTYPE_FILE_PATH, taskTypeList, `Task Types: created ${title || 'New Task Type demo'}`);

//     clearCache('taskTypes_data')

//     return res.status(201).json({ 
//       success: true,
//       message: "បង្កើត Task Types បានជោគជ័យ", 
//       data: newTaskType 
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

// exports.updateTaskType = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const taskTypeData = req.body || {};

//     // const taskTypeList = await readJsonFile(TASKTYPE_FILE_PATH, []);
//     let taskTypeList  = await getOrSetCache("taskTypes_data", () => readJsonFile(TASKTYPE_FILE_PATH,[]));
//     const taskTypeIndex = taskTypeList.findIndex(s => String(s.id) === String(id));

//     if (taskTypeIndex === -1) {
//       return res.status(404).json({ success: false, message: "រកមិនឃើញ Task Types ដែលត្រូវកែប្រែឡើយ!" });
//     }

//     const oldTaskType = taskTypeList[taskTypeIndex];

//     const updatedTaskType = {
//       ...oldTaskType,      
//       ...taskTypeData,        
//       updated_at: new Date()
//     };

//     taskTypeList[taskTypeIndex] = updatedTaskType;
//     await writeJsonFile(TASKTYPE_FILE_PATH, taskTypeList, `Task Types: updated ${updatedTaskType.title || id}`);

//     clearCache('taskTypes_data')

//     return res.status(200).json({
//       success: true,
//       message: "ធ្វើបច្ចុប្បន្នភាព Task Types បានជោគជ័យ",
//       data: updatedTaskType
//     });

//   } catch (err) {
//     console.error("UPDATE_TASK_TYPE_ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message
//     });
//   }
// };

// exports.deleteTaskType = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const currentUserId = req.user?.id;

//     // =========================
//     // CHECK AUTHENTICATION
//     // =========================

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     // =========================
//     // READ DATA
//     // =========================

//     // const taskTypeList = await readJsonFile(TASKTYPE_FILE_PATH,[]);
//     let taskTypeList  = await getOrSetCache("taskTypes_data", () => readJsonFile(TASKTYPE_FILE_PATH,[]));
//     // =========================
//     // FIND TASK TYPE
//     // =========================

//     const taskTypeToDelete = taskTypeList.find(
//       (item) => String(item.id) === String(id)
//     );

//     if (!taskTypeToDelete) {
//       return res.status(404).json({
//         success: false,
//         message: "រកមិនឃើញ Task Type ដែលត្រូវលុបឡើយ!",
//       });
//     }

//     // =========================
//     // CHECK DATA OWNERSHIP
//     // =========================

//     const isOwner =
//       String(taskTypeToDelete.user_id) ===
//       String(currentUserId);

//     if (!isOwner) {
//       return res.status(403).json({
//         success: false,
//         message: "អ្នកមិនមានសិទ្ធិលុប Task Type នេះទេ!",
//       });
//     }

//     // =========================
//     // REMOVE DATA
//     // =========================

//     const filteredTaskTypes = taskTypeList.filter(
//       (item) => String(item.id) !== String(id)
//     );

//     // =========================
//     // SAVE DATA
//     // =========================

//     await writeJsonFile(
//       TASKTYPE_FILE_PATH,
//       filteredTaskTypes,
//       `Task Type: deleted task type with ID ${id}`
//     );

//     clearCache('taskTypes_data')

//     // =========================
//     // RESPONSE
//     // =========================

//     return res.status(200).json({
//       success: true,
//       message: "លុប Task Type បានជោគជ័យ",
//     });

//   } catch (err) {
//     console.error("DELETE_TASK_TYPE_ERROR:", err);

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

// exports.getAllTaskTypes = async (req, res) => {
//   try {
//     const currentUserId = req.user?.id;
//     const currentUserRole = Number(req.user?.role);

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     // let taskTypes = await readJsonFile(TASKTYPE_FILE_PATH, []);
//     let taskTypes = await getOrSetCache("taskTypes_data", () => readJsonFile(TASKTYPE_FILE_PATH,[]));

//     // Super Admin
//     if (currentUserRole === 1) {
      
//     }
//     else {
//      taskTypes  = taskTypes.filter(
//         (item) =>
//           String(item.user_id) === String(currentUserId)
//       );
//     }

//     const { search, page, limit, random, user_id } = req.query;

//     if (user_id) {
//       taskTypes = taskTypes.filter(s => String(s.user_id) === String(user_id));
//     }

//     if (search) {
//       const searchLower = search.toLowerCase();
//       taskTypes = taskTypes.filter(s => 
//         (s.title && s.title.toLowerCase().includes(searchLower)) ||
//         (s.title_kh && s.title_kh.toLowerCase().includes(searchLower)) ||
//         (s.des && s.des.toLowerCase().includes(searchLower)) ||
//         (s.description && s.description.toLowerCase().includes(searchLower))
//       );
//     }

//     if (random === 'true') {
//       taskTypes = shuffleArray(taskTypes);
//     } else {
//       taskTypes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
//     }

//     const formattedTaskTypes = taskTypes.map(s => ({
//       ...s,
//       created_at: formatBackendDate(s.created_at),
//       updated_at: formatBackendDate(s.updated_at)
//     }));

//     const totalItems = formattedTaskTypes.length;

//     if (page || limit) {
//       const currentPage = parseInt(page) || 1;
//       const pageSize = parseInt(limit) || 10;
//       const startIndex = (currentPage - 1) * pageSize;
//       const endIndex = startIndex + pageSize;

//       const paginatedData = formattedTaskTypes.slice(startIndex, endIndex);

//       return res.json({
//         success: true,
//         meta: {
//           total_items: totalItems,
//           current_page: currentPage,
//           limit: pageSize,
//           total_pages: Math.ceil(totalItems / pageSize)
//         },
//         data: paginatedData
//       });
//     }

//     return res.json({
//       success: true,
//       total: totalItems,
//       data: formattedTaskTypes
//     });

//   } catch (err) {
//     console.error("GET_ALL_TASK_TYPES_ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message
//     });
//   }
// };

// exports.getTaskTypeById = async (req, res) => {
//   try {
//     const currentUserId = req.user?.id;

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const { id } = req.params;
//     // const taskTypes = await readJsonFile(TASKTYPE_FILE_PATH, []);
//     let taskTypes  = await getOrSetCache("taskTypes_data", () => readJsonFile(TASKTYPE_FILE_PATH,[]));
//     const taskType = taskTypes.find((s) => String(s.id) === String(id) &&  String(s.user_id) === String(currentUserId));

//     if (!taskType) {
//       return res.status(404).json({ success: false, message: "រកមិនឃើញ task types នេះឡើយ" });
//     }

//     const formattedTaskType = {
//       ...taskType,
//       created_at: formatBackendDate(taskType.created_at),
//       updated_at: formatBackendDate(taskType.updated_at)
//     };

//     return res.json({
//       success: true,
//       data: formattedTaskType
//     });
    
//   } catch (err) {
//     console.error("GET_TASK_TYPE_BY_ID_ERROR:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };




const TaskType = require("../models/TaskType");
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

// Get user's task type file and cache key
const getTaskTypeStorage = (userId) => {
  const userFiles = getUserFilePaths(userId);

  return {
    filePath: userFiles.types,
    cacheKey: `taskTypes_${userId}`,
  };
};

// Read current user's task types
const getUserTaskTypes = async (userId) => {
  const { filePath, cacheKey } = getTaskTypeStorage(userId);

  return await getOrSetCache(
    cacheKey,
    () => readJsonFile(filePath, [])
  );
};

// Save current user's task types
const saveUserTaskTypes = async (userId, taskTypes, message) => {
  const { filePath, cacheKey } = getTaskTypeStorage(userId);

  await writeJsonFile(filePath, taskTypes, message);
  clearCache(cacheKey);
};

// CREATE
exports.createTaskType = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { title, des } = req.body || {};

    const taskTypeList = await getUserTaskTypes(currentUserId);

    const newTaskType = new TaskType({
      id: Date.now(),
      user_id: currentUserId,
      title,
      des,
      created_at: new Date(),
      updated_at: new Date(),
    });

    taskTypeList.push(newTaskType);

    await saveUserTaskTypes(
      currentUserId,
      taskTypeList,
      `Task Type: created ${title || "New Task Type"}`
    );

    return res.status(201).json({
      success: true,
      message: "បង្កើត Task Types បានជោគជ័យ",
      data: newTaskType,
    });

  } catch (err) {
    console.error("CREATE_TASK_TYPE_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// UPDATE
exports.updateTaskType = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const taskTypeList = await getUserTaskTypes(currentUserId);

    const taskTypeIndex = taskTypeList.findIndex(
      (item) => String(item.id) === String(id)
    );

    if (taskTypeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task Types ដែលត្រូវកែប្រែឡើយ!",
      });
    }

    const oldTaskType = taskTypeList[taskTypeIndex];

    const updatedTaskType = {
      ...oldTaskType,
      ...req.body,

      // Prevent changing ID and ownership
      id: oldTaskType.id,
      user_id: currentUserId,

      updated_at: new Date().toISOString(),
    };

    taskTypeList[taskTypeIndex] = updatedTaskType;

    await saveUserTaskTypes(
      currentUserId,
      taskTypeList,
      `Task Types: updated ${updatedTaskType.title || id}`
    );

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព Task Types បានជោគជ័យ",
      data: updatedTaskType,
    });

  } catch (err) {
    console.error("UPDATE_TASK_TYPE_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// DELETE
exports.deleteTaskType = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const taskTypeList = await getUserTaskTypes(currentUserId);

    const taskTypeIndex = taskTypeList.findIndex(
      (item) => String(item.id) === String(id)
    );

    if (taskTypeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task Type ដែលត្រូវលុបឡើយ!",
      });
    }

    const filteredTaskTypes = taskTypeList.filter(
      (item) => String(item.id) !== String(id)
    );

    await saveUserTaskTypes(
      currentUserId,
      filteredTaskTypes,
      `Task Type: deleted task type with ID ${id}`
    );

    return res.status(200).json({
      success: true,
      message: "លុប Task Type បានជោគជ័យ",
    });

  } catch (err) {
    console.error("DELETE_TASK_TYPE_ERROR:", err);

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
exports.getAllTaskTypes = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Read only current user's task types
    let taskTypes = await getUserTaskTypes(currentUserId);

    const { search, page, limit, random } = req.query;

    if (search) {
      const searchLower = search.toLowerCase();

      taskTypes = taskTypes.filter((item) =>
        (item.title &&
          item.title.toLowerCase().includes(searchLower)) ||
        (item.title_kh &&
          item.title_kh.toLowerCase().includes(searchLower)) ||
        (item.des &&
          item.des.toLowerCase().includes(searchLower)) ||
        (item.description &&
          item.description.toLowerCase().includes(searchLower))
      );
    }

    if (random === "true") {
      taskTypes = shuffleArray(taskTypes);
    } else {
      taskTypes.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
    }

    const formattedTaskTypes = taskTypes.map((item) => ({
      ...item,
      created_at: formatBackendDate(item.created_at),
      updated_at: formatBackendDate(item.updated_at),
    }));

    const totalItems = formattedTaskTypes.length;

    if (page || limit) {
      const currentPage = Math.max(parseInt(page) || 1, 1);
      const pageSize = Math.max(parseInt(limit) || 10, 1);

      const startIndex = (currentPage - 1) * pageSize;

      const paginatedData = formattedTaskTypes.slice(
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
      data: formattedTaskTypes,
    });

  } catch (err) {
    console.error("GET_ALL_TASK_TYPES_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// GET BY ID
exports.getTaskTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const taskTypes = await getUserTaskTypes(currentUserId);

    const taskType = taskTypes.find(
      (item) => String(item.id) === String(id)
    );

    if (!taskType) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ task types នេះឡើយ",
      });
    }

    const formattedTaskType = {
      ...taskType,
      created_at: formatBackendDate(taskType.created_at),
      updated_at: formatBackendDate(taskType.updated_at),
    };

    return res.json({
      success: true,
      data: formattedTaskType,
    });

  } catch (err) {
    console.error("GET_TASK_TYPE_BY_ID_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
