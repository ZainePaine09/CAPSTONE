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

    $receiverEmail = trim($tokenRow['email'] ?? '');
    $requestStmt = $pdo->prepare('SELECT id, receiver_email, status FROM friend_requests WHERE id = ? LIMIT 1');
    $requestStmt->execute([$requestId]);
    $requestRow = $requestStmt->fetch(PDO::FETCH_ASSOC);

    if (!$requestRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Friend request not found']);
        exit;
    }

    if (strcasecmp($requestRow['receiver_email'], $receiverEmail) !== 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You are not allowed to reject this request']);
        exit;
    }

    if (strtolower($requestRow['status']) === 'rejected') {
        echo json_encode(['success' => true, 'message' => 'Friend request already rejected']);
        exit;
    }

    if (strtolower($requestRow['status']) === 'accepted') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'This request was already accepted']);
        exit;
    }

    $updateStmt = $pdo->prepare('UPDATE friend_requests SET status = ?, updated_at = NOW() WHERE id = ?');
    $updateStmt->execute(['rejected', $requestId]);

    echo json_encode([
        'success' => true,
        'message' => 'Friend request rejected',
        'requestId' => $requestId,
        'status' => 'rejected'
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
