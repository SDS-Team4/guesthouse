-- Guesthouse V2 expanded demo seed data
-- Traceability:
--   REQ-F-001 ~ REQ-F-035
--   REQ-F-036 ~ REQ-F-049
--   REQ-F-050 ~ REQ-F-127
--   REQ-NF-003 ~ REQ-NF-007
--   REQ-SEC-001 ~ REQ-SEC-008
--   BR-001 ~ BR-008
--   REQ-OTH-001 ~ REQ-OTH-005
--
-- Purpose:
--   - Keep the seed-v1 baseline shape and demo credentials.
--   - Expand demo inventory so each seeded region has 6 accommodations.
--   - Preserve pricing, block, reservation, and audit examples for recording flows.
--
-- Usage:
--   1. Apply db/schema-v1.sql to an empty MySQL 8.4 schema first.
--   2. Apply this seed file to the same schema.
--   3. Run the smoke queries at the bottom to validate the expanded shape.
--
-- Expanded demo seed shape:
--   - guest users 6
--   - host users 1
--   - admin users 1
--   - regions 6
--   - accommodations 36 (6 per region)
--   - room types 108
--   - rooms 216
--   - price policies 144
--   - room blocks 12
--   - reservations 108
--
-- Local demo credentials for browser/API smoke tests:
--   - guest.demo / guestpass123!
--   - guest.01 ~ guest.05 / guestpass123!
--   - host.demo / hostpass123!
--   - admin.demo / adminpass123!
--
-- All sample timestamps below are written in KST business time.

SET NAMES utf8mb4;
SET time_zone = '+09:00';

START TRANSACTION;

INSERT INTO users (
    user_id,
    login_id,
    password_hash,
    name,
    email,
    phone,
    role,
    status,
    created_at,
    updated_at
) VALUES
    (101, 'guest.demo', '$2a$10$us7TpIm6HMYK.1.6YmrFGe7S8eS17X8hzdbe5zl6yc8ruMNM8ifpG', 'Guest Demo', 'guest.demo@example.com', '010-1000-0001', 'GUEST', 'ACTIVE', '2026-03-20 09:00:00.000000', '2026-03-20 09:00:00.000000'),
    (102, 'host.demo', '$2a$10$XltkzpF29lx.QX3MN/ISG.IENn8seKfB8Udy9CxbS7/XTRg1ad/Ou', 'Host Demo', 'host.demo@example.com', '010-1000-0002', 'HOST', 'ACTIVE', '2026-03-20 09:05:00.000000', '2026-03-20 09:05:00.000000'),
    (103, 'admin.demo', '$2a$10$qw.DTWXQPSx2CRjjreuL8e6ow7.G0Lu7wXVCVbsG8gScv933ChSly', 'Admin Demo', 'admin.demo@example.com', '010-1000-0003', 'ADMIN', 'ACTIVE', '2026-03-20 09:10:00.000000', '2026-03-20 09:10:00.000000'),
    (104, 'guest.01', '$2a$10$us7TpIm6HMYK.1.6YmrFGe7S8eS17X8hzdbe5zl6yc8ruMNM8ifpG', 'Guest One', 'guest.01@example.com', '010-1000-0101', 'GUEST', 'ACTIVE', '2026-03-20 09:15:00.000000', '2026-03-20 09:15:00.000000'),
    (105, 'guest.02', '$2a$10$us7TpIm6HMYK.1.6YmrFGe7S8eS17X8hzdbe5zl6yc8ruMNM8ifpG', 'Guest Two', 'guest.02@example.com', '010-1000-0102', 'GUEST', 'ACTIVE', '2026-03-20 09:20:00.000000', '2026-03-20 09:20:00.000000'),
    (106, 'guest.03', '$2a$10$us7TpIm6HMYK.1.6YmrFGe7S8eS17X8hzdbe5zl6yc8ruMNM8ifpG', 'Guest Three', 'guest.03@example.com', '010-1000-0103', 'GUEST', 'ACTIVE', '2026-03-20 09:25:00.000000', '2026-03-20 09:25:00.000000'),
    (107, 'guest.04', '$2a$10$us7TpIm6HMYK.1.6YmrFGe7S8eS17X8hzdbe5zl6yc8ruMNM8ifpG', 'Guest Four', 'guest.04@example.com', '010-1000-0104', 'GUEST', 'ACTIVE', '2026-03-20 09:30:00.000000', '2026-03-20 09:30:00.000000'),
    (108, 'guest.05', '$2a$10$us7TpIm6HMYK.1.6YmrFGe7S8eS17X8hzdbe5zl6yc8ruMNM8ifpG', 'Guest Five', 'guest.05@example.com', '010-1000-0105', 'GUEST', 'ACTIVE', '2026-03-20 09:35:00.000000', '2026-03-20 09:35:00.000000');

INSERT INTO user_login_security (
    user_id,
    failed_login_count,
    last_failed_at,
    locked_until,
    last_login_at,
    password_changed_at
) VALUES
    (101, 0, NULL, NULL, '2026-03-23 20:10:00.000000', '2026-03-20 09:00:00.000000'),
    (102, 1, '2026-03-22 08:15:00.000000', NULL, '2026-03-23 18:00:00.000000', '2026-03-20 09:05:00.000000'),
    (103, 0, NULL, NULL, '2026-03-23 08:30:00.000000', '2026-03-20 09:10:00.000000'),
    (104, 0, NULL, NULL, '2026-03-23 19:10:00.000000', '2026-03-20 09:15:00.000000'),
    (105, 0, NULL, NULL, '2026-03-23 19:20:00.000000', '2026-03-20 09:20:00.000000'),
    (106, 0, NULL, NULL, '2026-03-23 19:30:00.000000', '2026-03-20 09:25:00.000000'),
    (107, 0, NULL, NULL, '2026-03-23 19:40:00.000000', '2026-03-20 09:30:00.000000'),
    (108, 0, NULL, NULL, '2026-03-23 19:50:00.000000', '2026-03-20 09:35:00.000000');

INSERT INTO host_role_requests (
    request_id,
    user_id,
    request_reason,
    status,
    reviewed_by,
    reviewed_at,
    review_reason,
    created_at,
    updated_at
) VALUES
    (
        301,
        102,
        'Approved host account for the expanded multi-region demo seed.',
        'APPROVED',
        103,
        '2026-03-20 13:00:00.000000',
        'Demo operator account approved for property and reservation management flows.',
        '2026-03-20 10:00:00.000000',
        '2026-03-20 13:00:00.000000'
    );

INSERT INTO password_recovery_verifications (
    verification_id,
    user_id,
    verification_type,
    channel,
    token_hash,
    expires_at,
    consumed_at,
    status,
    attempt_count,
    created_at
) VALUES
    (
        401,
        101,
        'RESET_PASSWORD',
        'EMAIL',
        'seed-v2-reset-token-hash-guest-101',
        '2026-03-21 10:30:00.000000',
        '2026-03-21 09:45:00.000000',
        'CONSUMED',
        1,
        '2026-03-21 09:30:00.000000'
    );

INSERT INTO notices (
    notice_id,
    title,
    content,
    status,
    is_pinned,
    published_at,
    created_by_user_id,
    created_at,
    updated_at
) VALUES
    (
        1201,
        'Expanded demo inventory available',
        'The V2 local seed now includes six regions with six properties each for recording and smoke validation.',
        'PUBLISHED',
        TRUE,
        '2026-03-26 09:00:00.000000',
        103,
        '2026-03-26 08:50:00.000000',
        '2026-03-26 09:00:00.000000'
    );

INSERT INTO terms (
    term_id,
    category,
    title,
    content,
    version,
    is_required,
    status,
    effective_at,
    created_at,
    updated_at
) VALUES
    (1301, 'SERVICE', 'Service Terms', 'Guesthouse reservation platform service terms v1.1', '1.1', TRUE, 'PUBLISHED', '2026-03-01 00:00:00.000000', '2026-03-01 00:00:00.000000', '2026-03-01 00:00:00.000000'),
    (1302, 'PRIVACY', 'Privacy Policy', 'Guesthouse privacy handling policy v1.1', '1.1', TRUE, 'PUBLISHED', '2026-03-01 00:00:00.000000', '2026-03-01 00:00:00.000000', '2026-03-01 00:00:00.000000');

INSERT INTO user_term_agreements (
    agreement_id,
    user_id,
    term_id,
    agreed_at,
    term_version_snapshot
) VALUES
    (1401, 101, 1301, '2026-03-20 09:00:00.000000', '1.1'),
    (1402, 101, 1302, '2026-03-20 09:00:00.000000', '1.1'),
    (1403, 102, 1301, '2026-03-20 09:05:00.000000', '1.1'),
    (1404, 102, 1302, '2026-03-20 09:05:00.000000', '1.1'),
    (1405, 103, 1301, '2026-03-20 09:10:00.000000', '1.1'),
    (1406, 103, 1302, '2026-03-20 09:10:00.000000', '1.1'),
    (1407, 104, 1301, '2026-03-20 09:15:00.000000', '1.1'),
    (1408, 104, 1302, '2026-03-20 09:15:00.000000', '1.1'),
    (1409, 105, 1301, '2026-03-20 09:20:00.000000', '1.1'),
    (1410, 105, 1302, '2026-03-20 09:20:00.000000', '1.1'),
    (1411, 106, 1301, '2026-03-20 09:25:00.000000', '1.1'),
    (1412, 106, 1302, '2026-03-20 09:25:00.000000', '1.1'),
    (1413, 107, 1301, '2026-03-20 09:30:00.000000', '1.1'),
    (1414, 107, 1302, '2026-03-20 09:30:00.000000', '1.1'),
    (1415, 108, 1301, '2026-03-20 09:35:00.000000', '1.1'),
    (1416, 108, 1302, '2026-03-20 09:35:00.000000', '1.1');

DROP TEMPORARY TABLE IF EXISTS tmp_seed_regions;
CREATE TEMPORARY TABLE tmp_seed_regions (
    region_order INT NOT NULL,
    region_code VARCHAR(50) NOT NULL,
    region_name VARCHAR(50) NOT NULL,
    area_name VARCHAR(100) NOT NULL
);

INSERT INTO tmp_seed_regions (region_order, region_code, region_name, area_name) VALUES
    (1, '서울', '서울', '서울 마포구'),
    (2, '부산', '부산', '부산 해운대구'),
    (3, '제주', '제주', '제주시 애월읍'),
    (4, '강원', '강원', '강원 강릉시 경포로'),
    (5, '경주', '경주', '경북 경주시 황남동'),
    (6, '전주', '전주', '전북 전주시 완산구');

DROP TEMPORARY TABLE IF EXISTS tmp_seed_slots;
CREATE TEMPORARY TABLE tmp_seed_slots (
    slot_no INT NOT NULL,
    slot_label VARCHAR(50) NOT NULL,
    street_no INT NOT NULL
);

INSERT INTO tmp_seed_slots (slot_no, slot_label, street_no) VALUES
    (1, 'Canvas', 11),
    (2, 'Terrace', 23),
    (3, 'Atelier', 35),
    (4, 'Garden', 47),
    (5, 'Loft', 59),
    (6, 'Courtyard', 71);

DROP TEMPORARY TABLE IF EXISTS tmp_seed_accommodations;
CREATE TEMPORARY TABLE tmp_seed_accommodations AS
SELECT
    500 + ((r.region_order - 1) * 6) + s.slot_no AS accommodation_id,
    102 AS host_user_id,
    r.region_order,
    r.region_code,
    r.region_name,
    r.area_name,
    s.slot_no,
    s.slot_label,
    CONCAT(r.region_name, ' ', s.slot_label, ' Guesthouse') AS accommodation_name,
    CONCAT(s.street_no, ' Demo-ro, ', r.area_name) AS address,
    CONCAT(
        r.region_name,
        ' demo property ',
        LOWER(s.slot_label),
        ' with room, pricing, block, and reservation samples for recording flows.'
    ) AS info_text,
    CASE r.region_code
        WHEN '서울' THEN 98000
        WHEN '부산' THEN 93000
        WHEN '제주' THEN 108000
        WHEN '강원' THEN 88000
        WHEN '경주' THEN 90000
        WHEN '전주' THEN 86000
        ELSE 85000
    END + ((s.slot_no - 1) * 2500) AS standard_base_price,
    CASE WHEN MOD(s.slot_no, 2) = 0 THEN '16:00:00' ELSE '15:00:00' END AS check_in_time,
    '11:00:00' AS check_out_time,
    DATE_ADD('2026-03-20 14:00:00', INTERVAL (((r.region_order - 1) * 6) + s.slot_no - 1) MINUTE) AS created_at
FROM tmp_seed_regions r
CROSS JOIN tmp_seed_slots s;

INSERT INTO accommodations (
    accommodation_id,
    host_user_id,
    name,
    address,
    region,
    info_text,
    check_in_time,
    check_out_time,
    status,
    created_at,
    updated_at
)
SELECT
    accommodation_id,
    host_user_id,
    accommodation_name,
    address,
    region_code,
    info_text,
    check_in_time,
    check_out_time,
    'ACTIVE',
    created_at,
    created_at
FROM tmp_seed_accommodations
ORDER BY accommodation_id;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_room_types;
CREATE TEMPORARY TABLE tmp_seed_room_types (
    room_type_id BIGINT UNSIGNED NOT NULL,
    accommodation_id BIGINT UNSIGNED NOT NULL,
    room_type_seq INT NOT NULL,
    room_type_name VARCHAR(100) NOT NULL,
    base_capacity INT UNSIGNED NOT NULL,
    max_capacity INT UNSIGNED NOT NULL,
    base_price DECIMAL(12, 2) NOT NULL,
    created_at DATETIME(6) NOT NULL
);

INSERT INTO tmp_seed_room_types (
    room_type_id,
    accommodation_id,
    room_type_seq,
    room_type_name,
    base_capacity,
    max_capacity,
    base_price,
    created_at
)
SELECT
    1000 + ((a.accommodation_id - 501) * 3) + 1 AS room_type_id,
    a.accommodation_id,
    1 AS room_type_seq,
    'Standard Twin' AS room_type_name,
    2 AS base_capacity,
    2 AS max_capacity,
    a.standard_base_price AS base_price,
    DATE_ADD(a.created_at, INTERVAL 10 MINUTE) AS created_at
FROM tmp_seed_accommodations a;

INSERT INTO tmp_seed_room_types (
    room_type_id,
    accommodation_id,
    room_type_seq,
    room_type_name,
    base_capacity,
    max_capacity,
    base_price,
    created_at
)
SELECT
    1000 + ((a.accommodation_id - 501) * 3) + 2 AS room_type_id,
    a.accommodation_id,
    2 AS room_type_seq,
    'Deluxe Double' AS room_type_name,
    2 AS base_capacity,
    3 AS max_capacity,
    a.standard_base_price + 22000 AS base_price,
    DATE_ADD(a.created_at, INTERVAL 15 MINUTE) AS created_at
FROM tmp_seed_accommodations a;

INSERT INTO tmp_seed_room_types (
    room_type_id,
    accommodation_id,
    room_type_seq,
    room_type_name,
    base_capacity,
    max_capacity,
    base_price,
    created_at
)
SELECT
    1000 + ((a.accommodation_id - 501) * 3) + 3 AS room_type_id,
    a.accommodation_id,
    3 AS room_type_seq,
    CASE a.slot_no
        WHEN 1 THEN 'Hanok Suite'
        WHEN 2 THEN 'Garden Family'
        WHEN 3 THEN 'Dormitory Quad'
        WHEN 4 THEN 'Ocean Triple'
        WHEN 5 THEN 'Rooftop Studio'
        ELSE 'Courtyard Family'
    END AS room_type_name,
    CASE
        WHEN a.slot_no IN (3, 6) THEN 4
        WHEN a.slot_no IN (2, 4) THEN 3
        ELSE 2
    END AS base_capacity,
    CASE
        WHEN a.slot_no = 6 THEN 5
        WHEN a.slot_no = 3 THEN 4
        WHEN a.slot_no IN (2, 4) THEN 4
        ELSE 3
    END AS max_capacity,
    a.standard_base_price
        + CASE a.slot_no
            WHEN 1 THEN 52000
            WHEN 2 THEN 48000
            WHEN 3 THEN 30000
            WHEN 4 THEN 38000
            WHEN 5 THEN 42000
            ELSE 50000
        END AS base_price,
    DATE_ADD(a.created_at, INTERVAL 20 MINUTE) AS created_at
FROM tmp_seed_accommodations a;

INSERT INTO room_types (
    room_type_id,
    accommodation_id,
    name,
    base_capacity,
    max_capacity,
    base_price,
    status,
    created_at,
    updated_at
)
SELECT
    room_type_id,
    accommodation_id,
    room_type_name,
    base_capacity,
    max_capacity,
    base_price,
    'ACTIVE',
    created_at,
    created_at
FROM tmp_seed_room_types
ORDER BY room_type_id;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_room_slots;
CREATE TEMPORARY TABLE tmp_seed_room_slots (
    room_slot INT NOT NULL,
    room_type_seq INT NOT NULL,
    room_code VARCHAR(20) NOT NULL,
    room_label VARCHAR(50) NOT NULL
);

INSERT INTO tmp_seed_room_slots (room_slot, room_type_seq, room_code, room_label) VALUES
    (1, 1, 'ST101', 'Standard Twin 1'),
    (2, 1, 'ST102', 'Standard Twin 2'),
    (3, 2, 'DL201', 'Deluxe Double 1'),
    (4, 2, 'DL202', 'Deluxe Double 2'),
    (5, 3, 'SG301', 'Signature Room 1'),
    (6, 3, 'SG302', 'Signature Room 2');

DROP TEMPORARY TABLE IF EXISTS tmp_seed_rooms;
CREATE TEMPORARY TABLE tmp_seed_rooms AS
SELECT
    2000 + ((a.accommodation_id - 501) * 6) + rs.room_slot AS room_id,
    a.accommodation_id,
    rt.room_type_id,
    rs.room_slot,
    rs.room_code,
    CASE
        WHEN rs.room_slot = 6 AND a.slot_no = 6 THEN 'MAINTENANCE'
        ELSE 'ACTIVE'
    END AS room_status,
    CONCAT(a.region_name, ' ', rt.room_type_name, ' / ', rs.room_label, ' for demo operations') AS memo,
    DATE_ADD(a.created_at, INTERVAL 20 + rs.room_slot MINUTE) AS created_at
FROM tmp_seed_accommodations a
CROSS JOIN tmp_seed_room_slots rs
JOIN tmp_seed_room_types rt
  ON rt.accommodation_id = a.accommodation_id
 AND rt.room_type_seq = rs.room_type_seq;

INSERT INTO rooms (
    room_id,
    accommodation_id,
    room_type_id,
    room_code,
    status,
    memo,
    created_at,
    updated_at
)
SELECT
    room_id,
    accommodation_id,
    room_type_id,
    room_code,
    room_status,
    memo,
    created_at,
    created_at
FROM tmp_seed_rooms
ORDER BY room_id;

INSERT INTO price_policies (
    policy_id,
    accommodation_id,
    room_type_id,
    policy_name,
    start_date,
    end_date,
    delta_amount,
    day_of_week_mask,
    status,
    created_at,
    updated_at
)
SELECT
    700 + ((a.accommodation_id - 501) * 4) + 1 AS policy_id,
    a.accommodation_id,
    1000 + ((a.accommodation_id - 501) * 3) + 1 AS room_type_id,
    'Peak Season Boost',
    '2026-04-01',
    '2026-04-30',
    8000 + (a.region_order * 500),
    NULL,
    'ACTIVE',
    DATE_ADD(a.created_at, INTERVAL 1 DAY),
    DATE_ADD(a.created_at, INTERVAL 1 DAY)
FROM tmp_seed_accommodations a;

INSERT INTO price_policies (
    policy_id,
    accommodation_id,
    room_type_id,
    policy_name,
    start_date,
    end_date,
    delta_amount,
    day_of_week_mask,
    status,
    created_at,
    updated_at
)
SELECT
    700 + ((a.accommodation_id - 501) * 4) + 2 AS policy_id,
    a.accommodation_id,
    1000 + ((a.accommodation_id - 501) * 3) + 1 AS room_type_id,
    'Mid-Month Demo Promo',
    '2026-04-15',
    '2026-04-17',
    -2000 - (MOD(a.slot_no, 2) * 500),
    NULL,
    'ACTIVE',
    DATE_ADD(DATE_ADD(a.created_at, INTERVAL 1 DAY), INTERVAL 5 MINUTE),
    DATE_ADD(DATE_ADD(a.created_at, INTERVAL 1 DAY), INTERVAL 5 MINUTE)
FROM tmp_seed_accommodations a;

INSERT INTO price_policies (
    policy_id,
    accommodation_id,
    room_type_id,
    policy_name,
    start_date,
    end_date,
    delta_amount,
    day_of_week_mask,
    status,
    created_at,
    updated_at
)
SELECT
    700 + ((a.accommodation_id - 501) * 4) + 3 AS policy_id,
    a.accommodation_id,
    1000 + ((a.accommodation_id - 501) * 3) + 2 AS room_type_id,
    'Deluxe Weekend Boost',
    '2026-04-01',
    '2026-04-30',
    12000 + (a.slot_no * 500),
    NULL,
    'ACTIVE',
    DATE_ADD(DATE_ADD(a.created_at, INTERVAL 1 DAY), INTERVAL 10 MINUTE),
    DATE_ADD(DATE_ADD(a.created_at, INTERVAL 1 DAY), INTERVAL 10 MINUTE)
FROM tmp_seed_accommodations a;

INSERT INTO price_policies (
    policy_id,
    accommodation_id,
    room_type_id,
    policy_name,
    start_date,
    end_date,
    delta_amount,
    day_of_week_mask,
    status,
    created_at,
    updated_at
)
SELECT
    700 + ((a.accommodation_id - 501) * 4) + 4 AS policy_id,
    a.accommodation_id,
    1000 + ((a.accommodation_id - 501) * 3) + 3 AS room_type_id,
    'Signature Experience Package',
    '2026-04-01',
    '2026-04-30',
    15000 + (a.region_order * 700),
    NULL,
    'ACTIVE',
    DATE_ADD(DATE_ADD(a.created_at, INTERVAL 1 DAY), INTERVAL 15 MINUTE),
    DATE_ADD(DATE_ADD(a.created_at, INTERVAL 1 DAY), INTERVAL 15 MINUTE)
FROM tmp_seed_accommodations a;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_blocks;
CREATE TEMPORARY TABLE tmp_seed_blocks AS
SELECT
    800 + ((a.region_order - 1) * 2) + CASE WHEN a.slot_no = 2 THEN 1 ELSE 2 END AS block_id,
    2000 + ((a.accommodation_id - 501) * 6) + 2 AS room_id,
    '2026-04-16' AS start_date,
    '2026-04-17' AS end_date,
    'MAINTENANCE' AS reason_type,
    CONCAT(a.region_name, ' ', a.slot_label, ' standard room maintenance window for demo sell-out.') AS reason_text,
    'ACTIVE' AS block_status,
    102 AS created_by_user_id,
    DATE_ADD(a.created_at, INTERVAL 2 DAY) AS created_at
FROM tmp_seed_accommodations a
WHERE a.slot_no IN (2, 5);

INSERT INTO room_blocks (
    block_id,
    room_id,
    start_date,
    end_date,
    reason_type,
    reason_text,
    status,
    created_by_user_id,
    created_at,
    updated_at
)
SELECT
    block_id,
    room_id,
    start_date,
    end_date,
    reason_type,
    reason_text,
    block_status,
    created_by_user_id,
    created_at,
    created_at
FROM tmp_seed_blocks
ORDER BY block_id;

DROP TEMPORARY TABLE IF EXISTS tmp_seed_reservations;
CREATE TEMPORARY TABLE tmp_seed_reservations (
    reservation_id BIGINT UNSIGNED NOT NULL,
    reservation_no VARCHAR(50) NOT NULL,
    guest_user_id BIGINT UNSIGNED NOT NULL,
    accommodation_id BIGINT UNSIGNED NOT NULL,
    room_type_id BIGINT UNSIGNED NOT NULL,
    assigned_room_id BIGINT UNSIGNED NOT NULL,
    guest_count INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    reservation_status VARCHAR(20) NOT NULL,
    requested_at DATETIME(6) NOT NULL,
    confirmed_at DATETIME(6) NULL,
    cancelled_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL
);

INSERT INTO tmp_seed_reservations (
    reservation_id,
    reservation_no,
    guest_user_id,
    accommodation_id,
    room_type_id,
    assigned_room_id,
    guest_count,
    check_in_date,
    check_out_date,
    reservation_status,
    requested_at,
    confirmed_at,
    cancelled_at,
    created_at,
    updated_at
)
SELECT
    900 + ((a.accommodation_id - 501) * 3) + 1 AS reservation_id,
    CONCAT('GH-202604-', LPAD(((a.accommodation_id - 501) * 3) + 1, 4, '0')) AS reservation_no,
    CASE MOD(a.accommodation_id - 501, 6)
        WHEN 0 THEN 101
        WHEN 1 THEN 104
        WHEN 2 THEN 105
        WHEN 3 THEN 106
        WHEN 4 THEN 107
        ELSE 108
    END AS guest_user_id,
    a.accommodation_id,
    1000 + ((a.accommodation_id - 501) * 3) + 1 AS room_type_id,
    2000 + ((a.accommodation_id - 501) * 6) + 1 AS assigned_room_id,
    2 AS guest_count,
    '2026-04-16' AS check_in_date,
    '2026-04-18' AS check_out_date,
    'CONFIRMED' AS reservation_status,
    DATE_ADD('2026-04-01 09:00:00', INTERVAL ((a.accommodation_id - 501) * 20) MINUTE) AS requested_at,
    DATE_ADD('2026-04-01 09:15:00', INTERVAL ((a.accommodation_id - 501) * 20) MINUTE) AS confirmed_at,
    NULL AS cancelled_at,
    DATE_ADD('2026-04-01 09:00:00', INTERVAL ((a.accommodation_id - 501) * 20) MINUTE) AS created_at,
    DATE_ADD('2026-04-01 09:15:00', INTERVAL ((a.accommodation_id - 501) * 20) MINUTE) AS updated_at
FROM tmp_seed_accommodations a;

INSERT INTO tmp_seed_reservations (
    reservation_id,
    reservation_no,
    guest_user_id,
    accommodation_id,
    room_type_id,
    assigned_room_id,
    guest_count,
    check_in_date,
    check_out_date,
    reservation_status,
    requested_at,
    confirmed_at,
    cancelled_at,
    created_at,
    updated_at
)
SELECT
    900 + ((a.accommodation_id - 501) * 3) + 2 AS reservation_id,
    CONCAT('GH-202604-', LPAD(((a.accommodation_id - 501) * 3) + 2, 4, '0')) AS reservation_no,
    CASE MOD(a.accommodation_id - 500, 6)
        WHEN 0 THEN 101
        WHEN 1 THEN 104
        WHEN 2 THEN 105
        WHEN 3 THEN 106
        WHEN 4 THEN 107
        ELSE 108
    END AS guest_user_id,
    a.accommodation_id,
    1000 + ((a.accommodation_id - 501) * 3) + 2 AS room_type_id,
    2000 + ((a.accommodation_id - 501) * 6) + 3 AS assigned_room_id,
    2 AS guest_count,
    '2026-04-18' AS check_in_date,
    '2026-04-20' AS check_out_date,
    'PENDING' AS reservation_status,
    DATE_ADD('2026-04-02 11:00:00', INTERVAL ((a.accommodation_id - 501) * 15) MINUTE) AS requested_at,
    NULL AS confirmed_at,
    NULL AS cancelled_at,
    DATE_ADD('2026-04-02 11:00:00', INTERVAL ((a.accommodation_id - 501) * 15) MINUTE) AS created_at,
    DATE_ADD('2026-04-02 11:00:00', INTERVAL ((a.accommodation_id - 501) * 15) MINUTE) AS updated_at
FROM tmp_seed_accommodations a;

INSERT INTO tmp_seed_reservations (
    reservation_id,
    reservation_no,
    guest_user_id,
    accommodation_id,
    room_type_id,
    assigned_room_id,
    guest_count,
    check_in_date,
    check_out_date,
    reservation_status,
    requested_at,
    confirmed_at,
    cancelled_at,
    created_at,
    updated_at
)
SELECT
    900 + ((a.accommodation_id - 501) * 3) + 3 AS reservation_id,
    CONCAT('GH-202604-', LPAD(((a.accommodation_id - 501) * 3) + 3, 4, '0')) AS reservation_no,
    CASE MOD(a.accommodation_id - 499, 6)
        WHEN 0 THEN 101
        WHEN 1 THEN 104
        WHEN 2 THEN 105
        WHEN 3 THEN 106
        WHEN 4 THEN 107
        ELSE 108
    END AS guest_user_id,
    a.accommodation_id,
    1000 + ((a.accommodation_id - 501) * 3) + 3 AS room_type_id,
    2000 + ((a.accommodation_id - 501) * 6) + 5 AS assigned_room_id,
    CASE
        WHEN a.slot_no IN (3, 6) THEN 4
        WHEN a.slot_no IN (2, 4) THEN 3
        ELSE 2
    END AS guest_count,
    '2026-04-21' AS check_in_date,
    '2026-04-23' AS check_out_date,
    'CONFIRMED' AS reservation_status,
    DATE_ADD('2026-04-03 14:00:00', INTERVAL ((a.accommodation_id - 501) * 12) MINUTE) AS requested_at,
    DATE_ADD('2026-04-03 14:20:00', INTERVAL ((a.accommodation_id - 501) * 12) MINUTE) AS confirmed_at,
    NULL AS cancelled_at,
    DATE_ADD('2026-04-03 14:00:00', INTERVAL ((a.accommodation_id - 501) * 12) MINUTE) AS created_at,
    DATE_ADD('2026-04-03 14:20:00', INTERVAL ((a.accommodation_id - 501) * 12) MINUTE) AS updated_at
FROM tmp_seed_accommodations a;

INSERT INTO reservations (
    reservation_id,
    reservation_no,
    guest_user_id,
    accommodation_id,
    room_type_id,
    guest_count,
    check_in_date,
    check_out_date,
    status,
    requested_at,
    confirmed_at,
    cancelled_at,
    created_at,
    updated_at
)
SELECT
    reservation_id,
    reservation_no,
    guest_user_id,
    accommodation_id,
    room_type_id,
    guest_count,
    check_in_date,
    check_out_date,
    reservation_status,
    requested_at,
    confirmed_at,
    cancelled_at,
    created_at,
    updated_at
FROM tmp_seed_reservations
ORDER BY reservation_id;

INSERT INTO reservation_nights (
    reservation_night_id,
    reservation_id,
    stay_date,
    assigned_room_id,
    created_at,
    updated_at
)
SELECT
    10000 + ((r.reservation_id - 901) * 2) + 1 AS reservation_night_id,
    r.reservation_id,
    r.check_in_date AS stay_date,
    r.assigned_room_id,
    r.created_at,
    r.updated_at
FROM tmp_seed_reservations r;

INSERT INTO reservation_nights (
    reservation_night_id,
    reservation_id,
    stay_date,
    assigned_room_id,
    created_at,
    updated_at
)
SELECT
    10000 + ((r.reservation_id - 901) * 2) + 2 AS reservation_night_id,
    r.reservation_id,
    DATE_ADD(r.check_in_date, INTERVAL 1 DAY) AS stay_date,
    r.assigned_room_id,
    r.created_at,
    r.updated_at
FROM tmp_seed_reservations r;

INSERT INTO reservation_status_history (
    history_id,
    reservation_id,
    from_status,
    to_status,
    action_type,
    changed_by_user_id,
    reason_type,
    reason_text,
    changed_at
)
SELECT
    11000 + ((r.reservation_id - 901) * 2) + 1 AS history_id,
    r.reservation_id,
    NULL,
    'PENDING',
    'REQUESTED',
    r.guest_user_id,
    'GUEST_REQUEST',
    CONCAT('Demo reservation requested for ', r.reservation_no),
    r.requested_at
FROM tmp_seed_reservations r;

INSERT INTO reservation_status_history (
    history_id,
    reservation_id,
    from_status,
    to_status,
    action_type,
    changed_by_user_id,
    reason_type,
    reason_text,
    changed_at
)
SELECT
    11000 + ((r.reservation_id - 901) * 2) + 2 AS history_id,
    r.reservation_id,
    'PENDING',
    'CONFIRMED',
    'HOST_CONFIRMED',
    102,
    'HOST_APPROVAL',
    CONCAT('Host approved demo reservation ', r.reservation_no),
    r.confirmed_at
FROM tmp_seed_reservations r
WHERE r.reservation_status = 'CONFIRMED';

INSERT INTO audit_logs (
    audit_log_id,
    actor_user_id,
    target_type,
    target_id,
    action_type,
    reason_type,
    reason_text,
    before_state_json,
    after_state_json,
    occurred_at
)
SELECT
    1500 + (r.reservation_id - 900) AS audit_log_id,
    102 AS actor_user_id,
    'RESERVATION' AS target_type,
    r.reservation_id AS target_id,
    'RESERVATION_CONFIRMED' AS action_type,
    'HOST_APPROVAL' AS reason_type,
    CONCAT('Host confirmed demo reservation ', r.reservation_no) AS reason_text,
    JSON_OBJECT('status', 'PENDING'),
    JSON_OBJECT('status', 'CONFIRMED'),
    r.confirmed_at AS occurred_at
FROM tmp_seed_reservations r
WHERE r.reservation_status = 'CONFIRMED';

INSERT INTO audit_logs (
    audit_log_id,
    actor_user_id,
    target_type,
    target_id,
    action_type,
    reason_type,
    reason_text,
    before_state_json,
    after_state_json,
    occurred_at
)
SELECT
    1700 + (b.block_id - 800) AS audit_log_id,
    102 AS actor_user_id,
    'ROOM_BLOCK' AS target_type,
    b.block_id AS target_id,
    'ROOM_BLOCK_CREATED' AS action_type,
    b.reason_type AS reason_type,
    b.reason_text AS reason_text,
    NULL AS before_state_json,
    JSON_OBJECT(
        'room_id', b.room_id,
        'status', b.block_status,
        'start_date', b.start_date,
        'end_date', b.end_date
    ) AS after_state_json,
    b.created_at AS occurred_at
FROM tmp_seed_blocks b;

INSERT INTO system_logs (
    system_log_id,
    log_level,
    source,
    message,
    context_json,
    occurred_at
) VALUES
    (
        1701,
        'INFO',
        'seed-v2',
        'guesthouse V2 expanded demo seed bootstrap completed',
        JSON_OBJECT(
            'region_count', 6,
            'accommodation_count', 36,
            'room_type_count', 108,
            'room_count', 216,
            'reservation_count', 108
        ),
        '2026-03-26 09:05:00.000000'
    );

DROP TEMPORARY TABLE IF EXISTS tmp_seed_reservations;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_blocks;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_rooms;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_room_slots;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_room_types;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_accommodations;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_slots;
DROP TEMPORARY TABLE IF EXISTS tmp_seed_regions;

COMMIT;

-- ---------------------------------------------------------------------------
-- Smoke queries
-- ---------------------------------------------------------------------------

-- 1. Region distribution check.
-- Expected result: 6 rows, each region count is 6.
SELECT
    region,
    COUNT(*) AS accommodation_count
FROM accommodations
GROUP BY region
ORDER BY region;

-- 2. Room-type and room expansion check.
-- Expected result:
--   - accommodation_count = 36
--   - room_type_count = 108
--   - room_count = 216
SELECT
    (SELECT COUNT(*) FROM accommodations WHERE host_user_id = 102) AS accommodation_count,
    (SELECT COUNT(*) FROM room_types) AS room_type_count,
    (SELECT COUNT(*) FROM rooms) AS room_count;

-- 3. Standard-room availability on 2026-04-16 for 서울.
-- Expected result: 4
-- Reason:
--   - 6 Seoul accommodations x 2 standard rooms = 12
--   - 6 standard rooms are occupied by CONFIRMED reservations
--   - 2 additional standard rooms are excluded by ACTIVE room blocks
SELECT COUNT(*) AS available_seoul_standard_rooms_on_2026_04_16
FROM rooms r
JOIN accommodations a
  ON a.accommodation_id = r.accommodation_id
WHERE a.region = '서울'
  AND r.room_type_id IN (
      SELECT rt.room_type_id
      FROM room_types rt
      WHERE rt.accommodation_id = a.accommodation_id
        AND rt.name = 'Standard Twin'
  )
  AND r.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM room_blocks rb
      WHERE rb.room_id = r.room_id
        AND rb.status = 'ACTIVE'
        AND '2026-04-16' BETWEEN rb.start_date AND rb.end_date
  )
  AND NOT EXISTS (
      SELECT 1
      FROM reservation_nights rn
      JOIN reservations rv
        ON rv.reservation_id = rn.reservation_id
      WHERE rn.assigned_room_id = r.room_id
        AND rn.stay_date = '2026-04-16'
        AND rv.status IN ('PENDING', 'CONFIRMED')
  );

-- 4. Reservation status distribution check.
-- Expected result:
--   - CONFIRMED = 72
--   - PENDING = 36
SELECT
    status,
    COUNT(*) AS reservation_count
FROM reservations
GROUP BY status
ORDER BY status;

-- 5. Per-accommodation room-type diversity check.
-- Expected result: every accommodation has 3 room types and 6 rooms.
SELECT
    rt.accommodation_id,
    COUNT(DISTINCT rt.room_type_id) AS room_type_count,
    COUNT(r.room_id) AS room_count
FROM room_types rt
JOIN rooms r
  ON r.accommodation_id = rt.accommodation_id
 AND r.room_type_id = rt.room_type_id
GROUP BY rt.accommodation_id
ORDER BY rt.accommodation_id
LIMIT 6;
