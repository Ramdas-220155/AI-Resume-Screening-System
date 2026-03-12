<?php

session_start();

/* LOAD AUTOLOAD */

require __DIR__ . '/vendor/autoload.php';

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
header("Location: $login_url");

exit();
echo "HIIIII";
?>


