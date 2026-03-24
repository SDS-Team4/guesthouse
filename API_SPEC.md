# API Specification

## 1) Scope
게스트하우스 예약 시스템의 API 기본 계약(Contract) 문서입니다.

## 2) Common Rules
- Protocol: HTTPS
- Content-Type: `application/json; charset=UTF-8`
- Auth: Session Cookie 기반
- Time format: ISO-8601 (`YYYY-MM-DDTHH:mm:ssZ`)
- Pagination: `page`(default 0), `size`(default 20)
- Sorting: `sort=field,asc|desc`

## 3) Standard Response
### Success
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-03-24T09:00:00Z"
}
```

### Error
```json
{
  "success": false,
  "errorCode": "RESERVATION_OUT_OF_STOCK",
  "message": "재고가 부족하여 예약 요청에 실패했습니다.",
  "timestamp": "2026-03-24T09:00:00Z",
  "traceId": "abc123..."
}
```

## 4) Authentication APIs
| API | Method | Path | Description |
| --- | --- | --- | --- |
| 회원가입 | POST | `/api/v1/auth/signup` | 게스트 계정 생성 |
| 로그인 | POST | `/api/v1/auth/login` | 세션 생성 |
| 로그아웃 | POST | `/api/v1/auth/logout` | 세션 종료 |
| 비밀번호 변경 | PATCH | `/api/v1/auth/password` | 로그인 상태 변경 |
| 아이디 찾기 시작 | POST | `/api/v1/auth/find-id/request` | 인증코드 발송 |
| 아이디 찾기 검증 | POST | `/api/v1/auth/find-id/verify` | 인증코드 검증 후 아이디 표시 |
| 비밀번호 찾기 시작 | POST | `/api/v1/auth/reset-password/request` | 본인확인 요청 |
| 비밀번호 재설정 | POST | `/api/v1/auth/reset-password/confirm` | 새 비밀번호 저장 |

## 5) Guest APIs
| API | Method | Path | Description |
| --- | --- | --- | --- |
| 숙소 검색 | GET | `/api/v1/guest/accommodations` | 도시/날짜/인원 기반 검색 |
| 숙소 상세 | GET | `/api/v1/guest/accommodations/{accommodationId}` | 숙소 상세/객실 타입 |
| 객실 타입 예약 현황 | GET | `/api/v1/guest/room-types/{roomTypeId}/availability` | 날짜별 예약 가능 여부 |
| 예약 요청 | POST | `/api/v1/guest/reservations` | 객실 타입 기준 예약 생성(PENDING) |
| 내 예약 목록 | GET | `/api/v1/guest/reservations/me` | 본인 예약 조회 |
| 내 예약 상세 | GET | `/api/v1/guest/reservations/{reservationId}` | 본인 예약 상세 |
| 예약 취소 | PATCH | `/api/v1/guest/reservations/{reservationId}/cancel` | 본인 예약 취소 |

### 예약 요청 예시
```json
{
  "accommodationId": 101,
  "roomTypeId": 1001,
  "checkIn": "2026-04-10",
  "checkOut": "2026-04-12",
  "guestCount": 2,
  "requestMemo": "늦은 체크인 예정"
}
```

## 6) Host APIs
| API | Method | Path | Description |
| --- | --- | --- | --- |
| 숙소 목록 조회 | GET | `/api/v1/host/accommodations` | 본인 숙소 목록 |
| 숙소 등록 | POST | `/api/v1/host/accommodations` | 숙소 생성 |
| 숙소 수정 | PATCH | `/api/v1/host/accommodations/{accommodationId}` | 숙소 수정 |
| 숙소 비활성화 | PATCH | `/api/v1/host/accommodations/{accommodationId}/deactivate` | 숙소 비활성화 |
| 객실 타입 CRUD | POST/GET/PATCH/DELETE | `/api/v1/host/room-types` | 객실 타입 관리 |
| 개별 객실 CRUD | POST/GET/PATCH/DELETE | `/api/v1/host/rooms` | 객실 관리 |
| 가격 정책 CRUD | POST/GET/PATCH/DELETE | `/api/v1/host/price-policies` | 기간 가격 정책 |
| Block CRUD | POST/GET/PATCH/DELETE | `/api/v1/host/blocks` | 객실 Block 관리 |
| 예약 목록 조회 | GET | `/api/v1/host/reservations` | 숙소 기준 예약 조회 |
| 예약 확정 | PATCH | `/api/v1/host/reservations/{reservationId}/approve` | PENDING→APPROVED |
| 예약 취소 | PATCH | `/api/v1/host/reservations/{reservationId}/cancel` | 상태 취소 |
| 배정 변경 | PATCH | `/api/v1/host/reservations/{reservationId}/nights/{stayDate}/room` | 숙박일 단위 객실 재배정 |

## 7) Admin APIs
| API | Method | Path | Description |
| --- | --- | --- | --- |
| 회원 목록 조회 | GET | `/api/v1/admin/users` | 전체 회원 조회 |
| 회원 상세 조회 | GET | `/api/v1/admin/users/{userId}` | 회원 상세 |
| 회원 정보 수정 | PATCH | `/api/v1/admin/users/{userId}` | 회원 수정 |
| 권한 요청 목록 | GET | `/api/v1/admin/auth-requests` | 권한 요청 조회 |
| 권한 요청 처리 | PATCH | `/api/v1/admin/auth-requests/{requestId}` | 승인/거절 |
| 감사 로그 조회 | GET | `/api/v1/admin/audit-logs` | 운영 감사 로그 |
| 시스템 로그 조회 | GET | `/api/v1/admin/system-logs` | 시스템 로그 |
| 약관 CRUD | POST/GET/PATCH | `/api/v1/admin/terms` | 약관 관리 |
| 공지 CRUD | POST/GET/PATCH/DELETE | `/api/v1/admin/notifications` | 공지 관리 |
| 공지 첨부 업로드 | POST | `/api/v1/admin/notifications/{noticeId}/attachments` | 첨부파일 등록 |
| 공지 첨부 삭제 | DELETE | `/api/v1/admin/notifications/{noticeId}/attachments/{attachmentId}` | 첨부파일 삭제 |
| 운영 현황 | GET | `/api/v1/admin/operations/summary` | 통합 KPI |

## 8) Reservation State Transition
| Current | Event | Next | Actor |
| --- | --- | --- | --- |
| PENDING | Approve | APPROVED | Host |
| PENDING | Cancel | CANCELLED | Guest/Host |
| APPROVED | Cancel | CANCELLED | Host |
| CANCELLED | Any transition | Invalid | System |

- Invalid transition은 `409 STATE_TRANSITION_INVALID` 반환

## 9) Error Code
| Error Code | HTTP | Description |
| --- | --- | --- |
| `AUTH_INVALID_CREDENTIALS` | 401 | 로그인 정보 불일치 |
| `AUTH_SESSION_EXPIRED` | 401 | 세션 만료 |
| `AUTH_FORBIDDEN` | 403 | 권한 없음 |
| `RESOURCE_NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_FAILED` | 400 | 입력값 검증 실패 |
| `RESERVATION_OUT_OF_STOCK` | 409 | 재고 부족 |
| `RESERVATION_CONFLICT` | 409 | 동시성 충돌 |
| `STATE_TRANSITION_INVALID` | 409 | 상태 전이 불가 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 제한 초과 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

## 10) Notes
- 본 문서는 ERD 정합 기준 API 계약 문서이다.
- Guest/Host/Admin API는 도메인 또는 prefix 레벨에서 분리 배포 가능하다.
- ERD 정합을 위해 본 문서는 `accommodations`, `blocks`, `auth-requests`, `notifications`, `attachments` 명명 규칙을 기준으로 한다.

## 11) ERD Field Dictionary (API 노출 기준)

### 11.1 `users`
| Field | Type | Required | Constraint/Enum | Notes |
| --- | --- | --- | --- | --- |
| `user_id` | BIGINT | Y | PK | 서버 생성 |
| `login_id` | VARCHAR | Y | unique, 5~25 | 로그인 ID |
| `password_hash` | VARCHAR | Y | BCrypt hash | API 응답 미노출 |
| `name` | VARCHAR | Y | 1~50 | 사용자 이름 |
| `email` | VARCHAR | Y | email format, unique |  |
| `phone` | VARCHAR | Y | 전화번호 format |  |
| `status` | ENUM | Y | `ACTIVE`,`INACTIVE`,`SUSPENDED` |  |
| `roles` | ENUM | Y | `GUEST`,`HOST`,`ADMIN` |  |
| `termsAgreed` | TINYINT | Y | 0/1 | 약관 동의 여부 |

### 11.2 `accommodations`
| Field | Type | Required | Constraint/Enum | Notes |
| --- | --- | --- | --- | --- |
| `accommodation_id` | BIGINT | Y | PK | 서버 생성 |
| `host_id` | BIGINT | Y | FK users.user_id | 소유 호스트 |
| `name` | VARCHAR | Y | 1~100 | 숙소명 |
| `address` | VARCHAR | Y | 1~255 | 주소 |
| `region` | VARCHAR | Y | 1~50 | 지역 |
| `info_text` | TEXT | N |  | 비정형 소개 |
| `check_in_time` | TIME | Y | `HH:mm:ss` |  |
| `check_out_time` | TIME | Y | `HH:mm:ss` |  |
| `status` | ENUM | Y | `ACTIVE`,`INACTIVE` |  |

### 11.3 `room_types`
| Field | Type | Required | Constraint/Enum | Notes |
| --- | --- | --- | --- | --- |
| `room_type_id` | BIGINT | Y | PK | 서버 생성 |
| `accommodation_id` | BIGINT | Y | FK accommodations |  |
| `name` | VARCHAR | Y | 1~50 | 객실 타입명 |
| `max_capacity` | INT | Y | >=1 | 최대 인원 |
| `base_price` | INT | Y | >=0 | 기본가 |
| `info_text` | TEXT | N |  | 타입 소개 |
| `status` | ENUM | Y | `ACTIVE`,`INACTIVE` |  |

### 11.4 `room`
| Field | Type | Required | Constraint/Enum | Notes |
| --- | --- | --- | --- | --- |
| `room_id` | BIGINT | Y | PK | 서버 생성 |
| `room_type_id` | BIGINT | Y | FK room_types |  |
| `accommodation_id` | BIGINT | Y | FK accommodations |  |
| `room_code` | VARCHAR | Y | unique per accommodation | 예: 101 |
| `status` | ENUM | Y | `AVAILABLE`,`UNAVAILABLE`,`MAINTENANCE` |  |
| `memo` | TEXT | N |  | 운영 메모 |

### 11.5 `reservations`
| Field | Type | Required | Constraint/Enum | Notes |
| --- | --- | --- | --- | --- |
| `reservation_id` | BIGINT | Y | PK | 서버 생성 |
| `user_id` | BIGINT | Y | FK users | 예약자 |
| `accommodation_id` | BIGINT | Y | FK accommodations |  |
| `room_type_id` | BIGINT | Y | FK room_types |  |
| `room_id` | BIGINT | N | FK room | 초기 배정/변경 시 |
| `reservation_no` | VARCHAR | Y | unique | 예약 번호 |
| `check_in_date` | DATE | Y | `YYYY-MM-DD` |  |
| `check_out_date` | DATE | Y | `YYYY-MM-DD` | `check_out > check_in` |
| `status` | ENUM | Y | `PENDING`,`APPROVED`,`CANCELLED` |  |
| `requested_time` | DATETIME | Y |  | 요청 시각 |

### 11.6 `reservation_nights`
| Field | Type | Required | Constraint/Enum | Notes |
| --- | --- | --- | --- | --- |
| `night_id` | BIGINT | Y | PK | 서버 생성 |
| `reservation_id` | BIGINT | Y | FK reservations |  |
| `stay_date` | DATE | Y | `YYYY-MM-DD` | 숙박일 |

### 11.7 `price_policies`
| Field | Type | Required | Constraint/Enum | Notes |
| --- | --- | --- | --- | --- |
| `policy_id` | BIGINT | Y | PK | 서버 생성 |
| `accommodation_id` | BIGINT | Y | FK accommodations |  |
| `room_type_id` | BIGINT | Y | FK room_types |  |
| `policy_name` | VARCHAR | Y | 1~50 | 정책명 |
| `start_date` | DATE | Y | `YYYY-MM-DD` |  |
| `end_date` | DATE | Y | `YYYY-MM-DD` | `end_date >= start_date` |
| `price_value` | DECIMAL(12,2) | Y | >=0 |  |
| `price_type` | ENUM | Y | `DELTA`,`PERCENT` |  |
| `status` | ENUM | Y | `ACTIVE`,`INACTIVE` |  |
| `day_of_week_mask` | TINYINT | N | bit mask | 요일 적용 |

### 11.8 `blocks`
| Field | Type | Required | Constraint/Enum | Notes |
| --- | --- | --- | --- | --- |
| `block_id` | BIGINT | Y | PK | 서버 생성 |
| `accommodation_id` | BIGINT | Y | FK accommodations |  |
| `room_type_id` | BIGINT | Y | FK room_types |  |
| `room_id` | BIGINT | Y | FK room |  |
| `start_date` | DATE | Y | `YYYY-MM-DD` |  |
| `end_date` | DATE | Y | `YYYY-MM-DD` | `end_date >= start_date` |
| `reason_type` | VARCHAR | N | 1~50 | 차단 사유 |
| `status` | ENUM | Y | `ACTIVE`,`INACTIVE` |  |

### 11.9 `auth_request`
| Field | Type | Required | Constraint/Enum | Notes |
| --- | --- | --- | --- | --- |
| `request_id` | BIGINT | Y | PK | 서버 생성 |
| `user_id` | BIGINT | Y | FK users | 요청자 |
| `status` | ENUM | Y | `PENDING`,`APPROVED`,`DENIED` | 권한 요청 상태 |

### 11.10 `notification` / `attachment` / `term`
| Table | Field | Type | Required | Constraint/Enum |
| --- | --- | --- | --- | --- |
| `notification` | `notice_id` | BIGINT | Y | PK |
| `notification` | `user_id` | BIGINT | Y | FK users |
| `notification` | `title` | VARCHAR | Y | 1~100 |
| `notification` | `content` | TEXT | Y |  |
| `notification` | `status` | ENUM | Y | `PUBLISHED`,`DRAFT`,`ARCHIVED` |
| `notification` | `is_pinned` | BOOLEAN | N | default false |
| `notification` | `view_count` | BIGINT | N | default 0 |
| `attachment` | `attachment_id` | BIGINT | Y | PK |
| `attachment` | `notice_id` | BIGINT | Y | FK notification |
| `attachment` | `origin_filename` | VARCHAR | Y | 1~100 |
| `attachment` | `stored_filename` | VARCHAR | Y | 1~100 |
| `attachment` | `file_path` | VARCHAR | Y | 1~100 |
| `attachment` | `mime_type` | VARCHAR | N | 1~100 |
| `attachment` | `file_size` | INT | N | bytes |
| `attachment` | `checksum` | VARCHAR | N | hash |
| `term` | `terms_id` | BIGINT | Y | PK |
| `term` | `category` | ENUM | Y | `SERVICE`,`PRIVACY`,`MARKETING` |
| `term` | `title` | VARCHAR | Y | 1~100 |
| `term` | `content` | TEXT | Y |  |
| `term` | `version` | VARCHAR | N | 1~50 |
| `term` | `is_required` | BOOLEAN | Y |  |
| `term` | `status` | ENUM | Y | `PUBLISHED`,`DRAFT`,`ARCHIVED` |
| `term` | `effective_date` | DATETIME | Y |  |

## 12) Detailed Request/Response Schemas

### 12.1 Auth - 회원가입
- Endpoint: `POST /api/v1/auth/signup`

**Request**
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `loginId` | string | Y | 5~25, unique |
| `password` | string | Y | 최소 10자, 정책 충족 |
| `name` | string | Y | 1~50 |
| `email` | string | Y | email format, unique |
| `phone` | string | Y | 전화번호 형식 |
| `termsAgreed` | boolean | Y | `true` 필수 |

**Response.data**
| Field | Type | Notes |
| --- | --- | --- |
| `userId` | number | 생성된 사용자 PK |
| `roles` | string | 기본 `GUEST` |
| `status` | string | 기본 `ACTIVE` |

### 12.2 Guest - 숙소 검색
- Endpoint: `GET /api/v1/guest/accommodations`

**Query**
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `regions` | string[] | Y | 1개 이상 |
| `checkIn` | date | Y | 오늘~1년 이내 |
| `checkOut` | date | Y | `checkOut > checkIn` |
| `guestCount` | number | Y | 1 이상 |
| `page` | number | N | 기본 0 |
| `size` | number | N | 기본 20 |
| `sort` | string | N | `price,asc` 등 |

**Response.data[]**
| Field | Type | Source(ERD) |
| --- | --- | --- |
| `accommodationId` | number | accommodations.accommodation_id |
| `name` | string | accommodations.name |
| `region` | string | accommodations.region |
| `statusGroup` | string | AVAILABLE / MISMATCH / SOLD_OUT |
| `minPrice` | number | room_types.base_price + price_policies |

### 12.3 Guest - 예약 요청
- Endpoint: `POST /api/v1/guest/reservations`

**Request**
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `accommodationId` | number | Y | 존재하는 숙소 |
| `roomTypeId` | number | Y | 해당 숙소 소속 |
| `checkIn` | date | Y | 유효 날짜 |
| `checkOut` | date | Y | `checkOut > checkIn` |
| `guestCount` | number | Y | `<= room_types.max_capacity` |
| `requestMemo` | string | N | 최대 1000자 권장 |

**Response.data**
| Field | Type | Source(ERD) |
| --- | --- | --- |
| `reservationId` | number | reservations.reservation_id |
| `reservationNo` | string | reservations.reservation_no |
| `status` | string | reservations.status (`PENDING`) |
| `requestedTime` | datetime | reservations.requested_time |

### 12.4 Host - 숙소 등록
- Endpoint: `POST /api/v1/host/accommodations`

**Request**
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `name` | string | Y | 1~100 |
| `address` | string | Y | 1~255 |
| `region` | string | Y | 1~50 |
| `infoText` | string | N | text |
| `checkInTime` | string | Y | `HH:mm:ss` |
| `checkOutTime` | string | Y | `HH:mm:ss` |

**Response.data**
| Field | Type | Source(ERD) |
| --- | --- | --- |
| `accommodationId` | number | accommodations.accommodation_id |
| `hostId` | number | accommodations.host_id |
| `status` | string | accommodations.status |

### 12.5 Host - 가격 정책 등록
- Endpoint: `POST /api/v1/host/price-policies`

**Request**
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `accommodationId` | number | Y | FK |
| `roomTypeId` | number | Y | FK |
| `policyName` | string | Y | 1~50 |
| `startDate` | date | Y |  |
| `endDate` | date | Y | `>= startDate` |
| `priceValue` | number | Y | `>= 0` |
| `priceType` | string | Y | `DELTA` or `PERCENT` |
| `dayOfWeekMask` | number | N | bit mask |

**Response.data**
| Field | Type | Source(ERD) |
| --- | --- | --- |
| `policyId` | number | price_policies.policy_id |
| `status` | string | price_policies.status |

### 12.6 Host - Block 생성
- Endpoint: `POST /api/v1/host/blocks`

**Request**
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `accommodationId` | number | Y | FK |
| `roomTypeId` | number | Y | FK |
| `roomId` | number | Y | FK |
| `startDate` | date | Y |  |
| `endDate` | date | Y | `>= startDate` |
| `reasonType` | string | N | 최대 50자 권장 |

**Response.data**
| Field | Type | Source(ERD) |
| --- | --- | --- |
| `blockId` | number | blocks.block_id |
| `status` | string | blocks.status (`ACTIVE`) |

### 12.7 Host - 예약 승인
- Endpoint: `PATCH /api/v1/host/reservations/{reservationId}/approve`

**Response.data**
| Field | Type | Source(ERD) |
| --- | --- | --- |
| `reservationId` | number | reservations.reservation_id |
| `status` | string | reservations.status (`APPROVED`) |
| `updatedAt` | datetime | 감사 로그/수정 시각 |

### 12.8 Admin - 권한 요청 처리
- Endpoint: `PATCH /api/v1/admin/auth-requests/{requestId}`

**Request**
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `status` | string | Y | `APPROVED` or `DENIED` |
| `reason` | string | N | 최대 500자 권장 |

**Response.data**
| Field | Type | Source(ERD) |
| --- | --- | --- |
| `requestId` | number | auth_request.request_id |
| `userId` | number | auth_request.user_id |
| `status` | string | auth_request.status |

### 12.9 Admin - 공지 등록
- Endpoint: `POST /api/v1/admin/notifications`

**Request**
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `title` | string | Y | 1~100 |
| `content` | string | Y | text |
| `status` | string | Y | `PUBLISHED`,`DRAFT`,`ARCHIVED` |
| `isPinned` | boolean | N | 기본 false |

**Response.data**
| Field | Type | Source(ERD) |
| --- | --- | --- |
| `noticeId` | number | notification.notice_id |
| `status` | string | notification.status |
| `createdAt` | datetime | notification.created_at |

### 12.10 Admin - 첨부 업로드
- Endpoint: `POST /api/v1/admin/notifications/{noticeId}/attachments`
- Content-Type: `multipart/form-data`

**Request (form-data)**
| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `file` | binary | Y | 최대 크기 정책 적용 |

**Response.data**
| Field | Type | Source(ERD) |
| --- | --- | --- |
| `attachmentId` | number | attachment.attachment_id |
| `originFilename` | string | attachment.origin_filename |
| `storedFilename` | string | attachment.stored_filename |
| `filePath` | string | attachment.file_path |
| `mimeType` | string | attachment.mime_type |
| `fileSize` | number | attachment.file_size |
| `checksum` | string | attachment.checksum |

## 13) Validation & Authorization Rules (요약)

- 게스트 API는 본인 리소스(`user_id`)만 접근 가능해야 한다.
- 호스트 API는 본인 소유 숙소(`accommodations.host_id`)만 조작 가능해야 한다.
- 관리자 API는 `roles=ADMIN`만 허용한다.
- 모든 상태 전이는 8장 전이표를 준수하며 위반 시 `STATE_TRANSITION_INVALID(409)`를 반환한다.
- 예약 생성 시 재고 검증/락/예약 생성/숙박일 생성은 단일 트랜잭션으로 수행한다.
