<?php
// PDO MySQL connection for XAMPP/Apache
$dbHost = getenv('CAPSTONE_DB_HOST') ?: 'sql102.infinityfree.com';
$dbPort = getenv('CAPSTONE_DB_PORT') ?: '3306';
$dbName = getenv('CAPSTONE_DB_NAME') ?: 'if0_41778125_capstone';
$dbUser = getenv('CAPSTONE_DB_USER') ?: 'if0_41778125';
$dbPass = getenv('CAPSTONE_DB_PASS') ?: 'HreY04HdWTkX';

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

function ensureStudentGraduationColumn(PDO $pdo): void
{
    $columnCheck = $pdo->query("SHOW COLUMNS FROM students LIKE 'graduation_year'")->fetchColumn();
    if ($columnCheck === false) {
        $pdo->exec("ALTER TABLE students ADD COLUMN graduation_year YEAR DEFAULT NULL AFTER program");
    }
}

function ensureStudentManagementColumns(PDO $pdo): void
{
    $columns = [
        'class_section' => "ALTER TABLE students ADD COLUMN class_section VARCHAR(100) DEFAULT NULL AFTER program",
        'job_track' => "ALTER TABLE students ADD COLUMN job_track VARCHAR(100) DEFAULT 'Not Assigned' AFTER class_section",
        'active_class' => "ALTER TABLE students ADD COLUMN active_class TINYINT(1) NOT NULL DEFAULT 1 AFTER job_track",
        'joined_date' => "ALTER TABLE students ADD COLUMN joined_date DATE DEFAULT NULL AFTER active_class",
    ];

    foreach ($columns as $columnName => $alterSql) {
        $columnCheck = $pdo->query(sprintf("SHOW COLUMNS FROM students LIKE '%s'", $columnName))->fetchColumn();
        if ($columnCheck === false) {
            $pdo->exec($alterSql);
        }
    }
}

function ensureAuditLogRoleColumn(PDO $pdo): void
{
    $columnCheck = $pdo->query("SHOW COLUMNS FROM audit_logs LIKE 'actor_role'")->fetchColumn();
    if ($columnCheck === false) {
        $pdo->exec("ALTER TABLE audit_logs ADD COLUMN actor_role ENUM('admin', 'student', 'system') NOT NULL DEFAULT 'admin' AFTER id");
    }
}

function ensureAdminColumns(PDO $pdo): void
{
    $columns = [
        'position'    => "ALTER TABLE admins ADD COLUMN position VARCHAR(150) DEFAULT NULL AFTER name",
        'department'  => "ALTER TABLE admins ADD COLUMN department VARCHAR(150) DEFAULT NULL AFTER position",
        'school_name' => "ALTER TABLE admins ADD COLUMN school_name VARCHAR(255) DEFAULT NULL AFTER department",
    ];
    foreach ($columns as $col => $sql) {
        $exists = $pdo->query("SHOW COLUMNS FROM admins LIKE '$col'")->fetchColumn();
        if ($exists === false) {
            $pdo->exec($sql);
        }
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
    try { ensureStudentGraduationColumn($pdo); } catch (Throwable $ignored) {}
    try { ensureStudentManagementColumns($pdo); } catch (Throwable $ignored) {}
    try { ensureAuditLogRoleColumn($pdo); } catch (Throwable $ignored) {}
    try { ensureAdminColumns($pdo); } catch (Throwable $ignored) {}
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>