import { CheckCircle2, FileSpreadsheet, GripVertical, Info, Plus, RefreshCw, Save, Search, Settings2, ShieldCheck, X } from "lucide-react";
import { DragEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listDimensionManagementRows,
  listDimensionMemberSetMembers,
  listDimensionMemberSets,
  listAllTimePeriods,
  listTimePeriodSetPeriods,
  listTimePeriodSets,
  createTimePeriodSet,
  listDimensionRollupRules,
  type DimensionManagementRow,
  type DimensionMemberSet,
  type DimensionMemberSetItem,
  type DimensionRollupRule,
  type TimePeriod,
} from "../../api/dimensions.api";
import { listDataFields, type DataFieldListItem } from "../../api/data-fields.api";
import {
  createTemplateMeasure,
  createTemplateAxis,
  getTemplateRenderContract,
  getTemplateStudioDraft,
  listTemplateAxes,
  listTemplateFormulaOutputs,
  listTemplateMeasures,
  listTemplates,
  listTemplateVersions,
  publishTemplateVersion,
  saveTemplateStudioDraft,
  updateTemplateAxis,
  upsertTemplateFormulaOutput,
  type TemplateAxis,
  type TemplateDefinition,
  type TemplateMeasure,
  type TemplateRenderContract,
  type TemplateStudioDraft,
  type TemplateVersion,
} from "../../api/templates.api";
import { upsertValidationRule, upsertValidationRuleBinding } from "../../api/validation.api";
import { getSelectedUnitCode, LOCALE_CHANGED_EVENT, UNIT_CHANGED_EVENT } from "../../api/session.api";

type StudioStep = "setup" | "structure" | "recipients" | "preview" | "publish";
type DropZone = "tabsBy" | "rowRepresents" | "columns" | "fields";
type LibraryTab = "dimensions" | "geography" | "time" | "measures";
type LibraryItemType = "DIMENSION_SET" | "GEOGRAPHY_SET" | "TIME_SET" | "MEASURE";

type LibraryItem = {
  id: string;
  type: LibraryItemType;
  code: string;
  label: string;
  subLabel: string;
  badge: string;
  dimensionCode?: string;
  memberCount?: number;
  indicatorVersionCode?: string;
  sourceMeasureCode?: string;
  valueType?: string | null;
  measureUnitCode?: string | null;
  aggregationType?: string | null;
  generatedMode?: SettingsTab;
};

type BuilderState = Record<DropZone, LibraryItem[]>;
type PeriodSelection = { code: string; name: string };
type PreviewLabel = { code: string; label: string };
type PreviewColumn = PreviewLabel & { groupCode?: string; groupLabel?: string; generatedMeasure?: LibraryItem };
type ColumnValidationConfig = {
  requirement: "REQUIRED" | "OPTIONAL";
  numericBehavior: "NON_NEGATIVE" | "MIN_MAX" | "MIN_ONLY" | "MAX_ONLY";
  minValue: string;
  maxValue: string;
  failureBehavior: "WARNING" | "BLOCK";
};
type SettingsTab = "compute" | "calculated" | "rollup";
type CalculationMode = "basic" | "advanced";
type ComputedColumnDraft = {
  code: string;
  label: string;
  formula: string;
  outputUom: string;
  mode: SettingsTab;
  functionCode?: string;
};

const steps: { code: StudioStep; label: string; optional?: boolean }[] = [
  { code: "structure", label: "Structure" },
  { code: "recipients", label: "Recipients" },
  { code: "preview", label: "Preview" },
  { code: "publish", label: "Publish" },
];

const emptyBuilder: BuilderState = {
  tabsBy: [],
  rowRepresents: [],
  columns: [],
  fields: [],
};

const defaultValidationConfig: ColumnValidationConfig = {
  requirement: "REQUIRED",
  numericBehavior: "NON_NEGATIVE",
  minValue: "0",
  maxValue: "",
  failureBehavior: "WARNING",
};

function textValue(value: unknown) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function templateName(template?: TemplateDefinition | null) {
  return template?.name ?? template?.template_name ?? template?.template_code ?? "-";
}

function normalizeCode(value?: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

function itemName(item: DimensionMemberSetItem) {
  return textValue(item.member_name ?? item.member_code);
}

function previewItemLabel(item: DimensionMemberSetItem): PreviewLabel {
  const row = item as DimensionMemberSetItem & { display_name?: string | null; name?: string | null };
  const code = textValue(item.member_code);
  return {
    code,
    label: textValue(item.member_name ?? row.display_name ?? row.name ?? item.member_code),
  };
}

function measureName(item: DataFieldListItem | TemplateMeasure) {
  return textValue(
    (item as DataFieldListItem).data_field_name ??
      (item as DataFieldListItem).measure_name ??
      (item as TemplateMeasure).label ??
      item.measure_code,
  );
}

function isGeneralDimension(row: DimensionManagementRow) {
  const code = normalizeCode(row.dimension_code);
  const type = normalizeCode(row.dimension_type);
  return code && !["GEOGRAPHY", "LOCATION", "TIME_PERIOD"].includes(code) && ["GENERAL", "GENERIC", "CUSTOM", ""].includes(type);
}

function maxPreviewItems(items: DimensionMemberSetItem[] | undefined, fallback: string): PreviewLabel[] {
  const rows = (items ?? [])
    .slice(0, 8)
    .map(previewItemLabel)
    .filter((value) => value.label !== "-");
  return rows.length ? rows : [{ code: fallback, label: fallback }];
}

function isLibraryItem(value: unknown): value is LibraryItem {
  const item = value as LibraryItem;
  return Boolean(item && typeof item === "object" && item.type && item.code);
}

function normalizeLibraryItem(value: unknown): LibraryItem | null {
  if (!isLibraryItem(value)) return null;
  const item = value as LibraryItem;
  return {
    ...item,
    id: item.id || `${item.type}:${item.code}`,
  };
}

function isBuilderState(value: unknown): value is BuilderState {
  const state = value as BuilderState;
  return Boolean(
    state &&
      typeof state === "object" &&
      Array.isArray(state.tabsBy) &&
      Array.isArray(state.rowRepresents) &&
      Array.isArray(state.columns) &&
      Array.isArray(state.fields),
  );
}

function safeBuilderState(value: unknown): BuilderState {
  if (!isBuilderState(value)) return emptyBuilder;
  return {
    tabsBy: value.tabsBy.map(normalizeLibraryItem).filter((item): item is LibraryItem => Boolean(item)),
    rowRepresents: value.rowRepresents.map(normalizeLibraryItem).filter((item): item is LibraryItem => Boolean(item)),
    columns: value.columns.map(normalizeLibraryItem).filter((item): item is LibraryItem => Boolean(item)),
    fields: value.fields.map(normalizeLibraryItem).filter((item): item is LibraryItem => Boolean(item)),
  };
}

function safeRecordOfLibraryItems(value: unknown): Record<string, LibraryItem> {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, LibraryItem>>((next, [key, item]) => {
    const normalized = normalizeLibraryItem(item);
    if (normalized) next[key] = normalized;
    return next;
  }, {});
}

function safeComputedColumns(value: unknown): ComputedColumnDraft[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => item as ComputedColumnDraft)
    .filter((item) => item && item.code && item.label && item.formula && ["compute", "calculated", "rollup"].includes(item.mode));
}

function safeValidationMap(value: unknown): Record<string, ColumnValidationConfig> {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, ColumnValidationConfig>).reduce<Record<string, ColumnValidationConfig>>((next, [key, config]) => {
    if (config?.requirement && config.numericBehavior && config.failureBehavior) next[key] = config;
    return next;
  }, {});
}

function safePreviewSettings(value: unknown) {
  const settings = value as Partial<typeof defaultPreviewSettings>;
  return {
    showCodes: Boolean(settings?.showCodes),
    zebraRows: settings?.zebraRows !== false,
    compactCells: settings?.compactCells !== false,
    editablePreview: settings?.editablePreview !== false,
  };
}

function safeStudioState(value: unknown): Record<string, unknown> | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function hasBuilderContent(state: BuilderState) {
  return state.tabsBy.length > 0 || state.rowRepresents.length > 0 || state.columns.length > 0 || state.fields.length > 0;
}

function hasDraftContent(
  state: BuilderState,
  mappedCells: Record<string, LibraryItem>,
  validations: Record<string, ColumnValidationConfig>,
  generatedColumns: ComputedColumnDraft[],
) {
  return hasBuilderContent(state) || Object.keys(mappedCells).length > 0 || Object.keys(validations).length > 0 || generatedColumns.length > 0;
}

const defaultPreviewSettings = {
  showCodes: false,
  zebraRows: true,
  compactCells: true,
  editablePreview: true,
};

export function TemplateStudioPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState<StudioStep>(() => {
    const step = params.get("step") as StudioStep | null;
    return step && step !== "setup" && steps.some((item) => item.code === step) ? step : "structure";
  });
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTab>("dimensions");
  const [librarySearch, setLibrarySearch] = useState("");
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [axes, setAxes] = useState<TemplateAxis[]>([]);
  const [measures, setMeasures] = useState<TemplateMeasure[]>([]);
  const [renderContract, setRenderContract] = useState<TemplateRenderContract | null>(null);
  const [dimensionSets, setDimensionSets] = useState<LibraryItem[]>([]);
  const [geographySets, setGeographySets] = useState<LibraryItem[]>([]);
  const [timeSets, setTimeSets] = useState<LibraryItem[]>([]);
  const [dataFields, setDataFields] = useState<LibraryItem[]>([]);
  const [allTimePeriods, setAllTimePeriods] = useState<TimePeriod[]>([]);
  const [memberCache, setMemberCache] = useState<Record<string, DimensionMemberSetItem[]>>({});
  const [builder, setBuilder] = useState<BuilderState>(emptyBuilder);
  const [cellMap, setCellMap] = useState<Record<string, LibraryItem>>({});
  const [timeSetDrawerOpen, setTimeSetDrawerOpen] = useState(false);
  const [validationDrawer, setValidationDrawer] = useState<{
    columnIndex: number;
    columnKey: string;
    columnLabel: string;
    measure: LibraryItem | null;
  } | null>(null);
  const [columnValidations, setColumnValidations] = useState<Record<string, ColumnValidationConfig>>({});
  const [availableValidations, setAvailableValidations] = useState<Record<string, ColumnValidationConfig>>({});
  const [validationForm, setValidationForm] = useState<ColumnValidationConfig>(defaultValidationConfig);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("compute");
  const [calculationMode, setCalculationMode] = useState<CalculationMode>("basic");
  const [computeName, setComputeName] = useState("");
  const [computeFormula, setComputeFormula] = useState("");
  const [computeColumnSearch, setComputeColumnSearch] = useState("");
  const [computedColumns, setComputedColumns] = useState<ComputedColumnDraft[]>([]);
  const [availableRollups, setAvailableRollups] = useState<(DimensionRollupRule & { dimension_code?: string })[]>([]);
  const [selectedRollupKey, setSelectedRollupKey] = useState("");
  const [calculatedFunction, setCalculatedFunction] = useState("PERCENTAGE");
  const [calculatedOutputUom, setCalculatedOutputUom] = useState("Percent");
  const [timeSetName, setTimeSetName] = useState("");
  const [timeSetType, setTimeSetType] = useState("TEMPLATE_SCOPE");
  const [periodSearch, setPeriodSearch] = useState("");
  const [periodFrequencyFilter, setPeriodFrequencyFilter] = useState("ALL");
  const [periodYearFilter, setPeriodYearFilter] = useState("ALL");
  const [selectedPeriods, setSelectedPeriods] = useState<PeriodSelection[]>([]);
  const [previewSettings, setPreviewSettings] = useState(defaultPreviewSettings);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState(params.get("template_code") ?? "");
  const [selectedVersionCode, setSelectedVersionCode] = useState(params.get("version_code") ?? "");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVersionLoading, setIsVersionLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const versionHydratedRef = useRef(false);
  const autosaveTimerRef = useRef<number | undefined>(undefined);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.template_code === selectedTemplateCode) ?? templates[0] ?? null,
    [selectedTemplateCode, templates],
  );

  const selectedVersion = useMemo(
    () => versions.find((version) => version.version_code === selectedVersionCode) ?? versions[0] ?? null,
    [selectedVersionCode, versions],
  );
  const isStudioHydrating = isLoading || isVersionLoading || Boolean(selectedVersion?.version_code && !versionHydratedRef.current);

  const libraryItems = useMemo(() => {
    const byTab: Record<LibraryTab, LibraryItem[]> = {
      dimensions: dimensionSets,
      geography: geographySets,
      time: timeSets,
      measures: dataFields,
    };
    const q = librarySearch.trim().toLowerCase();
    return byTab[activeLibraryTab].filter(
      (item) =>
        !q ||
        [item.label, item.subLabel, item.code, item.badge]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [activeLibraryTab, dataFields, dimensionSets, geographySets, librarySearch, timeSets]);

  const previewRows = useMemo(() => {
    const rowItem = builder.rowRepresents[0];
    if (!rowItem) return ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5"].map((label) => ({ code: label, label }));
    return maxPreviewItems(memberCache[rowItem.id], rowItem.label);
  }, [builder.rowRepresents, memberCache]);

  const previewColumnGroups = useMemo(() => {
    const sourceFields = builder.fields.filter((field) => !field.generatedMode);
    const columnItems = builder.columns.length ? builder.columns : sourceFields;
    if (!columnItems.length) return ["Column", "Column", "Column"].map((label) => ({ code: label, label }));
    return columnItems.flatMap((item) => {
      if (item.type === "MEASURE") return [{ code: item.code, label: item.label }];
      const members = maxPreviewItems(memberCache[item.id], item.label);
      return members.slice(0, 5);
    });
  }, [builder.columns, builder.fields, memberCache]);

  const generatedFieldColumns = useMemo(
    () => builder.fields.filter((field) => Boolean(field.generatedMode)),
    [builder.fields],
  );

  const previewTabItems = useMemo(() => {
    if (!builder.tabsBy.length) return [];
    return builder.tabsBy.flatMap((item) => maxPreviewItems(memberCache[item.id], item.label));
  }, [builder.tabsBy, memberCache]);

  const previewColumns = useMemo<PreviewColumn[]>(() => {
    return previewColumnGroups.flatMap((group) => {
      const baseColumns = previewTabItems.length
        ? previewTabItems.map((tab) => ({
            code: `${group.code}:${tab.code}`,
            label: tab.label,
            groupCode: group.code,
            groupLabel: group.label,
          }))
        : [{ ...group }];
      const generatedColumns = generatedFieldColumns.map((field) => ({
        code: `${group.code}:${field.code}`,
        label: field.label,
        groupCode: group.code,
        groupLabel: group.label,
        generatedMeasure: field,
      }));
      return [...baseColumns, ...generatedColumns];
    });
  }, [generatedFieldColumns, previewColumnGroups, previewTabItems]);

  const columnsPerGroup = Math.max(1, (previewTabItems.length || 1) + generatedFieldColumns.length);

  const previewColumnMinWidth = Math.max(760, 148 + previewColumns.length * 168);
  const periodFrequencyOptions = useMemo(() => {
    const options = new Map<string, string>();
    allTimePeriods.forEach((period) => {
      const code = normalizeCode(period.frequency_code);
      if (!code) return;
      options.set(code, textValue(period.frequency_name ?? code));
    });
    return Array.from(options.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allTimePeriods]);

  const periodYearOptions = useMemo(() => {
    const years = new Set<string>();
    allTimePeriods.forEach((period) => {
      if (period.period_year) years.add(String(period.period_year));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [allTimePeriods]);

  const filteredTimePeriods = useMemo(() => {
    const q = periodSearch.trim().toLowerCase();
    return allTimePeriods
      .filter((period) => {
        if (selectedPeriods.some((selected) => selected.code === period.time_period_code)) return false;
        if (periodFrequencyFilter !== "ALL" && normalizeCode(period.frequency_code) !== periodFrequencyFilter) return false;
        if (periodYearFilter !== "ALL" && String(period.period_year ?? "") !== periodYearFilter) return false;
        if (!q) return true;
        return [period.time_period_code, period.name, period.frequency_name, period.frequency_code, period.period_year]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      })
      .slice(0, q || periodFrequencyFilter !== "ALL" || periodYearFilter !== "ALL" ? 80 : 24);
  }, [allTimePeriods, periodFrequencyFilter, periodSearch, periodYearFilter, selectedPeriods]);

  const editableColumnSources = useMemo(() => {
    const deduped = new Map<
      string,
      {
        key: string;
        label: string;
        measureLabel: string;
        measureCode: string;
        uom: string;
        groupLabel?: string;
      }
    >();
    previewColumns.forEach((column, index) => {
      if (column.generatedMeasure) return;
      const measure = measureForColumn(index);
      if (!measure) return;
      const key = measureColumnKey(column, index);
      if (deduped.has(key)) return;
      deduped.set(key, {
        key,
        label: previewSettings.showCodes ? column.code : column.label,
        measureLabel: measure.label,
        measureCode: measure.code,
        uom: measure.badge || "UOM",
        groupLabel: column.groupLabel,
      });
    });
    return Array.from(deduped.values());
  }, [builder.fields, cellMap, previewColumns, previewSettings.showCodes]);

  const computeSuggestions = useMemo(() => {
    const query =
      computeColumnSearch.trim().toLowerCase() ||
      (computeFormula.split(/[\s+\-*/(),]+/).pop() ?? "").replace(/[{}]/g, "").trim().toLowerCase();
    return editableColumnSources
      .filter((source) => {
        if (!query) return true;
        return [source.label, source.measureLabel, source.measureCode, source.uom]
          .some((value) => value.toLowerCase().includes(query));
      })
      .slice(0, 8);
  }, [computeColumnSearch, computeFormula, editableColumnSources]);

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const refresh = () => {
      setSelectedTemplateCode("");
      setSelectedVersionCode("");
      setRenderContract(null);
      setBuilder(emptyBuilder);
      void loadAll();
    };
    window.addEventListener(UNIT_CHANGED_EVENT, refresh);
    window.addEventListener(LOCALE_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(UNIT_CHANGED_EVENT, refresh);
      window.removeEventListener(LOCALE_CHANGED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (!selectedTemplate?.template_code) {
      setVersions([]);
      return;
    }
    void loadVersions(selectedTemplate.template_code);
  }, [selectedTemplate?.template_code]);

  useEffect(() => {
    if (!selectedVersion?.version_code) {
      setAxes([]);
      setMeasures([]);
      setRenderContract(null);
      setBuilder(emptyBuilder);
      setCellMap({});
      setColumnValidations({});
      setAvailableValidations({});
      setComputedColumns([]);
      versionHydratedRef.current = false;
      return;
    }
    versionHydratedRef.current = false;
    window.clearTimeout(autosaveTimerRef.current);
    setIsVersionLoading(true);
    void loadVersionDesign(selectedVersion.version_code).finally(() => {
      versionHydratedRef.current = true;
      setIsVersionLoading(false);
    });
  }, [selectedVersion?.version_code]);

  useEffect(() => {
    if (!selectedVersion?.version_code || !versionHydratedRef.current || isLoading || isVersionLoading) return undefined;
    if (!hasDraftContent(builder, cellMap, columnValidations, computedColumns)) return undefined;
    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      void saveDraftSnapshot({ silent: true });
    }, 1800);
    return () => window.clearTimeout(autosaveTimerRef.current);
  }, [activeStep, builder, cellMap, columnValidations, computedColumns, previewSettings, selectedVersion?.version_code, isLoading, isVersionLoading]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(""), 4500);
    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    setLibrarySearch("");
  }, [activeLibraryTab]);

  useEffect(() => {
    if (!settingsDrawerOpen || settingsTab !== "rollup") return;
    void loadAvailableRollups();
  }, [builder.columns, builder.rowRepresents, builder.tabsBy, settingsDrawerOpen, settingsTab]);

  function changeLibraryTab(tab: LibraryTab) {
    setLibrarySearch("");
    setActiveLibraryTab(tab);
  }

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (selectedTemplate?.template_code) next.set("template_code", selectedTemplate.template_code);
    if (selectedVersion?.version_code) next.set("version_code", selectedVersion.version_code);
    next.set("step", activeStep);
    setParams(next, { replace: true });
  }, [activeStep, selectedTemplate?.template_code, selectedVersion?.version_code]);

  async function loadAll() {
    setIsLoading(true);
    setError("");
    try {
      const [templateResponse, dimensionResponse, geographySetResponse, timeSetResponse, timePeriodResponse, dataFieldResponse] =
        await Promise.all([
          listTemplates({ limit: 200 }),
          listDimensionManagementRows({ limit: 300, offset: 0 }),
          listDimensionMemberSets("GEOGRAPHY").catch(() => ({ data: [] })),
          listTimePeriodSets(),
          listAllTimePeriods().catch(() => ({ data: [] })),
          listDataFields({ limit: 500, offset: 0 }),
        ]);

      const nextTemplates = templateResponse.data ?? [];
      const nextDimensions = (dimensionResponse.data?.rows ?? []).filter(isGeneralDimension);
      setTemplates(nextTemplates);
      setAllTimePeriods(timePeriodResponse.data ?? []);
      setSelectedTemplateCode((current) => current || nextTemplates[0]?.template_code || "");
      setDataFields(
        (dataFieldResponse.data ?? []).map((field) => ({
          id: `MEASURE:${field.measure_code}`,
          type: "MEASURE",
          code: field.measure_code ?? "",
          label: measureName(field),
          subLabel: [field.indicator_number, field.uom_name ?? field.unit_code, field.periodicity_name].filter(Boolean).join(" | "),
          badge: textValue(field.uom_name ?? field.unit_code ?? "Measure"),
          indicatorVersionCode: field.version_code ?? "",
          sourceMeasureCode: field.measure_code ?? "",
          valueType: field.value_type ?? "NUMERIC",
          measureUnitCode: field.uom_code ?? field.unit_code ?? null,
          aggregationType: field.aggregation_type ?? "SUM",
        })),
      );

      const setResults = await Promise.all(
        nextDimensions.map(async (dimension: DimensionManagementRow) => {
          const dimensionCode = dimension.dimension_code ?? "";
          if (!dimensionCode) return [];
          const response = await listDimensionMemberSets(dimensionCode).catch(() => ({ data: [] }));
          return enrichSetItems(
            (response.data ?? []).map((set) => mapSetToLibraryItem(set, "DIMENSION_SET", dimensionCode, dimension)),
          );
        }),
      );
      const nextDimensionSets = setResults.flat();
      const nextGeographySets = await enrichSetItems(
        (geographySetResponse.data ?? []).map((set) => mapSetToLibraryItem(set, "GEOGRAPHY_SET", "GEOGRAPHY")),
      );
      const nextTimeSets = await enrichSetItems(
        (timeSetResponse.data ?? []).map((set) => mapSetToLibraryItem(set, "TIME_SET", "TIME_PERIOD")),
      );
      setDimensionSets(nextDimensionSets);
      setGeographySets(nextGeographySets);
      setTimeSets(nextTimeSets);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Template Designer data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function enrichSetItems(items: LibraryItem[]) {
    const enriched = await Promise.all(
      items.map(async (item) => {
        if (item.memberCount && item.memberCount > 0) return item;
        try {
          const response =
            item.type === "TIME_SET"
              ? await listTimePeriodSetPeriods(item.code)
              : await listDimensionMemberSetMembers(item.code, 500);
          const rows = response.data ?? [];
          setMemberCache((current) => ({ ...current, [item.id]: current[item.id] ?? rows }));
          return { ...item, memberCount: rows.length, badge: `${rows.length} items` };
        } catch {
          return item;
        }
      }),
    );
    return enriched;
  }

  async function loadVersions(templateCode: string) {
    try {
      const response = await listTemplateVersions(templateCode);
      const nextVersions = response.data ?? [];
      const requestedVersionCode = params.get("version_code") ?? "";
      setVersions(nextVersions);
      setSelectedVersionCode(
        (current) =>
          nextVersions.some((version) => version.version_code === requestedVersionCode)
            ? requestedVersionCode
            : nextVersions.some((version) => version.version_code === current)
              ? current
              : nextVersions.find((version) => version.is_current)?.version_code || nextVersions[0]?.version_code || "",
      );
    } catch {
      setVersions([]);
      setSelectedVersionCode("");
    }
  }

  async function refreshTimeSetLibrary() {
    const response = await listTimePeriodSets();
    const nextTimeSets = await enrichSetItems(
      (response.data ?? []).map((set) => mapSetToLibraryItem(set, "TIME_SET", "TIME_PERIOD")),
    );
    setTimeSets(nextTimeSets);
  }

  async function loadVersionDesign(versionCode: string) {
    try {
      const [axisResponse, measureResponse, contractResponse, draftResponse, formulaResponse] = await Promise.all([
        listTemplateAxes(versionCode),
        listTemplateMeasures(versionCode),
        getTemplateRenderContract(versionCode).catch(() => ({ data: null })),
        getTemplateStudioDraft(versionCode).catch(() => ({ data: null })),
        listTemplateFormulaOutputs(versionCode).catch(() => ({ data: [] })),
      ]);
      setAxes(axisResponse.data ?? []);
      setMeasures(measureResponse.data ?? []);
      setRenderContract(contractResponse.data);
      setBuilder(emptyBuilder);
      setCellMap({});
      setColumnValidations({});
      setAvailableValidations({});
      setComputedColumns([]);
      setPreviewSettings(defaultPreviewSettings);
      const draftPayload = draftResponse.data as (TemplateStudioDraft & { data?: TemplateStudioDraft; studio_state?: unknown }) | null;
      const studioState = safeStudioState(draftPayload?.studio_state ?? draftPayload?.data?.studio_state);
      if (studioState && Object.keys(studioState).length > 0) {
        if (isBuilderState(studioState.builder)) {
          const nextBuilder = safeBuilderState(studioState.builder);
          setBuilder(nextBuilder);
          await Promise.all([...nextBuilder.tabsBy, ...nextBuilder.rowRepresents, ...nextBuilder.columns].map((item) => loadMembersForItem(item)));
        }
        if (studioState.cellMap && typeof studioState.cellMap === "object") {
          setCellMap(safeRecordOfLibraryItems(studioState.cellMap));
        }
        if (studioState.columnValidations && typeof studioState.columnValidations === "object") {
          setAvailableValidations(safeValidationMap(studioState.columnValidations));
        }
        if (Array.isArray(studioState.computedColumns)) {
          setComputedColumns(safeComputedColumns(studioState.computedColumns));
        }
        if (studioState.previewSettings && typeof studioState.previewSettings === "object") {
          setPreviewSettings(safePreviewSettings(studioState.previewSettings));
        }
      } else {
        const nextComputedColumns = (formulaResponse.data ?? []).map((formula) => {
          const mode = String(formula.formula_type ?? "COMPUTE").toLowerCase();
          return {
            code: formula.formula_code ?? "",
            label: formula.formula_name ?? formula.formula_code ?? "Generated value",
            formula: formula.expression_text ?? "",
            outputUom: formula.output_uom_code ?? "Calculated",
            mode: mode === "calculated" || mode === "rollup" ? mode : "compute",
            functionCode: formula.function_code ?? undefined,
          } satisfies ComputedColumnDraft;
        });
        setComputedColumns(nextComputedColumns);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Template version design could not be loaded.");
    }
  }

  function mapSetToLibraryItem(
    set: DimensionMemberSet,
    type: LibraryItemType,
    dimensionCode: string,
    dimension?: DimensionManagementRow,
  ): LibraryItem {
    const code = set.set_code ?? "";
    const dimensionName = dimension?.dimension_name ?? dimension?.name ?? dimensionCode;
    return {
      id: `${type}:${code}`,
      type,
      code,
      label: set.name ?? code,
      subLabel: type === "DIMENSION_SET" ? `${dimensionName} member set` : type === "GEOGRAPHY_SET" ? "Geography member set" : "Reporting sequence set",
      badge: `${set.member_count ?? 0} items`,
      dimensionCode,
      memberCount: Number(set.member_count ?? 0),
    };
  }

  function onDragStart(event: DragEvent, item: LibraryItem) {
    event.dataTransfer.setData("application/json", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "copy";
  }

  async function onDrop(event: DragEvent, zone: DropZone) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    const item = JSON.parse(raw) as LibraryItem;
    setBuilder((current) => {
      if (current[zone].some((existing) => existing.id === item.id)) {
        return { ...current, [zone]: current[zone].filter((existing) => existing.id !== item.id) };
      }
      return { ...current, [zone]: [...current[zone], item] };
    });
    await loadMembersForItem(item);
  }

  async function onCellDrop(event: DragEvent, zone: DropZone, cellKey?: string) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    const item = JSON.parse(raw) as LibraryItem;
    const actualZone = resolvePreviewDropZone(item, zone);
    if (cellKey && item.type === "MEASURE") {
      setBuilder((current) =>
        current.fields.some((existing) => existing.id === item.id)
          ? current
          : { ...current, fields: [...current.fields, item] },
      );
      setCellMap((current) => ({ ...current, [cellKey]: item }));
      await loadMembersForItem(item);
      return;
    }
    setBuilder((current) => {
      if (current[actualZone].some((existing) => existing.id === item.id)) {
        return { ...current, [actualZone]: current[actualZone].filter((existing) => existing.id !== item.id) };
      }
      return { ...current, [actualZone]: [...current[actualZone], item] };
    });
    await loadMembersForItem(item);
  }

  function resolvePreviewDropZone(item: LibraryItem, zone: DropZone): DropZone {
    if (item.type === "MEASURE") return "fields";
    if (zone === "fields") return "rowRepresents";
    return zone;
  }

  async function loadMembersForItem(item: LibraryItem): Promise<DimensionMemberSetItem[]> {
    if (memberCache[item.id]) return memberCache[item.id];
    if (item.type === "MEASURE" || !item.code) return [];
    try {
      const response =
        item.type === "TIME_SET"
          ? await listTimePeriodSetPeriods(item.code)
          : await listDimensionMemberSetMembers(item.code, 500);
      const rows = response.data ?? [];
      setMemberCache((current) => ({ ...current, [item.id]: rows }));
      return rows;
    } catch {
      setMemberCache((current) => ({ ...current, [item.id]: [] }));
      return [];
    }
  }

  async function loadAvailableRollups() {
    const dimensionCodes = Array.from(
      new Set(
        [...builder.tabsBy, ...builder.rowRepresents, ...builder.columns]
          .map((item) => item.dimensionCode)
          .filter((code): code is string => Boolean(code)),
      ),
    );
    if (!dimensionCodes.length) {
      setAvailableRollups([]);
      setSelectedRollupKey("");
      return;
    }
    const results = await Promise.all(
      dimensionCodes.map(async (dimensionCode) => {
        try {
          const response = await listDimensionRollupRules(dimensionCode, 200);
          return (response.data ?? [])
            .filter((rollup) => rollup.is_active !== false)
            .map((rollup) => ({ ...rollup, dimension_code: dimensionCode }));
        } catch {
          return [];
        }
      }),
    );
    const nextRollups = results.flat();
    setAvailableRollups(nextRollups);
    setSelectedRollupKey((current) => {
      if (current && nextRollups.some((rollup) => rollupKey(rollup) === current)) return current;
      return nextRollups[0] ? rollupKey(nextRollups[0]) : "";
    });
  }

  function removeDroppedItem(zone: DropZone, id: string) {
    setBuilder((current) => ({ ...current, [zone]: current[zone].filter((item) => item.id !== id) }));
    if (zone === "fields") {
      setCellMap((current) => {
        const next = { ...current };
        Object.keys(next).forEach((key) => {
          if (next[key]?.id === id) delete next[key];
        });
        return next;
      });
    }
  }

  function toggleCellMeasure(cellKey: string) {
    setCellMap((current) => {
      if (!current[cellKey]) return current;
      const next = { ...current };
      delete next[cellKey];
      return next;
    });
  }

  function rollupKey(rollup: DimensionRollupRule & { dimension_code?: string }) {
    return `${rollup.dimension_code ?? "DIMENSION"}:${rollup.parent_member_code ?? "PARENT"}:${rollup.rule_code ?? "ROLLUP"}`;
  }

  function rollupLabel(rollup: DimensionRollupRule & { dimension_code?: string }) {
    const parent = textValue(rollup.parent_member_name ?? rollup.parent_member_code);
    const method = textValue(rollup.aggregation_method ?? rollup.entry_mode ?? "Rollup");
    return `${parent} ${method}`;
  }

  function measureColumnKey(column: PreviewColumn, columnIndex: number) {
    if (column.generatedMeasure) {
      return `column-generated:${normalizeCode(column.groupCode ?? column.code)}:${normalizeCode(column.generatedMeasure.code)}`;
    }
    if (column.groupCode) {
      return `column-repeat-label:${normalizeCode(column.label)}`;
    }
    return `column:${columnIndex}`;
  }

  function measureForColumn(columnIndex: number) {
    const column = previewColumns[columnIndex];
    if (column?.generatedMeasure) return column.generatedMeasure;
    const columnOverride = column ? cellMap[measureColumnKey(column, columnIndex)] : cellMap[`column:${columnIndex}`];
    if (columnOverride) return columnOverride;
    if (!builder.fields.length) return null;
    return builder.fields.find((field) => !field.generatedMode) ?? null;
  }

  function measureTitle(field: LibraryItem) {
    return `Fill data for:\n${field.label}\nUOM: ${field.badge || "Not mapped"}\nCode: ${field.code}`;
  }

  function openColumnValidation(event: MouseEvent, columnIndex: number, measure: LibraryItem | null) {
    event.preventDefault();
    event.stopPropagation();
    const column = previewColumns[columnIndex];
    const columnKey = column ? measureColumnKey(column, columnIndex) : `column:${columnIndex}`;
    setValidationForm(columnValidations[columnKey] ?? defaultValidationConfig);
    setValidationDrawer({
      columnIndex,
      columnKey,
      columnLabel: column ? (previewSettings.showCodes ? column.code : column.label) : `Column ${columnIndex + 1}`,
      measure,
    });
  }

  function validationRuleCode(config: ColumnValidationConfig, measure: LibraryItem | null) {
    const measureCode = normalizeCode(measure?.code ?? "COLUMN");
    const numericPart = config.numericBehavior;
    const requirementPart = config.requirement === "REQUIRED" ? "REQUIRED" : "OPTIONAL";
    return normalizeCode(`TPL_${requirementPart}_${numericPart}_${measureCode}`).slice(0, 120);
  }

  function validationBindingCode(ruleCode: string, columnKey: string) {
    const templatePart = normalizeCode(selectedVersion?.version_code ?? selectedTemplate?.template_code ?? "TEMPLATE");
    const columnPart = normalizeCode(columnKey.replace(/[^a-zA-Z0-9]+/g, "_"));
    return normalizeCode(`TPL_BIND_${templatePart}_${columnPart}_${ruleCode}`).slice(0, 160);
  }

  function validationRuleConfig(config: ColumnValidationConfig) {
    return {
      requirement: config.requirement,
      numeric_behavior: config.numericBehavior,
      min: config.numericBehavior === "NON_NEGATIVE" ? 0 : config.minValue === "" ? null : Number(config.minValue),
      max: config.maxValue === "" ? null : Number(config.maxValue),
      warning_by_default: config.failureBehavior === "WARNING",
    };
  }

  function insertFormulaToken(source: { label: string; key: string; uom: string }) {
    const token = `{{${source.label}}}`;
    setComputeFormula((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${token}`);
    setComputeColumnSearch("");
  }

  function createComputedCode(label: string) {
    return normalizeCode(`COMPUTED_${label || "VALUE"}_${computedColumns.length + 1}`).slice(0, 80);
  }

  function addComputedColumn(mode: SettingsTab) {
    const selectedRollup = availableRollups.find((rollup) => rollupKey(rollup) === selectedRollupKey);
    const label = mode === "rollup" && selectedRollup ? rollupLabel(selectedRollup) : computeName.trim();
    const formula =
      mode === "rollup" && selectedRollup
        ? `${selectedRollup.dimension_code ?? "DIMENSION"}.${selectedRollup.rule_code ?? "ROLLUP"}`
        : computeFormula.trim();
    if (!label || !formula) {
      setError(mode === "rollup" ? "Select an available rollup before adding the rollup column." : "Enter a value name and formula before adding the computed column.");
      return;
    }
    const code = createComputedCode(label);
    const outputUom = (mode === "calculated" ? calculatedOutputUom : calculatedOutputUom).trim() || "Calculated";
    const computed: ComputedColumnDraft = {
      code,
      label,
      formula,
      outputUom,
      mode,
      functionCode: mode === "calculated" ? calculatedFunction : undefined,
    };
    const item: LibraryItem = {
      id: `MEASURE:${code}`,
      type: "MEASURE",
      code,
      label,
      subLabel: `${mode === "rollup" ? "Rollup" : mode === "compute" ? "Computed" : "Calculated"} | ${formula}`,
      badge: outputUom,
      generatedMode: mode,
    };
    setComputedColumns((current) => [computed, ...current]);
    setBuilder((current) => ({
      ...current,
      fields: current.fields.some((field) => field.id === item.id) ? current.fields : [...current.fields, item],
    }));
    setComputeName("");
    setComputeFormula("");
    setComputeColumnSearch("");
    setNotice(`${mode === "rollup" ? "Rollup" : mode === "calculated" ? "Calculated" : "Computed"} column added to the draft preview.`);
  }

  function sourceKeysForFormula(formula: string) {
    const normalizedFormula = formula.toLowerCase();
    return editableColumnSources
      .filter((source) => normalizedFormula.includes(source.label.toLowerCase()) || normalizedFormula.includes(source.measureLabel.toLowerCase()))
      .map((source) => source.key);
  }

  function buildStudioDraftState(
    overrides: Partial<{
      builder: BuilderState;
      cellMap: Record<string, LibraryItem>;
      columnValidations: Record<string, ColumnValidationConfig>;
      computedColumns: ComputedColumnDraft[];
      previewSettings: typeof defaultPreviewSettings;
      activeStep: StudioStep;
    }> = {},
  ) {
    return {
      builder: overrides.builder ?? builder,
      cellMap: overrides.cellMap ?? cellMap,
      columnValidations: overrides.columnValidations ?? columnValidations,
      computedColumns: overrides.computedColumns ?? computedColumns,
      previewSettings: overrides.previewSettings ?? previewSettings,
      activeStep: overrides.activeStep ?? activeStep,
      savedAt: new Date().toISOString(),
      contractVersion: "template-studio-draft-v1",
    };
  }

  async function saveDraftSnapshot(options: { silent?: boolean; overrides?: Parameters<typeof buildStudioDraftState>[0] } = {}) {
    if (!selectedVersion?.version_code) {
      if (!options.silent) setError("Select a template version before saving draft.");
      return;
    }
    const draftBuilder = options.overrides?.builder ?? builder;
    const draftCellMap = options.overrides?.cellMap ?? cellMap;
    const draftValidations = options.overrides?.columnValidations ?? columnValidations;
    const draftComputedColumns = options.overrides?.computedColumns ?? computedColumns;
    if (!hasDraftContent(draftBuilder, draftCellMap, draftValidations, draftComputedColumns)) {
      if (!options.silent) setError("Add template structure before saving draft.");
      return;
    }
    await saveTemplateStudioDraft(selectedVersion.version_code, {
      unit_code: getSelectedUnitCode(),
      studio_state: buildStudioDraftState(options.overrides),
      updated_by: "ui-template-studio",
    });
    if (!options.silent) setNotice("Template Studio draft saved.");
  }

  async function persistComputedColumns(versionCode: string) {
    await Promise.all(
      computedColumns.map((column, index) =>
        upsertTemplateFormulaOutput(versionCode, {
          unit_code: getSelectedUnitCode(),
          formula_code: column.code,
          formula_name: column.label,
          formula_type: column.mode === "compute" ? "COMPUTE" : column.mode === "calculated" ? "CALCULATED" : "ROLLUP",
          expression_text: column.formula,
          output_uom_code: column.outputUom,
          function_code: column.functionCode ?? null,
          source_column_keys: sourceKeysForFormula(column.formula),
          render_metadata: {
            generated_mode: column.mode,
            repeat_per_column_group: true,
            preview_behavior: "NON_EDITABLE_GENERATED_COLUMN",
          },
          sort_order: 9000 + index,
          is_active: true,
        }),
      ),
    );
  }

  async function ensureTemplateMeasure(measure: LibraryItem) {
    if (!selectedVersion?.version_code) {
      throw new Error("Select a template version before creating validation.");
    }
    const measureCode = normalizeCode(measure.code);
    if (!measureCode) {
      throw new Error("Selected measure does not have a valid measure code.");
    }
    const existing = measures.find((item) => normalizeCode(item.measure_code) === measureCode);
    if (existing) return measureCode;

    const indicatorVersionCode = normalizeCode(measure.indicatorVersionCode);
    const sourceMeasureCode = normalizeCode(measure.sourceMeasureCode ?? measure.code);
    if (!indicatorVersionCode || !sourceMeasureCode) {
      throw new Error("This measure is not linked to an active indicator version. Refresh Data Field Library and select a governed measure.");
    }

    const templateMeasurePayload = {
      measure_code: measureCode,
      indicator_version_code: indicatorVersionCode,
      source_measure_code: sourceMeasureCode,
      label: measure.label,
      unit_code: getSelectedUnitCode(),
      value_type: measure.valueType ?? "NUMERIC",
      measure_unit_code: measure.measureUnitCode ?? null,
      aggregation_type: measure.aggregationType ?? "SUM",
      decimal_places: null,
      validation_rule_code: null,
      sort_order: Math.max(1, measures.length + builder.fields.findIndex((field) => field.id === measure.id) + 1),
      is_editable: true,
      is_required: true,
      render_metadata: {
        created_from: "TEMPLATE_STUDIO_VALIDATION",
        source_data_field_code: sourceMeasureCode,
      },
      is_active: true,
      help_text: "Automatically registered from Template Studio before validation binding.",
    };
    await createTemplateMeasure(selectedVersion.version_code, templateMeasurePayload);
    setMeasures((current) =>
      current.some((item) => normalizeCode(item.measure_code) === measureCode)
        ? current
        : [
            ...current,
            {
              ...templateMeasurePayload,
              id: measureCode,
            } as unknown as TemplateMeasure,
          ],
    );
    return measureCode;
  }

  async function saveColumnValidation() {
    if (!validationDrawer?.measure) {
      setError("Map a measure before creating column validation.");
      return;
    }
    if (!selectedVersion?.version_code) {
      setError("Select a template version before creating validation.");
      return;
    }
    const ruleCode = validationRuleCode(validationForm, validationDrawer.measure);
    const bindingCode = validationBindingCode(ruleCode, validationDrawer.columnKey);
    const severity = validationForm.failureBehavior === "BLOCK" ? "ERROR" : "WARNING";
    const draftSnapshot = {
      builder,
      cellMap,
      computedColumns,
      previewSettings,
      activeStep,
    };
    setIsSaving(true);
    setError("");
    try {
      const templateMeasureCode = await ensureTemplateMeasure(validationDrawer.measure);
      await upsertValidationRule({
        unit_code: getSelectedUnitCode(),
        rule_code: ruleCode,
        rule_type: "BUILT_IN",
        rule_category: "CELL_VALUE",
        default_severity: severity,
        evaluation_model: "BUILT_IN_SAFE",
        parameter_schema: validationRuleConfig(validationForm),
        display_name: `${validationDrawer.measure.label} ${validationForm.requirement.toLowerCase()} validation`,
        message_template:
          validationForm.requirement === "REQUIRED"
            ? "{measure} is required and must satisfy the numeric rule."
            : "{measure} is optional, but must satisfy the numeric rule when entered.",
        help_text: "Created from Template Studio for a template version column.",
        is_system_rule: false,
        is_active: true,
      });
      await upsertValidationRuleBinding({
        unit_code: getSelectedUnitCode(),
        binding_code: bindingCode,
        rule_code: ruleCode,
        template_version_code: selectedVersion.version_code,
        cell_code: undefined,
        measure_code: templateMeasureCode,
        severity,
        rule_config: {
          ...validationRuleConfig(validationForm),
          preview_column_key: validationDrawer.columnKey,
          column_label: validationDrawer.columnLabel,
          repeated_column_binding: validationDrawer.columnKey.startsWith("column-repeat-label:"),
          binding_scope: "MEASURE_COLUMN_PATTERN",
        },
        is_active: true,
      });
      const nextValidations = { ...columnValidations, [validationDrawer.columnKey]: validationForm };
      setColumnValidations(nextValidations);
      await saveDraftSnapshot({
        silent: true,
        overrides: {
          ...draftSnapshot,
          columnValidations: nextValidations,
        },
      });
      setBuilder(draftSnapshot.builder);
      setCellMap(draftSnapshot.cellMap);
      setComputedColumns(draftSnapshot.computedColumns);
      setPreviewSettings(draftSnapshot.previewSettings);
      setNotice("Column validation saved.");
      setValidationDrawer(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Column validation could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  function applyAvailableValidation() {
    if (!validationDrawer) return;
    const existing = availableValidations[validationDrawer.columnKey];
    if (!existing) return;
    setValidationForm(existing);
    setColumnValidations((current) => ({ ...current, [validationDrawer.columnKey]: existing }));
    setNotice("Existing validation applied to this draft column.");
  }

  function removeColumnValidation() {
    if (!validationDrawer) return;
    const nextValidations = { ...columnValidations };
    delete nextValidations[validationDrawer.columnKey];
    setColumnValidations(nextValidations);
    setValidationForm(defaultValidationConfig);
    void saveDraftSnapshot({ silent: true, overrides: { columnValidations: nextValidations } });
    setNotice("Validation removed from this draft column.");
  }

  async function saveTimePeriodSet() {
    if (!timeSetName.trim() || selectedPeriods.length === 0) {
      setError("Enter a sequence name and select at least one period.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const setCode = normalizeCode(`TIME_SEQUENCE_${timeSetName}_${Date.now()}`).slice(0, 80);
      await createTimePeriodSet({
        set_code: setCode,
        set_type: timeSetType,
        is_active: true,
        name: timeSetName.trim(),
        description: "Created from Template Studio for governed request/provider time-period selection.",
        items: selectedPeriods.map((period, index) => ({
          time_period_code: period.code,
          sort_order: index + 1,
          is_active: true,
        })),
      });
      setNotice("Time-period reporting sequence created.");
      setTimeSetDrawerOpen(false);
      setTimeSetName("");
      setSelectedPeriods([]);
      setPeriodSearch("");
      setPeriodFrequencyFilter("ALL");
      setPeriodYearFilter("ALL");
      await refreshTimeSetLibrary();
      setActiveLibraryTab("time");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Time-period sequence could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  function addPeriod(period: TimePeriod) {
    const code = period.time_period_code ?? "";
    if (!code || selectedPeriods.some((selected) => selected.code === code)) return;
    setSelectedPeriods((current) => [...current, { code, name: period.name ?? code }]);
  }

  async function saveStructureDraft() {
    if (!selectedVersion?.version_code) {
      setError("Select a template version before saving structure.");
      return false;
    }
    setIsSaving(true);
    setError("");
    try {
      const timeItem = [...builder.rowRepresents, ...builder.columns, ...builder.tabsBy].find((item) => item.type === "TIME_SET");
      if (timeItem) {
        const existingTimeAxis = axes.find((axis) => normalizeCode(axis.dimension_code) === "TIME_PERIOD");
        const payload = {
          axis_code: existingTimeAxis?.axis_code ?? "AXIS_TIME_PERIOD",
          axis_role: builder.columns.some((item) => item.id === timeItem.id) ? "COLUMN" : builder.rowRepresents.some((item) => item.id === timeItem.id) ? "ROW" : "PAGE",
          dimension_code: "TIME_PERIOD",
          label: timeItem.label,
          unit_code: getSelectedUnitCode(),
          member_strategy: "CONTRIBUTOR_SELECT",
          member_set_code: timeItem.code,
          axis_depth: 1,
          display_when_single_member: true,
          is_required: true,
          allow_multiple: false,
          sort_order: 10,
          render_metadata: {
            time_period_behavior: "CONTRIBUTOR_SELECT",
            governance_rule: "TIME_PERIOD_SET_VERSIONED_IMMUTABLE",
            builder_zone: builder.columns.some((item) => item.id === timeItem.id)
              ? "columns"
              : builder.rowRepresents.some((item) => item.id === timeItem.id)
                ? "rowRepresents"
                : "tabsBy",
          },
          is_active: true,
          help_text: "Provider/request uses the governed reporting sequence selected in Template Designer.",
        };
        if (existingTimeAxis?.axis_code) {
          await updateTemplateAxis(selectedVersion.version_code, existingTimeAxis.axis_code, payload);
        } else {
          await createTemplateAxis(selectedVersion.version_code, payload);
        }
      }
      await persistComputedColumns(selectedVersion.version_code);
      await saveDraftSnapshot({ silent: true });
      setNotice("Template structure draft saved.");
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Template structure could not be saved.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function goNext() {
    const index = steps.findIndex((step) => step.code === activeStep);
    setActiveStep(steps[Math.min(steps.length - 1, index + 1)].code);
  }

  async function publishCurrentVersion() {
    if (!selectedVersion?.version_code) {
      setError("Select a template version before publishing.");
      return;
    }
    setIsPublishing(true);
    setError("");
    try {
      const saved = await saveStructureDraft();
      if (!saved) return;
      await publishTemplateVersion(selectedVersion.version_code, {
        unit_code: getSelectedUnitCode(),
        publish_notes: "Published from Template Studio after structure preview review.",
      });
      setNotice("Template version published successfully.");
      if (selectedTemplate?.template_code) {
        await loadVersions(selectedTemplate.template_code);
      }
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : "";
      if (message.includes("approved data contract") || message.includes("API request failed: 400")) {
        setError("Publish blocked. Complete Recipients mapping first: every editable measure needs one active primary data provider.");
      } else {
        setError(message || "Template version could not be published.");
      }
    } finally {
      setIsPublishing(false);
    }
  }

  function handlePrimaryAction() {
    if (activeStep === "publish") {
      void publishCurrentVersion();
      return;
    }
    goNext();
  }

  function goBack() {
    const index = steps.findIndex((step) => step.code === activeStep);
    setActiveStep(steps[Math.max(0, index - 1)].code);
  }

  return (
    <section className="template-designer-page">
      <div className="template-designer-header">
        <div>
          <div className="breadcrumb-line">Home / Data Definition / Template Studio</div>
          <h2>Template Studio</h2>
        </div>
        <div className="toolbar-actions">
          <button className="secondary-button compact" type="button" onClick={() => navigate("/template/library")}>Library</button>
          <button className="secondary-button compact" type="button" onClick={() => void loadAll()} disabled={isStudioHydrating}><RefreshCw size={13} /> Refresh</button>
          <button className="secondary-button compact" type="button" onClick={() => void saveStructureDraft()} disabled={isSaving || isPublishing || isStudioHydrating}><Save size={13} /> Save</button>
          <button className="primary-button compact" type="button" onClick={handlePrimaryAction} disabled={isSaving || isPublishing || isStudioHydrating}>
            <CheckCircle2 size={13} /> {activeStep === "publish" ? (isPublishing ? "Publishing" : "Publish") : "Done"}
          </button>
        </div>
      </div>

      {notice && <div className="toast-notice success">{notice}</div>}
      {error && <div className="toast-notice error">{error}</div>}

      <div className={`template-designer-shell ${isStudioHydrating ? "is-hydrating" : ""}`}>
        {isStudioHydrating && (
          <div className="template-studio-loader" role="status" aria-live="polite">
            <span className="spinner" />
            <strong>Loading template design</strong>
            <small>Preparing data library, saved structure, preview bindings, formulas, and validation suggestions.</small>
          </div>
        )}
        <aside className="template-data-library">
          <div className="template-mini-selectors">
            <div className="template-readonly-selector">
              <span>Template</span>
              <strong title={templateName(selectedTemplate)}>{templateName(selectedTemplate)}</strong>
            </div>
            <label>
              Version
              <select value={selectedVersion?.version_code ?? ""} onChange={(event) => setSelectedVersionCode(event.target.value)}>
                {versions.map((version) => <option key={version.version_code} value={version.version_code}>{version.title ?? version.version_code}</option>)}
              </select>
            </label>
          </div>

          <div className="template-library-title-row">
            <h3>Data Library</h3>
          </div>
          <label className="search-box template-library-search">
            <Search size={14} />
            <input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder={`Search ${activeLibraryTab}`} />
          </label>
          <div className="template-library-tabs">
            <button className={activeLibraryTab === "dimensions" ? "active" : ""} type="button" onClick={() => changeLibraryTab("dimensions")}>Dimensions</button>
            <button className={activeLibraryTab === "geography" ? "active" : ""} type="button" onClick={() => changeLibraryTab("geography")}>Geography</button>
            <button className={activeLibraryTab === "time" ? "active" : ""} type="button" onClick={() => changeLibraryTab("time")}>Time Period</button>
            <button className={activeLibraryTab === "measures" ? "active" : ""} type="button" onClick={() => changeLibraryTab("measures")}>Measures</button>
          </div>
          {activeLibraryTab === "time" && (
            <div className="template-time-set-action">
              <button className="secondary-button compact" type="button" onClick={() => setTimeSetDrawerOpen(true)}>
                <Plus size={12} /> New Set
              </button>
            </div>
          )}
          <div key={activeLibraryTab} className="template-library-list">
            {isLoading ? (
              <div className="template-library-empty">Loading library...</div>
            ) : libraryItems.length === 0 ? (
              <div className="template-library-empty">No matching records.</div>
            ) : (
              libraryItems.map((item) => (
                <div
                  key={item.id}
                  className="template-library-item"
                  draggable
                  onDragStart={(event) => onDragStart(event, item)}
                  title={`${item.label} | ${item.code}`}
                >
                  <GripVertical size={13} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.subLabel}</small>
                    <code>{item.code}</code>
                  </span>
                  <em>{item.badge}</em>
                </div>
              ))
            )}
          </div>
          <p className="template-library-footnote">Dimensions create structure. Geography, time-period sets, and measures define collection layout.</p>
        </aside>

        <main className="template-builder-workspace">
          <nav className="template-builder-steps">
            {steps.map((step) => (
              <button key={step.code} type="button" className={activeStep === step.code ? "active" : ""} onClick={() => setActiveStep(step.code)}>
                {step.label}{step.optional ? " (optional)" : ""}
              </button>
            ))}
          </nav>

          {activeStep === "structure" ? (
            <>
              <section className="template-structure-card">
                <div className="template-structure-header">
                  <div>
                    <span>Table Structure</span>
                    <small>Drag from the data library into the zones below.</small>
                  </div>
                  <div className="template-preview-settings" aria-label="Preview settings">
                    <label><input type="checkbox" checked={previewSettings.showCodes} onChange={(event) => setPreviewSettings((current) => ({ ...current, showCodes: event.target.checked }))} /> Codes</label>
                    <label><input type="checkbox" checked={previewSettings.zebraRows} onChange={(event) => setPreviewSettings((current) => ({ ...current, zebraRows: event.target.checked }))} /> Zebra</label>
                    <label><input type="checkbox" checked={previewSettings.compactCells} onChange={(event) => setPreviewSettings((current) => ({ ...current, compactCells: event.target.checked }))} /> Compact</label>
                    <label><input type="checkbox" checked={previewSettings.editablePreview} onChange={(event) => setPreviewSettings((current) => ({ ...current, editablePreview: event.target.checked }))} /> Editable</label>
                    <button className="template-settings-button" type="button" title="Template preview settings" onClick={() => setSettingsDrawerOpen(true)}>
                      <Settings2 size={12} /> Settings
                    </button>
                  </div>
                </div>
                <div className="template-drop-grid">
                  <DropZoneCard title="Separate Into Tabs By" hint="e.g. Rural/Urban, Gender" zone="tabsBy" items={builder.tabsBy} onDropItem={onDrop} onRemove={removeDroppedItem} />
                  <DropZoneCard title="Each Row Represents" hint="Drop State, District, Time, or any dimension set" zone="rowRepresents" items={builder.rowRepresents} onDropItem={onDrop} onRemove={removeDroppedItem} />
                  <DropZoneCard title="Show Across Columns" hint="Drop reporting sequences or dimensions" zone="columns" items={builder.columns} onDropItem={onDrop} onRemove={removeDroppedItem} />
                  <DropZoneCard title="Fields To Fill" hint="Drop measures/data fields" zone="fields" items={builder.fields} onDropItem={onDrop} onRemove={removeDroppedItem} />
                </div>
              </section>

              <section className="template-preview-card">
                <div className="template-preview-title">
                  <FileSpreadsheet size={15} />
                  <strong>Preview</strong>
                  <span>~{Math.max(1, previewRows.length) * Math.max(1, previewColumns.length)} editable cells</span>
                  <em>Drop directly on row headers, column headers, or cells.</em>
                </div>
                <div className="template-excel-wrap">
                  <table
                    className={`template-excel-table ${previewSettings.compactCells ? "compact" : ""} ${previewSettings.zebraRows ? "zebra" : ""}`}
                    style={{ minWidth: `${previewColumnMinWidth}px` }}
                  >
                    <thead>
                      {previewTabItems.length > 0 && (
                        <tr>
                          <th>Tab</th>
                          {previewColumnGroups.map((group, index) => (
                            <th key={`${group.code}-${index}`} colSpan={columnsPerGroup}>
                              {previewSettings.showCodes ? group.code : group.label}
                            </th>
                          ))}
                        </tr>
                      )}
                      <tr>
                        <th
                          className="preview-drop-target"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => void onCellDrop(event, "rowRepresents")}
                          title="Drop a dimension/geography/time set here to map rows"
                        >
                          <span className="template-preview-header-label">
                            {builder.rowRepresents.map((item) => item.label).join(" / ") || "Drop row dimension"}
                          </span>
                        </th>
                        {previewColumns.map((column, index) => {
                          const columnMeasure = measureForColumn(index);
                          const columnValidationKey = measureColumnKey(column, index);
                          const hasColumnValidation = Boolean(columnValidations[columnValidationKey]);
                          return (
                            <th
                              key={`${column.code}-${index}`}
                              className="preview-drop-target"
                              onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => void onCellDrop(event, "columns", measureColumnKey(column, index))}
                              title="Drop a dimension/geography/time set here to map columns, or drop a measure to bind this data-entry column"
                            >
                              <span className="template-preview-header-label">
                                <span className="template-preview-header-text">{previewSettings.showCodes ? column.code : column.label}</span>
                                {columnMeasure && (
                                  <>
                                    <span className="template-measure-meta" title={measureTitle(columnMeasure)}>
                                      <span className="template-measure-info">
                                        <Info size={11} />
                                      </span>
                                      <span className="template-measure-uom">{columnMeasure.badge || "UOM"}</span>
                                    </span>
                                    <button
                                      className={`template-column-validation-button ${hasColumnValidation ? "configured" : ""}`}
                                      type="button"
                                      title={hasColumnValidation ? "Validation configured for this column" : "Configure validation for this column"}
                                      onClick={(event) => openColumnValidation(event, index, columnMeasure)}
                                    >
                                      <ShieldCheck size={11} />
                                    </button>
                                  </>
                                )}
                              </span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, rowIndex) => (
                        <tr key={`${row.code}-${rowIndex}`}>
                          <td>{previewSettings.showCodes ? row.code : row.label}</td>
                          {previewColumns.map((column, columnIndex) => {
                            const columnMeasure = measureForColumn(columnIndex);
                            const cellKey = `${rowIndex}:${columnIndex}`;
                            const cellMeasure = cellMap[cellKey] ?? columnMeasure;
                            return (
                            <td
                              key={`${row.code}-${column.code}-${columnIndex}`}
                              className="preview-drop-target"
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => void onCellDrop(event, "fields", cellKey)}
                              onClick={() => toggleCellMeasure(cellKey)}
                              title={cellMap[cellKey] ? "Click to unbind this cell-specific measure" : "Drop a measure here to override this cell"}
                            >
                              {column.generatedMeasure ? (
                                <span className="computed-cell-preview" title={column.generatedMeasure.subLabel}>
                                  Auto
                                </span>
                              ) : (
                                <span className={previewSettings.editablePreview && cellMeasure ? "editable-cell-preview" : "empty-cell-preview"} />
                              )}
                            </td>
                          );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <section className="template-work-card template-placeholder-workflow">
              <h3>{steps.find((step) => step.code === activeStep)?.label}</h3>
              <p>{workflowText(activeStep, axes, measures, renderContract)}</p>
            </section>
          )}
        </main>
      </div>

      <div className="sticky-form-footer">
        <button className="ghost-button" type="button" onClick={goBack} disabled={isPublishing || isStudioHydrating}>Back</button>
        <button className="primary-button compact" type="button" onClick={handlePrimaryAction} disabled={isSaving || isPublishing || isStudioHydrating}>
          {activeStep === "publish" ? (isPublishing ? "Publishing" : "Publish") : "Continue"}
        </button>
      </div>

      {validationDrawer && (
        <div className="drawer-backdrop">
          <aside className="side-drawer template-drawer template-form-drawer">
            <div className="drawer-header">
              <span>Column Validation</span>
              <h3>{validationDrawer.measure?.label ?? `Column ${validationDrawer.columnIndex + 1}`}</h3>
              <button type="button" onClick={() => setValidationDrawer(null)}>x</button>
            </div>
            <div className="drawer-info-note">
              Validation should be reusable when the same member set and measure pattern appears in another template, version, or request instance.
            </div>
            <div className="template-validation-context">
              <div>
                <span>Column</span>
                <strong>{validationDrawer.columnLabel}</strong>
              </div>
              <div>
                <span>Measure</span>
                <strong>{validationDrawer.measure?.label ?? "No measure mapped"}</strong>
              </div>
              <div>
                <span>UOM</span>
                <strong>{validationDrawer.measure?.badge ?? "-"}</strong>
              </div>
              <div>
                <span>Scope</span>
                <strong>Template version / instance aware</strong>
              </div>
            </div>
            <section className="template-validation-panel">
              <h4>Available validation strategy</h4>
              <p>
                Existing saved validation is shown as a reusable suggestion only. Apply it when it matches this member set, time-period set, and measure pattern.
              </p>
              {availableValidations[validationDrawer.columnKey] && !columnValidations[validationDrawer.columnKey] && (
                <div className="template-validation-option active">
                  <strong>Reusable validation available</strong>
                  <span>Use the previously saved settings for this column pattern, or create a new validation below.</span>
                  <button className="secondary-button compact" type="button" onClick={applyAvailableValidation}>
                    Apply
                  </button>
                </div>
              )}
              <div className={`template-validation-option ${columnValidations[validationDrawer.columnKey] ? "active" : ""}`}>
                <strong>{columnValidations[validationDrawer.columnKey] ? "Validation applied in this draft" : "Create new validation"}</strong>
                <span>
                  {columnValidations[validationDrawer.columnKey]
                    ? "This column has validation applied for the current draft. You can update it or remove it."
                    : "Create a draft rule for this template/version and later approve it for reuse."}
                </span>
              </div>
            </section>
            <section className="template-validation-panel">
              <h4>Validation settings</h4>
              <div className="template-validation-form">
                <label>
                  Value requirement
                  <select
                    value={validationForm.requirement}
                    onChange={(event) =>
                      setValidationForm((current) => ({
                        ...current,
                        requirement: event.target.value as ColumnValidationConfig["requirement"],
                      }))
                    }
                  >
                    <option value="REQUIRED">Required value</option>
                    <option value="OPTIONAL">Optional value</option>
                  </select>
                </label>
                <label>
                  Numeric behavior
                  <select
                    value={validationForm.numericBehavior}
                    onChange={(event) =>
                      setValidationForm((current) => ({
                        ...current,
                        numericBehavior: event.target.value as ColumnValidationConfig["numericBehavior"],
                        minValue: event.target.value === "NON_NEGATIVE" ? "0" : current.minValue,
                      }))
                    }
                  >
                    <option value="NON_NEGATIVE">Non-negative number</option>
                    <option value="MIN_MAX">Minimum and maximum range</option>
                    <option value="MIN_ONLY">Minimum only</option>
                    <option value="MAX_ONLY">Maximum only</option>
                  </select>
                </label>
                <label>
                  Minimum
                  <input
                    type="number"
                    value={validationForm.minValue}
                    onChange={(event) => setValidationForm((current) => ({ ...current, minValue: event.target.value }))}
                    placeholder="e.g. 0"
                    disabled={validationForm.numericBehavior === "MAX_ONLY"}
                  />
                </label>
                <label>
                  Maximum
                  <input
                    type="number"
                    value={validationForm.maxValue}
                    onChange={(event) => setValidationForm((current) => ({ ...current, maxValue: event.target.value }))}
                    placeholder="Optional maximum"
                    disabled={validationForm.numericBehavior === "MIN_ONLY" || validationForm.numericBehavior === "NON_NEGATIVE"}
                  />
                </label>
                <label className="template-validation-wide">
                  Failure behavior
                  <select
                    value={validationForm.failureBehavior}
                    onChange={(event) =>
                      setValidationForm((current) => ({
                        ...current,
                        failureBehavior: event.target.value as ColumnValidationConfig["failureBehavior"],
                      }))
                    }
                  >
                    <option value="WARNING">Show warning</option>
                    <option value="BLOCK">Block submission</option>
                  </select>
                </label>
              </div>
            </section>
            <div className="drawer-footer">
              <button className="ghost-button" type="button" onClick={() => setValidationDrawer(null)}>Cancel</button>
              {columnValidations[validationDrawer.columnKey] && (
                <button className="danger-button compact" type="button" onClick={removeColumnValidation} disabled={isSaving}>
                  Remove Validation
                </button>
              )}
              <button className="primary-button" type="button" onClick={() => void saveColumnValidation()} disabled={isSaving}>
                {columnValidations[validationDrawer.columnKey] ? "Save Validation" : "Create New"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {settingsDrawerOpen && (
        <div className="drawer-backdrop">
          <aside className="side-drawer template-drawer template-form-drawer">
            <div className="drawer-header">
              <span>Template Settings</span>
              <h3>Computed, calculated, and rollup values</h3>
              <button type="button" onClick={() => setSettingsDrawerOpen(false)}>x</button>
            </div>
            <div className="drawer-info-note">
              Use editable preview columns as inputs. Generated outputs are non-editable and should later be persisted through the approved template formula contract.
            </div>
            <div className="template-settings-tabs">
              {(["compute", "calculated", "rollup"] as SettingsTab[]).map((tab) => (
                <button
                  key={tab}
                  className={settingsTab === tab ? "active" : ""}
                  type="button"
                  onClick={() => setSettingsTab(tab)}
                >
                  {tab === "compute" ? "Compute" : tab === "calculated" ? "Calculated" : "Rollup"}
                </button>
              ))}
            </div>

            {settingsTab === "compute" && (
              <>
                <section className="template-settings-panel">
                  <div className="template-settings-section-title">
                    <div>
                      <h4>Formula Builder</h4>
                      <p>Build a BODMAS-safe expression from editable column tokens, numbers, and operators.</p>
                    </div>
                    <span className="template-settings-badge">Dynamic</span>
                  </div>
                  <div className="template-validation-form">
                    <label>
                      Computed value name
                      <input value={computeName} onChange={(event) => setComputeName(event.target.value)} placeholder="e.g. Poverty Percentage" />
                    </label>
                    <label>
                      Output UOM
                      <input value={calculatedOutputUom} onChange={(event) => setCalculatedOutputUom(event.target.value)} placeholder="e.g. Percent" />
                    </label>
                    <label className="template-validation-wide">
                      Formula
                      <textarea
                        rows={4}
                        value={computeFormula}
                        onChange={(event) => setComputeFormula(event.target.value)}
                        placeholder="Example: ({{Population below poverty line}} / {{Total Population}}) * 100"
                      />
                    </label>
                  </div>
                </section>
                <section className="template-settings-panel">
                  <div className="template-settings-section-title">
                    <div>
                      <h4>Available Editable Columns</h4>
                      <p>Search by column, measure, code, or UOM. Selecting an item inserts it into the formula.</p>
                    </div>
                  </div>
                  <input
                    className="template-settings-search"
                    value={computeColumnSearch}
                    onChange={(event) => setComputeColumnSearch(event.target.value)}
                    placeholder="Find editable column"
                  />
                  <div className="template-column-source-list">
                    {computeSuggestions.length === 0 ? (
                      <div className="template-empty-note">Map measures into preview columns first.</div>
                    ) : (
                      computeSuggestions.map((source) => (
                        <button key={source.key} type="button" onClick={() => insertFormulaToken(source)}>
                          <strong>{source.label}</strong>
                          <span>{source.measureLabel}</span>
                          <small>{source.measureCode} | UOM: {source.uom}</small>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}

            {settingsTab === "calculated" && (
              <>
                <section className="template-settings-panel">
                  <div className="template-settings-section-title">
                    <div>
                      <h4>Calculated Value</h4>
                      <p>Use common statistical functions, then add the result as a non-editable preview column.</p>
                    </div>
                    <div className="template-segmented-control">
                      <button className={calculationMode === "basic" ? "active" : ""} type="button" onClick={() => setCalculationMode("basic")}>Basic</button>
                      <button className={calculationMode === "advanced" ? "active" : ""} type="button" onClick={() => setCalculationMode("advanced")}>Advanced</button>
                    </div>
                  </div>
                  <div className="template-calculation-grid">
                    {["PERCENTAGE", "RATIO", "PERCENT", "SUM", "MIN", "MAX", "AVG", "WEIGHTED_AVG"].map((fn) => (
                      <button
                        key={fn}
                        className={calculatedFunction === fn ? "active" : ""}
                        type="button"
                        onClick={() => setCalculatedFunction(fn)}
                      >
                        {fn.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                  <div className="template-validation-form">
                    <label>
                      Calculated value name
                      <input value={computeName} onChange={(event) => setComputeName(event.target.value)} placeholder="e.g. Poverty ratio" />
                    </label>
                    <label>
                      Output UOM
                      <input value={calculatedOutputUom} onChange={(event) => setCalculatedOutputUom(event.target.value)} placeholder="e.g. Percent" />
                    </label>
                    <label className="template-validation-wide">
                      Formula
                      <textarea
                        rows={4}
                        value={computeFormula}
                        onChange={(event) => setComputeFormula(event.target.value)}
                        placeholder={calculationMode === "basic" ? "Example: numerator / denominator * 100" : "Example: IF({{A}} > 0, ({{B}} / {{A}}) * 100, 0)"}
                      />
                    </label>
                  </div>
                </section>
                <section className="template-settings-panel">
                  <h4>Formula Inputs</h4>
                  <div className="template-column-source-list">
                    {computeSuggestions.map((source) => (
                      <button key={source.key} type="button" onClick={() => insertFormulaToken(source)}>
                        <strong>{source.label}</strong>
                        <span>{source.measureLabel}</span>
                        <small>{source.measureCode} | UOM: {source.uom}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {settingsTab === "rollup" && (
              <section className="template-settings-panel">
                <div className="template-settings-section-title">
                  <div>
                    <h4>Rollup Values</h4>
                    <p>Add governed rollups already configured in Dimension Library. Template Studio does not create rollup expressions here.</p>
                  </div>
                  <span className="template-settings-badge">Aggregate</span>
                </div>
                {availableRollups.length === 0 ? (
                  <div className="template-empty-note">
                    No active dimension rollups are available for the dimensions currently used in this template structure.
                  </div>
                ) : (
                  <div className="template-rollup-list">
                    {availableRollups.map((rollup) => {
                      const key = rollupKey(rollup);
                      return (
                        <button
                          key={key}
                          className={selectedRollupKey === key ? "active" : ""}
                          type="button"
                          onClick={() => setSelectedRollupKey(key)}
                        >
                          <strong>{rollupLabel(rollup)}</strong>
                          <span>{rollup.dimension_code} | {rollup.entry_mode ?? "Rollup"} | {rollup.aggregation_method ?? "Configured"}</span>
                          <small>{(rollup.children ?? []).length} child members</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {computedColumns.length > 0 && (
              <section className="template-settings-panel">
                <h4>Draft Generated Columns</h4>
                <div className="template-computed-list">
                  {computedColumns.map((column) => (
                    <div key={column.code}>
                      <strong>{column.label}</strong>
                      <span>{column.mode.toUpperCase()} | {column.outputUom}</span>
                      <small>{column.formula}</small>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <div className="drawer-footer">
              <button className="ghost-button" type="button" onClick={() => setSettingsDrawerOpen(false)}>Cancel</button>
              <button className="primary-button" type="button" onClick={() => addComputedColumn(settingsTab)}>
                Add {settingsTab === "rollup" ? "Rollup" : settingsTab === "calculated" ? "Calculated" : "Computed"} Column
              </button>
            </div>
          </aside>
        </div>
      )}

      {timeSetDrawerOpen && (
        <div className="drawer-backdrop">
          <aside className="side-drawer template-drawer template-form-drawer">
            <div className="drawer-header">
              <span>Time Period</span>
              <h3>Reporting Sequence Set</h3>
              <button type="button" onClick={() => setTimeSetDrawerOpen(false)}>x</button>
            </div>
            <div className="drawer-info-note">
              Create a new set/version for each new reporting cycle. Do not edit a published or request-used set.
            </div>
            <div className="drawer-form">
              <label>
                Set name *
                <input value={timeSetName} onChange={(event) => setTimeSetName(event.target.value)} placeholder="e.g. Financial Years 2024-25 to 2026-27" />
              </label>
              <label>
                Set type
                <select value={timeSetType} onChange={(event) => setTimeSetType(event.target.value)}>
                  <option value="TEMPLATE_SCOPE">Template Scope</option>
                  <option value="REQUEST_SCOPE">Request Scope</option>
                  <option value="CONTRIBUTOR_SELECT">Contributor Select</option>
                </select>
              </label>
              <div className="template-selected-periods">
                <span>Selected periods ({selectedPeriods.length})</span>
                <div>
                  {selectedPeriods.length === 0 ? (
                    <em>No periods selected.</em>
                  ) : (
                    selectedPeriods.map((period) => (
                      <button
                        key={period.code}
                        type="button"
                        onClick={() => setSelectedPeriods((current) => current.filter((item) => item.code !== period.code))}
                      >
                        {period.name}
                        <X size={12} />
                      </button>
                    ))
                  )}
                </div>
              </div>
              <label>
                Find period
                <input value={periodSearch} onChange={(event) => setPeriodSearch(event.target.value)} placeholder="Search 2024, financial, monthly..." />
              </label>
              <div className="template-period-filter-row">
                <label>
                  Year
                  <select value={periodYearFilter} onChange={(event) => setPeriodYearFilter(event.target.value)}>
                    <option value="ALL">All years</option>
                    {periodYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
                <label>
                  Frequency
                  <select value={periodFrequencyFilter} onChange={(event) => setPeriodFrequencyFilter(event.target.value)}>
                    <option value="ALL">All frequencies</option>
                    {periodFrequencyOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                  </select>
                </label>
              </div>
              <div className="template-period-helper">
                Showing {filteredTimePeriods.length} available periods. Use year/frequency first, then search to narrow the list.
              </div>
              <div className="template-period-picker">
                {filteredTimePeriods.length === 0 ? (
                  <p>No periods match the search.</p>
                ) : (
                  filteredTimePeriods.map((period) => (
                    <button key={period.time_period_code} type="button" onClick={() => addPeriod(period)}>
                      <strong>{period.name ?? period.time_period_code}</strong>
                      <small>{period.time_period_code} | {period.frequency_name ?? period.frequency_code}</small>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="drawer-footer">
              <button className="ghost-button" type="button" onClick={() => setTimeSetDrawerOpen(false)}>Cancel</button>
              <button className="primary-button" type="button" disabled={isSaving || !timeSetName.trim() || selectedPeriods.length === 0} onClick={() => void saveTimePeriodSet()}>
                Save Set
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function DropZoneCard({
  title,
  hint,
  zone,
  items,
  onDropItem,
  onRemove,
}: {
  title: string;
  hint: string;
  zone: DropZone;
  items: LibraryItem[];
  onDropItem: (event: DragEvent, zone: DropZone) => Promise<void>;
  onRemove: (zone: DropZone, id: string) => void;
}) {
  return (
    <div
      className={`template-drop-zone ${items.length ? "has-items" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => void onDropItem(event, zone)}
    >
      <span>{title}</span>
      {items.length === 0 ? (
        <em>{hint}</em>
      ) : (
        <div className="template-drop-chip-list">
          {items.map((item) => (
            <button key={item.id} type="button" onClick={() => onRemove(zone, item.id)} title="Remove from structure">
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function workflowText(
  step: StudioStep,
  axes: TemplateAxis[],
  measures: TemplateMeasure[],
  renderContract: TemplateRenderContract | null,
) {
  if (step === "setup") return "Select template/version and confirm identity before designing the structure.";
  if (step === "recipients") return "Recipients will be derived from measure source mappings, officers, periodicity, and required grain.";
  if (step === "preview") return `Current contract preview: ${axes.length} axes, ${measures.length} measures, ${renderContract?.cells?.length ?? 0} cells.`;
  if (step === "publish") return "Publish only after structure, recipients, and preview are correct.";
  return "";
}
