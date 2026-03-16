<?php
/* dashboard.php — User Home Dashboard Stats
   GET /api/dashboard.php
*/
require_once __DIR__ . '/../middleware/cors.php';
setCors();

$u   = requireAuth();
$uid = (string)$u['_id'];

$apps  = getCol('applications');
$jobs  = getCol('jobs');

$total     = (int)$apps->countDocuments(['user_id' => $uid]);
$short     = (int)$apps->countDocuments(['user_id' => $uid, 'status' => 'shortlisted']);
$rejected  = (int)$apps->countDocuments(['user_id' => $uid, 'status' => 'rejected']);
$interview = (int)$apps->countDocuments(['user_id' => $uid, 'status' => 'interview']);
$totalJobs = (int)$jobs->countDocuments(['status'  => ['$ne' => 'closed']]);

// AI score heuristic
$skillCnt = count((array)($u['skills'] ?? []));
$hasResume= !empty($u['resume_path']);
$hasPhone = !empty($u['phone']);
$hasBio   = !empty($u['bio']);
$aiScore  = min(99, 50 + ($skillCnt * 5) + ($hasResume ? 12 : 0) + ($hasPhone ? 4 : 0) + ($hasBio ? 7 : 0) + min($total * 2, 16));

// Recent 5 apps
$recent = [];
$cursor = $apps->find(['user_id' => $uid], ['sort' => ['applied_at' => -1], 'limit' => 5]);
foreach ($cursor as $a) {
    $recent[] = [
        'id'         => (string)$a['_id'],
        'title'      => $a['title'],
        'company'    => $a['company'],
        'logo_emoji' => $a['logo_emoji'] ?? '🏢',
        'type'       => $a['type']       ?? '',
        'score'      => (int)($a['score'] ?? 0),
        'status'     => $a['status'],
        'applied_at' => isset($a['applied_at']) ? msToDate($a['applied_at']) : '',
    ];
}

ok([
    'stats' => [
        'total_apps'     => $total,
        'shortlisted'    => $short,
        'rejected'       => $rejected,
        'interview'      => $interview,
        'jobs_available' => $totalJobs,
        'ai_score'       => (int)$aiScore,
    ],
    'recent_applications' => $recent,
    'user' => [
        'name'     => $u['name'],
        'initials' => $u['initials'] ?? 'U',
        'plan'     => $u['plan']     ?? 'Free',
    ],
]);
