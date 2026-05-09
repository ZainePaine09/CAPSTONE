CREATE TABLE IF NOT EXISTS students (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    student_number VARCHAR(100) DEFAULT NULL,
    program VARCHAR(150) DEFAULT NULL,
    class_section VARCHAR(100) DEFAULT NULL,
    job_track VARCHAR(100) DEFAULT 'Not Assigned',
    active_class TINYINT(1) NOT NULL DEFAULT 1,
    joined_date DATE DEFAULT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_profiles (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    phone VARCHAR(50) DEFAULT NULL,
    dob DATE DEFAULT NULL,
    gender VARCHAR(50) DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    degree VARCHAR(150) DEFAULT NULL,
    university VARCHAR(191) DEFAULT NULL,
    graduation_year YEAR DEFAULT NULL,
    gpa VARCHAR(20) DEFAULT NULL,
    major VARCHAR(191) DEFAULT NULL,
    position VARCHAR(191) DEFAULT NULL,
    company VARCHAR(255) DEFAULT NULL,
    industry VARCHAR(191) DEFAULT NULL,
    experience VARCHAR(191) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    about_me TEXT DEFAULT NULL,
    skills_json LONGTEXT DEFAULT NULL,
    profile_image LONGTEXT DEFAULT NULL,
    gmail_address VARCHAR(191) DEFAULT NULL,
    auth_provider VARCHAR(50) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_profiles_email (email)
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

CREATE TABLE IF NOT EXISTS mentor_requests (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_email VARCHAR(191) NOT NULL,
    mentor_id VARCHAR(120) NOT NULL,
    mentor_name VARCHAR(150) NOT NULL,
    mentor_title VARCHAR(191) DEFAULT NULL,
    mentor_company VARCHAR(191) DEFAULT NULL,
    status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_mentor_requests_student_mentor (student_email, mentor_id),
    INDEX idx_mentor_requests_student (student_email),
    INDEX idx_mentor_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_job_actions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_email VARCHAR(191) NOT NULL,
    job_id VARCHAR(120) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(191) DEFAULT NULL,
    action ENUM('applied', 'saved') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_job_actions_student_job_action (student_email, job_id, action),
    INDEX idx_student_job_actions_student (student_email),
    INDEX idx_student_job_actions_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_messages_email (email),
    INDEX idx_contact_messages_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcements (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    announcement_type VARCHAR(120) NOT NULL,
    importance ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
    announcement_date DATE NOT NULL,
    announcement_time TIME NOT NULL,
    description TEXT NOT NULL,
    details TEXT NOT NULL,
    created_by_email VARCHAR(191) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_announcements_date (announcement_date),
    INDEX idx_announcements_type (announcement_type),
    INDEX idx_announcements_importance (importance),
    INDEX idx_announcements_created_by (created_by_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS alumni_profiles (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_email VARCHAR(191) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    student_number VARCHAR(100) NOT NULL,
    program VARCHAR(150) NOT NULL,
    graduation_year YEAR NOT NULL,
    current_company VARCHAR(255) DEFAULT NULL,
    current_position VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_alumni_profiles_program (program),
    INDEX idx_alumni_profiles_graduation_year (graduation_year),
    INDEX idx_alumni_profiles_student_email (student_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS staff_accounts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    role ENUM('TEACHER', 'DEAN', 'PRINCIPAL') NOT NULL DEFAULT 'TEACHER',
    requested_role ENUM('TEACHER', 'DEAN', 'PRINCIPAL') NOT NULL DEFAULT 'TEACHER',
    account_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_by_email VARCHAR(191) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_accounts_status (account_status),
    INDEX idx_staff_accounts_role (role),
    INDEX idx_staff_accounts_requested_role (requested_role),
    INDEX idx_staff_accounts_created_by (created_by_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    actor_role ENUM('admin', 'student', 'system') NOT NULL DEFAULT 'admin',
    actor_email VARCHAR(191) NOT NULL,
    action VARCHAR(120) NOT NULL,
    details TEXT NOT NULL,
    target_email VARCHAR(191) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_actor (actor_email),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_target (target_email),
    INDEX idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_settings (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    profile_json LONGTEXT NOT NULL,
    system_json LONGTEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_settings_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_ui_state (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL,
    state_key VARCHAR(120) NOT NULL,
    state_json LONGTEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_admin_ui_state_email_key (email, state_key),
    INDEX idx_admin_ui_state_email (email),
    INDEX idx_admin_ui_state_key (state_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;