# SCHEMA_RECONCILIATION

이 문서는 `docs/source/SRS.pdf`와 현재 baseline decision을 기준으로 V1 target schema outline을 정의한다.  
목표는 이 문서만으로도 후속 `db/schema-draft.sql` 재작성 또는 신규 target SQL 작성이 가능하도록 core domain behavior를 고정하는 것이다.

`db/schema-draft.sql`은 reconciliation input일 뿐 source of truth가 아니다.

## 1. Domain Grouping

### Identity / Auth
- `users`
- `user_login_security`
- `host_role_requests`
- `password_recovery_verifications`
- Redis-backed session store

### Guest Reservation
- `reservations`
- `reservation_nights`
- `reservation_status_history`

### Host Operations
- guest reservation write model 재사용
- `price_policies`
- `room_blocks`
- `audit_logs`

### Accommodation / Room / Room Type
- `accommodations`
- `room_types`
- `rooms`

### Pricing
- `price_policies`

### Block Management
- `room_blocks`

### Notice / Terms
- `notices`
- `notice_attachments`
- `terms`
- `user_term_agreements`

### Audit / System Log
- `audit_logs`
- `system_logs` or external logging baseline

## 2. Explicit Normalization Decisions

- Reservation header status naming은 `PENDING`, `CONFIRMED`, `CANCELLED`를 사용한다.
- `APPROVED`는 사용하지 않는다. host approval 결과는 `CONFIRMED`로 정규화한다.
- host rejection은 별도 terminal status `REJECTED`를 두지 않는다.
- current baseline:
  reservation header의 terminal status는 `CANCELLED` 하나로 통일한다.
- 구분 방식:
  guest cancel, host reject, host cancel, admin cancel 차이는 `reservation_status_history.action` 또는 `reason_type`으로 구분한다.
- 이 결정은 상태 집합을 단순화하지만, 통계/리포팅에서 rejection을 별도 합계로 보여주려면 history 기반 집계가 필요하다.

## 3. Reservation / Inventory Model

- 예약 접수 단위는 `room_type`이다.
- inventory consumption 상태는 `PENDING`와 `CONFIRMED`다.
- inventory release 상태는 `CANCELLED`다.
- `reservation_nights`가 nightly occupancy와 실제 room assignment의 기준 단위다.
- V1 baseline에서는 예약 생성 시 `reservation_nights.assigned_room_id`를 즉시 채운다.
- 초기 배정 규칙은 deterministic first-fit이다.
- host/admin은 이후 `reservation_nights` row 단위로 재배정할 수 있다.
- guest는 실제 `assigned_room_id` 또는 room number를 기본적으로 볼 수 없다.
- host approval의 결과:
  `PENDING -> CONFIRMED`, inventory는 계속 유지된다.
- host rejection의 결과:
  `PENDING -> CANCELLED`, inventory가 release된다.
- guest cancel의 결과:
  `PENDING` 또는 `CONFIRMED -> CANCELLED`, inventory가 release된다.
- short-lived hold 테이블은 두지 않는다.
- availability 계산은 room type별 active room 집합에서
  active room block과 occupied `reservation_night`를 제외하는 방식으로 맞춘다.

## 4. Pricing Model

- pricing baseline은 `base_price + sum(applicable active deltas)`다.
- overlapping pricing policy는 허용한다.
- 같은 target/date에 여러 policy가 적용되면 additive delta를 합산한다.
- V1 target representation은 signed delta amount다.
- current draft의 `PERCENT`는 baseline과 충돌하므로 V1 target schema에서 제거하거나 미지원으로 고정한다.
- validation implication:
  overlap 자체를 금지하지 않는다.
- 대신 검증해야 할 것:
  target consistency, date range validity, active status, day-of-week applicability, delta numeric bounds
- read-order implication:
  계산 결과는 순서 독립적이어야 한다.
- 운영 조회와 디버깅을 위해 `start_date`, `end_date`, `policy_id` 기준의 stable ordering을 사용한다.

## 5. Block Model

- V1 block scope는 room-level only다.
- block의 실효 대상은 `room_id`다.
- `room_type_id`는 block row의 필수 컬럼이 아니다.
- accommodation / room type 정보가 필요하면 `rooms -> room_types -> accommodations` join으로 유도한다.
- availability 계산에서 active `room_blocks`는 해당 room을 해당 기간 동안 제외한다.
- `reservation_nights.assigned_room_id`는 active block과 충돌하면 안 된다.
- host 재배정도 block 충돌 검사를 통과해야 한다.

## 6. Target Tables For V1

### 6.1 `users`
- Purpose: 게스트 / 호스트 / 관리자 계정의 기본 식별 정보와 역할을 저장한다.
- Key columns: `user_id`, `login_id`, `password_hash`, `name`, `email`, `phone`, `role`, `status`, `created_at`, `updated_at`
- PK: `user_id`
- FK: 없음
- Unique constraints:
  `login_id` unique
- Important indexes:
  `idx_users_role_status (role, status)`
  `idx_users_email (email)`
  `idx_users_phone (phone)`
- Status fields / enum candidates:
  `role`: `GUEST`, `HOST`, `ADMIN`
  `status`: `ACTIVE`, `INACTIVE`, `SUSPENDED`

### 6.2 `user_login_security`
- Purpose: 로그인 실패 횟수, 잠금 상태, 마지막 로그인/비밀번호 변경 시각을 저장한다.
- Key columns: `user_id`, `failed_login_count`, `last_failed_at`, `locked_until`, `last_login_at`, `password_changed_at`
- PK: `user_id`
- FK:
  `user_id -> users.user_id`
- Unique constraints:
  `user_id` PK only
- Important indexes:
  `idx_user_login_security_locked_until (locked_until)`
- Status fields / enum candidates:
  별도 status enum 없음

### 6.3 `host_role_requests`
- Purpose: 게스트의 host 권한 요청과 관리자 승인/거절 결과를 저장한다.
- Key columns: `request_id`, `user_id`, `request_reason`, `status`, `reviewed_by`, `reviewed_at`, `review_reason`, `created_at`
- PK: `request_id`
- FK:
  `user_id -> users.user_id`
  `reviewed_by -> users.user_id`
- Unique constraints:
  필요 시 active pending request를 1건으로 제한하는 unique rule
- Important indexes:
  `idx_host_role_requests_user_status (user_id, status)`
  `idx_host_role_requests_status_created_at (status, created_at)`
- Status fields / enum candidates:
  `status`: `PENDING`, `APPROVED`, `DENIED`

### 6.4 `password_recovery_verifications`
- Purpose: 아이디 찾기 / 비밀번호 재설정 인증 코드 또는 토큰을 저장한다.
- Key columns: `verification_id`, `user_id`, `verification_type`, `channel`, `token_hash`, `expires_at`, `consumed_at`, `status`, `attempt_count`, `created_at`
- PK: `verification_id`
- FK:
  `user_id -> users.user_id`
- Unique constraints:
  없음
- Important indexes:
  `idx_password_recovery_user_status (user_id, status)`
  `idx_password_recovery_expires_at (expires_at)`
  `idx_password_recovery_token_hash (token_hash)`
- Status fields / enum candidates:
  `verification_type`: `FIND_ID`, `RESET_PASSWORD`
  `channel`: `EMAIL`, `SMS`
  `status`: `PENDING`, `VERIFIED`, `EXPIRED`, `CONSUMED`

### 6.5 `accommodations`
- Purpose: 숙소 기본 정보와 host ownership을 저장한다.
- Key columns: `accommodation_id`, `host_user_id`, `name`, `address`, `region`, `info_text`, `check_in_time`, `check_out_time`, `status`, `created_at`, `updated_at`
- PK: `accommodation_id`
- FK:
  `host_user_id -> users.user_id`
- Unique constraints:
  없음
- Important indexes:
  `idx_accommodations_host_status (host_user_id, status)`
  `idx_accommodations_region_status (region, status)`
- Status fields / enum candidates:
  `status`: `ACTIVE`, `INACTIVE`

### 6.6 `room_types`
- Purpose: 예약 접수 단위인 객실 타입과 정원/기본가를 저장한다.
- Key columns: `room_type_id`, `accommodation_id`, `name`, `base_capacity`, `max_capacity`, `base_price`, `status`, `created_at`, `updated_at`
- PK: `room_type_id`
- FK:
  `accommodation_id -> accommodations.accommodation_id`
- Unique constraints:
  `uk_room_types_accommodation_name (accommodation_id, name)`
- Important indexes:
  `idx_room_types_accommodation_status (accommodation_id, status)`
- Status fields / enum candidates:
  `status`: `ACTIVE`, `INACTIVE`

### 6.7 `rooms`
- Purpose: 실제 운영 배정 단위인 개별 room을 저장한다.
- Key columns: `room_id`, `accommodation_id`, `room_type_id`, `room_code`, `status`, `memo`, `created_at`, `updated_at`
- PK: `room_id`
- FK:
  `accommodation_id -> accommodations.accommodation_id`
  `room_type_id -> room_types.room_type_id`
- Unique constraints:
  `uk_rooms_accommodation_room_code (accommodation_id, room_code)`
- Important indexes:
  `idx_rooms_room_type_status (room_type_id, status)`
  `idx_rooms_accommodation_status (accommodation_id, status)`
- Status fields / enum candidates:
  `status`: `ACTIVE`, `INACTIVE`, `MAINTENANCE`

### 6.8 `reservations`
- Purpose: 예약 header와 guest-facing 예약 식별 정보를 저장한다.
- Key columns: `reservation_id`, `reservation_no`, `guest_user_id`, `accommodation_id`, `room_type_id`, `check_in_date`, `check_out_date`, `status`, `requested_at`, `confirmed_at`, `cancelled_at`, `created_at`, `updated_at`
- PK: `reservation_id`
- FK:
  `guest_user_id -> users.user_id`
  `accommodation_id -> accommodations.accommodation_id`
  `room_type_id -> room_types.room_type_id`
- Unique constraints:
  `reservation_no` unique
- Important indexes:
  `idx_reservations_guest_status_requested_at (guest_user_id, status, requested_at)`
  `idx_reservations_accommodation_room_type_status (accommodation_id, room_type_id, status)`
  `idx_reservations_date_range (check_in_date, check_out_date)`
- Status fields / enum candidates:
  `status`: `PENDING`, `CONFIRMED`, `CANCELLED`

### 6.9 `reservation_nights`
- Purpose: nightly occupancy와 실제 room assignment를 저장하는 핵심 inventory 테이블이다.
- Key columns: `reservation_night_id`, `reservation_id`, `stay_date`, `assigned_room_id`, `created_at`, `updated_at`
- PK: `reservation_night_id`
- FK:
  `reservation_id -> reservations.reservation_id`
  `assigned_room_id -> rooms.room_id`
- Unique constraints:
  `uk_reservation_nights_reservation_stay_date (reservation_id, stay_date)`
- Important indexes:
  `idx_reservation_nights_assigned_room_stay_date (assigned_room_id, stay_date)`
  `idx_reservation_nights_stay_date (stay_date)`
- Status fields / enum candidates:
  별도 status enum 없음
- Baseline nullability:
  `assigned_room_id`는 V1 baseline에서 `NOT NULL`

### 6.10 `reservation_status_history`
- Purpose: 예약 상태 전이와 actor/reason을 감사 가능하게 추적한다.
- Key columns: `history_id`, `reservation_id`, `from_status`, `to_status`, `action_type`, `changed_by_user_id`, `reason_type`, `reason_text`, `changed_at`
- PK: `history_id`
- FK:
  `reservation_id -> reservations.reservation_id`
  `changed_by_user_id -> users.user_id`
- Unique constraints:
  없음
- Important indexes:
  `idx_reservation_status_history_reservation_changed_at (reservation_id, changed_at)`
  `idx_reservation_status_history_action_type (action_type, changed_at)`
- Status fields / enum candidates:
  `from_status`, `to_status`: `PENDING`, `CONFIRMED`, `CANCELLED`
  `action_type`: `REQUESTED`, `HOST_CONFIRMED`, `HOST_REJECTED`, `GUEST_CANCELLED`, `HOST_CANCELLED`, `ADMIN_CANCELLED`
  `reason_type`: implementation-defined controlled enum

### 6.11 `price_policies`
- Purpose: room type 대상 기간별 delta pricing rule을 저장한다.
- Key columns: `policy_id`, `accommodation_id`, `room_type_id`, `policy_name`, `start_date`, `end_date`, `delta_amount`, `day_of_week_mask`, `status`, `created_at`, `updated_at`
- PK: `policy_id`
- FK:
  `accommodation_id -> accommodations.accommodation_id`
  `room_type_id -> room_types.room_type_id`
- Unique constraints:
  없음
- Important indexes:
  `idx_price_policies_target_date_status (room_type_id, start_date, end_date, status)`
  `idx_price_policies_accommodation_status (accommodation_id, status)`
- Status fields / enum candidates:
  `status`: `ACTIVE`, `INACTIVE`
- Baseline representation:
  `delta_amount`는 signed amount
- Baseline exclusion:
  `price_type = PERCENT` 미지원

### 6.12 `room_blocks`
- Purpose: room-level 운영 block을 저장한다.
- Key columns: `block_id`, `room_id`, `start_date`, `end_date`, `reason_type`, `reason_text`, `status`, `created_by_user_id`, `created_at`, `updated_at`
- PK: `block_id`
- FK:
  `room_id -> rooms.room_id`
  `created_by_user_id -> users.user_id`
- Unique constraints:
  없음
- Important indexes:
  `idx_room_blocks_room_date_status (room_id, start_date, end_date, status)`
  `idx_room_blocks_status_date (status, start_date, end_date)`
- Status fields / enum candidates:
  `status`: `ACTIVE`, `INACTIVE`
  `reason_type`: `MAINTENANCE`, `HOST_BLOCK`, `ADMIN_BLOCK`, `OTHER`

### 6.13 `notices`
- Purpose: 관리자 공지 본문을 저장한다.
- Key columns: `notice_id`, `title`, `content`, `status`, `is_pinned`, `published_at`, `created_by_user_id`, `created_at`, `updated_at`
- PK: `notice_id`
- FK:
  `created_by_user_id -> users.user_id`
- Unique constraints:
  없음
- Important indexes:
  `idx_notices_status_published_at (status, published_at)`
  `idx_notices_is_pinned_status (is_pinned, status)`
- Status fields / enum candidates:
  `status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`

### 6.14 `notice_attachments`
- Purpose: notice에 연결된 파일 메타데이터를 저장한다.
- Key columns: `attachment_id`, `notice_id`, `origin_filename`, `stored_filename`, `storage_path`, `file_ext`, `file_size`, `mime_type`, `checksum`, `created_at`
- PK: `attachment_id`
- FK:
  `notice_id -> notices.notice_id`
- Unique constraints:
  필요 시 `checksum` + `notice_id`
- Important indexes:
  `idx_notice_attachments_notice_id (notice_id)`
- Status fields / enum candidates:
  별도 status enum 없음

### 6.15 `terms`
- Purpose: 약관 마스터와 버전을 저장한다.
- Key columns: `term_id`, `category`, `title`, `content`, `version`, `is_required`, `status`, `effective_at`, `created_at`, `updated_at`
- PK: `term_id`
- FK:
  없음
- Unique constraints:
  `uk_terms_category_version (category, version)`
- Important indexes:
  `idx_terms_category_status_effective_at (category, status, effective_at)`
- Status fields / enum candidates:
  `category`: `SERVICE`, `PRIVACY`, `MARKETING`
  `status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`

### 6.16 `user_term_agreements`
- Purpose: 사용자별 약관 동의 이력을 버전 단위로 저장한다.
- Key columns: `agreement_id`, `user_id`, `term_id`, `agreed_at`, `term_version_snapshot`
- PK: `agreement_id`
- FK:
  `user_id -> users.user_id`
  `term_id -> terms.term_id`
- Unique constraints:
  `uk_user_term_agreements_user_term (user_id, term_id)`
- Important indexes:
  `idx_user_term_agreements_user_id (user_id)`
- Status fields / enum candidates:
  별도 status enum 없음

### 6.17 `audit_logs`
- Purpose: 주요 행위의 actor/target/reason/before-after를 저장한다.
- Key columns: `audit_log_id`, `actor_user_id`, `target_type`, `target_id`, `action_type`, `reason_type`, `reason_text`, `before_state_json`, `after_state_json`, `occurred_at`
- PK: `audit_log_id`
- FK:
  `actor_user_id -> users.user_id`
- Unique constraints:
  없음
- Important indexes:
  `idx_audit_logs_target (target_type, target_id, occurred_at)`
  `idx_audit_logs_actor_occurred_at (actor_user_id, occurred_at)`
  `idx_audit_logs_action_type_occurred_at (action_type, occurred_at)`
- Status fields / enum candidates:
  `target_type`: implementation-defined controlled enum
  `action_type`: implementation-defined controlled enum

### 6.18 `system_logs` or external logging baseline
- Purpose: 시스템 운영 로그 조회 요구를 지원한다.
- Key columns: DB 테이블을 둘 경우 `system_log_id`, `log_level`, `source`, `message`, `context_json`, `occurred_at`
- PK: `system_log_id`
- FK:
  없음
- Unique constraints:
  없음
- Important indexes:
  `idx_system_logs_level_occurred_at (log_level, occurred_at)`
  `idx_system_logs_source_occurred_at (source, occurred_at)`
- Status fields / enum candidates:
  `log_level`: `INFO`, `WARN`, `ERROR`
- Baseline note:
  centralized logging stack를 도입하면 DB table 대신 observability platform을 source of truth로 둘 수 있다.

## 7. Availability Calculation Notes

- room type availability는 직접 카운트 컬럼으로 고정하지 않는다.
- nightly availability 계산 기준:
  active room
  minus active `room_blocks`
  minus `reservation_nights` joined with `reservations.status IN ('PENDING', 'CONFIRMED')`
- `reservation_nights.assigned_room_id`는 active room이어야 한다.
- `reservation_nights.assigned_room_id`는 active block 기간과 겹치면 안 된다.
- host 재배정 시에도 동일 검사를 수행한다.
- 검색/상세 조회 단계는 read-only 계산이며 inventory를 점유하지 않는다.
- 예약 생성 시점에만 transaction + lock + nightly assignment를 수행한다.

## 8. Current Draft To Target Mapping

| Current draft object | Target action |
|---|---|
| `USERS` | 유지하되 `termsAgreed` 제거 또는 deprecated 처리, security/supporting table 분리 |
| `AUTH_REQUEST` | `host_role_requests`로 재정의, reason/review columns 추가 |
| `ACCOMMODATIONS` | 유지하되 `host_id`를 `host_user_id`로 정규화 검토 |
| `ROOM_TYPES` | surrogate PK 중심으로 유지 |
| `ROOM` | `rooms`로 정리, composite PK 제거 |
| `RESERVATIONS` | `room_id` 제거, status naming 정규화 |
| `RESERVATION_NIGHTS` | `assigned_room_id` 추가, nightly uniqueness/index 강화 |
| `PRICE_POLICIES` | `PERCENT` 제거, additive delta model로 재정의 |
| `BLOCKS` | `room_blocks`로 재정의, room-level only |
| `AUDIT_LOGS` | before/after 및 target metadata 확장 |
| `NOTIFICATION` | `notices`로 정리, user notification과 분리 |
| `ATTACHMENT` | `notice_attachments`로 정리 |
| `TERM` | `terms`로 정리 |
| 없음 | `user_login_security` 추가 |
| 없음 | `password_recovery_verifications` 추가 |
| 없음 | `reservation_status_history` 추가 |
| 없음 | `user_term_agreements` 추가 |
| 없음 | `system_logs` 또는 external logging baseline 추가 |

## 9. SRS Match And Remaining Ambiguities

- `PENDING` inventory consumption은 SRS와 일치한다.
- `PENDING` aging policy 또는 host decision SLA는 SRS 미명시다.
- first-fit 초기 배정은 deterministic V1 baseline이며 SRS 직접 규정은 아니다.
- additive delta pricing은 V1 baseline 해석이다.
- room-level only block도 V1 baseline 해석이다.
- host rejection을 header status `CANCELLED`로 통일하는 것은 상태 집합 단순화 목적의 baseline이며, 별도 `REJECTED` status는 현재 도입하지 않는다.

## 10. SQL Rewrite Checklist

### What must change from `db/schema-draft.sql`
- `RESERVATIONS.room_id` 제거
- `RESERVATIONS.status`의 `APPROVED`를 `CONFIRMED`로 변경
- `RESERVATION_NIGHTS`에 `assigned_room_id` 추가
- `BLOCKS`를 room-level only 모델로 단순화
- `PRICE_POLICIES.price_type`의 `PERCENT` 제거
- composite PK / partial FK 구조 제거
- audit log 확장
- auth request 구조 확장

### What can be dropped
- short-lived hold/TTL 가정을 전제한 설계
- `users.termsAgreed` 단일 플래그
- notice와 notification 혼합 naming
- `ROOM` / `ROOM_TYPES` composite PK 방식

### What must be added
- `user_login_security`
- `password_recovery_verifications`
- `reservation_status_history`
- `user_term_agreements`
- nightly assignment 인덱스와 uniqueness
- host decision metadata
- room-level block 인덱스

### What requires special care in MySQL
- enum set과 status naming을 SQL 작성 전 먼저 고정할 것
- signed delta amount 타입을 `DECIMAL`로 정의할 것
- date range overlap 쿼리와 nightly availability 쿼리에 필요한 index 순서를 신중히 설계할 것
- `reservation_nights.assigned_room_id` 충돌 검사는 transaction + lock 전략과 함께 검증할 것
- foreign key naming과 nullable 정책을 단순하게 유지할 것
- JSON before/after 저장 시 MySQL version compatibility를 확인할 것

## 11. Readiness Check

- identity/auth, reservation, host ops, accommodation, pricing, block, notice/terms, audit/system log의 주요 V1 요구사항은 모두 최소 1개 이상의 target table 또는 supporting structure에 반영됐다.
- 이 문서는 fresh target SQL file을 쓰기 위한 baseline table set, status naming, FK 방향, uniqueness, index intent를 포함한다.
- 실제 SQL rewrite 단계에서는 이 문서를 기준으로 DDL을 새로 쓰고, `db/schema-draft.sql`은 참고 비교 대상으로만 사용한다.
