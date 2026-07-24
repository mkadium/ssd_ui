import { CheckCircle2, Edit3, ExternalLink, FileText, RefreshCw, Search } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createIndicator,
  getIndicator,
  listGlobalIndicators,
  listIndicators,
  saveFrameworkIndicatorMapping,
  saveGlobalIndicatorMapping,
  saveSourceAssignment,
  saveSourceOfficerAssignment,
  updateIndicator,
  updateIndicatorMeasure,
  type GlobalIndicatorListItem,
  type GlobalIndicatorMapping,
  type FrameworkIndicatorMapping,
  type FrameworkMappedNode,
  type IndicatorDetail,
  type IndicatorListItem,
  type IndicatorMeasure,
  type IndicatorMetadataDetail,
  type PublishedTemplateUsage,
  type IndicatorSourceAssignment,
  type IndicatorSourceOfficerAssignment,
  type IndicatorVersion,
} from "../../api/indicators.api";
import {
  getFrameworkHierarchy,
  listFrameworkEditions,
  type FrameworkEdition,
  type FrameworkHierarchy,
  type FrameworkNode,
} from "../../api/framework.api";
import { listMasterRecords, type MasterRecord } from "../../api/masters-reference.api";
import { getSelectedUnitCode, LOCALE_CHANGED_EVENT, UNIT_CHANGED_EVENT } from "../../api/session.api";
import { useSearchParams } from "react-router-dom";

type IndicatorStatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "INACTIVE";
type DetailTab = "details" | "mapping";
type MappingPanel = "" | "global" | "source" | "periodicity" | "sourceOfficer" | "uom" | "measure";
type MetadataNotes = Record<string, unknown>;
type IndicatorCreateForm = {
  national_indicator_code: string;
  indicator_number: string;
  name: string;
  description: string;
  status: string;
  color_value: string;
  parent_node_code: string;
  target_node_code: string;
};

function textValue(value: unknown): string {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function compactDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getIndicatorName(indicator: IndicatorListItem | IndicatorDetail) {
  return indicator.name || indicator.national_indicator_code || "Indicator";
}

function getIndicatorCode(indicator: IndicatorListItem | IndicatorDetail) {
  return indicator.national_indicator_code || indicator.indicator_number || "";
}

function normalizeStatus(indicator: IndicatorListItem) {
  if (indicator.is_active === false) return "INACTIVE";
  return (indicator.status || "ACTIVE").toUpperCase();
}

function overviewOf(detail?: IndicatorDetail | null): IndicatorListItem {
  return detail?.overview ?? detail ?? ({} as IndicatorListItem);
}

function sourcesOf(detail?: IndicatorDetail | null): IndicatorSourceAssignment[] {
  return detail?.sources ?? detail?.source_assignments ?? [];
}

function firstSource(detail?: IndicatorDetail | null) {
  return sourcesOf(detail)[0];
}

function firstMeasure(detail?: IndicatorDetail | null): IndicatorMeasure | undefined {
  return detail?.measures?.[0];
}

function firstVersion(detail?: IndicatorDetail | null): IndicatorVersion | undefined {
  return detail?.versions?.find((version) => version.is_current) ?? detail?.versions?.[0];
}

function firstMetadata(detail?: IndicatorDetail | null): IndicatorMetadataDetail | undefined {
  return detail?.metadata?.[0];
}

function firstGlobalMapping(detail?: IndicatorDetail | null): GlobalIndicatorMapping | undefined {
  return detail?.global_indicator_mappings?.[0];
}

function firstFrameworkMapping(detail?: IndicatorDetail | null): FrameworkIndicatorMapping | undefined {
  return detail?.framework_mappings?.find((mapping) => mapping.mapping_type === "PRIMARY") ?? detail?.framework_mappings?.[0];
}

function parseMetadataNotes(notes?: string | null): MetadataNotes {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function noteValue(notes: MetadataNotes, keys: string[]) {
  for (const key of keys) {
    if (notes[key] !== undefined && notes[key] !== null && notes[key] !== "") return notes[key];
  }
  return undefined;
}

function optionLabel(record: MasterRecord, codeKey: string, nameKeys: string[]) {
  const code = textValue(record[codeKey]);
  const name = nameKeys.map((key) => record[key]).find(Boolean);
  return `${textValue(name)} (${code})`;
}

function officerOptionLabel(record: MasterRecord) {
  const name = textValue(record.display_name ?? record.name);
  const email = textValue(record.email);
  return email === "-" ? name : `${name} - ${email}`;
}

function dedupeSourceAssignments(records: IndicatorSourceAssignment[]) {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = [
      record.source_organization_code ?? "",
      record.assignment_role ?? "",
      record.periodicity_code ?? "",
      record.is_active === false ? "inactive" : "active",
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceAssignmentKey(record: Pick<IndicatorSourceAssignment, "source_organization_code" | "assignment_role">) {
  return [record.source_organization_code ?? "", record.assignment_role ?? "PRIMARY_SOURCE"].join("|").toUpperCase();
}

function officersForSourceAssignment(assignment: IndicatorSourceAssignment, officers: IndicatorSourceOfficerAssignment[]) {
  const key = sourceAssignmentKey(assignment);
  return officers.filter((officer) => sourceAssignmentKey(officer) === key);
}

function sourceAssignmentTitle(item: IndicatorSourceAssignment | IndicatorSourceOfficerAssignment) {
  const ministry = item.ministry_name ?? item.ministry_organization_code;
  const department = item.department_organization_name ?? item.source_organization_name ?? item.source_organization_code;
  if (ministry && department && String(ministry) !== String(department)) {
    return `${textValue(ministry)} / ${textValue(department)}`;
  }
  return textValue(department ?? ministry);
}

function usageSourceTitle(item: PublishedTemplateUsage) {
  const ministry = item.ministry_name ?? item.ministry_organization_code;
  const department = item.department_organization_name ?? item.source_organization_name ?? item.source_organization_code;
  if (ministry && department && String(ministry) !== String(department)) {
    return `${textValue(ministry)} / ${textValue(department)}`;
  }
  return textValue(department ?? ministry);
}

function usageKey(item: PublishedTemplateUsage, suffix = "") {
  return [
    item.template_code ?? "",
    item.version_code ?? "",
    item.template_measure_code ?? item.measure_code ?? "",
    item.source_organization_code ?? "",
    item.access_role ?? "",
    suffix,
  ].join("|");
}

function uniquePublishedUsage(records: PublishedTemplateUsage[], keySelector: (record: PublishedTemplateUsage) => string) {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = keySelector(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function indicatorTargetNodes(hierarchy?: FrameworkHierarchy | null): FrameworkNode[] {
  if (!hierarchy) return [];
  const mappingLevels = hierarchy.levels.filter((level) => level.is_active !== false && level.allows_indicator_mapping);
  const fallbackLevel = hierarchy.levels
    .filter((level) => level.is_active !== false)
    .sort((left, right) => Number(right.level_number ?? 0) - Number(left.level_number ?? 0))[0];
  const allowedLevelCodes = new Set((mappingLevels.length ? mappingLevels : fallbackLevel ? [fallbackLevel] : []).map((level) => level.level_code));
  return hierarchy.nodes
    .filter((node) => node.is_active !== false && allowedLevelCodes.has(node.level_code))
    .sort((left, right) => {
      const leftNumber = left.node_number ?? left.node_code;
      const rightNumber = right.node_number ?? right.node_code;
      return String(leftNumber).localeCompare(String(rightNumber), undefined, { numeric: true });
    });
}

function parentNodeForTarget(targetNodeCode: string, hierarchy?: FrameworkHierarchy | null): FrameworkNode | undefined {
  const relationship = hierarchy?.relationships.find(
    (candidate) => candidate.is_active !== false && candidate.child_node_code === targetNodeCode,
  );
  return relationship ? hierarchy?.nodes.find((candidate) => candidate.node_code === relationship.parent_node_code) : undefined;
}

function frameworkMappedNodeFromHierarchyNode(node: FrameworkNode, hierarchy?: FrameworkHierarchy | null): FrameworkMappedNode {
  const level = hierarchy?.levels.find((candidate) => candidate.level_code === node.level_code);
  return {
    node_code: node.node_code,
    node_number: node.node_number,
    name: node.name,
    short_name: node.short_name,
    level_code: node.level_code,
    level_number: level?.level_number,
    level_name: level?.name ?? node.level_code,
    color_value: node.color_value,
    color_method: node.color_method,
  };
}

function frameworkHierarchyPathForMappedNode(
  mappedNode?: FrameworkMappedNode,
  hierarchy?: FrameworkHierarchy | null,
  fallbackParents: FrameworkMappedNode[] = [],
): FrameworkMappedNode[] {
  if (!mappedNode?.node_code) {
    return [];
  }
  const nodeByCode = new Map((hierarchy?.nodes ?? []).map((node) => [node.node_code, node]));
  const parentByChild = new Map(
    (hierarchy?.relationships ?? [])
      .filter((relationship) => relationship.is_active !== false)
      .map((relationship) => [relationship.child_node_code, relationship.parent_node_code]),
  );
  const path: FrameworkMappedNode[] = [];
  const visited = new Set<string>();
  let currentCode: string | undefined = mappedNode.node_code;
  while (currentCode && !visited.has(currentCode)) {
    visited.add(currentCode);
    const currentNode = nodeByCode.get(currentCode);
    path.unshift(currentNode ? frameworkMappedNodeFromHierarchyNode(currentNode, hierarchy) : mappedNode);
    currentCode = parentByChild.get(currentCode);
  }

  const fallbackPath = [...fallbackParents, mappedNode].filter((node) => Boolean(node.node_code));
  const resolvedPath = path.length > 1 ? path : fallbackPath;
  return resolvedPath
    .filter((node, index, items) => items.findIndex((candidate) => candidate.node_code === node.node_code) === index)
    .sort((left, right) => Number(left.level_number ?? 0) - Number(right.level_number ?? 0));
}

function indicatorParentNodes(hierarchy?: FrameworkHierarchy | null): FrameworkNode[] {
  const targets = indicatorTargetNodes(hierarchy);
  const parentCodes = new Set(
    targets
      .map((target) => parentNodeForTarget(target.node_code, hierarchy)?.node_code)
      .filter((nodeCode): nodeCode is string => Boolean(nodeCode)),
  );
  return hierarchy?.nodes
    .filter((node) => node.is_active !== false && parentCodes.has(node.node_code))
    .sort((left, right) => {
      const leftNumber = left.node_number ?? left.node_code;
      const rightNumber = right.node_number ?? right.node_code;
      return String(leftNumber).localeCompare(String(rightNumber), undefined, { numeric: true });
    }) ?? [];
}

function indicatorTargetsForParent(parentNodeCode: string, hierarchy?: FrameworkHierarchy | null): FrameworkNode[] {
  const targets = indicatorTargetNodes(hierarchy);
  if (!parentNodeCode) return targets;
  const childCodes = new Set(
    hierarchy?.relationships
      .filter((relationship) => relationship.is_active !== false && relationship.parent_node_code === parentNodeCode)
      .map((relationship) => relationship.child_node_code) ?? [],
  );
  return targets.filter((target) => childCodes.has(target.node_code));
}

function frameworkNodeOptionLabel(node: FrameworkNode, hierarchy?: FrameworkHierarchy | null): string {
  const parentRelationship = hierarchy?.relationships.find((relationship) => relationship.child_node_code === node.node_code);
  const parent = parentRelationship
    ? hierarchy?.nodes.find((candidate) => candidate.node_code === parentRelationship.parent_node_code)
    : undefined;
  const prefix = node.node_number ? `${node.node_number} - ` : "";
  const parentText = parent ? `${parent.node_number ?? parent.node_code} / ` : "";
  return `${parentText}${prefix}${node.name ?? node.short_name ?? node.node_code}`;
}

function levelNameForNode(node?: FrameworkNode, hierarchy?: FrameworkHierarchy | null): string {
  if (!node) return "Level";
  const level = hierarchy?.levels.find((candidate) => candidate.level_code === node.level_code);
  return level?.name ?? node.level_code;
}

export function IndicatorLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [indicators, setIndicators] = useState<IndicatorListItem[]>([]);
  const [detailCache, setDetailCache] = useState<Record<string, IndicatorDetail>>({});
  const [selectedCode, setSelectedCode] = useState("");
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [periodicityFilter, setPeriodicityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<IndicatorStatusFilter>("ALL");
  const [uomFilter, setUomFilter] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [globalInfo, setGlobalInfo] = useState<GlobalIndicatorMapping | null>(null);
  const [organizations, setOrganizations] = useState<MasterRecord[]>([]);
  const [periodicities, setPeriodicities] = useState<MasterRecord[]>([]);
  const [uoms, setUoms] = useState<MasterRecord[]>([]);
  const [globalIndicators, setGlobalIndicators] = useState<GlobalIndicatorListItem[]>([]);
  const [officers, setOfficers] = useState<MasterRecord[]>([]);
  const [activeFramework, setActiveFramework] = useState<FrameworkEdition | null>(null);
  const [frameworkHierarchy, setFrameworkHierarchy] = useState<FrameworkHierarchy | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIndicatorCode, setEditingIndicatorCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [createForm, setCreateForm] = useState<IndicatorCreateForm>({
    national_indicator_code: "",
    indicator_number: "",
    name: "",
    description: "",
    status: "DRAFT",
    color_value: "#e91d3d",
    parent_node_code: "",
    target_node_code: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const indicatorCodeFromQuery = searchParams.get("indicator") ?? "";

  useEffect(() => {
    void loadPage();

    function handleContextChange() {
      void loadPage();
    }

    window.addEventListener(UNIT_CHANGED_EVENT, handleContextChange);
    window.addEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
    return () => {
      window.removeEventListener(UNIT_CHANGED_EVENT, handleContextChange);
      window.removeEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
    };
  }, []);

  useEffect(() => {
    if (indicatorCodeFromQuery) {
      void loadIndicatorDetail(indicatorCodeFromQuery, true, false, false);
    }
  }, [indicatorCodeFromQuery]);

  const selectedDetail = selectedCode ? detailCache[selectedCode] : null;

  const filteredIndicators = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedSource = sourceFilter.trim().toLowerCase();
    return indicators.filter((indicator) => {
      const code = getIndicatorCode(indicator);
      const detail = detailCache[code];
      const row = buildIndicatorRow(indicator, detail);
      const matchesStatus = statusFilter === "ALL" || normalizeStatus(indicator) === statusFilter;
      const matchesSource =
        !normalizedSource ||
        row.sourceCode === sourceFilter ||
        row.departmentCode === sourceFilter ||
        [row.ministry, row.department, row.sourceCode, row.departmentCode].join(" ").toLowerCase().includes(normalizedSource);
      const matchesPeriodicity = !periodicityFilter || row.periodicityCode === periodicityFilter;
      const matchesUom = !uomFilter || row.uomCode === uomFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          row.indicatorCode,
          row.indicatorNumber,
          row.indicatorName,
          row.globalCode,
          row.globalNumber,
          row.ministry,
          row.department,
          row.uom,
          row.periodicity,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesSource && matchesPeriodicity && matchesUom && matchesQuery;
    });
  }, [detailCache, indicators, periodicityFilter, query, sourceFilter, statusFilter, uomFilter]);

  const activeCount = indicators.filter((indicator) => normalizeStatus(indicator) === "ACTIVE").length;
  const mappedGlobalCount = indicators.filter((indicator) => Boolean(indicator.global_indicator_code)).length;
  const sourcedCount = indicators.filter((indicator) => Boolean(indicator.source_organization_code)).length;
  const parentNodeOptions = useMemo(() => indicatorParentNodes(frameworkHierarchy), [frameworkHierarchy]);
  const targetNodeOptions = useMemo(
    () => (parentNodeOptions.length > 0 && !createForm.parent_node_code ? [] : indicatorTargetsForParent(createForm.parent_node_code, frameworkHierarchy)),
    [createForm.parent_node_code, frameworkHierarchy, parentNodeOptions.length],
  );
  const targetNodeLabel = levelNameForNode(targetNodeOptions[0], frameworkHierarchy);
  const parentNodeLabel = levelNameForNode(parentNodeOptions[0], frameworkHierarchy);
  const hasParentLevelForIndicatorMapping = parentNodeOptions.length > 0;

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [indicatorResponse, organizationResponse, periodicityResponse, uomResponse, globalResponse, officerResponse] = await Promise.all([
        listIndicators(),
        listMasterRecords({ endpoint: "/masters/organizations" }).catch(() => ({ data: [], count: 0, locale: "en-IN" })),
        listMasterRecords({ endpoint: "/masters/periodicities" }).catch(() => ({ data: [], count: 0, locale: "en-IN" })),
        listMasterRecords({ endpoint: "/masters/uom" }).catch(() => ({ data: [], count: 0, locale: "en-IN" })),
        listGlobalIndicators().catch(() => ({ data: [], count: 0, locale: "en-IN" })),
        listMasterRecords({ endpoint: "/masters/officers" }).catch(() => ({ data: [], count: 0, locale: "en-IN" })),
      ]);
      const frameworkResponse = await listFrameworkEditions(true).catch(() => ({ data: [], count: 0, locale: "en-IN" }));

      setIndicators(indicatorResponse.data);
      setOrganizations(organizationResponse.data);
      setPeriodicities(periodicityResponse.data);
      setUoms(uomResponse.data);
      setGlobalIndicators(globalResponse.data);
      setOfficers(officerResponse.data);
      const nextFramework =
        frameworkResponse.data.find((edition) => edition.is_active && edition.status !== "INACTIVE") ??
          frameworkResponse.data.find((edition) => edition.is_active) ??
          frameworkResponse.data[0] ??
          null;
      const hierarchyResponse = nextFramework?.framework_code
        ? await getFrameworkHierarchy(nextFramework.framework_code, nextFramework.edition_code).catch(() => null)
        : null;

      setActiveFramework(nextFramework);
      setFrameworkHierarchy(hierarchyResponse?.data ?? null);

      setSelectedCode("");
      setDetailCache({});
    } catch {
      setIndicators([]);
      setDetailCache({});
      setFrameworkHierarchy(null);
      setSelectedCode("");
      setError("Indicator records could not be loaded. Please refresh or try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadIndicatorDetail(indicatorCode: string, switchTab = true, force = false, updateUrl = true) {
    setSelectedCode(indicatorCode);
    if (updateUrl && indicatorCodeFromQuery !== indicatorCode) {
      setSearchParams({ indicator: indicatorCode });
    }
    if (switchTab) setActiveTab("details");
    if (detailCache[indicatorCode] && !force) return;
    setIsDetailLoading(true);
    try {
      const response = await getIndicator(indicatorCode);
      setDetailCache((current) => ({ ...current, [indicatorCode]: response.data }));
    } catch {
      setError("Indicator details could not be loaded. Please select another indicator or refresh.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleCreateIndicator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeFramework?.framework_code || !activeFramework.edition_code) {
      setError("Create indicator requires an active framework edition for the selected unit.");
      return;
    }
    if (!createForm.name.trim()) {
      setError("Indicator name is required.");
      return;
    }
    if (!createForm.target_node_code) {
      setError("Select the parent and target before saving the indicator.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        framework_code: activeFramework.framework_code,
        edition_code: activeFramework.edition_code,
        owning_unit_code: getSelectedUnitCode(),
        national_indicator_code: createForm.national_indicator_code.trim() || undefined,
        indicator_number: createForm.indicator_number.trim() || undefined,
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        status: createForm.status,
        is_active: createForm.status !== "INACTIVE",
        color_value: createForm.color_value.trim() || undefined,
        color_method: createForm.color_value.trim() ? "HEX" : undefined,
      };
      if (editingIndicatorCode) {
        const previousDetail = detailCache[editingIndicatorCode];
        const previousMapping = firstFrameworkMapping(previousDetail);
        await updateIndicator(editingIndicatorCode, payload);
        if (
          createForm.target_node_code &&
          previousMapping?.mapped_node?.node_code &&
          previousMapping.mapped_node.node_code !== createForm.target_node_code
        ) {
          await saveFrameworkIndicatorMapping({
            framework_code: activeFramework.framework_code,
            edition_code: activeFramework.edition_code,
            node_code: previousMapping.mapped_node.node_code,
            national_indicator_code: editingIndicatorCode,
            mapping_type: previousMapping.mapping_type ?? "PRIMARY",
            is_active: false,
          });
        }
      } else {
        const response = await createIndicator(payload);
        const overview = overviewOf(response.data);
        payload.national_indicator_code = overview.national_indicator_code ?? payload.national_indicator_code;
      }
      const savedIndicatorCode = editingIndicatorCode || payload.national_indicator_code || createForm.national_indicator_code.trim();
      if (createForm.target_node_code && savedIndicatorCode) {
        await saveFrameworkIndicatorMapping({
          framework_code: activeFramework.framework_code,
          edition_code: activeFramework.edition_code,
          node_code: createForm.target_node_code,
          national_indicator_code: savedIndicatorCode,
          mapping_type: "PRIMARY",
          is_active: true,
        });
      }
      setIsCreateOpen(false);
      setEditingIndicatorCode("");
      setCreateForm({
        national_indicator_code: "",
        indicator_number: "",
        name: "",
        description: "",
        status: "DRAFT",
        color_value: "#e91d3d",
        parent_node_code: "",
        target_node_code: "",
      });
      await loadPage();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Indicator could not be created. Please verify the details.");
    } finally {
      setIsSaving(false);
    }
  }

  function openCreateDrawer() {
    setEditingIndicatorCode("");
    setCreateForm({
      national_indicator_code: "",
      indicator_number: "",
      name: "",
      description: "",
      status: "DRAFT",
      color_value: "#e91d3d",
      parent_node_code: "",
      target_node_code: "",
    });
    setIsCreateOpen(true);
  }

  function openEditDrawer(detail: IndicatorDetail) {
    const overview = overviewOf(detail);
    const frameworkMapping = firstFrameworkMapping(detail);
    const parentNode = frameworkMapping?.mapped_node?.node_code
      ? parentNodeForTarget(frameworkMapping.mapped_node.node_code, frameworkHierarchy)
      : undefined;
    setEditingIndicatorCode(overview.national_indicator_code ?? "");
    setCreateForm({
      national_indicator_code: overview.national_indicator_code ?? "",
      indicator_number: overview.indicator_number ?? "",
      name: getIndicatorName(overview),
      description: overview.description ?? "",
      status: overview.status ?? "DRAFT",
      color_value: overview.color_value ?? "#e91d3d",
      parent_node_code: parentNode?.node_code ?? "",
      target_node_code: frameworkMapping?.mapped_node?.node_code ?? "",
    });
    setIsCreateOpen(true);
  }

  async function handleGlobalClick(indicator: IndicatorListItem) {
    const code = getIndicatorCode(indicator);
    const mapping = firstGlobalMapping(detailCache[code]);
    if (mapping) {
      setGlobalInfo(mapping);
      return;
    }
    try {
      const response = await getIndicator(code);
      setDetailCache((current) => ({ ...current, [code]: response.data }));
      const nextMapping = firstGlobalMapping(response.data);
      if (nextMapping) setGlobalInfo(nextMapping);
    } catch {
      setError("Global indicator information could not be loaded for this row.");
    }
  }

  return (
    <div className="workflow-page indicator-library-page">
      {selectedCode && isDetailLoading && !selectedDetail ? (
        <div className="indicator-detail-loading-card">
          <div className="loader-ring" />
          <strong>Loading indicator details...</strong>
          <span>Please wait while source, measures, metadata, and mappings are loaded.</span>
        </div>
      ) : selectedDetail ? (
        <IndicatorDetailPage
          detail={selectedDetail}
          organizations={organizations}
          periodicities={periodicities}
          uoms={uoms}
          globalIndicators={globalIndicators}
          officers={officers}
          activeFramework={activeFramework}
          frameworkHierarchy={frameworkHierarchy}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRefresh={() => loadIndicatorDetail(getIndicatorCode(overviewOf(selectedDetail)), false, true)}
          onEdit={() => openEditDrawer(selectedDetail)}
          onBack={() => {
            setSelectedCode("");
            setSearchParams(new URLSearchParams(), { replace: true });
            setActiveTab("details");
          }}
        />
      ) : (
        <>
      <section className="page-heading-row compact">
        <div>
          <div className="breadcrumb">Home / Indicator Management / Indicator Library</div>
          <h2>Indicator Library</h2>
          <p>Browse governed national indicators with source, measure, metadata, version, and mapping context.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button compact" type="button" onClick={() => void loadPage()}>
            <RefreshCw size={13} />
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={openCreateDrawer}>
            <Edit3 size={14} />
            New Indicator
          </button>
        </div>
      </section>

      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four">
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{indicators.length}</div>
          <div className="metric-label">Indicators</div>
          <div className="metric-sublabel">{getSelectedUnitCode()}</div>
        </article>
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{activeCount}</div>
          <div className="metric-label">Active</div>
          <div className="metric-sublabel">available</div>
        </article>
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{mappedGlobalCount}</div>
          <div className="metric-label">Global mapped</div>
          <div className="metric-sublabel">loaded rows</div>
        </article>
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{sourcedCount}</div>
          <div className="metric-label">Source assigned</div>
          <div className="metric-sublabel">loaded rows</div>
        </article>
      </section>

      <section className="toolbar-panel indicator-toolbar-panel wide">
        <label className="input-shell">
          <Search size={14} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search indicator code, name, global code, ministry, department, UOM, or periodicity"
          />
        </label>
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
          <option value="">All ministries/departments</option>
            {organizations.map((record) => (
              <option value={String(record.organization_code)} key={String(record.organization_code)}>
                {optionLabel(record, "organization_code", ["name", "organization_name", "display_name"])}
              </option>
            ))}
        </select>
        <select value={periodicityFilter} onChange={(event) => setPeriodicityFilter(event.target.value)}>
          <option value="">All periodicities</option>
          {periodicities.map((record) => (
            <option value={String(record.periodicity_code)} key={String(record.periodicity_code)}>
              {textValue(record.name ?? record.periodicity_code)}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as IndicatorStatusFilter)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select value={uomFilter} onChange={(event) => setUomFilter(event.target.value)}>
          <option value="">All UOM</option>
          {uoms.map((record) => (
            <option value={String(record.uom_code)} key={String(record.uom_code)}>
              {textValue(record.name ?? record.uom_code)}
            </option>
          ))}
        </select>
      </section>

      <section className="workflow-card indicator-full-table-card">
        <div className="table-wrap indicator-table-wrap full">
          <table className="data-table">
            <thead>
              <tr>
                <th>Indicator Name</th>
                <th>Global Indicator Number/Code</th>
                <th>Indicator Code</th>
                <th>Data Source Ministry</th>
                <th>Department</th>
                <th>Unit of Measurement</th>
                <th>Periodicity</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>Loading indicators...</td>
                </tr>
              ) : filteredIndicators.length === 0 ? (
                <tr>
                  <td colSpan={8}>No indicators found.</td>
                </tr>
              ) : (
                filteredIndicators.map((indicator) => {
                  const code = getIndicatorCode(indicator);
                  const row = buildIndicatorRow(indicator, detailCache[code], organizations);
                  return (
                    <tr
                      className={selectedCode === code ? "selected-row clickable-row" : "clickable-row"}
                      key={code}
                      onClick={() => void loadIndicatorDetail(code)}
                    >
                      <td>
                        <span className="cell-text indicator-name-full" title={`${row.indicatorNumber} - ${row.indicatorName}`}>
                          <strong>{row.indicatorNumber}</strong>
                          {row.indicatorName}
                        </span>
                      </td>
                      <td>
                        {row.globalCode || row.globalNumber ? (
                          <button
                            className="inline-link-button"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleGlobalClick(indicator);
                            }}
                            title={row.globalName || row.globalCode}
                          >
                            {row.globalNumber || row.globalCode}
                            <ExternalLink size={11} />
                          </button>
                        ) : (
                          <span className="muted-code">Pending mapping</span>
                        )}
                      </td>
                      <td>
                        <span className="code-text" title={row.indicatorCode}>
                          {row.indicatorCode}
                        </span>
                        <span className="muted-code" title={row.indicatorNumber}>
                          {row.indicatorNumber}
                        </span>
                      </td>
                      <td>
                        <span className="cell-text" title={row.ministry}>
                          {row.ministry}
                        </span>
                      </td>
                      <td>
                        <span className="cell-text" title={row.department}>
                          {row.department}
                        </span>
                      </td>
                      <td>{row.uom}</td>
                      <td>{row.periodicity}</td>
                      <td>{row.lastUpdated}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      {isDetailLoading && <div className="detail-empty indicator-page-loading">Loading indicator details...</div>}
        </>
      )}

      {globalInfo && (
        <div className="global-info-overlay" role="dialog" aria-modal="true">
          <div className="global-info-card">
            <div className="detail-panel-header">
              <div>
                <span>Global Indicator Information</span>
                <h3>{textValue(globalInfo.global_indicator_number ?? globalInfo.global_indicator_code)}</h3>
              </div>
              <button className="icon-action" type="button" onClick={() => setGlobalInfo(null)}>
                x
              </button>
            </div>
            <div className="detail-field-grid">
              <DetailField label="Global indicator code" value={globalInfo.global_indicator_code} />
              <DetailField label="Global indicator number" value={globalInfo.global_indicator_number} />
              <DetailField label="Global indicator name" value={globalInfo.global_indicator_name} />
              <DetailField label="Mapping type" value={globalInfo.mapping_type} />
              <DetailField label="Tier code" value={globalInfo.tier_code} />
              <DetailField label="Status" value={globalInfo.status} />
            </div>
          </div>
        </div>
      )}
      {isCreateOpen && (
        <div className="drawer-backdrop">
          <aside className="side-drawer">
            <div className="drawer-header">
              <div>
                <span>Create</span>
                <h3>{editingIndicatorCode ? "Edit Indicator" : "Indicator"}</h3>
              </div>
              <button className="icon-action" type="button" onClick={() => setIsCreateOpen(false)}>
                x
              </button>
            </div>
            <form className="drawer-form" onSubmit={(event) => void handleCreateIndicator(event)}>
              <div className="form-grid two">
                <label className="form-field">
                  <span>Framework</span>
                  <input value={activeFramework?.framework_code ?? ""} readOnly />
                </label>
                <label className="form-field">
                  <span>Edition</span>
                  <input value={activeFramework?.edition_code ?? ""} readOnly />
                </label>
              </div>
              <div className={hasParentLevelForIndicatorMapping ? "form-grid two" : "form-grid"}>
                {hasParentLevelForIndicatorMapping && (
                  <label className="form-field">
                    <span>{parentNodeLabel}</span>
                    <select
                      value={createForm.parent_node_code}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          parent_node_code: event.target.value,
                          target_node_code: "",
                        }))
                      }
                    >
                      <option value="">Select {parentNodeLabel.toLowerCase()}</option>
                      {parentNodeOptions.map((node) => (
                        <option value={node.node_code} key={node.node_code}>
                          {frameworkNodeOptionLabel(node, frameworkHierarchy)}
                        </option>
                      ))}
                    </select>
                    <small>Loaded from the selected unit's active framework hierarchy.</small>
                  </label>
                )}
                <label className="form-field">
                  <span>{targetNodeLabel} *</span>
                  <select
                    value={createForm.target_node_code}
                    onChange={(event) => setCreateForm((current) => ({ ...current, target_node_code: event.target.value }))}
                    required
                    disabled={targetNodeOptions.length === 0}
                  >
                    <option value="">
                      {targetNodeOptions.length ? `Select ${targetNodeLabel.toLowerCase()}` : "No indicator-mappable level available"}
                    </option>
                    {targetNodeOptions.map((node) => (
                      <option value={node.node_code} key={node.node_code}>
                        {frameworkNodeOptionLabel(node, frameworkHierarchy)}
                      </option>
                    ))}
                  </select>
                  <small>This creates the framework-indicator mapping for the indicator.</small>
                </label>
              </div>
              <label className="form-field">
                <span>Indicator code</span>
                <input
                  value={createForm.national_indicator_code}
                  onChange={(event) => setCreateForm((current) => ({ ...current, national_indicator_code: event.target.value.toUpperCase().replace(/\s+/g, "_") }))}
                  placeholder="Auto if blank"
                  readOnly={Boolean(editingIndicatorCode)}
                />
              </label>
              <label className="form-field">
                <span>Indicator number</span>
                <input
                  value={createForm.indicator_number}
                  onChange={(event) => setCreateForm((current) => ({ ...current, indicator_number: event.target.value }))}
                  placeholder="Example: 1.2.1"
                />
              </label>
              <label className="form-field">
                <span>Indicator name *</span>
                <input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label className="form-field">
                <span>Description</span>
                <textarea
                  value={createForm.description}
                  onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                />
              </label>
              <div className="form-grid two">
                <label className="form-field">
                  <span>Status</span>
                  <select value={createForm.status} onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value }))}>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Color</span>
                  <input
                    type="color"
                    value={createForm.color_value}
                    onChange={(event) => setCreateForm((current) => ({ ...current, color_value: event.target.value }))}
                  />
                </label>
              </div>
              <div className="drawer-footer">
                <button className="secondary-button" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button className="primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingIndicatorCode ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function buildIndicatorRow(indicator: IndicatorListItem, detail?: IndicatorDetail, organizations: MasterRecord[] = []) {
  const overview = overviewOf(detail);
  const metadata = firstMetadata(detail);
  const globalMapping = firstGlobalMapping(detail);
  const publishedUsage = (detail?.published_template_usage ?? []).find(
    (item) =>
      item.source_organization_code ||
      item.source_organization_name ||
      item.uom_code ||
      item.uom_name ||
      item.unit_code ||
      item.periodicity_code ||
      item.periodicity_name,
  );
  const publishedMinistry =
    indicator.source_organization_name ??
    publishedUsage?.ministry_name ??
    publishedUsage?.ministry_organization_code ??
    indicator.source_organization_code;
  const publishedDepartment =
    indicator.department_organization_name ??
    publishedUsage?.department_organization_name ??
    publishedUsage?.department_organization_code ??
    indicator.department_organization_code;
  const publishedUom =
    indicator.unit_of_measure_name ??
    indicator.uom_name ??
    publishedUsage?.uom_name ??
    publishedUsage?.uom_code ??
    publishedUsage?.unit_code ??
    indicator.unit_of_measure_code ??
    indicator.uom_code;
  const publishedPeriodicity =
    indicator.periodicity_name ??
    publishedUsage?.periodicity_name ??
    publishedUsage?.periodicity_code ??
    indicator.periodicity_code;

  return {
    indicatorCode: indicator.national_indicator_code || overview.national_indicator_code || "-",
    indicatorNumber: indicator.indicator_number || overview.indicator_number || "-",
    indicatorName: indicator.name || overview.name || "-",
    globalCode: indicator.global_indicator_code || globalMapping?.global_indicator_code || "",
    globalNumber: indicator.global_indicator_number || globalMapping?.global_indicator_number || "",
    globalName: indicator.global_indicator_name || globalMapping?.global_indicator_name || "",
    ministry: publishedMinistry || "-",
    department: publishedDepartment || "-",
    sourceCode: indicator.source_organization_code || publishedUsage?.source_organization_code || "",
    departmentCode: indicator.department_organization_code || publishedUsage?.department_organization_code || "",
    uom: publishedUom || "-",
    uomCode: indicator.unit_of_measure_code || indicator.uom_code || publishedUsage?.uom_code || publishedUsage?.unit_code || "",
    periodicity: publishedPeriodicity || "-",
    periodicityCode: indicator.periodicity_code || publishedUsage?.periodicity_code || "",
    lastUpdated: indicator.last_updated || indicator.updated_at || metadata?.latest_data_availability || "-",
  };
}

function findOrganization(organizations: MasterRecord[], code?: string) {
  if (!code) return undefined;
  return organizations.find((record) => String(record.organization_code ?? "").toUpperCase() === code.toUpperCase());
}

function organizationName(record?: MasterRecord) {
  const value = record?.name ?? record?.organization_name ?? record?.display_name ?? record?.organization_code;
  return value === undefined || value === null || value === "" ? undefined : String(value);
}

function resolveSourceHierarchy(source: IndicatorSourceAssignment | undefined, organizations: MasterRecord[]) {
  const sourceOrg = findOrganization(organizations, source?.source_organization_code);
  const explicitDepartment = findOrganization(organizations, source?.department_organization_code);
  const parentOrg = findOrganization(organizations, String(sourceOrg?.parent_organization_code ?? ""));
  const sourceType = String(sourceOrg?.organization_type ?? "").toUpperCase();
  const parentName = organizationName(parentOrg);
  const sourceName = source?.source_organization_name ?? organizationName(sourceOrg) ?? source?.source_organization_code;
  const explicitDepartmentName = source?.department_organization_name ?? organizationName(explicitDepartment);
  const sourceIsChild = Boolean(parentName && parentOrg?.organization_code !== sourceOrg?.organization_code);
  const sourceIsMinistry = sourceType.includes("MINISTRY") || !sourceIsChild;

  return {
    ministry: sourceIsChild ? parentName : sourceName,
    department: explicitDepartmentName ?? (sourceIsChild && !sourceIsMinistry ? sourceName : undefined),
  };
}

function nodeLabel(node?: FrameworkMappedNode) {
  if (!node) return "-";
  const number = node.node_number ? `${node.node_number} - ` : "";
  return `${number}${node.name ?? node.short_name ?? node.node_code ?? "-"}`;
}

function IndicatorDetailPage({
  detail,
  organizations,
  periodicities,
  uoms,
  globalIndicators,
  officers,
  activeFramework,
  frameworkHierarchy,
  activeTab,
  onTabChange,
  onRefresh,
  onEdit,
  onBack,
}: {
  detail: IndicatorDetail;
  organizations: MasterRecord[];
  periodicities: MasterRecord[];
  uoms: MasterRecord[];
  globalIndicators: GlobalIndicatorListItem[];
  officers: MasterRecord[];
  activeFramework: FrameworkEdition | null;
  frameworkHierarchy: FrameworkHierarchy | null;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onRefresh: () => Promise<void>;
  onEdit: () => void;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [mappingForm, setMappingForm] = useState({
    node_code: "",
    mapping_type: "PRIMARY",
    global_indicator_code: "",
    global_mapping_type: "DIRECT",
    source_organization_code: "",
    officer_code: "",
    officer_label: "",
    recipient_type: "TO",
    contact_role: "NODAL_OFFICER",
    periodicity_code: "",
    assignment_role: "PRIMARY_SOURCE",
    measure_code: "",
    measure_name: "",
    measure_unit_code: "",
    value_type: "NUMERIC",
    aggregation_type: "NONE",
  });
  const [mappingPanel, setMappingPanel] = useState<MappingPanel>("");
  const [isMappingSaving, setIsMappingSaving] = useState("");
  const [mappingNotice, setMappingNotice] = useState("");
  const overview = overviewOf(detail);
  const publishedTemplateUsage = useMemo(() => detail.published_template_usage ?? [], [detail.published_template_usage]);
  const publishedSourceUsage = useMemo(
    () =>
      uniquePublishedUsage(
        publishedTemplateUsage.filter((item) => item.source_organization_code || item.source_organization_name),
        (item) => [
          item.template_code ?? "",
          item.version_code ?? "",
          item.source_organization_code ?? "",
          item.access_role ?? "",
          item.provider_mode ?? "",
        ].join("|"),
      ),
    [publishedTemplateUsage],
  );
  const publishedPeriodicityUsage = useMemo(
    () =>
      uniquePublishedUsage(
        publishedTemplateUsage.filter((item) => item.periodicity_code || item.periodicity_name),
        (item) => [item.template_code ?? "", item.version_code ?? "", item.periodicity_code ?? item.periodicity_name ?? ""].join("|"),
      ),
    [publishedTemplateUsage],
  );
  const publishedUomUsage = useMemo(
    () =>
      uniquePublishedUsage(
        publishedTemplateUsage.filter((item) => item.uom_code || item.uom_name || item.unit_code),
        (item) => [item.template_code ?? "", item.version_code ?? "", item.uom_code ?? item.unit_code ?? item.uom_name ?? ""].join("|"),
      ),
    [publishedTemplateUsage],
  );
  const publishedMeasureUsage = useMemo(
    () =>
      uniquePublishedUsage(
        publishedTemplateUsage.filter((item) => item.template_measure_code || item.measure_code || item.source_measure_code),
        (item) => [
          item.template_code ?? "",
          item.version_code ?? "",
          item.template_measure_code ?? item.measure_code ?? item.source_measure_code ?? "",
          item.source_organization_code ?? "",
        ].join("|"),
      ),
    [publishedTemplateUsage],
  );
  const publishedOfficerUsage = useMemo(
    () =>
      publishedTemplateUsage.flatMap((item) =>
        (item.officers ?? []).map((officer) => ({
          usage: item,
          officer,
        })),
      ),
    [publishedTemplateUsage],
  );
  const publishedPrimaryUsage = publishedTemplateUsage[0];
  const sourceMinistry = publishedSourceUsage[0]?.ministry_name ?? publishedSourceUsage[0]?.ministry_organization_code;
  const sourceDepartment = publishedSourceUsage[0]?.department_organization_name ?? publishedSourceUsage[0]?.department_organization_code;
  const sourceUom = publishedUomUsage[0]?.uom_name ?? publishedUomUsage[0]?.uom_code ?? publishedUomUsage[0]?.unit_code;
  const sourcePeriodicity = publishedPeriodicityUsage[0]?.periodicity_name ?? publishedPeriodicityUsage[0]?.periodicity_code;
  const measure = firstMeasure(detail);
  const version = firstVersion(detail);
  const metadata = firstMetadata(detail);
  const globalMapping = firstGlobalMapping(detail);
  const frameworkMapping = firstFrameworkMapping(detail);
  const mappedNode = frameworkMapping?.mapped_node;
  const relatedHierarchyPath = frameworkHierarchyPathForMappedNode(mappedNode, frameworkHierarchy, frameworkMapping?.parents ?? []);
  const notes = parseMetadataNotes(metadata?.notes);
  const indicatorNumber = textValue(overview.indicator_number);
  const color = overview.color_value || "#e91d3d";
  const indicatorCode = getIndicatorCode(overview);
  const currentVersionCode = version?.version_code || overview.current_version_code || "";
  const frameworkCode = overview.framework_code || activeFramework?.framework_code || "";
  const editionCode = overview.edition_code || activeFramework?.edition_code || "";
  const metadataRows: Array<[string, unknown]> = [
    ...relatedHierarchyPath.map((node): [string, unknown] => [node.level_name ?? "Framework Level", nodeLabel(node)]),
    ["Indicator", `${indicatorNumber}: ${getIndicatorName(overview)}`],
    ["Data Source Ministry", sourceMinistry],
    ["Department / Division", sourceDepartment],
    ["Description of Indicator", overview.description ?? version?.description],
    [
      "Computation",
      metadata?.computation_description ??
        noteValue(notes, ["computation", "formula", "calculation_method", "computation_formula"]),
    ],
    ["Unit of Measurement", sourceUom],
    ["Periodicity", sourcePeriodicity],
    ["Level of Disaggregation", noteValue(notes, ["level_of_disaggregation", "disaggregation_level"])],
    ["Type of Disaggregation", noteValue(notes, ["type_of_disaggregation", "disaggregation_type"])],
    ["Mapping with Global Indicator", globalMapping?.global_indicator_number ?? globalMapping?.global_indicator_code],
    ["References", noteValue(notes, ["references", "reference", "source_references"]) ?? metadata?.source_reference_code],
  ];

  useEffect(() => {
    setMappingForm({
      node_code: mappedNode?.node_code ?? "",
      mapping_type: frameworkMapping?.mapping_type ?? "PRIMARY",
      global_indicator_code: globalMapping?.global_indicator_code ?? "",
      global_mapping_type: globalMapping?.mapping_type ?? "DIRECT",
      source_organization_code: publishedPrimaryUsage?.source_organization_code ?? "",
      officer_code: "",
      officer_label: "",
      recipient_type: "TO",
      contact_role: "NODAL_OFFICER",
      periodicity_code: publishedPrimaryUsage?.periodicity_code ?? "",
      assignment_role: publishedPrimaryUsage?.access_role ?? "PRIMARY_SOURCE",
      measure_code: measure?.measure_code ?? "",
      measure_name: textValue(measure?.name === "-" ? "" : measure?.name ?? measure?.measure_code ?? ""),
      measure_unit_code: measure?.unit_code ?? version?.unit_of_measure_code ?? "",
      value_type: measure?.value_type ?? "NUMERIC",
      aggregation_type: measure?.aggregation_type ?? "NONE",
    });
    setMappingNotice("");
    setMappingPanel("");
  }, [detail]);
  const sourceAssignments = useMemo(() => dedupeSourceAssignments([]), []);
  const sourceOfficers = useMemo(() => [], []);
  const selectedGlobalIndicator = globalIndicators.find((record) => record.global_indicator_code === mappingForm.global_indicator_code);
  const selectedSourceOrganization = organizations.find((record) => String(record.organization_code) === mappingForm.source_organization_code);
  const selectedPeriodicity = !mappingForm.periodicity_code || periodicities.some((record) => String(record.periodicity_code) === mappingForm.periodicity_code);
  const selectedMeasure = (detail.measures ?? []).find((item) => item.measure_code === mappingForm.measure_code);
  const selectedUom = !mappingForm.measure_unit_code || uoms.some((record) => String(record.uom_code) === mappingForm.measure_unit_code);
  const selectedOfficer = officers.find((record) => officerOptionLabel(record) === mappingForm.officer_label);
  const selectedOfficerSourceAssignment = sourceAssignments.find((record) => record.source_organization_code === mappingForm.source_organization_code);
  const canSaveGlobalMapping = Boolean(frameworkCode && editionCode && indicatorCode && selectedGlobalIndicator && !isMappingSaving);
  const canSaveSourceAssignment = Boolean(frameworkCode && editionCode && indicatorCode && selectedSourceOrganization && selectedPeriodicity && !isMappingSaving);
  const canSaveSourceOfficer = Boolean(indicatorCode && selectedOfficerSourceAssignment && selectedOfficer && !isMappingSaving);
  const canSaveMeasure = Boolean(currentVersionCode && selectedMeasure && selectedUom && !isMappingSaving);

  async function runMappingSave(action: string, work: () => Promise<unknown>) {
    setIsMappingSaving(action);
    setMappingNotice("");
    try {
      await work();
      await onRefresh();
      setMappingNotice("Mapping changes saved.");
    } catch (error) {
      setMappingNotice(error instanceof Error ? error.message : "Mapping changes could not be saved.");
    } finally {
      setIsMappingSaving("");
    }
  }

  return (
    <div className="indicator-detail-page">
      <div className="breadcrumb">Home / Indicator Management / Indicators / {indicatorNumber}</div>
      <h2>Indicator {indicatorNumber}</h2>

      <section className="indicator-detail-hero">
        <div className="indicator-hero-actions">
          <button className="secondary-button compact" type="button" onClick={onEdit}>
            <Edit3 size={12} />
            Edit
          </button>
          <button className="secondary-button compact indicator-back-button" type="button" onClick={onBack}>
            Back to Indicators
          </button>
        </div>
        <div className="indicator-title-row">
          <div className="indicator-number-tile" style={{ color, borderColor: `${color}55`, background: `${color}12` }}>
            {indicatorNumber}
          </div>
          <div>
            <span>Official Indicator Metadata</span>
            <h3>{getIndicatorName(overview)}</h3>
          </div>
        </div>
      </section>

        <section className="indicator-summary-grid">
          <DetailMetric label="Data Source Ministry" value={sourceMinistry} />
          <DetailMetric label="Department / Division" value={sourceDepartment} />
          <DetailMetric label="Unit" value={sourceUom} />
          <DetailMetric label="Periodicity" value={sourcePeriodicity} />
        </section>

      <div className={`indicator-detail-layout ${activeTab === "mapping" ? "mapping-active" : ""}`}>
        <section className="indicator-official-metadata">
          <header>
            <div>
              <h3>Official Indicator Metadata</h3>
              <p>Metadata definition used for indicator configuration and reporting reference.</p>
            </div>
            <div className="indicator-main-tabs inline">
              <button className={activeTab === "details" ? "active" : ""} type="button" onClick={() => onTabChange("details")}>
                Details
              </button>
              <button className={activeTab === "mapping" ? "active" : ""} type="button" onClick={() => onTabChange("mapping")}>
                Mapping
              </button>
            </div>
          </header>

          {activeTab === "details" ? (
            <div className="official-metadata-table">
              {metadataRows.map(([label, value], index) => (
                <div className={index < 2 ? "highlight-row" : ""} key={label}>
                  <span>{label}</span>
                  <strong>{textValue(value)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="indicator-mapping-detail">
              {mappingNotice && <div className={mappingNotice.includes("could not") || mappingNotice.includes("failed") ? "notice error compact" : "notice success compact"}>{mappingNotice}</div>}
              <InfoSection
                title="Global Indicator Mapping"
                id="global-map"
                tone="global"
                action={
                  <button className="secondary-button compact" type="button" onClick={() => setMappingPanel("global")}>
                    Map Global Indicator
                  </button>
                }
              >
                {globalMapping ? (
                  <MappingListRow
                    title={`${textValue(globalMapping.global_indicator_number ?? globalMapping.global_indicator_code)} - ${textValue(globalMapping.global_indicator_name)}`}
                    meta={[globalMapping.mapping_type, globalMapping.status, globalMapping.is_active === false ? "Inactive" : "Active"]}
                    onUnmap={() =>
                      void runMappingSave("global-off", () =>
                        saveGlobalIndicatorMapping({
                          framework_code: frameworkCode,
                          edition_code: editionCode,
                          national_indicator_code: indicatorCode,
                          global_indicator_code: globalMapping.global_indicator_code ?? "",
                          mapping_type: globalMapping.mapping_type ?? "DIRECT",
                          is_active: false,
                        }),
                      )
                    }
                    disabled={!frameworkCode || !editionCode || !indicatorCode || !globalMapping.global_indicator_code || Boolean(isMappingSaving)}
                  />
                ) : (
                  <div className="detail-empty">No global indicator mapped.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Source Assignment"
                id="source-map"
                tone="source"
              >
                <div className="drawer-info-note">
                  Read-only. Source ownership must come from published template usage and template/data-field provider policy, not direct edits on this indicator page.
                </div>
                {publishedSourceUsage.length ? (
                  publishedSourceUsage.map((item) => (
                    <MappingListRow
                      key={usageKey(item, "source")}
                      title={usageSourceTitle(item)}
                      meta={[
                        item.template_name ?? item.template_code,
                        item.version_title ?? item.version_code,
                        item.source_organization_code,
                        item.access_role,
                        item.is_primary_provider ? "Primary provider" : undefined,
                        item.can_enter_data ? "Data entry" : undefined,
                      ]}
                    />
                  ))
                ) : (
                  <div className="detail-empty">No published template-derived source usage is available yet.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Periodicity"
                id="periodicity-map"
                tone="periodicity"
              >
                <div className="drawer-info-note">
                  Read-only. Periodicity is resolved through published template/request scheduling context.
                </div>
                {publishedPeriodicityUsage.length ? (
                  publishedPeriodicityUsage.map((item) => (
                    <MappingListRow
                      key={usageKey(item, "periodicity")}
                      title={textValue(item.periodicity_name ?? item.periodicity_code)}
                      meta={[item.template_name ?? item.template_code, item.version_title ?? item.version_code, usageSourceTitle(item)]}
                    />
                  ))
                ) : (
                  <div className="detail-empty">No published template-derived periodicity usage is available yet.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Source Officer Assignment"
                id="source-officer-map"
                tone="officer"
              >
                <div className="drawer-info-note">
                  Read-only. Officer recipients must be shown from published template/source provider usage when that read model is available.
                </div>
                {publishedSourceUsage.length ? (
                  publishedSourceUsage.map((usage) => {
                    const officersForAssignment = publishedOfficerUsage.filter(
                      (item) => item.usage.source_organization_code === usage.source_organization_code && item.usage.template_measure_code === usage.template_measure_code,
                    );
                    return (
                      <div className="source-officer-group" key={`${usageKey(usage, "officers")}`}>
                        <div className="source-officer-group-header">
                          <strong>{usageSourceTitle(usage)}</strong>
                          <span>{textValue(usage.template_name ?? usage.template_code)} / {textValue(usage.measure_name ?? usage.template_measure_code)}</span>
                        </div>
                        {officersForAssignment.length ? (
                          officersForAssignment.map((item) => (
                            <MappingListRow
                              key={`${usageKey(item.usage, "officer")}-${item.officer.recipient_type}-${item.officer.email_address}`}
                              title={textValue(item.officer.officer_display_name ?? item.officer.display_name)}
                              badge={item.officer.recipient_type}
                              meta={[item.officer.contact_role, item.officer.email_address, item.officer.is_active === false ? "Inactive" : "Active"]}
                            />
                          ))
                        ) : (
                          <div className="detail-empty compact-empty">No published template-derived officer recipients available for this source.</div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="detail-empty">No published template-derived officer usage is available yet.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Unit of Measurement"
                id="uom-map"
                tone="uom"
              >
                <div className="drawer-info-note">
                  Read-only. UOM shown here must reflect measures used by published template versions.
                </div>
                {publishedUomUsage.length ? (
                  publishedUomUsage.map((item) => (
                    <MappingListRow
                      key={usageKey(item, "uom")}
                      title={textValue(item.uom_name ?? item.uom_code ?? item.unit_code)}
                      meta={[item.template_name ?? item.template_code, item.measure_name ?? item.template_measure_code, item.value_type]}
                    />
                  ))
                ) : (
                  <div className="detail-empty">No published template-derived UOM usage is available yet.</div>
                )}
              </InfoSection>
              <InfoSection
                title="Measures"
                id="measure-map"
                tone="measure"
              >
                <div className="drawer-info-note">
                  Read-only. Operational measure usage is finalized by Template Studio and published template versions.
                </div>
                {publishedMeasureUsage.length ? (
                  publishedMeasureUsage.map((item) => (
                    <MappingListRow
                      key={usageKey(item, "measure")}
                      title={textValue(item.measure_name ?? item.template_measure_code ?? item.measure_code)}
                      meta={[
                        item.template_name ?? item.template_code,
                        item.template_measure_code ?? item.measure_code,
                        item.source_measure_code,
                        item.value_type,
                        item.uom_name ?? item.uom_code ?? item.unit_code,
                        item.aggregation_type,
                      ]}
                    />
                  ))
                ) : (
                  <div className="detail-empty">No published template-derived measure usage is available yet.</div>
                )}
              </InfoSection>
              {mappingPanel && (
                <div className="drawer-overlay indicator-mapping-drawer-overlay">
                <aside className="form-drawer compact-form-drawer mapping-form-drawer">
                  <header>
                    <div>
                      <span>Indicator mapping</span>
                      <h4>Global Indicator</h4>
                    </div>
                    <button className="icon-action" type="button" onClick={() => setMappingPanel("")}>
                      x
                    </button>
                  </header>

                  {mappingPanel === "global" && (
                    <div className="mapping-drawer-body">
                      <datalist id="global-indicator-options">
                        {globalIndicators.map((record) => (
                          <option
                            key={record.global_indicator_code}
                            value={record.global_indicator_code}
                            label={`${record.indicator_number ?? record.global_indicator_code} - ${record.name ?? record.global_indicator_code}`}
                          />
                        ))}
                      </datalist>
                      <label>
                        <span>Global indicator *</span>
                        <input
                          list="global-indicator-options"
                          value={mappingForm.global_indicator_code}
                          onChange={(event) => setMappingForm((current) => ({ ...current, global_indicator_code: event.target.value }))}
                          placeholder="Search global indicator"
                        />
                        {!selectedGlobalIndicator && mappingForm.global_indicator_code && <em>Select an exact global indicator from the list.</em>}
                      </label>
                      <label>
                        <span>Mapping type</span>
                        <select
                          value={mappingForm.global_mapping_type}
                          onChange={(event) => setMappingForm((current) => ({ ...current, global_mapping_type: event.target.value }))}
                        >
                          <option value="DIRECT">DIRECT</option>
                          <option value="PROXY">PROXY</option>
                          <option value="PARTIAL">PARTIAL</option>
                        </select>
                      </label>
                      <div className="mapping-action-row always-visible">
                        <button
                          className="primary-button compact"
                          type="button"
                          disabled={!canSaveGlobalMapping}
                          onClick={() =>
                            void runMappingSave("global", () =>
                              saveGlobalIndicatorMapping({
                                framework_code: frameworkCode,
                                edition_code: editionCode,
                                national_indicator_code: indicatorCode,
                                global_indicator_code: mappingForm.global_indicator_code,
                                mapping_type: mappingForm.global_mapping_type,
                                is_active: true,
                              }),
                            )
                          }
                        >
                          {isMappingSaving === "global" ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="ghost-button compact"
                          type="button"
                          disabled={!canSaveGlobalMapping}
                          onClick={() =>
                            void runMappingSave("global-off", () =>
                              saveGlobalIndicatorMapping({
                                framework_code: frameworkCode,
                                edition_code: editionCode,
                                national_indicator_code: indicatorCode,
                                global_indicator_code: mappingForm.global_indicator_code,
                                mapping_type: mappingForm.global_mapping_type,
                                is_active: false,
                              }),
                            )
                          }
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>
                  )}

                </aside>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="indicator-side-stack">
          <section className="indicator-side-card">
            <h3>
              <CheckCircle2 size={15} />
              Metadata Status
            </h3>
            <DetailLine label="Completeness" value={metadata?.is_active === false ? "Inactive" : "Complete"} tone="success" />
            <DetailLine label="Last Updated" value={compactDate(overview.last_updated ?? overview.updated_at ?? metadata?.latest_data_availability)} />
            <DetailLine label="Source Document" value={metadata?.source_document_name ?? metadata?.source_reference_code} />
            <DetailLine label="Metadata Version" value={version?.version_label ?? version?.version_code} />
          </section>

          <section className="indicator-side-card">
            <h3>
              <FileText size={15} />
              Related Hierarchy
            </h3>
            {relatedHierarchyPath.length ? (
              relatedHierarchyPath.map((node) => (
                <DetailLine key={`${node.level_code}-${node.node_code}`} label={node.level_name ?? "Level"} value={nodeLabel(node)} />
              ))
            ) : (
              <DetailLine label="Framework" value="No hierarchy mapping found" />
            )}
            <DetailLine label="Indicator" value={`${indicatorNumber} - ${getIndicatorName(overview)}`} />
            <div className="side-action-row">
              {relatedHierarchyPath.map((node, index) => {
                const parent = relatedHierarchyPath[index - 1];
                const path =
                  parent?.level_code && parent.node_code
                    ? `/framework/levels/${encodeURIComponent(String(parent.level_code))}/${encodeURIComponent(String(parent.node_code))}?selected=${encodeURIComponent(String(node.node_code))}`
                    : `/framework/levels/${encodeURIComponent(String(node.level_code))}/${encodeURIComponent(String(node.node_code))}`;
                return (
                  <button
                    className="secondary-button compact"
                    key={`${node.level_code}-${node.node_code}-action`}
                    type="button"
                    disabled={!node.level_code || !node.node_code}
                    onClick={() => navigate(path)}
                  >
                    <ExternalLink size={12} />
                    Open {node.level_name ?? "Level"}
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InfoSection({
  title,
  id,
  tone = "default",
  action,
  children,
}: {
  title: string;
  id?: string;
  tone?: "default" | "global" | "source" | "periodicity" | "officer" | "uom" | "measure";
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`indicator-info-section tone-${tone}`} id={id}>
      <header>
        <h4>{title}</h4>
        {action}
      </header>
      <div className="indicator-info-grid">{children}</div>
    </section>
  );
}

function MappingListRow({
  title,
  meta,
  badge,
  onUnmap,
  disabled,
}: {
  title: string;
  meta: Array<unknown>;
  badge?: unknown;
  onUnmap?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mapping-list-row">
      <div>
        <strong title={title}>
          {badge ? <span className={`mapping-recipient-badge ${String(badge).toLowerCase()}`}>{textValue(badge)}</span> : null}
          {title}
        </strong>
        <span>{meta.map(textValue).filter((value) => value !== "-").join(" / ") || "-"}</span>
      </div>
      {onUnmap && (
        <button className="ghost-button compact danger" type="button" disabled={disabled} onClick={onUnmap}>
          Unmap
        </button>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: unknown }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{textValue(value)}</strong>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: unknown }) {
  return (
    <article className="indicator-detail-metric">
      <span>{label}</span>
      <strong>{textValue(value)}</strong>
    </article>
  );
}

function DetailLine({ label, value, tone }: { label: string; value: unknown; tone?: "success" }) {
  return (
    <div className="indicator-detail-line">
      <span>{label}</span>
      <strong className={tone === "success" ? "success-text" : ""}>{textValue(value)}</strong>
    </div>
  );
}
