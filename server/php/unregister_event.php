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

    $lookupStmt = $pdo->prepare('SELECT id, status FROM event_registrations WHERE event_id = ? AND student_email = ? LIMIT 1');
    $lookupStmt->execute([$eventId, $studentEmail]);
    $registrationRow = $lookupStmt->fetch(PDO::FETCH_ASSOC);

    if (!$registrationRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Registration not found']);
        exit;
    }

    if (strtolower((string)$registrationRow['status']) !== 'registered') {
        echo json_encode(['success' => true, 'message' => 'Already unregistered']);
        exit;
    }

    $updateStmt = $pdo->prepare('UPDATE event_registrations SET status = ?, unregistered_at = NOW(), updated_at = NOW() WHERE id = ?');
    $updateStmt->execute(['unregistered', $registrationRow['id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Event unregistered successfully',
        'eventId' => $eventId,
        'studentEmail' => $studentEmail,
        'status' => 'unregistered',
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>