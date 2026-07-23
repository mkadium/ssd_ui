import { Activity, LockKeyhole, MousePointerClick, RefreshCw, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  listAuthAnonymousSessions,
  listAuthLoginAudit,
  listAuthSessions,
  type AuthSessionAuditRow,
} from "../../api/auth-admin.api";
import { Loader } from "../../components/common/loader";

type AuditTab = "sessions" | "login" | "anonymous";

const TAB_CONFIG: Record<AuditTab, { label: string; icon: typeof LockKeyhole; columns: Array<{ label: string; key: string }> }> = {
  sessions: {
    label: "Auth Sessions",
    icon: LockKeyhole,
    columns: [
      { label: "User", key: "username" },
      { label: "Display Name", key: "display_name" },
      { label: "Started", key: "started_at" },
      { label: "Last Seen", key: "last_seen_at" },
      { label: "End Reason", key: "end_reason" },
      { label: "Status", key: "is_active" },
    ],
  },
  login: {
    label: "Login Audit",
    icon: Activity,
    columns: [
      { label: "Username", key: "username_attempted" },
      { label: "Login Time", key: "login_at" },
      { label: "Success", key: "success" },
      { label: "Failure Reason", key: "failure_reason" },
      { label: "Browser", key: "browser_name" },
      { label: "Device", key: "device_type" },
    ],
  },
  anonymous: {
    label: "Anonymous Sessions",
    icon: MousePointerClick,
    columns: [
      { label: "Session", key: "anonymous_session_key" },
      { label: "First Seen", key: "first_seen_at" },
      { label: "Last Seen", key: "last_seen_at" },
      { label: "Converted User", key: "converted_user" },
      { label: "Browser", key: "browser_name" },
      { label: "Status", key: "is_active" },
    ],
  },
};

export function AuditSessionsPage() {
  const [activeTab, setActiveTab] = useState<AuditTab>("sessions");
  const [rows, setRows] = useState<AuthSessionAuditRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const statusMatches = statusFilter === "ALL" || Boolean(row.is_active ?? row.success) === (statusFilter === "ACTIVE");
      return statusMatches && matchesSearch(row, searchText);
    });
  }, [rows, searchText, statusFilter]);

  useEffect(() => {
    void loadRows(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function loadRows(tab = activeTab): Promise<void> {
    setIsLoading(true);
    setError("");
    try {
      const data =
        tab === "sessions"
          ? await listAuthSessions(true)
          : tab === "login"
            ? await listAuthLoginAudit()
            : await listAuthAnonymousSessions(true);
      setRows(data);
      setNotice(`${TAB_CONFIG[tab].label} refreshed.`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Audit records could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  const activeRows = rows.filter((row) => Boolean(row.is_active ?? row.success)).length;

  return (
    <div className="workflow-page">
      <div className="breadcrumb">Home / Authentication / Audit & Sessions</div>
      <section className="page-heading-row">
        <div>
          <h2>Audit & Sessions</h2>
          <p>Review session lifecycle, login outcomes, and anonymous pre-login journeys without exposing token values.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={() => void loadRows()}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </section>

      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four">
        <MetricCard label="Records" sublabel="Current tab" value={rows.length} />
        <MetricCard label="Active / Success" sublabel="Visible signal" value={activeRows} />
        <MetricCard label="Visible" sublabel="After filters" value={filteredRows.length} />
        <MetricCard label="Mode" sublabel="Read-only audit" value="Safe" />
      </section>

      <section className="workflow-card">
        <div className="tab-strip">
          {(Object.keys(TAB_CONFIG) as AuditTab[]).map((tab) => {
            const Icon = TAB_CONFIG[tab].icon;
            return (
              <button className={`tab-button ${activeTab === tab ? "active" : ""}`} key={tab} type="button" onClick={() => setActiveTab(tab)}>
                <Icon size={13} /> {TAB_CONFIG[tab].label}
              </button>
            );
          })}
        </div>
        <div className="toolbar-panel user-toolbar-panel">
          <div className="input-shell">
            <Search size={15} />
            <input onChange={(event) => setSearchText(event.target.value)} placeholder="Search audit records" value={searchText} />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active / Success</option>
            <option value="INACTIVE">Inactive / Failed</option>
          </select>
        </div>
        <div className="table-wrap user-table-wrap">
          {isLoading ? <Loader label="Loading audit records..." /> : (
            <table className="data-table">
              <thead>
                <tr>
                  {TAB_CONFIG[activeTab].columns.map((column) => <th key={column.key}>{column.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={`${activeTab}-${index}`}>
                    {TAB_CONFIG[activeTab].columns.map((column) => (
                      <td key={column.key}>{formatAuditValue(row[column.key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function matchesSearch(row: AuthSessionAuditRow, searchText: string): boolean {
  if (!searchText.trim()) return true;
  const normalizedSearch = searchText.trim().toLowerCase();
  return Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
}

function formatAuditValue(value: unknown): ReactNode {
  if (typeof value === "boolean") {
    return <span className={`status-badge ${value ? "active" : "inactive"}`}>{value ? "Yes" : "No"}</span>;
  }
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

function MetricCard({ label, sublabel, value }: { label: string; sublabel: string; value: number | string }) {
  return (
    <article className="metric-card">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-sublabel">{sublabel}</div>
    </article>
  );
}
