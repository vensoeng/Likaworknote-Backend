const TaskStatus = require("../models/TaskStatus");
const {
  readJsonFile,
  writeJsonFile
} = require("../utils/githubJsonStore");

const {
  getOrSetCache,
  clearCache
} = require("../helper/cacheService");

const TASKSTATUS_FILE_PATH =
  process.env.TASKSTATUS_FILE_PATH || "src/db/taskStatus.json";

const CACHE_KEY = "statuss_data";
const CACHE_TTL = 700;

const getTaskStatusList = async () => {
  const cached = await getOrSetCache(
    CACHE_KEY,
    () => readJsonFile(TASKSTATUS_FILE_PATH, []),
    CACHE_TTL
  );

  return Array.isArray(cached) ? [...cached] : [];
};

const formatBackendDate = (dateInput) => {
  if (!dateInput) return "-";

  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

// CREATE
exports.createTaskStatus = async (req, res) => {
  try {
    const { title, des = "", value = "" } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "សូមបញ្ចូលចំណងជើង Task Status"
      });
    }

    const taskStatusList = await getTaskStatusList();

    const newTaskStatus = new TaskStatus({
      id: Date.now(),
      title: String(title).trim(),
      des: String(des || ""),
      value: String(value || ""),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    taskStatusList.push(newTaskStatus);

    await writeJsonFile(
      TASKSTATUS_FILE_PATH,
      taskStatusList,
      `Task Status: created ${newTaskStatus.title}`
    );

    clearCache(CACHE_KEY);

    return res.status(201).json({
      success: true,
      message: "បង្កើត Task Status បានជោគជ័យ",
      data: newTaskStatus
    });

  } catch (err) {
    console.error("CREATE_TASK_STATUS_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// UPDATE
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, des, value } = req.body || {};

    const taskStatusList = await getTaskStatusList();

    const index = taskStatusList.findIndex(
      (status) => String(status.id) === String(id)
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task Status ដែលត្រូវកែប្រែឡើយ!"
      });
    }

    if (
      title !== undefined &&
      !String(title).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "ចំណងជើងមិនអាចទទេបានទេ"
      });
    }

    const oldStatus = taskStatusList[index];

    const updatedStatus = {
      ...oldStatus,
      ...(title !== undefined && {
        title: String(title).trim()
      }),
      ...(des !== undefined && {
        des: String(des)
      }),
      ...(value !== undefined && {
        value: String(value)
      }),
      updated_at: new Date().toISOString()
    };

    taskStatusList[index] = updatedStatus;

    await writeJsonFile(
      TASKSTATUS_FILE_PATH,
      taskStatusList,
      `Task Status: updated ${updatedStatus.title}`
    );

    clearCache(CACHE_KEY);

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព Task Status បានជោគជ័យ",
      data: updatedStatus
    });

  } catch (err) {
    console.error("UPDATE_TASK_STATUS_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// DELETE
exports.deleteTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const taskStatusList = await getTaskStatusList();

    const exists = taskStatusList.some(
      (status) => String(status.id) === String(id)
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task Status ដែលត្រូវលុបឡើយ!"
      });
    }

    const filteredStatuses = taskStatusList.filter(
      (status) => String(status.id) !== String(id)
    );

    await writeJsonFile(
      TASKSTATUS_FILE_PATH,
      filteredStatuses,
      `Task Status: deleted status with ID ${id}`
    );

    clearCache(CACHE_KEY);

    return res.status(200).json({
      success: true,
      message: "លុប Task Status បានជោគជ័យ"
    });

  } catch (err) {
    console.error("DELETE_TASK_STATUS_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// GET ALL
exports.getAllTaskStatuss = async (req, res) => {
  try {
    let statuses = await getTaskStatusList();

    const { search, page, limit, random } = req.query;

    if (search) {
      const keyword = String(search).toLowerCase();

      statuses = statuses.filter((status) =>
        [
          status.title,
          status.title_kh,
          status.des,
          status.description
        ].some((field) =>
          String(field || "").toLowerCase().includes(keyword)
        )
      );
    }

    if (random === "true") {
      for (let i = statuses.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
      }
    } else {
      statuses.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
    }

    const formattedStatuses = statuses.map((status) => ({
      ...status,
      created_at: formatBackendDate(status.created_at),
      updated_at: formatBackendDate(status.updated_at)
    }));

    const totalItems = formattedStatuses.length;

    if (page !== undefined || limit !== undefined) {
      const currentPage = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.max(1, parseInt(limit, 10) || 10);

      const startIndex = (currentPage - 1) * pageSize;

      return res.json({
        success: true,
        meta: {
          total_items: totalItems,
          current_page: currentPage,
          limit: pageSize,
          total_pages: Math.ceil(totalItems / pageSize)
        },
        data: formattedStatuses.slice(
          startIndex,
          startIndex + pageSize
        )
      });
    }

    return res.json({
      success: true,
      total: totalItems,
      data: formattedStatuses
    });

  } catch (err) {
    console.error("GET_ALL_TASK_STATUSES_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// GET BY ID
exports.getTaskStatusById = async (req, res) => {
  try {
    const { id } = req.params;

    const statuses = await getTaskStatusList();

    const status = statuses.find(
      (item) => String(item.id) === String(id)
    );

    if (!status) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Task Status នេះឡើយ"
      });
    }

    return res.json({
      success: true,
      data: {
        ...status,
        created_at: formatBackendDate(status.created_at),
        updated_at: formatBackendDate(status.updated_at)
      }
    });

  } catch (err) {
    console.error("GET_TASK_STATUS_BY_ID_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};