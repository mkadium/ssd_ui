import {
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  Gauge,
  GitBranch,
  Home,
  Languages,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PanelLeftClose,
  Shield,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  notifications,
  reminders,
} from "@/data/userExperience.sample";
import { unitScopeOptions } from "@/data/unitScope.sample";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { useUnitScopeOptions } from "@/hooks/useUnitScopeOptions";
import { useLanguage, type SupportedLanguage } from "@/providers/language-context";

type AppShellProps = {
  children: ReactNode;
  persona?: string;
  activeDashboard?: string;
  showUnitSelector?: boolean;
};

const navigationGroups = [
  {
    labelKey: "nav.groupOverview",
    items: [
      { labelKey: "nav.home", path: "/", icon: Home },
      { labelKey: "nav.dashboard", path: "/dashboard/super-admin", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "nav.groupSetup",
    items: [
      { labelKey: "nav.framework", path: "/masters/frameworks", icon: GitBranch },
      { labelKey: "nav.indicators", path: "/masters/indicators", icon: Database },
      { labelKey: "nav.masters", path: "/masters/reference", icon: Building2 },
      { labelKey: "nav.dimensions", path: "/dimensions", icon: ListChecks },
      { labelKey: "nav.templates", path: "/templates", icon: FileSpreadsheet },
    ],
  },
  {
    labelKey: "nav.groupCollection",
    items: [
      { labelKey: "nav.requests", path: "/requests", icon: ClipboardCheck },
      { labelKey: "nav.dataEntry", path: "/data-entry", icon: BookOpen },
      { labelKey: "nav.ingestion", path: "/ingestion", icon: Database },
      { labelKey: "nav.validation", path: "/validation", icon: ShieldCheck },
      { labelKey: "nav.validationRules", path: "/validation/rules", icon: ListChecks },
      { labelKey: "nav.review", path: "/review", icon: Users },
    ],
  },
  {
    labelKey: "nav.groupAdministration",
    items: [
      { labelKey: "nav.invitationAccess", path: "/invitation-access", icon: CalendarClock },
      { labelKey: "nav.applicationSetup", path: "/application-setup", icon: Settings },
      { labelKey: "nav.logsMonitor", path: "/logs-monitor", icon: Gauge },
    ],
  },
  {
    labelKey: "nav.groupGovernance",
    items: [
      { labelKey: "nav.objectCoverage", path: "/system-object-coverage", icon: Database },
      { labelKey: "nav.accessibility", path: "/accessibility-compliance", icon: Shield },
    ],
  },
];

export function AppShell({
  children,
  persona = "Super Admin",
  activeDashboard = "/dashboard/super-admin",
  showUnitSelector = true,
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const { language, setLanguage, t } = useLanguage();
  const unitScopeQuery = useUnitScopeOptions({ enabled: showUnitSelector, locale: language });
  const unitCodeFromUrl = new URLSearchParams(location.search).get("unit_code");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openPopover, setOpenPopover] = useState<"reminders" | "notifications" | "profile" | null>(null);

  const loadedUnitOptions = unitScopeQuery.data ?? unitScopeOptions;
  const unitOptions =
    unitCodeFromUrl && !loadedUnitOptions.some((unit) => unit.unit_code === unitCodeFromUrl)
      ? [
          {
            unit_code: unitCodeFromUrl,
            unit_name: unitCodeFromUrl,
            unit_type: "UNIT",
            jurisdiction: "Selected unit",
            status: "ACTIVE" as const,
          },
          ...loadedUnitOptions,
        ]
      : loadedUnitOptions;
  const fallbackUnitCode = unitOptions[0]?.unit_code ?? "";
  const selectedUnitCode = unitCodeFromUrl ?? fallbackUnitCode;
  const userName = typeof user?.display_name === "string" ? user.display_name : "Admin";
  const unreadNotificationCount = notifications.filter((item) => item.status === "UNREAD").length;
  const activeReminderCount = reminders.filter((item) => item.status !== "DONE").length;

  useEffect(() => {
    if (!showUnitSelector || unitOptions.length === 0) {
      return;
    }

    if (!unitCodeFromUrl && selectedUnitCode) {
      const params = new URLSearchParams(location.search);
      params.set("unit_code", selectedUnitCode);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate, selectedUnitCode, showUnitSelector, unitCodeFromUrl, unitOptions]);

  const handleUnitChange = (unitCode: string) => {
    const params = new URLSearchParams(location.search);
    params.set("unit_code", unitCode);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const withUnitSearch = (path: string) => {
    const params = new URLSearchParams(location.search);

    if (selectedUnitCode) {
      params.set("unit_code", selectedUnitCode);
    }

    const queryString = params.toString();

    return queryString ? `${path}?${queryString}` : path;
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true }),
    });
  };

  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <div
        className={[
          "grid h-full overflow-hidden transition-[grid-template-columns]",
          sidebarCollapsed ? "grid-cols-[84px_minmax(0,1fr)]" : "grid-cols-[256px_minmax(0,1fr)]",
        ].join(" ")}
      >
        <aside className="flex h-full min-h-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm">
          <div className={["relative flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4", sidebarCollapsed ? "justify-center px-3" : ""].join(" ")}>
            <button
              type="button"
              onClick={() => {
                if (sidebarCollapsed) {
                  setSidebarCollapsed(false);
                }
              }}
              className={[
                "grid size-11 shrink-0 place-items-center rounded-md bg-white text-[10px] font-semibold leading-tight text-[#0c2f55] shadow-sm",
                sidebarCollapsed ? "cursor-pointer hover:ring-2 hover:ring-sidebar-ring" : "cursor-default",
              ].join(" ")}
              aria-label={sidebarCollapsed ? "Expand navigation" : "SSD-SDG logo"}
              aria-disabled={!sidebarCollapsed}
            >
              Logo
              <span>path:</span>
            </button>
            <div className={sidebarCollapsed ? "hidden" : "block"}>
              <p className="text-xl font-bold tracking-tight">SSD-SDG</p>
              <p className="text-xs text-blue-100">{persona}</p>
            </div>
            {!sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="ml-auto grid size-9 shrink-0 place-items-center rounded-md border border-sidebar-border text-blue-50 transition-colors hover:bg-sidebar-accent"
                aria-label="Collapse navigation"
              >
                <PanelLeftClose aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>

          <nav
            aria-label="Primary navigation"
            className={[
              "scrollbar-none flex-1 overflow-y-auto py-4",
              sidebarCollapsed ? "space-y-3 px-2" : "space-y-4 px-3",
            ].join(" ")}
          >
            {navigationGroups.map((group) => (
              <div key={group.labelKey} className="space-y-1">
                {sidebarCollapsed ? (
                  <div className="mx-auto my-3 h-px w-9 bg-sidebar-border/80" aria-hidden="true" />
                ) : (
                  <p className="px-3 pb-1 pt-2 text-[0.65rem] font-bold uppercase tracking-wide text-blue-200">
                    {t(group.labelKey)}
                  </p>
                )}

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const label = t(item.labelKey);

                  return (
                    <NavLink
                      key={item.labelKey}
                      to={withUnitSearch(item.path)}
                      end={item.path === "/"}
                      title={sidebarCollapsed ? label : undefined}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 rounded-md text-sm font-medium transition-colors",
                          sidebarCollapsed ? "mx-auto size-11 justify-center px-0" : "h-9 px-3",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-white/10"
                            : "text-blue-50 hover:bg-sidebar-accent/70",
                        ].join(" ")
                      }
                    >
                      <Icon aria-hidden="true" className={sidebarCollapsed ? "size-5" : "size-4"} />
                      <span className={sidebarCollapsed ? "sr-only" : "truncate"}>{label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
            <div className="min-w-[180px]">
              <p className="text-lg font-bold">{t("app.title")}</p>
            </div>

            <label className="ml-auto flex min-w-[220px] items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
              <span className="sr-only">Select dashboard</span>
              <LayoutDashboard aria-hidden="true" className="size-4 text-primary" />
              <select
                className="w-full bg-transparent text-sm font-semibold outline-none"
                value={activeDashboard}
                onChange={(event) => navigate(withUnitSearch(event.target.value))}
              >
                <option value="/dashboard/super-admin">{t("top.dashboardSuper")}</option>
                <option value="/dashboard/unit-admin">{t("top.dashboardUnit")}</option>
                <option value="/dashboard/snapshot">{t("top.dashboardSnapshot")}</option>
              </select>
            </label>

            {showUnitSelector ? (
              <label className="flex min-w-[150px] max-w-[220px] items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span className="sr-only">Select working unit</span>
                <Building2 aria-hidden="true" className="size-4 text-primary" />
                <select
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  value={selectedUnitCode}
                  onChange={(event) => handleUnitChange(event.target.value)}
                  aria-busy={unitScopeQuery.isPending}
                >
                  {unitOptions.map((unit) => (
                    <option key={unit.unit_code} value={unit.unit_code}>
                      {t("top.unit")}: {unit.unit_code}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold">
              <Languages aria-hidden="true" className="size-4 text-primary" />
              <span className="sr-only">{t("top.language")}</span>
              <select
                className="bg-transparent outline-none"
                value={language}
                onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
              >
                <option value="en-IN">EN</option>
                <option value="hi-IN">HN</option>
              </select>
            </label>

            <div className="relative">
              <button
                type="button"
                className="relative grid size-9 place-items-center rounded-md border border-border bg-background"
                aria-label="Open reminders"
                onClick={() => setOpenPopover(openPopover === "reminders" ? null : "reminders")}
              >
                <CalendarClock aria-hidden="true" className="size-4" />
                <span className="absolute -right-1 -top-1 rounded-full bg-orange-600 px-1.5 text-[10px] font-bold text-white">{activeReminderCount}</span>
              </button>
              {openPopover === "reminders" && (
                <div className="absolute right-0 top-11 z-40 w-80 rounded-md border border-border bg-card p-3 shadow-lg">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{t("top.reminders")}</p>
                    <Button type="button" variant="outline" size="xs" onClick={() => { setOpenPopover(null); navigate(withUnitSearch("/reminders")); }}>
                      {t("top.viewAll")}
                    </Button>
                  </div>
                  {reminders.slice(0, 3).map((item) => (
                    <button
                      key={item.reminder_code}
                      type="button"
                      className="w-full border-b border-border py-2 text-left text-xs last:border-b-0 hover:text-primary"
                      onClick={() => { setOpenPopover(null); navigate(withUnitSearch("/reminders")); }}
                    >
                      <span className="block font-semibold">{item.title}</span>
                      <span className="text-muted-foreground">{item.status} / {item.due_at}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="relative grid size-9 place-items-center rounded-md border border-border bg-background"
                aria-label="Open notifications"
                onClick={() => setOpenPopover(openPopover === "notifications" ? null : "notifications")}
              >
                <Bell aria-hidden="true" className="size-4" />
                <span className="absolute -right-1 -top-1 rounded-full bg-red-700 px-1.5 text-[10px] font-bold text-white">{unreadNotificationCount}</span>
              </button>
              {openPopover === "notifications" && (
                <div className="absolute right-0 top-11 z-40 max-h-80 w-80 overflow-y-auto rounded-md border border-border bg-card p-3 shadow-lg">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{t("top.notifications")}</p>
                    <Button type="button" variant="outline" size="xs" onClick={() => { setOpenPopover(null); navigate(withUnitSearch("/notifications")); }}>
                      {t("top.viewAll")}
                    </Button>
                  </div>
                  {notifications.slice(0, 4).map((item) => (
                    <button
                      key={item.notification_code}
                      type="button"
                      className="w-full border-b border-border py-2 text-left text-xs last:border-b-0 hover:text-primary"
                      onClick={() => { setOpenPopover(null); navigate(withUnitSearch("/notifications")); }}
                    >
                      <span className="block font-semibold">{item.title}</span>
                      <span className="text-muted-foreground">{item.module} / {item.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="outline" className="h-9 min-w-16">{t("top.tour")}</Button>

            <div className="relative">
              <button
                type="button"
                className="flex h-9 min-w-28 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold"
                onClick={() => setOpenPopover(openPopover === "profile" ? null : "profile")}
                aria-label="Open user menu"
              >
                <UserCircle aria-hidden="true" className="size-4" />
                <span className="max-w-24 truncate">{userName}</span>
              </button>
              {openPopover === "profile" && (
                <div className="absolute right-0 top-11 z-40 w-64 rounded-md border border-border bg-card p-2 shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-sm font-bold">{userName}</p>
                    <p className="text-xs text-muted-foreground">{persona}</p>
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted"
                    onClick={() => { setOpenPopover(null); navigate(withUnitSearch("/profile")); }}
                  >
                    <Building2 aria-hidden="true" className="size-4" />
                    {t("top.profile")}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted"
                    onClick={() => { setOpenPopover(null); navigate(withUnitSearch("/preferences")); }}
                  >
                    <Menu aria-hidden="true" className="size-4" />
                    {t("top.preferences")}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    {logoutMutation.isPending ? "Logging out" : t("top.logout")}
                  </button>
                </div>
              )}
            </div>
          </header>

          <main id="main-content" className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
