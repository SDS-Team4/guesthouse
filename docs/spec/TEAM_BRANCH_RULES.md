# TEAM_BRANCH_RULES

## Purpose

이 문서는 3명의 개발자가 병렬 데모 구현을 할 때 브랜치 이름과 baseline 변경 절차를 간단하고 실무적으로 맞추기 위한 규칙이다.

## Recommended branch names

- developer A: `demo/a/<milestone>-<topic>`
- developer B: `demo/b/<milestone>-<topic>`
- developer C: `demo/c/<milestone>-<topic>`
- shared baseline work: `baseline/<topic>`

예시:

- `demo/a/m1-auth`
- `demo/b/m3-reservation`
- `demo/c/m5-ops-assets`
- `baseline/tech-stack`

## Baseline / frozen files

아래 파일은 feature branch에서 casual하게 바꾸지 않는다.

- `docs/spec/TECH_STACK_BASELINE.md`
- `docs/spec/DEV_ENV_CONVENTIONS.md`
- `docs/spec/TEAM_BRANCH_RULES.md`
- `docs/spec/SPEC_BASELINE.md`
- `docs/spec/OPEN_QUESTIONS.md`
- `docs/plan/PLANS.md`
- `docs/plan/SCHEMA_RECONCILIATION.md`
- `.nvmrc`
- `.java-version`
- `.editorconfig`
- `.gitattributes`
- `.env.example`
- `application-example.yml`

## How to propose a shared baseline change

1. `baseline/<topic>` 브랜치를 만든다.
2. 변경 범위를 baseline docs/config 파일로 제한한다.
3. 왜 바꾸는지와 어떤 브랜치에 영향이 있는지 적는다.
4. feature PR과 섞지 않고 별도 PR로 올린다.
5. baseline 반영 후 demo branches가 따라오게 한다.

## What demo branches may change freely

- 자신이 맡은 app/module 구현 코드
- 해당 구현용 테스트
- branch-local bootstrap scripts
- demo 설명 문서
- branch-local seed data

단, domain baseline이나 shared tech baseline을 다시 열면 안 된다.

## Demo comparison checklist

- 같은 SRS/domain baseline을 따르는가
- 같은 tech stack/version line을 쓰는가
- 같은 env var names와 ports를 쓰는가
- 같은 DB naming과 Redis session namespace 규칙을 쓰는가
- guest/ops runtime split을 유지하는가
- 차이가 기능 구현 전략인지 baseline drift인지 구분 가능한가
