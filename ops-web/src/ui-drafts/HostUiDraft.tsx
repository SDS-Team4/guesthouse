import { useMemo, useState } from "react";

type HostPage =
  | "login"
  | "dashboard"
  | "properties"
  | "property-form"
  | "property-detail"
  | "room-types"
  | "room-type-form"
  | "reservation-list"
  | "reservation-detail"
  | "account";

type HostAuthState = "logged-out" | "logged-in";
type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
type PropertyStatus = "ACTIVE" | "INACTIVE";

type Property = {
  id: number;
  name: string;
  region: string;
  address: string;
  contact: string;
  status: PropertyStatus;
  checkInTime: string;
  checkOutTime: string;
  info: string;
  roomTypeCount: number;
  roomCount: number;
  pendingReservations: number;
};

type RoomType = {
  id: number;
  propertyId: number;
  name: string;
  baseCapacity: number;
  maxCapacity: number;
  basePrice: number;
  status: PropertyStatus;
};

type Reservation = {
  id: number;
  reservationNo: string;
  propertyId: number;
  propertyName: string;
  roomTypeId: number;
  roomTypeName: string;
  guestName: string;
  people: number;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  requestNote?: string;
};

type Room = {
  id: string;
  propertyId: number;
  roomTypeId: number;
  roomNo: string;
};

type BlockCell = {
  roomId: string;
  date: string;
};

const hostPages: Array<{ key: HostPage; label: string; auth: boolean }> = [
  { key: "login", label: "호스트 로그인", auth: false },
  { key: "dashboard", label: "대시보드", auth: true },
  { key: "properties", label: "숙소 목록", auth: true },
  { key: "property-form", label: "숙소 등록/수정", auth: true },
  { key: "property-detail", label: "숙소 상세 운영", auth: true },
  { key: "room-types", label: "객실 타입 관리", auth: true },
  { key: "room-type-form", label: "객실 타입 등록/수정", auth: true },
  { key: "reservation-list", label: "예약 목록", auth: true },
  { key: "reservation-detail", label: "예약 상세 및 운영", auth: true },
  { key: "account", label: "계정 관리", auth: true },
];

const propertiesData: Property[] = [
  {
    id: 1,
    name: "해오름 게스트하우스",
    region: "서울 마포구",
    address: "서울특별시 마포구 와우산로 12길 31",
    contact: "02-123-4567",
    status: "ACTIVE",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    info: "홍대 인근 감성 숙소. 라운지와 루프탑 운영.",
    roomTypeCount: 3,
    roomCount: 8,
    pendingReservations: 5,
  },
  {
    id: 2,
    name: "바다별 스테이",
    region: "부산 해운대구",
    address: "부산광역시 해운대구 달맞이길 120",
    contact: "051-555-7777",
    status: "ACTIVE",
    checkInTime: "16:00",
    checkOutTime: "11:00",
    info: "해운대 바다 전망, 조식 제공.",
    roomTypeCount: 2,
    roomCount: 6,
    pendingReservations: 1,
  },
  {
    id: 3,
    name: "한옥 하루",
    region: "전주 완산구",
    address: "전라북도 전주시 완산구 은행로 44",
    contact: "063-222-1212",
    status: "INACTIVE",
    checkInTime: "15:00",
    checkOutTime: "10:30",
    info: "한옥마을 중심 조용한 마당형 숙소.",
    roomTypeCount: 1,
    roomCount: 3,
    pendingReservations: 0,
  },
];

const roomTypesData: RoomType[] = [
  {
    id: 101,
    propertyId: 1,
    name: "2인 더블룸",
    baseCapacity: 2,
    maxCapacity: 2,
    basePrice: 89000,
    status: "ACTIVE",
  },
  {
    id: 102,
    propertyId: 1,
    name: "4인 도미토리",
    baseCapacity: 1,
    maxCapacity: 4,
    basePrice: 32000,
    status: "ACTIVE",
  },
  {
    id: 103,
    propertyId: 1,
    name: "6인 여성 도미토리",
    baseCapacity: 1,
    maxCapacity: 6,
    basePrice: 35000,
    status: "ACTIVE",
  },
  {
    id: 201,
    propertyId: 2,
    name: "오션뷰 트윈룸",
    baseCapacity: 2,
    maxCapacity: 3,
    basePrice: 119000,
    status: "ACTIVE",
  },
  {
    id: 202,
    propertyId: 2,
    name: "4인 패밀리룸",
    baseCapacity: 3,
    maxCapacity: 4,
    basePrice: 149000,
    status: "ACTIVE",
  },
];

const roomsData: Room[] = [
  { id: "r101", propertyId: 1, roomTypeId: 101, roomNo: "101" },
  { id: "r102", propertyId: 1, roomTypeId: 101, roomNo: "102" },
  { id: "r201", propertyId: 1, roomTypeId: 102, roomNo: "201" },
  { id: "r202", propertyId: 1, roomTypeId: 102, roomNo: "202" },
  { id: "r203", propertyId: 1, roomTypeId: 102, roomNo: "203" },
  { id: "r301", propertyId: 1, roomTypeId: 103, roomNo: "301" },
  { id: "r302", propertyId: 1, roomTypeId: 103, roomNo: "302" },
];

const reservationsData: Reservation[] = [
  {
    id: 1,
    reservationNo: "R-2026-0001",
    propertyId: 1,
    propertyName: "해오름 게스트하우스",
    roomTypeId: 101,
    roomTypeName: "2인 더블룸",
    guestName: "김이지",
    people: 2,
    checkInDate: "2026-04-12",
    checkOutDate: "2026-04-14",
    status: "PENDING",
    requestNote: "늦은 체크인 예정",
  },
  {
    id: 2,
    reservationNo: "R-2026-0002",
    propertyId: 1,
    propertyName: "해오름 게스트하우스",
    roomTypeId: 101,
    roomTypeName: "2인 더블룸",
    guestName: "박소연",
    people: 2,
    checkInDate: "2026-04-14",
    checkOutDate: "2026-04-16",
    status: "CONFIRMED",
  },
  {
    id: 3,
    reservationNo: "R-2026-0003",
    propertyId: 1,
    propertyName: "해오름 게스트하우스",
    roomTypeId: 102,
    roomTypeName: "4인 도미토리",
    guestName: "이준호",
    people: 1,
    checkInDate: "2026-04-13",
    checkOutDate: "2026-04-15",
    status: "PENDING",
  },
  {
    id: 4,
    reservationNo: "R-2026-0004",
    propertyId: 2,
    propertyName: "바다별 스테이",
    roomTypeId: 201,
    roomTypeName: "오션뷰 트윈룸",
    guestName: "정하늘",
    people: 2,
    checkInDate: "2026-05-03",
    checkOutDate: "2026-05-05",
    status: "CONFIRMED",
  },
];

const initialAssignments: Record<number, Record<string, string[]>> = {
  1: {
    r101: ["2026-04-12", "2026-04-13"],
    r102: [],
    r201: [],
    r202: [],
    r203: [],
    r301: [],
    r302: [],
  },
  2: {
    r101: [],
    r102: ["2026-04-14", "2026-04-15"],
    r201: [],
    r202: [],
    r203: [],
    r301: [],
    r302: [],
  },
  3: {
    r101: [],
    r102: [],
    r201: ["2026-04-13", "2026-04-14"],
    r202: [],
    r203: [],
    r301: [],
    r302: [],
  },
};

const blockCells: BlockCell[] = [
  { roomId: "r102", date: "2026-04-12" },
  { roomId: "r202", date: "2026-04-14" },
  { roomId: "r301", date: "2026-04-16" },
];

const gridDates = [
  "2026-04-12",
  "2026-04-13",
  "2026-04-14",
  "2026-04-15",
  "2026-04-16",
  "2026-04-17",
  "2026-04-18",
];

function cls(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatRange(start: string, end: string) {
  return `${start} ~ ${end}`;
}

function getStatusTone(status: ReservationStatus) {
  if (status === "PENDING") return "amber" as const;
  if (status === "CONFIRMED") return "green" as const;
  return "slate" as const;
}

function StatusPill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "rose";
}) {
  const tones = {
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function PreviewSidebar({
  authState,
  setAuthState,
  currentPage,
  onNavigate,
}: {
  authState: HostAuthState;
  setAuthState: (state: HostAuthState) => void;
  currentPage: HostPage;
  onNavigate: (page: HostPage) => void;
}) {
  return (
    <aside className="w-full border-b border-slate-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="sticky top-0 p-5 lg:p-6">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-slate-900">Host UI Preview</h1>
          <p className="mt-1 text-sm text-slate-500">
            개발 중인 호스트 화면을 상태별로 확인하세요.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            AUTH STATE
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAuthState("logged-out")}
              className={cls(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                authState === "logged-out"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100",
              )}
            >
              로그아웃 상태
            </button>
            <button
              type="button"
              onClick={() => setAuthState("logged-in")}
              className={cls(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                authState === "logged-in"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100",
              )}
            >
              로그인 상태
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {hostPages.map((item) => {
            const hidden = item.auth && authState === "logged-out";
            if (hidden) return null;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={cls(
                  "w-full rounded-xl border px-3 py-2 text-left text-sm font-medium transition",
                  currentPage === item.key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function HostHeader({
  authState,
  currentPage,
  onNavigate,
  onLogout,
}: {
  authState: HostAuthState;
  currentPage: HostPage;
  onNavigate: (page: HostPage) => void;
  onLogout: () => void;
}) {
  const navItems: Array<{ key: HostPage; label: string }> = [
    { key: "properties", label: "숙소 목록" },
    { key: "reservation-list", label: "예약관리" },
  ];

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() =>
            onNavigate(authState === "logged-in" ? "dashboard" : "login")
          }
          className="text-lg font-bold tracking-tight text-slate-900"
        >
          Host
        </button>

        {authState === "logged-in" ? (
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cls(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  currentPage === item.key ||
                    (item.key === "properties" &&
                      [
                        "property-form",
                        "property-detail",
                        "room-types",
                        "room-type-form",
                      ].includes(currentPage))
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        {authState === "logged-in" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("account")}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              마이페이지
            </button>
            <button
              onClick={onLogout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
            호스트 인증 필요
          </div>
        )}
      </div>
    </header>
  );
}

function Shell({
  authState,
  currentPage,
  setAuthState,
  onNavigate,
  onLogout,
  children,
}: {
  authState: HostAuthState;
  currentPage: HostPage;
  setAuthState: (state: HostAuthState) => void;
  onNavigate: (page: HostPage) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <PreviewSidebar
        authState={authState}
        setAuthState={setAuthState}
        currentPage={currentPage}
        onNavigate={onNavigate}
      />
      <div className="min-w-0 flex-1">
        <HostHeader
          authState={authState}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
      />
    </div>
  );
}

function HostLoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">호스트 로그인</h1>
          <p className="mt-2 text-sm text-slate-500">
            호스트 계정으로 로그인하세요.
          </p>
        </div>
        <div className="space-y-4">
          <Field
            label="아이디 또는 이메일"
            placeholder="아이디 또는 이메일을 입력하세요"
          />
          <Field
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
          />
          <button
            onClick={onLogin}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            로그인
          </button>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <button className="hover:text-slate-900">아이디 찾기</button>
            <button className="hover:text-slate-900">비밀번호 찾기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({
  onNavigate,
}: {
  onNavigate: (page: HostPage) => void;
}) {
  const summary = [
    { label: "오늘 예약 현황", value: 12, tone: "blue" as const },
    { label: "대기 예약 수", value: 6, tone: "amber" as const },
    { label: "숙소 수", value: 3, tone: "green" as const },
    { label: "객실 수", value: 17, tone: "slate" as const },
  ];

  const pending = reservationsData
    .filter((r) => r.status === "PENDING")
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <SectionCard
            key={item.label}
            title={item.label}
            right={<StatusPill tone={item.tone}>실시간</StatusPill>}
          >
            <div className="text-3xl font-bold text-slate-900">
              {item.value}
            </div>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="처리해야 할 일"
          subtitle="최근 대기 예약을 빠르게 처리하세요."
        >
          <div className="space-y-3">
            {pending.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate("reservation-detail")}
                className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">
                    {item.guestName}
                  </div>
                  <StatusPill tone="amber">PENDING</StatusPill>
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {item.propertyName} · {item.roomTypeName} ·{" "}
                  {formatRange(item.checkInDate, item.checkOutDate)}
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="최근 변경 이력"
          subtitle="예약/운영 관련 최근 이벤트"
        >
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-xl border border-slate-200 p-4">
              예약 확정 처리 · R-2026-0002 · 10분 전
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              숙소 정보 수정 · 해오름 게스트하우스 · 1시간 전
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              객실 타입 가격 수정 · 4인 도미토리 · 오늘 오전
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PropertiesPage({
  onNavigate,
}: {
  onNavigate: (page: HostPage) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="숙소 목록"
        subtitle="등록한 숙소를 검색하고 관리하세요."
        right={
          <button
            onClick={() => onNavigate("property-form")}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            숙소 등록
          </button>
        }
      >
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <Field label="검색" placeholder="숙소명 검색" />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              상태
            </label>
            <select className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none">
              <option>전체</option>
              <option>ACTIVE</option>
              <option>INACTIVE</option>
            </select>
          </div>
          <button className="mt-7 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            조회
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {propertiesData.map((property) => (
            <div
              key={property.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-slate-900">
                    {property.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {property.region}
                  </div>
                </div>
                <StatusPill
                  tone={property.status === "ACTIVE" ? "green" : "slate"}
                >
                  {property.status}
                </StatusPill>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <div>객실 타입 {property.roomTypeCount}개</div>
                <div>객실 {property.roomCount}개</div>
                <div>대기 예약 {property.pendingReservations}건</div>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => onNavigate("property-detail")}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  상세 운영
                </button>
                <button
                  onClick={() => onNavigate("property-form")}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  수정
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function PropertyFormPage() {
  return (
    <SectionCard
      title="숙소 등록 / 수정"
      subtitle="기본 정보와 운영 정보를 입력하세요."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="숙소명" defaultValue={propertiesData[0].name} />
          <Field label="주소" defaultValue={propertiesData[0].address} />
          <Field label="연락처" defaultValue={propertiesData[0].contact} />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              운영 상태
            </label>
            <select
              defaultValue={propertiesData[0].status}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
            >
              <option>ACTIVE</option>
              <option>INACTIVE</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="체크인 시간"
              defaultValue={propertiesData[0].checkInTime}
            />
            <Field
              label="체크아웃 시간"
              defaultValue={propertiesData[0].checkOutTime}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              숙소 소개
            </label>
            <textarea
              rows={10}
              defaultValue={propertiesData[0].info}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
          취소
        </button>
        <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
          저장
        </button>
      </div>
    </SectionCard>
  );
}

function PropertyDetailPage({
  onNavigate,
}: {
  onNavigate: (page: HostPage) => void;
}) {
  const property = propertiesData[0];
  const [activeTab, setActiveTab] = useState<
    "basic" | "room-types" | "reservations"
  >("basic");

  return (
    <div className="space-y-6">
      <SectionCard
        title={property.name}
        subtitle={`${property.region} · ${property.address}`}
        right={
          <button
            onClick={() => onNavigate("reservation-detail")}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            예약관리
          </button>
        }
      >
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              상태
            </div>
            <div className="mt-1">
              <StatusPill tone="green">{property.status}</StatusPill>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              체크인
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {property.checkInTime}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              체크아웃
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {property.checkOutTime}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              연락처
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {property.contact}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "basic", label: "기본 정보" },
          { key: "room-types", label: "객실 타입" },
          { key: "reservations", label: "예약 목록" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cls(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              activeTab === tab.key
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "basic" ? (
        <SectionCard
          title="숙소 기본 정보"
          subtitle="게스트에게 표시되는 숙소 정보입니다."
        >
          <p className="text-sm leading-7 text-slate-600">{property.info}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onNavigate("property-form")}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              숙소 수정
            </button>
            <button
              onClick={() => onNavigate("room-types")}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              객실 타입 관리
            </button>
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "room-types" ? (
        <RoomTypesPage embedded onNavigate={onNavigate} />
      ) : null}

      {activeTab === "reservations" ? (
        <ReservationListPage embedded onNavigate={onNavigate} />
      ) : null}
    </div>
  );
}

function RoomTypesPage({
  embedded = false,
  onNavigate,
}: {
  embedded?: boolean;
  onNavigate: (page: HostPage) => void;
}) {
  const roomTypes = roomTypesData.filter(
    (roomType) => roomType.propertyId === 1,
  );

  return (
    <SectionCard
      title="객실 타입 관리"
      subtitle="예약 접수 기준 단위인 객실 타입을 관리하세요."
      right={
        <button
          onClick={() => onNavigate("room-type-form")}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          객실 타입 등록
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {roomTypes.map((roomType) => (
          <div
            key={roomType.id}
            className="rounded-2xl border border-slate-200 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-bold text-slate-900">
                  {roomType.name}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  기준 {roomType.baseCapacity}인 / 최대 {roomType.maxCapacity}인
                </div>
              </div>
              <StatusPill
                tone={roomType.status === "ACTIVE" ? "green" : "slate"}
              >
                {roomType.status}
              </StatusPill>
            </div>
            <div className="mt-4 text-lg font-bold text-slate-900">
              {formatPrice(roomType.basePrice)}
            </div>
            <div className="mt-5 grid gap-2">
              <button
                onClick={() => onNavigate("room-type-form")}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                수정
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  가격 정책
                </button>
                <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  block 관리
                </button>
              </div>
              {!embedded ? null : (
                <button
                  onClick={() => onNavigate("reservation-detail")}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  예약 상세 운영
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function RoomTypeFormPage() {
  const roomType = roomTypesData[0];
  return (
    <SectionCard
      title="객실 타입 등록 / 수정"
      subtitle="객실 타입의 기준 인원과 기본가를 설정하세요."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="객실 타입명" defaultValue={roomType.name} />
          <Field
            label="기준 인원"
            defaultValue={String(roomType.baseCapacity)}
          />
          <Field
            label="최대 인원"
            defaultValue={String(roomType.maxCapacity)}
          />
        </div>
        <div className="space-y-4">
          <Field label="기본가" defaultValue={String(roomType.basePrice)} />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              운영 상태
            </label>
            <select
              defaultValue={roomType.status}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
            >
              <option>ACTIVE</option>
              <option>INACTIVE</option>
            </select>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
          취소
        </button>
        <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
          저장
        </button>
      </div>
    </SectionCard>
  );
}

function ReservationListPage({
  embedded = false,
  onNavigate,
}: {
  embedded?: boolean;
  onNavigate: (page: HostPage) => void;
}) {
  const list = reservationsData.filter((r) =>
    embedded ? r.propertyId === 1 : true,
  );

  return (
    <SectionCard
      title="예약 목록"
      subtitle="최신순으로 예약 요청과 상태를 확인하세요."
    >
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            숙소
          </label>
          <select className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none">
            <option>전체</option>
            {propertiesData.map((property) => (
              <option key={property.id}>{property.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            객실 타입
          </label>
          <select className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none">
            <option>전체</option>
            {roomTypesData.map((roomType) => (
              <option key={roomType.id}>{roomType.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            상태
          </label>
          <select className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none">
            <option>전체</option>
            <option>PENDING</option>
            <option>CONFIRMED</option>
            <option>CANCELLED</option>
          </select>
        </div>
        <button className="mt-7 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
          조회
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">예약번호</th>
              <th className="px-4 py-3 text-left">숙소</th>
              <th className="px-4 py-3 text-left">객실 타입</th>
              <th className="px-4 py-3 text-left">게스트</th>
              <th className="px-4 py-3 text-left">날짜</th>
              <th className="px-4 py-3 text-left">상태</th>
            </tr>
          </thead>
          <tbody>
            {list.map((reservation) => (
              <tr
                key={reservation.id}
                onClick={() => onNavigate("reservation-detail")}
                className="cursor-pointer border-t transition hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {reservation.reservationNo}
                </td>
                <td className="px-4 py-3">{reservation.propertyName}</td>
                <td className="px-4 py-3">{reservation.roomTypeName}</td>
                <td className="px-4 py-3">{reservation.guestName}</td>
                <td className="px-4 py-3">
                  {formatRange(
                    reservation.checkInDate,
                    reservation.checkOutDate,
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={getStatusTone(reservation.status)}>
                    {reservation.status}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function isDateInRange(date: string, start: string, end: string) {
  return date >= start && date < end;
}

function buildReservationDates(reservation: Reservation) {
  return gridDates.filter((date) =>
    isDateInRange(date, reservation.checkInDate, reservation.checkOutDate),
  );
}

function ReservationDetailPage() {
  const [selectedReservationId, setSelectedReservationId] = useState<number>(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(1);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [draggingDate, setDraggingDate] = useState<string | null>(null);
  const [expandedTypeIds, setExpandedTypeIds] = useState<number[]>([
    101, 102, 103,
  ]);

  const reservation =
    reservationsData.find((item) => item.id === selectedReservationId) ??
    reservationsData[0];
  const propertyReservations = reservationsData.filter(
    (item) => item.propertyId === selectedPropertyId,
  );
  const propertyRoomTypes = roomTypesData.filter(
    (item) => item.propertyId === selectedPropertyId,
  );
  const reservationDates = buildReservationDates(reservation);
  const assignmentMap = assignments[reservation.id] ?? {};
  const assignedRoomId = Object.keys(assignmentMap).find((roomId) => {
    const values = assignmentMap[roomId] ?? [];
    return reservationDates.every((date) => values.includes(date));
  });
  const currentRoom = roomsData.find((room) => room.id === assignedRoomId);
  const isValidAssignment =
    Boolean(assignedRoomId) &&
    reservationDates.every(
      (date) =>
        !blockCells.some((b) => b.roomId === assignedRoomId && b.date === date),
    );

  const toggleType = (roomTypeId: number) => {
    setExpandedTypeIds((prev) =>
      prev.includes(roomTypeId)
        ? prev.filter((id) => id !== roomTypeId)
        : [...prev, roomTypeId],
    );
  };

  const moveReservationDay = (targetRoomId: string, targetDate: string) => {
    if (!draggingDate) return;
    if (
      blockCells.some(
        (cell) => cell.roomId === targetRoomId && cell.date === targetDate,
      )
    )
      return;

    const nextAssignments = { ...assignments };
    const reservationAssignment = {
      ...(nextAssignments[reservation.id] ?? {}),
    };

    Object.keys(reservationAssignment).forEach((roomId) => {
      reservationAssignment[roomId] = (
        reservationAssignment[roomId] ?? []
      ).filter((date) => date !== draggingDate);
    });

    const targetDates = new Set(reservationAssignment[targetRoomId] ?? []);
    targetDates.add(targetDate);
    reservationAssignment[targetRoomId] = Array.from(targetDates).sort();

    nextAssignments[reservation.id] = reservationAssignment;
    setAssignments(nextAssignments);
    setDraggingDate(null);
  };

  const getCellState = (roomId: string, date: string) => {
    const isBlocked = blockCells.some(
      (cell) => cell.roomId === roomId && cell.date === date,
    );
    if (isBlocked) return "block" as const;

    for (const item of propertyReservations) {
      const itemMap = assignments[item.id] ?? {};
      const itemDates = itemMap[roomId] ?? [];
      if (!itemDates.includes(date)) continue;

      if (item.id === reservation.id) {
        const thisRoomDates = itemMap[roomId] ?? [];
        const prevDate = gridDates[gridDates.indexOf(date) - 1];
        const nextDate = gridDates[gridDates.indexOf(date) + 1];
        const linked =
          Boolean(prevDate && thisRoomDates.includes(prevDate)) ||
          Boolean(nextDate && thisRoomDates.includes(nextDate));
        if (isValidAssignment)
          return linked
            ? ("selected-linked-valid" as const)
            : ("selected-valid" as const);
        return linked ? ("selected-linked" as const) : ("selected" as const);
      }

      return item.status === "CONFIRMED"
        ? ("occupied-confirmed" as const)
        : ("occupied" as const);
    }

    return "empty" as const;
  };

  const cellClass = (state: ReturnType<typeof getCellState>) => {
    switch (state) {
      case "block":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "occupied-confirmed":
        return "bg-slate-400 text-white border-slate-400";
      case "occupied":
        return "bg-slate-200 text-slate-700 border-slate-200";
      case "selected":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "selected-linked":
        return "bg-blue-500 text-white border-blue-500";
      case "selected-valid":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "selected-linked-valid":
        return "bg-emerald-500 text-white border-emerald-500";
      default:
        return "bg-white text-slate-400 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="예약 상세 및 운영 처리"
        subtitle="그리드에서 먼저 배정을 맞추고, 오른쪽 상세 패널에서 확정 여부를 검토합니다."
        right={
          <StatusPill tone={getStatusTone(reservation.status)}>
            {reservation.status}
          </StatusPill>
        }
      >
        <div className="grid gap-3 lg:grid-cols-[280px_280px_1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              숙소 선택
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
            >
              {propertiesData.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              예약 선택
            </label>
            <select
              value={selectedReservationId}
              onChange={(e) => setSelectedReservationId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
            >
              {propertyReservations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.reservationNo} · {item.guestName}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            예약 블록은 하루 단위로만 이동할 수 있습니다. block 셀은 배정
            불가이며, 연속 배정이 되면 연박으로 이어서 표시됩니다.
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="배정 현황 그리드"
          subtitle="객실 타입별 7일 구간 배정을 확인하고 하루 단위로 이동하세요."
        >
          <div className="space-y-4">
            {propertyRoomTypes.map((roomType) => {
              const typeRooms = roomsData.filter(
                (room) => room.roomTypeId === roomType.id,
              );
              const expanded = expandedTypeIds.includes(roomType.id);

              return (
                <div
                  key={roomType.id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <button
                    onClick={() => toggleType(roomType.id)}
                    className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {roomType.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        날짜 기준 가로축 / 방번호 기준 세로축
                      </div>
                    </div>
                    <span className="text-slate-500">
                      {expanded ? "−" : "+"}
                    </span>
                  </button>

                  {expanded ? (
                    <div className="overflow-x-auto p-4">
                      <div className="min-w-[900px]">
                        <div className="grid grid-cols-[120px_repeat(7,1fr)] gap-2">
                          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                            방번호
                          </div>
                          {gridDates.map((date) => (
                            <div
                              key={date}
                              className="rounded-xl bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-600"
                            >
                              {date.slice(5)}
                            </div>
                          ))}

                          {typeRooms.map((room) => (
                            <>
                              <div
                                key={`${room.id}-label`}
                                className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900"
                              >
                                {room.roomNo}
                              </div>
                              {gridDates.map((date) => {
                                const state = getCellState(room.id, date);
                                const draggable =
                                  reservationDates.includes(date) &&
                                  (assignmentMap[room.id] ?? []).includes(date);
                                return (
                                  <button
                                    key={`${room.id}-${date}`}
                                    draggable={draggable}
                                    onDragStart={() => setDraggingDate(date)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() =>
                                      moveReservationDay(room.id, date)
                                    }
                                    onClick={() => setDraggingDate(date)}
                                    className={cls(
                                      "h-12 rounded-xl border text-xs font-semibold transition",
                                      cellClass(state),
                                    )}
                                  >
                                    {state === "block"
                                      ? "BLOCK"
                                      : state.startsWith("selected")
                                        ? reservation.guestName
                                        : state.startsWith("occupied")
                                          ? "배정"
                                          : ""}
                                  </button>
                                );
                              })}
                            </>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </SectionCard>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SectionCard
            title="예약 원본 정보"
            subtitle="현재 선택한 예약의 기본 정보"
            right={
              <StatusPill tone={getStatusTone(reservation.status)}>
                {reservation.status}
              </StatusPill>
            }
          >
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="flex justify-between gap-3">
                <span>예약번호</span>
                <span className="font-medium text-slate-900">
                  {reservation.reservationNo}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>숙소</span>
                <span className="font-medium text-slate-900">
                  {reservation.propertyName}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>객실 타입</span>
                <span className="font-medium text-slate-900">
                  {reservation.roomTypeName}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>일정</span>
                <span className="font-medium text-slate-900">
                  {formatRange(
                    reservation.checkInDate,
                    reservation.checkOutDate,
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>인원수</span>
                <span className="font-medium text-slate-900">
                  {reservation.people}명
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>요청사항</span>
                <span className="font-medium text-slate-900">
                  {reservation.requestNote ?? "없음"}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="현재 실제 배정 정보"
            subtitle="그리드 작업 결과를 요약합니다."
          >
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                배정 객실:{" "}
                <span className="font-medium text-slate-900">
                  {currentRoom?.roomNo ?? "미배정"}
                </span>
              </div>
              <div>
                배정 타입:{" "}
                <span className="font-medium text-slate-900">
                  {reservation.roomTypeName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>확정 가능 여부:</span>
                {isValidAssignment ? (
                  <StatusPill tone="green">확정 가능</StatusPill>
                ) : (
                  <StatusPill tone="amber">배정 확인 필요</StatusPill>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                취소
              </button>
              <button className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                예약 취소
              </button>
              <button
                disabled={!isValidAssignment}
                className={cls(
                  "rounded-xl px-5 py-3 text-sm font-semibold transition",
                  isValidAssignment
                    ? "bg-emerald-600 text-white hover:opacity-90"
                    : "cursor-not-allowed bg-slate-200 text-slate-400",
                )}
              >
                예약 확정
              </button>
            </div>
          </SectionCard>

          <SectionCard title="변경 이력" subtitle="최근 운영 처리 내역">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 p-3">
                2026-03-01 09:10 · 예약 생성 · PENDING
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                2026-03-01 09:35 · 객실 배정 시도 · 101호 임시 배정
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                2026-03-01 09:42 · 운영자 검토 중
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function AccountPage() {
  return (
    <SectionCard
      title="호스트 계정 관리"
      subtitle="계정 정보와 비밀번호를 관리하세요."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">기본 정보</h3>
          <Field label="이름" defaultValue="문호스트" />
          <Field label="이메일" defaultValue="host1@example.com" />
          <Field label="연락처" defaultValue="010-2222-3333" />
        </div>
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">비밀번호 변경</h3>
          <Field
            label="현재 비밀번호"
            type="password"
            placeholder="현재 비밀번호"
          />
          <Field
            label="새 비밀번호"
            type="password"
            placeholder="새 비밀번호"
          />
          <Field
            label="새 비밀번호 확인"
            type="password"
            placeholder="새 비밀번호 확인"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
          저장
        </button>
      </div>
    </SectionCard>
  );
}

function CurrentPage({
  page,
  onNavigate,
  onLogin,
}: {
  page: HostPage;
  onNavigate: (page: HostPage) => void;
  onLogin: () => void;
}) {
  switch (page) {
    case "dashboard":
      return <DashboardPage onNavigate={onNavigate} />;
    case "properties":
      return <PropertiesPage onNavigate={onNavigate} />;
    case "property-form":
      return <PropertyFormPage />;
    case "property-detail":
      return <PropertyDetailPage onNavigate={onNavigate} />;
    case "room-types":
      return <RoomTypesPage onNavigate={onNavigate} />;
    case "room-type-form":
      return <RoomTypeFormPage />;
    case "reservation-list":
      return <ReservationListPage onNavigate={onNavigate} />;
    case "reservation-detail":
      return <ReservationDetailPage />;
    case "account":
      return <AccountPage />;
    case "login":
    default:
      return <HostLoginPage onLogin={onLogin} />;
  }
}

export default function HostUIPreview() {
  const [page, setPage] = useState<HostPage>("login");
  const [authState, setAuthState] = useState<HostAuthState>("logged-out");

  const normalizedPage = useMemo(() => {
    if (authState === "logged-out") return "login";
    return page;
  }, [authState, page]);

  const handleLogin = () => {
    setAuthState("logged-in");
    setPage("dashboard");
  };

  const handleLogout = () => {
    setAuthState("logged-out");
    setPage("login");
  };

  return (
    <Shell
      authState={authState}
      currentPage={normalizedPage}
      setAuthState={setAuthState}
      onNavigate={setPage}
      onLogout={handleLogout}
    >
      <CurrentPage
        page={normalizedPage}
        onNavigate={setPage}
        onLogin={handleLogin}
      />
    </Shell>
  );
}
