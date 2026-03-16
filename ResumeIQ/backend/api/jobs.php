<?php
/* jobs.php — Jobs API (User browsing + HR management)
   GET  ?action=list     → list / search jobs (public)
   POST ?action=apply    → user applies for job
   GET  ?action=seed     → seed sample jobs (dev)
   POST ?action=create   → HR posts new job
   GET  ?action=myjobs   → HR gets own job listings
   POST ?action=close    → HR closes a job
   POST ?action=delete   → HR deletes a job
   GET  ?action=get&id=X → get single job
*/
require_once __DIR__ . '/../middleware/cors.php';
setCors();

$action = $_GET['action'] ?? 'list';
$jobs   = getCol('jobs');

/* ── LIST ─────────────────────────────────────────────── */
if ($action === 'list') {
    $q     = trim($_GET['q']     ?? '');
    $type  = trim($_GET['type']  ?? '');
    $loc   = trim($_GET['loc']   ?? '');
    $level = trim($_GET['level'] ?? '');

    $filter = ['status' => ['$ne' => 'closed']];

    if ($q) $filter['$or'] = [
        ['title'   => ['$regex' => $q, '$options' => 'i']],
        ['company' => ['$regex' => $q, '$options' => 'i']],
        ['skills'  => ['$elemMatch' => ['$regex' => $q, '$options' => 'i']]],
    ];
    if ($type  && $type  !== 'all') $filter['type']  = $type;
    if ($loc   && $loc   !== 'all') $filter['loc']   = $loc;
    if ($level && $level !== 'all') $filter['level'] = $level;

    $cursor = $jobs->find($filter, ['sort' => ['posted_at' => -1], 'limit' => 100]);

    // Mark applied jobs for authenticated users
    $appliedIds = [];
    if (uid()) {
        $c = getCol('applications')->find(['user_id' => uid()], ['projection' => ['job_id' => 1]]);
        foreach ($c as $a) $appliedIds[] = (string)$a['job_id'];
    }

    $results = [];
    foreach ($cursor as $job) {
        $jid = (string)$job['_id'];
        // app count
        $appCount = getCol('applications')->countDocuments(['job_id' => $jid]);
        $results[] = [
            'id'         => $jid,
            'title'      => $job['title'],
            'company'    => $job['company'],
            'logo_emoji' => $job['logo_emoji'] ?? '🏢',
            'type'       => $job['type'],
            'loc'        => $job['loc'],
            'level'      => $job['level'],
            'salary'     => $job['salary'] ?? '',
            'skills'     => (array)($job['skills'] ?? []),
            'score'      => $job['score'] ?? rand(60, 98),
            'posted_at'  => isset($job['posted_at']) ? msToDate($job['posted_at']) : date('d M Y'),
            'applied'    => in_array($jid, $appliedIds),
            'app_count'  => (int)$appCount,
            'status'     => $job['status'] ?? 'active',
        ];
    }
    ok(['jobs' => $results, 'total' => count($results)]);
}

/* ── APPLY ────────────────────────────────────────────── */
if ($action === 'apply') {
    $u  = requireAuth();
    $uid= (string)$u['_id'];
    $b  = body();
    $jid= trim($b['job_id'] ?? '');
    if (!$jid) fail('job_id is required');

    try { $job = $jobs->findOne(['_id' => toObjId($jid)]); }
    catch (Exception $e) { fail('Invalid job ID'); }
    if (!$job) fail('Job not found', 404);
    if (($job['status'] ?? 'active') === 'closed') fail('This job is no longer accepting applications', 410);

    $apps = getCol('applications');
    if ($apps->findOne(['user_id' => $uid, 'job_id' => $jid])) fail('You have already applied for this job', 409);

    $result = $apps->insertOne([
        'user_id'       => $uid,
        'job_id'        => $jid,
        'hr_id'         => $job['posted_by'] ?? null,
        'title'         => $job['title'],
        'company'       => $job['company'],
        'logo_emoji'    => $job['logo_emoji'] ?? '🏢',
        'type'          => $job['type'],
        'loc'           => $job['loc'],
        'score'         => $job['score'] ?? rand(60, 98),
        'status'        => 'applied',
        'notes'         => '',
        'applied_at'    => nowUTC(),
        'updated_at'    => nowUTC(),
        'candidate_name' => $u['name'],
        'candidate_email'=> $u['email'],
        'resume_name'   => $u['resume_name'] ?? null,
        'resume_path'   => $u['resume_path'] ?? null,
    ]);

    ok([
        'application_id' => (string)$result->getInsertedId(),
        'job_title'      => $job['title'],
        'company'        => $job['company'],
    ], 'Application submitted successfully!');
}

/* ── CREATE (HR) ──────────────────────────────────────── */
if ($action === 'create') {
    $hr = requireHR();
    $b  = body();

    $title  = trim($b['title']   ?? '');
    $company= trim($b['company'] ?? $hr['company'] ?? '');
    $type   = trim($b['type']    ?? '');
    $level  = trim($b['level']   ?? '');
    $loc    = trim($b['loc']     ?? '');

    if (!$title)   fail('Job title is required');
    if (!$company) fail('Company name is required');
    if (!$type)    fail('Job type is required');
    if (!$level)   fail('Experience level is required');
    if (!$loc)     fail('Location is required');

    $skills = array_values(array_filter(array_map('trim', (array)($b['skills'] ?? []))));
    if (empty($skills)) fail('At least one skill is required');

    $result = $jobs->insertOne([
        'title'       => $title,
        'company'     => $company,
        'logo_emoji'  => trim($b['logo_emoji'] ?? '🏢') ?: '🏢',
        'type'        => $type,
        'level'       => $level,
        'loc'         => $loc,
        'salary'      => trim($b['salary'] ?? ''),
        'skills'      => $skills,
        'description' => trim($b['description'] ?? ''),
        'openings'    => (int)($b['openings'] ?? 1),
        'deadline'    => $b['deadline'] ? new MongoDB\BSON\UTCDateTime(strtotime($b['deadline']) * 1000) : null,
        'score'       => rand(60, 95),
        'status'      => 'active',
        'posted_by'   => (string)$hr['_id'],
        'posted_at'   => nowUTC(),
        'updated_at'  => nowUTC(),
    ]);

    ok(['job_id' => (string)$result->getInsertedId(), 'title' => $title], 'Job posted successfully!');
}

/* ── MY JOBS (HR) ─────────────────────────────────────── */
if ($action === 'myjobs') {
    $hr  = requireHR();
    $hrid= (string)$hr['_id'];
    $cur = $jobs->find(['posted_by' => $hrid], ['sort' => ['posted_at' => -1]]);
    $res = [];
    foreach ($cur as $j) {
        $jid      = (string)$j['_id'];
        $appCount = getCol('applications')->countDocuments(['job_id' => $jid]);
        $res[] = [
            'id'         => $jid,
            'title'      => $j['title'],
            'company'    => $j['company'],
            'logo_emoji' => $j['logo_emoji'] ?? '🏢',
            'type'       => $j['type'],
            'loc'        => $j['loc'],
            'level'      => $j['level'],
            'salary'     => $j['salary'] ?? '',
            'status'     => $j['status'] ?? 'active',
            'app_count'  => (int)$appCount,
            'posted_at'  => isset($j['posted_at']) ? msToDate($j['posted_at']) : '',
        ];
    }
    ok(['jobs' => $res, 'total' => count($res)]);
}

/* ── CLOSE (HR) ───────────────────────────────────────── */
if ($action === 'close') {
    $hr  = requireHR();
    $b   = body();
    $jid = trim($b['job_id'] ?? '');
    if (!$jid) fail('job_id is required');
    try {
        $r = $jobs->updateOne(
            ['_id' => toObjId($jid), 'posted_by' => (string)$hr['_id']],
            ['$set' => ['status' => 'closed', 'updated_at' => nowUTC()]]
        );
    } catch (Exception $e) { fail('Invalid job ID'); }
    if ($r->getMatchedCount() === 0) fail('Job not found or access denied', 404);
    ok([], 'Job closed successfully');
}

/* ── DELETE (HR) ──────────────────────────────────────── */
if ($action === 'delete') {
    $hr  = requireHR();
    $b   = body();
    $jid = trim($b['job_id'] ?? '');
    if (!$jid) fail('job_id is required');
    try {
        $r = $jobs->deleteOne(['_id' => toObjId($jid), 'posted_by' => (string)$hr['_id']]);
    } catch (Exception $e) { fail('Invalid job ID'); }
    if ($r->getDeletedCount() === 0) fail('Job not found or access denied', 404);
    ok([], 'Job deleted');
}

/* ── GET single ───────────────────────────────────────── */
if ($action === 'get') {
    $jid = trim($_GET['id'] ?? '');
    if (!$jid) fail('id is required');
    try { $job = $jobs->findOne(['_id' => toObjId($jid)]); }
    catch (Exception $e) { fail('Invalid job ID'); }
    if (!$job) fail('Job not found', 404);
    ok(['job' => [
        'id'         => (string)$job['_id'],
        'title'      => $job['title'],
        'company'    => $job['company'],
        'logo_emoji' => $job['logo_emoji'] ?? '🏢',
        'type'       => $job['type'],
        'loc'        => $job['loc'],
        'level'      => $job['level'],
        'salary'     => $job['salary'] ?? '',
        'skills'     => (array)($job['skills'] ?? []),
        'description'=> $job['description'] ?? '',
        'status'     => $job['status'] ?? 'active',
        'posted_at'  => isset($job['posted_at']) ? msToDate($job['posted_at']) : '',
    ]]);
}

/* ── SEED (dev) ───────────────────────────────────────── */
if ($action === 'seed') {
    if ($jobs->countDocuments([]) > 5) ok(['count' => (int)$jobs->countDocuments([])], 'Jobs already seeded');

    $samples = [
        ['title'=>'Frontend Developer','company'=>'TechNova','logo_emoji'=>'⚡','type'=>'full-time','loc'=>'Hyderabad','level'=>'mid','salary'=>'₹8L–₹14L/yr','skills'=>['React','TypeScript','CSS','HTML'],'score'=>92,'posted_by'=>'system'],
        ['title'=>'UI/UX Designer','company'=>'PixelCraft','logo_emoji'=>'🎨','type'=>'full-time','loc'=>'Bangalore','level'=>'mid','salary'=>'₹7L–₹12L/yr','skills'=>['Figma','Sketch','Adobe XD','Prototyping'],'score'=>78,'posted_by'=>'system'],
        ['title'=>'React Engineer','company'=>'Velocity Labs','logo_emoji'=>'🚀','type'=>'remote','loc'=>'Remote','level'=>'senior','salary'=>'₹18L–₹28L/yr','skills'=>['React','Node.js','GraphQL','AWS'],'score'=>85,'posted_by'=>'system'],
        ['title'=>'Full Stack Developer','company'=>'NexaLabs','logo_emoji'=>'🔬','type'=>'full-time','loc'=>'Pune','level'=>'mid','salary'=>'₹10L–₹18L/yr','skills'=>['PHP','Laravel','Vue.js','MySQL'],'score'=>88,'posted_by'=>'system'],
        ['title'=>'Backend Engineer','company'=>'CloudBase','logo_emoji'=>'☁️','type'=>'remote','loc'=>'Remote','level'=>'senior','salary'=>'₹20L–₹35L/yr','skills'=>['Node.js','Python','MongoDB','Docker'],'score'=>74,'posted_by'=>'system'],
        ['title'=>'Data Engineer','company'=>'DataForge','logo_emoji'=>'📊','type'=>'full-time','loc'=>'Chennai','level'=>'mid','salary'=>'₹12L–₹20L/yr','skills'=>['Python','Spark','Kafka','SQL'],'score'=>67,'posted_by'=>'system'],
        ['title'=>'DevOps Engineer','company'=>'Streamline','logo_emoji'=>'🔧','type'=>'full-time','loc'=>'Hyderabad','level'=>'senior','salary'=>'₹16L–₹26L/yr','skills'=>['Kubernetes','Docker','Terraform','AWS'],'score'=>81,'posted_by'=>'system'],
        ['title'=>'Mobile Developer','company'=>'AppWave','logo_emoji'=>'📱','type'=>'full-time','loc'=>'Mumbai','level'=>'junior','salary'=>'₹5L–₹9L/yr','skills'=>['React Native','Flutter','iOS','Android'],'score'=>70,'posted_by'=>'system'],
        ['title'=>'ML Engineer','company'=>'NeuralEdge','logo_emoji'=>'🧠','type'=>'remote','loc'=>'Remote','level'=>'senior','salary'=>'₹25L–₹45L/yr','skills'=>['Python','TensorFlow','PyTorch','MLOps'],'score'=>90,'posted_by'=>'system'],
        ['title'=>'Cloud Architect','company'=>'Nimbus','logo_emoji'=>'⛅','type'=>'full-time','loc'=>'Hyderabad','level'=>'senior','salary'=>'₹30L–₹50L/yr','skills'=>['AWS','Azure','GCP','Kubernetes'],'score'=>83,'posted_by'=>'system'],
        ['title'=>'Cybersecurity Analyst','company'=>'SecureNet','logo_emoji'=>'🔐','type'=>'full-time','loc'=>'Delhi','level'=>'mid','salary'=>'₹10L–₹18L/yr','skills'=>['SIEM','Penetration Testing','Firewalls','Compliance'],'score'=>76,'posted_by'=>'system'],
        ['title'=>'Junior PHP Developer','company'=>'WebCraft','logo_emoji'=>'🌐','type'=>'full-time','loc'=>'Hyderabad','level'=>'junior','salary'=>'₹3.5L–₹6L/yr','skills'=>['PHP','MySQL','Laravel','HTML','CSS'],'score'=>69,'posted_by'=>'system'],
        ['title'=>'Angular Developer','company'=>'FrontEdge','logo_emoji'=>'🔺','type'=>'contract','loc'=>'Pune','level'=>'mid','salary'=>'₹9L–₹16L/yr','skills'=>['Angular','TypeScript','RxJS','REST API'],'score'=>77,'posted_by'=>'system'],
        ['title'=>'Intern — Software Dev','company'=>'StartupNest','logo_emoji'=>'🐣','type'=>'internship','loc'=>'Remote','level'=>'intern','salary'=>'₹15K–₹25K/mo','skills'=>['JavaScript','Python','Git','REST API'],'score'=>58,'posted_by'=>'system'],
        ['title'=>'QA Automation Engineer','company'=>'QualityFirst','logo_emoji'=>'✅','type'=>'full-time','loc'=>'Bangalore','level'=>'junior','salary'=>'₹4L–₹7L/yr','skills'=>['Selenium','Cypress','Jest','Postman'],'score'=>63,'posted_by'=>'system'],
        ['title'=>'Product Manager','company'=>'Launchpad','logo_emoji'=>'🎯','type'=>'full-time','loc'=>'Bangalore','level'=>'senior','salary'=>'₹22L–₹40L/yr','skills'=>['Agile','Jira','Analytics','Strategy'],'score'=>72,'posted_by'=>'system'],
    ];

    $inserted = 0;
    foreach ($samples as $s) {
        $s['status']    = 'active';
        $s['posted_at'] = new MongoDB\BSON\UTCDateTime((new DateTime('-' . rand(1,20) . ' days'))->getTimestamp() * 1000);
        $s['updated_at']= nowUTC();
        $jobs->insertOne($s);
        $inserted++;
    }
    ok(['seeded' => $inserted], "Seeded $inserted jobs");
}

fail('Unknown action', 404);
