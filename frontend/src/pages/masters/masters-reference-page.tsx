import { Edit3, Plus, RefreshCw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  createMasterRecord,
  listMasterRecords,
  updateMasterRecord,
  type MasterRecord,
} from "../../api/masters-reference.api";
import { LOCALE_CHANGED_EVENT, UNIT_CHANGED_EVENT } from "../../api/session.api";
import { Loader } from "../../components/common/loader";

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "number" | "checkbox" | "select" | "textarea";
  required?: boolean;
  options?: string[];
  codeFormat?: "locale" | "upper";
  relation?: "organization";
};

type ColumnConfig = {
  label: string;
  keys: string[];
  kind?: "code" | "status" | "organization" | "organizationName";
};

type MasterPageConfig = {
  title: string;
  description: string;
  endpoint: string;
  patchPath: (record: MasterRecord) => string;
  codeKeys: string[];
  columns: ColumnConfig[];
  fields: FieldConfig[];
  searchKeys: string[];
  ownershipNote: string;
};

const ORG_TYPES = ["MINISTRY", "DEPARTMENT", "DIVISION", "UNIT", "SOURCE", "OTHER"];

const PAGE_CONFIG: Record<string, MasterPageConfig> = {
  "/masters/locales": {
    title: "Locales",
    description: "Govern language and locale records used by metadata labels, content, validation messages, and UI preferences.",
    endpoint: "/masters/locales",
    patchPath: (record) => `/masters/locales/${encodeURIComponent(String(record.locale_code))}`,
    codeKeys: ["locale_code"],
    columns: [
      { label: "Locale", keys: ["locale_code"], kind: "code" },
      { label: "Display Name", keys: ["display_name", "name"] },
      { label: "Native Name", keys: ["native_name"] },
      { label: "Default", keys: ["is_default"] },
      { label: "Sort", keys: ["sort_order"] },
      { label: "Status", keys: ["is_active"], kind: "status" },
    ],
    fields: [
      { key: "locale_code", label: "Locale code", required: true, codeFormat: "locale" },
      { key: "display_name", label: "Display name", required: true },
      { key: "native_name", label: "Native name" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "is_default", label: "Default locale", type: "checkbox" },
      { key: "is_active", label: "Active", type: "checkbox" },
    ],
    searchKeys: ["locale_code", "display_name", "native_name"],
    ownershipNote: "Default locale must be unique. Hindi can stay active even if full translation is completed later.",
  },
  "/masters/periodicities": {
    title: "Periodicities",
    description: "Manage reporting frequencies used by indicators, template schedules, collection cycles, and comparison windows.",
    endpoint: "/masters/periodicities",
    patchPath: (record) => `/masters/periodicities/${encodeURIComponent(String(record.periodicity_code))}`,
    codeKeys: ["periodicity_code"],
    columns: [
      { label: "Name", keys: ["name"] },
      { label: "Code", keys: ["periodicity_code"], kind: "code" },
      { label: "Months", keys: ["months_interval"] },
      { label: "Sort", keys: ["sort_order"] },
      { label: "Status", keys: ["is_active"], kind: "status" },
    ],
    fields: [
      { key: "periodicity_code", label: "Periodicity code", codeFormat: "upper" },
      { key: "name", label: "Name", required: true },
      { key: "months_interval", label: "Months interval", type: "number" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "is_active", label: "Active", type: "checkbox" },
    ],
    searchKeys: ["periodicity_code", "name", "description"],
    ownershipNote: "Periodicities should remain stable because templates and source assignments reference these codes.",
  },
  "/masters/uom": {
    title: "Unit of Measurement (UOM)",
    description: "Maintain governed measurement units referenced by indicator versions, indicator metadata, and indicator measures.",
    endpoint: "/masters/uom",
    patchPath: (record) => `/masters/uom/${encodeURIComponent(String(record.uom_code))}`,
    codeKeys: ["uom_code"],
    columns: [
      { label: "Name", keys: ["name"] },
      { label: "Code", keys: ["uom_code"], kind: "code" },
      { label: "Symbol", keys: ["symbol"] },
      { label: "Type", keys: ["uom_type"] },
      { label: "Sort", keys: ["sort_order"] },
      { label: "Status", keys: ["is_active"], kind: "status" },
    ],
    fields: [
      { key: "uom_code", label: "UOM code", codeFormat: "upper" },
      { key: "name", label: "Name", required: true },
      { key: "symbol", label: "Symbol" },
      { key: "uom_type", label: "UOM type", type: "select", required: true, options: ["COUNT", "PERCENT", "RATIO", "RATE", "CURRENCY", "TEXT", "OTHER"] },
      { key: "description", label: "Description", type: "textarea" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "is_active", label: "Active", type: "checkbox" },
    ],
    searchKeys: ["uom_code", "name", "symbol", "uom_type", "description"],
    ownershipNote: "UOM codes are shared reference data. Indicator versions use unit_of_measure_code and measures use unit_code.",
  },
  "/masters/units": {
    title: "Sources / Ministries",
    description: "Maintain ministry, department, division, unit, and source hierarchy used by collection ownership.",
    endpoint: "/masters/organizations",
    patchPath: (record) => `/masters/organizations/${encodeURIComponent(String(record.organization_code))}`,
    codeKeys: ["organization_code"],
    columns: [
      { label: "Name", keys: ["name"] },
      { label: "Type", keys: ["organization_type"] },
      { label: "Parent", keys: ["parent_organization_code"], kind: "organization" },
      { label: "Short Code", keys: ["short_code"] },
      { label: "Status", keys: ["is_active"], kind: "status" },
    ],
    fields: [
      { key: "organization_code", label: "Organization code", codeFormat: "upper" },
      { key: "name", label: "Name", required: true },
      { key: "organization_type", label: "Organization type", type: "select", required: true, options: ORG_TYPES },
      { key: "parent_organization_code", label: "Parent organization", codeFormat: "upper", relation: "organization" },
      { key: "short_code", label: "Short code", codeFormat: "upper" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "is_active", label: "Active", type: "checkbox" },
    ],
    searchKeys: ["organization_code", "name", "organization_type", "parent_organization_code", "short_code", "description"],
    ownershipNote: "These are business organizations. Auth unit scope is still managed from Authentication > Units.",
  },
  "/masters/officers": {
    title: "Officers",
    description: "Maintain officer contacts for dispatch, escalation, review routing, and organization-level accountability.",
    endpoint: "/masters/officers",
    patchPath: (record) =>
      `/masters/organizations/${encodeURIComponent(String(record.organization_code))}/officers/${encodeURIComponent(String(record.officer_code))}`,
    codeKeys: ["officer_code"],
    columns: [
      { label: "Officer", keys: ["display_name"] },
      { label: "Source", keys: ["organization_code"], kind: "organizationName" },
      { label: "Designation", keys: ["designation"] },
      { label: "Email", keys: ["email"] },
      { label: "Status", keys: ["is_active"], kind: "status" },
    ],
    fields: [
      { key: "organization_code", label: "Source", required: true, codeFormat: "upper", relation: "organization" },
      { key: "officer_code", label: "Officer code", codeFormat: "upper" },
      { key: "display_name", label: "Display name", required: true },
      { key: "email", label: "Email" },
      { key: "mobile_number", label: "Mobile number" },
      { key: "designation", label: "Designation" },
      { key: "is_active", label: "Active", type: "checkbox" },
    ],
    searchKeys: ["officer_code", "display_name", "organization_code", "designation", "email", "mobile_number"],
    ownershipNote: "Officers may later be linked to auth users, but contacts can exist independently for dispatch metadata.",
  },
};

export function MastersReferencePage() {
  const location = useLocation();
  const config = PAGE_CONFIG[location.pathname] ?? PAGE_CONFIG["/masters/locales"];
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [organizationRecords, setOrganizationRecords] = useState<MasterRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MasterRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<MasterRecord | null>(null);
  const [formValues, setFormValues] = useState<MasterRecord>({});
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [organizationFilter, setOrganizationFilter] = useState("ALL");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const availableTypes = useMemo(() => {
    const types = new Set(records.map((record) => String(record.organization_type ?? "")).filter(Boolean));
    return Array.from(types).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const statusMatches = statusFilter === "ALL" || isRecordActive(record) === (statusFilter === "ACTIVE");
      const typeMatches = typeFilter === "ALL" || String(record.organization_type ?? "") === typeFilter;
      const organizationMatches =
        organizationFilter === "ALL" || String(record.organization_code ?? record.parent_organization_code ?? "") === organizationFilter;
      return statusMatches && typeMatches && organizationMatches && matchesSearch(record, config.searchKeys, searchText);
    });
  }, [config.searchKeys, organizationFilter, records, searchText, statusFilter, typeFilter]);

  useEffect(() => {
    setRecords([]);
    setSelectedRecord(null);
    setEditingRecord(null);
    setSearchText("");
    setStatusFilter("ACTIVE");
    setTypeFilter("ALL");
    setOrganizationFilter("ALL");
    void loadRecords(config, true);
  }, [config]);

  useEffect(() => {
    const handleContextChange = () => void loadRecords(config, true);
    window.addEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
    window.addEventListener(UNIT_CHANGED_EVENT, handleContextChange);
    return () => {
      window.removeEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
      window.removeEventListener(UNIT_CHANGED_EVENT, handleContextChange);
    };
  }, [config]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function loadRecords(pageConfig = config, forceLoader = false): Promise<void> {
    setIsLoading(forceLoader || records.length === 0);
    setError("");
    try {
      const response = await listMasterRecords({ endpoint: pageConfig.endpoint });
      const organizationResponse =
        pageConfig.endpoint === "/masters/organizations"
          ? response
          : await listMasterRecords({ endpoint: "/masters/organizations" });
      setRecords(response.data);
      setOrganizationRecords(organizationResponse.data);
      setSelectedRecord((current) => {
        const currentKey = current ? getRecordKey(current, 0).split("-0")[0] : "";
        return response.data.find((record, index) => getRecordKey(record, index).startsWith(currentKey)) ?? response.data[0] ?? null;
      });
      setNotice(`${pageConfig.title} refreshed.`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : `${pageConfig.title} could not be loaded.`);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateForm(): void {
    setEditingRecord(null);
    setFormValues(defaultFormValues(config));
  }

  function openEditForm(record: MasterRecord): void {
    setEditingRecord(record);
    setFormValues({ ...defaultFormValues(config), ...record });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const payload = normalizePayload(config, formValues);
      validatePayload(config, payload);
      if (editingRecord) {
        await updateMasterRecord({
          endpoint: config.endpoint,
          patchPath: config.patchPath(editingRecord),
          payload,
        });
      } else {
        await createMasterRecord({ endpoint: config.endpoint, payload });
      }
      setNotice(`${config.title} saved.`);
      setEditingRecord(null);
      setFormValues({});
      await loadRecords(config);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `${config.title} could not be saved.`);
    } finally {
      setIsSaving(false);
    }
  }

  const activeCount = records.filter(isRecordActive).length;
  const formOpen = Object.keys(formValues).length > 0;

  return (
    <div className="workflow-page masters-page">
      <div className="breadcrumb">Home / Masters / {config.title}</div>
      <section className="page-heading-row">
        <div>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={() => void loadRecords()}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={openCreateForm}>
            <Plus size={14} />
            New
          </button>
        </div>
      </section>

      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four">
        <MetricCard label="Records" sublabel={`${activeCount} active`} value={records.length} />
        <MetricCard label="Visible" sublabel={statusFilter === "ALL" ? "all statuses" : statusFilter.toLowerCase()} value={filteredRecords.length} />
        <MetricCard label="Contract" sublabel="MASTERS list/create/update" value="API" />
        <MetricCard label="Mode" sublabel="CRUD enabled" value="Edit" />
      </section>

      <section className="toolbar-panel masters-toolbar-panel">
        <div className="input-shell">
          <Search size={15} />
          <input
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={`Search ${config.title.toLowerCase()}`}
            value={searchText}
          />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status">
          <option value="ACTIVE">Active</option>
          <option value="ALL">All statuses</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {availableTypes.length > 0 && (
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Type">
            <option value="ALL">All types</option>
            {availableTypes.map((type) => (
              <option value={type} key={type}>{type}</option>
            ))}
          </select>
        )}
        {config.title === "Officers" && (
          <select value={organizationFilter} onChange={(event) => setOrganizationFilter(event.target.value)} aria-label="Source">
            <option value="ALL">All sources</option>
            {organizationRecords.map((record) => (
              <option value={String(record.organization_code)} key={String(record.organization_code)}>
                {String(record.name ?? record.organization_code)}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="masters-layout">
        <div className="workflow-card masters-table-card">
          {isLoading ? (
            <Loader label={`Loading ${config.title.toLowerCase()}...`} />
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">No {config.title.toLowerCase()} records found.</div>
          ) : (
            <div className="table-wrap masters-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {config.columns.map((column) => <th key={column.label}>{column.label}</th>)}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr
                      className={record === selectedRecord ? "selected-row" : ""}
                      key={getRecordKey(record, index)}
                      onClick={() => setSelectedRecord(record)}
                    >
                      {config.columns.map((column) => <td key={column.label}>{renderColumn(record, column, organizationRecords)}</td>)}
                      <td>
                        <button className="icon-action-button" type="button" onClick={(event) => {
                          event.stopPropagation();
                          openEditForm(record);
                        }}>
                          <Edit3 size={13} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <RecordDetailPanel config={config} organizationRecords={organizationRecords} record={selectedRecord} />
      </section>
      {formOpen && (
        <FormPanel
          config={config}
          editingRecord={editingRecord}
          formValues={formValues}
          isSaving={isSaving}
          organizationRecords={organizationRecords}
          onCancel={() => {
            setEditingRecord(null);
            setFormValues({});
          }}
          onChange={(key, value) => setFormValues((current) => applyFormValueChange(config, current, key, value))}
          onSubmit={(event) => void handleSubmit(event)}
        />
      )}
    </div>
  );
}

function FormPanel({
  config,
  editingRecord,
  formValues,
  isSaving,
  organizationRecords,
  onCancel,
  onChange,
  onSubmit,
}: {
  config: MasterPageConfig;
  editingRecord: MasterRecord | null;
  formValues: MasterRecord;
  isSaving: boolean;
  organizationRecords: MasterRecord[];
  onCancel: () => void;
  onChange: (key: string, value: string | number | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const detailFields = config.fields.filter((field) => field.type !== "checkbox");
  const booleanFields = config.fields.filter((field) => field.type === "checkbox");
  return (
    <div className="drawer-backdrop">
      <aside className="side-drawer master-reference-drawer">
        <div className="drawer-header master-reference-drawer-header">
          <div>
            <div className="eyebrow">{editingRecord ? "Edit" : "Create"}</div>
            <h3>{config.title}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <form className="drawer-form master-reference-drawer-form" onSubmit={onSubmit}>
          <div className="master-reference-sections">
            <div className="master-reference-guidance">
              <span>Governance note</span>
              <p>{config.ownershipNote}</p>
            </div>

            <section className="master-reference-section">
              <div className="master-reference-section-heading">
                <span>01</span>
                <div><strong>Record details</strong><small>Provide the governed code, labels, and metadata</small></div>
              </div>
              <div className="master-reference-fields">
                {detailFields.map((field) => (
                  <label className="form-field" key={field.key}>
                    <span>{field.label}{field.required ? " *" : ""}</span>
                    {renderField(field, formValues[field.key], onChange, organizationRecords)}
                  </label>
                ))}
              </div>
            </section>

            {booleanFields.length > 0 && (
              <section className="master-reference-section">
                <div className="master-reference-section-heading">
                  <span>02</span>
                  <div><strong>Status &amp; behavior</strong><small>Control availability and special record behavior</small></div>
                </div>
                <div className="master-reference-toggle-grid">
                  {booleanFields.map((field) => (
                    <label className="role-toggle-card master-reference-toggle" key={field.key}>
                      {renderField(field, formValues[field.key], onChange, organizationRecords)}
                      <span className="role-toggle-copy">
                        <strong>{field.label}</strong>
                        <small>{getBooleanFieldDescription(field)}</small>
                      </span>
                      <span className="role-toggle-track" aria-hidden="true"><span className="role-toggle-thumb" /></span>
                    </label>
                  ))}
                </div>
              </section>
            )}
          </div>
          <div className="drawer-footer master-reference-drawer-footer">
            <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Saving..." : editingRecord ? "Save changes" : `Create ${getSingularTitle(config.title)}`}</button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function getBooleanFieldDescription(field: FieldConfig): string {
  if (field.key === "is_active") return "Make this record available across governed workflows.";
  if (field.key === "is_default") return "Use this as the default option when no preference is selected.";
  return `Enable ${field.label.toLowerCase()} behavior for this record.`;
}

function getSingularTitle(title: string): string {
  const singularTitles: Record<string, string> = {
    Locales: "locale",
    Periodicities: "periodicity",
    "Unit of Measurement (UOM)": "UOM",
    "Sources / Ministries": "organization",
    Officers: "officer",
  };
  return singularTitles[title] ?? "record";
}
function renderField(
  field: FieldConfig,
  value: unknown,
  onChange: (key: string, value: string | number | boolean) => void,
  organizationRecords: MasterRecord[],
) {
  if (field.type === "checkbox") {
    return (
      <input
        checked={Boolean(value)}
        type="checkbox"
        onChange={(event) => onChange(field.key, event.target.checked)}
      />
    );
  }
  if (field.type === "select") {
    return (
      <select value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)}>
        <option value="">Select</option>
        {(field.options ?? []).map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
    );
  }
  if (field.relation === "organization") {
    return (
      <>
        <input
          list={`org-options-${field.key}`}
          value={String(value ?? "")}
          onChange={(event) => onChange(field.key, event.target.value)}
          placeholder="Search or enter source code"
        />
        <datalist id={`org-options-${field.key}`}>
          {organizationRecords.map((record) => (
            <option
              key={String(record.organization_code)}
              value={String(record.organization_code)}
              label={getOrganizationTitle(record)}
            />
          ))}
        </datalist>
      </>
    );
  }
  if (field.type === "textarea") {
    return <textarea value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value)} />;
  }
  return (
    <input
      value={String(value ?? "")}
      type={field.type === "number" ? "number" : "text"}
      onChange={(event) => onChange(field.key, field.type === "number" ? Number(event.target.value) : event.target.value)}
    />
  );
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

function RecordDetailPanel({
  config,
  organizationRecords,
  record,
}: {
  config: MasterPageConfig;
  organizationRecords: MasterRecord[];
  record: MasterRecord | null;
}) {
  if (!record) {
    return (
      <aside className="masters-detail-panel">
        <div className="detail-empty">Select a record to inspect its backend fields.</div>
      </aside>
    );
  }
  const entries = Object.entries(record).filter(([, value]) => value !== null && value !== undefined && value !== "");
  return (
    <aside className="masters-detail-panel">
      <div className="detail-panel-header">
        <div>
          <span>{config.title}</span>
          <h3>{String(resolveValue(record, ["name", "display_name", "organization_name", "periodicity_code", "locale_code", "organization_code", "officer_code"]) ?? "Record")}</h3>
        </div>
        {renderStatus(record)}
      </div>
      <p className="detail-note">{config.ownershipNote}</p>
      <div className="detail-field-grid">
        {entries.slice(0, 18).map(([key, value]) => (
          <div className="detail-field" key={key}>
            <span>{formatLabel(key)}</span>
            <strong>{formatDetailValue(key, value, organizationRecords)}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}

function defaultFormValues(config: MasterPageConfig): MasterRecord {
  const values: MasterRecord = {};
  config.fields.forEach((field) => {
    values[field.key] = field.type === "checkbox" ? field.key === "is_active" : "";
    if (field.type === "number") values[field.key] = 0;
  });
  return values;
}

function applyFormValueChange(config: MasterPageConfig, current: MasterRecord, key: string, value: string | number | boolean): MasterRecord {
  const next = { ...current, [key]: value };
  const primaryCodeKey = config.codeKeys[0];
  if (
    primaryCodeKey &&
    ["name", "display_name"].includes(key) &&
    !String(current[primaryCodeKey] ?? "").trim()
  ) {
    next[primaryCodeKey] = generateRecordCode(config, next);
  }
  return next;
}

function normalizePayload(config: MasterPageConfig, formValues: MasterRecord): MasterRecord {
  const payload: MasterRecord = {};
  config.fields.forEach((field) => {
    const rawValue = formValues[field.key];
    if (field.type === "checkbox") {
      payload[field.key] = Boolean(rawValue);
      return;
    }
    if (field.type === "number") {
      payload[field.key] = rawValue === "" || rawValue === null || rawValue === undefined ? undefined : Number(rawValue);
      return;
    }
    const value = String(rawValue ?? "").trim();
    if (!value) return;
    if (field.codeFormat === "upper") {
      payload[field.key] = value.toUpperCase().replace(/\s+/g, "_");
      return;
    }
    payload[field.key] = value;
  });
  config.codeKeys.forEach((key) => {
    if (!payload[key]) {
      payload[key] = generateRecordCode(config, payload);
    }
  });
  return payload;
}

function validatePayload(config: MasterPageConfig, payload: MasterRecord): void {
  for (const field of config.fields) {
    if (field.required && !payload[field.key]) {
      throw new Error(`${field.label} is required.`);
    }
    if (field.codeFormat === "locale" && payload[field.key] && !/^[a-z]{2}-[A-Z]{2}$/.test(String(payload[field.key]))) {
      throw new Error(`${field.label} must use locale format like en-IN or hi-IN.`);
    }
  }
}

function renderColumn(record: MasterRecord, column: ColumnConfig, organizationRecords: MasterRecord[]) {
  if (column.kind === "status") return renderStatus(record);
  const value = resolveValue(record, column.keys);
  if (column.kind === "organization") return renderCompactCell(getOrganizationName(String(value ?? ""), organizationRecords));
  if (column.kind === "organizationName") return renderCompactCell(getOrganizationDisplayName(String(value ?? ""), organizationRecords));
  if (column.kind === "code") return renderCompactCell(formatValue(value), "code-text");
  return renderCompactCell(formatValue(value));
}

function renderCompactCell(value: string, className = "cell-text") {
  return (
    <span className={className} title={value}>
      {value}
    </span>
  );
}

function renderStatus(record: MasterRecord) {
  const active = isRecordActive(record);
  return <span className={`status-badge ${active ? "active" : "inactive"}`}>{active ? "Active" : "Inactive"}</span>;
}

function resolveValue(record: MasterRecord, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
  }
  return undefined;
}

function isRecordActive(record: MasterRecord): boolean {
  if (typeof record.is_active === "boolean") return record.is_active;
  const status = String(record.status ?? "ACTIVE").toUpperCase();
  return !["INACTIVE", "DELETED", "DISABLED", "ARCHIVED"].includes(status);
}

function matchesSearch(record: MasterRecord, keys: string[], searchText: string): boolean {
  if (!searchText.trim()) return true;
  const normalizedSearch = searchText.trim().toLowerCase();
  return keys.some((key) => String(record[key] ?? "").toLowerCase().includes(normalizedSearch));
}

function getRecordKey(record: MasterRecord, index: number): string {
  const value = resolveValue(record, ["locale_code", "periodicity_code", "uom_code", "organization_code", "officer_code", "code"]);
  return `${String(value ?? "record")}-${index}`;
}

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatDetailValue(key: string, value: unknown, organizationRecords: MasterRecord[]): string {
  if (key === "organization_code" || key === "parent_organization_code") {
    return getOrganizationName(String(value ?? ""), organizationRecords);
  }
  return formatValue(value);
}

function getOrganizationName(code: string, organizationRecords: MasterRecord[]): string {
  if (!code) return "-";
  const record = organizationRecords.find((item) => String(item.organization_code) === code);
  return record ? getOrganizationTitle(record) : code;
}

function getOrganizationDisplayName(code: string, organizationRecords: MasterRecord[]): string {
  if (!code) return "-";
  const record = organizationRecords.find((item) => String(item.organization_code) === code);
  return record ? String(record.name ?? code) : code;
}

function getOrganizationTitle(record: MasterRecord): string {
  return `${String(record.name ?? record.organization_code)} (${String(record.organization_code)})`;
}

function generateRecordCode(config: MasterPageConfig, payload: MasterRecord): string {
  if (config.title === "Locales") return "en-IN";
  const source =
    String(payload.display_name ?? payload.name ?? payload.organization_code ?? payload.periodicity_code ?? config.title)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  const prefix =
    config.title === "Officers"
      ? "OFF"
      : config.title === "Periodicities"
        ? "PER"
        : config.title.includes("UOM")
          ? "UOM"
        : config.title.includes("Sources")
          ? "SRC"
          : "ORG";
  return `${prefix}_${source || Date.now()}`;
}
