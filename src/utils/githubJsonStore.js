
let Octokit;

const octokitPromise = import("@octokit/rest")
  .then((module) => {
    Octokit = module.Octokit;
  })
  .catch((error) => {
    console.error("Failed to load Octokit:", error);
  });

const normalize = (value) => (value || "").trim();

const getConfig = () => {
  const token = normalize(process.env.GITHUB_TOKEN);
  const owner = normalize(process.env.OWNER);

  const repo = normalize(process.env.REPO)
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "");

  if (!token || !owner || !repo) {
    throw new Error(
      "Missing GitHub config: GITHUB_TOKEN, OWNER, REPO are required"
    );
  }

  return { token, owner, repo };
};

const getOctokit = async () => {
  if (!Octokit) {
    await octokitPromise;
  }

  if (!Octokit) {
    throw new Error("Octokit not initialized");
  }

  const { token } = getConfig();

  return new Octokit({ auth: token });
};

const getFile = async (filePath) => {
  const { owner, repo } = getConfig();
  const octokit = await getOctokit();

  return octokit.repos.getContent({
    owner,
    repo,
    path: filePath
  });
};

const getFileByPath = async (filePath) => {
  try {
    const { data } = await getFile(filePath);

    if (Array.isArray(data)) {
      return null;
    }

    return data;
  } catch (error) {
    if (error.status === 404) {
      return null;
    }

    throw error;
  }
};

// ========================================
// GLOBAL GITHUB WRITE QUEUE
// ========================================

let writeQueue = Promise.resolve();

const runWriteQueue = (operation) => {
  const current = writeQueue.then(operation, operation);

  // Keep queue alive even if one operation fails
  writeQueue = current.catch(() => {});

  return current;
};

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ========================================
// WRITE WITH RETRY
// ========================================

const writeContentWithRetry = async (
  filePath,
  content,
  message,
  maxRetries = 4
) => {
  const { owner, repo } = getConfig();
  const octokit = await getOctokit();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Always get the latest SHA before writing
      const existing = await getFileByPath(filePath);

      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message,
        content,
        sha: existing ? existing.sha : undefined
      });

      return true;

    } catch (error) {
      const isConflict = error.status === 409;

      if (!isConflict || attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `GitHub 409 conflict. Retrying ${attempt + 1}/${maxRetries}: ${filePath}`
      );

      // Wait before retrying
      await wait(500 * (attempt + 1));
    }
  }
};

// ========================================
// READ JSON
// ========================================

exports.readJsonFile = async (filePath, fallbackData = []) => {
  try {
    const { data } = await getFile(filePath);

    const encoded = Array.isArray(data) ? "" : data.content;

    if (!encoded) {
      return fallbackData;
    }

    const raw = Buffer.from(encoded, "base64").toString("utf-8");

    return JSON.parse(raw);

  } catch (error) {
    if (error.status === 404) {
      return fallbackData;
    }

    throw error;
  }
};

// ========================================
// WRITE JSON
// ========================================

exports.writeJsonFile = async (
  filePath,
  jsonData,
  message = "Update file via API"
) => {
  return runWriteQueue(async () => {
    const content = Buffer.from(
      JSON.stringify(jsonData, null, 2)
    ).toString("base64");

    return writeContentWithRetry(
      filePath,
      content,
      message
    );
  });
};

// ========================================
// ENSURE FILE
// ========================================

exports.ensureFile = async (
  filePath,
  contentString,
  message = "Create file via API"
) => {
  return runWriteQueue(async () => {
    const existing = await getFileByPath(filePath);

    if (existing) {
      return;
    }

    const content = Buffer.from(
      contentString,
      "utf-8"
    ).toString("base64");

    return writeContentWithRetry(
      filePath,
      content,
      message
    );
  });
};

// ========================================
// UPLOAD BUFFER
// ========================================

exports.uploadBufferFile = async (
  filePath,
  buffer,
  message = "Upload file via API"
) => {
  return runWriteQueue(async () => {
    const content = buffer.toString("base64");

    return writeContentWithRetry(
      filePath,
      content,
      message
    );
  });
};

// ========================================
// READ FILE BUFFER
// ========================================

exports.readFileBuffer = async (filePath) => {
  const data = await getFileByPath(filePath);

  if (!data) {
    return null;
  }

  return {
    buffer: Buffer.from(data.content, "base64"),
    sha: data.sha
  };
};

// ========================================
// DELETE FILE
// ========================================

exports.deleteFile = async (
  filePath,
  message = "Delete file via API"
) => {
  return runWriteQueue(async () => {
    const { owner, repo } = getConfig();
    const octokit = await getOctokit();

    const existing = await getFileByPath(filePath);

    if (!existing) {
      return;
    }

    await octokit.repos.deleteFile({
      owner,
      repo,
      path: filePath,
      message,
      sha: existing.sha
    });
  });
};

// ========================================
// ENSURE JSON FILE
// ========================================

exports.ensureJsonFile = async (
  filePath,
  defaultData,
  message = "Create JSON file via API"
) => {
  return exports.ensureFile(
    filePath,
    JSON.stringify(defaultData, null, 2),
    message
  );
};
