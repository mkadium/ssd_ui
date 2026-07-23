import { CalendarClock, CheckCircle2, Edit3, Plus, RefreshCw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createDefaultDispatchPolicy,
  DEFAULT_CERTIFICATION_TEXT,
  DispatchPolicy,
  DispatchPolicyPayload,
  listDispatchPolicies,
  saveDispatchPolicy,
  setDispatchPolicyActive,
} from "../../api/requests.api";
import { listMasterRecords } from "../../api/masters-reference.api";
import { getLocalCurrentUser, getSelectedUnitCode, listAvailableUnits } from "../../api/session.api";
import { listTemplateVersions, listTemplates } from "../../api/templates.api";

const ATTACHMENT_TYPES = ["PDF", "XLSX", "CSV", "JPG", "PNG"];
const SCOPE_TYPES = ["GLOBAL", "TEMPLATE", "SOURCE", "DISPATCH"];
const RECURRENCE_TYPES = ["NONE", "YEARLY"];
type DispatchSelectOption = { value: string; label: string };

function boolValue(source: Record<string, unknown> | undefined, key: string, fallback: boolean): boolean {
  return typeof source?.[key] === "boolean" ? Boolean(source[key]) : fallback;
}

function numValue(source: Record<string, unknown> | undefined, key: string, fallback: number): number {
  return typeof source?.[key] === "number" ? Number(source[key]) : fallback;
}

function strValue(source: Record<string, unknown> | undefined, key: string, fallback = ""): string {
  return typeof source?.[key] === "string" ? String(source[key]) : fallback;
}

function arrValue(source: Record<string, unknown> | undefined, key: string, fallback: string[]): string[] {
  const value = source?.[key];
  return Array.isArray(value) ? value.map(String) : fallback;
}

function textFromRecord(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  const nested = record.record;
  if (nested && typeof nested === "object" && nested !== record) {
    return textFromRecord(nested as Record<string, unknown>, keys);
  }

  return "";
}

function compactLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function mergeOptions(primary: DispatchSelectOption[], fallbackValues: Array<string | null | undefined>): DispatchSelectOption[] {
  const options = new Map<string, DispatchSelectOption>();
  primary.forEach((option) => {
    if (option.value) {
      options.set(option.value, option);
    }
  });
  fallbackValues.forEach((value) => {
    if (value && !options.has(value)) {
      options.set(value, { value, label: compactLabel(value) });
    }
  });
  return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function sourceOptionFromRecord(record: Record<string, unknown>): DispatchSelectOption | null {
  const value = textFromRecord(record, [
    "organizationCode",
    "organization_code",
    "sourceOrganizationCode",
    "source_organization_code",
    "shortCode",
    "short_code",
    "code",
  ]);
  if (!value) {
    return null;
  }
  const name =
    textFromRecord(record, ["organizationName", "organization_name", "displayName", "display_name", "name", "label"]) ||
    compactLabel(value);
  return {
    value,
    label: name === value ? value : `${name} (${value})`,
  };
}

function policyToPayload(policy?: DispatchPolicy): DispatchPolicyPayload {
  const unitCode = policy?.unitCode ?? getSelectedUnitCode();
  const defaults = createDefaultDispatchPolicy(unitCode);
  if (!policy) {
    return defaults;
  }

  return {
    ...defaults,
    policy_code: policy.policyCode,
    policy_name: policy.policyName ?? defaults.policy_name,
    scope_type: policy.scopeType ?? defaults.scope_type,
    unit_code: unitCode,
    template_version_code: policy.templateVersionCode ?? null,
    source_organization_code: policy.sourceOrganizationCode ?? null,
    is_default: Boolean(policy.isDefault),
    is_active: policy.isActive !== false,
    due_days: policy.dueDays ?? defaults.due_days,
    schedule_enabled: Boolean(policy.scheduleEnabled),
    recurrence_type: policy.recurrenceType ?? defaults.recurrence_type,
    schedule_start_date: policy.scheduleStartDate ?? null,
    schedule_end_date: policy.scheduleEndDate ?? null,
    access_rules: {
      otpRequired: boolValue(policy.accessRules, "otpRequired", false),
      openSubmit: boolValue(policy.accessRules, "openSubmit", true),
    },
    otp_settings: {
      validityMinutes: numValue(policy.otpSettings, "validityMinutes", 10),
      maxAttempts: numValue(policy.otpSettings, "maxAttempts", 3),
      resendLimit: numValue(policy.otpSettings, "resendLimit", 0),
    },
    submission_methods: {
      webForm: boolValue(policy.submissionMethods, "webForm", true),
      excelUpload: boolValue(policy.submissionMethods, "excelUpload", true),
      manualEntry: boolValue(policy.submissionMethods, "manualEntry", true),
    },
    submission_controls: {
      saveDraftAllowed: boolValue(policy.submissionControls, "saveDraftAllowed", true),
      allowLateSubmission: boolValue(policy.submissionControls, "allowLateSubmission", true),
      allowRevisionAfterApproval: boolValue(policy.submissionControls, "allowRevisionAfterApproval", false),
      lockSubmissionAfterApproval: boolValue(policy.submissionControls, "lockSubmissionAfterApproval", true),
    },
    certification_settings: {
      evidenceRequired: boolValue(policy.certificationSettings, "evidenceRequired", true),
      certificationRequired: boolValue(policy.certificationSettings, "certificationRequired", true),
      ministryMustCertify: boolValue(policy.certificationSettings, "ministryMustCertify", true),
      certificationText: strValue(policy.certificationSettings, "certificationText", DEFAULT_CERTIFICATION_TEXT),
    },
    attachment_settings: {
      allowedTypes: arrValue(policy.attachmentSettings, "allowedTypes", ATTACHMENT_TYPES),
      maxFileSizeMb: numValue(policy.attachmentSettings, "maxFileSizeMb", 20),
    },
    reminder_settings: {
      firstReminderDaysBeforeDue: numValue(policy.reminderSettings, "firstReminderDaysBeforeDue", 7),
      dueDateReminderEnabled: boolValue(policy.reminderSettings, "dueDateReminderEnabled", true),
      overdueReminderDaysAfterDue: numValue(policy.reminderSettings, "overdueReminderDaysAfterDue", 1),
      escalationDaysAfterDue: numValue(policy.reminderSettings, "escalationDaysAfterDue", 7),
    },
  };
}

function jsonPatch(
  payload: DispatchPolicyPayload,
  group:
    | "access_rules"
    | "otp_settings"
    | "submission_methods"
    | "submission_controls"
    | "certification_settings"
    | "attachment_settings"
    | "reminder_settings",
  key: string,
  value: unknown,
): DispatchPolicyPayload {
  return {
    ...payload,
    [group]: {
      ...payload[group],
      [key]: value,
    },
  };
}

function validateDispatchPolicy(payload: DispatchPolicyPayload): string | null {
  const scope = payload.scope_type;
  const dueDays = Number(payload.due_days);
  const otpRequired = boolValue(payload.access_rules, "otpRequired", false);
  const certificationRequired = boolValue(payload.certification_settings, "certificationRequired", true);
  const submissionMethods = payload.submission_methods ?? {};
  const attachmentTypes = arrValue(payload.attachment_settings, "allowedTypes", ATTACHMENT_TYPES);
  const scheduleStart = payload.schedule_start_date;
  const scheduleEnd = payload.schedule_end_date;

  if (!payload.policy_name.trim()) {
    return "Policy name is required.";
  }
  if (!payload.unit_code.trim()) {
    return "Unit is required.";
  }
  if (!Number.isFinite(dueDays) || dueDays < 0 || dueDays > 3650) {
    return "Due days must be between 0 and 3650.";
  }
  if (scope === "TEMPLATE" && !payload.template_version_code?.trim()) {
    return "Template version override is required for TEMPLATE scope.";
  }
  if (scope === "SOURCE" && !payload.source_organization_code?.trim()) {
    return "Source organization override is required for SOURCE scope.";
  }
  if (payload.schedule_enabled) {
    if (payload.recurrence_type === "NONE") {
      return "Select a recurrence when schedule is enabled.";
    }
    if (!scheduleStart || !scheduleEnd) {
      return "Schedule start date and end date are required when schedule is enabled.";
    }
    if (scheduleEnd < scheduleStart) {
      return "Schedule end date must be after the start date.";
    }
  }
  if (otpRequired) {
    const validity = numValue(payload.otp_settings, "validityMinutes", 10);
    const attempts = numValue(payload.otp_settings, "maxAttempts", 3);
    const resendLimit = numValue(payload.otp_settings, "resendLimit", 0);
    if (validity < 1 || validity > 1440) {
      return "OTP validity must be between 1 and 1440 minutes.";
    }
    if (attempts < 1 || attempts > 20) {
      return "OTP max attempts must be between 1 and 20.";
    }
    if (resendLimit < 0) {
      return "OTP resend limit cannot be negative. Use 0 for unlimited.";
    }
  }
  if (
    !boolValue(submissionMethods, "webForm", true) &&
    !boolValue(submissionMethods, "excelUpload", true) &&
    !boolValue(submissionMethods, "manualEntry", true)
  ) {
    return "At least one submission method must be enabled.";
  }
  if (
    certificationRequired &&
    !strValue(payload.certification_settings, "certificationText", DEFAULT_CERTIFICATION_TEXT).trim()
  ) {
    return "Certification text is required when certification is enabled.";
  }
  if (!attachmentTypes.length) {
    return "Select at least one allowed attachment type.";
  }
  if (numValue(payload.attachment_settings, "maxFileSizeMb", 20) < 1) {
    return "Maximum attachment size must be at least 1 MB.";
  }
  if (
    numValue(payload.reminder_settings, "firstReminderDaysBeforeDue", 7) < 0 ||
    numValue(payload.reminder_settings, "overdueReminderDaysAfterDue", 1) < 0 ||
    numValue(payload.reminder_settings, "escalationDaysAfterDue", 7) < 0
  ) {
    return "Reminder day values cannot be negative.";
  }

  return null;
}

function ToggleField({
  checked,
  label,
  hint,
  disabled = false,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`dispatch-toggle ${disabled ? "disabled" : ""}`}>
      <input disabled={disabled} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
      </span>
    </label>
  );
}

export function DispatchSettingsPage() {
  const [policies, setPolicies] = useState<DispatchPolicy[]>([]);
  const [selected, setSelected] = useState<DispatchPolicy | undefined>();
  const [draft, setDraft] = useState<DispatchPolicyPayload>(() => createDefaultDispatchPolicy());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [templateReferenceOptions, setTemplateReferenceOptions] = useState<DispatchSelectOption[]>([]);
  const [sourceReferenceOptions, setSourceReferenceOptions] = useState<DispatchSelectOption[]>([]);
  const [unitReferenceOptions, setUnitReferenceOptions] = useState<DispatchSelectOption[]>([]);

  const unitCode = getSelectedUnitCode();
  const currentUser = getLocalCurrentUser();

  useEffect(() => {
    void loadPolicies();
  }, [unitCode]);

  useEffect(() => {
    void loadReferenceOptions();
  }, [unitCode]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredPolicies = useMemo(() => {
    const term = search.trim().toLowerCase();
    return policies.filter((policy) => {
      const matchesTerm =
        !term ||
        [policy.policyName, policy.policyCode, policy.scopeType, policy.templateVersionCode, policy.sourceOrganizationCode]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      const matchesScope = scopeFilter === "ALL" || policy.scopeType === scopeFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && policy.isActive !== false) ||
        (statusFilter === "INACTIVE" && policy.isActive === false);
      return matchesTerm && matchesScope && matchesStatus;
    });
  }, [policies, scopeFilter, search, statusFilter]);

  const metrics = useMemo(() => {
    const active = policies.filter((policy) => policy.isActive !== false).length;
    const overrides = policies.filter((policy) => policy.scopeType && policy.scopeType !== "GLOBAL").length;
    const defaultPolicy = policies.find((policy) => policy.isDefault) ?? policies[0];
    return {
      total: policies.length,
      active,
      overrides,
      dueDays: defaultPolicy?.dueDays ?? 30,
    };
  }, [policies]);

  const templateVersionOptions = useMemo(
    () => mergeOptions(templateReferenceOptions, policies.map((policy) => policy.templateVersionCode)),
    [policies, templateReferenceOptions],
  );
  const sourceOrganizationOptions = useMemo(
    () => mergeOptions(sourceReferenceOptions, policies.map((policy) => policy.sourceOrganizationCode)),
    [policies, sourceReferenceOptions],
  );
  const unitOptions = useMemo(
    () => mergeOptions(unitReferenceOptions, [unitCode, ...policies.map((policy) => policy.unitCode)]),
    [policies, unitCode, unitReferenceOptions],
  );

  async function loadReferenceOptions() {
    setReferencesLoading(true);
    try {
      const [templatesResult, sourcesResult, unitsResult] = await Promise.allSettled([
        listTemplates({ limit: 500 }),
        listMasterRecords({ endpoint: "/masters/organizations", params: { include_inactive: false } }),
        listAvailableUnits(),
      ]);

      if (templatesResult.status === "fulfilled") {
        const versionResults = await Promise.allSettled(
          templatesResult.value.data
            .map((template) => textFromRecord(template as Record<string, unknown>, ["template_code", "templateCode", "code"]))
            .filter(Boolean)
            .map((templateCode) => listTemplateVersions(templateCode)),
        );
        const versionOptions = versionResults.flatMap((result) => {
          if (result.status !== "fulfilled") {
            return [];
          }
          return result.value.data
            .filter((version) => {
              const status = textFromRecord(version as Record<string, unknown>, ["status", "version_status", "versionStatus"]);
              return status.toUpperCase() === "PUBLISHED";
            })
            .map((version) => {
              const record = version as Record<string, unknown>;
              const value = textFromRecord(record, ["version_code", "versionCode"]);
              const title = textFromRecord(record, ["title", "version_name", "versionName"]) || compactLabel(value);
              return value ? { value, label: `${title} (${value})` } : null;
            })
            .filter((option): option is DispatchSelectOption => Boolean(option));
        });
        setTemplateReferenceOptions(mergeOptions(versionOptions, []));
      }

      if (sourcesResult.status === "fulfilled") {
        const options = sourcesResult.value.data
          .map((record) => sourceOptionFromRecord(record as Record<string, unknown>))
          .filter((option): option is DispatchSelectOption => Boolean(option));
        setSourceReferenceOptions(mergeOptions(options, []));
      }

      if (unitsResult.status === "fulfilled") {
        const options = unitsResult.value
          .map((unit) => {
            const label = unit.unit_name ?? unit.display_name ?? unit.name ?? unit.unit_code;
            return unit.unit_code ? { value: unit.unit_code, label: label === unit.unit_code ? unit.unit_code : `${label} (${unit.unit_code})` } : null;
          })
          .filter((option): option is DispatchSelectOption => Boolean(option));
        setUnitReferenceOptions(mergeOptions(options, []));
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Dispatch reference data could not be loaded.");
    } finally {
      setReferencesLoading(false);
    }
  }

  async function loadPolicies() {
    setLoading(true);
    try {
      const data = await listDispatchPolicies({ unitCode, includeInactive: true, limit: 200 });
      setPolicies(data);
      setSelected((current) => data.find((item) => item.policyCode === current?.policyCode) ?? data[0]);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Dispatch policies could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function openPolicy(policy?: DispatchPolicy) {
    setDraft(policyToPayload(policy));
    setDrawerOpen(true);
  }

  async function savePolicy(event: FormEvent) {
    event.preventDefault();
    const validationMessage = validateDispatchPolicy(draft);
    if (validationMessage) {
      setToast(validationMessage);
      return;
    }
    setSaving(true);
    try {
      const saved = await saveDispatchPolicy(draft.policy_code, {
        ...draft,
        unit_code: draft.unit_code || unitCode,
        updated_by_username: currentUser.displayName,
      });
      setPolicies((items) => {
        const exists = items.some((item) => item.policyCode === saved.policyCode);
        return exists ? items.map((item) => (item.policyCode === saved.policyCode ? saved : item)) : [saved, ...items];
      });
      setSelected(saved);
      setDrawerOpen(false);
      setToast("Dispatch policy saved.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Dispatch policy could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePolicy(policy: DispatchPolicy) {
    if (!policy.policyCode) {
      return;
    }
    try {
      const updated = await setDispatchPolicyActive(policy.policyCode, policy.unitCode ?? unitCode, policy.isActive === false);
      setPolicies((items) => items.map((item) => (item.policyCode === updated.policyCode ? updated : item)));
      setSelected(updated);
      setToast(updated.isActive === false ? "Dispatch policy deactivated." : "Dispatch policy activated.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Dispatch policy status could not be updated.");
    }
  }

  const selectedAccess = selected?.accessRules ?? {};
  const selectedSubmission = selected?.submissionMethods ?? {};
  const selectedControls = selected?.submissionControls ?? {};
  const selectedCertification = selected?.certificationSettings ?? {};
  const selectedAttachments = selected?.attachmentSettings ?? {};

  return (
    <section className="dispatch-settings-page">
      {toast ? <div className="dispatch-toast">{toast}</div> : null}
      <div className="dispatch-page-header">
        <div>
          <span className="eyebrow">Request Governance</span>
          <h2>Dispatch Settings</h2>
          <p>Configure scheduling, access, submission, certification, reminders, and attachment rules.</p>
        </div>
        <div className="dispatch-header-actions">
          <button className="secondary-button compact" type="button" onClick={loadPolicies}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="primary-button compact" type="button" onClick={() => openPolicy()}>
            <Plus size={14} /> New Policy
          </button>
        </div>
      </div>

      <div className="dispatch-kpi-grid">
        <article>
          <strong>{metrics.total}</strong>
          <span>Policies configured</span>
        </article>
        <article>
          <strong>{metrics.active}</strong>
          <span>Active and ready</span>
        </article>
        <article>
          <strong>{metrics.overrides}</strong>
          <span>Template/source overrides</span>
        </article>
        <article>
          <strong>{metrics.dueDays}</strong>
          <span>Default due days</span>
        </article>
      </div>

      <div className="dispatch-filter-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search policy, code, template, or source"
        />
        <select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)}>
          <option value="ALL">All scopes</option>
          {SCOPE_TYPES.map((scope) => (
            <option key={scope} value={scope}>
              {scope}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="dispatch-settings-shell">
        <div className="dispatch-policy-list">
          <div className="dispatch-panel-title">
            <strong>Policy List</strong>
            <span>{filteredPolicies.length}</span>
          </div>
          {loading ? (
            <div className="dispatch-empty">Loading dispatch policies...</div>
          ) : filteredPolicies.length ? (
            filteredPolicies.map((policy) => (
              <button
                className={`dispatch-policy-card ${selected?.policyCode === policy.policyCode ? "active" : ""}`}
                key={policy.policyCode ?? policy.policyName}
                type="button"
                onClick={() => setSelected(policy)}
              >
                <span className="dispatch-policy-icon">
                  <SlidersHorizontal size={15} />
                </span>
                <span>
                  <strong>{policy.policyName}</strong>
                  <small>{policy.policyCode ?? "Draft code"} | {policy.scopeType}</small>
                </span>
                <b className={policy.isActive === false ? "status-off" : "status-on"}>
                  {policy.isActive === false ? "Inactive" : "Active"}
                </b>
              </button>
            ))
          ) : (
            <div className="dispatch-empty">No policies match the selected filters.</div>
          )}
        </div>

        <div className="dispatch-policy-detail">
          {selected ? (
            <>
              <div className="dispatch-detail-hero">
                <div>
                  <span className="eyebrow">{selected.scopeType}</span>
                  <h3>{selected.policyName}</h3>
                  <p>{selected.policyCode ?? "Policy code will be generated by the database."}</p>
                </div>
                <div className="dispatch-detail-actions">
                  <button className="secondary-button compact" type="button" onClick={() => openPolicy(selected)}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button className="ghost-button compact" type="button" onClick={() => togglePolicy(selected)}>
                    {selected.isActive === false ? "Activate" : "Deactivate"}
                  </button>
                </div>
              </div>

              <div className="dispatch-detail-grid">
                <article>
                  <span>Due Date Rule</span>
                  <strong>Request date + {selected.dueDays ?? 30} days</strong>
                </article>
                <article>
                  <span>Access</span>
                  <strong>
                    {boolValue(selectedAccess, "otpRequired", false) ? "OTP required" : "No OTP"} /{" "}
                    {boolValue(selectedAccess, "openSubmit", true) ? "Open submit" : "Restricted submit"}
                  </strong>
                </article>
                <article>
                  <span>Submission</span>
                  <strong>
                    {[
                      boolValue(selectedSubmission, "webForm", true) ? "Webform" : "",
                      boolValue(selectedSubmission, "excelUpload", true) ? "Excel" : "",
                      boolValue(selectedSubmission, "manualEntry", true) ? "Manual" : "",
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </strong>
                </article>
                <article>
                  <span>Attachments</span>
                  <strong>
                    {arrValue(selectedAttachments, "allowedTypes", ATTACHMENT_TYPES).join(", ")} /{" "}
                    {numValue(selectedAttachments, "maxFileSizeMb", 20)} MB
                  </strong>
                </article>
              </div>

              <div className="dispatch-settings-sections">
                <article>
                  <h4>
                    <CalendarClock size={15} /> Schedule
                  </h4>
                  <p>
                    {selected.scheduleEnabled ? selected.recurrenceType : "Manual dispatch"} from{" "}
                    {selected.scheduleStartDate ?? "-"} to {selected.scheduleEndDate ?? "-"}.
                  </p>
                </article>
                <article>
                  <h4>
                    <CheckCircle2 size={15} /> Submission Controls
                  </h4>
                  <p>
                    Draft {boolValue(selectedControls, "saveDraftAllowed", true) ? "allowed" : "blocked"}, late{" "}
                    {boolValue(selectedControls, "allowLateSubmission", true) ? "allowed" : "blocked"}, approval lock{" "}
                    {boolValue(selectedControls, "lockSubmissionAfterApproval", true) ? "enabled" : "disabled"}.
                  </p>
                </article>
                <article>
                  <h4>
                    <ShieldCheck size={15} /> Certification
                  </h4>
                  <p>{strValue(selectedCertification, "certificationText", DEFAULT_CERTIFICATION_TEXT)}</p>
                </article>
              </div>
            </>
          ) : (
            <div className="dispatch-empty large">Select a dispatch policy to review its settings.</div>
          )}
        </div>
      </div>

      {drawerOpen ? (
        <div className="drawer-overlay">
          <form className="form-drawer dispatch-policy-drawer" onSubmit={savePolicy}>
            <div className="drawer-header">
              <div>
                <span className="eyebrow">{draft.policy_code ? "Update" : "Create"}</span>
                <h3>Dispatch Policy</h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close">
                x
              </button>
            </div>

            <div className="drawer-form dispatch-drawer-form">
              <section>
                <h4>Identity & Scope</h4>
                <label>
                  Policy name *
                  <input
                    required
                    value={draft.policy_name}
                    onChange={(event) => setDraft({ ...draft, policy_name: event.target.value })}
                    placeholder="Default Dispatch Policy"
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Policy code
                    <input
                      value={draft.policy_code ?? ""}
                      onChange={(event) => setDraft({ ...draft, policy_code: event.target.value || undefined })}
                      placeholder="Auto-generated if blank"
                    />
                  </label>
                  <label>
                    Unit
                    <select
                      required
                      value={draft.unit_code}
                      onChange={(event) => setDraft({ ...draft, unit_code: event.target.value })}
                    >
                      <option value="">{referencesLoading ? "Loading units..." : "Select unit"}</option>
                      {unitOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <small className="field-help">Policies are evaluated inside the selected unit scope.</small>
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    Scope
                    <select
                      value={draft.scope_type}
                      onChange={(event) => {
                        const scopeType = event.target.value;
                        setDraft({
                          ...draft,
                          scope_type: scopeType,
                          template_version_code: scopeType === "TEMPLATE" ? draft.template_version_code : null,
                          source_organization_code: scopeType === "SOURCE" ? draft.source_organization_code : null,
                        });
                      }}
                    >
                      {SCOPE_TYPES.map((scope) => (
                        <option key={scope} value={scope}>
                          {scope}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Due days
                    <input
                      min={0}
                      max={3650}
                      type="number"
                      value={draft.due_days}
                      onChange={(event) => setDraft({ ...draft, due_days: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <label className={draft.scope_type !== "TEMPLATE" ? "field-disabled" : ""}>
                  Template version override
                  <select
                    disabled={draft.scope_type !== "TEMPLATE"}
                    required={draft.scope_type === "TEMPLATE"}
                    value={draft.template_version_code ?? ""}
                    onChange={(event) => setDraft({ ...draft, template_version_code: event.target.value || null })}
                  >
                    <option value="">
                      {referencesLoading ? "Loading published template versions..." : "Select published template version"}
                    </option>
                    {templateVersionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small className="field-help">Required only for TEMPLATE scope. Published versions are listed.</small>
                </label>
                <label className={draft.scope_type !== "SOURCE" ? "field-disabled" : ""}>
                  Source organization override
                  <select
                    disabled={draft.scope_type !== "SOURCE"}
                    required={draft.scope_type === "SOURCE"}
                    value={draft.source_organization_code ?? ""}
                    onChange={(event) => setDraft({ ...draft, source_organization_code: event.target.value || null })}
                  >
                    <option value="">
                      {referencesLoading ? "Loading source organizations..." : "Select source organization"}
                    </option>
                    {sourceOrganizationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small className="field-help">Required only for SOURCE scope. Sources come from organization masters.</small>
                </label>
                <div className="dispatch-toggle-row">
                  <ToggleField checked={draft.is_default} label="Default policy" onChange={(checked) => setDraft({ ...draft, is_default: checked })} />
                  <ToggleField checked={draft.is_active} label="Active" onChange={(checked) => setDraft({ ...draft, is_active: checked })} />
                </div>
              </section>

              <section>
                <h4>Schedule</h4>
                <div className="dispatch-toggle-row">
                  <ToggleField checked={draft.schedule_enabled} label="Enable schedule" onChange={(checked) => setDraft({ ...draft, schedule_enabled: checked })} />
                </div>
                <div className="form-grid">
                  <label className={!draft.schedule_enabled ? "field-disabled" : ""}>
                    Recurrence
                    <select
                      disabled={!draft.schedule_enabled}
                      value={draft.schedule_enabled ? draft.recurrence_type : "NONE"}
                      onChange={(event) => setDraft({ ...draft, recurrence_type: event.target.value })}
                    >
                      {RECURRENCE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={!draft.schedule_enabled ? "field-disabled" : ""}>
                    Start date
                    <input disabled={!draft.schedule_enabled} type="date" value={draft.schedule_start_date ?? ""} onChange={(event) => setDraft({ ...draft, schedule_start_date: event.target.value || null })} />
                  </label>
                  <label className={!draft.schedule_enabled ? "field-disabled" : ""}>
                    End date
                    <input disabled={!draft.schedule_enabled} type="date" value={draft.schedule_end_date ?? ""} onChange={(event) => setDraft({ ...draft, schedule_end_date: event.target.value || null })} />
                  </label>
                </div>
              </section>

              <section>
                <h4>Access & OTP</h4>
                <div className="dispatch-toggle-row">
                  <ToggleField
                    checked={boolValue(draft.access_rules, "otpRequired", false)}
                    label="OTP required"
                    hint="Default is off."
                    onChange={(checked) => setDraft(jsonPatch(draft, "access_rules", "otpRequired", checked))}
                  />
                  <ToggleField
                    checked={boolValue(draft.access_rules, "openSubmit", true)}
                    label="Open submit"
                    onChange={(checked) => setDraft(jsonPatch(draft, "access_rules", "openSubmit", checked))}
                  />
                </div>
                <div className="form-grid">
                  <label className={!boolValue(draft.access_rules, "otpRequired", false) ? "field-disabled" : ""}>
                    OTP validity minutes
                    <input disabled={!boolValue(draft.access_rules, "otpRequired", false)} type="number" min={1} value={numValue(draft.otp_settings, "validityMinutes", 10)} onChange={(event) => setDraft(jsonPatch(draft, "otp_settings", "validityMinutes", Number(event.target.value)))} />
                  </label>
                  <label className={!boolValue(draft.access_rules, "otpRequired", false) ? "field-disabled" : ""}>
                    Max attempts
                    <input disabled={!boolValue(draft.access_rules, "otpRequired", false)} type="number" min={1} value={numValue(draft.otp_settings, "maxAttempts", 3)} onChange={(event) => setDraft(jsonPatch(draft, "otp_settings", "maxAttempts", Number(event.target.value)))} />
                  </label>
                  <label className={!boolValue(draft.access_rules, "otpRequired", false) ? "field-disabled" : ""}>
                    Resend limit
                    <input disabled={!boolValue(draft.access_rules, "otpRequired", false)} type="number" min={0} value={numValue(draft.otp_settings, "resendLimit", 0)} onChange={(event) => setDraft(jsonPatch(draft, "otp_settings", "resendLimit", Number(event.target.value)))} />
                  </label>
                </div>
                <p className="dispatch-hint">Use 0 resend limit for unlimited resends.</p>
              </section>

              <section>
                <h4>Submission Methods</h4>
                <div className="dispatch-toggle-row">
                  {[
                    ["webForm", "Webform"],
                    ["excelUpload", "Excel upload"],
                    ["manualEntry", "Manual entry"],
                  ].map(([key, label]) => (
                    <ToggleField
                      key={key}
                      checked={boolValue(draft.submission_methods, key, true)}
                      label={label}
                      onChange={(checked) => setDraft(jsonPatch(draft, "submission_methods", key, checked))}
                    />
                  ))}
                </div>
              </section>

              <section>
                <h4>Submission Controls</h4>
                <div className="dispatch-toggle-row">
                  {[
                    ["saveDraftAllowed", "Save draft allowed", true],
                    ["allowLateSubmission", "Allow late submission", true],
                    ["allowRevisionAfterApproval", "Allow revision after approval", false],
                    ["lockSubmissionAfterApproval", "Lock after approval", true],
                  ].map(([key, label, fallback]) => (
                    <ToggleField
                      key={String(key)}
                      checked={boolValue(draft.submission_controls, String(key), Boolean(fallback))}
                      label={String(label)}
                      onChange={(checked) => setDraft(jsonPatch(draft, "submission_controls", String(key), checked))}
                    />
                  ))}
                </div>
              </section>

              <section>
                <h4>Evidence & Certification</h4>
                <div className="dispatch-toggle-row">
                  {[
                    ["evidenceRequired", "Evidence required"],
                    ["certificationRequired", "Certification required"],
                    ["ministryMustCertify", "Ministry must certify"],
                  ].map(([key, label]) => (
                    <ToggleField
                      key={key}
                      checked={boolValue(draft.certification_settings, key, true)}
                      label={label}
                      onChange={(checked) => setDraft(jsonPatch(draft, "certification_settings", key, checked))}
                    />
                  ))}
                </div>
                <label>
                  Certification text
                  <textarea
                    disabled={!boolValue(draft.certification_settings, "certificationRequired", true)}
                    value={strValue(draft.certification_settings, "certificationText", DEFAULT_CERTIFICATION_TEXT)}
                    onChange={(event) => setDraft(jsonPatch(draft, "certification_settings", "certificationText", event.target.value))}
                  />
                </label>
              </section>

              <section>
                <h4>Attachments</h4>
                <div className="dispatch-chip-checks">
                  {ATTACHMENT_TYPES.map((type) => {
                    const selectedTypes = arrValue(draft.attachment_settings, "allowedTypes", ATTACHMENT_TYPES);
                    return (
                      <label key={type}>
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={(event) => {
                            const nextTypes = event.target.checked
                              ? Array.from(new Set([...selectedTypes, type]))
                              : selectedTypes.filter((item) => item !== type);
                            setDraft(jsonPatch(draft, "attachment_settings", "allowedTypes", nextTypes));
                          }}
                        />
                        {type}
                      </label>
                    );
                  })}
                </div>
                <label>
                  Max file size MB
                  <input
                    type="number"
                    min={1}
                    value={numValue(draft.attachment_settings, "maxFileSizeMb", 20)}
                    onChange={(event) => setDraft(jsonPatch(draft, "attachment_settings", "maxFileSizeMb", Number(event.target.value)))}
                  />
                </label>
              </section>

              <section>
                <h4>Reminders</h4>
                <div className="form-grid">
                  <label>
                    First reminder days before due
                    <input type="number" min={0} value={numValue(draft.reminder_settings, "firstReminderDaysBeforeDue", 7)} onChange={(event) => setDraft(jsonPatch(draft, "reminder_settings", "firstReminderDaysBeforeDue", Number(event.target.value)))} />
                  </label>
                  <label>
                    Overdue reminder days after due
                    <input type="number" min={0} value={numValue(draft.reminder_settings, "overdueReminderDaysAfterDue", 1)} onChange={(event) => setDraft(jsonPatch(draft, "reminder_settings", "overdueReminderDaysAfterDue", Number(event.target.value)))} />
                  </label>
                  <label>
                    Escalation days after due
                    <input type="number" min={0} value={numValue(draft.reminder_settings, "escalationDaysAfterDue", 7)} onChange={(event) => setDraft(jsonPatch(draft, "reminder_settings", "escalationDaysAfterDue", Number(event.target.value)))} />
                  </label>
                </div>
                <ToggleField
                  checked={boolValue(draft.reminder_settings, "dueDateReminderEnabled", true)}
                  label="Due date reminder"
                  onChange={(checked) => setDraft(jsonPatch(draft, "reminder_settings", "dueDateReminderEnabled", checked))}
                />
              </section>
            </div>

            <div className="drawer-footer">
              <button className="secondary-button compact" type="button" onClick={() => setDrawerOpen(false)}>
                Cancel
              </button>
              <button className="primary-button compact" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Policy"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
