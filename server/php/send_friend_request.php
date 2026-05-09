<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$receiverEmail = trim($_POST['receiverEmail'] ?? '');

if ($token === '' || $receiverEmail === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and receiverEmail are required']);
    exit;
}

if (!filter_var($receiverEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid receiver email']);
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

    $requesterEmail = trim($tokenRow['email'] ?? '');
    if ($requesterEmail === '') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    if (strcasecmp($requesterEmail, $receiverEmail) === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'You cannot send a friend request to yourself']);
        exit;
    }

    $receiverStmt = $pdo->prepare('SELECT email FROM students WHERE email = ? LIMIT 1');
    $receiverStmt->execute([$receiverEmail]);
    $receiverRow = $receiverStmt->fetch(PDO::FETCH_ASSOC);

    if (!$receiverRow) {
        $adminReceiverStmt = $pdo->prepare('SELECT email FROM admins WHERE email = ? LIMIT 1');
        $adminReceiverStmt->execute([$receiverEmail]);
        $receiverRow = $adminReceiverStmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$receiverRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Receiver account not found']);
        exit;
    }

    $existingStmt = $pdo->prepare('SELECT id, status FROM friend_requests WHERE requester_email = ? AND receiver_email = ? LIMIT 1');
    $existingStmt->execute([$requesterEmail, $receiverEmail]);
    $existingRow = $existingStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingRow && strtolower($existingRow['status'] ?? '') === 'pending') {
        echo json_encode(['success' => true, 'message' => 'Friend request already pending']);
        exit;
    }

    if ($existingRow) {
        $updateStmt = $pdo->prepare('UPDATE friend_requests SET status = ?, updated_at = NOW() WHERE id = ?');
        $updateStmt->execute(['pending', $existingRow['id']]);
    } else {
        $insertStmt = $pdo->prepare('INSERT INTO friend_requests (requester_email, receiver_email, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
        $insertStmt->execute([$requesterEmail, $receiverEmail, 'pending']);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Friend request sent successfully',
        'requesterEmail' => $requesterEmail,
        'receiverEmail' => $receiverEmail,
        'status' => 'pending'
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>