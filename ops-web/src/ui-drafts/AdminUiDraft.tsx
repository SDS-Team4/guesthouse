import { useMemo, useState } from "react";

type AdminPage =
  | "login"
  | "dashboard"
  | "users"
  | "role-requests"
  | "audit-logs"
  | "system-logs"
  | "properties"
  | "terms";

type AdminAuthState = "logged-out" | "logged-in";

type RoleRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
type LogSeverity = "INFO" | "WARN" | "ERROR";

type UserRow = {
  id: number;
  loginId: string;
  name: string;
  email: string;
  role: "ADMIN" | "HOST" | "GUEST";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  joinedAt: string;
};

type RoleRequest = {
  id: number;
  userName: string;
  loginId: string;
  reason: string;
  status: RoleRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
};

type AuditLog = {
  id: number;
  actor: string;
  target: string;
  action: string;
  createdAt: string;
  beforeJson: string;
  afterJson: string;
};

type SystemLog = {
  id: number;
  severity: LogSeverity;
  source: string;
  message: string;
  createdAt: string;
};

type PropertyRow = {
  id: number;
  name: string;
  host: string;
  region: string;
  status: "ACTIVE" | "INACTIVE";
  roomTypeCount: number;
  reservationCount: number;
  pendingCount: number;
};

type TermsDoc = {
  id: number;
  type: "서비스 이용약관" | "개인정보 처리방침";
  version: string;
  title: string;
  content: string;
  updatedAt: string;
};

const usersData: UserRow[] = [
  {
    id: 1,
    loginId: "admin_root",
    name: "관리자 김",
    email: "admin@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    joinedAt: "2026-01-05",
  },
  {
    id: 2,
    loginId: "host_moon",
    name: "문호스트",
    email: "host1@example.com",
    role: "HOST",
    status: "ACTIVE",
    joinedAt: "2026-01-08",
  },
  {
    id: 3,
    loginId: "guest_lee",
    name: "이게스트",
    email: "guest1@example.com",
    role: "GUEST",
    status: "ACTIVE",
    joinedAt: "2026-01-10",
  },
  {
    id: 4,
    loginId: "host_park",
    name: "박호스트",
    email: "host2@example.com",
    role: "HOST",
    status: "SUSPENDED",
    joinedAt: "2026-01-13",
  },
];

const roleRequestsData: RoleRequest[] = [
  {
    id: 101,
    userName: "김민수",
    loginId: "guest_kim",
    reason: "게스트하우스를 신규 등록하고 운영하고 싶습니다.",
    status: "PENDING",
    requestedAt: "2026-03-01 09:12",
  },
  {
    id: 102,
    userName: "최서연",
    loginId: "guest_choi",
    reason: "기존 숙소 운영 경험이 있어 호스트 권한 요청드립니다.",
    status: "APPROVED",
    requestedAt: "2026-02-24 18:20",
    reviewedAt: "2026-02-25 10:30",
    reviewNote: "사업자 정보 확인 완료",
  },
  {
    id: 103,
    userName: "정도윤",
    loginId: "guest_jung",
    reason: "장기 숙소 운영 예정",
    status: "REJECTED",
    requestedAt: "2026-02-20 14:10",
    reviewedAt: "2026-02-21 09:40",
    reviewNote: "제출 서류 미비",
  },
];

const auditLogsData: AuditLog[] = [
  {
    id: 1,
    actor: "관리자 김",
    target: "host_role_request:101",
    action: "APPROVE_HOST_ROLE",
    createdAt: "2026-03-01 10:00",
    beforeJson: '{"status":"PENDING"}',
    afterJson: '{"status":"APPROVED","reviewedBy":"admin_root"}',
  },
  {
    id: 2,
    actor: "관리자 김",
    target: "terms:3",
    action: "UPDATE_TERMS",
    createdAt: "2026-02-27 15:12",
    beforeJson: '{"version":"v1.1"}',
    afterJson: '{"version":"v1.2"}',
  },
  {
    id: 3,
    actor: "관리자 김",
    target: "user:4",
    action: "UPDATE_USER_STATUS",
    createdAt: "2026-02-18 11:24",
    beforeJson: '{"status":"ACTIVE"}',
    afterJson: '{"status":"SUSPENDED"}',
  },
];

const systemLogsData: SystemLog[] = [
  {
    id: 1,
    severity: "ERROR",
    source: "reservation-service",
    message: "Failed to acquire reservation lock for property 23",
    createdAt: "2026-03-01 08:24",
  },
  {
    id: 2,
    severity: "WARN",
    source: "auth-service",
    message: "Repeated failed login attempts detected for admin_root",
    createdAt: "2026-03-01 07:58",
  },
  {
    id: 3,
    severity: "INFO",
    source: "batch-job",
    message: "Daily accommodation summary materialized successfully",
    createdAt: "2026-03-01 02:00",
  },
];

const propertiesData: PropertyRow[] = [
  {
    id: 1,
    name: "해오름 게스트하우스",
    host: "문호스트",
    region: "서울 마포구",
    status: "ACTIVE",
    roomTypeCount: 3,
    reservationCount: 18,
    pendingCount: 5,
  },
  {
    id: 2,
    name: "바다별 스테이",
    host: "박호스트",
    region: "부산 해운대구",
    status: "ACTIVE",
    roomTypeCount: 2,
    reservationCount: 11,
    pendingCount: 1,
  },
  {
    id: 3,
    name: "한옥 하루",
    host: "문호스트",
    region: "전주 완산구",
    status: "INACTIVE",
    roomTypeCount: 1,
    reservationCount: 4,
    pendingCount: 0,
  },
];

const termsDocsData: TermsDoc[] = [
  {
    id: 1,
    type: "서비스 이용약관",
    version: "v1.2",
    title: "게스트하우스 서비스 이용약관",
    content:
      "제1조 목적\n본 약관은 서비스 이용과 관련된 기본 사항을 규정합니다.\n\n제2조 회원의 의무\n회원은 관련 법령과 운영 정책을 준수해야 합니다.",
    updatedAt: "2026-02-27 15:12",
  },
  {
    id: 2,
    type: "개인정보 처리방침",
    version: "v1.4",
    title: "개인정보 처리방침",
    content:
      "1. 수집 항목\n서비스 제공에 필요한 최소한의 정보를 수집합니다.\n\n2. 보관 기간\n법령이 정하는 기간 동안 보관합니다.",
    updatedAt: "2026-02-11 09:40",
  },
];

function cls(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function StatusPill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "rose";
}) {
  const toneMap = {
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
        toneMap[tone],
      )}
    >
      {children}
    </span>
  );
}

function AdminHeader({
  authState,
  currentPage,
  onNavigate,
  onLogout,
}: {
  authState: AdminAuthState;
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onLogout: () => void;
}) {
  const navItems: Array<{ key: AdminPage; label: string }> = [
    { key: "dashboard", label: "Dashboard" },
    { key: "users", label: "Users" },
    { key: "role-requests", label: "Requests" },
    { key: "audit-logs", label: "Audit Logs" },
    { key: "system-logs", label: "System Logs" },
    { key: "properties", label: "Properties" },
    { key: "terms", label: "Terms" },
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
          Admin
        </button>

        {authState === "logged-in" ? (
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cls(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  currentPage === item.key
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
              onClick={() => onNavigate("dashboard")}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              Dashboard
            </button>
            <button
              onClick={onLogout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
            관리자 인증 필요
          </div>
        )}
      </div>
    </header>
  );
}

function AdminPreviewSidebar({
  authState,
  setAuthState,
  currentPage,
  onNavigate,
}: {
  authState: AdminAuthState;
  setAuthState: (state: AdminAuthState) => void;
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
}) {
  const items: Array<{ key: AdminPage; label: string; auth: boolean }> = [
    { key: "login", label: "로그인", auth: false },
    { key: "dashboard", label: "대시보드", auth: true },
    { key: "users", label: "회원 관리", auth: true },
    { key: "role-requests", label: "권한 요청 관리", auth: true },
    { key: "audit-logs", label: "감사 로그", auth: true },
    { key: "system-logs", label: "시스템 로그", auth: true },
    { key: "properties", label: "숙소 운영 현황", auth: true },
    { key: "terms", label: "약관 관리", auth: true },
  ];

  return (
    <aside className="w-full border-b border-slate-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="sticky top-0 p-5 lg:p-6">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-slate-900">Admin UI Preview</h1>
          <p className="mt-1 text-sm text-slate-500">
            개발 중인 관리자 화면을 상태별로 확인하세요.
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
          {items.map((item) => {
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

function AdminShell({
  authState,
  currentPage,
  setAuthState,
  onNavigate,
  onLogout,
  children,
}: {
  authState: AdminAuthState;
  currentPage: AdminPage;
  setAuthState: (state: AdminAuthState) => void;
  onNavigate: (page: AdminPage) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AdminPreviewSidebar
        authState={authState}
        setAuthState={setAuthState}
        currentPage={currentPage}
        onNavigate={onNavigate}
      />
      <div className="min-w-0 flex-1">
        <AdminHeader
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

function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">관리자 로그인</h1>
          <p className="mt-2 text-sm text-slate-500">
            관리자 계정으로 로그인하세요
          </p>
        </div>

        <div className="space-y-4">
          <Field label="아이디" placeholder="아이디를 입력하세요" />
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
        </div>
      </div>
    </div>
  );
}

function DashboardPage({
  onNavigate,
}: {
  onNavigate: (page: AdminPage) => void;
}) {
  const kpis = [
    { label: "회원 수", value: 1284, tone: "blue" as const },
    { label: "숙소 수", value: 243, tone: "green" as const },
    { label: "예약 수", value: 761, tone: "amber" as const },
    { label: "미처리 권한 요청", value: 4, tone: "rose" as const },
  ];

  const shortcuts: Array<{ page: AdminPage; title: string; desc: string }> = [
    {
      page: "users",
      title: "회원 관리",
      desc: "회원 역할, 상태, 계정 정보를 조회하고 수정합니다.",
    },
    {
      page: "role-requests",
      title: "권한 요청 관리",
      desc: "호스트 권한 요청을 검토하고 승인/반려합니다.",
    },
    {
      page: "audit-logs",
      title: "감사 로그",
      desc: "관리자 액션과 변경 이력을 추적합니다.",
    },
    {
      page: "system-logs",
      title: "시스템 로그",
      desc: "운영 로그와 오류 메시지를 조회합니다.",
    },
    {
      page: "properties",
      title: "숙소 운영 현황",
      desc: "숙소별 운영 상태와 예약 현황을 확인합니다.",
    },
    {
      page: "terms",
      title: "약관 관리",
      desc: "약관 버전과 내용을 편집하고 저장합니다.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <SectionCard
            key={kpi.label}
            title={kpi.label}
            right={<StatusPill tone={kpi.tone}>실시간</StatusPill>}
          >
            <div className="text-3xl font-bold text-slate-900">
              {kpi.value.toLocaleString("ko-KR")}
            </div>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {shortcuts.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-base font-bold text-slate-900">
              {item.title}
            </div>
            <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="최근 감사 로그"
          subtitle="최근 관리자 액션 변경 이력"
        >
          <div className="space-y-3">
            {auditLogsData.slice(0, 3).map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="font-medium text-slate-900">{log.action}</div>
                  <div className="text-xs text-slate-500">{log.createdAt}</div>
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {log.actor} → {log.target}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="예약 상태 요약" subtitle="운영 중 예약 현황 분포">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
              <span className="font-medium text-amber-700">예약 대기</span>
              <span className="text-xl font-bold text-amber-700">42</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
              <span className="font-medium text-emerald-700">예약 확정</span>
              <span className="text-xl font-bold text-emerald-700">587</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-100 p-4">
              <span className="font-medium text-slate-700">예약 취소</span>
              <span className="text-xl font-bold text-slate-700">132</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function UsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    usersData[0].id,
  );
  const selectedUser =
    usersData.find((user) => user.id === selectedUserId) ?? usersData[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <SectionCard title="회원 관리" subtitle="회원 조회 및 계정 상태 관리">
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <Field label="검색어" placeholder="이름 또는 로그인 ID" />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              역할
            </label>
            <select className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none">
              <option>전체</option>
              <option>ADMIN</option>
              <option>HOST</option>
              <option>GUEST</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              상태
            </label>
            <select className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none">
              <option>전체</option>
              <option>ACTIVE</option>
              <option>INACTIVE</option>
              <option>SUSPENDED</option>
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
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">이름</th>
                <th className="px-4 py-3 text-left">로그인 ID</th>
                <th className="px-4 py-3 text-left">역할</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">가입일</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={cls(
                    "cursor-pointer border-t transition hover:bg-slate-50",
                    selectedUserId === user.id && "bg-slate-50",
                  )}
                >
                  <td className="px-4 py-3">{user.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-3">{user.loginId}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={
                        user.role === "ADMIN"
                          ? "blue"
                          : user.role === "HOST"
                            ? "green"
                            : "slate"
                      }
                    >
                      {user.role}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={
                        user.status === "ACTIVE"
                          ? "green"
                          : user.status === "SUSPENDED"
                            ? "rose"
                            : "amber"
                      }
                    >
                      {user.status}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">{user.joinedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="회원 상세"
        subtitle="선택한 회원 정보를 확인하고 수정하세요."
      >
        <div className="space-y-4">
          <Field label="이름" defaultValue={selectedUser.name} />
          <Field label="이메일" defaultValue={selectedUser.email} />
          <Field label="로그인 ID" defaultValue={selectedUser.loginId} />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              역할
            </label>
            <select
              defaultValue={selectedUser.role}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
            >
              <option>ADMIN</option>
              <option>HOST</option>
              <option>GUEST</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              상태
            </label>
            <select
              defaultValue={selectedUser.status}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
            >
              <option>ACTIVE</option>
              <option>INACTIVE</option>
              <option>SUSPENDED</option>
            </select>
          </div>
          <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            저장
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function RoleRequestsPage() {
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    roleRequestsData[0].id,
  );
  const selected =
    roleRequestsData.find((item) => item.id === selectedRequestId) ??
    roleRequestsData[0];

  const statusTone: Record<RoleRequestStatus, "amber" | "green" | "rose"> = {
    PENDING: "amber",
    APPROVED: "green",
    REJECTED: "rose",
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        title="권한 요청 관리"
        subtitle="호스트 권한 요청을 검토하고 처리하세요."
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {(["전체", "PENDING", "APPROVED", "REJECTED"] as const).map(
            (status) => (
              <button
                key={status}
                className={cls(
                  "rounded-full border px-3 py-2 text-sm font-medium",
                  status === "PENDING"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                {status === "전체" ? "전체" : status}
              </button>
            ),
          )}
        </div>

        <div className="space-y-3">
          {roleRequestsData.map((request) => (
            <button
              key={request.id}
              onClick={() => setSelectedRequestId(request.id)}
              className={cls(
                "w-full rounded-2xl border p-4 text-left transition hover:bg-slate-50",
                selectedRequestId === request.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">
                    {request.userName}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {request.loginId}
                  </div>
                </div>
                <StatusPill tone={statusTone[request.status]}>
                  {request.status}
                </StatusPill>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                {request.reason}
              </p>
              <div className="mt-3 text-xs text-slate-400">
                요청일 {request.requestedAt}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="요청 상세"
        subtitle="선택한 요청의 사유와 검토 정보를 확인하세요."
        right={
          <StatusPill tone={statusTone[selected.status]}>
            {selected.status}
          </StatusPill>
        }
      >
        <div className="space-y-4 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold text-slate-900">요청자</div>
            <div className="mt-1">
              {selected.userName} ({selected.loginId})
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">
              요청 사유
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              {selected.reason}
            </div>
          </div>
          <Field
            label="검토 메모"
            defaultValue={selected.reviewNote ?? ""}
            placeholder="검토 메모를 입력하세요"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              승인
            </button>
            <button className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
              반려
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function AuditLogsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(
    auditLogsData[0].id,
  );
  const selected =
    auditLogsData.find((log) => log.id === selectedId) ?? auditLogsData[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        title="감사 로그"
        subtitle="관리자 액션과 변경 이력을 추적합니다."
      >
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <Field label="Actor" placeholder="관리자 이름" />
          <Field label="Action" placeholder="액션명" />
          <Field label="Target" placeholder="대상 ID" />
          <button className="mt-7 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            조회
          </button>
        </div>
        <div className="space-y-3">
          {auditLogsData.map((log) => (
            <button
              key={log.id}
              onClick={() => setSelectedId(log.id)}
              className={cls(
                "w-full rounded-2xl border p-4 text-left transition hover:bg-slate-50",
                selectedId === log.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-slate-900">{log.action}</div>
                <div className="text-xs text-slate-400">{log.createdAt}</div>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {log.actor} → {log.target}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="변경 상세" subtitle="before / after JSON 미리보기">
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">
              Before
            </div>
            <pre className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              {selected.beforeJson}
            </pre>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">After</div>
            <pre className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              {selected.afterJson}
            </pre>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function SystemLogsPage() {
  const severityTone: Record<LogSeverity, "slate" | "amber" | "rose"> = {
    INFO: "slate",
    WARN: "amber",
    ERROR: "rose",
  };

  return (
    <SectionCard title="시스템 로그" subtitle="운영 로그와 오류를 조회합니다.">
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Severity
          </label>
          <select className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none">
            <option>전체</option>
            <option>INFO</option>
            <option>WARN</option>
            <option>ERROR</option>
          </select>
        </div>
        <Field label="Source" placeholder="source 입력" />
        <Field label="기간" defaultValue="2026-03-01" />
        <button className="mt-7 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
          조회
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Severity</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Message</th>
              <th className="px-4 py-3 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {systemLogsData.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-3">
                  <StatusPill tone={severityTone[log.severity]}>
                    {log.severity}
                  </StatusPill>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {log.source}
                </td>
                <td className="px-4 py-3 text-slate-600">{log.message}</td>
                <td className="px-4 py-3 text-slate-500">{log.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function PropertiesPage() {
  const [selectedId, setSelectedId] = useState<number | null>(
    propertiesData[0].id,
  );
  const selected =
    propertiesData.find((property) => property.id === selectedId) ??
    propertiesData[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        title="숙소 운영 현황"
        subtitle="숙소별 운영 상태와 예약 현황을 확인합니다."
      >
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <Field label="검색어" placeholder="숙소명" />
          <Field label="지역" placeholder="지역 입력" />
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
          <button className="mt-7 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            조회
          </button>
        </div>

        <div className="space-y-3">
          {propertiesData.map((property) => (
            <button
              key={property.id}
              onClick={() => setSelectedId(property.id)}
              className={cls(
                "w-full rounded-2xl border p-4 text-left transition hover:bg-slate-50",
                selectedId === property.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900">
                    {property.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {property.host} · {property.region}
                  </div>
                </div>
                <StatusPill
                  tone={property.status === "ACTIVE" ? "green" : "amber"}
                >
                  {property.status}
                </StatusPill>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <div>타입 수 {property.roomTypeCount}</div>
                <div>예약 수 {property.reservationCount}</div>
                <div>대기 {property.pendingCount}</div>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="숙소 상세"
        subtitle="선택한 숙소의 운영 정보를 요약합니다."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="text-base font-semibold text-slate-900">
              {selected.name}
            </div>
            <div className="mt-1">호스트: {selected.host}</div>
            <div className="mt-1">지역: {selected.region}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4 text-center">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                객실 타입 수
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {selected.roomTypeCount}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 text-center">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                예약 수
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {selected.reservationCount}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 text-center">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                예약 대기
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {selected.pendingCount}
              </div>
            </div>
          </div>
          <button className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            호스트 운영 상세 보기
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function TermsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(
    termsDocsData[0].id,
  );
  const selected =
    termsDocsData.find((doc) => doc.id === selectedId) ?? termsDocsData[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="약관 관리" subtitle="약관 문서를 선택하세요.">
        <div className="space-y-3">
          {termsDocsData.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedId(doc.id)}
              className={cls(
                "w-full rounded-2xl border p-4 text-left transition hover:bg-slate-50",
                selectedId === doc.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900">
                    {doc.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{doc.type}</div>
                </div>
                <StatusPill tone="blue">{doc.version}</StatusPill>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                수정일 {doc.updatedAt}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="약관 편집"
        subtitle="버전과 내용을 수정 후 저장합니다."
      >
        <div className="space-y-4">
          <Field label="제목" defaultValue={selected.title} />
          <Field label="버전" defaultValue={selected.version} />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              내용
            </label>
            <textarea
              rows={14}
              defaultValue={selected.content}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </div>
          <div className="flex justify-end">
            <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              저장
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function CurrentPage({
  page,
  onNavigate,
  onLogin,
}: {
  page: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onLogin: () => void;
}) {
  switch (page) {
    case "dashboard":
      return <DashboardPage onNavigate={onNavigate} />;
    case "users":
      return <UsersPage />;
    case "role-requests":
      return <RoleRequestsPage />;
    case "audit-logs":
      return <AuditLogsPage />;
    case "system-logs":
      return <SystemLogsPage />;
    case "properties":
      return <PropertiesPage />;
    case "terms":
      return <TermsPage />;
    case "login":
    default:
      return <LoginPage onLogin={onLogin} />;
  }
}

export default function AdminUIPreview() {
  const [page, setPage] = useState<AdminPage>("login");
  const [authState, setAuthState] = useState<AdminAuthState>("logged-out");

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
    <AdminShell
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
    </AdminShell>
  );
}
