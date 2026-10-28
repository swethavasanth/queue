// Digital Queue Management System - main server file
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const tokenRoutes = require("./routes/tokenRoutes");

const app = express();
const PORT = 3000;
const MONGO_URL = "mongodb://127.0.0.1:27017/queueDB";

app.use(express.json());                                  // read JSON from requests
app.use(express.static(path.join(__dirname, "public")));  // serve HTML/CSS/JS
app.use("/api/tokens", tokenRoutes);                       // all token APIs

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => console.log("MongoDB connection error:", err.message));
