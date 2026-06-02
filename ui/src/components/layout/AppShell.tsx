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
  PanelLeftOpen,
  Shield,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  notifications,
  reminders,
} from "@/data/userExperience.sample";
import { unitScopeOptions } from "@/data/unitScope.sample";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
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
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const { language, setLanguage, t } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedUnitCode, setSelectedUnitCode] = useState(unitScopeOptions[0]?.unit_code ?? "");
  const [openPopover, setOpenPopover] = useState<"reminders" | "notifications" | "profile" | null>(null);

  const userName = typeof user?.display_name === "string" ? user.display_name : "Admin";
  const unreadNotificationCount = notifications.filter((item) => item.status === "UNREAD").length;
  const activeReminderCount = reminders.filter((item) => item.status !== "DONE").length;

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
          sidebarCollapsed ? "grid-cols-[72px_minmax(0,1fr)]" : "grid-cols-[256px_minmax(0,1fr)]",
        ].join(" ")}
      >
        <aside className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
            <div className="grid size-11 place-items-center rounded-md bg-white text-[10px] font-semibold leading-tight text-[#0c2f55]">
              Logo
              <span>path:</span>
            </div>
            <div className={sidebarCollapsed ? "hidden" : "block"}>
              <p className="text-xl font-bold tracking-tight">SSD-SDG</p>
              <p className="text-xs text-blue-100">{persona}</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="ml-auto grid size-8 place-items-center rounded-md border border-sidebar-border text-blue-50 hover:bg-sidebar-accent"
              aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen aria-hidden="true" className="size-4" />
              ) : (
                <PanelLeftClose aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>

          <nav aria-label="Primary navigation" className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
            {navigationGroups.map((group) => (
              <div key={group.labelKey} className="space-y-1">
                {sidebarCollapsed ? (
                  <div className="mx-auto my-2 h-px w-8 bg-sidebar-border" aria-hidden="true" />
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
                      to={item.path}
                      end={item.path === "/"}
                      title={sidebarCollapsed ? label : undefined}
                      className={({ isActive }) =>
                        [
                          "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                          sidebarCollapsed ? "justify-center px-0" : "",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-blue-50 hover:bg-sidebar-accent/70",
                        ].join(" ")
                      }
                    >
                      <Icon aria-hidden="true" className="size-4" />
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
                onChange={(event) => navigate(event.target.value)}
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
                  onChange={(event) => setSelectedUnitCode(event.target.value)}
                >
                  {unitScopeOptions.map((unit) => (
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
                    <Button type="button" variant="outline" size="xs" onClick={() => { setOpenPopover(null); navigate("/reminders"); }}>
                      {t("top.viewAll")}
                    </Button>
                  </div>
                  {reminders.slice(0, 3).map((item) => (
                    <button
                      key={item.reminder_code}
                      type="button"
                      className="w-full border-b border-border py-2 text-left text-xs last:border-b-0 hover:text-primary"
                      onClick={() => { setOpenPopover(null); navigate("/reminders"); }}
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
                    <Button type="button" variant="outline" size="xs" onClick={() => { setOpenPopover(null); navigate("/notifications"); }}>
                      {t("top.viewAll")}
                    </Button>
                  </div>
                  {notifications.slice(0, 4).map((item) => (
                    <button
                      key={item.notification_code}
                      type="button"
                      className="w-full border-b border-border py-2 text-left text-xs last:border-b-0 hover:text-primary"
                      onClick={() => { setOpenPopover(null); navigate("/notifications"); }}
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
                    onClick={() => { setOpenPopover(null); navigate("/profile"); }}
                  >
                    <Building2 aria-hidden="true" className="size-4" />
                    {t("top.profile")}
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted"
                    onClick={() => { setOpenPopover(null); navigate("/preferences"); }}
                  >
                    <Menu aria-hidden="true" className="size-4" />
                    {t("top.preferences")}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50"
                  >
                    <LogOut aria-hidden="true" className="size-4" />
                    {t("top.logout")}
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
