<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required']);
    exit;
}

$token = trim($_POST['token'] ?? '');

if ($token === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'token is required']);
    exit;
}

try {
    $tokenStmt = $pdo->prepare('SELECT email FROM tokens WHERE token = ? AND expires_at > NOW() LIMIT 1');
    $tokenStmt->execute([$token]);
    $tokenRow = $tokenStmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $email = trim($tokenRow['email'] ?? '');

    $resolveNameStmt = function (string $lookupEmail) use ($pdo): array {
        $studentStmt = $pdo->prepare('SELECT COALESCE(NULLIF(CONCAT(first_name, " ", last_name), " "), NULLIF(first_name, ""), email) AS display_name FROM students WHERE email = ? LIMIT 1');
        $studentStmt->execute([$lookupEmail]);
        $studentRow = $studentStmt->fetch(PDO::FETCH_ASSOC);
        if ($studentRow) {
            return ['name' => $studentRow['display_name'] ?: $lookupEmail, 'role' => 'student'];
        }

        $adminStmt = $pdo->prepare('SELECT COALESCE(NULLIF(name, ""), email) AS display_name FROM admins WHERE email = ? LIMIT 1');
        $adminStmt->execute([$lookupEmail]);
        $adminRow = $adminStmt->fetch(PDO::FETCH_ASSOC);
        if ($adminRow) {
            return ['name' => $adminRow['display_name'] ?: $lookupEmail, 'role' => 'admin'];
        }

        return ['name' => $lookupEmail, 'role' => 'unknown'];
    };

    $stmt = $pdo->prepare(
        'SELECT f.id, f.student_email_1, f.student_email_2, f.created_at,
                s1.first_name AS first_name_1, s1.last_name AS last_name_1,
                s2.first_name AS first_name_2, s2.last_name AS last_name_2
         FROM friends f
         LEFT JOIN students s1 ON s1.email = f.student_email_1
         LEFT JOIN students s2 ON s2.email = f.student_email_2
         WHERE f.student_email_1 = ? OR f.student_email_2 = ?
         ORDER BY f.created_at DESC'
    );
    $stmt->execute([$email, $email]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $friends = array_map(function($row) use ($email) {
        $isFirst = strcasecmp($row['student_email_1'], $email) === 0;
        $friendEmail = $isFirst ? $row['student_email_2'] : $row['student_email_1'];
        $friendFirstName = $isFirst ? ($row['first_name_2'] ?? '') : ($row['first_name_1'] ?? '');
        $friendLastName = $isFirst ? ($row['last_name_2'] ?? '') : ($row['last_name_1'] ?? '');

        return [
            'friendEmail' => $friendEmail,
            'friendName' => trim($friendFirstName . ' ' . $friendLastName) ?: $friendEmail,
            'createdAt' => $row['created_at']
        ];
    }, $rows);

    $friends = array_map(function (array $friend) use ($resolveNameStmt) {
        $resolved = $resolveNameStmt($friend['friendEmail']);
        $friend['friendName'] = $resolved['name'] ?: $friend['friendName'];
        $friend['friendRole'] = $resolved['role'];
        return $friend;
    }, $friends);

    echo json_encode([
        'success' => true,
        'count' => count($friends),
        'friends' => $friends
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'error' => 'A server error occurred']);
    exit;
}
?>