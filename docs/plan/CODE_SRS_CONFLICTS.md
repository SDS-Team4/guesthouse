# CODE vs SRS Conflict Log

기준일: 2026-03-25

이 문서는 현재 백엔드 스모크 버전 코드를 우선 소스로 보고, SRS/기준 문서와 비교했을 때 확인된 차이만 기록한다.

## Traceability

- REQ-F-001 ~ REQ-F-127
- REQ-NF-001 ~ REQ-NF-007
- REQ-SEC-001 ~ REQ-SEC-008
- BR-001 ~ BR-008
- BD-01 ~ BD-08

## Current code baseline summary

- 런타임은 `guest-api`, `ops-api`로 분리되어 있고 공용 코드는 `shared-domain`, `shared-auth`, `shared-db-conventions`에 모여 있다.
- 인증은 Redis-backed 세션 기반이며 guest/ops 로그인 엔드포인트가 분리되어 있다.
- 예약 쓰기 흐름은 `room_type` 접수, `reservation_nights` 생성, 초기 room assignment 생성, `PENDING` 상태 유지 모델로 구현되어 있다.
- host/admin 운영 기능은 현재 예약 조회/승인/거절/재배정, room block 관리, price policy 관리, admin 사용자 조회, host-role-request 검토까지 구현되어 있다.

## Confirmed conflicts and gaps

### 1. 계정 복구 기능이 SRS 범위 대비 미구현 상태다

- 코드 기준 현황:
  - 회원가입, 로그인, 로그아웃, 본인 계정 조회/수정, 비밀번호 변경, host role request는 구현되어 있다.
  - 아이디 찾기, 비밀번호 찾기, 비밀번호 재설정 API/서비스는 현재 백엔드에 없다.
  - 스키마에는 `password_recovery_verifications`가 있으나 연결된 애플리케이션 로직이 없다.
- SRS 기준 차이:
  - `SPEC_BASELINE.md`, `OPEN_QUESTIONS.md`의 `BD-02`, `PLANS.md`의 `M1` 기준에는 계정 복구 흐름이 V1 범위 안에 있다.
- 판정:
  - 직접 충돌이라기보다 현재 코드 스냅샷의 미구현 갭이다.

### 2. 로그인 실패 보호 정책이 부분 구현 상태다

- 코드 기준 현황:
  - `user_login_security.failed_login_count`는 증가한다.
  - 인증 시 `locked_until`을 검사하는 분기는 있다.
  - 그러나 현재 mapper에는 `locked_until`을 실제로 설정하는 update가 없다.
- SRS 기준 차이:
  - SRS baseline은 로그인 실패 보호 정책을 요구한다.
- 판정:
  - 보안 요구사항 대비 불완전 구현이다.
  - 현재는 실패 횟수 추적은 있으나 실제 계정 잠금 정책이 동작한다고 보기 어렵다.

### 3. 호스트 계정 관리 API가 아직 없다

- 코드 기준 현황:
  - guest 계정 관리 API는 존재한다.
  - ops 측에는 로그인/로그아웃/현재 사용자 조회만 있고, host 자신의 프로필 수정/비밀번호 변경 API는 없다.
- SRS 기준 차이:
  - `flow.md`와 `PLANS.md M1` 기준에는 host 계정 관리가 포함되어 있다.
- 판정:
  - 현재 코드 스냅샷의 기능 갭이다.

### 4. 호스트 자산 CRUD가 아직 없다

- 코드 기준 현황:
  - ops 측에서 현재 가능한 자산성 쓰기 기능은 room block, price policy뿐이다.
  - accommodation, room type, room CRUD/비활성화 API는 없다.
- SRS 기준 차이:
  - `PLANS.md M5`, `flow.md 5.x`에는 숙소/객실타입/개별객실 관리가 포함된다.
- 판정:
  - 현재 코드 스냅샷의 기능 갭이다.

### 5. host/admin의 확정 예약 취소 플로우가 없다

- 코드 기준 현황:
  - ops 예약 상태 변경은 `approve`와 `reject`만 있다.
  - `reject`는 `PENDING` 상태에서만 가능하고, `CONFIRMED` 예약을 host/admin이 취소하는 API는 없다.
- SRS 기준 차이:
  - `flow.md 6.4`, `PLANS.md M6`에는 host 예약 취소가 별도 운영 기능으로 잡혀 있다.
- 판정:
  - 현재 코드 스냅샷의 기능 갭이다.

### 6. 관리자 운영 API가 일부만 구현되어 있다

- 코드 기준 현황:
  - admin user 조회와 host-role-request 승인/거절은 구현되어 있다.
  - audit log 조회, system log 조회, 운영 현황/통계, notice/FAQ 관리 API는 없다.
- SRS 기준 차이:
  - `PLANS.md M7`, `flow.md 7.x`에는 위 기능들이 포함되어 있다.
- 판정:
  - 현재 코드 스냅샷의 기능 갭이다.

### 7. 세션 보안 설정이 HTTPS 전제 대비 명시적으로 닫혀 있지 않다

- 코드 기준 현황:
  - 세션 쿠키는 `HttpOnly`, `SameSite=Lax`까지만 설정되어 있다.
  - `Secure` 쿠키 강제 설정은 코드에서 확인되지 않는다.
- SRS 기준 차이:
  - SRS baseline은 HTTPS 전제와 세션 보안 강화를 요구한다.
- 판정:
  - 배포 계층에서 보완할 수 있는 항목이지만, 애플리케이션 코드만 보면 보안 요구사항이 충분히 드러나지 않는다.

## Not treated as conflicts

- guest/ops 런타임 분리는 현재 코드에서 지켜지고 있다.
- 인증은 JWT가 아니라 세션 기반으로 구현되어 있다.
- 비밀번호는 bcrypt encoder를 통해 저장된다.
- 예약 접수 단위는 room type, 실제 배정 단위는 room, 운영 변경 단위는 `reservation_nights`로 구현되어 있다.
- guest는 실제 room number를 보지 못하고 직접 room을 바꾸지 못한다.
- 예약 요청 시에만 재고를 점유하고 검색/상세 조회 단계에서는 재고를 점유하지 않는다.
- `PENDING`와 `CONFIRMED`를 모두 inventory-consuming 상태로 취급한다.
- room block은 room-level only로 구현되어 있다.

## Recommended next safe documentation step

- 다음 구현 전에 이 문서를 기준으로 `STATUS.md` 또는 차기 milestone note에
  - "현재 구현 완료"
  - "SRS 대비 의도적 defer"
  - "보안 미완성"
  를 분리해서 갱신하는 것이 안전하다.
