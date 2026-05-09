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
    $requestStmt = $pdo->prepare('SELECT id, requester_email, receiver_email, status FROM friend_requests WHERE id = ? LIMIT 1');
    $requestStmt->execute([$requestId]);
    $requestRow = $requestStmt->fetch(PDO::FETCH_ASSOC);

    if (!$requestRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Friend request not found']);
        exit;
    }

    if (strcasecmp($requestRow['receiver_email'], $receiverEmail) !== 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You are not allowed to accept this request']);
        exit;
    }

    if (strtolower($requestRow['status']) === 'accepted') {
        echo json_encode(['success' => true, 'message' => 'Friend request already accepted']);
        exit;
    }

    if (strtolower($requestRow['status']) === 'rejected') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'This request was already rejected']);
        exit;
    }

    $studentEmail1 = $requestRow['requester_email'];
    $studentEmail2 = $requestRow['receiver_email'];
    if (strcasecmp($studentEmail1, $studentEmail2) > 0) {
        [$studentEmail1, $studentEmail2] = [$studentEmail2, $studentEmail1];
    }

    $pdo->beginTransaction();

    $friendStmt = $pdo->prepare('SELECT id FROM friends WHERE student_email_1 = ? AND student_email_2 = ? LIMIT 1');
    $friendStmt->execute([$studentEmail1, $studentEmail2]);
    $friendRow = $friendStmt->fetch(PDO::FETCH_ASSOC);

    if (!$friendRow) {
        $insertFriendStmt = $pdo->prepare('INSERT INTO friends (student_email_1, student_email_2, created_at) VALUES (?, ?, NOW())');
        $insertFriendStmt->execute([$studentEmail1, $studentEmail2]);
    }

    $updateStmt = $pdo->prepare('UPDATE friend_requests SET status = ?, updated_at = NOW() WHERE id = ?');
    $updateStmt->execute(['accepted', $requestId]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Friend request accepted',
        'requestId' => $requestId,
        'status' => 'accepted'
    ]);
    exit;
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>
