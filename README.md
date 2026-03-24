# guesthouse

게스트하우스

## 프로젝트 기준

- 기술 기준선: [TECH_STACK_BASELINE](docs/spec/TECH_STACK_BASELINE.md)
- 요구사항/도메인 기준선: `SRS`, `OPEN_QUESTIONS.md`, `PLANS.md`, `SCHEMA_RECONCILIATION.md`
- 런타임 분리: `guest-web`, `ops-web`, `guest-api`, `ops-api`
- 인증 방향: 세션 기반, Redis-backed session storage, `JWT` 미사용
- 백엔드 방향: Spring Boot + MyBatis + MySQL + Redis
- 프론트엔드 방향: React + Vite
- 공통 환경 기준: Java 21, Spring Boot 3.5.x, Gradle 8.10.x, MySQL 8.4.x, Redis 7.2.x, Node 24.x, pnpm 9.x, React 18.2.x, TypeScript 5.6.x, Vite 5.4.x
- 공통 운영 기준: `Asia/Seoul`, `UTF-8`, `LF`

## 문서

- [Tech Stack Baseline](docs/spec/TECH_STACK_BASELINE.md)
- [Requirements Baseline](requirements.txt)
- [초기 문서 아카이브](초기버전)

## 메모

- 초기 버전 문서(`SRS.md`, `API_SPEC.md`, `openapi.yaml`, `ENVIRONMENT_SETUP.md`, `.env.example`, `application-example.yml`)는 [초기버전](초기버전) 폴더로 이동했습니다.
- 현재 루트의 `requirements.txt`는 팀 공통 기술 기준선을 요약한 문서성 파일입니다.
