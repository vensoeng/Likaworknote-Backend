const express = require("express");
const router = express.Router();

const { handleStart } = require("../services/telegramBotService");

router.post("/", async (req, res) => {
  try {
    const update = req.body;

    if (update.message?.text?.startsWith("/start")) {
      const telegramUser = update.message.from;
      const chatId = update.message.chat.id;

      res.status(200).json({ ok: true });

      await handleStart(telegramUser, chatId);

      return;
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("TELEGRAM_WEBHOOK_ERROR:", error);

    if (!res.headersSent) {
      return res.status(500).json({ ok: false });
    }
  }
});

module.exports = router;