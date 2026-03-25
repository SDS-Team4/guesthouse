-- Guesthouse V1 target schema
-- Traceability:
--   REQ-F-001 ~ REQ-F-035
--   REQ-F-050 ~ REQ-F-127
--   REQ-NF-003 ~ REQ-NF-007
--   REQ-SEC-001 ~ REQ-SEC-008
--   BR-001 ~ BR-008
--   REQ-OTH-001 ~ REQ-OTH-005
--
-- Frozen baseline sources:
--   AGENTS.md
--   docs/spec/SPEC_BASELINE.md
--   docs/spec/OPEN_QUESTIONS.md
--   docs/plan/PLANS.md
--   docs/plan/SCHEMA_RECONCILIATION.md
--   docs/spec/TECH_STACK_BASELINE.md
--   docs/spec/DEV_ENV_CONVENTIONS.md
--
-- Notes:
--   1. Run this file against an empty MySQL 8.4 schema.
--   2. Session state is Redis-backed by baseline and is intentionally not stored in MySQL.
--   3. Overbooking prevention depends on application-level transaction + lock handling
--      (BD-01). This DDL provides the supporting keys and indexes for that flow.

SET NAMES utf8mb4;

CREATE TABLE users (
    user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    login_id VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Bcrypt hash only.',
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    role ENUM('GUEST', 'HOST', 'ADMIN') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_users_login_id (login_id),
    KEY idx_users_role_status (role, status),
    KEY idx_users_email (email),
    KEY idx_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Shared account table for guest, host, and admin users.';

CREATE TABLE user_login_security (
    user_id BIGINT UNSIGNED NOT NULL,
    failed_login_count INT UNSIGNED NOT NULL DEFAULT 0,
    last_failed_at DATETIME(6) NULL,
    locked_until DATETIME(6) NULL,
    last_login_at DATETIME(6) NULL,
    password_changed_at DATETIME(6) NULL,
    PRIMARY KEY (user_id),
    KEY idx_user_login_security_locked_until (locked_until),
    CONSTRAINT fk_user_login_security_user
        FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT chk_user_login_security_failed_login_count
        CHECK (failed_login_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Login failure count and lockout metadata for session-based authentication.';

CREATE TABLE host_role_requests (
    request_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    request_reason VARCHAR(500) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'DENIED') NOT NULL DEFAULT 'PENDING',
    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at DATETIME(6) NULL,
    review_reason VARCHAR(500) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (request_id),
    KEY idx_host_role_requests_user_status (user_id, status),
    KEY idx_host_role_requests_status_created_at (status, created_at),
    CONSTRAINT fk_host_role_requests_user
        FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_host_role_requests_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users (user_id),
    CONSTRAINT chk_host_role_requests_review_state
        CHECK (
            (status = 'PENDING' AND reviewed_by IS NULL AND reviewed_at IS NULL)
            OR
            (status IN ('APPROVED', 'DENIED') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Guest-to-host role requests and the admin review result.';

CREATE TABLE password_recovery_verifications (
    verification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    verification_type ENUM('FIND_ID', 'RESET_PASSWORD') NOT NULL,
    channel ENUM('EMAIL', 'SMS') NOT NULL,
    token_hash VARCHAR(255) NOT NULL COMMENT 'Only hashed recovery tokens or codes are stored.',
    expires_at DATETIME(6) NOT NULL,
    consumed_at DATETIME(6) NULL,
    status ENUM('PENDING', 'VERIFIED', 'EXPIRED', 'CONSUMED') NOT NULL DEFAULT 'PENDING',
    attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (verification_id),
    KEY idx_password_recovery_user_status (user_id, status),
    KEY idx_password_recovery_expires_at (expires_at),
    KEY idx_password_recovery_token_hash (token_hash),
    CONSTRAINT fk_password_recovery_verifications_user
        FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT chk_password_recovery_attempt_count
        CHECK (attempt_count >= 0),
    CONSTRAINT chk_password_recovery_consumed_state
        CHECK (
            (status = 'CONSUMED' AND consumed_at IS NOT NULL)
            OR
            (status IN ('PENDING', 'VERIFIED', 'EXPIRED') AND consumed_at IS NULL)
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Verification codes or tokens for find-id and password reset flows.';

CREATE TABLE accommodations (
    accommodation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    host_user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    region VARCHAR(50) NOT NULL,
    info_text TEXT NULL,
    check_in_time TIME NOT NULL,
    check_out_time TIME NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (accommodation_id),
    KEY idx_accommodations_host_status (host_user_id, status),
    KEY idx_accommodations_region_status (region, status),
    CONSTRAINT fk_accommodations_host_user
        FOREIGN KEY (host_user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Accommodation master data owned by a single host user.';

CREATE TABLE room_types (
    room_type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    accommodation_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    base_capacity INT UNSIGNED NOT NULL,
    max_capacity INT UNSIGNED NOT NULL,
    base_price DECIMAL(12, 2) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (room_type_id),
    UNIQUE KEY uk_room_types_accommodation_name (accommodation_id, name),
    UNIQUE KEY uk_room_types_accommodation_room_type (accommodation_id, room_type_id),
    KEY idx_room_types_accommodation_status (accommodation_id, status),
    CONSTRAINT fk_room_types_accommodation
        FOREIGN KEY (accommodation_id) REFERENCES accommodations (accommodation_id),
    CONSTRAINT chk_room_types_capacity
        CHECK (base_capacity > 0 AND max_capacity >= base_capacity),
    CONSTRAINT chk_room_types_base_price
        CHECK (base_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Reservation intake unit. Each room type belongs to one accommodation.';

CREATE TABLE rooms (
    room_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    accommodation_id BIGINT UNSIGNED NOT NULL,
    room_type_id BIGINT UNSIGNED NOT NULL,
    room_code VARCHAR(20) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    memo TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (room_id),
    UNIQUE KEY uk_rooms_accommodation_room_code (accommodation_id, room_code),
    KEY idx_rooms_room_type_status (room_type_id, status),
    KEY idx_rooms_accommodation_status (accommodation_id, status),
    CONSTRAINT fk_rooms_accommodation
        FOREIGN KEY (accommodation_id) REFERENCES accommodations (accommodation_id),
    CONSTRAINT fk_rooms_room_type
        FOREIGN KEY (accommodation_id, room_type_id)
        REFERENCES room_types (accommodation_id, room_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Operational room assignment unit. Guests do not directly choose room numbers.';

CREATE TABLE reservations (
    reservation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reservation_no VARCHAR(50) NOT NULL,
    guest_user_id BIGINT UNSIGNED NOT NULL,
    accommodation_id BIGINT UNSIGNED NOT NULL,
    room_type_id BIGINT UNSIGNED NOT NULL,
    guest_count INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    requested_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    confirmed_at DATETIME(6) NULL,
    cancelled_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (reservation_id),
    UNIQUE KEY uk_reservations_reservation_no (reservation_no),
    KEY idx_reservations_guest_status_requested_at (guest_user_id, status, requested_at),
    KEY idx_reservations_accommodation_room_type_status (accommodation_id, room_type_id, status),
    KEY idx_reservations_date_range (check_in_date, check_out_date),
    CONSTRAINT fk_reservations_guest_user
        FOREIGN KEY (guest_user_id) REFERENCES users (user_id),
    CONSTRAINT fk_reservations_accommodation
        FOREIGN KEY (accommodation_id) REFERENCES accommodations (accommodation_id),
    CONSTRAINT fk_reservations_room_type
        FOREIGN KEY (accommodation_id, room_type_id)
        REFERENCES room_types (accommodation_id, room_type_id),
    CONSTRAINT chk_reservations_date_range
        CHECK (check_in_date < check_out_date),
    CONSTRAINT chk_reservations_guest_count
        CHECK (guest_count > 0),
    CONSTRAINT chk_reservations_status_timestamps
        CHECK (
            (status = 'PENDING' AND confirmed_at IS NULL AND cancelled_at IS NULL)
            OR
            (status = 'CONFIRMED' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL)
            OR
            (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Reservation header. Inventory is consumed while status is PENDING or CONFIRMED.';

CREATE TABLE reservation_nights (
    reservation_night_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reservation_id BIGINT UNSIGNED NOT NULL,
    stay_date DATE NOT NULL,
    assigned_room_id BIGINT UNSIGNED NOT NULL COMMENT 'Initial room assignment is created at reservation time by baseline.',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (reservation_night_id),
    UNIQUE KEY uk_reservation_nights_reservation_stay_date (reservation_id, stay_date),
    KEY idx_reservation_nights_assigned_room_stay_date (assigned_room_id, stay_date),
    KEY idx_reservation_nights_stay_date (stay_date),
    CONSTRAINT fk_reservation_nights_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id),
    CONSTRAINT fk_reservation_nights_assigned_room
        FOREIGN KEY (assigned_room_id) REFERENCES rooms (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Nightly occupancy/allocation unit. No unique key on (assigned_room_id, stay_date) because active occupancy is determined via reservation header status.';

CREATE TABLE reservation_status_history (
    history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reservation_id BIGINT UNSIGNED NOT NULL,
    from_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NULL,
    to_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL,
    action_type ENUM(
        'REQUESTED',
        'HOST_CONFIRMED',
        'HOST_REJECTED',
        'GUEST_CANCELLED',
        'HOST_CANCELLED',
        'ADMIN_CANCELLED'
    ) NOT NULL,
    changed_by_user_id BIGINT UNSIGNED NOT NULL,
    reason_type VARCHAR(50) NULL,
    reason_text VARCHAR(500) NULL,
    changed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (history_id),
    KEY idx_reservation_status_history_reservation_changed_at (reservation_id, changed_at),
    KEY idx_reservation_status_history_action_type (action_type, changed_at),
    CONSTRAINT fk_reservation_status_history_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id),
    CONSTRAINT fk_reservation_status_history_changed_by
        FOREIGN KEY (changed_by_user_id) REFERENCES users (user_id),
    CONSTRAINT chk_reservation_status_history_transition
        CHECK (from_status IS NULL OR from_status <> to_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Reservation state transitions with actor and reason metadata for auditing and reporting.';

CREATE TABLE price_policies (
    policy_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    accommodation_id BIGINT UNSIGNED NOT NULL,
    room_type_id BIGINT UNSIGNED NOT NULL,
    policy_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    delta_amount DECIMAL(12, 2) NOT NULL COMMENT 'Signed additive delta. Percent mode is intentionally not supported in V1.',
    day_of_week_mask TINYINT UNSIGNED NULL COMMENT 'Null means all days. Otherwise use a 7-bit mask for Mon-Sun coverage.',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (policy_id),
    KEY idx_price_policies_target_date_status (room_type_id, start_date, end_date, status),
    KEY idx_price_policies_room_type_status_dates (room_type_id, status, start_date, end_date),
    KEY idx_price_policies_accommodation_status (accommodation_id, status),
    CONSTRAINT fk_price_policies_room_type
        FOREIGN KEY (accommodation_id, room_type_id)
        REFERENCES room_types (accommodation_id, room_type_id),
    CONSTRAINT chk_price_policies_date_range
        CHECK (start_date <= end_date),
    CONSTRAINT chk_price_policies_day_of_week_mask
        CHECK (day_of_week_mask IS NULL OR day_of_week_mask BETWEEN 0 AND 127)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Room-type pricing rules. Final nightly price is base_price plus the sum of active deltas.';

CREATE TABLE room_blocks (
    block_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    room_id BIGINT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason_type ENUM('MAINTENANCE', 'HOST_BLOCK', 'ADMIN_BLOCK', 'OTHER') NOT NULL,
    reason_text VARCHAR(500) NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (block_id),
    KEY idx_room_blocks_room_date_status (room_id, start_date, end_date, status),
    KEY idx_room_blocks_room_status_date (room_id, status, start_date, end_date),
    KEY idx_room_blocks_status_date (status, start_date, end_date),
    CONSTRAINT fk_room_blocks_room
        FOREIGN KEY (room_id) REFERENCES rooms (room_id),
    CONSTRAINT fk_room_blocks_created_by_user
        FOREIGN KEY (created_by_user_id) REFERENCES users (user_id),
    CONSTRAINT chk_room_blocks_date_range
        CHECK (start_date <= end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Room-level only block model for V1. Block scope is intentionally not room-type wide.';

CREATE TABLE notices (
    notice_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    published_at DATETIME(6) NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (notice_id),
    KEY idx_notices_status_published_at (status, published_at),
    KEY idx_notices_is_pinned_status (is_pinned, status),
    CONSTRAINT fk_notices_created_by_user
        FOREIGN KEY (created_by_user_id) REFERENCES users (user_id),
    CONSTRAINT chk_notices_publication_state
        CHECK (
            (status = 'PUBLISHED' AND published_at IS NOT NULL)
            OR
            (status = 'DRAFT' AND published_at IS NULL)
            OR
            (status = 'ARCHIVED')
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Administrator-managed notices only. End-user notification tables are out of V1 scope.';

CREATE TABLE notice_attachments (
    attachment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    notice_id BIGINT UNSIGNED NOT NULL,
    origin_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_ext VARCHAR(20) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    checksum VARCHAR(100) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (attachment_id),
    KEY idx_notice_attachments_notice_id (notice_id),
    CONSTRAINT fk_notice_attachments_notice
        FOREIGN KEY (notice_id) REFERENCES notices (notice_id),
    CONSTRAINT chk_notice_attachments_file_size
        CHECK (file_size >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Attachment metadata for administrator notices.';

CREATE TABLE terms (
    term_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category ENUM('SERVICE', 'PRIVACY', 'MARKETING') NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    is_required BOOLEAN NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    effective_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (term_id),
    UNIQUE KEY uk_terms_category_version (category, version),
    KEY idx_terms_category_status_effective_at (category, status, effective_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Terms master rows versioned by category and version.';

CREATE TABLE user_term_agreements (
    agreement_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    term_id BIGINT UNSIGNED NOT NULL,
    agreed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    term_version_snapshot VARCHAR(50) NOT NULL,
    PRIMARY KEY (agreement_id),
    UNIQUE KEY uk_user_term_agreements_user_term (user_id, term_id),
    KEY idx_user_term_agreements_user_id (user_id),
    CONSTRAINT fk_user_term_agreements_user
        FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_user_term_agreements_term
        FOREIGN KEY (term_id) REFERENCES terms (term_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Per-user agreement history captured at the specific published term row.';

CREATE TABLE audit_logs (
    audit_log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT UNSIGNED NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT UNSIGNED NULL,
    action_type VARCHAR(50) NOT NULL,
    reason_type VARCHAR(50) NULL,
    reason_text VARCHAR(500) NULL,
    before_state_json JSON NULL,
    after_state_json JSON NULL,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (audit_log_id),
    KEY idx_audit_logs_target (target_type, target_id, occurred_at),
    KEY idx_audit_logs_actor_occurred_at (actor_user_id, occurred_at),
    KEY idx_audit_logs_action_type_occurred_at (action_type, occurred_at),
    CONSTRAINT fk_audit_logs_actor_user
        FOREIGN KEY (actor_user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Cross-domain audit trail with optional before/after JSON snapshots.';

CREATE TABLE system_logs (
    system_log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    log_level ENUM('INFO', 'WARN', 'ERROR') NOT NULL,
    source VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    context_json JSON NULL,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (system_log_id),
    KEY idx_system_logs_level_occurred_at (log_level, occurred_at),
    KEY idx_system_logs_source_occurred_at (source, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Database-backed fallback for operational log queries until external observability is adopted.';
