<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->query(
        'SELECT ap.id, ap.student_email, ap.full_name, ap.student_number, ap.program, ap.graduation_year, ap.current_company, ap.current_position, ap.bio, ap.created_at, ap.updated_at
         FROM alumni_profiles ap
         LEFT JOIN students s ON s.email = ap.student_email
         WHERE s.email IS NULL
         ORDER BY ap.graduation_year DESC, ap.full_name ASC'
    );

    $alumni = array_map(static function (array $row): array {
        return [
            'id' => $row['id'] ?? '',
            'email' => $row['student_email'] ?? '',
            'fullName' => $row['full_name'] ?? '',
            'studentNumber' => $row['student_number'] ?? '',
            'program' => $row['program'] ?? '',
            'graduationYear' => $row['graduation_year'] ?? '',
            'currentCompany' => $row['current_company'] ?? '',
            'currentPosition' => $row['current_position'] ?? '',
            'bio' => $row['bio'] ?? '',
            'createdAt' => $row['created_at'] ?? '',
            'updatedAt' => $row['updated_at'] ?? ''
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode([
        'success' => true,
        'count' => count($alumni),
        'alumni' => $alumni
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>