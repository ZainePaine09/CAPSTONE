<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/csrf.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

verifyCsrfOrigin();

$raw = $_POST;
$email = trim($raw['email'] ?? '');
$password = $raw['password'] ?? '';
$first = trim($raw['firstName'] ?? '');
$last = trim($raw['lastName'] ?? '');
$studentNumber = trim($raw['studentNumber'] ?? '');
$program = trim($raw['program'] ?? '');
$graduateYear = trim($raw['graduateYear'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

if ($graduateYear === '' || !preg_match('/^\d{4}$/', $graduateYear)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Valid graduation year is required']);
    exit;
}

if ($studentNumber === '' || !preg_match('/^\d{11}$/', $studentNumber)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Student number must be exactly 11 digits']);
    exit;
}

// Check for duplicate student number
try {
    $dupCheck = $pdo->prepare('SELECT id FROM students WHERE student_number = ? LIMIT 1');
    $dupCheck->execute([$studentNumber]);
    if ($dupCheck->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Student number is already registered']);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}

try {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO students (email, password_hash, first_name, last_name, student_number, program, graduation_year, class_section, job_track, active_class, joined_date, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 1, CURDATE(), NOW())');
    $stmt->execute([$email, $hash, $first, $last, $studentNumber, $program, $graduateYear, 'Not Assigned']);

    $alumniStmt = $pdo->prepare('INSERT INTO alumni_profiles (student_email, full_name, student_number, program, graduation_year, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), student_number = VALUES(student_number), program = VALUES(program), graduation_year = VALUES(graduation_year), updated_at = NOW()');
    $alumniStmt->execute([$email, trim($first . ' ' . $last), $studentNumber, $program, $graduateYear]);

    // create token
    $token = bin2hex(random_bytes(24));
    $tstmt = $pdo->prepare('INSERT INTO tokens (token, email, type, created_at, expires_at) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))');
    $tstmt->execute([$token, $email, 'student']);

    $pdo->commit();

    echo json_encode(['success' => true, 'token' => $token]);
    exit;
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>