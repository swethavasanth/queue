// Structure of one token stored in MongoDB
const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },   // who booked it
  name: { type: String, required: true },
  phone: { type: String, required: true },
  service: {
    type: String, required: true,
    enum: ["General Enquiry", "Billing", "Account Opening", "Complaint"]
  },
  status: {
    type: String,
    enum: ["Waiting", "Serving", "Completed", "Cancelled"],
    default: "Waiting"
  },
  date: { type: String, required: true },      // e.g. "2026-10-28" so numbers restart daily
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Token", tokenSchema);
