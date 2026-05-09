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

function resolveAccountRole(PDO $pdo, string $email): ?string
{
    $adminStmt = $pdo->prepare('SELECT email FROM admins WHERE email = ? LIMIT 1');
    $adminStmt->execute([$email]);
    if ($adminStmt->fetch(PDO::FETCH_ASSOC)) {
        return 'admin';
    }

    $studentStmt = $pdo->prepare('SELECT email FROM students WHERE email = ? LIMIT 1');
    $studentStmt->execute([$email]);
    if ($studentStmt->fetch(PDO::FETCH_ASSOC)) {
        return 'student';
    }

    return null;
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

    $currentEmail = trim($tokenRow['email'] ?? '');
    $currentRole = strtolower(trim($tokenRow['type'] ?? ''));

    if ($currentEmail === '' || !in_array($currentRole, ['admin', 'student'], true)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token payload']);
        exit;
    }

    $sql = 'SELECT id, requester_email, receiver_email, request_type, status, created_at, reviewed_at, updated_at FROM pending_approvals';
    $params = [];

    if ($currentRole === 'student') {
        $sql .= ' WHERE requester_email = ? ORDER BY created_at DESC, id DESC';
        $params[] = $currentEmail;
    } else {
        // Admins see all pending approvals regardless of which admin the request was sent to
        $sql .= ' ORDER BY created_at DESC, id DESC';
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $approvals = [];
    foreach ($rows as $row) {
        $requesterEmail = trim($row['requester_email'] ?? '');
        $receiverEmail = trim($row['receiver_email'] ?? '');
        $requesterRole = resolveAccountRole($pdo, $requesterEmail);

        $requesterName = $requesterEmail;
        $requesterStudentNumber = '';
        $requesterProgram = '';

        if ($requesterRole === 'student') {
            $studentStmt = $pdo->prepare('SELECT COALESCE(NULLIF(CONCAT(first_name, " ", last_name), " "), NULLIF(first_name, ""), email) AS display_name, student_number, program FROM students WHERE email = ? LIMIT 1');
            $studentStmt->execute([$requesterEmail]);
            $studentRow = $studentStmt->fetch(PDO::FETCH_ASSOC);
            if ($studentRow) {
                $requesterName = $studentRow['display_name'] ?: $requesterEmail;
                $requesterStudentNumber = $studentRow['student_number'] ?? '';
                $requesterProgram = $studentRow['program'] ?? '';
            }
        }

        $approvals[] = [
            'id' => (int)$row['id'],
            'requesterEmail' => $requesterEmail,
            'requesterName' => $requesterName,
            'requesterStudentNumber' => $requesterStudentNumber,
            'requesterProgram' => $requesterProgram,
            'receiverEmail' => $receiverEmail,
            'requestType' => $row['request_type'] ?? '',
            'status' => $row['status'] ?? 'pending',
            'createdAt' => $row['created_at'] ?? null,
            'reviewedAt' => $row['reviewed_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    echo json_encode([
        'success' => true,
        'currentEmail' => $currentEmail,
        'currentRole' => $currentRole,
        'approvals' => $approvals
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>