# Environment Setup Guide

## 1) Goal

JDK 17 기반에서 팀원 간 개발 환경 충돌을 줄이기 위한 표준 환경 문서입니다.

## 2) Standard Versions

`requirements.txt` 기준으로 아래 버전을 사용합니다.

- JDK 17
- Spring Boot 3.2.x
- Maven 3.9.x 또는 Gradle 8.5+
- MySQL 8.0.x
- MyBatis Spring Boot Starter 3.0.x
- Node.js 20.x, npm 10.x, React 18.x
- Nginx 1.24.x

## 3) Compatibility Rules (JDK 17)

- Spring Boot는 3.x 계열을 사용합니다. (Java 17 이상 요구)
- `javax.*` 대신 `jakarta.*` 네임스페이스를 사용합니다.
- JDK 17 환경에서 Lombok 사용 시 최신 버전 사용을 권장합니다.
- 로컬/CI 모두 Java Toolchain 또는 `JAVA_HOME`을 JDK 17로 고정합니다.

## 4) Conflict Prevention Checklist

- IDE 프로젝트 SDK: JDK 17
- 빌드 JVM: JDK 17 (`mvn -v`, `gradle -v`로 확인)
- DB 문자셋: `utf8mb4`
- 서버/DB 타임존: `Asia/Seoul` (또는 UTC로 통일 시 문서화)
- 프론트 Node 버전 고정: Node 20 LTS

## 5) Required Environment Variables

아래 키는 `.env` 또는 실행 환경에 설정합니다.

- `SPRING_PROFILES_ACTIVE=local`
- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_NAME=guesthouse`
- `DB_USER=<your_user>`
- `DB_PASSWORD=<your_password>`
- `GUEST_SERVER_PORT=8080`
- `HOST_ADMIN_SERVER_PORT=8081`

## 6) Local Run (Example)

### Backend

1. JDK 17 확인
2. DB 실행 및 스키마 준비
3. Spring Boot 실행

### Frontend

1. Node 20 확인
2. 의존성 설치
3. 개발 서버 실행

## 7) Verification Commands

- `java -version` → 17 확인
- `mvn -v` 또는 `gradle -v` → Java 17로 동작 확인
- `node -v` → 20.x 확인
- `mysql --version` → 8.0.x 확인

## 8) CI Recommendation

- CI 빌드 이미지에 JDK 17 고정
- 빌드 시작 전 버전 검증 스크립트 실행
- main 브랜치 병합 전 API/DB 호환성 체크
