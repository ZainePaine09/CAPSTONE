<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$raw = $_POST;
$originalStudentId = trim((string)($raw['originalStudentId'] ?? ''));
$originalStudentEmail = strtolower(trim((string)($raw['originalStudentEmail'] ?? '')));
$studentId = trim((string)($raw['studentId'] ?? ''));
$fullName = trim((string)($raw['fullName'] ?? ''));
$email = strtolower(trim((string)($raw['email'] ?? '')));
$classSection = trim((string)($raw['classSection'] ?? ''));
$course = trim((string)($raw['course'] ?? ''));
$jobTrack = trim((string)($raw['jobTrack'] ?? 'Not Assigned')) ?: 'Not Assigned';
$activeClass = filter_var($raw['activeClass'] ?? 'true', FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
$joinedDate = trim((string)($raw['joinedDate'] ?? ''));

if ($studentId === '' || $fullName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Required student fields are missing or invalid']);
    exit;
}

if ($activeClass === null) {
    $activeClass = true;
}

if ($joinedDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $joinedDate)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Joined date must use YYYY-MM-DD format']);
    exit;
}

$nameParts = preg_split('/\s+/', $fullName) ?: [];
$firstName = array_shift($nameParts) ?: $fullName;
$lastName = trim(implode(' ', $nameParts));

try {
    $pdo->beginTransaction();

    $currentStudent = null;
    if ($originalStudentId !== '') {
        $currentStmt = $pdo->prepare('SELECT id FROM students WHERE student_number = ? LIMIT 1');
        $currentStmt->execute([$originalStudentId]);
        $currentStudent = $currentStmt->fetch(PDO::FETCH_ASSOC) ?: null;

        if (!$currentStudent) {
            $currentStmt = $pdo->prepare('SELECT id FROM students WHERE email = ? LIMIT 1');
            $currentStmt->execute([$email]);
            $currentStudent = $currentStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        }

        if (!$currentStudent && $originalStudentEmail !== '') {
            $currentStmt = $pdo->prepare('SELECT id FROM students WHERE email = ? LIMIT 1');
            $currentStmt->execute([$originalStudentEmail]);
            $currentStudent = $currentStmt->fetch(PDO::FETCH_ASSOC) ?: null;
        }

        if (!$currentStudent) {
            throw new RuntimeException('Student account not found');
        }
    }

    $duplicateIdStmt = $pdo->prepare('SELECT id FROM students WHERE student_number = ? LIMIT 1');
    $duplicateIdStmt->execute([$studentId]);
    $duplicateId = $duplicateIdStmt->fetch(PDO::FETCH_ASSOC);
    if ($duplicateId && (!$currentStudent || (int)$duplicateId['id'] !== (int)$currentStudent['id'])) {
        throw new RuntimeException('Student ID already exists');
    }

    $duplicateEmailStmt = $pdo->prepare('SELECT id FROM students WHERE email = ? LIMIT 1');
    $duplicateEmailStmt->execute([$email]);
    $duplicateEmail = $duplicateEmailStmt->fetch(PDO::FETCH_ASSOC);
    if ($duplicateEmail && (!$currentStudent || (int)$duplicateEmail['id'] !== (int)$currentStudent['id'])) {
        throw new RuntimeException('Email already exists in student list');
    }

    if ($currentStudent) {
        $updateStmt = $pdo->prepare('UPDATE students SET student_number = ?, first_name = ?, last_name = ?, email = ?, program = ?, class_section = ?, job_track = ?, active_class = ?, joined_date = ? WHERE id = ?');
        $updateStmt->execute([
            $studentId,
            $firstName,
            $lastName,
            $email,
            $course,
            $classSection ?: null,
            $jobTrack,
            $activeClass ? 1 : 0,
            $joinedDate !== '' ? $joinedDate : null,
            (int)$currentStudent['id'],
        ]);
    } else {
        $insertStmt = $pdo->prepare('INSERT INTO students (student_number, first_name, last_name, email, program, class_section, job_track, active_class, joined_date, password_hash, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
        $insertStmt->execute([
            $studentId,
            $firstName,
            $lastName,
            $email,
            $course,
            $classSection ?: null,
            $jobTrack,
            $activeClass ? 1 : 0,
            $joinedDate !== '' ? $joinedDate : date('Y-m-d'),
            password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT),
        ]);
    }

    $pdo->commit();

    $lookupStmt = $pdo->prepare("SELECT id, email, first_name, last_name, student_number, program, class_section, job_track, active_class, COALESCE(joined_date, DATE(registered_at)) AS joined_date, registered_at FROM students WHERE student_number = ? LIMIT 1");
    $lookupStmt->execute([$studentId]);
    $savedStudent = $lookupStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'student' => $savedStudent,
        'message' => 'Student account saved successfully',
    ], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}