# ResumeIQ v3.0 — Full-Stack Hiring Platform
PHP + MongoDB + Vanilla JS · Teal Theme · Dark/Light Mode

## Structure
frontend/           - Landing + User + HR dashboards
  index.html        - Landing page (navbar with login dropdown)
  css/              - global, landing, auth, home, jobs, applications, profile, hr
  js/               - api, toast, landing, home, jobs, applications, profile, hr-*
  user/             - login, index, jobs, applications, profile
  hr/               - login, index, jobs, post-job, candidates, applications, profile
backend/
  api/              - auth, dashboard, hr_dashboard, profile, jobs, applications, setup
  config/           - database.php (MongoDB connection)
  middleware/       - cors.php (CORS + auth guards)
  uploads/resumes/  - stored resume files

## Quick Start
1. sudo pecl install mongodb && composer require mongodb/mongodb
2. sudo systemctl start mongod
3. Place in /var/www/html/ResumeIQ/
4. Open http://localhost/ResumeIQ/backend/api/setup.php
5. Open http://localhost/ResumeIQ/backend/api/jobs.php?action=seed
6. Open http://localhost/ResumeIQ/frontend/index.html

## Key Features
- Landing page: Navbar + login dropdown (User/HR) + Features + How it Works + Stats + Contact
- User Dashboard: Browse jobs, apply, track applications, profile, resume upload
- HR Dashboard: Post jobs, manage candidates, update status (Applied→Shortlisted→Interview→Hired)
- Status changes reflect LIVE on user's My Applications page
- Dark/Light theme toggle persisted in localStorage
- User theme: teal gradient (#0d9488 -> #06b6d4)
- HR theme: indigo-cyan gradient (#4f46e5 -> #06b6d4)
