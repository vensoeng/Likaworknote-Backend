const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const UPLOADS_DIR = process.env.UPLOADS_DIR || "storage";
const User = require("../models/User");
const SECRET = process.env.JWT_SECRET;
const USERS_FILE_PATH = process.env.USERS_FILE_PATH || "data/portfolio/users.json";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readJsonFile, writeJsonFile, uploadBufferFile } = require("../utils/githubJsonStore");

const { compressToTargetSize } = require("../config/imageProcessor");
const makeImageName = (ext) => {
  return `${Date.now()}${ext}`;
};

const { createUserFiles } = require("../helper/userFileService");

const { getOrSetCache, clearCache } = require("../helper/cacheService");

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password required"
      });
    }

    // Read latest users data directly
    const users = await readJsonFile(USERS_FILE_PATH, []);

    // Check existing user
    const exist = users.find(
      u => u.email === email
    );

    if (exist) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Upload profile image
    let imageName = null;

    if (req.file?.buffer) {
      const processed = await compressToTargetSize(
        req.file.buffer,
        req.file.mimetype
      );

      imageName = makeImageName(processed.extension);

      const githubImagePath = `${UPLOADS_DIR}/${imageName}`;

      await uploadBufferFile(
        githubImagePath,
        processed.buffer,
        `uploads: create ${imageName}`
      );
    }

    // Create user
    const id = Date.now();

    const safeFirstName = firstName || "user";
    const safeLastName = lastName || "";

    const usernameToUse =
      `${safeFirstName.toLowerCase()}.${safeLastName.toLowerCase()}${id}`;

    const newUser = new User({
      id,
      username: usernameToUse,
      firstName,
      lastName,
      pr_img: imageName,
      gender: "",
      birthday: "",
      email,
      password: hash,
      role: 2,
      opt: null,
      telegram_id: null,
    });

    // Generate tokens
    const accessToken = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      },
      SECRET,
      { expiresIn: "30m" }
    );

    const refreshToken = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email
      },
      SECRET,
      { expiresIn: "7d" }
    );

    newUser.refreshToken = refreshToken;

    // 1. Create 4 empty JSON files for this user
    const userFiles = await createUserFiles(newUser.id);

    // 2. Add user to users.json
    users.push(newUser);

    await writeJsonFile(
      USERS_FILE_PATH,
      users,
      `users: register ${newUser.email}`
    );

    // 3. Clear cached users data
    clearCache("users_data");

    // Response
    return res.status(201).json({
      message: "User created",

      accessToken,
      refreshToken,

      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        pr_img: newUser.pr_img,
        gender: newUser.gender,
        birthday: newUser.birthday,
        role: newUser.role,
        telgram_id: newUser.telgram_id,
      },

      // Optional: useful for debugging
      filesCreated: Object.keys(userFiles)
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      message: "Server error"
    });
  }
};


exports.login = async (req, res) => {

  try {
    
    const email = String(req.body.email || "").trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password required" });
    }

    const findUser = (list) =>
      list.find((u) => String(u.email || "").trim().toLowerCase() === email);

    let users = await getOrSetCache("users_data", () => readJsonFile(USERS_FILE_PATH, []), 700);
    let user = findUser(users);

    // Not in cache → cache may be stale, read GitHub again
    if (!user) {
      clearCache("users_data");
      users = await getOrSetCache("users_data", () => readJsonFile(USERS_FILE_PATH, []), 700);
      user = findUser(users);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // compare password
    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(401).json({
        message: "Wrong password"
      });
    }

    // generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      SECRET,
      { expiresIn: "30m" }
    );

    // generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      SECRET,
      { expiresIn: "7d" }
    );

    // save refresh token to user
    user.refreshToken = refreshToken;
    await writeJsonFile(USERS_FILE_PATH, users, `users: login ${user.email}`);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        pr_img: user.pr_img,
        bio: user.bio,
        gender: user.gender,
        birthday: user.birthday,
        role: user.role,
        telegram_id: user.telegram_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (err) {

    res.status(500).json({
      message: "Server error"
    });

  }
};

exports.me = async (req, res) => {
  try {
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    // const users = await readJsonFile(USERS_FILE_PATH, []);
    let users = await getOrSetCache("users_data", () => readJsonFile(USERS_FILE_PATH, []), 700);

    const user = users.find((u) => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      pr_img: user.pr_img || null,
      bio: user.bio || "",
      gender: user.gender || "",
      birthday: user.birthday || "",
      role: user.role,
      telegram_id: user.telegram_id || null,
      created_at: user.created_at || null,
      updated_at: user.updated_at || null,
    };

    return res.status(200).json({
      message: "User data fetched successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("Error in /auth/me:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.dashboard = (req, res) => {
  try {
    res.json({
      message: "Dashboard access granted",
      user: req.user
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token required"
      });
    }

    // verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired refresh token"
      });
    }

    // const users = await readJsonFile(USERS_FILE_PATH, []);
    let users = await getOrSetCache("users_data", () => readJsonFile(USERS_FILE_PATH, []), 700);

    const user = users.find(u => u.id === decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        message: "Refresh token not found or invalid"
      });
    }

    // generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        pr_img: user.pr_img,
        bio: user.bio,
        gender: user.gender,
        birthday: user.birthday,
        telegram_id: user.telegram_id,
        created_at: user.created_at || null,
        updated_at: user.updated_at || null,
      },
      SECRET,
      { expiresIn: "30m" }
    );

    res.json({
      accessToken: newAccessToken,
      message: "Token refreshed successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

exports.updateMe = async (req, res) => {
  try {

    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userData = req.body || {};

    // Read users
    let users = await getOrSetCache(
      "users_data",
      () => readJsonFile(USERS_FILE_PATH, []),
      700
    );

    // Find current user
    const userIndex = users.findIndex(
      user => String(user.id) === String(currentUserId)
    );

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ User ឡើយ!"
      });
    }

    const oldUser = users[userIndex];

    const {
      firstName,
      lastName,
      username,
      password,
      telegram_id,
    } = userData;

    // Validate firstName
    if (firstName !== undefined) {
      if (typeof firstName !== "string" || !firstName.trim()) {
        return res.status(400).json({
          success: false,
          message: "First name is required!"
        });
      }

      oldUser.firstName = firstName.trim();
    }

    // Validate lastName
    if (lastName !== undefined) {
      if (typeof lastName !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid last name!"
        });
      }

      oldUser.lastName = lastName.trim();
    }

    // Validate username
    if (username !== undefined) {
      if (typeof username !== "string" || !username.trim()) {
        return res.status(400).json({
          success: false,
          message: "Username is required!"
        });
      }

      const cleanUsername = username.trim();

      // Check duplicate username (case-insensitive)
      const existUsername = users.find(
        user =>
          String(user.id) !== String(currentUserId) &&
          user.username?.toLowerCase() === cleanUsername.toLowerCase()
      );

      if (existUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already exists!"
        });
      }

      oldUser.username = cleanUsername;
    }

    // Validate and hash password
    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters!"
        });
      }

      oldUser.password = await bcrypt.hash(password, 10);
    }
    
    // Validate Telegram ID
    if (telegram_id !== undefined) {
      if (
        telegram_id !== null &&
        telegram_id !== '' &&
        (
          typeof telegram_id !== 'string' ||
          !/^-?\d+$/.test(telegram_id)
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Telegram ID មិនត្រឹមត្រូវទេ!"
        });
      }
      oldUser.telegram_id = telegram_id || null;
    }
    
    // Save updated user
    users[userIndex] = oldUser;

    await writeJsonFile(
      USERS_FILE_PATH,
      users,
      `users: update ${oldUser.username}`
    );

    // Clear cache
    clearCache("users_data");

    // Safe response data
    const updatedUser = {
      id: oldUser.id,
      email: oldUser.email,
      username: oldUser.username,
      firstName: oldUser.firstName,
      lastName: oldUser.lastName,
      pr_img: oldUser.pr_img,
      gender: oldUser.gender,
      birthday: oldUser.birthday,
      role: oldUser.role,

      telegram_id: oldUser.telegram_id,

      created_at: oldUser.created_at || null,
      updated_at: oldUser.updated_at || null,
    };

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព User បានជោគជ័យ",
      data: updatedUser
    });

  } catch (err) {
    console.error("UPDATE_ME_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { refreshToken } = req.body || {};

    // const users = await readJsonFile(USERS_FILE_PATH, []);
    let users = await getOrSetCache("users_data", () => readJsonFile(USERS_FILE_PATH, []), 700);
    
    let userIndex = -1;
    if (userId) {
      userIndex = users.findIndex(u => u.id === userId);
    } else if (refreshToken) {
      userIndex = users.findIndex(u => u.refreshToken === refreshToken);
    }

    if (userIndex !== -1) {
      users[userIndex].refreshToken = null;
      await writeJsonFile(USERS_FILE_PATH, users, `users: logout ${users[userIndex].email}`);
    }

    clearCache('users_data')
    
    return res.json({
      message: "Logged out successfully"
    });

  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({
      message: "Server error during logout"
    });
  }
};