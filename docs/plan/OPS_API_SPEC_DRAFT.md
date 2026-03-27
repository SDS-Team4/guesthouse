# ops API Specification Draft

## 문서 정보
- 서비스: `ops`
- 문서 목적: 현재 저장소의 `ops-api`와 `ops-web` 구현을 기준으로 운영자용 API 계약을 역공학적으로 정리
- source of truth:
  - 1순위: 현재 `ops-api` 구현 코드
  - 2순위: 현재 `ops-web` 실제 호출 코드와 UI DTO
  - 3순위: 관련 controller web test / service test
- 주의사항:
  - 이 문서는 SRS보다 현재 구현 코드를 우선한다.
  - `guest-api`는 범위 밖이다.
  - 구현 API와 UI에 필요하지만 아직 없는 API를 분리해서 적는다.
  - 확인 불가 항목은 `코드상 확인 필요`로 표기한다.

## 분석 범위
- backend:
  - `ops-api/src/main/java/**`
  - `ops-api/src/test/java/**`
  - `shared/shared-auth/**`
  - `shared/shared-domain/**`
  - `shared/shared-db-conventions/**`
- frontend:
  - 요청받은 `ops-web/src/features/**/api.ts`, `ops-web/src/features/**/api-contract.ts`, `ops-web/src/app/**`는 현재 저장소에 없음
  - 실제 확인 대상:
    - `ops-web/src/App.tsx`
    - `ops-web/src/lib/api.ts`
    - `ops-web/src/lib/types.ts`
    - `ops-web/src/lib/format.ts`
    - `ops-web/src/pages/**/*.tsx`
- planning/docs:
  - `docs/plan/PLANS.md`
  - `docs/spec/OPEN_QUESTIONS.md`
  - 요청받은 `docs/plan/OPS_UI_CONTRACT_MATRIX.md`, `docs/plan/UI_BACKEND_ALIGNMENT_REVIEW.md`는 현재 저장소에 없음

---

## 한눈에 보는 Summary

### 구현 상태 요약
| 카테고리 | 상태 | 비고 |
|---|---|---|
| auth | implemented | 세션 기반 로그인/로그아웃/현재 사용자 조회 |
| host reservations | implemented | 목록, 상세, 캘린더, 승인, 반려, 취소, 재배정, swap |
| host room blocks | implemented | 조회/생성/비활성화 |
| host pricing | implemented | 조회/생성/비활성화 |
| host properties / room types / rooms | implemented | host 전용 자산 관리 CRUD 일부 완료 |
| host dashboard/account | partial | dashboard는 조합형, account API 없음 |
| admin users | implemented | 목록/상세 |
| admin host role requests | implemented | 목록/상세/승인/반려 |
| admin dashboard | partial | 조합형, 전용 API 없음 |
| admin audit/system logs | missing | UI/API 없음 |
| admin notices/terms | missing | UI/API 없음 |

### review 포인트
- 현재 source of truth는 `ops-api`와 실제 `ops-web` 호출 코드다.
- `ops-web/src/features/**`, `ops-web/src/app/**`는 현재 저장소에 없고, 실제 계약 코드는 `src/App.tsx`, `src/lib/*`, `src/pages/*`에 있다.
- host/admin dashboard는 전용 API가 아니라 기존 live API를 조합해 화면을 만든다.
- host/account, admin logs/notices/terms는 현재 구현 갭이다.

## 공통 규칙

### Base URL
- `/api/v1`

### Authentication
- 세션 기반
- 세션 key: `SESSION_USER`
- 보호 endpoint 무세션 접근: `401 UNAUTHORIZED`
- 역할 불일치: `403 FORBIDDEN`
- `ops-web`는 `credentials: 'include'`로 호출

### Response Envelope
```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2026-03-26T18:00:00+09:00"
}
```

### 대표 공통 에러 코드
| Code | 의미 |
|---|---|
| `INVALID_REQUEST` | validation/type mismatch 또는 도메인 검증 실패 |
| `NOT_FOUND` | 리소스 없음 |
| `INVALID_CREDENTIALS` | 로그인 실패 |
| `ACCOUNT_LOCKED` | 로그인 잠금 |
| `UNAUTHORIZED` | 인증 필요 |
| `FORBIDDEN` | 권한 없음 또는 host ownership 위반 |
| `HOST_ROLE_REQUEST_NOT_ALLOWED` | 승인 불가 사용자 |
| `HOST_ROLE_REQUEST_ALREADY_REVIEWED` | 이미 검토된 요청 |
| `INTERNAL_ERROR` | 미처리 서버 오류 |

## Host API 상세

## auth

### Login
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/auth/login`
- 인증 필요 여부: 불필요
- 허용 역할: 공개 endpoint, 성공 로그인 대상은 `HOST`, `ADMIN`
- ops-web 사용 화면: `ops-web/src/pages/ops/LoginPage.tsx`
- source file:
  - `ops-api/src/main/java/com/guesthouse/opsapi/auth/OpsAuthController.java`
  - `shared/shared-auth/src/main/java/com/guesthouse/shared/auth/service/SessionAuthenticationService.java`
  - `ops-api/src/test/java/com/guesthouse/opsapi/auth/OpsAuthControllerWebTest.java`
- 관련 요구사항 ID: `REQ-SEC-001 ~ REQ-SEC-008`, `REQ-NF-003 ~ REQ-NF-007`

#### Request
| 구분 | 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| body | `loginId` | `string` | 예 | `@NotBlank` |
| body | `password` | `string` | 예 | `@NotBlank` |

```json
{
  "loginId": "host.demo",
  "password": "secret"
}
```

#### Response
| Field | Type |
|---|---|
| `userId` | `number` |
| `loginId` | `string` |
| `name` | `string` |
| `role` | `"HOST" | "ADMIN"` |

```json
{
  "success": true,
  "data": {
    "userId": 2001,
    "loginId": "host.demo",
    "name": "Host Demo",
    "role": "HOST"
  },
  "error": null,
  "timestamp": "2026-03-26T18:00:00+09:00"
}
```

#### 에러/실패 케이스
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | body 누락/blank |
| `401` | `INVALID_CREDENTIALS` | 잘못된 계정 |
| `403` | `FORBIDDEN` | `HOST`/`ADMIN` 외 역할 |
| `423` | `ACCOUNT_LOCKED` | 계정 잠금 |

### Logout
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/auth/logout`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `OpsShell` logout action
- source file: `OpsAuthController.logout`
- 관련 요구사항 ID: `REQ-SEC-001 ~ REQ-SEC-008`

#### Request
- body 없음

#### Response
```json
{
  "success": true,
  "data": {
    "loggedOut": true
  },
  "error": null,
  "timestamp": "2026-03-26T18:00:00+09:00"
}
```

#### 에러/실패 케이스
| HTTP | code | 조건 |
|---|---|---|
| `401` | `UNAUTHORIZED` | 세션 없음 |
| `403` | `FORBIDDEN` | 역할 불일치 |

### Current User
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/auth/me`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `App.tsx` bootstrap
- source file: `OpsAuthController.currentUser`
- 관련 요구사항 ID: `REQ-SEC-001 ~ REQ-SEC-008`

#### Response
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "loginId": "admin.demo",
    "name": "Admin Demo",
    "role": "ADMIN"
  },
  "error": null,
  "timestamp": "2026-03-26T18:00:00+09:00"
}
```

#### 에러/실패 케이스
| HTTP | code | 조건 |
|---|---|---|
| `401` | `UNAUTHORIZED` | 세션 없음 |
| `403` | `FORBIDDEN` | 역할 불일치 |

## host reservations

### Reservation List
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/reservations`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면:
  - `ops-web/src/pages/ops/ReservationsPage.tsx`
  - `ops-web/src/pages/host/HostDashboardPage.tsx`
  - `ops-web/src/pages/admin/AdminDashboardPage.tsx`
- source file:
  - `OpsReservationController.findReservations`
  - `OpsReservationQueryService.findReservations`
  - `OpsReservationControllerWebTest`
- 관련 요구사항 ID: `REQ-F-076 ~ REQ-F-095`

#### Query
| Name | Type | Required | 설명 |
|---|---|---|---|
| `status` | `PENDING | CONFIRMED | CANCELLED` | 아니오 | 없으면 전체 |

```json
{}
```

#### Response 구조
- `ReservationSummary[]`
- UI DTO: `ops-web/src/lib/types.ts#ReservationSummary`

```json
{
  "success": true,
  "data": [
    {
      "reservationId": 901,
      "reservationNo": "R-20260326-0001",
      "guestUserId": 3001,
      "guestLoginId": "guest1",
      "guestName": "Kim Guest",
      "accommodationId": 101,
      "accommodationName": "River House",
      "roomTypeId": 201,
      "roomTypeName": "Deluxe Twin",
      "guestCount": 2,
      "checkInDate": "2026-04-10",
      "checkOutDate": "2026-04-12",
      "status": "PENDING",
      "requestedAt": "2026-03-26T10:00:00+09:00",
      "confirmedAt": null,
      "cancelledAt": null,
      "reassignmentPossible": true,
      "hasRelevantBlocks": false,
      "hasRelevantPricing": true
    }
  ],
  "error": null,
  "timestamp": "2026-03-26T18:00:00+09:00"
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `401` | `UNAUTHORIZED` | 세션 없음 |
| `403` | `FORBIDDEN` | 역할 불일치 |
| `400` | `INVALID_REQUEST` | `status` enum 변환 실패 |

### Reservation Pending Alias
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/reservations/pending`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: 현재 직접 미사용
- source file: `OpsReservationController.findPendingReservations`
- 관련 요구사항 ID: `REQ-F-076 ~ REQ-F-095`

#### 비고
- 내부적으로 `status=PENDING` 목록 조회의 alias
- deprecated 여부는 코드상 확인 필요

### Reservation Calendar
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/reservations/calendar`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `ops-web/src/pages/host/HostReservationCalendarPage.tsx`
- source file:
  - `OpsReservationController.findReservationCalendar`
  - `OpsReservationQueryService.getReservationCalendar`
  - `OpsReservationQueryServiceTest`
- 관련 요구사항 ID: `REQ-F-076 ~ REQ-F-095`, `UI-HOST-008 ~ UI-HOST-009`

#### Query
| Name | Type | Required | 설명 |
|---|---|---|---|
| `accommodationId` | `number` | 아니오 | 없으면 접근 가능한 첫 숙소 |
| `startDate` | `YYYY-MM-DD` | 예 | 시작 날짜 |
| `days` | `number` | 아니오 | 서버 기본 `7`, 허용 범위 `1..365`, 현재 ops-web은 `365` 고정 전송 |

#### Response 구조
- wire DTO: `OpsReservationCalendarResponse`
- UI DTO: `ReservationCalendarView`

```json
{
  "success": true,
  "data": {
    "selectedAccommodationId": 101,
    "startDate": "2026-03-26",
    "endDateExclusive": "2027-03-26",
    "visibleDates": ["2026-03-26", "2026-03-27"],
    "accommodations": [
      {
        "accommodationId": 101,
        "accommodationName": "River House",
        "region": "SEOUL"
      }
    ],
    "roomTypes": [
      {
        "roomTypeId": 201,
        "roomTypeName": "Deluxe Twin",
        "rooms": [
          {
            "roomId": 301,
            "roomCode": "301"
          }
        ]
      }
    ],
    "reservations": [
      {
        "reservationId": 901,
        "reservationNo": "R-20260326-0001",
        "guestLoginId": "guest1",
        "guestName": "Kim Guest",
        "guestCount": 2,
        "roomTypeId": 201,
        "roomTypeName": "Deluxe Twin",
        "status": "PENDING",
        "checkInDate": "2026-04-10",
        "checkOutDate": "2026-04-12",
        "requestedAt": "2026-03-26T10:00:00+09:00",
        "reassignmentPossible": true
      }
    ],
    "assignmentCells": [
      {
        "reservationId": 901,
        "reservationNightId": 9901,
        "stayDate": "2026-04-10",
        "assignedRoomId": 301,
        "assignedRoomCode": "301",
        "assignedRoomTypeId": 201,
        "assignedRoomTypeName": "Deluxe Twin",
        "reassignmentAllowed": true
      }
    ],
    "blockCells": [
      {
        "blockId": 701,
        "roomId": 302,
        "stayDate": "2026-04-10",
        "reasonType": "MAINTENANCE",
        "reasonText": "AC repair"
      }
    ]
  },
  "error": null,
  "timestamp": "2026-03-26T18:00:00+09:00"
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | `startDate`/`days` type mismatch |
| `400` | `INVALID_REQUEST` | `days < 1` 또는 `days > 365` |
| `403` | `FORBIDDEN` | host가 자기 숙소가 아닌 `accommodationId` 요청 |
| `401` | `UNAUTHORIZED` | 세션 없음 |

#### 비즈니스 규칙
- host ownership 검증 포함
- 접근 가능한 숙소가 없으면 빈 calendar view 반환
- active room만 room rows에 노출
- `reassignmentAllowed`는 상태/날짜 조건을 반영

### Reservation Detail
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/reservations/{reservationId}`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면:
  - `ops-web/src/pages/ops/ReservationDetailPage.tsx`
  - `HostReservationCalendarPage.tsx` side panel
- source file:
  - `OpsReservationController.findReservationDetail`
  - `OpsReservationQueryService.getReservationDetail`
  - `OpsReservationControllerWebTest`
- 관련 요구사항 ID: `REQ-F-076 ~ REQ-F-095`

#### Path
| Name | Type | Required | 설명 |
|---|---|---|---|
| `reservationId` | `number` | 예 | 숫자만 허용되는 path |

#### Response 구조
- wire DTO: `OpsReservationDetailResponse`
- UI DTO: `ReservationDetail`
- 주요 필드:
  - guest/accommodation/roomType summary
  - nightly assignments
  - status history
  - block contexts
  - pricing policies

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `404` | `NOT_FOUND` | 예약 없음 |
| `403` | `FORBIDDEN` | host ownership 위반 |
| `400` | `INVALID_REQUEST` | 비숫자 path |

### Approve Reservation
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/reservations/{reservationId}/approve`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: reservations, detail, calendar
- source file:
  - `OpsReservationController.approveReservation`
  - `ReservationDecisionService.approveReservation`
  - `ReservationDecisionServiceTest`
- 관련 요구사항 ID: `REQ-F-076 ~ REQ-F-095`

```json
{}
```

```json
{
  "success": true,
  "data": {
    "reservationId": 901,
    "reservationNo": "R-20260326-0001",
    "status": "CONFIRMED",
    "changedAt": "2026-03-26T18:00:00+09:00"
  },
  "error": null,
  "timestamp": "2026-03-26T18:00:00+09:00"
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `403` | `FORBIDDEN` | host ownership 위반 |
| `400` | `INVALID_REQUEST` | `PENDING`가 아닌 상태 |
| `404` | `NOT_FOUND` | 예약 없음 |

### Reject Reservation
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/reservations/{reservationId}/reject`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: reservations, detail, calendar
- source file:
  - `OpsReservationController.rejectReservation`
  - `ReservationDecisionService.rejectReservation`
- 관련 요구사항 ID: `REQ-F-076 ~ REQ-F-095`

#### Request Body
```json
{
  "reasonText": "Need maintenance"
}
```

#### 비고
- body 전체가 optional
- `reasonText`가 비어도 controller 레벨 validation은 없음
- 실제 기본 문구 대체는 service 로직에서 처리

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | `PENDING`가 아닌 상태 |
| `403` | `FORBIDDEN` | host ownership 위반 |

### Cancel Reservation
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/reservations/{reservationId}/cancel`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: reservation detail, calendar side panel
- source file:
  - `OpsReservationController.cancelReservation`
  - `CancelReservationRequest`
  - `ReservationDecisionService.cancelReservation`
  - `OpsReservationControllerWebTest`
- 관련 요구사항 ID: `REQ-F-076 ~ REQ-F-095`

#### Request Body
```json
{
  "reasonText": "Guest requested cancellation"
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | `reasonText` blank 또는 500자 초과 |
| `400` | `INVALID_REQUEST` | `PENDING`, `CONFIRMED` 외 상태 |
| `403` | `FORBIDDEN` | host ownership 위반 |

### Reassign Reservation Nights
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/reservations/{reservationId}/reassign`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: reservation detail, calendar
- source file:
  - `OpsReservationController.reassignReservation`
  - `ReservationReassignmentService.reassignReservation`
  - `ReservationReassignmentServiceTest`
- 관련 요구사항 ID: `REQ-F-076 ~ REQ-F-095`

#### Request Body
```json
{
  "changes": [
    {
      "reservationNightId": 9901,
      "assignedRoomId": 302
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "reservationId": 901,
    "reservationNo": "R-20260326-0001",
    "changedNightCount": 1,
    "changedAt": "2026-03-26T18:00:00+09:00"
  },
  "error": null,
  "timestamp": "2026-03-26T18:00:00+09:00"
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | changes 비어 있음 |
| `400` | `INVALID_REQUEST` | 다른 reservation 소속 night 포함 |
| `400` | `INVALID_REQUEST` | 중복 night |
| `400` | `INVALID_REQUEST` | 과거 날짜 night |
| `400` | `INVALID_REQUEST` | blocked room 또는 occupied room |
| `403` | `FORBIDDEN` | host ownership 위반 |

### Swap Reservation Nights
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/reservations/swap-nights`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `HostReservationCalendarPage.tsx`
- source file:
  - `OpsReservationController.swapReservationNights`
  - `SwapReservationNightRequest`
  - `ReservationReassignmentService.swapReservationNights`
  - `ReservationReassignmentServiceTest`
- 관련 요구사항 ID: `REQ-F-076 ~ REQ-F-095`

#### Request Body
```json
{
  "sourceReservationId": 901,
  "sourceReservationNightId": 9901,
  "targetReservationId": 902,
  "targetReservationNightId": 9902
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | source/target 누락 |
| `400` | `INVALID_REQUEST` | 같은 night끼리 swap |
| `400` | `INVALID_REQUEST` | 서로 다른 stayDate |
| `400` | `INVALID_REQUEST` | blocked room 포함 |
| `400` | `INVALID_REQUEST` | 과거 night |
| `403` | `FORBIDDEN` | host ownership 위반 |

## host room blocks

### Room Block Management View
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/room-blocks`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `RoomBlocksPage.tsx`
- source file:
  - `OpsRoomBlockController.findRoomBlocks`
  - `OpsRoomBlockQueryService.getRoomBlockManagementView`
  - `OpsRoomBlockControllerWebTest`
  - `OpsRoomBlockQueryServiceTest`
- 관련 요구사항 ID: `REQ-F-096 ~ REQ-F-106`

#### Query
| Name | Type | Required | 설명 |
|---|---|---|---|
| `accommodationId` | `number` | 아니오 | 대상 숙소 |
| `roomId` | `number` | 아니오 | 대상 room filter |

#### Response 구조
- wire DTO: `OpsRoomBlockManagementResponse`
- UI DTO: `RoomBlockManagement`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `403` | `FORBIDDEN` | 접근 불가 숙소 조회 |
| `401` | `UNAUTHORIZED` | 세션 없음 |

### Create Room Block
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/room-blocks`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `RoomBlocksPage.tsx`
- source file:
  - `OpsRoomBlockController.createRoomBlock`
  - `CreateRoomBlockRequest`
  - `OpsRoomBlockCommandService.createRoomBlock`
  - `OpsRoomBlockCommandServiceTest`
- 관련 요구사항 ID: `REQ-F-096 ~ REQ-F-106`

#### Request Body
```json
{
  "roomId": 301,
  "startDate": "2026-04-20",
  "endDate": "2026-04-22",
  "reasonType": "HOST_BLOCK",
  "reasonText": "Deep cleaning"
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | start/end invalid |
| `400` | `INVALID_REQUEST` | 허용되지 않은 `reasonType` |
| `403` | `FORBIDDEN` | host ownership 위반 |
| `404` | `NOT_FOUND` | room 없음 |
| `409` | `INVALID_REQUEST` | active overlapping block 존재 |

### Deactivate Room Block
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/room-blocks/{blockId}/deactivate`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `RoomBlocksPage.tsx`
- source file: `OpsRoomBlockController.deactivateRoomBlock`
- 관련 요구사항 ID: `REQ-F-096 ~ REQ-F-106`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `403` | `FORBIDDEN` | host ownership 위반 |
| `404` | `NOT_FOUND` | block 없음 |
| `409` | `INVALID_REQUEST` | 이미 inactive |

## host pricing

### Price Policy Management View
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/price-policies`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `PricingPage.tsx`
- source file:
  - `OpsPricePolicyController.findPricePolicies`
  - `OpsPricePolicyQueryService.getPricePolicyManagementView`
  - `OpsPricePolicyQueryServiceTest`
- 관련 요구사항 ID: `REQ-F-096 ~ REQ-F-106`

#### Query
| Name | Type | Required | 설명 |
|---|---|---|---|
| `accommodationId` | `number` | 아니오 | 대상 숙소 |
| `roomTypeId` | `number` | 아니오 | room type filter |

### Create Price Policy
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/price-policies`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `PricingPage.tsx`
- source file:
  - `OpsPricePolicyController.createPricePolicy`
  - `CreatePricePolicyRequest`
  - `OpsPricePolicyCommandService.createPricePolicy`
  - `OpsPricePolicyCommandServiceTest`
- 관련 요구사항 ID: `REQ-F-096 ~ REQ-F-106`

#### Request Body
```json
{
  "roomTypeId": 201,
  "policyName": "Weekend uplift",
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "deltaAmount": 15000,
  "dayOfWeekMask": 48
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | 날짜 범위/필수 필드 invalid |
| `403` | `FORBIDDEN` | host ownership 위반 |
| `404` | `NOT_FOUND` | room type 없음 |

### Deactivate Price Policy
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/price-policies/{policyId}/deactivate`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`, `ADMIN`
- ops-web 사용 화면: `PricingPage.tsx`
- source file: `OpsPricePolicyController.deactivatePricePolicy`
- 관련 요구사항 ID: `REQ-F-096 ~ REQ-F-106`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `403` | `FORBIDDEN` | host ownership 위반 |
| `404` | `NOT_FOUND` | policy 없음 |
| `409` | `INVALID_REQUEST` | 이미 inactive |

## host properties

### Accommodation List
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/host/accommodations`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file:
  - `HostAssetController.findAccommodations`
  - `HostAssetService.findAccommodations`
  - `HostAssetControllerWebTest`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

#### Response 구조
- wire DTO: `HostAccommodationSummaryResponse[]`
- UI DTO: `AccommodationSummary[]`

### Accommodation Detail
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/host/accommodations/{accommodationId}`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.getAccommodationDetail`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `404` | `NOT_FOUND` | host 소유 숙소가 아님 또는 없음 |

### Create Accommodation
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/host/accommodations`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.createAccommodation`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

#### Request Body
```json
{
  "name": "River House",
  "address": "123 Hangang-ro",
  "region": "SEOUL",
  "infoText": "Near the river",
  "checkInTime": "15:00:00",
  "checkOutTime": "11:00:00"
}
```

#### Validation
| Field | Rule |
|---|---|
| `name` | required, `max 100` |
| `address` | required, `max 255` |
| `region` | required, `max 50` |
| `infoText` | optional, `max 5000` |
| `checkInTime` | required |
| `checkOutTime` | required |

### Update Accommodation
- 현재 구현 상태: `implemented`
- Method: `PUT`
- Path: `/api/v1/host/accommodations/{accommodationId}`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.updateAccommodation`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

### Deactivate Accommodation
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/host/accommodations/{accommodationId}/deactivate`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.deactivateAccommodation`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `409` | `INVALID_REQUEST` | 이미 inactive |
| `409` | `INVALID_REQUEST` | active reservations 존재 |
| `404` | `NOT_FOUND` | 소유 숙소 아님/없음 |

## host room types

### Create Room Type
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/host/accommodations/{accommodationId}/room-types`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.createRoomType`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

#### Request Body
```json
{
  "name": "Deluxe Twin",
  "baseCapacity": 2,
  "maxCapacity": 4,
  "basePrice": 120000
}
```

#### Validation
| Field | Rule |
|---|---|
| `name` | required, `max 100` |
| `baseCapacity` | `>= 1` |
| `maxCapacity` | `>= 1`, service에서 `max >= base` 확인 |
| `basePrice` | `>= 0` |

### Update Room Type
- 현재 구현 상태: `implemented`
- Method: `PUT`
- Path: `/api/v1/host/room-types/{roomTypeId}`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.updateRoomType`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

### Deactivate Room Type
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/host/room-types/{roomTypeId}/deactivate`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.deactivateRoomType`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `409` | `INVALID_REQUEST` | active reservations by room type |
| `409` | `INVALID_REQUEST` | 이미 inactive |

### Create Room
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/host/accommodations/{accommodationId}/rooms`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.createRoom`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

#### Request Body
```json
{
  "roomTypeId": 201,
  "roomCode": "301",
  "status": "ACTIVE",
  "memo": "River side"
}
```

#### Validation / Rules
| 항목 | 규칙 |
|---|---|
| `roomTypeId` | required |
| `roomCode` | required, `max 20` |
| `status` | optional, `ACTIVE | MAINTENANCE | INACTIVE`, blank면 `ACTIVE` |
| `memo` | optional, `max 5000` |
| service rule | 숙소와 roomType 소속 일치 필요 |
| service rule | accommodation, roomType 모두 active여야 생성 가능 |

### Update Room
- 현재 구현 상태: `implemented`
- Method: `PUT`
- Path: `/api/v1/host/rooms/{roomId}`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.updateRoom`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | 잘못된 status |
| `409` | `INVALID_REQUEST` | future active assignments가 있는데 `ACTIVE` 외 상태로 변경 |

### Deactivate Room
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/host/rooms/{roomId}/deactivate`
- 인증 필요 여부: 필요
- 허용 역할: `HOST`
- ops-web 사용 화면: `HostPropertiesPage.tsx`
- source file: `HostAssetController.deactivateRoom`
- 관련 요구사항 ID: `REQ-F-114 ~ REQ-F-120`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `409` | `INVALID_REQUEST` | future active assignments 존재 |
| `409` | `INVALID_REQUEST` | 이미 inactive |

## host dashboard/account

### Host Dashboard API
- 현재 구현 상태: `partial`
- 상태 설명: 전용 backend API 없음
- 현재 UI 구현:
  - `ops-web/src/pages/host/HostDashboardPage.tsx`
  - `reservations`, `room-blocks`, `price-policies` 데이터를 클라이언트에서 조합
- source file:
  - `ops-web/src/App.tsx`
  - `ops-web/src/pages/host/HostDashboardPage.tsx`
- 관련 요구사항 ID: `UI-HOST-002`

### Host Account API
- 현재 구현 상태: `missing`
- 상태 설명: host 전용 profile/account API와 페이지가 현재 ops 코드베이스에 없음

---

## Admin API 상세

## admin users

### Admin User List
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/admin/users`
- 인증 필요 여부: 필요
- 허용 역할: `ADMIN`
- ops-web 사용 화면:
  - `ops-web/src/pages/admin/AdminUsersPage.tsx`
  - `AdminDashboardPage.tsx` count source
- source file:
  - `AdminUserManagementController.findUsers`
  - `AdminUserQueryService.findUsers`
  - `AdminUserManagementControllerWebTest`
- 관련 요구사항 ID: `UI-ADMIN-003`, `REQ-SEC-001 ~ REQ-SEC-008`

#### Response 구조
- wire DTO: `AdminUserSummaryResponse[]`
- UI DTO: `AdminUserSummary[]`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `401` | `UNAUTHORIZED` | 세션 없음 |
| `403` | `FORBIDDEN` | host가 접근 |

### Admin User Detail
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/admin/users/{userId}`
- 인증 필요 여부: 필요
- 허용 역할: `ADMIN`
- ops-web 사용 화면: `AdminUsersPage.tsx`
- source file:
  - `AdminUserManagementController.getUserDetail`
  - `AdminUserQueryService.getUserDetail`
  - `AdminUserQueryServiceTest`
- 관련 요구사항 ID: `UI-ADMIN-003`

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `404` | `NOT_FOUND` | user 없음 |
| `403` | `FORBIDDEN` | host 접근 |

## admin host role requests

### Host Role Request List
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/admin/host-role-requests`
- 인증 필요 여부: 필요
- 허용 역할: `ADMIN`
- ops-web 사용 화면:
  - `AdminRoleRequestsPage.tsx`
  - `AdminDashboardPage.tsx`
- source file:
  - `AdminHostRoleRequestController.findRequests`
  - `AdminHostRoleRequestQueryService.findRequests`
  - `AdminHostRoleRequestControllerWebTest`
- 관련 요구사항 ID: `UI-ADMIN-004`

#### Query
| Name | Type | Required | 설명 |
|---|---|---|---|
| `status` | `string` | 아니오 | `PENDING`, `APPROVED`, `DENIED`, `ALL` 또는 null/blank |

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | invalid status filter |
| `403` | `FORBIDDEN` | host 접근 |

### Host Role Request Detail
- 현재 구현 상태: `implemented`
- Method: `GET`
- Path: `/api/v1/admin/host-role-requests/{requestId}`
- 인증 필요 여부: 필요
- 허용 역할: `ADMIN`
- ops-web 사용 화면: `AdminRoleRequestsPage.tsx`
- source file: `AdminHostRoleRequestController.getRequestDetail`
- 관련 요구사항 ID: `UI-ADMIN-004`

### Approve Host Role Request
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/admin/host-role-requests/{requestId}/approve`
- 인증 필요 여부: 필요
- 허용 역할: `ADMIN`
- ops-web 사용 화면: `AdminRoleRequestsPage.tsx`
- source file:
  - `AdminHostRoleRequestController.approveRequest`
  - `AdminHostRoleRequestCommandService.approveRequest`
  - `AdminHostRoleRequestCommandServiceTest`
- 관련 요구사항 ID: `UI-ADMIN-004`

#### Request Body
```json
{
  "reviewReason": "Verified operator"
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | 이미 reviewed 또는 pending 아님 |
| `400` | `HOST_ROLE_REQUEST_NOT_ALLOWED` | user 상태/역할이 승인 불가 |
| `404` | `NOT_FOUND` | request 없음 |

### Reject Host Role Request
- 현재 구현 상태: `implemented`
- Method: `POST`
- Path: `/api/v1/admin/host-role-requests/{requestId}/reject`
- 인증 필요 여부: 필요
- 허용 역할: `ADMIN`
- ops-web 사용 화면: `AdminRoleRequestsPage.tsx`
- source file:
  - `AdminHostRoleRequestController.rejectRequest`
  - `AdminHostRoleRequestDecisionRequest`
  - `AdminHostRoleRequestCommandService.rejectRequest`
- 관련 요구사항 ID: `UI-ADMIN-004`

#### Request Body
```json
{
  "reviewReason": "Need more verification"
}
```

#### 대표 실패
| HTTP | code | 조건 |
|---|---|---|
| `400` | `INVALID_REQUEST` | `reviewReason` blank 또는 500자 초과 |
| `400` | `HOST_ROLE_REQUEST_ALREADY_REVIEWED` | 이미 검토됨 |
| `404` | `NOT_FOUND` | request 없음 |

## admin dashboard

### Admin Dashboard API
- 현재 구현 상태: `partial`
- 상태 설명: 전용 backend dashboard API 없음
- 현재 UI 구현:
  - `ops-web/src/pages/admin/AdminDashboardPage.tsx`
  - 아래 live API를 조합해서 카드/shortcut 구성
    - `GET /api/v1/reservations`
    - `GET /api/v1/admin/users`
    - `GET /api/v1/admin/host-role-requests`
    - `GET /api/v1/room-blocks`
    - `GET /api/v1/price-policies`
- 관련 요구사항 ID: `UI-ADMIN-001`

## admin audit/system logs

### Audit Log API
- 현재 구현 상태: `missing`
- 상태 설명: controller, service, ops-web page 모두 없음

### System Log API
- 현재 구현 상태: `missing`
- 상태 설명: controller, service, ops-web page 모두 없음

## admin notices/terms

### Notices API
- 현재 구현 상태: `missing`
- 상태 설명: ops 현재 구현 기준 없음

### Terms API
- 현재 구현 상태: `missing`
- 상태 설명: ops 현재 구현 기준 없음

---

## Wire DTO vs UI DTO Mismatch 표

| 영역 | Wire DTO | UI DTO | 현재 차이 |
|---|---|---|---|
| 공통 envelope | `ApiResponse<T>` | `ApiEnvelope<T>` | UI는 envelope를 해제하고 `data`만 사용 |
| auth user | `AuthenticatedUserResponse` | `AuthenticatedUser` | 필드 동일, 타입스크립트 alias만 다름 |
| reservations list | `OpsReservationSummaryResponse` | `ReservationSummary` | 필드명 거의 동일 |
| reservation detail | `OpsReservationDetailResponse` | `ReservationDetail` | 필드명 거의 동일, UI는 날짜/시간을 모두 `string`으로 취급 |
| reservation calendar | `OpsReservationCalendarResponse` | `ReservationCalendarView` | 필드명 거의 동일, UI는 화면용 선택 상태를 별도 state로 가짐 |
| room blocks | `OpsRoomBlockManagementResponse` | `RoomBlockManagement` | 필드명 동일, UI는 선택값과 form 기본값을 별도 state로 관리 |
| price policies | `OpsPricePolicyManagementResponse` | `PricePolicyManagement` | 필드명 동일 |
| host accommodation detail | `HostAccommodationDetailResponse` | `AccommodationDetail` | 필드명 거의 동일 |
| host asset mutation | `HostAssetMutationResponse` | `AssetMutationResponse` | 필드명 동일, 이름만 다름 |
| admin users | `AdminUserSummaryResponse` / `AdminUserDetailResponse` | `AdminUserSummary` / `AdminUserDetail` | 필드명 동일 |
| admin host role request filter | query `status` string | `HostRoleRequestStatusFilter` | UI는 client-only 값 `ALL`을 사용하고 helper가 query 생략 처리 |
| reservation detail fallback | 없음 | `reservationDetailToSummary()` | UI helper가 detail을 summary로 파생 |

### 실무상 주의할 mismatch
| 항목 | 설명 |
|---|---|
| date/time typing | server는 `LocalDate`, `LocalTime`, `OffsetDateTime`를 반환하지만 UI는 전부 `string`으로 취급 |
| dashboard DTO | host/admin dashboard는 전용 wire DTO가 없고 여러 API 결과를 조합 |
| account/dashboard API | 화면은 있지만 전용 backend contract가 없음 |
| frontend path assumption | 현재 repo에는 `ops-web/src/features/**`, `ops-web/src/app/**`가 없으므로 기존 문서 템플릿과 실제 구조가 다름 |

---

## UI에 필요한데 아직 없는 API 표

| 카테고리 | 상태 | 필요한 이유 | 현재 우회 방식 |
|---|---|---|---|
| host dashboard aggregate API | missing | 카드/shortcut용 데이터를 한 번에 받고 싶음 | `App.tsx`에서 여러 API를 병렬 로드 |
| host account/profile API | missing | host account 화면/설정 부재 | 현재 UI 없음 |
| admin dashboard aggregate API | missing | 대시보드 전용 성능/계약 부재 | 여러 live API 조합 |
| admin audit logs | missing | 운영 감사 화면 필요 가능성 | 현재 UI 없음 |
| admin system logs | missing | 운영 로그 화면 필요 가능성 | 현재 UI 없음 |
| admin notices | missing | 운영 공지 관리 | 현재 UI 없음 |
| admin terms | missing | 약관 운영 관리 | 현재 UI 없음 |
| host property media/assets | missing | 데모용 자산 이미지/첨부 | 현재 텍스트 필드만 있음 |

---

## Missing Gap 정리

### 구현됨
- 세션 기반 auth
- host reservation 운영 전반
- host room blocks
- host pricing
- host asset management
- admin users
- admin host role requests

### partial
- host dashboard: 전용 API 없음, 조합형
- admin dashboard: 전용 API 없음, 조합형

### missing
- host account/profile API
- admin audit log API
- admin system log API
- admin notices API
- admin terms API

---

## 테스트 기반 보강 메모
- 확인한 web test:
  - `OpsAuthControllerWebTest`
  - `OpsReservationControllerWebTest`
  - `OpsRoomBlockControllerWebTest`
  - `OpsPricePolicyControllerWebTest`
  - `HostAssetControllerWebTest`
  - `AdminUserManagementControllerWebTest`
  - `AdminHostRoleRequestControllerWebTest`
- 확인한 service test:
  - `OpsReservationQueryServiceTest`
  - `ReservationDecisionServiceTest`
  - `ReservationReassignmentServiceTest`
  - `OpsRoomBlockQueryServiceTest`
  - `OpsRoomBlockCommandServiceTest`
  - `OpsPricePolicyQueryServiceTest`
  - `OpsPricePolicyCommandServiceTest`
  - `AdminUserQueryServiceTest`
  - `AdminHostRoleRequestCommandServiceTest`

### 테스트에서 직접 확인된 대표 포인트
| 영역 | 확인된 포인트 |
|---|---|
| auth | host/admin만 ops login 허용, 권한 실패 시 `403` |
| reservations | host/admin 접근 가능, host ownership 위반 시 `403` |
| calendar | 타 숙소 접근 시 `403` |
| room blocks | host/admin 접근 가능, 권한 위반 시 `403` |
| pricing | host/admin 접근 가능, 권한 위반 시 `403` |
| host assets | host 전용, admin 접근 시 `403` |
| admin users | admin 전용, host 접근 시 `403`, 없는 user는 `404` |
| admin role requests | admin 전용, host 접근 시 `403`, 승인/반려 규칙 있음 |

---

## Source Index
- 공통:
  - `shared/shared-domain/src/main/java/com/guesthouse/shared/domain/api/ApiResponse.java`
  - `shared/shared-domain/src/main/java/com/guesthouse/shared/domain/api/ErrorCode.java`
  - `shared/shared-domain/src/main/java/com/guesthouse/shared/domain/web/GlobalExceptionHandler.java`
  - `shared/shared-auth/src/main/java/com/guesthouse/shared/auth/session/RoleGuardInterceptor.java`
  - `shared/shared-auth/src/main/java/com/guesthouse/shared/auth/session/SessionAuthConstants.java`
- backend controllers:
  - `ops-api/src/main/java/com/guesthouse/opsapi/auth/OpsAuthController.java`
  - `ops-api/src/main/java/com/guesthouse/opsapi/reservation/OpsReservationController.java`
  - `ops-api/src/main/java/com/guesthouse/opsapi/roomblock/OpsRoomBlockController.java`
  - `ops-api/src/main/java/com/guesthouse/opsapi/pricing/OpsPricePolicyController.java`
  - `ops-api/src/main/java/com/guesthouse/opsapi/hostasset/HostAssetController.java`
  - `ops-api/src/main/java/com/guesthouse/opsapi/admin/AdminUserManagementController.java`
  - `ops-api/src/main/java/com/guesthouse/opsapi/admin/AdminHostRoleRequestController.java`
- frontend contracts:
  - `ops-web/src/lib/api.ts`
  - `ops-web/src/lib/types.ts`
  - `ops-web/src/lib/format.ts`
  - `ops-web/src/App.tsx`
  - `ops-web/src/pages/**/*.tsx`

## 코드상 확인 필요
- 세션 쿠키 이름의 실제 runtime 값
- CORS / CSRF 정책
- 운영 배포 환경 base URL
- `GET /api/v1/reservations/pending`의 공식 유지 여부
- `TOO_MANY_REQUESTS`, duplicate 계열 error code가 ops 런타임에서 실제로 사용되는 경로
