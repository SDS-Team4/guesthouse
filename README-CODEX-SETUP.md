# 게스트하우스 예약 시스템용 Codex 세팅 가이드

이 패키지는 **SRS + SQL 초안**을 바탕으로 Codex가 계획부터 구현까지 흔들리지 않도록 시작점을 잡아주기 위한 기본 세트다.

## 이 패키지에 들어있는 것

- `AGENTS.md`  
  Codex가 항상 먼저 읽는 저장소 규칙 파일
- `.codex/config.toml`  
  프로젝트 전용 Codex 설정 예시
- `docs/spec/SPEC_BASELINE.md`  
  SRS 핵심 내용 요약 + 구현 기준선
- `docs/spec/OPEN_QUESTIONS.md`  
  구현 전에 확정해야 할 쟁점
- `docs/plan/PLANS.md`  
  초기 실행 계획 초안
- `prompts/*.md`  
  Codex 첫 세션에서 그대로 붙여넣을 프롬프트

## 추천 저장소 구조

처음부터 분리 배포를 염두에 두고 아래처럼 두는 편이 좋다.

```text
repo-root/
  AGENTS.md
  .codex/
    config.toml

  docs/
    source/
      SRS.pdf
    spec/
      SPEC_BASELINE.md
      OPEN_QUESTIONS.md
    plan/
      PLANS.md
      IMPLEMENT.md
      STATUS.md

  db/
    schema-draft.sql
    migrations/

  guest-api/
  ops-api/
  guest-web/
  ops-web/
  shared/
  infra/
```

## 가장 먼저 할 일

1. 네 로컬 프로젝트 루트에 이 파일들을 복사한다.
2. SRS PDF를 `docs/source/SRS.pdf`로 둔다.
3. SQL 파일을 `db/schema-draft.sql`로 둔다.
4. Git 초기 체크포인트를 만든다.
5. Codex를 `/plan` 모드로 시작한다.
6. `prompts/01-kickoff-plan.md` 내용을 첫 메시지로 넣는다.

## Codex 설치

CLI 기준:

```bash
npm i -g @openai/codex
codex
```

최초 실행 시 ChatGPT 계정 또는 API 키로 로그인한다.

## Git 체크포인트

```bash
git init
git add .
git commit -m "chore: add SRS, schema draft, and Codex project rules"
```

기능 단위로 작업할 때도 항상 전후 체크포인트를 잡는다.

## 첫 5개 세션 순서

### 세션 1 — 계획만 만든다
- `/plan`
- `prompts/01-kickoff-plan.md`

목표:
- SRS를 구조적으로 읽기
- 모순/미정 사항 정리
- `docs/plan/PLANS.md` 업데이트
- 구현 전에 질문 목록 확정

### 세션 2 — 요구사항 추적표와 백로그를 만든다
- `/plan`
- `prompts/02-requirements-traceability.md`

목표:
- REQ-F / REQ-NF / REQ-SEC를 기능 단위로 묶기
- MVP와 후속 범위를 분리하기
- 각 태스크가 어떤 요구사항을 만족하는지 연결하기

### 세션 3 — 스키마와 아키텍처를 정렬한다
- `/plan`
- `prompts/03-architecture-and-schema.md`

목표:
- SRS 우선으로 DB 초안을 재검토
- `reservation_night`, 권한, 세션, 감사로그, 복구인증 설계 보강
- guest/ops 분리 런타임 설계 확정

### 세션 4 — 저장소 골조만 만든다
- Plan off 가능, 하지만 범위 작게
- `prompts/04-bootstrap-repo.md`

목표:
- 디렉터리 생성
- 공통 컨벤션, 빌드 스크립트, 기본 설정
- 아직 핵심 기능 구현은 하지 않기

### 세션 5 — M0 또는 M1 한 덩어리만 구현한다
- `prompts/05-build-first-milestone.md`

목표:
- 가장 작은 milestone 하나만 끝내기
- 테스트/문서/검증까지 같이 끝내기

## 운영 원칙

- **SRS가 우선**이다.
- SQL 파일은 **초안**으로 취급한다.
- 스펙이 충돌하면 조용히 추측해서 구현하지 말고 `OPEN_QUESTIONS.md`에 남긴다.
- 한 번에 큰 기능을 몰아서 구현하지 않는다.
- milestone마다 테스트와 문서 업데이트를 끝낸 뒤 다음 단계로 간다.

## 지금 바로 복붙할 명령

```bash
mkdir -p docs/source docs/spec docs/plan db
cp /path/to/SRS.pdf docs/source/SRS.pdf
cp /path/to/sds_final.sql db/schema-draft.sql
```

그다음 Codex 실행:

```bash
codex
```

첫 메시지는 `prompts/01-kickoff-plan.md`에서 복붙.
