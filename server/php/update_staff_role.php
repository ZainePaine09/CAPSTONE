<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$accountId = (int)($_POST['accountId'] ?? 0);
$newRole = strtoupper(trim($_POST['newRole'] ?? ''));

if ($token === '' || $accountId <= 0 || $newRole === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, accountId, and newRole are required']);
    exit;
}

if (!in_array($newRole, ['TEACHER', 'DEAN', 'PRINCIPAL'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid role']);
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

    $lookupStmt = $pdo->prepare('SELECT id, name, email, role, account_status FROM staff_accounts WHERE id = ? LIMIT 1');
    $lookupStmt->execute([$accountId]);
    $account = $lookupStmt->fetch(PDO::FETCH_ASSOC);

    if (!$account) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Staff account not found']);
        exit;
    }

    if (strtolower((string)$account['account_status']) !== 'approved') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Only approved staff can be reassigned']);
        exit;
    }

    $previousRole = strtoupper((string)$account['role']);
    if ($previousRole === $newRole) {
        echo json_encode(['success' => true, 'message' => 'Role already set']);
        exit;
    }

    $updateStmt = $pdo->prepare('UPDATE staff_accounts SET role = ?, updated_at = NOW() WHERE id = ?');
    $updateStmt->execute([$newRole, $accountId]);

    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (actor_email, action, details, target_email, created_at) VALUES (?, ?, ?, ?, NOW())');
    $auditStmt->execute([
        $adminEmail,
        'update_role',
        sprintf('Updated %s role from %s to %s.', $account['name'], $previousRole, $newRole),
        $account['email'],
    ]);

    echo json_encode(['success' => true, 'message' => 'Role updated successfully']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>