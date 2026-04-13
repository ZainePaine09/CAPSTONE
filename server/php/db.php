<?php
// PDO MySQL connection for XAMPP/Apache
$dbHost = getenv('CAPSTONE_DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('CAPSTONE_DB_PORT') ?: '3306';
$dbName = getenv('CAPSTONE_DB_NAME') ?: 'capstone';
$dbUser = getenv('CAPSTONE_DB_USER') ?: 'root';
$dbPass = getenv('CAPSTONE_DB_PASS') ?: '';

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $dbHost, $dbPort, $dbName);

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>