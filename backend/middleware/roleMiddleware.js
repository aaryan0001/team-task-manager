module.exports = (allowedRoles) => {
  return (req, res, next) => {
    // check if user exists
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // convert single role to array
    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles];
    }

    // check role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};