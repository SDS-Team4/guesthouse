# Guest API Spec Draft

Date: 2026-03-26

This document describes the current guest-facing API surface from the codebase as the source of truth.

Priority used for this report:

1. current implemented code in `guest-api`
2. current guest-web API adapters and UI DTOs in `guest-web`
3. current guest UI contract notes in [GUEST_UI_CONTRACT_MATRIX.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/GUEST_UI_CONTRACT_MATRIX.md)

Related requirement traceability:

- Guest auth/account/recovery: `REQ-F-001 ~ REQ-F-035`, `REQ-F-070 ~ REQ-F-075`, `REQ-SEC-001 ~ REQ-SEC-008`
- Guest browse/reservation: `REQ-F-036 ~ REQ-F-069`, `REQ-NF-001 ~ REQ-NF-003`, `BR-001`, `BR-002`, `BR-006`

## 1. Summary

### Current conclusion

- Guest auth, browse, reservation, account, and host-role-request APIs are mostly implemented.
- Guest recovery APIs for `find-id` and `find-password` are not implemented.
- The frontend already uses a `wire DTO -> UI DTO normalizer` pattern for search and reservations.
- The safest integration rule is:
  wire DTO names follow backend code, while screen-facing shapes follow `guest-web` normalized DTOs.

### Implemented guest API groups

- `auth`
- `account`
- `accommodations/search/detail/calendar`
- `reservations`
- `host role request`

### Missing guest API groups

- `find-id`
- `find-password`
- recovery verification / password reset flow

## 2. Contract Rules

- Current code is the source of truth for implemented endpoints and DTO field names.
- `guest-web` normalized DTOs are the source of truth for what current screens actually consume.
- If a wire DTO and UI DTO differ, both should be documented rather than merged implicitly.
- All guest auth is session-based. These APIs depend on guest session cookies for protected endpoints.

### Common response envelope

All current guest APIs return the shared envelope defined by [ApiResponse.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-domain/src/main/java/com/guesthouse/shared/domain/api/ApiResponse.java).

Success shape:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2026-03-26T10:00:00+09:00"
}
```

Failure shape:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required."
  },
  "timestamp": "2026-03-26T10:00:00+09:00"
}
```

Observed common error codes from [ErrorCode.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-domain/src/main/java/com/guesthouse/shared/domain/api/ErrorCode.java):

- `INVALID_REQUEST`
- `NOT_FOUND`
- `INVALID_CREDENTIALS`
- `ACCOUNT_LOCKED`
- `DUPLICATE_LOGIN_ID`
- `DUPLICATE_EMAIL`
- `DUPLICATE_PHONE`
- `HOST_ROLE_REQUEST_NOT_ALLOWED`
- `HOST_ROLE_REQUEST_ALREADY_PENDING`
- `HOST_ROLE_REQUEST_ALREADY_REVIEWED`
- `INVENTORY_UNAVAILABLE`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

## 3. API Index

| Category | Method | Path | Auth | Status |
|---|---|---|---|---|
| auth | `POST` | `/api/v1/auth/login` | public | implemented |
| auth | `POST` | `/api/v1/auth/signup` | public | implemented |
| auth | `GET` | `/api/v1/auth/signup-terms` | public | implemented |
| auth | `POST` | `/api/v1/auth/logout` | guest session | implemented |
| auth | `GET` | `/api/v1/auth/me` | guest session | implemented |
| account | `GET` | `/api/v1/account/me` | guest session | implemented |
| account | `PATCH` | `/api/v1/account/me` | guest session | implemented |
| account | `POST` | `/api/v1/account/password` | guest session | implemented |
| account | `GET` | `/api/v1/account/host-role-request` | guest session | implemented |
| account | `POST` | `/api/v1/account/host-role-request` | guest session | implemented |
| accommodations | `GET` | `/api/v1/accommodations/search` | public | implemented |
| accommodations | `GET` | `/api/v1/accommodations/regions` | public | implemented |
| accommodations | `GET` | `/api/v1/accommodations/{accommodationId}` | public | implemented |
| accommodations | `GET` | `/api/v1/accommodations/{accommodationId}/room-types/{roomTypeId}/calendar` | public | implemented |
| reservations | `POST` | `/api/v1/reservations` | guest session | implemented |
| reservations | `GET` | `/api/v1/reservations/my` | guest session | implemented |
| reservations | `GET` | `/api/v1/reservations/{reservationId}` | guest session | implemented |
| reservations | `POST` | `/api/v1/reservations/{reservationId}/cancel` | guest session | implemented |
| recovery | n/a | guest recovery endpoints | n/a | missing |

## 4. Auth APIs

Source files:

- [GuestAuthController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/auth/GuestAuthController.java)
- [LoginRequest.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-auth/src/main/java/com/guesthouse/shared/auth/api/LoginRequest.java)
- [AuthenticatedUserResponse.java](C:/Users/SDS/Downloads/guesthouse/shared/shared-auth/src/main/java/com/guesthouse/shared/auth/api/AuthenticatedUserResponse.java)
- [SignupRequest.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/auth/api/SignupRequest.java)
- [GuestSignupResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/auth/api/GuestSignupResponse.java)
- [SignupTermResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/auth/api/SignupTermResponse.java)
- [auth/api.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/auth/api.ts)

### `POST /api/v1/auth/login`

- Current status: `implemented`
- Related requirements: `REQ-F-001 ~ REQ-F-009`, `REQ-SEC-001 ~ REQ-SEC-008`
- Screen usage:
  `login`

Request body:

```json
{
  "loginId": "guest01",
  "password": "password123"
}
```

Wire response body inside `ApiResponse.success(...)`:

```json
{
  "userId": 101,
  "loginId": "guest01",
  "name": "홍길동",
  "role": "GUEST"
}
```

Notes:

- Guest login is restricted to `UserRole.GUEST` at authentication time.
- On success, server creates or updates the session and stores `SESSION_USER_ATTRIBUTE`.

Observed tested failure cases:

- unauthenticated `GET /api/v1/auth/me` -> `401`, `UNAUTHORIZED`
- logout invalidates session and subsequent `GET /api/v1/auth/me` -> `401`, `UNAUTHORIZED`

### `POST /api/v1/auth/signup`

- Current status: `implemented`
- Related requirements: `REQ-F-010 ~ REQ-F-018`, `REQ-F-070 ~ REQ-F-075`, `REQ-SEC-001 ~ REQ-SEC-008`
- Screen usage:
  `signup`

Request body:

```json
{
  "loginId": "guest01",
  "password": "password123",
  "passwordConfirm": "password123",
  "name": "홍길동",
  "email": "guest@example.com",
  "phone": "01012345678",
  "agreedTermIds": [1, 2]
}
```

Wire response body:

```json
{
  "userId": 101,
  "loginId": "guest01",
  "name": "홍길동",
  "email": "guest@example.com",
  "phone": "01012345678",
  "role": "GUEST",
  "status": "ACTIVE",
  "createdAt": "2026-03-26T10:00:00+09:00"
}
```

Validation notes from code:

- `loginId`: required, `4~50`
- `password`: required, `8~100`
- `passwordConfirm`: required, `8~100`
- `name`: required, max `50`
- `email`: optional but if present must be valid email, max `100`
- `phone`: optional, max `20`
- `agreedTermIds`: required, not empty

### `GET /api/v1/auth/signup-terms`

- Current status: `implemented`
- Related requirements: `REQ-F-010 ~ REQ-F-018`
- Screen usage:
  `signup`

Wire response item:

```json
{
  "termId": 1,
  "category": "REQUIRED",
  "title": "서비스 이용약관",
  "content": "약관 본문",
  "version": "v1.0",
  "effectiveAt": "2026-03-01T00:00:00+09:00"
}
```

UI note:

- Current guest-web `SignupTerm` uses the same field names and shape.

### `POST /api/v1/auth/logout`

- Current status: `implemented`
- Related requirements: `REQ-F-001 ~ REQ-F-009`, `REQ-SEC-001 ~ REQ-SEC-008`
- Screen usage:
  header logout action

Auth:

- guest session required

Wire response body:

```json
{
  "loggedOut": true
}
```

UI mismatch note:

- guest-web currently treats logout as fire-and-forget and does not rely on `loggedOut`.

### `GET /api/v1/auth/me`

- Current status: `implemented`
- Related requirements: `REQ-F-001 ~ REQ-F-009`, `REQ-F-062 ~ REQ-F-075`
- Screen usage:
  `mypage`, header session restore, auth gating

Auth:

- guest session required

Wire response body:

```json
{
  "userId": 101,
  "loginId": "guest01",
  "name": "Guest Demo",
  "role": "GUEST"
}
```

Observed tested failure cases:

- no guest session -> `401`, `UNAUTHORIZED`

## 5. Account APIs

Source files:

- [GuestAccountController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/GuestAccountController.java)
- [GuestAccountProfileResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/api/GuestAccountProfileResponse.java)
- [UpdateGuestAccountProfileRequest.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/api/UpdateGuestAccountProfileRequest.java)
- [ChangeGuestPasswordRequest.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/api/ChangeGuestPasswordRequest.java)
- [GuestAccountPasswordChangeResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/api/GuestAccountPasswordChangeResponse.java)
- [GuestHostRoleRequestStateResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/api/GuestHostRoleRequestStateResponse.java)
- [account/api.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/account/api.ts)

### `GET /api/v1/account/me`

- Current status: `implemented`
- Related requirements: `REQ-F-019 ~ REQ-F-024`
- Screen usage:
  `account-profile`

Auth:

- guest session required

Wire response body:

```json
{
  "userId": 101,
  "loginId": "guest01",
  "name": "홍길동",
  "email": "guest@example.com",
  "phone": "01012345678",
  "role": "GUEST",
  "status": "ACTIVE"
}
```

### `PATCH /api/v1/account/me`

- Current status: `implemented`
- Related requirements: `REQ-F-019 ~ REQ-F-024`, `REQ-SEC-001 ~ REQ-SEC-008`
- Screen usage:
  `account-profile`

Auth:

- guest session required

Request body:

```json
{
  "name": "홍길동",
  "email": "guest@example.com",
  "phone": "01012345678"
}
```

Wire response:

- same shape as `GET /api/v1/account/me`

Behavior note:

- Controller also refreshes the session user name in session after update.

### `POST /api/v1/account/password`

- Current status: `implemented`
- Related requirements: `REQ-F-025 ~ REQ-F-029`, `REQ-SEC-001 ~ REQ-SEC-008`
- Screen usage:
  `account-password`

Auth:

- guest session required

Request body:

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123",
  "newPasswordConfirm": "newPassword123"
}
```

Wire response body:

```json
{
  "changed": true,
  "changedAt": "2026-03-26T10:10:00+09:00"
}
```

UI mismatch note:

- guest-web already expects `{ changed, changedAt }`, so this is aligned.

### `GET /api/v1/account/host-role-request`

- Current status: `implemented`
- Related requirements: `REQ-F-070 ~ REQ-F-075`
- Screen usage:
  `mypage`, `account-host-role-request`

Auth:

- guest session required

Wire response body:

```json
{
  "currentUserRole": "GUEST",
  "canSubmitNewRequest": true,
  "blockedReason": null,
  "latestRequest": {
    "requestId": 301,
    "requestReason": "운영을 시작하고 싶습니다.",
    "status": "PENDING",
    "reviewedByUserId": null,
    "reviewedByLoginId": null,
    "reviewedByName": null,
    "reviewReason": null,
    "createdAt": "2026-03-26T10:00:00+09:00",
    "reviewedAt": null
  }
}
```

Observed tested failure cases:

- authenticated non-guest session -> `403`, `FORBIDDEN`

### `POST /api/v1/account/host-role-request`

- Current status: `implemented`
- Related requirements: `REQ-F-070 ~ REQ-F-075`
- Screen usage:
  `account-host-role-request`

Auth:

- guest session required

Request body:

```json
{
  "requestReason": "운영을 시작하고 싶습니다."
}
```

Wire response:

- same shape as `GET /api/v1/account/host-role-request`

## 6. Accommodation Browse APIs

Source files:

- [GuestAccommodationController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/accommodation/GuestAccommodationController.java)
- [AccommodationSearchResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/accommodation/api/AccommodationSearchResponse.java)
- [AccommodationDetailResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/accommodation/api/AccommodationDetailResponse.java)
- [RoomTypeCalendarResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/accommodation/api/RoomTypeCalendarResponse.java)
- [search/api-contract.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/search/api-contract.ts)
- [search/api.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/search/api.ts)

### `GET /api/v1/accommodations/search`

- Current status: `implemented`
- Related requirements: `REQ-F-036 ~ REQ-F-043`, `REQ-NF-001`, `REQ-NF-002`, `BR-001`, `BR-002`, `BR-006`
- Screen usage:
  `search`, `accommodations`

Auth:

- public

Query params:

- `region`: optional; backend accepts repeated list binding and current service also supports comma-joined values after normalization
- `checkInDate`: required ISO date
- `checkOutDate`: required ISO date
- `guestCount`: required integer

Current frontend request example:

```http
GET /api/v1/accommodations/search?region=서울,부산&checkInDate=2026-04-10&checkOutDate=2026-04-12&guestCount=2
```

Wire response item:

```json
{
  "accommodationId": 502,
  "accommodationName": "다움 스테이 부산",
  "region": "부산",
  "availabilityCategory": "AVAILABLE",
  "matchingRoomTypeCount": 2,
  "availableRoomTypeCount": 1,
  "lowestBasePrice": 70000,
  "lowestPreviewPrice": 85000
}
```

Current guest-web normalized UI DTO:

```json
{
  "accommodationId": 502,
  "accommodationName": "다움 스테이 부산",
  "region": "부산",
  "availabilityCategory": "AVAILABLE",
  "matchingRoomTypeCount": 2,
  "availableRoomTypeCount": 1,
  "lowestBasePrice": 70000,
  "lowestPreviewPrice": 85000
}
```

Behavior note:

- Region filter is strict. If `region` is not sent, backend returns all active accommodations matching date and guest count evaluation flow.
- Current classification rule:
  - if any room type is `AVAILABLE`, accommodation is `AVAILABLE`
  - else if any room type is `SOLD_OUT`, accommodation is `SOLD_OUT`
  - else accommodation is `CONDITION_MISMATCH`

### `GET /api/v1/accommodations/regions`

- Current status: `implemented`
- Related requirements: `REQ-F-036 ~ REQ-F-043`
- Screen usage:
  search region chip options

Auth:

- public

Wire response:

```json
["서울", "부산", "제주", "강원", "경주", "전주"]
```

UI note:

- guest-web currently uses this as primary source and falls back to a bounded 6-region list if loading fails.

### `GET /api/v1/accommodations/{accommodationId}`

- Current status: `implemented`
- Related requirements: `REQ-F-044 ~ REQ-F-049`, `REQ-NF-001`, `REQ-NF-002`
- Screen usage:
  `accommodation-detail`

Auth:

- public

Query params:

- `checkInDate`
- `checkOutDate`
- `guestCount`

Wire response body:

```json
{
  "accommodationId": 502,
  "accommodationName": "다움 스테이 부산",
  "region": "부산",
  "address": "부산광역시 ...",
  "infoText": "숙소 소개",
  "checkInTime": "15:00:00",
  "checkOutTime": "11:00:00",
  "availabilityCategory": "AVAILABLE",
  "roomTypes": [
    {
      "roomTypeId": 1003,
      "roomTypeName": "도미토리 4인실",
      "baseCapacity": 2,
      "maxCapacity": 4,
      "basePrice": 70000,
      "previewPrice": 85000,
      "totalActiveRooms": 3,
      "availableRoomCount": 2,
      "matchesGuestCount": true,
      "availabilityCategory": "AVAILABLE"
    }
  ]
}
```

Current guest-web normalized UI DTO:

- field names are the same
- types are normalized into frontend `AccommodationDetail`
- important adapter rename:
  wire `totalActiveRooms` -> UI `totalRoomCount`

### `GET /api/v1/accommodations/{accommodationId}/room-types/{roomTypeId}/calendar`

- Current status: `implemented`
- Related requirements: `REQ-F-044 ~ REQ-F-049`, `REQ-NF-001`, `REQ-NF-002`, `BD-08`
- Screen usage:
  room-type inventory calendar modal

Auth:

- public

Query params:

- `startDate`
- `endDate`

Current frontend behavior:

- start date is expanded to `max(today, Sunday of check-in week)`
- end date is expanded to at least `21 days` after start date
- if reservation stay is longer than 21 days, end date extends to reservation check-out

Wire response body:

```json
{
  "accommodationId": 502,
  "roomTypeId": 1003,
  "roomTypeName": "도미토리 4인실",
  "startDate": "2026-04-06",
  "endDate": "2026-04-27",
  "days": [
    {
      "stayDate": "2026-04-06",
      "availableRoomCount": 2,
      "soldOut": false
    }
  ]
}
```

Current guest-web normalized UI DTO:

```json
{
  "accommodationId": 502,
  "roomTypeId": 1003,
  "roomTypeName": "도미토리 4인실",
  "startDate": "2026-04-06",
  "endDate": "2026-04-27",
  "days": [
    {
      "date": "2026-04-06",
      "availableRoomCount": 2,
      "soldOut": false
    }
  ]
}
```

Important mismatch note:

- wire uses `stayDate`
- UI DTO uses `date`

Observed tested success cases:

- anonymous search allowed
- anonymous accommodation detail allowed
- anonymous room-type calendar allowed
- multiple `region` query params accepted by controller binding

## 7. Reservation APIs

Source files:

- [GuestReservationController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/GuestReservationController.java)
- [CreateReservationRequest.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/api/CreateReservationRequest.java)
- [CreateReservationResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/api/CreateReservationResponse.java)
- [GuestReservationSummaryResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/api/GuestReservationSummaryResponse.java)
- [GuestReservationDetailResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/api/GuestReservationDetailResponse.java)
- [GuestReservationCancellationResponse.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/api/GuestReservationCancellationResponse.java)
- [reservations/api-contract.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/reservations/api-contract.ts)
- [reservations/api.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/reservations/api.ts)

### `POST /api/v1/reservations`

- Current status: `implemented`
- Related requirements: `REQ-F-050 ~ REQ-F-061`, `REQ-NF-003`, `REQ-NF-005`, `BR-001`, `BR-002`, `BR-006`
- Screen usage:
  `reservation-request`, `reservation-complete`

Auth:

- guest session required

Request body:

```json
{
  "roomTypeId": 1003,
  "guestCount": 2,
  "checkInDate": "2026-04-10",
  "checkOutDate": "2026-04-12"
}
```

Wire response body:

```json
{
  "reservationId": 9001,
  "reservationNo": "R202603260001",
  "accommodationId": 502,
  "accommodationName": "다움 스테이 부산",
  "roomTypeId": 1003,
  "roomTypeName": "도미토리 4인실",
  "guestCount": 2,
  "checkInDate": "2026-04-10",
  "checkOutDate": "2026-04-12",
  "status": "PENDING",
  "requestedAt": "2026-03-26T10:30:00+09:00"
}
```

Current guest-web normalized UI DTO:

- same fields, but current normalizer still hardens `status` as `'PENDING'`

Observed tested failure cases:

- no guest session -> `401`, `UNAUTHORIZED`
- inventory conflict -> `409`, `INVENTORY_UNAVAILABLE`

### `GET /api/v1/reservations/my`

- Current status: `implemented`
- Related requirements: `REQ-F-062 ~ REQ-F-065`
- Screen usage:
  `reservation-list`

Auth:

- guest session required

Wire response item:

```json
{
  "reservationId": 9001,
  "reservationNo": "R202603260001",
  "accommodationId": 502,
  "accommodationName": "다움 스테이 부산",
  "roomTypeId": 1003,
  "roomTypeName": "도미토리 4인실",
  "guestCount": 2,
  "checkInDate": "2026-04-10",
  "checkOutDate": "2026-04-12",
  "status": "PENDING",
  "requestedAt": "2026-03-26T10:30:00+09:00",
  "confirmedAt": null,
  "cancelledAt": null
}
```

Current guest-web normalized UI DTO:

- same fields and names

Missing note:

- current API does not return an explicit `cancellable` boolean in the list summary

### `GET /api/v1/reservations/{reservationId}`

- Current status: `implemented`
- Related requirements: `REQ-F-066 ~ REQ-F-069`, `BR-006`
- Screen usage:
  `reservation-detail`

Auth:

- guest session required

Wire response body:

```json
{
  "reservationId": 9001,
  "reservationNo": "R202603260001",
  "accommodation": {
    "accommodationId": 502,
    "accommodationName": "다움 스테이 부산",
    "region": "부산",
    "address": "부산광역시 ..."
  },
  "roomType": {
    "roomTypeId": 1003,
    "roomTypeName": "도미토리 4인실"
  },
  "guestCount": 2,
  "checkInDate": "2026-04-10",
  "checkOutDate": "2026-04-12",
  "status": "PENDING",
  "requestedAt": "2026-03-26T10:30:00+09:00",
  "confirmedAt": null,
  "cancelledAt": null,
  "cancellationCutoffAt": "2026-04-10T15:00:00+09:00",
  "cancellationAllowed": true,
  "cancellationBlockedReason": null,
  "nights": [
    {
      "reservationNightId": 1,
      "stayDate": "2026-04-10"
    }
  ],
  "statusHistory": [
    {
      "fromStatus": null,
      "toStatus": "PENDING",
      "actionType": "REQUESTED",
      "reasonType": null,
      "reasonText": null,
      "changedAt": "2026-03-26T10:30:00+09:00"
    }
  ]
}
```

Current guest-web normalized UI DTO:

- field names are mostly preserved
- nested structures are copied into frontend `ReservationDetail`

Observed tested failure cases:

- guest-scoped reservation not found -> `404`, `NOT_FOUND`

### `POST /api/v1/reservations/{reservationId}/cancel`

- Current status: `implemented`
- Related requirements: `REQ-F-066 ~ REQ-F-069`
- Screen usage:
  `reservation-detail`

Auth:

- guest session required

Wire response body:

```json
{
  "reservationId": 9001,
  "reservationNo": "R202603260001",
  "status": "CANCELLED",
  "cancelledAt": "2026-03-26T11:00:00+09:00"
}
```

Observed tested failure cases:

- after check-in cutoff -> `409`, `INVALID_REQUEST`
- invalid reservation status for cancel -> `409`, `INVALID_REQUEST`

## 8. Recovery Gap

Current status:

- `find-id`: `missing`
- `find-password`: `missing`

Current UI state:

- recovery screens exist as placeholders in guest-web
- real guest-api endpoints are not implemented yet

Expected eventual categories:

- identity verification request
- verification submit
- login-id result lookup
- password reset token or code verification
- password reset submit

## 9. UI Needed but Missing APIs

| UI flow | Needed API | Current status | Note |
|---|---|---|---|
| `find-id` | guest recovery lookup endpoints | missing | no controller path exists in `guest-api` |
| `find-password` | verification + reset endpoints | missing | no controller path exists in `guest-api` |
| richer reservation list CTA state | explicit `cancellable` in list summary | partial | detail API has cancellation flags, list API does not |

## 10. Current Code vs UI Contract Mismatch

| Area | Current code | UI expectation / guest-web usage | Status |
|---|---|---|---|
| signup terms | `termId`, `category`, `title`, `content`, `version`, `effectiveAt` | current UI uses same shape | aligned |
| logout response | `loggedOut` | UI does not consume it explicitly | minor mismatch |
| search region query | backend accepts list; frontend sends comma-joined single `region` value | backend service currently normalizes both | aligned after hardening |
| room type total room field | wire uses `totalActiveRooms` | UI DTO uses `totalRoomCount` | normalized in adapter |
| calendar day field | wire uses `stayDate` | UI DTO uses `date` | normalized in adapter |
| reservation create status | wire includes `status` | frontend currently hardens to `'PENDING'` in normalizer | minor mismatch |
| reservation list summary | no explicit `cancellable` | UI contract document mentioned it as desirable | partial |
| recovery | no endpoints | UI has placeholder screens | missing |

## 11. Implementation Status by Category

| Category | Status | Notes |
|---|---|---|
| auth | implemented | login/signup/logout/current user are present |
| account profile | implemented | profile read/update and password change are present |
| host role request | implemented | guest-side state/read/create are present |
| accommodations search/detail/calendar | implemented | public browse flow is present |
| reservations create/list/detail/cancel | implemented | guest self-service reservation flow is present |
| recovery | missing | placeholder only in UI |

## 12. Source Files Checked

Backend:

- [GuestAuthController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/auth/GuestAuthController.java)
- [GuestAccountController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/GuestAccountController.java)
- [GuestAccommodationController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/accommodation/GuestAccommodationController.java)
- [GuestReservationController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/GuestReservationController.java)

Frontend:

- [auth/api.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/auth/api.ts)
- [account/api.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/account/api.ts)
- [search/api-contract.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/search/api-contract.ts)
- [search/api.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/search/api.ts)
- [reservations/api-contract.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/reservations/api-contract.ts)
- [reservations/api.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/reservations/api.ts)
- [guest-api-types.ts](C:/Users/SDS/Downloads/guesthouse/guest-web/src/features/guest-api-types.ts)

Related planning docs:

- [GUEST_UI_CONTRACT_MATRIX.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/GUEST_UI_CONTRACT_MATRIX.md)
- [UI_BACKEND_ALIGNMENT_REVIEW.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_BACKEND_ALIGNMENT_REVIEW.md)
- [PLANS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/PLANS.md)

Related controller and service tests checked:

- [GuestAuthControllerWebTest.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/test/java/com/guesthouse/guestapi/auth/GuestAuthControllerWebTest.java)
- [GuestAccountControllerWebTest.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/test/java/com/guesthouse/guestapi/account/GuestAccountControllerWebTest.java)
- [GuestAccommodationControllerWebTest.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/test/java/com/guesthouse/guestapi/accommodation/GuestAccommodationControllerWebTest.java)
- [GuestReservationControllerWebTest.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/test/java/com/guesthouse/guestapi/reservation/GuestReservationControllerWebTest.java)
- [GuestReservationCancellationServiceTest.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/test/java/com/guesthouse/guestapi/reservation/service/GuestReservationCancellationServiceTest.java)

## 13. Safe Next Step

1. Freeze this document as the guest API draft baseline.
2. If the team wants a publish-ready API spec, replace the example payload values with stable canonical fixture values and add one error example per endpoint.
3. Only after that, decide whether recovery enters immediate scope or remains placeholder-only.
