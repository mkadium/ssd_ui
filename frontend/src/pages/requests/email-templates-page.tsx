import { CheckCircle2, Edit3, Mail, Plus, RefreshCcw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createDefaultEmailTemplate,
  EmailTemplate,
  EmailTemplatePayload,
  listEmailTemplates,
  saveEmailTemplate,
  setEmailTemplateActive,
} from "../../api/requests.api";
import { getSelectedUnitCode } from "../../api/session.api";

const TEMPLATE_TYPES = [
  { value: "SEND_REQUEST", label: "Send request" },
  { value: "FIRST_REMINDER", label: "First reminder" },
  { value: "DUE_DATE_REMINDER", label: "Due date reminder" },
  { value: "OVERDUE_ALERT", label: "Overdue alert" },
  { value: "ESCALATION", label: "Escalation" },
  { value: "SUBMITTED_FOR_REVIEW", label: "Submitted for review" },
  { value: "REVIEW_APPROVED", label: "Review approved" },
  { value: "REVIEW_REJECTED", label: "Review rejected" },
  { value: "RESENT_FOR_SUBMISSION", label: "Resent for submission" },
  { value: "RESUBMITTED_FOR_REVIEW", label: "Resubmitted for review" },
  { value: "PUBLISHED", label: "Published" },
];

const SCOPES = [
  { value: "GLOBAL", label: "Global" },
  { value: "TEMPLATE", label: "Template" },
  { value: "SOURCE", label: "Source" },
];

const AVAILABLE_VARIABLES = [
  "officer_name",
  "template_name",
  "template_code",
  "indicator_number",
  "indicator_name",
  "ministry",
  "department",
  "request_period",
  "reporting_period",
  "due_date",
  "submission_link",
];

function typeLabel(value?: string) {
  return TEMPLATE_TYPES.find((item) => item.value === value)?.label ?? value ?? "-";
}

function scopeLabel(value?: string) {
  return SCOPES.find((item) => item.value === value)?.label ?? value ?? "-";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function toPayload(template: EmailTemplate): EmailTemplatePayload {
  return {
    email_template_code: template.emailTemplateCode,
    template_name: template.templateName ?? "",
    template_type: template.templateType ?? "SEND_REQUEST",
    unit_code: template.unitCode ?? getSelectedUnitCode(),
    scope_type: template.scopeType ?? "GLOBAL",
    template_version_code: template.scopeType === "TEMPLATE" ? template.templateVersionCode ?? "" : null,
    source_organization_code: template.scopeType === "SOURCE" ? template.sourceOrganizationCode ?? "" : null,
    subject: template.subject ?? "",
    body: template.body ?? "",
    variables: template.variables ?? [],
    is_default: template.isDefault ?? false,
    is_active: template.isActive ?? true,
  };
}

function emptyDraft(): EmailTemplatePayload {
  return {
    ...createDefaultEmailTemplate(getSelectedUnitCode()),
    template_name: "",
    subject: "",
    body: "",
    variables: [],
    is_default: false,
  };
}

export function EmailTemplatesPage() {
  const unitCode = getSelectedUnitCode();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | undefined>();
  const [draft, setDraft] = useState<EmailTemplatePayload>(emptyDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadTemplates() {
    setIsLoading(true);
    setError("");
    try {
      const rows = await listEmailTemplates({ unitCode, includeInactive: true, limit: 500 });
      setTemplates(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load email templates.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return templates.filter((template) => {
      const haystack = [
        template.emailTemplateCode,
        template.templateName,
        template.templateType,
        template.scopeType,
        template.subject,
        template.templateVersionCode,
        template.sourceOrganizationCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      const matchesType = typeFilter === "ALL" || template.templateType === typeFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && template.isActive !== false) ||
        (statusFilter === "INACTIVE" && template.isActive === false);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [query, statusFilter, templates, typeFilter]);

  const metrics = useMemo(() => {
    const active = templates.filter((template) => template.isActive !== false).length;
    const reminders = templates.filter((template) => (template.templateType ?? "").includes("REMINDER")).length;
    const defaults = templates.filter((template) => template.isDefault).length;
    return { active, reminders, defaults };
  }, [templates]);

  function openCreateDrawer() {
    setEditingCode(undefined);
    setDraft(emptyDraft());
    setDrawerOpen(true);
  }

  function openEditDrawer(template: EmailTemplate) {
    setEditingCode(template.emailTemplateCode);
    setDraft(toPayload(template));
    setDrawerOpen(true);
  }

  function addVariable(variableName: string, target: "subject" | "body") {
    const token = `{${variableName}}`;
    setDraft((current) => ({
      ...current,
      [target]: `${current[target]}${current[target].endsWith(" ") || current[target].endsWith("\n") ? "" : " "}${token}`,
      variables: Array.from(new Set([...current.variables, variableName])),
    }));
  }

  function setScope(scopeType: string) {
    setDraft((current) => ({
      ...current,
      scope_type: scopeType,
      template_version_code: scopeType === "TEMPLATE" ? current.template_version_code ?? "" : null,
      source_organization_code: scopeType === "SOURCE" ? current.source_organization_code ?? "" : null,
    }));
  }

  async function submitTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!draft.template_name.trim() || !draft.subject.trim() || !draft.body.trim()) {
      setError("Template name, subject, and body are required.");
      return;
    }
    if (draft.scope_type === "TEMPLATE" && !draft.template_version_code?.trim()) {
      setError("Template version code is required for template scope.");
      return;
    }
    if (draft.scope_type === "SOURCE" && !draft.source_organization_code?.trim()) {
      setError("Source organization code is required for source scope.");
      return;
    }

    setIsSaving(true);
    try {
      await saveEmailTemplate(editingCode, {
        ...draft,
        template_version_code: draft.scope_type === "TEMPLATE" ? draft.template_version_code : null,
        source_organization_code: draft.scope_type === "SOURCE" ? draft.source_organization_code : null,
      });
      setDrawerOpen(false);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save email template.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(template: EmailTemplate) {
    if (!template.emailTemplateCode) return;
    setError("");
    try {
      await setEmailTemplateActive(template.emailTemplateCode, template.unitCode ?? unitCode, template.isActive === false);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update template status.");
    }
  }

  return (
    <div className="email-templates-page content-stack">
      <div className="page-heading-row">
        <div>
          <span className="section-kicker">Request Dispatch</span>
          <h1>Email Templates</h1>
          <p>Reusable subject and body templates for request emails, reminders, due alerts, and escalation.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button compact" type="button" onClick={() => void loadTemplates()}>
            <RefreshCcw size={15} /> Refresh
          </button>
          <button className="primary-button compact" type="button" onClick={openCreateDrawer}>
            <Plus size={15} /> Create Template
          </button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="dispatch-kpi-grid email-template-kpis">
        <article><strong>{templates.length}</strong><span>Total templates</span></article>
        <article><strong>{metrics.active}</strong><span>Active</span></article>
        <article><strong>{metrics.defaults}</strong><span>Defaults</span></article>
        <article><strong>{metrics.reminders}</strong><span>Reminders</span></article>
      </div>

      <div className="dispatch-filter-row">
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search template, type, scope, subject"
          />
        </label>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="ALL">All email types</option>
          {TEMPLATE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="master-table-card">
        <div className="table-section-heading email-template-table-heading">
          <strong>Email template library</strong>
          <span>{filteredTemplates.length} shown</span>
        </div>
        <div className="master-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Type</th>
                <th>Scope</th>
                <th>Subject</th>
                <th>Default</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8}>Loading email templates...</td></tr>
              ) : filteredTemplates.length === 0 ? (
                <tr><td colSpan={8}>No email templates match the selected filters.</td></tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.emailTemplateCode}>
                    <td>
                      <strong>{template.templateName}</strong>
                      <small>{template.emailTemplateCode}</small>
                    </td>
                    <td>{typeLabel(template.templateType)}</td>
                    <td>
                      <strong>{scopeLabel(template.scopeType)}</strong>
                      <small>{template.templateVersionCode || template.sourceOrganizationCode || template.unitCode}</small>
                    </td>
                    <td className="email-subject-cell">{template.subject}</td>
                    <td>{template.isDefault ? <span className="status-pill active">Default</span> : "-"}</td>
                    <td>
                      <span className={`status-pill ${template.isActive === false ? "inactive" : "active"}`}>
                        {template.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td>{formatDate(template.updatedAt)}</td>
                    <td>
                      <div className="table-action-group">
                        <button className="icon-button" type="button" onClick={() => openEditDrawer(template)} aria-label="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button className="secondary-button compact" type="button" onClick={() => void toggleActive(template)}>
                          {template.isActive === false ? "Activate" : "Deactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen ? (
        <div className="drawer-overlay">
          <form className="form-drawer email-template-drawer" onSubmit={submitTemplate}>
            <div className="drawer-header">
              <div>
                <span>Email Templates</span>
                <h3>{editingCode ? "Edit Template" : "Create Template"}</h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="drawer-form dispatch-drawer-form">
              <section>
                <h4>Template Details</h4>
                <div className="form-grid two">
                  <label>
                    Name
                    <input value={draft.template_name} onChange={(event) => setDraft({ ...draft, template_name: event.target.value })} required />
                  </label>
                  <label>
                    Code
                    <input value={draft.email_template_code ?? ""} onChange={(event) => setDraft({ ...draft, email_template_code: event.target.value })} placeholder="Auto generated when blank" />
                  </label>
                  <label>
                    Email type
                    <select value={draft.template_type} onChange={(event) => setDraft({ ...draft, template_type: event.target.value })}>
                      {TEMPLATE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </label>
                  <label>
                    Scope
                    <select value={draft.scope_type} onChange={(event) => setScope(event.target.value)}>
                      {SCOPES.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
                    </select>
                  </label>
                  {draft.scope_type === "TEMPLATE" ? (
                    <label>
                      Template version code
                      <input value={draft.template_version_code ?? ""} onChange={(event) => setDraft({ ...draft, template_version_code: event.target.value })} required />
                    </label>
                  ) : null}
                  {draft.scope_type === "SOURCE" ? (
                    <label>
                      Source organization code
                      <input value={draft.source_organization_code ?? ""} onChange={(event) => setDraft({ ...draft, source_organization_code: event.target.value })} required />
                    </label>
                  ) : null}
                </div>
                <div className="checkbox-row">
                  <label><input type="checkbox" checked={draft.is_default} onChange={(event) => setDraft({ ...draft, is_default: event.target.checked })} /> Default for this type/scope</label>
                  <label><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} /> Active</label>
                </div>
              </section>

              <section>
                <h4>Email Content</h4>
                <label>
                  Subject
                  <input value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} required />
                </label>
                <label>
                  Body
                  <textarea rows={11} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} required />
                </label>
              </section>

              <section>
                <h4>Variables</h4>
                <div className="variable-chip-grid">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <button key={variable} type="button" onClick={() => addVariable(variable, "body")}>
                      <Mail size={13} /> {`{${variable}}`}
                    </button>
                  ))}
                </div>
                <p className="field-help">
                  Click a variable to insert it into the body. These placeholders will later be replaced when the dispatch email is generated.
                </p>
              </section>
            </div>

            <div className="drawer-footer">
              <button className="secondary-button compact" type="button" onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button className="primary-button compact" disabled={isSaving} type="submit">
                <CheckCircle2 size={15} /> {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
