<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->query(
        'SELECT id, student_email, full_name, student_number, program, graduation_year, current_company, current_position, bio, created_at, updated_at
         FROM alumni_profiles
         ORDER BY graduation_year DESC, full_name ASC'
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
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>