const path = require("path");
const TaskStatus = require("../models/TaskStatus");
const { readJsonFile, writeJsonFile } = require("../utils/githubJsonStore");
const {getOrSetCache, clearCache} = require("../helper/cacheService");

const TASKSTATUS_FILE_PATH = process.env.TASKSTATUS_FILE_PATH || "src/db/taskStatus.json";

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

exports.createTaskStatus = async (req, res) => {
  try {
    const taskStatusData = req.body || {};
    const { title, des, value } = taskStatusData;

    // const taskStatusList = await readJsonFile(TASKSTATUS_FILE_PATH, []);
    let taskStatusList  = await getOrSetCache("statuss_data", () => readJsonFile(TASKSTATUS_FILE_PATH,[]), 1800);

    const newTaskStatus = new TaskStatus({
      id: Date.now(),
      user_id: req.user?.id || null,
      title: title,
      des: des,
      value: value || "",
      created_at: new Date(),
      updated_at: new Date()
    });

    taskStatusList.push(newTaskStatus);
    
    await writeJsonFile(TASKSTATUS_FILE_PATH, taskStatusList, `Task Status: created ${title || 'New Task Status demo'}`);

    clearCache('statuss_data')

    return res.status(201).json({ 
      success: true,
      message: "បង្កើត Task Status បានជោគជ័យ", 
      data: newTaskStatus 
    });

  } catch (err) {
    console.error("CREATE_TASK_STATUS_ERROR:", err);
    return res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const taskStatusData = req.body || {};

    // const taskStatusList = await readJsonFile(TASKSTATUS_FILE_PATH, []);
    let taskStatusList = await getOrSetCache("statuss_data", () => readJsonFile(TASKSTATUS_FILE_PATH,[]));

    const taskStatusIndex = taskStatusList.findIndex(s => String(s.id) === String(id));

    if (taskStatusIndex === -1) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ Task Status ដែលត្រូវកែប្រែឡើយ!" });
    }

    const oldTaskStatus = taskStatusList[taskStatusIndex];

    const updatedTaskStatus = {
      ...oldTaskStatus,      
      ...taskStatusData,        
      updated_at: new Date()
    };

    taskStatusList[taskStatusIndex] = updatedTaskStatus;
    await writeJsonFile(TASKSTATUS_FILE_PATH, taskStatusList, `Task Status: updated ${updatedTaskStatus.title || id}`);

    clearCache('statuss_data')

    return res.status(200).json({
      success: true,
      message: "ធ្វើបច្ចុប្បន្នភាព Task Status បានជោគជ័យ",
      data: updatedTaskStatus
    });

  } catch (err) {
    console.error("UPDATE_TASK_STATUS_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.deleteTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // const taskStatusList = await readJsonFile(TASKSTATUS_FILE_PATH, []);
    let taskStatusList  = await getOrSetCache("statuss_data", () => readJsonFile(TASKSTATUS_FILE_PATH,[]), 1800);

    const taskStatusToDelete = taskStatusList.find(s => String(s.id) === String(id));

    if (!taskStatusToDelete) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ Task Status ដែលត្រូវលុបឡើយ!" });
    }

    const filteredTaskStatuss = taskStatusList.filter(s => String(s.id) !== String(id));
    await writeJsonFile(TASKSTATUS_FILE_PATH, filteredTaskStatuss, `Task Status: deleted task type with ID ${id}`);

    clearCache('statuss_data')

    return res.status(200).json({
      success: true,
      message: "លុប Task Status បានជោគជ័យ"
    });

  } catch (err) {
    console.error("DELETE_TASK_STATUS_ERROR:", err);
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

exports.getAllTaskStatuss = async (req, res) => {
  try {
    // let taskStatuss = await readJsonFile(TASKSTATUS_FILE_PATH, []);
    let taskStatuss = await getOrSetCache("statuss_data", () => readJsonFile(TASKSTATUS_FILE_PATH,[]), 700);


    const { search, page, limit, random, user_id } = req.query;

    if (user_id) {
      taskStatuss = taskStatuss.filter(s => String(s.user_id) === String(user_id));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      taskStatuss = taskStatuss.filter(s => 
        (s.title && s.title.toLowerCase().includes(searchLower)) ||
        (s.title_kh && s.title_kh.toLowerCase().includes(searchLower)) ||
        (s.des && s.des.toLowerCase().includes(searchLower)) ||
        (s.description && s.description.toLowerCase().includes(searchLower))
      );
    }

    if (random === 'true') {
      taskStatuss = shuffleArray(taskStatuss);
    } else {
      taskStatuss.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    const formattedTaskStatuss = taskStatuss.map(s => ({
      ...s,
      created_at: formatBackendDate(s.created_at),
      updated_at: formatBackendDate(s.updated_at)
    }));

    const totalItems = formattedTaskStatuss.length;

    if (page || limit) {
      const currentPage = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedData = formattedTaskStatuss.slice(startIndex, endIndex);

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
      data: formattedTaskStatuss
    });

  } catch (err) {
    console.error("GET_ALL_TASK_STATUSES_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getTaskStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    // const taskStatuss = await readJsonFile(TASKSTATUS_FILE_PATH, []);
    let taskStatuss = await getOrSetCache("statuss_data", () => readJsonFile(TASKSTATUS_FILE_PATH,[]), 700);

    const taskStatus = taskStatuss.find(s => String(s.id) === String(id));

    if (!taskStatus) {
      return res.status(404).json({ success: false, message: "រកមិនឃើញ task Status នេះឡើយ" });
    }

    const formattedTaskStatus = {
      ...taskStatus,
      created_at: formatBackendDate(taskStatus.created_at),
      updated_at: formatBackendDate(taskStatus.updated_at)
    };

    return res.json({
      success: true,
      data: formattedTaskStatus
    });
    
  } catch (err) {
    console.error("GET_TASK_STATUS_BY_ID_ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};