
const dotenv = require("dotenv");
dotenv.config();

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const User = require("../models/User");

const {
  readJsonFile,
  writeJsonFile
} = require("../utils/githubJsonStore");

const { clearCache } = require("../helper/cacheService");
const { createUserFiles } = require("../helper/userFileService");

const USERS_FILE_PATH =
  process.env.USERS_FILE_PATH || "data/portfolio/users.json";

const MAX_USERS = Number(process.env.TELEGRAM_MAX_USERS || 25);

const getBotUrl = () =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;


//for sand message with gif Image 
const sendAnimation = async (
  chatId,
  caption,
  imageUrl,
  replyMarkup = undefined
) => {
  if (!imageUrl) {
    throw new Error("Animation URL is missing");
  }

  const response = await axios.post(
    `${getBotUrl()}/sendAnimation`,
    {
      chat_id: chatId,
      animation: imageUrl,
      caption,
      parse_mode: "HTML",
      ...(replyMarkup
        ? { reply_markup: replyMarkup }
        : {})
    }
  );

  return response.data;
};

const sendMessage = async (chatId, text, replyMarkup = undefined) => {
  const response = await axios.post(`${getBotUrl()}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {})
  });

  return response.data;
};

const getMiniAppKeyboard = () => {
  const buttons = [];

  const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL;

  if (miniAppUrl && miniAppUrl.startsWith("https://")) {
    buttons.push([
      {
        text: "🚀 Open LikaWorkNote",
        web_app: { url: miniAppUrl }
      }
    ]);
  }

  const contactUrl = process.env.TELEGRAM_CONTACT_URL;

  if (contactUrl) {
    buttons.push([
      {
        text: "📞 Contact Support",
        url: contactUrl
      }
    ]);
  }

  return buttons.length ? { inline_keyboard: buttons } : undefined;
};

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

const createTemporaryPassword = () =>
  crypto.randomBytes(12).toString("base64url");

const makeUsername = (firstName, lastName, id, users) => {
  const base = `${firstName}.${lastName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.]/g, "")
    .replace(/^\.+|\.+$/g, "") || "user";

  let username = `${base}${id}`;
  let suffix = 1;

  while (
    users.some(
      (u) => String(u.username).toLowerCase() === username.toLowerCase()
    )
  ) {
    username = `${base}${id}${suffix++}`;
  }

  return username;
};

const makeEmail = (users) => {
  const prefix = "likaworknote.user";
  let count = users.filter((u) => Number(u.role) === 2).length + 1;
  let email = `${prefix}${count}@gmail.com`;

  // Avoid reusing an email that already exists in users.json.
  while (
    users.some(
      (u) => String(u.email).toLowerCase() === email.toLowerCase()
    )
  ) {
    count++;
    email = `${prefix}${count}@gmail.com`;
  }

  return email;
};

const findTelegramUser = (users, telegramId) =>
  users.find(
    (u) => String(u.telegram_id || "") === String(telegramId)
  );

const buildExistingUserMessage = (user) => {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return [
    "👋 <b>សូមស្វាគមន៍មកកាន់ LikaWorkNote!</b>",
    "",
    "យើងបានរកឃើញថាអ្នកបានបង្កើតគណនីពីមុនរួចហើយ។",
    "",
    `👤 ឈ្មោះ៖ ${escapeHtml(name || "មិនមាន")}`,
    `🆔 Username៖ ${escapeHtml(user.username || "មិនមាន")}`,
    `📧 Email៖ ${escapeHtml(user.email || "មិនមាន")}`,
    "",
    "តើនេះជាគណនីរបស់អ្នកមែនទេ?",
    "",
    "ប្រសិនបើភ្លេចពាក្យសម្ងាត់ សូមទាក់ទង Support ដើម្បីសង្គ្រោះគណនី។"
  ].join("\n");
};

const buildSuccessMessage = (user, temporaryPassword) => {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  const createdDate = new Date(user.created_at).toLocaleDateString(
    "en-GB",
    { timeZone: "Asia/Phnom_Penh" }
  );

  const guideUrl = process.env.TELEGRAM_GUIDE_URL;
  const websiteUrl = process.env.TELEGRAM_WEBSITE_URL;

  return [
    "🎉 <b>សូមស្វាគមន៍មកកាន់ LikaWorkNote!</b>",
    "",
    "គណនីរបស់អ្នកត្រូវបានបង្កើតដោយជោគជ័យ។",
    "\n",
    `ឈ្មោះ៖ ${escapeHtml(name)}`,
    `Username៖ ${escapeHtml(user.username)}`,
    `Email៖ <code>${escapeHtml(user.email)}</code>`,
    `Temporary Password៖ <code>${escapeHtml(temporaryPassword)}</code>`,
    `ថ្ងៃបង្កើត៖ ${createdDate}`,
    "\n",
    "⚠️ <b>សូមរក្សាពាក្យសម្ងាត់នេះជាសម្ងាត់។</b>",
    "សូម Login ហើយចូលទៅកាន់ ការកំណត់ → ផ្លាស់ប្ដូរពាក្យសម្ងាត់ ដើម្បីកំណត់ពាក្យសម្ងាត់ថ្មី។",
    "",
    guideUrl
      ? `📖 របៀបប្រើប្រាស់៖ ${escapeHtml(guideUrl)}`
      : "",
    websiteUrl
      ? `🌐 គេហទំព័រ៖ ${escapeHtml(websiteUrl)}`
      : "",
    "\n",
    "ចុចប៊ូតុងខាងក្រោមដើម្បីបើកកម្មវិធី។"
  ].filter(Boolean).join("\n");
};

const handleStart = async (telegramUser, chatId) => {
  if (!telegramUser?.id) {
    throw new Error("Telegram user ID is missing");
  }

  // Always read GitHub directly for account creation decisions.
  const users = await readJsonFile(USERS_FILE_PATH, []);

  // Existing account check comes before the user limit.
  const existingUser = findTelegramUser(users, telegramUser.id);

  if (existingUser) {
    const message = buildExistingUserMessage(existingUser);
    await sendAnimation(
        chatId,
        message,
        "https://likaworknoteapi.vercel.app/assets/welcome_lika.gif",
        getMiniAppKeyboard()
    );
    return { status: "existing_user" };
  }

  // Count only normal users (role 2).
  const normalUsers = users.filter(
    (u) => Number(u.role) === 2
  );

  if (normalUsers.length >= MAX_USERS) {
    const contactUrl = process.env.TELEGRAM_CONTACT_URL;

    const keyboard = contactUrl
      ? {
          inline_keyboard: [[
            { text: "📞 Contact Support", url: contactUrl }
          ]]
        }
      : undefined;

    await sendAnimation(
        chatId,
        [
            "សូមអភ័យទោសផង! 🙏",
            "",
            `សម្រាប់កំណែដំបូង LikaWorkNote បង្កើតឡើងសម្រាប់អ្នកប្រើប្រាស់ ${MAX_USERS} នាក់ចុះក្រោមប៉ុណ្ណោះ។`,
            "",
            "បច្ចុប្បន្នមានអ្នកប្រើប្រាស់គ្រប់ចំនួនហើយ។",
            "សូមទាក់ទងមកកាន់យើងខ្ញុំ ដើម្បីដោះស្រាយ។"
        ].join("\n"),
        "https://likaworknoteapi.vercel.app/assets/sorry_lika.gif",
        keyboard
    );

    return { status: "limit_reached" };
  }

  // Prepare new account.
  const id = Date.now();

  const firstName = String(telegramUser.first_name || "User").trim();
  const lastName = String(telegramUser.last_name || "").trim();

  const username = makeUsername(firstName, lastName, id, users);
  const email = makeEmail(users);
  const temporaryPassword = createTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const now = new Date().toISOString();

  const newUser = new User({
    id,
    username,
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role: 2,
    telegram_id: String(telegramUser.id),
    must_change_password: true,
    created_at: now,
    updated_at: now
  });

  // Create user's JSON files.
  await createUserFiles(newUser.id);

  // 5. Save user.
  users.push(newUser);

  await writeJsonFile(
    USERS_FILE_PATH,
    users,
    `telegram: create user ${newUser.email}`
  );

    // Clear shared user cache after successful write.
    await clearCache("users_data");

    // Send after account has been saved.
    await sendAnimation(
        chatId,
        buildSuccessMessage(newUser, temporaryPassword),
        "https://likaworknoteapi.vercel.app/assets/success_lika.gif",
        getMiniAppKeyboard()
    );

  return { status: "created", userId: newUser.id };
};

module.exports = {
  handleStart,
  sendMessage,
  sendAnimation
};
