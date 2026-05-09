<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$requestedRole = strtoupper(trim($_POST['requestedRole'] ?? 'TEACHER'));

if ($token === '' || $name === '' || $email === '' || $requestedRole === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, name, email, and requestedRole are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email']);
    exit;
}

if (!in_array($requestedRole, ['TEACHER', 'DEAN', 'PRINCIPAL'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid requested role']);
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

    $duplicateStmt = $pdo->prepare('SELECT id, account_status FROM staff_accounts WHERE email = ? LIMIT 1');
    $duplicateStmt->execute([$email]);
    $existing = $duplicateStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'A staff account with this email already exists']);
        exit;
    }

    $insertStmt = $pdo->prepare('INSERT INTO staff_accounts (name, email, role, requested_role, account_status, created_by_email, created_at, reviewed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NULL, NOW())');
    $insertStmt->execute([
        mb_substr($name, 0, 150),
        mb_substr($email, 0, 191),
        'TEACHER',
        $requestedRole,
        'pending',
        $adminEmail,
    ]);

    $accountId = (int)$pdo->lastInsertId();

    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (actor_email, action, details, target_email, created_at) VALUES (?, ?, ?, ?, NOW())');
    $auditStmt->execute([
        $adminEmail,
        'create_request',
        sprintf('Created pending staff request for %s (%s).', $name, $requestedRole),
        $email,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Pending staff request created successfully',
        'accountId' => $accountId
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>