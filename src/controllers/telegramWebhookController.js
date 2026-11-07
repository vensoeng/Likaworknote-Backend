
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const router = express.Router();

const { handleStart } = require("../services/telegramBotService");

router.post("/", async (req, res) => {
  try {
    const secret = req.headers["x-telegram-bot-api-secret-token"];

    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized"
      });
    }

    const update = req.body;

    if (update.message?.text?.startsWith("/start")) {
      await handleStart(
        update.message.from,
        update.message.chat.id
      );
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("TELEGRAM_WEBHOOK_ERROR:", error);

    return res.status(500).json({ ok: false });
  }
});

module.exports = router;