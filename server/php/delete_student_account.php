<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$studentId = trim((string)($_POST['studentId'] ?? ''));

if ($studentId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'studentId is required']);
    exit;
}

try {
    $findStmt = $pdo->prepare('SELECT id, active_class FROM students WHERE student_number = ? LIMIT 1');
    $findStmt->execute([$studentId]);
    $student = $findStmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Student account not found']);
        exit;
    }

    if ((int)($student['active_class'] ?? 1) === 1) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Deactivate the student before deleting the account']);
        exit;
    }

    $deleteStmt = $pdo->prepare('DELETE FROM students WHERE id = ?');
    $deleteStmt->execute([(int)$student['id']]);

    echo json_encode(['success' => true, 'message' => 'Student account deleted successfully'], JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}