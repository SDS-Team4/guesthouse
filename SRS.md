# Software Requirements Specification (SRS)

## 게스트하우스 예약 시스템

**Version:** 1.1 (보강본)  
**Status:** Approved Baseline  
**Team 4:** 임재민 / 권용준 / 임다움 / 권수현 / 김이지 / 이유단  
**Date:** 2026-03-19 (Updated: 2026-03-24)

---

# 1. Introduction

## 1.1 Purpose

본 문서는 게스트하우스 예약 시스템의 소프트웨어 요구사항 명세서이다.  
게스트, 호스트, 관리자 각각의 기능과 시스템 요구사항을 정의하며, **설계·개발·테스트·운영의 기준 문서**로 사용된다.

## 1.2 Document Conventions

- “시스템은 ~해야 한다” → 필수 요구사항(MUST)
- 기능 요구사항: `REQ-F-*`
- 비기능 요구사항: `REQ-NF-*`
- 보안 요구사항: `REQ-SEC-*`
- 기타 운영/구현 요구사항: `REQ-OTH-*`
- UI 요구사항: `UI-*`

## 1.3 Intended Audience

| 대상       | 주요 참고 내용                |
| ---------- | ----------------------------- |
| 백엔드     | API 계약, DB 모델, 트랜잭션   |
| 프론트엔드 | UI 흐름, 입력/출력 규칙       |
| QA         | 기능/비기능 테스트 기준       |
| 관리자     | 운영 정책, 권한/로그 관리     |
| 사용자     | 서비스 이해, 사용 시나리오    |

## 1.4 Product Scope

### 목표

- OTA 의존도 감소
- 호스트 독립 운영
- 직관적 예약 UX 제공

### 핵심 기능

- 게스트: 숙소 탐색, 예약 요청, 예약 조회/취소
- 호스트: 숙소/객실/가격/Block 관리, 예약 확정/취소, 객실 배정 변경
- 관리자: 회원 및 권한 관리, 감사/운영 로그 조회, 공지/약관 관리

### 기술 원칙

- 게스트 영역과 운영(호스트/관리자) 영역 분리
- 트랜잭션 기반 예약 처리
- Lock 기반 동시성 제어

## 1.5 References

- IEEE 830 SRS Guide
- 소프트웨어 개발보안 가이드(행정안전부/KISA)

---

# 2. Overall Description

## 2.1 Product Perspective

본 시스템은 신규 구축되는 독립형 웹 애플리케이션이며, 게스트 서비스와 운영 백오피스를 분리한 구조를 채택한다.

## 2.2 System Architecture

- Guest Frontend (React)
- Host/Admin Frontend (React)
- Guest API Server (Spring Boot)
- Host/Admin API Server (Spring Boot)
- Shared Database (MySQL)
- Auth/Session Module
- Concurrency Control Module
- Audit Log Module

## 2.3 User Roles

| 역할  | 설명                                |
| ----- | ----------------------------------- |
| Guest | 예약 사용자                         |
| Host  | 본인 숙소/객실/예약을 운영하는 사용자 |
| Admin | 전체 시스템 운영 및 감사 담당자      |

## 2.4 Operating Environment

- Frontend: React
- Backend: Spring Boot (Java)
- DB: MySQL
- Web Server/Proxy: Nginx
- OS: Linux 계열 운영환경 기준

## 2.5 Constraints

- 서버 분리 필수(게스트 vs 운영)
- 예약 접수 단위: 객실 타입
- 비밀번호 저장: Bcrypt 필수
- 인증 방식: 세션 기반, JWT 미사용
- 주요 삭제 정책: 예약 이력 존재 시 비활성화 우선

## 2.6 Assumptions & Dependencies

- 외부 문자/이메일 발송 인프라 정상 동작
- HTTPS 인증서 및 도메인 운영 가능
- MySQL 트랜잭션/락 기능 정상 제공

---

# 3. External Interface Requirements

## 3.1 User Interface Flow

- 게스트: 메인 → 검색 → 상세 → 예약 → 완료 → 마이페이지
- 호스트: 로그인 → 대시보드 → 숙소/객실/예약 관리
- 관리자: 로그인 → 대시보드 → 회원/권한/로그/공지 관리

## 3.2 Software Interface (요약)

- `SI-WAS-001`: 웹 애플리케이션 서버, REST(JSON), HTTPS
- `SI-SESSION-001`: 세션 저장/검증 모듈
- `SI-RDBMS-001`: MySQL 연동(JDBC)
- `SI-HASH-001`: BCrypt 해시 라이브러리

---

# 4. System Features

## 4.1 게스트 인증 및 회원 관리

- 회원가입, 로그인/로그아웃, 개인정보 조회/수정
- 로그인 상태 비밀번호 변경
- 아이디 찾기, 비밀번호 찾기/재설정
- 참조 요구사항: `REQ-F-001` ~ `REQ-F-035`

## 4.2 숙소 탐색

- 도시/날짜/인원 기반 검색
- 판매 가능/조건 불일치/판매 완료 구분
- 정렬 적용 시 대분류 순서 유지
- 참조 요구사항: `REQ-F-036` ~ `REQ-F-049`

## 4.3 예약 요청, 점유 및 초기 배정

- 객실 타입 기준 예약 요청
- 예약 버튼 시점 재고 점유
- 트랜잭션 + 락 기반 동시성 제어
- 실패 시 롤백
- 참조 요구사항: `REQ-F-050` ~ `REQ-F-061`

## 4.4 게스트 예약 조회 및 취소

- 본인 예약 목록/상세 조회
- 취소 가능 검증 후 취소
- 게스트의 직접 객실 변경 금지
- 참조 요구사항: `REQ-F-062` ~ `REQ-F-069`

## 4.5 호스트 인증 및 계정 관리

- 호스트 전용 로그인/로그아웃
- 계정 조회 및 비밀번호 변경
- 참조 요구사항: `REQ-F-070` ~ `REQ-F-075`

## 4.6 숙소/객실 타입/개별 객실/가격 정책 관리

- 숙소 등록/조회/수정/비활성화
- 객실 타입 등록/조회/수정/비활성화
- 개별 객실 등록/조회/수정/비활성화
- 가격 정책 등록/수정/삭제 및 기본가 적용
- 참조 요구사항: `REQ-F-076` ~ `REQ-F-089`

## 4.7 개별 객실 Block 관리

- 개별 객실 단위 Block 생성/수정/해제
- 예약 데이터와 Block 데이터 분리
- 재고 계산 시 Block 제외
- 참조 요구사항: `REQ-F-090` ~ `REQ-F-095`

## 4.8 호스트 예약 운영 관리

- 예약 목록/상세 조회
- 예약 확정/취소
- 숙박일 단위 실제 객실 배정 변경
- 참조 요구사항: `REQ-F-096` ~ `REQ-F-106`

## 4.9 관리자 기능 및 서버 분리

- 관리자 전용 진입점/운영 환경 분리
- 회원/권한/로그/공지/약관/운영현황 관리
- 감사 로그 저장 및 조회
- 참조 요구사항: `REQ-F-107` ~ `REQ-F-127`

---

# 5. Nonfunctional Requirements

## 5.1 Performance

- `REQ-NF-001`: 숙소 목록 조회 P95 3초 이내
- `REQ-NF-002`: 숙소 상세 조회 P95 2초 이내
- `REQ-NF-003`: 예약 요청 처리(점유 반영) P95 3초 이내
- `REQ-NF-004`: 관리자 예약 목록 조회 P95 3초 이내
- `REQ-NF-005`: 동일 객실 타입 동시 요청 시 중복 점유 0건

## 5.2 Capacity (추가)

- `REQ-NF-008`: 동시 활성 사용자 500명 기준 성능 기준 충족
- `REQ-NF-009`: 예약 요청 피크 50 RPS 구간에서 안정 처리

## 5.3 Availability & Recovery (추가)

- `REQ-NF-010`: 월 가용성 목표 99.5% 이상
- `REQ-NF-011`: 백업 주기 1일 1회 이상
- `REQ-NF-012`: 장애 복구 목표 RPO 24시간, RTO 4시간 이내

## 5.4 Security

- `REQ-SEC-001`: 로그인 실패 횟수 제한 또는 동등한 보호 정책
- `REQ-SEC-002`: 비밀번호 평문 저장 금지(Bcrypt)
- `REQ-SEC-003`: 인증/개인정보 전송 HTTPS 필수
- `REQ-SEC-004`: 게스트는 본인 데이터만 접근 가능
- `REQ-SEC-005`: 호스트는 본인 소유 숙소 데이터만 접근 가능
- `REQ-SEC-006`: 관리자 영역 강화 접근통제
- `REQ-SEC-007`: 내부 정보(스택트레이스/SQL) 노출 금지
- `REQ-SEC-008`: 세션 안전 생성/검증/종료

## 5.5 Data Integrity

- 트랜잭션 원자성 보장
- Lock 기반 재고 무결성 보장
- 감사 로그 추적 가능성 보장

## 5.6 Usability

- 직관적 UI
- 모바일 대응
- 주요 위험 동작(확정/취소/배정변경) 확인 절차 제공

---

# 6. Business Rules

- `BR-001`: 예약은 객실 타입 기준으로 접수한다.
- `BR-002`: 실제 객실 최종 배정/변경 권한은 호스트에게만 있다.
- `BR-003`: 예약 요청 시 재고는 즉시 점유된다.
- `BR-004`: 게스트는 직접 객실을 변경할 수 없다.
- `BR-005`: 예약 이력 존재 자산(숙소/타입/객실)은 비활성화를 우선한다.
- `BR-006`: 게스트 화면에 실제 객실 번호를 기본 노출하지 않는다.

---

# 7. Reservation Status & State Transition

## 7.1 Reservation Status

| 상태      | 설명                              |
| --------- | --------------------------------- |
| PENDING   | 예약 요청 완료, 재고 점유 상태     |
| APPROVED  | 호스트 확정 완료                  |
| CANCELLED | 게스트 또는 호스트에 의해 취소됨   |

## 7.2 State Transition Rules

| 현재 상태 | 이벤트             | 다음 상태  | 수행 주체        | 비고 |
| --------- | ------------------ | ---------- | ---------------- | ---- |
| PENDING   | 호스트 예약 확정   | APPROVED   | Host             | 정상 전이 |
| PENDING   | 게스트 예약 취소   | CANCELLED  | Guest            | 취소 가능 정책 충족 시 |
| PENDING   | 호스트 예약 취소   | CANCELLED  | Host             | 사유 기록 필수 |
| APPROVED  | 호스트 예약 취소   | CANCELLED  | Host             | 사유 기록 필수 |
| CANCELLED | 상태 변경 요청     | 불가       | 시스템           | 종료 상태 |

## 7.3 Invalid Transition Policy

- 유효하지 않은 상태 전이는 `409 Conflict`로 처리한다.
- 실패 시 데이터 변경 없이 롤백한다.

---

# 8. API Contract Baseline

## 8.1 공통 규칙

- 프로토콜: HTTPS
- 데이터 포맷: JSON UTF-8
- 시간 포맷: ISO-8601 (`YYYY-MM-DDTHH:mm:ssZ`)
- 인증: 세션 쿠키 기반
- 페이징: `page`, `size` (기본 0, 20)
- 정렬: `sort=field,asc|desc`

## 8.2 표준 응답 형식

### 성공

```json
{
	"success": true,
	"data": {},
	"timestamp": "2026-03-24T09:00:00Z"
}
```

### 실패

```json
{
	"success": false,
	"errorCode": "RESERVATION_OUT_OF_STOCK",
	"message": "재고가 부족하여 예약 요청에 실패했습니다.",
	"timestamp": "2026-03-24T09:00:00Z",
	"traceId": "c7c1f2..."
}
```

## 8.3 핵심 API 그룹(요약)

- 인증: 회원가입/로그인/로그아웃/비밀번호 변경/아이디·비밀번호 찾기
- 게스트: 숙소 검색/상세/예약요청/예약조회/예약취소
- 호스트: 숙소/타입/객실/가격/Block CRUD, 예약 확정·취소·배정변경
- 관리자: 회원/권한/로그/공지/약관/운영현황

---

# 9. Data Model Baseline

## 9.1 Core Tables (논리)

- `users` (게스트/호스트/관리자 계정)
- `accommodations` (숙소)
- `room_types` (객실 타입)
- `room` (개별 객실)
- `reservations` (예약 원본)
- `reservation_nights` (숙박일 단위 실제 배정)
- `blocks` (객실 Block)
- `price_policies` (기간별 가격 정책)
- `auth_request` (호스트 권한 요청)
- `notification` (공지사항)
- `attachment` (공지 첨부파일)
- `term` (약관)
- `audit_logs` (운영 감사 로그)

## 9.2 키/제약/인덱스 원칙

- 모든 테이블 PK 필수 (`BIGINT` 또는 UUID)
- 참조 무결성 FK 필수
- 예약 핵심 인덱스:
	- `reservations(guest_id, created_at)`
	- `reservations(accommodation_id, status, check_in, check_out)`
	- `reservation_nights(room_type_id, stay_date)`
	- `blocks(room_id, start_date, end_date)`
	- `auth_request(user_id, status, requested_at)`
	- `notification(status, created_at)`
- Soft Delete 컬럼(`is_active`, `deleted_at`) 정책 사용

## 9.3 데이터 정합성 규칙

- 예약 생성/점유/초기배정은 단일 트랜잭션으로 처리
- 예약 실패 시 전체 롤백
- 감사 로그는 주요 상태 변경 시 반드시 기록

## 9.4 Enum Baseline (ERD 기준)

- `users.status`: `ACTIVE`, `INACTIVE`, `SUSPENDED`
- `users.roles`: `GUEST`, `HOST`, `ADMIN`
- `accommodations.status`: `ACTIVE`, `INACTIVE`
- `room_types.status`: `ACTIVE`, `INACTIVE`
- `room.status`: `AVAILABLE`, `UNAVAILABLE`, `MAINTENANCE`
- `reservations.status`: `PENDING`, `APPROVED`, `CANCELLED`
- `auth_request.status`: `PENDING`, `APPROVED`, `DENIED`
- `price_policies.price_type`: `DELTA`, `PERCENT`
- `price_policies.status`: `ACTIVE`, `INACTIVE`
- `blocks.status`: `ACTIVE`, `INACTIVE`
- `notification.status`: `PUBLISHED`, `DRAFT`, `ARCHIVED`
- `term.category`: `SERVICE`, `PRIVACY`, `MARKETING`
- `term.status`: `PUBLISHED`, `DRAFT`, `ARCHIVED`

---

# 10. Security & Session Policy Baseline

## 10.1 인증/세션

- 세션 만료시간: 기본 30분, 활동 시 갱신 가능
- 로그인 실패 5회 초과 시 10분 잠금(또는 동등 정책)
- 세션 쿠키 옵션: `HttpOnly`, `Secure`, `SameSite=Lax`
- 권한 변경/민감 정보 수정 시 재인증(step-up) 가능

## 10.2 비밀번호 정책

- 최소 10자 이상
- 영문/숫자/특수문자 조합 권장(최소 2종류 이상 필수)
- 최근 3회 이내 사용 비밀번호 재사용 금지(권장)

## 10.3 감사/보안 로그

- 필수 필드: actor, action, target, before/after, reason, ip, userAgent, timestamp
- 보존 기간: 최소 1년

---

# 11. Error Code Standard (초안)

| 코드                         | HTTP | 설명 |
| ---------------------------- | ---- | ---- |
| `AUTH_INVALID_CREDENTIALS`   | 401  | 로그인 정보 불일치 |
| `AUTH_SESSION_EXPIRED`       | 401  | 세션 만료 |
| `AUTH_FORBIDDEN`             | 403  | 권한 없음 |
| `RESOURCE_NOT_FOUND`         | 404  | 조회 대상 없음 |
| `VALIDATION_FAILED`          | 400  | 입력값 검증 실패 |
| `RESERVATION_OUT_OF_STOCK`   | 409  | 재고 부족 |
| `RESERVATION_CONFLICT`       | 409  | 동시성 충돌 |
| `STATE_TRANSITION_INVALID`   | 409  | 허용되지 않은 상태 변경 |
| `RATE_LIMIT_EXCEEDED`        | 429  | 요청 한도 초과 |
| `INTERNAL_SERVER_ERROR`      | 500  | 서버 내부 오류 |

---

# 12. Open Items (TBD)

- `TBD-001`: 결제(PG) 연동 범위 및 시점
- `TBD-002`: 관리자 접근 IP 제한 적용 여부
- `TBD-003`: 예약 대기(PENDING) 만료 시간 정책
- `TBD-004`: 이미지 업로드/저장소 방식
- `TBD-005`: 관리자 서버 분리 수준(논리/물리/배포)

---

# Appendix A. Glossary

- Guest: 숙소를 예약하는 일반 사용자
- Host: 숙소를 운영하는 사용자
- Admin: 플랫폼 전체를 관리하는 사용자
- Room Type: 판매 단위 객실 유형
- Room: 실제 배정되는 개별 객실
- Lock: 동시 예약 충돌 방지를 위한 재고 점유 메커니즘
- Audit Log: 주요 운영 행위 기록

---

# Appendix B. Future Plan

- 결제 기능 추가
- 모바일 앱 지원
- 데이터 분석 대시보드 고도화

---
