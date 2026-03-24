/plan

Read the SRS and the SQL draft again.

Goal:
Produce a schema reconciliation and architecture alignment proposal before coding.

Focus on:
1. guest-api vs ops-api runtime split,
2. session auth design,
3. reservation / reservation_night model,
4. initial room allocation strategy,
5. host ownership enforcement,
6. audit log design,
7. recovery verification flow,
8. price policy conflict rules,
9. block impact on availability calculation.

Deliverables:
- a proposed repo/module structure,
- a revised domain entity list,
- a list of schema changes required before implementation,
- indexes/constraints needed for correctness,
- a validation strategy for overbooking prevention.

Do not implement full features yet.
If you create docs, prefer:
- docs/spec/SCHEMA_RECONCILIATION.md
- docs/spec/ARCHITECTURE_NOTES.md
