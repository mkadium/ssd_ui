import { Edit3, Plus, RefreshCcw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createDefaultNotificationRule,
  listEmailTemplates,
  listNotificationReceiverGroups,
  listNotificationRules,
  NotificationRule,
  NotificationRulePayload,
  NotificationReceiverGroup,
  saveNotificationRule,
  setNotificationRuleActive,
  EmailTemplate,
} from "../../api/requests.api";
import { getSelectedUnitCode } from "../../api/session.api";

const ACTIONS = [
  ["SEND_REQUEST", "Send request"],
  ["FIRST_REMINDER", "First reminder"],
  ["DUE_DATE_REMINDER", "Due date reminder"],
  ["OVERDUE_ALERT", "Overdue alert"],
  ["ESCALATION", "Escalation"],
  ["SUBMITTED_FOR_REVIEW", "Submitted for review"],
  ["REVIEW_APPROVED", "Review approved"],
  ["REVIEW_REJECTED", "Review rejected"],
  ["RESENT_FOR_SUBMISSION", "Resent for submission"],
  ["RESUBMITTED_FOR_REVIEW", "Resubmitted for review"],
  ["PUBLISHED", "Published"],
];

function labelFor(value?: string) {
  return ACTIONS.find(([code]) => code === value)?.[1] ?? value ?? "-";
}

function groupLabel(groups: NotificationReceiverGroup[], code: string) {
  return groups.find((group) => group.receiverGroupCode === code)?.groupName ?? code;
}

function ruleToPayload(rule: NotificationRule): NotificationRulePayload {
  return {
    notification_rule_code: rule.notificationRuleCode,
    rule_name: rule.ruleName ?? "",
    action_code: rule.actionCode ?? "SEND_REQUEST",
    unit_code: rule.unitCode ?? getSelectedUnitCode(),
    scope_type: rule.scopeType ?? "GLOBAL",
    template_version_code: rule.scopeType === "TEMPLATE" ? rule.templateVersionCode ?? "" : null,
    source_organization_code: rule.scopeType === "SOURCE" ? rule.sourceOrganizationCode ?? "" : null,
    email_template_code: rule.emailTemplateCode ?? null,
    template_type: rule.templateType ?? rule.actionCode ?? "SEND_REQUEST",
    sender_type: rule.senderType ?? "SYSTEM_MAILBOX",
    sender_email: rule.senderEmail ?? null,
    receiver_rules: rule.receiverRules ?? { to: ["SOURCE_OFFICERS"], cc: [], bcc: [] },
    trigger_rules: rule.triggerRules ?? {},
    applies_to_statuses: rule.appliesToStatuses ?? [],
    approval_level: rule.approvalLevel ?? null,
    sort_order: rule.sortOrder ?? 0,
    is_default: rule.isDefault ?? false,
    is_active: rule.isActive ?? true,
  };
}

function joinGroups(groups?: string[]) {
  return groups?.length ? groups.join(", ") : "-";
}

function triggerSummary(rule: NotificationRule) {
  const triggerRules = rule.triggerRules ?? {};
  const trigger = String(triggerRules.trigger ?? "").toUpperCase();
  if (trigger === "MANUAL_SEND") return "When officer request is sent manually";
  if (trigger === "ON_DUE_DATE") return "On the due date";
  if (trigger === "DAYS_BEFORE_DUE") return `${triggerRules.daysBeforeDue ?? 0} day(s) before due date`;
  if (trigger === "DAYS_AFTER_DUE") return `${triggerRules.daysAfterDue ?? 0} day(s) after due date`;
  if (trigger === "ON_STATUS_CHANGE") {
    const action = String(rule.actionCode ?? "");
    if (action === "SUBMITTED_FOR_REVIEW") return "When ministry submits data for review";
    if (action === "RESUBMITTED_FOR_REVIEW") return "When ministry resubmits after revision";
    if (action === "REVIEW_APPROVED") return rule.approvalLevel ? `When review level ${rule.approvalLevel} approves` : "When an approval level approves";
    if (action === "REVIEW_REJECTED") return "When reviewer sends back for correction";
    if (action === "RESENT_FOR_SUBMISSION") return "When reviewer requests resubmission";
    if (action === "PUBLISHED") return "When approved data is published";
    return "When request status changes";
  }
  return trigger ? trigger.replace(/_/g, " ").toLowerCase() : "Configured by backend";
}

export function NotificationRulesPage() {
  const unitCode = getSelectedUnitCode();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [receiverGroups, setReceiverGroups] = useState<NotificationReceiverGroup[]>([]);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | undefined>();
  const [draft, setDraft] = useState<NotificationRulePayload>(createDefaultNotificationRule(unitCode));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadRules() {
    setIsLoading(true);
    setError("");
    try {
      const [ruleRows, templateRows, groupRows] = await Promise.all([
        listNotificationRules({ unitCode, includeInactive: true, limit: 500 }),
        listEmailTemplates({ unitCode, includeInactive: true, limit: 500 }),
        listNotificationReceiverGroups(),
      ]);
      setRules(ruleRows);
      setTemplates(templateRows);
      setReceiverGroups(groupRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notification rules.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRules();
  }, []);

  const filteredRules = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rules.filter((rule) => {
      const haystack = [rule.notificationRuleCode, rule.ruleName, rule.actionCode, rule.emailTemplateCode, rule.senderType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (!needle || haystack.includes(needle)) && (actionFilter === "ALL" || rule.actionCode === actionFilter);
    });
  }, [actionFilter, query, rules]);

  function openCreate() {
    setEditingCode(undefined);
    setDraft(createDefaultNotificationRule(unitCode));
    setDrawerOpen(true);
  }

  function openEdit(rule: NotificationRule) {
    setEditingCode(rule.notificationRuleCode);
    setDraft(ruleToPayload(rule));
    setDrawerOpen(true);
  }

  function setAction(actionCode: string) {
    setDraft((current) => ({
      ...current,
      action_code: actionCode,
      template_type: actionCode,
      trigger_rules:
        actionCode === "SEND_REQUEST"
          ? { trigger: "MANUAL_SEND" }
          : actionCode === "DUE_DATE_REMINDER"
            ? { trigger: "ON_DUE_DATE" }
            : actionCode.includes("REMINDER")
              ? { trigger: "DAYS_BEFORE_DUE", daysBeforeDue: 7 }
              : actionCode === "OVERDUE_ALERT" || actionCode === "ESCALATION"
                ? { trigger: "DAYS_AFTER_DUE", daysAfterDue: actionCode === "ESCALATION" ? 7 : 1 }
                : { trigger: "ON_STATUS_CHANGE" },
    }));
  }

  function setReceiver(bucket: "to" | "cc" | "bcc", group: string, checked: boolean) {
    setDraft((current) => {
      const currentGroups = current.receiver_rules[bucket] ?? [];
      return {
        ...current,
        receiver_rules: {
          ...current.receiver_rules,
          [bucket]: checked ? Array.from(new Set([...currentGroups, group])) : currentGroups.filter((item) => item !== group),
        },
      };
    });
  }

  async function submitRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!draft.rule_name.trim()) {
      setError("Rule name is required.");
      return;
    }
    setIsSaving(true);
    try {
      await saveNotificationRule(editingCode, draft);
      setDrawerOpen(false);
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save notification rule.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleRule(rule: NotificationRule) {
    if (!rule.notificationRuleCode) return;
    await setNotificationRuleActive(rule.notificationRuleCode, rule.unitCode ?? unitCode, rule.isActive === false);
    await loadRules();
  }

  return (
    <div className="email-templates-page content-stack">
      <div className="page-heading-row">
        <div>
          <span className="section-kicker">Request Dispatch</span>
          <h1>Notification Rules</h1>
          <p>Configure which email template is used for each action, sender, receiver groups, timing, and approval level.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button compact" type="button" onClick={() => void loadRules()}><RefreshCcw size={15} /> Refresh</button>
          <button className="primary-button compact" type="button" onClick={openCreate}><Plus size={15} /> Create Rule</button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="dispatch-filter-row">
        <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rule, action, sender, template" /></label>
        <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
          <option value="ALL">All actions</option>
          {ACTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value="ALL" disabled><option>All statuses</option></select>
      </div>

      <div className="master-table-card">
        <div className="table-section-heading email-template-table-heading"><strong>Notification rule library</strong><span>{filteredRules.length} shown</span></div>
        <div className="master-table-wrap">
          <table className="data-table">
            <thead><tr><th>Rule</th><th>Action</th><th>Template</th><th>Sender</th><th>Receivers</th><th>Trigger</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={8}>Loading notification rules...</td></tr> : filteredRules.map((rule) => (
                <tr key={rule.notificationRuleCode}>
                  <td><strong>{rule.ruleName}</strong><small>{rule.notificationRuleCode}</small></td>
                  <td>{labelFor(rule.actionCode)}</td>
                  <td><strong>{rule.emailTemplateCode || "Default by type"}</strong><small>{labelFor(rule.templateType)}</small></td>
                  <td><strong>{rule.senderType}</strong><small>{rule.senderEmail || "System configured"}</small></td>
                  <td>
                    <small>TO: {joinGroups(rule.receiverRules?.to?.map((group) => groupLabel(receiverGroups, group)))}</small>
                    <small>CC: {joinGroups(rule.receiverRules?.cc?.map((group) => groupLabel(receiverGroups, group)))}</small>
                  </td>
                  <td><small>{triggerSummary(rule)}</small></td>
                  <td><span className={`status-pill ${rule.isActive === false ? "inactive" : "active"}`}>{rule.isActive === false ? "Inactive" : "Active"}</span></td>
                  <td><div className="table-action-group"><button className="icon-button" type="button" onClick={() => openEdit(rule)}><Edit3 size={15} /></button><button className="secondary-button compact" type="button" onClick={() => void toggleRule(rule)}>{rule.isActive === false ? "Activate" : "Deactivate"}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen ? (
        <div className="drawer-overlay">
          <form className="form-drawer email-template-drawer" onSubmit={submitRule}>
            <div className="drawer-header">
              <div><span>Notification Rules</span><h3>{editingCode ? "Edit Rule" : "Create Rule"}</h3></div>
              <button className="icon-button" type="button" onClick={() => setDrawerOpen(false)}><X size={18} /></button>
            </div>
            <div className="drawer-form dispatch-drawer-form">
              <section>
                <h4>Action Mapping</h4>
                <div className="form-grid two">
                  <label>Rule name<input value={draft.rule_name} onChange={(event) => setDraft({ ...draft, rule_name: event.target.value })} required /></label>
                  <label>Action<select value={draft.action_code} onChange={(event) => setAction(event.target.value)}>{ACTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label>Email template<select value={draft.email_template_code ?? ""} onChange={(event) => setDraft({ ...draft, email_template_code: event.target.value || null })}><option value="">Default active template by type</option>{templates.filter((template) => template.templateType === draft.template_type).map((template) => <option key={template.emailTemplateCode} value={template.emailTemplateCode}>{template.templateName}</option>)}</select></label>
                  <label>Approval level<input type="number" min="1" value={draft.approval_level ?? ""} onChange={(event) => setDraft({ ...draft, approval_level: event.target.value ? Number(event.target.value) : null })} placeholder="Only for review/approval" /></label>
                </div>
              </section>
              <section>
                <h4>Sender</h4>
                <div className="form-grid two">
                  <label>Sender type<select value={draft.sender_type} onChange={(event) => setDraft({ ...draft, sender_type: event.target.value })}><option value="SYSTEM_MAILBOX">System mailbox</option><option value="CURRENT_USER">Current user</option><option value="SOURCE_MAILBOX">Source mailbox</option><option value="CUSTOM_EMAIL">Custom email</option></select></label>
                  <label>Sender email<input type="email" value={draft.sender_email ?? ""} onChange={(event) => setDraft({ ...draft, sender_email: event.target.value || null })} placeholder="Required for custom email" /></label>
                </div>
              </section>
              <section>
                <h4>Receivers</h4>
                {(["to", "cc", "bcc"] as const).map((bucket) => (
                  <div className="receiver-rule-row" key={bucket}>
                    <strong>{bucket.toUpperCase()}</strong>
                    <div className="variable-chip-grid">
                      {receiverGroups.map((group) => (
                        <label key={`${bucket}-${group.receiverGroupCode}`} title={group.description ?? ""}>
                          <input
                            type="checkbox"
                            checked={(draft.receiver_rules[bucket] ?? []).includes(group.receiverGroupCode ?? "")}
                            onChange={(event) => setReceiver(bucket, group.receiverGroupCode ?? "", event.target.checked)}
                          />
                          {group.groupName ?? group.receiverGroupCode}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </div>
            <div className="drawer-footer"><button className="secondary-button compact" type="button" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="primary-button compact" disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save"}</button></div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
