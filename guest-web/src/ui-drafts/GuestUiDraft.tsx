import { useMemo, useState } from "react";

type PageKey =
  | "login"
  | "signup"
  | "mypage"
  | "account"
  | "search"
  | "accommodations"
  | "accommodation-detail"
  | "reservation-request"
  | "reservation-complete"
  | "reservation-list"
  | "reservation-detail"
  | "find-id"
  | "find-password";

type AuthState = "logged-out" | "logged-in";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

type Accommodation = {
  id: number;
  name: string;
  region: string;
  address: string;
  info: string;
  checkIn: string;
  checkOut: string;
  image: string;
  roomTypes: RoomType[];
};

type RoomType = {
  id: number;
  name: string;
  baseCapacity: number;
  maxCapacity: number;
  basePrice: number;
  soldOut?: boolean;
};

type Reservation = {
  id: number;
  reservationNo: string;
  accommodationName: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  status: ReservationStatus;
  specialRequest?: string;
};

const pageMeta: Record<PageKey, { label: string; auth?: AuthState | "all" }> = {
  login: { label: "로그인", auth: "logged-out" },
  signup: { label: "회원가입", auth: "logged-out" },
  mypage: { label: "마이페이지", auth: "logged-in" },
  account: { label: "계정관리", auth: "logged-in" },
  search: { label: "메인 검색", auth: "all" },
  accommodations: { label: "숙소 목록", auth: "all" },
  "accommodation-detail": { label: "숙소 상세", auth: "all" },
  "reservation-request": { label: "예약 요청", auth: "logged-in" },
  "reservation-complete": { label: "예약 완료", auth: "logged-in" },
  "reservation-list": { label: "예약 목록", auth: "logged-in" },
  "reservation-detail": { label: "예약 상세", auth: "logged-in" },
  "find-id": { label: "아이디 찾기", auth: "all" },
  "find-password": { label: "비밀번호 찾기", auth: "all" },
};

const accommodationsData: Accommodation[] = [
  {
    id: 1,
    name: "해오름 게스트하우스",
    region: "서울 마포구",
    address: "서울특별시 마포구 와우산로 12길 31",
    info: "홍대 인근에 위치한 감성적인 게스트하우스입니다. 공용 라운지와 루프탑을 제공합니다.",
    checkIn: "15:00",
    checkOut: "11:00",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    roomTypes: [
      {
        id: 101,
        name: "2인 더블룸",
        baseCapacity: 2,
        maxCapacity: 2,
        basePrice: 89000,
      },
      {
        id: 102,
        name: "4인 도미토리",
        baseCapacity: 1,
        maxCapacity: 4,
        basePrice: 32000,
      },
      {
        id: 103,
        name: "6인 여성 도미토리",
        baseCapacity: 1,
        maxCapacity: 6,
        basePrice: 35000,
        soldOut: true,
      },
    ],
  },
  {
    id: 2,
    name: "바다별 스테이",
    region: "부산 해운대구",
    address: "부산광역시 해운대구 달맞이길 120",
    info: "해운대 해변과 가까운 바다 전망 숙소입니다. 조식과 짐 보관 서비스를 제공합니다.",
    checkIn: "16:00",
    checkOut: "11:00",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    roomTypes: [
      {
        id: 201,
        name: "오션뷰 트윈룸",
        baseCapacity: 2,
        maxCapacity: 3,
        basePrice: 119000,
      },
      {
        id: 202,
        name: "4인 패밀리룸",
        baseCapacity: 3,
        maxCapacity: 4,
        basePrice: 149000,
      },
    ],
  },
  {
    id: 3,
    name: "한옥 하루",
    region: "전주 완산구",
    address: "전라북도 전주시 완산구 은행로 44",
    info: "전주 한옥마을에 위치한 전통 한옥 스테이입니다. 조용한 마당과 다도 체험을 제공합니다.",
    checkIn: "15:00",
    checkOut: "10:30",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    roomTypes: [
      {
        id: 301,
        name: "온돌 더블룸",
        baseCapacity: 2,
        maxCapacity: 3,
        basePrice: 98000,
      },
    ],
  },
];

const reservationsData: Reservation[] = [
  {
    id: 1,
    reservationNo: "R-2026-0001",
    accommodationName: "해오름 게스트하우스",
    roomTypeName: "2인 더블룸",
    checkInDate: "2026-04-12",
    checkOutDate: "2026-04-14",
    guestCount: 2,
    status: "PENDING",
    specialRequest: "늦은 체크인 예정입니다.",
  },
  {
    id: 2,
    reservationNo: "R-2026-0002",
    accommodationName: "바다별 스테이",
    roomTypeName: "오션뷰 트윈룸",
    checkInDate: "2026-05-03",
    checkOutDate: "2026-05-05",
    guestCount: 2,
    status: "CONFIRMED",
    specialRequest: "고층 배정 희망",
  },
  {
    id: 3,
    reservationNo: "R-2026-0003",
    accommodationName: "한옥 하루",
    roomTypeName: "온돌 더블룸",
    checkInDate: "2026-03-20",
    checkOutDate: "2026-03-21",
    guestCount: 2,
    status: "CANCELLED",
  },
];

function cls(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatDateRange(checkInDate: string, checkOutDate: string) {
  return `${checkInDate} ~ ${checkOutDate}`;
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  const map = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const label = {
    PENDING: "예약 대기",
    CONFIRMED: "예약 확정",
    CANCELLED: "예약 취소",
  };

  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        map[status],
      )}
    >
      {label[status]}
    </span>
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

function PreviewSidebar({
  currentPage,
  setCurrentPage,
  authState,
  setAuthState,
}: {
  currentPage: PageKey;
  setCurrentPage: (page: PageKey) => void;
  authState: AuthState;
  setAuthState: (value: AuthState) => void;
}) {
  const sections = [
    {
      title: "인증 / 마이페이지",
      items: [
        "login",
        "signup",
        "mypage",
        "account",
        "find-id",
        "find-password",
      ] as PageKey[],
    },
    {
      title: "검색 / 예약",
      items: [
        "search",
        "accommodations",
        "accommodation-detail",
        "reservation-request",
        "reservation-complete",
        "reservation-list",
        "reservation-detail",
      ] as PageKey[],
    },
  ];

  return (
    <aside className="w-full border-b border-slate-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="sticky top-0 p-5 lg:p-6">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-slate-900">Guest UI Preview</h1>
          <p className="mt-1 text-sm text-slate-500">
            페이지를 선택해서 개별 화면을 확인하세요.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Auth State
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

        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {section.title}
              </div>
              <div className="grid gap-2">
                {section.items.map((item) => {
                  const meta = pageMeta[item];
                  const hidden =
                    meta.auth && meta.auth !== "all" && meta.auth !== authState;

                  if (hidden) return null;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={cls(
                        "rounded-xl border px-3 py-2 text-left text-sm font-medium transition",
                        currentPage === item
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function GuestHeader({
  authState,
  onNavigate,
  onLogout,
}: {
  authState: AuthState;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate("search")}
          className="text-lg font-bold tracking-tight text-slate-900"
        >
          Guesthouse
        </button>

        <div className="flex items-center gap-2">
          {authState === "logged-out" ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => onNavigate("signup")}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate("mypage")}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                마이페이지
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function PageShell({
  authState,
  onNavigate,
  onLogout,
  children,
}: {
  authState: AuthState;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <GuestHeader
        authState={authState}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="text-2xl font-bold text-slate-900">{title}</div>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  defaultValue,
  disabled,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        placeholder={placeholder}
        className={cls(
          "w-full rounded-xl border px-4 py-3 text-sm outline-none transition",
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
            : "border-slate-300 focus:border-slate-900",
        )}
      />
    </div>
  );
}

function LoginPage({
  onNavigate,
  onLogin,
}: {
  onNavigate: (page: PageKey) => void;
  onLogin: () => void;
}) {
  return (
    <AuthCard title="게스트 로그인" description="게스트 계정으로 로그인하세요.">
      <form className="space-y-4">
        <Field label="아이디" placeholder="아이디를 입력하세요" />
        <Field
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
        />
        <button
          type="button"
          onClick={onLogin}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          로그인
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => onNavigate("find-id")}
          className="text-slate-500 transition hover:text-slate-900"
        >
          아이디 찾기
        </button>
        <button
          type="button"
          onClick={() => onNavigate("find-password")}
          className="text-slate-500 transition hover:text-slate-900"
        >
          비밀번호 찾기
        </button>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
        계정이 없으신가요?{" "}
        <button
          type="button"
          onClick={() => onNavigate("signup")}
          className="font-semibold text-slate-900 underline underline-offset-4"
        >
          회원가입
        </button>
      </div>
    </AuthCard>
  );
}

function SignupPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <AuthCard
      title="회원가입"
      description="게스트 계정을 생성하고 서비스를 시작하세요."
    >
      <form className="space-y-4">
        <Field label="아이디" placeholder="아이디를 입력하세요" />
        <Field
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
        />
        <Field
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
        />
        <Field label="이름" placeholder="이름을 입력하세요" />
        <Field label="이메일" type="email" placeholder="example@email.com" />
        <Field label="연락처" placeholder="010-0000-0000" />
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
          <input type="checkbox" className="mt-0.5" />
          <span>이용약관 및 개인정보 처리방침에 동의합니다.</span>
        </label>
        <button
          type="button"
          onClick={() => onNavigate("login")}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          회원가입
        </button>
      </form>
    </AuthCard>
  );
}

function SearchPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto] md:items-center">
          <button className="rounded-2xl border border-slate-200 px-4 py-4 text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              지역
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              서울, 부산, 전주
            </div>
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-4 text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              체크인
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              2026-04-12
            </div>
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-4 text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              체크아웃
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              2026-04-14
            </div>
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-4 text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              인원수
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              성인 2명
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("accommodations")}
            className="rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            검색
          </button>
        </div>
      </div>
    </div>
  );
}

function AccommodationsPage({
  onNavigate,
}: {
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <SectionCard title="필터" subtitle="조건을 바꿔서 결과를 좁혀보세요.">
        <div className="space-y-4">
          <Field label="지역" defaultValue="서울, 부산, 전주" />
          <Field label="체크인" defaultValue="2026-04-12" />
          <Field label="체크아웃" defaultValue="2026-04-14" />
          <Field label="인원수" defaultValue="2" />
          <button className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            필터 적용
          </button>
        </div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard
          title="숙소 검색 결과"
          subtitle="검색 조건에 맞는 숙소를 확인하세요."
          right={
            <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none">
              <option>추천순</option>
              <option>가격 낮은 순</option>
              <option>가격 높은 순</option>
            </select>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accommodationsData.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate("accommodation-detail")}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-44 w-full object-cover"
                />
                <div className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.region}
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-900">
                    {item.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {item.info}
                  </p>
                  <div className="mt-4 text-sm font-semibold text-slate-900">
                    {formatPrice(item.roomTypes[0].basePrice)} ~
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AccommodationDetailPage({
  authState,
  onNavigate,
  onRequireLogin,
}: {
  authState: AuthState;
  onNavigate: (page: PageKey) => void;
  onRequireLogin: (targetPage: PageKey) => void;
}) {
  const accommodation = accommodationsData[0];

  return (
    <div className="space-y-6">
      <SectionCard
        title={accommodation.name}
        subtitle={`${accommodation.region} · ${accommodation.address}`}
      >
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <img
            src={accommodation.image}
            alt={accommodation.name}
            className="h-72 w-full rounded-2xl object-cover"
          />
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              {accommodation.info}
            </div>
            <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              <div className="flex justify-between gap-4">
                <span>체크인</span>
                <span className="font-medium text-slate-900">
                  {accommodation.checkIn}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>체크아웃</span>
                <span className="font-medium text-slate-900">
                  {accommodation.checkOut}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="객실 타입"
        subtitle="예약 가능한 객실 타입을 확인하세요."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {accommodation.roomTypes.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {room.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    기준 {room.baseCapacity}인 / 최대 {room.maxCapacity}인
                  </p>
                </div>
                {room.soldOut ? (
                  <span className="text-sm font-semibold text-rose-500">
                    품절
                  </span>
                ) : null}
              </div>
              <div className="mt-4 text-lg font-bold text-slate-900">
                {formatPrice(room.basePrice)}
              </div>
              <div className="mt-5 flex gap-3">
                <button className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  예약 현황 확인
                </button>
                <button
                  type="button"
                  disabled={room.soldOut}
                  onClick={() => {
                    if (room.soldOut) return;
                    if (authState === "logged-in") {
                      onNavigate("reservation-request");
                    } else {
                      onRequireLogin("reservation-request");
                    }
                  }}
                  className={cls(
                    "flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition",
                    room.soldOut
                      ? "cursor-not-allowed bg-slate-200 text-slate-400"
                      : "bg-slate-900 text-white hover:opacity-90",
                  )}
                >
                  예약하기
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ReservationRequestPage({
  onNavigate,
}: {
  onNavigate: (page: PageKey) => void;
}) {
  const roomType = accommodationsData[0].roomTypes[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_360px]">
      <SectionCard
        title="예약 요청"
        subtitle="선택한 정보를 확인한 후 예약을 요청하세요."
      >
        <div className="space-y-5">
          <div className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                숙소
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                해오름 게스트하우스
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                객실 타입
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {roomType.name}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                일정
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                2026-04-12 ~ 2026-04-14
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                인원
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                성인 2명
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              요청사항
            </label>
            <textarea
              rows={5}
              placeholder="호스트에게 전달할 요청사항을 입력하세요"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            예약 요청 후에는 호스트 확정 전까지 예약 대기 상태로 유지됩니다.
            재고 상황에 따라 요청이 실패할 수 있습니다.
          </div>
        </div>
      </SectionCard>

      <SectionCard title="요약" subtitle="예약 전 최종 확인">
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex justify-between gap-3">
            <span>기본 요금</span>
            <span className="font-medium text-slate-900">
              {formatPrice(roomType.basePrice * 2)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>인원</span>
            <span className="font-medium text-slate-900">2명</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
            <span>총 금액</span>
            <span>{formatPrice(roomType.basePrice * 2)}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => onNavigate("accommodation-detail")}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            이전으로
          </button>
          <button
            type="button"
            onClick={() => onNavigate("reservation-complete")}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            예약 요청
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function ReservationCompletePage({
  onNavigate,
}: {
  onNavigate: (page: PageKey) => void;
}) {
  const reservation = reservationsData[0];

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          예약 요청이 완료되었습니다.
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          호스트 확정 전까지 예약 대기 상태로 유지됩니다.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
          <div className="mb-3">
            <StatusBadge status={reservation.status} />
          </div>
          <div className="grid gap-3 text-sm text-slate-600">
            <div className="flex justify-between gap-3">
              <span>예약 번호</span>
              <span className="font-medium text-slate-900">
                {reservation.reservationNo}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>숙소명</span>
              <span className="font-medium text-slate-900">
                {reservation.accommodationName}
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
                {formatDateRange(
                  reservation.checkInDate,
                  reservation.checkOutDate,
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onNavigate("reservation-detail")}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            예약 상세 보기
          </button>
          <button
            type="button"
            onClick={() => onNavigate("reservation-list")}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            예약 목록 보기
          </button>
        </div>
      </div>
    </div>
  );
}

function ReservationListPage({
  onNavigate,
}: {
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title="예약 내역" subtitle="내 예약 상태를 확인하세요.">
        <div className="grid gap-3 md:grid-cols-[220px_220px_1fr]">
          <select className="rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-700 outline-none">
            <option>전체 상태</option>
            <option>예약 대기</option>
            <option>예약 확정</option>
            <option>예약 취소</option>
          </select>
          <input
            type="text"
            defaultValue="2026-03-01 ~ 2026-05-31"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            상태와 기간으로 내역을 필터링할 수 있습니다.
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4">
        {reservationsData.map((reservation) => (
          <button
            key={reservation.id}
            type="button"
            onClick={() => onNavigate("reservation-detail")}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {reservation.reservationNo}
                </div>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  {reservation.accommodationName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {reservation.roomTypeName}
                </p>
              </div>
              <StatusBadge status={reservation.status} />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  일정
                </div>
                <div className="mt-1 font-medium text-slate-900">
                  {formatDateRange(
                    reservation.checkInDate,
                    reservation.checkOutDate,
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  인원
                </div>
                <div className="mt-1 font-medium text-slate-900">
                  {reservation.guestCount}명
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  객실 타입
                </div>
                <div className="mt-1 font-medium text-slate-900">
                  {reservation.roomTypeName}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  상세 보기
                </div>
                <div className="mt-1 font-medium text-slate-900">
                  클릭하여 확인
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReservationDetailPage() {
  const reservation = reservationsData[1];
  const cancellable = reservation.status === "PENDING";

  return (
    <div className="space-y-6">
      <SectionCard
        title="예약 상세"
        subtitle="개별 예약의 상태와 세부 정보를 확인하세요."
        right={<StatusBadge status={reservation.status} />}
      >
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              예약 번호
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {reservation.reservationNo}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              숙소명
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {reservation.accommodationName}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              객실 타입
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {reservation.roomTypeName}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              일정
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {formatDateRange(
                reservation.checkInDate,
                reservation.checkOutDate,
              )}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              인원수
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {reservation.guestCount}명
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              요청사항
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {reservation.specialRequest ?? "없음"}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="결제 및 정책"
        subtitle="취소 가능 여부와 요금을 확인하세요."
      >
        <div className="space-y-4 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            체크인 이전까지만 취소가 가능합니다. 현재 샘플 예약은{" "}
            {cancellable ? "취소 가능한 상태" : "취소 불가능한 상태"}입니다.
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                예약 취소
              </div>
              <p className="mt-1 text-sm text-slate-500">
                취소 시 즉시 상태가 변경됩니다.
              </p>
            </div>
            <button
              type="button"
              disabled={!cancellable}
              className={cls(
                "rounded-xl px-4 py-3 text-sm font-semibold transition",
                cancellable
                  ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400",
              )}
            >
              예약 취소
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function MyPage({
  onNavigate,
  onLogout,
}: {
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <SectionCard title="내 정보" subtitle="현재 로그인된 계정 정보입니다.">
        <div className="mb-4 h-16 w-16 rounded-full bg-slate-100" />
        <div className="space-y-1 text-sm text-slate-600">
          <div className="text-xl font-bold text-slate-900">김이지</div>
          <div>guest@example.com</div>
          <div>010-1234-5678</div>
        </div>
      </SectionCard>

      <SectionCard title="마이페이지" subtitle="원하는 메뉴를 선택하세요.">
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => onNavigate("account")}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <span>계정 정보 관리</span>
            <span>›</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("reservation-list")}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <span>예약 내역</span>
            <span>›</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <span>로그아웃</span>
            <span>›</span>
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function AccountPage() {
  return (
    <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <button
          type="button"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          기본 정보
        </button>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          비밀번호 변경
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium text-slate-400"
        >
          호스트 권한 요청
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">기본 정보</h2>
          <Field label="이름" defaultValue="김이지" />
          <Field label="이메일" type="email" defaultValue="guest@example.com" />
          <Field label="연락처" defaultValue="010-1234-5678" />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">비밀번호 변경</h2>
          <Field
            label="현재 비밀번호"
            type="password"
            placeholder="현재 비밀번호를 입력하세요"
          />
          <Field
            label="새 비밀번호"
            type="password"
            placeholder="새 비밀번호를 입력하세요"
          />
          <Field
            label="새 비밀번호 확인"
            type="password"
            placeholder="새 비밀번호를 다시 입력하세요"
          />
        </section>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          저장
        </button>
      </div>
    </div>
  );
}

function PlaceholderPage({
  title,
  description,
  buttonText,
  fields,
}: {
  title: string;
  description: string;
  buttonText: string;
  fields: string[];
}) {
  return (
    <AuthCard title={title} description={description}>
      <div className="space-y-4">
        {fields.map((field) => (
          <Field
            key={field}
            label={field}
            disabled
            placeholder={`${field} 입력`}
          />
        ))}
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
        >
          {buttonText}
        </button>
        <p className="text-center text-sm text-slate-500">
          현재 단계에서는 화면만 제공됩니다.
        </p>
      </div>
    </AuthCard>
  );
}

function CurrentPage({
  currentPage,
  authState,
  onNavigate,
  onLogin,
  onRequireLogin,
  onLogout,
}: {
  currentPage: PageKey;
  authState: AuthState;
  onNavigate: (page: PageKey) => void;
  onLogin: () => void;
  onRequireLogin: (targetPage: PageKey) => void;
  onLogout: () => void;
}) {
  switch (currentPage) {
    case "login":
      return <LoginPage onNavigate={onNavigate} onLogin={onLogin} />;
    case "signup":
      return <SignupPage onNavigate={onNavigate} />;
    case "mypage":
      return <MyPage onNavigate={onNavigate} onLogout={onLogout} />;
    case "account":
      return <AccountPage />;
    case "search":
      return <SearchPage onNavigate={onNavigate} />;
    case "accommodations":
      return <AccommodationsPage onNavigate={onNavigate} />;
    case "accommodation-detail":
      return (
        <AccommodationDetailPage
          authState={authState}
          onNavigate={onNavigate}
          onRequireLogin={onRequireLogin}
        />
      );
    case "reservation-request":
      return <ReservationRequestPage onNavigate={onNavigate} />;
    case "reservation-complete":
      return <ReservationCompletePage onNavigate={onNavigate} />;
    case "reservation-list":
      return <ReservationListPage onNavigate={onNavigate} />;
    case "reservation-detail":
      return <ReservationDetailPage />;
    case "find-id":
      return (
        <PlaceholderPage
          title="아이디 찾기"
          description="현재 준비 중인 기능입니다."
          buttonText="아이디 찾기"
          fields={["이름", "이메일 또는 연락처"]}
        />
      );
    case "find-password":
      return (
        <PlaceholderPage
          title="비밀번호 찾기"
          description="현재 준비 중인 기능입니다."
          buttonText="비밀번호 찾기"
          fields={["아이디 또는 이메일", "본인 확인 정보"]}
        />
      );
    default:
      return <SearchPage onNavigate={onNavigate} />;
  }
}

export default function GuestFullUiPreview() {
  const [currentPage, setCurrentPage] = useState<PageKey>("search");
  const [authState, setAuthState] = useState<AuthState>("logged-out");
  const [postLoginTarget, setPostLoginTarget] = useState<PageKey | null>(null);

  const normalizedPage = useMemo(() => {
    const meta = pageMeta[currentPage];
    if (!meta.auth || meta.auth === "all" || meta.auth === authState)
      return currentPage;
    return authState === "logged-in" ? "mypage" : "login";
  }, [authState, currentPage]);

  const handleRequireLogin = (targetPage: PageKey) => {
    setPostLoginTarget(targetPage);
    setCurrentPage("login");
  };

  const handleLogin = () => {
    setAuthState("logged-in");
    setCurrentPage(postLoginTarget ?? "search");
    setPostLoginTarget(null);
  };

  const handleLogout = () => {
    setAuthState("logged-out");
    setCurrentPage("search");
    setPostLoginTarget(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <PreviewSidebar
        currentPage={normalizedPage}
        setCurrentPage={setCurrentPage}
        authState={authState}
        setAuthState={setAuthState}
      />
      <div className="min-w-0 flex-1">
        <PageShell
          authState={authState}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        >
          <CurrentPage
            currentPage={normalizedPage}
            authState={authState}
            onNavigate={setCurrentPage}
            onLogin={handleLogin}
            onRequireLogin={handleRequireLogin}
            onLogout={handleLogout}
          />
        </PageShell>
      </div>
    </div>
  );
}
