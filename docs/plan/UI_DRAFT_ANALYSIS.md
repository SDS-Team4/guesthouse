# UI Draft Analysis

기준일: 2026-03-26

이 문서는 현재 `ui-drafts`에 보관된 3개의 프론트 초안 코드를 읽고 정리한 분석 문서다.

분석 대상:

- [GuestUiDraft.tsx](C:/Users/SDS/Downloads/guesthouse/guest-web/src/ui-drafts/GuestUiDraft.tsx)
- [HostUiDraft.tsx](C:/Users/SDS/Downloads/guesthouse/ops-web/src/ui-drafts/HostUiDraft.tsx)
- [AdminUiDraft.tsx](C:/Users/SDS/Downloads/guesthouse/ops-web/src/ui-drafts/AdminUiDraft.tsx)

## 전제

- 터미널 출력에서는 한글이 일부 깨져 보이지만, 컴포넌트 구조와 상태 흐름, 페이지 구분, 더미 데이터 모델은 충분히 읽을 수 있다.
- 앞으로의 연결 기준은 backend-first가 아니라 UI-first다.
- 즉, UI가 기대하는 화면 흐름과 액션 단위를 먼저 계약으로 잡고 backend를 맞춘다.

## 1. 전체 초안 구조 요약

현재 초안 3개는 모두 같은 패턴을 가진다.

- 단일 `tsx` 파일에 모든 타입/더미데이터/헬퍼/UI 컴포넌트/페이지 컴포넌트/상태 관리가 몰려 있음
- 실제 라우터 대신 `PageKey` 또는 유사 enum 상태로 페이지 전환
- 로그인 여부도 실제 세션이 아니라 로컬 상태로 시뮬레이션
- 실데이터 대신 하드코딩 배열 사용
- 화면 설계상 “페이지 단위”는 명확하게 나뉘어 있음

즉, 현재 초안은 “버릴 코드”가 아니라 아래 두 가지를 동시에 제공한다.

1. 실제 사용자가 보게 될 UI 흐름 정의
2. 이후 feature 분리의 기준이 되는 화면 단위

## 2. Guest draft 분석

### 페이지 집합

`GuestUiDraft.tsx`의 페이지 상태는 아래 흐름을 포함한다.

- `login`
- `signup`
- `mypage`
- `account`
- `search`
- `accommodations`
- `accommodation-detail`
- `reservation-request`
- `reservation-complete`
- `reservation-list`
- `reservation-detail`
- `find-id`
- `find-password`

### 읽힌 사용자 흐름

게스트 초안은 다음 흐름을 전제로 설계되어 있다.

1. 비로그인 상태에서 검색 진입
2. 숙소 목록 확인
3. 숙소 상세 확인
4. 예약 버튼 클릭 시 로그인 필요하면 로그인 페이지로 보냄
5. 로그인 후 예약 요청 화면으로 이동
6. 예약 완료 화면 확인
7. 예약 목록/상세 확인
8. 마이페이지/계정관리 접근
9. 로그인 화면에서 아이디 찾기/비밀번호 찾기 진입 가능

### 주요 화면 컴포넌트

- `LoginPage`
- `SignupPage`
- `SearchPage`
- `AccommodationsPage`
- `AccommodationDetailPage`
- `ReservationRequestPage`
- `ReservationCompletePage`
- `ReservationListPage`
- `ReservationDetailPage`
- `MyPage`
- `AccountPage`
- `PlaceholderPage`

### 현재 guest UI가 기대하는 핵심 기능

- 익명 검색
- 숙소 목록/상세 보기
- 로그인/회원가입
- 예약 요청
- 예약 완료 확인
- 예약 목록/상세 확인
- 예약 취소
- 계정 정보 관리
- 아이디 찾기
- 비밀번호 찾기

### 현재 backend와의 관계

이미 비교적 가까운 영역:

- 로그인
- 회원가입
- 숙소 검색/상세
- 예약 생성
- 예약 목록/상세
- 계정 조회/수정

UI 기준으로 backend 보정이 필요한 가능성이 큰 영역:

- 아이디 찾기
- 비밀번호 찾기
- 예약 요청 화면의 입력 항목 구조
- 마이페이지에서 노출하는 메뉴 구조
- 계정 관리 탭 구조
- 예약 취소 버튼 노출 규칙

### guest 쪽에서 중요한 해석

이 draft는 단순 검색 UI가 아니라 “게스트 서비스 전체 흐름”을 거의 다 담고 있다.
따라서 guest-web은 먼저 아래 feature로 분해하면 된다.

- `auth`
- `search`
- `accommodations`
- `reservations`
- `account`
- `recovery`

## 3. Host draft 분석

### 페이지 집합

`HostUiDraft.tsx`의 페이지 상태는 아래를 포함한다.

- `login`
- `dashboard`
- `properties`
- `property-form`
- `property-detail`
- `room-types`
- `room-type-form`
- `reservation-list`
- `reservation-detail`
- `account`

### 읽힌 사용자 흐름

호스트 초안은 다음 흐름을 전제로 설계되어 있다.

1. 호스트 로그인
2. 대시보드 진입
3. 숙소 목록 진입
4. 숙소 등록/수정
5. 숙소 상세 운영
6. 객실 타입 관리
7. 객실 타입 등록/수정
8. 예약 목록 확인
9. 예약 상세에서 배정/운영 처리
10. 계정 관리

### 주요 화면 컴포넌트

- `HostLoginPage`
- `DashboardPage`
- `PropertiesPage`
- `PropertyFormPage`
- `PropertyDetailPage`
- `RoomTypesPage`
- `RoomTypeFormPage`
- `ReservationListPage`
- `ReservationDetailPage`
- `AccountPage`

### host UI가 기대하는 핵심 기능

- 호스트 로그인
- 대시보드 KPI
- 숙소 CRUD
- 숙소 운영 상세
- 객실 타입 CRUD
- 예약 목록 조회
- 예약 상세 운영
- 방 배정 그리드 기반 조정
- 예약 확정/취소
- 호스트 계정 관리

### 현재 backend와의 관계

이미 비교적 가까운 영역:

- 호스트 로그인
- 예약 목록/상세
- 일부 승인/거절/재배정

UI 기준으로 backend 보정이 크게 필요한 영역:

- 대시보드
- 숙소 CRUD
- 숙소 상세 운영
- 객실 타입 CRUD
- 계정 관리
- 예약 상세 화면의 실제 액션 단위
- 현재 host draft가 갖는 “배정 그리드 조작”에 맞는 계약

### host 쪽에서 중요한 해석

현재 host draft는 단순 예약 운영 화면이 아니라 “host 제품 전체”를 의도하고 있다.
그런데 backend는 아직 host 자산 CRUD가 거의 없다.
따라서 host 초안을 살리려면 **host UI를 기준으로 backend milestone 자체를 재정렬**해야 한다.

권장 feature 분리:

- `auth`
- `dashboard`
- `properties`
- `room-types`
- `reservations`
- `account`

## 4. Admin draft 분석

### 페이지 집합

`AdminUiDraft.tsx`의 페이지 상태는 아래를 포함한다.

- `login`
- `dashboard`
- `users`
- `role-requests`
- `audit-logs`
- `system-logs`
- `properties`
- `terms`

### 읽힌 사용자 흐름

관리자 초안은 다음 흐름을 전제로 설계되어 있다.

1. 관리자 로그인
2. 대시보드 진입
3. 사용자 관리
4. 호스트 권한 요청 검토
5. 감사 로그 조회
6. 시스템 로그 조회
7. 숙소 운영 현황 조회
8. 약관/문서 관리

### 주요 화면 컴포넌트

- `LoginPage`
- `DashboardPage`
- `UsersPage`
- `RoleRequestsPage`
- `AuditLogsPage`
- `SystemLogsPage`
- `PropertiesPage`
- `TermsPage`

### admin UI가 기대하는 핵심 기능

- 관리자 로그인
- 대시보드 KPI
- 회원 목록/상세/수정
- 권한 요청 승인/반려
- 감사로그 조회
- 시스템 로그 조회
- 숙소 현황 모니터링
- 약관 관리

### 현재 backend와의 관계

이미 비교적 가까운 영역:

- 관리자 로그인
- 사용자 조회 일부
- 권한 요청 목록/상세/승인/거절 일부

UI 기준으로 backend 보정이 크게 필요한 영역:

- 사용자 상세/수정 범위
- 관리자 대시보드
- 감사로그 조회 API
- 시스템로그 조회 API
- 숙소 운영 현황 API
- 약관 조회/수정 API

### admin 쪽에서 중요한 해석

관리자 초안도 현재 backend보다 훨씬 넓은 범위를 요구한다.
따라서 admin은 `ops-web`의 부가 영역이 아니라, 사실상 독립된 운영 콘솔 축으로 봐야 한다.
다만 현재 런타임 분리 원칙상 `ops-web` 안의 admin feature로 두는 것이 맞다.

권장 feature 분리:

- `auth`
- `admin-dashboard`
- `admin-users`
- `admin-role-requests`
- `admin-audit-logs`
- `admin-system-logs`
- `admin-properties`
- `admin-terms`

## 5. 세 draft를 합쳐서 본 제품 범위

현재 UI 초안을 기준으로 보면 제품은 아래처럼 나뉜다.

### guest-web

- 인증
- 계정
- 복구
- 검색
- 숙소 상세
- 예약 생성
- 예약 조회/취소

### ops-web / host 영역

- 인증
- 대시보드
- 숙소 CRUD
- 객실 타입 CRUD
- 예약 운영
- 계정 관리

### ops-web / admin 영역

- 인증
- 대시보드
- 사용자 관리
- 권한 요청 관리
- 감사로그
- 시스템로그
- 숙소 현황
- 약관 관리

즉, 현재 UI를 기준으로 보면 “제품이 원래 생각했던 것보다 더 넓다”.

## 6. 통합 시 중요한 결론

### 결론 1. guest와 ops를 분리하는 현재 런타임 방향은 유지해도 된다

guest draft는 guest-web에,
host draft와 admin draft는 ops-web에 들어가는 구조가 자연스럽다.

### 결론 2. host와 admin은 한 앱 안에서 feature 분리로 가야 한다

현재 초안 기준으로는 `admin-web`을 새로 만드는 것보다,
`ops-web` 내부에서 host/admin 모드를 구분하는 편이 현실적이다.

### 결론 3. backend는 UI 범위에 맞춰 확장되어야 한다

현재 backend는 guest read/write 일부와 ops reservation/block/pricing 일부는 있지만,
host property CRUD와 admin 운영 기능은 UI 범위를 따라가지 못한다.

따라서 앞으로는 “기존 backend 기능에 UI를 맞춘다”가 아니라
“UI가 요구하는 페이지와 액션 단위에 맞춰 backend 작업순서를 재정렬한다”가 맞다.

## 7. 보완된 통합 계획

기존 계획을 draft UI 기준으로 보완하면 아래 순서가 적절하다.

### Phase A. 원본 보존 + feature 분리

목표:

- 현재 3개 draft를 원본으로 보존
- `App.tsx`와 분리된 feature 뼈대 생성

작업:

- guest draft에서 guest feature 분리
- host draft에서 host feature 분리
- admin draft에서 admin feature 분리
- shared ui/util 분리

### Phase B. guest 먼저 연결

이유:

- guest는 현재 backend와 가장 많이 겹친다.
- 익명 검색과 예약 흐름은 구현 가치가 가장 높다.

우선순위:

1. 검색
2. 숙소 상세
3. 로그인/회원가입
4. 예약 생성
5. 예약 목록/상세/취소
6. 계정
7. 복구

### Phase C. host 예약 운영 연결

이유:

- 현재 backend에 이미 일부 존재하는 기능부터 붙이는 것이 가장 빠르다.

우선순위:

1. 예약 목록
2. 예약 상세
3. 승인/거절
4. nightly reassignment

### Phase D. host 자산 관리 backend 확장

이유:

- host draft가 요구하는 주된 큰 축은 숙소/객실 타입 관리다.

우선순위:

1. 숙소 목록/상세
2. 숙소 등록/수정/비활성화
3. 객실 타입 목록/등록/수정/비활성화
4. 필요 시 개별 객실 관리까지 확장

### Phase E. admin 운영 기능 backend 확장

우선순위:

1. 사용자 조회/상세/상태 수정
2. 권한 요청 관리 고도화
3. 감사로그 조회
4. 시스템로그 조회
5. 숙소 현황
6. 약관 관리

## 8. 지금 당장 필요한 문서/계약 작업

다음 코딩 전에 아래 문서를 만들면 좋다.

### 1. UI contract matrix

각 페이지별로 정리:

- 화면명
- 사용 역할
- 입력값
- 클릭 액션
- 기대 request
- 기대 response
- 필요한 backend API

### 2. backend gap list by UI

각 draft를 기준으로:

- 이미 있는 API
- shape만 수정하면 되는 API
- 새로 필요한 API

### 3. feature ownership map

어느 feature가 어느 draft에서 왔는지 추적:

- guest/auth
- guest/reservations
- host/properties
- host/reservations
- admin/users
- admin/logs

## 9. 가장 작은 다음 단계

지금 가장 안전한 다음 단계는 이것이다.

1. guest draft 기준으로 페이지별 계약 문서를 먼저 뽑는다
2. guest-web 실제 코드에 `features/` 구조를 만든다
3. guest draft의 `search -> detail -> reservation` 흐름부터 연결한다

그 다음에:

4. host draft의 `reservation-list -> reservation-detail`만 먼저 붙인다
5. 이후 property CRUD와 admin 기능을 확장한다

## 10. 관련 문서

- [UI_FIRST_INTEGRATION_PLAN.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_FIRST_INTEGRATION_PLAN.md)
- [CODEBASE_UNDERSTANDING.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODEBASE_UNDERSTANDING.md)
- [CODE_SRS_CONFLICTS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODE_SRS_CONFLICTS.md)
