<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$title = trim($_POST['title'] ?? '');
$eventDate = trim($_POST['eventDate'] ?? '');
$startTime = trim($_POST['startTime'] ?? '');
$location = trim($_POST['location'] ?? '');
$eventType = trim($_POST['eventType'] ?? '');
$description = trim($_POST['description'] ?? '');
$capacity = trim($_POST['capacity'] ?? '');

if ($token === '' || $title === '' || $eventDate === '' || $startTime === '' || $location === '' || $eventType === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token, title, eventDate, startTime, location, and eventType are required']);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $eventDate)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid event date']);
    exit;
}

if (!preg_match('/^\d{2}:\d{2}$/', $startTime)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid start time']);
    exit;
}

$capacityValue = null;
if ($capacity !== '') {
    if (!ctype_digit($capacity) || (int)$capacity <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Capacity must be a positive number']);
        exit;
    }
    $capacityValue = (int)$capacity;
}

try {
    $tokenStmt = $pdo->prepare('SELECT email, type FROM tokens WHERE token = ? LIMIT 1');
    $tokenStmt->execute([$token]);
    $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $adminEmail = trim($tokenRow['email'] ?? '');
    $tokenType = strtolower(trim($tokenRow['type'] ?? ''));

    if ($adminEmail === '' || $tokenType !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin access required']);
        exit;
    }

    $adminStmt = $pdo->prepare('SELECT email FROM admins WHERE email = ? LIMIT 1');
    $adminStmt->execute([$adminEmail]);
    if (!$adminStmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Admin account not found']);
        exit;
    }

    $insertStmt = $pdo->prepare('INSERT INTO events (title, event_date, start_time, location, event_type, description, capacity, created_by_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
    $insertStmt->execute([
        mb_substr($title, 0, 255),
        $eventDate,
        $startTime . ':00',
        mb_substr($location, 0, 255),
        mb_substr($eventType, 0, 120),
        $description !== '' ? $description : null,
        $capacityValue,
        $adminEmail,
    ]);

    $eventId = (int)$pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Event created successfully',
        'event' => [
            'id' => (string)$eventId,
            'title' => $title,
            'eventDate' => $eventDate,
            'startTime' => $startTime,
            'location' => $location,
            'eventType' => $eventType,
            'description' => $description,
            'capacity' => $capacityValue,
            'createdByEmail' => $adminEmail,
        ],
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>