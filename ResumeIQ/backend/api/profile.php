<?php
/* profile.php — User & HR Profile Endpoints
   GET  /api/profile.php              → get profile
   POST /api/profile.php?action=update
   POST /api/profile.php?action=password
   POST /api/profile.php?action=notif
   POST /api/profile.php?action=resume
*/
require_once __DIR__ . '/../middleware/cors.php';
setCors();

$u      = requireAuth();
$uid    = (string) $u['_id'];
$action = $_GET['action'] ?? 'get';
$users  = getCol('users');

/* ── GET ──────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET' || $action === 'get') {
    $apps       = getCol('applications');
    $totalApps  = $apps->countDocuments(['user_id' => $uid]);
    $shortlisted= $apps->countDocuments(['user_id' => $uid, 'status' => 'shortlisted']);

    // completeness
    $fields  = ['name','email','phone','location','bio','skills','linkedin','resume_path'];
    $filled  = 0;
    foreach ($fields as $f) { $v = $u[$f] ?? null; if (!empty($v) && $v !== [] && $v !== '') $filled++; }
    $completeness = (int) round(($filled / count($fields)) * 100);

    ok(['profile' => [
        'id'          => $uid,
        'name'        => $u['name'],
        'email'       => $u['email'],
        'initials'    => $u['initials'] ?? 'U',
        'role'        => $u['role']     ?? 'user',
        'plan'        => $u['plan']     ?? 'Free',
        'company'     => $u['company']  ?? '',
        'phone'       => $u['phone']    ?? '',
        'location'    => $u['location'] ?? '',
        'bio'         => $u['bio']      ?? '',
        'skills'      => (array)($u['skills'] ?? []),
        'linkedin'    => $u['linkedin'] ?? '',
        'github'      => $u['github']   ?? '',
        'website'     => $u['website']  ?? '',
        'resume_name' => $u['resume_name'] ?? null,
        'notif_prefs' => (array)($u['notif_prefs'] ?? []),
        'completeness'=> $completeness,
        'stats'       => ['total' => (int)$totalApps, 'shortlisted' => (int)$shortlisted],
    ]]);
}

/* ── UPDATE ───────────────────────────────────────────── */
if ($action === 'update') {
    $b    = body();
    $name = trim($b['name'] ?? $u['name']);
    if (!$name) fail('Name is required');

    $words    = array_filter(explode(' ', $name));
    $initials = strtoupper(implode('', array_map(fn($w) => $w[0], $words)));
    $initials = substr($initials, 0, 2);

    $skills = array_values(array_filter(array_map('trim', (array)($b['skills'] ?? []))));

    $users->updateOne(['_id' => toObjId($uid)], ['$set' => [
        'name'       => $name,
        'initials'   => $initials,
        'phone'      => trim($b['phone']    ?? ''),
        'location'   => trim($b['location'] ?? ''),
        'bio'        => trim($b['bio']      ?? ''),
        'linkedin'   => trim($b['linkedin'] ?? ''),
        'github'     => trim($b['github']   ?? ''),
        'website'    => trim($b['website']  ?? ''),
        'company'    => trim($b['company']  ?? ($u['company'] ?? '')),
        'skills'     => $skills,
        'updated_at' => nowUTC(),
    ]]);
    ok(['initials' => $initials], 'Profile updated successfully');
}

/* ── PASSWORD ─────────────────────────────────────────── */
if ($action === 'password') {
    $b      = body();
    $curr   = $b['current_password']  ?? '';
    $newPwd = $b['new_password']      ?? '';
    $conf   = $b['confirm_password']  ?? '';
    if (!$curr || !$newPwd)   fail('Current and new password are required');
    if ($newPwd !== $conf)    fail('Passwords do not match');
    if (strlen($newPwd) < 6)  fail('Password must be at least 6 characters');
    if (!password_verify($curr, $u['password'])) fail('Current password is incorrect', 401);
    $users->updateOne(['_id' => toObjId($uid)], ['$set' => [
        'password'   => password_hash($newPwd, PASSWORD_BCRYPT),
        'updated_at' => nowUTC(),
    ]]);
    ok([], 'Password updated successfully');
}

/* ── NOTIF PREFS ──────────────────────────────────────── */
if ($action === 'notif') {
    $b = body();
    $users->updateOne(['_id' => toObjId($uid)], ['$set' => [
        'notif_prefs' => [
            'new_match'     => (bool)($b['new_match']     ?? false),
            'status_update' => (bool)($b['status_update'] ?? false),
            'weekly_digest' => (bool)($b['weekly_digest'] ?? false),
            'marketing'     => (bool)($b['marketing']     ?? false),
        ],
        'updated_at' => nowUTC(),
    ]]);
    ok([], 'Notification preferences saved');
}

/* ── RESUME UPLOAD ────────────────────────────────────── */
if ($action === 'resume') {
    if (empty($_FILES['resume'])) fail('No file uploaded');
    $file = $_FILES['resume'];
    $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($file['error'] !== UPLOAD_ERR_OK) fail('Upload error: code ' . $file['error']);
    if ($file['size']  > MAX_FILE_SIZE)   fail('File too large (max 5 MB)');
    if (!in_array($ext, ALLOWED_EXTS))    fail('Only PDF, DOC, DOCX files are allowed');

    if (!empty($u['resume_path']) && file_exists($u['resume_path'])) @unlink($u['resume_path']);

    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    $filename = $uid . '_' . time() . '.' . $ext;
    $dest     = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) fail('Failed to save file');

    $users->updateOne(['_id' => toObjId($uid)], ['$set' => [
        'resume_path' => $dest,
        'resume_name' => $file['name'],
        'updated_at'  => nowUTC(),
    ]]);
    ok(['resume_name' => $file['name']], 'Resume uploaded successfully');
}

fail('Unknown action', 404);
