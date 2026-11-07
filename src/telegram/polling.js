
const dotenv = require("dotenv");
dotenv.config();

const axios = require("axios");

const {
  handleStart,
  sendMessage,
  sendAnimation
} = require("../services/telegramBotService");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is missing in .env");
}

const API_URL = `https://api.telegram.org/bot${TOKEN}`;

let offset = 0;
let isRunning = true;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const poll = async () => {
  console.log("🤖 LikaWorkNote Telegram Bot is starting...");

  while (isRunning) {
    try {
      const response = await axios.get(`${API_URL}/getUpdates`, {
        params: {
          offset,
          timeout: 30,
          allowed_updates: ["message"]
        },
        timeout: 35000
      });

      const updates = response.data.result || [];

      for (const update of updates) {
        // Move offset forward after receiving this update.
        offset = update.update_id + 1;

        const message = update.message;

        if (!message?.text) continue;

        const chatId = message.chat.id;
        const chatType = message.chat.type;
        const text = message.text.trim();

        // Only accept commands from private chats.
        if (chatType !== "private") continue;

        if (/^\/start(?:@\w+)?(?:\s+.*)?$/i.test(text)) {
          try {
            // Initial processing message.
            await sendAnimation(
                chatId,
                [
                    "👋 សូមស្វាគមន៍មកកាន់ LikaWorkNote!",
                    "",
                    "សូមរង់ចាំមួយភ្លែត យើងកំពុងរៀបចំបង្កើតគណនីជូនអ្នក។"
                ].join("\n")
            );

            await handleStart(message.from, chatId);

          } catch (error) {
            console.error("START_COMMAND_ERROR:", error.response?.data || error);

            try {
                await sendAnimation(
                    chatId,
                    [
                        "LikaWorkNote សូមអភ័យទោសផង! 🙏",
                        "",
                        "យើងមិនអាចបង្កើតគណនីជូនអ្នកបានទេ។",
                        "សូមចុច /start ដើម្បីព្យាយាមម្ដងទៀត។",
                        "",
                        "បើបញ្ហានៅតែបន្ត សូមទាក់ទង Support។"
                    ].join("\n"),
                    "https://likaworknoteapi.vercel.app/assets/sorry_lika.gif",
                    process.env.TELEGRAM_CONTACT_URL
                    ? {
                        inline_keyboard: [[
                            {
                            text: "📞 Contact Support",
                            url: process.env.TELEGRAM_CONTACT_URL
                            }
                        ]]
                        }
                    : undefined
                );
            } catch (sendError) {
              console.error(
                "TELEGRAM_ERROR_MESSAGE_FAILED:",
                sendError.response?.data || sendError.message
              );
            }
          }
        }
      }

    } catch (error) {
      console.error(
        "TELEGRAM_POLLING_ERROR:",
        error.response?.data || error.message
      );

      // Avoid a tight retry loop when Telegram is unavailable.
      await sleep(3000);
    }
  }
};

process.on("SIGINT", () => {
  console.log("\nStopping Telegram Bot...");
  isRunning = false;
  process.exit(0);
});

poll();
