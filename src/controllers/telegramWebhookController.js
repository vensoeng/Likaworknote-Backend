
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const router = express.Router();

const {
  handleStart,
  sendAnimation
} = require("../services/telegramBotService");

const getContactKeyboard = () => {
  const contactUrl = process.env.TELEGRAM_CONTACT_URL;

  return contactUrl
    ? {
        inline_keyboard: [[
          {
            text: "📞 Contact Support",
            url: contactUrl
          }
        ]]
      }
    : undefined;
};

router.post("/", async (req, res) => {
  const update = req.body;

  console.log("========== TELEGRAM WEBHOOK ==========");
  console.log("Update ID:", update?.update_id);
  console.log("Message:", update?.message?.text);
  console.log("Chat ID:", update?.message?.chat?.id);
  console.log("======================================");

  //Verify Telegram Webhook Secret
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const telegramSecret =
    req.headers["x-telegram-bot-api-secret-token"];

  const isAuthorized =
    Boolean(webhookSecret) &&
    telegramSecret === webhookSecret;

  if (!isAuthorized) {
    console.error("Webhook unauthorized");

    return res.status(401).json({
      ok: false,
      message: "Unauthorized"
    });
  }

  try {
    const message = update?.message;

    //Ignore updates without messages
    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const chatType = message.chat.type;
    const text = message.text?.trim() || "";

    // Only accept private chats
    if (chatType !== "private") {
      return res.status(200).json({ ok: true });
    }

    // Check /start command
    if (/^\/start(?:@\w+)?(?:\s+.*)?$/i.test(text)) {

      console.log("Processing /start for:", message.from?.id);

      // Send initial welcome animation
      try {
        await sendAnimation(
          chatId,
          [
            "👋 <b>សូមស្វាគមន៍មកកាន់ LikaWorkNote!</b>",
            "",
            "សូមរង់ចាំមួយភ្លែត យើងកំពុងរៀបចំបង្កើតគណនីជូនអ្នក។"
          ].join("\n"),
          "https://likaworknoteapi.vercel.app/assets/sorry_lika.gif",
        );

        console.log("Welcome animation sent successfully");

      } catch (welcomeError) {
        // Don't stop account processing if welcome GIF fails
        console.error(
          "WELCOME_ANIMATION_ERROR:",
          welcomeError.response?.data || welcomeError.message
        );
      }

      // Process account creation / existing account
      try {
        await handleStart(message.from, chatId);

        console.log("/start processed successfully");

      } catch (error) {
        console.error("START_COMMAND_ERROR:");
        console.error("Message:", error.message);
        console.error(
          "Telegram API:",
          error.response?.data
        );

        // Send error message with Sorry GIF
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
            getContactKeyboard()
          );

        } catch (sendError) {
          console.error(
            "TELEGRAM_ERROR_MESSAGE_FAILED:",
            sendError.response?.data || sendError.message
          );
        }
      }
    }

    // Acknowledge Telegram update
    return res.status(200).json({
      ok: true
    });

  } catch (error) {
    console.error("TELEGRAM_WEBHOOK_FAILED:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    return res.status(500).json({
      ok: false,
      message: "Webhook processing failed"
    });
  }
});

module.exports = router;
