
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const router = express.Router();

const { handleStart } = require("../services/telegramBotService");

router.post("/", async (req, res) => {
  const update = req.body;

  try {
    console.log("========== TELEGRAM WEBHOOK ==========");
    console.log("Update ID:", update?.update_id);
    console.log("Message:", update?.message?.text);
    console.log("Chat ID:", update?.message?.chat?.id);
    console.log("======================================");

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

    const message = update?.message;

    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const text = message.text?.trim() || "";

    if (/^\/start(?:@\w+)?(?:\s+.*)?$/i.test(text)) {
      console.log("Processing /start for:", message.from?.id);

      await handleStart(message.from, message.chat.id);

      console.log("/start processed successfully");
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("TELEGRAM WEBHOOK FAILED");

    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    console.error(
      "Telegram API Response:",
      error.response?.data
    );

    return res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

module.exports = router;
