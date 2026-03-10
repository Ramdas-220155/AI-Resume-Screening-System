<?php

require '../vendor/autoload.php';

//$client = new MongoDB\Client("mongodb://localhost:27017");

$db = $client->resume_screening;

$jobsCollection = $db->jobs;

?>