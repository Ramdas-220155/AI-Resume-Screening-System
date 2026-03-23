// server.js — ResumeIQ Backend · Node.js + MongoDB Atlas v3.0
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

/* ── CORS ──────────────────────────────────────────────── */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-User-Role'],
}));

/* ── BODY PARSERS ──────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── STATIC: resume downloads ──────────────────────────── */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── ROUTES ────────────────────────────────────────────── */
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/jobs',         require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/profile',      require('./routes/profile'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/hr_dashboard', require('./routes/hr_dashboard'));
app.use('/api/contact',      require('./routes/contact'));

/* ── HEALTH CHECK ──────────────────────────────────────── */
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ResumeIQ API', version: '3.0.0' }));

/* ── 404 ───────────────────────────────────────────────── */
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

/* ── START ─────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ResumeIQ API running on http://localhost:${PORT}`);
});
