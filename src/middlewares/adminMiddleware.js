module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const role = Number(req.user.role || 0);
  if (role !== 1) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};