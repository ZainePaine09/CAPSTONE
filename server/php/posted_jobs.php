<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

function fetchPostedJobs(PDO $pdo) {
    $stmt = $pdo->query('SELECT id, title, company, location, type, salary, description, requirements, posted_date AS postedDate FROM posted_jobs ORDER BY posted_date DESC, id DESC');
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function normalizeJobPayload(array $job) {
    return [
        'id' => isset($job['id']) ? (int) $job['id'] : null,
        'title' => trim((string) ($job['title'] ?? '')),
        'company' => trim((string) ($job['company'] ?? '')),
        'location' => trim((string) ($job['location'] ?? '')),
        'type' => trim((string) ($job['type'] ?? '')),
        'salary' => trim((string) ($job['salary'] ?? '')),
        'description' => trim((string) ($job['description'] ?? '')),
        'requirements' => trim((string) ($job['requirements'] ?? '')),
        'postedDate' => trim((string) ($job['postedDate'] ?? $job['posted_date'] ?? '')),
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        echo json_encode(['success' => true, 'jobs' => fetchPostedJobs($pdo)]);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$rawBody = file_get_contents('php://input');
$decoded = json_decode($rawBody, true);
$jobsInput = [];

if (is_array($decoded) && isset($decoded['jobs']) && is_array($decoded['jobs'])) {
    $jobsInput = $decoded['jobs'];
} elseif (isset($_POST['jobs'])) {
    $parsedJobs = json_decode($_POST['jobs'], true);
    if (is_array($parsedJobs)) {
        $jobsInput = $parsedJobs;
    }
}

if (!is_array($jobsInput)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid jobs payload']);
    exit;
}

try {
    $pdo->beginTransaction();
    $pdo->exec('DELETE FROM posted_jobs');

    $stmt = $pdo->prepare('INSERT INTO posted_jobs (id, title, company, location, type, salary, description, requirements, posted_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))');

    foreach ($jobsInput as $job) {
        if (!is_array($job)) {
            continue;
        }

        $normalized = normalizeJobPayload($job);
        if ($normalized['title'] === '' || $normalized['company'] === '' || $normalized['location'] === '' || $normalized['postedDate'] === '') {
            continue;
        }

        $stmt->execute([
            $normalized['id'],
            $normalized['title'],
            $normalized['company'],
            $normalized['location'],
            $normalized['type'],
            $normalized['salary'],
            $normalized['description'],
            $normalized['requirements'],
            $normalized['postedDate']
        ]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'jobs' => fetchPostedJobs($pdo)]);
    exit;
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>