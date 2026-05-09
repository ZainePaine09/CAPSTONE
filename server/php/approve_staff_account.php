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

if ($token === '' || $accountId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and accountId are required']);
    exit;
}

try {
    $tokenStmt = $pdo->prepare('SELECT email, type FROM tokens WHERE token = ? LIMIT 1');
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

    $lookupStmt = $pdo->prepare('SELECT id, name, email, role, requested_role, account_status FROM staff_accounts WHERE id = ? LIMIT 1');
    $lookupStmt->execute([$accountId]);
    $account = $lookupStmt->fetch(PDO::FETCH_ASSOC);

    if (!$account) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Staff account not found']);
        exit;
    }

    $currentStatus = strtolower((string)$account['account_status']);
    if ($currentStatus === 'approved') {
        echo json_encode(['success' => true, 'message' => 'Staff account already approved']);
        exit;
    }

    $requestedRole = strtoupper((string)($account['requested_role'] ?: 'TEACHER'));
    $updateStmt = $pdo->prepare('UPDATE staff_accounts SET role = ?, account_status = ?, reviewed_at = NOW(), updated_at = NOW() WHERE id = ?');
    $updateStmt->execute([$requestedRole, 'approved', $accountId]);

    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (actor_email, action, details, target_email, created_at) VALUES (?, ?, ?, ?, NOW())');
    $auditStmt->execute([
        $adminEmail,
        'approve',
        sprintf('Approved %s as %s.', $account['name'], $requestedRole),
        $account['email'],
    ]);

    echo json_encode(['success' => true, 'message' => 'Staff request approved']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>