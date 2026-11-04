const {
    sendMorningReminders,
    sendEveningSummaries
} = require("../services/taskNotificationService");

const sendMorning = async (req, res) => {
    try {
        const result = await sendMorningReminders();

        return res.status(200).json({
            success: true,
            message: "Morning notifications processed",
            data: result
        });
    } catch (error) {
        console.error("Morning Cron Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send morning notifications"
        });
    }
};

const sendEvening = async (req, res) => {
    try {
        const result = await sendEveningSummaries();

        return res.status(200).json({
            success: true,
            message: "Evening notifications processed",
            data: result
        });
    } catch (error) {
        console.error("Evening Cron Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send evening notifications"
        });
    }
};

module.exports = {
    sendMorning,
    sendEvening
};