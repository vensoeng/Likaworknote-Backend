const path = require("path");
const TaskReminder = require("../models/TaskReminder");
const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");

const TASK_REMINDER_FILE_PATH = process.env.TASK_REMINDER_FILE_PATH || "src/db/taskReminder.json";

const { getOrSetCache, clearCache } = require("../helper/cacheService");

const formatBackendDate = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }); 
};

exports.createTaskReminder = async (req, res) => {
  try {
    const taskReminderData = req.body || {};
    const { title, des, value } = taskReminderData;

    // const taskReminderList = await readJsonFile(TASK_REMINDER_FILE_PATH, []);
    let taskReminderList = await getOrSetCache("reminders_data", () => readJsonFile(TASK_REMINDER_FILE_PATH,[]), 1800);

    const newTaskReminder = new TaskReminder({
      id: Date.now(),
      user_id: req.user?.id || null,
      title: title,
      des: des,
      value: value || "",
      created_at: new Date(),
      updated_at: new Date()
    });

    taskReminderList.push(newTaskReminder);
    
    await writeJsonFile(TASK_REMINDER_FILE_PATH, taskReminderList, `Task Reminder: created ${title || 'New Task Reminder demo'}`);

    clearCache("reminders_data");
    
    return res.status(201).json({ 
      success: true,
      message: "បង្កើត Task Reminder បានជោគជ័យ", 
      data: newTaskReminder 
    });

  } catch (err) {
    console.error("CREATE_TASK_REMINDER_ERROR:", err);
    return res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
};

exports.updateTaskReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const taskReminderData = req.body || {};

    // const taskReminderList = await readJsonFile(TASK_REMINDER_FILE_PATH, []);
    let taskReminderList = await getOrSetCache("reminders_data", () => readJsonFile(TASK_REMINDER_FILE_PATH,[]), 1800);
    const taskReminderIndex = taskReminderList.findIndex(s => String(s.id) === String(id));

    if (taskReminderIndex === -1) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ Task Reminder ដែលត្រូវកែប្រែឡើយ!" });
    }

    const oldTaskReminder = taskReminderList[taskReminderIndex];

    const updatedTaskReminder = {
      ...oldTaskReminder,      
      ...taskReminderData,        
      updated_at: new Date()
    };

    taskReminderList[taskReminderIndex] = updatedTaskReminder;
    await writeJsonFile(TASK_REMINDER_FILE_PATH, taskReminderList, `Task Reminder: updated ${updatedTaskReminder.title || id}`);
    
    clearCache("reminders_data");

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព Task Reminder បានជោគជ័យ",
      data: updatedTaskReminder
    });

  } catch (err) {
    console.error("UPDATE_TASK_REMINDER_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.deleteTaskReminder = async (req, res) => {
  try {
    const { id } = req.params;
    // const taskReminderList = await readJsonFile(TASK_REMINDER_FILE_PATH, []);
    let taskReminderList = await getOrSetCache("reminders_data", () => readJsonFile(TASK_REMINDER_FILE_PATH,[]), 1800);

    const taskReminderToDelete = taskReminderList.find(s => String(s.id) === String(id));

    if (!taskReminderToDelete) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ Task reminder ដែលត្រូវលុបឡើយ!" });
    }

    const filteredTaskReminders = taskReminderList.filter(s => String(s.id) !== String(id));
    await writeJsonFile(TASK_REMINDER_FILE_PATH, filteredTaskReminders, `Task reminder: deleted task type with ID ${id}`);

    clearCache("reminders_data");

    return res.status(200).json({
      success: true,
      message: "លុប Task reminder បានជោគជ័យ"
    });

  } catch (err) {
    console.error("DELETE_TASK_REMINDER_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

exports.getAllTaskReminders = async (req, res) => {
  try {
    // let taskReminders = await readJsonFile(TASK_REMINDER_FILE_PATH, []);
    let taskReminders = await getOrSetCache("reminders_data", () => readJsonFile(TASK_REMINDER_FILE_PATH,[]), 1800);

    const { search, page, limit, random, user_id } = req.query;

    if (user_id) {
      taskReminders = taskReminders.filter(s => String(s.user_id) === String(user_id));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      taskReminders = taskReminders.filter(s => 
        (s.title && s.title.toLowerCase().includes(searchLower)) ||
        (s.title_kh && s.title_kh.toLowerCase().includes(searchLower)) ||
        (s.des && s.des.toLowerCase().includes(searchLower)) ||
        (s.description && s.description.toLowerCase().includes(searchLower))
      );
    }

    if (random === 'true') {
      taskReminders = shuffleArray(taskReminders);
    } else {
      taskReminders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    const formattedTaskReminders = taskReminders.map(s => ({
      ...s,
      created_at: formatBackendDate(s.created_at),
      updated_at: formatBackendDate(s.updated_at)
    }));

    const totalItems = formattedTaskReminders.length;

    if (page || limit) {
      const currentPage = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedData = formattedTaskReminders.slice(startIndex, endIndex);

      return res.json({
        success: true,
        meta: {
          total_items: totalItems,
          current_page: currentPage,
          limit: pageSize,
          total_pages: Math.ceil(totalItems / pageSize)
        },
        data: paginatedData
      });
    }

    return res.json({
      success: true,
      total: totalItems,
      data: formattedTaskReminders
    });

  } catch (err) {
    console.error("GET_ALL_TASK_REMIDERS_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getTaskReminderById = async (req, res) => {
  try {
    const { id } = req.params;
    // const taskReminders = await readJsonFile(TASK_REMINDER_FILE_PATH, []);
    let taskReminders = await getOrSetCache("reminders_data", () => readJsonFile(TASK_REMINDER_FILE_PATH,[]), 1800);
    const taskReminder = taskReminders.find(s => String(s.id) === String(id));

    if (!taskReminder) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ task Reminder នេះឡើយ" });
    }

    const formattedTaskReminder = {
      ...taskReminder,
      created_at: formatBackendDate(taskReminder.created_at),
      updated_at: formatBackendDate(taskReminder.updated_at)
    };

    return res.json({
      success: true,
      data: formattedTaskReminder
    });
    
  } catch (err) {
    console.error("GET_TASK_REMINDER_BY_ID_ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};