<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'GET required']);
    exit;
}

try {
    $stmt = $pdo->query('SELECT id, title, category, target_program, description, link, created_by_email, created_at, updated_at FROM learning_materials ORDER BY created_at DESC, id DESC');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $materials = array_map(static function (array $row): array {
        return [
            'id' => (string)$row['id'],
            'title' => $row['title'] ?? '',
            'category' => $row['category'] ?? '',
            'targetProgram' => $row['target_program'] ?? 'all',
            'description' => $row['description'] ?? '',
            'link' => $row['link'] ?? '',
            'createdByEmail' => $row['created_by_email'] ?? '',
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }, $rows);

    echo json_encode([
        'success' => true,
        'materials' => $materials,
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>