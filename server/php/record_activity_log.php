<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$role = strtolower(trim($_POST['role'] ?? 'admin'));
$action = strtolower(trim($_POST['action'] ?? 'activity'));
$name = trim($_POST['name'] ?? 'Unknown User');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');
$createdAt = trim($_POST['createdAt'] ?? '');

if ($email === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'email is required']);
    exit;
}

if (!in_array($role, ['admin', 'student'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid role']);
    exit;
}

if ($message === '') {
    $message = sprintf('%s %s', ucfirst($role), $action);
}

if ($token === '') {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Token required']);
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

    $tokenEmail = trim($tokenRow['email'] ?? '');
    $tokenType = strtolower(trim($tokenRow['type'] ?? ''));

    if ($tokenEmail !== $email || $tokenType !== $role) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Token does not match request']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO audit_logs (actor_role, actor_email, action, details, target_email, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $role,
        $email,
        $action,
        mb_substr($message, 0, 1000),
        null,
        $createdAt !== '' ? $createdAt : date('Y-m-d H:i:s')
    ]);

    echo json_encode(['success' => true]);
    exit;
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>