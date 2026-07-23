import { CalendarDays, Copy, Edit3, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createTimeFrequency,
  createTimePeriod,
  createTimePeriodSet,
  deactivateDimensionMemberSet,
  deactivateDimensionMemberSetItem,
  deactivateTimeFrequency,
  deactivateTimePeriod,
  listAllTimePeriods,
  listTimeFrequencies,
  listTimePeriodSetPeriods,
  listTimePeriodSets,
  updateTimeFrequency,
  updateTimePeriod,
  updateTimePeriodSet,
  type DimensionMemberSet,
  type DimensionMemberSetItem,
  type TimeFrequency,
  type TimePeriod,
} from "../../api/dimensions.api";
import { Loader } from "../../components/common/loader";

type TimeTab = "periods" | "sets" | "frequencies";
type DrawerMode = "period" | "set" | "frequency" | null;

const emptyPeriodForm = {
  time_period_code: "",
  frequency_code: "FINANCIAL_YEAR",
  period_year: 2024,
  period_quarter: "",
  period_month: "",
  start_date: "2024-04-01",
  end_date: "2025-03-31",
  status: "ACTIVE",
  is_active: true,
  name: "",
  short_name: "",
  description: "",
};

const emptySetForm = {
  set_code: "",
  set_type: "TEMPLATE_SCOPE",
  is_active: true,
  name: "",
  description: "",
};

const emptyFrequencyForm = {
  frequency_code: "",
  months_interval: "",
  sort_order: 0,
  is_active: true,
  name: "",
  description: "",
};

function textValue(value: unknown) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return textValue(value);
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function compactCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9_]/g, "_").replace(/_+/g, "_");
}

function labelForPeriod(period: TimePeriod) {
  return textValue(period.name ?? period.short_name ?? period.time_period_code);
}

function isSetImmutable(set?: DimensionMemberSet | null) {
  return Boolean(set?.is_immutable || Number(set?.usage_count ?? 0) > 0);
}

export function TimePeriodsPage() {
  const [activeTab, setActiveTab] = useState<TimeTab>("periods");
  const [frequencies, setFrequencies] = useState<TimeFrequency[]>([]);
  const [periods, setPeriods] = useState<TimePeriod[]>([]);
  const [sets, setSets] = useState<DimensionMemberSet[]>([]);
  const [setItems, setSetItems] = useState<Record<string, DimensionMemberSetItem[]>>({});
  const [selectedSetCode, setSelectedSetCode] = useState("");
  const [selectedPeriodCodes, setSelectedPeriodCodes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");
  const [sequenceSearch, setSequenceSearch] = useState("");
  const [sequenceFrequencyFilter, setSequenceFrequencyFilter] = useState("ALL");
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [editingPeriodCode, setEditingPeriodCode] = useState("");
  const [editingSetCode, setEditingSetCode] = useState("");
  const [editingFrequencyCode, setEditingFrequencyCode] = useState("");
  const [periodForm, setPeriodForm] = useState(emptyPeriodForm);
  const [setForm, setSetForm] = useState(emptySetForm);
  const [frequencyForm, setFrequencyForm] = useState(emptyFrequencyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedSet = useMemo(
    () => sets.find((set) => set.set_code === selectedSetCode) ?? sets[0] ?? null,
    [sets, selectedSetCode],
  );

  const filteredPeriods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return periods.filter((period) => {
      const matchesFrequency = frequencyFilter === "ALL" || period.frequency_code === frequencyFilter;
      const matchesQuery =
        !q ||
        [period.time_period_code, period.name, period.short_name, period.frequency_code, period.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      return matchesFrequency && matchesQuery;
    });
  }, [periods, query, frequencyFilter]);

  const selectedSetItems = selectedSet ? setItems[selectedSet.set_code ?? ""] ?? [] : [];

  const selectedPeriods = useMemo(
    () =>
      selectedPeriodCodes
        .map((code) => periods.find((period) => period.time_period_code === code))
        .filter((period): period is TimePeriod => Boolean(period)),
    [periods, selectedPeriodCodes],
  );

  const sequencePickerPeriods = useMemo(() => {
    const q = sequenceSearch.trim().toLowerCase();
    return periods.filter((period) => {
      const code = period.time_period_code ?? "";
      if (selectedPeriodCodes.includes(code)) return false;
      if (sequenceFrequencyFilter !== "ALL" && period.frequency_code !== sequenceFrequencyFilter) return false;
      return (
        !q ||
        [period.time_period_code, period.name, period.short_name, period.frequency_code, period.period_year]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      );
    });
  }, [periods, selectedPeriodCodes, sequenceSearch, sequenceFrequencyFilter]);

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [frequencyResponse, periodResponse, setResponse] = await Promise.all([
        listTimeFrequencies(),
        listAllTimePeriods(),
        listTimePeriodSets(),
      ]);
      const nextFrequencies = frequencyResponse.data ?? [];
      const nextPeriods = periodResponse.data ?? [];
      const nextSets = setResponse.data ?? [];
      setFrequencies(nextFrequencies);
      setPeriods(nextPeriods);
      setSets(nextSets);
      const nextSetCode = selectedSetCode || nextSets[0]?.set_code || "";
      setSelectedSetCode(nextSetCode);
      const loadedItems: Record<string, DimensionMemberSetItem[]> = {};
      await Promise.all(
        nextSets.map(async (set) => {
          if (!set.set_code) return;
          const response = await listTimePeriodSetPeriods(set.set_code);
          loadedItems[set.set_code] = response.data ?? [];
        }),
      );
      setSetItems(loadedItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Time period data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  function openPeriodDrawer(period?: TimePeriod) {
    if (period) {
      setEditingPeriodCode(period.time_period_code ?? "");
      setPeriodForm({
        time_period_code: period.time_period_code ?? "",
        frequency_code: period.frequency_code ?? "FINANCIAL_YEAR",
        period_year: Number(period.period_year ?? new Date().getFullYear()),
        period_quarter: period.period_quarter ? String(period.period_quarter) : "",
        period_month: period.period_month ? String(period.period_month) : "",
        start_date: period.start_date ?? "",
        end_date: period.end_date ?? "",
        status: period.status ?? "ACTIVE",
        is_active: period.is_active !== false,
        name: period.name ?? "",
        short_name: period.short_name ?? "",
        description: period.description ?? "",
      });
    } else {
      setEditingPeriodCode("");
      setPeriodForm(emptyPeriodForm);
    }
    setDrawer("period");
  }

  function nextSetVersionCode(set: DimensionMemberSet) {
    const base = compactCode(set.set_code ?? "TIME_PERIOD_SET");
    for (let version = 2; version <= 99; version += 1) {
      const candidate = `${base}_V${version}`;
      if (!sets.some((existing) => existing.set_code === candidate)) return candidate;
    }
    return `${base}_NEXT`;
  }

  function openSetDrawer(set?: DimensionMemberSet, options: { copyAsNew?: boolean } = {}) {
    if (set) {
      const items = setItems[set.set_code ?? ""] ?? [];
      setEditingSetCode(options.copyAsNew ? "" : set.set_code ?? "");
      setSelectedPeriodCodes(items.map((item) => item.member_code ?? "").filter(Boolean));
      setSetForm({
        set_code: options.copyAsNew ? nextSetVersionCode(set) : set.set_code ?? "",
        set_type: set.set_type ?? "TEMPLATE_SCOPE",
        is_active: set.is_active !== false,
        name: options.copyAsNew ? `${textValue(set.name ?? set.set_code)} - New cycle` : set.name ?? "",
        description: options.copyAsNew
          ? `Copied from ${textValue(set.set_code)}. Review periods before publishing this new governed sequence.`
          : set.description ?? "",
      });
    } else {
      setEditingSetCode("");
      setSelectedPeriodCodes([]);
      setSetForm(emptySetForm);
    }
    setSequenceSearch("");
    setSequenceFrequencyFilter("ALL");
    setDrawer("set");
  }

  function openFrequencyDrawer(frequency?: TimeFrequency) {
    if (frequency) {
      setEditingFrequencyCode(frequency.frequency_code ?? "");
      setFrequencyForm({
        frequency_code: frequency.frequency_code ?? "",
        months_interval: frequency.months_interval === undefined || frequency.months_interval === null ? "" : String(frequency.months_interval),
        sort_order: Number(frequency.sort_order ?? 0),
        is_active: frequency.is_active !== false,
        name: frequency.name ?? "",
        description: frequency.description ?? "",
      });
    } else {
      setEditingFrequencyCode("");
      setFrequencyForm(emptyFrequencyForm);
    }
    setDrawer("frequency");
  }

  async function savePeriod(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        ...periodForm,
        time_period_code: compactCode(periodForm.time_period_code),
        period_quarter: periodForm.period_quarter ? Number(periodForm.period_quarter) : undefined,
        period_month: periodForm.period_month ? Number(periodForm.period_month) : undefined,
      };
      if (editingPeriodCode) await updateTimePeriod(editingPeriodCode, payload);
      else await createTimePeriod(payload);
      setDrawer(null);
      setNotice("Time period saved.");
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Time period could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveSet(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const existingSet = sets.find((set) => set.set_code === editingSetCode);
      if (editingSetCode && isSetImmutable(existingSet)) {
        throw new Error("This reporting sequence is already used. Use Copy as New Cycle to create a new set/version.");
      }
      const payload = {
        ...setForm,
        set_code: compactCode(setForm.set_code),
        items: selectedPeriodCodes.map((timePeriodCode, index) => ({
          time_period_code: timePeriodCode,
          sort_order: index + 1,
          is_active: true,
        })),
      };
      if (editingSetCode) await updateTimePeriodSet(editingSetCode, payload);
      else await createTimePeriodSet(payload);
      setDrawer(null);
      setNotice("Reporting sequence saved.");
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Reporting sequence could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveFrequency(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        frequency_code: compactCode(frequencyForm.frequency_code),
        months_interval: frequencyForm.months_interval ? Number(frequencyForm.months_interval) : undefined,
        sort_order: Number(frequencyForm.sort_order ?? 0),
        is_active: frequencyForm.is_active,
        name: frequencyForm.name,
        description: frequencyForm.description || undefined,
      };
      if (editingFrequencyCode) await updateTimeFrequency(editingFrequencyCode, payload);
      else await createTimeFrequency(payload);
      setDrawer(null);
      setNotice("Frequency saved.");
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Frequency could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  function togglePeriodInSet(timePeriodCode: string) {
    setSelectedPeriodCodes((current) =>
      current.includes(timePeriodCode)
        ? current.filter((code) => code !== timePeriodCode)
        : [...current, timePeriodCode],
    );
  }

  function removePeriodFromSet(timePeriodCode: string) {
    setSelectedPeriodCodes((current) => current.filter((code) => code !== timePeriodCode));
  }

  async function removeSavedPeriodFromSet(setCode: string, memberCode: string) {
    if (!setCode || !memberCode) return;
    const existingSet = sets.find((set) => set.set_code === setCode);
    if (isSetImmutable(existingSet)) {
      setError("This reporting sequence is already used. Create a new set/version instead of changing its items.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await deactivateDimensionMemberSetItem(setCode, memberCode);
      setNotice("Period removed from sequence.");
      await loadPage();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Period could not be removed from sequence.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removePeriodSet(set: DimensionMemberSet) {
    if (!set.set_code) return;
    if (isSetImmutable(set)) {
      setError("This reporting sequence is already used. It cannot be deactivated; create a new set/version for future cycles.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await deactivateDimensionMemberSet("TIME_PERIOD", set.set_code);
      setNotice("Reporting sequence deactivated.");
      await loadPage();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Reporting sequence could not be deactivated.");
    } finally {
      setIsSaving(false);
    }
  }

  const cards = [
    { label: "Time Periods", value: periods.length, sublabel: "Available" },
    { label: "Frequencies", value: frequencies.length, sublabel: "Configured" },
    { label: "Sequences", value: sets.length, sublabel: "Member sets" },
    { label: "Selected Items", value: selectedSetItems.length, sublabel: selectedSet?.set_code ?? "No set" },
  ];

  return (
    <div className="workflow-page time-periods-page">
      <section className="page-heading-row compact">
        <div>
          <div className="breadcrumb">Home / Dimensions / Time Periods</div>
          <h2>Time Periods</h2>
          <p>Manage regular periods and irregular reporting sequences for templates, requests, and reports.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button compact" type="button" onClick={() => void loadPage()}>
            <RefreshCw size={13} />
            Refresh
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => activeTab === "frequencies" ? openFrequencyDrawer() : activeTab === "sets" ? openSetDrawer() : openPeriodDrawer()}
          >
            <Plus size={14} />
            {activeTab === "frequencies" ? "New Frequency" : activeTab === "sets" ? "New Sequence" : "New Period"}
          </button>
        </div>
      </section>

      {notice && <div className="toast-notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="metric-grid four dimension-metric-grid">
        {cards.map((card) => (
          <article className="metric-card compact-metric-card dimension-metric-card" key={card.label}>
            <div className="metric-value">{card.value.toLocaleString("en-IN")}</div>
            <div className="metric-label">{card.label}</div>
            <div className="metric-sublabel">{card.sublabel}</div>
          </article>
        ))}
      </section>

      <section className="toolbar-panel dimensions-toolbar-panel">
        <label className="input-shell">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search period, sequence, or code" />
        </label>
        <select value={frequencyFilter} onChange={(event) => setFrequencyFilter(event.target.value)}>
          <option value="ALL">All frequencies</option>
          {frequencies.map((frequency) => (
            <option value={frequency.frequency_code} key={frequency.frequency_code}>
              {frequency.name ?? frequency.frequency_code}
            </option>
          ))}
        </select>
      </section>

      <section className="workflow-card time-period-workspace">
        <div className="tab-strip dimension-tab-strip">
          {(["periods", "sets", "frequencies"] as TimeTab[]).map((tab) => (
            <button className={`tab-button ${activeTab === tab ? "active" : ""}`} type="button" onClick={() => setActiveTab(tab)} key={tab}>
              {tab === "periods" ? "Periods" : tab === "sets" ? "Reporting Sequences" : "Frequencies"}
            </button>
          ))}
        </div>

        {activeTab === "periods" && (
          <div className="table-wrap dimension-table-wrap time-period-table-wrap">
            <table className="data-table time-period-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Code</th>
                  <th>Frequency</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className="loader-table-row"><td colSpan={7}><Loader label="Loading time periods..." /></td></tr>
                ) : filteredPeriods.length ? (
                  filteredPeriods.map((period) => (
                    <tr key={period.time_period_code}>
                      <td><strong>{labelForPeriod(period)}</strong></td>
                      <td><span className="code-pill">{period.time_period_code}</span></td>
                      <td>{textValue(period.frequency_code)}</td>
                      <td>{formatDate(period.start_date)}</td>
                      <td>{formatDate(period.end_date)}</td>
                      <td><span className={`status-pill ${period.is_active === false ? "inactive" : "active"}`}>{period.is_active === false ? "Inactive" : textValue(period.status ?? "Active")}</span></td>
                      <td>
                        <div className="row-actions">
                          <button className="icon-button" type="button" title="Edit period" onClick={() => openPeriodDrawer(period)}><Edit3 size={13} /></button>
                          <button className="icon-button danger" type="button" title="Deactivate period" onClick={() => void deactivateTimePeriod(period.time_period_code ?? "").then(loadPage)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7}><div className="table-empty">No periods match the selected filters.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "sets" && (
          <div className="time-set-layout">
            <aside className="time-set-list">
              <div className="section-title-row">
                <div>
                  <span>Reporting Sequences</span>
                  <strong>Period Sets</strong>
                </div>
                <button className="secondary-button compact" type="button" onClick={() => openSetDrawer()}>
                  <Plus size={13} />
                  New
                </button>
              </div>
              {sets.map((set) => (
                <article className={`time-set-card ${set.set_code === selectedSet?.set_code ? "active" : ""} ${isSetImmutable(set) ? "locked" : ""}`} key={set.set_code}>
                  <button className="time-set-card-main" type="button" onClick={() => setSelectedSetCode(set.set_code ?? "")}>
                    <strong>{textValue(set.name ?? set.set_code)}</strong>
                    <span>{textValue(set.set_code)} / {textValue(set.set_type)}</span>
                    <small>
                      {(setItems[set.set_code ?? ""] ?? []).length.toLocaleString("en-IN")} periods
                      {isSetImmutable(set) ? ` / used ${Number(set.usage_count ?? 0).toLocaleString("en-IN")}x` : ""}
                    </small>
                  </button>
                  <div className="card-row-actions">
                    <button className="icon-button" type="button" title="Copy as new cycle/version" onClick={() => openSetDrawer(set, { copyAsNew: true })}><Copy size={13} /></button>
                    <button className="icon-button" type="button" title={isSetImmutable(set) ? "Used sequences are immutable. Copy as new cycle instead." : "Edit sequence"} disabled={isSetImmutable(set)} onClick={() => openSetDrawer(set)}><Edit3 size={13} /></button>
                    <button className="icon-button danger" type="button" title={isSetImmutable(set) ? "Used sequences cannot be deactivated." : "Deactivate sequence"} disabled={isSaving || isSetImmutable(set)} onClick={() => void removePeriodSet(set)}><Trash2 size={13} /></button>
                  </div>
                </article>
              ))}
              {!sets.length && <div className="table-empty">No reporting sequences configured.</div>}
            </aside>
            <main className="time-set-detail">
              <div className="section-title-row">
                <div>
                  <span>{textValue(selectedSet?.set_code)}</span>
                  <strong>{textValue(selectedSet?.name ?? "Select a sequence")}</strong>
                </div>
                {selectedSet && (
                  <div className="inline-actions">
                    {isSetImmutable(selectedSet) && <span className="status-pill warning" title={selectedSet.lock_reason ?? "Used sequences are immutable."}>Immutable</span>}
                    <button className="secondary-button compact" type="button" onClick={() => openSetDrawer(selectedSet, { copyAsNew: true })}>
                      <Copy size={13} />
                      Copy as New Cycle
                    </button>
                    <button className="secondary-button compact" type="button" disabled={isSetImmutable(selectedSet)} onClick={() => openSetDrawer(selectedSet)}>
                      <Edit3 size={13} />
                      Edit Sequence
                    </button>
                  </div>
                )}
              </div>
              <div className="time-sequence-row">
                {selectedSetItems.length ? selectedSetItems.map((item, index) => (
                  <div className="time-sequence-item with-action" key={`${item.member_code}-${index}`}>
                    <span>{index + 1}</span>
                    <strong>{textValue(item.member_name ?? item.member_code)}</strong>
                    <small>{textValue(item.member_code)}</small>
                    <button
                      className="icon-button danger"
                      type="button"
                      title="Remove period from sequence"
                      disabled={isSaving || isSetImmutable(selectedSet)}
                      onClick={() => void removeSavedPeriodFromSet(selectedSet?.set_code ?? "", item.member_code ?? "")}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )) : <div className="table-empty">No periods added to this sequence.</div>}
              </div>
            </main>
          </div>
        )}

        {activeTab === "frequencies" && (
          <>
            <div className="section-action-row time-frequency-action-row">
              <div>
                <span>Frequency Catalog</span>
                <strong>Manage Annual, Financial Year, Quarterly, Monthly, and custom intervals.</strong>
              </div>
              <button className="secondary-button compact" type="button" onClick={() => openFrequencyDrawer()}>
                <Plus size={13} />
                New Frequency
              </button>
            </div>
            <div className="time-frequency-grid">
              {frequencies.map((frequency) => (
                <article className="time-frequency-card" key={frequency.frequency_code}>
                  <CalendarDays size={16} />
                  <strong>{textValue(frequency.name ?? frequency.frequency_code)}</strong>
                  <span>{textValue(frequency.frequency_code)}</span>
                  <small>{frequency.months_interval ? `${frequency.months_interval} month interval` : "Custom interval"}</small>
                  <div className="card-row-actions">
                    <button className="icon-button" type="button" title="Edit frequency" onClick={() => openFrequencyDrawer(frequency)}><Edit3 size={13} /></button>
                    <button className="icon-button danger" type="button" title="Deactivate frequency" onClick={() => void deactivateTimeFrequency(frequency.frequency_code ?? "").then(loadPage)}><Trash2 size={13} /></button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {drawer && (
        <div className="drawer-overlay" role="presentation">
          <aside className="form-drawer compact-form-drawer dimension-editor-drawer">
            <header className="drawer-header dimension-editor-header">
              <div>
                <span>{drawer === "period" ? "TIME PERIOD" : drawer === "set" ? "REPORTING SEQUENCE" : "TIME FREQUENCY"}</span>
                <h3>{drawer === "period" ? "Time Period" : drawer === "set" ? "Time Period Set" : "Frequency"}</h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setDrawer(null)}><X size={16} /></button>
            </header>
            {drawer === "period" ? (
              <form className="drawer-form dimension-editor-form" onSubmit={savePeriod}>
              <div className="dimension-editor-guidance"><strong>Configuration details</strong><span>Complete the governed fields below. Changes are validated before saving.</span></div>
                <label>Period code<input value={periodForm.time_period_code} onChange={(event) => setPeriodForm((current) => ({ ...current, time_period_code: compactCode(event.target.value) }))} required /></label>
                <label>Name<input value={periodForm.name} onChange={(event) => setPeriodForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                <div className="form-grid two">
                  <label>Frequency<select value={periodForm.frequency_code} onChange={(event) => setPeriodForm((current) => ({ ...current, frequency_code: event.target.value }))}>{frequencies.map((frequency) => <option value={frequency.frequency_code} key={frequency.frequency_code}>{frequency.name ?? frequency.frequency_code}</option>)}</select></label>
                  <label>Period year<input type="number" value={periodForm.period_year} onChange={(event) => setPeriodForm((current) => ({ ...current, period_year: Number(event.target.value) }))} /></label>
                </div>
                <div className="form-grid two">
                  <label>Quarter<input type="number" min="1" max="4" value={periodForm.period_quarter} onChange={(event) => setPeriodForm((current) => ({ ...current, period_quarter: event.target.value }))} /></label>
                  <label>Month<input type="number" min="1" max="12" value={periodForm.period_month} onChange={(event) => setPeriodForm((current) => ({ ...current, period_month: event.target.value }))} /></label>
                </div>
                <div className="form-grid two">
                  <label>Start date<input type="date" value={periodForm.start_date} onChange={(event) => setPeriodForm((current) => ({ ...current, start_date: event.target.value }))} required /></label>
                  <label>End date<input type="date" value={periodForm.end_date} onChange={(event) => setPeriodForm((current) => ({ ...current, end_date: event.target.value }))} required /></label>
                </div>
                <label>Description<textarea value={periodForm.description} onChange={(event) => setPeriodForm((current) => ({ ...current, description: event.target.value }))} /></label>
                <footer className="drawer-footer">
                  <button className="secondary-button" type="button" onClick={() => setDrawer(null)}>Cancel</button>
                  <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</button>
                </footer>
              </form>
            ) : drawer === "set" ? (
              <form className="drawer-form dimension-editor-form" onSubmit={saveSet}>
              <div className="dimension-editor-guidance"><strong>Configuration details</strong><span>Complete the governed fields below. Changes are validated before saving.</span></div>
                <label>Set code<input value={setForm.set_code} onChange={(event) => setSetForm((current) => ({ ...current, set_code: compactCode(event.target.value) }))} required /></label>
                <label>Name<input value={setForm.name} onChange={(event) => setSetForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                <label>Set type<select value={setForm.set_type} onChange={(event) => setSetForm((current) => ({ ...current, set_type: event.target.value }))}><option value="TEMPLATE_SCOPE">Template Scope</option><option value="REQUEST_SCOPE">Request Scope</option><option value="REPORT_SCOPE">Report Scope</option><option value="CONTROLLED_SCOPE">Controlled Scope</option></select></label>
                <label>Description<textarea value={setForm.description} onChange={(event) => setSetForm((current) => ({ ...current, description: event.target.value }))} /></label>
                <div className="form-help">Select any periods in any order. This supports two-year, three-year, and irregular reporting sequences.</div>
                {!editingSetCode && setForm.description?.startsWith("Copied from") && (
                  <div className="form-help info">This is a new set/version. Existing published or request-used sequences remain unchanged.</div>
                )}
                <div className="selected-period-list">
                  <strong>Selected periods ({selectedPeriods.length})</strong>
                  {selectedPeriods.length ? selectedPeriods.map((period, index) => (
                    <span className="selected-period-chip" key={period.time_period_code}>
                      <b>{index + 1}</b>
                      {labelForPeriod(period)}
                      <button type="button" title="Remove from sequence" onClick={() => removePeriodFromSet(period.time_period_code ?? "")}>
                        <X size={11} />
                      </button>
                    </span>
                  )) : <small>No periods selected yet.</small>}
                </div>
                <div className="sequence-picker-filters">
                  <label title="Search period code, name, frequency, or year to quickly add periods.">Find period<input value={sequenceSearch} onChange={(event) => setSequenceSearch(event.target.value)} placeholder="Search 2024, financial year, monthly..." /></label>
                  <label title="Limit selectable periods by frequency before adding them to the sequence.">Frequency<select value={sequenceFrequencyFilter} onChange={(event) => setSequenceFrequencyFilter(event.target.value)}><option value="ALL">All frequencies</option>{frequencies.map((frequency) => <option value={frequency.frequency_code} key={frequency.frequency_code}>{frequency.name ?? frequency.frequency_code}</option>)}</select></label>
                </div>
                <div className="time-period-picker">
                  {sequencePickerPeriods.map((period) => {
                    const code = period.time_period_code ?? "";
                    return (
                      <button className="time-picker-item" type="button" key={code} onClick={() => togglePeriodInSet(code)}>
                        <span>+</span>
                        <strong>{labelForPeriod(period)}</strong>
                        <small>{code}</small>
                      </button>
                    );
                  })}
                  {!sequencePickerPeriods.length && <div className="table-empty">No more periods match the search.</div>}
                </div>
                <footer className="drawer-footer">
                  <button className="secondary-button" type="button" onClick={() => setDrawer(null)}>Cancel</button>
                  <button className="primary-button" type="submit" disabled={isSaving || !selectedPeriodCodes.length}>{isSaving ? "Saving..." : "Save Sequence"}</button>
                </footer>
              </form>
            ) : (
              <form className="drawer-form dimension-editor-form" onSubmit={saveFrequency}>
              <div className="dimension-editor-guidance"><strong>Configuration details</strong><span>Complete the governed fields below. Changes are validated before saving.</span></div>
                <label title="Stable public frequency code. Example: ANNUAL, FINANCIAL_YEAR, QUARTERLY, MONTHLY.">Frequency code<input value={frequencyForm.frequency_code} onChange={(event) => setFrequencyForm((current) => ({ ...current, frequency_code: compactCode(event.target.value) }))} required /></label>
                <label title="Readable frequency name shown to users.">Name<input value={frequencyForm.name} onChange={(event) => setFrequencyForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                <div className="form-grid two">
                  <label title="Number of months covered by one period. Annual and financial year use 12; quarterly uses 3; monthly uses 1.">Months interval<input type="number" min="1" value={frequencyForm.months_interval} onChange={(event) => setFrequencyForm((current) => ({ ...current, months_interval: event.target.value }))} /></label>
                  <label title="Display order in dropdowns and lists.">Sort order<input type="number" value={frequencyForm.sort_order} onChange={(event) => setFrequencyForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} /></label>
                </div>
                <label title="Optional explanation of how this frequency is used.">Description<textarea value={frequencyForm.description} onChange={(event) => setFrequencyForm((current) => ({ ...current, description: event.target.value }))} /></label>
                <label className="checkbox-card" title="Inactive frequencies stay stored but should not be selected for new periods."><input type="checkbox" checked={frequencyForm.is_active} onChange={(event) => setFrequencyForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
                <footer className="drawer-footer">
                  <button className="secondary-button" type="button" onClick={() => setDrawer(null)}>Cancel</button>
                  <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Frequency"}</button>
                </footer>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
