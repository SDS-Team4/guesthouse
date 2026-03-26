# Ops UI Contract Matrix

Date: 2026-03-26

This document fixes the current `ops-web` UI contract in a UI-first way.

Rule for this document:

- `ops-web` is the source contract for host and admin operations.
- If backend behavior differs from the UI, backend must be aligned to the UI.
- Any mismatch with SRS or existing code should still be recorded separately in
  [CODE_SRS_CONFLICTS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODE_SRS_CONFLICTS.md).

Relevant UI sources:

- [HostUiDraft.tsx](C:/Users/SDS/Downloads/guesthouse/ops-web/src/ui-drafts/HostUiDraft.tsx)
- [AdminUiDraft.tsx](C:/Users/SDS/Downloads/guesthouse/ops-web/src/ui-drafts/AdminUiDraft.tsx)
- [OpsUiRefactorWorkspace.tsx](C:/Users/SDS/Downloads/guesthouse/ops-web/src/app/OpsUiRefactorWorkspace.tsx)

Requirement traceability:

- Host operations: `REQ-F-076 ~ REQ-F-106`, `REQ-NF-003`, `REQ-NF-005`, `REQ-NF-007`, `BR-007`
- Admin operations: `REQ-F-107 ~ REQ-F-127`, `REQ-NF-004`, `REQ-SEC-001 ~ REQ-SEC-008`, `BR-008`

## 1. Contract policy

- Page shape, button intent, and visible fields are defined by the current UI.
- Backend should be adjusted in this order:
  1. endpoint shape
  2. request fields
  3. response fields
  4. action scope
  5. role/permission guard
- If the UI is still visually rough but the user flow is clear, the flow is treated as binding.

## 2. Host contract

### `login`

- Purpose:
  host session login entry
- Inputs:
  `loginId`, `password`
- Actions:
  `login`
- Expected request:
  `POST /ops/session/login`
  `{ loginId, password, role: "HOST" }`
- Expected response:
  `{ userId, role, displayName, sessionState }`
- Backend status:
  partially aligned
- Backend work:
  keep host-only role guard and make response shape stable for the UI

### `dashboard`

- Purpose:
  host summary view with shortcuts and KPI cards
- Inputs:
  none
- Actions:
  open `properties`, `room-types`, `reservation-list`
- Expected request:
  `GET /ops/dashboard/summary`
- Expected response:
  `{ propertyCount, pendingReservationCount, roomTypeCount, recentItems? }`
- Backend status:
  missing as a dedicated contract
- Backend work:
  add a host dashboard summary endpoint instead of forcing UI to compose many calls

### `properties`

- Purpose:
  host property list and entry into property management
- Inputs:
  optional host-owned property filter only
- Actions:
  open property detail, open property form
- Expected request:
  `GET /ops/properties`
- Expected response:
  `[{ id, name, region, address, contact, status, checkInTime, checkOutTime, roomTypeCount, roomCount, pendingReservations }]`
- Backend status:
  mostly missing
- Backend work:
  add host-owned property list API with exactly the summary fields used by the UI

### `property-form`

- Purpose:
  create or edit property
- Inputs:
  `name`, `region`, `address`, `contact`, `checkInTime`, `checkOutTime`, `info`
- Actions:
  save draft data, submit create, submit update, deactivate
- Expected request:
  `POST /ops/properties`
  `PUT /ops/properties/{propertyId}`
  `PATCH /ops/properties/{propertyId}/inactive`
- Expected response:
  `{ propertyId, status, savedAt }`
- Backend status:
  missing
- Backend work:
  create full host property write APIs and preserve inactive-over-delete rule

### `property-detail`

- Purpose:
  host operational detail page for one property
- Inputs:
  `propertyId`
- Actions:
  open edit form, open room types, open reservation list
- Expected request:
  `GET /ops/properties/{propertyId}`
- Expected response:
  `{ id, name, region, address, contact, checkInTime, checkOutTime, info, status, roomTypeSummaries }`
- Backend status:
  missing
- Backend work:
  provide one property detail endpoint with enough shape for property overview and navigation context

### `room-types`

- Purpose:
  host room type list for one property
- Inputs:
  `propertyId`
- Actions:
  open room type form
- Expected request:
  `GET /ops/properties/{propertyId}/room-types`
- Expected response:
  `[{ id, name, baseCapacity, maxCapacity, basePrice, status }]`
- Backend status:
  missing as a full host UI contract
- Backend work:
  add list API aligned to host property context

### `room-type-form`

- Purpose:
  create or edit room type
- Inputs:
  `propertyId`, `name`, `baseCapacity`, `maxCapacity`, `basePrice`
- Actions:
  create, update, deactivate
- Expected request:
  `POST /ops/properties/{propertyId}/room-types`
  `PUT /ops/room-types/{roomTypeId}`
  `PATCH /ops/room-types/{roomTypeId}/inactive`
- Expected response:
  `{ roomTypeId, status, savedAt }`
- Backend status:
  missing
- Backend work:
  add room-type write APIs before trying to retrofit current ops APIs into this screen

### `reservation-list`

- Purpose:
  host reservation queue
- Inputs:
  property filter, status filter, date range filter
- Actions:
  open reservation detail
- Expected request:
  `GET /ops/reservations?propertyId=&status=&dateFrom=&dateTo=`
- Expected response:
  `[{ id, reservationNo, propertyId, propertyName, roomTypeId, roomTypeName, guestName, people, checkInDate, checkOutDate, status, requestNote? }]`
- Backend status:
  mostly aligned
- Backend work:
  keep current reservation list APIs but reshape fields to match UI names consistently

### `reservation-detail`

- Purpose:
  host review page for one reservation
- Inputs:
  `reservationId`
- Actions:
  approve, reject, nightly reassignment
- Expected request:
  `GET /ops/reservations/{reservationId}`
  `POST /ops/reservations/{reservationId}/approve`
  `POST /ops/reservations/{reservationId}/reject`
  `POST /ops/reservations/{reservationId}/nightly-reassignments`
- Expected response:
  `detail`:
  `{ reservation, nightlyAssignments, roomCandidates, pricingContext?, blockContext? }`
  `approve/reject`:
  `{ reservationId, status, decidedAt }`
  `reassign`:
  `{ reservationId, changedNights, updatedAssignments }`
- Backend status:
  partially aligned
- Backend work:
  current ops reservation APIs already cover the core flow, but the response contract should be normalized to the UI fields and the reassignment payload should be driven by the nightly grid shape

### `account`

- Purpose:
  host self account management
- Inputs:
  `name`, `email`, `phone`
- Actions:
  view profile, update profile, eventually change password
- Expected request:
  `GET /ops/me`
  `PUT /ops/me/profile`
  `PUT /ops/me/password`
- Expected response:
  `{ userId, loginId, name, email, phone, role }`
- Backend status:
  partially aligned
- Backend work:
  stabilize host-self account endpoints as a dedicated UI contract

## 3. Admin contract

### `login`

- Purpose:
  admin session login entry
- Inputs:
  `loginId`, `password`
- Actions:
  `login`
- Expected request:
  `POST /ops/session/login`
  `{ loginId, password, role: "ADMIN" }`
- Expected response:
  `{ userId, role, displayName, sessionState }`
- Backend status:
  partially aligned
- Backend work:
  share the login endpoint if needed, but preserve admin-only entry behavior at the response and guard level

### `dashboard`

- Purpose:
  admin KPI and shortcut overview
- Inputs:
  none
- Actions:
  open users, role requests, audit logs, system logs, properties, terms
- Expected request:
  `GET /ops/admin/dashboard`
- Expected response:
  `{ userCount, pendingRoleRequestCount, propertyCount, auditLogCount, recentWarnings? }`
- Backend status:
  missing
- Backend work:
  add a dedicated admin summary endpoint

### `users`

- Purpose:
  user list for admin oversight
- Inputs:
  optional `role`, `status`, keyword
- Actions:
  inspect user detail, update user status
- Expected request:
  `GET /ops/admin/users?role=&status=&keyword=`
  `GET /ops/admin/users/{userId}`
  `PATCH /ops/admin/users/{userId}/status`
- Expected response:
  `list`:
  `[{ id, loginId, name, email, role, status, joinedAt }]`
  `detail`:
  `{ id, loginId, name, email, phone?, role, status, joinedAt, hostRoleRequestState? }`
- Backend status:
  partially aligned
- Backend work:
  existing admin user list/detail can be kept, but status-edit action and stable field naming still need to match the UI

### `role-requests`

- Purpose:
  host role request review queue
- Inputs:
  optional status filter
- Actions:
  open request, approve, reject, attach review note
- Expected request:
  `GET /ops/admin/host-role-requests?status=`
  `GET /ops/admin/host-role-requests/{requestId}`
  `POST /ops/admin/host-role-requests/{requestId}/approve`
  `POST /ops/admin/host-role-requests/{requestId}/reject`
- Expected response:
  `[{ id, userName, loginId, reason, status, requestedAt, reviewedAt?, reviewNote? }]`
- Backend status:
  mostly aligned
- Backend work:
  keep current endpoints and align response naming and review note handling to the UI

### `audit-logs`

- Purpose:
  audit trail browser
- Inputs:
  actor, target, action, date range
- Actions:
  inspect before/after
- Expected request:
  `GET /ops/admin/audit-logs?actor=&target=&action=&dateFrom=&dateTo=`
- Expected response:
  `[{ id, actor, target, action, createdAt, beforeJson, afterJson }]`
- Backend status:
  missing
- Backend work:
  add read-only admin audit browsing API

### `system-logs`

- Purpose:
  system issue monitoring
- Inputs:
  severity, source, date range
- Actions:
  inspect log entries
- Expected request:
  `GET /ops/admin/system-logs?severity=&source=&dateFrom=&dateTo=`
- Expected response:
  `[{ id, severity, source, message, createdAt }]`
- Backend status:
  missing
- Backend work:
  add a bounded admin-facing system log query surface

### `properties`

- Purpose:
  admin-wide property oversight
- Inputs:
  host, region, status
- Actions:
  inspect property summary
- Expected request:
  `GET /ops/admin/properties?host=&region=&status=`
- Expected response:
  `[{ id, name, host, region, status, roomTypeCount, reservationCount, pendingCount }]`
- Backend status:
  missing
- Backend work:
  add admin-wide property summary API rather than reusing host-owned property APIs

### `terms`

- Purpose:
  admin terms and policy document management
- Inputs:
  selected document type, version, content
- Actions:
  list docs, inspect doc, create version, update content, publish version
- Expected request:
  `GET /ops/admin/terms`
  `GET /ops/admin/terms/{termsId}`
  `POST /ops/admin/terms`
  `PUT /ops/admin/terms/{termsId}`
- Expected response:
  `[{ id, type, version, title, updatedAt }]`
  and
  `{ id, type, version, title, content, updatedAt }`
- Backend status:
  missing
- Backend work:
  add admin terms management APIs with immutable version history rules defined later if needed

## 4. Integration priority by UI value

### Priority A: connect first

- host `reservation-list`
- host `reservation-detail`
- admin `users`
- admin `role-requests`

Reason:

- these screens are closest to existing backend capability
- they validate the host/admin split quickly
- they reduce the risk of overfitting backend contracts too early

### Priority B: add next

- host `dashboard`
- host `account`
- admin `dashboard`

Reason:

- summary and self-service screens need dedicated contract cleanup but not large domain redesign

### Priority C: backend expansion

- host `properties`
- host `property-form`
- host `property-detail`
- host `room-types`
- host `room-type-form`
- admin `audit-logs`
- admin `system-logs`
- admin `properties`
- admin `terms`

Reason:

- these screens require real backend scope expansion, not only field reshaping

## 5. Immediate backend gap list

- Host property CRUD is not ready for the current host UI contract.
- Host room type CRUD is not ready for the current host UI contract.
- Host dashboard summary is missing.
- Admin dashboard summary is missing.
- Admin audit log browse API is missing.
- Admin system log browse API is missing.
- Admin property oversight API is missing.
- Admin terms management API is missing.

## 6. Safe next step

The next safest implementation step is:

1. freeze `ops-web` page-by-page request and response DTO names from this document
2. connect host reservation list/detail first
3. connect admin users and role requests next
4. only then expand backend for host property and admin operations

Related docs:

- [UI_DRAFT_ANALYSIS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_DRAFT_ANALYSIS.md)
- [UI_FIRST_INTEGRATION_PLAN.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_FIRST_INTEGRATION_PLAN.md)
- [CODEBASE_UNDERSTANDING.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODEBASE_UNDERSTANDING.md)
- [CODE_SRS_CONFLICTS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODE_SRS_CONFLICTS.md)
