# Guest Next Checklist

기준일: 2026-03-26

이 문서는 현재 `guest-web` 정리 이후, 다음 수정 포인트를 빠르게 확인하기 위한 체크리스트다.

기준 원칙:

- UI-first
- recovery는 현재 placeholder 유지
- `App.tsx`는 점점 orchestration 전용으로 줄인다
- guest에서 쓴 정리 패턴을 이후 `ops-web`에도 그대로 복제한다

## Must

- [ ] `App.tsx`에 남아 있는 async loader / mutation handler를 한 번 더 분리한다
- [ ] guest 서비스 모드에서 꼭 필요하지 않은 workspace 흔적이 남아 있는지 다시 점검한다
- [ ] recovery 화면은 placeholder 유지 상태임을 문서와 UI에서 계속 일관되게 유지한다
- [ ] guest page access / redirect / sidebar action 규칙이 `app/` 계층에 남도록 유지한다
- [ ] 마이페이지 하위 화면은 `기본 정보 / 비밀번호 변경 / 호스트 권한 요청` 독립 page key로 유지한다

## Should

- [ ] search / reservation / account 쪽 화면별 spacing과 카드 밀도를 한 번 더 조정한다
- [ ] `App.tsx`에서 feature별 handler 묶음을 분리할 수 있는지 본다
- [ ] 문서 표현을 현재 구현과 다시 맞춘다
  - [ ] `GUEST_UI_CONTRACT_MATRIX.md`
  - [ ] `UI_BACKEND_ALIGNMENT_REVIEW.md`
- [ ] runtime에 쓰이지 않는 mock / refactor 잔여물이 혼선을 주지 않는지 점검한다

## Later

- [ ] recovery API가 준비되면 placeholder를 실제 flow로 치환한다
- [ ] guest 쪽 정리가 충분해지면 같은 방식으로 `ops-web`에 적용한다
- [ ] 필요해질 때만 router 도입을 다시 검토한다

## Current Review Summary

- guest 검색/상세/예약/계정 흐름은 동작 가능한 상태다
- 다중 지역 검색은 backend 재시작 이후 정상 동작 확인됨
- 예약 생성 응답은 `reservation-complete` 화면을 직접 채울 수 있게 정렬됨
- app-level flow helper와 orchestration helper가 분리되기 시작했다
  - `guestAppFlow.ts`
  - `guestAppOrchestration.ts`
- 숙소 상세 캘린더는 하단 고정 패널이 아니라 팝업형으로 전환됐다
- 캘린더에는 오늘 날짜 강조가 추가됐다
- 숙소 상세 캘린더는 이제 월간 그리드형 UI로 구체화됐다
- 캘린더 시작 기준은 검색 체크인일과 오늘 날짜를 함께 고려하도록 정리됐다
- 데이터가 없는 날짜 셀은 정보 없음으로 노출된다
- 캘린더 API 요청 범위는 기본 3주 이상으로 확장됐다
- 캘린더에는 오늘 / 체크인 / 체크아웃 표시가 추가됐다
- 캘린더 셀 높이와 모달 밀도는 3주 가시성 기준으로 한 번 더 압축됐다
- 캘린더 모달 세로 밀도는 다시 한 번 줄여 기본 3주 노출을 우선하도록 조정됐다
- 마이페이지는 허브 화면이고, 계정 하위 기능은 독립 페이지로 분리됐다
- recovery는 아직 실제 기능 없음
- 지금 가장 큰 남은 구조 과제는 `App.tsx` 책임 축소다

## Traceability

- `REQ-F-001 ~ REQ-F-035`
- `REQ-F-036 ~ REQ-F-069`
- `REQ-F-070 ~ REQ-F-075`
- `REQ-SEC-001 ~ REQ-SEC-008`

## Latest Note (2026-03-26 / calendar baseline)

- guest accommodation calendar should show at least 3 weeks (21 cells) in the initial visible area
- additional dates can be explored through internal calendar-grid scrolling, not by hiding the first 3 weeks below the fold
- room-type calendar inventory means active rooms in that room type minus blocked rooms minus occupied reservation nights for each date
- when the visible date range crosses month boundaries, the calendar should render month sections so month changes remain visible while scrolling
