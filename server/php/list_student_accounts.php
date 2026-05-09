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
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Token required']);
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

    if (strtolower(trim($tokenRow['type'] ?? '')) !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Authentication error']);
    exit;
}

try {
    $stmt = $pdo->query("SELECT
        id,
        email,
        first_name,
        last_name,
        student_number,
        program,
        class_section,
        job_track,
        active_class,
        COALESCE(joined_date, DATE(registered_at)) AS joined_date,
        registered_at
    FROM students
    ORDER BY id DESC");

    $students = array_map(static function (array $row): array {
        $fullName = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
        $studentId = trim((string)($row['student_number'] ?? ''));
        if ($studentId === '' && !empty($row['id'])) {
            $studentId = 'STU-' . str_pad((string)$row['id'], 4, '0', STR_PAD_LEFT);
        }

        return [
            'id' => (int)($row['id'] ?? 0),
            'studentId' => $studentId,
            'fullName' => $fullName !== '' ? $fullName : 'Student',
            'email' => trim((string)($row['email'] ?? '')),
            'classSection' => trim((string)($row['class_section'] ?? '')),
            'course' => trim((string)($row['program'] ?? '')),
            'jobTrack' => trim((string)($row['job_track'] ?? 'Not Assigned')) ?: 'Not Assigned',
            'activeClass' => (int)($row['active_class'] ?? 1) === 1,
            'joinedDate' => (string)($row['joined_date'] ?? ''),
            'registeredAt' => (string)($row['registered_at'] ?? ''),
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode(['success' => true, 'count' => count($students), 'students' => $students], JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
}