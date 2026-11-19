const { writeJsonFile } = require("../utils/githubJsonStore");

const TaskType = require("../models/TaskType");

const getUserFilePaths = (userId) => {
  return {
    tasks: `data/tasks/task_${userId}.json`,
    types: `data/types/tasktype_${userId}.json`,
  };
};

// const createUserFiles = async (userId) => {
//   const paths = getUserFilePaths(userId);

//   await Promise.all([
//     writeJsonFile(paths.tasks, [], `Create tasks for ${userId}`),
//     writeJsonFile(paths.types, [], `Create types for ${userId}`),
//   ]);

//   return paths;
// };

const createUserFiles = async (userId) => {
  const paths = getUserFilePaths(userId);

  const now = new Date();

  const defaultTaskType = new TaskType({
    id: now.getTime(),
    user_id: userId,
    title: "ផ្សេងៗ",
    des: "លំនាំដើមបង្កើតឡើងដោយ likaworknote ផ្ទាល់។",
    created_at: now,
    updated_at: now,
  });

  await Promise.all([
    writeJsonFile(
      paths.tasks,
      [],
      `Create tasks for ${userId}`
    ),

    writeJsonFile(
      paths.types,
      [defaultTaskType],
      `Create default task type for ${userId}`
    ),
  ]);

  return paths;
};

module.exports = {
  getUserFilePaths,
  createUserFiles,
};