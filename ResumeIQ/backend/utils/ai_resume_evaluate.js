// Spawns ai_module/api_bridge.py to score a resume against a job (overall score + GitHub username).
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const MAX_JOB_ARG_CHARS = 7000;

function resolveAiModuleDir() {
  const envDir = process.env.AI_MODULE_DIR;
  if (envDir && fs.existsSync(envDir)) return path.resolve(envDir);
  return path.resolve(__dirname, "..", "..", "..", "ai_module");
}

function buildJobText(job) {
  const chunks = [];
  if (job.title) chunks.push(String(job.title));
  if (job.company) chunks.push(String(job.company));
  if (job.description) chunks.push(String(job.description));
  if (Array.isArray(job.skills) && job.skills.length) {
    chunks.push("Required skills: " + job.skills.map(String).join(", "));
  }
  const full = chunks.filter(Boolean).join("\n\n");
  return full.length > MAX_JOB_ARG_CHARS ? full.slice(0, MAX_JOB_ARG_CHARS) : full;
}

function parseBridgeStdout(raw) {
  const s = (raw || "").trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    const i = s.lastIndexOf("\n{");
    if (i >= 0) {
      try {
        return JSON.parse(s.slice(i + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * @returns {{ overallScore: number, githubUsername: string|null } | null}
 */
function evaluateResumeAgainstJob(resumeAbsPath, job) {
  const aiDir = resolveAiModuleDir();
  const bridge = path.join(aiDir, "api_bridge.py");
  if (!fs.existsSync(bridge)) {
    console.warn("[ai_resume] api_bridge.py not found at", bridge);
    return null;
  }
  if (!resumeAbsPath || !fs.existsSync(resumeAbsPath)) return null;

  const jobText = buildJobText(job);
  if (!jobText.trim()) return null;

  const python =
    process.env.PYTHON_PATH ||
    (process.platform === "win32" ? "python" : "python3");

  const out = spawnSync(python, [bridge, resumeAbsPath, jobText], {
    cwd: aiDir,
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
    timeout: Number(process.env.AI_EVAL_TIMEOUT_MS) || 120000,
    windowsHide: true,
  });

  if (out.error) {
    console.warn("[ai_resume] spawn error:", out.error.message);
    return null;
  }
  if (out.signal) {
    console.warn("[ai_resume] killed:", out.signal);
    return null;
  }

  const parsed = parseBridgeStdout(out.stdout);
  if (!parsed || !parsed.success || !parsed.result) {
    if (parsed && parsed.error) console.warn("[ai_resume] bridge error:", parsed.error);
    return null;
  }

  const r = parsed.result;
  const raw =
    r.final_score_with_bonus != null ? Number(r.final_score_with_bonus) : Number(r.final_score);
  const overallScore = Math.round(
    Math.min(100, Math.max(0, Number.isFinite(raw) ? raw : 0)),
  );

  let githubUsername = r.github_username;
  if (githubUsername != null && githubUsername !== "") {
    githubUsername = String(githubUsername).trim();
    if (!githubUsername) githubUsername = null;
  } else {
    githubUsername = null;
  }

  return { overallScore, githubUsername };
}

module.exports = {
  evaluateResumeAgainstJob,
  resolveAiModuleDir,
};

