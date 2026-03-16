<?php
/* applications.php — Applications API (User + HR)
   GET  ?action=list          → user's applications
   POST ?action=withdraw      → user withdraws
   GET  ?action=stats         → user stats
   GET  ?action=for_job       → HR: apps for a job
   GET  ?action=all_hr        → HR: all apps for HR's jobs
   POST ?action=update_status → HR: update candidate status
   GET  ?action=hr_stats      → HR: aggregate stats
*/
require_once __DIR__ . '/../middleware/cors.php';
setCors();

$action = $_GET['action'] ?? 'list';
$apps   = getCol('applications');

/* ── USER: LIST ───────────────────────────────────────── */
if ($action === 'list') {
    $u   = requireAuth();
    $uid = (string)$u['_id'];
    $q   = trim($_GET['q'] ?? '');
    $st  = trim($_GET['status'] ?? '');

    $filter = ['user_id' => $uid];
    if ($q) $filter['$or'] = [
        ['title'   => ['$regex' => $q, '$options' => 'i']],
        ['company' => ['$regex' => $q, '$options' => 'i']],
    ];
    if ($st && $st !== 'all') $filter['status'] = $st;

    $cursor = $apps->find($filter, ['sort' => ['applied_at' => -1]]);
    $res    = [];
    foreach ($cursor as $a) {
        $res[] = [
            'id'          => (string)$a['_id'],
            'job_id'      => (string)($a['job_id'] ?? ''),
            'title'       => $a['title']       ?? '',
            'company'     => $a['company']     ?? '',
            'logo_emoji'  => $a['logo_emoji']  ?? '🏢',
            'type'        => $a['type']        ?? '',
            'loc'         => $a['loc']         ?? '',
            'score'       => (int)($a['score'] ?? 0),
            'status'      => $a['status']      ?? 'applied',
            'applied_at'  => isset($a['applied_at']) ? msToDate($a['applied_at']) : '',
            'notes'       => $a['notes']       ?? '',
        ];
    }

    ok([
        'applications' => $res,
        'stats' => [
            'total'       => (int)$apps->countDocuments(['user_id' => $uid]),
            'shortlisted' => (int)$apps->countDocuments(['user_id' => $uid, 'status' => 'shortlisted']),
            'pending'     => (int)$apps->countDocuments(['user_id' => $uid, 'status' => 'applied']),
            'rejected'    => (int)$apps->countDocuments(['user_id' => $uid, 'status' => 'rejected']),
        ],
    ]);
}

/* ── USER: WITHDRAW ───────────────────────────────────── */
if ($action === 'withdraw') {
    $u   = requireAuth();
    $uid = (string)$u['_id'];
    $b   = body();
    $aid = trim($b['app_id'] ?? '');
    if (!$aid) fail('app_id is required');
    try {
        $r = $apps->deleteOne(['_id' => toObjId($aid), 'user_id' => $uid]);
    } catch (Exception $e) { fail('Invalid application ID'); }
    if ($r->getDeletedCount() === 0) fail('Application not found', 404);
    ok([], 'Application withdrawn');
}

/* ── USER: STATS ──────────────────────────────────────── */
if ($action === 'stats') {
    $u   = requireAuth();
    $uid = (string)$u['_id'];
    ok(['stats' => [
        'total'       => (int)$apps->countDocuments(['user_id' => $uid]),
        'shortlisted' => (int)$apps->countDocuments(['user_id' => $uid, 'status' => 'shortlisted']),
        'pending'     => (int)$apps->countDocuments(['user_id' => $uid, 'status' => 'applied']),
        'rejected'    => (int)$apps->countDocuments(['user_id' => $uid, 'status' => 'rejected']),
    ]]);
}

/* ── HR: APPS FOR A SPECIFIC JOB ─────────────────────── */
if ($action === 'for_job') {
    $hr  = requireHR();
    $jid = trim($_GET['job_id'] ?? '');
    if (!$jid) fail('job_id is required');
    $cursor = $apps->find(['job_id' => $jid], ['sort' => ['applied_at' => -1]]);
    $res    = [];
    foreach ($cursor as $a) {
        $res[] = _appRow($a);
    }
    ok(['applications' => $res, 'total' => count($res)]);
}

/* ── HR: ALL APPLICATIONS FOR HR'S JOBS ──────────────── */
if ($action === 'all_hr') {
    $hr   = requireHR();
    $hrid = (string)$hr['_id'];

    // Get HR's job IDs
    $hrJobIds = [];
    $jcur     = getCol('jobs')->find(['posted_by' => $hrid], ['projection' => ['_id' => 1]]);
    foreach ($jcur as $j) $hrJobIds[] = (string)$j['_id'];

    if (empty($hrJobIds)) ok(['applications' => [], 'stats' => ['total'=>0,'new_today'=>0,'shortlisted'=>0,'hired'=>0]]);

    $q  = trim($_GET['q'] ?? '');
    $st = trim($_GET['status'] ?? '');

    $filter = ['job_id' => ['$in' => $hrJobIds]];
    if ($q)                    $filter['$or']   = [['title'=>['$regex'=>$q,'$options'=>'i']],['candidate_name'=>['$regex'=>$q,'$options'=>'i']]];
    if ($st && $st !== 'all')  $filter['status'] = $st;

    $cursor = $apps->find($filter, ['sort' => ['applied_at' => -1]]);
    $res    = [];
    foreach ($cursor as $a) $res[] = _appRow($a);

    // Today midnight
    $todayStart = new MongoDB\BSON\UTCDateTime(strtotime('today midnight') * 1000);

    ok([
        'applications' => $res,
        'stats' => [
            'total'       => (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds]]),
            'new_today'   => (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds], 'applied_at' => ['$gte' => $todayStart]]),
            'shortlisted' => (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds], 'status' => 'shortlisted']),
            'hired'       => (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds], 'status' => 'hired']),
        ],
    ]);
}

/* ── HR: UPDATE STATUS ────────────────────────────────── */
if ($action === 'update_status') {
    $hr   = requireHR();
    $hrid = (string)$hr['_id'];
    $b    = body();
    $aid  = trim($b['app_id'] ?? '');
    $st   = trim($b['status'] ?? '');
    $notes= trim($b['notes']  ?? '');

    $allowed = ['applied','shortlisted','interview','hired','rejected'];
    if (!$aid)                  fail('app_id is required');
    if (!in_array($st,$allowed)) fail('Invalid status value');

    // Verify this app belongs to one of HR's jobs
    try {
        $app = $apps->findOne(['_id' => toObjId($aid)]);
    } catch (Exception $e) { fail('Invalid application ID'); }
    if (!$app) fail('Application not found', 404);

    $job = getCol('jobs')->findOne(['_id' => toObjId((string)$app['job_id'])]);
    if (!$job || ((string)$job['posted_by']) !== $hrid) fail('Forbidden — not your job', 403);

    $apps->updateOne(['_id' => toObjId($aid)], ['$set' => [
        'status'     => $st,
        'notes'      => $notes,
        'updated_at' => nowUTC(),
    ]]);
    ok(['new_status' => $st], 'Status updated to ' . ucfirst($st));
}

/* ── HR: STATS ────────────────────────────────────────── */
if ($action === 'hr_stats') {
    $hr   = requireHR();
    $hrid = (string)$hr['_id'];
    $hrJobIds = [];
    $jcur = getCol('jobs')->find(['posted_by' => $hrid], ['projection' => ['_id' => 1]]);
    foreach ($jcur as $j) $hrJobIds[] = (string)$j['_id'];
    if (empty($hrJobIds)) ok(['stats' => ['total'=>0,'new_today'=>0,'shortlisted'=>0,'hired'=>0]]);
    $todayStart = new MongoDB\BSON\UTCDateTime(strtotime('today midnight') * 1000);
    ok(['stats' => [
        'total'       => (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds]]),
        'new_today'   => (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds], 'applied_at' => ['$gte' => $todayStart]]),
        'shortlisted' => (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds], 'status' => 'shortlisted']),
        'hired'       => (int)$apps->countDocuments(['job_id' => ['$in' => $hrJobIds], 'status' => 'hired']),
    ]]);
}

function _appRow($a): array {
    return [
        'id'              => (string)$a['_id'],
        'job_id'          => (string)($a['job_id'] ?? ''),
        'title'           => $a['title']            ?? '',
        'company'         => $a['company']          ?? '',
        'logo_emoji'      => $a['logo_emoji']       ?? '🏢',
        'score'           => (int)($a['score']      ?? 0),
        'status'          => $a['status']           ?? 'applied',
        'applied_at'      => isset($a['applied_at']) ? msToDate($a['applied_at']) : '',
        'notes'           => $a['notes']            ?? '',
        'candidate_name'  => $a['candidate_name']  ?? 'Unknown',
        'candidate_email' => $a['candidate_email'] ?? '',
        'resume_name'     => $a['resume_name']     ?? null,
        'resume_path'     => $a['resume_path']     ?? null,
    ];
}

fail('Unknown action', 404);
