const permissions = {
  // Admin
  1: ["*"],

  // User
  2: [
    // Tasks
    "tasks.view",
    "tasks.create",
    "tasks.update",
    "tasks.delete",

    // Task Types
    "taskTypes.view",
    "taskTypes.create",
    "taskTypes.update",
    "taskTypes.delete",

    // Category
    "category.view",
    "category.create",
    "category.update",
    "category.delete",

    // Telegram
    "telegram.view",
    "telegram.create",
    "telegram.update",
    "telegram.delete",

    // User Profile
    "updateMe.update",
  ]
};

const permission = (requiredPermission) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const role = Number(req.user.role || 0);

    const userPermissions = permissions[role] || [];

    // Admin has all permissions
    if (userPermissions.includes("*")) {
      return next();
    }

    // Check specific permission
    if (userPermissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({
      message: "Permission denied",
      permission: requiredPermission
    });
  };
};

module.exports = permission;