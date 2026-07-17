import { ClipboardCheck, Edit3, Plus, RefreshCw, Search, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  createAuthReviewLevel,
  createAuthReviewWorkflow,
  listAuthReviewWorkflows,
  listAuthUnits,
  listAuthUsers,
  updateAuthReviewLevel,
  updateAuthReviewWorkflow,
  type AuthReviewWorkflowLevel,
  type AuthReviewWorkflow,
  type AuthUnit,
  type AuthUser,
} from "../../api/auth-admin.api";
import { LOCALE_CHANGED_EVENT } from "../../api/session.api";

type ReviewAssignmentRow = {
  username: string;
  displayName: string;
  workflowCode: string;
  levelCode: string;
  levelName: string;
  levelNumber?: number;
  unitCode: string;
  roleCode: string;
  isActive: boolean;
};

type ReviewDrawerState =
  | { mode: "workflow-create" }
  | { mode: "workflow-edit"; workflow: AuthReviewWorkflow }
  | { mode: "level-create"; workflow: AuthReviewWorkflow }
  | { mode: "level-edit"; workflow: AuthReviewWorkflow; level: AuthReviewWorkflowLevel }
  | null;

export function ReviewWorkflowPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [units, setUnits] = useState<AuthUnit[]>([]);
  const [workflows, setWorkflows] = useState<AuthReviewWorkflow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [drawer, setDrawer] = useState<ReviewDrawerState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const assignments = useMemo(() => buildReviewAssignments(users), [users]);
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const unitMatches = unitFilter === "ALL" || assignment.unitCode === unitFilter;
      const statusMatches = statusFilter === "ALL" || assignment.isActive === (statusFilter === "ACTIVE");
      return (
        unitMatches &&
        statusMatches &&
        matchesSearch(
          searchText,
          assignment.username,
          assignment.displayName,
          assignment.workflowCode,
          assignment.levelCode,
          assignment.levelName,
          assignment.roleCode,
        )
      );
    });
  }, [assignments, searchText, statusFilter, unitFilter]);

  useEffect(() => {
    void loadReviewContext();
  }, []);

  useEffect(() => {
    const handleLocaleChange = () => void loadReviewContext();
    window.addEventListener(LOCALE_CHANGED_EVENT, handleLocaleChange);
    return () => window.removeEventListener(LOCALE_CHANGED_EVENT, handleLocaleChange);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function loadReviewContext(): Promise<void> {
    setIsLoading(true);
    setError("");
    try {
      const [userList, unitList, workflowList] = await Promise.all([
        listAuthUsers({ includeInactive: true }),
        listAuthUnits(true),
        listAuthReviewWorkflows(true),
      ]);
      setUsers(userList);
      setUnits(unitList);
      setWorkflows(workflowList);
      setNotice("Review workflow context refreshed.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Review workflow context could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDrawerSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!drawer) return;
    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    setError("");
    try {
      if (drawer.mode === "workflow-create" || drawer.mode === "workflow-edit") {
        const payload = {
          unit_code: String(form.get("unit_code") ?? ""),
          workflow_code: normalizeCode(String(form.get("workflow_code") ?? "")),
          workflow_name: String(form.get("workflow_name") ?? "").trim(),
          is_active: form.get("is_active") === "on",
        };
        if (drawer.mode === "workflow-create") {
          await createAuthReviewWorkflow(payload);
          setNotice(`${payload.workflow_code} workflow created.`);
        } else {
          await updateAuthReviewWorkflow(drawer.workflow.workflow_code, payload);
          setNotice(`${payload.workflow_code} workflow updated.`);
        }
      }
      if (drawer.mode === "level-create" || drawer.mode === "level-edit") {
        const payload = {
          level_code: normalizeCode(String(form.get("level_code") ?? "")),
          level_number: Number(form.get("level_number") ?? 1),
          level_name: String(form.get("level_name") ?? "").trim(),
          is_final_level: form.get("is_final_level") === "on",
          is_active: form.get("is_active") === "on",
        };
        if (drawer.mode === "level-create") {
          await createAuthReviewLevel(drawer.workflow.workflow_code, payload);
          setNotice(`${payload.level_code} level created.`);
        } else {
          await updateAuthReviewLevel(drawer.workflow.workflow_code, drawer.level.level_code ?? "", payload);
          setNotice(`${payload.level_code} level updated.`);
        }
      }
      setDrawer(null);
      await loadReviewContext();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Review workflow request could not be completed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="workflow-page">
      <div className="breadcrumb">Home / Authentication / Review Workflow</div>
      <section className="page-heading-row">
        <div>
          <h2>Review Workflow</h2>
          <p>Monitor configured review workflows, dynamic levels, and reviewer assignments by unit.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={() => void loadReviewContext()}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={() => setDrawer({ mode: "workflow-create" })}>
            <Plus size={14} />
            New Workflow
          </button>
        </div>
      </section>

      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four">
        <MetricCard label="Assignments" sublabel="Reviewer mapping" value={assignments.length} />
        <MetricCard label="Units" sublabel="Review scope" value={units.length} />
        <MetricCard label="Workflows" sublabel="From API contract" value={workflows.length} />
        <MetricCard label="API mode" sublabel="Read endpoints active" value="Read" />
      </section>

      <section className="toolbar-panel user-toolbar-panel">
        <div className="input-shell">
          <Search size={15} />
          <input onChange={(event) => setSearchText(event.target.value)} placeholder="Search reviewer, workflow, level, or role" value={searchText} />
        </div>
        <select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} aria-label="Unit">
          <option value="ALL">All units</option>
          {units.map((unit) => <option key={unit.unit_code} value={unit.unit_code}>{unit.unit_code}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status">
          <option value="ACTIVE">Active</option>
          <option value="ALL">All statuses</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </section>

      <section className="auth-review-layout">
        <div className="table-wrap user-table-wrap">
          {isLoading ? <div className="empty-state">Loading review workflows...</div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Unit</th>
                  <th>Levels</th>
                  <th>Final Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {workflows
                  .filter((workflow) => unitFilter === "ALL" || workflow.unit_code === unitFilter)
                  .filter((workflow) => statusFilter === "ALL" || (workflow.is_active !== false) === (statusFilter === "ACTIVE"))
                  .filter((workflow) => matchesSearch(searchText, workflow.workflow_code, workflow.workflow_name, workflow.unit_code))
                  .map((workflow) => (
                  <tr key={`${workflow.unit_code}-${workflow.workflow_code}`}>
                    <td><div className="stacked-cell"><strong>{workflow.workflow_name || workflow.workflow_code}</strong><span>{workflow.workflow_code}</span></div></td>
                    <td>{workflow.unit_code || "-"}</td>
                    <td>
                      <div className="review-level-pill-row">
                        {(workflow.levels ?? []).map((level) => (
                          <button
                            className="mini-pill mini-pill-button"
                            key={level.level_code}
                            type="button"
                            onClick={() => setDrawer({ mode: "level-edit", workflow, level })}
                          >
                            {level.level_number}. {level.level_name || level.level_code}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>{(workflow.levels ?? []).find((level) => level.is_final_level)?.level_name ?? "-"}</td>
                    <td><span className={`status-badge ${workflow.is_active !== false ? "active" : "inactive"}`}>{workflow.is_active !== false ? "Active" : "Inactive"}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-action-button" type="button" onClick={() => setDrawer({ mode: "workflow-edit", workflow })}>
                          <Edit3 size={12} />
                          Edit
                        </button>
                        <button className="icon-action-button" type="button" onClick={() => setDrawer({ mode: "level-create", workflow })}>
                          <Plus size={12} />
                          Level
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="api-readiness-panel">
          <div className="api-readiness-header">
            <ClipboardCheck size={18} />
            <div>
              <h3>Reviewer Assignment Monitor</h3>
              <p>Current user-to-level assignments.</p>
            </div>
          </div>
          <div className="review-assignment-list">
            {filteredAssignments.slice(0, 10).map((assignment) => (
              <div className="review-assignment-card" key={`${assignment.workflowCode}-${assignment.levelCode}-${assignment.username}`}>
                <strong>{assignment.displayName}</strong>
                <span>{assignment.workflowCode} / {assignment.levelName || assignment.levelCode}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
      {drawer && (
        <ReviewWorkflowDrawer
          drawer={drawer}
          isSaving={isSaving}
          onClose={() => setDrawer(null)}
          onSubmit={handleDrawerSubmit}
          units={units}
        />
      )}
    </div>
  );
}

function ReviewWorkflowDrawer({ drawer, isSaving, onClose, onSubmit, units }: {
  drawer: Exclude<ReviewDrawerState, null>;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  units: AuthUnit[];
}) {
  const workflow = drawer.mode !== "workflow-create" ? drawer.workflow : undefined;
  const level = drawer.mode === "level-edit" ? drawer.level : undefined;
  const isWorkflowMode = drawer.mode === "workflow-create" || drawer.mode === "workflow-edit";
  return (
    <div className="drawer-backdrop">
      <aside className="side-drawer">
        <div className="drawer-header">
          <div>
            <span className="eyebrow">{drawer.mode.replace("-", " ")}</span>
            <h3>{isWorkflowMode ? "Review Workflow" : "Review Level"}</h3>
          </div>
          <button className="icon-action" type="button" onClick={onClose} aria-label="Close drawer"><X size={16} /></button>
        </div>
        <form className="drawer-form" onSubmit={onSubmit}>
          {isWorkflowMode ? (
            <>
              <label className="form-field">Unit scope
                <select name="unit_code" defaultValue={workflow?.unit_code ?? units[0]?.unit_code ?? ""} required>
                  {units.map((unit) => <option key={unit.unit_code} value={unit.unit_code}>{unit.unit_name || unit.unit_code}</option>)}
                </select>
              </label>
              <label className="form-field">Workflow code
                <input name="workflow_code" defaultValue={workflow?.workflow_code ?? "REVIEW_WORKFLOW"} required pattern="[A-Z0-9_\\-]+" />
              </label>
              <label className="form-field">Workflow name
                <input name="workflow_name" defaultValue={workflow?.workflow_name ?? ""} required />
              </label>
              <label className="checkbox-card"><input name="is_active" type="checkbox" defaultChecked={workflow?.is_active ?? true} /> Active workflow</label>
            </>
          ) : (
            <>
              <div className="form-help">Level belongs to workflow <strong>{workflow?.workflow_code}</strong>.</div>
              <label className="form-field">Level number
                <input name="level_number" type="number" min={1} max={50} defaultValue={level?.level_number ?? ((workflow?.levels?.length ?? 0) + 1)} required />
              </label>
              <label className="form-field">Level code
                <input name="level_code" defaultValue={level?.level_code ?? `LEVEL_${(workflow?.levels?.length ?? 0) + 1}`} required pattern="[A-Z0-9_\\-]+" />
              </label>
              <label className="form-field">Level name
                <input name="level_name" defaultValue={level?.level_name ?? ""} required />
              </label>
              <label className="checkbox-card"><input name="is_final_level" type="checkbox" defaultChecked={level?.is_final_level ?? false} /> Final approval level</label>
              <label className="checkbox-card"><input name="is_active" type="checkbox" defaultChecked={level?.is_active ?? true} /> Active level</label>
            </>
          )}
          <div className="drawer-footer">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" disabled={isSaving} type="submit">Save</button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function buildReviewAssignments(users: AuthUser[]): ReviewAssignmentRow[] {
  return users.flatMap((user) =>
    (user.review_levels ?? []).map((level) => ({
      username: user.username,
      displayName: user.display_name || user.username,
      workflowCode: level.workflow_code || "UNMAPPED_WORKFLOW",
      levelCode: level.level_code || "UNMAPPED_LEVEL",
      levelName: level.level_name || "",
      levelNumber: level.level_number,
      unitCode: level.unit_code || "GLOBAL",
      roleCode: level.role_code || "",
      isActive: level.is_active !== false,
    })),
  );
}

function matchesSearch(searchText: string, ...values: Array<string | number | undefined | null>): boolean {
  if (!searchText.trim()) return true;
  const normalizedSearch = searchText.trim().toLowerCase();
  return values.some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
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
