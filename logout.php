<?php
session_start();
session_destroy();
header("Location: usersignup.html");
exit();