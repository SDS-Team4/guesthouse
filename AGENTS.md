# AGENTS.md

## Mission

이 저장소의 목표는 **게스트하우스 예약 시스템**을 SRS 기준으로 계획, 구현, 검증하는 것이다.

Codex는 항상 먼저 **계획 → 검증 → 구현 → 재검증** 순서를 따른다.  
중간 규모 이상의 작업은 코드를 바로 작성하지 말고 먼저 `PLANS.md`를 확인하거나 갱신한다.

---

## Source of truth

우선순위는 아래 순서다.

1. `docs/source/SRS.pdf`
2. `docs/spec/OPEN_QUESTIONS.md`에 반영된 확정 결정
3. `docs/plan/PLANS.md`
4. `db/schema-draft.sql`

`db/schema-draft.sql`이 SRS와 충돌하면 **SRS를 우선**한다.  
충돌이 있으면 바로 구현하지 말고 문서에 남기고 확인한다.

---

## Hard constraints from SRS

### Product scope
- 결제 연동은 현재 범위 밖이다.
- OTA 채널 연동은 현재 범위 밖이다.
- 모바일 앱은 현재 범위 밖이다.
- 1차 목표는 **예약 사이클 완성 + 운영 기능 안정화**다.

### Architecture
- 게스트 서비스와 호스트/관리자 서비스는 **서로 다른 런타임/배포 단위**로 유지한다.
- 저장소는 모노레포여도 되지만, guest/ops는 빌드와 배포가 분리되어야 한다.
- 공용 코드는 `shared/` 라이브러리 레벨까지만 허용한다. 앱 간 강한 결합을 만들지 않는다.

### Auth / security
- 인증은 **세션 기반**으로 설계한다.
- JWT를 기본 인증 방식으로 도입하지 않는다.
- 비밀번호는 Bcrypt 해시로만 저장한다.
- 로그인 실패 보호 정책, 객체 단위 접근통제, HTTPS 전제, 내부 정보 비노출을 지킨다.
- 게스트는 자기 데이터만, 호스트는 자기 숙소 데이터만, 관리자는 전체 관리 권한을 가진다.

### Reservation domain
- 예약 접수 단위는 **객실 타입(room type)** 이다.
- 실제 운영 배정 단위는 **개별 객실(room)** 이다.
- 실제 객실 배정은 **reservation_night** 단위로 관리한다.
- 게스트는 실제 객실 번호를 기본적으로 볼 수 없다.
- 게스트는 직접 객실을 바꿀 수 없다.
- 예약 요청은 재고 점유를 동반해야 하며, 초과 예약이 절대 발생하면 안 된다.
- 예약 처리 전체는 하나의 트랜잭션 경계 안에서 검증한다.
- 동시성 전략이 불명확하면 추측하지 말고 질문한다.

### Data lifecycle
- 예약 이력이 있는 숙소/객실 타입/개별 객실은 삭제보다 비활성화를 우선한다.
- 감사 가능한 주요 행위는 모두 추적 가능해야 한다.
- 운영 상태 변경은 before/after 또는 충분한 사유와 함께 남긴다.

### Tech constraints
- 백엔드는 Spring Boot + MyBatis + MySQL 방향을 유지한다.
- 프론트는 guest-web / ops-web 분리 방향을 유지한다.
- Lombok을 사용하지 않는다.

---

## Required workflow

### 1) Start by reading
작업 시작 시 아래를 먼저 읽는다.

- `AGENTS.md`
- `docs/spec/SPEC_BASELINE.md`
- `docs/spec/OPEN_QUESTIONS.md`
- `docs/plan/PLANS.md`

### 2) Plan first
다음 중 하나에 해당하면 코드를 쓰기 전에 반드시 계획을 먼저 세운다.

- 새 기능 추가
- DB 변경
- API 설계
- 권한/보안 관련 변경
- 예약/재고/동시성 관련 변경
- 3개 이상 파일을 건드릴 가능성이 있는 변경

### 3) Keep scope tight
한 번에 milestone 하나만 진행한다.  
범위를 넓히지 않는다.  
밀린 TODO를 핑계로 옆 작업을 섞지 않는다.

### 4) Traceability
모든 구현 태스크는 관련 요구사항 ID를 적는다.

예시:
- REQ-F-050 ~ REQ-F-061
- REQ-NF-001 ~ REQ-NF-005
- REQ-SEC-004 ~ REQ-SEC-008

코드 변경 요약, PR 요약, 문서 업데이트에도 이 연결을 남긴다.

### 5) Validate before advancing
각 milestone 종료 시:
- 빌드
- 테스트
- lint
- 최소 1개 이상 스모크 플로우
- 문서 업데이트

검증 실패 상태로 다음 milestone으로 넘어가지 않는다.

---

## Planning rules

`docs/plan/PLANS.md`는 아래를 포함해야 한다.

- scope in / out
- milestone 정의
- 각 milestone의 acceptance criteria
- validation commands
- unresolved decisions
- risk register
- architecture notes
- requirement traceability

새 작업을 시작할 때, 현재 작업이 `PLANS.md`와 다르면 먼저 문서를 고친다.

---

## Schema rules

스키마 작업 시 다음을 점검한다.

- reservation과 reservation_night의 역할 분리
- guest-facing 데이터와 host-facing 데이터 노출 경계
- host ownership 검증이 가능한 FK/인덱스 구조
- audit logs / history / recovery code / session 관련 구조
- soft delete 또는 status 비활성화 정책
- 가격 정책 우선순위와 기간 중복 정책
- block이 실제 가용 재고 계산에서 어떻게 제외되는지

SRS와 모순되는 컬럼이나 테이블을 발견하면 바로 반영하지 말고 `OPEN_QUESTIONS.md` 또는 계획 문서에 기록한다.

---

## Coding rules

- 의미 없는 대규모 리팩터링 금지
- 관련 없는 포맷 변경 금지
- 주석은 “왜”가 필요한 곳만
- 예외 메시지에 내부 구현 세부사항 노출 금지
- 권한 검증과 데이터 검증을 클라이언트에 의존하지 말 것
- 가격/재고/권한은 서버에서 재검증할 것

---

## Deliverable style

작업 완료 응답에는 아래를 포함한다.

1. 무엇을 바꿨는지
2. 어떤 요구사항과 연결되는지
3. 무엇을 검증했는지
4. 아직 남은 갭이 무엇인지
5. 다음 가장 작은 안전한 단계가 무엇인지

---

## Done definition

아래를 만족해야 완료로 본다.

- 요구사항 ID와 연결됨
- 테스트 가능함
- 검증 명령이 있음
- 문서가 갱신됨
- 스코프 밖 기능이 섞이지 않음
- 보안/권한/동시성 가정이 명확함
