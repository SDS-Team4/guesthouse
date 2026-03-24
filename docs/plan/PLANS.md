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

현재는 **M0 문서 정렬과 schema reconciliation만 먼저 완료**하는 것이 가장 안전하다.  
즉, 지금은 production code나 API 구현보다 아래 순서를 먼저 지킨다.

1. baseline decision 확정
2. remaining open question 정리
3. schema reconciliation 문서 작성
4. validation commands 확정
5. 그 다음 repo bootstrap 또는 M1 착수
