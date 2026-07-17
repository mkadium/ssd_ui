import { Check, Plus, RefreshCw, Save, Search, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  createAuthRole,
  deactivateAuthRole,
  getAuthRole,
  listAuthPermissions,
  listAuthRoles,
  setAuthRolePermissions,
  updateAuthRole,
  type AuthPermission,
  type AuthRole,
} from "../../api/auth-admin.api";
import { LOCALE_CHANGED_EVENT } from "../../api/session.api";

type AuthTab = "catalog" | "roles";
type RoleDrawerState = { mode: "create" } | { mode: "edit"; role: AuthRole } | null;

export function AccessManagementPage() {
  const location = useLocation();
  const activeTab: AuthTab = location.pathname.includes("permission-matrix") ? "roles" : "catalog";
  const pageTitle = activeTab === "roles" ? "Permission Matrix" : "Access Catalog";
  const pageDescription =
    activeTab === "roles"
      ? "Assign module, page, and action permissions to governed roles."
      : "Review protected modules, pages, routes, actions, and permission codes.";

  const [permissions, setPermissions] = useState<AuthPermission[]>([]);
  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState("");
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [permissionTypeFilter, setPermissionTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [drawer, setDrawer] = useState<RoleDrawerState>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const moduleGroups = useMemo(() => groupPermissionsByModule(permissions), [permissions]);
  const moduleOptions = useMemo(() => moduleGroups.map((group) => group.moduleCode).sort(), [moduleGroups]);
  const selectedRole = useMemo(
    () => roles.find((role) => role.role_code === selectedRoleCode) ?? roles[0],
    [roles, selectedRoleCode],
  );

  const filteredPermissions = useMemo(() => {
    return permissions.filter((permission) => {
      const moduleMatches = moduleFilter === "ALL" || normalizeCode(permission.module_code) === moduleFilter;
      const typeMatches = permissionTypeFilter === "ALL" || getPermissionKind(permission) === permissionTypeFilter;
      const statusMatches = statusFilter === "ALL" || Boolean(permission.is_active ?? true) === (statusFilter === "ACTIVE");
      return (
        moduleMatches &&
        typeMatches &&
        statusMatches &&
        matchesSearch(
          searchText,
          permission.permission_code,
          getPermissionName(permission),
          permission.module_code,
          permission.page_code,
          permission.action_code,
        )
      );
    });
  }, [moduleFilter, permissionTypeFilter, permissions, searchText, statusFilter]);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const statusMatches = statusFilter === "ALL" || Boolean(role.is_active ?? true) === (statusFilter === "ACTIVE");
      return statusMatches && matchesSearch(searchText, role.role_code, getRoleName(role), role.role_scope);
    });
  }, [roles, searchText, statusFilter]);

  const selectedRolePermissionCount = selectedPermissionCodes.size;
  const activeRoleCount = roles.filter((role) => role.is_active !== false).length;
  const activePermissionCount = permissions.filter((permission) => permission.is_active !== false).length;

  useEffect(() => {
    void loadAccessData();
  }, []);

  useEffect(() => {
    const handleLocaleChange = () => void loadAccessData();
    window.addEventListener(LOCALE_CHANGED_EVENT, handleLocaleChange);
    return () => window.removeEventListener(LOCALE_CHANGED_EVENT, handleLocaleChange);
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function loadAccessData(nextRoleCode = selectedRoleCode): Promise<void> {
    setIsLoading(true);
    setError("");
    try {
      const [permissionList, roleList] = await Promise.all([listAuthPermissions(true), listAuthRoles(true)]);
      setPermissions(permissionList);
      setRoles(roleList);
      const nextRole = roleList.find((role) => role.role_code === nextRoleCode) ?? roleList[0] ?? null;
      setSelectedRoleCode(nextRole?.role_code ?? "");
      if (nextRole) {
        await loadRolePermissions(nextRole.role_code);
      } else {
        setSelectedPermissionCodes(new Set());
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Auth access data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRolePermissions(roleCode: string): Promise<void> {
    try {
      const detail = await getAuthRole(roleCode);
      setSelectedPermissionCodes(new Set(getRolePermissionCodes(detail)));
    } catch {
      const role = roles.find((item) => item.role_code === roleCode);
      setSelectedPermissionCodes(new Set(role ? getRolePermissionCodes(role) : []));
    }
  }

  function handleRoleSelection(roleCode: string): void {
    setSelectedRoleCode(roleCode);
    void loadRolePermissions(roleCode);
  }

  function togglePermission(permissionCode: string): void {
    setSelectedPermissionCodes((current) => {
      const next = new Set(current);
      if (next.has(permissionCode)) {
        next.delete(permissionCode);
      } else {
        next.add(permissionCode);
      }
      return next;
    });
  }

  async function handleSavePermissions(): Promise<void> {
    if (!selectedRole) {
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await setAuthRolePermissions(selectedRole.role_code, Array.from(selectedPermissionCodes).sort());
      await loadAccessData(selectedRole.role_code);
      setNotice(`Permissions saved for ${selectedRole.role_code}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Role permissions could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivateRole(roleCode: string): Promise<void> {
    if (!window.confirm(`Deactivate role ${roleCode}? Existing history will be preserved.`)) {
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await deactivateAuthRole(roleCode);
      await loadAccessData(roleCode);
      setNotice(`${roleCode} deactivated.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Role could not be deactivated.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDrawerSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roleCode = normalizeFormCode(String(form.get("role_code") ?? ""));
    const roleScope = String(form.get("role_scope") ?? "UNIT");
    const isActive = form.get("is_active") === "on";
    const isSystemRole = form.get("is_system_role") === "on";

    setIsSaving(true);
    setError("");
    try {
      if (drawer?.mode === "edit") {
        await updateAuthRole(drawer.role.role_code, { role_scope: roleScope, is_active: isActive });
        await loadAccessData(drawer.role.role_code);
        setNotice(`${drawer.role.role_code} updated.`);
      } else {
        await createAuthRole({ role_code: roleCode, role_scope: roleScope, is_system_role: isSystemRole });
        await loadAccessData(roleCode);
        setNotice(`${roleCode} created.`);
      }
      setDrawer(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Role could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="workflow-page auth-workflow-page">
      <div className="breadcrumb">Home / Authentication / Access Management</div>
      <section className="page-heading-row">
        <div>
          <h2>{pageTitle}</h2>
          <p>{pageDescription}</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={() => void loadAccessData()}>
            <RefreshCw size={14} />
            Refresh
          </button>
          {activeTab === "roles" && (
            <button className="primary-button" type="button" onClick={() => setDrawer({ mode: "create" })}>
              <Plus size={14} />
              New Role
            </button>
          )}
        </div>
      </section>

      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four">
        <MetricCard label="Modules" sublabel={`${moduleOptions.length} configured`} value={moduleOptions.length} />
        <MetricCard label="Permissions" sublabel={`${activePermissionCount} active`} value={permissions.length} />
        <MetricCard label="Roles" sublabel={`${activeRoleCount} active`} value={roles.length} />
        <MetricCard label="Selected grants" sublabel={selectedRole?.role_code ?? "No role"} value={selectedRolePermissionCount} />
      </section>

      <section className="toolbar-panel auth-toolbar-panel">
        <div className="input-shell">
          <Search size={15} />
          <input
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search role, module, permission, page, or action"
            value={searchText}
          />
        </div>
        <select aria-label="Module" onChange={(event) => setModuleFilter(event.target.value)} value={moduleFilter}>
          <option value="ALL">All modules</option>
          {moduleOptions.map((moduleCode) => (
            <option key={moduleCode} value={moduleCode}>
              {moduleCode}
            </option>
          ))}
        </select>
        <select aria-label="Permission type" onChange={(event) => setPermissionTypeFilter(event.target.value)} value={permissionTypeFilter}>
          <option value="ALL">All types</option>
          <option value="PAGE">Page access</option>
          <option value="ACTION">Module actions</option>
        </select>
        <select aria-label="Status" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
          <option value="ACTIVE">Active</option>
          <option value="ALL">All statuses</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </section>

      <section className="workflow-card">
        {activeTab === "roles" && selectedRole && (
          <div className="section-action-row compact-row">
            <div>
              <strong>Permission Matrix</strong>
              <p>Select a role and grant only the module/page/action permissions it needs.</p>
            </div>
            <div className="row-actions">
              <button className="secondary-button compact" disabled={isSaving} type="button" onClick={() => setDrawer({ mode: "edit", role: selectedRole })}>
                Edit Role
              </button>
              <button className="primary-button compact" disabled={isSaving} type="button" onClick={() => void handleSavePermissions()}>
                <Save size={12} />
                Save Grants
              </button>
            </div>
          </div>
        )}

        {isLoading && <div className="empty-state">Loading authentication access records...</div>}
        {!isLoading && activeTab === "catalog" && <AccessCatalog permissions={filteredPermissions} />}
        {!isLoading && activeTab === "roles" && (
          <RolePermissionStudio
            moduleGroups={groupPermissionsByModule(filteredPermissions)}
            onDeactivateRole={handleDeactivateRole}
            onRoleSelection={handleRoleSelection}
            onTogglePermission={togglePermission}
            roles={filteredRoles}
            selectedPermissionCodes={selectedPermissionCodes}
            selectedRole={selectedRole}
          />
        )}
      </section>

      {drawer && (
        <RoleDrawer
          drawer={drawer}
          isSaving={isSaving}
          onClose={() => setDrawer(null)}
          onSubmit={handleDrawerSubmit}
        />
      )}
    </div>
  );
}

function AccessCatalog({ permissions }: { permissions: AuthPermission[] }) {
  if (!permissions.length) {
    return <div className="empty-state">No permissions found for the selected filters.</div>;
  }
  return (
    <div className="table-wrap access-catalog-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Page / Route</th>
            <th>Type</th>
            <th>Action</th>
            <th>Permission</th>
            <th>Category</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission) => (
            <tr key={permission.permission_code}>
              <td>
                <div className="stacked-cell">
                  <strong>{permission.module_code || "UNMAPPED"}</strong>
                  <span>{permission.module_name || "Module"}</span>
                </div>
              </td>
              <td>
                <div className="stacked-cell">
                  <strong>{permission.page_code || "Module level"}</strong>
                  <span>{permission.route_path || "No route mapped"}</span>
                </div>
              </td>
              <td><span className={`status-badge ${getPermissionKind(permission).toLowerCase()}`}>{getPermissionKindLabel(permission)}</span></td>
              <td><span className="status-badge">{permission.action_code || "access"}</span></td>
              <td>
                <div className="stacked-cell">
                  <strong>{permission.permission_code}</strong>
                  <span>{getPermissionName(permission)}</span>
                </div>
              </td>
              <td>{permission.category || "Access"}</td>
              <td>
                <span className={`status-badge ${permission.is_active === false ? "inactive" : "active"}`}>
                  {permission.is_active === false ? "Inactive" : "Active"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RolePermissionStudio({
  moduleGroups,
  onDeactivateRole,
  onRoleSelection,
  onTogglePermission,
  roles,
  selectedPermissionCodes,
  selectedRole,
}: {
  moduleGroups: PermissionModuleGroup[];
  onDeactivateRole: (roleCode: string) => void;
  onRoleSelection: (roleCode: string) => void;
  onTogglePermission: (permissionCode: string) => void;
  roles: AuthRole[];
  selectedPermissionCodes: Set<string>;
  selectedRole?: AuthRole;
}) {
  return (
    <div className="role-permission-layout">
      <aside className="role-list-panel">
        <div className="section-action-row compact-row">
          <div>
            <strong>Roles</strong>
            <p>Select a role to manage permission grants.</p>
          </div>
        </div>
        <div className="role-list">
          {roles.map((role) => (
            <button
              className={selectedRole?.role_code === role.role_code ? "role-card active" : "role-card"}
              key={role.role_code}
              type="button"
              onClick={() => onRoleSelection(role.role_code)}
            >
              <div>
                <strong>{role.role_code}</strong>
                <span>{getRoleName(role)}</span>
              </div>
              <span className={`status-badge ${role.is_active === false ? "inactive" : "active"}`}>
                {role.is_active === false ? "Inactive" : "Active"}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="permission-matrix-panel">
        {selectedRole ? (
          <>
            <div className="section-action-row compact-row">
              <div>
                <strong>{selectedRole.role_code}</strong>
                <p>{selectedPermissionCodes.size} permission grants selected. Permission changes are saved only after clicking Save Grants.</p>
              </div>
              {selectedRole.is_active !== false && (
                <button className="secondary-button compact" type="button" onClick={() => onDeactivateRole(selectedRole.role_code)}>
                  Deactivate
                </button>
              )}
            </div>
            <div className="permission-module-list">
              {moduleGroups.map((group) => (
                <PermissionModuleSection
                  group={group}
                  key={group.moduleCode}
                  onTogglePermission={onTogglePermission}
                  selectedPermissionCodes={selectedPermissionCodes}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">No role selected.</div>
        )}
      </section>
    </div>
  );
}

function PermissionModuleSection({
  group,
  onTogglePermission,
  selectedPermissionCodes,
}: {
  group: PermissionModuleGroup;
  onTogglePermission: (permissionCode: string) => void;
  selectedPermissionCodes: Set<string>;
}) {
  const pagePermissions = group.permissions.filter((permission) => getPermissionKind(permission) === "PAGE");
  const actionPermissions = group.permissions.filter((permission) => getPermissionKind(permission) === "ACTION");
  return (
    <section className="permission-module-section">
      <div className="permission-section-heading">
        <div>
          <h3>{group.moduleName}</h3>
          <p>{group.moduleCode}</p>
        </div>
        <span className="status-badge">{group.permissions.length} grants</span>
      </div>
      <PermissionToggleGroup
        label="PAGE"
        permissions={pagePermissions}
        onTogglePermission={onTogglePermission}
        selectedPermissionCodes={selectedPermissionCodes}
      />
      <PermissionToggleGroup
        label="ACTION"
        permissions={actionPermissions}
        onTogglePermission={onTogglePermission}
        selectedPermissionCodes={selectedPermissionCodes}
      />
    </section>
  );
}

function PermissionToggleGroup({
  label,
  permissions,
  onTogglePermission,
  selectedPermissionCodes,
}: {
  label: "PAGE" | "ACTION";
  permissions: AuthPermission[];
  onTogglePermission: (permissionCode: string) => void;
  selectedPermissionCodes: Set<string>;
}) {
  if (!permissions.length) {
    return null;
  }
  return (
    <div className="permission-kind-block">
      <div className="permission-kind-label">{label === "PAGE" ? "Page access" : "Module actions"}</div>
      <div className="permission-grid">
        {permissions.map((permission) => (
          <label className="permission-toggle-card" key={permission.permission_code}>
            <input
              checked={selectedPermissionCodes.has(permission.permission_code)}
              onChange={() => onTogglePermission(permission.permission_code)}
              type="checkbox"
            />
            <span className="permission-check">
              {selectedPermissionCodes.has(permission.permission_code) ? <Check size={12} /> : <X size={12} />}
            </span>
            <span>
              <strong>{label === "PAGE" ? permission.page_code || "Page" : permission.action_code || "Action"}</strong>
              <em>{permission.permission_code}</em>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function RoleDrawer({
  drawer,
  isSaving,
  onClose,
  onSubmit,
}: {
  drawer: Exclude<RoleDrawerState, null>;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEdit = drawer.mode === "edit";
  const role = isEdit ? drawer.role : undefined;
  return (
    <div className="drawer-backdrop">
      <aside className="side-drawer">
        <div className="drawer-header">
          <div>
            <span className="eyebrow">{isEdit ? "Update" : "Create"}</span>
            <h3>Role</h3>
          </div>
          <button className="icon-action" type="button" onClick={onClose} aria-label="Close role drawer">
            <X size={16} />
          </button>
        </div>
        <form className="drawer-form" onSubmit={onSubmit}>
          <label className="form-field">
            Role code
            <input
              defaultValue={role?.role_code ?? ""}
              disabled={isEdit}
              name="role_code"
              onBlur={(event) => {
                event.currentTarget.value = normalizeFormCode(event.currentTarget.value);
              }}
              placeholder="UNIT_REVIEWER"
              required
            />
          </label>
          <label className="form-field">
            Role scope
            <select defaultValue={role?.role_scope ?? "UNIT"} name="role_scope">
              <option value="UNIT">Unit scoped</option>
              <option value="GLOBAL">Global</option>
            </select>
          </label>
          <label className="checkbox-card">
            <input defaultChecked={role?.is_active ?? true} disabled={!isEdit} name="is_active" type="checkbox" />
            Active role
          </label>
          <label className="checkbox-card">
            <input defaultChecked={role?.is_system_role ?? false} disabled={isEdit} name="is_system_role" type="checkbox" />
            System role
          </label>
          <div className="form-help">
            Create the role first, then assign permissions from the module-wise matrix. Delete is treated as deactivate.
          </div>
          <div className="drawer-footer">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" disabled={isSaving} type="submit">
              Save Role
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

type PermissionModuleGroup = {
  moduleCode: string;
  moduleName: string;
  permissions: AuthPermission[];
};

function groupPermissionsByModule(permissions: AuthPermission[]): PermissionModuleGroup[] {
  const groups = new Map<string, PermissionModuleGroup>();
  permissions.forEach((permission) => {
    const moduleCode = normalizeCode(permission.module_code) || "UNMAPPED";
    const moduleName = permission.module_name || moduleCode;
    if (!groups.has(moduleCode)) {
      groups.set(moduleCode, { moduleCode, moduleName, permissions: [] });
    }
    groups.get(moduleCode)?.permissions.push(permission);
  });
  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      permissions: group.permissions.sort((first, second) =>
        String(first.permission_code).localeCompare(String(second.permission_code)),
      ),
    }))
    .sort((first, second) => first.moduleCode.localeCompare(second.moduleCode));
}

function getRolePermissionCodes(role: AuthRole): string[] {
  if (Array.isArray(role.permission_codes)) {
    return role.permission_codes.filter(Boolean);
  }
  if (Array.isArray(role.permissions)) {
    return role.permissions.map((permission) => permission.permission_code).filter(Boolean);
  }
  return [];
}

function getRoleName(role: AuthRole): string {
  return role.role_name || role.display_name || role.name || role.role_code;
}

function getPermissionName(permission: AuthPermission): string {
  return permission.permission_name || permission.display_name || permission.name || permission.permission_code;
}

function getPermissionKind(permission: AuthPermission): "PAGE" | "ACTION" {
  return permission.page_code || permission.route_path ? "PAGE" : "ACTION";
}

function getPermissionKindLabel(permission: AuthPermission): string {
  return getPermissionKind(permission) === "PAGE" ? "Page" : "Action";
}

function normalizeCode(value?: string): string {
  return String(value ?? "").trim().toUpperCase();
}

function normalizeFormCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function matchesSearch(searchText: string, ...values: Array<string | number | undefined | null>): boolean {
  if (!searchText.trim()) {
    return true;
  }
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
