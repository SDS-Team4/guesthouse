# TECH_STACK_BASELINE

## Purpose

이 문서는 3명의 개발자가 병렬로 데모 구현을 진행할 때 사용할 팀 공통 기술 기준선을 고정한다. 이 기준선의 목적은 기능 구현 방식보다 먼저 런타임, 프레임워크, 의존성 관리, 로컬 실행 전제를 맞춰서 불필요한 version drift를 줄이는 데 있다.

이 문서는 제품/도메인 요구사항을 다시 결정하지 않는다. 도메인 baseline은 SRS, `OPEN_QUESTIONS.md`, `PLANS.md`, `SCHEMA_RECONCILIATION.md`를 따른다.

## Fixed stack direction

아래 방향은 팀 공통 고정 baseline이다.

- Backend: `Spring Boot + MyBatis + MySQL + Redis`
- Frontend: `React`
- Runtime split: `guest-web`, `ops-web`, `guest-api`, `ops-api`
- Auth direction: `session-based auth`, `Redis-backed session storage`, `no JWT`

## Fixed team baseline

아래 항목은 세 데모 구현이 모두 동일한 기준선을 따라야 한다.

| Area | Baseline | Why this baseline was chosen |
|---|---|---|
| Local OS assumption | `Windows 11`, `macOS 14+`, `Ubuntu 22.04+` | 팀 OS는 달라도 되지만, 이 세 환경에서 무리 없이 맞출 수 있는 보수적 기준이다. |
| Java | `21 LTS` | 장기 지원 버전이고 Spring Boot 3.x 계열과의 조합이 안정적이다. |
| Spring Boot | `3.5.x` | 너무 이른 실험 버전이 아니라 팀 병렬 개발용으로 실용적인 안정 라인이다. |
| Build tool | `Gradle 8.10.x` | wrapper 기반으로 팀 전체 버전 고정이 쉽고 Spring Boot와 잘 맞는다. |
| MyBatis | `3.5.x` | 현재 아키텍처 방향과 잘 맞고 팀 간 구현 차이를 만들 이유가 적다. |
| MySQL | `8.4 LTS` | 장기 지원 라인이라 개발 환경과 이후 운영 전환 모두에 보수적이다. |
| Redis | `7.2.x` | 세션 저장소 용도로 충분히 안정적이고 과도한 최신 의존을 피할 수 있다. |
| Node.js | `24 LTS` | 팀 공통 Node line을 하나로 고정해 frontend toolchain drift를 줄이기 위한 선택이다. |
| Package manager | `pnpm 9.x` | 멀티앱 구조에서 설치 결과와 lockfile 관리 일관성이 좋다. |
| React | `18.2.x` | 안정성과 생태계 호환성을 우선한 선택이다. 최신 버전 부재 주장이나 기능 제한 선언이 아니다. |
| TypeScript | `5.6.x` | React 18 + Vite 5 조합에서 충분히 안정적이고 예측 가능하다. |
| Frontend tooling | `Vite 5.4.x` | 빠른 로컬 개발과 단순한 설정을 위해 선택했다. 최신 추종보다 비교 가능성을 우선한다. |
| Business timezone | `Asia/Seoul` | SRS와 팀 운영 문맥에 맞고 날짜/재고 계산 일관성에 중요하다. |
| Encoding / line endings | `UTF-8 + LF` | OS가 달라도 문서/소스 diff와 실행 결과를 안정적으로 유지할 수 있다. |

## Allowed variation

아래는 같은 version line 안에서만 미세하게 달라도 된다.

- Java patch version in `21.x`
- Spring Boot patch version in `3.5.x`
- Gradle patch version in `8.10.x`
- MyBatis patch version in `3.5.x`
- MySQL patch version in `8.4.x`
- Redis patch version in `7.2.x`
- Node.js patch version in `24.x`
- IDE choice: `IntelliJ IDEA` or `VS Code`
- local service startup method: native install or container

major line 또는 minor line을 바꾸는 변경은 feature branch에서 하지 않고 baseline change로만 다룬다.

## Optional local tooling

아래는 권장 사항이지 팀 공통 강제 사항은 아니다.

- Docker Desktop / Colima / Rancher Desktop
- IntelliJ IDEA
- VS Code
- DBeaver / TablePlus / MySQL Workbench
- Redis Insight

## Stability note

이 기준선은 가능한 가장 최신 버전을 쫓기 위한 문서가 아니다. 팀 병렬 데모 구현에서 비교 가능성과 초기 설정 안정성을 높이기 위한 기준선이다.

특히 아래는 안정성 선택임을 명시한다.

- `React 18.2.x + Vite 5.4.x`는 안정적인 공통선으로 고른 것이다.
- 이것이 더 새로운 React/Vite 버전이 없다는 뜻은 아니다.
- baseline 변경이 필요하면 feature 구현과 분리된 별도 baseline PR로 올린다.

## What must not drift across demo implementations

- Spring Boot + MyBatis + MySQL + Redis + React 방향
- guest/ops runtime split
- Java 21 line
- Spring Boot 3.5.x line
- Gradle 8.10.x line
- Node 24 line
- pnpm 9 line
- React 18.2.x line
- TypeScript 5.6.x line
- Vite 5.4.x line
- Redis-backed session direction
- `Asia/Seoul`, `UTF-8`, `LF`

## Team default decisions

이 baseline package에서는 아래를 추가 확인 없이 기본값으로 채택한다.

- `Gradle`, not Maven
- `pnpm`, not npm
- `Vite`, not alternative React tooling
- Docker Compose recommended for MySQL and Redis
- local native install also allowed

## Baseline rollout recommendation

구현 시작 전에는 아래 순서로 이 기준선을 실제 저장소에 반영하는 것을 권장한다.

1. backend Gradle wrapper 고정
2. frontend pnpm workspace 고정
3. service별 env template 정리
4. CI에서 Java/Node/version line 검사 추가

현재 문서는 위 작업을 위한 기준 문서이며, production feature code를 포함하지 않는다.
