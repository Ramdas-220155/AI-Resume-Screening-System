<?php

session_start();

/* LOAD AUTOLOAD */

require __DIR__ . '/vendor/autoload.php';
require "db.php";

use Dotenv\Dotenv;
use Google\Client;
use Google\Service\Oauth2;
use MongoDB\Client as MongoClient;

/* LOAD ENV VARIABLES */

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();


/* GOOGLE CLIENT CONFIG */

$client = new Client();

$client->setClientId($_ENV['GOOGLE_CLIENT_ID']);
$client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
$client->setRedirectUri($_ENV['GOOGLE_REDIRECT_URI']);

$client->addScope("email");
$client->addScope("profile");


/* CHECK AUTH CODE */

if (!isset($_GET['code'])) {
    die("Google login failed");
}

try {

    /* GET TOKEN FROM GOOGLE */

    $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);

    if (isset($token['error']) || !$token) {
        throw new Exception("Google authentication failed");
    }

    $client->setAccessToken($token);


    /* FETCH GOOGLE USER */

    $oauth = new Oauth2($client);
    $googleUser = $oauth->userinfo->get();


    /* VALIDATE EMAIL */

    if (!filter_var($googleUser->email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email received from Google");
    }


    /* CHECK VERIFIED EMAIL */

    if (!$googleUser->verifiedEmail) {
        throw new Exception("Google email not verified");
    }


    /* SANITIZE USER DATA */

    $name = htmlspecialchars($googleUser->name, ENT_QUOTES, 'UTF-8');
    $email = strtolower(trim($googleUser->email));
    $picture = filter_var($googleUser->picture, FILTER_SANITIZE_URL);


    /* CONNECT TO MONGODB */

    $mongo = new MongoClient("mongodb://localhost:27017");

    $db = $mongo->resumeIQ;

    $users = $db->users;


    /* CHECK IF USER EXISTS */

    $existingUser = $users->findOne([
        "email" => $email
    ]);


    /* INSERT USER IF FIRST LOGIN */

  if (!$existingUser) {
        // Insert new Google user
        $users->insertOne([
            "name" => $name,
            "email" => $email,
            "picture" => $picture,
            "login_type" => "google",
            "role" => "candidate",
            "created_at" => new MongoDB\BSON\UTCDateTime()
        ]);
    }

    /* SECURE SESSION */

    session_regenerate_id(true);

    $_SESSION['user'] = [
        "name" => $name,
        "email" => $email,
        "picture" => $picture,
        "role" => "candidate"
    ];

    $_SESSION['login_time'] = time();


    /* REDIRECT USER */

    header("Location: dashboard.php");
    exit();


} catch (Exception $e) {

    /* LOG ERROR */

    error_log($e->getMessage());

    echo "Login failed. Please try again.";
}
?>