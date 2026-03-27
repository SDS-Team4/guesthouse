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
- `BD-09`: 관리자 접근 제한은 애플리케이션 role check만으로 끝내지 않고, `M8`에서 ingress/VPN 기반 allowlist를 baseline으로 적용한다.
- `BD-10`: V1 파일 업로드는 오브젝트 스토리지 + 메타데이터 테이블 모델을 baseline으로 하고, 직접 공개 URL 대신 간접 다운로드를 사용한다.

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
| R9 | 공개 조회 API 스크래핑/대량 수집 | DB 부하, 가격/재고 패턴 노출 | edge rate limit, page size 제한, 짧은 TTL 캐시, 비정상 패턴 로깅 |
| R10 | 세션 경계 혼선 / CSRF / 세션 고정 | 인증 우회, 운영자 세션 탈취 | runtime별 세션 분리, CSRF 토큰, 세션 회전, Secure cookie 강제 |
| R11 | 감사/콘텐츠/첨부 보안 미흡 | 운영 추적 불가, stored XSS, 업로드 악성파일 유입 | append-only audit, plain text 정책, object storage + 검증 파이프라인 |

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

## M8 — 비기능 요구사항 / 보안 하드닝 / 릴리즈 게이트
### Goal
현재 구현된 guest/ops 분리, Redis 세션, 비관적 락 예약, 감사로그 쓰기 기반 위에
릴리즈 가능한 수준의 공개 조회 안정성, 예약 write 안정성, 세션/인증 보안, 운영 보안, 관측성을 완성한다.

### Current baseline already present
- guest/ops 런타임 분리
- Redis-backed 세션 저장소
- 로그인/회원가입 Redis rate limit
- 예약 생성 시 MySQL 트랜잭션 + `FOR UPDATE` 재검증
- host ownership 검증과 감사로그 쓰기
- 내부 구현 비노출 예외 처리

### Current gaps to close in `M8`
- 공개 조회 API rate limit / pagination / page size / 캐시 / 봇성 패턴 대응
- 예약 생성 idempotency / duplicate submit 대응 / PENDING backlog 관측성
- 계정 단위 잠금 / 세션 고정 방지 / CSRF / Secure cookie / runtime별 세션 경계
- 계정 복구, 비밀번호 변경 후 세션 무효화
- admin IP allowlist / step-up auth / 감사로그 조회 / append-only 보장
- INFO/공지/약관 저장형 XSS 방지 / 첨부 업로드 검증 / 간접 다운로드
- traceId / request correlation / slow query / smoke flow / 릴리즈 게이트

### Requirements
- REQ-NF-001 ~ REQ-NF-007
- REQ-SEC-001 ~ REQ-SEC-012
- REQ-F-107 ~ REQ-F-127
- BR-001 ~ BR-008
- Appendix E `T1` ~ `T10`

### M8-1 — 공개 조회 API 안정성
#### Scope in
- `GET /api/v1/accommodations/search`
- `GET /api/v1/accommodations/{accommodationId}`
- `GET /api/v1/accommodations/{accommodationId}/room-types/{roomTypeId}/calendar`
- edge rate limit
- pagination / page size
- Redis read-through 캐시
- 비정상 접근 structured log
- 검색/상세/캘린더 query plan 및 index 검토

#### Scope out
- 검색 엔진 교체
- 개인화 추천
- long-lived cache invalidation 체계

#### Key changes
- 공개 GET API 보호는 애플리케이션보다 ingress/Nginx를 1차 방어선으로 둔다.
- `search`는 `page=0`, `size=20`, `size<=50`으로 고정하고, 현재 정렬 결과를 유지한 뒤 page slicing 한다.
- 검색/상세/캘린더는 짧은 TTL Redis cache를 둔다. 공개 조회는 advisory이며, 예약 write가 authoritative라는 원칙을 유지한다.
- 비정상 IP/User-Agent/동일 쿼리 반복은 structured log로 남기고 traceId와 함께 추적한다.
- `REQ-NF-001`, `REQ-NF-002` 검증용으로 `EXPLAIN ANALYZE`와 부하 스크립트를 milestone 산출물에 포함한다.

#### Acceptance criteria
- page size 상한과 날짜 범위 상한이 강제된다.
- 동일 조건 반복 조회에서 cache hit가 확인된다.
- rate limit 초과 요청은 edge에서 제한되고, 앱 로그에 관련 추적 정보가 남는다.
- `REQ-NF-001`, `REQ-NF-002`의 응답 시간 측정 결과가 문서화된다.

#### Validation commands
- `./gradlew :guest-api:test --tests "*GuestAccommodation*"`
- `./gradlew :guest-api:test --tests "*AccommodationRead*"`
- `pnpm --filter guest-web build`
- `k6 run scripts/perf/public-search.js`

#### Requirement traceability
- REQ-NF-001
- REQ-NF-002
- REQ-SEC-008
- REQ-SEC-009
- Appendix E `T10`

#### Risk register
- 짧은 TTL 캐시는 stale read를 허용한다. 대신 예약 write 재검증이 authoritative여야 한다.
- 앱 내부 rate limit만으로는 DB 보호가 부족하므로 ingress 설정이 릴리즈 블로커다.

#### Architecture notes
- 구현 중심은 `guest-api` read path와 reverse proxy 설정이다.
- 1차 구현 baseline은 `guest-api` 내부의 per-endpoint rate limit, in-process short TTL cache, page size 제한으로 시작하고, edge/Nginx limit과 Redis read-through는 릴리즈 전 단계에서 보강한다.
- guest/ops 분리 원칙상 ops read path에는 동일 정책을 그대로 재사용하지 않고 운영 목적에 맞게 별도 제한을 둔다.

### M8-2 — 예약 write 경로 안정성
#### Scope in
- `POST /api/v1/reservations`
- `Idempotency-Key` 헤더
- duplicate submit / retry 대응
- 락 경합 측정
- PENDING backlog 지표
- 경쟁/부하 테스트

#### Scope out
- 큐 기반 비동기 예약 처리
- 결제 hold 모델
- room assignment 전략 변경

#### Key changes
- 현재 `FOR UPDATE` 기반 비관적 락 baseline은 유지하고, 숙소 전체 직렬화로 확장하지 않는다.
- `Idempotency-Key`는 필수 헤더로 도입한다. `guestUserId + key` 단위 Redis 저장, TTL 5분, 동일 body replay, 다른 body는 `409`로 고정한다.
- UI의 중복 클릭 방지와 별개로 서버에서 네트워크 재시도까지 막는다.
- PENDING backlog 개수, 가장 오래된 age, 숙소/room type 편중도를 내부 메트릭 또는 ops 화면으로 노출한다.
- 경쟁 테스트는 마지막 1실, 동일 사용자 반복 submit, 서로 다른 사용자 동시 submit, backlog 누적 상태를 포함한다.

#### Acceptance criteria
- 동일 `Idempotency-Key` 재시도는 중복 예약을 만들지 않는다.
- 마지막 1실 경쟁 시 초과 예약이 발생하지 않는다.
- `REQ-NF-003`, `REQ-NF-005` 검증 결과가 남는다.
- PENDING backlog 상태를 운영자가 확인할 수 있다.

#### Validation commands
- `./gradlew :guest-api:test --tests "*ReservationRequest*"`
- `./gradlew :guest-api:test --tests "*ReservationConcurrency*"`
- `./gradlew :ops-api:test --tests "*ReservationDecision*"`
- `k6 run scripts/perf/reservation-race.js`

#### Requirement traceability
- REQ-NF-003
- REQ-NF-005
- REQ-SEC-004
- REQ-SEC-005
- REQ-SEC-008
- BR-001
- BR-002
- BR-006
- BR-007
- Appendix E `T3`
- Appendix E `T4`
- Appendix E `T6`

#### Risk register
- Redis 장애 시 idempotency fail-open을 허용하면 중복 예약 위험이 생긴다. 이 milestone에서는 fail-open 금지로 본다.
- 락 경합이 심해지면 응답 지연이 길어질 수 있으므로 lock wait와 slow query 측정이 필수다.

#### Architecture notes
- 구현 중심은 `guest-api` reservation write path 전방의 idempotency 계층과 기존 inventory lock 쿼리다.
- `PENDING`가 재고를 소비하는 baseline은 유지한다.

### M8-3 — 세션/인증 보안 하드닝
#### Scope in
- 로그인 실패 제한 강화
- 계정 잠금
- 세션 회전
- guest / ops 세션 경계 분리
- CSRF
- 쿠키 속성 강화
- 비밀번호 변경/재설정 후 세션 무효화
- 계정 복구

#### Scope out
- MFA
- JWT 도입
- 모바일 인증

#### Key changes
- 기존 Redis auth rate limit 위에 계정 단위 lockout을 추가한다. 기준은 15분 내 실패 5회면 30분 잠금으로 고정한다.
- 로그인 성공 시 세션 ID를 회전한다.
- guest/ops는 cookie name, Redis namespace, session timeout을 모두 분리한다.
- production profile에서 `HttpOnly=true`, `Secure=true`, `SameSite=Lax`를 강제한다.
- CSRF는 synchronizer token 방식으로 고정하고, `GET /api/v1/auth/csrf-token` + `X-CSRF-Token` 검증을 도입한다.
- 비밀번호 변경, 비밀번호 재설정, role 변경 후에는 `session_version` 기반 무효화를 적용한다.
- 계정 복구는 generic response, TTL 10분, 재전송 cooldown 60초, 최대 시도 5회, 단일 사용으로 고정한다.

#### Acceptance criteria
- 로그인 5회 실패 후 계정 잠금이 동작한다.
- 로그인 후 세션 ID가 바뀌고 guest 세션으로 ops API 접근이 불가하다.
- CSRF 토큰 없는 상태 변경 요청은 거절된다.
- 비밀번호 변경/재설정 후 기존 세션은 재로그인이 필요하다.
- 계정 복구 API가 계정 존재 여부를 노출하지 않는다.

#### Validation commands
- `./gradlew :shared:shared-auth:test`
- `./gradlew :guest-api:test --tests "*Auth*"`
- `./gradlew :ops-api:test --tests "*Auth*"`
- `pnpm --filter guest-web build`
- `pnpm --filter ops-web build`

#### Requirement traceability
- REQ-SEC-001
- REQ-SEC-002
- REQ-SEC-003
- REQ-SEC-004
- REQ-SEC-006
- REQ-SEC-007
- REQ-SEC-008
- REQ-SEC-009
- Appendix E `T1`
- Appendix E `T7`
- Appendix E `T8`

#### Risk register
- 공용 auth 모듈 변경 범위가 넓어 regression 위험이 크다.
- CSRF는 웹 클라이언트 변경을 동반하므로 guest-web / ops-web과 묶어서 검증해야 한다.

#### Architecture notes
- 구현 중심은 `shared-auth`이며 guest-api, ops-api는 runtime별 설정 주입을 담당한다.
- admin IP allowlist는 앱 단독 기능이 아니라 ingress/network policy와 함께 적용한다.

### M8-4 — Host/Admin 운영 보안 및 콘텐츠/파일 보안
#### Scope in
- host ownership 검증 일관화
- admin step-up auth
- admin IP allowlist 연계
- 감사로그 조회
- system log 최소 조회
- INFO/공지/약관 저장형 XSS 방지
- 첨부 업로드 보안

#### Scope out
- 범용 HTML 편집기
- 외부 DLP
- 이미지 CDN 최적화

#### Key changes
- ops write 흐름은 `target lock -> ownership 확인 -> 상태 검증 -> 변경 -> audit` 순서로 통일한다.
- role change, 강제 비활성화, 공지 publish, 약관 publish에는 step-up re-auth를 요구한다.
- `audit_logs`는 append-only로 유지하고 `GET /api/v1/admin/audit-logs`는 조회만 허용한다.
- `system_logs`는 외부 수집을 우선하고 DB `system_logs`는 최소 조회 인터페이스만 둔다.
- `INFO`, 공지, 약관 본문은 v1에서 HTML을 허용하지 않고 escaped text로만 저장/렌더링한다.
- 파일 업로드는 object storage + metadata table, UUID 저장명, 허용 확장자 `jpg/jpeg/png`, MIME + magic number 검증, 최대 10MB, 간접 다운로드로 고정한다.

#### Acceptance criteria
- 다른 host의 숙소/예약/정책/block 데이터 접근이 차단된다.
- admin 민감 작업은 step-up 인증과 감사로그를 남긴다.
- 감사로그 조회에서 actor, target, reason, before/after, traceId를 확인할 수 있다.
- 저장형 XSS payload가 저장 또는 렌더링 단계에서 무력화된다.
- 잘못된 확장자/MIME/magic number/직접 URL 접근은 거절된다.

#### Validation commands
- `./gradlew :ops-api:test --tests "*Admin*"`
- `./gradlew :ops-api:test --tests "*Audit*"`
- `./gradlew :ops-api:test --tests "*Upload*"`
- `pnpm --filter ops-web build`

#### Requirement traceability
- REQ-F-107 ~ REQ-F-127
- REQ-NF-004
- REQ-NF-007
- REQ-SEC-005
- REQ-SEC-006
- REQ-SEC-007
- REQ-SEC-010
- REQ-SEC-011
- REQ-SEC-012
- BR-003
- BR-004
- BR-005
- BR-008
- Appendix E `T5`
- Appendix E `T6`
- Appendix E `T7`
- Appendix E `T9`

#### Risk register
- HTML 금지는 편집 유연성을 낮추지만, v1에서 XSS 면적을 최소화한다.
- 첨부 기능이 SRS 범위라면 object storage와 권한 검증 파이프라인은 릴리즈 블로커다.

#### Architecture notes
- 구현 중심은 `ops-api`와 storage adapter다.
- 감사로그 정정은 update/delete가 아니라 새 row 추가 방식으로만 허용한다.

### M8-5 — 운영 관측성 / 장애 대응 / 릴리즈 게이트
#### Scope in
- traceId / request correlation
- audit/system/application log 연계
- slow query / lock wait / auth failure / 429 spike 지표
- smoke flow
- 성능 측정 명령
- 보안 점검 checklist
- 릴리즈 게이트

#### Scope out
- full distributed tracing
- SIEM 통합
- 장기 로그 아카이브 자동화

#### Key changes
- 모든 요청에 `X-Trace-Id`를 생성 또는 계승하고, application log와 audit log에 동일하게 남긴다.
- actuator는 내부망 전용으로 유지하고, 필요 시 metrics endpoint를 내부 스크레이프 대상으로 노출한다.
- smoke flow는 회원가입/로그인/검색/상세/예약/예약조회/host 승인/관리자 승인/감사로그 조회까지로 고정한다.
- 릴리즈 게이트는 build, test, smoke, 보안 점검, 응답 시간 측정이 모두 통과해야 한다.

#### Acceptance criteria
- 주요 로그와 감사로그를 traceId로 상호 추적할 수 있다.
- `REQ-NF-001` ~ `REQ-NF-005` 측정 결과가 확인 가능하다.
- 배포 직전 checklist로 CSRF, Secure cookie, edge rate limit, admin IP allowlist, rollback, 감사로그 조회를 확인할 수 있다.

#### Validation commands
- `./gradlew build`
- `pnpm --filter guest-web build`
- `pnpm --filter ops-web build`
- `powershell -File scripts/smoke/full-release-smoke.ps1`
- `k6 run scripts/perf/release-gate.js`

#### Requirement traceability
- REQ-NF-001 ~ REQ-NF-007
- REQ-SEC-003
- REQ-SEC-008
- REQ-SEC-009
- Appendix E `T4`
- Appendix E `T9`
- Appendix E `T10`

#### Risk register
- 메트릭과 smoke가 늦으면 성능 목표를 측정할 수 없는 상태가 된다.
- traceId는 마지막에 붙이는 작업이 아니라 선행 milestone부터 공용으로 주입되어야 한다.

#### Architecture notes
- traceId filter는 공용 모듈로 먼저 넣고, metrics와 smoke 스크립트는 마지막에 모은다.
- `system_logs` 테이블은 1차 운영 저장소가 아니라 보조 추적 수단으로 취급한다.

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

1. `M8-3`의 세션 경계 분리, Secure cookie, 세션 회전, 계정 잠금 설계를 먼저 적용한다.
2. `M8-1`의 공개 조회 edge rate limit, page size, 짧은 TTL 캐시를 넣어 노출 면적과 부하를 줄인다.
3. `M8-2`의 예약 idempotency와 경쟁 테스트를 추가해 write 안정성을 닫는다.
4. `M8-4`의 admin allowlist 연계, 감사로그 조회, step-up auth, 첨부 보안을 구현한다.
5. `M8-5`의 traceId, smoke, 성능/보안 릴리즈 게이트로 마감한다.

메모:
- `M5`, `M6`, 기존 `M7` 기반 기능이 이미 있는 상태를 전제로, 다음 작업은 기능 추가보다 하드닝 우선이다.
- 릴리즈 블로커는 `M8-1`, `M8-2`, `M8-3`, `M8-4`의 admin 접근 제한/감사로그 조회다.
- `BD-01`, `BD-05`, `BD-06`, `BD-09`, `BD-10`을 벗어나는 재고/세션/파일 보안 가정은 허용하지 않는다.
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

## Latest Implementation Note (2026-03-25 / ops-web-host-admin-design-integration)

- Scope in for this pass:
  host/admin ops-web shell migration toward the new design drafts,
  role-aware navigation,
  live reservation list/detail and decision flows,
  nightly reassignment,
  room-block list/create/deactivate,
  price-policy list/create/deactivate,
  admin user list/detail,
  admin host-role-request list/detail/approve/reject.
- Traceability:
  `REQ-F-076 ~ REQ-F-095`,
  `REQ-F-096 ~ REQ-F-106`,
  `REQ-F-107 ~ REQ-F-127`,
  `REQ-NF-003 ~ REQ-NF-007`,
  `REQ-SEC-001 ~ REQ-SEC-008`,
  `BR-007`,
  `BR-008`,
  `UI-HOST-001`,
  `UI-HOST-008 ~ UI-HOST-012`,
  `UI-ADMIN-001`,
  `UI-ADMIN-003`,
  `UI-ADMIN-004`.
- Internal implementation order:
  1. extract shared ops-web API, types, and formatting helpers from the smoke-test root,
  2. introduce a role-aware host/admin shell without adding router or Tailwind,
  3. move live reservation, reassignment, block, and pricing flows into dedicated pages,
  4. move admin user and host-role-request review into dedicated admin pages,
  5. preserve unsupported draft surfaces as clearly labeled preview pages,
  6. freeze the original design drafts under `ops-web/src/design/`.
- Explicitly unchanged:
  session-based auth baseline,
  host ownership checks,
  admin override access,
  room-level block semantics,
  additive pricing semantics,
  reservation decision and reassignment rules.
- Explicitly out of scope in this pass:
  host property CRUD,
  room-type CRUD,
  room management mutation,
  host ops account API work,
  admin audit-log querying,
  admin system-log querying,
  admin property overview APIs,
  admin terms management APIs.
- Validation completed for this pass:
  `pnpm --filter ops-web build`.

## Latest Implementation Note (2026-03-26 / ops-web-host-calendar-recovery)

- Scope in for this pass:
  host reservation calendar recovery,
  host-first calendar landing page,
  drag-and-drop style nightly reassignment UX,
  reservation calendar read model in `ops-api`,
  preservation of current fallback reservation list/detail pages,
  preservation of current admin pages and admin shell.
- Traceability:
  `REQ-F-076 ~ REQ-F-095`,
  `REQ-F-107 ~ REQ-F-127`,
  `REQ-NF-003 ~ REQ-NF-007`,
  `REQ-SEC-001 ~ REQ-SEC-008`,
  `BR-007`,
  `BR-008`,
  `UI-HOST-008`,
  `UI-HOST-009`,
  `UI-HOST-011`,
  `UI-HOST-012`,
  `UI-ADMIN-001 ~ UI-ADMIN-004`.
- Internal implementation order:
  1. document the recovery slice and treat host calendar UX as the primary ops-web host flow,
  2. add a reservation-calendar read endpoint that returns accommodations, visible dates, grouped rooms, overlapping reservations, nightly assignment cells, and active block cells,
  3. promote a host-only `reservation-calendar` page to the default host landing page while keeping current fallback list/detail pages reachable,
  4. recover the surviving host draft interaction model for room/date grid rendering and drag-and-drop style reassignment,
  5. keep approve/reject and nightly reassignment mutations on the existing validated endpoints,
  6. leave admin IA unchanged in this slice.
- Explicitly unchanged:
  session-based auth baseline,
  host ownership checks,
  admin override access,
  `BD-05`,
  `BD-06`,
  `BD-07`,
  `BD-08`,
  current reservation decision and reassignment mutation semantics.
- Explicitly out of scope in this pass:
  host property CRUD,
  room-type CRUD,
  host account API work,
  admin audit/system-log/property/terms implementation,
  whole-stay block drag semantics,
  router-based URL migration.
- Validation target for this pass:
  `:ops-api:test --tests "*OpsReservationControllerWebTest"`,
  `:ops-api:test --tests "*OpsReservationQueryServiceTest"`,
  `pnpm --filter ops-web build`,
  browser smoke for host calendar load, drag/drop reassignment, approve/reject, and fallback pages.
---

## Active Bundle: Host/Admin Demo Bundle A

### Scope in
- Host-first landing on the reservation calendar.
- Host reservation decision coherence across calendar and detail: approve, reject, cancel, and nightly reassign.
- Host accommodation create/read/update/deactivate.
- Host room-type create/read/update/deactivate.
- Host room create/read/update/deactivate with status-based reservability (`ACTIVE`, `MAINTENANCE`, `INACTIVE`).
- Property-centered host IA: properties page and property operations hub linking to calendar, pricing, and room blocks.
- Admin users and host-role-request review coherence.
- Removal of runtime preview/smoke-test pages and the most visible internal copy in `ops-web`.

### Scope out
- Host account management pages.
- Admin system logs, terms, notices, and property-overview pages.
- Router-based URLs.
- Image/file upload for accommodations.
- Account recovery changes.

### Acceptance criteria
- Host can sign in and land on the live reservation calendar.
- Host can create, update, and deactivate accommodations, room types, and rooms that belong to the signed-in host.
- Host cannot deactivate an accommodation or room type that still has active operational reservations.
- Host cannot inactivate or deactivate a room with future assigned nights.
- Host/admin can cancel `PENDING` or `CONFIRMED` reservations from operations with a required reason.
- Admin can move from user inspection to host-role-request review without losing governance context.
- `ops-web` runtime navigation does not expose preview-only pages in this bundle.

### Validation commands
- `.\gradlew.bat :ops-api:test --tests "com.guesthouse.opsapi.hostasset.HostAssetControllerWebTest" --tests "com.guesthouse.opsapi.reservation.OpsReservationControllerWebTest"`
- `C:\windows\System32\WindowsPowerShell\v1.0\powershell.exe -Command "$env:TEMP='C:\project\guesthouse\.tmp'; $env:TMP='C:\project\guesthouse\.tmp'; pnpm --filter ops-web build"`
- Browser smoke:
  host login -> calendar -> approve/reject/cancel/reassign
  host properties -> accommodation CRUD -> room-type CRUD -> room CRUD/status
  host pricing -> create/deactivate
  host room blocks -> create/deactivate
  admin login -> users -> host-role requests

### Requirement traceability
- `REQ-F-076 ~ REQ-F-106`
- `REQ-F-114 ~ REQ-F-120`
- `REQ-NF-003 ~ REQ-NF-007`
- `REQ-SEC-001 ~ REQ-SEC-008`
- `UI-HOST-002 ~ UI-HOST-012`
- `UI-ADMIN-001 ~ UI-ADMIN-004`

---

## Latest Implementation Note (2026-03-26 / host-calendar-year-window-and-night-swap)

### Scope in
- Expand the host reservation calendar read window from the short operational slice to a one-year view.
- Keep the host reservation calendar horizontally scrollable with sticky room labels so it remains usable for demo recording.
- Improve occupied-cell readability by showing compact reservation identifiers even when a reservation is not currently selected.
- Add same-date occupied-cell swap as a dedicated host/admin operations mutation, preserving the existing one-way reassignment endpoint for empty-target drops.

### Scope out
- Whole-stay drag semantics across multiple dates.
- Cross-date swap or move semantics.
- Router-based URL migration.
- Reservation or inventory rule redesign.

### Acceptance criteria
- Host can open a one-year reservation window from the calendar without changing backend ownership rules.
- Calendar cells show enough reservation identity to distinguish different pending/confirmed stays before selecting detail.
- Dropping a reservation night onto an empty same-date room still performs the existing one-way reassignment flow.
- Dropping a reservation night onto an occupied same-date room swaps the two reservation nights in one transaction.
- Swap is rejected for different stay dates, blocked rooms, past nights, or non-operational reservation statuses.

### Validation commands
- `.\gradlew.bat :ops-api:test --tests "com.guesthouse.opsapi.reservation.OpsReservationControllerWebTest" --tests "com.guesthouse.opsapi.reservation.service.OpsReservationQueryServiceTest" --tests "com.guesthouse.opsapi.reservation.service.ReservationReassignmentServiceTest"`
- `C:\windows\System32\WindowsPowerShell\v1.0\powershell.exe -Command "$env:TEMP='C:\project\guesthouse\.tmp'; $env:TMP='C:\project\guesthouse\.tmp'; pnpm --filter ops-web build"`
- Browser smoke:
  host login -> calendar horizontal scroll
  distinguish reservations by cell label
  drag to empty cell -> reassign
  drag to occupied same-date cell -> swap

### Requirement traceability
- `REQ-F-076 ~ REQ-F-095`
- `REQ-F-114 ~ REQ-F-120`
- `REQ-NF-003 ~ REQ-NF-007`
- `REQ-SEC-001 ~ REQ-SEC-008`
- `BR-007`
- `BR-008`
- `UI-HOST-008`
- `UI-HOST-009`

## Latest Implementation Note (2026-03-26 / auth-abuse-hardening)

- Scope in for this pass:
  fix login-failure security state persistence,
  enforce rolling login lockout,
  add Redis-backed request throttling for auth abuse on login and signup,
  protect guest signup from burst account-creation abuse that can degrade service responsiveness.
- Traceability:
  `REQ-F-001 ~ REQ-F-035`,
  `REQ-SEC-001 ~ REQ-SEC-008`,
  `REQ-NF-003 ~ REQ-NF-007`.
- Planned implementation order:
  1. fix auth failure-state writes so failed login count and `last_failed_at` are not lost on exception,
  2. implement `5 failures within 5 minutes -> lock for 5 minutes from the last failed attempt`,
  3. add Redis-backed IP/global throttling in front of auth login/signup endpoints,
  4. add focused unit/web tests for lockout and throttling behavior.
- Explicitly unchanged:
  session-based auth baseline,
  bcrypt-only password storage,
  role separation between guest and ops runtimes.
- Explicitly out of scope in this pass:
  CAPTCHA,
  email/SMS verification redesign,
  WAF or Nginx-level traffic controls,
  full anti-bot device fingerprinting.
- Validation target for this pass:
  `.\gradlew.bat :shared:shared-auth:test --tests "com.guesthouse.shared.auth.service.SessionAuthenticationServiceTest"`,
  `.\gradlew.bat :guest-api:test --tests "com.guesthouse.guestapi.auth.GuestAuthControllerWebTest" --tests "com.guesthouse.guestapi.auth.service.GuestSignupServiceTest"`,
  `.\gradlew.bat :ops-api:test --tests "com.guesthouse.opsapi.auth.OpsAuthControllerWebTest"`.

## Latest Implementation Note (2026-03-27 / admin-signup-terms-management)

- Scope in for this pass:
  admin-only signup-terms governance in `ops-api` and `ops-web`,
  version-safe term drafting, editing, and publishing for the `terms` table,
  preservation of guest signup required-terms consumption from published rows only.
- Traceability:
  `REQ-F-107 ~ REQ-F-127`,
  `REQ-SEC-001 ~ REQ-SEC-008`,
  `REQ-NF-003 ~ REQ-NF-007`,
  `BR-008`.
- Planned implementation order:
  1. document the admin terms-management slice,
  2. add admin term list/detail/query support and command-side draft/publish mutations,
  3. preserve term-row version history by editing drafts instead of overwriting published rows,
  4. add focused controller/service tests and wire the admin terms page into `ops-web`.
- Explicitly unchanged:
  guest signup term-agreement capture,
  session-based auth baseline,
  plain-text term rendering baseline.
- Explicitly out of scope in this pass:
  notice management,
  audit-log query UI,
  system-log query UI,
  file attachment handling,
  step-up re-auth for publish operations.
- Validation target for this pass:
  `.\gradlew.bat :ops-api:test --tests "com.guesthouse.opsapi.admin.AdminTermsControllerWebTest" --tests "com.guesthouse.opsapi.admin.service.AdminTermCommandServiceTest"`,
  `C:\windows\System32\WindowsPowerShell\v1.0\powershell.exe -Command "$env:TEMP='C:\project\guesthouse\.tmp'; $env:TMP='C:\project\guesthouse\.tmp'; pnpm --filter ops-web build"`.
