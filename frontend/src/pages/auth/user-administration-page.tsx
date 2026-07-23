import { KeyRound, Plus, RefreshCw, Search, ShieldCheck, UserCog, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  assignAuthUserRole,
  assignAuthUserReviewLevel,
  createAuthUser,
  deactivateAuthUser,
  getAuthUser,
  listAuthRoles,
  listAuthReviewWorkflows,
  listAuthUnits,
  listAuthUsers,
  removeAuthUserReviewLevel,
  revokeAuthUserRole,
  setAuthUserPassword,
  updateAuthUser,
  type AuthReviewWorkflow,
  type AuthRole,
  type AuthUnit,
  type AuthUser,
  type AuthUserRoleAssignment,
} from "../../api/auth-admin.api";
import { LOCALE_CHANGED_EVENT } from "../../api/session.api";
import { Loader } from "../../components/common/loader";

type UserDrawerState =
  | { mode: "create" }
  | { mode: "edit"; user: AuthUser }
  | { mode: "password"; user: AuthUser }
  | { mode: "assign-role"; user: AuthUser }
  | { mode: "assign-review-level"; user: AuthUser }
  | null;

export function UserAdministrationPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [units, setUnits] = useState<AuthUnit[]>([]);
  const [reviewWorkflows, setReviewWorkflows] = useState<AuthReviewWorkflow[]>([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [drawer, setDrawer] = useState<UserDrawerState>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => user.username === selectedUsername) ?? users[0],
    [selectedUsername, users],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const statusMatches = statusFilter === "ALL" || Boolean(user.is_active ?? true) === (statusFilter === "ACTIVE");
      const roleMatches = roleFilter === "ALL" || getUserRoles(user).some((role) => role.role_code === roleFilter);
      const unitMatches = unitFilter === "ALL" || getUserRoles(user).some((role) => role.unit_code === unitFilter);
      return (
        statusMatches &&
        roleMatches &&
        unitMatches &&
        matchesSearch(searchText, user.username, user.email, user.display_name, user.first_name, user.last_name)
      );
    });
  }, [roleFilter, searchText, statusFilter, unitFilter, users]);

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    const handleLocaleChange = () => void loadUsers();
    window.addEventListener(LOCALE_CHANGED_EVENT, handleLocaleChange);
    return () => window.removeEventListener(LOCALE_CHANGED_EVENT, handleLocaleChange);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function loadUsers(nextUsername = selectedUsername): Promise<void> {
    setIsLoading(true);
    setError("");
    try {
      const [userList, roleList, unitList, workflowList] = await Promise.all([
        listAuthUsers({ includeInactive: true }),
        listAuthRoles(true),
        listAuthUnits(true),
        listAuthReviewWorkflows(true),
      ]);
      setUsers(userList);
      setRoles(roleList);
      setUnits(unitList);
      setReviewWorkflows(workflowList);
      const nextUser = userList.find((user) => user.username === nextUsername) ?? userList[0] ?? null;
      setSelectedUsername(nextUser?.username ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Users could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeactivateUser(username: string): Promise<void> {
    if (!window.confirm(`Deactivate user ${username}? Active sessions will be closed.`)) return;
    setIsSaving(true);
    setError("");
    try {
      await deactivateAuthUser(username);
      await loadUsers(username);
      setNotice(`${username} deactivated.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "User could not be deactivated.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRevokeRole(assignment: AuthUserRoleAssignment): Promise<void> {
    if (!selectedUser || !assignment.role_code) return;
    setIsSaving(true);
    setError("");
    try {
      await revokeAuthUserRole(selectedUser.username, assignment.role_code, assignment.unit_code);
      await loadUsers(selectedUser.username);
      setNotice(`${assignment.role_code} revoked from ${selectedUser.username}.`);
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Role assignment could not be revoked.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveReviewLevel(level: NonNullable<AuthUser["review_levels"]>[number]): Promise<void> {
    if (!selectedUser || !level.workflow_code || !level.level_code) return;
    setIsSaving(true);
    setError("");
    try {
      await removeAuthUserReviewLevel(selectedUser.username, {
        workflow_code: level.workflow_code,
        level_code: level.level_code,
      });
      await loadUsers(selectedUser.username);
      setNotice(`${level.level_code} removed from ${selectedUser.username}.`);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Review level assignment could not be removed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDrawerSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!drawer) return;
    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    setError("");
    try {
      if (drawer.mode === "create") {
        const username = normalizeCode(String(form.get("username") ?? ""));
        const email = String(form.get("email") ?? "").trim().toLowerCase();
        const initialPassword = String(form.get("new_password") ?? "");
        const duplicateUser = users.find((user) => user.username.toLowerCase() === username.toLowerCase());
        const duplicateEmail = users.find((user) => String(user.email ?? "").toLowerCase() === email);
        if (duplicateUser) {
          throw new Error(`Username "${username}" already exists. Use a different username.`);
        }
        if (duplicateEmail) {
          throw new Error(`Email "${email}" already exists. Use a different email address.`);
        }
        await createAuthUser({
          username,
          email,
          first_name: optionalString(form.get("first_name")),
          last_name: optionalString(form.get("last_name")),
          display_name: optionalString(form.get("display_name")),
          mobile_number: optionalString(form.get("mobile_number")),
          preferred_language_code: String(form.get("preferred_language_code") ?? "en-IN"),
          is_active: form.get("is_active") === "on",
          is_system_user: form.get("is_system_user") === "on",
          password_hash: `PASSWORD_SETUP_PENDING_${Date.now()}`,
        });
        if (initialPassword) {
          await setAuthUserPassword(username, initialPassword);
        }
        await loadUsers(username);
        setNotice(`${username} created.`);
      }
      if (drawer.mode === "edit") {
        await updateAuthUser(drawer.user.username, {
          email: String(form.get("email") ?? ""),
          first_name: optionalString(form.get("first_name")),
          last_name: optionalString(form.get("last_name")),
          display_name: optionalString(form.get("display_name")),
          mobile_number: optionalString(form.get("mobile_number")),
          preferred_language_code: String(form.get("preferred_language_code") ?? "en-IN"),
          is_active: form.get("is_active") === "on",
        });
        await loadUsers(drawer.user.username);
        setNotice(`${drawer.user.username} updated.`);
      }
      if (drawer.mode === "password") {
        await setAuthUserPassword(drawer.user.username, String(form.get("new_password") ?? ""));
        setNotice(`Password updated for ${drawer.user.username}.`);
      }
      if (drawer.mode === "assign-role") {
        await assignAuthUserRole(
          drawer.user.username,
          String(form.get("role_code") ?? ""),
          String(form.get("unit_code") ?? "GLOBAL"),
        );
        await loadUsers(drawer.user.username);
        setNotice(`Role assigned to ${drawer.user.username}.`);
      }
      if (drawer.mode === "assign-review-level") {
        await assignAuthUserReviewLevel(drawer.user.username, {
          workflow_code: String(form.get("workflow_code") ?? ""),
          level_code: String(form.get("level_code") ?? ""),
          role_code: optionalString(form.get("role_code")),
          unit_code: optionalString(form.get("unit_code")),
        });
        await loadUsers(drawer.user.username);
        setNotice(`Review level assigned to ${drawer.user.username}.`);
      }
      setDrawer(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "User request could not be completed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="workflow-page">
      <div className="breadcrumb">Home / Authentication / Users</div>
      <section className="page-heading-row">
        <div>
          <h2>User Administration</h2>
          <p>Create and manage Super Admin-first user access, role assignments, and password setup.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={() => void loadUsers()}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={() => setDrawer({ mode: "create" })}>
            <Plus size={14} />
            New User
          </button>
        </div>
      </section>

      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four">
        <MetricCard label="Users" sublabel={`${users.filter((user) => user.is_active !== false).length} active`} value={users.length} />
        <MetricCard label="Roles" sublabel="Assignable roles" value={roles.length} />
        <MetricCard label="Units" sublabel="Access scopes" value={units.length} />
        <MetricCard label="Selected roles" sublabel={selectedUser?.username ?? "No user"} value={selectedUser ? getUserRoles(selectedUser).length : 0} />
      </section>

      <section className="toolbar-panel user-toolbar-panel">
        <div className="input-shell">
          <Search size={15} />
          <input onChange={(event) => setSearchText(event.target.value)} placeholder="Search username, email, or display name" value={searchText} />
        </div>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Role">
          <option value="ALL">All roles</option>
          {roles.map((role) => <option key={role.role_code} value={role.role_code}>{role.role_code}</option>)}
        </select>
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

      <section className="user-admin-layout">
        <div className="table-wrap user-table-wrap">
          {isLoading ? <Loader label="Loading users..." /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.username} onClick={() => setSelectedUsername(user.username)}>
                    <td><div className="stacked-cell"><strong>{user.display_name || user.username}</strong><span>{user.username}</span></div></td>
                    <td>{user.email || "-"}</td>
                    <td>{getUserRoles(user).slice(0, 2).map((role) => <span className="status-badge" key={`${role.role_code}-${role.unit_code}`}>{role.role_code}</span>)}</td>
                    <td>{user.preferred_language_code || "en-IN"}</td>
                    <td><span className={`status-badge ${user.is_active === false ? "inactive" : "active"}`}>{user.is_active === false ? "Inactive" : "Active"}</span></td>
                    <td><button className="secondary-button compact" type="button" onClick={(event) => { event.stopPropagation(); setDrawer({ mode: "edit", user }); }}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="user-detail-panel">
          {selectedUser ? (
            <>
              <div className="user-detail-header">
                <div className="user-detail-avatar"><UserCog size={18} /></div>
                <div>
                  <h3>{selectedUser.display_name || selectedUser.username}</h3>
                  <p>{selectedUser.username}</p>
                </div>
              </div>
              <div className="user-detail-actions">
                <button className="secondary-button compact" type="button" onClick={() => setDrawer({ mode: "password", user: selectedUser })}><KeyRound size={12} /> Set Password</button>
                <button className="secondary-button compact" type="button" onClick={() => setDrawer({ mode: "assign-role", user: selectedUser })}><ShieldCheck size={12} /> Assign Role</button>
                <button className="secondary-button compact" type="button" onClick={() => setDrawer({ mode: "assign-review-level", user: selectedUser })}><ClipboardReviewIcon /> Review Level</button>
                {selectedUser.is_active !== false && <button className="secondary-button compact" type="button" onClick={() => void handleDeactivateUser(selectedUser.username)}>Deactivate</button>}
              </div>
              <section className="detail-section">
                <h4>Role assignments</h4>
                {getUserRoles(selectedUser).length ? getUserRoles(selectedUser).map((assignment) => (
                  <div className="assignment-row" key={`${assignment.role_code}-${assignment.unit_code ?? "GLOBAL"}`}>
                    <div><strong>{assignment.role_code}</strong><span>{assignment.unit_code || "GLOBAL"}</span></div>
                    <button className="icon-action" type="button" onClick={() => void handleRevokeRole(assignment)}><X size={13} /></button>
                  </div>
                )) : <p className="muted-copy">No active role assignments found.</p>}
              </section>
              <section className="detail-section">
                <h4>Review levels</h4>
                {(selectedUser.review_levels ?? []).length ? selectedUser.review_levels?.map((level) => (
                  <div className="assignment-row" key={`${level.workflow_code}-${level.level_code}`}>
                    <div><strong>{level.level_code}</strong><span>{level.workflow_code}</span></div>
                    <div className="row-actions">
                      <span className="status-badge">{level.unit_code || "Unit"}</span>
                      <button className="icon-action" type="button" onClick={() => void handleRemoveReviewLevel(level)}><X size={13} /></button>
                    </div>
                  </div>
                )) : <p className="muted-copy">No review level assignments found.</p>}
              </section>
            </>
          ) : <div className="empty-state">Select a user to view details.</div>}
        </aside>
      </section>

      {drawer && (
        <UserDrawer
          drawer={drawer}
          isSaving={isSaving}
          onClose={() => setDrawer(null)}
          onSubmit={handleDrawerSubmit}
          roles={roles}
          units={units}
          reviewWorkflows={reviewWorkflows}
        />
      )}
    </div>
  );
}

function UserDrawer({ drawer, isSaving, onClose, onSubmit, roles, units, reviewWorkflows }: {
  drawer: Exclude<UserDrawerState, null>;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  roles: AuthRole[];
  units: AuthUnit[];
  reviewWorkflows: AuthReviewWorkflow[];
}) {
  const user = drawer.mode !== "create" ? drawer.user : undefined;
  return (
    <div className="drawer-backdrop">
      <aside className="side-drawer user-drawer">
        <div className="drawer-header user-drawer-header">
          <div>
            <span className="eyebrow">{drawer.mode.replace("-", " ")}</span>
            <h3>{drawer.mode === "assign-role" ? "User Role Assignment" : drawer.mode === "assign-review-level" ? "Review Level Assignment" : drawer.mode === "password" ? "Password Setup" : "User"}</h3>
          </div>
          <button className="icon-action" type="button" onClick={onClose} aria-label="Close drawer"><X size={16} /></button>
        </div>
        <form className="drawer-form user-drawer-form" onSubmit={onSubmit}>
          {drawer.mode === "assign-role" ? (
            <>
              <label className="form-field">Role<select name="role_code" required>{roles.map((role) => <option key={role.role_code} value={role.role_code}>{role.role_code}</option>)}</select></label>
              <label className="form-field">Unit scope<select name="unit_code"><option value="GLOBAL">GLOBAL</option>{units.map((unit) => <option key={unit.unit_code} value={unit.unit_code}>{unit.unit_code}</option>)}</select></label>
            </>
          ) : drawer.mode === "assign-review-level" ? (
            <ReviewLevelAssignmentFields roles={roles} units={units} workflows={reviewWorkflows} />
          ) : drawer.mode === "password" ? (
            <label className="form-field">New password<input name="new_password" type="password" required minLength={8} /></label>
          ) : (
            <div className="user-form-sections">
              <section className="user-form-section">
                <div className="user-form-section-heading">
                  <span>01</span>
                  <div><strong>Identity</strong><small>Core account and display information</small></div>
                </div>
                <div className="user-form-section-fields">
                  <label className="form-field">Username<input name="username" defaultValue={user?.username ?? ""} disabled={Boolean(user)} required /></label>
                  <div className="form-grid two">
                    <label className="form-field">First name<input name="first_name" defaultValue={user?.first_name ?? ""} /></label>
                    <label className="form-field">Last name<input name="last_name" defaultValue={user?.last_name ?? ""} /></label>
                  </div>
                  <label className="form-field">Display name<input name="display_name" defaultValue={user?.display_name ?? ""} /></label>
                </div>
              </section>

              <section className="user-form-section">
                <div className="user-form-section-heading">
                  <span>02</span>
                  <div><strong>Contact &amp; preferences</strong><small>Communication and language settings</small></div>
                </div>
                <div className="user-form-section-fields">
                  <label className="form-field">Email<input name="email" type="email" defaultValue={user?.email ?? ""} required /></label>
                  <div className="form-grid two">
                    <label className="form-field">Mobile number<input name="mobile_number" defaultValue={user?.mobile_number ?? ""} /></label>
                    <label className="form-field">Preferred language<select name="preferred_language_code" defaultValue={user?.preferred_language_code ?? "en-IN"}><option value="en-IN">English</option><option value="hi-IN">Hindi</option></select></label>
                  </div>
                </div>
              </section>

              {drawer.mode === "create" && (
                <section className="user-form-section">
                  <div className="user-form-section-heading">
                    <span>03</span>
                    <div><strong>Security</strong><small>Set the initial account credential</small></div>
                  </div>
                  <div className="user-form-section-fields">
                    <label className="form-field">Initial password<input name="new_password" type="password" minLength={8} autoComplete="new-password" /></label>
                  </div>
                </section>
              )}

              <section className="user-form-section">
                <div className="user-form-section-heading">
                  <span>{drawer.mode === "create" ? "04" : "03"}</span>
                  <div><strong>Access settings</strong><small>Control availability and account ownership</small></div>
                </div>
                <div className="user-form-toggle-grid">
                  <label className="role-toggle-card user-toggle-card">
                    <input defaultChecked={user?.is_active ?? true} name="is_active" type="checkbox" />
                    <span className="role-toggle-copy"><strong>Active user</strong><small>Allow this account to sign in and work.</small></span>
                    <span className="role-toggle-track" aria-hidden="true"><span className="role-toggle-thumb" /></span>
                  </label>
                  <label className="role-toggle-card user-toggle-card">
                    <input defaultChecked={user?.is_system_user ?? false} name="is_system_user" type="checkbox" disabled={Boolean(user)} />
                    <span className="role-toggle-copy"><strong>System user</strong><small>Mark as a protected platform account.</small></span>
                    <span className="role-toggle-track" aria-hidden="true"><span className="role-toggle-thumb" /></span>
                  </label>
                </div>
              </section>
            </div>
          )}
          <div className="drawer-footer user-drawer-footer">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Saving..." : drawer.mode === "create" ? "Create user" : drawer.mode === "edit" ? "Save changes" : "Save"}</button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function ReviewLevelAssignmentFields({ roles, units, workflows }: { roles: AuthRole[]; units: AuthUnit[]; workflows: AuthReviewWorkflow[] }) {
  const [workflowCode, setWorkflowCode] = useState(workflows[0]?.workflow_code ?? "");
  const selectedWorkflow = workflows.find((workflow) => workflow.workflow_code === workflowCode) ?? workflows[0];
  const levels = selectedWorkflow?.levels ?? [];
  useEffect(() => {
    if (!workflowCode && workflows[0]?.workflow_code) {
      setWorkflowCode(workflows[0].workflow_code);
    }
  }, [workflowCode, workflows]);
  return (
    <>
      <label className="form-field">Workflow
        <select name="workflow_code" value={workflowCode} onChange={(event) => setWorkflowCode(event.target.value)} required>
          {workflows.map((workflow) => (
            <option key={workflow.workflow_code} value={workflow.workflow_code}>{workflow.workflow_name || workflow.workflow_code}</option>
          ))}
        </select>
      </label>
      <label className="form-field">Review level
        <select name="level_code" required>
          {levels.map((level) => (
            <option key={level.level_code} value={level.level_code}>{level.level_number}. {level.level_name || level.level_code}</option>
          ))}
        </select>
      </label>
      <label className="form-field">Linked role assignment
        <select name="role_code">
          <option value="">No role link</option>
          {roles.map((role) => <option key={role.role_code} value={role.role_code}>{role.role_code}</option>)}
        </select>
      </label>
      <label className="form-field">Role unit scope
        <select name="unit_code">
          <option value="GLOBAL">GLOBAL</option>
          {units.map((unit) => <option key={unit.unit_code} value={unit.unit_code}>{unit.unit_code}</option>)}
        </select>
      </label>
    </>
  );
}

function ClipboardReviewIcon() {
  return <ShieldCheck size={12} />;
}

function getUserRoles(user: AuthUser): AuthUserRoleAssignment[] {
  return user.role_assignments ?? user.roles ?? [];
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function normalizeCode(value: string): string {
  return value.trim().toLowerCase();
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
