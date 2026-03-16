<?php
/* auth.php — Register & Login (User + HR) */

ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

/* ───────── AUTLOAD & INCLUDES ───────── */
require_once __DIR__ . '/../vendor/autoload.php';      // Must be first
require_once __DIR__ . '/../middleware/cors.php';


/* ───────── CORS ───────── */
setCors();

/* ───────── INPUT ───────── */
$action = $_GET['action'] ?? '';
$b = body();

/* ───────── ACTION ROUTER ───────── */
switch ($action) {

    /* ───────── REGISTER ───────── */
    case 'register':
        $name    = trim($b['name'] ?? '');
        $email   = strtolower(trim($b['email'] ?? ''));
        $pwd     = $b['password'] ?? '';
        $role    = in_array($b['role'] ?? 'user', ['user','hr']) ? $b['role'] : 'user';
        $company = trim($b['company'] ?? '');

        if (!$name || !$email || !$pwd) fail('Name, email and password are required');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Invalid email address');
        if (strlen($pwd) < 6) fail('Password must be at least 6 characters');

        $users = getCol('users');

        if ($users->findOne(['email' => $email])) {
            fail('An account with this email already exists', 409);
        }

        $words = array_filter(explode(' ', $name));
        $initials = strtoupper(substr(implode('', array_map(fn($w)=>$w[0], $words)), 0, 2));

        $doc = [
            'name'       => $name,
            'email'      => $email,
            'password'   => password_hash($pwd, PASSWORD_BCRYPT),
            'initials'   => $initials,
            'role'       => $role,
            'company'    => $company,
            'plan'       => 'Free',
            'created_at' => nowUTC(),
            'updated_at' => nowUTC()
        ];

        $res = $users->insertOne($doc);

        ok([
            'user_id' => (string)$res->getInsertedId(),
            'name'    => $name,
            'email'   => $email,
            'initials'=> $initials,
            'plan'    => 'Free',
            'role'    => $role
        ], 'Registration successful');
        exit;

    /* ───────── LOGIN ───────── */
    case 'login':
        $email = strtolower(trim($b['email'] ?? ''));
        $pwd   = $b['password'] ?? '';
        $role  = in_array($b['role'] ?? 'user', ['user','hr']) ? $b['role'] : 'user';

        if (!$email || !$pwd) fail('Email and password are required');

        $users = getCol('users');
        $u = $users->findOne(['email' => $email]);

        if (!$u || !password_verify($pwd, $u['password'])) {
            fail('Invalid email or password', 401);
        }

        if (($u['role'] ?? 'user') !== $role) {
            fail('Incorrect login portal for this account', 401);
        }

        ok([
            'user_id'  => (string)$u['_id'],
            'name'     => $u['name'],
            'email'    => $u['email'],
            'initials' => $u['initials'] ?? strtoupper($u['name'][0]),
            'plan'     => $u['plan'] ?? 'Free',
            'role'     => $u['role'] ?? 'user',
            'company'  => $u['company'] ?? ''
        ], 'Login successful');
        exit;

    /* ───────── DEFAULT ───────── */
    default:
        fail('Unknown action', 404);
}