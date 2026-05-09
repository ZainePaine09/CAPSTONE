<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'GET required']);
    exit;
}

$token = trim($_GET['token'] ?? '');
if ($token === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token is required']);
    exit;
}

try {
    $tokenStmt = $pdo->prepare('SELECT email, type FROM tokens WHERE token = ? AND expires_at > NOW() LIMIT 1');
    $tokenStmt->execute([$token]);
    $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $studentEmail = trim($tokenRow['email'] ?? '');
    $tokenType = strtolower(trim($tokenRow['type'] ?? ''));

    if ($studentEmail === '' || $tokenType !== 'student') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Student access required']);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT r.id AS registration_id, r.event_id, r.student_email, r.status, r.registered_at, r.unregistered_at, e.title, e.event_date, e.start_time, e.location, e.event_type, e.description, e.capacity
         FROM event_registrations r
         INNER JOIN events e ON e.id = r.event_id
         WHERE r.student_email = ? AND r.status = ?
         ORDER BY r.registered_at DESC, r.id DESC'
    );
    $stmt->execute([$studentEmail, 'registered']);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $registeredEvents = array_map(static function (array $row): array {
        return [
            'registrationId' => (string)$row['registration_id'],
            'eventId' => (string)$row['event_id'],
            'studentEmail' => $row['student_email'] ?? '',
            'status' => $row['status'] ?? 'registered',
            'registeredAt' => $row['registered_at'] ?? null,
            'unregisteredAt' => $row['unregistered_at'] ?? null,
            'title' => $row['title'] ?? '',
            'eventDate' => $row['event_date'] ?? '',
            'startTime' => substr((string)($row['start_time'] ?? ''), 0, 5),
            'location' => $row['location'] ?? '',
            'eventType' => $row['event_type'] ?? 'General',
            'description' => $row['description'] ?? '',
            'capacity' => isset($row['capacity']) ? (int)$row['capacity'] : null,
        ];
    }, $rows);

    echo json_encode([
        'success' => true,
        'studentEmail' => $studentEmail,
        'registeredEvents' => $registeredEvents,
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>