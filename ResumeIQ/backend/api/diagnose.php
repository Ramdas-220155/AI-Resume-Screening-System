<?php
/**
 * ResumeIQ — diagnose.php
 * =============================================
 * DROP THIS FILE IN: backend/api/
 * OPEN IN BROWSER:   http://localhost/.../backend/api/diagnose.php
 * DELETE AFTER USE (for security)
 * =============================================
 */

header('Content-Type: text/html; charset=UTF-8');

function ok($msg)   { echo "<div class='ok'>✅ $msg</div>"; }
function fail($msg) { echo "<div class='fail'>❌ $msg</div>"; }
function warn($msg) { echo "<div class='warn'>⚠️  $msg</div>"; }
function info($msg) { echo "<div class='info'>ℹ️  $msg</div>"; }

?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>ResumeIQ — Diagnostics</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',system-ui,sans-serif; background:#030c0e; color:#90bcbf; padding:30px 20px; min-height:100vh; }
  h1 { color:#2dd4bf; font-size:24px; margin-bottom:6px; }
  .subtitle { color:#3d6e76; font-size:13px; margin-bottom:30px; }
  .card { background:#071519; border:1px solid rgba(13,148,136,0.25); border-radius:12px; padding:22px; margin-bottom:20px; }
  .card h2 { color:#e0f7f4; font-size:15px; font-weight:700; margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid rgba(13,148,136,0.15); display:flex; align-items:center; gap:8px; }
  .ok   { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); color:#34d399; padding:10px 14px; border-radius:8px; margin:6px 0; font-size:14px; }
  .fail { background:rgba(239,68,68,0.1);  border:1px solid rgba(239,68,68,0.25);  color:#f87171; padding:10px 14px; border-radius:8px; margin:6px 0; font-size:14px; }
  .warn { background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); color:#fbbf24; padding:10px 14px; border-radius:8px; margin:6px 0; font-size:14px; }
  .info { background:rgba(13,148,136,0.08);border:1px solid rgba(13,148,136,0.2);  color:#2dd4bf;  padding:10px 14px; border-radius:8px; margin:6px 0; font-size:14px; }
  code { background:rgba(13,148,136,0.12); padding:2px 8px; border-radius:4px; font-family:monospace; font-size:13px; }
  .fix { font-size:12px; color:#4a7a82; margin-top:4px; padding-left:24px; }
  .summary { background:linear-gradient(135deg,rgba(13,148,136,0.14),rgba(6,182,212,0.06)); border:1px solid rgba(13,148,136,0.3); border-radius:12px; padding:22px; margin-top:24px; }
  .summary h2 { color:#e0f7f4; }
  .next-step { background:rgba(13,148,136,0.08); border-left:3px solid #0d9488; padding:12px 16px; margin:8px 0; border-radius:0 8px 8px 0; color:#90bcbf; font-size:14px; }
  a { color:#2dd4bf; }
  .badge { display:inline-block; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700; }
  .badge-ok  { background:rgba(16,185,129,0.15); color:#34d399; }
  .badge-err { background:rgba(239,68,68,0.15);  color:#f87171; }
</style>
</head>
<body>

<h1>🧠 ResumeIQ — System Diagnostics</h1>
<p class="subtitle">Share this page URL with your teammates to debug setup issues. Delete this file after done.</p>

<?php
$errors = 0;
$warnings = 0;

// ── 1. PHP VERSION ─────────────────────────────────────
echo '<div class="card"><h2>🐘 PHP Version</h2>';
$phpVer = PHP_VERSION;
$phpMajor = (int)PHP_MAJOR_VERSION;
$phpMinor = (int)PHP_MINOR_VERSION;
if ($phpMajor >= 8 && $phpMinor >= 1) {
    ok("PHP $phpVer — Compatible ✓");
} else {
    fail("PHP $phpVer — Need 8.1 or higher!");
    echo '<div class="fix">Install PHP 8.1: <code>sudo apt install php8.1</code> or upgrade XAMPP</div>';
    $errors++;
}
info("PHP ini: " . php_ini_loaded_file());
echo '</div>';

// ── 2. REQUIRED EXTENSIONS ─────────────────────────────
echo '<div class="card"><h2>🧩 PHP Extensions</h2>';
$required = ['mongodb', 'curl', 'mbstring', 'json', 'fileinfo'];
foreach ($required as $ext) {
    if (extension_loaded($ext)) {
        ok("extension <code>$ext</code> loaded");
    } else {
        fail("extension <code>$ext</code> NOT loaded!");
        if ($ext === 'mongodb') {
            echo '<div class="fix">Add <code>extension=mongodb</code> (Windows) or <code>extension=mongodb.so</code> (Mac/Linux) to php.ini then restart Apache</div>';
        }
        $errors++;
    }
}

// MongoDB version
if (extension_loaded('mongodb')) {
    $mongoExtVer = phpversion('mongodb');
    info("MongoDB extension version: $mongoExtVer");
}
echo '</div>';

// ── 3. MONGODB CONNECTION ───────────────────────────────
echo '<div class="card"><h2>🍃 MongoDB Connection</h2>';

$vendorPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($vendorPath)) {
    fail("vendor/autoload.php not found — Composer not run yet!");
    echo '<div class="fix">Run: <code>cd backend && composer require mongodb/mongodb</code></div>';
    $errors++;
    echo '</div>';
} else {
    require_once $vendorPath;
    ok("vendor/autoload.php found");

    try {
        $client = new MongoDB\Client('mongodb://localhost:27017', [], ['serverSelectionTimeoutMS' => 3000]);
        $client->selectDatabase('resumeiq')->command(['ping' => 1]);
        ok("MongoDB connected to <code>localhost:27017</code> ✓");

        // Check collections
        $db = $client->selectDatabase('resumeiq');
        $collections = iterator_to_array($db->listCollectionNames());
        info("Collections in 'resumeiq': " . (empty($collections) ? 'none yet (run setup.php)' : implode(', ', $collections)));

        $userCount = $db->users->countDocuments([]);
        $jobCount  = $db->jobs->countDocuments([]);
        $appCount  = $db->applications->countDocuments([]);
        info("Users: $userCount · Jobs: $jobCount · Applications: $appCount");

        if ($jobCount === 0) {
            warn("No jobs in database. Visit <a href='jobs.php?action=seed'>jobs.php?action=seed</a> to seed sample data.");
            $warnings++;
        }

    } catch (MongoDB\Driver\Exception\ConnectionTimeoutException $e) {
        fail("MongoDB not running! Cannot connect to localhost:27017");
        echo '<div class="fix">Windows: Open Services → start MongoDB | Mac: <code>brew services start mongodb/brew/mongodb-community@7.0</code> | Linux: <code>sudo systemctl start mongod</code></div>';
        $errors++;
    } catch (Exception $e) {
        fail("MongoDB error: " . $e->getMessage());
        $errors++;
    }
    echo '</div>';
}

// ── 4. FILE SYSTEM ──────────────────────────────────────
echo '<div class="card"><h2>📁 File System & Permissions</h2>';
$uploadDir = __DIR__ . '/../uploads/resumes/';
if (is_dir($uploadDir)) {
    ok("uploads/resumes/ directory exists");
    if (is_writable($uploadDir)) {
        ok("uploads/resumes/ is writable");
    } else {
        fail("uploads/resumes/ is NOT writable!");
        echo '<div class="fix">Linux: <code>sudo chmod 777 backend/uploads/resumes/</code> | Windows: Right-click folder → Properties → Security → Full Control</div>';
        $errors++;
    }
} else {
    warn("uploads/resumes/ does not exist (will be created by setup.php)");
    $warnings++;
}

// Check database.php exists
$dbConfig = __DIR__ . '/../config/database.php';
if (file_exists($dbConfig)) {
    ok("config/database.php found");
} else {
    fail("config/database.php NOT found!");
    $errors++;
}

// Check cors.php
$corsFile = __DIR__ . '/../middleware/cors.php';
if (file_exists($corsFile)) {
    ok("middleware/cors.php found");
} else {
    fail("middleware/cors.php NOT found!");
    $errors++;
}
echo '</div>';

// ── 5. APACHE / SERVER ──────────────────────────────────
echo '<div class="card"><h2>🌐 Web Server</h2>';
info("Server software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'));
info("Document root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'));
info("Script path: " . __FILE__);
info("PHP SAPI: " . PHP_SAPI);

// Check mod_rewrite / headers
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    if (in_array('mod_headers', $modules)) {
        ok("mod_headers enabled");
    } else {
        warn("mod_headers not enabled — CORS may fail");
        echo '<div class="fix">Run: <code>sudo a2enmod headers && sudo systemctl restart apache2</code></div>';
        $warnings++;
    }
    if (in_array('mod_rewrite', $modules)) {
        ok("mod_rewrite enabled");
    } else {
        warn("mod_rewrite not enabled");
        $warnings++;
    }
} else {
    info("Cannot check Apache modules (not running under Apache mod_php)");
}
echo '</div>';

// ── 6. HTACCESS CHECK ───────────────────────────────────
echo '<div class="card"><h2>⚙️ Configuration Files</h2>';
$htaccess = __DIR__ . '/../../.htaccess';
$htaccessBackend = __DIR__ . '/../.htaccess';
if (file_exists($htaccessBackend)) {
    ok(".htaccess found in backend/");
} else {
    warn("No .htaccess in backend/ — creating one now...");
    $htContent = "Header always set Access-Control-Allow-Origin \"*\"\nHeader always set Access-Control-Allow-Methods \"GET, POST, PUT, DELETE, OPTIONS\"\nHeader always set Access-Control-Allow-Headers \"Content-Type, X-User-ID, X-User-Role\"\n";
    if (file_put_contents($htaccessBackend, $htContent)) {
        ok(".htaccess created in backend/");
    }
    $warnings++;
}
echo '</div>';

// ── SUMMARY ─────────────────────────────────────────────
echo '<div class="summary">';
echo '<h2>📊 Summary</h2><br/>';
if ($errors === 0 && $warnings === 0) {
    echo '<div class="ok" style="font-size:16px;font-weight:700;">🎉 All checks passed! Your setup is perfect.</div>';
    echo '<div class="next-step">✅ Run <a href="setup.php">setup.php</a> to create database indexes</div>';
    echo '<div class="next-step">✅ Run <a href="jobs.php?action=seed">jobs.php?action=seed</a> to seed sample jobs</div>';
    echo '<div class="next-step">✅ Open <a href="../../frontend/index.html">frontend/index.html</a> to use the app</div>';
} elseif ($errors > 0) {
    echo "<div class='fail' style='font-size:16px;font-weight:700;'>Found $errors error(s) and $warnings warning(s). Fix the ❌ items above first.</div>";
} else {
    echo "<div class='warn' style='font-size:16px;font-weight:700;'>Found $warnings warning(s). App may still work — check ⚠️ items above.</div>";
}
echo '</div>';

echo '<br/><p style="font-size:12px;color:#3d6e76;text-align:center;">⚠️ Delete this file (diagnose.php) after setup is complete — for security.</p>';
?>
</body>
</html>
