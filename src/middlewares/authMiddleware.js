const dotenv = require("dotenv");
dotenv.config();
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No access token provided"
      });
    }

    const tokenParts = authHeader.split(" ");
    const token = tokenParts.length === 2 ? tokenParts[1] : tokenParts[0];

    const decoded = jwt.verify(token, SECRET);

    req.user = decoded;

    next();

  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired access token!"
    });
  }
};