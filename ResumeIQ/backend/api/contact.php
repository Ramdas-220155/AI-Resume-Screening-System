<?php
/*
 * contact.php — Contact Form API · ResumeIQ
 *
 * POST ?action=send   → Save message + send email notification
 * GET  ?action=list   → Admin: list all messages (HR auth required)
 */
require_once __DIR__ . '/../middleware/cors.php';
setCors();

$action = $_GET['action'] ?? 'send';

/* ── SEND CONTACT MESSAGE ──────────────────────────────── */
if ($action === 'send') {
    $b = body();

    $name    = trim($b['name']    ?? '');
    $email   = trim($b['email']   ?? '');
    $subject = trim($b['subject'] ?? 'General Inquiry');
    $message = trim($b['message'] ?? '');

    /* Validate */
    if (!$name)    fail('Name is required');
    if (!$email)   fail('Email is required');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Invalid email address');
    if (!$message) fail('Message is required');
    if (strlen($message) < 10) fail('Message is too short (min 10 characters)');

    /* Save to MongoDB */
    $contacts = getCol('contacts');
    $result = $contacts->insertOne([
        'name'       => $name,
        'email'      => $email,
        'subject'    => $subject,
        'message'    => $message,
        'status'     => 'new',        // new | read | replied
        'ip'         => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'created_at' => nowUTC(),
    ]);

    /* Optional: send email notification to admin
     * Uncomment and configure if you have PHP mail() or SMTP set up
     *
     * $to      = 'hello@resumeiq.ai';
     * $subj    = "New Contact: $subject — from $name";
     * $body    = "Name: $name\nEmail: $email\n\nMessage:\n$message";
     * $headers = "From: noreply@resumeiq.ai\r\nReply-To: $email";
     * mail($to, $subj, $body, $headers);
     */

    ok([
        'id'   => (string)$result->getInsertedId(),
        'name' => $name,
    ], "Thank you $name! We'll get back to you within 24 hours.");
}

/* ── LIST MESSAGES (HR/Admin only) ─────────────────────── */
if ($action === 'list') {
    requireHR();

    $contacts = getCol('contacts');
    $cursor   = $contacts->find([], ['sort' => ['created_at' => -1], 'limit' => 100]);

    $msgs = [];
    foreach ($cursor as $m) {
        $msgs[] = [
            'id'         => (string)$m['_id'],
            'name'       => $m['name']    ?? '',
            'email'      => $m['email']   ?? '',
            'subject'    => $m['subject'] ?? '',
            'message'    => $m['message'] ?? '',
            'status'     => $m['status']  ?? 'new',
            'created_at' => isset($m['created_at']) ? msToDate($m['created_at']) : '',
        ];
    }

    ok(['messages' => $msgs, 'total' => count($msgs)]);
}

/* ── MARK AS READ ───────────────────────────────────────── */
if ($action === 'mark_read') {
    requireHR();
    $b  = body();
    $id = trim($b['id'] ?? '');
    if (!$id) fail('id is required');

    try {
        $contacts = getCol('contacts');
        $contacts->updateOne(
            ['_id' => toObjId($id)],
            ['$set' => ['status' => 'read']]
        );
    } catch (Exception $e) {
        fail('Invalid ID');
    }

    ok([], 'Marked as read');
}

fail('Unknown action', 404);
