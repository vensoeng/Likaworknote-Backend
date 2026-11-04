const path = require("path");
const Task = require("../models/Task");
const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");
const {getOrSetCache, clearCache} = require("../helper/cacheService");
const { getUserFilePaths } = require("../helper/userFileService");

// const TASK_FILE_PATH = process.env.TASK_FILE_PATH || "src/db/task.json";

// const TASKTYPE_FILE_PATH = process.env.TASKTYPE_FILE_PATH || "src/db/tasktype.json"
// const TASKCATEGORY_FILE_PATH = process.env.TASKCATEGORY_FILE_PATH || "src/db/taskcategory.json"
// const TELEGRAM_FILE_PATH = process.env.TELEGRAM_FILE_PATH || "src/db/telegram.json"
// const TASKSCHEDULE_FILE_PATH = process.env.TASKSCHEDULE_FILE_PATH || "src/db/taskschedule.json"
const TASKStATUS_FILE_PATH = process.env.TASKStATUS_FILE_PATH || "src/db/taskstatus.json"
// const TASK_REMINDER_FILE_PATH = process.env.TASK_REMINDER_FILE_PATH || "src/db/taskreminder.json"


const formatBackendDate = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }); 
};

// Helper Function 
const validateEntity = async (filePath,key, id, entityName, userId, checkOwner = true) => {
  if (!id) return null;
  // const list = await readJsonFile(filePath, []);
  const list = await getOrSetCache(key, () => readJsonFile(filePath, []));

  const item = list.find((record) => Number(record.id) === Number(id));
  if (!item) {
    return `${entityName} ដែលអ្នកជ្រើសរើសមិនមានក្នុងប្រព័ន្ធឡើយ`;
  }
  if (checkOwner && item.user_id && Number(item.user_id) !== Number(userId)) {
    return `អ្នកគ្មានសិទ្ធិប្រើប្រាស់ ${entityName} នេះឡើយ`;
  }
  return null;
};


//validate data
const validateTaskEntities = async (taskData, userId) => {
  const userFiles = getUserFilePaths(userId);

  const checks = [
    {
      path: userFiles.types,
      key: `taskTypes_${userId}`,
      id: taskData.type_id,
      name: "ប្រភេទភារកិច្ច",
      checkOwner: false,
    },
    {
      path: userFiles.categories,
      key: `categories_${userId}`,
      id: taskData.category_id,
      name: "ការបែងចែកការងារ",
      checkOwner: false,
    },
    // {
    //   path: userFiles.telegram,
    //   key: `telegram_${userId}`,
    //   id: taskData.telegram_id,
    //   name: "គណនី Telegram",
    //   checkOwner: false,
    // },
    {
      path: TASKStATUS_FILE_PATH,
      key: "statuss_data",
      id: taskData.statuses_id,
      name: "ស្ថានភាព",
      checkOwner: false,
    },
    // {
    //   path: TASK_REMINDER_FILE_PATH,
    //   key: "reminders_data",
    //   id: taskData.reminder_id,
    //   name: "ការរំលឹក",
    //   checkOwner: false,
    // },
  ];

  for (const check of checks) {
    const error = await validateEntity(
      check.path,
      check.key,
      check.id,
      check.name,
      userId,
      check.checkOwner
    );

    if (error) return error;
  }

  return null;
};


exports.createTask = async (req, res) => {
  try {
    const taskData = req.body || {};
    const currentUserId = req.user?.id;

    // Define Map 
    const validationError = await validateTaskEntities(
      taskData,
      currentUserId
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }


    // const taskList = await readJsonFile(TASK_FILE_PATH, []);
    // let taskList = await getOrSetCache("tasks_data", () => readJsonFile(TASK_FILE_PATH, []));
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userFiles = getUserFilePaths(currentUserId);
    const taskCacheKey = `tasks_${currentUserId}`;

    let taskList = await getOrSetCache(
      taskCacheKey,
      () => readJsonFile(userFiles.tasks, [])
    );

    const { 
      type_id,
      category_id,
      schedule,
      statuses_id,
      // reminder_id,
      // telegram_id,
      title, 
      des, 
      rate
    } = taskData;

    const newTask = new Task({
      id: Date.now(),
      status: true,
      user_id: req.user?.id || null,
      type_id: type_id,
      category_id: category_id,
      schedule: schedule,
      statuses_id: statuses_id,
      // reminder_id: reminder_id,
      // telegram_id: telegram_id, 
      title: title,
      des: des || '',
      rate: rate || 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    taskList.push(newTask);
    
    await writeJsonFile(
      userFiles.tasks,
      taskList,
      `Task created: ${title || "New Task"}`
    );


    clearCache(taskCacheKey);

    return res.status(201).json({ 
      success: true,
      message: "បង្កើត Task បានជោគជ័យ", 
      data: newTask 
    });

  } catch (err) {
    console.error("CREATE_TASK_TYPE_ERROR:", err);
    return res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const taskData = req.body || {};
    
    const currentUserId = req.user?.id;

    // const taskList = await readJsonFile(TASK_FILE_PATH, []);
    // let taskList = await getOrSetCache("tasks_data", () => readJsonFile(TASK_FILE_PATH, []));
    const userFiles = getUserFilePaths(currentUserId);
    const taskCacheKey = `tasks_${currentUserId}`;

    let taskList = await getOrSetCache(
      taskCacheKey,
      () => readJsonFile(userFiles.tasks, [])
    );

    const taskIndex = taskList.findIndex(s => String(s.id) === String(id));

    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ Task ដែលត្រូវកែប្រែឡើយ!" });
    }
    const oldTask = taskList[taskIndex];
    // =========================
    // CHECK DATA OWNERSHIP
    // =========================
    const isOwner = String(oldTask.user_id) === String(currentUserId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "អ្នកមិនមានសិទ្ធិកែប្រែ Task category នេះទេ!",
      });
    }

    // Define Map 
    const validationError = await validateTaskEntities(
      taskData,
      currentUserId
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }
    

    const updatedTask = {
      ...oldTask,      
      ...taskData,        
      updated_at: new Date()
    };

    taskList[taskIndex] = updatedTask;
    // await writeJsonFile(TASK_FILE_PATH, taskList, `Task Types: updated ${updatedTask.title || id}`);

    // clearCache('tasks_data')
    await writeJsonFile(
      userFiles.tasks,
      taskList,
      `Task updated: ${updatedTask.title || id}`
    );

    clearCache(taskCacheKey);

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព Task បានជោគជ័យ",
      data: updatedTask
    });

  } catch (err) {
    console.error("UPDATE_TASK_TYPE_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    // =========================
    // CHECK AUTHENTICATION
    // =========================

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // =========================
    // READ DATA
    // =========================

    // const taskList = await readJsonFile(TASK_FILE_PATH,[]);
    // let taskList = await getOrSetCache("tasks_data", () => readJsonFile(TASK_FILE_PATH, []));
    const userFiles = getUserFilePaths(currentUserId);
    const taskCacheKey = `tasks_${currentUserId}`;

    let taskList = await getOrSetCache(
      taskCacheKey,
      () => readJsonFile(userFiles.tasks, [])
    );

    // =========================
    // FIND TASK TYPE
    // =========================

    const taskToDelete = taskList.find(
      (item) => String(item.id) === String(id)
    );

    if (!taskToDelete) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task ដែលត្រូវលុបឡើយ!",
      });
    }

    // =========================
    // CHECK DATA OWNERSHIP
    // =========================

    const isOwner =
      String(taskToDelete.user_id) ===
      String(currentUserId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "អ្នកមិនមានសិទ្ធិលុប Task នេះទេ!",
      });
    }

    // =========================
    // REMOVE DATA
    // =========================

    const filteredTasks = taskList.filter(
      (item) => String(item.id) !== String(id)
    );

    // =========================
    // SAVE DATA
    // =========================

    // await writeJsonFile(
    //   TASK_FILE_PATH,
    //   filteredTasks,
    //   `Task Type: deleted task with ID ${id}`
    // );

    // clearCache('tasks_data');
    await writeJsonFile(
      userFiles.tasks,
      filteredTasks,
      `Task deleted: ${id}`
    );

    clearCache(taskCacheKey);

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "លុប Task បានជោគជ័យ",
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

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

exports.getAllTasks = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const currentUserRole = Number(req.user?.role);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // let tasks = await readJsonFile(TASK_FILE_PATH, []);
    // let tasks = await getOrSetCache("tasks_data", () => readJsonFile(TASK_FILE_PATH, []));
    const userFiles = getUserFilePaths(currentUserId);
    const taskCacheKey = `tasks_${currentUserId}`;

    let tasks = await getOrSetCache(
      taskCacheKey,
      () => readJsonFile(userFiles.tasks, [])
    );

    // // Super Admin
    // if (currentUserRole === 1) {
      
    // }
    // else {
    //  tasks  = tasks.filter(
    //     (item) =>
    //       String(item.user_id) === String(currentUserId)
    //   );
    // }

    const { search, page, limit, random, user_id } = req.query;

    if (user_id) {
      tasks = tasks.filter(s => String(s.user_id) === String(user_id));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(s => 
        (s.title && s.title.toLowerCase().includes(searchLower)) ||
        (s.title_kh && s.title_kh.toLowerCase().includes(searchLower)) ||
        (s.des && s.des.toLowerCase().includes(searchLower)) ||
        (s.description && s.description.toLowerCase().includes(searchLower))
      );
    }

    if (random === 'true') {
      tasks = shuffleArray(tasks);
    } else {
      tasks.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    const formattedTasks = tasks.map(s => ({
      ...s,
      created_at: s.created_at,
      updated_at: s.updated_at,
      created:  formatBackendDate(s.created_at)
    }));

    const totalItems = formattedTasks.length;

    if (page || limit) {
      const currentPage = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedData = formattedTasks.slice(startIndex, endIndex);

      return res.json({
        success: true,
        meta: {
          total_items: totalItems,
          current_page: currentPage,
          limit: pageSize,
          total_pages: Math.ceil(totalItems / pageSize)
        },
        data: paginatedData
      });
    }

    return res.json({
      success: true,
      total: totalItems,
      data: formattedTasks
    });

  } catch (err) {
    console.error("GET_ALL_TASK_TYPES_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    // const tasks = await readJsonFile(TASK_FILE_PATH, []);
    // let tasks = await getOrSetCache("tasks_data", () => readJsonFile(TASK_FILE_PATH, []));
    // const task = tasks.find((s) => String(s.id) === String(id) &&  String(s.user_id) === String(currentUserId));
    
    const userFiles = getUserFilePaths(currentUserId);
    const taskCacheKey = `tasks_${currentUserId}`;
    let tasks = await getOrSetCache(
      taskCacheKey,
      () => readJsonFile(userFiles.tasks, [])
    );

    const task = tasks.find(
      (s) => String(s.id) === String(id)
    );

    if (!task) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ task types នេះឡើយ" });
    }

    const formattedTask = {
      ...task,
      created_at: formatBackendDate(task.created_at),
      updated_at: formatBackendDate(task.updated_at)
    };

    return res.json({
      success: true,
      data: formattedTask
    });
    
  } catch (err) {
    console.error("GET_TASK_TYPE_BY_ID_ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
