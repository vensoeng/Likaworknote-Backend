// const path = require("path");
// const Task = require("../models/Task");
// const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");
// const { getOrSetCache, clearCache } = require("../helper/cacheService");

// const TASK_FILE_PATH = process.env.TASK_FILE_PATH || "src/db/task.json";

// const TASKTYPE_FILE_PATH = process.env.TASKTYPE_FILE_PATH || "src/db/tasktype.json";
// const TASKCATEGORY_FILE_PATH = process.env.TASKCATEGORY_FILE_PATH || "src/db/taskcategory.json";
// const TELEGRAM_FILE_PATH = process.env.TELEGRAM_FILE_PATH || "src/db/telegram.json"
// const TASKSCHEDULE_FILE_PATH = process.env.TASKSCHEDULE_FILE_PATH || "src/db/taskschedule.json";
// const TASKStATUS_FILE_PATH = process.env.TASKStATUS_FILE_PATH || "src/db/taskstatus.json";
// const TASK_REMINDER_FILE_PATH = process.env.TASK_REMINDER_FILE_PATH || "src/db/taskreminder.json";

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

// // =========================
// // DATE KEY "YYYY-MM-DD" in Cambodia time (UTC+7)
// // Works with "2026-10-29" and "2026-10-26T07:35:51.185Z"
// // =========================
// const DATE_KEY_OFFSET_MS = Number(process.env.TZ_OFFSET_MINUTES ?? 420) * 60000;

// const toDateKey = (value) => {
//   if (!value) return null;
//   const str = String(value).trim();
//   if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str; // already a plain date
//   const t = new Date(str).getTime();
//   if (isNaN(t)) return null;
//   return new Date(t + DATE_KEY_OFFSET_MS).toISOString().slice(0, 10);
// };

// const todayKey = () => toDateKey(new Date().toISOString());

// // =====================================================
// // MY TASKS TODAY (now uses task.schedule)
// // =====================================================
// exports.myTasksToday = async (req, res) => {
//   try {

//     const user_id = req.params.user_id;

//     // =========================
//     // TASK FILTER CONSTANTS
//     // =========================
//     const IN_PROGRESS_STATUS_ID = 1790072831425;
//     const COMPLETED_STATUS_ID = 1790072865066;
//     const DEFAULT_STATUS_ID = 1790072790734;

//     // =========================
//     // FILTER TODAY TASKS (by schedule)
//     // =========================
//     const filterTodayTasks = (taskList) => {
//       const today = todayKey();

//       return taskList.filter((task) => {
//         const statusId = Number(task.statuses_id);

//         // 1. Completed today -> show
//         if (statusId === COMPLETED_STATUS_ID) {
//           return toDateKey(task.updated_at) === today;
//         }

//         // 2. Only Default / In Progress tasks are "to do"
//         const isActiveStatus =
//           statusId === DEFAULT_STATUS_ID ||
//           statusId === IN_PROGRESS_STATUS_ID;

//         if (!isActiveStatus) return false;

//         // 3. Scheduled today or overdue -> show
//         //    Future schedule (e.g. tomorrow) -> hide
//         //    No schedule (old data) -> fall back to created_at
//         const planKey = toDateKey(task.schedule) || toDateKey(task.created_at);
//         return !!planKey && planKey <= today;
//       });
//     };

//     // =========================
//     // LOAD ALL DATA
//     // =========================
//     let [
//       tasks,
//       taskTypes,
//       taskCategories,
//       taskSchedules,
//       taskStatuses,
//       taskReminders,
//       telegrams
//     ] = await Promise.all([

//       getOrSetCache("tasks_data", () =>
//         readJsonFile(TASK_FILE_PATH, [])
//       ),

//       getOrSetCache("taskTypes_data", () =>
//         readJsonFile(TASKTYPE_FILE_PATH, [])
//       ),

//       getOrSetCache("categorys_data", () =>
//         readJsonFile(TASKCATEGORY_FILE_PATH, [])
//       ),

//       getOrSetCache("schedule_data", () =>
//         readJsonFile(TASKSCHEDULE_FILE_PATH, [])
//       ),

//       getOrSetCache("statuss_data", () =>
//         readJsonFile(TASKStATUS_FILE_PATH, [])
//       ),

//       getOrSetCache("reminders_data", () =>
//         readJsonFile(TASK_REMINDER_FILE_PATH, [])
//       ),

//       getOrSetCache("telegrams_data", () =>
//         readJsonFile(TELEGRAM_FILE_PATH, [])
//       )

//     ]);

//     // =========================
//     // FILTER USER TASKS
//     // =========================
//     tasks = tasks.filter(
//       task =>
//         String(task.user_id) === String(user_id)
//     );

//     // =========================
//     // FILTER TODAY
//     // =========================
//     tasks = filterTodayTasks(tasks);

//     // =========================
//     // CREATE LOOKUP MAPS
//     // =========================

//     const taskTypeMap = new Map(
//       taskTypes.map(item => [
//         String(item.id),
//         item
//       ])
//     );

//     const taskCategoryMap = new Map(
//       taskCategories.map(item => [
//         String(item.id),
//         item
//       ])
//     );

//     const taskScheduleMap = new Map(
//       taskSchedules.map(item => [
//         String(item.id),
//         item
//       ])
//     );

//     const taskStatusMap = new Map(
//       taskStatuses.map(item => [
//         String(item.id),
//         item
//       ])
//     );

//     const taskReminderMap = new Map(
//       taskReminders.map(item => [
//         String(item.id),
//         item
//       ])
//     );

//     const telegramMap = new Map(
//       telegrams.map(item => [
//         String(item.id),
//         item
//       ])
//     );

//     // =========================
//     // FORMAT TASKS
//     // =========================
//     const formattedTasks = tasks.map(task => {

//       const type =
//         taskTypeMap.get(
//           String(task.type_id)
//         );

//       const category =
//         taskCategoryMap.get(
//           String(task.category_id)
//         );

//       const status =
//         taskStatusMap.get(
//           String(task.statuses_id)
//         );

//       const reminder =
//         taskReminderMap.get(
//           String(task.reminder_id)
//         );

//       const telegram =
//         telegramMap.get(
//           String(task.telegram_id)
//         );

//       return {

//         // =========================
//         // ORIGINAL TASK DATA
//         // =========================
//         ...task,

//         created_at: task.created_at,
//         updated_at: task.updated_at,

//         created: formatBackendDate(
//           task.created_at
//         ),
//         updated: formatBackendDate(
//           task.updated_at
//         ),

//         // =========================
//         // TYPE
//         // =========================
//         type: type
//           ? {
//               id: type.id,
//               title: type.title,
//               des: type.des
//             }
//           : null,

//         // =========================
//         // CATEGORY
//         // =========================
//         category: category
//           ? {
//               id: category.id,
//               title: category.title,
//               des: category.des,
//               status: category.status
//             }
//           : null,

//         // =========================
//         // SCHEDULE
//         // =========================
//         schedule: task.schedule ?? null,

//         // =========================
//         // STATUS
//         // =========================
//         taskStatus: status
//           ? {
//               id: status.id,
//               title: status.title,
//               des: status.des,
//               value: status.value
//             }
//           : null,

//         // =========================
//         // REMINDER
//         // =========================
//         reminder: reminder
//           ? {
//               id: reminder.id,
//               title: reminder.title,
//               des: reminder.des,
//               value: reminder.value
//             }
//           : null,

//         // =========================
//         // TELEGRAM
//         // =========================
//         telegram: telegram
//           ? {
//               id: telegram.id,
//               title: telegram.title,
//               des: telegram.des,
//               telegram_id: telegram.telegram_id
//             }
//           : null
//       };
//     });

//     // =========================
//     // RESPONSE
//     // =========================
//     return res.json({
//       success: true,
//       data: formattedTasks
//     });

//   } catch (err) {

//     console.error(
//       "GET_MY_TASKS_TODAY_ERROR:",
//       err
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message
//     });
//   }
// };


// // =====================================================
// // NEW: SHARED HELPERS FOR CATEGORY / WEEK / MONTH / YEAR
// // =====================================================

// // Cambodia = UTC+7 (420 minutes)
// const TZ_OFFSET_MINUTES = Number(process.env.TZ_OFFSET_MINUTES ?? 420);

// const toMap = (list) =>
//   new Map((list || []).map((item) => [String(item.id), item]));

// const sortNewestFirst = (a, b) =>
//   new Date(b.created_at || 0) - new Date(a.created_at || 0);

// // Load all data with the same cache keys as myTasksToday
// const loadAllData = async () => {
//   const [
//     tasks,
//     taskTypes,
//     taskCategories,
//     taskSchedules,
//     taskStatuses,
//     taskReminders,
//     telegrams
//   ] = await Promise.all([
//     getOrSetCache("tasks_data", () => readJsonFile(TASK_FILE_PATH, [])),
//     getOrSetCache("taskTypes_data", () => readJsonFile(TASKTYPE_FILE_PATH, [])),
//     getOrSetCache("categorys_data", () => readJsonFile(TASKCATEGORY_FILE_PATH, [])),
//     getOrSetCache("schedule_data", () => readJsonFile(TASKSCHEDULE_FILE_PATH, [])),
//     getOrSetCache("statuss_data", () => readJsonFile(TASKStATUS_FILE_PATH, [])),
//     getOrSetCache("reminders_data", () => readJsonFile(TASK_REMINDER_FILE_PATH, [])),
//     getOrSetCache("telegrams_data", () => readJsonFile(TELEGRAM_FILE_PATH, []))
//   ]);

//   return {
//     tasks: tasks || [],
//     maps: {
//       type: toMap(taskTypes),
//       category: toMap(taskCategories),
//       schedule: toMap(taskSchedules),
//       status: toMap(taskStatuses),
//       reminder: toMap(taskReminders),
//       telegram: toMap(telegrams)
//     }
//   };
// };

// // Same output shape as myTasksToday
// const formatTask = (task, maps) => {
//   const type = maps.type.get(String(task.type_id));
//   const category = maps.category.get(String(task.category_id));
//   const status = maps.status.get(String(task.statuses_id));
//   const reminder = maps.reminder.get(String(task.reminder_id));
//   const telegram = maps.telegram.get(String(task.telegram_id));

//   return {
//     ...task,
//     created_at: task.created_at,
//     updated_at: task.updated_at,
//     created: formatBackendDate(task.created_at),
//     updated: formatBackendDate(task.updated_at),

//     type: type
//       ? { id: type.id, title: type.title, des: type.des }
//       : null,

//     category: category
//       ? { id: category.id, title: category.title, des: category.des, status: category.status }
//       : null,

//     schedule: task.schedule ?? null,

//     taskStatus: status
//       ? { id: status.id, title: status.title, des: status.des, value: status.value }
//       : null,

//     reminder: reminder
//       ? { id: reminder.id, title: reminder.title, des: reminder.des, value: reminder.value }
//       : null,

//     telegram: telegram
//       ? { id: telegram.id, title: telegram.title, des: telegram.des, telegram_id: telegram.telegram_id }
//       : null
//   };
// };

// // Start/end (end exclusive) of this week (Mon-Sun), month or year in UTC+7
// const getPeriodRange = (period) => {
//   const offsetMs = TZ_OFFSET_MINUTES * 60000;
//   const local = new Date(Date.now() + offsetMs);

//   const y = local.getUTCFullYear();
//   const m = local.getUTCMonth();
//   const d = local.getUTCDate();

//   let startMs;
//   let endMs;

//   if (period === "week") {
//     const daysSinceMonday = (local.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
//     startMs = Date.UTC(y, m, d - daysSinceMonday);
//     endMs = Date.UTC(y, m, d - daysSinceMonday + 7);
//   } else if (period === "month") {
//     startMs = Date.UTC(y, m, 1);
//     endMs = Date.UTC(y, m + 1, 1);
//   } else {
//     startMs = Date.UTC(y, 0, 1);
//     endMs = Date.UTC(y + 1, 0, 1);
//   }

//   return {
//     start: new Date(startMs - offsetMs),
//     end: new Date(endMs - offsetMs)
//   };
// };

// const isInRange = (value, range) => {
//   if (!value) return false;
//   const t = new Date(value).getTime();
//   if (isNaN(t)) return false;
//   return t >= range.start.getTime() && t < range.end.getTime();
// };

// // A task belongs to the period if it was created OR updated in that period
// const isTaskInPeriod = (task, range) =>
//   isInRange(task.created_at, range) || isInRange(task.updated_at, range);


// // =====================================================
// // CATEGORY
// // The user is taken from the category's own user_id.
// // =====================================================
// exports.tasksByCategory = async (req, res) => {
//   try {
//     const category_id = req.params.category_id;
//     const { tasks, maps } = await loadAllData();

//     let filtered;

//     if (!category_id || category_id === "all") {
//       // All tasks of all categories
//       filtered = tasks;
//     } else {
//       const category = maps.category.get(String(category_id));

//       if (!category) {
//         return res.status(404).json({
//           success: false,
//           message: "Category not found"
//         });
//       }

//       // Tasks in this category that belong to the category's owner
//       filtered = tasks.filter(
//         (task) =>
//           String(task.category_id) === String(category.id) &&
//           String(task.user_id) === String(category.user_id)
//       );
//     }

//     return res.json({
//       success: true,
//       data: filtered.sort(sortNewestFirst).map((task) => formatTask(task, maps))
//     });

//   } catch (err) {
//     console.error("GET_TASKS_BY_CATEGORY_ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message
//     });
//   }
// };


// // =====================================================
// // WEEK / MONTH / YEAR
// // =====================================================
// const tasksByPeriod = (period) => async (req, res) => {
//   try {
//     const user_id = req.params.user_id;
//     const range = getPeriodRange(period);
//     const { tasks, maps } = await loadAllData();

//     let filtered = tasks;

//     if (user_id && user_id !== "all") {
//       filtered = filtered.filter(
//         (task) => String(task.user_id) === String(user_id)
//       );
//     }

//     filtered = filtered.filter((task) => isTaskInPeriod(task, range));

//     return res.json({
//       success: true,
//       data: filtered.sort(sortNewestFirst).map((task) => formatTask(task, maps))
//     });

//   } catch (err) {
//     console.error(`GET_TASKS_${period.toUpperCase()}_ERROR:`, err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message
//     });
//   }
// };

// exports.tasksThisWeek = tasksByPeriod("week");
// exports.tasksThisMonth = tasksByPeriod("month");
// exports.tasksThisYear = tasksByPeriod("year");


// // =====================================================
// // COMPLETED TASKS OF A USER ON ONE DATE
// // =====================================================
// const USERS_FILE_PATH = process.env.USERS_FILE_PATH || "data/portfolio/users.json";
// const PUBLIC_COMPLETED_STATUS_ID = 1790072865066;

// const getDayRange = (dateStr) => {
//   const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
//   if (!match) return null;

//   const y = Number(match[1]);
//   const m = Number(match[2]) - 1;
//   const d = Number(match[3]);

//   const startMs = Date.UTC(y, m, d);
//   const check = new Date(startMs);

//   // Reject impossible dates like 2026-02-31
//   if (
//     check.getUTCFullYear() !== y ||
//     check.getUTCMonth() !== m ||
//     check.getUTCDate() !== d
//   ) {
//     return null;
//   }

//   const offsetMs = TZ_OFFSET_MINUTES * 60000;
//   return {
//     start: new Date(startMs - offsetMs),
//     end: new Date(startMs + 24 * 60 * 60 * 1000 - offsetMs)
//   };
// };

// exports.publicCompletedTasksByDate = async (req, res) => {
//   try {
//     const username = String(req.params.username || "").trim().toLowerCase();
//     const date = String(req.params.date || "").trim();

//     if (!username) {
//       return res.status(400).json({ success: false, message: "username required" });
//     }

//     const range = getDayRange(date);
//     if (!range) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid date. Use format YYYY-MM-DD (e.g. 2026-09-04)"
//       });
//     }

//     // Same cache key + file as authController
//     const users = await getOrSetCache(
//       "users_data",
//       () => readJsonFile(USERS_FILE_PATH, []),
//       700
//     );

//     const user = (users || []).find(
//       (u) => String(u.username || "").trim().toLowerCase() === username
//     );

//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     const { tasks, maps } = await loadAllData();

//     // Completed tasks of this user, completed (updated_at) on that date
//     const completed = tasks
//       .filter(
//         (task) =>
//           String(task.user_id) === String(user.id) &&
//           Number(task.statuses_id) === PUBLIC_COMPLETED_STATUS_ID &&
//           isInRange(task.updated_at, range)
//       )
//       .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));

//     const data = completed.map((task) => {
//       const type = maps.type.get(String(task.type_id));
//       const category = maps.category.get(String(task.category_id));
//       const status = maps.status.get(String(task.statuses_id));
//       return {
//         id: task.id,
//         title: task.title,
//         des: task.des,
//         rate: task.rate,
//         created_at: task.created_at,
//         updated_at: task.updated_at,
//         created: formatBackendDate(task.created_at),
//         updated: formatBackendDate(task.updated_at),
//         type: type ? { id: type.id, title: type.title } : null,
//         category: category ? { id: category.id, title: category.title } : null,
//         schedule: task.schedule ?? null,
//         taskStatus: status ? { id: status.id, title: status.title, des: status.des } : null
//       };
//     });

//     return res.json({
//       success: true,
//       date,
//       user: {
//         username: user.username,
//         firstName: user.firstName || "",
//         lastName: user.lastName || "",
//         pr_img: user.pr_img || null
//       },
//       total: data.length,
//       data
//     });

//   } catch (err) {
//     console.error("GET_PUBLIC_COMPLETED_TASKS_ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message
//     });
//   }
// };



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

const TASKSCHEDULE_FILE_PATH =
  process.env.TASKSCHEDULE_FILE_PATH || "src/db/taskschedule.json";

const TASKSTATUS_FILE_PATH =
  process.env.TASKStATUS_FILE_PATH || "src/db/taskstatus.json";

const TASK_REMINDER_FILE_PATH =
  process.env.TASK_REMINDER_FILE_PATH || "src/db/taskreminder.json";

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
    taskSchedules,
    taskStatuses,
    // taskReminders
  ] = await Promise.all([
    getOrSetCache("schedule_data", () =>
      readJsonFile(TASKSCHEDULE_FILE_PATH, [])
    ),

    getOrSetCache("statuss_data", () =>
      readJsonFile(TASKSTATUS_FILE_PATH, [])
    ),

    // getOrSetCache("reminders_data", () =>
    //   readJsonFile(TASK_REMINDER_FILE_PATH, [])
    // )
  ]);

  return {
    schedule: toMap(taskSchedules),
    status: toMap(taskStatuses),
    // reminder: toMap(taskReminders)
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
    taskCategories,
    // telegrams,
    shared
  ] = await Promise.all([
    getOrSetCache(`tasks_${userId}`, () =>
      readJsonFile(userFiles.tasks, [])
    ),

    getOrSetCache(`taskTypes_${userId}`, () =>
      readJsonFile(userFiles.types, [])
    ),

    getOrSetCache(`categories_${userId}`, () =>
      readJsonFile(userFiles.categories, [])
    ),

    // getOrSetCache(`telegrams_${userId}`, () =>
    //   readJsonFile(userFiles.telegram, [])
    // ),

    loadSharedData()
  ]);

  return {
    tasks: Array.isArray(tasks) ? tasks : [],

    maps: {
      type: toMap(taskTypes),
      category: toMap(taskCategories),
      schedule: shared.schedule,
      status: shared.status,
      // reminder: shared.reminder,
      // telegram: toMap(telegrams)
    }
  };
};

// =========================
// FORMAT TASK
// =========================

const formatTask = (task, maps) => {
  const type = maps.type.get(String(task.type_id));

  const category = maps.category.get(
    String(task.category_id)
  );

  const status = maps.status.get(
    String(task.statuses_id)
  );

  // const reminder = maps.reminder.get(
  //   String(task.reminder_id)
  // );

  // const telegram = maps.telegram.get(
  //   String(task.telegram_id)
  // );

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

    category: category
      ? {
          id: category.id,
          title: category.title,
          des: category.des,
          status: category.status
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

    // reminder: reminder
    //   ? {
    //       id: reminder.id,
    //       title: reminder.title,
    //       des: reminder.des,
    //       value: reminder.value
    //     }
    //   : null,

    // telegram: telegram
    //   ? {
    //       id: telegram.id,
    //       title: telegram.title,
    //       des: telegram.des,
    //       telegram_id: telegram.telegram_id
    //     }
    //   : null
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
// CATEGORY
// GET /user/:user_id/category/:category_id
// =====================================================

exports.tasksByCategory = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const categoryId = req.params.category_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Load only this user's files
    const { tasks, maps } = await loadUserData(userId);

    let filteredTasks;

    if (categoryId === "all") {
      // All tasks belonging to this user
      filteredTasks = tasks;

    } else {
      // Find category only inside this user's category file
      const category = maps.category.get(
        String(categoryId)
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }

      filteredTasks = tasks.filter(
        (task) =>
          String(task.category_id) === String(category.id) &&
          String(task.user_id) === String(userId)
      );
    }

    return res.json({
      success: true,
      data: filteredTasks
        .sort(sortNewestFirst)
        .map((task) => formatTask(task, maps))
    });

  } catch (err) {
    console.error("GET_TASKS_BY_CATEGORY_ERROR:", err);

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

      const category = maps.category.get(
        String(task.category_id)
      );

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

        category: category
          ? {
              id: category.id,
              title: category.title
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

