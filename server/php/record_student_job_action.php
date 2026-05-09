<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$jobId = trim($_POST['jobId'] ?? '');
$jobTitle = trim($_POST['jobTitle'] ?? '');
$company = trim($_POST['company'] ?? '');
$action = strtolower(trim($_POST['action'] ?? ''));

if ($token === '' || $jobId === '' || $jobTitle === '' || $action === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, jobId, jobTitle, and action are required']);
    exit;
}

if (!in_array($action, ['applied', 'saved'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid job action']);
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

    $stmt = $pdo->prepare('INSERT INTO student_job_actions (student_email, job_id, job_title, company, action, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE job_title = VALUES(job_title), company = VALUES(company), updated_at = NOW()');
    $stmt->execute([
        $studentEmail,
        $jobId,
        mb_substr($jobTitle, 0, 255),
        mb_substr($company, 0, 191),
        $action,
    ]);

    echo json_encode(['success' => true, 'message' => sprintf('Job marked as %s successfully', $action)]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>