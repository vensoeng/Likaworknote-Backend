
const {
  readJsonFile
} = require("../utils/githubJsonStore");

const {
  getOrSetCache
} = require("../helper/cacheService");

const {
  getUserFilePaths
} = require("../helper/userFileService");

// =========================
// SHARED FILE PATHS
// =========================

const TASKSTATUS_FILE_PATH =
  process.env.TASKStATUS_FILE_PATH || "src/db/taskstatus.json";


const USERS_FILE_PATH =
  process.env.USERS_FILE_PATH || "data/portfolio/users.json";

// =========================
// CONSTANTS
// =========================

const TZ_OFFSET_MINUTES = Number(
  process.env.TZ_OFFSET_MINUTES ?? 420
);

const DATE_KEY_OFFSET_MS = TZ_OFFSET_MINUTES * 60000;

const IN_PROGRESS_STATUS_ID = 1790072831425;
const COMPLETED_STATUS_ID = 1790072865066;
const DEFAULT_STATUS_ID = 1790072790734;

const PUBLIC_COMPLETED_STATUS_ID = 1790072865066;

// =========================
// DATE HELPERS
// =========================

const formatBackendDate = (dateInput) => {
  if (!dateInput) return "-";

  const d = new Date(dateInput);

  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const toDateKey = (value) => {
  if (!value) return null;

  const str = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const t = new Date(str).getTime();

  if (isNaN(t)) return null;

  return new Date(t + DATE_KEY_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
};

const todayKey = () => toDateKey(new Date().toISOString());

// =========================
// MAP HELPER
// =========================

const toMap = (list) =>
  new Map(
    (Array.isArray(list) ? list : []).map((item) => [
      String(item.id),
      item
    ])
  );

const sortNewestFirst = (a, b) =>
  new Date(b.created_at || 0) -
  new Date(a.created_at || 0);

// =========================
// LOAD SHARED DATA
// =========================

const loadSharedData = async () => {
  const [
    taskStatuses,
  ] = await Promise.all([

    getOrSetCache("statuss_data", () =>
      readJsonFile(TASKSTATUS_FILE_PATH, [])
    ),

  ]);

  return {
    status: toMap(taskStatuses),
  };
};

// =========================
// LOAD ONE USER'S DATA
// =========================

const loadUserData = async (userId) => {
  const userFiles = getUserFilePaths(userId);

  const [
    tasks,
    taskTypes,
    shared
  ] = await Promise.all([
    getOrSetCache(`tasks_${userId}`, () =>
      readJsonFile(userFiles.tasks, [])
    ),

    getOrSetCache(`taskTypes_${userId}`, () =>
      readJsonFile(userFiles.types, [])
    ),

    loadSharedData()
  ]);

  return {
    tasks: Array.isArray(tasks) ? tasks : [],

    maps: {
      type: toMap(taskTypes),
      status: shared.status,
    }
  };
};

// =========================
// FORMAT TASK
// =========================

const formatTask = (task, maps) => {
  const type = maps.type.get(String(task.type_id));

  const statusId = String(task.statuses_id);
  const status = maps.status.get(statusId);

  return {
    ...task,

    created_at: task.created_at,
    updated_at: task.updated_at,

    created: formatBackendDate(task.created_at),
    updated: formatBackendDate(task.updated_at),

    type: type
      ? {
          id: type.id,
          title: type.title,
          des: type.des
        }
      : null,

    schedule: task.schedule ?? null,

    taskStatus: status
      ? {
          id: status.id,
          title: status.title,
          des: status.des,
          value: status.value
        }
      : null,

  };
};

// =====================================================
// MY TASKS TODAY
// =====================================================

exports.myTasksToday = async (req, res) => {
  try {
    const userId = req.params.user_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const { tasks, maps } = await loadUserData(userId);

    const today = todayKey();

    const filteredTasks = tasks.filter((task) => {
      const statusId = Number(task.statuses_id);

      // Completed today
      if (statusId === COMPLETED_STATUS_ID) {
        return toDateKey(task.updated_at) === today;
      }

      // Default / In Progress
      const isActiveStatus =
        statusId === DEFAULT_STATUS_ID ||
        statusId === IN_PROGRESS_STATUS_ID;

      if (!isActiveStatus) return false;

      // Scheduled today or overdue
      const planKey =
        toDateKey(task.schedule) ||
        toDateKey(task.created_at);

      return !!planKey && planKey <= today;
    });

    const formattedTasks = filteredTasks.map((task) =>
      formatTask(task, maps)
    );

    return res.json({
      success: true,
      data: formattedTasks
    });

  } catch (err) {
    console.error("GET_MY_TASKS_TODAY_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// =====================================================
// WEEK / MONTH / YEAR DATE RANGE
// =====================================================

const getPeriodRange = (period) => {
  const offsetMs = TZ_OFFSET_MINUTES * 60000;

  const local = new Date(Date.now() + offsetMs);

  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();

  let startMs;
  let endMs;

  if (period === "week") {
    const daysSinceMonday =
      (local.getUTCDay() + 6) % 7;

    startMs = Date.UTC(
      y,
      m,
      d - daysSinceMonday
    );

    endMs = Date.UTC(
      y,
      m,
      d - daysSinceMonday + 7
    );

  } else if (period === "month") {
    startMs = Date.UTC(y, m, 1);
    endMs = Date.UTC(y, m + 1, 1);

  } else {
    startMs = Date.UTC(y, 0, 1);
    endMs = Date.UTC(y + 1, 0, 1);
  }

  return {
    start: new Date(startMs - offsetMs),
    end: new Date(endMs - offsetMs)
  };
};

const isInRange = (value, range) => {
  if (!value) return false;

  const t = new Date(value).getTime();

  if (isNaN(t)) return false;

  return (
    t >= range.start.getTime() &&
    t < range.end.getTime()
  );
};

// Created OR updated during the selected period
const isTaskInPeriod = (task, range) =>
  isInRange(task.created_at, range) ||
  isInRange(task.updated_at, range);

// =====================================================
// WEEK / MONTH / YEAR
// =====================================================

const tasksByPeriod = (period) => async (req, res) => {
  try {
    const userId = req.params.user_id;

    if (!userId || userId === "all") {
      return res.status(400).json({
        success: false,
        message: "A valid user ID is required"
      });
    }

    // Load only this user's files
    const { tasks, maps } = await loadUserData(userId);

    const range = getPeriodRange(period);

    const filteredTasks = tasks
      .filter(
        (task) =>
          String(task.user_id) === String(userId)
      )
      .filter((task) => isTaskInPeriod(task, range));

    return res.json({
      success: true,
      data: filteredTasks
        .sort(sortNewestFirst)
        .map((task) => formatTask(task, maps))
    });

  } catch (err) {
    console.error(
      `GET_TASKS_${period.toUpperCase()}_ERROR:`,
      err
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.tasksThisWeek = tasksByPeriod("week");
exports.tasksThisMonth = tasksByPeriod("month");
exports.tasksThisYear = tasksByPeriod("year");

// =====================================================
// PUBLIC COMPLETED TASKS BY USERNAME AND DATE
// =====================================================

const getDayRange = (dateStr) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    String(dateStr || "")
  );

  if (!match) return null;

  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);

  const startMs = Date.UTC(y, m, d);

  const check = new Date(startMs);

  // Reject impossible dates
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m ||
    check.getUTCDate() !== d
  ) {
    return null;
  }

  const offsetMs = TZ_OFFSET_MINUTES * 60000;

  return {
    start: new Date(startMs - offsetMs),

    end: new Date(
      startMs + 24 * 60 * 60 * 1000 - offsetMs
    )
  };
};

exports.publicCompletedTasksByDate = async (req, res) => {
  try {
    const username = String(
      req.params.username || ""
    ).trim().toLowerCase();

    const date = String(
      req.params.date || ""
    ).trim();

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    const range = getDayRange(date);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use format YYYY-MM-DD"
      });
    }

    // Find user by username
    const users = await getOrSetCache(
      "users_data",
      () => readJsonFile(USERS_FILE_PATH, []),
      700
    );

    const user = (users || []).find(
      (u) =>
        String(u.username || "")
          .trim()
          .toLowerCase() === username
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Load only the matched user's files
    const { tasks, maps } = await loadUserData(user.id);

    const completedTasks = tasks
      .filter(
        (task) =>
          String(task.user_id) === String(user.id) &&
          Number(task.statuses_id) ===
            PUBLIC_COMPLETED_STATUS_ID &&
          isInRange(task.updated_at, range)
      )
      .sort(
        (a, b) =>
          new Date(a.updated_at) -
          new Date(b.updated_at)
      );

    const data = completedTasks.map((task) => {
      const type = maps.type.get(String(task.type_id));

      const status = maps.status.get(
        String(task.statuses_id)
      );

      return {
        id: task.id,
        title: task.title,
        des: task.des,
        rate: task.rate,

        created_at: task.created_at,
        updated_at: task.updated_at,

        created: formatBackendDate(task.created_at),
        updated: formatBackendDate(task.updated_at),

        type: type
          ? {
              id: type.id,
              title: type.title
            }
          : null,

        schedule: task.schedule ?? null,

        taskStatus: status
          ? {
              id: status.id,
              title: status.title,
              des: status.des
            }
          : null
      };
    });

    return res.json({
      success: true,
      date,

      user: {
        username: user.username,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        pr_img: user.pr_img || null
      },

      total: data.length,
      data
    });

  } catch (err) {
    console.error(
      "GET_PUBLIC_COMPLETED_TASKS_ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

