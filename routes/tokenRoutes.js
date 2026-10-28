// All API routes for tokens
const express = require("express");
const Token = require("../models/Token");
const { requireUser, requireAdmin } = require("../middleware/auth");
const router = express.Router();

const SERVICES = ["General Enquiry", "Billing", "Account Opening", "Complaint"];
// Today's date in Indian time, e.g. "2026-10-28" (hosting servers run on UTC)
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

// ---------- USER ROUTES ----------

// 1. Book a token for the logged-in user  (POST /api/tokens)
router.post("/", requireUser, async (req, res) => {
  try {
    const service = req.body.service;
    if (!SERVICES.includes(service))
      return res.status(400).json({ error: "Please select a valid service" });

    const me = req.session.user;
    // One active token per user at a time
    const active = await Token.findOne({ user: me.id, date: today(), status: { $in: ["Waiting", "Serving"] } });
    if (active)
      return res.status(400).json({ error: `You already have an active token #${active.tokenNumber}` });

    // Next token number for today
    const last = await Token.findOne({ date: today() }).sort({ tokenNumber: -1 });
    const tokenNumber = last ? last.tokenNumber + 1 : 1;

    const token = await Token.create({
      tokenNumber, user: me.id, name: me.name, phone: me.phone, service, date: today()
    });
    res.status(201).json(token);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Logged-in user's tokens for today  (GET /api/tokens/my)
router.get("/my", requireUser, async (req, res) => {
  const tokens = await Token.find({ user: req.session.user.id, date: today() }).sort({ tokenNumber: -1 });
  const serving = await Token.findOne({ date: today(), status: "Serving" });

  const result = [];
  for (const t of tokens) {
    const ahead = t.status === "Waiting"
      ? await Token.countDocuments({ date: today(), status: "Waiting", tokenNumber: { $lt: t.tokenNumber } })
      : null;
    result.push({ ...t.toObject(), peopleAhead: ahead });
  }
  res.json({ nowServing: serving ? serving.tokenNumber : null, tokens: result });
});

// 3. User cancels their own waiting token  (PUT /api/tokens/my/:number/cancel)
router.put("/my/:number/cancel", requireUser, async (req, res) => {
  const token = await Token.findOneAndUpdate(
    { date: today(), tokenNumber: Number(req.params.number), user: req.session.user.id, status: "Waiting" },
    { status: "Cancelled" },
    { returnDocument: "after" }
  );
  if (!token) return res.status(400).json({ error: "Only your waiting tokens can be cancelled" });
  res.json({ message: `Token #${token.tokenNumber} cancelled` });
});

// ---------- ADMIN ROUTES ----------

// 4. Get today's full queue  (GET /api/tokens)
router.get("/", requireAdmin, async (req, res) => {
  const tokens = await Token.find({ date: today() }).sort({ tokenNumber: 1 });
  res.json(tokens);
});

// 5. Call next token  (PUT /api/tokens/next)
router.put("/next", requireAdmin, async (req, res) => {
  await Token.updateMany({ date: today(), status: "Serving" }, { status: "Completed" });
  const next = await Token.findOneAndUpdate(
    { date: today(), status: "Waiting" },
    { status: "Serving" },
    { sort: { tokenNumber: 1 }, returnDocument: "after" }
  );
  if (!next) return res.json({ message: "No one is waiting in the queue" });
  res.json({ message: `Now serving token #${next.tokenNumber}`, token: next });
});

// 6. Admin cancels any waiting token  (PUT /api/tokens/:number/cancel)
router.put("/:number/cancel", requireAdmin, async (req, res) => {
  const token = await Token.findOneAndUpdate(
    { date: today(), tokenNumber: Number(req.params.number), status: "Waiting" },
    { status: "Cancelled" },
    { returnDocument: "after" }
  );
  if (!token) return res.status(400).json({ error: "Only waiting tokens can be cancelled" });
  res.json({ message: `Token #${token.tokenNumber} cancelled` });
});

module.exports = router;
