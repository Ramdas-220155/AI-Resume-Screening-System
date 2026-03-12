<?php

session_start();
require "db.php";

$firstname = trim($_POST['firstname']);
$lastname = trim($_POST['lastname']);
$email = strtolower(trim($_POST['email']));
$password = $_POST['password'];

if(!filter_var($email,FILTER_VALIDATE_EMAIL)){
    die("Invalid Email");
}

if(strlen($password) < 6){
    die("Password must be 6 characters");
}

$user = $users->findOne(["email"=>$email]);

if($user){
    die("Email already exists");
}

$hashed = password_hash($password,PASSWORD_DEFAULT);

$users->insertOne([

"firstname"=>$firstname,
"lastname"=>$lastname,
"email"=>$email,
"password"=>$hashed,
"login_type"=>"normal",
"role" => "candidate",
"created_at"=> new MongoDB\BSON\UTCDateTime()

]);

// Start session
$_SESSION['user'] = [
    "name" => $firstname . " " . $lastname,
    "email" => $email,
    "role" => "candidate"
];

header("Location: dashboard.php");
exit();
?>