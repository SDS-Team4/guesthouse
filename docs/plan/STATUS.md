# STATUS

## Current milestone
- Host/admin demo bundle A: host-first reservation operations, host asset-management foundation, operational cancellation, and smoke-test UI cleanup

## Decisions made
- Search/detail availability stays read-only and does not allocate inventory before the existing reservation request endpoint is used.
- Search/detail availability continues to treat `PENDING` and `CONFIRMED` reservations as inventory-consuming (`BD-05`).
- Room-type availability and calendar reads continue to exclude only room-level `ACTIVE` blocks (`BD-08`).
- Guest cancellation follows fixed `OQ-08`: a guest may cancel only before the effective `check_in_date + check_in_time` cutoff.
- Guest-facing reservation detail keeps nightly stay rows and status history, but does not expose actual room numbers.
- Host and admin reservation operations now share the same ops runtime baseline, with admin receiving broader read/mutation access in this slice.
- Reservation reassignment is allowed only for `reservation_nights` whose `stay_date` is on or after the current business date, including same-day operational moves.
- Nightly reassignment may move to a different physical room and a different room type within the same accommodation, while the reservation header room type remains the originally booked type.
- Host calendar now uses a one-year visible window and relies on horizontal scrolling rather than a short fixed operational slice.
- Occupied-cell swap is allowed only when two reservation nights share the same stay date and both reservations remain in `PENDING` or `CONFIRMED`.
- Block/pricing linkage in ops detail remains read-only in this slice and is meant to support later M5/M6 management work.
- New room-level block creation rejects overlapping `ACTIVE` blocks on the same `room_id` to keep block semantics operationally unambiguous in V1.
- Pricing target remains room-type based only, with additive signed delta semantics and no percent mode (`BD-07`).
- Overlapping active price policies remain allowed and their deltas stack when both date range and weekday mask apply.
- Account recovery remains TBD and explicitly out of scope for this implementation step.
- Signup does not auto-login and does not yet write `user_term_agreements` in this slice.
- Host role request remains a guest-authenticated request flow, with a single pending request allowed at a time and `DENIED` requests eligible for re-request.
- Admin approval promotes `users.role` from `GUEST` to `HOST` without dual-role support, and role change is guaranteed on fresh login rather than by forced session invalidation.
- Account recovery remains TBD and out of scope for the current alignment bundle.

## Completed
- Guest accommodation search/detail/calendar read APIs added in `guest-api`.
- Shared reservation query mapper coverage expanded for accommodation inventory, occupied nights, and active room blocks.
- `guest-web` now supports search by region/date/headcount, accommodation detail, room-type availability, daily availability calendar, and reservation creation from the detail view.
- Existing guest reservation list remains available so host decision status changes are still visible in the same browser flow.
- Guest reservation detail API, nightly stay rows, and guest-facing status history read model added.
- `guest-web` now lets the guest open a reservation detail view directly from `My reservations`.
- Guest reservation cancellation API/UI added with guest ownership enforcement, cutoff validation, `CANCELLED` transition, inventory release via status change, and `reservation_status_history` write for `GUEST_CANCELLED`.
- `ops-api` now supports reservation list queries across `PENDING`, `CONFIRMED`, and `CANCELLED`, plus a richer reservation detail read model for operations.
- `ops-api` now exposes nightly assigned room data, block overlap context, pricing overlap context, and reassignment eligibility/candidate room data in reservation detail.
- `ops-api` approve/reject flows now allow admin actors in addition to hosts and write minimal audit log rows for approve/reject/reassign operations.
- `ops-api` now supports same-day-and-future nightly reassignment with host ownership checks, admin override access, room-level block checks, and active occupancy checks.
- `ops-web` now includes a status-filtered reservation list, reservation detail view, pending approve/reject actions, and a minimal nightly reassignment UI.
- `guest-web` now adds KST business-date validation and date input guards so obviously invalid past-date searches are blocked before request submission.
- `ops-api` now exposes room-block management endpoints for accommodation/room-scoped block list, room-level block creation, and block deactivation with host/admin access control.
- `ops-api` block creation now validates room ownership, room active status, date range validity, and overlapping active block rejection, and writes `ROOM_BLOCK` audit rows.
- `ops-web` now includes a minimal room-block management panel with accommodation/room filters, block create, and block deactivate actions.
- Existing guest availability reads and ops reassignment validation continue to reflect only `ACTIVE` room blocks, so created/deactivated blocks now affect those flows immediately without extra sync logic.
- `ops-api` now exposes pricing-policy management endpoints for accommodation/room-type-scoped list, additive delta policy create, and policy deactivate with host/admin access control.
- `ops-api` pricing policy creation now validates room-type ownership, active room-type status, date range validity, and `day_of_week_mask` bounds while keeping overlapping active policies allowed.
- `ops-api` now writes `PRICE_POLICY` audit rows for create/deactivate actions.
- `ops-web` now includes a minimal pricing management panel with accommodation/room-type filters, additive delta policy create, weekday-mask selection, and deactivate actions.
- `guest-api` accommodation search/detail responses now include check-in-night pricing preview values computed as `base_price + sum(applicable active deltas)`.
- `guest-web` now shows both base price and check-in preview price so active pricing-policy changes are visible in browser testing.
- Existing ops reservation detail pricing context continues to read active overlapping price policies, so create/deactivate now affects that detail view immediately without extra sync logic.
- `guest-api` now supports guest signup with duplicate `login_id` / `email` / `phone` validation, bcrypt password hashing, and transactional creation of `users` plus `user_login_security`.
- `guest-web` now includes a minimal signup form with clear duplicate/conflict and validation feedback.
- `guest-api` now supports guest-authenticated host role request read/create flow with active-guest eligibility checks, pending-request deduplication, approved-request blocking, and create audit logging.
- `guest-web` now includes a minimal host-role-request panel that shows request state, blocked reason, latest review outcome, and request submission.
- `ops-api` now exposes admin-only user list/detail endpoints and admin-only host-role-request list/detail/approve/reject endpoints.
- `ops-api` host-role-request approval now updates request review metadata and promotes the requester role from `GUEST` to `HOST` in one transaction, with minimal audit logging for create/approve/reject actions.
- `ops-web` now includes an admin-only user management and host-role-request review panel, while existing host reservation/block/pricing panels remain unchanged for host users.
- `ops-web` now uses a role-aware host/admin shell with dedicated live pages for reservations, reservation detail, room blocks, pricing, admin users, and host-role-request review, while preserving the existing validated ops-api contracts.
- The original host/admin design drafts are now retained under `ops-web/src/design/` as frozen visual references rather than runtime entry files.
- `ops-api` now exposes host-only accommodation, room type, and room create/read/update/deactivate endpoints with host ownership checks, reservation/assignment safety guards, and asset audit logging.
- `ops-api` now supports host/admin operational reservation cancellation with required reason capture, status-history write, and existing cancellation semantics preserved.
- `ops-web` now includes a live host properties page for accommodation profile management, room-type management, and room management, anchored from the host navigation and dashboard.
- `ops-web` now removes preview pages from the runtime path, adds destructive-action confirmations, and rewrites the most visible host/admin copy away from smoke-test language.
- Admin user detail now links back into host-role-request governance so the demo can move between user inspection and request review without losing context.
- `ops-api` reservation calendar now supports a one-year visible date window for host operations.
- `ops-api` now supports same-date occupied-cell reservation-night swap as a dedicated host/admin mutation, while keeping empty-target reassignment on the existing endpoint.
- `ops-web` host calendar now shows compact reservation identifiers in occupied cells and lets hosts swap two occupied same-date nights by drag-and-drop.
- `guest-api` signup success responses no longer expose the internal numeric `userId`; the public contract now returns only guest-facing account summary fields needed by the current UI.

## In progress
- Browser smoke validation for the host/admin demo bundle:
  host login to calendar,
  approve/reject/cancel/reassign from calendar/detail,
  accommodation CRUD/inactivate,
  room-type CRUD/inactivate,
  room CRUD/status/inactivate,
  pricing create/deactivate,
  room-block create/deactivate,
  admin users/detail,
  admin host-role-request approve/reject.

## Next
- Run browser demo rehearsals for the host-first recording flow and remove any remaining copy/layout friction discovered in that pass.
- If the demo script still needs more admin depth after Bundle A validation, the next safest bundle is read-only admin audit-log list/detail without reopening system-log or notice scope.
- Guest-side follow-up remains secondary unless a host/admin demo blocker exposes a cross-flow mismatch that must be corrected.

## Known issues
- `guest-web` uses a single-page practical smoke UI rather than routed pages, so the read slice is functional but intentionally minimal.
- `ops-web` now has internal page navigation and a draft-aligned shell, but it still does not use router-based URLs.
- Host/admin runtime still uses internal page state rather than router-based URLs.
- The local workspace still reports a Node engine drift warning because the repo baseline wants Node `24.x` while the current machine is on `v20.11.1`, although the validated builds completed successfully in this pass.
- Spring Boot test code still emits `@MockBean` deprecation warnings during Gradle test compilation.
- Role promotion updates the database immediately, but existing sessions are not force-invalidated in this slice, so new host access should be verified with a fresh ops-web login.
- Account recovery still remains intentionally deferred.
