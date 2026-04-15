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
$requestType = trim($_POST['requestType'] ?? '');

if ($token === '' || $receiverEmail === '' || $requestType === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, receiverEmail, and requestType are required']);
    exit;
}

if (!filter_var($receiverEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid receiver email']);
    exit;
}

$requestType = mb_substr($requestType, 0, 120);

try {
    $tokenStmt = $pdo->prepare('SELECT email, type FROM tokens WHERE token = ? LIMIT 1');
    $tokenStmt->execute([$token]);
    $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $requesterEmail = trim($tokenRow['email'] ?? '');
    $requesterRole = strtolower(trim($tokenRow['type'] ?? ''));

    if ($requesterEmail === '' || !in_array($requesterRole, ['admin', 'student'], true)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    if (strcasecmp($requesterEmail, $receiverEmail) === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Requester and receiver cannot be the same']);
        exit;
    }

    $receiverStmt = $pdo->prepare('SELECT email FROM admins WHERE email = ? LIMIT 1');
    $receiverStmt->execute([$receiverEmail]);
    $receiverRow = $receiverStmt->fetch(PDO::FETCH_ASSOC);

    if (!$receiverRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Receiver account not found']);
        exit;
    }

    $existingStmt = $pdo->prepare('SELECT id, status FROM pending_approvals WHERE requester_email = ? AND receiver_email = ? AND request_type = ? LIMIT 1');
    $existingStmt->execute([$requesterEmail, $receiverEmail, $requestType]);
    $existingRow = $existingStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingRow && strtolower((string)$existingRow['status']) === 'pending') {
        echo json_encode(['success' => true, 'message' => 'Pending approval already exists']);
        exit;
    }

    if ($existingRow) {
        $updateStmt = $pdo->prepare('UPDATE pending_approvals SET status = ?, reviewed_at = NULL, updated_at = NOW() WHERE id = ?');
        $updateStmt->execute(['pending', $existingRow['id']]);
        $approvalId = (int)$existingRow['id'];
    } else {
        $insertStmt = $pdo->prepare('INSERT INTO pending_approvals (requester_email, receiver_email, request_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())');
        $insertStmt->execute([$requesterEmail, $receiverEmail, $requestType, 'pending']);
        $approvalId = (int)$pdo->lastInsertId();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Pending approval created successfully',
        'data' => [
            'id' => $approvalId,
            'requesterEmail' => $requesterEmail,
            'receiverEmail' => $receiverEmail,
            'requestType' => $requestType,
            'status' => 'pending'
        ]
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>