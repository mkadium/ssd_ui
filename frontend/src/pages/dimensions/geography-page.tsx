import { Edit3, Globe2, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createGeography,
  createDimensionMemberSet,
  createDimensionMemberSetItem,
  createDimensionRollupRule,
  deactivateDimensionMemberSet,
  deactivateDimensionMemberSetItem,
  deactivateDimensionRollupRule,
  deactivateGeography,
  listDimensionMemberSetMembers,
  listDimensionMemberSets,
  listDimensionMembers,
  listDimensionRollupRules,
  listGeographies,
  listGeographyLevels,
  updateDimensionMemberSet,
  updateGeography,
  type DimensionMemberSet,
  type DimensionMemberSetItem,
  type DimensionMember,
  type DimensionRollupRule,
  type Geography,
  type GeographyLevel,
} from "../../api/dimensions.api";

type GeographyTab = "records" | "sets" | "rollups";
type GeographyDrawerMode = "geography" | "set" | "rollup" | null;

const emptyForm = {
  geography_code: "",
  level_code: "STATE_UT",
  parent_geography_code: "IND",
  iso_alpha2_code: "",
  iso_alpha3_code: "",
  census_code: "",
  effective_from: "",
  effective_to: "",
  is_active: true,
  name: "",
  short_name: "",
  description: "",
};

const emptySetForm = {
  set_code: "",
  set_type: "CONTROLLED_SCOPE",
  is_active: true,
  name: "",
  description: "",
};

const STANDARD_GEOGRAPHY_SETS = [
  {
    key: "national",
    label: "National",
    code: "GEOGRAPHY_NATIONAL",
    aliases: ["GEOGRAPHY_NATIONAL", "GEOGRAPHY_NATIONAL_COUNTRY"],
  },
  {
    key: "national_states",
    label: "National + States",
    code: "GEOGRAPHY_NATIONAL_STATES",
    aliases: ["GEOGRAPHY_NATIONAL_STATES", "GEOGRAPHY_NATIONAL_COUNTRY_STATES_UTS", "GEOGRAPHY_NATIONAL_STATES_UTS"],
  },
  {
    key: "states",
    label: "States",
    code: "GEOGRAPHY_STATES",
    aliases: ["GEOGRAPHY_STATES", "GEOGRAPHY_STATES_UTS_ONLY", "GEOGRAPHY_STATES_UTS"],
  },
] as const;

type StandardGeographySetKey = (typeof STANDARD_GEOGRAPHY_SETS)[number]["key"];

const emptyRollupForm = {
  parent_member_code: "",
  rule_code: "ROLLUP_INDIA_STATES_SUM",
  entry_mode: "DERIVED",
  aggregation_method: "SUM",
  measure_code: "",
  weight_measure_code: "",
  validation_rule_code: "",
  is_active: true,
};

function textValue(value: unknown) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function compactCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9_]/g, "_").replace(/_+/g, "_");
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return textValue(value);
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function geographyMemberCode(row: Geography | DimensionMember) {
  return String(row.member_code ?? ("geography_code" in row ? row.geography_code : "") ?? "");
}

function geographySearchText(row: Geography | DimensionMember) {
  return [
    geographyMemberCode(row),
    row.name,
    row.short_name,
    "level_code" in row ? row.level_code : "",
    "parent_geography_name" in row ? row.parent_geography_name : "",
  ]
    .map(textValue)
    .join(" ")
    .toLowerCase();
}

function geographyLevelText(row: Geography | DimensionMember) {
  return "level_name" in row || "level_code" in row ? textValue(row.level_name ?? row.level_code) : "Geography";
}

function standardConfig(key: StandardGeographySetKey) {
  return STANDARD_GEOGRAPHY_SETS.find((config) => config.key === key) ?? STANDARD_GEOGRAPHY_SETS[0];
}

function findStandardSet(sets: DimensionMemberSet[], key: StandardGeographySetKey) {
  const config = standardConfig(key);
  return sets.find((set) => {
    const code = String(set.set_code ?? "").toUpperCase();
    const name = String(set.name ?? "").trim().toLowerCase();
    return (config.aliases as readonly string[]).includes(code) || name === config.label.toLowerCase();
  });
}

export function GeographyPage() {
  const [levels, setLevels] = useState<GeographyLevel[]>([]);
  const [rows, setRows] = useState<Geography[]>([]);
  const [sets, setSets] = useState<DimensionMemberSet[]>([]);
  const [setItems, setSetItems] = useState<Record<string, DimensionMemberSetItem[]>>({});
  const [members, setMembers] = useState<DimensionMember[]>([]);
  const [rollups, setRollups] = useState<DimensionRollupRule[]>([]);
  const [selectedSetCode, setSelectedSetCode] = useState("");
  const [activeTab, setActiveTab] = useState<GeographyTab>("records");
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [drawer, setDrawer] = useState<GeographyDrawerMode>(null);
  const [editingCode, setEditingCode] = useState("");
  const [editingSetCode, setEditingSetCode] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [memberSetForm, setMemberSetForm] = useState(emptySetForm);
  const [selectedGeographyCodes, setSelectedGeographyCodes] = useState<string[]>([]);
  const [setSearch, setSetSearch] = useState("");
  const [rollupForm, setRollupForm] = useState(emptyRollupForm);
  const [rollupChildCodes, setRollupChildCodes] = useState<string[]>([]);
  const [rollupSearch, setRollupSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const parentOptions = useMemo(
    () => rows.filter((row) => row.geography_code && row.geography_code !== editingCode),
    [rows, editingCode],
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        [row.geography_code, row.name, row.short_name, row.level_code, row.parent_geography_name, row.parent_geography_code]
          .map(textValue)
          .some((value) => value.toLowerCase().includes(q));
      const matchesLevel = levelFilter === "ALL" || row.level_code === levelFilter;
      const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? row.is_active !== false : row.is_active === false);
      return matchesQuery && matchesLevel && matchesStatus;
    });
  }, [query, rows, levelFilter, statusFilter]);

  const rootCount = rows.filter((row) => !row.parent_geography_code).length;
  const stateUtCount = rows.filter((row) => row.level_code === "STATE_UT").length;
  const countryRows = useMemo(() => rows.filter((row) => row.level_code === "COUNTRY" || !row.parent_geography_code), [rows]);
  const stateRows = useMemo(() => rows.filter((row) => row.level_code === "STATE_UT" || row.parent_geography_code === "IND"), [rows]);
  const memberLookup = useMemo(() => {
    const lookup = new Map<string, DimensionMember | Geography>();
    members.forEach((member) => {
      if (member.member_code) lookup.set(member.member_code, member);
    });
    rows.forEach((row) => {
      const code = geographyMemberCode(row);
      if (code && !lookup.has(code)) lookup.set(code, row);
    });
    return lookup;
  }, [members, rows]);
  const selectedSet = useMemo(
    () => sets.find((set) => set.set_code === selectedSetCode) ?? null,
    [sets, selectedSetCode],
  );
  const selectedSetItems = selectedSet ? setItems[selectedSet.set_code ?? ""] ?? [] : [];
  const visibleGeographySets = useMemo(
    () =>
      STANDARD_GEOGRAPHY_SETS.map((config) => ({
        config,
        set: findStandardSet(sets, config.key),
      })),
    [sets],
  );
  const geographyPickerRows = useMemo(() => {
    const q = setSearch.trim().toLowerCase();
    const sourceRows = members.length ? members : rows;
    return sourceRows.filter((row) => {
      const code = geographyMemberCode(row);
      if (selectedGeographyCodes.includes(code)) return false;
      return (
        !q ||
        geographySearchText(row).includes(q)
      );
    });
  }, [members, rows, selectedGeographyCodes, setSearch]);
  const rollupPickerRows = useMemo(() => {
    const q = rollupSearch.trim().toLowerCase();
    const stateCodes = new Set(stateRows.map(geographyMemberCode).filter(Boolean));
    const sourceRows = members.length ? members.filter((member) => stateCodes.has(member.member_code ?? "")) : stateRows;
    return sourceRows.filter((row) => {
      const code = geographyMemberCode(row);
      if (rollupChildCodes.includes(code)) return false;
      return (
        !q ||
        geographySearchText(row).includes(q)
      );
    });
  }, [members, rollupChildCodes, rollupSearch, stateRows]);

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [levelResponse, countryResponse, stateResponse, memberResponse, setResponse, rollupResponse] = await Promise.all([
        listGeographyLevels(),
        listGeographies({ levelCode: "COUNTRY", limit: 500 }),
        listGeographies({ levelCode: "STATE_UT", limit: 500 }),
        listDimensionMembers("GEOGRAPHY", 1000).catch(() => ({ data: [] as DimensionMember[] })),
        listDimensionMemberSets("GEOGRAPHY").catch(() => ({ data: [] as DimensionMemberSet[] })),
        listDimensionRollupRules("GEOGRAPHY").catch(() => ({ data: [] as DimensionRollupRule[] })),
      ]);
      const nextSets = setResponse.data ?? [];
      setLevels(levelResponse.data ?? []);
      setRows([...(countryResponse.data ?? []), ...(stateResponse.data ?? [])]);
      setMembers(memberResponse.data ?? []);
      setSets(nextSets);
      setRollups(rollupResponse.data ?? []);
      setSelectedSetCode((current) => {
        if (nextSets.some((set) => set.set_code === current)) return current;
        return STANDARD_GEOGRAPHY_SETS.map((config) => findStandardSet(nextSets, config.key)).find(Boolean)?.set_code ?? "";
      });
      const loadedItems = await Promise.all(
        nextSets
          .filter((set) => set.set_code)
          .map(async (set) => {
            const response = await listDimensionMemberSetMembers(set.set_code ?? "").catch(() => ({ data: [] as DimensionMemberSetItem[] }));
            return [set.set_code ?? "", response.data ?? []] as const;
          }),
      );
      setSetItems(Object.fromEntries(loadedItems));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Geography records could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function openDrawer(row?: Geography) {
    if (row) {
      setEditingCode(row.geography_code ?? "");
      setForm({
        geography_code: row.geography_code ?? "",
        level_code: row.level_code ?? "STATE_UT",
        parent_geography_code: row.parent_geography_code ?? "",
        iso_alpha2_code: row.iso_alpha2_code ?? "",
        iso_alpha3_code: row.iso_alpha3_code ?? "",
        census_code: row.census_code ?? "",
        effective_from: row.effective_from ? String(row.effective_from).slice(0, 10) : "",
        effective_to: row.effective_to ? String(row.effective_to).slice(0, 10) : "",
        is_active: row.is_active !== false,
        name: row.name ?? "",
        short_name: row.short_name ?? "",
        description: row.description ?? "",
      });
    } else {
      setEditingCode("");
      setForm(emptyForm);
    }
    setDrawer("geography");
  }

  function openSetDrawer(set?: DimensionMemberSet, preset?: StandardGeographySetKey) {
    if (set) {
      const items = setItems[set.set_code ?? ""] ?? [];
      setEditingSetCode(set.set_code ?? "");
      setSelectedGeographyCodes(items.map((item) => item.member_code ?? "").filter(Boolean));
      setMemberSetForm({
        set_code: set.set_code ?? "",
        set_type: set.set_type ?? "CONTROLLED_SCOPE",
        is_active: set.is_active !== false,
        name: set.name ?? "",
        description: set.description ?? "",
      });
    } else {
      const presetConfig = {
        national: {
          set_code: standardConfig("national").code,
          name: "National",
          description: "Country-level controlled scope. Example: India only.",
          codes: countryRows.map(geographyMemberCode).filter(Boolean),
        },
        national_states: {
          set_code: standardConfig("national_states").code,
          name: "National + States",
          description: "Country plus current States and Union Territories.",
          codes: [...countryRows, ...stateRows].map(geographyMemberCode).filter(Boolean),
        },
        states: {
          set_code: standardConfig("states").code,
          name: "States",
          description: "Current States and Union Territories only.",
          codes: stateRows.map(geographyMemberCode).filter(Boolean),
        },
      }[preset ?? "national_states"];
      setEditingSetCode("");
      setSelectedGeographyCodes(presetConfig.codes);
      setMemberSetForm({
        set_code: presetConfig.set_code,
        set_type: "CONTROLLED_SCOPE",
        is_active: true,
        name: presetConfig.name,
        description: presetConfig.description,
      });
    }
    setSetSearch("");
    setDrawer("set");
  }

  function selectOrCreateStandardSet(key: StandardGeographySetKey) {
    const existing = findStandardSet(sets, key);
    if (existing?.set_code) {
      setSelectedSetCode(existing.set_code);
      return;
    }
    openSetDrawer(undefined, key);
  }

  async function saveGeography(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        parent_geography_code: form.parent_geography_code || undefined,
        iso_alpha2_code: form.iso_alpha2_code || undefined,
        iso_alpha3_code: form.iso_alpha3_code || undefined,
        census_code: form.census_code || undefined,
        effective_from: form.effective_from || undefined,
        effective_to: form.effective_to || undefined,
        short_name: form.short_name || undefined,
        description: form.description || undefined,
      };
      if (editingCode) {
        await updateGeography(editingCode, payload);
        setNotice("Geography updated.");
      } else {
        await createGeography(payload);
        setNotice("Geography created.");
      }
      setDrawer(null);
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Geography could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeGeography(row: Geography) {
    if (!row.geography_code) return;
    setIsSaving(true);
    setError("");
    try {
      await deactivateGeography(row.geography_code);
      setNotice("Geography deactivated.");
      await loadPage();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Geography could not be deactivated.");
    } finally {
      setIsSaving(false);
    }
  }

  function removeGeographyFromSet(memberCode: string) {
    setSelectedGeographyCodes((current) => current.filter((code) => code !== memberCode));
  }

  function addGeographyToSet(memberCode: string) {
    setSelectedGeographyCodes((current) => current.includes(memberCode) ? current : [...current, memberCode]);
  }

  async function saveGeographySet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const setCode = compactCode(memberSetForm.set_code);
      const payload = {
        ...memberSetForm,
        set_code: setCode,
        description: memberSetForm.description || undefined,
      };
      if (editingSetCode) await updateDimensionMemberSet("GEOGRAPHY", editingSetCode, payload);
      else await createDimensionMemberSet("GEOGRAPHY", payload);

      const existingCodes = new Set((setItems[editingSetCode || setCode] ?? []).map((item) => item.member_code ?? ""));
      await Promise.all(
        selectedGeographyCodes.map((memberCode, index) =>
          createDimensionMemberSetItem(setCode, {
            dimension_code: "GEOGRAPHY",
            member_code: memberCode,
            sort_order: index + 1,
            is_active: true,
          }),
        ),
      );
      if (editingSetCode) {
        await Promise.all(
          [...existingCodes]
            .filter((memberCode) => memberCode && !selectedGeographyCodes.includes(memberCode))
            .map((memberCode) => deactivateDimensionMemberSetItem(editingSetCode, memberCode)),
        );
      }
      setNotice(editingSetCode ? "Geography member set updated." : "Geography member set created.");
      setDrawer(null);
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Geography member set could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  function openRollupDrawer(rollup?: DimensionRollupRule) {
    const india = rows.find((row) => geographyMemberCode(row) === "IND") ?? countryRows[0];
    if (rollup) {
      setRollupForm({
        parent_member_code: rollup.parent_member_code ?? "",
        rule_code: rollup.rule_code ?? "ROLLUP_INDIA_STATES_SUM",
        entry_mode: rollup.entry_mode ?? "DERIVED",
        aggregation_method: rollup.aggregation_method ?? "SUM",
        measure_code: rollup.measure_code ?? "",
        weight_measure_code: rollup.weight_measure_code ?? "",
        validation_rule_code: rollup.validation_rule_code ?? "",
        is_active: rollup.is_active !== false,
      });
      setRollupChildCodes((rollup.children ?? []).map((child) => String(child.member_code ?? child.child_member_code ?? "")).filter(Boolean));
    } else {
      setRollupForm({
        ...emptyRollupForm,
        parent_member_code: geographyMemberCode(india ?? {}),
      });
      setRollupChildCodes(stateRows.map(geographyMemberCode).filter(Boolean));
    }
    setRollupSearch("");
    setDrawer("rollup");
  }

  async function removeGeographySet(set: DimensionMemberSet) {
    if (!set.set_code) return;
    setIsSaving(true);
    setError("");
    try {
      await deactivateDimensionMemberSet("GEOGRAPHY", set.set_code);
      setNotice("Geography member set deactivated.");
      await loadPage();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Geography member set could not be deactivated.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeSavedSetItem(setCode: string, memberCode: string) {
    if (!setCode || !memberCode) return;
    setIsSaving(true);
    setError("");
    try {
      await deactivateDimensionMemberSetItem(setCode, memberCode);
      setNotice("Geography member removed from set.");
      await loadPage();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Geography member could not be removed from set.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveRollup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rollupForm.parent_member_code || !rollupChildCodes.length) return;
    setIsSaving(true);
    setError("");
    try {
      await createDimensionRollupRule("GEOGRAPHY", {
        parent_member_code: rollupForm.parent_member_code,
        rule_code: compactCode(rollupForm.rule_code || "ROLLUP_INDIA_STATES_SUM"),
        entry_mode: rollupForm.entry_mode,
        aggregation_method: rollupForm.aggregation_method,
        measure_code: rollupForm.measure_code.trim() || undefined,
        weight_measure_code: rollupForm.weight_measure_code.trim() || undefined,
        validation_rule_code: rollupForm.validation_rule_code.trim() || undefined,
        is_active: rollupForm.is_active,
        children: rollupChildCodes.map((memberCode, index) => ({
          member_code: memberCode,
          child_order: index + 1,
          is_active: true,
        })),
      });
      setNotice("Geography rollup saved.");
      setDrawer(null);
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Geography rollup could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  function addRollupChild(memberCode: string) {
    setRollupChildCodes((current) => current.includes(memberCode) ? current : [...current, memberCode]);
  }

  function removeRollupChild(memberCode: string) {
    setRollupChildCodes((current) => current.filter((code) => code !== memberCode));
  }

  async function removeRollup(rollup: DimensionRollupRule) {
    setIsSaving(true);
    setError("");
    try {
      await deactivateDimensionRollupRule("GEOGRAPHY", rollup);
      setNotice("Geography rollup deactivated.");
      await loadPage();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Geography rollup could not be deactivated.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="workflow-page geography-page">
      <section className="page-heading-row compact">
        <div>
          <div className="breadcrumb">Home / Dimensions / Geography</div>
          <h2>Geography / Location</h2>
          <p>Maintain country, state, union territory, and future district reference members for reporting and templates.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button compact" type="button" onClick={() => void loadPage()}>
            <RefreshCw size={13} />
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={() => openDrawer()}>
            <Plus size={14} />
            Add Geography
          </button>
        </div>
      </section>

      {notice && <div className="toast-notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four dimension-metric-grid">
        <article className="metric-card compact-metric-card dimension-metric-card"><div className="metric-value">{rows.length}</div><div className="metric-label">Geography Records</div><div className="metric-sublabel">Active catalog</div></article>
        <article className="metric-card compact-metric-card dimension-metric-card"><div className="metric-value">{rootCount}</div><div className="metric-label">Root Countries</div><div className="metric-sublabel">Top level</div></article>
        <article className="metric-card compact-metric-card dimension-metric-card"><div className="metric-value">{stateUtCount}</div><div className="metric-label">States / UTs</div><div className="metric-sublabel">Under country</div></article>
        <article className="metric-card compact-metric-card dimension-metric-card"><div className="metric-value">{levels.length}</div><div className="metric-label">Levels</div><div className="metric-sublabel">Configured</div></article>
      </section>

      <section className="toolbar-panel dimensions-toolbar-panel">
        <label className="input-shell">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search geography by name, code, level, or parent" />
        </label>
        <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
          <option value="ALL">All levels</option>
          {levels.map((level) => <option value={level.level_code} key={level.level_code}>{level.name ?? level.level_code}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ALL">All statuses</option>
        </select>
      </section>

      <section className="workflow-card dimension-workflow-card geography-workspace-card">
        <div className="tab-strip dimension-tab-strip">
          {(["records", "sets", "rollups"] as GeographyTab[]).map((tab) => (
            <button className={`tab-button ${activeTab === tab ? "active" : ""}`} type="button" key={tab} onClick={() => setActiveTab(tab)}>
              {tab === "records" ? "Geography Records" : tab === "sets" ? "Member Sets" : "Rollups"}
            </button>
          ))}
        </div>

        {activeTab === "records" && (
        <div className="table-wrap dimension-table-wrap">
          <table className="data-table premium-dimension-table geography-table">
            <thead>
              <tr>
                <th>Geography</th>
                <th>Level</th>
                <th>Parent</th>
                <th>ISO / Census</th>
                <th>Effective From</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7}><div className="table-empty">Loading geography records...</div></td></tr>
              ) : filteredRows.length ? (
                filteredRows.map((row) => (
                  <tr key={row.geography_code}>
                    <td><div className="stacked-cell"><strong>{textValue(row.name)}</strong><span>{textValue(row.geography_code)}</span></div></td>
                    <td>{textValue(row.level_name ?? row.level_code)}</td>
                    <td>{textValue(row.parent_geography_name ?? row.parent_geography_code)}</td>
                    <td>{[row.iso_alpha2_code, row.iso_alpha3_code, row.census_code].filter(Boolean).join(" / ") || "-"}</td>
                    <td>{formatDate(row.effective_from)}</td>
                    <td><span className={`status-pill ${row.is_active === false ? "inactive" : "active"}`}>{row.is_active === false ? "Inactive" : "Active"}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" type="button" title="Edit geography" onClick={() => openDrawer(row)}><Edit3 size={13} /></button>
                        <button className="icon-button danger" type="button" title="Deactivate geography" disabled={isSaving} onClick={() => void removeGeography(row)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7}><div className="table-empty">No geography records match the selected filters.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        {activeTab === "sets" && (
          <div className="time-set-layout geography-set-layout">
            <aside className="time-set-list geography-set-list">
              <div className="section-title-row">
                <div>
                  <span>Member Sets</span>
                  <strong>Geography Scopes</strong>
                </div>
                <button className="secondary-button compact" type="button" onClick={() => openSetDrawer()}>
                  <Plus size={13} />
                  New
                </button>
              </div>
              {visibleGeographySets.map(({ config, set }) => (
                <article className={`time-set-card ${set?.set_code === selectedSet?.set_code ? "active" : ""}`} key={config.key}>
                  <button className="time-set-card-main" type="button" onClick={() => selectOrCreateStandardSet(config.key)}>
                    <strong>{config.label}</strong>
                    <span>{set ? `${textValue(set.set_code)} / ${textValue(set.set_type)}` : "Not configured yet"}</span>
                    <small>{set ? `${(setItems[set.set_code ?? ""] ?? []).length.toLocaleString("en-IN")} members` : "Click to create"}</small>
                  </button>
                  <div className="card-row-actions">
                    {set ? (
                      <>
                        <button className="icon-button" type="button" title="Edit member set" onClick={() => openSetDrawer(set)}><Edit3 size={13} /></button>
                        <button className="icon-button danger" type="button" title="Deactivate member set" disabled={isSaving} onClick={() => void removeGeographySet(set)}><Trash2 size={13} /></button>
                      </>
                    ) : (
                      <button className="icon-button" type="button" title="Create member set" onClick={() => openSetDrawer(undefined, config.key)}><Plus size={13} /></button>
                    )}
                  </div>
                </article>
              ))}
            </aside>
            <main className="time-set-detail geography-set-detail">
              <div className="section-title-row">
                <div>
                  <span>{textValue(selectedSet?.set_code)}</span>
                  <strong>{textValue(selectedSet?.name ?? "Select a member set")}</strong>
                </div>
                {selectedSet && (
                  <button className="secondary-button compact" type="button" onClick={() => openSetDrawer(selectedSet)}>
                    <Edit3 size={13} />
                    Edit Set
                  </button>
                )}
              </div>
              <div className="time-sequence-row">
                {selectedSetItems.length ? selectedSetItems.map((item, index) => (
                  <div className="time-sequence-item with-action geography-sequence-item" key={`${item.member_code}-${index}`}>
                    <span>{index + 1}</span>
                    <strong>{textValue(item.member_name ?? item.member_code)}</strong>
                    <small>{textValue(item.member_code)}</small>
                    <button className="icon-button danger" type="button" title="Remove from set" disabled={isSaving} onClick={() => void removeSavedSetItem(selectedSet?.set_code ?? "", item.member_code ?? "")}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )) : <div className="table-empty">No geography members added to this set.</div>}
              </div>
            </main>
          </div>
        )}

        {activeTab === "rollups" && (
          <div className="dimension-subsection geography-rollup-panel">
            <header>
              <div>
                <span>Configuration</span>
                <h4>Rollup Rules</h4>
              </div>
              <button className="secondary-button compact" type="button" onClick={() => openRollupDrawer()}>
                <Plus size={13} />
                Add Rollup
              </button>
            </header>
            <div className="dimension-row-list">
              {rollups.length ? rollups.map((rollup, index) => (
                <article className="dimension-list-row" key={`${rollup.parent_member_code}-${rollup.rule_code}-${index}`}>
                  <div>
                    <strong>{textValue(rollup.parent_member_name ?? rollup.parent_member_code)}</strong>
                    <span>{textValue(rollup.rule_code)} - {textValue(rollup.entry_mode)} / {textValue(rollup.aggregation_method)}</span>
                    <div className="mini-chip-row">
                      {(rollup.children ?? []).slice(0, 10).map((child, childIndex) => (
                        <span className="mini-chip" key={`${rollup.rule_code}-${childIndex}`}>
                          {textValue(child.member_name ?? child.child_member_name ?? child.member_code ?? child.child_member_code)}
                        </span>
                      ))}
                      {(rollup.children ?? []).length > 10 && <span className="mini-chip">+{(rollup.children ?? []).length - 10}</span>}
                    </div>
                  </div>
                  <div className="row-actions dimension-tab-row-actions">
                    <span className={`status-pill ${rollup.is_active === false ? "inactive" : "active"}`}>{rollup.is_active === false ? "Inactive" : "Active"}</span>
                    <button className="icon-button" type="button" title="Edit rollup" onClick={() => openRollupDrawer(rollup)}><Edit3 size={13} /></button>
                    <button className="icon-button danger" type="button" title="Deactivate rollup" disabled={isSaving} onClick={() => void removeRollup(rollup)}><Trash2 size={13} /></button>
                  </div>
                </article>
              )) : <div className="detail-empty">No geography rollup rules configured yet.</div>}
            </div>
          </div>
        )}
      </section>

      {drawer && (
        <div className="drawer-overlay">
          <aside className="form-drawer compact-form-drawer">
            <header className="drawer-header">
              <div>
                <span>{drawer === "set" ? "MEMBER SET" : drawer === "rollup" ? "ROLLUP RULE" : editingCode ? "EDIT" : "CREATE"}</span>
                <h3>{drawer === "set" ? "Geography Member Set" : drawer === "rollup" ? "Geography Rollup" : "Geography"}</h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setDrawer(null)} aria-label="Close"><X size={16} /></button>
            </header>
            {drawer === "geography" ? (
            <form className="drawer-form" onSubmit={saveGeography}>
              <label title="Stable geography member code used by APIs, templates, member sets, and rollups. Example: IND or STATE_MAHARASHTRA.">Geography code<input value={form.geography_code} onChange={(event) => setForm((current) => ({ ...current, geography_code: compactCode(event.target.value) }))} required /></label>
              <label title="Readable geography name shown in dropdowns, tables, templates, and reports.">Name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
              <div className="form-grid two">
                <label className="form-field" title="Geography hierarchy level. Country is root; State/UT is below country. Future levels can include district/block.">Level<select value={form.level_code} onChange={(event) => setForm((current) => ({ ...current, level_code: event.target.value, parent_geography_code: event.target.value === "COUNTRY" ? "" : current.parent_geography_code || "IND" }))}>{levels.map((level) => <option value={level.level_code} key={level.level_code}>{level.name ?? level.level_code}</option>)}</select></label>
                <label className="form-field" title="Parent geography for hierarchy and rollups. Example: State/UT records use India as parent.">Parent<select value={form.parent_geography_code} onChange={(event) => setForm((current) => ({ ...current, parent_geography_code: event.target.value }))} disabled={form.level_code === "COUNTRY"}><option value="">No parent</option>{parentOptions.map((row) => <option value={row.geography_code} key={row.geography_code}>{row.name ?? row.geography_code}</option>)}</select></label>
              </div>
              <div className="form-grid two">
                <label className="form-field" title="Optional ISO alpha-2 country/state reference where available. Example: IN.">ISO alpha-2<input value={form.iso_alpha2_code} onChange={(event) => setForm((current) => ({ ...current, iso_alpha2_code: event.target.value.toUpperCase() }))} placeholder="Example: IN" /></label>
                <label className="form-field" title="Optional ISO alpha-3 country/state reference where available. Example: IND.">ISO alpha-3<input value={form.iso_alpha3_code} onChange={(event) => setForm((current) => ({ ...current, iso_alpha3_code: event.target.value.toUpperCase() }))} placeholder="Example: IND" /></label>
              </div>
              <label title="Optional census, survey, or source-system code used during ingestion/mapping.">Census / source code<input value={form.census_code} onChange={(event) => setForm((current) => ({ ...current, census_code: event.target.value }))} placeholder="Example: IN-MH or source code" /></label>
              <div className="form-grid two">
                <label className="form-field" title="Date from which this geography member is valid. Leave blank when always valid.">Effective from<input type="date" value={form.effective_from} onChange={(event) => setForm((current) => ({ ...current, effective_from: event.target.value }))} /></label>
                <label className="form-field" title="Date until which this geography member is valid. Leave blank for current active members.">Effective to<input type="date" value={form.effective_to} onChange={(event) => setForm((current) => ({ ...current, effective_to: event.target.value }))} /></label>
              </div>
              <label title="Optional admin notes or usage guidance for this geography member.">Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
              <label className="checkbox-card" title="Inactive geography records remain stored but should not be used for new mappings."><input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
              <div className="drawer-footer">
                <button className="secondary-button" type="button" onClick={() => setDrawer(null)}>Cancel</button>
                <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</button>
              </div>
            </form>
            ) : drawer === "set" ? (
            <form className="drawer-form" onSubmit={saveGeographySet}>
              <label title="Stable set code used by templates and reports. Examples: GEOGRAPHY_NATIONAL, GEOGRAPHY_NATIONAL_STATES, GEOGRAPHY_STATES.">Set code<input value={memberSetForm.set_code} onChange={(event) => setMemberSetForm((current) => ({ ...current, set_code: compactCode(event.target.value) }))} required /></label>
              <label title="Readable set name shown to users. Examples: National, National + States, States.">Name<input value={memberSetForm.name} onChange={(event) => setMemberSetForm((current) => ({ ...current, name: event.target.value }))} required /></label>
              <label title="Controlled Scope is recommended for geography presets used in templates, requests, and reporting.">Set type<select value={memberSetForm.set_type} onChange={(event) => setMemberSetForm((current) => ({ ...current, set_type: event.target.value }))}><option value="CONTROLLED_SCOPE">Controlled Scope</option><option value="TEMPLATE_SCOPE">Template Scope</option><option value="REQUEST_SCOPE">Request Scope</option><option value="REPORT_SCOPE">Report Scope</option></select></label>
              <label title="Explain when this set should be used.">Description<textarea value={memberSetForm.description} onChange={(event) => setMemberSetForm((current) => ({ ...current, description: event.target.value }))} /></label>
              <div className="selected-period-list geography-selected-list">
                <strong>Selected geography members ({selectedGeographyCodes.length})</strong>
                {selectedGeographyCodes.length ? selectedGeographyCodes.map((code, index) => {
                  const row = rows.find((item) => item.geography_code === code);
                  return (
                    <span className="selected-period-chip" key={code}>
                      <b>{index + 1}</b>
                      {textValue(row?.name ?? code)}
                      <button type="button" title="Remove from set" onClick={() => removeGeographyFromSet(code)}><X size={11} /></button>
                    </span>
                  );
                }) : <small>No geography members selected.</small>}
              </div>
              <label title="Search geography name, code, level, or parent to add members to the set.">Find geography<input value={setSearch} onChange={(event) => setSetSearch(event.target.value)} placeholder="Search India, Maharashtra, state, code..." /></label>
              <div className="time-period-picker geography-picker">
                {geographyPickerRows.map((row) => (
                  <button className="time-picker-item" type="button" key={geographyMemberCode(row)} onClick={() => addGeographyToSet(geographyMemberCode(row))}>
                    <span>+</span>
                    <strong>{textValue(row.name ?? geographyMemberCode(row))}</strong>
                    <small>{geographyLevelText(row)} / {textValue(geographyMemberCode(row))}</small>
                  </button>
                ))}
                {!geographyPickerRows.length && <div className="table-empty">No geography members match the search.</div>}
              </div>
              <label className="checkbox-card" title="Inactive sets remain stored but should not be selected for new templates or reports."><input type="checkbox" checked={memberSetForm.is_active} onChange={(event) => setMemberSetForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
              <div className="drawer-footer">
                <button className="secondary-button" type="button" onClick={() => setDrawer(null)}>Cancel</button>
                <button className="primary-button" type="submit" disabled={isSaving || !selectedGeographyCodes.length}>{isSaving ? "Saving..." : "Save Set"}</button>
              </div>
            </form>
            ) : (
            <form className="drawer-form" onSubmit={saveRollup}>
              <label title="Parent member that stores or derives the rollup value. For geography this is usually India.">Parent member<select required value={rollupForm.parent_member_code} onChange={(event) => setRollupForm((current) => ({ ...current, parent_member_code: event.target.value }))}>{[...countryRows, ...stateRows].map((row) => <option value={geographyMemberCode(row)} key={geographyMemberCode(row)}>{textValue(row.name ?? geographyMemberCode(row))}</option>)}</select></label>
              <label title="Stable rollup rule code. Example: ROLLUP_INDIA_STATES_SUM.">Rule code<input value={rollupForm.rule_code} onChange={(event) => setRollupForm((current) => ({ ...current, rule_code: compactCode(event.target.value) }))} required /></label>
              <div className="form-grid two">
                <label className="form-field" title="Derived means the parent value can be calculated from child values. Manual means the parent may be entered independently.">Entry mode<select value={rollupForm.entry_mode} onChange={(event) => setRollupForm((current) => ({ ...current, entry_mode: event.target.value }))}><option>DERIVED</option><option>MANUAL</option><option>MANUAL_WITH_VALIDATION</option></select></label>
                <label className="form-field" title="SUM is recommended for India = sum of States/UTs.">Aggregation<select value={rollupForm.aggregation_method} onChange={(event) => setRollupForm((current) => ({ ...current, aggregation_method: event.target.value }))}><option>SUM</option><option>AVG</option><option>WEIGHTED_AVG</option><option>MIN</option><option>MAX</option><option>NO_ROLLUP</option></select></label>
              </div>
              <label title="Optional measure code. Leave blank for generic geography rollup; use a real measure code later when rollup is measure-specific.">Measure code<input value={rollupForm.measure_code} onChange={(event) => setRollupForm((current) => ({ ...current, measure_code: compactCode(event.target.value) }))} placeholder="Optional, e.g. TOTAL_POPULATION" /></label>
              <label title="Optional only for weighted-average rollups. Leave blank for SUM.">Weight measure code<input value={rollupForm.weight_measure_code} onChange={(event) => setRollupForm((current) => ({ ...current, weight_measure_code: compactCode(event.target.value) }))} placeholder="Optional for WEIGHTED_AVG" /></label>
              <div className="selected-period-list geography-selected-list">
                <strong>Rollup child members ({rollupChildCodes.length})</strong>
                {rollupChildCodes.length ? rollupChildCodes.map((code, index) => {
                  const row = memberLookup.get(code);
                  return (
                    <span className="selected-period-chip" key={code}>
                      <b>{index + 1}</b>
                      {textValue(row?.name ?? code)}
                      <button type="button" title="Remove child" onClick={() => removeRollupChild(code)}><X size={11} /></button>
                    </span>
                  );
                }) : <small>No child members selected.</small>}
              </div>
              <label title="Search state/UT name or code to add it as a rollup child.">Find child member<input value={rollupSearch} onChange={(event) => setRollupSearch(event.target.value)} placeholder="Search Maharashtra, STATE_MAHARASHTRA..." /></label>
              <div className="time-period-picker geography-picker">
                {rollupPickerRows.map((row) => (
                  <button className="time-picker-item" type="button" key={geographyMemberCode(row)} onClick={() => addRollupChild(geographyMemberCode(row))}>
                    <span>+</span>
                    <strong>{textValue(row.name ?? geographyMemberCode(row))}</strong>
                    <small>{textValue(geographyMemberCode(row))}</small>
                  </button>
                ))}
                {!rollupPickerRows.length && <div className="table-empty">No state/UT members match the search.</div>}
              </div>
              <label className="checkbox-card" title="Inactive rollups remain stored but should not be used for new calculations."><input type="checkbox" checked={rollupForm.is_active} onChange={(event) => setRollupForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
              <div className="drawer-footer">
                <button className="secondary-button" type="button" onClick={() => setDrawer(null)}>Cancel</button>
                <button className="primary-button" type="submit" disabled={isSaving || !rollupChildCodes.length}>{isSaving ? "Saving..." : "Save Rollup"}</button>
              </div>
            </form>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
