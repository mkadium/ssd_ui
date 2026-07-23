import { CalendarDays, CheckCircle2, Pencil, Play, Plus, RefreshCw, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createDefaultDispatchPlan,
  createDispatchRun,
  DispatchPlan,
  DispatchPlanPayload,
  DispatchRun,
  DispatchRunPayload,
  listDispatchPlans,
  listDispatchRuns,
  saveDispatchPlan,
  setDispatchPlanActive,
} from "../../api/requests.api";
import { getSelectedUnitCode } from "../../api/session.api";

const REPORTING_MODES = ["EXPANDING_RANGE", "FIXED_SET", "CONTRIBUTOR_SELECT", "REQUEST_CONFIGURABLE"];
const END_RULES = ["REQUEST_PERIOD", "FIXED_END", "MANUAL"];
const PLAN_STATUSES = ["DRAFT", "READY", "ACTIVE", "PAUSED", "ARCHIVED"];

function getText(value: unknown, fallback = "-") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getPlanCode(plan: DispatchPlan) {
  return getText(plan.dispatchPlanCode ?? (plan as Record<string, unknown>).dispatch_plan_code, "");
}

function getPlanName(plan: DispatchPlan) {
  return getText(plan.planName ?? plan.dispatchPlanName ?? (plan as Record<string, unknown>).plan_name, "Untitled plan");
}

function getPlanStatus(plan: DispatchPlan) {
  return getText(plan.status, "DRAFT");
}

function getPlanUnit(plan: DispatchPlan) {
  return getText(plan.unitCode ?? (plan as Record<string, unknown>).unit_code, getSelectedUnitCode());
}

function getPlanTemplate(plan: DispatchPlan) {
  return getText(plan.templateName ?? plan.templateVersionCode ?? (plan as Record<string, unknown>).template_version_code);
}

function getPlanIndicators(plan: DispatchPlan) {
  const value = plan.indicatorCodes ?? (plan as Record<string, unknown>).indicator_codes;
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function getSnapshotCount(plan: DispatchPlan) {
  const value = plan.providerGroupSnapshot ?? (plan as Record<string, unknown>).provider_group_snapshot;
  return Array.isArray(value) ? value.length : 0;
}

function getRunCode(run: DispatchRun) {
  return getText(run.dispatchRunCode ?? (run as Record<string, unknown>).dispatch_run_code, "");
}

function getRunLabel(run: DispatchRun) {
  return getText(run.requestPeriodLabel ?? run.requestPeriodCode ?? (run as Record<string, unknown>).request_period_code);
}

function toPlanPayload(plan: DispatchPlan | DispatchPlanPayload): DispatchPlanPayload {
  if ("plan_name" in plan) {
    return plan;
  }
  const providerSnapshot =
    plan.providerGroupSnapshot ?? (plan as Record<string, unknown>).provider_group_snapshot ?? [];
  return {
    dispatch_plan_code: getPlanCode(plan) || undefined,
    plan_name: getPlanName(plan),
    unit_code: getPlanUnit(plan),
    template_version_code: getText(plan.templateVersionCode ?? (plan as Record<string, unknown>).template_version_code, ""),
    dispatch_policy_code: (plan.dispatchPolicyCode ?? (plan as Record<string, unknown>).dispatch_policy_code ?? null) as string | null,
    indicator_codes: getPlanIndicators(plan),
    reporting_period_mode: getText(plan.reportingPeriodMode ?? (plan as Record<string, unknown>).reporting_period_mode, "EXPANDING_RANGE"),
    reporting_period_start_code: (plan.reportingPeriodStartCode ??
      (plan as Record<string, unknown>).reporting_period_start_code ??
      "") as string,
    reporting_period_end_rule: getText(
      plan.reportingPeriodEndRule ?? (plan as Record<string, unknown>).reporting_period_end_rule,
      "REQUEST_PERIOD",
    ),
    reporting_period_fixed_end_code: (plan.reportingPeriodFixedEndCode ??
      (plan as Record<string, unknown>).reporting_period_fixed_end_code ??
      null) as string | null,
    allow_request_period_adjustment: Boolean(
      plan.allowRequestPeriodAdjustment ?? (plan as Record<string, unknown>).allow_request_period_adjustment ?? true,
    ),
    allow_data_entry_period_adjustment: Boolean(
      plan.allowDataEntryPeriodAdjustment ?? (plan as Record<string, unknown>).allow_data_entry_period_adjustment ?? true,
    ),
    source_grouping_mode: getText(plan.sourceGroupingMode ?? (plan as Record<string, unknown>).source_grouping_mode, "MEASURE_PROVIDER"),
    recipient_rules: (plan.recipientRules ?? (plan as Record<string, unknown>).recipient_rules ?? {
      deriveFromMeasureProviders: true,
      allowAdditionalOfficers: true,
      officerRoles: ["TO", "CC", "BCC"],
    }) as Record<string, unknown>,
    provider_group_snapshot: Array.isArray(providerSnapshot) ? (providerSnapshot as Record<string, unknown>[]) : [],
    status: getPlanStatus(plan),
    is_active: Boolean(plan.isActive ?? (plan as Record<string, unknown>).is_active ?? true),
  };
}

function splitCodes(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function DispatchPlansPage() {
  const unitCode = getSelectedUnitCode();
  const [plans, setPlans] = useState<DispatchPlan[]>([]);
  const [runs, setRuns] = useState<DispatchRun[]>([]);
  const [selectedPlanCode, setSelectedPlanCode] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editingPlan, setEditingPlan] = useState<DispatchPlanPayload | null>(null);
  const [runDraft, setRunDraft] = useState<DispatchRunPayload | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => getPlanCode(plan) === selectedPlanCode) ?? plans[0],
    [plans, selectedPlanCode],
  );

  const selectedPlanRuns = useMemo(() => {
    const code = selectedPlan ? getPlanCode(selectedPlan) : "";
    return runs.filter((run) => getText(run.dispatchPlanCode ?? (run as Record<string, unknown>).dispatch_plan_code, "") === code);
  }, [runs, selectedPlan]);

  const filteredPlans = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return plans.filter((plan) => {
      const matchesSearch =
        !normalizedSearch ||
        getPlanName(plan).toLowerCase().includes(normalizedSearch) ||
        getPlanCode(plan).toLowerCase().includes(normalizedSearch) ||
        getPlanTemplate(plan).toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || getPlanStatus(plan) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  const stats = useMemo(() => {
    const active = plans.filter((plan) => plan.isActive !== false).length;
    const ready = plans.filter((plan) => ["READY", "ACTIVE"].includes(getPlanStatus(plan))).length;
    return {
      plans: plans.length,
      active,
      runs: runs.length,
      ready,
    };
  }, [plans, runs]);

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [planRows, runRows] = await Promise.all([
        listDispatchPlans({ unitCode, includeInactive: true, limit: 200 }),
        listDispatchRuns({ unitCode, limit: 200 }),
      ]);
      setPlans(planRows);
      setRuns(runRows);
      setSelectedPlanCode((current) => current || (planRows[0] ? getPlanCode(planRows[0]) : ""));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dispatch plans could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [unitCode]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function openNewPlan() {
    setEditingPlan(createDefaultDispatchPlan(unitCode));
  }

  function openEditPlan(plan: DispatchPlan) {
    setEditingPlan(toPlanPayload(plan));
  }

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPlan) return;
    setError("");
    try {
      const saved = await saveDispatchPlan(editingPlan.dispatch_plan_code, editingPlan);
      setPlans((current) => {
        const code = getPlanCode(saved);
        const exists = current.some((plan) => getPlanCode(plan) === code);
        return exists ? current.map((plan) => (getPlanCode(plan) === code ? saved : plan)) : [saved, ...current];
      });
      setSelectedPlanCode(getPlanCode(saved));
      setEditingPlan(null);
      setNotice("Dispatch plan saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dispatch plan could not be saved.");
    }
  }

  async function togglePlan(plan: DispatchPlan) {
    const code = getPlanCode(plan);
    if (!code) return;
    setError("");
    try {
      const saved = await setDispatchPlanActive(code, getPlanUnit(plan), !(plan.isActive ?? true), getPlanStatus(plan));
      setPlans((current) => current.map((item) => (getPlanCode(item) === code ? saved : item)));
      setNotice(saved.isActive === false ? "Dispatch plan deactivated." : "Dispatch plan activated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dispatch plan status could not be updated.");
    }
  }

  function openRunDrawer() {
    if (!selectedPlan) return;
    const year = String(new Date().getFullYear());
    setRunDraft({
      unit_code: getPlanUnit(selectedPlan),
      request_period_code: year,
      request_period_label: year,
      schedule_start_date: new Date().toISOString().slice(0, 10),
      due_date: null,
      run_metadata: { createdFromUi: true },
    });
  }

  async function submitRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan || !runDraft) return;
    const code = getPlanCode(selectedPlan);
    setError("");
    try {
      const saved = await createDispatchRun(code, runDraft);
      setRuns((current) => [saved, ...current.filter((run) => getRunCode(run) !== getRunCode(saved))]);
      setRunDraft(null);
      setNotice("Dispatch run created for the selected request period.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dispatch run could not be created.");
    }
  }

  const planReportingMode = selectedPlan
    ? getText(selectedPlan.reportingPeriodMode ?? (selectedPlan as Record<string, unknown>).reporting_period_mode, "EXPANDING_RANGE")
    : "-";
  const planStart = selectedPlan
    ? getText(selectedPlan.reportingPeriodStartCode ?? (selectedPlan as Record<string, unknown>).reporting_period_start_code, "Template default")
    : "-";
  const planEndRule = selectedPlan
    ? getText(selectedPlan.reportingPeriodEndRule ?? (selectedPlan as Record<string, unknown>).reporting_period_end_rule, "REQUEST_PERIOD")
    : "-";

  return (
    <section className="dispatch-plans-page">
      {notice ? <div className="toast-message success">{notice}</div> : null}
      {error ? <div className="toast-message error">{error}</div> : null}

      <div className="dispatch-plan-header-row">
        <div>
          <p className="page-kicker">Request Governance</p>
          <h1>Dispatch Plans</h1>
          <p className="page-subtitle">
            Reuse template, indicator, provider, and policy setup. Generate request runs for each request period.
          </p>
        </div>
        <div className="dispatch-plan-actions">
          <button className="secondary-button" type="button" onClick={() => void loadPage()}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="secondary-button" type="button" disabled={!selectedPlan} onClick={openRunDrawer}>
            <Play size={15} /> Create Run
          </button>
          <button className="primary-button" type="button" onClick={openNewPlan}>
            <Plus size={15} /> New Plan
          </button>
        </div>
      </div>

      <div className="dispatch-plan-kpis">
        <div className="dispatch-plan-kpi-card">
          <span>{stats.plans}</span>
          <small>Dispatch plans</small>
          <em>{unitCode}</em>
        </div>
        <div className="dispatch-plan-kpi-card">
          <span>{stats.active}</span>
          <small>Active plans</small>
          <em>Reusable</em>
        </div>
        <div className="dispatch-plan-kpi-card">
          <span>{stats.runs}</span>
          <small>Request runs</small>
          <em>Generated</em>
        </div>
        <div className="dispatch-plan-kpi-card">
          <span>{stats.ready}</span>
          <small>Ready plans</small>
          <em>Can run</em>
        </div>
      </div>

      <div className="dispatch-plan-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search plan, template, or code"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">All statuses</option>
          {PLAN_STATUSES.map((status) => (
            <option value={status} key={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="dispatch-plan-shell">
        <aside className="dispatch-plan-list-panel">
          <div className="dispatch-plan-panel-title">
            <span>Plan List</span>
            <strong>{filteredPlans.length}</strong>
          </div>
          <div className="dispatch-plan-list">
            {isLoading ? <p className="dispatch-plan-empty">Loading dispatch plans...</p> : null}
            {!isLoading && filteredPlans.length === 0 ? (
              <p className="dispatch-plan-empty">No dispatch plans match the selected filters.</p>
            ) : null}
            {filteredPlans.map((plan) => {
              const code = getPlanCode(plan);
              const active = selectedPlan && getPlanCode(selectedPlan) === code;
              return (
                <button
                  className={`dispatch-plan-card ${active ? "active" : ""}`}
                  key={code || getPlanName(plan)}
                  type="button"
                  onClick={() => setSelectedPlanCode(code)}
                >
                  <CalendarDays size={16} />
                  <span>
                    <strong>{getPlanName(plan)}</strong>
                    <small>{getPlanTemplate(plan)}</small>
                    <small className="dispatch-plan-code">{code || "Code pending"}</small>
                  </span>
                  <em className={`dispatch-plan-pill ${getPlanStatus(plan).toLowerCase()}`}>{getPlanStatus(plan)}</em>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="dispatch-plan-detail-panel">
          {selectedPlan ? (
            <>
              <div className="dispatch-plan-detail-header">
                <div>
                  <p className="page-kicker">Selected Plan</p>
                  <h2>{getPlanName(selectedPlan)}</h2>
                  <p>
                    {getPlanCode(selectedPlan)} | {getPlanTemplate(selectedPlan)}
                  </p>
                </div>
                <div className="dispatch-plan-detail-actions">
                  <span className={`dispatch-plan-pill ${getPlanStatus(selectedPlan).toLowerCase()}`}>
                    {getPlanStatus(selectedPlan)}
                  </span>
                  <button className="secondary-button" type="button" onClick={() => openEditPlan(selectedPlan)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="secondary-button" type="button" onClick={() => void togglePlan(selectedPlan)}>
                    {selectedPlan.isActive === false ? "Activate" : "Deactivate"}
                  </button>
                </div>
              </div>

              <div className="dispatch-plan-detail-scroll">
                <div className="dispatch-plan-info-grid">
                  <article className="dispatch-plan-section">
                    <p className="page-kicker">Request Period</p>
                    <h3>Reusable cycle behavior</h3>
                    <dl>
                      <div>
                        <dt>Reporting mode</dt>
                        <dd>{planReportingMode}</dd>
                      </div>
                      <div>
                        <dt>Start period</dt>
                        <dd>{planStart}</dd>
                      </div>
                      <div>
                        <dt>End rule</dt>
                        <dd>{planEndRule}</dd>
                      </div>
                      <div>
                        <dt>Data-entry adjustment</dt>
                        <dd>
                          {selectedPlan.allowDataEntryPeriodAdjustment ??
                          (selectedPlan as Record<string, unknown>).allow_data_entry_period_adjustment
                            ? "Allowed"
                            : "Locked"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                  <article className="dispatch-plan-section">
                    <p className="page-kicker">Provider Model</p>
                    <h3>Measure provider grouping</h3>
                    <dl>
                      <div>
                        <dt>Grouping</dt>
                        <dd>{getText(selectedPlan.sourceGroupingMode ?? (selectedPlan as Record<string, unknown>).source_grouping_mode, "MEASURE_PROVIDER")}</dd>
                      </div>
                      <div>
                        <dt>Provider snapshot</dt>
                        <dd>{getSnapshotCount(selectedPlan)} group(s)</dd>
                      </div>
                      <div>
                        <dt>Policy</dt>
                        <dd>{getText(selectedPlan.dispatchPolicyCode ?? (selectedPlan as Record<string, unknown>).dispatch_policy_code, "Effective default")}</dd>
                      </div>
                    </dl>
                  </article>
                </div>

                <article className="dispatch-plan-section">
                  <div className="dispatch-plan-section-header">
                    <div>
                      <p className="page-kicker">Indicators</p>
                      <h3>Template mapping carried into requests</h3>
                    </div>
                    <strong>{getPlanIndicators(selectedPlan).length}</strong>
                  </div>
                  <div className="dispatch-plan-chips">
                    {getPlanIndicators(selectedPlan).length ? (
                      getPlanIndicators(selectedPlan).map((indicator) => (
                        <span className="dispatch-plan-chip" key={indicator}>
                          {indicator}
                        </span>
                      ))
                    ) : (
                      <span className="dispatch-plan-muted">No indicators attached yet.</span>
                    )}
                  </div>
                </article>

                <article className="dispatch-plan-section">
                  <div className="dispatch-plan-section-header">
                    <div>
                      <p className="page-kicker">Runs</p>
                      <h3>Generated request cycles</h3>
                    </div>
                    <strong>{selectedPlanRuns.length}</strong>
                  </div>
                  <div className="dispatch-run-list">
                    {selectedPlanRuns.length ? (
                      selectedPlanRuns.map((run) => (
                        <div className="dispatch-run-card" key={getRunCode(run)}>
                          <CheckCircle2 size={16} />
                          <span>
                            <strong>{getRunCode(run) || getRunLabel(run)}</strong>
                            <small>
                              Request {getRunLabel(run)} | Reporting{" "}
                              {getText(run.reportingPeriodLabel ?? (run as Record<string, unknown>).reporting_period_label, "Derived")}
                            </small>
                          </span>
                          <em className={`dispatch-plan-pill ${getText(run.status, "DRAFT").toLowerCase()}`}>
                            {getText(run.status, "DRAFT")}
                          </em>
                        </div>
                      ))
                    ) : (
                      <p className="dispatch-plan-empty">No request runs generated for this plan yet.</p>
                    )}
                  </div>
                </article>
              </div>
            </>
          ) : (
            <p className="dispatch-plan-empty">Select or create a dispatch plan to continue.</p>
          )}
        </section>
      </div>

      {editingPlan ? (
        <div className="drawer-backdrop" role="presentation">
          <aside className="side-drawer dispatch-plan-drawer" aria-label="Dispatch plan form">
            <div className="drawer-header">
              <div>
                <p>{editingPlan.dispatch_plan_code ? "Edit" : "Create"}</p>
                <h2>Dispatch Plan</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setEditingPlan(null)}>
                <X size={18} />
              </button>
            </div>
            <form className="drawer-form" onSubmit={submitPlan}>
              <section className="form-section-card">
                <h3>Identity</h3>
                <label>
                  Plan name *
                  <input
                    required
                    value={editingPlan.plan_name}
                    onChange={(event) => setEditingPlan({ ...editingPlan, plan_name: event.target.value })}
                  />
                </label>
                <div className="form-grid two">
                  <label>
                    Plan code
                    <input
                      value={editingPlan.dispatch_plan_code ?? ""}
                      placeholder="Auto-generated if blank"
                      onChange={(event) =>
                        setEditingPlan({ ...editingPlan, dispatch_plan_code: event.target.value || undefined })
                      }
                    />
                  </label>
                  <label>
                    Unit
                    <input
                      value={editingPlan.unit_code}
                      onChange={(event) => setEditingPlan({ ...editingPlan, unit_code: event.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Published template version code *
                  <input
                    required
                    value={editingPlan.template_version_code}
                    placeholder="Example: TPL_NIF_1_2_1_UI_V1"
                    onChange={(event) =>
                      setEditingPlan({ ...editingPlan, template_version_code: event.target.value })
                    }
                  />
                </label>
                <label>
                  Indicator codes
                  <textarea
                    value={editingPlan.indicator_codes.join(", ")}
                    placeholder="Comma-separated indicator codes"
                    onChange={(event) =>
                      setEditingPlan({ ...editingPlan, indicator_codes: splitCodes(event.target.value) })
                    }
                  />
                </label>
              </section>

              <section className="form-section-card">
                <h3>Request period and reporting period</h3>
                <div className="form-grid two">
                  <label>
                    Reporting period mode
                    <select
                      value={editingPlan.reporting_period_mode}
                      onChange={(event) =>
                        setEditingPlan({ ...editingPlan, reporting_period_mode: event.target.value })
                      }
                    >
                      {REPORTING_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    End rule
                    <select
                      value={editingPlan.reporting_period_end_rule}
                      onChange={(event) =>
                        setEditingPlan({ ...editingPlan, reporting_period_end_rule: event.target.value })
                      }
                    >
                      {END_RULES.map((rule) => (
                        <option key={rule} value={rule}>
                          {rule}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="form-grid two">
                  <label>
                    Start period code
                    <input
                      value={editingPlan.reporting_period_start_code ?? ""}
                      placeholder="Example: CALENDAR_YEAR_2020"
                      onChange={(event) =>
                        setEditingPlan({ ...editingPlan, reporting_period_start_code: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Fixed end period
                    <input
                      disabled={editingPlan.reporting_period_end_rule !== "FIXED_END"}
                      value={editingPlan.reporting_period_fixed_end_code ?? ""}
                      placeholder="Only for FIXED_END"
                      onChange={(event) =>
                        setEditingPlan({ ...editingPlan, reporting_period_fixed_end_code: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="form-grid two">
                  <label className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={editingPlan.allow_request_period_adjustment}
                      onChange={(event) =>
                        setEditingPlan({ ...editingPlan, allow_request_period_adjustment: event.target.checked })
                      }
                    />
                    Request-period adjustment
                  </label>
                  <label className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={editingPlan.allow_data_entry_period_adjustment}
                      onChange={(event) =>
                        setEditingPlan({ ...editingPlan, allow_data_entry_period_adjustment: event.target.checked })
                      }
                    />
                    Data-entry period adjustment
                  </label>
                </div>
              </section>

              <section className="form-section-card">
                <h3>Recipients and policy</h3>
                <div className="form-grid two">
                  <label>
                    Dispatch policy code
                    <input
                      value={editingPlan.dispatch_policy_code ?? ""}
                      placeholder="Blank uses effective default"
                      onChange={(event) =>
                        setEditingPlan({ ...editingPlan, dispatch_policy_code: event.target.value || null })
                      }
                    />
                  </label>
                  <label>
                    Source grouping mode
                    <select
                      value={editingPlan.source_grouping_mode}
                      onChange={(event) => setEditingPlan({ ...editingPlan, source_grouping_mode: event.target.value })}
                    >
                      <option value="MEASURE_PROVIDER">MEASURE_PROVIDER</option>
                      <option value="TEMPLATE_SOURCE">TEMPLATE_SOURCE</option>
                    </select>
                  </label>
                </div>
                <div className="form-grid two">
                  <label>
                    Status
                    <select
                      value={editingPlan.status}
                      onChange={(event) => setEditingPlan({ ...editingPlan, status: event.target.value })}
                    >
                      {PLAN_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={editingPlan.is_active}
                      onChange={(event) => setEditingPlan({ ...editingPlan, is_active: event.target.checked })}
                    />
                    Active
                  </label>
                </div>
              </section>
              <div className="drawer-footer">
                <button type="button" className="secondary-button" onClick={() => setEditingPlan(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Plan
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}

      {runDraft ? (
        <div className="drawer-backdrop" role="presentation">
          <aside className="side-drawer dispatch-plan-drawer" aria-label="Dispatch run form">
            <div className="drawer-header">
              <div>
                <p>Create</p>
                <h2>Dispatch Run</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setRunDraft(null)}>
                <X size={18} />
              </button>
            </div>
            <form className="drawer-form" onSubmit={submitRun}>
              <section className="form-section-card">
                <h3>Request cycle</h3>
                <label>
                  Request period code *
                  <input
                    required
                    value={runDraft.request_period_code}
                    placeholder="Example: 2026"
                    onChange={(event) => {
                      const value = event.target.value;
                      setRunDraft({ ...runDraft, request_period_code: value, request_period_label: value });
                    }}
                  />
                </label>
                <label>
                  Request period label
                  <input
                    value={runDraft.request_period_label ?? ""}
                    placeholder="Displayed request cycle label"
                    onChange={(event) => setRunDraft({ ...runDraft, request_period_label: event.target.value })}
                  />
                </label>
                <div className="form-note">
                  Reporting period is generated from the selected plan. EXPANDING_RANGE means start period through the
                  request period.
                </div>
              </section>
              <section className="form-section-card">
                <h3>Schedule</h3>
                <div className="form-grid two">
                  <label>
                    Start date
                    <input
                      type="date"
                      value={runDraft.schedule_start_date ?? ""}
                      onChange={(event) =>
                        setRunDraft({ ...runDraft, schedule_start_date: event.target.value || null })
                      }
                    />
                  </label>
                  <label>
                    Due date
                    <input
                      type="date"
                      value={runDraft.due_date ?? ""}
                      onChange={(event) => setRunDraft({ ...runDraft, due_date: event.target.value || null })}
                    />
                  </label>
                </div>
              </section>
              <div className="drawer-footer">
                <button type="button" className="secondary-button" onClick={() => setRunDraft(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Create Run
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
