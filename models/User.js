// Structure of a user / admin account stored in MongoDB
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: true, trim: true, minlength: 3, maxlength: 30,
    match: [/^[A-Za-z ]+$/, "Name can contain only letters and spaces"]
  },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"]
  },
  phone: {
    type: String, unique: true, sparse: true,
    match: [/^[6-9][0-9]{9}$/, "Invalid phone number"]
  },
  password: { type: String, required: true },          // stored as a bcrypt hash, never plain text
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
