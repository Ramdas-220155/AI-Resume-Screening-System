# ResumeIQ Backend — Node.js + MongoDB Atlas

Converted from PHP to **Node.js (Express)** with **MongoDB Atlas** support.

---

## 📁 Folder Structure

```
backend/
├── server.js              ← Entry point
├── package.json
├── .env                   ← MongoDB Atlas URI (DO NOT commit)
├── config/
│   └── database.js        ← MongoDB connection + helpers
├── middleware/
│   └── helpers.js         ← ok(), fail(), requireAuth(), requireHR()
├── routes/
│   ├── auth.js            ← POST /api/auth/register, /api/auth/login
│   ├── jobs.js            ← GET/POST /api/jobs/*
│   ├── applications.js    ← GET/POST /api/applications/*
│   ├── profile.js         ← GET/POST /api/profile/*
│   ├── dashboard.js       ← GET /api/dashboard
│   ├── hr_dashboard.js    ← GET /api/hr_dashboard
│   └── contact.js         ← POST /api/contact/send
├── uploads/resumes/       ← Resume files stored here
└── api.js.updated-frontend ← Drop this into frontend/js/api.js
```

---

## ⚙️ Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure `.env`
```
MONGODB_URI=mongodb+srv://sowmyamalla630_db_user:VUhRes0Qgy3nuxnZ@cluster0.zmltass.mongodb.net/?appName=Cluster0
MONGODB_DB=resumeiq
PORT=5000
```

### 3. Start the server
```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

Server runs at: **http://localhost:5000**

---

## 🌐 Frontend — One Change Required

Replace `frontend/js/api.js` with the provided `api.js.updated-frontend` file.

The only thing that changed is the `API_BASE` constant at the top:

```js
// OLD (PHP)
const API_BASE = "/unique/AI-Resume-Screening-System/ResumeIQ/backend/api";

// NEW (Node.js) — local dev
const API_BASE = "http://localhost:5000/api";

// NEW (Node.js) — after deploying backend online (e.g. Render, Railway)
const API_BASE = "https://your-app.onrender.com/api";
```

---

## 📡 API Endpoint Map

| PHP (old)                               | Node.js (new)                        | Method |
|-----------------------------------------|--------------------------------------|--------|
| `auth.php?action=register`              | `/api/auth/register`                 | POST   |
| `auth.php?action=login`                 | `/api/auth/login`                    | POST   |
| `dashboard.php`                         | `/api/dashboard`                     | GET    |
| `profile.php`                           | `/api/profile`                       | GET    |
| `profile.php?action=update`             | `/api/profile/update`                | POST   |
| `profile.php?action=password`           | `/api/profile/password`              | POST   |
| `profile.php?action=notif`              | `/api/profile/notif`                 | POST   |
| `profile.php?action=resume`             | `/api/profile/resume`                | POST   |
| `jobs.php?action=list`                  | `/api/jobs/list`                     | GET    |
| `jobs.php?action=get&id=X`              | `/api/jobs/get?id=X`                 | GET    |
| `jobs.php?action=apply`                 | `/api/jobs/apply`                    | POST   |
| `jobs.php?action=create`                | `/api/jobs/create`                   | POST   |
| `jobs.php?action=myjobs`                | `/api/jobs/myjobs`                   | GET    |
| `jobs.php?action=close`                 | `/api/jobs/close`                    | POST   |
| `jobs.php?action=delete`                | `/api/jobs/delete`                   | POST   |
| `jobs.php?action=seed`                  | `/api/jobs/seed`                     | GET    |
| `applications.php?action=list`          | `/api/applications/list`             | GET    |
| `applications.php?action=withdraw`      | `/api/applications/withdraw`         | POST   |
| `applications.php?action=stats`         | `/api/applications/stats`            | GET    |
| `applications.php?action=for_job`       | `/api/applications/for_job`          | GET    |
| `applications.php?action=update_status` | `/api/applications/update_status`    | POST   |
| `applications.php?action=hr_stats`      | `/api/applications/hr_stats`         | GET    |
| `applications.php?action=all_hr`        | `/api/applications/all_hr`           | GET    |
| `hr_dashboard.php`                      | `/api/hr_dashboard`                  | GET    |
| `hr_dashboard.php?action=candidates`    | `/api/hr_dashboard?action=candidates`| GET    |
| `contact.php?action=send`               | `/api/contact/send`                  | POST   |
| `contact.php?action=list`               | `/api/contact/list`                  | GET    |
| –                                       | `/api/health`                        | GET    |

---

## 🚀 Deploy Online (Free Options)

### Render.com (recommended)
1. Push `backend/` folder to a GitHub repo
2. Create a new **Web Service** on Render
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables from `.env`
6. Update `API_BASE` in `frontend/js/api.js` to your Render URL

### Railway.app
Same process — connect GitHub repo and set env variables.

---

## 🔐 Auth Headers

All protected routes require:
```
X-User-ID: <user_id from login response>
X-User-Role: user | hr
```
These are set automatically by `api.js`.
