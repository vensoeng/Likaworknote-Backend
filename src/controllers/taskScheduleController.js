const path = require("path");
const TaskSchedule = require("../models/TaskSchedule");
const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");

const TASKSCHEDULE_FILE_PATH = process.env.TASKSCHEDULE_FILE_PATH || "src/db/taskSchedule.json";

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

exports.createTaskSchedule = async (req, res) => {
  try {
    const taskScheduleData = req.body || {};
    const { title, des, value } = taskScheduleData;

    // const taskScheduleList = await readJsonFile(TASKSCHEDULE_FILE_PATH, []);
    let taskScheduleList = await getOrSetCache("schedule_data", () => readJsonFile(TASKSCHEDULE_FILE_PATH,[]), 1800);

    const newTaskSchedule = new TaskSchedule({
      id: Date.now(),
      user_id: req.user?.id || null,
      title: title,
      des: des,
      value: value || "",
      created_at: new Date(),
      updated_at: new Date()
    });

    taskScheduleList.push(newTaskSchedule);
    
    await writeJsonFile(TASKSCHEDULE_FILE_PATH, taskScheduleList, `Task Schedule: created ${title || 'New Task Schedule demo'}`);

    clearCache('schedule_data');

    return res.status(201).json({ 
      success: true,
      message: "បង្កើត Task Schedule បានជោគជ័យ", 
      data: newTaskSchedule 
    });

  } catch (err) {
    console.error("CREATE_TASK_TYPE_ERROR:", err);
    return res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
};

exports.updateTaskSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const taskScheduleData = req.body || {};

    // const taskScheduleList = await readJsonFile(TASKSCHEDULE_FILE_PATH, []);
    let taskScheduleList = await getOrSetCache("schedule_data", () => readJsonFile(TASKSCHEDULE_FILE_PATH,[]), 1800);
    const taskScheduleIndex = taskScheduleList.findIndex(s => String(s.id) === String(id));

    if (taskScheduleIndex === -1) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ Task Schedule ដែលត្រូវកែប្រែឡើយ!" });
    }

    const oldTaskSchedule = taskScheduleList[taskScheduleIndex];

    const updatedTaskSchedule = {
      ...oldTaskSchedule,      
      ...taskScheduleData,        
      updated_at: new Date()
    };

    taskScheduleList[taskScheduleIndex] = updatedTaskSchedule;
    await writeJsonFile(TASKSCHEDULE_FILE_PATH, taskScheduleList, `Task Schedule: updated ${updatedTaskSchedule.title || id}`);

    clearCache("schedule_data");

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព Task Schedule បានជោគជ័យ",
      data: updatedTaskSchedule
    });

  } catch (err) {
    console.error("UPDATE_TASK_SCHEDULE_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.deleteTaskSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    // const taskScheduleList = await readJsonFile(TASKSCHEDULE_FILE_PATH, []);
    let taskScheduleList = await getOrSetCache("schedule_data", () => readJsonFile(TASKSCHEDULE_FILE_PATH,[]), 1800);
    const taskScheduleToDelete = taskScheduleList.find(s => String(s.id) === String(id));

    if (!taskScheduleToDelete) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ Task Schedule ដែលត្រូវលុបឡើយ!" });
    }

    const filteredTaskSchedules = taskScheduleList.filter(s => String(s.id) !== String(id));
    await writeJsonFile(TASKSCHEDULE_FILE_PATH, filteredTaskSchedules, `Task Schedule: deleted task type with ID ${id}`);

    clearCache('schedule_data');

    return res.status(200).json({
      success: true,
      message: "លុប Task Schedule បានជោគជ័យ"
    });

  } catch (err) {
    console.error("DELETE_TASK_SCHEDULE_ERROR:", err);
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

exports.getAllTaskSchedules = async (req, res) => {
  try {
    // let taskSchedules = await readJsonFile(TASKSCHEDULE_FILE_PATH, []);
    let taskSchedules = await getOrSetCache("schedule_data", () => readJsonFile(TASKSCHEDULE_FILE_PATH,[]), 1800);

    const { search, page, limit, random, user_id } = req.query;

    if (user_id) {
      taskSchedules = taskSchedules.filter(s => String(s.user_id) === String(user_id));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      taskSchedules = taskSchedules.filter(s => 
        (s.title && s.title.toLowerCase().includes(searchLower)) ||
        (s.title_kh && s.title_kh.toLowerCase().includes(searchLower)) ||
        (s.des && s.des.toLowerCase().includes(searchLower)) ||
        (s.description && s.description.toLowerCase().includes(searchLower))
      );
    }

    if (random === 'true') {
      taskSchedules = shuffleArray(taskSchedules);
    } else {
      taskSchedules.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    const formattedTaskSchedules = taskSchedules.map(s => ({
      ...s,
      created_at: formatBackendDate(s.created_at),
      updated_at: formatBackendDate(s.updated_at)
    }));

    const totalItems = formattedTaskSchedules.length;

    if (page || limit) {
      const currentPage = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedData = formattedTaskSchedules.slice(startIndex, endIndex);

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
      data: formattedTaskSchedules
    });

  } catch (err) {
    console.error("GET_ALL_TASK_TYPES_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getTaskScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    // const taskSchedules = await readJsonFile(TASKSCHEDULE_FILE_PATH, []);
    let taskSchedules = await getOrSetCache("schedule_data", () => readJsonFile(TASKSCHEDULE_FILE_PATH,[]), 1800);

    const taskSchedule = taskSchedules.find(s => String(s.id) === String(id));

    if (!taskSchedule) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ task Schedule នេះឡើយ" });
    }

    const formattedTaskSchedule = {
      ...taskSchedule,
      created_at: formatBackendDate(taskSchedule.created_at),
      updated_at: formatBackendDate(taskSchedule.updated_at)
    };

    return res.json({
      success: true,
      data: formattedTaskSchedule
    });
    
  } catch (err) {
    console.error("GET_TASK_TYPE_BY_ID_ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};