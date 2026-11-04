const crypto = require("crypto");

const verifyCronSecret = (req, res, next) => {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        console.error("CRON_SECRET is not configured");

        return res.status(500).json({
            success: false,
            message: "Cron authentication is not configured"
        });
    }

    const authorization = req.headers.authorization || "";
    const expected = `Bearer ${secret}`;

    const providedBuffer = Buffer.from(authorization);
    const expectedBuffer = Buffer.from(expected);

    if (
        providedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    next();
};

module.exports = verifyCronSecret;