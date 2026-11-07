
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const router = express.Router();

const { handleStart } = require("../services/telegramBotService");

router.post("/", async (req, res) => {
  try {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    const telegramSecret =
      req.headers["x-telegram-bot-api-secret-token"];

    const authorization = req.headers.authorization || "";

    const bearerToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    const isAuthorized =
      webhookSecret &&
      (
        telegramSecret === webhookSecret ||
        bearerToken === webhookSecret
      );

    if (!isAuthorized) {
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

    return res.status(200).json({
      ok: true
    });

  } catch (error) {
    console.error(
      "TELEGRAM_WEBHOOK_ERROR:",
      error.stack || error
    );

    return res.status(500).json({
      ok: false,
      message: "Webhook processing failed"
    });
  }
});

module.exports = router;
