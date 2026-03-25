-- Guesthouse V1 seed data
-- Traceability:
--   REQ-F-001 ~ REQ-F-035
--   REQ-F-050 ~ REQ-F-127
--   REQ-NF-003 ~ REQ-NF-007
--   REQ-SEC-001 ~ REQ-SEC-008
--   BR-001 ~ BR-008
--   REQ-OTH-001 ~ REQ-OTH-005
--
-- Usage:
--   1. Apply db/schema-v1.sql to an empty MySQL 8.4 schema first.
--   2. Apply this seed file to the same schema.
--   3. Run the smoke queries at the bottom to validate local behavior.
--
-- Seed shape from DEV_ENV_CONVENTIONS.md:
--   - guest 1
--   - host 1
--   - accommodation 1
--   - room types 2
--   - rooms 3
--   - sample pricing, block, reservations, and status history
--
-- Local demo credentials for browser/API smoke tests:
--   - guest.demo / guestpass123!
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
    (
        101,
        'guest.demo',
        '$2a$10$us7TpIm6HMYK.1.6YmrFGe7S8eS17X8hzdbe5zl6yc8ruMNM8ifpG',
        '김게스트',
        'guest.demo@example.com',
        '010-1000-0001',
        'GUEST',
        'ACTIVE',
        '2026-03-20 09:00:00.000000',
        '2026-03-20 09:00:00.000000'
    ),
    (
        102,
        'host.demo',
        '$2a$10$XltkzpF29lx.QX3MN/ISG.IENn8seKfB8Udy9CxbS7/XTRg1ad/Ou',
        '박호스트',
        'host.demo@example.com',
        '010-1000-0002',
        'HOST',
        'ACTIVE',
        '2026-03-20 09:05:00.000000',
        '2026-03-20 09:05:00.000000'
    ),
    (
        103,
        'admin.demo',
        '$2a$10$qw.DTWXQPSx2CRjjreuL8e6ow7.G0Lu7wXVCVbsG8gScv933ChSly',
        '최관리자',
        'admin.demo@example.com',
        '010-1000-0003',
        'ADMIN',
        'ACTIVE',
        '2026-03-20 09:10:00.000000',
        '2026-03-20 09:10:00.000000'
    );

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
    (103, 0, NULL, NULL, '2026-03-23 08:30:00.000000', '2026-03-20 09:10:00.000000');

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
        '운영 중인 게스트하우스 객실과 예약을 직접 관리하기 위한 호스트 권한 요청',
        'APPROVED',
        103,
        '2026-03-20 13:00:00.000000',
        '사업자 정보와 운영 목적 확인 완료',
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
        'seed-reset-token-hash-guest-101',
        '2026-03-21 10:30:00.000000',
        '2026-03-21 09:45:00.000000',
        'CONSUMED',
        1,
        '2026-03-21 09:30:00.000000'
    );

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
) VALUES
    (
        501,
        102,
        '한강 브리즈 게스트하우스',
        '서울특별시 마포구 와우산로 15',
        'SEOUL',
        '홍대 인근 도보 접근이 가능한 소규모 도심형 게스트하우스',
        '15:00:00',
        '11:00:00',
        'ACTIVE',
        '2026-03-20 14:00:00.000000',
        '2026-03-20 14:00:00.000000'
    );

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
) VALUES
    (
        1001,
        501,
        '스탠다드 더블',
        2,
        2,
        80000.00,
        'ACTIVE',
        '2026-03-20 14:10:00.000000',
        '2026-03-20 14:10:00.000000'
    ),
    (
        1002,
        501,
        '디럭스 트윈',
        2,
        3,
        120000.00,
        'ACTIVE',
        '2026-03-20 14:15:00.000000',
        '2026-03-20 14:15:00.000000'
    );

INSERT INTO rooms (
    room_id,
    accommodation_id,
    room_type_id,
    room_code,
    status,
    memo,
    created_at,
    updated_at
) VALUES
    (
        2001,
        501,
        1001,
        'S101',
        'ACTIVE',
        '스탠다드 더블 1호실',
        '2026-03-20 14:20:00.000000',
        '2026-03-20 14:20:00.000000'
    ),
    (
        2002,
        501,
        1001,
        'S102',
        'ACTIVE',
        '스탠다드 더블 2호실',
        '2026-03-20 14:21:00.000000',
        '2026-03-20 14:21:00.000000'
    ),
    (
        2003,
        501,
        1002,
        'D201',
        'ACTIVE',
        '디럭스 트윈 대표 객실',
        '2026-03-20 14:22:00.000000',
        '2026-03-20 14:22:00.000000'
    );

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
) VALUES
    (
        701,
        501,
        1001,
        '봄 성수기 가산',
        '2026-04-01',
        '2026-04-30',
        10000.00,
        NULL,
        'ACTIVE',
        '2026-03-21 09:00:00.000000',
        '2026-03-21 09:00:00.000000'
    ),
    (
        702,
        501,
        1001,
        '중순 프로모션 할인',
        '2026-04-10',
        '2026-04-15',
        -5000.00,
        NULL,
        'ACTIVE',
        '2026-03-21 09:05:00.000000',
        '2026-03-21 09:05:00.000000'
    ),
    (
        703,
        501,
        1001,
        '비활성 시험 정책',
        '2026-04-12',
        '2026-04-12',
        25000.00,
        NULL,
        'INACTIVE',
        '2026-03-21 09:10:00.000000',
        '2026-03-21 09:10:00.000000'
    ),
    (
        704,
        501,
        1002,
        '디럭스 주말 가산',
        '2026-04-01',
        '2026-04-30',
        15000.00,
        NULL,
        'ACTIVE',
        '2026-03-21 09:15:00.000000',
        '2026-03-21 09:15:00.000000'
    );

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
) VALUES
    (
        801,
        2002,
        '2026-04-12',
        '2026-04-13',
        'MAINTENANCE',
        '욕실 환기 설비 점검',
        'ACTIVE',
        102,
        '2026-03-22 09:00:00.000000',
        '2026-03-22 09:00:00.000000'
    );

INSERT INTO reservations (
    reservation_id,
    reservation_no,
    guest_user_id,
    accommodation_id,
    room_type_id,
    check_in_date,
    check_out_date,
    status,
    requested_at,
    confirmed_at,
    cancelled_at,
    created_at,
    updated_at
) VALUES
    (
        901,
        'GH-202604-0001',
        101,
        501,
        1001,
        '2026-04-12',
        '2026-04-14',
        'CONFIRMED',
        '2026-04-01 10:00:00.000000',
        '2026-04-01 10:15:00.000000',
        NULL,
        '2026-04-01 10:00:00.000000',
        '2026-04-01 10:15:00.000000'
    ),
    (
        902,
        'GH-202604-0002',
        101,
        501,
        1001,
        '2026-04-14',
        '2026-04-16',
        'PENDING',
        '2026-04-02 11:00:00.000000',
        NULL,
        NULL,
        '2026-04-02 11:00:00.000000',
        '2026-04-02 11:00:00.000000'
    );

INSERT INTO reservation_nights (
    reservation_night_id,
    reservation_id,
    stay_date,
    assigned_room_id,
    created_at,
    updated_at
) VALUES
    (10001, 901, '2026-04-12', 2001, '2026-04-01 10:00:00.000000', '2026-04-01 10:15:00.000000'),
    (10002, 901, '2026-04-13', 2001, '2026-04-01 10:00:00.000000', '2026-04-01 10:15:00.000000'),
    (10003, 902, '2026-04-14', 2002, '2026-04-02 11:00:00.000000', '2026-04-02 11:00:00.000000'),
    (10004, 902, '2026-04-15', 2002, '2026-04-02 11:00:00.000000', '2026-04-02 11:00:00.000000');

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
) VALUES
    (
        11001,
        901,
        NULL,
        'PENDING',
        'REQUESTED',
        101,
        'GUEST_REQUEST',
        '게스트가 스탠다드 더블 객실 타입으로 예약 요청',
        '2026-04-01 10:00:00.000000'
    ),
    (
        11002,
        901,
        'PENDING',
        'CONFIRMED',
        'HOST_CONFIRMED',
        102,
        'HOST_APPROVAL',
        '재고와 운영 상태를 확인하고 예약 확정',
        '2026-04-01 10:15:00.000000'
    ),
    (
        11003,
        902,
        NULL,
        'PENDING',
        'REQUESTED',
        101,
        'GUEST_REQUEST',
        '게스트가 검토 대기 상태 예약을 생성',
        '2026-04-02 11:00:00.000000'
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
        '2026년 4월 시설 점검 안내',
        '2026년 4월 12일부터 13일까지 일부 스탠다드 객실의 욕실 환기 설비 점검이 진행됩니다.',
        'PUBLISHED',
        TRUE,
        '2026-03-22 10:00:00.000000',
        103,
        '2026-03-22 09:50:00.000000',
        '2026-03-22 10:00:00.000000'
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
    (
        1301,
        'SERVICE',
        '서비스 이용약관',
        '게스트하우스 예약 서비스 이용약관 v1.0',
        '1.0',
        TRUE,
        'PUBLISHED',
        '2026-03-01 00:00:00.000000',
        '2026-03-01 00:00:00.000000',
        '2026-03-01 00:00:00.000000'
    ),
    (
        1302,
        'PRIVACY',
        '개인정보 처리방침',
        '게스트하우스 개인정보 처리방침 v1.0',
        '1.0',
        TRUE,
        'PUBLISHED',
        '2026-03-01 00:00:00.000000',
        '2026-03-01 00:00:00.000000',
        '2026-03-01 00:00:00.000000'
    );

INSERT INTO user_term_agreements (
    agreement_id,
    user_id,
    term_id,
    agreed_at,
    term_version_snapshot
) VALUES
    (1401, 101, 1301, '2026-03-20 09:00:00.000000', '1.0'),
    (1402, 101, 1302, '2026-03-20 09:00:00.000000', '1.0'),
    (1403, 102, 1301, '2026-03-20 09:05:00.000000', '1.0'),
    (1404, 102, 1302, '2026-03-20 09:05:00.000000', '1.0');

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
) VALUES
    (
        1501,
        102,
        'RESERVATION',
        901,
        'RESERVATION_CONFIRMED',
        'HOST_APPROVAL',
        '운영 가능 객실 확인 후 예약 확정',
        '{"status":"PENDING"}',
        '{"status":"CONFIRMED"}',
        '2026-04-01 10:15:00.000000'
    ),
    (
        1502,
        102,
        'ROOM_BLOCK',
        801,
        'ROOM_BLOCK_CREATED',
        'MAINTENANCE',
        '욕실 환기 설비 점검을 위한 객실 block 생성',
        NULL,
        '{"room_id":2002,"status":"ACTIVE","start_date":"2026-04-12","end_date":"2026-04-13"}',
        '2026-03-22 09:00:00.000000'
    );

INSERT INTO system_logs (
    system_log_id,
    log_level,
    source,
    message,
    context_json,
    occurred_at
) VALUES
    (
        1601,
        'INFO',
        'seed-v1',
        'guesthouse V1 local seed bootstrap completed',
        '{"accommodation_id":501,"reservation_ids":[901,902]}',
        '2026-03-24 09:00:00.000000'
    );

COMMIT;

-- ---------------------------------------------------------------------------
-- Smoke queries
-- ---------------------------------------------------------------------------

-- 1. Availability check for the standard room type on 2026-04-12.
-- Expected result: 0
-- Reason:
--   - room 2001 is occupied by CONFIRMED reservation 901
--   - room 2002 is excluded by ACTIVE block 801
SELECT COUNT(*) AS available_standard_rooms_on_2026_04_12
FROM rooms r
WHERE r.room_type_id = 1001
  AND r.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM room_blocks rb
      WHERE rb.room_id = r.room_id
        AND rb.status = 'ACTIVE'
        AND '2026-04-12' BETWEEN rb.start_date AND rb.end_date
  )
  AND NOT EXISTS (
      SELECT 1
      FROM reservation_nights rn
      JOIN reservations rv
        ON rv.reservation_id = rn.reservation_id
      WHERE rn.assigned_room_id = r.room_id
        AND rn.stay_date = '2026-04-12'
        AND rv.status IN ('PENDING', 'CONFIRMED')
  );

-- 2. Availability check showing that PENDING also consumes inventory on 2026-04-14.
-- Expected result: 1
SELECT COUNT(*) AS available_standard_rooms_on_2026_04_14
FROM rooms r
WHERE r.room_type_id = 1001
  AND r.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM room_blocks rb
      WHERE rb.room_id = r.room_id
        AND rb.status = 'ACTIVE'
        AND '2026-04-14' BETWEEN rb.start_date AND rb.end_date
  )
  AND NOT EXISTS (
      SELECT 1
      FROM reservation_nights rn
      JOIN reservations rv
        ON rv.reservation_id = rn.reservation_id
      WHERE rn.assigned_room_id = r.room_id
        AND rn.stay_date = '2026-04-14'
        AND rv.status IN ('PENDING', 'CONFIRMED')
  );

-- 3. Reservation status history check.
-- Expected result:
--   - reservation 901 shows REQUESTED then HOST_CONFIRMED
--   - reservation 902 shows only REQUESTED and remains PENDING
SELECT
    rv.reservation_no,
    rsh.from_status,
    rsh.to_status,
    rsh.action_type,
    u.login_id AS changed_by_login_id,
    rsh.reason_type,
    rsh.changed_at
FROM reservation_status_history rsh
JOIN reservations rv
  ON rv.reservation_id = rsh.reservation_id
JOIN users u
  ON u.user_id = rsh.changed_by_user_id
ORDER BY rv.reservation_no, rsh.changed_at;

-- 4. Pricing check for additive delta behavior.
-- Expected result for 2026-04-12 standard room type:
--   base_price = 80000
--   active_delta_sum = 5000
--   final_price = 85000
-- Inactive policy 703 must be excluded.
SELECT
    rt.room_type_id,
    rt.name,
    rt.base_price,
    COALESCE(SUM(pp.delta_amount), 0) AS active_delta_sum,
    rt.base_price + COALESCE(SUM(pp.delta_amount), 0) AS final_price
FROM room_types rt
LEFT JOIN price_policies pp
  ON pp.room_type_id = rt.room_type_id
 AND pp.accommodation_id = rt.accommodation_id
 AND pp.status = 'ACTIVE'
 AND '2026-04-12' BETWEEN pp.start_date AND pp.end_date
WHERE rt.room_type_id = 1001
GROUP BY rt.room_type_id, rt.name, rt.base_price;

-- 5. Block inspection check.
-- Expected result: block 801 on room S102 from 2026-04-12 to 2026-04-13.
SELECT
    rb.block_id,
    r.room_code,
    rb.reason_type,
    rb.status,
    rb.start_date,
    rb.end_date
FROM room_blocks rb
JOIN rooms r
  ON r.room_id = rb.room_id
ORDER BY rb.block_id;
