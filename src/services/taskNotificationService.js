
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

// Format date in Khmer and English
const getFormattedDates = (dateKey) => {
  const date = new Date(`${dateKey}T12:00:00.000Z`);

  const khmerDate = new Intl.DateTimeFormat("km-KH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);

  const englishDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);

  return {
    khmerDate,
    englishDate
  };
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

const getTaskLines = (
  tasks,
  emptyText = "មិនមានការងារទេ!"
) => {
  if (!tasks.length) {
    return `(${emptyText})`;
  }

  return tasks.map((task, index) => {
    return `${index + 1}. ${escapeHtml(task.title || "Untitled")}`;
  }).join("\n");
};

const getUserFullName = (user) => {
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";

  return escapeHtml(
    `${firstName} ${lastName}`.trim() || user.username || "User"
  );
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

const buildMorningMessage = (tasks, today, user) => {

  // Only active tasks with valid schedule dates
  const activeTasks = tasks.filter(
    (task) =>
      isActiveTask(task) &&
      toDateKey(task.schedule) !== null
  );

  // Overdue tasks: schedule before today
  const overdueTasks = activeTasks.filter(
    (task) =>
      toDateKey(task.schedule) < today
  );

  // Today's tasks: schedule equals today
  const todayTasks = activeTasks.filter(
    (task) =>
      toDateKey(task.schedule) === today
  );

  const totalTasks =
    overdueTasks.length + todayTasks.length;

  const { khmerDate, englishDate } =
    getFormattedDates(today);

  const fullName = getUserFullName(user);

  return [
    `🌅 <b>អរុណសួស្ដី ${fullName}!</b>`,
    `${khmerDate}`,
    `${englishDate}`,
    "",
    "⚠️ <b>ភារកិច្ចហួសកាលកំណត់</b>",
    getTaskLines(
      overdueTasks,
      "មិនមានភារកិច្ចហួសកាលកំណត់ទេ!"
    ),
    "",
    `📝 <b>ភារកិច្ចត្រូវធ្វើថ្ងៃនេះ (${todayTasks.length})</b>`,
    getTaskLines(
      todayTasks,
      "មិនមានការងារដែលបានកំណត់សម្រាប់ធ្វើក្នុងថ្ងៃនេះទេ!"
    ),
    "",
    "📊 <b>សរុបការងារ</b>",
    `- ហួសកំណត់៖ ${overdueTasks.length}`,
    `- ត្រូវធ្វើថ្ងៃនេះ៖ ${todayTasks.length}`,
    `- <b>សរុប៖ ${totalTasks}</b>`,
    "",
    "សូមពិនិត្យការងារហួសកំណត់ និងរៀបចំអាទិភាពការងារថ្ងៃនេះ។",
    "សូមឱ្យថ្ងៃនេះជាថ្ងៃប្រកបដោយផលិតភាព! 💪"
  ].join("\n");
};

// =========================
// EVENING MESSAGE
// =========================

const buildEveningMessage = (tasks, today, tomorrow, user) => {
  // Tasks completed today
  const completed = tasks.filter(
    (task) =>
      Number(task.statuses_id) === COMPLETED_STATUS_ID &&
      toDateKey(task.updated_at) === today
  );

  // Tasks scheduled for today and not completed
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

  // Tasks scheduled for tomorrow
  const tomorrowTasks = tasks.filter(
    (task) =>
      toDateKey(task.schedule) === tomorrow &&
      isActiveTask(task)
  );

  // Date and user information
  const { khmerDate, englishDate } =
    getFormattedDates(today);

  const fullName = getUserFullName(user);

  return [
    `🌇 <b>សង្ខេបរបាយការណ៍ប្រចាំថ្ងៃ ${fullName} របស់អ្នក!</b>`,
    khmerDate,
    englishDate,
    "",
    `✅ <b>ភារកិច្ចដែលបានបញ្ចប់ថ្ងៃនេះ (${completed.length})</b>`,
    getTaskLines(
      completed,
      "មិនមានការងារណាមួយដែលបានបញ្ចប់នោះទេ!"
    ),
    "",
    `🔵 <b>ភារកិច្ចមិនទាន់បានចាប់ផ្ដើម (${notStarted.length})</b>`,
    getTaskLines(
      notStarted,
      "មិនមានភារកិច្ចដែលមិនទាន់ចាប់ផ្ដើមទេ!"
    ),
    "",
    `🟡 <b>ភារកិច្ចកំពុងធ្វើ (${inProgress.length})</b>`,
    getTaskLines(
      inProgress,
      "មិនមានភារកិច្ចកំពុងធ្វើទេ!"
    ),
    "",
    `📌 <b>ភារកិច្ចដែលអ្នកត្រូវធ្វើនៅថ្ងៃស្អែក (${tomorrowTasks.length})</b>`,
    getTaskLines(
      tomorrowTasks,
      "មិនមានភារកិច្ចដែលបានកំណត់សម្រាប់ថ្ងៃស្អែកទេ!"
    ),
    "",
    "សូមពិនិត្យលទ្ធផលការងារថ្ងៃនេះ និងត្រៀមខ្លួនសម្រាប់ថ្ងៃស្អែក។",
    "បន្តកែលម្អជារៀងរាល់ថ្ងៃ! 💪"
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
        ...dateKeys,
        user
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
