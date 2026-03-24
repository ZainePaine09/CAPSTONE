<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$raw = $_POST;
$token = trim($raw['token'] ?? '');

if (!$token) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token required']);
    exit;
}

try {
    // Verify token and get associated email
    $tstmt = $pdo->prepare('SELECT email FROM tokens WHERE token = ? LIMIT 1');
    $tstmt->execute([$token]);
    $trow = $tstmt->fetch(PDO::FETCH_ASSOC);
    if (!$trow) {
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $email = $trow['email'];
    $stmt = $pdo->prepare('SELECT email, first_name, last_name, student_number, program, registered_at FROM students WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'Profile not found']);
        exit;
    }

    $profile = [
        'firstName' => $row['first_name'] ?? '',
        'lastName' => $row['last_name'] ?? '',
        'fullName' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')) ?: $row['email'],
        'email' => $row['email'],
        'studentId' => $row['student_number'] ?? '',
        'studentNumber' => $row['student_number'] ?? '',
        'program' => $row['program'] ?? '',
        'registeredDate' => $row['registered_at'] ?? ''
    ];

    echo json_encode(['success' => true, 'profile' => $profile]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
