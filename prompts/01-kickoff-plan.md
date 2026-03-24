/plan

Read these files first, in this order:
1. AGENTS.md
2. docs/spec/SPEC_BASELINE.md
3. docs/spec/OPEN_QUESTIONS.md
4. docs/plan/PLANS.md
5. docs/source/SRS.pdf
6. db/schema-draft.sql

Do not write production code yet.

Your task:
1. verify whether the current plan matches the SRS,
2. identify internal inconsistencies or TBD items that can derail implementation,
3. compare the SQL draft against the SRS domain model,
4. update docs/plan/PLANS.md only if needed,
5. update docs/spec/OPEN_QUESTIONS.md with concrete decision options,
6. propose the smallest safe M0 deliverables.

Rules:
- SRS is the source of truth.
- SQL is draft only.
- Do not silently resolve contradictions.
- Group findings into:
  a) must decide before coding,
  b) can default safely,
  c) can defer to later milestones.

Output format:
- Summary
- Spec conflicts
- Schema mismatches
- Recommended M0 scope
- Exact next prompt for M0 implementation
