<?php
/* hr_dashboard.php — HR Dashboard
   GET /api/hr_dashboard.php              → full dashboard data
   GET /api/hr_dashboard.php?action=candidates → all candidates
*/
require_once __DIR__ . '/../middleware/cors.php';
setCors();

$hr   = requireHR();
$hrid = (string)$hr['_id'];
$action = $_GET['action'] ?? 'dashboard';

$jobs = getCol('jobs');
$apps = getCol('applications');

// Gather HR's job IDs
$hrJobIds = [];
$jcur     = $jobs->find(['posted_by' => $hrid], ['projection' => ['_id' => 1]]);
foreach ($jcur as $j) $hrJobIds[] = (string)$j['_id'];

/* ── CANDIDATES ───────────────────────────────────────── */
if ($action === 'candidates') {
    if (empty($hrJobIds)) ok(['applications' => []]);
    $q  = trim($_GET['q'] ?? '');
    $filter = ['job_id' => ['$in' => $hrJobIds]];
    if ($q) $filter['$or'] = [
        ['candidate_name'  => ['$regex' => $q, '$options' => 'i']],
        ['candidate_email' => ['$regex' => $q, '$options' => 'i']],
        ['title'           => ['$regex' => $q, '$options' => 'i']],
    ];
    $cursor = $apps->find($filter, ['sort' => ['applied_at' => -1]]);
    $res    = [];
    foreach ($cursor as $a) {
        $res[] = [
            'id'              => (string)$a['_id'],
            'job_id'          => (string)($a['job_id'] ?? ''),
            'title'           => $a['title']           ?? '',
            'company'         => $a['company']         ?? '',
            'score'           => (int)($a['score']     ?? 0),
            'status'          => $a['status']          ?? 'applied',
            'applied_at'      => isset($a['applied_at']) ? msToDate($a['applied_at']) : '',
            'candidate_name'  => $a['candidate_name']  ?? 'Unknown',
            'candidate_email' => $a['candidate_email'] ?? '',
            'resume_name'     => $a['resume_name']     ?? null,
        ];
    }
    ok(['applications' => $res, 'total' => count($res)]);
}

/* ── DASHBOARD ────────────────────────────────────────── */

// Stats
$activeJobs   = (int)$jobs->countDocuments(['posted_by' => $hrid, 'status' => 'active']);
$totalApps    = empty($hrJobIds) ? 0 : (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds]]);
$shortlisted  = empty($hrJobIds) ? 0 : (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds], 'status' => 'shortlisted']);
$hired        = empty($hrJobIds) ? 0 : (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds], 'status' => 'hired']);
$todayStart   = new MongoDB\BSON\UTCDateTime(strtotime('today midnight') * 1000);
$newToday     = empty($hrJobIds) ? 0 : (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds], 'applied_at' => ['$gte' => $todayStart]]);

// Recent 6 applications
$recentApps = [];
if (!empty($hrJobIds)) {
    $rcur = $apps->find(['job_id' => ['$in' => $hrJobIds]], ['sort' => ['applied_at' => -1], 'limit' => 6]);
    foreach ($rcur as $a) {
        $recentApps[] = [
            'id'              => (string)$a['_id'],
            'job_id'          => (string)($a['job_id'] ?? ''),
            'title'           => $a['title']           ?? '',
            'score'           => (int)($a['score']     ?? 0),
            'status'          => $a['status']          ?? 'applied',
            'applied_at'      => isset($a['applied_at']) ? msToDate($a['applied_at']) : '',
            'candidate_name'  => $a['candidate_name']  ?? 'Unknown',
            'candidate_email' => $a['candidate_email'] ?? '',
        ];
    }
}

// Active job listings
$activeJobList = [];
$ajcur = $jobs->find(['posted_by' => $hrid, 'status' => 'active'], ['sort' => ['posted_at' => -1], 'limit' => 5]);
foreach ($ajcur as $j) {
    $jid = (string)$j['_id'];
    $ac  = (int)$apps->countDocuments(['job_id' => $jid]);
    $activeJobList[] = [
        'id'         => $jid,
        'title'      => $j['title'],
        'company'    => $j['company'],
        'logo_emoji' => $j['logo_emoji'] ?? '🏢',
        'type'       => $j['type'],
        'loc'        => $j['loc'],
        'status'     => $j['status'] ?? 'active',
        'app_count'  => $ac,
        'posted_at'  => isset($j['posted_at']) ? msToDate($j['posted_at']) : '',
    ];
}

ok([
    'stats' => [
        'active_jobs' => $activeJobs,
        'total_apps'  => $totalApps,
        'shortlisted' => $shortlisted,
        'hired'       => $hired,
        'new_today'   => $newToday,
    ],
    'recent_applications' => $recentApps,
    'active_jobs'         => $activeJobList,
    'hr' => [
        'name'     => $hr['name'],
        'initials' => $hr['initials'] ?? 'H',
        'company'  => $hr['company']  ?? '',
        'plan'     => $hr['plan']     ?? 'Free',
    ],
]);
