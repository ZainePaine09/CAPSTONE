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

    $stmt = $pdo->prepare('SELECT mentor_id FROM mentor_requests WHERE student_email = ? ORDER BY created_at DESC, id DESC');
    $stmt->execute([$studentEmail]);
    $mentorIds = array_map(static fn(array $row): string => (string)($row['mentor_id'] ?? ''), $stmt->fetchAll(PDO::FETCH_ASSOC));
    $mentorIds = array_values(array_filter($mentorIds, static fn(string $value): bool => $value !== ''));

    echo json_encode(['success' => true, 'mentorIds' => $mentorIds]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>