# UI Management Refactor Plan

기준일: 2026-03-26

이 문서는 현재 `ui-drafts`의 큰 단일 스크립트 UI를 앞으로 어떻게 분리하고 관리할지 정리한 계획 문서다.

## 결론

네, 현재 draft UI는 페이지별/기능별로 분리해서 관리해야 한다.

이유:

- 한 파일에 타입, 더미 데이터, 화면 상태, 페이지 전환, 렌더링, 공통 UI가 모두 몰려 있다.
- 이 상태에서 backend 연결을 먼저 시작하면 수정 범위가 너무 커진다.
- UI-first 원칙을 지키려면 먼저 UI 자체를 “계약이 보이는 구조”로 바꿔야 한다.

즉, 지금 단계의 우선순위는:

1. UI 코드 관리 구조 정리
2. 화면 계약 정리
3. backend 연결

## 현재 상태

현재 관리 대상 원본 초안:

- [GuestUiDraft.tsx](C:/Users/SDS/Downloads/guesthouse/guest-web/src/ui-drafts/GuestUiDraft.tsx)
- [HostUiDraft.tsx](C:/Users/SDS/Downloads/guesthouse/ops-web/src/ui-drafts/HostUiDraft.tsx)
- [AdminUiDraft.tsx](C:/Users/SDS/Downloads/guesthouse/ops-web/src/ui-drafts/AdminUiDraft.tsx)

이 세 파일은 지금부터 “원본 계약 초안”으로 취급한다.

원칙:

- `ui-drafts` 안의 원본은 당분간 보존한다.
- 실제 구현용 UI는 별도 `features/` 구조 아래로 분리해 만든다.
- draft를 직접 계속 덮어쓰기하지 않는다.

## 왜 분리가 필요한가

### 1. 현재 파일은 변경 단위가 너무 크다

지금은 한 화면 수정이 전체 파일 리스크가 된다.

### 2. 공통과 기능 코드가 섞여 있다

예:

- 공통 카드/필드/배지
- 페이지 전환 상태
- 예약 리스트
- 숙소 상세
- 로그인 폼

이것들이 한 파일 안에 같이 있다.

### 3. backend 연결 단위가 안 보인다

연결하려면 최소한 아래가 분리되어야 한다.

- 페이지
- feature
- API 요청 모델
- 응답 모델
- 공통 컴포넌트

### 4. UI-first 기준 유지가 어렵다

UI-first는 “화면 단위 계약”이 보여야 의미가 있다.
지금처럼 한 파일이면 어떤 계약이 어느 화면에 속하는지 분리해 보기 어렵다.

## 분리 기준

분리 기준은 두 축을 같이 본다.

### 축 1. 앱 단위

- `guest-web`
- `ops-web`

### 축 2. feature 단위

- auth
- reservations
- properties
- admin-users
- logs

즉, “페이지별로 무조건 한 폴더”보다 “feature 기준 아래에 page/section/component를 두는 구조”가 더 적절하다.

## 권장 디렉터리 구조

### guest-web

- `guest-web/src/app/`
- `guest-web/src/features/auth/`
- `guest-web/src/features/search/`
- `guest-web/src/features/accommodations/`
- `guest-web/src/features/reservations/`
- `guest-web/src/features/account/`
- `guest-web/src/features/recovery/`
- `guest-web/src/shared/ui/`
- `guest-web/src/shared/types/`
- `guest-web/src/shared/lib/`

### ops-web

- `ops-web/src/app/`
- `ops-web/src/features/auth/`
- `ops-web/src/features/host-dashboard/`
- `ops-web/src/features/properties/`
- `ops-web/src/features/room-types/`
- `ops-web/src/features/reservations/`
- `ops-web/src/features/account/`
- `ops-web/src/features/admin-dashboard/`
- `ops-web/src/features/admin-users/`
- `ops-web/src/features/admin-role-requests/`
- `ops-web/src/features/admin-audit-logs/`
- `ops-web/src/features/admin-system-logs/`
- `ops-web/src/features/admin-properties/`
- `ops-web/src/features/admin-terms/`
- `ops-web/src/shared/ui/`
- `ops-web/src/shared/types/`
- `ops-web/src/shared/lib/`

## 파일 구성 규칙

각 feature는 최소한 아래처럼 나눈다.

- `types.ts`
- `mock.ts`
- `api-contract.ts`
- `components/`
- `pages/`
- `sections/`

현재는 실제 API 연결 전이므로 `api.ts`보다 `api-contract.ts`가 먼저다.

이유:

- 지금은 UI가 기대하는 request/response shape를 먼저 고정해야 하기 때문이다.

## draft별 분리 대상

### Guest draft

페이지 기준 분리 대상:

- 로그인
- 회원가입
- 마이페이지
- 계정관리
- 메인 검색
- 숙소 목록
- 숙소 상세
- 예약 요청
- 예약 완료
- 예약 목록
- 예약 상세
- 아이디 찾기
- 비밀번호 찾기

feature 기준 묶음:

- `auth`
- `search`
- `accommodations`
- `reservations`
- `account`
- `recovery`

### Host draft

페이지 기준 분리 대상:

- 로그인
- 대시보드
- 숙소 목록
- 숙소 등록/수정
- 숙소 상세 운영
- 객실 타입 관리
- 객실 타입 등록/수정
- 예약 목록
- 예약 상세 운영
- 계정관리

feature 기준 묶음:

- `auth`
- `host-dashboard`
- `properties`
- `room-types`
- `reservations`
- `account`

### Admin draft

페이지 기준 분리 대상:

- 로그인
- 대시보드
- 회원 관리
- 권한 요청 관리
- 감사 로그
- 시스템 로그
- 숙소 현황
- 약관 관리

feature 기준 묶음:

- `auth`
- `admin-dashboard`
- `admin-users`
- `admin-role-requests`
- `admin-audit-logs`
- `admin-system-logs`
- `admin-properties`
- `admin-terms`

## 공통 UI로 뽑아야 하는 것

세 초안에서 공통으로 보이는 UI는 먼저 shared로 빼는 편이 좋다.

예상 공통 컴포넌트:

- `SectionCard`
- `Field`
- `StatusBadge` / `StatusPill`
- 상단 헤더
- 좌측 preview/sidebar 성격 컴포넌트
- 공통 class helper (`cls`)

예상 공통 유틸:

- 날짜 범위 표시
- 가격 포맷
- 상태 tone 매핑

## 먼저 하지 말아야 할 것

### 1. 라우터 먼저 넣기

지금은 구조 분리가 먼저다.
라우터는 나중에 넣어도 된다.

### 2. 실제 API 연결부터 하기

지금 바로 fetch를 꽂기 시작하면 feature 구조가 더 꼬인다.

### 3. draft 원본 직접 해체하기

원본 draft는 보존해야 한다.
실제 작업은 구현용 경로에서 진행한다.

## 지금 바로 할 작업 순서

### Step 1. 원본 보존

- `ui-drafts`는 그대로 둔다.

### Step 2. 구현용 뼈대 폴더 생성

- `guest-web/src/features/...`
- `ops-web/src/features/...`

### Step 3. page/section 단위 분리

가장 먼저 guest에서:

- `LoginPage`
- `SignupPage`
- `SearchPage`
- `AccommodationsPage`
- `AccommodationDetailPage`

처럼 실제 페이지 컴포넌트를 분리한다.

### Step 4. 공통 UI 추출

- `SectionCard`
- `Field`
- `StatusBadge`

### Step 5. 계약 파일 생성

각 feature에:

- `types.ts`
- `api-contract.ts`
- `mock.ts`

생성

### Step 6. 그 다음 backend 연결 시작

이후에야 실제 연결을 시작한다.

## 추천 실제 작업 순서

### 1차

- guest UI 구조 분리

### 2차

- guest search/accommodation/reservation 계약 정리

### 3차

- guest 기능 연결

### 4차

- ops host 예약 영역 구조 분리

### 5차

- ops host 예약 운영 연결

### 6차

- host properties / room-types 확장

### 7차

- admin 구조 분리 및 기능 확장

## 다음 단계의 기준

다음 코딩 단계에서 “완료”로 보려면 아래를 만족해야 한다.

- `ui-drafts` 원본은 보존됨
- 구현용 feature 폴더가 생김
- 하나 이상의 draft가 page/section/component로 분리됨
- 공통 UI가 shared로 추출됨
- 최소 1개 feature에 `api-contract.ts`가 생김

## 관련 문서

- [UI_DRAFT_ANALYSIS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_DRAFT_ANALYSIS.md)
- [UI_FIRST_INTEGRATION_PLAN.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_FIRST_INTEGRATION_PLAN.md)
- [CODEBASE_UNDERSTANDING.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODEBASE_UNDERSTANDING.md)

---

## Latest Progress (2026-03-26)

### Guest completed in this pass

- `guest-web` draft-derived giant UI was split into manageable feature sections.
- A state-based page flow is now active without router.
- A workspace shell pattern was introduced:
  - `GuestAppShell`
  - `GuestSidePanel`
- The left panel is now a workspace-only container.
- The right side renders only the actual service screen.

### Guest current shape

- Left panel:
  - current view info
  - session info
  - navigation
  - saved reservation intent
  - banner
- Right screen:
  - search
  - login
  - signup
  - reservations
  - account

### Design rule locked in

- The side panel must remain removable.
- When the side panel is disabled, the app should still be close to a service-ready rendering mode.
- Therefore, app shell and side panel must stay separated from service content.

### Guest still needs additional splitting

- Even after the current pass, more splitting is still desirable.
- Remaining preferred split targets:
  - service page wrappers by active screen
  - internal subcomponents inside auth/search/reservations/account
  - final service-mode cleanup with workspace shell off

### Ops-web should follow the same pattern

- The same structure should be introduced to `ops-web`.
- Minimum target:
  - `OpsAppShell`
  - `OpsSidePanel`
  - right-side active service content only
- The panel should reflect auth state and current screen list similar to the draft flow.

### Immediate next plan

1. Rebuild `ops-web` into removable shell layout.
2. Move host/admin screen metadata and navigation into the left panel.
3. Leave only actual host/admin service screen on the right.
4. After shell parity, continue backend alignment using the existing UI contract documents.

### Additional guest update (2026-03-26 / page restoration)

- guest는 draft 기준 page key를 더 잘게 복원했다.
- 현재 guest 구현 page key:
  - `login`
  - `signup`
  - `mypage`
  - `account`
  - `find-id`
  - `find-password`
  - `search`
  - `accommodations`
  - `accommodation-detail`
  - `reservation-request`
  - `reservation-complete`
  - `reservation-list`
  - `reservation-detail`
- 좌측 패널은 위 페이지를 각각 개별 항목으로 노출하고, auth state에 따라 접근 가능 여부를 확인할 수 있게 유지한다.
- guest의 다음 세부 작업은 page key 추가가 아니라 각 페이지의 draft 일치도와 내부 UI 구성 정렬을 더 높이는 쪽이다.

### Additional guest update (2026-03-26 / search filter interaction)

- guest 메인 검색의 지역 입력은 단순 text input이 아니라 선택지 기반 필터로 관리한다.
- 현재 반영한 기준:
  - 다중 선택 가능
  - `전체 선택`
  - `전체 취소`
- 이 변경은 단순 CSS 변경이 아니라 화면 상태 모델 변경이므로 다음 순서를 따랐다.
  1. `SearchFormState`를 단일 `region`에서 `regions[]`로 변경
  2. 검색 UI를 선택형 칩 구조로 변경
  3. API 요청 직렬화를 배열 기준으로 재검토
  4. 이후 backend contract 보정 가능성을 계획에 남김
- ops에서도 필터 UI가 바뀌면 같은 절차를 그대로 재사용한다.

### Additional shared process note (2026-03-26 / guest -> ops)

- guest에서 실제로 사용한 작업 순서를 ops에도 그대로 적용한다.
- 핵심 순서:
  1. 원본 draft/source 보존 및 대조
  2. page key와 화면 책임 고정
  3. shell / header / side panel / service content 분리
  4. giant UI를 feature/section으로 분해
  5. draft flow를 실제 page flow로 복원
  6. 개발용 요소를 좌측 패널로 이동
  7. 설명 문구 감량 및 시각 정렬
  8. 상태 타입 변경 시 API 직렬화와 backend contract까지 같이 점검
  9. 타입체크와 문서 갱신
- 따라서 ops에 들어갈 때도 “UI를 조금 고치는 것”이 아니라, guest에서 했던 동일한 운영 절차를 복제하는 것으로 본다.
