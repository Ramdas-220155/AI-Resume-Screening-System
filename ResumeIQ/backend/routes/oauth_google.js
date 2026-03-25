// Google OAuth (Passport) — linked from .env GOOGLE_* vars
const crypto = require("crypto");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const { getCol, nowUTC } = require("../config/database");

/** One-time codes: exchange in browser for same JSON shape as /auth/login */
const pendingCodes = new Map();
const CODE_TTL_MS = 5 * 60 * 1000;

function issueCode(payload) {
  const code = crypto.randomBytes(32).toString("hex");
  pendingCodes.set(code, { payload, exp: Date.now() + CODE_TTL_MS });
  for (const [k, v] of pendingCodes) {
    if (v.exp < Date.now()) pendingCodes.delete(k);
  }
  return code;
}

function frontendOrigin() {
  return (
    process.env.FRONTEND_ORIGIN ||
    `http://localhost:${process.env.PORT || 5000}`
  );
}

function googleCallbackURL() {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`
  );
}

/**
 * @param {import('express').Router} router
 */
function mountGoogleOAuth(router) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientID || !clientSecret) {
    console.warn(
      "[oauth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google sign-in disabled",
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: googleCallbackURL(),
        passReqToCallback: true,
      },
      (req, _accessToken, _refreshToken, profile, done) => {
        done(null, { profile });
      },
    ),
  );

  const failRedirect = `${frontendOrigin()}/user/login.html?oauth=fail`;

  router.get("/google", (req, res, next) => {
    const role = req.query.role === "hr" ? "hr" : "user";
    const state = Buffer.from(
      JSON.stringify({ r: role, t: Date.now() }),
    ).toString("base64url");
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state,
    })(req, res, next);
  });

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: failRedirect,
    }),
    async (req, res) => {
      const origin = frontendOrigin();
      try {
        let role = "user";
        try {
          const raw = req.query.state
            ? Buffer.from(req.query.state, "base64url").toString("utf8")
            : "{}";
          const s = JSON.parse(raw);
          if (s && s.r === "hr") role = "hr";
        } catch (_) {
          /* default user */
        }

        const profile = req.user && req.user.profile;
        if (!profile || !profile.emails || !profile.emails[0]) {
          return res.redirect(`${origin}/user/login.html?oauth=noemail`);
        }

        const googleId = profile.id;
        const email = profile.emails[0].value.trim().toLowerCase();
        const displayName = profile.displayName || email.split("@")[0];

        const users = await getCol("users");

        let u = await users.findOne({ google_id: googleId });
        if (!u) {
          u = await users.findOne({ email });
          if (u) {
            if ((u.role || "user") !== role) {
              const loginPath = role === "hr" ? "hr/login.html" : "user/login.html";
              return res.redirect(
                `${origin}/${loginPath}?oauth=wrongportal`,
              );
            }
            if (!u.google_id) {
              await users.updateOne(
                { _id: u._id },
                {
                  $set: {
                    google_id: googleId,
                    auth_provider: "google",
                    updated_at: nowUTC(),
                  },
                },
              );
              u = await users.findOne({ _id: u._id });
            }
          }
        }

        if (!u) {
          const words = displayName.split(" ").filter(Boolean);
          const initials =
            words.map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
          const randomPwd = await bcrypt.hash(
            crypto.randomBytes(24).toString("hex"),
            10,
          );
          const doc = {
            name: displayName,
            email,
            password: randomPwd,
            initials,
            role,
            company: "",
            plan: "Free",
            google_id: googleId,
            auth_provider: "google",
            created_at: nowUTC(),
            updated_at: nowUTC(),
          };
          const result = await users.insertOne(doc);
          u = await users.findOne({ _id: result.insertedId });
        }

        const responsePayload = {
          user_id: u._id.toString(),
          name: u.name,
          email: u.email,
          initials: u.initials || (u.name && u.name[0].toUpperCase()) || "U",
          plan: u.plan || "Free",
          role: u.role || "user",
          company: u.company || "",
        };

        const code = issueCode(responsePayload);
        const path =
          role === "hr"
            ? "/hr/oauth-callback.html"
            : "/user/oauth-callback.html";
        res.redirect(`${origin}${path}?code=${encodeURIComponent(code)}`);
      } catch (e) {
        console.error("[oauth] callback error:", e);
        res.redirect(`${origin}/user/login.html?oauth=error`);
      }
    },
  );

  router.post("/oauth/complete", (req, res) => {
    const code = (req.body && req.body.code) || "";
    const row = pendingCodes.get(code);
    if (!row || row.exp < Date.now()) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired code" });
    }
    pendingCodes.delete(code);
    return res.json({ success: true, message: "OK", ...row.payload });
  });
}

module.exports = mountGoogleOAuth;
