// Digital Queue Management System - main server file
const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const tokenRoutes = require("./routes/tokenRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
// On Render, set MONGO_URI to your MongoDB Atlas connection string.
// On your own computer it falls back to the local MongoDB.
const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/queueDB";
const PUBLIC = path.join(__dirname, "public");
const USER_SESSION_COOKIE = "queue.user.sid";
const ADMIN_SESSION_COOKIE = "queue.admin.sid";
const SESSION_TTL = 365 * 24 * 60 * 60;

// Default admin account (created automatically the first time)
const ADMIN_EMAIL = "admin@queue.com";
const ADMIN_PASSWORD = "admin123";

app.set("trust proxy", 1); // Render runs the app behind a proxy
app.use(express.json());

function createSession(name) {
  return session({
    name,
    secret: process.env.SESSION_SECRET || "queue-system-secret-key",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      collectionName: "sessions",
      ttl: SESSION_TTL
    }),
    cookie: {
      maxAge: SESSION_TTL * 1000,
      httpOnly: true,
      sameSite: "lax"
    }
  });
}

const userSession = createSession(USER_SESSION_COOKIE);
const adminSession = createSession(ADMIN_SESSION_COOKIE);

app.use((req, res, next) => {
  const isAdminRequest = req.path === "/admin.html" ||
    req.path === "/api/auth/admin-login" ||
    req.path === "/api/auth/admin-logout" ||
    (req.path === "/api/tokens" && req.method === "GET") ||
    (req.path.startsWith("/api/tokens/") && !req.path.startsWith("/api/tokens/my"));

  (isAdminRequest ? adminSession : userSession)(req, res, next);
});

// ---- Protected pages: redirect to the right login page if not logged in ----
app.get(["/", "/user.html"], (req, res) => {
  if (req.session.user?.role === "user") return res.sendFile(path.join(PUBLIC, "user.html"));
  res.redirect("/login.html");
});
app.get("/admin.html", (req, res) => {
  if (req.session.user?.role === "admin") return res.sendFile(path.join(PUBLIC, "admin.html"));
  res.redirect("/admin-login.html");
});

app.use(express.static(PUBLIC, { index: false }));  // login pages, CSS, JS
app.use("/api/auth", authRoutes);
app.use("/api/tokens", tokenRoutes);

// Create the admin account if it does not exist yet
async function createAdmin() {
  const exists = await User.findOne({ role: "admin" });
  if (!exists) {
    await User.create({
      name: "Admin", email: ADMIN_EMAIL, role: "admin",
      password: await bcrypt.hash(ADMIN_PASSWORD, 10)
    });
    console.log(`Admin account created -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }
}

mongoose
  .connect(MONGO_URL)
  .then(async () => {
    console.log("Connected to MongoDB");
    await createAdmin();
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err.message);
    process.exit(1);
  });
