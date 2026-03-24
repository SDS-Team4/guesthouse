# OPEN_QUESTIONS

아래 문서는 구현 전에 남아 있는 결정 사항과 이미 기준 결정으로 확정된 항목을 함께 관리한다.  
SRS가 명확한 항목 또는 안전하게 기본값을 정할 수 있는 항목은 더 이상 open question으로 두지 않고 baseline decision으로 승격한다.

## Finalized baseline decisions

### BD-01 동시성 전략
- Source: former `OQ-01`
- Status: finalized baseline decision
- Decision: 예약 요청은 MySQL 트랜잭션 경계 안에서 처리하고, 재고 검증과 점유는 행 단위 비관적 락(`SELECT ... FOR UPDATE` 또는 이에 준하는 방식)을 기본으로 한다.
- Why: SRS는 overbooking 금지, 단일 트랜잭션 경계, DB lock/ACID 전제를 반복해서 요구한다.
- Affected milestones: `M0`, `M3`

### BD-02 비밀번호 찾기 / 재설정 범위
- Source: former `OQ-02`
- Status: finalized baseline decision
- Decision: 아이디 찾기, 비밀번호 찾기, 비밀번호 재설정은 V1 범위에 포함하며 `M1`에서 구현한다.
- Why: Appendix C의 TBD 표현보다 본문 기능 요구사항과 사용 사례 연결이 더 강한 source of truth다.
- Affected milestones: `M0`, `M1`

### BD-03 공지 / 약관 / 알림의 V1 범위
- Source: former `OQ-10`
- Status: finalized baseline decision
- Decision: V1 baseline scope는 관리자용 공지/약관 관리까지로 한정한다. 사용자-facing Notification은 후속 milestone로 미룬다.
- Why: SRS의 관리자 운영 범위에는 공지/약관이 명시돼 있으나, 사용자 알림 정책은 SQL 초안 외에는 고정되어 있지 않다.
- Affected milestones: `M0`, `M7`

### BD-04 세션 저장 전략
- Source: SRS software interface baseline
- Status: finalized baseline decision
- Decision: 인증은 세션 기반으로 유지하고, 세션 저장소는 Redis-backed key-value store를 baseline으로 한다. JWT는 도입하지 않는다.
- Why: SRS의 세션 인터페이스는 `localhost:6379` 기반 key-value 세션 저장 구조를 직접 전제한다.
- Affected milestones: `M0`, `M1`, `M8`

### BD-05 `PENDING` 예약 정책
- Source: former `OQ-03`
- Status: finalized baseline decision
- Decision: `PENDING`은 결제 대기 hold가 아니라 호스트 승인/거절 전 상태다. 예약은 `PENDING` 상태로 유지되는 동안 재고를 계속 점유하며, 짧은 TTL 기반 자동 해제 모델로 다루지 않는다.
- Inventory rule: 가용성 계산과 overbooking 방지는 `PENDING`과 `CONFIRMED`를 모두 점유 상태로 간주하고, `CANCELLED`만 점유 해제 상태로 본다.
- Operational consequence: 미처리 `PENDING`이 누적되면 실제 판매 가능 재고가 장기간 잠길 수 있으므로, 운영 화면에는 미처리 backlog와 요청 시각이 명확히 노출되어야 한다.
- Schema consequence: short-lived hold 테이블은 두지 않고, `reservations.status`, `requested_at`, status history, host decision actor/reason/timestamp 추적 구조가 필요하다.
- SRS match / ambiguity: SRS의 "대기 상태도 재고 점유"와 일치한다. 다만 얼마나 오래 `PENDING`이 유지될 수 있는지에 대한 운영 SLA는 SRS에 명시돼 있지 않다.
- Affected milestones: `M0`, `M3`, `M6`

### BD-06 초기 실제 객실 배정 규칙
- Source: former `OQ-09`
- Status: finalized baseline decision
- Decision: 예약은 room type 기준으로 접수하고, 실제 room assignment는 `reservation_nights`에 저장한다. 예약 생성 시에는 deterministic first-fit 규칙으로 night별 초기 room assignment를 만들고, 이후 host/admin이 재배정할 수 있다.
- Allocation rule: guest는 room type만 선택하며 실제 room number는 guest-facing 기본 화면에 노출하지 않는다.
- Schema consequence: `reservation_nights`는 `stay_date`별 실제 `assigned_room_id`를 가져야 하고, 재배정은 reservation header가 아니라 nightly row를 수정해야 한다.
- SRS match / ambiguity: room type 접수, room 단위 운영 배정, `reservation_night` 단위 변경이라는 SRS 방향과 일치한다. 다만 first-fit 자체는 SRS가 명시하지 않으므로 구현 baseline 해석이다.
- Affected milestones: `M0`, `M3`, `M6`

### BD-07 가격 정책 중복 처리 규칙
- Source: former `OQ-07`
- Status: finalized baseline decision
- Decision: 같은 target/date에 pricing policy 기간이 겹치는 것은 허용한다. 동일 일자에 여러 정책이 적용되면 우선순위 winner를 고르지 않고 additive delta를 합산한다.
- Pricing rule: 최종가 = base price + 해당 숙박일에 적용되는 모든 active delta의 합.
- Validation consequence: 중복 기간 자체를 막지 않는다. 대신 target 범위, 적용 기간, active 여부, day-of-week 조건, delta 값의 유효성을 검증해야 한다.
- Ordering consequence: 합산 결과는 수학적으로 순서 독립적이어야 한다. 다만 운영 화면과 디버깅을 위해 조회 순서는 `start_date`, `end_date`, `policy_id` 등 안정적인 정렬 기준을 유지한다.
- Coverage consequence: 단일 정책, 부분 중첩, 완전 중첩, 양수/음수 delta 조합, inactive 정책 제외, day-of-week mask, 경계 날짜를 모두 테스트해야 한다.
- SRS match / ambiguity: SRS는 `base price`, 기간 정책, block/가용성 관리는 요구하지만 중복 시 precedence는 명시하지 않는다. 따라서 additive delta 합산은 V1 baseline 해석이다.
- Risk note: 현재 SQL 초안의 `price_type`에 `PERCENT`가 포함돼 있어 additive-only baseline과 충돌한다. V1 target schema에서는 `PERCENT`를 제거하거나 별도 미지원 값으로 정리해야 한다.
- Affected milestones: `M0`, `M5`

### BD-08 room-level block 모델
- Source: former `OQ-11`
- Status: finalized baseline decision
- Decision: V1에서는 block을 room-level only로 한정한다. block의 실효 대상은 `room_id`이며, 가용성 계산에서도 room-level exclusion으로 처리한다.
- Schema consequence: `blocks`는 `room_id` 중심 모델로 단순화하고, `room_type_id`는 중복 저장을 강제하지 않는다. 필요한 경우 room join을 통해 room type / accommodation을 유도한다.
- Availability consequence: room type 가용성은 active room 수에서 room-level block과 occupied reservation night를 제외해 계산한다.
- SRS match / ambiguity: SRS는 block 관리 기능을 요구하지만 scope level은 명시하지 않는다. 따라서 room-level only는 V1 단순화 해석이며, 후속 milestone에서 일반화 가능하다.
- Affected milestones: `M0`, `M2`, `M5`, `M6`

## Remaining open questions

## Can defer to later milestones

### OQ-04 관리자/호스트 권한 차등화 수준
- Category: can defer
- Owner milestone: `M7`
- Why it can defer: 현재 단계에서는 관리자 전체 접근, 호스트 자기 숙소 접근이라는 SRS baseline만 지켜도 아키텍처 결정이 가능하다.
- Option A: 관리자 전용 엔드포인트와 화면을 별도로 둔다
- Option B: host UI 일부를 읽기 전용으로 재사용하고 관리자 전용 기능만 별도 구현한다
- Option C: ops-web은 공유하되 API scope만 역할별로 강하게 분리한다
- Recommended default: `Option C`

### OQ-05 관리자 접근 제한
- Category: can defer
- Owner milestone: `M8`
- Why it can defer: V1 초기 구현은 HTTPS, 세션, 객체 권한, 감사 로그 우선으로도 안전 기준을 맞출 수 있다.
- Option A: V1에서는 별도 IP 제한 미적용
- Option B: VPN 또는 allowlist 적용
- Option C: 내부망 only
- Recommended default: `Option A`

### OQ-06 이미지 업로드/파일 저장 방식
- Category: can defer
- Owner milestone: `M5`, `M7`
- Why it can defer: 파일 업로드는 숙소 자산 관리와 관리자 공지 기능이 시작될 때 확정해도 된다.
- Option A: 로컬 파일 시스템 + 메타데이터 테이블
- Option B: 오브젝트 스토리지 + 메타데이터 테이블
- Option C: 외부 CDN/미디어 서비스 연동
- Recommended default: `Option B`

### OQ-08 게스트 취소 정책의 정확한 기준 시각
- Category: can defer
- Owner milestone: `M4`
- Why it can defer: 취소 기능 구현 전까지는 스키마를 확정하지 않아도 되며, 정책 결정만 남겨두면 된다.
- Option A: 체크인 시각 직전까지
- Option B: 체크인일 00:00 이전까지만
- Option C: 숙소별 `check_in_time` 기준 직전까지
- Recommended default: `Option C`
