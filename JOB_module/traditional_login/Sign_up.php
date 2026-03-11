<?php

if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo "Invalid request";
    exit;
}


$name     = $_POST['username'] ?? '';
$email    = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($name) || empty($email) || empty($password)) {
    echo "All fields are required";
    exit;
}

if (strlen($password) < 6) {
    echo "Password must be at least 6 characters";
    exit;
}


$hashedPassword = password_hash($password, PASSWORD_DEFAULT);


$conn = new mysqli("localhost", "root", "", "db");

if ($conn->connect_error) {
    die("Database connection failed");
}

$checkEmail = "SELECT id FROM users WHERE email = '$email'";
$result = $conn->query($checkEmail);

if ($result->num_rows > 0) {
    echo "Account already exists. Please login.";
    exit;
}


$insertQuery = "
    INSERT INTO users (username, email, password)
    VALUES ('$name', '$email', '$hashedPassword')
";

if ($conn->query($insertQuery)) {
    echo "Signup successful!";
} else {
    echo "Something went wrong";
}


$conn->close();

?>
