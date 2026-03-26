# Backend Smoke Codebase Understanding

기준일: 2026-03-25

이 문서는 현재 저장소의 백엔드 스모크 버전을 코드 기준으로 이해한 내용을 정리한 문서다.
SRS와 상충되는 내용은 이 문서에서 해결하지 않고, 별도 문서인 `docs/plan/CODE_SRS_CONFLICTS.md`에 기록한다.

## Traceability

- REQ-F-001 ~ REQ-F-127
- REQ-NF-001 ~ REQ-NF-007
- REQ-SEC-001 ~ REQ-SEC-008
- BR-001 ~ BR-008
- BD-01 ~ BD-08

## 1. Repository structure

현재 저장소는 모노레포 구조이며, 런타임은 guest/ops로 분리되어 있다.

- `guest-api`
  - 게스트용 Spring Boot API
- `ops-api`
  - 호스트/관리자용 Spring Boot API
- `shared/shared-domain`
  - 공통 API 응답, 예외, enum, 앱 공통 설정
- `shared/shared-auth`
  - 세션 기반 인증, Redis 세션 설정, role guard
- `shared/shared-db-conventions`
  - MyBatis mapper interface, XML mapper, DB record/param 모델
- `db/schema-v1.sql`
  - 현재 코드가 기대하는 V1 스키마 기준

## 2. Runtime split

### `guest-api`

주요 책임:

- 공개 숙소 검색/상세/캘린더 조회
- 게스트 회원가입
- 게스트 로그인/로그아웃/현재 사용자 조회
- 게스트 본인 계정 조회/수정/비밀번호 변경
- 게스트 host role request 조회/생성
- 게스트 예약 생성/목록 조회/상세 조회/취소

주요 진입점:

- [GuestAuthController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/auth/GuestAuthController.java)
- [GuestAccountController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/GuestAccountController.java)
- [GuestAccommodationController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/accommodation/GuestAccommodationController.java)
- [GuestReservationController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/GuestReservationController.java)

### `ops-api`

주요 책임:

- 호스트/관리자 로그인/로그아웃/현재 사용자 조회
- 예약 목록/상세 조회
- `PENDING` 예약 승인/거절
- `reservation_nights` 기준 실제 객실 재배정
- room-level block 조회/생성/비활성화
- room-type pricing policy 조회/생성/비활성화
- 관리자 사용자 조회
- 관리자 host-role-request 조회/승인/거절

주요 진입점:

- [OpsAuthController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/auth/OpsAuthController.java)
- [OpsReservationController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/reservation/OpsReservationController.java)
- [OpsRoomBlockController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/roomblock/OpsRoomBlockController.java)
- [OpsPricePolicyController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/pricing/OpsPricePolicyController.java)
- [AdminUserManagementController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/admin/AdminUserManagementController.java)
- [AdminHostRoleRequestController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/admin/AdminHostRoleRequestController.java)

## 3. Shared layers

### `shared-domain`

역할:

- 공통 응답 포맷 `ApiResponse`
- 공통 예외 `AppException`
- 공통 에러코드 `ErrorCode`
- 예약/사용자 관련 enum
- 글로벌 예외 처리기
- 공통 Clock / runtime properties

핵심 파일:

- [ApiResponse.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-domain/src/main/java/com/guesthouse/shared/domain/api/ApiResponse.java)
- [AppException.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-domain/src/main/java/com/guesthouse/shared/domain/api/AppException.java)
- [ErrorCode.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-domain/src/main/java/com/guesthouse/shared/domain/api/ErrorCode.java)
- [GlobalExceptionHandler.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-domain/src/main/java/com/guesthouse/shared/domain/web/GlobalExceptionHandler.java)
- [AppClockConfiguration.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-domain/src/main/java/com/guesthouse/shared/domain/config/AppClockConfiguration.java)

### `shared-auth`

역할:

- 로그인 인증 처리
- 세션 사용자 저장/조회
- `@RequireRoles` 기반 접근 제어
- Redis-backed session baseline

핵심 파일:

- [SessionAuthenticationService.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-auth/src/main/java/com/guesthouse/shared/auth/service/SessionAuthenticationService.java)
- [RoleGuardInterceptor.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-auth/src/main/java/com/guesthouse/shared/auth/session/RoleGuardInterceptor.java)
- [SessionUserArgumentResolver.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-auth/src/main/java/com/guesthouse/shared/auth/session/SessionUserArgumentResolver.java)
- [RedisSessionBaselineConfig.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-auth/src/main/java/com/guesthouse/shared/auth/config/RedisSessionBaselineConfig.java)

### `shared-db-conventions`

역할:

- MyBatis mapper interface와 XML query
- DB row record / insert param 모델
- 예약/가격/블록/권한요청/유저/감사로그 접근 캡슐화

핵심 mapper:

- [ReservationQueryMapper.xml](C:/Users/SDS/Downloads/guesthouse/shared/shared-db-conventions/src/main/resources/mappers/reservation/ReservationQueryMapper.xml)
- [ReservationInventoryMapper.xml](C:/Users/SDS/Downloads/guesthouse/shared/shared-db-conventions/src/main/resources/mappers/reservation/ReservationInventoryMapper.xml)
- [ReservationCommandMapper.xml](C:/Users/SDS/Downloads/guesthouse/shared/shared-db-conventions/src/main/resources/mappers/reservation/ReservationCommandMapper.xml)

## 4. Authentication and authorization model

현재 인증 모델은 JWT가 아니라 세션 기반이다.

- guest 로그인은 `guest-api /api/v1/auth/login`
- ops 로그인은 `ops-api /api/v1/auth/login`
- 로그인 성공 시 `SessionUser`를 HTTP session attribute에 저장한다.
- 세션 저장소 baseline은 Redis다.
- 각 런타임은 runtime 이름을 기준으로 서로 다른 세션 쿠키 이름을 사용한다.
- 엔드포인트 접근 제어는 `@RequireRoles`와 `RoleGuardInterceptor`가 담당한다.
- 메서드 인자에서 현재 세션 사용자는 `@CurrentSessionUser`로 주입된다.

현재 역할 모델:

- `GUEST`
- `HOST`
- `ADMIN`

권한 기본 규칙:

- guest-api의 쓰기성 계정/예약 엔드포인트는 대체로 `GUEST` 전용
- ops-api의 예약/블록/가격 엔드포인트는 `HOST` 또는 `ADMIN`
- admin 전용 기능은 class-level `@RequireRoles(UserRole.ADMIN)`으로 잠금

## 5. Reservation domain understanding

현재 코드 기준 예약 도메인은 다음처럼 동작한다.

- 예약 접수 단위는 `room_type`
- 실제 운영 배정 단위는 `room`
- 실제 배정 기록 단위는 `reservation_nights`
- 예약 생성 시점에 nightly room assignment가 같이 만들어진다
- 생성 직후 예약 상태는 `PENDING`
- `PENDING`와 `CONFIRMED`는 모두 inventory-consuming 상태
- guest는 실제 room number를 보지 못한다
- host/admin만 nightly reassignment를 수행할 수 있다

핵심 서비스:

- [ReservationRequestService.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/service/ReservationRequestService.java)
- [GuestReservationQueryService.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/service/GuestReservationQueryService.java)
- [GuestReservationCancellationService.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/service/GuestReservationCancellationService.java)
- [ReservationDecisionService.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/reservation/service/ReservationDecisionService.java)
- [ReservationReassignmentService.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/reservation/service/ReservationReassignmentService.java)

### Reservation create flow

예약 생성 흐름은 대략 다음 순서다.

1. 요청 검증
2. `room_type` row lock
3. 해당 room type의 active room row lock
4. stay 기간의 active room block 조회 및 lock
5. stay 기간의 occupied room night 조회 및 lock
6. 날짜별 first-fit 방식으로 방 배정
7. `reservations` insert
8. `reservation_nights` bulk insert
9. `reservation_status_history`에 `REQUESTED/PENDING` 기록

이 흐름은 `@Transactional` 안에서 수행된다.

### Reservation decision flow

호스트/관리자의 승인/거절은 다음 원칙으로 구현되어 있다.

- 대상 예약을 `FOR UPDATE`로 lock
- host는 자기 숙소 예약만 처리 가능
- admin은 전체 가능
- 승인 가능 상태는 현재 `PENDING`만
- 승인 시 `CONFIRMED`
- 거절 시 `CANCELLED`
- 상태 이력과 감사로그를 함께 남김

### Reassignment flow

nightly reassignment는 다음 규칙을 따른다.

- 변경 대상은 `reservation_night_id`
- 대상 예약은 `PENDING` 또는 `CONFIRMED`여야 함
- 과거 숙박일은 변경 불가
- 같은 숙소 내 active room만 배정 가능
- blocked room, occupied room은 재배정 대상에서 제외
- reservation header의 room type은 원래 예약 기준을 유지할 수 있고, nightly assigned room은 다른 room type으로 이동 가능

## 6. Availability, block, pricing model

### Availability read model

숙소 검색/상세/캘린더는 모두 읽기 전용이다.

- 검색/상세 단계에서 inventory를 점유하지 않음
- active rooms 기준으로 재고 계산
- active room block 제외
- `PENDING`, `CONFIRMED` 예약의 occupied room night 제외
- guestCount가 room type `max_capacity`를 넘으면 조건 불일치 처리

핵심 서비스:

- [GuestAccommodationReadService.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/accommodation/service/GuestAccommodationReadService.java)

### Room block model

현재 block 모델은 room-level only다.

- target은 `room_id`
- 기간 겹치는 active block 생성은 거절
- 상태는 `ACTIVE`/`INACTIVE`
- guest availability와 ops reassignment가 모두 active block만 읽음

핵심 서비스:

- [OpsRoomBlockCommandService.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/roomblock/service/OpsRoomBlockCommandService.java)

### Pricing model

현재 가격 정책은 additive delta 방식이다.

- target은 `room_type_id`
- 기간 중첩 허용
- `base_price + sum(applicable active delta)` 방식
- `day_of_week_mask` 지원
- percent mode는 없음

핵심 서비스:

- [OpsPricePolicyCommandService.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/pricing/service/OpsPricePolicyCommandService.java)
- [GuestAccommodationReadService.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/accommodation/service/GuestAccommodationReadService.java)

## 7. Account and role-request model

### Guest signup

현재 회원가입은 다음을 수행한다.

- loginId / email / phone 중복 검사
- bcrypt password hash 저장
- `users` 생성
- `user_login_security` 초기 row 생성
- published required terms 조회 후 `user_term_agreements` 저장

핵심 서비스:

- [GuestSignupService.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/auth/service/GuestSignupService.java)

### Guest self account management

현재 guest는 다음을 할 수 있다.

- 본인 프로필 조회
- 본인 프로필 수정
- 본인 비밀번호 변경

핵심 서비스:

- [GuestAccountProfileService.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/service/GuestAccountProfileService.java)

### Host role request

현재 host role request 모델은 다음과 같다.

- active guest만 요청 가능
- pending request 중복 생성 불가
- 이미 승인된 사용자 재요청 불가
- denied 이력 후 재요청은 가능
- admin 승인 시 `users.role`이 `GUEST`에서 `HOST`로 승격

핵심 서비스:

- [GuestHostRoleRequestService.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/service/GuestHostRoleRequestService.java)
- [AdminHostRoleRequestCommandService.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/admin/service/AdminHostRoleRequestCommandService.java)

## 8. Database model snapshot

현재 코드가 기대하는 주요 테이블:

- `users`
- `user_login_security`
- `host_role_requests`
- `password_recovery_verifications`
- `accommodations`
- `room_types`
- `rooms`
- `reservations`
- `reservation_nights`
- `reservation_status_history`
- `price_policies`
- `room_blocks`
- `terms`
- `user_term_agreements`
- `audit_logs`
- `system_logs`
- `notices`
- `notice_attachments`

핵심 기준 파일:

- [schema-v1.sql](C:/Users/SDS/Downloads/guesthouse/db/schema-v1.sql)

## 9. Audit and history

현재 코드에는 감사 추적이 일부 구현되어 있다.

- reservation approve/reject/reassign
- room block create/deactivate
- price policy create/deactivate
- host role request create/approve/reject

구현 방식:

- 예약 상태 변경은 `reservation_status_history`
- 운영성 행위는 `audit_logs`

현재 감사로그는 “쓰기” 중심 구현이 먼저 들어와 있고, admin 조회 API는 아직 확인되지 않았다.

## 10. Current implementation boundary

현재 백엔드 스모크 버전에서 “이미 들어와 있는 것”과 “아직 비어 있는 것”을 구분하면 다음과 같다.

### 이미 구현된 축

- 세션 로그인
- guest signup
- guest self account management
- 공개 숙소 탐색
- guest reservation create/read/cancel
- host/admin reservation decision and reassignment
- room block management
- pricing management
- admin user read
- admin host-role-request review

### 아직 비어 있거나 부분적인 축

- account recovery
- host self account management
- accommodation / room type / room CRUD
- host/admin confirmed reservation cancel
- admin audit/system-log/notice/faq read-write
- 로그인 잠금정책의 완전한 enforcement

## 11. Validation note

이번 이해 작업에서 수행한 검증:

- 컨트롤러, 서비스, MyBatis XML, 스키마를 교차 확인했다.
- `guest-api`와 `ops-api` 빌드를 시도했다.
- 다만 Gradle wrapper가 `gradle-8.10.2` 다운로드를 필요로 했고, 샌드박스 네트워크 제한 때문에 실제 빌드 완료까지는 검증하지 못했다.

## 12. Related docs

- [CODE_SRS_CONFLICTS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODE_SRS_CONFLICTS.md)
- [PLANS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/PLANS.md)
- [STATUS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/STATUS.md)
- [OPEN_QUESTIONS.md](C:/Users/SDS/Downloads/guesthouse/docs/spec/OPEN_QUESTIONS.md)
