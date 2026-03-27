# PLANS

이 문서는 Codex가 따라야 하는 실행 계획의 기준 문서다.  
계획이 바뀌면 코드를 먼저 고치지 말고 이 문서를 먼저 갱신한다.

---

## 0. Goal

게스트하우스 예약 시스템 V1을 구현한다.

핵심 성공 조건:
- 객실 타입 기준 예약 접수
- 실제 객실의 숙박일별 배정 변경 가능
- 게스트/ops 서비스 분리
- 객체 단위 접근통제
- 대기 상태 포함 재고 점유
- 감사 가능한 운영 이력

---

## 1. Scope

### In
- 게스트 / 호스트 / 관리자 기능
- 예약, 재고, 가격정책, block, 감사로그
- 계정복구와 권한요청
- 웹 기반 시스템
- React + Spring Boot + MyBatis + MySQL 방향

### Out
- 결제
- OTA 연동
- 모바일 앱
- 자동 최적 배정
- 다국어

---

## 2. Architecture baseline

## Runtime split
- `guest-web`
- `ops-web`
- `guest-api`
- `ops-api`

## Shared modules
- `shared-domain`
- `shared-auth` (세션 검증 유틸 수준)
- `shared-audit`
- `shared-db-conventions`

## Baseline decisions
- `BD-01`: 예약 동시성은 MySQL 트랜잭션 + 행 단위 비관적 락을 baseline으로 한다.
- `BD-02`: 아이디 찾기 / 비밀번호 찾기 / 비밀번호 재설정은 `M1` 범위에 포함한다.
- `BD-03`: V1에서는 관리자용 공지/약관 관리만 baseline scope로 두고, 사용자-facing notification은 후속 범위로 둔다.
- `BD-04`: 세션 저장소는 Redis-backed key-value store를 baseline으로 하고 JWT는 도입하지 않는다.
- `BD-05`: `PENDING` 예약은 호스트 승인/거절 전 상태이며, 짧은 TTL hold가 아니라 재고를 계속 점유하는 상태다.
- `BD-06`: 예약은 room type 기준으로 접수하되, 실제 room assignment는 `reservation_nights`에 nightly row로 저장하고 생성 시 deterministic first-fit으로 초기 배정한다.
- `BD-07`: 같은 target/date에 pricing policy가 겹치면 winner를 고르지 않고 additive delta를 합산한다.
- `BD-08`: V1 block 모델은 room-level only이며 `room_id` 기반 exclusion을 baseline으로 한다.

## Core data model direction
- `users`
- `user_term_agreements`
- `auth_requests`
- `accommodations`
- `room_types`
- `rooms`
- `price_policies`
- `blocks`
- `reservations`
- `reservation_nights`
- `reservation_status_history`
- `audit_logs`
- `system_logs` or external logging integration
- `terms`
- `notices`
- `attachments`
- `recovery_verifications`
- session store in Redis

---

## 3. Unresolved decisions

## Can defer
- `OQ-04`: 관리자/호스트 UI/API 차등화 수준 (`M7`)
- `OQ-05`: 관리자 접근 제한 방식 (`M8`)
- `OQ-06`: 이미지/파일 저장 방식 (`M5`, `M7`)
- `OQ-08`: 게스트 취소 cutoff 기준 시각 (`M4`)

---

## 4. Architecture notes

- 예약 가용성 계산은 room type 기준으로 접수하되 실제 점유와 배정은 `reservation_night` + `assigned_room_id` 기준으로 추적한다.
- `PENDING`와 `CONFIRMED`는 모두 inventory-consuming 상태이며, short-lived hold 테이블은 두지 않는다.
- host/admin의 승인/거절/재배정 행위는 reservation status history와 audit trail에 함께 남겨야 한다.
- pricing은 `base_price + sum(applicable deltas)`를 baseline으로 하고, 중복 기간 자체는 허용한다.
- block은 V1에서 room-level only로 유지하고, room type availability는 room-level block과 occupied night를 합산 제외해 계산한다.

---

## 5. Risks

| ID | Risk | Impact | Response |
|---|---|---|---|
| R1 | 예약 동시성 처리 오류 | overbooking | `BD-01` 유지, `M3` 동시성 테스트 필수 |
| R2 | SRS와 SQL 초안 불일치 | 잘못된 스키마 고착 | SRS 우선, schema reconciliation 선행 |
| R3 | guest/ops 분리 누락 | 보안/배포 복잡도 증가 | 저장소 골조 단계에서 분리, 앱 간 강한 결합 금지 |
| R4 | 권한 검증 누락 | IDOR/권한상승 | 서비스/쿼리 레벨 소유권 검증 강제 |
| R5 | 감사로그 빈약 | 운영 추적 불가 | 주요 행위 before/after 또는 충분한 reason 기록 필수 |
| R6 | SQL 초안 조기 고착 | 구현 전체 재작업 | `SCHEMA_RECONCILIATION.md`를 migration 이전 기준 문서로 사용 |
| R7 | 장기 `PENDING` 누적 | 판매 가능 재고 장기 잠김 | 운영 backlog 조회, 요청 시각 정렬, host decision SLA 필요 |
| R8 | additive pricing 오해 | 가격 계산 불일치 | `PERCENT` 미지원 또는 제거, 중첩 delta 합산 테스트 필수 |

---

## 6. Milestones

## M0 — 스펙 정렬 / baseline 결정 / schema reconciliation
### Goal
구현 전에 모순과 미정 사항을 정리하고 baseline decision과 스키마 정합성 기준을 문서로 확정한다.

### Includes
- can-default-safely 항목을 baseline decision으로 승격
- 남은 open question의 옵션 / 추천안 / owner milestone 명시
- `SCHEMA_RECONCILIATION.md` 작성
- `PLANS.md`, `OPEN_QUESTIONS.md` 정리
- validation commands와 requirement traceability 보강

### Requirements
- REQ-F-001 ~ REQ-F-035
- REQ-F-050 ~ REQ-F-061
- REQ-F-076 ~ REQ-F-095
- REQ-F-096 ~ REQ-F-106
- REQ-F-107 ~ REQ-F-127
- REQ-NF-003 ~ REQ-NF-007
- REQ-SEC-001 ~ REQ-SEC-008
- BR-001 ~ BR-008
- REQ-OTH-001 ~ REQ-OTH-005

### Acceptance criteria
- `OPEN_QUESTIONS.md`에 baseline decision과 remaining decisions가 분리되어 있다.
- `PLANS.md`에 baseline decision, unresolved decisions, validation commands가 명시돼 있다.
- `SCHEMA_RECONCILIATION.md`가 SRS 요구사항과 SQL 초안 차이를 milestone 단위로 매핑한다.
- `BD-05` ~ `BD-08`의 운영/스키마 영향이 문서로 추적 가능하다.
- production code와 `db/schema-draft.sql`은 수정하지 않는다.

### Validation commands
- `Get-Content -Raw -Encoding UTF8 docs/plan/PLANS.md`
- `Get-Content -Raw -Encoding UTF8 docs/spec/OPEN_QUESTIONS.md`
- `Get-Content -Raw -Encoding UTF8 docs/plan/SCHEMA_RECONCILIATION.md`
- `Get-Content -Raw -Encoding UTF8 scripts/schema-review-checklist.md`
- `git diff -- docs/plan/PLANS.md docs/spec/OPEN_QUESTIONS.md docs/plan/SCHEMA_RECONCILIATION.md`

---

## M1 — 계정/인증/복구/권한요청
### Goal
게스트/호스트/관리자 인증 경계를 세우고 계정 관리와 복구 흐름을 만든다.

### Includes
- 게스트 회원가입/로그인/로그아웃
- 세션 생성/검증/종료
- 개인정보 조회/수정
- 비밀번호 변경
- 아이디 찾기
- 비밀번호 재설정
- 호스트 권한 요청
- 호스트 로그인/계정관리
- 관리자 로그인

### Requirements
- REQ-F-001 ~ REQ-F-035
- REQ-F-070 ~ REQ-F-075
- REQ-F-113
- REQ-SEC-001 ~ REQ-SEC-008

### Acceptance criteria
- 역할별 로그인/인가가 동작한다.
- 게스트가 자신의 데이터만 수정 가능하다.
- 복구 인증코드 발송/검증 구조가 있다.
- 호스트 요청이 생성되고 관리자 검토 대상이 된다.
- 비밀번호는 평문 저장되지 않는다.

### Validation
- 인증 통합 테스트
- 권한 테스트
- 복구 실패/만료 테스트
- 잠금/실패횟수 정책 테스트

---

## M2 — 게스트 숙소 탐색
### Goal
게스트가 조건 기반으로 숙소를 찾고 상세를 본다.

### Depends on
- `BD-05`: `PENDING`도 점유 상태로 계산해야 한다.
- `BD-08`: room type availability는 room-level block exclusion을 반영해야 한다.

### Includes
- 메인 검색
- 결과 분류
- 정렬
- 숙소 상세
- 객실 타입별 가능 여부
- 예약 현황 캘린더 조회

### Requirements
- REQ-F-036 ~ REQ-F-049
- REQ-NF-001
- REQ-NF-002

### Acceptance criteria
- 도시/날짜/인원 조건 검색 가능
- 결과가 판매 가능 / 조건 불일치 / 판매 완료로 구분됨
- 정렬해도 대분류 순서 유지
- 날짜 최대 1년 제한
- 상세 화면에서 객실 타입별 예약 가능 여부 확인 가능

### Validation
- 검색 API 테스트
- 정렬/분류 테스트
- 상세 조회 성능 테스트

---

## M3 — 예약 요청 / 점유 / 초기 배정
### Goal
가장 중요한 예약 원자성과 동시성 제어를 완성한다.

### Depends on
- `BD-01`: 예약 처리 전체를 단일 트랜잭션 + 비관적 락으로 감싼다.
- `BD-05`: 성공한 예약은 `PENDING`이어도 재고를 계속 점유한다.
- `BD-06`: 예약 생성 시 `reservation_night`와 nightly 실제 room assignment가 함께 생성된다.

### Includes
- 예약 요청
- 재고 재검증
- 락/트랜잭션
- 대기 상태 생성
- reservation_night 생성
- 초기 실제 객실 배정 생성
- 실패 시 롤백

### Requirements
- REQ-F-050 ~ REQ-F-061
- REQ-NF-003
- REQ-NF-005
- BR-001
- BR-002
- BR-006
- REQ-OTH-001 ~ REQ-OTH-003

### Acceptance criteria
- 검색/상세 조회 시 재고 점유가 일어나지 않는다.
- 예약 버튼 클릭 시에만 점유한다.
- 동시 요청에서 overbooking이 발생하지 않는다.
- 성공 시 `PENDING` 예약과 `reservation_night`가 생성된다.
- `PENDING` 상태에서는 host decision 전까지 점유가 유지된다.
- 실패 시 전체 롤백된다.

### Validation
- 동시성 통합 테스트
- 트랜잭션 롤백 테스트
- 재고 계산 테스트

---

## M4 — 게스트 예약 조회/취소
### Goal
게스트가 자신의 예약을 보고 취소한다.

### Includes
- 예약 목록
- 예약 상세
- 취소 가능 여부 검증
- 취소 시 점유 복구
- 실제 객실 번호 비노출

### Requirements
- REQ-F-062 ~ REQ-F-069

### Acceptance criteria
- 게스트는 자기 예약만 본다.
- 상세에 객실 타입/일정/상태가 보인다.
- 실제 객실 배정 결과는 기본 비노출이다.
- 취소 시 상태와 점유가 함께 갱신된다.

### Validation
- 소유권 테스트
- 취소 정책 테스트
- 취소 후 재고 복구 테스트

---

## M5 — 호스트 자산/가격정책/block 관리
### Goal
호스트가 숙소와 판매 자산을 운영할 수 있다.

### Depends on
- `BD-07`: overlapping pricing policy는 additive delta 합산 모델을 따른다.
- `BD-08`: block은 room-level only 모델을 따른다.

### Includes
- 숙소 CRUD/비활성화
- 객실 타입 CRUD/비활성화
- 개별 객실 CRUD/비활성화
- 예약 가능 여부 변경
- 가격 정책 등록/수정/삭제
- block 생성/수정/해제

### Requirements
- REQ-F-076 ~ REQ-F-095
- REQ-NF-007

### Acceptance criteria
- 자기 숙소만 관리 가능
- 가격 정책이 최종 가격 계산에 반영된다.
- 동일 일자에 겹치는 여러 가격 정책은 additive delta 합산으로 반영된다.
- block된 객실은 가용 재고에서 제외된다.
- block은 `room_id` 기준으로만 생성/수정/해제된다.
- 이력 있는 자산은 삭제보다 비활성화 우선이다.
- 변경 이력이 감사 대상으로 남는다.

### Validation
- host ownership 테스트
- 가격 계산 테스트
- block 반영 테스트
- soft delete 정책 테스트

---

## M6 — 호스트 예약 운영
### Goal
호스트가 예약을 확정/취소하고 실제 객실을 날짜별로 재배정한다.

### Depends on
- `M3`의 nightly assignment model
- `BD-05`: host decision 전 `PENDING` inventory hold 유지
- `BD-06`: 재배정은 `reservation_nights` row를 수정하는 방식
- `BD-08`: room-level block과 충돌하지 않는 room만 재배정 가능

### Includes
- 예약 목록
- 예약 상세
- 예약 확정
- 예약 취소
- 숙박일별 실제 객실 배정 변경
- 재고 그리드/캘린더 조회

### Requirements
- REQ-F-096 ~ REQ-F-106
- BR-007

### Acceptance criteria
- 호스트는 자기 숙소 예약만 조회/조작 가능하다.
- `PENDING -> CONFIRMED/CANCELLED` 흐름이 동작한다.
- host의 거절은 inventory release를 수반하는 `CANCELLED` terminal flow로 정리된다.
- `reservation_night` 단위 배정 변경이 가능하다.
- 연박 중 날짜별 다른 객실 배정이 가능하다.
- 변경 사유와 이력이 기록된다.

### Validation
- host scope 테스트
- 상태전이 테스트
- reservation_night 재배정 테스트

---

## M7 — 관리자 운영 / 권한 / 감사 / 공지
### Goal
관리자가 전체 서비스 운영을 제어한다.

### Includes
- 회원 조회/수정
- 권한 요청 승인/거절
- 감사 로그 조회
- 시스템 운영 로그 조회
- 전체 운영 현황 조회
- 약관/공지 관리

### Requirements
- REQ-F-107 ~ REQ-F-127
- REQ-NF-004
- BR-008

### Acceptance criteria
- 관리자 전용 진입점이 존재한다.
- 관리자만 전체 회원/숙소/예약 조회가 가능하다.
- 권한요청 승인 시 역할이 반영된다.
- 감사로그에 actor / target / time / reason 또는 before-after가 포함된다.
- 공지/약관 관리가 가능하다.

### Validation
- 관리자 권한 테스트
- 감사로그 조회 테스트
- 운영 현황 API 테스트

---

## M8 — 하드닝 / NFR / 배포
### Goal
성능/보안/배포 분리 기준을 맞추고 릴리즈 가능 상태로 만든다.

### Includes
- 응답 시간 튜닝
- 보안 점검
- 에러 메시지 정리
- HTTPS/Nginx 배포 노트
- 게스트/ops 분리 배포 문서
- 운영/장애 점검 항목

### Requirements
- REQ-NF-001 ~ REQ-NF-007
- REQ-SEC-001 ~ REQ-SEC-008

### Acceptance criteria
- 주요 응답시간 목표가 확인된다.
- 내부 정보 노출 금지가 확인된다.
- 분리 배포 문서가 존재한다.
- 운영 체크리스트가 존재한다.

### Validation
- 성능 측정
- 보안 점검 리스트
- smoke test
- 배포 rehearsal

---

## 7. Stop-and-fix rules

다음 중 하나가 발생하면 즉시 멈추고 해결한다.

- 요구사항 추적 불가
- 권한 경계가 불명확
- overbooking 가능성
- guest/ops 분리 원칙 훼손
- 테스트 실패
- SRS와 구현이 충돌
- SQL 초안이 도메인 모델을 잘못 고정함

---

## 8. Current recommendation

현재 브랜치 기준 추천 순서는 아래와 같다.

1. validated SQL baseline 유지
2. `M1`의 인증/세션 bootstrap 검증 완료
3. `M3`의 guest reservation write slice를 먼저 구현
4. `M6`의 host approval/rejection 최소 슬라이스와 브라우저 검증용 `guest-web` / `ops-web` 최소 UI를 연결
5. 이후 `M2` read/search slice와 `M4` guest reservation read/cancel로 확장

메모:
- milestone 번호는 기능 묶음 기준이며, 현재 브랜치에서는 아키텍처 우선순위에 따라 `M3` write slice를 `M2`보다 먼저 착수할 수 있다.
- 단, `BD-01`, `BD-05`, `BD-06`을 벗어나는 재고/동시성 가정은 허용하지 않는다.
---

## Latest Implementation Note (2026-03-24)

- Scope completed in this pass:
  `M6` operations expansion plus a narrow `M2` hardening item for guest past-date search validation.
- Traceability:
  `REQ-F-096 ~ REQ-F-106`, `BR-007`, and guest-search hardening aligned to `REQ-F-036 ~ REQ-F-049`, `REQ-NF-001`, `REQ-NF-002`.
- Implemented:
  ops reservation list across `PENDING` / `CONFIRMED` / `CANCELLED`,
  ops reservation detail,
  host/admin approve-reject access,
  same-day-and-future nightly reassignment,
  block/pricing read context in ops detail,
  ops-web list/detail/reassignment UI,
  guest-web KST-based past-date input validation.
- Validation completed:
  `:guest-api:build`, `:ops-api:test`, `:guest-api:build :ops-api:build`,
  `pnpm --filter guest-web build`,
  `pnpm --filter ops-web build`.

## Latest Implementation Note (2026-03-25)

- Scope completed in this pass:
  `M5` minimal room-block management on top of the existing ops reservation foundation.
- Traceability:
  `REQ-F-076 ~ REQ-F-095`, `REQ-F-096 ~ REQ-F-106`, `BD-08`, `REQ-NF-003`, `REQ-NF-005`.
- Implemented:
  ops room-block list by accommodation or room filter,
  room-level block create,
  room-level block deactivate,
  host ownership checks with admin override access,
  overlapping active-block rejection on the same room,
  audit logging for block create/deactivate,
  ops-web room-block management panel.
- Behavioral linkage:
  guest availability and ops reassignment continue to read only `ACTIVE` room blocks,
  so block create/deactivate now affects those flows immediately.
- Validation completed:
  `:guest-api:build :ops-api:build`,
  `pnpm --filter guest-web build`,
  `pnpm --filter ops-web build`.

## Latest Implementation Note (2026-03-25 / pricing)

- Scope completed in this pass:
  `M5` minimal pricing write management on top of the existing ops reservation and room-block foundation.
- Traceability:
  `REQ-F-076 ~ REQ-F-095`, `REQ-F-036 ~ REQ-F-049`, `BD-07`, `REQ-NF-003`, `REQ-NF-005`.
- Implemented:
  ops price-policy list by accommodation or room-type filter,
  additive delta policy create,
  policy deactivate,
  host ownership checks with admin override access,
  `day_of_week_mask` support,
  audit logging for price-policy create/deactivate,
  ops-web pricing management panel.
- Behavioral linkage:
  guest accommodation search/detail now show check-in-night pricing preview as
  `base_price + sum(applicable active deltas)`,
  overlapping active policies remain allowed and stack additively,
  ops reservation detail pricing context continues to read active overlapping policies,
  so policy create/deactivate now affects both guest preview and ops detail without extra sync logic.
- Validation completed:
  `:guest-api:build`,
  `:ops-api:clean :ops-api:build`,
  `pnpm --filter guest-web build`,
  `pnpm --filter ops-web build`.

## Latest Implementation Note (2026-03-25 / account-admin)

- Scope completed in this pass:
  partial `M1` account creation and host-role-request flow,
  plus minimal `M7` admin user-management and host-role-request review.
- Traceability:
  `REQ-F-001 ~ REQ-F-035`,
  `REQ-F-070 ~ REQ-F-075`,
  `REQ-F-107 ~ REQ-F-127`,
  `REQ-F-113`,
  `REQ-SEC-001 ~ REQ-SEC-008`.
- Implemented:
  guest signup,
  duplicate login/email/phone validation,
  bcrypt password hashing,
  transactional `users` + `user_login_security` creation,
  guest host-role-request state/create flow,
  admin-only user list/detail,
  admin-only host-role-request list/detail/approve/reject,
  single-role promotion from `GUEST` to `HOST`,
  audit logging for host-role-request create/approve/reject,
  guest-web signup and host-role-request panels,
  ops-web admin-only users/request-review panel.
- Explicitly out of scope in this pass:
  account recovery,
  password-reset verification UX/API,
  find-id recovery,
  forced session invalidation on role change,
  terms-agreement capture during signup.
- Validation completed:
  `:guest-api:build`,
  `:ops-api:build`,
  `pnpm --filter guest-web build`,
  `pnpm --filter ops-web build`.

## Latest Implementation Note (2026-03-25 / guest-access-account-alignment)

- Scope in for this pass:
  public guest browsing before login,
  signup terms capture and password confirmation,
  guest self account/profile/password management,
  reservation `guest_count` persistence and exposure.
- Traceability:
  `REQ-F-001 ~ REQ-F-035`,
  `REQ-F-036 ~ REQ-F-049`,
  `REQ-F-050 ~ REQ-F-069`,
  `REQ-F-096 ~ REQ-F-106`,
  `REQ-SEC-001 ~ REQ-SEC-008`,
  `REQ-NF-001 ~ REQ-NF-003`.
- Explicitly unchanged:
  `BD-05`,
  `BD-06`,
  `BD-07`,
  `BD-08`,
  session-based auth baseline,
  reservation/block/pricing/reassignment semantics.
- Planned implementation order:
  1. document and schema/application baseline update for `guest_count`,
  2. public browse read-path exposure without weakening reservation ownership checks,
  3. signup required-terms capture using existing `terms` + `user_term_agreements`,
  4. guest self profile/password management,
  5. guest/ops reservation read-model exposure for `guest_count`,
  6. guest-web alignment for anonymous browse, auth gating, signup terms, and account management.
- Explicitly out of scope in this pass:
  account recovery,
  forced session invalidation,
  reservation lifecycle redesign,
  pricing/block rule changes,
  host asset CRUD,
  host-side reservation cancel,
  admin audit/system-log/notice operations.

## Latest Implementation Note (2026-03-26 / guest search result grouping)

- Scope completed in this pass:
  a UI-only refinement within `M2` guest search results, while keeping the existing backend search classification logic unchanged.
- Traceability:
  `REQ-F-036 ~ REQ-F-049`,
  `REQ-NF-001`,
  `REQ-NF-002`.
- Implemented:
  guest search results are now rendered in ordered sections:
  `조건에 맞는 방`,
  `조건에 맞지 않는 방`,
  `sold out`.
- Current classification source:
  the frontend still uses the existing backend `availabilityCategory` values as-is:
  `AVAILABLE`,
  `CONDITION_MISMATCH`,
  `SOLD_OUT`.
- Important limitation:
  this is intentionally a UI-first interim step.
  The backend rule has not yet been changed to prefer `CONDITION_MISMATCH` over `SOLD_OUT` when both conditions coexist across room types in the same accommodation.
- Validation completed:
  `pnpm --filter guest-web exec tsc --noEmit`.

## Latest Implementation Note (2026-03-26 / guest search classification hardening)

- Scope completed in this pass:
  a narrow `M2` backend refinement for guest search classification semantics.
- Traceability:
  `REQ-F-036 ~ REQ-F-049`,
  `REQ-NF-001`,
  `REQ-NF-002`.
- Implemented:
  if an accommodation has no `AVAILABLE` room type, but has both
  `CONDITION_MISMATCH` and `SOLD_OUT` room types, the accommodation is now classified as `SOLD_OUT`.
- UI consequence:
  the existing grouped guest search list remains unchanged and now places those accommodations into the `sold out` section automatically.
- Validation completed:
  `pnpm --filter guest-web exec tsc --noEmit`.
- Validation target:
  `:guest-api:test --tests com.guesthouse.guestapi.accommodation.service.GuestAccommodationReadServiceTest`.

## Latest Implementation Note (2026-03-26 / guest mypage page split)

- Scope completed in this pass:
  a narrow guest-web UI restructuring for account-area page separation and detail-card action alignment.
- Traceability:
  `REQ-F-001 ~ REQ-F-035`,
  `REQ-F-062 ~ REQ-F-075`,
  `REQ-NF-001`,
  `REQ-NF-002`.
- Implemented:
  guest mypage now routes into independent pages for
  `기본 정보`,
  `비밀번호 변경`,
  `호스트 권한 요청`
  instead of keeping all account content in one combined screen.
- UI consequence:
  the left workspace panel now lists these account pages independently,
  and the mypage hub links directly into each page.
- Additional UI refinement:
  room-type detail actions were moved into the card grid and resized into a smaller horizontal layout.
- Validation completed:
  `pnpm --filter guest-web exec tsc --noEmit`.

## Latest Implementation Note (2026-03-26 / guest result emphasis and reservation list tabs)

- Scope in for this pass:
  a narrow guest-web presentation refinement for search-result status emphasis and mypage reservation-list segmentation.
- Traceability:
  `REQ-F-036 ~ REQ-F-049`,
  `REQ-F-062 ~ REQ-F-069`,
  `REQ-NF-001`,
  `REQ-NF-002`.
- Target behavior:
  search results should visually distinguish `조건에 맞는 방`, `조건에 맞지 않는 방`, and `sold out` more aggressively,
  and the mypage reservation list should switch between reservation-status groups through tab-like controls.
- UI consequence:
  guest search cards can use stronger tone separation by availability category,
  and reservation list browsing will follow the same tab pattern already used in the account area.
- Validation target:
  `pnpm --filter guest-web exec tsc --noEmit`.

## Latest Implementation Note (2026-03-26 / guest active-region option sourcing)

- Scope in for this pass:
  a narrow guest browse read-model refinement so the search-region selector no longer depends only on frontend constants.
- Traceability:
  `REQ-F-036 ~ REQ-F-049`,
  `REQ-NF-001`,
  `REQ-NF-002`.
- Implemented target:
  add a guest read-only API that returns distinct active accommodation regions,
  and let `guest-web` load those options at runtime as the primary source of truth with a bounded fallback region set.
- Scope out:
  no search-result DTO redesign,
  no booking-flow mutation changes,
  no ops-web changes.
- UI consequence:
  the guest search page follows DB-backed active regions as its primary source of truth,
  while falling back to the existing six guest-facing regions if the read API fails.
- Validation target:
  `pnpm --filter guest-web exec tsc --noEmit`,
  `:guest-api:test --tests com.guesthouse.guestapi.accommodation.GuestAccommodationControllerWebTest`.

## Next Milestone Draft (2026-03-26 / guest UI-UX polish phase)

- Scope in:
  a guest-only presentation and usability refinement pass after the smoke-level flow integration is complete.
- Traceability:
  `REQ-F-001 ~ REQ-F-075`,
  `REQ-NF-001`,
  `REQ-NF-002`,
  `REQ-SEC-001 ~ REQ-SEC-008`.
- Working assumption:
  guest functional flow is sufficiently connected for now,
  so the next pass should optimize readability, visual hierarchy, information density, and page-to-page consistency before starting the same treatment on `ops-web`.
- Primary goals:
  1. establish a stronger visual system for guest pages:
     header, hero, cards, tabs, buttons, empty states, section dividers, and status emphasis,
  2. improve accommodation list readability:
     clearer grouping, stronger distinction for mismatch / sold-out sections, more consistent price and metadata hierarchy,
  3. improve accommodation detail readability:
     room-type card hierarchy, action placement, calendar presentation, and scroll ergonomics,
  4. improve mypage/account readability:
     clearer navigation between profile / password / host-role-request / reservations,
  5. remove lingering development-oriented visual noise where it does not help real service UX.
- Explicit scope out:
  no recovery API implementation,
  no payment/OTA/mobile scope,
  no guest/ops architecture redesign,
  no large reservation-domain redesign.
- Proposed execution order:
  1. define the guest visual direction and spacing/typography rules,
  2. polish the guest landing/search page,
  3. polish accommodation results cards and section emphasis,
  4. polish accommodation detail and calendar UX,
  5. polish mypage/account/reservation pages,
  6. run a final consistency pass across the whole guest app.
- Acceptance criteria:
  - each major guest page has a clear visual hierarchy with no obviously placeholder-level layout,
  - accommodation search results are easy to scan and status sections are visually unambiguous,
  - accommodation detail can be read and acted on without layout confusion,
  - account and reservation pages feel like one coherent product rather than separate smoke screens,
  - no regression in guest search / detail / reservation / account flow.
- Validation commands:
  `pnpm --filter guest-web exec tsc --noEmit`
- Risk notes:
  - visual polish can easily sprawl across too many pages at once,
  - draft parity and service-grade UX are not always identical, so UI-first decisions should now favor actual usability over literal draft mimicry,
  - repeated one-off styling patches may increase CSS inconsistency unless each pass also normalizes shared rules.

## Latest Implementation Note (2026-03-26 / guest detail and calendar polish)

- Scope completed in this pass:
  the next `guest UI-UX polish` step after search/results, focused on accommodation detail readability and calendar usability.
- Traceability:
  `REQ-F-036 ~ REQ-F-049`,
  `REQ-NF-001`,
  `REQ-NF-002`,
  `REQ-SEC-001 ~ REQ-SEC-008`.
- Implemented:
  redesign the accommodation detail hero, room-type cards, and calendar modal to match the stronger visual direction already established on the guest landing and results pages.
- UX consequence:
  accommodation detail now reads as a clearer compare-and-act screen,
  while the calendar behaves more like a dedicated inventory tool than a smoke placeholder.
- In scope details:
  stronger hero hierarchy,
  more explicit room-type comparison cards,
  reduced visual noise in the calendar,
  consistent status/button/card density rules carried into the detail view.
- Next intended pass:
  `mypage/account/reservation consistency`.
- Validation target:
  `pnpm --filter guest-web exec tsc --noEmit`.

## Latest Implementation Note (2026-03-26 / guest visual theme reset)

- Scope in for this pass:
  a guest-only visual-direction reset within the active `guest UI-UX polish` phase.
- Traceability:
  `REQ-F-036 ~ REQ-F-049`,
  `REQ-F-050 ~ REQ-F-069`,
  `REQ-NF-001`,
  `REQ-NF-002`.
- Problem statement:
  the current guest UI became too black/charcoal-heavy during the earlier structure and readability passes,
  and no longer matches the intended guesthouse mood.
- New direction:
  shift from near-monochrome emphasis toward a warmer guesthouse tone:
  cream / sand surfaces,
  terracotta and amber accents,
  softened dark text,
  stronger hospitality mood without losing scanability.
- In scope:
  shared guest color tokens,
  header tone,
  hero surfaces,
  cards,
  status pills,
  buttons,
  list/detail visual hierarchy.
- Out of scope:
  API/schema changes,
  recovery flow implementation,
  ops-web styling,
  large component rewrites.
- Acceptance target:
  the guest app should feel noticeably less monochrome,
  more welcoming,
  and more consistent with a guesthouse/hospitality product while preserving current readability.

## Latest Implementation Note (2026-03-27 / guest reservation-request mismatch guidance)

- Scope in for this pass:
  a guest-only reservation-request UX refinement when a room type can be opened from detail but cannot actually be requested with the current search guest count.
- Traceability:
  `REQ-F-044 ~ REQ-F-049`,
  `REQ-F-050 ~ REQ-F-061`,
  `REQ-NF-001`,
  `REQ-NF-002`.
- Implemented direction:
  keep the user flow open from accommodation detail into reservation-request,
  but replace silent dead-end behavior with an explicit explanation and a CTA back to search when the current guest count does not fit the selected room type.
- Acceptance target:
  the user should understand why the request cannot proceed,
  see the suggested guest-count range,
  and be able to return to search without confusion.

## Latest Implementation Note (2026-03-27 / session login-failure lockout hardening)

- Scope in for this pass:
  a shared auth hardening update for session-based login protection using the existing `user_login_security` table.
- Traceability:
  `REQ-F-001 ~ REQ-F-009`,
  `REQ-SEC-001 ~ REQ-SEC-008`,
  `REQ-NF-003`.
- Rule to implement:
  if the same account records `5` or more failed login attempts within `5` minutes,
  the account becomes locked until `5` minutes after the last failed attempt.
- Implementation direction:
  reuse the existing `failed_login_count`, `last_failed_at`, and `locked_until` columns,
  calculate the rolling 5-minute window in the shared auth write path,
  and keep the lockout behavior common for guest and ops login flows.
- Acceptance target:
  failed attempts older than the rolling window do not keep accumulating forever,
  the 5th in-window failure sets `locked_until`,
  and successful login still clears the failure state.

## Latest Implementation Note (2026-03-27 / auth yaml enforcement wiring)

- Scope in for this pass:
  wire the already-declared `guest-api` auth/session yaml settings into real runtime behavior without widening into recovery implementation.
- Traceability:
  `REQ-F-001 ~ REQ-F-018`,
  `REQ-SEC-001 ~ REQ-SEC-008`,
  `REQ-NF-003`.
- Planned runtime behavior:
  apply `auth.rate-limit.login` and `auth.rate-limit.signup` as actual per-IP and global request throttles,
  apply `auth.session.cookie-secure` to the session cookie serializer,
  and apply guest-session CSRF token issuance/validation using the configured header name.
- Scope out:
  no recovery endpoint implementation,
  no JWT introduction,
  no guest/ops auth-flow redesign,
  no schema change beyond the already-implemented login-failure lockout reuse.
- Safety note:
  CSRF enforcement must be added in a way that does not silently break the current guest-web flow,
  so token issuance and frontend header propagation are part of the same pass.
- Acceptance target:
  login and signup are throttled according to configured yaml limits,
  secure-cookie flag follows yaml,
  authenticated unsafe guest requests reject missing/invalid CSRF headers when CSRF is enabled,
  and current guest UI flows continue to submit successfully with the propagated token header.

## Latest Implementation Note (2026-03-27 / guest signup validation guidance)

- Scope in for this pass:
  a narrow guest-web auth UX hardening step so signup field requirements and duplicate-contact failures are visible to the user before or at submission time.
- Traceability:
  `REQ-F-010 ~ REQ-F-018`,
  `REQ-SEC-001 ~ REQ-SEC-008`,
  `REQ-NF-001`.
- Current backend source of truth:
  signup already validates login-id length, password length, password confirmation, required-term agreement, and duplicate `loginId` / `email` / `phone`.
- Planned UX refinement:
  add field-level signup guidance and inline error presentation in guest-web,
  keep validation aligned to the current backend rules,
  and map backend duplicate/conflict responses back onto the relevant signup fields instead of showing only a generic banner.
- Scope out:
  no recovery-flow implementation,
  no auth-flow redesign,
  no speculative backend constraint expansion beyond currently implemented signup rules.
- Acceptance target:
  users can tell why signup cannot proceed,
  required/format/duplicate issues are shown near the related field,
  and successful signup still reaches the existing backend endpoint without regression.

## Latest Implementation Note (2026-03-27 / guest auth feedback and in-app history)

- Scope in for this pass:
  a narrow guest-web UX hardening step for login failure guidance and browser back/refresh continuity within the guest SPA.
- Traceability:
  `REQ-F-001 ~ REQ-F-018`,
  `REQ-NF-001`,
  `REQ-NF-002`,
  `REQ-SEC-001 ~ REQ-SEC-008`.
- Planned UX refinement:
  show inline login guidance when credentials are invalid or the account is temporarily locked,
  and persist the current guest page in browser history so internal back-navigation and refresh keep the user inside the guest flow rather than collapsing to the default landing page.
- Scope out:
  no backend auth-contract redesign,
  no JWT/router library migration,
  no recovery implementation.
- Acceptance target:
  login failures are understandable without relying only on a top banner,
  browser back returns to the prior in-app guest page when that page was opened inside the SPA,
  and refresh restores the current guest page instead of always resetting to the main search page.

## Latest Implementation Note (2026-03-27 / guest signup required-contact and results refresh restore)

- Scope in for this pass:
  a narrow guest auth/browse alignment step to make signup email and phone required in both guest-web and guest-api,
  and to restore the accommodation-results page after browser refresh.
- Traceability:
  `REQ-F-010 ~ REQ-F-018`,
  `REQ-F-036 ~ REQ-F-043`,
  `REQ-NF-001`,
  `REQ-NF-002`,
  `REQ-SEC-001 ~ REQ-SEC-008`.
- Planned behavior:
  signup now requires both email and phone as first-class required fields,
  field-level guidance must reflect those rules,
  duplicate email/phone conflicts must continue to map back onto the related fields,
  and `accommodations` should rehydrate from the current search criteria on refresh rather than dropping back to the empty default state.
- Scope out:
  no account-profile required-field redesign,
  no recovery implementation,
  no search ranking/DTO redesign.
- Acceptance target:
  signup cannot proceed without email and phone,
  guest-api rejects missing contact fields consistently,
  guest-web shows required-field guidance inline,
  and refreshing the results page reloads the same search result set.

## Latest Implementation Note (2026-03-27 / guest signup login-id availability check)

- Scope in for this pass:
  a narrow guest auth UX refinement so signup can check `loginId` availability before full form submission.
- Traceability:
  `REQ-F-010 ~ REQ-F-018`,
  `REQ-NF-001`,
  `REQ-SEC-001 ~ REQ-SEC-008`.
- Planned behavior:
  keep the existing duplicate-login validation during real signup submission,
  and add a lightweight guest read API plus a signup `중복확인` action that checks the current `loginId` against the same backend source of truth.
- Scope out:
  no signup-flow redesign,
  no speculative username policy expansion beyond the current `4~50` character rule,
  no recovery implementation.
- Acceptance target:
  signup still rejects duplicate login IDs on submission,
  guest-web can proactively check a typed login ID,
  and changing the login ID clears stale availability results until the user checks again.

## Latest Implementation Note (2026-03-27 / guest signup duplicate precheck aggregation)

- Scope in for this pass:
  a narrow guest auth UX refinement so signup can surface duplicate `loginId`, `email`, and `phone` together on submit instead of stopping one-by-one.
- Traceability:
  `REQ-F-010 ~ REQ-F-018`,
  `REQ-NF-001`,
  `REQ-SEC-001 ~ REQ-SEC-008`.
- Planned behavior:
  keep the existing final duplicate protection inside the real signup transaction,
  and add a lightweight guest precheck API that can inspect the currently typed signup identity fields and report duplicate usage in one response.
- UX consequence:
  even when some required fields are still missing,
  pressing the signup button can still show duplicate guidance for already-entered `loginId`, `email`, and `phone`,
  and duplicate fields should be rendered together rather than sequentially.
- Scope out:
  no recovery implementation,
  no speculative contact-format redesign beyond the current backend constraints.
- Acceptance target:
  signup submit can show local validation errors and duplicate-usage errors together,
  duplicate `loginId` / `email` / `phone` appear in one pass,
  and the final signup endpoint still remains the source of truth for transactional duplicate rejection.

## Latest Implementation Note (2026-03-27 / guest signup success response minimization)

- Scope in for this pass:
  a narrow guest auth hardening step to reduce post-signup response exposure while keeping the existing UI flow unchanged.
- Traceability:
  `REQ-F-010 ~ REQ-F-018`,
  `REQ-SEC-001 ~ REQ-SEC-008`.
- Planned behavior:
  keep the signup transaction and validation semantics unchanged,
  but stop returning unnecessary created-user detail fields to the public signup caller when the guest-web only needs completion confirmation.
- Acceptance target:
  successful signup still transitions the user back to login in guest-web,
  `중복확인` success remains visible in the form,
  and signup success responses expose only the minimum data needed by the current product flow.
