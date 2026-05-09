<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'GET required']);
    exit;
}

$token = trim($_GET['token'] ?? '');
if ($token === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token is required']);
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

    $stmt = $pdo->prepare('SELECT job_id, action FROM student_job_actions WHERE student_email = ? ORDER BY created_at DESC, id DESC');
    $stmt->execute([$studentEmail]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $appliedJobIds = [];
    $savedJobIds = [];

    foreach ($rows as $row) {
        $jobId = (string)($row['job_id'] ?? '');
        $action = strtolower((string)($row['action'] ?? ''));

        if ($jobId === '') {
            continue;
        }

        if ($action === 'applied' && !in_array($jobId, $appliedJobIds, true)) {
            $appliedJobIds[] = $jobId;
        }

        if ($action === 'saved' && !in_array($jobId, $savedJobIds, true)) {
            $savedJobIds[] = $jobId;
        }
    }

    echo json_encode([
        'success' => true,
        'appliedJobIds' => $appliedJobIds,
        'savedJobIds' => $savedJobIds,
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>