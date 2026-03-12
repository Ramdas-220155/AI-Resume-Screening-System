<?php
require "db.php"; // Your MongoDB connection file

try {
    $result = $users->insertOne([
        "firstname" => "Test",
        "lastname" => "User",
        "email" => "testuser123@example.com",
        "password" => password_hash("123456", PASSWORD_DEFAULT),
        "login_type" => "normal",
        "role" => "candidate",
        "created_at" => new MongoDB\BSON\UTCDateTime()
    ]);

    echo "Inserted user ID: " . $result->getInsertedId();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>