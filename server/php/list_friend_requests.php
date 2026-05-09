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

function resolveDisplayName(PDO $pdo, string $email): array
{
    $studentStmt = $pdo->prepare('SELECT COALESCE(NULLIF(CONCAT(first_name, " ", last_name), " "), NULLIF(first_name, ""), email) AS display_name FROM students WHERE email = ? LIMIT 1');
    $studentStmt->execute([$email]);
    $studentRow = $studentStmt->fetch(PDO::FETCH_ASSOC);
    if ($studentRow) {
        return ['name' => $studentRow['display_name'] ?: $email, 'role' => 'student'];
    }

    $adminStmt = $pdo->prepare('SELECT COALESCE(NULLIF(name, ""), email) AS display_name FROM admins WHERE email = ? LIMIT 1');
    $adminStmt->execute([$email]);
    $adminRow = $adminStmt->fetch(PDO::FETCH_ASSOC);
    if ($adminRow) {
        return ['name' => $adminRow['display_name'] ?: $email, 'role' => 'admin'];
    }

    return ['name' => $email, 'role' => 'unknown'];
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

    $currentEmail = trim($tokenRow['email'] ?? '');
    $currentRole = strtolower(trim($tokenRow['type'] ?? ''));

    if ($currentEmail === '' || !in_array($currentRole, ['admin', 'student'], true)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT id, requester_email, receiver_email, status, created_at, updated_at
         FROM friend_requests
         WHERE requester_email = ? OR receiver_email = ?
         ORDER BY created_at DESC, id DESC'
    );
    $stmt->execute([$currentEmail, $currentEmail]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $requests = [];
    foreach ($rows as $row) {
        $requesterEmail = trim($row['requester_email'] ?? '');
        $receiverEmail = trim($row['receiver_email'] ?? '');
        $requesterInfo = resolveDisplayName($pdo, $requesterEmail);
        $receiverInfo = resolveDisplayName($pdo, $receiverEmail);
        $direction = strcasecmp($receiverEmail, $currentEmail) === 0 ? 'incoming' : 'outgoing';

        $requests[] = [
            'id' => (int)$row['id'],
            'requesterEmail' => $requesterEmail,
            'requesterName' => $requesterInfo['name'],
            'requesterRole' => $requesterInfo['role'],
            'receiverEmail' => $receiverEmail,
            'receiverName' => $receiverInfo['name'],
            'receiverRole' => $receiverInfo['role'],
            'status' => $row['status'] ?? 'pending',
            'direction' => $direction,
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    echo json_encode([
        'success' => true,
        'currentEmail' => $currentEmail,
        'currentRole' => $currentRole,
        'count' => count($requests),
        'requests' => $requests,
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>