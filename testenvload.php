<?php
require __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "GOOGLE_CLIENT_ID: " . $_ENV['GOOGLE_CLIENT_ID'];