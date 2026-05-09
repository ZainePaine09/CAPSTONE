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
$mentorName = trim($_POST['mentorName'] ?? '');
$mentorTitle = trim($_POST['mentorTitle'] ?? '');
$mentorCompany = trim($_POST['mentorCompany'] ?? '');

if ($token === '' || $mentorId === '' || $mentorName === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, mentorId, and mentorName are required']);
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

    $studentEmail = trim($tokenRow['email'] ?? '');
    $tokenType = strtolower(trim($tokenRow['type'] ?? ''));

    if ($studentEmail === '' || $tokenType !== 'student') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Student access required']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO mentor_requests (student_email, mentor_id, mentor_name, mentor_title, mentor_company, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE mentor_name = VALUES(mentor_name), mentor_title = VALUES(mentor_title), mentor_company = VALUES(mentor_company), status = VALUES(status), updated_at = NOW()');
    $stmt->execute([
        $studentEmail,
        $mentorId,
        mb_substr($mentorName, 0, 150),
        mb_substr($mentorTitle, 0, 191),
        mb_substr($mentorCompany, 0, 191),
        'pending',
    ]);

    echo json_encode(['success' => true, 'message' => 'Mentorship request saved successfully']);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>