<?php
/* cors.php — CORS Headers, JSON Helpers, Auth Guard · ResumeIQ v3.0 */

require_once __DIR__ . '/../config/database.php';

function setCors(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID, X-User-Role');
    header('Content-Type: application/json; charset=UTF-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

function ok(array $data = [], string $msg = 'OK'): void {
    echo json_encode(array_merge(['success' => true, 'message' => $msg], $data));
    exit;
}

function fail(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function uid(): ?string   { return $_SERVER['HTTP_X_USER_ID']   ?? null; }
function urole(): string  { return $_SERVER['HTTP_X_USER_ROLE'] ?? 'user'; }

function requireAuth(): array {
    $id = uid();
    if (!$id) fail('Unauthorized', 401);
    try {
        $u = getCol('users')->findOne(['_id' => toObjId($id)]);
        if (!$u) fail('Unauthorized — user not found', 401);
        return (array) $u;
    } catch (Exception $e) {
        fail('Unauthorized — invalid ID', 401);
    }
}

function requireHR(): array {
    $u = requireAuth();
    if (($u['role'] ?? 'user') !== 'hr') fail('Forbidden — HR access required', 403);
    return $u;
}
