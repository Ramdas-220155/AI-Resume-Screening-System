const express = require("express");
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
