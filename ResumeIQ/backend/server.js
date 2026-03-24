/*const express = require("express");
const path = require("path");

const app = express(); // ✅ FIRST create app

// Middleware
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/hr_dashboard", require("./routes/hr_dashboard"));
app.use("/api/contact", require("./routes/contact"));

// Root route → index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// 404 handler
app.use((req, res) =>
  res.status(404).json({ success: false, error: "Route not found" }),
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
*/
// server.js — ResumeIQ Backend · Node.js + MongoDB Atlas v3.0
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

/* ── CORS ──────────────────────────────────────────────── */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-User-ID",
      "X-User-Role",
    ],
  }),
);

/* ── REQUEST LOGGER ────────────────────────────────────── */
app.use((req, res, next) => {
  console.log(`➡  ${req.method} ${req.url}`);
  next();
});

/* ── BODY PARSERS ──────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── STATIC FILES ──────────────────────────────────────── */
app.use("/uploads", express.static(path.join(__dirname, "../backend/uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

/* ── EXISTING ROUTES ───────────────────────────────────── */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/hr_dashboard", require("./routes/hr_dashboard"));
app.use("/api/contact", require("./routes/contact"));

/* ── NEW ROUTES ────────────────────────────────────────── */
app.use("/api/resume", require("./routes/resume_builder"));
app.use("/api/interviews", require("./routes/interviews"));

/* ── HEALTH CHECK ──────────────────────────────────────── */
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", service: "ResumeIQ API", version: "3.1.0" }),
);

/* ── ROOT ──────────────────────────────────────────────── */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend", "index.html")),
);

/* ── 404 ───────────────────────────────────────────────── */
app.use((req, res) => {
  console.log(`❌ 404 — No route: ${req.method} ${req.url}`);
  res.status(404).json({ success: false, error: "Route not found" });
});

/* ── START ─────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 ResumeIQ running at: http://localhost:${PORT}`);
  console.log(`📡 New routes: /api/resume/* | /api/interviews/*\n`);
});
