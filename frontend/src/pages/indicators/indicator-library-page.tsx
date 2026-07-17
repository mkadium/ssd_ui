import { CheckCircle2, Edit3, ExternalLink, FileText, RefreshCw, Search } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createIndicator,
  getIndicator,
  listGlobalIndicators,
  listIndicators,
  saveGlobalIndicatorMapping,
  saveSourceAssignment,
  saveSourceOfficerAssignment,
  updateIndicator,
  updateIndicatorMeasure,
  type GlobalIndicatorListItem,
  type GlobalIndicatorMapping,
  type FrameworkIndicatorMapping,
  type FrameworkMappedNode,
  type IndicatorDetail,
  type IndicatorListItem,
  type IndicatorMeasure,
  type IndicatorMetadataDetail,
  type IndicatorSourceAssignment,
  type IndicatorVersion,
} from "../../api/indicators.api";
import { listFrameworkEditions, type FrameworkEdition } from "../../api/framework.api";
import { listMasterRecords, type MasterRecord } from "../../api/masters-reference.api";
import { getSelectedUnitCode, LOCALE_CHANGED_EVENT, UNIT_CHANGED_EVENT } from "../../api/session.api";
import { useSearchParams } from "react-router-dom";

type IndicatorStatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "INACTIVE";
type DetailTab = "details" | "mapping";
type MappingPanel = "" | "global" | "source" | "periodicity" | "sourceOfficer" | "uom" | "measure";
type MetadataNotes = Record<string, unknown>;
type IndicatorCreateForm = {
  national_indicator_code: string;
  indicator_number: string;
  name: string;
  description: string;
  status: string;
  color_value: string;
};

function textValue(value: unknown): string {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function compactDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getIndicatorName(indicator: IndicatorListItem | IndicatorDetail) {
  return indicator.name || indicator.national_indicator_code || "Indicator";
}

function getIndicatorCode(indicator: IndicatorListItem | IndicatorDetail) {
  return indicator.national_indicator_code || indicator.indicator_number || "";
}

function normalizeStatus(indicator: IndicatorListItem) {
  if (indicator.is_active === false) return "INACTIVE";
  return (indicator.status || "ACTIVE").toUpperCase();
}

function overviewOf(detail?: IndicatorDetail | null): IndicatorListItem {
  return detail?.overview ?? detail ?? ({} as IndicatorListItem);
}

function sourcesOf(detail?: IndicatorDetail | null): IndicatorSourceAssignment[] {
  return detail?.sources ?? detail?.source_assignments ?? [];
}

function firstSource(detail?: IndicatorDetail | null) {
  return sourcesOf(detail)[0];
}

function firstMeasure(detail?: IndicatorDetail | null): IndicatorMeasure | undefined {
  return detail?.measures?.[0];
}

function firstVersion(detail?: IndicatorDetail | null): IndicatorVersion | undefined {
  return detail?.versions?.find((version) => version.is_current) ?? detail?.versions?.[0];
}

function firstMetadata(detail?: IndicatorDetail | null): IndicatorMetadataDetail | undefined {
  return detail?.metadata?.[0];
}

function firstGlobalMapping(detail?: IndicatorDetail | null): GlobalIndicatorMapping | undefined {
  return detail?.global_indicator_mappings?.[0];
}

function firstFrameworkMapping(detail?: IndicatorDetail | null): FrameworkIndicatorMapping | undefined {
  return detail?.framework_mappings?.find((mapping) => mapping.mapping_type === "PRIMARY") ?? detail?.framework_mappings?.[0];
}

function parseMetadataNotes(notes?: string | null): MetadataNotes {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function noteValue(notes: MetadataNotes, keys: string[]) {
  for (const key of keys) {
    if (notes[key] !== undefined && notes[key] !== null && notes[key] !== "") return notes[key];
  }
  return undefined;
}

function optionLabel(record: MasterRecord, codeKey: string, nameKeys: string[]) {
  const code = textValue(record[codeKey]);
  const name = nameKeys.map((key) => record[key]).find(Boolean);
  return `${textValue(name)} (${code})`;
}

function officerOptionLabel(record: MasterRecord) {
  const name = textValue(record.display_name ?? record.name);
  const email = textValue(record.email);
  return email === "-" ? name : `${name} - ${email}`;
}

function dedupeSourceAssignments(records: IndicatorSourceAssignment[]) {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = [
      record.source_organization_code ?? "",
      record.assignment_role ?? "",
      record.periodicity_code ?? "",
      record.is_active === false ? "inactive" : "active",
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function IndicatorLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [indicators, setIndicators] = useState<IndicatorListItem[]>([]);
  const [detailCache, setDetailCache] = useState<Record<string, IndicatorDetail>>({});
  const [selectedCode, setSelectedCode] = useState("");
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [periodicityFilter, setPeriodicityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<IndicatorStatusFilter>("ALL");
  const [uomFilter, setUomFilter] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [globalInfo, setGlobalInfo] = useState<GlobalIndicatorMapping | null>(null);
  const [organizations, setOrganizations] = useState<MasterRecord[]>([]);
  const [periodicities, setPeriodicities] = useState<MasterRecord[]>([]);
  const [uoms, setUoms] = useState<MasterRecord[]>([]);
  const [globalIndicators, setGlobalIndicators] = useState<GlobalIndicatorListItem[]>([]);
  const [officers, setOfficers] = useState<MasterRecord[]>([]);
  const [activeFramework, setActiveFramework] = useState<FrameworkEdition | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIndicatorCode, setEditingIndicatorCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [createForm, setCreateForm] = useState<IndicatorCreateForm>({
    national_indicator_code: "",
    indicator_number: "",
    name: "",
    description: "",
    status: "DRAFT",
    color_value: "#e91d3d",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const indicatorCodeFromQuery = searchParams.get("indicator") ?? "";

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
    if (indicatorCodeFromQuery) {
      void loadIndicatorDetail(indicatorCodeFromQuery, true, false, false);
    }
  }, [indicatorCodeFromQuery]);

  const selectedDetail = selectedCode ? detailCache[selectedCode] : null;

  const filteredIndicators = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedSource = sourceFilter.trim().toLowerCase();
    return indicators.filter((indicator) => {
      const code = getIndicatorCode(indicator);
      const detail = detailCache[code];
      const row = buildIndicatorRow(indicator, detail);
      const matchesStatus = statusFilter === "ALL" || normalizeStatus(indicator) === statusFilter;
      const matchesSource =
        !normalizedSource ||
        row.sourceCode === sourceFilter ||
        row.departmentCode === sourceFilter ||
        [row.ministry, row.department, row.sourceCode, row.departmentCode].join(" ").toLowerCase().includes(normalizedSource);
      const matchesPeriodicity = !periodicityFilter || row.periodicityCode === periodicityFilter;
      const matchesUom = !uomFilter || row.uomCode === uomFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          row.indicatorCode,
          row.indicatorNumber,
          row.indicatorName,
          row.globalCode,
          row.globalNumber,
          row.ministry,
          row.department,
          row.uom,
          row.periodicity,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesSource && matchesPeriodicity && matchesUom && matchesQuery;
    });
  }, [detailCache, indicators, periodicityFilter, query, sourceFilter, statusFilter, uomFilter]);

  const activeCount = indicators.filter((indicator) => normalizeStatus(indicator) === "ACTIVE").length;
  const mappedGlobalCount = indicators.filter((indicator) => Boolean(indicator.global_indicator_code)).length;
  const sourcedCount = indicators.filter((indicator) => Boolean(indicator.source_organization_code)).length;

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [indicatorResponse, organizationResponse, periodicityResponse, uomResponse, globalResponse, officerResponse] = await Promise.all([
        listIndicators(),
        listMasterRecords({ endpoint: "/masters/organizations" }).catch(() => ({ data: [], count: 0, locale: "en-IN" })),
        listMasterRecords({ endpoint: "/masters/periodicities" }).catch(() => ({ data: [], count: 0, locale: "en-IN" })),
        listMasterRecords({ endpoint: "/masters/uom" }).catch(() => ({ data: [], count: 0, locale: "en-IN" })),
        listGlobalIndicators().catch(() => ({ data: [], count: 0, locale: "en-IN" })),
        listMasterRecords({ endpoint: "/masters/officers" }).catch(() => ({ data: [], count: 0, locale: "en-IN" })),
      ]);
      const frameworkResponse = await listFrameworkEditions(true).catch(() => ({ data: [], count: 0, locale: "en-IN" }));

      setIndicators(indicatorResponse.data);
      setOrganizations(organizationResponse.data);
      setPeriodicities(periodicityResponse.data);
      setUoms(uomResponse.data);
      setGlobalIndicators(globalResponse.data);
      setOfficers(officerResponse.data);
      setActiveFramework(
        frameworkResponse.data.find((edition) => edition.is_active && edition.status !== "INACTIVE") ??
          frameworkResponse.data.find((edition) => edition.is_active) ??
          frameworkResponse.data[0] ??
          null,
      );

      setSelectedCode("");
      setDetailCache({});
    } catch {
      setIndicators([]);
      setDetailCache({});
      setSelectedCode("");
      setError("Indicator records could not be loaded. Please refresh or try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadIndicatorDetail(indicatorCode: string, switchTab = true, force = false, updateUrl = true) {
    setSelectedCode(indicatorCode);
    if (updateUrl && indicatorCodeFromQuery !== indicatorCode) {
      setSearchParams({ indicator: indicatorCode });
    }
    if (switchTab) setActiveTab("details");
    if (detailCache[indicatorCode] && !force) return;
    setIsDetailLoading(true);
    try {
      const response = await getIndicator(indicatorCode);
      setDetailCache((current) => ({ ...current, [indicatorCode]: response.data }));
    } catch {
      setError("Indicator details could not be loaded. Please select another indicator or refresh.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleCreateIndicator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeFramework?.framework_code || !activeFramework.edition_code) {
      setError("Create indicator requires an active framework edition for the selected unit.");
      return;
    }
    if (!createForm.name.trim()) {
      setError("Indicator name is required.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        framework_code: activeFramework.framework_code,
        edition_code: activeFramework.edition_code,
        owning_unit_code: getSelectedUnitCode(),
        national_indicator_code: createForm.national_indicator_code.trim() || undefined,
        indicator_number: createForm.indicator_number.trim() || undefined,
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        status: createForm.status,
        is_active: createForm.status !== "INACTIVE",
        color_value: createForm.color_value.trim() || undefined,
        color_method: createForm.color_value.trim() ? "HEX" : undefined,
      };
      if (editingIndicatorCode) {
        await updateIndicator(editingIndicatorCode, payload);
      } else {
        await createIndicator(payload);
      }
      setIsCreateOpen(false);
      setEditingIndicatorCode("");
      setCreateForm({
        national_indicator_code: "",
        indicator_number: "",
        name: "",
        description: "",
        status: "DRAFT",
        color_value: "#e91d3d",
      });
      await loadPage();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Indicator could not be created. Please verify the details.");
    } finally {
      setIsSaving(false);
    }
  }

  function openCreateDrawer() {
    setEditingIndicatorCode("");
    setCreateForm({
      national_indicator_code: "",
      indicator_number: "",
      name: "",
      description: "",
      status: "DRAFT",
      color_value: "#e91d3d",
    });
    setIsCreateOpen(true);
  }

  function openEditDrawer(detail: IndicatorDetail) {
    const overview = overviewOf(detail);
    setEditingIndicatorCode(overview.national_indicator_code ?? "");
    setCreateForm({
      national_indicator_code: overview.national_indicator_code ?? "",
      indicator_number: overview.indicator_number ?? "",
      name: getIndicatorName(overview),
      description: overview.description ?? "",
      status: overview.status ?? "DRAFT",
      color_value: overview.color_value ?? "#e91d3d",
    });
    setIsCreateOpen(true);
  }

  async function handleGlobalClick(indicator: IndicatorListItem) {
    const code = getIndicatorCode(indicator);
    const mapping = firstGlobalMapping(detailCache[code]);
    if (mapping) {
      setGlobalInfo(mapping);
      return;
    }
    try {
      const response = await getIndicator(code);
      setDetailCache((current) => ({ ...current, [code]: response.data }));
      const nextMapping = firstGlobalMapping(response.data);
      if (nextMapping) setGlobalInfo(nextMapping);
    } catch {
      setError("Global indicator information could not be loaded for this row.");
    }
  }

  return (
    <div className="workflow-page indicator-library-page">
      {selectedCode && isDetailLoading && !selectedDetail ? (
        <div className="indicator-detail-loading-card">
          <div className="loader-ring" />
          <strong>Loading indicator details...</strong>
          <span>Please wait while source, measures, metadata, and mappings are loaded.</span>
        </div>
      ) : selectedDetail ? (
        <IndicatorDetailPage
          detail={selectedDetail}
          organizations={organizations}
          periodicities={periodicities}
          uoms={uoms}
          globalIndicators={globalIndicators}
          officers={officers}
          activeFramework={activeFramework}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRefresh={() => loadIndicatorDetail(getIndicatorCode(overviewOf(selectedDetail)), false, true)}
          onEdit={() => openEditDrawer(selectedDetail)}
          onBack={() => {
            setSelectedCode("");
            setSearchParams(new URLSearchParams(), { replace: true });
            setActiveTab("details");
          }}
        />
      ) : (
        <>
      <section className="page-heading-row compact">
        <div>
          <div className="breadcrumb">Home / Indicator Management / Indicator Library</div>
          <h2>Indicator Library</h2>
          <p>Browse governed national indicators with source, measure, metadata, version, and mapping context.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button compact" type="button" onClick={() => void loadPage()}>
            <RefreshCw size={13} />
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={openCreateDrawer}>
            <Edit3 size={14} />
            New Indicator
          </button>
        </div>
      </section>

      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four">
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{indicators.length}</div>
          <div className="metric-label">Indicators</div>
          <div className="metric-sublabel">{getSelectedUnitCode()}</div>
        </article>
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{activeCount}</div>
          <div className="metric-label">Active</div>
          <div className="metric-sublabel">available</div>
        </article>
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{mappedGlobalCount}</div>
          <div className="metric-label">Global mapped</div>
          <div className="metric-sublabel">loaded rows</div>
        </article>
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{sourcedCount}</div>
          <div className="metric-label">Source assigned</div>
          <div className="metric-sublabel">loaded rows</div>
        </article>
      </section>

      <section className="toolbar-panel indicator-toolbar-panel wide">
        <label className="input-shell">
          <Search size={14} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search indicator code, name, global code, ministry, department, UOM, or periodicity"
          />
        </label>
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
          <option value="">All ministries/departments</option>
            {organizations.map((record) => (
              <option value={String(record.organization_code)} key={String(record.organization_code)}>
                {optionLabel(record, "organization_code", ["name", "organization_name", "display_name"])}
              </option>
            ))}
        </select>
        <select value={periodicityFilter} onChange={(event) => setPeriodicityFilter(event.target.value)}>
          <option value="">All periodicities</option>
          {periodicities.map((record) => (
            <option value={String(record.periodicity_code)} key={String(record.periodicity_code)}>
              {textValue(record.name ?? record.periodicity_code)}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as IndicatorStatusFilter)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select value={uomFilter} onChange={(event) => setUomFilter(event.target.value)}>
          <option value="">All UOM</option>
          {uoms.map((record) => (
            <option value={String(record.uom_code)} key={String(record.uom_code)}>
              {textValue(record.name ?? record.uom_code)}
            </option>
          ))}
        </select>
      </section>

      <section className="workflow-card indicator-full-table-card">
        <div className="table-wrap indicator-table-wrap full">
          <table className="data-table">
            <thead>
              <tr>
                <th>Indicator Code</th>
                <th>Global Indicator Number/Code</th>
                <th>Indicator Name</th>
                <th>Data Source Ministry</th>
                <th>Department</th>
                <th>Unit of Measurement</th>
                <th>Periodicity</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>Loading indicators...</td>
                </tr>
              ) : filteredIndicators.length === 0 ? (
                <tr>
                  <td colSpan={8}>No indicators found.</td>
                </tr>
              ) : (
                filteredIndicators.map((indicator) => {
                  const code = getIndicatorCode(indicator);
                  const row = buildIndicatorRow(indicator, detailCache[code], organizations);
                  return (
                    <tr
                      className={selectedCode === code ? "selected-row clickable-row" : "clickable-row"}
                      key={code}
                      onClick={() => void loadIndicatorDetail(code)}
                    >
                      <td>
                        <span className="code-text" title={row.indicatorCode}>
                          {row.indicatorCode}
                        </span>
                        <span className="muted-code" title={row.indicatorNumber}>
                          {row.indicatorNumber}
                        </span>
                      </td>
                      <td>
                        {row.globalCode || row.globalNumber ? (
                          <button
                            className="inline-link-button"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleGlobalClick(indicator);
                            }}
                            title={row.globalName || row.globalCode}
                          >
                            {row.globalNumber || row.globalCode}
                            <ExternalLink size={11} />
                          </button>
                        ) : (
                          <span className="muted-code">Pending mapping</span>
                        )}
                      </td>
                      <td>
                        <span className="cell-text" title={row.indicatorName}>
                          {row.indicatorName}
                        </span>
                      </td>
                      <td>
                        <span className="cell-text" title={row.ministry}>
                          {row.ministry}
                        </span>
                      </td>
                      <td>
                        <span className="cell-text" title={row.department}>
                          {row.department}
                        </span>
                      </td>
                      <td>{row.uom}</td>
                      <td>{row.periodicity}</td>
                      <td>{row.lastUpdated}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      {isDetailLoading && <div className="detail-empty indicator-page-loading">Loading indicator details...</div>}
        </>
      )}

      {globalInfo && (
        <div className="global-info-overlay" role="dialog" aria-modal="true">
          <div className="global-info-card">
            <div className="detail-panel-header">
              <div>
                <span>Global Indicator Information</span>
                <h3>{textValue(globalInfo.global_indicator_number ?? globalInfo.global_indicator_code)}</h3>
              </div>
              <button className="icon-action" type="button" onClick={() => setGlobalInfo(null)}>
                x
              </button>
            </div>
            <div className="detail-field-grid">
              <DetailField label="Global indicator code" value={globalInfo.global_indicator_code} />
              <DetailField label="Global indicator number" value={globalInfo.global_indicator_number} />
              <DetailField label="Global indicator name" value={globalInfo.global_indicator_name} />
              <DetailField label="Mapping type" value={globalInfo.mapping_type} />
              <DetailField label="Tier code" value={globalInfo.tier_code} />
              <DetailField label="Status" value={globalInfo.status} />
            </div>
          </div>
        </div>
      )}
      {isCreateOpen && (
        <div className="drawer-backdrop">
          <aside className="side-drawer">
            <div className="drawer-header">
              <div>
                <span>Create</span>
                <h3>{editingIndicatorCode ? "Edit Indicator" : "Indicator"}</h3>
              </div>
              <button className="icon-action" type="button" onClick={() => setIsCreateOpen(false)}>
                x
              </button>
            </div>
            <form className="drawer-form" onSubmit={(event) => void handleCreateIndicator(event)}>
              <div className="form-grid two">
                <label className="form-field">
                  <span>Framework</span>
                  <input value={activeFramework?.framework_code ?? ""} readOnly />
                </label>
                <label className="form-field">
                  <span>Edition</span>
                  <input value={activeFramework?.edition_code ?? ""} readOnly />
                </label>
              </div>
              <label className="form-field">
                <span>Indicator code</span>
                <input
                  value={createForm.national_indicator_code}
                  onChange={(event) => setCreateForm((current) => ({ ...current, national_indicator_code: event.target.value.toUpperCase().replace(/\s+/g, "_") }))}
                  placeholder="Auto if blank"
                  readOnly={Boolean(editingIndicatorCode)}
                />
              </label>
              <label className="form-field">
                <span>Indicator number</span>
                <input
                  value={createForm.indicator_number}
                  onChange={(event) => setCreateForm((current) => ({ ...current, indicator_number: event.target.value }))}
                  placeholder="Example: 1.2.1"
                />
              </label>
              <label className="form-field">
                <span>Indicator name *</span>
                <input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label className="form-field">
                <span>Description</span>
                <textarea
                  value={createForm.description}
                  onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                />
              </label>
              <div className="form-grid two">
                <label className="form-field">
                  <span>Status</span>
                  <select value={createForm.status} onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value }))}>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Color</span>
                  <input
                    type="color"
                    value={createForm.color_value}
                    onChange={(event) => setCreateForm((current) => ({ ...current, color_value: event.target.value }))}
                  />
                </label>
              </div>
              <div className="drawer-footer">
                <button className="secondary-button" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button className="primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingIndicatorCode ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function buildIndicatorRow(indicator: IndicatorListItem, detail?: IndicatorDetail, organizations: MasterRecord[] = []) {
  const overview = overviewOf(detail);
  const source = firstSource(detail);
  const resolvedSource = resolveSourceHierarchy(source, organizations);
  const measure = firstMeasure(detail);
  const version = firstVersion(detail);
  const metadata = firstMetadata(detail);
  const globalMapping = firstGlobalMapping(detail);

  return {
    indicatorCode: indicator.national_indicator_code || overview.national_indicator_code || "-",
    indicatorNumber: indicator.indicator_number || overview.indicator_number || "-",
    indicatorName: indicator.name || overview.name || "-",
    globalCode: indicator.global_indicator_code || globalMapping?.global_indicator_code || "",
    globalNumber: indicator.global_indicator_number || globalMapping?.global_indicator_number || "",
    globalName: indicator.global_indicator_name || globalMapping?.global_indicator_name || "",
    ministry:
      indicator.source_organization_name ||
      resolvedSource.ministry ||
      source?.source_organization_code ||
      "-",
    department:
      indicator.department_organization_name ||
      source?.department_organization_name ||
      resolvedSource.department ||
      "-",
    sourceCode: indicator.source_organization_code || source?.source_organization_code || "",
    departmentCode: indicator.department_organization_code || "",
    uom:
      indicator.unit_of_measure_name ||
      indicator.uom_name ||
      indicator.unit_of_measure_code ||
      indicator.uom_code ||
      measure?.unit_code ||
      version?.unit_of_measure_code ||
      "-",
    uomCode: indicator.unit_of_measure_code || indicator.uom_code || measure?.unit_code || version?.unit_of_measure_code || "",
    periodicity: indicator.periodicity_name || indicator.periodicity_code || source?.periodicity_code || "-",
    periodicityCode: indicator.periodicity_code || source?.periodicity_code || "",
    lastUpdated: indicator.last_updated || indicator.updated_at || metadata?.latest_data_availability || "-",
  };
}

function findOrganization(organizations: MasterRecord[], code?: string) {
  if (!code) return undefined;
  return organizations.find((record) => String(record.organization_code ?? "").toUpperCase() === code.toUpperCase());
}

function organizationName(record?: MasterRecord) {
  const value = record?.name ?? record?.organization_name ?? record?.display_name ?? record?.organization_code;
  return value === undefined || value === null || value === "" ? undefined : String(value);
}

function resolveSourceHierarchy(source: IndicatorSourceAssignment | undefined, organizations: MasterRecord[]) {
  const sourceOrg = findOrganization(organizations, source?.source_organization_code);
  const explicitDepartment = findOrganization(organizations, source?.department_organization_code);
  const parentOrg = findOrganization(organizations, String(sourceOrg?.parent_organization_code ?? ""));
  const sourceType = String(sourceOrg?.organization_type ?? "").toUpperCase();
  const parentName = organizationName(parentOrg);
  const sourceName = source?.source_organization_name ?? organizationName(sourceOrg) ?? source?.source_organization_code;
  const explicitDepartmentName = source?.department_organization_name ?? organizationName(explicitDepartment);
  const sourceIsChild = Boolean(parentName && parentOrg?.organization_code !== sourceOrg?.organization_code);
  const sourceIsMinistry = sourceType.includes("MINISTRY") || !sourceIsChild;

  return {
    ministry: sourceIsChild ? parentName : sourceName,
    department: explicitDepartmentName ?? (sourceIsChild && !sourceIsMinistry ? sourceName : undefined),
  };
}

function nodeLabel(node?: FrameworkMappedNode) {
  if (!node) return "-";
  const number = node.node_number ? `${node.node_number} - ` : "";
  return `${number}${node.name ?? node.short_name ?? node.node_code ?? "-"}`;
}

function IndicatorDetailPage({
  detail,
  organizations,
  periodicities,
  uoms,
  globalIndicators,
  officers,
  activeFramework,
  activeTab,
  onTabChange,
  onRefresh,
  onEdit,
  onBack,
}: {
  detail: IndicatorDetail;
  organizations: MasterRecord[];
  periodicities: MasterRecord[];
  uoms: MasterRecord[];
  globalIndicators: GlobalIndicatorListItem[];
  officers: MasterRecord[];
  activeFramework: FrameworkEdition | null;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onRefresh: () => Promise<void>;
  onEdit: () => void;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [mappingForm, setMappingForm] = useState({
    node_code: "",
    mapping_type: "PRIMARY",
    global_indicator_code: "",
    global_mapping_type: "DIRECT",
    source_organization_code: "",
    officer_code: "",
    officer_label: "",
    recipient_type: "TO",
    contact_role: "NODAL_OFFICER",
    periodicity_code: "",
    assignment_role: "PRIMARY_SOURCE",
    measure_code: "",
    measure_name: "",
    measure_unit_code: "",
    value_type: "NUMERIC",
    aggregation_type: "NONE",
  });
  const [mappingPanel, setMappingPanel] = useState<MappingPanel>("");
  const [isMappingSaving, setIsMappingSaving] = useState("");
  const [mappingNotice, setMappingNotice] = useState("");
  const overview = overviewOf(detail);
  const source = firstSource(detail);
  const resolvedSource = resolveSourceHierarchy(source, organizations);
  const sourceMinistry = resolvedSource.ministry ?? source?.source_organization_code;
  const sourceDepartment = resolvedSource.department;
  const measure = firstMeasure(detail);
  const version = firstVersion(detail);
  const metadata = firstMetadata(detail);
  const globalMapping = firstGlobalMapping(detail);
  const frameworkMapping = firstFrameworkMapping(detail);
  const parentNode = frameworkMapping?.parents?.[0];
  const mappedNode = frameworkMapping?.mapped_node;
  const notes = parseMetadataNotes(metadata?.notes);
  const indicatorNumber = textValue(overview.indicator_number);
  const color = overview.color_value || "#e91d3d";
  const indicatorCode = getIndicatorCode(overview);
  const currentVersionCode = version?.version_code || overview.current_version_code || "";
  const frameworkCode = overview.framework_code || activeFramework?.framework_code || "";
  const editionCode = overview.edition_code || activeFramework?.edition_code || "";
  const metadataRows: Array<[string, unknown]> = [
    [parentNode?.level_name ?? "Parent Level", nodeLabel(parentNode)],
    [mappedNode?.level_name ?? "Mapped Level", nodeLabel(mappedNode)],
    ["Indicator", `${indicatorNumber}: ${getIndicatorName(overview)}`],
    ["Data Source Ministry", sourceMinistry],
    ["Department / Division", sourceDepartment],
    ["Description of Indicator", overview.description ?? version?.description],
    [
      "Computation",
      metadata?.computation_description ??
        noteValue(notes, ["computation", "formula", "calculation_method", "computation_formula"]),
    ],
    ["Unit of Measurement", measure?.unit_code ?? version?.unit_of_measure_code],
    ["Periodicity", source?.periodicity_code ?? overview.periodicity_code],
    ["Level of Disaggregation", noteValue(notes, ["level_of_disaggregation", "disaggregation_level"])],
    ["Type of Disaggregation", noteValue(notes, ["type_of_disaggregation", "disaggregation_type"])],
    ["Mapping with Global Indicator", globalMapping?.global_indicator_number ?? globalMapping?.global_indicator_code],
    ["References", noteValue(notes, ["references", "reference", "source_references"]) ?? metadata?.source_reference_code],
  ];

  useEffect(() => {
    setMappingForm({
      node_code: mappedNode?.node_code ?? "",
      mapping_type: frameworkMapping?.mapping_type ?? "PRIMARY",
      global_indicator_code: globalMapping?.global_indicator_code ?? "",
      global_mapping_type: globalMapping?.mapping_type ?? "DIRECT",
      source_organization_code: source?.source_organization_code ?? "",
      officer_code: source?.officer_code ?? "",
      officer_label: source?.officer_display_name ?? "",
      recipient_type: "TO",
      contact_role: "NODAL_OFFICER",
      periodicity_code: source?.periodicity_code ?? "",
      assignment_role: source?.assignment_role ?? "PRIMARY_SOURCE",
      measure_code: measure?.measure_code ?? "",
      measure_name: textValue(measure?.name === "-" ? "" : measure?.name ?? measure?.measure_code ?? ""),
      measure_unit_code: measure?.unit_code ?? version?.unit_of_measure_code ?? "",
      value_type: measure?.value_type ?? "NUMERIC",
      aggregation_type: measure?.aggregation_type ?? "NONE",
    });
    setMappingNotice("");
    setMappingPanel("");
  }, [detail]);

  const sourceAssignments = useMemo(() => dedupeSourceAssignments(detail.sources ?? detail.source_assignments ?? []), [detail.sources, detail.source_assignments]);
  const sourceOfficers = useMemo(() => detail.source_officers ?? [], [detail.source_officers]);
  const selectedGlobalIndicator = globalIndicators.find((record) => record.global_indicator_code === mappingForm.global_indicator_code);
  const selectedSourceOrganization = organizations.find((record) => String(record.organization_code) === mappingForm.source_organization_code);
  const selectedPeriodicity = !mappingForm.periodicity_code || periodicities.some((record) => String(record.periodicity_code) === mappingForm.periodicity_code);
  const selectedMeasure = (detail.measures ?? []).find((item) => item.measure_code === mappingForm.measure_code);
  const selectedUom = !mappingForm.measure_unit_code || uoms.some((record) => String(record.uom_code) === mappingForm.measure_unit_code);
  const selectedOfficer = officers.find((record) => officerOptionLabel(record) === mappingForm.officer_label);
  const canSaveGlobalMapping = Boolean(frameworkCode && editionCode && indicatorCode && selectedGlobalIndicator && !isMappingSaving);
  const canSaveSourceAssignment = Boolean(frameworkCode && editionCode && indicatorCode && selectedSourceOrganization && selectedPeriodicity && !isMappingSaving);
  const canSaveSourceOfficer = Boolean(indicatorCode && selectedSourceOrganization && selectedOfficer && !isMappingSaving);
  const canSaveMeasure = Boolean(currentVersionCode && selectedMeasure && selectedUom && !isMappingSaving);

  async function runMappingSave(action: string, work: () => Promise<unknown>) {
    setIsMappingSaving(action);
    setMappingNotice("");
    try {
      await work();
      await onRefresh();
      setMappingNotice("Mapping changes saved.");
    } catch (error) {
      setMappingNotice(error instanceof Error ? error.message : "Mapping changes could not be saved.");
    } finally {
      setIsMappingSaving("");
    }
  }

  return (
    <div className="indicator-detail-page">
      <div className="breadcrumb">Home / Indicator Management / Indicators / {indicatorNumber}</div>
      <h2>Indicator {indicatorNumber}</h2>

      <section className="indicator-detail-hero">
        <div className="indicator-hero-actions">
          <button className="secondary-button compact" type="button" onClick={onEdit}>
            <Edit3 size={12} />
            Edit
          </button>
          <button className="secondary-button compact indicator-back-button" type="button" onClick={onBack}>
            Back to Indicators
          </button>
        </div>
        <div className="indicator-title-row">
          <div className="indicator-number-tile" style={{ color, borderColor: `${color}55`, background: `${color}12` }}>
            {indicatorNumber}
          </div>
          <div>
            <span>Official Indicator Metadata</span>
            <h3>{getIndicatorName(overview)}</h3>
          </div>
        </div>
      </section>

      <section className="indicator-summary-grid">
        <DetailMetric label="Data Source Ministry" value={sourceMinistry} />
        <DetailMetric label="Department / Division" value={sourceDepartment} />
        <DetailMetric label="Unit" value={measure?.unit_code ?? version?.unit_of_measure_code} />
        <DetailMetric label="Periodicity" value={source?.periodicity_code ?? overview.periodicity_code} />
      </section>

      <div className={`indicator-detail-layout ${activeTab === "mapping" ? "mapping-active" : ""}`}>
        <section className="indicator-official-metadata">
          <header>
            <div>
              <h3>Official Indicator Metadata</h3>
              <p>Metadata definition used for indicator configuration and reporting reference.</p>
            </div>
            <div className="indicator-main-tabs inline">
              <button className={activeTab === "details" ? "active" : ""} type="button" onClick={() => onTabChange("details")}>
                Details
              </button>
              <button className={activeTab === "mapping" ? "active" : ""} type="button" onClick={() => onTabChange("mapping")}>
                Mapping
              </button>
            </div>
          </header>

          {activeTab === "details" ? (
            <div className="official-metadata-table">
              {metadataRows.map(([label, value], index) => (
                <div className={index < 2 ? "highlight-row" : ""} key={label}>
                  <span>{label}</span>
                  <strong>{textValue(value)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="indicator-mapping-detail">
              {mappingNotice && <div className={mappingNotice.includes("could not") || mappingNotice.includes("failed") ? "notice error compact" : "notice success compact"}>{mappingNotice}</div>}
              <InfoSection
                title="Global Indicator Mapping"
                id="global-map"
                tone="global"
                action={
                  <button className="secondary-button compact" type="button" onClick={() => setMappingPanel("global")}>
                    Map Global Indicator
                  </button>
                }
              >
                {globalMapping ? (
                  <MappingListRow
                    title={`${textValue(globalMapping.global_indicator_number ?? globalMapping.global_indicator_code)} - ${textValue(globalMapping.global_indicator_name)}`}
                    meta={[globalMapping.mapping_type, globalMapping.status, globalMapping.is_active === false ? "Inactive" : "Active"]}
                    onUnmap={() =>
                      void runMappingSave("global-off", () =>
                        saveGlobalIndicatorMapping({
                          framework_code: frameworkCode,
                          edition_code: editionCode,
                          national_indicator_code: indicatorCode,
                          global_indicator_code: globalMapping.global_indicator_code ?? "",
                          mapping_type: globalMapping.mapping_type ?? "DIRECT",
                          is_active: false,
                        }),
                      )
                    }
                    disabled={!frameworkCode || !editionCode || !indicatorCode || !globalMapping.global_indicator_code || Boolean(isMappingSaving)}
                  />
                ) : (
                  <div className="detail-empty">No global indicator mapped.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Source Assignment"
                id="source-map"
                tone="source"
                action={
                  <button className="secondary-button compact" type="button" onClick={() => setMappingPanel("source")}>
                    Map Source
                  </button>
                }
              >
                {sourceAssignments.length ? (
                  sourceAssignments.map((item) => (
                    <MappingListRow
                      key={`${item.source_organization_code}-${item.assignment_role}-${item.periodicity_code}`}
                      title={textValue(item.source_organization_name ?? item.source_organization_code)}
                      meta={[
                        item.assignment_role,
                        item.periodicity_name ?? item.periodicity_code,
                        item.is_active === false ? "Inactive" : "Active",
                      ]}
                      onUnmap={() =>
                        void runMappingSave("source-off", () =>
                          saveSourceAssignment({
                            framework_code: frameworkCode,
                            edition_code: editionCode,
                            national_indicator_code: indicatorCode,
                            source_organization_code: item.source_organization_code ?? "",
                            assignment_role: item.assignment_role ?? "PRIMARY_SOURCE",
                            is_active: false,
                          }),
                        )
                      }
                      disabled={!frameworkCode || !editionCode || !indicatorCode || !item.source_organization_code || Boolean(isMappingSaving)}
                    />
                  ))
                ) : (
                  <div className="detail-empty">No source assignment returned by API.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Periodicity"
                id="periodicity-map"
                tone="periodicity"
                action={
                  <button className="secondary-button compact" type="button" onClick={() => setMappingPanel("periodicity")}>
                    Map Periodicity
                  </button>
                }
              >
                {sourceAssignments.length ? (
                  sourceAssignments.map((item) => (
                    <MappingListRow
                      key={`${item.source_organization_code}-${item.assignment_role}-${item.periodicity_code}-periodicity`}
                      title={textValue(item.periodicity_name ?? item.periodicity_code)}
                      meta={[item.source_organization_name ?? item.source_organization_code, item.assignment_role, item.is_active === false ? "Inactive" : "Active"]}
                      onUnmap={() =>
                        void runMappingSave("periodicity-off", () =>
                          saveSourceAssignment({
                            framework_code: frameworkCode,
                            edition_code: editionCode,
                            national_indicator_code: indicatorCode,
                            source_organization_code: item.source_organization_code ?? "",
                            assignment_role: item.assignment_role ?? "PRIMARY_SOURCE",
                            periodicity_code: undefined,
                            is_active: true,
                          }),
                        )
                      }
                      disabled={
                        !frameworkCode ||
                        !editionCode ||
                        !indicatorCode ||
                        !item.source_organization_code ||
                        !item.periodicity_code ||
                        Boolean(isMappingSaving)
                      }
                    />
                  ))
                ) : (
                  <div className="detail-empty">Map a source assignment before assigning periodicity.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Source Officer Assignment"
                id="source-officer-map"
                tone="officer"
                action={
                  <button className="secondary-button compact" type="button" onClick={() => setMappingPanel("sourceOfficer")}>
                    Map Officer Recipient
                  </button>
                }
              >
                {sourceOfficers.length ? (
                  sourceOfficers.map((item) => (
                    <MappingListRow
                      key={`${item.source_organization_code}-${item.assignment_role}-${item.recipient_type}-${item.email_address}`}
                      title={textValue(item.officer_display_name ?? item.display_name)}
                      badge={item.recipient_type}
                      meta={[
                        item.source_organization_name,
                        item.assignment_role,
                        item.periodicity_name ?? item.periodicity_code,
                        item.contact_role,
                        item.email_address,
                      ]}
                      onUnmap={() =>
                        void runMappingSave("source-officer-off", () =>
                          saveSourceOfficerAssignment({
                            national_indicator_code: indicatorCode,
                            source_organization_code: item.source_organization_code ?? "",
                            assignment_role: item.assignment_role ?? "PRIMARY_SOURCE",
                            officer_code: item.officer_code ?? "",
                            recipient_type: item.recipient_type ?? "TO",
                            contact_role: item.contact_role ?? "NODAL_OFFICER",
                            is_active: false,
                          }),
                        )
                      }
                      disabled={!indicatorCode || !item.source_organization_code || !item.officer_code || Boolean(isMappingSaving)}
                    />
                  ))
                ) : (
                  <div className="detail-empty">No officer recipients mapped.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Unit of Measurement"
                id="uom-map"
                tone="uom"
                action={
                  <button className="secondary-button compact" type="button" onClick={() => setMappingPanel("uom")}>
                    Map UOM
                  </button>
                }
              >
                <DetailField label="Indicator version UOM" value={version?.unit_of_measure_code} />
                {measure?.measure_code ? (
                  <MappingListRow
                    title={textValue(measure.unit_code ?? version?.unit_of_measure_code)}
                    meta={[measure.measure_code, measure.name, measure.value_type]}
                    onUnmap={() =>
                      void runMappingSave("uom-off", () =>
                        updateIndicatorMeasure(currentVersionCode, measure.measure_code ?? "", {
                          measure_code: measure.measure_code,
                          name: measure.name || measure.measure_code || "Measure",
                          value_type: measure.value_type,
                          aggregation_type: measure.aggregation_type,
                          is_required: Boolean(measure.is_required ?? true),
                          is_active: true,
                        }),
                      )
                    }
                    disabled={!currentVersionCode || !measure.measure_code || Boolean(isMappingSaving)}
                  />
                ) : (
                  <div className="detail-empty">No measure UOM mapping returned by API.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Measures"
                id="measure-map"
                tone="measure"
                action={
                  <button className="secondary-button compact" type="button" onClick={() => setMappingPanel("measure")}>
                    Map Measure
                  </button>
                }
              >
                {(detail.measures ?? []).length ? (
                  (detail.measures ?? []).map((item) => (
                    <MappingListRow
                      key={item.measure_code}
                      title={textValue(item.name ?? item.measure_code)}
                      meta={[item.measure_code, item.value_type, item.unit_code, item.aggregation_type, item.is_active === false ? "Inactive" : "Active"]}
                      onUnmap={() =>
                        void runMappingSave("measure-off", () =>
                          updateIndicatorMeasure(currentVersionCode, item.measure_code ?? "", {
                            measure_code: item.measure_code,
                            name: item.name || item.measure_code || "Measure",
                            unit_code: item.unit_code,
                            value_type: item.value_type,
                            aggregation_type: item.aggregation_type,
                            is_required: Boolean(item.is_required ?? true),
                            is_active: false,
                          }),
                        )
                      }
                      disabled={!currentVersionCode || !item.measure_code || Boolean(isMappingSaving)}
                    />
                  ))
                ) : (
                  <div className="detail-empty">No measures returned by API.</div>
                )}
              </InfoSection>
              {mappingPanel && (
                <div className="drawer-overlay indicator-mapping-drawer-overlay">
                <aside className="form-drawer compact-form-drawer mapping-form-drawer">
                  <header>
                    <div>
                      <span>Indicator mapping</span>
                      <h4>
                        {mappingPanel === "global"
                          ? "Global Indicator"
                          : mappingPanel === "source"
                            ? "Source Assignment"
                            : mappingPanel === "periodicity"
                              ? "Periodicity"
                              : mappingPanel === "sourceOfficer"
                                ? "Source Officer Assignment"
                            : mappingPanel === "uom"
                              ? "Unit of Measurement"
                              : "Measure"}
                      </h4>
                    </div>
                    <button className="icon-action" type="button" onClick={() => setMappingPanel("")}>
                      x
                    </button>
                  </header>

                  {mappingPanel === "global" && (
                    <div className="mapping-drawer-body">
                      <datalist id="global-indicator-options">
                        {globalIndicators.map((record) => (
                          <option
                            key={record.global_indicator_code}
                            value={record.global_indicator_code}
                            label={`${record.indicator_number ?? record.global_indicator_code} - ${record.name ?? record.global_indicator_code}`}
                          />
                        ))}
                      </datalist>
                      <label>
                        <span>Global indicator *</span>
                        <input
                          list="global-indicator-options"
                          value={mappingForm.global_indicator_code}
                          onChange={(event) => setMappingForm((current) => ({ ...current, global_indicator_code: event.target.value }))}
                          placeholder="Search global indicator"
                        />
                        {!selectedGlobalIndicator && mappingForm.global_indicator_code && <em>Select an exact global indicator from the list.</em>}
                      </label>
                      <label>
                        <span>Mapping type</span>
                        <select
                          value={mappingForm.global_mapping_type}
                          onChange={(event) => setMappingForm((current) => ({ ...current, global_mapping_type: event.target.value }))}
                        >
                          <option value="DIRECT">DIRECT</option>
                          <option value="PROXY">PROXY</option>
                          <option value="PARTIAL">PARTIAL</option>
                        </select>
                      </label>
                      <div className="mapping-action-row always-visible">
                        <button
                          className="primary-button compact"
                          type="button"
                          disabled={!canSaveGlobalMapping}
                          onClick={() =>
                            void runMappingSave("global", () =>
                              saveGlobalIndicatorMapping({
                                framework_code: frameworkCode,
                                edition_code: editionCode,
                                national_indicator_code: indicatorCode,
                                global_indicator_code: mappingForm.global_indicator_code,
                                mapping_type: mappingForm.global_mapping_type,
                                is_active: true,
                              }),
                            )
                          }
                        >
                          {isMappingSaving === "global" ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="ghost-button compact"
                          type="button"
                          disabled={!canSaveGlobalMapping}
                          onClick={() =>
                            void runMappingSave("global-off", () =>
                              saveGlobalIndicatorMapping({
                                framework_code: frameworkCode,
                                edition_code: editionCode,
                                national_indicator_code: indicatorCode,
                                global_indicator_code: mappingForm.global_indicator_code,
                                mapping_type: mappingForm.global_mapping_type,
                                is_active: false,
                              }),
                            )
                          }
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>
                  )}

                  {mappingPanel === "source" && (
                    <div className="mapping-drawer-body">
                      <datalist id="source-organization-options">
                        {organizations.map((record) => (
                          <option
                            value={String(record.organization_code)}
                            key={String(record.organization_code)}
                            label={optionLabel(record, "organization_code", ["name", "organization_name"])}
                          />
                        ))}
                      </datalist>
                      <label>
                        <span>Source organization *</span>
                        <input
                          list="source-organization-options"
                          value={mappingForm.source_organization_code}
                          onChange={(event) => setMappingForm((current) => ({ ...current, source_organization_code: event.target.value }))}
                          placeholder="Search source/ministry/department"
                        />
                        {!selectedSourceOrganization && mappingForm.source_organization_code && <em>Select an exact source from the list.</em>}
                      </label>
                      <label>
                        <span>Periodicity</span>
                        <input
                          list="periodicity-options"
                          value={mappingForm.periodicity_code}
                          onChange={(event) => setMappingForm((current) => ({ ...current, periodicity_code: event.target.value }))}
                          placeholder="Search periodicity"
                        />
                        {!selectedPeriodicity && mappingForm.periodicity_code && <em>Select an exact periodicity from the list.</em>}
                      </label>
                      <datalist id="periodicity-options">
                        {periodicities.map((record) => (
                          <option
                            value={String(record.periodicity_code)}
                            key={String(record.periodicity_code)}
                            label={optionLabel(record, "periodicity_code", ["name", "periodicity_name"])}
                          />
                        ))}
                      </datalist>
                      <label>
                        <span>Assignment role</span>
                        <select
                          value={mappingForm.assignment_role}
                          onChange={(event) => setMappingForm((current) => ({ ...current, assignment_role: event.target.value }))}
                        >
                          <option value="PRIMARY_SOURCE">PRIMARY_SOURCE</option>
                          <option value="SECONDARY_SOURCE">SECONDARY_SOURCE</option>
                          <option value="REVIEW_SOURCE">REVIEW_SOURCE</option>
                        </select>
                      </label>
                      <div className="mapping-action-row always-visible">
                        <button
                          className="primary-button compact"
                          type="button"
                          disabled={!canSaveSourceAssignment}
                          onClick={() =>
                            void runMappingSave("source", () =>
                              saveSourceAssignment({
                                framework_code: frameworkCode,
                                edition_code: editionCode,
                                national_indicator_code: indicatorCode,
                                source_organization_code: mappingForm.source_organization_code,
                                periodicity_code: mappingForm.periodicity_code || undefined,
                                assignment_role: mappingForm.assignment_role,
                                is_active: true,
                              }),
                            )
                          }
                        >
                          {isMappingSaving === "source" ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  )}

                  {mappingPanel === "periodicity" && (
                    <div className="mapping-drawer-body">
                      <div className="drawer-info-note">
                        Periodicity is stored on the indicator source assignment. Select the source assignment and then assign its reporting periodicity.
                      </div>
                      <datalist id="source-organization-options-periodicity">
                        {organizations.map((record) => (
                          <option
                            value={String(record.organization_code)}
                            key={String(record.organization_code)}
                            label={optionLabel(record, "organization_code", ["name", "organization_name"])}
                          />
                        ))}
                      </datalist>
                      <label>
                        <span>Source organization *</span>
                        <input
                          list="source-organization-options-periodicity"
                          value={mappingForm.source_organization_code}
                          onChange={(event) => setMappingForm((current) => ({ ...current, source_organization_code: event.target.value }))}
                          placeholder="Search source/ministry/department"
                        />
                        {!selectedSourceOrganization && mappingForm.source_organization_code && <em>Select an exact source from the list.</em>}
                      </label>
                      <label>
                        <span>Assignment role</span>
                        <select
                          value={mappingForm.assignment_role}
                          onChange={(event) => setMappingForm((current) => ({ ...current, assignment_role: event.target.value }))}
                        >
                          <option value="PRIMARY_SOURCE">PRIMARY_SOURCE</option>
                          <option value="SECONDARY_SOURCE">SECONDARY_SOURCE</option>
                          <option value="REVIEW_SOURCE">REVIEW_SOURCE</option>
                        </select>
                      </label>
                      <label>
                        <span>Periodicity *</span>
                        <input
                          list="periodicity-options-periodicity"
                          value={mappingForm.periodicity_code}
                          onChange={(event) => setMappingForm((current) => ({ ...current, periodicity_code: event.target.value }))}
                          placeholder="Search periodicity"
                        />
                        {!selectedPeriodicity && mappingForm.periodicity_code && <em>Select an exact periodicity from the list.</em>}
                      </label>
                      <datalist id="periodicity-options-periodicity">
                        {periodicities.map((record) => (
                          <option
                            value={String(record.periodicity_code)}
                            key={String(record.periodicity_code)}
                            label={optionLabel(record, "periodicity_code", ["name", "periodicity_name"])}
                          />
                        ))}
                      </datalist>
                      <div className="mapping-action-row always-visible">
                        <button
                          className="primary-button compact"
                          type="button"
                          disabled={!canSaveSourceAssignment || !mappingForm.periodicity_code}
                          onClick={() =>
                            void runMappingSave("periodicity", () =>
                              saveSourceAssignment({
                                framework_code: frameworkCode,
                                edition_code: editionCode,
                                national_indicator_code: indicatorCode,
                                source_organization_code: mappingForm.source_organization_code,
                                periodicity_code: mappingForm.periodicity_code,
                                assignment_role: mappingForm.assignment_role,
                                is_active: true,
                              }),
                            )
                          }
                        >
                          {isMappingSaving === "periodicity" ? "Saving..." : "Save periodicity"}
                        </button>
                      </div>
                    </div>
                  )}

                  {mappingPanel === "sourceOfficer" && (
                    <div className="mapping-drawer-body">
                      <div className="drawer-info-note">
                        Officer recipients are stored separately from source assignment ownership. Select an officer already maintained in Masters / Officers.
                      </div>
                      <datalist id="source-organization-options-officer">
                        {organizations.map((record) => (
                          <option
                            value={String(record.organization_code)}
                            key={String(record.organization_code)}
                            label={optionLabel(record, "organization_code", ["name", "organization_name"])}
                          />
                        ))}
                      </datalist>
                      <label>
                        <span>Source organization *</span>
                        <input
                          list="source-organization-options-officer"
                          value={mappingForm.source_organization_code}
                          onChange={(event) => setMappingForm((current) => ({ ...current, source_organization_code: event.target.value }))}
                          placeholder="Search source/ministry/department"
                        />
                        {!selectedSourceOrganization && mappingForm.source_organization_code && <em>Select an exact source from the list.</em>}
                      </label>
                      <label>
                        <span>Assignment role</span>
                        <select
                          value={mappingForm.assignment_role}
                          onChange={(event) => setMappingForm((current) => ({ ...current, assignment_role: event.target.value }))}
                        >
                          <option value="PRIMARY_SOURCE">PRIMARY_SOURCE</option>
                          <option value="SECONDARY_SOURCE">SECONDARY_SOURCE</option>
                          <option value="REVIEW_SOURCE">REVIEW_SOURCE</option>
                        </select>
                      </label>
                      <datalist id="officer-options">
                        {officers.map((record) => (
                          <option
                            value={officerOptionLabel(record)}
                            key={String(record.officer_code)}
                            label={textValue(record.email)}
                          />
                        ))}
                      </datalist>
                      <label>
                        <span>Officer *</span>
                        <input
                          list="officer-options"
                          value={mappingForm.officer_label}
                          onChange={(event) =>
                            setMappingForm((current) => {
                              const selected = officers.find((record) => officerOptionLabel(record) === event.target.value);
                              return {
                                ...current,
                                officer_label: event.target.value,
                                officer_code: selected ? String(selected.officer_code) : "",
                              };
                            })
                          }
                          placeholder="Search officer"
                        />
                        {!selectedOfficer && mappingForm.officer_label && <em>Select an exact officer from the list.</em>}
                      </label>
                      <label>
                        <span>Recipient type</span>
                        <select
                          value={mappingForm.recipient_type}
                          onChange={(event) => setMappingForm((current) => ({ ...current, recipient_type: event.target.value }))}
                        >
                          <option value="TO">TO</option>
                          <option value="CC">CC</option>
                          <option value="BCC">BCC</option>
                          <option value="REPLY_TO">REPLY_TO</option>
                        </select>
                      </label>
                      <label>
                        <span>Contact role</span>
                        <select
                          value={mappingForm.contact_role}
                          onChange={(event) => setMappingForm((current) => ({ ...current, contact_role: event.target.value }))}
                        >
                          <option value="NODAL_OFFICER">NODAL_OFFICER</option>
                          <option value="REVIEWER">REVIEWER</option>
                          <option value="ESCALATION">ESCALATION</option>
                          <option value="OBSERVER">OBSERVER</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </label>
                      <div className="mapping-action-row always-visible">
                        <button
                          className="primary-button compact"
                          type="button"
                          disabled={!canSaveSourceOfficer}
                          onClick={() =>
                            void runMappingSave("source-officer", () =>
                              saveSourceOfficerAssignment({
                                national_indicator_code: indicatorCode,
                                source_organization_code: mappingForm.source_organization_code,
                                assignment_role: mappingForm.assignment_role,
                                officer_code: selectedOfficer ? String(selectedOfficer.officer_code) : mappingForm.officer_code,
                                recipient_type: mappingForm.recipient_type,
                                contact_role: mappingForm.contact_role,
                                is_active: true,
                              }),
                            )
                          }
                        >
                          {isMappingSaving === "source-officer" ? "Saving..." : "Save officer recipient"}
                        </button>
                      </div>
                    </div>
                  )}

                  {(mappingPanel === "uom" || mappingPanel === "measure") && (
                    <div className="mapping-drawer-body">
                      {mappingPanel === "measure" && (
                        <>
                          <datalist id="measure-options">
                            {(detail.measures ?? []).map((item) => (
                              <option value={item.measure_code} key={item.measure_code} label={textValue(item.name ?? item.measure_code)} />
                            ))}
                          </datalist>
                          <label>
                            <span>Measure *</span>
                            <input
                              list="measure-options"
                              value={mappingForm.measure_code}
                              onChange={(event) => {
                                const nextMeasure = (detail.measures ?? []).find((item) => item.measure_code === event.target.value);
                                setMappingForm((current) => ({
                                  ...current,
                                  measure_code: event.target.value,
                                  measure_name: nextMeasure?.name ?? "",
                                  measure_unit_code: nextMeasure?.unit_code ?? current.measure_unit_code,
                                  value_type: nextMeasure?.value_type ?? current.value_type,
                                  aggregation_type: nextMeasure?.aggregation_type ?? current.aggregation_type,
                                }));
                              }}
                              placeholder="Search measure"
                            />
                            {!selectedMeasure && mappingForm.measure_code && <em>Select an exact measure from the list.</em>}
                          </label>
                        </>
                      )}
                      <datalist id="uom-options">
                        {uoms.map((record) => (
                          <option
                            value={String(record.uom_code)}
                            key={String(record.uom_code)}
                            label={optionLabel(record, "uom_code", ["name", "uom_name"])}
                          />
                        ))}
                      </datalist>
                      <label>
                        <span>UOM</span>
                        <input
                          list="uom-options"
                          value={mappingForm.measure_unit_code}
                          onChange={(event) => setMappingForm((current) => ({ ...current, measure_unit_code: event.target.value }))}
                          placeholder="Search UOM"
                        />
                        {!selectedUom && mappingForm.measure_unit_code && <em>Select an exact UOM from the list.</em>}
                      </label>
                      {mappingPanel === "measure" && (
                        <>
                          <label>
                            <span>Value type</span>
                            <select
                              value={mappingForm.value_type}
                              onChange={(event) => setMappingForm((current) => ({ ...current, value_type: event.target.value }))}
                            >
                              <option value="NUMERIC">NUMERIC</option>
                              <option value="INTEGER">INTEGER</option>
                              <option value="TEXT">TEXT</option>
                              <option value="BOOLEAN">BOOLEAN</option>
                              <option value="DATE">DATE</option>
                            </select>
                          </label>
                          <label>
                            <span>Aggregation type</span>
                            <select
                              value={mappingForm.aggregation_type}
                              onChange={(event) => setMappingForm((current) => ({ ...current, aggregation_type: event.target.value }))}
                            >
                              <option value="NONE">NONE</option>
                              <option value="SUM">SUM</option>
                              <option value="AVG">AVG</option>
                              <option value="MIN">MIN</option>
                              <option value="MAX">MAX</option>
                              <option value="COUNT">COUNT</option>
                            </select>
                          </label>
                        </>
                      )}
                      <div className="mapping-action-row always-visible">
                        <button
                          className="primary-button compact"
                          type="button"
                          disabled={mappingPanel === "measure" ? !canSaveMeasure : !currentVersionCode || !measure?.measure_code || !selectedUom || Boolean(isMappingSaving)}
                          onClick={() =>
                            void runMappingSave("measure", () => {
                              const measureToSave = selectedMeasure ?? measure;
                              const payload = {
                                measure_code: measureToSave?.measure_code,
                                name: measureToSave?.name || measureToSave?.measure_code || "Measure",
                                unit_code: mappingForm.measure_unit_code || undefined,
                                value_type: mappingForm.value_type,
                                aggregation_type: mappingForm.aggregation_type,
                                is_required: true,
                                is_active: true,
                              };
                              return updateIndicatorMeasure(currentVersionCode, measureToSave?.measure_code ?? mappingForm.measure_code, payload);
                            })
                          }
                        >
                          {isMappingSaving === "measure" ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </aside>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="indicator-side-stack">
          <section className="indicator-side-card">
            <h3>
              <CheckCircle2 size={15} />
              Metadata Status
            </h3>
            <DetailLine label="Completeness" value={metadata?.is_active === false ? "Inactive" : "Complete"} tone="success" />
            <DetailLine label="Last Updated" value={compactDate(overview.last_updated ?? overview.updated_at ?? metadata?.latest_data_availability)} />
            <DetailLine label="Source Document" value={metadata?.source_document_name ?? metadata?.source_reference_code} />
            <DetailLine label="Metadata Version" value={version?.version_label ?? version?.version_code} />
          </section>

          <section className="indicator-side-card">
            <h3>
              <FileText size={15} />
              Related Hierarchy
            </h3>
            <DetailLine label={parentNode?.level_name ?? "Parent"} value={nodeLabel(parentNode)} />
            <DetailLine label={mappedNode?.level_name ?? "Mapped Node"} value={nodeLabel(mappedNode)} />
            <DetailLine label="Indicator" value={`${indicatorNumber} - ${getIndicatorName(overview)}`} />
            <div className="side-action-row">
              <button
                className="secondary-button compact"
                type="button"
                disabled={!parentNode?.level_code || !parentNode.node_code}
                onClick={() => navigate(`/framework/levels/${encodeURIComponent(String(parentNode?.level_code))}/${encodeURIComponent(String(parentNode?.node_code))}`)}
              >
                <ExternalLink size={12} />
                Open {parentNode?.level_name ?? "Parent"} Detail
              </button>
              <button
                className="secondary-button compact"
                type="button"
                disabled={!mappedNode?.level_code || !mappedNode.node_code}
                onClick={() =>
                  parentNode?.level_code && parentNode.node_code
                    ? navigate(
                        `/framework/levels/${encodeURIComponent(String(parentNode.level_code))}/${encodeURIComponent(String(parentNode.node_code))}?selected=${encodeURIComponent(String(mappedNode?.node_code))}`,
                      )
                    : navigate(`/framework/levels/${encodeURIComponent(String(mappedNode?.level_code))}/${encodeURIComponent(String(mappedNode?.node_code))}`)
                }
              >
                <ExternalLink size={12} />
                Open {mappedNode?.level_name ?? "Mapped"} Detail
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InfoSection({
  title,
  id,
  tone = "default",
  action,
  children,
}: {
  title: string;
  id?: string;
  tone?: "default" | "global" | "source" | "periodicity" | "officer" | "uom" | "measure";
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`indicator-info-section tone-${tone}`} id={id}>
      <header>
        <h4>{title}</h4>
        {action}
      </header>
      <div className="indicator-info-grid">{children}</div>
    </section>
  );
}

function MappingListRow({
  title,
  meta,
  badge,
  onUnmap,
  disabled,
}: {
  title: string;
  meta: Array<unknown>;
  badge?: unknown;
  onUnmap?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mapping-list-row">
      <div>
        <strong title={title}>
          {badge ? <span className={`mapping-recipient-badge ${String(badge).toLowerCase()}`}>{textValue(badge)}</span> : null}
          {title}
        </strong>
        <span>{meta.map(textValue).filter((value) => value !== "-").join(" / ") || "-"}</span>
      </div>
      {onUnmap && (
        <button className="ghost-button compact danger" type="button" disabled={disabled} onClick={onUnmap}>
          Unmap
        </button>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: unknown }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{textValue(value)}</strong>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: unknown }) {
  return (
    <article className="indicator-detail-metric">
      <span>{label}</span>
      <strong>{textValue(value)}</strong>
    </article>
  );
}

function DetailLine({ label, value, tone }: { label: string; value: unknown; tone?: "success" }) {
  return (
    <div className="indicator-detail-line">
      <span>{label}</span>
      <strong className={tone === "success" ? "success-text" : ""}>{textValue(value)}</strong>
    </div>
  );
}
