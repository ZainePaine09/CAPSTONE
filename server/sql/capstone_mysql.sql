CREATE DATABASE IF NOT EXISTS capstone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE capstone;

CREATE TABLE IF NOT EXISTS students (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    student_number VARCHAR(100) DEFAULT NULL,
    program VARCHAR(150) DEFAULT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tokens (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(191) NOT NULL,
    type VARCHAR(50) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tokens_email (email),
    INDEX idx_tokens_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS posted_jobs (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT NULL,
    salary VARCHAR(100) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    requirements TEXT DEFAULT NULL,
    posted_date VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS friend_requests (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    requester_email VARCHAR(191) NOT NULL,
    receiver_email VARCHAR(191) NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_friend_request_pair (requester_email, receiver_email),
    INDEX idx_friend_requests_requester (requester_email),
    INDEX idx_friend_requests_receiver (receiver_email),
    INDEX idx_friend_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS friends (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_email_1 VARCHAR(191) NOT NULL,
    student_email_2 VARCHAR(191) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_friend_pair (student_email_1, student_email_2),
    INDEX idx_friends_email_1 (student_email_1),
    INDEX idx_friends_email_2 (student_email_2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    sender_email VARCHAR(191) NOT NULL,
    sender_role ENUM('admin', 'student') NOT NULL,
    receiver_email VARCHAR(191) NOT NULL,
    receiver_role ENUM('admin', 'student') NOT NULL,
    message_text TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_messages_sender (sender_email),
    INDEX idx_messages_receiver (receiver_email),
    INDEX idx_messages_receiver_read (receiver_email, is_read),
    INDEX idx_messages_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pending_approvals (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    requester_email VARCHAR(191) NOT NULL,
    receiver_email VARCHAR(191) NOT NULL,
    request_type VARCHAR(120) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pending_approvals_requester (requester_email),
    INDEX idx_pending_approvals_receiver (receiver_email),
    INDEX idx_pending_approvals_status (status),
    INDEX idx_pending_approvals_type (request_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS learning_materials (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(150) NOT NULL,
    target_program VARCHAR(80) NOT NULL DEFAULT 'all',
    description TEXT NOT NULL,
    link VARCHAR(500) DEFAULT NULL,
    created_by_email VARCHAR(191) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_learning_materials_target_program (target_program),
    INDEX idx_learning_materials_created_by (created_by_email),
    INDEX idx_learning_materials_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS events (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    event_type VARCHAR(120) NOT NULL DEFAULT 'General',
    description TEXT DEFAULT NULL,
    capacity INT UNSIGNED DEFAULT NULL,
    created_by_email VARCHAR(191) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_events_event_date (event_date),
    INDEX idx_events_event_type (event_type),
    INDEX idx_events_created_by (created_by_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event_registrations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_id INT UNSIGNED NOT NULL,
    student_email VARCHAR(191) NOT NULL,
    status ENUM('registered', 'unregistered') NOT NULL DEFAULT 'registered',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unregistered_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_event_student_registration (event_id, student_email),
    INDEX idx_event_registrations_event (event_id),
    INDEX idx_event_registrations_student (student_email),
    INDEX idx_event_registrations_status (status),
    CONSTRAINT fk_event_registrations_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;