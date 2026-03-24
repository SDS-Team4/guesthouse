# DEV_ENV_CONVENTIONS

## Purpose

이 문서는 3개의 병렬 데모 구현이 같은 환경 규칙 위에서 움직이도록 로컬 개발 기준을 고정한다. 목적은 환경 변수 이름, 포트, DB/Redis 사용 방식, timezone, logging 규칙이 브랜치마다 달라지는 일을 막는 것이다.

## Fixed port conventions

| Service | Port | Rule |
|---|---|---|
| `guest-api` | `8080` | fixed team baseline |
| `ops-api` | `8081` | fixed team baseline |
| `guest-web` | `5173` | fixed team baseline |
| `ops-web` | `5174` | fixed team baseline |
| MySQL | `3306` | fixed team baseline |
| Redis | `6379` | fixed team baseline |

포트 충돌이 있더라도 baseline 문서를 바꾸지 않고 branch-local override로만 처리한다.

## Fixed environment variable naming

### Canonical shared keys

아래 키는 공통 baseline으로 유지한다.

- `SPRING_PROFILES_ACTIVE`
- `SERVER_PORT`
- `APP_TIMEZONE`
- `APP_LOCALE`
- `APP_ENCODING`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `MYSQL_DATABASE`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_SESSION_NAMESPACE`
- `SES_REGION`
- `SOLAPI_API_KEY`
- `SOLAPI_API_SECRET`

### Naming rules for future keys

- app-wide settings: `APP_`
- guest API settings: `GUEST_API_`
- ops API settings: `OPS_API_`
- guest web settings: `GUEST_WEB_`
- ops web settings: `OPS_WEB_`
- database settings: `DB_` or `MYSQL_`
- Redis settings: `REDIS_`
- external providers: provider prefix

## Standard local DB naming for 3 developers

브랜치별 로컬 DB 이름은 아래 패턴으로 표준화한다.

- developer A: `guesthouse_demo_a`
- developer B: `guesthouse_demo_b`
- developer C: `guesthouse_demo_c`

규칙:

- 각 데모는 자기 전용 로컬 DB를 사용한다.
- 세 데모가 하나의 로컬 DB를 공유하지 않는다.
- DB 이름 prefix는 항상 `guesthouse_`를 유지한다.

## Redis / session conventions

- 세션 저장은 Redis만 사용한다.
- JWT를 대체 baseline으로 도입하지 않는다.
- Redis 기본 포트는 `6379`이다.
- 데모 간 세션 key 충돌을 막기 위해 namespace를 분리한다.

권장 namespace:

- developer A: `guesthouse:demo-a:session`
- developer B: `guesthouse:demo-b:session`
- developer C: `guesthouse:demo-c:session`

Redis/session에서 브랜치 간 달라지면 안 되는 것:

- session-based auth
- Redis-backed session storage
- logout/session invalidation 방향

## Timezone / encoding / locale conventions

- timezone: `Asia/Seoul`
- locale baseline: `ko-KR`
- encoding: `UTF-8`
- line endings in repo: `LF`
- datetime serialization: ISO-8601 with offset where applicable

추가 규칙:

- 비즈니스 날짜 계산은 `Asia/Seoul` 기준으로 해석한다.
- 브랜치마다 UTC와 KST를 섞어 쓰지 않는다.
- OS 기본 locale 차이에 의존하는 문자열 처리나 날짜 처리를 피한다.

## Logging conventions

로컬 로그와 데모 비교용 로그는 최소한 아래 필드를 찾을 수 있어야 한다.

- timestamp
- service name
- environment
- log level
- request id or trace id if available
- user id or actor id if known

금지 사항:

- password, token, secret 원문 로그
- 내부 stack trace를 사용자 응답에 그대로 노출
- 브랜치마다 다른 masking 규칙 사용

## Migration / seed-data expectations

- 로컬 DB 상태를 수동 클릭 작업으로 만들지 않는다.
- 각 데모 구현은 재현 가능한 bootstrap 방식을 가져야 한다.
- 각 데모 구현은 비교 가능한 최소 seed data shape를 유지한다.

최소 seed-data shape:

- guest 1명 이상
- host 1명 이상
- accommodation 1개 이상
- room type 2개 이상
- room 3개 이상
- reservation, pricing, block 검증이 가능한 샘플 데이터

## Docker Compose recommendation

팀 공통 권장 방식은 Docker Compose로 MySQL과 Redis를 띄우는 것이다.

- 추천 이유: OS 차이를 줄이고 초기 실행 절차를 간단하게 맞출 수 있다.
- 허용 예외: native MySQL/Redis 설치도 가능하다.
- 단, native install을 쓰더라도 포트, 버전 line, timezone, DB naming, Redis namespace는 baseline과 맞춰야 한다.

## Branch-local config rules

- secrets는 commit하지 않는다.
- `.env`, `.env.local`, `application-local.yml` 같은 로컬 오버라이드는 git ignore 상태를 유지한다.
- commit 가능한 것은 `.example` 템플릿과 문서뿐이다.
- 브랜치마다 다른 포트/DB 이름이 필요하면 local override로만 처리한다.
- 공통 baseline 파일은 feature 구현 중에 습관적으로 바꾸지 않는다.

## Must not drift across branches

- service ports
- env var names
- DB naming convention
- Redis session namespace pattern
- timezone / encoding / line endings
- logging minimum fields
- Docker Compose recommendation status
- seed-data minimum shape
