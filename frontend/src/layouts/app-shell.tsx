import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GitBranch,
  LogOut,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AUTH_EXPIRED_EVENT,
  DEFAULT_UNIT_CODE,
  DEFAULT_LOCALE,
  clearAuthSession,
  getLocalCurrentUser,
  getSelectedLocale,
  getSelectedUnitCode,
  hasActiveSession,
  isSessionIdleExpired,
  isSuperAdmin,
  listAvailableUnits,
  loadCurrentUser,
  logout,
  markSessionActivity,
  setSelectedUnitCode,
  setSelectedLocale,
  type UnitOption,
} from "../api/session.api";
import { getFrameworkHierarchy, listFrameworkEditions } from "../api/framework.api";
import {
  getNotificationSummary,
  listUserNotifications,
  markAllNotificationsRead,
  setNotificationRead,
  streamNotificationSummary,
  type UserNotification,
} from "../api/notifications.api";
import { bottomNavigation, navigationModules, type NavItem } from "../routes/navigation";

export function AppShell() {
  const user = getLocalCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState({ unreadCount: 0 });
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [openModules, setOpenModules] = useState<string[]>(() => {
    const initialModule = getModuleForPath(location.pathname);
    return initialModule ? [initialModule] : [];
  });
  const [contrastEnabled, setContrastEnabled] = useState(false);
  const [fontScale, setFontScale] = useState(0);
  const [selectedUnitCode, setSelectedUnitCodeState] = useState(() => getSelectedUnitCode());
  const [selectedLocale, setSelectedLocaleState] = useState(() => getSelectedLocale());
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([
    { unit_code: DEFAULT_UNIT_CODE, unit_name: "SDG" },
  ]);
  const [frameworkLevelItems, setFrameworkLevelItems] = useState<NavItem[]>([]);
  const canSelectUnit = isSuperAdmin(user);
  const effectiveNavigationModules = useMemo(
    () =>
      navigationModules.map((module) =>
        module.label === "Framework"
          ? { ...module, items: [module.items[0], ...frameworkLevelItems] }
          : module,
      ),
    [frameworkLevelItems],
  );
  const effectiveFlatNavigation = useMemo(
    () => effectiveNavigationModules.flatMap((module) => module.items).concat(bottomNavigation),
    [effectiveNavigationModules],
  );

  const activeTitle = useMemo(() => {
    return effectiveFlatNavigation.find((item) => item.path === location.pathname)?.label ?? "Overview";
  }, [effectiveFlatNavigation, location.pathname]);

  useEffect(() => {
    if (!hasActiveSession() || isSessionIdleExpired()) {
      clearAuthSession();
      navigate("/login", { replace: true });
      return;
    }

    markSessionActivity();
    const routeModule = getModuleForPath(location.pathname, effectiveNavigationModules);
    if (routeModule) {
      setOpenModules((current) => (current.includes(routeModule) ? current : [...current, routeModule]));
    }
    void loadCurrentUser().catch(() => {
      clearAuthSession();
      navigate("/login", { replace: true });
    });
  }, [effectiveNavigationModules, location.pathname, navigate]);

  useEffect(() => {
    const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    const handleActivity = () => markSessionActivity();
    const handleAuthExpired = () => navigate("/login", { replace: true });
    const idleCheck = window.setInterval(() => {
      if (isSessionIdleExpired()) {
        clearAuthSession();
        navigate("/login", { replace: true });
      }
    }, 60_000);

    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.clearInterval(idleCheck);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", contrastEnabled);
  }, [contrastEnabled]);

  useEffect(() => {
    document.documentElement.dataset.fontScale = String(fontScale);
    document.documentElement.style.setProperty("--app-font-size", `${11 + fontScale * 0.25}px`);
  }, [fontScale]);

  useEffect(() => {
    if (!canSelectUnit) {
      setSelectedUnitCode(user.unitCode ?? DEFAULT_UNIT_CODE);
      setSelectedUnitCodeState(user.unitCode ?? DEFAULT_UNIT_CODE);
      return;
    }

    void listAvailableUnits()
      .then((units) => {
        const nextUnits = ensureSelectedUnitOption(units, selectedUnitCode);
        setAvailableUnits(nextUnits);
      })
      .catch(() => {
        setAvailableUnits([{ unit_code: selectedUnitCode || DEFAULT_UNIT_CODE, unit_name: selectedUnitCode || DEFAULT_UNIT_CODE }]);
      });
  }, [canSelectUnit, selectedUnitCode, user.unitCode]);

  useEffect(() => {
    let cancelled = false;

    async function loadFrameworkLevelNavigation() {
      try {
        const editionsResponse = await listFrameworkEditions(false);
        const editions = editionsResponse.data;
        const activeEdition = editions.find((edition) => edition.is_active !== false) ?? editions[0];

        if (!activeEdition?.framework_code) {
          if (!cancelled) setFrameworkLevelItems([]);
          return;
        }

        const hierarchyResponse = await getFrameworkHierarchy(activeEdition.framework_code, activeEdition.edition_code);
        const hierarchy = hierarchyResponse.data;
        const nextItems = [...(hierarchy.levels ?? [])]
          .filter((level) => level.is_active !== false)
          .sort((first, second) => Number(first.level_number ?? 0) - Number(second.level_number ?? 0))
          .map((level) => ({
            label: level.name || level.level_code,
            path: `/framework/levels/${encodeURIComponent(level.level_code)}`,
            icon: GitBranch,
          }));

        if (!cancelled) setFrameworkLevelItems(nextItems);
      } catch {
        if (!cancelled) setFrameworkLevelItems([]);
      }
    }

    void loadFrameworkLevelNavigation();
    return () => {
      cancelled = true;
    };
  }, [selectedLocale, selectedUnitCode]);

  useEffect(() => {
    let cancelled = false;
    void getNotificationSummary(selectedUnitCode)
      .then((summary) => {
        if (!cancelled) setNotificationSummary({ unreadCount: summary.unreadCount ?? 0 });
      })
      .catch(() => undefined);
    const stopStream = streamNotificationSummary((summary) => {
      setNotificationSummary({ unreadCount: summary.unreadCount ?? 0 });
      if (notificationsOpen) void refreshNotifications();
    }, selectedUnitCode);
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [selectedUnitCode, notificationsOpen]);

  function handleUnitChange(unitCode: string) {
    setSelectedUnitCode(unitCode);
    setSelectedUnitCodeState(unitCode);
    if (location.pathname !== "/framework") {
      navigate("/framework", { replace: false });
    }
  }

  function handleLocaleChange(locale: string) {
    setSelectedLocale(locale);
    setSelectedLocaleState(locale || DEFAULT_LOCALE);
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function refreshNotifications() {
    const rows = await listUserNotifications({ unitCode: selectedUnitCode, limit: 20 }).catch(() => []);
    setNotifications(rows);
  }

  async function toggleNotifications() {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen) {
      setUserMenuOpen(false);
      await refreshNotifications();
    }
  }

  async function openNotification(notification: UserNotification) {
    if (notification.notificationCode && !notification.isRead) {
      await setNotificationRead(notification.notificationCode, true).catch(() => undefined);
    }
    setNotificationsOpen(false);
    await refreshNotifications();
    const summary = await getNotificationSummary(selectedUnitCode).catch(() => ({ unreadCount: 0 }));
    setNotificationSummary({ unreadCount: summary.unreadCount ?? 0 });
    const notificationEntity = notification.entityType?.toUpperCase();
    const dispatchRunCode = notification.entityCode || notification.metadata?.dispatchRunCode;
    if (notificationEntity === "DISPATCH_RUN" && dispatchRunCode) {
      navigate(`/requests/dispatch-runs/${encodeURIComponent(String(dispatchRunCode))}?tab=communications`);
    } else if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
  }

  async function markNotificationsRead() {
    await markAllNotificationsRead(selectedUnitCode).catch(() => undefined);
    setNotificationSummary({ unreadCount: 0 });
    await refreshNotifications();
  }

  function handleScreenReader() {
    const pageText = document.querySelector(".content-frame")?.textContent?.replace(/\s+/g, " ").trim();
    const message = `${activeTitle}. SSD Enterprise Portal. ${pageText || ""}`.slice(0, 3500);
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(message));
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-emblem">SSD</div>
          <div className="brand-copy">
            <div className="brand-title">MoSPI SSD</div>
            <div className="brand-subtitle">Statistical Data Workspace</div>
          </div>
          <button
            className="sidebar-toggle"
            type="button"
            aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        <nav className="nav-groups" aria-label="Primary navigation">
          {effectiveNavigationModules.map((module) => {
            const ModuleIcon = module.icon;
            const isOpen = openModules.includes(module.label);
            const isRouteModule = getModuleForPath(location.pathname, effectiveNavigationModules) === module.label;
            return (
              <section className="nav-group" key={module.label}>
                <button
                  className={isRouteModule ? "nav-module-button active-module" : "nav-module-button"}
                  type="button"
                  onClick={() =>
                    setOpenModules((current) =>
                      current.includes(module.label)
                        ? current.filter((item) => item !== module.label || isRouteModule)
                        : [...current, module.label],
                    )
                  }
                >
                  <ModuleIcon size={15} />
                  {!sidebarCollapsed && <span>{module.label}</span>}
                  {!sidebarCollapsed && <ChevronDown className={isOpen ? "rotate" : ""} size={12} />}
                </button>

                {isOpen && !sidebarCollapsed && (
                  <div className="nav-subitems">
                    {module.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink className="nav-link" to={item.path} key={item.path} end>
                          <Icon size={13} />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          {bottomNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink className="nav-link bottom-link" to={item.path} key={item.path} end>
                <Icon size={14} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-title">
            <div className="eyebrow">SSD Enterprise Portal</div>
            <h1>{activeTitle}</h1>
          </div>
          <div className="topbar-actions">
            <button className="topbar-link" type="button" onClick={handleScreenReader}>
              Screen Reader
            </button>
            <div className="font-controls" aria-label="Text size controls">
              <button type="button" onClick={() => setFontScale((value) => Math.max(-5, value - 1))}>A-</button>
              <button type="button" onClick={() => setFontScale(0)}>A</button>
              <button type="button" onClick={() => setFontScale((value) => Math.min(5, value + 1))}>A+</button>
            </div>
            <button className={contrastEnabled ? "topbar-link active" : "topbar-link"} type="button" onClick={() => setContrastEnabled((value) => !value)}>
              Contrast
            </button>
            {canSelectUnit && (
              <select
                className="unit-select"
                aria-label="Unit"
                value={selectedUnitCode}
                onChange={(event) => handleUnitChange(event.target.value)}
              >
                {availableUnits.map((unit) => (
                  <option value={unit.unit_code} key={unit.unit_code}>
                    {unit.unit_code}
                  </option>
                ))}
              </select>
            )}
            <select
              className="locale-select"
              aria-label="Locale"
              value={selectedLocale}
              onChange={(event) => handleLocaleChange(event.target.value)}
            >
              <option value="en-IN">English</option>
              <option value="hi-IN">Hindi</option>
            </select>
            <button className="icon-button" type="button" aria-label="Calendar">
              <CalendarDays size={16} />
            </button>
            <button className="icon-button" type="button" aria-label="Reminders">
              <Clock3 size={16} />
              <span className="notification-dot reminder" />
            </button>
            <div className="notification-menu-wrap">
              <button className="icon-button" type="button" aria-label="Notifications" onClick={() => void toggleNotifications()}>
                <Bell size={16} />
                {notificationSummary.unreadCount > 0 ? (
                  <span className="notification-count">{Math.min(notificationSummary.unreadCount, 99)}</span>
                ) : null}
              </button>
              {notificationsOpen ? (
                <div className="notification-menu">
                  <header>
                    <strong>Notifications</strong>
                    <button type="button" onClick={() => void markNotificationsRead()}>Mark all read</button>
                  </header>
                  <div className="notification-list">
                    {notifications.length ? notifications.map((notification) => (
                      <button
                        className={notification.isRead ? "" : "unread"}
                        key={notification.notificationCode}
                        type="button"
                        onClick={() => void openNotification(notification)}
                      >
                        <span>{notification.notificationType?.replace("_", " ") ?? "Notification"}</span>
                        <strong>{notification.title}</strong>
                        <small>{notification.body}</small>
                      </button>
                    )) : <p>No notifications yet.</p>}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="user-menu-wrap">
              <button className="user-chip" type="button" onClick={() => setUserMenuOpen((value) => !value)}>
                <div className="user-avatar">{user.displayName.slice(0, 1)}</div>
                <div className="user-chip-copy">
                  <div className="user-name">{user.displayName}</div>
                  <div className="user-role">{user.roles[0]}</div>
                </div>
                <ChevronDown size={13} />
              </button>
              {userMenuOpen && (
                <div className="user-menu">
                  <button type="button">
                    <User size={14} />
                    Profile
                  </button>
                  <button type="button" onClick={handleLogout}>
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="content-frame">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function getModuleForPath(pathname: string, modules = navigationModules): string | null {
  return modules.find((module) => module.items.some((item) => item.path === pathname))?.label ?? null;
}

function ensureSelectedUnitOption(units: UnitOption[], selectedUnitCode: string): UnitOption[] {
  const normalizedSelected = (selectedUnitCode || DEFAULT_UNIT_CODE).toUpperCase();
  if (units.some((unit) => unit.unit_code?.toUpperCase() === normalizedSelected)) {
    return units;
  }
  return [{ unit_code: normalizedSelected, unit_name: normalizedSelected }, ...units];
}
