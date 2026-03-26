# Guest UI Contract Matrix

Date: 2026-03-26

This document fixes the current `guest-web` UI contract in a UI-first way.

Rule for this document:

- `guest-web` is the source contract for guest-facing flows.
- If backend behavior differs from the UI, backend must be aligned to the UI.
- Any mismatch with SRS or existing code should still be recorded separately in
  [CODE_SRS_CONFLICTS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODE_SRS_CONFLICTS.md).

Relevant UI sources:

- [GuestUiDraft.tsx](C:/Users/SDS/Downloads/guesthouse/guest-web/src/ui-drafts/GuestUiDraft.tsx)
- [GuestUiRefactorWorkspace.tsx](C:/Users/SDS/Downloads/guesthouse/guest-web/src/app/GuestUiRefactorWorkspace.tsx)

Requirement traceability:

- Guest auth/account/recovery: `REQ-F-001 ~ REQ-F-035`, `REQ-F-070 ~ REQ-F-075`, `REQ-SEC-001 ~ REQ-SEC-008`
- Guest browse/reservation: `REQ-F-036 ~ REQ-F-069`, `REQ-NF-001 ~ REQ-NF-003`, `BR-001`, `BR-002`, `BR-006`

## 1. Contract policy

- Page shape, button intent, and visible fields are defined by the current UI.
- Backend should be adjusted in this order:
  1. endpoint shape
  2. request fields
  3. response fields
  4. action scope
  5. role/permission guard
- Anonymous browsing flow in the UI is binding and should not be weakened by backend assumptions.

## 2. Guest contract

### `login`

- Purpose:
  guest session login
- Inputs:
  `loginId`, `password`
- Actions:
  login, open signup, open `find-id`, open `find-password`
- Expected request:
  `POST /api/v1/auth/login`
  `{ loginId, password }`
- Expected response:
  `{ userId, loginId, name, role }`
- Backend status:
  mostly aligned
- Backend work:
  login exists, but the UI also assumes recovery entry points next to login

### `signup`

- Purpose:
  guest registration
- Inputs:
  `loginId`, `password`, `passwordConfirm`, `name`, `email`, `phone`, required terms agreement
- Actions:
  fetch signup terms, submit signup
- Expected request:
  `GET /api/v1/auth/signup-terms`
  `POST /api/v1/auth/signup`
- Expected response:
  `terms`:
  `[{ termsId, title, version, required }]`
  `signup`:
  `{ userId, loginId, role, createdAt }`
- Backend status:
  mostly aligned
- Backend work:
  current signup flow exists and terms endpoint exists, but DTO naming should be frozen to match the UI exactly

### `search`

- Purpose:
  anonymous guest search entry
- Inputs:
  `regions[]`, `checkInDate`, `checkOutDate`, `guestCount`
- Actions:
  search, `전체 선택`, `전체 취소`, region multi-select
- UI note:
  region chips start unselected so user intent is additive from the first click
- Expected request:
  `GET /api/v1/accommodations/search?region=SEOUL,BUSAN&checkInDate=&checkOutDate=&guestCount=`
- Expected response:
  `[{ accommodationId, name, region, summary, lowestPrice, available, thumbnailUrl? }]`
- Backend status:
  mostly aligned
- Backend work:
  search endpoint exists and repeated `region` query params are now supported; response field names and list-card summary fields should still be normalized to what the UI actually renders

### `accommodations`

- Purpose:
  guest search results list
- Inputs:
  same search params plus optional sort/filter
- Actions:
  open detail
- Expected request:
  `GET /api/v1/accommodations/search?...`
- Expected response:
  same list card shape as `search`
- Backend status:
  mostly aligned
- Backend work:
  keep search endpoint but freeze the result-card DTO based on the UI

### `accommodation-detail`

- Purpose:
  accommodation detail page with bookable room types
- Inputs:
  `accommodationId`, `checkInDate`, `checkOutDate`, `guestCount`
- Actions:
  open reservation request, open room-type calendar
- Expected request:
  `GET /api/v1/accommodations/{accommodationId}?checkInDate=&checkOutDate=&guestCount=`
  `GET /api/v1/accommodations/{accommodationId}/room-types/{roomTypeId}/calendar?startDate=&endDate=`
- Expected response:
  `detail`:
  `{ accommodation, roomTypes, pricingPreview, policyNotes?, checkInDate, checkOutDate, guestCount }`
  `calendar`:
  `{ roomTypeId, startDate, endDate, days }`
- Backend status:
  mostly aligned
- Backend work:
  detail and calendar endpoints exist, but the exact nested field names should be matched to the UI sections

### `reservation-request`

- Purpose:
  reservation request entry form
- Inputs:
  `roomTypeId`, `checkInDate`, `checkOutDate`, `guestCount`
- Actions:
  submit reservation
- Expected request:
  `POST /api/v1/reservations`
  `{ roomTypeId, guestCount, checkInDate, checkOutDate }`
- Expected response:
  `{ reservationId, reservationNo, status, checkInDate, checkOutDate, guestCount }`
- Backend status:
  mostly aligned
- Backend work:
  create endpoint exists and now includes `guestCount`; completion/detail shared fields should continue to be normalized through the guest-web reservation API adapter

### `reservation-complete`

- Purpose:
  post-submit confirmation page
- Inputs:
  none beyond returned reservation payload
- Actions:
  open reservation detail, open reservation list
- Expected request:
  no new request required if create response is sufficient
- Expected response:
  same create response should be enough to render confirmation
- Backend status:
  mostly aligned
- Backend work:
  create response now carries the core completion fields including `accommodationName`, `roomTypeName`, and `guestCount`; immediate refetch is optional

### `reservation-list`

- Purpose:
  guest self reservation list
- Inputs:
  optional status filter later
- Actions:
  open reservation detail
- Expected request:
  `GET /api/v1/reservations/my`
- Expected response:
  `[{ reservationId, reservationNo, accommodationName, roomTypeName, checkInDate, checkOutDate, guestCount, status, cancellable }]`
- Backend status:
  mostly aligned
- Backend work:
  list endpoint exists, but `cancellable` and field naming should be stabilized for the UI

### `reservation-detail`

- Purpose:
  guest self reservation detail
- Inputs:
  `reservationId`
- Actions:
  cancel reservation when allowed
- Expected request:
  `GET /api/v1/reservations/{reservationId}`
  `POST /api/v1/reservations/{reservationId}/cancel`
- Expected response:
  `detail`:
  `{ reservation, statusHistory, nightlySummary, cancellable, cancelReasonPolicy? }`
  `cancel`:
  `{ reservationId, status, cancelledAt }`
- Backend status:
  mostly aligned
- Backend work:
  detail and cancel endpoints exist, but UI-facing fields like `cancellable` and cancel CTA conditions should be explicit in the payload

### `mypage`

- Purpose:
  guest account home
- Inputs:
  none
- Actions:
  open account, open reservations, open host role request state
- Expected request:
  `GET /api/v1/auth/me`
  `GET /api/v1/account/host-role-request`
- Expected response:
  `{ userId, loginId, name, role }`
  and
  `{ status, requestedAt?, reviewReason? }`
- Backend status:
  mostly aligned
- Backend work:
  APIs exist, but the mypage combined read model may need a small composition layer for simpler UI wiring

### `account`

- Purpose:
  guest self profile management
- Inputs:
  `name`, `email`, `phone`, password change fields
- Actions:
  view profile, update profile, change password, create host role request
- Expected request:
  `GET /api/v1/account/me`
  `PATCH /api/v1/account/me`
  `POST /api/v1/account/password`
  `POST /api/v1/account/host-role-request`
- Expected response:
  `{ userId, loginId, name, email, phone, role }`
  and
  `{ passwordChanged: true }`
  and
  `{ status, requestedAt, reviewReason? }`
- Backend status:
  mostly aligned
- Backend work:
  account APIs are present and close to the UI, but response field naming should be fixed before wiring

### `find-id`

- Purpose:
  account recovery entry for login ID
- Inputs:
  identity verification fields defined by the UI
- Actions:
  request verification, submit verification, return masked login IDs
- Expected request:
  dedicated recovery endpoints
- Expected response:
  recovery verification state and masked account result
- Backend status:
  missing
- Backend work:
  there is no connected guest recovery API for find-id

### `find-password`

- Purpose:
  account recovery entry for password reset
- Inputs:
  login ID or email plus verification info
- Actions:
  request verification, verify token, reset password
- Expected request:
  dedicated recovery endpoints
- Expected response:
  verification state and reset completion result
- Backend status:
  missing
- Backend work:
  there is no connected guest recovery API for reset-password

## 3. Backend readiness by guest UI

### Ready or close to ready

- `login`
- `signup`
- `search`
- `accommodations`
- `accommodation-detail`
- `reservation-request`
- `reservation-list`
- `reservation-detail`
- `mypage`
- `account`

### Missing or still incomplete

- `find-id`
- `find-password`
- explicit UI-shaped `cancellable` / `reservation-complete` contract cleanup

## 4. Immediate guest backend gap list

- Recovery APIs for `find-id` and `find-password` are missing.
- Search/detail/list/detail DTO names are not yet frozen to the UI vocabulary.
- Reservation list/detail responses may still need a small UI-facing reshaping pass.
- Mypage likely benefits from a simpler composed read model even though the underlying APIs mostly exist.

## 4-1. Current adapter rule

- Backend wire contracts are captured in feature-level `api-contract.ts`.
- UI-facing stable shapes are produced in feature-level `api.ts` normalizers.
- Guest search and guest reservation already follow this rule.
- `ops-web` should follow the same pattern instead of leaking raw backend DTO names into page components.

## 5. Safe next step

The next safest implementation step is:

1. freeze guest search/detail/reservation DTO names from this document
2. connect guest anonymous browse first
3. connect guest reservation create/list/detail next
4. connect account/mypage next
5. add recovery APIs last unless the UI makes recovery an immediate must-have

Related docs:

- [UI_DRAFT_ANALYSIS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_DRAFT_ANALYSIS.md)
- [UI_FIRST_INTEGRATION_PLAN.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_FIRST_INTEGRATION_PLAN.md)
- [CODEBASE_UNDERSTANDING.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODEBASE_UNDERSTANDING.md)
- [CODE_SRS_CONFLICTS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODE_SRS_CONFLICTS.md)
