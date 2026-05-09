<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

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
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}