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

## Core data model direction
- `users`
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
- `terms`
- `notices`
- `attachments`
- `recovery_verifications` or equivalent
- session store (DB or Redis-backed; implementation decision needed)

---

## 3. Risks

| ID | Risk | Impact | Response |
|---|---|---|---|
| R1 | 예약 동시성 처리 오류 | overbooking | M0에서 트랜잭션 전략 먼저 확정 |
| R2 | SRS와 SQL 초안 불일치 | 잘못된 스키마 고착 | SRS 우선, schema reconciliation 선행 |
| R3 | guest/ops 분리 누락 | 보안/배포 복잡도 증가 | 저장소 초기 구조에서 분리 |
| R4 | 권한 검증 누락 | IDOR/권한상승 | 서비스/쿼리 레벨 소유권 검증 강제 |
| R5 | 감사로그 빈약 | 운영 추적 불가 | 주요 행위 before/after 로그 필수 |
| R6 | 복구기능 스펙 불명확 | 일정 흔들림 | M0에서 범위 결정 |

---

## 4. Milestones

## M0 — 스펙 정렬 / 저장소 골조 / 설계 확정
### Goal
구현 전에 모순과 미정 사항을 정리하고 저장소 구조와 기본 설계를 확정한다.

### Includes
- SRS/SQL 차이 분석
- open questions 확정
- guest/ops 분리 저장소 골조
- 스키마 개정 초안
- 공통 코딩/문서/테스트 규칙 정리

### Acceptance criteria
- `OPEN_QUESTIONS.md`에 각 쟁점별 결정 또는 기본안이 있다.
- `guest-*`와 `ops-*`의 분리 구조가 저장소에 반영된다.
- DB 초안에서 핵심 불일치 항목이 목록화된다.
- 인증/예약/감사로그/복구 흐름의 아키텍처 노트가 남아 있다.

### Validation
- 문서 검토 완료
- 저장소 구조 생성 확인
- 스키마 리뷰 체크리스트 통과

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

### Includes
- 메인 검색
- 결과 분류
- 정렬
- 숙소 상세
- 객실 타입별 가능 여부
- 예약 현황 캘린더 조회

### Requirements
- REQ-F-036 ~ REQ-F-049
- REQ-F-094
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
- 성공 시 PENDING 예약과 reservation_night가 생성된다.
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
- 가격 정책이 최종 가격 계산에 반영
- block된 객실은 가용 재고에서 제외
- 이력 있는 자산은 삭제보다 비활성화 우선
- 변경 이력이 감사 대상으로 남는다

### Validation
- host ownership 테스트
- 가격 계산 테스트
- block 반영 테스트
- soft delete 정책 테스트

---

## M6 — 호스트 예약 운영
### Goal
호스트가 예약을 확정/취소하고 실제 객실을 날짜별로 재배정한다.

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
- 호스트는 자기 숙소 예약만 조회/조작 가능
- PENDING → CONFIRMED/CANCELLED 흐름 동작
- reservation_night 단위 배정 변경 가능
- 연박 중 날짜별 다른 객실 배정 가능
- 변경 사유와 이력 기록

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
- 관리자 전용 진입점 존재
- 관리자만 전체 회원/숙소/예약 조회 가능
- 권한요청 승인 시 역할 반영
- 감사로그에 actor / target / time / reason 또는 before-after 포함
- 공지/약관 관리 가능

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
- 주요 응답시간 목표 확인
- 내부 정보 노출 금지 확인
- 분리 배포 문서 존재
- 운영 체크리스트 존재

### Validation
- 성능 측정
- 보안 점검 리스트
- smoke test
- 배포 rehearsal

---

## 5. Stop-and-fix rules

다음 중 하나가 발생하면 즉시 멈추고 해결한다.

- 요구사항 추적 불가
- 권한 경계가 불명확
- overbooking 가능성
- guest/ops 분리 원칙 훼손
- 테스트 실패
- SRS와 구현이 충돌
- SQL 초안이 도메인 모델을 잘못 고정함

---

## 6. Current recommendation

현재는 **M0만 먼저 완료**하는 것이 가장 안전하다.  
즉, 지금 Codex에 바로 큰 기능 구현을 시키지 말고 아래 순서를 지킨다.

1. open questions 정리
2. schema reconciliation
3. repo bootstrap
4. validation commands 확정
5. 그 다음 M1 착수
