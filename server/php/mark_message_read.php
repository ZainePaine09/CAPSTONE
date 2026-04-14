<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$messageId = intval($_POST['messageId'] ?? 0);

if ($token === '' || $messageId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and messageId are required']);
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

    $currentEmail = trim($tokenRow['email'] ?? '');
    $currentRole = strtolower(trim($tokenRow['type'] ?? ''));

    if ($currentEmail === '' || !in_array($currentRole, ['admin', 'student'], true)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    $lookupStmt = $pdo->prepare('SELECT id, receiver_email, receiver_role, is_read FROM messages WHERE id = ? LIMIT 1');
    $lookupStmt->execute([$messageId]);
    $messageRow = $lookupStmt->fetch(PDO::FETCH_ASSOC);

    if (!$messageRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Message not found']);
        exit;
    }

    if (strcasecmp((string)$messageRow['receiver_email'], $currentEmail) !== 0 || strtolower((string)$messageRow['receiver_role']) !== $currentRole) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You are not allowed to modify this message']);
        exit;
    }

    if ((int)$messageRow['is_read'] === 1) {
        echo json_encode(['success' => true, 'message' => 'Message already marked as read']);
        exit;
    }

    $updateStmt = $pdo->prepare('UPDATE messages SET is_read = 1, read_at = NOW(), updated_at = NOW() WHERE id = ?');
    $updateStmt->execute([$messageId]);

    echo json_encode([
        'success' => true,
        'message' => 'Message marked as read',
        'messageId' => $messageId
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>