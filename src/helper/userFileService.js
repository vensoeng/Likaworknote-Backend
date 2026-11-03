const { writeJsonFile } = require("../utils/githubJsonStore");

const getUserFilePaths = (userId) => {
  return {
    tasks: `data/tasks/task_${userId}.json`,
    categories: `data/categories/taskcategory_${userId}.json`,
    types: `data/types/tasktype_${userId}.json`,
    telegram: `data/telegram/telegram_${userId}.json`,
  };
};

const createUserFiles = async (userId) => {
  const paths = getUserFilePaths(userId);

  await Promise.all([
    writeJsonFile(paths.tasks, [], `Create tasks for ${userId}`),
    writeJsonFile(paths.categories, [], `Create categories for ${userId}`),
    writeJsonFile(paths.types, [], `Create types for ${userId}`),
    writeJsonFile(paths.telegram, [], `Create telegram for ${userId}`),
  ]);

  return paths;
};

module.exports = {
  getUserFilePaths,
  createUserFiles,
};