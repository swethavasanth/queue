// Structure of one token stored in MongoDB
const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  name: {
    type: String, required: true, trim: true,
    minlength: 3, maxlength: 30,
    match: [/^[A-Za-z ]+$/, "Name can contain only letters and spaces"]
  },
  phone: {
    type: String, required: true,
    match: [/^[6-9][0-9]{9}$/, "Phone must be a valid 10-digit number"]
  },
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
