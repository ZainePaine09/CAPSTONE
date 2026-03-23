<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$raw = $_POST;
$email = trim($raw['email'] ?? '');
$password = $raw['password'] ?? '';
$first = trim($raw['firstName'] ?? '');
$last = trim($raw['lastName'] ?? '');
$studentNumber = trim($raw['studentNumber'] ?? '');
$program = trim($raw['program'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

try {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO students (email, password_hash, first_name, last_name, student_number, program, registered_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))');
    $stmt->execute([$email, $hash, $first, $last, $studentNumber, $program]);

    // create token
    $token = bin2hex(random_bytes(24));
    $tstmt = $pdo->prepare('INSERT INTO tokens (token, email, type, created_at) VALUES (?, ?, ?, datetime("now"))');
    $tstmt->execute([$token, $email, 'student']);

    echo json_encode(['success' => true, 'token' => $token]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>