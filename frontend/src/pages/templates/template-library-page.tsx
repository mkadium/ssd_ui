import {
  Edit3,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "../../components/common/loader";
import {
  createTemplate,
  createTemplateVersion,
  getTemplateStudioDraft,
  listTemplateFormulaOutputs,
  listTemplates,
  listTemplateVersions,
  saveTemplateStudioDraft,
  setTemplateVersionStatus,
  updateTemplate,
  updateTemplateVersion,
  upsertTemplateFormulaOutput,
  type TemplateDefinition,
  type TemplateFormulaOutput,
  type TemplateVersion,
} from "../../api/templates.api";
import {
  getSelectedLocale,
  getSelectedUnitCode,
  LOCALE_CHANGED_EVENT,
  UNIT_CHANGED_EVENT,
} from "../../api/session.api";

const emptyTemplateForm = {
  template_code: "",
  name: "",
  owning_unit_code: "",
  description: "",
  template_type: "DATA_ENTRY",
  status: "DRAFT",
  current_version_code: "",
};

const emptyVersionForm = {
  version_code: "",
  title: "",
  version_number: 1,
  status: "DRAFT",
  is_current: false,
  subtitle: "",
  instructions: "",
  clone_source_version_code: "",
};

function textValue(value: unknown) {
  return value === undefined || value === null || value === ""
    ? "-"
    : String(value);
}

function compactCode(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function templateName(template: TemplateDefinition) {
  return (
    template.name ?? template.template_name ?? template.template_code ?? "-"
  );
}

function versionTitle(version: TemplateVersion) {
  return version.title ?? version.version_code ?? "Template version";
}

function normalizedStatus(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function isPublishedStatus(value: unknown) {
  return ["PUBLISHED", "ACTIVE"].includes(normalizedStatus(value));
}

type TemplateFormErrors = Partial<
  Record<"template_code" | "name" | "owning_unit_code" | "description", string>
>;

function validateTemplateForm(
  form: typeof emptyTemplateForm,
): TemplateFormErrors {
  const errors: TemplateFormErrors = {};
  if (!form.template_code.trim()) {
    errors.template_code = "Template code is required.";
  }
  if (!form.name.trim()) {
    errors.name = "Template name is required.";
  }
  if (!form.owning_unit_code.trim()) {
    errors.owning_unit_code = "Owning unit is required.";
  }
  return errors;
}

function templateApiErrors(error: unknown): TemplateFormErrors {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();
  if (
    normalized.includes("template_code") ||
    normalized.includes("template code") ||
    normalized.includes("duplicate") ||
    normalized.includes("already")
  ) {
    return { template_code: message || "Template code could not be used." };
  }
  return {};
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return textValue(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function TemplateLibraryPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [versionCache, setVersionCache] = useState<
    Record<string, TemplateVersion[]>
  >({});
  const [selectedTemplateCode, setSelectedTemplateCode] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [drawer, setDrawer] = useState<"template" | "version" | null>(null);
  const [editingTemplateCode, setEditingTemplateCode] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [templateFieldErrors, setTemplateFieldErrors] =
    useState<TemplateFormErrors>({});
  const [versionForm, setVersionForm] = useState(emptyVersionForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVersionLoading, setIsVersionLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => template.template_code === selectedTemplateCode,
      ) ??
      templates[0] ??
      null,
    [selectedTemplateCode, templates],
  );
  const currentSelectedVersion = useMemo(() => {
    if (!selectedTemplate) return null;
    return (
      versions.find(
        (version) =>
          version.version_code === selectedTemplate.current_version_code,
      ) ??
      versions.find((version) => version.is_current) ??
      versions[0] ??
      null
    );
  }, [selectedTemplate, versions]);
  const selectedTemplateDisplayStatus = isPublishedStatus(
    currentSelectedVersion?.status,
  )
    ? "PUBLISHED"
    : textValue(selectedTemplate?.status);
  const templateValidationErrors = useMemo(
    () => validateTemplateForm(templateForm),
    [templateForm],
  );
  const displayedTemplateErrors = templateFieldErrors;
  const isTemplateFormValid =
    Object.keys(templateValidationErrors).length === 0;

  function templateDisplayStatus(template: TemplateDefinition) {
    return String(
      template.current_version_status ??
        template.version_status ??
        template.status ??
        "DRAFT",
    ).toUpperCase();
  }

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((template) => {
      const displayStatus = templateDisplayStatus(template);
      const definitionStatus = String(
        template.template_status ?? template.status ?? "",
      ).toUpperCase();
      const statusMatches =
        statusFilter === "ALL" ||
        displayStatus === statusFilter ||
        definitionStatus === statusFilter;
      const queryMatches =
        !q ||
        [
          template.template_code,
          template.current_version_code,
          template.name,
          template.template_name,
          template.description,
          template.status,
          template.template_status,
          template.current_version_status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      return statusMatches && queryMatches;
    });
  }, [query, statusFilter, templates]);

  useEffect(() => {
    void loadTemplates();
  }, []);

  useEffect(() => {
    const refresh = () => void loadTemplates();
    window.addEventListener(UNIT_CHANGED_EVENT, refresh);
    window.addEventListener(LOCALE_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(UNIT_CHANGED_EVENT, refresh);
      window.removeEventListener(LOCALE_CHANGED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (detailOpen && selectedTemplate?.template_code) {
      void loadVersions(selectedTemplate.template_code);
    }
  }, [detailOpen, selectedTemplate?.template_code]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function loadTemplates() {
    setIsLoading(true);
    setError("");
    try {
      const response = await listTemplates();
      const rows = response.data ?? [];
      setTemplates(rows);
      if (rows.length === 0) {
        setSelectedTemplateCode("");
        setVersions([]);
      } else {
        setSelectedTemplateCode((current) =>
          rows.some((template) => template.template_code === current)
            ? current
            : rows[0]?.template_code || "",
        );
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Template library could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadVersions(templateCode: string, force = false) {
    if (!force && versionCache[templateCode]) {
      setVersions(versionCache[templateCode]);
      return versionCache[templateCode];
    }
    setIsVersionLoading(true);
    try {
      const response = await listTemplateVersions(templateCode);
      const rows = response.data ?? [];
      setVersions(rows);
      setVersionCache((current) => ({ ...current, [templateCode]: rows }));
      return rows;
    } catch {
      setVersions([]);
      return [];
    } finally {
      setIsVersionLoading(false);
    }
  }

  function openTemplateDetail(template: TemplateDefinition) {
    const templateCode = template.template_code ?? "";
    setSelectedTemplateCode(templateCode);
    setDetailOpen(true);
    if (templateCode) void loadVersions(templateCode);
  }

  function openTemplateDrawer() {
    setTemplateForm({
      ...emptyTemplateForm,
      owning_unit_code: getSelectedUnitCode(),
    });
    setTemplateFieldErrors({});
    setEditingTemplateCode("");
    setDrawer("template");
  }

  function openTemplateEditDrawer(template: TemplateDefinition) {
    setSelectedTemplateCode(template.template_code ?? "");
    setTemplateForm({
      template_code: template.template_code ?? "",
      name: templateName(template) === "-" ? "" : templateName(template),
      owning_unit_code: template.owning_unit_code ?? getSelectedUnitCode(),
      description: template.description ?? "",
      template_type: template.template_type ?? "DATA_ENTRY",
      status: template.status ?? "DRAFT",
      current_version_code:
        template.current_version_code ?? template.version_code ?? "",
    });
    setTemplateFieldErrors({});
    setEditingTemplateCode(template.template_code ?? "");
    setDrawer("template");
    if (template.template_code) void loadVersions(template.template_code, true);
  }

  function openVersionDrawer() {
    if (!selectedTemplate?.template_code) return;
    const nextNumber =
      Math.max(
        0,
        ...versions.map((version) => Number(version.version_number ?? 0)),
      ) + 1;
    const baseCode = compactCode(selectedTemplate.template_code);
    const sourceVersion =
      versions.find(
        (version) =>
          version.version_code === selectedTemplate.current_version_code,
      ) ??
      versions.find((version) => version.is_current) ??
      versions[0];
    setVersionForm({
      ...emptyVersionForm,
      version_code: `${baseCode}_V${nextNumber}`,
      title: `${templateName(selectedTemplate)} v${nextNumber}`,
      version_number: nextNumber,
      clone_source_version_code: sourceVersion?.version_code ?? "",
    });
    setDrawer("version");
  }

  async function cloneVersionDesign(
    sourceVersionCode: string,
    targetVersionCode: string,
  ) {
    if (
      !sourceVersionCode ||
      !targetVersionCode ||
      sourceVersionCode === targetVersionCode
    )
      return;
    const [draftResult, formulasResult] = await Promise.allSettled([
      getTemplateStudioDraft(sourceVersionCode),
      listTemplateFormulaOutputs(sourceVersionCode),
    ]);

    if (
      draftResult.status === "fulfilled" &&
      draftResult.value.data?.studio_state
    ) {
      await saveTemplateStudioDraft(targetVersionCode, {
        unit_code: getSelectedUnitCode(),
        studio_state: {
          ...draftResult.value.data.studio_state,
          cloned_from_version_code: sourceVersionCode,
          savedAt: new Date().toISOString(),
        },
        updated_by: "ui-template-version-clone",
      });
    }

    if (formulasResult.status === "fulfilled") {
      const formulas = formulasResult.value.data ?? [];
      await Promise.all(
        formulas.map((formula: TemplateFormulaOutput, index: number) =>
          upsertTemplateFormulaOutput(targetVersionCode, {
            formula_code: formula.formula_code ?? `CLONED_FORMULA_${index + 1}`,
            formula_name:
              formula.formula_name ??
              formula.formula_code ??
              `Cloned formula ${index + 1}`,
            formula_type: formula.formula_type ?? "COMPUTE",
            expression_text: formula.expression_text ?? "",
            unit_code: getSelectedUnitCode(),
            output_uom_code: formula.output_uom_code ?? null,
            function_code: formula.function_code ?? null,
            source_column_keys: formula.source_column_keys ?? [],
            render_metadata: {
              ...(formula.render_metadata ?? {}),
              cloned_from_version_code: sourceVersionCode,
            },
            sort_order: formula.sort_order ?? index + 1,
            is_active: formula.is_active !== false,
          }),
        ),
      );
    }
  }

  async function saveTemplate(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;

    const validationErrors = validateTemplateForm(templateForm);
    if (Object.keys(validationErrors).length > 0) {
      setTemplateFieldErrors(validationErrors);
      setError("Please fix the highlighted template fields.");
      return;
    }

    setIsSaving(true);
    setError("");
    setTemplateFieldErrors({});
    try {
      const templateCode = templateForm.template_code.trim();
      const description = templateForm.description.trim();
      const payload = {
        template_code: templateCode,
        name: templateForm.name.trim(),
        owning_unit_code: templateForm.owning_unit_code.trim().toUpperCase(),
        template_type: "DATA_ENTRY",
        status: templateForm.status,
        default_locale_code: getSelectedLocale() || "en-IN",
        is_active: true,
        description: description || null,
      };
      await (editingTemplateCode
        ? updateTemplate(editingTemplateCode, payload)
        : createTemplate(payload));
      if (editingTemplateCode && templateForm.current_version_code) {
        const rows =
          versions.length > 0
            ? versions
            : await loadVersions(editingTemplateCode, true);
        const currentVersion = rows.find(
          (version) =>
            version.version_code === templateForm.current_version_code,
        );
        if (currentVersion?.version_code) {
          await updateTemplateVersion(
            editingTemplateCode,
            currentVersion.version_code,
            {
              template_code: editingTemplateCode,
              version_code: currentVersion.version_code,
              title: currentVersion.title ?? currentVersion.version_code,
              unit_code: getSelectedUnitCode(),
              version_number: currentVersion.version_number ?? undefined,
              render_contract_version:
                currentVersion.render_contract_version ?? "v1",
              effective_from: currentVersion.effective_from ?? undefined,
              effective_to: currentVersion.effective_to ?? undefined,
              is_current: true,
              status: currentVersion.status ?? "DRAFT",
              publish_notes: currentVersion.publish_notes ?? undefined,
              subtitle: currentVersion.subtitle ?? undefined,
              instructions: currentVersion.instructions ?? undefined,
            },
          );
          setVersionCache((current) => {
            const next = { ...current };
            delete next[editingTemplateCode];
            return next;
          });
        }
      }
      setNotice(
        editingTemplateCode
          ? "Template definition updated."
          : "Template created successfully.",
      );
      setDrawer(null);
      setEditingTemplateCode("");
      setTemplateForm(emptyTemplateForm);
      if (!editingTemplateCode) {
        setQuery("");
        setStatusFilter("ALL");
      }
      await loadTemplates();
      if (!editingTemplateCode) {
        setDetailOpen(false);
      }
    } catch (saveError) {
      const fieldErrors = templateApiErrors(saveError);
      setTemplateFieldErrors(fieldErrors);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Template could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveVersion(event: FormEvent) {
    event.preventDefault();
    if (!selectedTemplate?.template_code) return;
    setIsSaving(true);
    setError("");
    try {
      const versionCode = compactCode(
        versionForm.version_code ||
          `${selectedTemplate.template_code}_V${versionForm.version_number}`,
      );
      await createTemplateVersion(selectedTemplate.template_code, {
        template_code: selectedTemplate.template_code,
        version_code: versionCode,
        title: versionForm.title.trim(),
        unit_code: getSelectedUnitCode(),
        version_number: Number(versionForm.version_number) || undefined,
        render_contract_version: "v1",
        is_current: versionForm.is_current,
        status: versionForm.status,
        subtitle: versionForm.subtitle.trim() || undefined,
        instructions: versionForm.instructions.trim() || undefined,
      });
      if (versionForm.clone_source_version_code) {
        await cloneVersionDesign(
          versionForm.clone_source_version_code,
          versionCode,
        );
      }
      setNotice(
        versionForm.clone_source_version_code
          ? "Template version cloned. Opening Studio..."
          : "Template version saved.",
      );
      setDrawer(null);
      setVersionCache((current) => {
        const next = { ...current };
        delete next[selectedTemplate.template_code ?? ""];
        return next;
      });
      await loadVersions(selectedTemplate.template_code, true);
      navigate(
        `/template/studio?template_code=${encodeURIComponent(selectedTemplate.template_code)}&version_code=${encodeURIComponent(
          versionCode,
        )}&step=structure`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Template version could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function retireVersion(version: TemplateVersion) {
    if (!version.version_code || !selectedTemplate?.template_code) return;
    const confirmed = window.confirm(
      `Retire ${versionTitle(version)}? This keeps audit history but removes it from active use.`,
    );
    if (!confirmed) return;
    setIsSaving(true);
    setError("");
    try {
      await setTemplateVersionStatus(version.version_code, {
        unit_code: getSelectedUnitCode(),
        status: "RETIRED",
        is_current: false,
      });
      setNotice("Template version retired.");
      setVersionCache((current) => {
        const next = { ...current };
        delete next[selectedTemplate.template_code ?? ""];
        return next;
      });
      await loadVersions(selectedTemplate.template_code, true);
      await loadTemplates();
    } catch (retireError) {
      setError(
        retireError instanceof Error
          ? retireError.message
          : "Template version could not be retired.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function openStudio(template: TemplateDefinition) {
    const templateCode = template.template_code ?? "";
    if (!templateCode) return;
    const cachedVersions = versionCache[templateCode] ?? [];
    const rows =
      cachedVersions.length > 0
        ? cachedVersions
        : await loadVersions(templateCode, true);
    const versionCode =
      template.current_version_code ||
      rows.find((version) => version.is_current)?.version_code ||
      rows[0]?.version_code ||
      "";
    const search = new URLSearchParams({
      template_code: templateCode,
      step: "structure",
    });
    if (versionCode) search.set("version_code", versionCode);
    navigate(`/template/studio?${search.toString()}`);
  }

  const totalTemplates = templates.length;
  const draftTemplates = templates.filter(
    (template) => templateDisplayStatus(template) === "DRAFT",
  ).length;
  const publishedTemplates = templates.filter(
    (template) => templateDisplayStatus(template) === "PUBLISHED",
  ).length;
  const activeTemplates = templates.filter(
    (template) => template.is_active !== false,
  ).length;

  return (
    <section className="template-page">
      <div className="page-heading-row template-heading-row">
        <div>
          <span className="eyebrow">Data Definition</span>
          <h2>Template Library</h2>
          <p>
            Manage governed template definitions, versions, mappings, and
            publish readiness.
          </p>
        </div>
        <div className="toolbar-actions">
          <button
            className="secondary-button compact"
            type="button"
            onClick={() => void loadTemplates()}
            disabled={isLoading}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            className="primary-button compact"
            type="button"
            onClick={openTemplateDrawer}
          >
            <Plus size={13} /> Create Template
          </button>
        </div>
      </div>

      {notice && <div className="toast-notice success">{notice}</div>}
      {error && <div className="toast-notice error">{error}</div>}

      <div className="template-kpi-grid">
        <div className="template-kpi-card">
          <strong>{totalTemplates}</strong>
          <span>Total templates</span>
          <em>{activeTemplates} active</em>
        </div>
        <div className="template-kpi-card">
          <strong>{draftTemplates}</strong>
          <span>Draft templates</span>
          <em>Editable</em>
        </div>
        <div className="template-kpi-card">
          <strong>{publishedTemplates}</strong>
          <span>Published</span>
          <em>Ready for request</em>
        </div>
        <div className="template-kpi-card">
          <strong>{versions.length}</strong>
          <span>Selected versions</span>
          <em>{selectedTemplate?.template_code ?? "No template"}</em>
        </div>
      </div>

      <div className="filter-bar template-filter-bar">
        <label className="search-box">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search template name, code, or status"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="template-library-grid template-library-full-grid">
        <div className="master-table-card">
          <div className="table-wrap template-table-wrap">
            <table className="data-table premium-dimension-table">
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Template Code</th>
                  <th>Status</th>
                  <th>Current Version</th>
                  <th>Unit</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="loader-table-row">
                    <td colSpan={7}>
                      <Loader label="Loading templates..." />
                    </td>
                  </tr>
                ) : filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      No templates match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((template) => (
                    <tr
                      key={template.template_code}
                      className={
                        template.template_code ===
                        selectedTemplate?.template_code
                          ? "selected-row"
                          : ""
                      }
                      onClick={() => openTemplateDetail(template)}
                    >
                      <td>
                        <strong>{templateName(template)}</strong>
                        <small>{textValue(template.description)}</small>
                      </td>
                      <td>
                        <code>{textValue(template.template_code)}</code>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${templateDisplayStatus(template).toLowerCase()}`}
                        >
                          {templateDisplayStatus(template)}
                        </span>
                        {template.template_status &&
                          template.template_status !==
                            templateDisplayStatus(template) && (
                            <small className="muted-code">
                              Definition: {template.template_status}
                            </small>
                          )}
                      </td>
                      <td>
                        {textValue(
                          template.current_version_code ??
                            template.version_code,
                        )}
                      </td>
                      <td>{textValue(template.owning_unit_code)}</td>
                      <td>
                        {formatDate(
                          template.updated_at ?? template.last_updated,
                        )}
                      </td>
                      <td>
                        <div className="template-row-actions">
                          <button
                            className="template-action-button edit"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openTemplateEditDrawer(template);
                            }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            className="template-action-button studio"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void openStudio(template);
                            }}
                          >
                            <FileSpreadsheet size={12} /> Studio
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
      </div>

      {detailOpen && selectedTemplate && (
        <div className="drawer-backdrop">
          <aside className="side-drawer template-drawer template-profile-drawer">
            <div className="drawer-header template-profile-header">
              <div>
                <span>Template Profile</span>
                <h3>{templateName(selectedTemplate)}</h3>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setDetailOpen(false)}
                aria-label="Close template profile"
              >
                <X size={16} />
              </button>
            </div>
            <div className="template-profile-hero">
              <div className="template-profile-avatar">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <span className="eyebrow">Template definition</span>
                <strong>{templateName(selectedTemplate)}</strong>
                <small>{textValue(selectedTemplate.template_code)}</small>
              </div>
              <span
                className={`status-pill ${selectedTemplate.is_active === false ? "inactive" : "active"}`}
              >
                {selectedTemplate.is_active === false ? "Inactive" : "Active"}
              </span>
            </div>
            <div className="detail-note">
              Time period rules are controlled through the Template Studio
              structure step. Used period sets are referenced, not edited here.
            </div>
            <div className="detail-field-grid">
              <div>
                <span>Status</span>
                <strong>{selectedTemplateDisplayStatus}</strong>
              </div>
              <div>
                <span>Type</span>
                <strong>{textValue(selectedTemplate.template_type)}</strong>
              </div>
              <div>
                <span>Unit</span>
                <strong>{textValue(selectedTemplate.owning_unit_code)}</strong>
              </div>
              <div>
                <span>Locale</span>
                <strong>
                  {textValue(selectedTemplate.default_locale_code)}
                </strong>
              </div>
              <div>
                <span>Current Version</span>
                <strong>
                  {textValue(
                    selectedTemplate.current_version_code ??
                      selectedTemplate.version_code,
                  )}
                </strong>
              </div>
              <div>
                <span>Last Updated</span>
                <strong>
                  {formatDate(
                    selectedTemplate.updated_at ??
                      selectedTemplate.last_updated,
                  )}
                </strong>
              </div>
            </div>
            <div className="section-header-row">
              <div>
                <span className="eyebrow">Versions</span>
                <strong>{versions.length} configured</strong>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={openVersionDrawer}
              >
                <Plus size={14} /> New Version
              </button>
            </div>
            <div className="template-version-list">
              {isVersionLoading ? (
                <Loader label="Loading template versions..." />
              ) : versions.length === 0 ? (
                <p>
                  No versions yet. Create a draft version before opening Studio.
                </p>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.version_code}
                    className="template-version-card"
                    onClick={() =>
                      navigate(
                        `/template/studio?template_code=${encodeURIComponent(selectedTemplate.template_code ?? "")}&version_code=${encodeURIComponent(
                          version.version_code ?? "",
                        )}`,
                      )
                    }
                  >
                    <span className="template-version-icon">
                      <FileSpreadsheet size={15} />
                    </span>
                    <span className="template-version-copy">
                      <strong>{version.title ?? version.version_code}</strong>
                      <small>{version.version_code}</small>
                    </span>
                    <span className="template-version-meta">
                      <em
                        className={`status-pill ${isPublishedStatus(version.status) ? "published" : String(version.status ?? "draft").toLowerCase()}`}
                      >
                        {version.status}
                      </em>
                      {version.is_current && <b>Current</b>}
                    </span>
                    <button
                      className="icon-button danger"
                      type="button"
                      disabled={isSaving}
                      onClick={(event) => {
                        event.stopPropagation();
                        void retireVersion(version);
                      }}
                      aria-label={`Retire ${versionTitle(version)}`}
                      title="Retire version"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {drawer === "template" && (
        <div className="drawer-backdrop">
          <form
            className="side-drawer template-drawer template-form-drawer"
            onSubmit={saveTemplate}
            aria-busy={isSaving}
            noValidate
          >
            <div className="drawer-header">
              <span>{editingTemplateCode ? "Edit" : "Create"}</span>
              <h3>Template</h3>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setDrawer(null);
                  setEditingTemplateCode("");
                  setTemplateFieldErrors({});
                }}
              >
                x
              </button>
            </div>
            {isSaving && (
              <div className="template-form-loader">
                <Loader
                  label={
                    editingTemplateCode
                      ? "Updating template..."
                      : "Creating template..."
                  }
                />
              </div>
            )}
            <label>
              Template name *
              <input
                disabled={isSaving}
                aria-invalid={Boolean(displayedTemplateErrors.name)}
                value={templateForm.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setTemplateFieldErrors((errors) => ({
                    ...errors,
                    name: undefined,
                  }));
                  setTemplateForm((form) => ({
                    ...form,
                    name,
                    template_code: form.template_code || compactCode(name),
                  }));
                }}
              />
              {displayedTemplateErrors.name && (
                <em className="field-error">{displayedTemplateErrors.name}</em>
              )}
            </label>
            <label>
              Template code *
              <input
                disabled={isSaving || Boolean(editingTemplateCode)}
                aria-invalid={Boolean(displayedTemplateErrors.template_code)}
                value={templateForm.template_code}
                onChange={(event) => {
                  setTemplateFieldErrors((errors) => ({
                    ...errors,
                    template_code: undefined,
                  }));
                  setTemplateForm((form) => ({
                    ...form,
                    template_code: compactCode(event.target.value),
                  }));
                }}
              />
              {displayedTemplateErrors.template_code && (
                <em className="field-error">
                  {displayedTemplateErrors.template_code}
                </em>
              )}
            </label>
            <label>
              Owning unit *
              <input
                disabled={isSaving}
                aria-invalid={Boolean(displayedTemplateErrors.owning_unit_code)}
                value={templateForm.owning_unit_code}
                onChange={(event) => {
                  setTemplateFieldErrors((errors) => ({
                    ...errors,
                    owning_unit_code: undefined,
                  }));
                  setTemplateForm((form) => ({
                    ...form,
                    owning_unit_code: event.target.value.toUpperCase(),
                  }));
                }}
              />
              {displayedTemplateErrors.owning_unit_code && (
                <em className="field-error">
                  {displayedTemplateErrors.owning_unit_code}
                </em>
              )}
            </label>
            <label>
              Template type
              <select
                disabled={isSaving}
                value="DATA_ENTRY"
                onChange={() => undefined}
              >
                <option value="DATA_ENTRY">Data Entry</option>
              </select>
            </label>
            <label>
              Status
              <select
                disabled={isSaving}
                value={templateForm.status}
                onChange={(event) =>
                  setTemplateForm((form) => ({
                    ...form,
                    status: event.target.value,
                  }))
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
              </select>
            </label>
            {editingTemplateCode && (
              <label>
                Current version
                <select
                  disabled={isSaving}
                  value={templateForm.current_version_code}
                  onChange={(event) =>
                    setTemplateForm((form) => ({
                      ...form,
                      current_version_code: event.target.value,
                    }))
                  }
                >
                  <option value="">Select current version</option>
                  {versions.map((version) => (
                    <option
                      key={version.version_code}
                      value={version.version_code}
                    >
                      {version.title ?? version.version_code}
                      {version.is_current ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Description
              <textarea
                disabled={isSaving}
                value={templateForm.description}
                onChange={(event) => {
                  setTemplateFieldErrors((errors) => ({
                    ...errors,
                    description: undefined,
                  }));
                  setTemplateForm((form) => ({
                    ...form,
                    description: event.target.value,
                  }));
                }}
              />
              {displayedTemplateErrors.description && (
                <em className="field-error">
                  {displayedTemplateErrors.description}
                </em>
              )}
            </label>
            <div className="drawer-footer">
              <button
                className="ghost-button"
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setDrawer(null);
                  setEditingTemplateCode("");
                  setTemplateFieldErrors({});
                }}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={isSaving || !isTemplateFormValid}
                type="submit"
              >
                {isSaving
                  ? editingTemplateCode
                    ? "Updating..."
                    : "Creating..."
                  : editingTemplateCode
                    ? "Update"
                    : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {drawer === "version" && (
        <div className="drawer-backdrop">
          <form
            className="side-drawer template-drawer template-form-drawer"
            onSubmit={saveVersion}
          >
            <div className="drawer-header">
              <span>Create</span>
              <h3>Template Version</h3>
              <button type="button" onClick={() => setDrawer(null)}>
                x
              </button>
            </div>
            <label>
              Version title *
              <input
                required
                value={versionForm.title}
                onChange={(event) =>
                  setVersionForm((form) => ({
                    ...form,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Version code *
              <input
                required
                value={versionForm.version_code}
                onChange={(event) =>
                  setVersionForm((form) => ({
                    ...form,
                    version_code: compactCode(event.target.value),
                  }))
                }
              />
            </label>
            <label>
              Version number
              <input
                type="number"
                min={1}
                value={versionForm.version_number}
                onChange={(event) =>
                  setVersionForm((form) => ({
                    ...form,
                    version_number: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label>
              Clone bindings from
              <select
                value={versionForm.clone_source_version_code}
                onChange={(event) =>
                  setVersionForm((form) => ({
                    ...form,
                    clone_source_version_code: event.target.value,
                  }))
                }
              >
                <option value="">Start empty</option>
                {versions.map((version) => (
                  <option
                    key={version.version_code}
                    value={version.version_code}
                  >
                    {versionTitle(version)} - {version.version_code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <input value="DRAFT" readOnly />
            </label>
            <label>
              Subtitle
              <input
                value={versionForm.subtitle}
                onChange={(event) =>
                  setVersionForm((form) => ({
                    ...form,
                    subtitle: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Instructions
              <textarea
                value={versionForm.instructions}
                onChange={(event) =>
                  setVersionForm((form) => ({
                    ...form,
                    instructions: event.target.value,
                  }))
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={versionForm.is_current}
                onChange={(event) =>
                  setVersionForm((form) => ({
                    ...form,
                    is_current: event.target.checked,
                  }))
                }
              />{" "}
              Mark as current version
            </label>
            <div className="drawer-footer">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setDrawer(null)}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={isSaving}
                type="submit"
              >
                Save Version
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
