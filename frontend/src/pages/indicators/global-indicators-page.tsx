import { Edit3, Plus, RefreshCw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createGlobalIndicator,
  listGlobalIndicators,
  updateGlobalIndicator,
  type GlobalIndicatorListItem,
  type GlobalIndicatorPayload,
} from "../../api/indicators.api";
import { listFrameworkEditions, type FrameworkEdition } from "../../api/framework.api";
import { getSelectedUnitCode, LOCALE_CHANGED_EVENT, UNIT_CHANGED_EVENT } from "../../api/session.api";
import { Loader } from "../../components/common/loader";

const emptyForm = {
  global_indicator_code: "",
  indicator_number: "",
  name: "",
  description: "",
  methodology_note: "",
  custodian_agency_code: "",
  tier_code: "",
  status: "ACTIVE",
  is_active: true,
};

function textValue(value: unknown) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function normalize(value: unknown) {
  return textValue(value).toLowerCase();
}

export function GlobalIndicatorsPage() {
  const [records, setRecords] = useState<GlobalIndicatorListItem[]>([]);
  const [activeFramework, setActiveFramework] = useState<FrameworkEdition | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<GlobalIndicatorListItem | null>(null);
  const [editingRecord, setEditingRecord] = useState<GlobalIndicatorListItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadPage();
    function handleContextChange() {
      void loadPage();
    }
    window.addEventListener(UNIT_CHANGED_EVENT, handleContextChange);
    window.addEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
    return () => {
      window.removeEventListener(UNIT_CHANGED_EVENT, handleContextChange);
      window.removeEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((record) => {
      const status = record.is_active === false ? "INACTIVE" : record.status || "ACTIVE";
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesQuery =
        !q ||
        [
          record.global_indicator_code,
          record.indicator_number,
          record.name,
          record.description,
          record.custodian_agency_code,
          record.tier_code,
          record.status,
        ]
          .map(normalize)
          .join(" ")
          .includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [query, records, statusFilter]);

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [globalResponse, frameworkResponse] = await Promise.all([
        listGlobalIndicators(),
        listFrameworkEditions(true),
      ]);
      setRecords(globalResponse.data);
      setActiveFramework(
        frameworkResponse.data.find((edition) => edition.is_active && edition.status !== "INACTIVE") ??
          frameworkResponse.data.find((edition) => edition.is_active) ??
          frameworkResponse.data[0] ??
          null,
      );
      setSelectedRecord(globalResponse.data[0] ?? null);
    } catch {
      setRecords([]);
      setSelectedRecord(null);
      setError("Global indicators could not be loaded. Please refresh or try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreate() {
    setEditingRecord(null);
    setForm(emptyForm);
    setIsDrawerOpen(true);
  }

  function openEdit(record: GlobalIndicatorListItem) {
    setEditingRecord(record);
    setIsDrawerOpen(true);
    setForm({
      global_indicator_code: record.global_indicator_code ?? "",
      indicator_number: record.indicator_number ?? "",
      name: record.name ?? "",
      description: record.description ?? "",
      methodology_note: record.methodology_note ?? "",
      custodian_agency_code: record.custodian_agency_code ?? "",
      tier_code: record.tier_code ?? "",
      status: record.status ?? "ACTIVE",
      is_active: record.is_active !== false,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeFramework?.framework_code || !activeFramework.edition_code) {
      setError("Global indicator save requires an active framework edition for the selected unit.");
      return;
    }
    if (!form.name.trim()) {
      setError("Global indicator name is required.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const payload: GlobalIndicatorPayload = {
        framework_code: activeFramework.framework_code,
        edition_code: activeFramework.edition_code,
        global_indicator_code: form.global_indicator_code.trim() || undefined,
        indicator_number: form.indicator_number.trim() || undefined,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        methodology_note: form.methodology_note.trim() || undefined,
        custodian_agency_code: form.custodian_agency_code.trim() || undefined,
        tier_code: form.tier_code.trim() || undefined,
        status: form.status,
        is_active: form.is_active,
      };
      if (editingRecord?.global_indicator_code) {
        await updateGlobalIndicator(editingRecord.global_indicator_code, payload);
      } else {
        await createGlobalIndicator(payload);
      }
      setNotice("Global indicator saved.");
      setEditingRecord(null);
      setIsDrawerOpen(false);
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Global indicator could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="workflow-page global-indicators-page">
      <section className="page-heading-row compact">
        <div>
          <div className="breadcrumb">Home / Indicator Management / Global Indicators</div>
          <h2>Global Indicators</h2>
          <p>Manage global indicator references mapped to national indicators for the selected unit.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button compact" type="button" onClick={() => void loadPage()}>
            <RefreshCw size={13} />
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={openCreate}>
            <Plus size={14} />
            New
          </button>
        </div>
      </section>

      {notice && <div className="toast-notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four">
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{records.length}</div>
          <div className="metric-label">Global indicators</div>
          <div className="metric-sublabel">{getSelectedUnitCode()}</div>
        </article>
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{records.filter((record) => record.is_active !== false).length}</div>
          <div className="metric-label">Active</div>
          <div className="metric-sublabel">available</div>
        </article>
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{records.reduce((total, record) => total + Number(record.mapped_national_count ?? 0), 0)}</div>
          <div className="metric-label">National mappings</div>
          <div className="metric-sublabel">active links</div>
        </article>
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{activeFramework?.edition_code ?? "-"}</div>
          <div className="metric-label">Framework</div>
          <div className="metric-sublabel">{activeFramework?.framework_code ?? "not selected"}</div>
        </article>
      </section>

      <section className="toolbar-panel indicator-toolbar-panel">
        <label className="input-shell">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search global indicator code, number, name, custodian, tier" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ALL">All statuses</option>
        </select>
      </section>

      <div className="master-content-grid">
        <section className="workflow-card master-table-card">
          <div className="table-wrap master-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Global Indicator</th>
                  <th>Name</th>
                  <th>Custodian</th>
                  <th>Tier</th>
                  <th>National Mappings</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="loader-table-row"><td colSpan={7}><Loader label="Loading global indicators..." /></td></tr>
                ) : filteredRecords.length ? (
                  filteredRecords.map((record) => (
                    <tr
                      className={selectedRecord?.global_indicator_code === record.global_indicator_code ? "selected-row clickable-row" : "clickable-row"}
                      key={record.global_indicator_code}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td>
                        <span className="code-text">{textValue(record.indicator_number)}</span>
                        <span className="muted-code">{record.global_indicator_code}</span>
                      </td>
                      <td><span className="cell-text" title={record.name}>{textValue(record.name)}</span></td>
                      <td>{textValue(record.custodian_agency_code)}</td>
                      <td>{textValue(record.tier_code)}</td>
                      <td>{Number(record.mapped_national_count ?? 0)}</td>
                      <td><span className={record.is_active === false ? "status-pill inactive" : "status-pill active"}>{record.is_active === false ? "Inactive" : textValue(record.status)}</span></td>
                      <td>
                        <button className="secondary-button compact" type="button" onClick={(event) => { event.stopPropagation(); openEdit(record); }}>
                          <Edit3 size={12} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7}>No global indicators found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="detail-panel master-detail-panel">
          <div className="detail-panel-header">
            <div>
              <span>Global Indicator</span>
              <h3>{textValue(selectedRecord?.indicator_number ?? selectedRecord?.global_indicator_code)}</h3>
            </div>
          </div>
          <div className="detail-field-grid">
            <DetailField label="Name" value={selectedRecord?.name} />
            <DetailField label="Code" value={selectedRecord?.global_indicator_code} />
            <DetailField label="Description" value={selectedRecord?.description} />
            <DetailField label="Custodian" value={selectedRecord?.custodian_agency_code} />
            <DetailField label="Tier" value={selectedRecord?.tier_code} />
            <DetailField label="National mappings" value={selectedRecord?.mapped_national_count} />
          </div>
        </aside>
      </div>

      {isDrawerOpen && (
        <div className="drawer-overlay">
          <aside className="form-drawer compact-form-drawer indicator-editor-drawer">
            <div className="drawer-header indicator-editor-header">
              <div>
                <span>{editingRecord ? "Edit" : "Create"}</span>
                <h3>Global Indicator</h3>
              </div>
              <button className="icon-action" type="button" onClick={() => { setEditingRecord(null); setForm(emptyForm); setIsDrawerOpen(false); }}>
                <X size={16} />
              </button>
            </div>
            <form className="drawer-form indicator-editor-form" onSubmit={handleSubmit}>
              <div className="indicator-editor-guidance"><strong>Global reference</strong><span>Create a reusable global indicator reference for national indicator mappings.</span></div>
              <section className="indicator-editor-section">
                <div className="indicator-editor-section-heading"><span>01</span><div><strong>Reference details</strong><small>Core code, number, name, and description</small></div></div>
                <div className="indicator-editor-fields two-column">
                  <label><span>Global indicator code</span><input value={form.global_indicator_code} onChange={(event) => setForm((current) => ({ ...current, global_indicator_code: event.target.value }))} /></label>
                  <label><span>Indicator number</span><input value={form.indicator_number} onChange={(event) => setForm((current) => ({ ...current, indicator_number: event.target.value }))} /></label>
                  <label className="full-field"><span>Name *</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                  <label className="full-field"><span>Description</span><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
                </div>
              </section>
              <section className="indicator-editor-section">
                <div className="indicator-editor-section-heading"><span>02</span><div><strong>Ownership &amp; classification</strong><small>Custodian, tier, and lifecycle status</small></div></div>
                <div className="indicator-editor-fields two-column">
                  <label><span>Custodian agency</span><input value={form.custodian_agency_code} onChange={(event) => setForm((current) => ({ ...current, custodian_agency_code: event.target.value }))} /></label>
                  <label><span>Tier</span><input value={form.tier_code} onChange={(event) => setForm((current) => ({ ...current, tier_code: event.target.value }))} /></label>
                  <label><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="RETIRED">Retired</option></select></label>
                  <label className="role-toggle-card indicator-active-toggle">
                    <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
                    <span className="role-toggle-copy"><strong>Active reference</strong><small>Allow this indicator to be mapped.</small></span>
                    <span className="role-toggle-track" aria-hidden="true"><span className="role-toggle-thumb" /></span>
                  </label>
                </div>
              </section>
              <div className="drawer-footer indicator-editor-footer">
                <button className="secondary-button" type="button" onClick={() => { setEditingRecord(null); setForm(emptyForm); setIsDrawerOpen(false); }}>Cancel</button>
                <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingRecord ? "Save changes" : "Create indicator"}</button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{textValue(value)}</strong>
    </div>
  );
}
