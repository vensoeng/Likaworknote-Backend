
const {
  readJsonFile,
  writeJsonFile,
} = require("../utils/githubJsonStore");

const {
  getOrSetCache,
  clearCache,
} = require("../helper/cacheService");

const TASK_FILE_PATH =
  process.env.TASK_FILE_PATH || "src/db/task.json";

exports.test = async (req, res) => {
  try {
    
    const taskList = await getOrSetCache(
      "tasks_data",
      () => readJsonFile(TASK_FILE_PATH, [])
    );

    if (!Array.isArray(taskList)) {
      return res.status(400).json({
        success: false,
        message: "Task data must be an array",
      });
    }

    const updatedTaskList = taskList.map((task) => {
      const { schedule_id, ...rest } = task;

      return {
        ...rest,
        schedule: task.updated_at,
      };
    });

    await writeJsonFile(TASK_FILE_PATH, updatedTaskList);

    // Clear cached data so the next request reads updated data
    await clearCache("tasks_data");

    return res.status(200).json({
      success: true,
      message: "Tasks updated successfully",
      total: updatedTaskList.length,
      data: updatedTaskList,
    });
  } catch (err) {
    console.error("TEST_CONTROLLER_ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
