<?php
// PDO MySQL connection for XAMPP/Apache
$dbHost = getenv('CAPSTONE_DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('CAPSTONE_DB_PORT') ?: '3306';
$dbName = getenv('CAPSTONE_DB_NAME') ?: 'capstone';
$dbUser = getenv('CAPSTONE_DB_USER') ?: 'root';
$dbPass = getenv('CAPSTONE_DB_PASS') ?: '';

function createDatabaseIfMissing(string $host, string $port, string $dbName, string $user, string $pass): void
{
    $bootstrapDsn = sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $host, $port);
    $bootstrapPdo = new PDO($bootstrapDsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $quotedName = '`' . str_replace('`', '``', $dbName) . '`';
    $bootstrapPdo->exec(sprintf('CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', $quotedName));
}

function bootstrapSchema(PDO $pdo): void
{
    $schemaPath = __DIR__ . '/../sql/capstone_mysql.sql';
    if (!is_file($schemaPath)) {
        return;
    }

    $schemaSql = file_get_contents($schemaPath);
    if ($schemaSql === false) {
        return;
    }

    $schemaSql = preg_replace('/^\s*CREATE\s+DATABASE\b.*?;\s*/ims', '', $schemaSql) ?? $schemaSql;
    $schemaSql = preg_replace('/^\s*USE\s+.*?;\s*/ims', '', $schemaSql) ?? $schemaSql;

    $statements = preg_split('/;\s*(?:\r?\n|$)/', $schemaSql) ?: [];
    foreach ($statements as $statement) {
        $sql = trim($statement);
        if ($sql === '') {
            continue;
        }

        $pdo->exec($sql);
    }
}

try {
    createDatabaseIfMissing($dbHost, $dbPort, $dbName, $dbUser, $dbPass);
} catch (PDOException $bootstrapError) {
    // Continue and let the main connection report the actual failure if bootstrap is not allowed.
}

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $dbHost, $dbPort, $dbName);

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    bootstrapSchema($pdo);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>