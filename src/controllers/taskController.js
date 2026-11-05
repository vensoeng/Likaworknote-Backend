
const Task = require("../models/Task");
const {
  readJsonFile,
  writeJsonFile,
} = require("../utils/githubJsonStore");

const {
  getOrSetCache,
  clearCache,
} = require("../helper/cacheService");

const { getUserFilePaths } = require("../helper/userFileService");

const TASK_STATUS_FILE_PATH =
  process.env.TASK_STATUS_FILE_PATH ||
  "src/db/taskstatus.json";

// =====================================================
// CONSTANTS
// =====================================================

const TASK_STATUS_CACHE_KEY = "statuss_data";

const ALLOWED_UPDATE_FIELDS = [
  "title",
  "des",
  "type_id",
  "category_id",
  "schedule",
  "statuses_id",
  "rate",
  "status",
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// =====================================================
// HELPERS
// =====================================================

const formatBackendDate = (dateInput) => {
  if (!dateInput) return "-";

  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isValidUserId = (userId) => {
  return (
    userId !== undefined &&
    userId !== null &&
    Number.isFinite(Number(userId)) &&
    Number(userId) > 0
  );
};

const getTaskCacheKey = (userId) => `tasks_${userId}`;

// Always load the authenticated user's own task file.
const getUserTasks = async (userId) => {
  const userFiles = getUserFilePaths(userId);
  const cacheKey = getTaskCacheKey(userId);

  const cachedTasks = await getOrSetCache(
    cacheKey,
    () => readJsonFile(userFiles.tasks, [])
  );

  return {
    userFiles,
    cacheKey,
    tasks: Array.isArray(cachedTasks)
      ? cachedTasks.map((task) => ({ ...task }))
      : [],
  };
};

// Never clear cache before the file write succeeds.
const saveUserTasks = async (
  userFiles,
  cacheKey,
  tasks,
  message
) => {
  await writeJsonFile(userFiles.tasks, tasks, message);
  await clearCache(cacheKey);
};

const getAuthenticatedUserId = (req, res) => {
  const userId = req.user?.id;

  if (!isValidUserId(userId)) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return null;
  }

  return userId;
};

// =====================================================
// ENTITY VALIDATION
// =====================================================

const validateEntity = async (
  filePath,
  cacheKey,
  id,
  entityName
) => {
  if (
    id === undefined ||
    id === null ||
    id === "" ||
    !Number.isFinite(Number(id)) ||
    Number(id) <= 0
  ) {
    return `សូមជ្រើសរើស${entityName}ឱ្យបានត្រឹមត្រូវ`;
  }

  const list = await getOrSetCache(
    cacheKey,
    () => readJsonFile(filePath, [])
  );

  if (!Array.isArray(list)) {
    return `មិនអាចអានទិន្នន័យ${entityName}បានទេ`;
  }

  const item = list.find(
    (record) => Number(record.id) === Number(id)
  );

  if (!item) {
    return `${entityName} ដែលអ្នកជ្រើសរើសមិនមានក្នុងប្រព័ន្ធឡើយ`;
  }

  return null;
};

const validateTaskEntities = async (taskData, userId) => {
  const userFiles = getUserFilePaths(userId);

  const checks = [
    {
      path: userFiles.types,
      key: `taskTypes_${userId}`,
      id: taskData.type_id,
      name: "ប្រភេទភារកិច្ច",
    },
    {
      path: userFiles.categories,
      key: `categories_${userId}`,
      id: taskData.category_id,
      name: "ការបែងចែកការងារ",
    },
    {
      path: TASK_STATUS_FILE_PATH,
      key: TASK_STATUS_CACHE_KEY,
      id: taskData.statuses_id,
      name: "ស្ថានភាព",
    },
  ];

  for (const check of checks) {
    const error = await validateEntity(
      check.path,
      check.key,
      check.id,
      check.name
    );

    if (error) return error;
  }

  return null;
};

// =====================================================
// CREATE TASK
// =====================================================

exports.createTask = async (req, res) => {
  try {
    const currentUserId = getAuthenticatedUserId(req, res);
    if (!currentUserId) return;

    const taskData = req.body || {};

    // Validate referenced records.
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

    const {
      userFiles,
      cacheKey,
      tasks,
    } = await getUserTasks(currentUserId);

    // Prevent ID collision with existing records.
    let newId = Date.now();

    while (tasks.some((task) => Number(task.id) === newId)) {
      newId += 1;
    }

    const now = new Date();

    const newTask = new Task({
      id: newId,
      status: taskData.status ?? true,
      user_id: currentUserId,
      type_id: Number(taskData.type_id),
      category_id: Number(taskData.category_id),
      schedule: taskData.schedule,
      statuses_id: Number(taskData.statuses_id),
      title: taskData.title,
      des: taskData.des ?? "",
      rate: taskData.rate ?? 0,
      created_at: now,
      updated_at: now,
    });

    tasks.push(newTask);

    await saveUserTasks(
      userFiles,
      cacheKey,
      tasks,
      `Task created: ${newTask.title}`
    );

    return res.status(201).json({
      success: true,
      message: "បង្កើត Task បានជោគជ័យ",
      data: newTask,
    });

  } catch (err) {
    console.error("CREATE_TASK_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =====================================================
// UPDATE TASK
// =====================================================

exports.updateTask = async (req, res) => {
  try {
    const currentUserId = getAuthenticatedUserId(req, res);
    if (!currentUserId) return;

    const { id } = req.params;
    const taskData = req.body || {};

    const {
      userFiles,
      cacheKey,
      tasks,
    } = await getUserTasks(currentUserId);

    const taskIndex = tasks.findIndex(
      (task) => String(task.id) === String(id)
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task ដែលត្រូវកែប្រែឡើយ!",
      });
    }

    const oldTask = tasks[taskIndex];

    // Verify ownership.
    if (String(oldTask.user_id) !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "អ្នកមិនមានសិទ្ធិកែប្រែ Task នេះទេ!",
      });
    }

    // Validate referenced records.
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

    // Only accept explicitly allowed fields.
    const safeUpdates = {};

    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (
        Object.prototype.hasOwnProperty.call(taskData, field)
      ) {
        safeUpdates[field] = taskData[field];
      }
    }

    // Normalize numeric fields.
    if (safeUpdates.type_id !== undefined) {
      safeUpdates.type_id = Number(safeUpdates.type_id);
    }

    if (safeUpdates.category_id !== undefined) {
      safeUpdates.category_id = Number(safeUpdates.category_id);
    }

    if (safeUpdates.statuses_id !== undefined) {
      safeUpdates.statuses_id = Number(safeUpdates.statuses_id);
    }

    if (safeUpdates.rate !== undefined) {
      safeUpdates.rate = Number(safeUpdates.rate);
    }

    const updatedTask = {
      ...oldTask,
      ...safeUpdates,
      id: oldTask.id,
      user_id: oldTask.user_id,
      created_at: oldTask.created_at,

      updated_at: new Date(),
    };

    tasks[taskIndex] = updatedTask;

    await saveUserTasks(
      userFiles,
      cacheKey,
      tasks,
      `Task updated: ${updatedTask.title}`
    );

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព Task បានជោគជ័យ",
      data: updatedTask,
    });

  } catch (err) {
    console.error("UPDATE_TASK_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =====================================================
// DELETE TASK
// =====================================================

exports.deleteTask = async (req, res) => {
  try {
    const currentUserId = getAuthenticatedUserId(req, res);
    if (!currentUserId) return;

    const { id } = req.params;

    const {
      userFiles,
      cacheKey,
      tasks,
    } = await getUserTasks(currentUserId);

    const taskIndex = tasks.findIndex(
      (task) => String(task.id) === String(id)
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task ដែលត្រូវលុបឡើយ!",
      });
    }

    const taskToDelete = tasks[taskIndex];

    if (String(taskToDelete.user_id) !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "អ្នកមិនមានសិទ្ធិលុប Task នេះទេ!",
      });
    }

    const filteredTasks = tasks.filter(
      (task) => String(task.id) !== String(id)
    );

    await saveUserTasks(
      userFiles,
      cacheKey,
      filteredTasks,
      `Task deleted: ${id}`
    );

    return res.status(200).json({
      success: true,
      message: "លុប Task បានជោគជ័យ",
    });

  } catch (err) {
    console.error("DELETE_TASK_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =====================================================
// SHUFFLE ARRAY
// =====================================================

const shuffleArray = (array) => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

// =====================================================
// GET ALL TASKS
// =====================================================

exports.getAllTasks = async (req, res) => {
  try {
    const currentUserId = getAuthenticatedUserId(req, res);
    if (!currentUserId) return;

    const { tasks: cachedTasks } = await getUserTasks(currentUserId);

    // getUserTasks already returns a copy.
    let tasks = cachedTasks;

    const {
      search,
      page,
      limit,
      random,
    } = req.query;

    // Search safely.
    if (typeof search === "string" && search.trim()) {
      const searchLower = search.trim().toLowerCase();

      tasks = tasks.filter((task) => {
        const title = String(task.title ?? "").toLowerCase();
        const des = String(task.des ?? "").toLowerCase();

        return (
          title.includes(searchLower) ||
          des.includes(searchLower)
        );
      });
    }

    // Sort or shuffle without modifying cache.
    if (random === "true") {
      tasks = shuffleArray(tasks);
    } else {
      tasks.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    const totalItems = tasks.length;

    const formattedTasks = tasks.map((task) => ({
      ...task,
      created_at: task.created_at,
      updated_at: task.updated_at,
      created: formatBackendDate(task.created_at),
    }));

    // Pagination.
    if (page !== undefined || limit !== undefined) {
      const requestedPage = Number(page ?? DEFAULT_PAGE);
      const requestedLimit = Number(limit ?? DEFAULT_LIMIT);

      if (
        !Number.isInteger(requestedPage) ||
        requestedPage < 1 ||
        !Number.isInteger(requestedLimit) ||
        requestedLimit < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid pagination parameters",
        });
      }

      const pageSize = Math.min(requestedLimit, MAX_LIMIT);
      const totalPages = Math.ceil(totalItems / pageSize);

      const currentPage = totalPages === 0
        ? 1
        : Math.min(requestedPage, totalPages);

      const startIndex = (currentPage - 1) * pageSize;

      const paginatedData = formattedTasks.slice(
        startIndex,
        startIndex + pageSize
      );

      return res.status(200).json({
        success: true,
        meta: {
          total_items: totalItems,
          current_page: currentPage,
          limit: pageSize,
          total_pages: totalPages,
        },
        data: paginatedData,
      });
    }

    return res.status(200).json({
      success: true,
      total: totalItems,
      data: formattedTasks,
    });

  } catch (err) {
    console.error("GET_ALL_TASKS_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =====================================================
// GET TASK BY ID
// =====================================================

exports.getTaskById = async (req, res) => {
  try {
    const currentUserId = getAuthenticatedUserId(req, res);
    if (!currentUserId) return;

    const { id } = req.params;

    const { tasks } = await getUserTasks(currentUserId);

    const task = tasks.find(
      (item) => String(item.id) === String(id)
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task នេះឡើយ",
      });
    }

    // Defense in depth: verify ownership.
    if (String(task.user_id) !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "អ្នកមិនមានសិទ្ធិមើល Task នេះទេ",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...task,
        created_at: formatBackendDate(task.created_at),
        updated_at: formatBackendDate(task.updated_at),
      },
    });

  } catch (err) {
    console.error("GET_TASK_BY_ID_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
