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

app.set("trust proxy", 1); // Render / Vercel run the app behind a proxy
app.use(express.json());

// ---- Database connection ----
// On Vercel the app starts fresh for requests, so every request waits until
// MongoDB is connected (the connection is made once and then reused).
let dbPromise = null;
function connectDB() {
  if (!dbPromise) {
    dbPromise = mongoose
      .connect(MONGO_URL, { serverSelectionTimeoutMS: 8000 })
      .then(async () => {
        console.log("Connected to MongoDB");
        await createAdmin();
      })
      .catch((err) => {
        dbPromise = null; // try again on the next request
        throw err;
      });
  }
  return dbPromise;
}

const NEEDS_DB = (p) => p.startsWith("/api/") || ["/", "/user.html", "/admin.html"].includes(p);

app.use(async (req, res, next) => {
  if (!NEEDS_DB(req.path)) return next(); // login pages, CSS, JS load without the database
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    const msg = process.env.MONGO_URI
      ? "Cannot connect to the database. Check the MONGO_URI value and MongoDB Atlas Network Access (allow 0.0.0.0/0)."
      : "MONGO_URI is not set on the server. Add your MongoDB Atlas connection string as an environment variable and redeploy.";
    if (req.path.startsWith("/api/")) return res.status(503).json({ error: msg });
    res.status(503).send(msg);
  }
});

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

// Any unexpected error -> JSON reply, so the pages can show the message
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith("/api/")) return res.status(500).json({ error: "Server error: " + err.message });
  res.status(500).send("Server error");
});

// Running on your own computer / Render: start listening
if (require.main === module) {
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)))
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      process.exit(1);
    });
}

// Vercel: uses this exported app
module.exports = app;