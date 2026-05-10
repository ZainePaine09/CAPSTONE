<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'GET required']);
    exit;
}

try {
    $stmt = $pdo->query('SELECT id, title, announcement_type, importance, announcement_date, announcement_time, description, details, created_at FROM announcements ORDER BY announcement_date DESC, announcement_time DESC, id DESC LIMIT 20');
    $announcements = array_map(static function (array $row): array {
        return [
            'id'          => (int)($row['id'] ?? 0),
            'title'       => $row['title'] ?? '',
            'type'        => $row['announcement_type'] ?? '',
            'importance'  => $row['importance'] ?? 'medium',
            'date'        => $row['announcement_date'] ?? '',
            'time'        => substr((string)($row['announcement_time'] ?? ''), 0, 5),
            'description' => $row['description'] ?? '',
            'details'     => $row['details'] ?? '',
            'createdAt'   => $row['created_at'] ?? '',
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode(['success' => true, 'announcements' => $announcements]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
