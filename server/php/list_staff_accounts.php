<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'GET required']);
    exit;
}

$token = trim($_GET['token'] ?? '');
if ($token === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token is required']);
    exit;
}

try {
    $tokenStmt = $pdo->prepare('SELECT email, type FROM tokens WHERE token = ? AND expires_at > NOW() LIMIT 1');
    $tokenStmt->execute([$token]);
    $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $adminEmail = trim($tokenRow['email'] ?? '');
    $tokenType = strtolower(trim($tokenRow['type'] ?? ''));

    if ($adminEmail === '' || $tokenType !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $staffStmt = $pdo->query('SELECT id, name, email, role, requested_role, account_status, created_by_email, created_at, reviewed_at, updated_at FROM staff_accounts ORDER BY created_at DESC, id DESC');
    $staffAccounts = $staffStmt->fetchAll(PDO::FETCH_ASSOC);

    $auditStmt = $pdo->query('SELECT id, actor_email, action, details, target_email, created_at FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 20');
    $auditLogs = $auditStmt->fetchAll(PDO::FETCH_ASSOC);

    $counts = [
        'pending' => 0,
        'approved' => 0,
        'principal' => 0,
    ];

    foreach ($staffAccounts as $account) {
        $status = strtolower((string)($account['account_status'] ?? 'pending'));
        $role = strtoupper((string)($account['role'] ?? 'TEACHER'));
        if ($status === 'pending') {
            $counts['pending'] += 1;
        }
        if ($status === 'approved') {
            $counts['approved'] += 1;
        }
        if ($status === 'approved' && $role === 'PRINCIPAL') {
            $counts['principal'] += 1;
        }
    }

    echo json_encode([
        'success' => true,
        'staffAccounts' => $staffAccounts,
        'auditLogs' => $auditLogs,
        'counts' => $counts,
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>