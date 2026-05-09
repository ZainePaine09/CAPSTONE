<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$mentorId = trim($_POST['mentorId'] ?? '');

if ($token === '' || $mentorId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and mentorId are required']);
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

    $studentEmail = trim($tokenRow['email'] ?? '');
    $tokenType = strtolower(trim($tokenRow['type'] ?? ''));

    if ($studentEmail === '' || $tokenType !== 'student') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Student access required']);
        exit;
    }

    // Delete the mentor request
    $stmt = $pdo->prepare('DELETE FROM mentor_requests WHERE student_email = ? AND mentor_id = ?');
    $stmt->execute([$studentEmail, $mentorId]);

    // Also cancel the matching pending_approval (any pending one from this student to any admin)
    $paStmt = $pdo->prepare("UPDATE pending_approvals SET status = 'cancelled', updated_at = NOW() WHERE requester_email = ? AND request_type = 'Mentorship Request' AND status = 'pending'");
    $paStmt->execute([$studentEmail]);

    echo json_encode(['success' => true, 'message' => 'Mentorship request cancelled']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
