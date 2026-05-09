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

try {
    if ($token !== '') {
        $tokenStmt = $pdo->prepare('SELECT email, type FROM tokens WHERE token = ? LIMIT 1');
        $tokenStmt->execute([$token]);
        $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

        if ($tokenRow) {
            $tokenEmail = trim($tokenRow['email'] ?? '');
            $tokenType = strtolower(trim($tokenRow['type'] ?? ''));

            if ($tokenEmail !== '' && ($tokenEmail === $email || $tokenType === $role || $role === 'student')) {
                // Allowed to continue.
            }
        }
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
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>