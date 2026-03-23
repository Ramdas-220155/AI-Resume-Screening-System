// middleware/helpers.js — Response helpers & Auth Guards · ResumeIQ v3.0
const { getCol, toObjId } = require("../config/database");

function ok(res, data = {}, msg = "OK") {
  return res.json({ success: true, message: msg, ...data });
}

function fail(res, msg, code = 400) {
  return res.status(code).json({ success: false, error: msg });
}

async function requireAuth(req, res) {
  const id = req.headers["x-user-id"];
  if (!id) {
    fail(res, "Unauthorized", 401);
    return null;
  }
  try {
    const users = await getCol("users");
    const u = await users.findOne({ _id: toObjId(id) });
    if (!u) {
      fail(res, "Unauthorized — user not found", 401);
      return null;
    }
    return u;
  } catch (e) {
    fail(res, "Unauthorized — invalid ID", 401);
    return null;
  }
}

async function requireHR(req, res) {
  const u = await requireAuth(req, res);
  if (!u) return null;
  if ((u.role || "user") !== "hr") {
    fail(res, "Forbidden — HR access required", 403);
    return null;
  }
  return u;
}

module.exports = { ok, fail, requireAuth, requireHR };
