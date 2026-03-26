# Guest Layout Flow Note

기준일: 2026-03-26

## Scope

- 대상: `guest-web`
- 목적: 상단 소개형 단일 레이아웃을 작업용 좌측 패널 + 실제 서비스 화면 영역으로 재구성
- 전제: React Router는 아직 도입하지 않고, 상태 기반 화면 전환을 유지

## Applied direction

- 좌측 패널에 아래 정보를 모은다.
  - 현재 화면 설명
  - 세션 상태
  - 주요 네비게이션
  - 저장된 예약 의도
  - 배너 메시지
- 우측에는 실제 서비스 화면만 남긴다.
  - `search`
  - `login`
  - `signup`
  - `reservations`
  - `account`

## Why this way

- 현재 단계의 핵심은 UI-first 기준으로 화면 흐름을 먼저 고정하는 것이다.
- backend 연결은 라우터가 없어도 가능하다.
- 지금은 URL 설계보다 화면 책임 분리가 더 중요하다.
- 이후 API 병합 시에도 좌측 패널은 앱 셸로 유지하고, 우측 화면만 slice 단위로 교체하면 된다.

## Traceability

- `REQ-F-001 ~ REQ-F-069`
- `REQ-F-070 ~ REQ-F-075`
- `REQ-SEC-001 ~ REQ-SEC-008`

## Next follow-up

- `ops-web`도 같은 방식으로 좌측 패널 + 우측 서비스 화면 구조로 정리
- guest 화면별 UI contract 기준으로 backend DTO mismatch 최소 보정
- 필요 시 마지막 단계에서만 React Router 도입 여부 재판단

## Additional note (2026-03-26 / removable shell)

- 현재 좌측 패널은 최종 서비스 UI 자체가 아니라 workspace shell로 본다.
- 목표는 나중에 좌측 패널 컨테이너를 제거하거나 끄면 바로 우측 서비스 화면만 남는 구조다.
- 따라서 앞으로도 다음 원칙을 유지한다.
  - 좌측 패널은 앱 셸에 둔다.
  - 실제 서비스 화면은 우측 콘텐츠에만 둔다.
  - 서비스 화면은 좌측 패널 존재 여부에 의존하지 않게 만든다.

## Additional note (2026-03-26 / draft alignment pass)

- guest 화면은 AI draft 기준으로 다시 정렬 중이다.
- 이번 패스에서 반영한 방향:
  - search / accommodations / accommodation-detail 분리
  - find-id / find-password placeholder 복원
  - 좌측 패널에 grouped navigation과 current actions 배치
  - mypage 허브 추가
  - reservation 화면을 카드형 목록 + 상세 영역으로 재구성
  - account 화면을 draft에 가까운 tab-row + card layout으로 재구성
- 아직 남은 정렬 대상:
  - reservation-request
  - reservation-complete
  - account 내부 세부 인터랙션
  - draft와의 디테일한 spacing / typography / color tuning

## Additional note (2026-03-26 / restored page keys)

- guest app 구조의 기준은 backend 구조가 아니라 AI draft의 화면 구조와 페이지 흐름이다.
- 좌측 패널의 화면명은 SRS와 `GUEST_UI_CONTRACT_MATRIX.md`에 맞춰 한국어 이름으로 재정렬했다.
- 현재 패널에 노출되는 guest 화면:
  - 로그인
  - 회원가입
  - 마이페이지
  - 계정관리
  - 아이디 찾기
  - 비밀번호 찾기
  - 메인 검색
  - 숙소 목록
  - 숙소 상세
  - 예약 요청
  - 예약 완료
  - 예약 목록
  - 예약 상세
- `reservation-request`, `reservation-complete`는 실제 page key로 복원되었고 더 이상 pending 항목이 아니다.
- 현재 예약 흐름은 `메인 검색 -> 숙소 목록 -> 숙소 상세 -> 예약 요청 -> 예약 완료 -> 예약 상세/예약 목록`으로 이어진다.

## Additional note (2026-03-26 / visual alignment pass)

- guest 화면 문구를 draft 흐름에 맞춰 한국어 중심으로 다시 정리했다.
- 이번 패스에서 draft와의 일치도를 높인 영역:
  - 로그인 / 회원가입 카드형 레이아웃
  - 메인 검색의 중앙 검색바 구조
  - 숙소 목록 카드형 요약
  - 숙소 상세의 hero + 객실 타입 카드 구조
  - 예약 요청 / 예약 완료 카드
  - 마이페이지 / 계정관리 문구와 버튼 계층
- 아직 남은 정렬 대상:
  - spacing, typography, color tone의 세부 미세조정
  - backend 데이터가 richer해질 경우 숙소 대표 이미지나 추가 요약 정보 반영
