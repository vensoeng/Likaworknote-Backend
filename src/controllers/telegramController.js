// const path = require("path");
// const Telegram = require("../models/Telegram");
// const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");
// const {getOrSetCache, clearCache} = require("../helper/cacheService");

// const TELEGRAM_FILE_PATH = process.env.TELEGRAM_FILE_PATH || "src/db/telegram.json";

// const formatBackendDate = (dateInput) => {
//   if (!dateInput) return '-';
//   const d = new Date(dateInput);
//   if (isNaN(d.getTime())) return '-';
//   return d.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric'
//   }); 
// };

// exports.createTelegram = async (req, res) => {
//   try {
//     const telegramData = req.body || {};
//     const { title, des, telegram_id } = telegramData;

//     // const telegramList = await readJsonFile(TELEGRAM_FILE_PATH, []);
//     let telegramList  = await getOrSetCache("telegrams_data", () => readJsonFile(TELEGRAM_FILE_PATH,[]), 1800);

//     const newTelegram = new Telegram({
//       id: Date.now(),
//       user_id: req.user?.id || null,
//       title: title,
//       des: des,
//       telegram_id: telegram_id || "",
//       created_at: new Date(),
//       updated_at: new Date()
//     });

//     telegramList.push(newTelegram);
    
//     await writeJsonFile(TELEGRAM_FILE_PATH, telegramList, `Telegram: created ${title || 'New Telegram demo'}`);

//     clearCache('telegrams_data');

//     return res.status(201).json({ 
//       success: true,
//       message: "បង្កើត Telegram បានជោគជ័យ", 
//       data: newTelegram 
//     });

//   } catch (err) {
//     console.error("CREATE_TASK_TYPE_ERROR:", err);
//     return res.status(500).json({ 
//       success: false,
//       message: "Server error", 
//       error: err.message 
//     });
//   }
// };

// exports.updateTelegram = async (req, res) => {
//   try {
//     const currentUserId = req.user?.id;

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const { id } = req.params;
//     const telegramData = req.body || {};

//     // const telegramList = await readJsonFile(TELEGRAM_FILE_PATH, []);
//     let telegramList  = await getOrSetCache("telegrams_data", () => readJsonFile(TELEGRAM_FILE_PATH,[]), 1800);
//     const telegramIndex = telegramList.findIndex(s => String(s.id) === String(id));

//     if (telegramIndex === -1) {
//       return res.status(404).json({ success: false, message: "រកមិនឃើញ Telegram ដែលត្រូវកែប្រែឡើយ!" });
//     }

//     const oldtelegram = telegramList[telegramIndex];

//     const isOwner =
//       String(oldtelegram.user_id) ===
//       String(currentUserId);


//     if (!isOwner) {
//       return res.status(403).json({
//         success: false,
//         message: "អ្នកមិនមានសិទ្ធិកែប្រែ Telegram នេះទេ!",
//       });
//     }

//     const updatedtelegram = {
//       ...oldtelegram,      
//       ...telegramData,        
//       updated_at: new Date()
//     };

//     telegramList[telegramIndex] = updatedtelegram;
//     await writeJsonFile(TELEGRAM_FILE_PATH, telegramList, `Telegram: updated ${updatedtelegram.title || id}`);

//     clearCache('telegrams_data');

//     return res.status(200).json({
//       success: true,
//       message: "ធ្វើបច្ចុប្បន្នភាព Telegram បានជោគជ័យ",
//       data: updatedtelegram
//     });

//   } catch (err) {
//     console.error("UPDATE_TELEGRAM_ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message
//     });
//   }
// };

// exports.deleteTelegram = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const currentUserId = req.user?.id;

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     // const telegramList = await readJsonFile(TELEGRAM_FILE_PATH, []);
//     let telegramList  = await getOrSetCache("telegrams_data", () => readJsonFile(TELEGRAM_FILE_PATH,[]), 1800);

//     const telegramToDelete = telegramList.find(s => String(s.id) === String(id));

//     if (!telegramToDelete) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "រកមិនឃើញ Telegram ដែលត្រូវលុបឡើយ!" 
//       });
//     }
//     // =========================
//     // CHECK DATA OWNERSHIP
//     // =========================
//     const isOwner = String(telegramToDelete.user_id) === String(currentUserId);

//     if (!isOwner) {
//       return res.status(403).json({
//         success: false,
//         message: "អ្នកមិនមានសិទ្ធិលុប Telegram នេះទេ!",
//       });
//     }

//     const filteredTelegrams = telegramList.filter(s => String(s.id) !== String(id));
//     await writeJsonFile(TELEGRAM_FILE_PATH, filteredTelegrams, `Telegram: deleted with ID ${id}`);

//     clearCache('telegrams_data');

//     return res.status(200).json({
//       success: true,
//       message: "លុប Telegram បានជោគជ័យ"
//     });

//   } catch (err) {
//     console.error("DELETE_TELEGRAM_ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message
//     });
//   }
// };

// const shuffleArray = (array) => {
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]];
//   }
//   return array;
// };

// exports.getAllTelegrams = async (req, res) => {
//   try {
//     const currentUserId = req.user?.id;
//     const currentUserRole = Number(req.user?.role);

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     // let telegrams = await readJsonFile(TELEGRAM_FILE_PATH, []);
//     let telegrams  = await getOrSetCache("telegrams_data", () => readJsonFile(TELEGRAM_FILE_PATH,[]), 1800);
//     // Super Admin
//     if (currentUserRole === 1) {
      
//     }
//     else {
//       telegrams = telegrams.filter(
//         (item) =>
//           String(item.user_id) === String(currentUserId)
//       );
//     }
    
//     const { search, page, limit, random, user_id } = req.query;

//     if (user_id) {
//       telegrams = telegrams.filter(s => String(s.user_id) === String(user_id));
//     }

//     if (search) {
//       const searchLower = search.toLowerCase();
//       telegrams = telegrams.filter(s => 
//         (s.title && s.title.toLowerCase().includes(searchLower)) ||
//         (s.title_kh && s.title_kh.toLowerCase().includes(searchLower)) ||
//         (s.des && s.des.toLowerCase().includes(searchLower)) ||
//         (s.description && s.description.toLowerCase().includes(searchLower))
//       );
//     }

//     if (random === 'true') {
//       telegrams = shuffleArray(telegrams);
//     } else {
//       telegrams.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
//     }

//     const formattedtelegrams = telegrams.map(s => ({
//       ...s,
//       created_at: formatBackendDate(s.created_at),
//       updated_at: formatBackendDate(s.updated_at)
//     }));

//     const totalItems = formattedtelegrams.length;

//     if (page || limit) {
//       const currentPage = parseInt(page) || 1;
//       const pageSize = parseInt(limit) || 10;
//       const startIndex = (currentPage - 1) * pageSize;
//       const endIndex = startIndex + pageSize;

//       const paginatedData = formattedtelegrams.slice(startIndex, endIndex);

//       return res.json({
//         success: true,
//         meta: {
//           total_items: totalItems,
//           current_page: currentPage,
//           limit: pageSize,
//           total_pages: Math.ceil(totalItems / pageSize)
//         },
//         data: paginatedData
//       });
//     }

//     return res.json({
//       success: true,
//       total: totalItems,
//       data: formattedtelegrams
//     });

//   } catch (err) {
//     console.error("GET_ALL_TASK_TYPES_ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message
//     });
//   }
// };

// exports.getTelegramById = async (req, res) => {
//   try {

//     const currentUserId = req.user?.id;

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const { id } = req.params;
//     // const telegrams = await readJsonFile(TELEGRAM_FILE_PATH, []);
//     let telegrams  = await getOrSetCache("telegrams_data", () => readJsonFile(TELEGRAM_FILE_PATH,[]), 1800);
//     const telegram = telegrams.find((s) => String(s.id) === String(id) &&  String(s.user_id) === String(currentUserId));

//     if (!telegram) {
//       return res.status(404).json({ success: false, message: "រកមិនឃើញ Telegram នេះឡើយ" });
//     }

//     const formattedtelegram = {
//       ...telegram,
//       created_at: formatBackendDate(telegram.created_at),
//       updated_at: formatBackendDate(telegram.updated_at)
//     };

//     return res.json({
//       success: true,
//       data: formattedtelegram
//     });
    
//   } catch (err) {
//     console.error("GET_TASK_TYPE_BY_ID_ERROR:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };



const Telegram = require("../models/Telegram");
const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");
const { getOrSetCache, clearCache } = require("../helper/cacheService");
const { getUserFilePaths } = require("../helper/userFileService");

const formatBackendDate = (dateInput) => {
  if (!dateInput) return "-";

  const d = new Date(dateInput);

  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// =========================
// USER TELEGRAM STORAGE
// =========================

const getTelegramStorage = (userId) => {
  const userFiles = getUserFilePaths(userId);

  return {
    filePath: userFiles.telegram,
    cacheKey: `telegrams_${userId}`,
  };
};

const getUserTelegrams = async (userId) => {
  const { filePath, cacheKey } = getTelegramStorage(userId);

  return await getOrSetCache(
    cacheKey,
    () => readJsonFile(filePath, []),
    1800
  );
};

const saveUserTelegrams = async (userId, telegrams, message) => {
  const { filePath, cacheKey } = getTelegramStorage(userId);

  await writeJsonFile(filePath, telegrams, message);
  clearCache(cacheKey);
};

// =========================
// CREATE TELEGRAM
// =========================

exports.createTelegram = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const telegramData = req.body || {};
    const { title, des, telegram_id } = telegramData;

    const telegramList = await getUserTelegrams(currentUserId);

    const newTelegram = new Telegram({
      id: Date.now(),
      user_id: currentUserId,
      title,
      des,
      telegram_id: telegram_id || "",
      created_at: new Date(),
      updated_at: new Date(),
    });

    telegramList.push(newTelegram);

    await saveUserTelegrams(
      currentUserId,
      telegramList,
      `Telegram: created ${title || "New Telegram demo"}`
    );

    return res.status(201).json({
      success: true,
      message: "បង្កើត Telegram បានជោគជ័យ",
      data: newTelegram,
    });

  } catch (err) {
    console.error("CREATE_TELEGRAM_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =========================
// UPDATE TELEGRAM
// =========================

exports.updateTelegram = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const telegramData = req.body || {};

    const telegramList = await getUserTelegrams(currentUserId);

    const telegramIndex = telegramList.findIndex(
      (item) => String(item.id) === String(id)
    );

    if (telegramIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Telegram ដែលត្រូវកែប្រែឡើយ!",
      });
    }

    const oldTelegram = telegramList[telegramIndex];

    const updatedTelegram = {
      ...oldTelegram,
      ...telegramData,
      id: oldTelegram.id,
      user_id: currentUserId,
      updated_at: new Date(),
    };

    telegramList[telegramIndex] = updatedTelegram;

    await saveUserTelegrams(
      currentUserId,
      telegramList,
      `Telegram: updated ${updatedTelegram.title || id}`
    );

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព Telegram បានជោគជ័យ",
      data: updatedTelegram,
    });

  } catch (err) {
    console.error("UPDATE_TELEGRAM_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =========================
// DELETE TELEGRAM
// =========================

exports.deleteTelegram = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const telegramList = await getUserTelegrams(currentUserId);

    const telegramToDelete = telegramList.find(
      (item) => String(item.id) === String(id)
    );

    if (!telegramToDelete) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Telegram ដែលត្រូវលុបឡើយ!",
      });
    }

    const filteredTelegrams = telegramList.filter(
      (item) => String(item.id) !== String(id)
    );

    await saveUserTelegrams(
      currentUserId,
      filteredTelegrams,
      `Telegram: deleted with ID ${id}`
    );

    return res.status(200).json({
      success: true,
      message: "លុប Telegram បានជោគជ័យ",
    });

  } catch (err) {
    console.error("DELETE_TELEGRAM_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =========================
// SHUFFLE ARRAY
// =========================

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

// =========================
// GET ALL TELEGRAMS
// =========================

exports.getAllTelegrams = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let telegrams = await getUserTelegrams(currentUserId);

    const { search, page, limit, random } = req.query;

    if (search) {
      const searchLower = search.toLowerCase();

      telegrams = telegrams.filter((item) =>
        (item.title && item.title.toLowerCase().includes(searchLower)) ||
        (item.title_kh && item.title_kh.toLowerCase().includes(searchLower)) ||
        (item.des && item.des.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    if (random === "true") {
      telegrams = shuffleArray([...telegrams]);
    } else {
      telegrams.sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
    }

    const formattedTelegrams = telegrams.map((item) => ({
      ...item,
      created_at: formatBackendDate(item.created_at),
      updated_at: formatBackendDate(item.updated_at),
    }));

    const totalItems = formattedTelegrams.length;

    if (page || limit) {
      const currentPage = Math.max(parseInt(page) || 1, 1);
      const pageSize = Math.max(parseInt(limit) || 10, 1);

      const startIndex = (currentPage - 1) * pageSize;
      const paginatedData = formattedTelegrams.slice(
        startIndex,
        startIndex + pageSize
      );

      return res.json({
        success: true,
        meta: {
          total_items: totalItems,
          current_page: currentPage,
          limit: pageSize,
          total_pages: Math.ceil(totalItems / pageSize),
        },
        data: paginatedData,
      });
    }

    return res.json({
      success: true,
      total: totalItems,
      data: formattedTelegrams,
    });

  } catch (err) {
    console.error("GET_ALL_TELEGRAMS_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =========================
// GET TELEGRAM BY ID
// =========================

exports.getTelegramById = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const telegrams = await getUserTelegrams(currentUserId);

    const telegram = telegrams.find(
      (item) => String(item.id) === String(id)
    );

    if (!telegram) {
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញ Telegram នេះឡើយ",
      });
    }

    const formattedTelegram = {
      ...telegram,
      created_at: formatBackendDate(telegram.created_at),
      updated_at: formatBackendDate(telegram.updated_at),
    };

    return res.json({
      success: true,
      data: formattedTelegram,
    });

  } catch (err) {
    console.error("GET_TELEGRAM_BY_ID_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
