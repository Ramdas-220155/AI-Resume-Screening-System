<?php
/* setup.php — One-time Setup: Indexes + Directories
   GET /api/setup.php
*/
require_once __DIR__ . '/../middleware/cors.php';
setCors();

$log = [];

try {
    $db = getDB();

    // Users indexes
    $db->users->createIndex(['email' => 1], ['unique' => true]);
    $log[] = '✅ users.email (unique index)';

    // Applications indexes
    $db->applications->createIndex(['user_id' => 1]);
    $db->applications->createIndex(['job_id'  => 1]);
    $db->applications->createIndex(['user_id' => 1, 'job_id' => 1], ['unique' => true]);
    $db->applications->createIndex(['hr_id'   => 1]);
    $log[] = '✅ applications indexes (user_id, job_id, composite unique, hr_id)';

    // Jobs indexes
    $db->jobs->createIndex(['posted_by' => 1]);
    $db->jobs->createIndex(['status'    => 1]);
    $db->jobs->createIndex(['title' => 'text', 'company' => 'text'], ['name' => 'jobs_text']);
    $log[] = '✅ jobs indexes (posted_by, status, text)';

    // Upload directory
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
        $log[] = '✅ Upload directory created: ' . UPLOAD_DIR;
    } else {
        $log[] = 'ℹ️ Upload directory already exists';
    }

    // Counts
    $log[] = '📊 Users: ' . $db->users->countDocuments([]);
    $log[] = '📊 Jobs: '  . $db->jobs->countDocuments([]);
    $log[] = '📊 Applications: ' . $db->applications->countDocuments([]);

    ok(['log' => $log], 'Setup complete! Now visit /api/jobs.php?action=seed to seed sample jobs.');

} catch (Exception $e) {
    fail('Setup failed: ' . $e->getMessage(), 500);
}
