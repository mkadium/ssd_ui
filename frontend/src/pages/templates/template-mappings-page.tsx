import { Eye, FileSpreadsheet, RefreshCw, Save, Search, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  getFrameworkHierarchy,
  listFrameworkEditions,
  listFrameworkIndicatorMappingsByNode,
  type FrameworkIndicatorMappingSummary,
  type FrameworkNode,
} from "../../api/framework.api";
import type { IndicatorListItem } from "../../api/indicators.api";
import {
  getSelectedUnitCode,
  LOCALE_CHANGED_EVENT,
  UNIT_CHANGED_EVENT,
} from "../../api/session.api";
import {
  deactivateTemplateIndicatorMapping,
  listTemplateIndicatorMappings,
  listTemplates,
  listTemplateVersions,
  upsertTemplateIndicatorMapping,
  type TemplateDefinition,
  type TemplateIndicatorMapping,
  type TemplateVersion,
} from "../../api/templates.api";
import { Loader } from "../../components/common/loader";

type PublishedTemplateVersion = {
  template: TemplateDefinition;
  version: TemplateVersion;
};

type IndicatorSelection = {
  national_indicator_code: string;
  indicator_number?: string;
  name?: string;
};

type TemplateMappingFilter = "ALL" | "MAPPED" | "UNMAPPED";

type TargetGroup = {
  target: FrameworkNode;
  indicators: IndicatorListItem[];
};

type GoalGroup = {
  goal: FrameworkNode;
  targets: TargetGroup[];
  indicatorCount: number;
};

function textValue(value: unknown): string {
  return value === undefined || value === null || value === ""
    ? "-"
    : String(value);
}

function normalizedStatus(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function isPublishedStatus(value: unknown) {
  return ["PUBLISHED", "ACTIVE"].includes(normalizedStatus(value));
}

function templateName(template?: TemplateDefinition | null) {
  return textValue(
    template?.name ?? template?.template_name ?? template?.template_code,
  );
}

function versionTitle(version?: TemplateVersion | null) {
  return textValue(version?.title ?? version?.version_code);
}

function indicatorLabel(indicator: IndicatorListItem | IndicatorSelection) {
  const number = textValue(
    indicator.indicator_number ?? indicator.national_indicator_code,
  );
  const name = textValue(indicator.name);
  return name === "-" ? number : `${number} - ${name}`;
}

function indicatorKey(indicator: IndicatorListItem | IndicatorSelection) {
  return textValue(indicator.national_indicator_code);
}

function indicatorFromFrameworkMapping(
  mapping: FrameworkIndicatorMappingSummary,
): IndicatorListItem {
  return {
    national_indicator_code: textValue(mapping.national_indicator_code),
    indicator_number: textValue(mapping.indicator_number),
    name: textValue(mapping.indicator_name),
    framework_code: mapping.framework_code,
    edition_code: mapping.edition_code,
    status: mapping.status,
    is_active: mapping.is_active,
  };
}

function nodeColor(node?: FrameworkNode) {
  const color = String(node?.color_value ?? "").trim();
  return color || "#0b5cab";
}

function mappingMetadataValue(row: TemplateIndicatorMapping, key: string) {
  const metadata = row.mapping_metadata;
  return metadata && typeof metadata === "object" ? metadata[key] : undefined;
}

function mappingRole(row: TemplateIndicatorMapping) {
  const role = textValue(row.mapping_role);
  return role === "-" ? "PRIMARY" : role.toUpperCase();
}

function isPrimaryMapping(row: TemplateIndicatorMapping) {
  return row.is_active !== false && mappingRole(row) === "PRIMARY";
}

function mappingIndicatorCode(row: TemplateIndicatorMapping) {
  return textValue(row.indicator_code ?? row.national_indicator_code);
}

function mappingIndicatorNumber(row: TemplateIndicatorMapping) {
  return textValue(
    row.indicator_number ??
      mappingMetadataValue(row, "indicator_number") ??
      row.national_indicator_code ??
      row.indicator_code,
  );
}

function mappingIndicatorName(row: TemplateIndicatorMapping) {
  return textValue(
    row.indicator_name ?? mappingMetadataValue(row, "indicator_name"),
  );
}

function selectionsFromMappings(rows: TemplateIndicatorMapping[]) {
  return rows
    .filter(isPrimaryMapping)
    .map((row) => ({
      national_indicator_code: mappingIndicatorCode(row),
      indicator_number: mappingIndicatorNumber(row),
      name: mappingIndicatorName(row),
    }))
    .filter((row) => row.national_indicator_code !== "-");
}

function nodeIndicatorCount(node?: FrameworkNode) {
  return Number(node?.indicator_count ?? 0);
}

type MappingCacheSnapshot = {
  cache: Record<string, TemplateIndicatorMapping[]>;
  failedCount: number;
};

async function loadMappingCacheForPublishedVersions(
  items: PublishedTemplateVersion[],
): Promise<MappingCacheSnapshot> {
  const versionCodes = [
    ...new Set(
      items
        .map((item) => textValue(item.version.version_code))
        .filter((versionCode) => versionCode !== "-"),
    ),
  ];

  const results = await Promise.all(
    versionCodes.map(async (versionCode) => {
      try {
        const response = await listTemplateIndicatorMappings(versionCode);
        return { versionCode, mappings: response.data ?? [], failed: false };
      } catch {
        return { versionCode, mappings: [], failed: true };
      }
    }),
  );

  return {
    cache: Object.fromEntries(
      results.map((result) => [result.versionCode, result.mappings]),
    ),
    failedCount: results.filter((result) => result.failed).length,
  };
}
async function loadFrameworkIndicatorBrowser(): Promise<GoalGroup[]> {
  const activeEditionResponse = await listFrameworkEditions(false);
  const activeEdition =
    activeEditionResponse.data.find(
      (edition) =>
        edition.is_active !== false &&
        normalizedStatus(edition.status) === "ACTIVE",
    ) ??
    activeEditionResponse.data.find((edition) => edition.is_active !== false);
  if (!activeEdition?.framework_code) {
    return [];
  }

  const hierarchyResponse = await getFrameworkHierarchy(
    activeEdition.framework_code,
    activeEdition.edition_code,
  );
  const hierarchy = hierarchyResponse.data;
  const levels = [...(hierarchy.levels ?? [])].sort(
    (left, right) => (left.level_number ?? 0) - (right.level_number ?? 0),
  );
  const goalLevel = levels[0]?.level_code;
  const targetLevel =
    levels[1]?.level_code ??
    levels.find((level) => level.allows_indicator_mapping)?.level_code;
  if (!goalLevel || !targetLevel) {
    return [];
  }

  const nodes = (hierarchy.nodes ?? []).filter(
    (node) => node.is_active !== false,
  );
  const goals = nodes.filter((node) => node.level_code === goalLevel);
  const targets = nodes.filter((node) => node.level_code === targetLevel);
  if (!goals.length || !targets.length) {
    return [];
  }

  const childByParent = new Map<string, string[]>();
  (hierarchy.relationships ?? [])
    .filter((relationship) => relationship.is_active !== false)
    .forEach((relationship) => {
      const parent = textValue(relationship.parent_node_code);
      const child = textValue(relationship.child_node_code);
      childByParent.set(parent, [...(childByParent.get(parent) ?? []), child]);
    });

  const targetByCode = new Map(
    targets.map((target) => [target.node_code, target]),
  );
  const groups = goals.map((goal) => {
    const targetGroups = (childByParent.get(goal.node_code) ?? [])
      .map((targetCode) => targetByCode.get(targetCode))
      .filter((target): target is FrameworkNode => Boolean(target))
      .map((target) => ({
        target,
        indicators: [],
      }));
    const indicatorCount =
      nodeIndicatorCount(goal) ||
      targetGroups.reduce(
        (sum, target) => sum + nodeIndicatorCount(target.target),
        0,
      );
    return { goal, targets: targetGroups, indicatorCount };
  });

  return groups;
}

export function TemplateMappingsPage() {
  const [published, setPublished] = useState<PublishedTemplateVersion[]>([]);
  const [templateStatusFilter, setTemplateStatusFilter] =
    useState<TemplateMappingFilter>("ALL");
  const [selectedVersionCode, setSelectedVersionCode] = useState("");
  const [goalGroups, setGoalGroups] = useState<GoalGroup[]>([]);
  const [targetIndicatorCache, setTargetIndicatorCache] = useState<
    Record<string, IndicatorListItem[]>
  >({});
  const [mappingCache, setMappingCache] = useState<
    Record<string, TemplateIndicatorMapping[]>
  >({});
  const [selectedIndicators, setSelectedIndicators] = useState<
    IndicatorSelection[]
  >([]);
  const [activeGoal, setActiveGoal] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isIndicatorLoading, setIsIndicatorLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () =>
      published.find(
        (item) => item.version.version_code === selectedVersionCode,
      ) ?? published[0],
    [published, selectedVersionCode],
  );
  const mappingCountForVersion = (versionCode: string) =>
    (mappingCache[versionCode] ?? []).filter(isPrimaryMapping).length;

  const templateMappingSummary = useMemo(() => {
    const mapped = published.filter(
      (item) =>
        mappingCountForVersion(textValue(item.version.version_code)) > 0,
    ).length;
    return {
      total: published.length,
      mapped,
      pending: Math.max(published.length - mapped, 0),
    };
  }, [mappingCache, published]);

  const filteredPublished = useMemo(() => {
    const search = templateSearch.trim().toLowerCase();
    return published.filter((item) => {
      const count = mappingCountForVersion(
        textValue(item.version.version_code),
      );
      const statusMatches =
        templateStatusFilter === "MAPPED"
          ? count > 0
          : templateStatusFilter === "UNMAPPED"
            ? count === 0
            : true;
      const searchMatches =
        !search ||
        [
          templateName(item.template),
          versionTitle(item.version),
          item.template.template_code,
          item.version.version_code,
          item.version.status,
        ]
          .map(textValue)
          .some((value) => value.toLowerCase().includes(search));
      return statusMatches && searchMatches;
    });
  }, [mappingCache, published, templateSearch, templateStatusFilter]);

  const indicatorGroups = useMemo(() => goalGroups, [goalGroups]);
  const activeGroup = useMemo(
    () =>
      indicatorGroups.find((group) => group.goal.node_code === activeGoal) ??
      indicatorGroups[0],
    [activeGoal, indicatorGroups],
  );

  useEffect(() => {
    void loadPage();
    const reload = () => void loadPage();
    window.addEventListener(UNIT_CHANGED_EVENT, reload);
    window.addEventListener(LOCALE_CHANGED_EVENT, reload);
    return () => {
      window.removeEventListener(UNIT_CHANGED_EVENT, reload);
      window.removeEventListener(LOCALE_CHANGED_EVENT, reload);
    };
  }, []);

  useEffect(() => {
    if (!selected?.version.version_code) return;
    void loadMappings(selected.version.version_code);
  }, [selected?.version.version_code]);

  useEffect(() => {
    if (!activeGroup) return;
    void loadIndicatorsForGoal(activeGroup);
  }, [activeGroup?.goal.node_code]);

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  useEffect(() => {
    if (!indicatorGroups.length) {
      setActiveGoal("");
      return;
    }
    setActiveGoal((current) =>
      current &&
      indicatorGroups.some((group) => group.goal.node_code === current)
        ? current
        : indicatorGroups[0].goal.node_code,
    );
  }, [indicatorGroups]);

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const templateResponse = await listTemplates({ limit: 500 });
      const templates = templateResponse.data ?? [];
      const versionsByTemplate = await Promise.all(
        templates.map(async (template) => {
          const templateCode = textValue(template.template_code);
          if (templateCode === "-") return [];
          const versions =
            (
              await listTemplateVersions(templateCode).catch(() => ({
                data: [],
              }))
            ).data ?? [];
          return versions
            .filter((version) => isPublishedStatus(version.status))
            .map((version) => ({ template, version }));
        }),
      );
      const nextPublished = versionsByTemplate.flat();
      const [browserGroups, mappingSnapshot] = await Promise.all([
        loadFrameworkIndicatorBrowser().catch(() => []),
        loadMappingCacheForPublishedVersions(nextPublished),
      ]);
      if (mappingSnapshot.failedCount > 0) {
        setError("Some template indicator mappings could not be loaded.");
      }
      setPublished(nextPublished);
      setMappingCache(mappingSnapshot.cache);
      setSelectedVersionCode((current) =>
        current &&
        nextPublished.some((item) => item.version.version_code === current)
          ? current
          : textValue(nextPublished[0]?.version.version_code),
      );
      setGoalGroups(browserGroups);
      setTargetIndicatorCache({});
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Template mappings could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadIndicatorsForGoal(group: GoalGroup) {
    const missingTargets = group.targets.filter(
      (target) => !targetIndicatorCache[target.target.node_code],
    );
    if (!missingTargets.length) return;
    setIsIndicatorLoading(true);
    try {
      const loaded = await Promise.all(
        missingTargets.map(async (target) => {
          const response = await listFrameworkIndicatorMappingsByNode(
            target.target.node_code,
          );
          return [
            target.target.node_code,
            (response.data ?? [])
              .filter((mapping) => mapping.is_active !== false)
              .map(indicatorFromFrameworkMapping)
              .filter((indicator) => indicator.national_indicator_code !== "-"),
          ] as const;
        }),
      );
      setTargetIndicatorCache((current) => ({
        ...current,
        ...Object.fromEntries(loaded),
      }));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Indicators for the selected goal could not be loaded.",
      );
    } finally {
      setIsIndicatorLoading(false);
    }
  }

  async function loadMappings(versionCode: string, force = false) {
    if (!versionCode || versionCode === "-") return;
    if (!force && mappingCache[versionCode]) {
      setSelectedIndicators(selectionsFromMappings(mappingCache[versionCode]));
      return;
    }
    setIsDraftLoading(true);
    try {
      const response = await listTemplateIndicatorMappings(versionCode);
      const mappings = response.data ?? [];
      setMappingCache((current) => ({ ...current, [versionCode]: mappings }));
      setSelectedIndicators(selectionsFromMappings(mappings));
    } catch (mappingError) {
      setError(
        mappingError instanceof Error
          ? mappingError.message
          : "Template indicator mappings could not be loaded.",
      );
      setSelectedIndicators([]);
    } finally {
      setIsDraftLoading(false);
    }
  }

  function toggleIndicator(indicator: IndicatorListItem) {
    const key = indicatorKey(indicator);
    setSelectedIndicators((current) =>
      current.some((item) => item.national_indicator_code === key)
        ? current.filter((item) => item.national_indicator_code !== key)
        : [
            ...current,
            {
              national_indicator_code: key,
              indicator_number: textValue(indicator.indicator_number),
              name: textValue(indicator.name),
            },
          ],
    );
  }

  async function saveMapping() {
    if (!selected?.version.version_code) return;
    setIsSaving(true);
    setError("");
    try {
      const versionCode = selected.version.version_code;
      const existing =
        mappingCache[versionCode] ??
        (await listTemplateIndicatorMappings(versionCode)).data ??
        [];
      const selectedCodes = new Set(
        selectedIndicators.map(
          (indicator) => indicator.national_indicator_code,
        ),
      );
      const activeExisting = existing.filter(isPrimaryMapping);

      await Promise.all(
        selectedIndicators.map((indicator, index) =>
          upsertTemplateIndicatorMapping(versionCode, {
            indicator_code: indicator.national_indicator_code,
            unit_code: getSelectedUnitCode(),
            mapping_role: "PRIMARY",
            sort_order: index + 1,
            mapping_metadata: {
              indicator_number: indicator.indicator_number,
              indicator_name: indicator.name,
              mapped_from: "template_mapping_workspace",
            },
            is_active: true,
          }),
        ),
      );

      await Promise.all(
        activeExisting
          .filter(
            (mapping) =>
              !selectedCodes.has(
                mappingIndicatorCode(mapping),
              ),
          )
          .map((mapping) =>
            deactivateTemplateIndicatorMapping(
              versionCode,
              mappingIndicatorCode(mapping),
              {
                unit_code: getSelectedUnitCode(),
                mapping_role: "PRIMARY",
                is_active: false,
              },
            ),
          ),
      );

      await loadMappings(versionCode, true);
      setNotice("Template indicator mapping saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Template indicator mapping could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openTemplateStudioInNewTab() {
    if (!selected?.template.template_code || !selected?.version.version_code)
      return;
    const search = new URLSearchParams({
      template_code: textValue(selected.template.template_code),
      version_code: textValue(selected.version.version_code),
      step: "structure",
    });
    window.open(
      `/template/studio?${search.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const activeRows = useMemo(() => {
    return (
      activeGroup?.targets.flatMap(
        (target) => targetIndicatorCache[target.target.node_code] ?? [],
      ) ?? []
    );
  }, [activeGroup, targetIndicatorCache]);

  const activeTargetGroups = useMemo(() => {
    if (!activeGroup) return [];
    const targets = activeGroup.targets.map((target) => ({
      ...target,
      indicators: targetIndicatorCache[target.target.node_code] ?? [],
    }));
    return targets.length ? [{ ...activeGroup, targets }] : [];
  }, [activeGroup, targetIndicatorCache]);

  return (
    <section className="template-mapping-page">
      <header className="template-mapping-header">
        <div className="template-mapping-title-block">
          <span className="eyebrow">Template Governance</span>
          <h2>Template Indicator Mapping</h2>
          <p>
            Map published template versions to indicators. Draft structure
            remains locked; mapping is version metadata.
          </p>
        </div>

        <div className="template-mapping-header-right">
          <div
            className="template-mapping-summary-grid"
            aria-label="Template mapping summary"
          >
            <article className="template-mapping-stat-card">
              <span>Published Templates</span>
              <strong>{templateMappingSummary.total}</strong>
            </article>
            <article className="template-mapping-stat-card mapped">
              <span>Mapped Templates</span>
              <strong>{templateMappingSummary.mapped}</strong>
            </article>
            <article className="template-mapping-stat-card pending">
              <span>Pending Templates</span>
              <strong>{templateMappingSummary.pending}</strong>
            </article>
          </div>

          <div className="toolbar-actions template-mapping-actions">
            <button
              className="secondary-button compact"
              type="button"
              onClick={() => void loadPage()}
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              className="secondary-button compact"
              type="button"
              disabled={!selected}
              onClick={openTemplateStudioInNewTab}
            >
              <Eye size={13} /> View Template
            </button>
            <button
              className="primary-button compact"
              type="button"
              disabled={!selected || isSaving}
              onClick={() => void saveMapping()}
            >
              <Save size={13} /> {isSaving ? "Saving..." : "Save Mapping"}
            </button>
          </div>
        </div>
      </header>

      {notice && <div className="toast-notice success">{notice}</div>}
      {error && <div className="toast-notice error">{error}</div>}

      <div className="template-mapping-shell">
        <aside
          className="template-mapping-template-list"
          aria-label="Published templates"
        >
          <div className="template-mapping-panel-header">
            <div>
              <span>Published Templates</span>
              <small>Select a version to map</small>
            </div>
            <strong>{published.length}</strong>
          </div>

          <label className="search-box template-mapping-template-search">
            <Search size={14} />
            <input
              value={templateSearch}
              onChange={(event) => setTemplateSearch(event.target.value)}
              placeholder="Search template or version"
            />
          </label>

          <div
            className="template-mapping-status-filter"
            role="group"
            aria-label="Filter template mapping status"
          >
            {(["ALL", "MAPPED", "UNMAPPED"] as TemplateMappingFilter[]).map(
              (filter) => (
                <button
                  className={templateStatusFilter === filter ? "active" : ""}
                  key={filter}
                  type="button"
                  onClick={() => setTemplateStatusFilter(filter)}
                >
                  {filter === "ALL"
                    ? "All"
                    : filter === "MAPPED"
                      ? "Mapped"
                      : "Unmapped"}
                </button>
              ),
            )}
          </div>

          {isLoading ? (
            <div className="template-mapping-loader">
              <Loader label="Loading published templates..." />
            </div>
          ) : filteredPublished.length === 0 ? (
            <div className="template-mapping-empty-state">
              <FileSpreadsheet size={22} />
              <strong>No templates found</strong>
              <span>
                Publish a template version before mapping indicators, or adjust
                the current filters.
              </span>
            </div>
          ) : (
            <div className="template-mapping-template-scroll">
              {filteredPublished.map((item) => {
                const versionCode = textValue(item.version.version_code);
                const mappedCount = mappingCountForVersion(versionCode);
                return (
                  <button
                    className={
                      versionCode === selected?.version.version_code
                        ? "template-mapping-template-card active"
                        : "template-mapping-template-card"
                    }
                    key={versionCode}
                    type="button"
                    onClick={() => setSelectedVersionCode(versionCode)}
                  >
                    <span className="template-card-icon">
                      <FileSpreadsheet size={16} />
                    </span>
                    <span className="template-card-copy">
                      <strong title={templateName(item.template)}>
                        {templateName(item.template)}
                      </strong>
                      <small>{versionTitle(item.version)}</small>
                      <em>{versionCode}</em>
                    </span>
                    <b
                      className={
                        mappedCount > 0
                          ? "mapping-status mapped"
                          : "mapping-status unmapped"
                      }
                    >
                      {mappedCount > 0 ? `${mappedCount} mapped` : "Unmapped"}
                    </b>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <main className="template-mapping-workspace">
          <section className="template-mapping-selected-bar">
            <div>
              <span className="eyebrow">Selected Template</span>
              <h3>{templateName(selected?.template)}</h3>
              <p>
                {versionTitle(selected?.version)} |{" "}
                {textValue(selected?.version.version_code)}
              </p>
            </div>
            <div className="template-mapping-selected-meta">
              <span className="status-pill published">Published</span>
              <span>
                {mappingCountForVersion(
                  textValue(selected?.version.version_code),
                )}{" "}
                mapped
              </span>
            </div>
          </section>

          <section
            className="template-mapping-goal-section"
            aria-label="Framework goals"
          >
            <div className="template-mapping-section-heading">
              <div>
                <span className="eyebrow">Browse By Goal</span>
                <strong>Framework Goals</strong>
              </div>
              <em>{indicatorGroups.length} goals</em>
            </div>
            {isLoading ? (
              <div className="template-mapping-loader">
                <Loader label="Loading framework goals..." />
              </div>
            ) : indicatorGroups.length === 0 ? (
              <div className="template-mapping-empty-state">
                <Search size={22} />
                <strong>No goals available</strong>
                <span>
                  No framework indicator hierarchy is available for this unit.
                </span>
              </div>
            ) : (
              <div className="template-mapping-goals">
                {indicatorGroups.map((group) => (
                  <button
                    className={
                      activeGoal === group.goal.node_code ? "active" : ""
                    }
                    key={group.goal.node_code}
                    style={
                      {
                        "--goal-color": nodeColor(group.goal),
                      } as CSSProperties & Record<"--goal-color", string>
                    }
                    type="button"
                    title={`${textValue(group.goal.node_number)} ${textValue(group.goal.name)}`}
                    onClick={() => setActiveGoal(group.goal.node_code)}
                  >
                    <em aria-hidden="true" />
                    <span>
                      <strong>{textValue(group.goal.node_number)}</strong>
                      <small>{textValue(group.goal.name)}</small>
                    </span>
                    <b>{group.indicatorCount}</b>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section
            className="template-mapping-indicators"
            aria-label="Framework targets and indicators"
          >
            <div className="template-mapping-section-heading">
              <div>
                <span className="eyebrow">Targets & Indicators</span>
                <strong>{textValue(activeGroup?.goal.name)}</strong>
              </div>
              <em>{activeRows.length} indicators</em>
            </div>
            <div className="template-mapping-indicator-list">
              {isDraftLoading || isIndicatorLoading ? (
                <div className="template-mapping-loader">
                  <Loader label="Loading indicator list..." />
                </div>
              ) : activeRows.length === 0 ? (
                <div className="template-mapping-empty-state spacious">
                  <Search size={24} />
                  <strong>No indicators available</strong>
                  <span>
                    Select another goal or refresh framework mappings.
                  </span>
                </div>
              ) : (
                activeTargetGroups.flatMap((group) =>
                  group.targets.map((target) => (
                    <details
                      className="template-mapping-target-group"
                      key={`${group.goal.node_code}-${target.target.node_code}`}
                      open
                    >
                      <summary>
                        <span>{textValue(target.target.node_number)}</span>
                        <strong>{textValue(target.target.name)}</strong>
                        <em>
                          {target.indicators.length ||
                            nodeIndicatorCount(target.target)}
                        </em>
                      </summary>
                      <div className="template-mapping-target-body">
                        {target.indicators.length === 0 ? (
                          <div className="template-mapping-empty-target">
                            No indicators mapped to this target.
                          </div>
                        ) : (
                          target.indicators.map((indicator) => {
                            const checked = selectedIndicators.some(
                              (item) =>
                                item.national_indicator_code ===
                                indicatorKey(indicator),
                            );
                            return (
                              <label
                                className={
                                  checked
                                    ? "template-mapping-indicator-row selected"
                                    : "template-mapping-indicator-row"
                                }
                                key={indicatorKey(indicator)}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleIndicator(indicator)}
                                />
                                <span>
                                  <strong>
                                    {textValue(indicator.indicator_number)}
                                  </strong>
                                  <em>{textValue(indicator.name)}</em>
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </details>
                  )),
                )
              )}
            </div>
          </section>
        </main>

        <aside
          className="template-mapping-selected"
          aria-label="Selected indicators"
        >
          <div className="template-mapping-selected-sticky">
            <div className="template-mapping-panel-header">
              <div>
                <span>Selected Indicators</span>
                <small>Included in this mapping</small>
              </div>
              <strong>{selectedIndicators.length}</strong>
            </div>
            {selectedIndicators.length === 0 ? (
              <div className="template-mapping-empty-state compact">
                <Save size={21} />
                <strong>No indicators selected</strong>
                <span>
                  Choose indicators from the workspace, then save mapping.
                </span>
              </div>
            ) : (
              <div className="template-mapping-selected-scroll">
                {selectedIndicators.map((indicator) => (
                  <article
                    className="template-mapping-selected-card"
                    key={indicator.national_indicator_code}
                  >
                    <div>
                      <strong title={indicatorLabel(indicator)}>
                        {textValue(
                          indicator.indicator_number ??
                            indicator.national_indicator_code,
                        )}
                      </strong>
                      <em>{textValue(indicator.name)}</em>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${indicatorLabel(indicator)}`}
                      onClick={() =>
                        setSelectedIndicators((current) =>
                          current.filter(
                            (item) =>
                              item.national_indicator_code !==
                              indicator.national_indicator_code,
                          ),
                        )
                      }
                    >
                      <X size={13} />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
