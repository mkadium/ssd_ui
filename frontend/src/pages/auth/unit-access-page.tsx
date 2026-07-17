import { Building2, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listAuthUnits, type AuthUnit } from "../../api/auth-admin.api";
import { LOCALE_CHANGED_EVENT } from "../../api/session.api";

export function UnitAccessPage() {
  const [units, setUnits] = useState<AuthUnit[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const statusMatches = statusFilter === "ALL" || Boolean(unit.is_active ?? true) === (statusFilter === "ACTIVE");
      return statusMatches && matchesSearch(searchText, unit.unit_code, getUnitName(unit));
    });
  }, [searchText, statusFilter, units]);

  useEffect(() => {
    void loadUnits();
  }, []);

  useEffect(() => {
    const handleLocaleChange = () => void loadUnits();
    window.addEventListener(LOCALE_CHANGED_EVENT, handleLocaleChange);
    return () => window.removeEventListener(LOCALE_CHANGED_EVENT, handleLocaleChange);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function loadUnits(): Promise<void> {
    setIsLoading(true);
    setError("");
    try {
      const unitList = await listAuthUnits(true);
      setUnits(unitList);
      setNotice("Units refreshed.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Units could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="workflow-page">
      <div className="breadcrumb">Home / Authentication / Units</div>
      <section className="page-heading-row">
        <div>
          <h2>Units</h2>
          <p>Review auth unit scopes used for Super Admin unit selection, user role scope, and downstream ownership.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={() => void loadUnits()}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </section>

      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four">
        <MetricCard label="Units" sublabel={`${units.filter((unit) => unit.is_active !== false).length} active`} value={units.length} />
        <MetricCard label="Selected scope" sublabel="Top-bar selector" value="Unit" />
        <MetricCard label="Role scope" sublabel="User role grants" value="RBAC" />
        <MetricCard label="Mode" sublabel="API list only" value="Read" />
      </section>

      <section className="toolbar-panel unit-toolbar-panel">
        <div className="input-shell">
          <Search size={15} />
          <input onChange={(event) => setSearchText(event.target.value)} placeholder="Search unit code or name" value={searchText} />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status">
          <option value="ACTIVE">Active</option>
          <option value="ALL">All statuses</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </section>

      <section className="workflow-card">
        {isLoading ? <div className="empty-state">Loading units...</div> : (
          <div className="unit-card-grid">
            {filteredUnits.map((unit) => (
              <article className="unit-scope-card" key={unit.unit_code}>
                <div className="unit-card-icon"><Building2 size={18} /></div>
                <div>
                  <h3>{unit.unit_code}</h3>
                  <p>{getUnitName(unit)}</p>
                </div>
                <span className={`status-badge ${unit.is_active === false ? "inactive" : "active"}`}>
                  {unit.is_active === false ? "Inactive" : "Active"}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getUnitName(unit: AuthUnit): string {
  return unit.unit_name || unit.display_name || unit.name || unit.unit_code;
}

function matchesSearch(searchText: string, ...values: Array<string | number | undefined | null>): boolean {
  if (!searchText.trim()) return true;
  const normalizedSearch = searchText.trim().toLowerCase();
  return values.some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
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
