
const {
  readJsonFile
} = require("../utils/githubJsonStore");

const {
  getUserFilePaths
} = require("../helper/userFileService");

// =========================
// CONFIG
// =========================

const USERS_FILE_PATH =
  process.env.USERS_FILE_PATH || "data/portfolio/users.json";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const TZ_OFFSET_MINUTES = Number(
  process.env.TZ_OFFSET_MINUTES ?? 420
);

// Task status IDs
const DEFAULT_STATUS_ID = 1790072790734;
const IN_PROGRESS_STATUS_ID = 1790072831425;
const COMPLETED_STATUS_ID = 1790072865066;

// =========================
// DATE HELPERS (UTC+7)
// =========================

const getDateKey = (date = new Date()) => {
  const offsetMs = TZ_OFFSET_MINUTES * 60000;

  return new Date(date.getTime() + offsetMs)
    .toISOString()
    .slice(0, 10);
};

const getTomorrowKey = () => {
  const offsetMs = TZ_OFFSET_MINUTES * 60000;
  const localDate = new Date(Date.now() + offsetMs);

  localDate.setUTCHours(0, 0, 0, 0);
  localDate.setUTCDate(localDate.getUTCDate() + 1);

  return localDate.toISOString().slice(0, 10);
};

const toDateKey = (value) => {
  if (!value) return null;

  const str = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const date = new Date(str);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return getDateKey(date);
};

// =========================
// TELEGRAM HELPERS
// =========================

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const sendTelegramMessage = async (chatId, message) => {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }

  const url =
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML"
    })
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result.description || "Telegram message failed"
    );
  }

  return result;
};

// =========================
// TASK HELPERS
// =========================

const isActiveTask = (task) => {
  const statusId = Number(task.statuses_id);

  return (
    statusId === DEFAULT_STATUS_ID ||
    statusId === IN_PROGRESS_STATUS_ID
  );
};

const getTaskLines = (tasks) => {
  if (!tasks.length) {
    return "   - None";
  }

  return tasks.map((task, index) => {
    return `${index + 1}. ${escapeHtml(task.title || "Untitled")}`;
  }).join("\n");
};

// =========================
// LOAD USERS AND TASKS
// =========================

const loadUsers = async () => {
  const users = await readJsonFile(
    USERS_FILE_PATH,
    []
  );

  return Array.isArray(users) ? users : [];
};

const loadUserTasks = async (userId) => {
  const paths = getUserFilePaths(userId);

  const tasks = await readJsonFile(
    paths.tasks,
    []
  );

  return Array.isArray(tasks) ? tasks : [];
};

// =========================
// MORNING MESSAGE
// =========================

const buildMorningMessage = (tasks, today) => {
  const todayTasks = tasks.filter(
    (task) =>
      toDateKey(task.schedule) === today &&
      isActiveTask(task)
  );

  const notStarted = todayTasks.filter(
    (task) =>
      Number(task.statuses_id) === DEFAULT_STATUS_ID
  );

  const inProgress = todayTasks.filter(
    (task) =>
      Number(task.statuses_id) === IN_PROGRESS_STATUS_ID
  );

  return [
    "🌅 <b>Good Morning!</b>",
    "",
    `📅 Date: ${today}`,
    "",
    `📝 <b>Today's Tasks (${todayTasks.length})</b>`,
    "",
    `🔵 <b>Not Started (${notStarted.length})</b>`,
    getTaskLines(notStarted),
    "",
    `🟡 <b>In Progress (${inProgress.length})</b>`,
    getTaskLines(inProgress),
    "",
    "Have a productive day! 💪"
  ].join("\n");
};

// =========================
// EVENING MESSAGE
// =========================

const buildEveningMessage = (tasks, today, tomorrow) => {
  const completed = tasks.filter(
    (task) =>
      Number(task.statuses_id) === COMPLETED_STATUS_ID &&
      toDateKey(task.updated_at) === today
  );

  const todayActiveTasks = tasks.filter(
    (task) =>
      toDateKey(task.schedule) === today &&
      isActiveTask(task)
  );

  const notStarted = todayActiveTasks.filter(
    (task) =>
      Number(task.statuses_id) === DEFAULT_STATUS_ID
  );

  const inProgress = todayActiveTasks.filter(
    (task) =>
      Number(task.statuses_id) === IN_PROGRESS_STATUS_ID
  );

  const tomorrowTasks = tasks.filter(
    (task) =>
      toDateKey(task.schedule) === tomorrow &&
      isActiveTask(task)
  );

  return [
    "🌇 <b>Daily Work Summary</b>",
    "",
    `📅 Date: ${today}`,
    "",
    `✅ <b>Completed (${completed.length})</b>`,
    getTaskLines(completed),
    "",
    `🔵 <b>Not Started (${notStarted.length})</b>`,
    getTaskLines(notStarted),
    "",
    `🟡 <b>In Progress (${inProgress.length})</b>`,
    getTaskLines(inProgress),
    "",
    `📌 <b>Tomorrow's Tasks (${tomorrowTasks.length})</b>`,
    getTaskLines(tomorrowTasks),
    "",
    "Keep improving every day! 💪"
  ].join("\n");
};

// =========================
// SEND TO ALL USERS
// =========================

const sendToAllUsers = async (messageBuilder, dateKeys) => {
  const users = await loadUsers();

  const result = {
    totalUsers: users.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  for (const user of users) {
    const chatId = user.telegram_id;

    if (!chatId) {
      result.skipped++;
      continue;
    }

    try {
      const tasks = await loadUserTasks(user.id);

      const message = messageBuilder(
        tasks,
        ...dateKeys
      );

      await sendTelegramMessage(chatId, message);

      result.sent++;

    } catch (error) {
      result.failed++;

      result.errors.push({
        userId: user.id,
        username: user.username,
        message: error.message
      });

      console.error(
        `TELEGRAM_NOTIFICATION_ERROR [${user.id}]:`,
        error.message
      );
    }
  }

  return result;
};

// =========================
// PUBLIC FUNCTIONS
// =========================

const sendMorningReminders = async () => {
  const today = getDateKey();

  return sendToAllUsers(
    buildMorningMessage,
    [today]
  );
};

const sendEveningSummaries = async () => {
  const today = getDateKey();
  const tomorrow = getTomorrowKey();

  return sendToAllUsers(
    buildEveningMessage,
    [today, tomorrow]
  );
};

module.exports = {
  sendMorningReminders,
  sendEveningSummaries
};
