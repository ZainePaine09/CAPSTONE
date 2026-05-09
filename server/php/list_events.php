<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'GET required']);
    exit;
}

function normalizeTimeValue(?string $value): string
{
    $value = trim((string)$value);
    if ($value === '') {
        return '';
    }

    return substr($value, 0, 5);
}

try {
    $stmt = $pdo->query('SELECT id, title, event_date, start_time, location, event_type, description, capacity, created_by_email, created_at, updated_at FROM events ORDER BY event_date ASC, start_time ASC, id DESC');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $events = array_map(static function (array $row): array {
        return [
            'id' => (string)$row['id'],
            'title' => $row['title'] ?? '',
            'eventDate' => $row['event_date'] ?? '',
            'startTime' => normalizeTimeValue($row['start_time'] ?? ''),
            'location' => $row['location'] ?? '',
            'eventType' => $row['event_type'] ?? 'General',
            'description' => $row['description'] ?? '',
            'capacity' => isset($row['capacity']) ? (int)$row['capacity'] : null,
            'createdByEmail' => $row['created_by_email'] ?? '',
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }, $rows);

    echo json_encode([
        'success' => true,
        'events' => $events,
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>