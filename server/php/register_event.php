<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');
$eventId = (int)($_POST['eventId'] ?? 0);

if ($token === '' || $eventId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token and eventId are required']);
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

    $studentStmt = $pdo->prepare('SELECT email FROM students WHERE email = ? LIMIT 1');
    $studentStmt->execute([$studentEmail]);
    if (!$studentStmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Student account not found']);
        exit;
    }

    $eventStmt = $pdo->prepare('SELECT id FROM events WHERE id = ? LIMIT 1');
    $eventStmt->execute([$eventId]);
    if (!$eventStmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Event not found']);
        exit;
    }

    $existingStmt = $pdo->prepare('SELECT id, status FROM event_registrations WHERE event_id = ? AND student_email = ? LIMIT 1');
    $existingStmt->execute([$eventId, $studentEmail]);
    $existingRow = $existingStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingRow && strtolower((string)$existingRow['status']) === 'registered') {
        echo json_encode(['success' => true, 'message' => 'Already registered']);
        exit;
    }

    if ($existingRow) {
        $updateStmt = $pdo->prepare('UPDATE event_registrations SET status = ?, registered_at = NOW(), unregistered_at = NULL, updated_at = NOW() WHERE id = ?');
        $updateStmt->execute(['registered', $existingRow['id']]);
        $registrationId = (int)$existingRow['id'];
    } else {
        $insertStmt = $pdo->prepare('INSERT INTO event_registrations (event_id, student_email, status, registered_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
        $insertStmt->execute([$eventId, $studentEmail, 'registered']);
        $registrationId = (int)$pdo->lastInsertId();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Event registered successfully',
        'registrationId' => $registrationId,
        'eventId' => $eventId,
        'studentEmail' => $studentEmail,
        'status' => 'registered',
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>