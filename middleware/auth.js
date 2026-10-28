// Checks who is logged in before allowing access

function requireUser(req, res, next) {
  if (req.session.user && req.session.user.role === "user") return next();
  res.status(401).json({ error: "Please log in as a user" });
}

function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") return next();
  res.status(401).json({ error: "Admin login required" });
}

module.exports = { requireUser, requireAdmin };
