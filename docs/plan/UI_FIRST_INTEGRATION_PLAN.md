# UI-First Frontend-Backend Integration Plan

기준일: 2026-03-25

이 문서는 내일 이후 작업에서 사용할 프론트-백 연결 기준 문서다.
현재 프론트 UI는 큰 뭉텅이 스크립트 중심으로 작성되어 있으며, 이후 작업은 **기존 백엔드 구조에 UI를 끼워 넣는 방식이 아니라, 현재 UI를 기준 계약으로 보고 백엔드를 연결/보정하는 방식**으로 진행한다.

## 핵심 작업 원칙

### 1. UI-first

- 현재 작업 기준 계약은 UI다.
- UI와 backend가 서로 맞지 않으면, 우선은 backend를 UI에 맞춰 해석하고 연결한다.
- 프론트에서 이미 정해진 사용자 흐름, 입력 항목, 응답 표시 방식, 액션 단위는 구현 기준으로 존중한다.

### 2. 단, 기록은 남긴다

- UI 기준으로 백엔드를 맞추는 과정에서 기존 코드 구조나 SRS와 차이가 생기면 문서로 남긴다.
- 기존 충돌/갭 기록은 `docs/plan/CODE_SRS_CONFLICTS.md`에 계속 누적한다.
- UI-first는 작업 기준이지, 차이를 숨기는 규칙이 아니다.

### 3. 한 번에 구조와 기능을 같이 정리한다

- 지금 UI는 “기능 연결 전용 상태”가 아니라 “큰 스크립트에 상태, 타입, fetch, 렌더링이 모두 몰린 상태”다.
- 그래서 단순 API 연결만 하면 이후 수정 비용이 크게 늘어난다.
- 따라서 실제 연결 작업은 아래 순서를 따른다.
  1. 현재 UI 뭉치를 feature 단위로 분해
  2. 각 feature의 API 계약을 UI 기준으로 명시
  3. 백엔드 연결
  4. UI-back mismatch가 있으면 backend 쪽을 맞춤

## 현재 UI 상태 요약

### 현재 파일 구성

현재 프론트는 사실상 큰 스크립트 3개 중심이다.

- `guest-web/src/App.tsx`
- `ops-web/src/App.tsx`
- 각 앱의 `styles.css`

실질적으로 작업 기준이 되는 UI 스크립트는 두 개다.

- [guest-web/src/App.tsx](C:/Users/SDS/Downloads/guesthouse/guest-web/src/App.tsx)
- [ops-web/src/App.tsx](C:/Users/SDS/Downloads/guesthouse/ops-web/src/App.tsx)

### 현재 UI 특성

- 타입 정의가 `App.tsx` 내부에 대량 포함되어 있다.
- fetch wrapper가 `App.tsx` 내부에 있다.
- 화면 상태와 폼 상태가 모두 `App.tsx`에 몰려 있다.
- 화면 섹션이 feature 단위로 나뉘어 있지 않다.
- guest-web은 guest 흐름 전체를 한 파일에서 처리한다.
- ops-web은 host와 admin UI를 한 파일에서 함께 처리한다.

## 현재 UI를 기준으로 본 앱 분리 원칙

현재 백엔드 기준 런타임 분리는 유지한다.

- `guest-web`
  - guest 전용
- `ops-web`
  - host + admin 공용

즉, 새로 `admin-web`을 만드는 것보다 지금은 `ops-web` 안에서 admin feature를 분리하는 방식이 맞다.

## 권장 프론트 폴더 구조

### guest-web

- `guest-web/src/app/`
- `guest-web/src/features/auth/`
- `guest-web/src/features/accommodation/`
- `guest-web/src/features/reservation/`
- `guest-web/src/features/account/`
- `guest-web/src/shared/api/`
- `guest-web/src/shared/types/`
- `guest-web/src/shared/ui/`

### ops-web

- `ops-web/src/app/`
- `ops-web/src/features/auth/`
- `ops-web/src/features/reservations/`
- `ops-web/src/features/room-blocks/`
- `ops-web/src/features/pricing/`
- `ops-web/src/features/admin-users/`
- `ops-web/src/features/admin-host-role-requests/`
- `ops-web/src/shared/api/`
- `ops-web/src/shared/types/`
- `ops-web/src/shared/ui/`

## 파일 배치 원칙

각 feature 아래에는 최소한 아래 단위를 둔다.

- `types.ts`
- `api.ts`
- `hooks.ts` 또는 `state.ts`
- `components/`
- `sections/`

예시:

- `guest-web/src/features/auth/api.ts`
- `guest-web/src/features/auth/types.ts`
- `guest-web/src/features/auth/sections/LoginSection.tsx`
- `guest-web/src/features/reservation/api.ts`
- `ops-web/src/features/reservations/api.ts`
- `ops-web/src/features/admin-users/sections/AdminUsersSection.tsx`

## UI 기준 기능 묶음

### guest-web 기준 기능 묶음

1. 인증
- 로그인
- 회원가입
- signup terms 조회

2. 공개 탐색
- 숙소 검색
- 숙소 상세
- room type 캘린더

3. 예약
- 예약 생성
- 내 예약 목록
- 예약 상세
- 예약 취소

4. 계정
- 내 프로필 조회
- 내 프로필 수정
- 비밀번호 변경
- host role request 조회/생성

### ops-web 기준 기능 묶음

1. 인증
- host/admin 로그인
- 로그아웃
- 현재 사용자 조회

2. 예약 운영
- 예약 목록
- 예약 상세
- 승인/거절
- nightly reassignment

3. room block
- 목록
- 생성
- 비활성화

4. pricing
- 목록
- 생성
- 비활성화

5. admin users
- 사용자 목록
- 사용자 상세

6. admin host role requests
- 요청 목록
- 요청 상세
- 승인/거절

## 내일 작업 전에 필요한 파악 항목

작업 시작 시 아래를 먼저 확인해야 한다.

### 1. UI 계약 정리

각 화면/섹션마다 다음을 정리한다.

- 어떤 입력값을 받는지
- 어떤 액션 버튼이 있는지
- 성공 시 어떤 UI 상태를 기대하는지
- 실패 시 어떤 메시지를 보여주는지
- 로그인 필요 여부
- guest/host/admin 중 누가 쓰는지

### 2. 화면-API 매핑

각 UI 섹션마다 다음을 매핑한다.

- 이미 있는 backend API
- 응답 shape가 맞는지
- 요청 body/query shape가 맞는지
- 없는 API인지
- 상태값 enum이 맞는지

### 3. 백엔드 보정 필요 지점

UI와 backend가 다르면 아래 중 어디가 문제인지 구분한다.

- endpoint path mismatch
- request field mismatch
- response field mismatch
- 상태 enum mismatch
- 액션 단위 mismatch
- 권한 모델 mismatch

이 경우 원칙은 **UI 우선, backend 보정**이다.

## 추천 작업 순서

### Phase 1. UI 구조 분해

목표:

- 거대한 `App.tsx`를 feature 단위로 나눈다.
- 아직 기능을 많이 바꾸지 않고 현재 동작을 유지한다.

범위:

- 타입 분리
- 공통 `apiRequest` 분리
- 섹션 컴포넌트 분리
- 상태를 feature 단위로 정리

### Phase 2. guest-web 연결

목표:

- guest UI를 실제 API와 맞춘다.

우선순위:

1. 공개 숙소 검색/상세/캘린더
2. 로그인/회원가입
3. 예약 생성/목록/상세/취소
4. 계정 관리

이 순서가 좋은 이유:

- 익명 탐색은 권한 복잡도가 낮다.
- 예약 흐름은 guest 기준 핵심 흐름이다.
- 계정 관리는 예약 다음으로 연결해도 무방하다.

### Phase 3. ops-web 연결

목표:

- host/admin 운영 UI를 실제 API와 맞춘다.

우선순위:

1. 예약 목록/상세/승인/거절/재배정
2. room block
3. pricing
4. admin users
5. admin host role requests

### Phase 4. mismatch 정리

목표:

- UI를 기준으로 백엔드 contract를 다듬는다.

수행 내용:

- response DTO 보정
- 요청 필드 보정
- 상태 enum 보정
- 에러 메시지/상태코드 정리
- UI가 요구하는 누락 API 추가

## 프롬프트 템플릿

아래 프롬프트 형태로 작업을 맡기면 가장 효율적이다.

### 1. 구조 분해용

`guest-web App.tsx를 기능 기준으로 분해해줘. 현재 동작은 유지하고 auth/accommodation/reservation/account feature 폴더로 나눠줘. fetch와 타입도 각 feature 또는 shared로 옮겨줘.`

### 2. 특정 화면 연결용

`ops-web의 예약 목록/상세/승인/거절/재배정 UI를 현재 UI 기준으로 실제 ops-api에 연결해줘. UI 계약이 backend와 다르면 backend를 UI에 맞춰야 하는 포인트도 같이 적어줘.`

### 3. API 계약 확인용

`guest-web 각 섹션이 기대하는 요청/응답 필드를 UI 기준으로 표처럼 정리하고, 현재 guest-api와 맞지 않는 부분을 찾아줘. mismatch는 UI 우선으로 정리해줘.`

### 4. 범위 제한형

`guest-web에서 숙소 검색/상세/캘린더만 먼저 정리해줘. 다른 기능은 건드리지 말고, App.tsx에서 해당 부분만 feature로 분리하고 실제 API 연결까지 해줘.`

### 5. 백엔드 보정형

`현재 ops-web pricing UI가 기대하는 요청/응답 shape를 기준으로 ops-api를 맞춰야 하는 부분을 정리해줘. 코드 수정 전 계약 문서와 변경 포인트부터 보여줘.`

## 작업 시 주의사항

### 1. 지금은 라우터보다 feature 분리가 먼저다

- 현재는 한 파일 스모크 UI라서, 라우팅을 먼저 넣는 것보다 feature 분리를 먼저 하는 편이 안전하다.
- 라우터는 기능 연결이 안정화된 뒤 넣어도 늦지 않다.

### 2. UI 문구/섹션/버튼 기준을 함부로 바꾸지 않는다

- 지금부터는 UI가 구현 기준이다.
- 백엔드가 다르게 생겼더라도 UI 액션 단위를 가능한 유지한다.

### 3. backend-first 해석을 하지 않는다

- 현재 작업에서는 “백엔드가 원래 이렇게 되어 있으니 UI를 고치자”가 기본 전략이 아니다.
- 기본 전략은 “UI가 기대하는 계약으로 backend를 맞춘다”다.

### 4. 그래도 문서는 계속 유지한다

- UI 기준으로 맞추면서 생기는 구조적 차이, SRS 차이, 기존 구현 차이는 반드시 기록한다.

## 내일 시작 시 가장 작은 안전한 첫 단계

내일 바로 시작한다면 가장 안전한 첫 단계는 아래다.

1. `guest-web/src/App.tsx`를 feature 단위로 분리
2. `guest-web`의 공개 숙소 탐색 기능부터 실제 API 계약 기준으로 정리
3. guest UI와 backend mismatch를 기록
4. 그다음 예약/계정으로 확장

ops-web은 guest-web 구조 분해 패턴이 한 번 잡힌 뒤 들어가는 것이 더 안정적이다.

## 관련 문서

- [CODEBASE_UNDERSTANDING.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODEBASE_UNDERSTANDING.md)
- [CODE_SRS_CONFLICTS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/CODE_SRS_CONFLICTS.md)
- [PLANS.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/PLANS.md)
- [GUEST_UI_CONTRACT_MATRIX.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/GUEST_UI_CONTRACT_MATRIX.md)
- [OPS_UI_CONTRACT_MATRIX.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/OPS_UI_CONTRACT_MATRIX.md)
- [UI_BACKEND_ALIGNMENT_REVIEW.md](C:/Users/SDS/Downloads/guesthouse/docs/plan/UI_BACKEND_ALIGNMENT_REVIEW.md)

## Additional note (2026-03-26 / ui-state contract changes)

- 입력 방식이 바뀌는 순간 그것도 UI contract 변경으로 본다.
- 예:
  - 자유 입력 -> 선택지 선택
  - 단일 선택 -> 다중 선택
  - 단일 값 -> 배열 값
- guest 메인 검색의 지역 입력은 이 규칙에 따라 `텍스트 입력`에서 `다중 선택 + 전체 선택 + 전체 취소` 방식으로 변경했다.
- 이런 변경이 들어오면 아래 순서를 표준 절차로 사용한다.
  1. 화면 상태 타입 변경
  2. 화면 컴포넌트 상호작용 변경
  3. API 직렬화 방식 재검토
  4. backend contract 영향 기록
  5. 같은 절차를 ops에도 재사용

---

## Guest-to-Ops Rollout Process

이 섹션은 guest에서 실제로 사용한 작업 절차를 정리한 것이고, 이후 `ops-web`에도 같은 방식으로 적용한다.

### Core policy

- 기준은 항상 backend-first가 아니라 UI-first다.
- UI와 backend가 다르면 먼저 UI 계약을 고정하고 backend를 그에 맞춘다.
- draft, source 문서, 실제 화면을 함께 보되 최종 구현 판단은 현재 채택한 UI 기준으로 한다.
- 좌측 패널은 개발/workspace용이고, 우측은 실제 서비스 화면으로 유지한다.
- 서비스 모드에서는 좌측 패널을 제거해도 화면이 바로 살아야 한다.

### Actual process used on guest

1. 원본 수집
- `ui-drafts` 원본을 보존한다.
- SRS, source 문서, 화면 draft, 현재 구현 코드를 함께 대조한다.
- 화면명은 SRS/source 문서 기준으로 고정한다.

2. 화면 계약 고정
- page key를 먼저 정한다.
- auth state별 접근 가능 화면을 정한다.
- placeholder 화면과 실제 연결 화면을 구분한다.
- 화면별 입력값, 버튼, 성공 후 이동, 실패 상태를 문서로 남긴다.

3. 앱 셸 분리
- `AppShell`
- `Header`
- `SidePanel`
- 실제 서비스 화면

위 4가지를 분리한다.

4. 거대 파일 분해
- `App.tsx`의 뭉친 UI를 feature/section 단위로 분리한다.
- `auth`, `search`, `reservations`, `account` 같은 축으로 자른다.
- 공통 UI와 포맷 유틸은 `shared/`로 올린다.

5. 화면 흐름 복원
- draft의 page flow를 실제 `currentPage` 기준 흐름으로 복원한다.
- login/signup/find-id/find-password/mypage/account/search/accommodations/accommodation-detail/reservation-request/reservation-complete/reservation-list/reservation-detail처럼 페이지를 실제로 분리한다.

6. 개발용 요소와 서비스용 요소 분리
- 화면 설명, 현재 상태 설명, 개발용 이동 버튼은 좌측 패널로 보낸다.
- 우측 화면에는 실제 서비스에 필요한 내용만 남긴다.

7. 시각 정렬
- draft와 source 문서 기준으로 헤더, 버튼, 카드, spacing, 문구를 정리한다.
- 불필요한 설명성 문구는 제거한다.
- 헤더는 허용된 버튼만 두고 단순화한다.

8. 상태 모델 변경 처리
- UI 입력 방식이 바뀌면 상태 타입부터 바꾼다.
- 예:
  - 단일 값 -> 배열
  - 입력형 -> 선택형
  - 단일 선택 -> 다중 선택
- 그 다음 컴포넌트, API 직렬화, backend contract 검토 순으로 진행한다.

9. backend 연결
- 이미 있는 API는 바로 연결한다.
- shape만 다르면 DTO와 요청 형식을 보정한다.
- 정말 없는 기능만 새로 만든다.

10. 검증
- 타입체크
- 빌드 가능 여부
- 최소 플로우 확인
- 문서 갱신

### Ops should follow the same sequence

`ops-web`도 아래 순서를 그대로 따른다.

1. host/admin source와 draft 대조
2. page key와 auth/role 접근 규칙 고정
3. `OpsAppShell + OpsHeader + OpsSidePanel + service screen` 분리
4. giant UI 분해
5. host/admin flow 복원
6. 개발용 설명을 좌측 패널로 이동
7. 문구/디자인 정렬
8. 상태 모델 변경 시 타입 -> UI -> API 직렬화 -> backend 순서 적용
9. API 연결
10. 검증과 문서 갱신

### Non-negotiable implementation rules

- 원본 draft는 직접 덮어쓰지 않고 보존한다.
- 화면명은 source/SRS와 맞춘다.
- 불필요한 설명 문구는 서비스 화면에서 제거한다.
- 헤더는 기능을 과도하게 싣지 않는다.
- workspace 패널은 제거 가능해야 한다.
- UI 상태 변경은 contract 변경으로 취급한다.
- 검증 없이 다음 milestone으로 넘어가지 않는다.

## Latest Update (2026-03-26 / guest shell and flow)

### What is now done in guest-web

- Draft-origin giant UI was split into feature sections.
- `App.tsx` now acts mostly as an orchestration layer.
- Page flow is active without React Router.
- The current guest page state is:
  - `search`
  - `login`
  - `signup`
  - `reservations`
  - `account`
- Guest browse, auth, reservations, and account areas are already separated at feature level.
- Shared API and formatting logic were separated from the original giant file.

### New layout rule applied

- The old top hero / top navigation style is no longer the target working shape.
- `guest-web` now uses:
  - left workspace panel
  - right service screen
- The left panel currently contains:
  - current view summary
  - session state
  - navigation
  - saved reservation intent
  - banner message
- The right side keeps only the actual service screen.

### Service-mode separation

- The left panel is now treated as a removable workspace shell, not a permanent product requirement.
- The shell was separated so that later we can disable the panel and keep only the service screen.
- Current implementation direction:
  - keep shell component
  - keep side panel component
  - allow service-mode rendering by turning sidebar off

### Important implementation note

- Current guest layout does **not** require React Router in order to connect backend APIs.
- Backend connection can continue on top of state-based page switching.
- Router introduction is postponed until it becomes truly necessary for URL/product needs.

### Still needs more splitting

- Guest work is not "fully page-final" yet.
- More splitting is still recommended in these areas:
  - service-screen-level page wrappers
  - internal section/component cleanup inside each feature
  - final service-mode polish with workspace shell disabled

### Next mirrored work for ops-web

- Apply the same shell strategy to `ops-web`.
- Target structure:
  - removable left workspace panel
  - right service screen only
- The same rule should hold:
  - when the workspace panel is turned off, the screen should remain immediately serviceable

### Recommended next order

1. Apply `AppShell + SidePanel` pattern to `ops-web`.
2. Split host/admin current screen state and navigation into the left panel.
3. Keep only active host/admin service screen on the right.
4. After shell parity is done, continue backend alignment slice-by-slice.

## Latest Update (2026-03-26 / API adapter rule)

- Guest search and reservation now use a shared adapter pattern:
  - `api-contract.ts` keeps backend wire contracts
  - `api.ts` normalizes wire contracts into stable UI-facing shapes
- This allows backend DTO evolution without leaking raw field names into page components.
- When the UI contract changes first, we update in this order:
  1. page state and component intent
  2. feature `api-contract.ts`
  3. feature `api.ts` normalizer
  4. backend request/response contract where needed
  5. validation and document refresh
- The same pattern should be reused in `ops-web` for host/admin slices.
- Guest reservation create was also tightened so `reservation-complete` can render from the create response itself instead of reconstructing names from transient page state.

## Latest Update (2026-03-26 / guest app flow extraction)

- `guest-web/src/App.tsx` should remain an orchestration entry, not the owner of every page rule.
- In this pass, guest page-access and flow rules were moved into `guest-web/src/app/guestAppFlow.ts`.
- The extracted rules currently cover:
  - auth-required page gating
  - post-login redirect target
  - reservation-request entry routing
  - sidebar action generation
- `ReservationCompleteState` was also promoted into `guest-web/src/app/guestAppState.ts` so app-level state contracts stay in the app layer.
- guest async orchestration also started moving out of `App.tsx` into `guest-web/src/app/guestAppOrchestration.ts`.
- Current separation rule in guest:
  - `guestAppState.ts`: app-level state contracts
  - `guestAppFlow.ts`: page access / redirect / sidebar action rules
  - `guestAppOrchestration.ts`: app-level async loader and mutation orchestration
  - `App.tsx`: composition and wiring
- After draft parity, guest UI can now move into service-focused UX refinement.
- Example already applied:
  - accommodation-detail calendar changed from a bottom list panel to a modal calendar grid with weekday headers and today highlighting
- Repeat this exact pattern in `ops-web` before adding new host/admin behavior:
  1. extract page-access rules
  2. extract post-action redirect rules
  3. extract side-panel action generation
  4. extract app-level async orchestration
  5. keep `App.tsx` focused on composition and wiring
