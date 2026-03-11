<?php

session_start();

/* LOAD AUTOLOAD */

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Google\Client;


/* LOAD ENV */

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();


/* GOOGLE CLIENT */

$client = new Client();

$client->setClientId($_ENV['GOOGLE_CLIENT_ID']);
$client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
$client->setRedirectUri($_ENV['GOOGLE_REDIRECT_URI']);

$client->addScope("email");
$client->addScope("profile");


/* CREATE LOGIN URL */

$login_url = $client->createAuthUrl();

?>

<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<title>ResumeIQ Login</title>

<style>

body{
font-family:Arial;
background:#f4f6fb;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
margin:0;
}

.login-container{
background:white;
padding:40px;
border-radius:10px;
box-shadow:0 10px 25px rgba(0,0,0,0.15);
text-align:center;
width:320px;
}

.title{
margin-bottom:25px;
}

.google-btn{
display:flex;
align-items:center;
justify-content:center;
gap:10px;
background:#4285F4;
color:white;
padding:12px;
border-radius:6px;
text-decoration:none;
font-weight:bold;
transition:0.2s;
}

.google-btn:hover{
background:#3367d6;
}

.profile-img{
border-radius:50%;
margin-top:10px;
}

.logout-btn{
margin-top:15px;
padding:10px 15px;
border:none;
background:#ef4444;
color:white;
border-radius:5px;
cursor:pointer;
}

.logout-btn:hover{
background:#dc2626;
}

</style>

</head>

<body>

<div class="login-container">

<h2 class="title">ResumeIQ Login</h2>

<?php if (!isset($_SESSION['user'])): ?>

<a href="<?= htmlspecialchars($login_url) ?>" class="google-btn">

<img src="./Icons/google-color-svgrepo-com.svg" width="20">

Continue with Google

</a>

<?php else: ?>

<h3>Welcome</h3>

<p><?= htmlspecialchars($_SESSION['user']['name']) ?></p>

<img 
src="<?= htmlspecialchars($_SESSION['user']['picture']) ?>" 
width="80"
class="profile-img"
>

<p><?= htmlspecialchars($_SESSION['user']['email']) ?></p>

<a href="logout.php">
<button class="logout-btn">Logout</button>
</a>

<?php endif; ?>

</div>

</body>

</html>