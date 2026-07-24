import {
  ChevronRight,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  createDimension,
  createDimensionAlias,
  createDimensionMember,
  createDimensionMemberSet,
  createDimensionMemberSetItem,
  createDimensionRelationship,
  createDimensionRollupRule,
  deactivateDimension,
  deactivateDimensionAlias,
  deactivateDimensionMember,
  deactivateDimensionMemberSet,
  deactivateDimensionMemberSetItem,
  deactivateDimensionRelationship,
  deactivateDimensionRollupRule,
  getDimension,
  listDimensionAliases,
  listDimensionManagementRows,
  listDimensionMemberSets,
  listDimensionMemberSetMembers,
  listDimensionMembers,
  listDimensionRelationships,
  listDimensionRollupRules,
  listDimensions,
  listDimensionStatCards,
  listDimensionStructureTypes,
  updateDimension,
  type DimensionAlias,
  type DimensionDetail,
  type DimensionManagementRow,
  type DimensionMember,
  type DimensionMemberSet,
  type DimensionMemberSetItem,
  type DimensionRelationship,
  type DimensionRollupRule,
  type DimensionStatCard,
  type DimensionStructureType,
} from "../../api/dimensions.api";
import { getSelectedUnitCode, LOCALE_CHANGED_EVENT, UNIT_CHANGED_EVENT } from "../../api/session.api";

type DetailTab = "overview" | "members" | "relationships" | "sets" | "rollups" | "aliases";
type DrawerMode = "dimension" | "member" | "relationship" | "set" | "setItem" | "alias" | "rollup";
const DETAIL_TABS: DetailTab[] = ["overview", "members", "relationships", "sets", "aliases"];

const STRUCTURE_FILTERS = [
  { value: "ALL", label: "All structures" },
  { value: "MASTER_DATASET", label: "Master Dataset" },
  { value: "HIERARCHICAL", label: "Hierarchical" },
  { value: "FIXED_LIST", label: "Fixed List" },
  { value: "RANGE_BUCKETS", label: "Range Buckets" },
];

const SPECIAL_DIMENSION_CODES = new Set(["GEOGRAPHY", "TIME_PERIOD"]);

const emptyDimensionForm = {
  dimension_code: "",
  dimension_type: "GENERAL",
  dimension_structure_type: "FIXED_LIST",
  value_type: "TEXT",
  is_hierarchical: false,
  sort_order: 0,
  is_active: true,
  name: "",
  description: "",
};

const emptyMemberForm = {
  member_code: "",
  external_code: "",
  sort_order: 0,
  valid_from: "",
  valid_to: "",
  is_active: true,
  name: "",
  short_name: "",
  description: "",
};

const emptyRelationshipForm = {
  parent_member_code: "",
  child_member_code: "",
  relationship_type: "PARENT_CHILD",
  sort_order: 0,
  is_active: true,
};

const emptySetForm = {
  set_code: "",
  set_type: "CONTROLLED_SCOPE",
  is_active: true,
  name: "",
  description: "",
};

const emptySetItemForm = {
  set_code: "",
  member_code: "",
  sort_order: 0,
  is_active: true,
};

const emptyAliasForm = {
  member_code: "",
  alias_type: "SOURCE_CODE",
  alias_value: "",
  source_system_code: "",
  alias_locale_code: "",
  is_active: true,
};

const emptyRollupForm = {
  parent_member_code: "",
  rule_code: "",
  entry_mode: "MANUAL_WITH_VALIDATION",
  aggregation_method: "SUM",
  measure_code: "",
  weight_measure_code: "",
  validation_rule_code: "",
  is_active: true,
};

const emptyRollupChild = {
  member_code: "",
  child_order: 1,
  child_weight: "",
};

function textValue(value: unknown) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalize(value: unknown) {
  return textValue(value).toLowerCase();
}

function formatDateTime(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return textValue(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusOf(record: { status?: string; is_active?: boolean }) {
  if (record.is_active === false) return "INACTIVE";
  return (record.status || "ACTIVE").toUpperCase();
}

function displayName(record: DimensionManagementRow | DimensionDetail | null | undefined) {
  return textValue(record?.dimension_name ?? record?.name ?? record?.dimension_code);
}

function structureLabel(record: DimensionManagementRow | DimensionDetail | null | undefined) {
  return textValue(record?.dimension_structure_type_name ?? record?.type ?? record?.dimension_structure_type ?? record?.dimension_type);
}

function structureChips(record: DimensionManagementRow | DimensionDetail | null | undefined) {
  const structure = record?.structure;
  if (Array.isArray(structure)) return structure.slice(0, 4).map(String);
  if (typeof structure === "string" && structure.trim()) {
    return structure.split(/[>,|/]+/).map((item) => item.trim()).filter(Boolean).slice(0, 4);
  }
  if (record?.is_hierarchical) return ["Hierarchical"];
  return [structureLabel(record)].filter((value) => value !== "-");
}

export function DimensionLibraryPage() {
  const [rows, setRows] = useState<DimensionManagementRow[]>([]);
  const [statCards, setStatCards] = useState<DimensionStatCard[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<DimensionDetail | null>(null);
  const [members, setMembers] = useState<DimensionMember[]>([]);
  const [relationships, setRelationships] = useState<DimensionRelationship[]>([]);
  const [sets, setSets] = useState<DimensionMemberSet[]>([]);
  const [setItems, setSetItems] = useState<Record<string, DimensionMemberSetItem[]>>({});
  const [aliases, setAliases] = useState<DimensionAlias[]>([]);
  const [rollups, setRollups] = useState<DimensionRollupRule[]>([]);
  const [structureTypes, setStructureTypes] = useState<DimensionStructureType[]>([]);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [drawer, setDrawer] = useState<DrawerMode | null>(null);
  const [dimensionForm, setDimensionForm] = useState(emptyDimensionForm);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [relationshipForm, setRelationshipForm] = useState(emptyRelationshipForm);
  const [setForm, setSetForm] = useState(emptySetForm);
  const [setItemForm, setSetItemForm] = useState(emptySetItemForm);
  const [aliasForm, setAliasForm] = useState(emptyAliasForm);
  const [rollupForm, setRollupForm] = useState(emptyRollupForm);
  const [rollupChildren, setRollupChildren] = useState([emptyRollupChild]);
  const [listModal, setListModal] = useState<{ title: string; rows: DimensionMember[] } | null>(null);
  const [query, setQuery] = useState("");
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMemberCode, setEditingMemberCode] = useState("");
  const [editingRollupKey, setEditingRollupKey] = useState("");

  const selectedRow = useMemo(
    () => rows.find((row) => row.dimension_code === selectedCode) ?? rows[0] ?? null,
    [rows, selectedCode],
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        [
          row.dimension_code,
          row.dimension_name,
          row.name,
          row.type,
          row.dimension_type,
          row.dimension_structure_type,
          row.dimension_structure_type_name,
          row.status,
        ]
          .map(normalize)
          .join(" ")
          .includes(q);
      const statusMatches = statusFilter === "ALL" || statusOf(row) === statusFilter;
      const used = numberValue(row.used_in_count) > 0;
      const usageMatches = usageFilter === "ALL" || (usageFilter === "USED" ? used : !used);
      return matchesQuery && statusMatches && usageMatches;
    });
  }, [query, rows, statusFilter, usageFilter]);

  useEffect(() => {
    void loadPage();
    const handleContextChange = () => void loadPage();
    window.addEventListener(UNIT_CHANGED_EVENT, handleContextChange);
    window.addEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
    return () => {
      window.removeEventListener(UNIT_CHANGED_EVENT, handleContextChange);
      window.removeEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!selectedRow?.dimension_code) {
      setSelectedDetail(null);
      setMembers([]);
      setRelationships([]);
      setSets([]);
      setSetItems({});
      setAliases([]);
      setRollups([]);
      return;
    }
    void loadDetail(selectedRow.dimension_code);
  }, [selectedRow?.dimension_code]);

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [cardResponse, structureResponse, rowResponse] = await Promise.all([
        listDimensionStatCards().catch(() => ({ data: [] as DimensionStatCard[] })),
        listDimensionStructureTypes().catch(() => ({ data: [] as DimensionStructureType[] })),
        listDimensionManagementRows({ limit: 200 }).catch(async () => {
          const fallback = await listDimensions();
          return { data: { rows: fallback.data } };
        }),
      ]);
      const nextRows = (rowResponse.data?.rows ?? []).filter((row) => !SPECIAL_DIMENSION_CODES.has(String(row.dimension_code ?? "").toUpperCase()));
      setRows(nextRows);
      setStatCards(cardResponse.data ?? []);
      setStructureTypes(structureResponse.data ?? []);
      setSelectedCode((current) => (current && nextRows.some((row) => row.dimension_code === current) ? current : nextRows[0]?.dimension_code ?? ""));
    } catch {
      setRows([]);
      setStatCards([]);
      setSelectedCode("");
      setError("Dimension library could not be loaded. Please refresh or try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDetail(dimensionCode: string) {
    setIsDetailLoading(true);
    setError("");
    try {
      const [detailResponse, membersResponse, relationshipsResponse, setsResponse, aliasesResponse, rollupsResponse] = await Promise.all([
        getDimension(dimensionCode),
        listDimensionMembers(dimensionCode).catch(() => ({ data: [] as DimensionMember[] })),
        listDimensionRelationships(dimensionCode).catch(() => ({ data: [] as DimensionRelationship[] })),
        listDimensionMemberSets(dimensionCode).catch(() => ({ data: [] as DimensionMemberSet[] })),
        listDimensionAliases(dimensionCode).catch(() => ({ data: [] as DimensionAlias[] })),
        listDimensionRollupRules(dimensionCode).catch(() => ({ data: [] as DimensionRollupRule[] })),
      ]);
      setSelectedDetail(detailResponse.data);
      setMembers(membersResponse.data ?? []);
      setRelationships(relationshipsResponse.data ?? []);
      const nextSets = setsResponse.data ?? [];
      setSets(nextSets);
      const itemEntries = await Promise.all(
        nextSets
          .filter((set) => set.set_code)
          .map(async (set) => {
            const items = await listDimensionMemberSetMembers(set.set_code ?? "").catch(() => ({ data: [] as DimensionMemberSetItem[] }));
            return [set.set_code ?? "", items.data ?? []] as const;
          }),
      );
      setSetItems(Object.fromEntries(itemEntries));
      setAliases(aliasesResponse.data ?? []);
      setRollups(rollupsResponse.data ?? []);
    } catch {
      setSelectedDetail(selectedRow);
      setError("Dimension detail could not be loaded. Select another dimension or refresh.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  function openDimensionDrawer(record?: DimensionManagementRow | DimensionDetail | null) {
    setDimensionForm(
      record
        ? {
            dimension_code: record.dimension_code ?? "",
            dimension_type: record.dimension_type ?? "GENERAL",
            dimension_structure_type: record.dimension_structure_type ?? (record.is_hierarchical ? "HIERARCHICAL" : "FIXED_LIST"),
            value_type: record.value_type ?? "TEXT",
            is_hierarchical: record.dimension_structure_type === "HIERARCHICAL" || Boolean(record.is_hierarchical),
            sort_order: numberValue(record.sort_order),
            is_active: record.is_active !== false,
            name: displayName(record) === "-" ? "" : displayName(record),
            description: record.description ?? "",
          }
        : emptyDimensionForm,
    );
    setDrawer("dimension");
  }

  async function submitDimension(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dimensionForm.name.trim()) {
      setError("Dimension name is required.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        dimension_code: dimensionForm.dimension_code.trim() || undefined,
        dimension_type: dimensionForm.dimension_type,
        dimension_structure_type: dimensionForm.dimension_structure_type,
        value_type: dimensionForm.value_type,
        is_hierarchical: dimensionForm.dimension_structure_type === "HIERARCHICAL",
        sort_order: Number(dimensionForm.sort_order) || 0,
        is_active: dimensionForm.is_active,
        name: dimensionForm.name.trim(),
        description: dimensionForm.description.trim() || undefined,
      };
      if (selectedDetail?.dimension_code && dimensionForm.dimension_code === selectedDetail.dimension_code) {
        await updateDimension(selectedDetail.dimension_code, payload);
      } else {
        const response = await createDimension(payload);
        if (response.data.dimension_code) setSelectedCode(response.data.dimension_code);
      }
      setNotice("Dimension saved.");
      setDrawer(null);
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Dimension could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCode || !memberForm.name.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      await createDimensionMember(selectedCode, {
        member_code: memberForm.member_code.trim() || undefined,
        external_code: memberForm.external_code.trim() || undefined,
        sort_order: Number(memberForm.sort_order) || 0,
        valid_from: memberForm.valid_from || undefined,
        valid_to: memberForm.valid_to || undefined,
        is_active: memberForm.is_active,
        name: memberForm.name.trim(),
        short_name: memberForm.short_name.trim() || undefined,
        description: memberForm.description.trim() || undefined,
      });
      setNotice(editingMemberCode ? "Dimension member updated." : "Dimension member saved.");
      setEditingMemberCode("");
      setDrawer(null);
      await loadDetail(selectedCode);
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Dimension member could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitRelationship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCode || !relationshipForm.parent_member_code || !relationshipForm.child_member_code) return;
    setIsSaving(true);
    setError("");
    try {
      await createDimensionRelationship(selectedCode, {
        parent_member_code: relationshipForm.parent_member_code,
        child_member_code: relationshipForm.child_member_code,
        relationship_type: relationshipForm.relationship_type,
        sort_order: Number(relationshipForm.sort_order) || 0,
        is_active: relationshipForm.is_active,
      });
      setNotice("Member relationship saved.");
      setDrawer(null);
      await loadDetail(selectedCode);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Member relationship could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCode || !setForm.name.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      await createDimensionMemberSet(selectedCode, {
        set_code: setForm.set_code.trim() || undefined,
        set_type: setForm.set_type,
        is_active: setForm.is_active,
        name: setForm.name.trim(),
        description: setForm.description.trim() || undefined,
      });
      setNotice("Member set saved.");
      setDrawer(null);
      await loadDetail(selectedCode);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Member set could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitSetItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCode || !setItemForm.set_code || !setItemForm.member_code) return;
    setIsSaving(true);
    setError("");
    try {
      await createDimensionMemberSetItem(setItemForm.set_code, {
        dimension_code: selectedCode,
        member_code: setItemForm.member_code,
        sort_order: Number(setItemForm.sort_order) || 0,
        is_active: setItemForm.is_active,
      });
      setNotice("Member added to set.");
      setDrawer(null);
      await loadDetail(selectedCode);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Member could not be added to set.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitAlias(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCode || !aliasForm.member_code || !aliasForm.alias_value.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      await createDimensionAlias(selectedCode, {
        member_code: aliasForm.member_code,
        alias_type: aliasForm.alias_type,
        alias_value: aliasForm.alias_value.trim(),
        source_system_code: aliasForm.source_system_code.trim() || undefined,
        alias_locale_code: aliasForm.alias_locale_code.trim() || undefined,
        is_active: aliasForm.is_active,
      });
      setNotice("Member alias saved.");
      setDrawer(null);
      await loadDetail(selectedCode);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Member alias could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitRollup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCode || !rollupForm.parent_member_code) return;
    setIsSaving(true);
    setError("");
    try {
      await createDimensionRollupRule(selectedCode, {
        parent_member_code: rollupForm.parent_member_code,
        rule_code: rollupForm.rule_code.trim() || undefined,
        entry_mode: rollupForm.entry_mode,
        aggregation_method: rollupForm.aggregation_method,
        measure_code: rollupForm.measure_code.trim() || undefined,
        weight_measure_code: rollupForm.weight_measure_code.trim() || undefined,
        validation_rule_code: rollupForm.validation_rule_code.trim() || undefined,
        is_active: rollupForm.is_active,
        children: rollupChildren
          .filter((child) => child.member_code)
          .map((child, index) => ({
            member_code: child.member_code,
            child_order: Number(child.child_order) || index + 1,
            child_weight: child.child_weight === "" ? undefined : Number(child.child_weight),
            is_active: true,
          })),
      });
      setNotice(editingRollupKey ? "Rollup rule updated." : "Rollup rule saved.");
      setEditingRollupKey("");
      setDrawer(null);
      await loadDetail(selectedCode);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Rollup rule could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  function openTabCreate(tab: DetailTab) {
    if (tab === "overview") {
      openDimensionDrawer(null);
    } else if (tab === "members") {
      setEditingMemberCode("");
      setMemberForm(emptyMemberForm);
      setDrawer("member");
    } else if (tab === "relationships") {
      setRelationshipForm(emptyRelationshipForm);
      setDrawer("relationship");
    } else if (tab === "sets") {
      setSetForm(emptySetForm);
      setDrawer("set");
    } else if (tab === "rollups") {
      setEditingRollupKey("");
      setRollupForm(emptyRollupForm);
      setRollupChildren([emptyRollupChild]);
      setDrawer("rollup");
    } else {
      setAliasForm(emptyAliasForm);
      setDrawer("alias");
    }
  }

  function openMemberEdit(member: DimensionMember) {
    setEditingMemberCode(member.member_code ?? "");
    setMemberForm({
      member_code: member.member_code ?? "",
      external_code: member.external_code ?? "",
      sort_order: numberValue(member.sort_order),
      valid_from: member.valid_from ?? "",
      valid_to: member.valid_to ?? "",
      is_active: member.is_active !== false,
      name: member.name ?? "",
      short_name: member.short_name ?? "",
      description: member.description ?? "",
    });
    setDrawer("member");
  }

  function openRollupEdit(rollup: DimensionRollupRule) {
    setEditingRollupKey(`${rollup.parent_member_code ?? ""}:${rollup.rule_code ?? ""}`);
    setRollupForm({
      parent_member_code: rollup.parent_member_code ?? "",
      rule_code: rollup.rule_code ?? "",
      entry_mode: rollup.entry_mode ?? "MANUAL_WITH_VALIDATION",
      aggregation_method: rollup.aggregation_method ?? "SUM",
      measure_code: rollup.measure_code ?? "",
      weight_measure_code: rollup.weight_measure_code ?? "",
      validation_rule_code: rollup.validation_rule_code ?? "",
      is_active: rollup.is_active !== false,
    });
    const children = (rollup.children ?? []).map((child, index) => ({
      member_code: String(child.member_code ?? child.child_member_code ?? ""),
      child_order: Number(child.child_order ?? index + 1),
      child_weight: child.child_weight === undefined || child.child_weight === null ? "" : String(child.child_weight),
    }));
    setRollupChildren(children.length ? children : [emptyRollupChild]);
    setDrawer("rollup");
  }

  async function handleDeactivate(action: () => Promise<unknown>, successMessage: string) {
    if (!selectedCode && successMessage !== "Dimension deactivated.") return;
    if (!window.confirm("Deactivate this record? It can be restored from governance/API if required.")) return;
    setIsSaving(true);
    setError("");
    try {
      await action();
      setNotice(successMessage);
      if (selectedCode) await loadDetail(selectedCode);
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Record could not be deactivated.");
    } finally {
      setIsSaving(false);
    }
  }

  async function openMemberList(row: DimensionManagementRow) {
    setListModal({ title: displayName(row), rows: [] });
    try {
      const response = await listDimensionMembers(row.dimension_code ?? "", 500);
      setListModal({ title: displayName(row), rows: response.data ?? [] });
    } catch {
      setListModal({ title: displayName(row), rows: [] });
      setError("Dimension member list could not be loaded.");
    }
  }

  const fallbackCards: DimensionStatCard[] = [
    { card_code: "TOTAL_DIMENSIONS", label: "Total Dimensions", value: rows.length },
    { card_code: "UNUSED_DIMENSIONS", label: "Unused", value: rows.filter((row) => numberValue(row.used_in_count) === 0).length },
    { card_code: "HIGH_CARDINALITY_DIMENSIONS", label: "High Cardinality", value: rows.filter((row) => numberValue(row.value_count) >= 50).length },
  ];
  const cards = (statCards.length ? statCards : fallbackCards).filter((card) => card.card_code !== "MOST_USED_DIMENSION");

  return (
    <div className="workflow-page dimensions-page">
      <section className="page-heading-row compact">
        <div>
          <div className="breadcrumb">Home / Dimensions / Dimension Library</div>
          <h2>Dimension Library</h2>
          <p>Manage reusable dimension definitions, members, hierarchies, sets, and aliases used by templates and reporting.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button compact" type="button" onClick={() => void loadPage()}>
            <RefreshCw size={13} />
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={() => openDimensionDrawer(null)}>
            <Plus size={14} />
            Add Dimension
          </button>
        </div>
      </section>

      {notice && <div className="toast-notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four dimension-metric-grid">
        {cards.slice(0, 3).map((card) => (
          <article className="metric-card compact-metric-card dimension-metric-card" key={card.card_code ?? card.label}>
            <div className="metric-value">{textValue(card.display_value ?? card.value)}</div>
            <div className="metric-label">{textValue(card.label)}</div>
            <div className="metric-sublabel">{getSelectedUnitCode()}</div>
          </article>
        ))}
      </section>

      <section className="toolbar-panel dimensions-toolbar-panel">
        <label className="input-shell">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dimension by name or code" />
        </label>
        <select value={usageFilter} onChange={(event) => setUsageFilter(event.target.value)} aria-label="Usage">
          <option value="ALL">All usage</option>
          <option value="USED">Used</option>
          <option value="UNUSED">Unused</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ALL">All statuses</option>
        </select>
      </section>

      <section className="workflow-card dimension-workflow-card">
        <div className="tab-strip dimension-tab-strip">
          {DETAIL_TABS.map((tab) => (
            <button className={`tab-button ${activeTab === tab ? "active" : ""}`} type="button" onClick={() => setActiveTab(tab)} key={tab}>
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {selectedRow && activeTab !== "overview" && (
          <header className="dimension-selected-strip">
            <div>
              <span>{textValue(selectedRow.dimension_code)}</span>
              <strong>{displayName(selectedDetail ?? selectedRow)}</strong>
              <small>{structureLabel(selectedDetail ?? selectedRow)} / {numberValue(selectedRow.value_count).toLocaleString("en-IN")} values / {numberValue(selectedRow.used_in_count).toLocaleString("en-IN")} usages</small>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => openDimensionDrawer(selectedDetail ?? selectedRow)}>
              <Edit3 size={13} />
              Edit Dimension
            </button>
          </header>
        )}

        <div className="dimension-tab-content">
          {activeTab === "overview" ? (
            <div className="table-wrap dimension-table-wrap">
              <table className="data-table premium-dimension-table">
                <thead>
                  <tr>
                    <th>Dimension Name</th>
                    <th>Type</th>
                    <th>Values</th>
                    <th>Used In</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="table-empty">Loading dimensions...</div>
                      </td>
                    </tr>
                  ) : filteredRows.length ? (
                    filteredRows.map((row) => (
                      <tr
                        className={`clickable-row ${row.dimension_code === selectedRow?.dimension_code ? "selected-row" : ""}`}
                        key={row.dimension_code}
                        onClick={() => {
                          setSelectedCode(row.dimension_code ?? "");
                          setActiveTab("members");
                        }}
                      >
                        <td>
                          <div className="stacked-cell">
                            <strong>{displayName(row)}</strong>
                            <span>{textValue(row.dimension_code)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="stacked-cell">
                            <strong>{structureLabel(row)}</strong>
                            {row.dimension_structure_type === "HIERARCHICAL" || row.is_hierarchical ? (
                              <span className="hierarchy-path">{hierarchyPath(row, relationships)}</span>
                            ) : (
                              <button className="inline-link-button" type="button" onClick={(event) => { event.stopPropagation(); void openMemberList(row); }}>
                                <Eye size={12} />
                                Show List
                              </button>
                            )}
                          </div>
                        </td>
                        <td>{numberValue(row.value_count).toLocaleString("en-IN")}</td>
                        <td>{numberValue(row.used_in_count).toLocaleString("en-IN")}</td>
                        <td><StatusPill record={row} /></td>
                        <td>{formatDateTime(row.last_updated ?? row.updated_at)}</td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-button" type="button" title="Edit dimension" onClick={(event) => { event.stopPropagation(); openDimensionDrawer(row); }}>
                              <Edit3 size={13} />
                            </button>
                            <button className="icon-button danger" type="button" title="Deactivate dimension" onClick={(event) => { event.stopPropagation(); void handleDeactivate(() => deactivateDimension(row.dimension_code ?? ""), "Dimension deactivated."); }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <div className="table-empty">No dimensions match the selected filters.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : isDetailLoading ? (
            <div className="detail-empty">Loading dimension detail...</div>
          ) : activeTab === "members" ? (
            <DimensionListPanel
              title="Dimension Members"
              actionLabel="Add Member"
              onAction={() => openTabCreate("members")}
              rows={members}
              emptyText="No members returned for this dimension."
              onEdit={(member) => openMemberEdit(member)}
              onDelete={(member) => void handleDeactivate(() => deactivateDimensionMember(selectedCode, member.member_code ?? ""), "Member deactivated.")}
              render={(member) => (
                <>
                  <strong>{textValue(member.name ?? member.member_code)}</strong>
                  <span>{textValue(member.member_code)} {member.short_name ? `- ${member.short_name}` : ""}</span>
                </>
              )}
            />
          ) : activeTab === "relationships" ? (
            <DimensionListPanel
              title="Parent / Child Relationships"
              actionLabel="Link Members"
              onAction={() => openTabCreate("relationships")}
              rows={relationships}
              emptyText="No member relationships configured."
              onDelete={(relationship) => void handleDeactivate(() => deactivateDimensionRelationship(selectedCode, relationship), "Relationship unmapped.")}
              render={(relationship) => (
                <>
                  <strong>{textValue(relationship.parent_member_name ?? relationship.parent_member_code)} <ChevronRight size={12} /> {textValue(relationship.child_member_name ?? relationship.child_member_code)}</strong>
                  <span>{textValue(relationship.relationship_type)} - Sort {textValue(relationship.sort_order)}</span>
                </>
              )}
            />
          ) : activeTab === "sets" ? (
            <DimensionListPanel
              title="Member Sets"
              actionLabel="New Set"
              onAction={() => openTabCreate("sets")}
              rows={sets}
              emptyText="No member sets configured."
              onDelete={(set) => void handleDeactivate(() => deactivateDimensionMemberSet(selectedCode, set.set_code ?? ""), "Member set deactivated.")}
              render={(set) => (
                <>
                  <strong>{textValue(set.name ?? set.set_code)}</strong>
                  <span>{textValue(set.set_type)} - {numberValue(set.member_count)} members</span>
                  <div className="mini-chip-row">
                    {(setItems[set.set_code ?? ""] ?? []).slice(0, 8).map((item) => (
                      <button className="mini-chip removable" type="button" key={item.member_code} onClick={(event) => { event.stopPropagation(); void handleDeactivate(() => deactivateDimensionMemberSetItem(set.set_code ?? "", item.member_code ?? ""), "Member removed from set."); }}>
                        {textValue(item.member_name ?? item.member_code)}
                        <X size={10} />
                      </button>
                    ))}
                    <button className="inline-link-button" type="button" onClick={(event) => { event.stopPropagation(); setSetItemForm({ ...emptySetItemForm, set_code: set.set_code ?? "" }); setDrawer("setItem"); }}>
                      <Plus size={11} />
                      Add item
                    </button>
                  </div>
                </>
              )}
            />
          ) : activeTab === "rollups" ? (
            <DimensionListPanel
              title="Rollup Rules"
              actionLabel="New Rollup"
              onAction={() => openTabCreate("rollups")}
              rows={rollups}
              emptyText="No rollup rules configured."
              onEdit={(rollup) => openRollupEdit(rollup)}
              onDelete={(rollup) => void handleDeactivate(() => deactivateDimensionRollupRule(selectedCode, rollup), "Rollup rule deactivated.")}
              render={(rollup) => (
                <>
                  <strong>{textValue(rollup.parent_member_name ?? rollup.parent_member_code)}</strong>
                  <span>{textValue(rollup.rule_code)} - {textValue(rollup.entry_mode)} / {textValue(rollup.aggregation_method)}</span>
                  <div className="mini-chip-row">
                    {(rollup.children ?? []).slice(0, 8).map((child, index) => (
                      <span className="mini-chip" key={`${rollup.rule_code}-${index}`}>{textValue(child.member_name ?? child.member_code ?? child.child_member_code)}</span>
                    ))}
                  </div>
                </>
              )}
            />
          ) : (
            <DimensionListPanel
              title="Member Aliases"
              actionLabel="New Alias"
              onAction={() => openTabCreate("aliases")}
              rows={aliases}
              emptyText="No aliases configured."
              onDelete={(alias) => void handleDeactivate(() => deactivateDimensionAlias(selectedCode, alias), "Alias deactivated.")}
              render={(alias) => (
                <>
                  <strong>{textValue(alias.alias_value)}</strong>
                  <span>{textValue(alias.member_name ?? alias.member_code)} - {textValue(alias.alias_type)}</span>
                </>
              )}
            />
          )}
        </div>
      </section>

      {drawer === "dimension" && (
        <Drawer title="Dimension" subtitle={dimensionForm.dimension_code ? "Edit" : "Create"} onClose={() => setDrawer(null)}>
          <form className="drawer-form" onSubmit={submitDimension}>
            <label title="Stable public code used by API/UI contracts. Auto format uses A-Z, 0-9, and underscore.">Dimension code<input placeholder="Auto/generated code, e.g. GEOGRAPHY" value={dimensionForm.dimension_code} onChange={(event) => setDimensionForm((current) => ({ ...current, dimension_code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} /></label>
            <label title="User-facing dimension name shown in templates and reports.">Name *<input required placeholder="Enter dimension name, e.g. Geography" value={dimensionForm.name} onChange={(event) => setDimensionForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <div className="form-grid two">
              <label className="form-field" title="Business category for this dimension. General is for normal reusable lists, Time is for reporting periods, and Location is for geography/location dimensions.">Dimension type<select value={dimensionForm.dimension_type} onChange={(event) => setDimensionForm((current) => ({ ...current, dimension_type: event.target.value }))}><option value="GENERAL">General</option><option value="TIME">Time</option><option value="LOCATION">Location</option></select></label>
              <label className="form-field" title="Governed UI/business structure. HIERARCHICAL enables parent-child behavior and stores is_hierarchical as true.">Dimension structure<select value={dimensionForm.dimension_structure_type} onChange={(event) => setDimensionForm((current) => ({ ...current, dimension_structure_type: event.target.value, is_hierarchical: event.target.value === "HIERARCHICAL" }))}>{structureTypeOptions(structureTypes)}</select></label>
              <label className="form-field" title="Primitive value type used by import, validation, and display handling.">Value type<select value={dimensionForm.value_type} onChange={(event) => setDimensionForm((current) => ({ ...current, value_type: event.target.value }))}><option>TEXT</option><option>NUMBER</option><option>DATE</option><option>BOOLEAN</option></select></label>
            </div>
            <label title="Optional explanation for governance/admin users.">Description<textarea placeholder="Describe where this dimension is used and any special rules" value={dimensionForm.description} onChange={(event) => setDimensionForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <label className="checkbox-card"><input type="checkbox" checked={dimensionForm.is_active} onChange={(event) => setDimensionForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
            <DrawerFooter disabled={isSaving} />
          </form>
        </Drawer>
      )}

      {drawer === "member" && (
        <Drawer title="Dimension Member" subtitle={editingMemberCode ? "Edit" : "Create"} onClose={() => setDrawer(null)}>
          <form className="drawer-form" onSubmit={submitMember}>
            <label>Member code<input value={memberForm.member_code} onChange={(event) => setMemberForm((current) => ({ ...current, member_code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} /></label>
            <label>Name *<input required value={memberForm.name} onChange={(event) => setMemberForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Short name<input value={memberForm.short_name} onChange={(event) => setMemberForm((current) => ({ ...current, short_name: event.target.value }))} /></label>
            <label>External code<input value={memberForm.external_code} onChange={(event) => setMemberForm((current) => ({ ...current, external_code: event.target.value }))} /></label>
            <div className="form-grid two">
              <label className="form-field">Valid from<input type="date" value={memberForm.valid_from} onChange={(event) => setMemberForm((current) => ({ ...current, valid_from: event.target.value }))} /></label>
              <label className="form-field">Valid to<input type="date" value={memberForm.valid_to} onChange={(event) => setMemberForm((current) => ({ ...current, valid_to: event.target.value }))} /></label>
            </div>
            <label>Description<textarea value={memberForm.description} onChange={(event) => setMemberForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <label className="checkbox-card"><input type="checkbox" checked={memberForm.is_active} onChange={(event) => setMemberForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
            <DrawerFooter disabled={isSaving} />
          </form>
        </Drawer>
      )}

      {drawer === "relationship" && (
        <Drawer title="Member Relationship" subtitle={selectedCode} onClose={() => setDrawer(null)}>
          <form className="drawer-form" onSubmit={submitRelationship}>
            <label>Parent member *<select required value={relationshipForm.parent_member_code} onChange={(event) => setRelationshipForm((current) => ({ ...current, parent_member_code: event.target.value }))}>{memberOptions(members)}</select></label>
            <label>Child member *<select required value={relationshipForm.child_member_code} onChange={(event) => setRelationshipForm((current) => ({ ...current, child_member_code: event.target.value }))}>{memberOptions(members)}</select></label>
            <label>Relationship type<input value={relationshipForm.relationship_type} onChange={(event) => setRelationshipForm((current) => ({ ...current, relationship_type: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} /></label>
            <label className="checkbox-card"><input type="checkbox" checked={relationshipForm.is_active} onChange={(event) => setRelationshipForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
            <DrawerFooter disabled={isSaving || relationshipForm.parent_member_code === relationshipForm.child_member_code} />
          </form>
        </Drawer>
      )}

      {drawer === "set" && (
        <Drawer title="Member Set" subtitle={selectedCode} onClose={() => setDrawer(null)}>
          <form className="drawer-form" onSubmit={submitSet}>
            <label>Set code<input value={setForm.set_code} onChange={(event) => setSetForm((current) => ({ ...current, set_code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} /></label>
            <label>Name *<input required value={setForm.name} onChange={(event) => setSetForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Set type<input value={setForm.set_type} onChange={(event) => setSetForm((current) => ({ ...current, set_type: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} /></label>
            <label>Description<textarea value={setForm.description} onChange={(event) => setSetForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <label className="checkbox-card"><input type="checkbox" checked={setForm.is_active} onChange={(event) => setSetForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
            <DrawerFooter disabled={isSaving} />
          </form>
        </Drawer>
      )}

      {drawer === "setItem" && (
        <Drawer title="Member Set Item" subtitle={setItemForm.set_code} onClose={() => setDrawer(null)}>
          <form className="drawer-form" onSubmit={submitSetItem}>
            <label title="Choose the target set. Use New Set when the set itself does not exist yet.">Set *<select required value={setItemForm.set_code} onChange={(event) => setSetItemForm((current) => ({ ...current, set_code: event.target.value }))}>{setOptions(sets)}</select></label>
            <label title="Select an existing dimension member to include in this set.">Member *<select required value={setItemForm.member_code} onChange={(event) => setSetItemForm((current) => ({ ...current, member_code: event.target.value }))}>{memberOptions(members)}</select></label>
            <label title="Optional display order of this member inside the set.">Sort order<input type="number" value={setItemForm.sort_order} onChange={(event) => setSetItemForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} /></label>
            <label className="checkbox-card"><input type="checkbox" checked={setItemForm.is_active} onChange={(event) => setSetItemForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
            <DrawerFooter disabled={isSaving || !setItemForm.set_code || !setItemForm.member_code} />
          </form>
        </Drawer>
      )}

      {drawer === "alias" && (
        <Drawer title="Member Alias" subtitle={selectedCode} onClose={() => setDrawer(null)}>
          <form className="drawer-form" onSubmit={submitAlias}>
            <label>Member *<select required value={aliasForm.member_code} onChange={(event) => setAliasForm((current) => ({ ...current, member_code: event.target.value }))}>{memberOptions(members)}</select></label>
            <label title="Classify why this alternate value exists. SOURCE_CODE is for external import files; DISPLAY_ALIAS is for alternate labels; LEGACY_CODE is for old migrated codes.">Alias type<select value={aliasForm.alias_type} onChange={(event) => setAliasForm((current) => ({ ...current, alias_type: event.target.value }))}><option>SOURCE_CODE</option><option>DISPLAY_ALIAS</option><option>LEGACY_CODE</option><option>EXTERNAL_CODE</option><option>OTHER</option></select></label>
            <label title="The alternate code/name exactly as it appears in a source file, legacy system, or alternate display.">Alias value *<input required placeholder="Example: IND, INDIA, 01, DISTRICT_001" value={aliasForm.alias_value} onChange={(event) => setAliasForm((current) => ({ ...current, alias_value: event.target.value }))} /></label>
            <label title="Optional upstream system or file source this alias belongs to. Leave blank for common aliases.">Source system<input placeholder="Example: MOSPI_EXCEL, CENSUS_2011, LEGACY_PORTAL" value={aliasForm.source_system_code} onChange={(event) => setAliasForm((current) => ({ ...current, source_system_code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} /></label>
            <label className="checkbox-card"><input type="checkbox" checked={aliasForm.is_active} onChange={(event) => setAliasForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
            <DrawerFooter disabled={isSaving} />
          </form>
        </Drawer>
      )}

      {drawer === "rollup" && (
        <Drawer title="Rollup Rule" subtitle={editingRollupKey ? "Edit" : "Create"} onClose={() => setDrawer(null)}>
          <form className="drawer-form" onSubmit={submitRollup}>
            <label>Parent member *<select required value={rollupForm.parent_member_code} onChange={(event) => setRollupForm((current) => ({ ...current, parent_member_code: event.target.value }))}>{memberOptions(members)}</select></label>
            <label>Rule code<input value={rollupForm.rule_code} onChange={(event) => setRollupForm((current) => ({ ...current, rule_code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} /></label>
            <div className="form-grid two">
              <label className="form-field">Entry mode<select value={rollupForm.entry_mode} onChange={(event) => setRollupForm((current) => ({ ...current, entry_mode: event.target.value }))}><option>MANUAL</option><option>DERIVED</option><option>MANUAL_WITH_VALIDATION</option></select></label>
              <label className="form-field">Aggregation<select value={rollupForm.aggregation_method} onChange={(event) => setRollupForm((current) => ({ ...current, aggregation_method: event.target.value }))}><option>SUM</option><option>AVG</option><option>WEIGHTED_AVG</option><option>MIN</option><option>MAX</option><option>NO_ROLLUP</option></select></label>
            </div>
            <label title="Measure to aggregate for the selected parent member. This will become a searchable measure dropdown when the measure catalog is exposed here.">Measure code<input list="dimension-measure-code-examples" placeholder="Example: AREA_TOTAL, POPULATION_TOTAL, VALUE" value={rollupForm.measure_code} onChange={(event) => setRollupForm((current) => ({ ...current, measure_code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} /></label>
            <label title="Optional measure used only when Aggregation is WEIGHTED_AVG.">Weight measure code<input list="dimension-measure-code-examples" placeholder="Example: POPULATION_WEIGHT, AREA_WEIGHT" value={rollupForm.weight_measure_code} onChange={(event) => setRollupForm((current) => ({ ...current, weight_measure_code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} /></label>
            <p className="drawer-help-text">Weight is an optional numeric coefficient for weighted-average rollups. It is not a formula; leave it blank for normal SUM, AVG, MIN, MAX, and parent-child total checks.</p>
            <datalist id="dimension-measure-code-examples">
              <option value="VALUE" />
              <option value="POPULATION_TOTAL" />
              <option value="AREA_TOTAL" />
              <option value="POPULATION_WEIGHT" />
              <option value="AREA_WEIGHT" />
            </datalist>
            <div className="drawer-nested-section">
              <div className="drawer-nested-header">
                <strong>Rollup children</strong>
                <button className="secondary-button compact" type="button" onClick={() => setRollupChildren((current) => [...current, { ...emptyRollupChild, child_order: current.length + 1 }])}>
                  <Plus size={12} />
                  Add child
                </button>
              </div>
              {rollupChildren.map((child, index) => (
                <div className="form-grid three compact-grid rollup-child-editor" key={index}>
                  <label className="form-field">Child member<select value={child.member_code} onChange={(event) => setRollupChildren((current) => current.map((item, childIndex) => childIndex === index ? { ...item, member_code: event.target.value } : item))}>{memberOptions(members)}</select></label>
                  <label className="form-field">Order<input type="number" value={child.child_order} onChange={(event) => setRollupChildren((current) => current.map((item, childIndex) => childIndex === index ? { ...item, child_order: Number(event.target.value) } : item))} /></label>
                  <label className="form-field" title="Optional numeric weight used by weighted average rollups. Leave blank for SUM/AVG/MIN/MAX.">Weight<input type="number" placeholder="Example: 1.0" value={child.child_weight} onChange={(event) => setRollupChildren((current) => current.map((item, childIndex) => childIndex === index ? { ...item, child_weight: event.target.value } : item))} /></label>
                  <button
                    className="icon-button danger rollup-child-remove"
                    type="button"
                    title="Remove child"
                    aria-label="Remove rollup child"
                    onClick={() =>
                      setRollupChildren((current) =>
                        current.length > 1
                          ? current
                              .filter((_, childIndex) => childIndex !== index)
                              .map((item, childIndex) => ({ ...item, child_order: childIndex + 1 }))
                          : [{ ...emptyRollupChild }],
                      )
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <label className="checkbox-card"><input type="checkbox" checked={rollupForm.is_active} onChange={(event) => setRollupForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
            <DrawerFooter disabled={isSaving} />
          </form>
        </Drawer>
      )}

      {listModal && (
        <div className="modal-backdrop" onClick={() => setListModal(null)}>
          <section className="member-list-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>Member List</span>
                <h3>{listModal.title}</h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setListModal(null)} aria-label="Close member list">
                <X size={16} />
              </button>
            </header>
            <div className="member-list-modal-body">
              {listModal.rows.length ? listModal.rows.map((member) => (
                <article className="dimension-list-row compact" key={member.member_code}>
                  <div>
                    <strong>{textValue(member.name ?? member.member_code)}</strong>
                    <span>{textValue(member.member_code)}</span>
                  </div>
                  <StatusPill record={member} />
                </article>
              )) : <div className="detail-empty">No members available.</div>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatusPill({ record }: { record: { status?: string; is_active?: boolean } }) {
  const status = statusOf(record);
  return <span className={`status-pill ${status === "ACTIVE" ? "active" : "inactive"}`}>{status === "ACTIVE" ? "Active" : status}</span>;
}

function tabLabel(tab: DetailTab) {
  return {
    overview: "Dimensions",
    members: "Members",
    relationships: "Hierarchy",
    sets: "Member Sets",
    rollups: "Rollups",
    aliases: "Aliases",
  }[tab];
}

function tabActionLabel(tab: DetailTab) {
  return {
    overview: "Add Dimension",
    members: "Add Member",
    relationships: "Link Members",
    sets: "New Set",
    rollups: "New Rollup",
    aliases: "New Alias",
  }[tab];
}

function OverviewPanel({
  record,
  members,
  relationships,
  sets,
  rollups,
}: {
  record: DimensionManagementRow | DimensionDetail | null;
  members: DimensionMember[];
  relationships: DimensionRelationship[];
  sets: DimensionMemberSet[];
  rollups: DimensionRollupRule[];
}) {
  return (
    <div className="dimension-overview-grid">
      <InfoBlock title="Definition">
        <DetailLine label="Code" value={record?.dimension_code} />
        <DetailLine label="Name" value={displayName(record)} />
        <DetailLine label="Type" value={structureLabel(record)} />
        <DetailLine label="Status" value={statusOf(record ?? {})} />
      </InfoBlock>
      <InfoBlock title="Operational Shape">
        <DetailLine label="Members" value={members.length} />
        <DetailLine label="Relationships" value={relationships.length} />
        <DetailLine label="Member Sets" value={sets.length} />
        <DetailLine label="Rollup Rules" value={rollups.length} />
      </InfoBlock>
      <InfoBlock title="Usage">
        <DetailLine label="Used In" value={record?.used_in_count} />
        <DetailLine label="Value Count" value={record?.value_count} />
        <DetailLine label="Created By" value={record?.created_by} />
        <DetailLine label="Last Updated" value={formatDateTime(record?.last_updated ?? record?.updated_at)} />
      </InfoBlock>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dimension-info-block">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function DetailLine({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="dimension-detail-line">
      <span>{label}</span>
      <strong>{textValue(value)}</strong>
    </div>
  );
}

function DimensionListPanel<T>({
  title,
  actionLabel,
  rows,
  emptyText,
  render,
  onAction,
  onEdit,
  onDelete,
}: {
  title: string;
  actionLabel: string;
  rows: T[];
  emptyText: string;
  render: (row: T) => ReactNode;
  onAction: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}) {
  return (
    <section className="dimension-subsection">
      <header>
        <div>
          <span>Configuration</span>
          <h4>{title}</h4>
        </div>
        <button className="secondary-button compact" type="button" onClick={onAction}>
          <Plus size={13} />
          {actionLabel}
        </button>
      </header>
      <div className="dimension-row-list">
        {rows.length ? (
          rows.slice(0, 80).map((row, index) => (
            <article className="dimension-list-row" key={index}>
              <div>{render(row)}</div>
              <div className="row-actions dimension-tab-row-actions">
                <StatusPill record={row as { status?: string; is_active?: boolean }} />
                {onEdit && (
                  <button className="icon-button" type="button" title="Edit" onClick={() => onEdit(row)}>
                    <Edit3 size={13} />
                  </button>
                )}
                {onDelete && (
                  <button className="icon-button danger" type="button" title="Deactivate / unmap" onClick={() => onDelete(row)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="detail-empty">{emptyText}</div>
        )}
      </div>
    </section>
  );
}

function Drawer({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="drawer-overlay">
      <aside className="form-drawer compact-form-drawer">
        <header className="drawer-header">
          <div>
            <span>{subtitle}</span>
            <h3>{title}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}

function DrawerFooter({ disabled }: { disabled: boolean }) {
  return (
    <div className="drawer-footer">
      <button className="primary-button" type="submit" disabled={disabled}>
        Save
      </button>
    </div>
  );
}

function structureTypeOptions(structureTypes: DimensionStructureType[]) {
  const fallback = STRUCTURE_FILTERS.filter((filter) => filter.value !== "ALL").map((filter) => ({
    structure_type_code: filter.value,
    name: filter.label,
  }));
  return (structureTypes.length ? structureTypes : fallback).map((type) => (
    <option value={type.structure_type_code ?? ""} key={type.structure_type_code}>
      {textValue(type.name ?? type.structure_type_code)}
    </option>
  ));
}

function setOptions(sets: DimensionMemberSet[]) {
  return (
    <>
      <option value="">Select set</option>
      {sets.map((set) => (
        <option value={set.set_code ?? ""} key={set.set_code}>
          {textValue(set.name ?? set.set_code)}
        </option>
      ))}
    </>
  );
}

function hierarchyPath(record: DimensionManagementRow | DimensionDetail | null | undefined, relationships: DimensionRelationship[]) {
  const chips = structureChips(record).filter((chip) => chip && chip !== "Hierarchical");
  if (chips.length > 1) return chips.join(" > ");
  const parent = relationships.find((relationship) => relationship.parent_member_name || relationship.parent_member_code);
  if (parent) {
    return `${textValue(parent.parent_member_name ?? parent.parent_member_code)} > ${textValue(parent.child_member_name ?? parent.child_member_code)}`;
  }
  return textValue(record?.description ?? "Hierarchy path not configured");
}

function memberOptions(members: DimensionMember[]) {
  return (
    <>
      <option value="">Select member</option>
      {members.map((member) => (
        <option value={member.member_code ?? ""} key={member.member_code}>
          {textValue(member.name ?? member.member_code)}
        </option>
      ))}
    </>
  );
}
