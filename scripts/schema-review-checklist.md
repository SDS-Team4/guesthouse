# Schema review checklist

Use this before freezing DB migrations.

- [ ] Reservation is created by room_type, not direct guest choice of room
- [ ] reservation_night stores per-night allocation or supports it explicitly
- [ ] guest cannot read actual room assignment by default
- [ ] host ownership can be enforced in queries
- [ ] block excludes rooms from availability correctly
- [ ] price policies have overlap rules
- [ ] audit logs capture actor/target/time/reason and before/after when relevant
- [ ] auth_request stores reason and review status
- [ ] recovery verification or reset token storage exists
- [ ] login failure / lockout fields or support exists
- [ ] soft delete / inactive status policy exists where required
- [ ] indexes support search, ownership checks, and concurrency-sensitive queries
