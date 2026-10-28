// All API routes for tokens
const express = require("express");
const Token = require("../models/Token");
const router = express.Router();

const SERVICES = ["General Enquiry", "Billing", "Account Opening", "Complaint"];
const today = () => new Date().toISOString().slice(0, 10);

// 1. Book a new token  (POST /api/tokens)
router.post("/", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const phone = (req.body.phone || "").trim();
    const service = req.body.service;

    // Server-side validation
    if (!/^[A-Za-z ]{3,30}$/.test(name))
      return res.status(400).json({ error: "Name must be 3-30 letters only" });
    if (!/^[6-9][0-9]{9}$/.test(phone))
      return res.status(400).json({ error: "Enter a valid 10-digit phone number" });
    if (!SERVICES.includes(service))
      return res.status(400).json({ error: "Please select a valid service" });

    // Same phone cannot hold two active tokens
    const active = await Token.findOne({ phone, date: today(), status: { $in: ["Waiting", "Serving"] } });
    if (active)
      return res.status(400).json({ error: `This phone already has active token #${active.tokenNumber}` });

    // Next token number for today
    const last = await Token.findOne({ date: today() }).sort({ tokenNumber: -1 });
    const tokenNumber = last ? last.tokenNumber + 1 : 1;

    const token = await Token.create({ tokenNumber, name, phone, service, date: today() });
    res.status(201).json(token);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get today's full queue  (GET /api/tokens)
router.get("/", async (req, res) => {
  const tokens = await Token.find({ date: today() }).sort({ tokenNumber: 1 });
  res.json(tokens);
});

// 3. Call next token  (PUT /api/tokens/next)
router.put("/next", async (req, res) => {
  // Finish the one currently being served
  await Token.updateMany({ date: today(), status: "Serving" }, { status: "Completed" });
  // Move the first waiting token to serving
  const next = await Token.findOneAndUpdate(
    { date: today(), status: "Waiting" },
    { status: "Serving" },
    { sort: { tokenNumber: 1 }, returnDocument: "after" }
  );
  if (!next) return res.json({ message: "No one is waiting in the queue" });
  res.json({ message: `Now serving token #${next.tokenNumber}`, token: next });
});

// 4. Check status of one token  (GET /api/tokens/:number)
router.get("/:number", async (req, res) => {
  const num = Number(req.params.number);
  if (!Number.isInteger(num) || num < 1)
    return res.status(400).json({ error: "Enter a valid token number" });

  const token = await Token.findOne({ date: today(), tokenNumber: num });
  if (!token) return res.status(404).json({ error: "Token not found for today" });

  const ahead = await Token.countDocuments({ date: today(), status: "Waiting", tokenNumber: { $lt: num } });
  const serving = await Token.findOne({ date: today(), status: "Serving" });
  res.json({ token, peopleAhead: ahead, nowServing: serving ? serving.tokenNumber : null });
});

// 5. Cancel a token  (PUT /api/tokens/:number/cancel)
router.put("/:number/cancel", async (req, res) => {
  const token = await Token.findOneAndUpdate(
    { date: today(), tokenNumber: Number(req.params.number), status: "Waiting" },
    { status: "Cancelled" },
    { returnDocument: "after" }
  );
  if (!token) return res.status(400).json({ error: "Only waiting tokens can be cancelled" });
  res.json({ message: `Token #${token.tokenNumber} cancelled` });
});

module.exports = router;
