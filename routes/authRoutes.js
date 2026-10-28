// Register, login, admin login, logout
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Save the logged-in person in the session
function startSession(req, user) {
  req.session.user = {
    id: user._id.toString(), name: user.name, email: user.email,
    phone: user.phone, role: user.role
  };
}

// 1. Register a new user  (POST /api/auth/register)
router.post("/register", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const phone = (req.body.phone || "").trim();
    const password = req.body.password || "";

    if (!/^[A-Za-z ]{3,30}$/.test(name))
      return res.status(400).json({ error: "Name must be 3-30 letters only" });
    if (!EMAIL_RE.test(email))
      return res.status(400).json({ error: "Enter a valid email address" });
    if (!/^[6-9][0-9]{9}$/.test(phone))
      return res.status(400).json({ error: "Enter a valid 10-digit phone number" });
    if (!/^(?=.*[A-Za-z])(?=.*[0-9]).{6,}$/.test(password))
      return res.status(400).json({ error: "Password must be at least 6 characters with a letter and a number" });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: "An account with this email already exists" });
    if (await User.findOne({ phone }))
      return res.status(400).json({ error: "An account with this mobile number already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashed, role: "user" });
    startSession(req, user);
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "An account with this email or mobile number already exists" });
    res.status(500).json({ error: err.message });
  }
});

// Shared login logic for users and admins
async function login(req, res, role) {
  const identifier = String(req.body.identifier || req.body.email || "").trim();
  const password = String(req.body.password || "");
  const isPhone = role === "user" && /^[6-9][0-9]{9}$/.test(identifier);
  const validIdentifier = isPhone || EMAIL_RE.test(identifier);
  if (!validIdentifier || !password)
    return res.status(400).json({ error: "Enter a valid email or mobile number and password" });

  const lookup = isPhone
    ? { phone: identifier, role }
    : { email: identifier.toLowerCase(), role };
  const user = await User.findOne(lookup);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Invalid email or password" });

  startSession(req, user);
  res.json({ message: "Login successful", name: user.name });
}

// 2. User login  (POST /api/auth/login)
router.post("/login", (req, res) => login(req, res, "user"));

// 3. Admin login  (POST /api/auth/admin-login)
router.post("/admin-login", (req, res) => login(req, res, "admin"));

// Logout only the session associated with the current role.
function logout(req, res) {
  const cookieName = req.path === "/admin-logout" ? "queue.admin.sid" : "queue.user.sid";
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Could not log out" });
    res.clearCookie(cookieName, { path: "/" });
    res.json({ message: "Logged out" });
  });
}

router.post("/logout", logout);
router.post("/admin-logout", logout);

// 5. Who is logged in?  (GET /api/auth/me)
router.get("/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  res.json(req.session.user);
});

module.exports = router;
