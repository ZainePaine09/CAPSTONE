<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$approvalId = intval($_POST['approvalId'] ?? 0);

if ($token === '' || $approvalId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and approvalId are required']);
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

    if ($currentEmail === '' || $currentRole !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Only admin accounts can approve requests']);
        exit;
    }

    $lookupStmt = $pdo->prepare('SELECT id, receiver_email, status FROM pending_approvals WHERE id = ? LIMIT 1');
    $lookupStmt->execute([$approvalId]);
    $approvalRow = $lookupStmt->fetch(PDO::FETCH_ASSOC);

    if (!$approvalRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Approval request not found']);
        exit;
    }

    if (strcasecmp((string)$approvalRow['receiver_email'], $currentEmail) !== 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You are not allowed to approve this request']);
        exit;
    }

    if (strtolower((string)$approvalRow['status']) !== 'pending') {
        echo json_encode(['success' => true, 'message' => 'Request already reviewed']);
        exit;
    }

    $updateStmt = $pdo->prepare('UPDATE pending_approvals SET status = ?, reviewed_at = NOW(), updated_at = NOW() WHERE id = ?');
    $updateStmt->execute(['approved', $approvalId]);

    echo json_encode([
        'success' => true,
        'message' => 'Request approved successfully',
        'approvalId' => $approvalId,
        'status' => 'approved'
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>