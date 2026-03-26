# UI Backend Alignment Review

Date: 2026-03-26

This document reviews whether the current backend is already complete for the current UI-first direction.

Short answer:

- No, the backend API surface is not fully complete for the current UI.
- Guest flows are mostly present and closest to connectable state.
- Host/admin operations are only partially implemented relative to the current UI.
- The merge plan should therefore start with guest browse and reservation, then host reservation operations, then admin user/request operations, and only after that expand property/admin operational APIs.

Reference contracts:

- [GUEST_UI_CONTRACT_MATRIX.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/GUEST_UI_CONTRACT_MATRIX.md)
- [OPS_UI_CONTRACT_MATRIX.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/OPS_UI_CONTRACT_MATRIX.md)

Reference code:

- [GuestAuthController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/auth/GuestAuthController.java)
- [GuestAccountController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/account/GuestAccountController.java)
- [GuestAccommodationController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/accommodation/GuestAccommodationController.java)
- [GuestReservationController.java](C:/Users/SDS/Downloads/guesthouse/guest-api/src/main/java/com/guesthouse/guestapi/reservation/GuestReservationController.java)
- [OpsAuthController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/auth/OpsAuthController.java)
- [OpsReservationController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/reservation/OpsReservationController.java)
- [AdminUserManagementController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/admin/AdminUserManagementController.java)
- [AdminHostRoleRequestController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/admin/AdminHostRoleRequestController.java)
- [OpsRoomBlockController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/roomblock/OpsRoomBlockController.java)
- [OpsPricePolicyController.java](C:/Users/SDS/Downloads/guesthouse/ops-api/src/main/java/com/guesthouse/opsapi/pricing/OpsPricePolicyController.java)

Requirement traceability:

- Guest: `REQ-F-001 ~ REQ-F-069`, `REQ-F-070 ~ REQ-F-075`, `REQ-SEC-001 ~ REQ-SEC-008`
- Host: `REQ-F-076 ~ REQ-F-106`, `BR-007`
- Admin: `REQ-F-107 ~ REQ-F-127`, `BR-008`

## 1. Current backend status by UI area

### Guest

- Auth:
  mostly implemented
- Anonymous browse:
  implemented, including repeated `region` query-param filtering for the current UI multi-select search
- Reservation create/read/cancel:
  implemented
- Account/profile/password/host-role-request:
  mostly implemented
- Recovery:
  not implemented

Assessment:

- guest is the only area where the current backend is close to end-to-end UI connection

### Host

- Auth:
  implemented
- Reservation list/detail/approve/reject/reassign:
  implemented at core flow level
- Room block:
  implemented
- Pricing:
  implemented
- Dashboard:
  missing as dedicated UI contract
- Property CRUD:
  missing
- Room type CRUD:
  missing
- Host account management:
  only partial contract exists

Assessment:

- host reservation operations are connectable soon
- host asset-management screens are not yet backed by matching APIs

### Admin

- Auth:
  implemented
- User list/detail:
  implemented
- Host role request list/detail/approve/reject:
  implemented
- Dashboard:
  missing
- Audit log browse:
  missing
- System log browse:
  missing
- Property oversight:
  missing
- Terms management:
  missing

Assessment:

- admin has a usable core around users and role requests, but most console-style operations shown in the UI are not implemented yet

## 2. Main mismatch categories

### Endpoint path mismatch

- ops UI contract currently assumes cleaner host/admin-specific paths for some screens, while current code keeps several shared ops endpoints under generic paths

### Response shape mismatch

- many existing endpoints likely return enough data semantically, but field names and nesting are not yet frozen to current UI vocabulary

### Missing screen-specific composition

- dashboard and mypage-style screens often need one small aggregate response instead of several raw domain calls

### Missing whole features

- guest recovery
- host property CRUD
- host room type CRUD
- admin dashboard
- admin audit/system/property/terms management

## 3. UI-first readiness conclusion

The backend is not already complete for the current UI-first direction.

More precise conclusion:

- guest: mostly yes, except recovery and DTO cleanup
- host: yes for reservation/block/pricing core, no for property/room-type/admin-style management surfaces
- admin: yes for users and host-role-requests core, no for broader console features

## 4. Merge plan update

The merge plan should be adjusted to this order.

### Phase 1

- freeze guest and ops UI contracts
- use
  [GUEST_UI_CONTRACT_MATRIX.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/GUEST_UI_CONTRACT_MATRIX.md)
  and
  [OPS_UI_CONTRACT_MATRIX.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/OPS_UI_CONTRACT_MATRIX.md)

### Phase 2

- connect `guest-web` anonymous browse
- connect `guest-web` reservation create/list/detail/cancel
- connect `guest-web` account and mypage

Reason:

- highest current backend readiness
- best end-to-end value
- lowest backend expansion cost

### Phase 3

- connect `ops-web` host reservation list/detail/approve/reject/reassign
- connect `ops-web` room block
- connect `ops-web` pricing

Reason:

- these flows already exist in backend and validate host operations quickly

### Phase 4

- connect `ops-web` admin users
- connect `ops-web` admin host role requests

Reason:

- these also already exist and are close to current UI needs

### Phase 5

- expand backend to support host property CRUD and room type CRUD
- add host dashboard summary and host account UI contract cleanup

### Phase 6

- expand backend to support admin dashboard, audit logs, system logs, property oversight, and terms management

### Phase 7

- implement guest recovery only when the team decides whether it is in the immediate UI delivery slice or intentionally deferred

## 5. Immediate decisions to keep stable

- UI remains the contract source.
- Do not bend the UI to fit current backend naming.
- For close-but-not-exact APIs, prefer DTO reshaping over UI redesign.
- For missing features, add backend scope deliberately and document conflicts separately.

Related docs:

- [UI_FIRST_INTEGRATION_PLAN.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_FIRST_INTEGRATION_PLAN.md)
- [UI_DRAFT_ANALYSIS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_DRAFT_ANALYSIS.md)
- [CODE_SRS_CONFLICTS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODE_SRS_CONFLICTS.md)
