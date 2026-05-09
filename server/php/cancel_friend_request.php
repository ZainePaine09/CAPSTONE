<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$requestId = (int)($_POST['requestId'] ?? 0);

if ($token === '' || $requestId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and requestId are required']);
    exit;
}

try {
    $tokenStmt = $pdo->prepare('SELECT email FROM tokens WHERE token = ? AND expires_at > NOW() LIMIT 1');
    $tokenStmt->execute([$token]);
    $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $currentEmail = trim($tokenRow['email'] ?? '');
    if ($currentEmail === '') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    $requestStmt = $pdo->prepare('SELECT id, requester_email, status FROM friend_requests WHERE id = ? LIMIT 1');
    $requestStmt->execute([$requestId]);
    $requestRow = $requestStmt->fetch(PDO::FETCH_ASSOC);

    if (!$requestRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Friend request not found']);
        exit;
    }

    if (strcasecmp((string)$requestRow['requester_email'], $currentEmail) !== 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You are not allowed to cancel this request']);
        exit;
    }

    if (strtolower((string)$requestRow['status']) !== 'pending') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Only pending requests can be cancelled']);
        exit;
    }

    $deleteStmt = $pdo->prepare('DELETE FROM friend_requests WHERE id = ?');
    $deleteStmt->execute([$requestId]);

    echo json_encode([
        'success' => true,
        'message' => 'Friend request cancelled',
        'requestId' => $requestId
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>