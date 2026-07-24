import { CheckCircle2, FileSpreadsheet, GripVertical, Info, Plus, RefreshCw, Save, Search, Settings2, ShieldCheck, X } from "lucide-react";
import { DragEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listDimensionManagementRows,
  listDimensionMembers,
  listDimensionMemberSetMembers,
  listDimensionMemberSets,
  listGeographies,
  listAllTimePeriods,
  listTimePeriodSetPeriods,
  listTimePeriodSets,
  createTimePeriodSet,
  listDimensionRollupRules,
  type DimensionManagementRow,
  type DimensionMember,
  type DimensionMemberSet,
  type DimensionMemberSetItem,
  type DimensionRollupRule,
  type Geography,
  type TimePeriod,
} from "../../api/dimensions.api";
import { getDataFieldDetail, listDataFields, type DataFieldDetail, type DataFieldListItem, type DataFieldMapping } from "../../api/data-fields.api";
import { listMasterRecords, type MasterRecord } from "../../api/masters-reference.api";
import {
  createTemplateMeasure,
  createTemplateAxis,
  deactivateTemplateMeasure,
  getTemplateRenderContract,
  getTemplateVersion,
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
  upsertTemplateMeasureAccessPolicy,
  type TemplateAxis,
  type TemplateDefinition,
  type TemplateMeasure,
  type TemplateRenderContract,
  type TemplateStudioDraft,
  type TemplateVersion,
} from "../../api/templates.api";
import { upsertValidationRule, upsertValidationRuleBinding } from "../../api/validation.api";
import { getSelectedLocale, getSelectedUnitCode, LOCALE_CHANGED_EVENT, UNIT_CHANGED_EVENT } from "../../api/session.api";

type StudioStep = "setup" | "structure" | "recipients" | "preview" | "publish";
type DropZone = "tabsBy" | "rowRepresents" | "columns" | "fields";
type LibraryTab = "dimensions" | "geography" | "time" | "measures";
type LibraryMode = "sets" | "members";
type LibraryItemType = "DIMENSION_SET" | "DIMENSION_MEMBER" | "GEOGRAPHY_SET" | "GEOGRAPHY_MEMBER" | "TIME_SET" | "TIME_MEMBER" | "MEASURE";

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
type ColumnLevel = {
  id: string;
  label: string;
  items: LibraryItem[];
};
type RowLevel = {
  id: string;
  label: string;
  items: LibraryItem[];
};
type PeriodSelection = { code: string; name: string };
type PreviewLabel = { code: string; label: string };
type PreviewRow = PreviewLabel & {
  path?: PreviewLabel[];
  generatedRollup?: ComputedColumnDraft;
};
type PreviewColumn = PreviewLabel & {
  groupCode?: string;
  groupLabel?: string;
  generatedMeasure?: LibraryItem;
  path?: PreviewLabel[];
};
type PreviewHeaderCell = PreviewLabel & { colSpan: number };
type ColumnValidationConfig = {
  requirement: "REQUIRED" | "OPTIONAL";
  numericBehavior: "NON_NEGATIVE" | "MIN_MAX" | "MIN_ONLY" | "MAX_ONLY";
  minValue: string;
  maxValue: string;
  failureBehavior: "WARNING" | "BLOCK";
};
type SettingsTab = "compute" | "calculated" | "individual" | "rollup";
type CalculationMode = "basic" | "advanced";
type ComputedColumnDraft = {
  code: string;
  label: string;
  formula: string;
  outputUom: string;
  mode: SettingsTab;
  functionCode?: string;
  showInDataEntry?: boolean;
  showInPreview?: boolean;
  showInPublishedOutput?: boolean;
  repeatForAllGroups?: boolean;
  targetGroupKey?: string;
  targetGroupLabel?: string;
  targetPath?: PreviewLabel[];
  rollupDimensionCode?: string;
  rollupParentMemberCode?: string;
  rollupAggregationMethod?: string;
};
type BilingualLabelScope = "geography" | "dimensions" | "measures";
type RecipientReadiness = "READY" | "MISSING_SOURCE" | "MISSING_PERIODICITY" | "MISSING_GRAIN" | "MISSING_OFFICER";
const ALL_GENERATED_GROUPS_KEY = "__ALL_COLUMN_GROUPS__";
type RecipientSourceGroup = {
  key: string;
  sourceCode: string;
  sourceName: string;
  departmentName: string;
  measureCodes: string[];
  measureLabels: string[];
  assignedColumnLabels: string[];
  dataEntryColumnLabels: string[];
  generatedColumnLabels: string[];
  periodicities: string[];
  grains: string[];
  officers: string[];
  readiness: RecipientReadiness;
};
type PublishCheckStatus = "PASS" | "WARN" | "BLOCK";
type PublishCheck = {
  label: string;
  status: PublishCheckStatus;
  detail: string;
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

function compactList(values: Array<string | null | undefined>, fallback = "-") {
  const unique = Array.from(
    new Set(
      values
        .map((value) => textValue(value).trim())
        .filter((value) => value && value !== "-"),
    ),
  );
  return unique.length ? unique : [fallback];
}

function mappingText(mapping: DataFieldMapping, keys: string[], fallback = "-") {
  for (const key of keys) {
    const value = mapping[key];
    const text = textValue(value).trim();
    if (text && text !== "-") return text;
  }
  return fallback;
}

function activeMappings(mappings?: DataFieldMapping[] | null) {
  return (mappings ?? []).filter((mapping) => mapping.is_active !== false);
}

function mappingString(mapping: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = mapping[key];
    const text = textValue(value).trim();
    if (text && text !== "-") return text;
  }
  return "";
}

function officerLabel(record: Record<string, unknown>) {
  const recipientType = mappingString(record, ["recipient_type", "recipient_role", "delivery_type", "officer_role"]);
  const name = mappingString(record, ["officer_display_name", "display_name", "officer_name", "name"]);
  const email = mappingString(record, ["officer_email", "email", "email_address", "recipient_email", "to_email", "cc_email", "bcc_email"]);
  return [recipientType, name || email].filter(Boolean).join(": ") || "Officer mapping pending";
}

function sourceCodeFromMapping(mapping: DataFieldMapping, fallback = "") {
  return mappingText(mapping, ["source_organization_code", "organization_code"], fallback);
}

function recordCode(record: Record<string, unknown>, key: string) {
  return String(record[key] ?? "").trim();
}

function recordName(record?: Record<string, unknown>) {
  if (!record) return "";
  return mappingString(record, ["name", "organization_name", "display_name", "short_name", "organization_code"]);
}

function templateName(template?: TemplateDefinition | null) {
  return template?.name ?? template?.template_name ?? template?.template_code ?? "-";
}

function normalizeCode(value?: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

function samePublicCode(left?: string | null, right?: string | null) {
  return normalizeCode(left) === normalizeCode(right);
}

function urlVersionFallback(templateCode: string, versionCode: string): TemplateVersion {
  return {
    template_code: templateCode,
    version_code: versionCode,
    title: versionCode,
    version_number: null,
    render_contract_version: "v1",
    status: "DRAFT",
    is_current: false,
  };
}

function isCodeLike(value: string, code?: string | null) {
  const normalizedValue = normalizeCode(value);
  const normalizedCode = normalizeCode(code ?? "");
  return Boolean(normalizedValue && normalizedCode && normalizedValue === normalizedCode);
}

function firstDisplayName(candidates: Array<string | null | undefined>, code?: string | null) {
  for (const candidate of candidates) {
    const value = textValue(candidate);
    if (!value || value === "-" || isCodeLike(value, code)) continue;
    return value;
  }
  return "-";
}

function itemName(item: DimensionMemberSetItem) {
  const row = item as DimensionMemberSetItem & {
    display_label?: string | null;
    localized_label?: string | null;
    label?: string | null;
  };
  return firstDisplayName(
    [
      row.localized_name,
      row.localized_label,
      row.display_name,
      row.display_label,
      row.name,
      row.alias_value,
      row.member_name,
      row.short_name,
    ],
    item.member_code,
  );
}

function previewItemLabel(item: DimensionMemberSetItem): PreviewLabel {
  const code = textValue(item.member_code);
  return {
    code,
    label: itemName(item) !== "-" ? itemName(item) : code,
  };
}

function measureName(item: DataFieldListItem | TemplateMeasure) {
  const field = item as DataFieldListItem;
  const measure = item as TemplateMeasure;
  const code = field.measure_code ?? measure.measure_code ?? field.data_field_code;
  const name = firstDisplayName(
    [
      field.localized_name,
      field.display_name,
      field.label,
      field.data_field_name,
      field.measure_name,
      field.name,
      measure.label,
    ],
    code,
  );
  return name !== "-" ? name : textValue(code);
}

function isGeneralDimension(row: DimensionManagementRow) {
  const code = normalizeCode(row.dimension_code);
  const type = normalizeCode(row.dimension_type);
  return code && !["GEOGRAPHY", "LOCATION", "TIME_PERIOD"].includes(code) && ["GENERAL", "GENERIC", "CUSTOM", ""].includes(type);
}

function isMemberItem(item: LibraryItem) {
  return item.type === "DIMENSION_MEMBER" || item.type === "GEOGRAPHY_MEMBER" || item.type === "TIME_MEMBER";
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

function makeColumnLevel(index: number, items: LibraryItem[] = []): ColumnLevel {
  return {
    id: `column-level-${index + 1}`,
    label: `Level ${index + 1}`,
    items,
  };
}

function makeRowLevel(index: number, items: LibraryItem[] = []): RowLevel {
  return {
    id: `row-level-${index + 1}`,
    label: `Level ${index + 1}`,
    items,
  };
}

function reindexColumnLevels(levels: ColumnLevel[]): ColumnLevel[] {
  const next = levels.length ? levels : [makeColumnLevel(0)];
  return next.map((level, index) => ({
    id: `column-level-${index + 1}`,
    label: `Level ${index + 1}`,
    items: level.items,
  }));
}

function reindexRowLevels(levels: RowLevel[]): RowLevel[] {
  const next = levels.length ? levels : [makeRowLevel(0)];
  return next.map((level, index) => ({
    id: `row-level-${index + 1}`,
    label: `Level ${index + 1}`,
    items: level.items,
  }));
}

function safeColumnLevels(value: unknown, fallbackColumns: LibraryItem[] = []): ColumnLevel[] {
  if (Array.isArray(value)) {
    const levels = value
      .map((level, index) => {
        const raw = level as { id?: string; label?: string; items?: unknown };
        const items = Array.isArray(raw.items)
          ? raw.items.map(normalizeLibraryItem).filter((item): item is LibraryItem => Boolean(item))
          : [];
        return {
          id: raw.id || `column-level-${index + 1}`,
          label: raw.label || `Level ${index + 1}`,
          items,
        };
      })
      .filter((level) => level.items.length > 0 || level.id === "column-level-1");
    if (levels.length > 0) return reindexColumnLevels(levels);
  }
  return reindexColumnLevels([makeColumnLevel(0, fallbackColumns)]);
}

function safeRowLevels(value: unknown, fallbackRows: LibraryItem[] = []): RowLevel[] {
  if (Array.isArray(value)) {
    const levels = value
      .map((level, index) => {
        const raw = level as { id?: string; label?: string; items?: unknown };
        const items = Array.isArray(raw.items)
          ? raw.items.map(normalizeLibraryItem).filter((item): item is LibraryItem => Boolean(item))
          : [];
        return {
          id: raw.id || `row-level-${index + 1}`,
          label: raw.label || `Level ${index + 1}`,
          items,
        };
      })
      .filter((level) => level.items.length > 0 || level.id === "row-level-1");
    if (levels.length > 0) return reindexRowLevels(levels);
  }
  return reindexRowLevels([makeRowLevel(0, fallbackRows)]);
}

function hasColumnLevelContent(levels: ColumnLevel[]) {
  return levels.some((level) => level.items.length > 0);
}

function hasRowLevelContent(levels: RowLevel[]) {
  return levels.some((level) => level.items.length > 0);
}

function isTimeLibraryItem(item: LibraryItem) {
  return item.type === "TIME_SET" || item.type === "TIME_MEMBER";
}

function levelWithItems<T extends { id: string; label: string; items: LibraryItem[] }>(level: T, items: LibraryItem[]): T {
  return { ...level, items };
}

function cartesianPreviewColumns(levelRows: PreviewLabel[][]): PreviewColumn[] {
  if (!levelRows.length) return [];
  return levelRows.reduce<PreviewColumn[]>((current, rows) => {
    if (!current.length) return rows.map((row) => ({ ...row, path: [row] }));
    return current.flatMap((parent) =>
      rows.map((row) => ({
        code: `${parent.code}:${row.code}`,
        label: row.label,
        groupCode: parent.code,
        groupLabel: parent.label,
        path: [...(parent.path ?? [{ code: parent.code, label: parent.label }]), row],
      })),
    );
  }, []);
}

function cartesianPreviewRows(levelRows: PreviewLabel[][]): PreviewRow[] {
  if (!levelRows.length) return [];
  return levelRows.reduce<PreviewRow[]>((current, rows) => {
    if (!current.length) return rows.map((row) => ({ ...row, path: [row] }));
    return current.flatMap((parent) =>
      rows.map((row) => ({
        code: `${parent.code}:${row.code}`,
        label: row.label,
        path: [...(parent.path ?? [{ code: parent.code, label: parent.label }]), row],
      })),
    );
  }, []);
}

function previewPathKey(path: PreviewLabel[] | undefined) {
  return (path ?? []).map((part) => normalizeCode(part.code || part.label)).filter(Boolean).join(">");
}

function previewPathLabel(path: PreviewLabel[] | undefined) {
  return (path ?? []).map((part) => part.label || part.code).filter(Boolean).join(" / ");
}

function isPathPrefix(targetPath: PreviewLabel[] | undefined, columnPath: PreviewLabel[] | undefined) {
  const target = targetPath ?? [];
  const path = columnPath ?? [];
  if (!target.length) return false;
  if (target.length > path.length) return false;
  return target.every((part, index) => normalizeCode(part.code || part.label) === normalizeCode(path[index]?.code || path[index]?.label));
}

function groupedHeaderRows(columns: PreviewColumn[], levelCount: number): PreviewHeaderCell[][] {
  if (!levelCount) return [];
  return Array.from({ length: levelCount }, (_, levelIndex) => {
    const cells: (PreviewHeaderCell & { groupKey: string })[] = [];
    columns.forEach((column) => {
      const part = column.path?.[levelIndex] ?? { code: column.code, label: column.label };
      const previous = cells[cells.length - 1];
      const groupKey = (column.path ?? [{ code: column.code, label: column.label }])
        .slice(0, levelIndex + 1)
        .map((pathPart) => `${pathPart.code}:${pathPart.label}`)
        .join(">");
      if (previous && previous.groupKey === groupKey) {
        previous.colSpan += 1;
      } else {
        cells.push({ ...part, colSpan: 1, groupKey });
      }
    });
    return cells.map(({ groupKey: _groupKey, ...cell }) => cell);
  });
}

function inferPublicationPeriodicity(columns: PreviewColumn[]) {
  const years = Array.from(
    new Set(
      columns
        .flatMap((column) => column.path ?? [])
        .map((part) => textValue(part.label))
        .filter((label) => /^\d{4}$/.test(label)),
    ),
  )
    .map(Number)
    .sort((left, right) => left - right);
  if (years.length >= 2) {
    const gap = years[1] - years[0];
    if (gap === 1) return "Annual";
    if (gap > 1) return `Every ${gap} years`;
  }
  if (years.length === 1) return "Annual";
  return "";
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
    .filter((item) => item && item.code && item.label && item.formula && ["compute", "calculated", "individual", "rollup"].includes(item.mode))
    .map((item) => {
      const repeatForAllGroups = Boolean(item.repeatForAllGroups) || item.targetGroupKey === ALL_GENERATED_GROUPS_KEY;
      const targetPath = repeatForAllGroups ? undefined : Array.isArray(item.targetPath) ? item.targetPath : undefined;
      return {
        ...item,
        targetPath,
        repeatForAllGroups,
        targetGroupKey: repeatForAllGroups ? ALL_GENERATED_GROUPS_KEY : item.targetGroupKey || previewPathKey(targetPath),
        targetGroupLabel: repeatForAllGroups ? "All groups" : item.targetGroupLabel || previewPathLabel(targetPath),
        showInDataEntry: Boolean(item.showInDataEntry),
        showInPreview: item.showInPreview !== false,
        showInPublishedOutput: Boolean(item.showInPublishedOutput),
      };
    });
}

function safeBooleanMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, boolean>>((next, [key, flag]) => {
    next[key] = flag === true;
    return next;
  }, {});
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
  const bilingualLabels = settings?.bilingualLabels as Partial<typeof defaultPreviewSettings.bilingualLabels> | undefined;
  return {
    showCodes: Boolean(settings?.showCodes),
    zebraRows: settings?.zebraRows !== false,
    compactCells: settings?.compactCells !== false,
    editablePreview: settings?.editablePreview !== false,
    showAllRecipientColumns: Boolean(settings?.showAllRecipientColumns),
    bilingualLabels: {
      locale: typeof bilingualLabels?.locale === "string" ? bilingualLabels.locale : "hi-IN",
      geography: Boolean(bilingualLabels?.geography),
      dimensions: Boolean(bilingualLabels?.dimensions),
      measures: Boolean(bilingualLabels?.measures),
    },
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
  levels: ColumnLevel[] = [],
  rowLevels: RowLevel[] = [],
) {
  return (
    hasBuilderContent(state) ||
    hasColumnLevelContent(levels) ||
    hasRowLevelContent(rowLevels) ||
    Object.keys(mappedCells).length > 0 ||
    Object.keys(validations).length > 0 ||
    generatedColumns.length > 0
  );
}

const defaultPreviewSettings = {
  showCodes: false,
  zebraRows: true,
  compactCells: true,
  editablePreview: true,
  showAllRecipientColumns: false,
  bilingualLabels: {
    locale: "hi-IN",
    geography: false,
    dimensions: false,
    measures: false,
  },
};

type TemplateDataLibraryCache = {
  dimensionSets: LibraryItem[];
  dimensionMembers: LibraryItem[];
  geographySets: LibraryItem[];
  geographyMembers: LibraryItem[];
  timeSets: LibraryItem[];
  timeMembers: LibraryItem[];
  dataFields: LibraryItem[];
  allTimePeriods: TimePeriod[];
};

const templateDataLibraryCache = new Map<string, TemplateDataLibraryCache>();

function dataLibraryCacheKey() {
  return `${getSelectedUnitCode()}|${getSelectedLocale()}`;
}

export function TemplateStudioPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState<StudioStep>("structure");
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTab>("dimensions");
  const [libraryModes, setLibraryModes] = useState<Record<Exclude<LibraryTab, "measures">, LibraryMode>>({
    dimensions: "sets",
    geography: "sets",
    time: "sets",
  });
  const [librarySearch, setLibrarySearch] = useState("");
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [axes, setAxes] = useState<TemplateAxis[]>([]);
  const [measures, setMeasures] = useState<TemplateMeasure[]>([]);
  const [renderContract, setRenderContract] = useState<TemplateRenderContract | null>(null);
  const [dimensionSets, setDimensionSets] = useState<LibraryItem[]>([]);
  const [dimensionMembers, setDimensionMembers] = useState<LibraryItem[]>([]);
  const [geographySets, setGeographySets] = useState<LibraryItem[]>([]);
  const [geographyMembers, setGeographyMembers] = useState<LibraryItem[]>([]);
  const [timeSets, setTimeSets] = useState<LibraryItem[]>([]);
  const [timeMembers, setTimeMembers] = useState<LibraryItem[]>([]);
  const [dataFields, setDataFields] = useState<LibraryItem[]>([]);
  const [dataFieldDetails, setDataFieldDetails] = useState<Record<string, DataFieldDetail>>({});
  const [sourceOfficersByOrg, setSourceOfficersByOrg] = useState<Record<string, MasterRecord[]>>({});
  const [organizationRecords, setOrganizationRecords] = useState<MasterRecord[]>([]);
  const [selectedRecipientSource, setSelectedRecipientSource] = useState("ALL");
  const [allTimePeriods, setAllTimePeriods] = useState<TimePeriod[]>([]);
  const [memberCache, setMemberCache] = useState<Record<string, DimensionMemberSetItem[]>>({});
  const [secondaryMemberLabelCache, setSecondaryMemberLabelCache] = useState<Record<string, Record<string, string>>>({});
  const [secondaryMeasureLabelCache, setSecondaryMeasureLabelCache] = useState<Record<string, string>>({});
  const [isSecondaryLabelLoading, setIsSecondaryLabelLoading] = useState(false);
  const [builder, setBuilder] = useState<BuilderState>(emptyBuilder);
  const [rowLevels, setRowLevels] = useState<RowLevel[]>(() => [makeRowLevel(0)]);
  const [activeRowLevelId, setActiveRowLevelId] = useState("row-level-1");
  const [rowLevelItemsOpen, setRowLevelItemsOpen] = useState(false);
  const [columnLevels, setColumnLevels] = useState<ColumnLevel[]>(() => [makeColumnLevel(0)]);
  const [activeColumnLevelId, setActiveColumnLevelId] = useState("column-level-1");
  const [columnLevelItemsOpen, setColumnLevelItemsOpen] = useState(false);
  const [cellMap, setCellMap] = useState<Record<string, LibraryItem>>({});
  const [timeSetDrawerOpen, setTimeSetDrawerOpen] = useState(false);
  const [validationDrawer, setValidationDrawer] = useState<{
    columnIndex: number;
    columnKey: string;
    columnLabel: string;
    measure: LibraryItem | null;
  } | null>(null);
  const [columnValidations, setColumnValidations] = useState<Record<string, ColumnValidationConfig>>({});
  const [publicationColumns, setPublicationColumns] = useState<Record<string, boolean>>({});
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
  const [selectedGeneratedTargetKey, setSelectedGeneratedTargetKey] = useState("");
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
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [isRecipientLoading, setIsRecipientLoading] = useState(false);
  const [isVersionListLoading, setIsVersionListLoading] = useState(false);
  const [isVersionLoading, setIsVersionLoading] = useState(false);
  const [isPreviewHydrating, setIsPreviewHydrating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const versionHydratedRef = useRef(false);
  const autosaveTimerRef = useRef<number | undefined>(undefined);

  const selectedTemplate = useMemo(() => {
    if (selectedTemplateCode) {
      return templates.find((template) => samePublicCode(template.template_code, selectedTemplateCode)) ?? null;
    }
    return templates[0] ?? null;
  }, [selectedTemplateCode, templates]);

  const selectedVersion = useMemo(() => {
    if (selectedVersionCode) {
      return versions.find((version) => samePublicCode(version.version_code, selectedVersionCode)) ?? null;
    }
    return versions.find((version) => version.is_current) ?? versions[0] ?? null;
  }, [selectedVersionCode, versions]);
  const isSelectedVersionFrozen = ["ACTIVE", "PUBLISHED"].includes(normalizeCode(selectedVersion?.status));
  const isStudioHydrating = isVersionListLoading || isVersionLoading || Boolean(selectedVersion?.version_code && !versionHydratedRef.current);
  const isShellLoading = isLoading && templates.length === 0;

  const libraryItems = useMemo(() => {
    const activeMode = activeLibraryTab === "measures" ? "sets" : libraryModes[activeLibraryTab];
    const byTab: Record<LibraryTab, LibraryItem[]> = {
      dimensions: activeMode === "members" ? dimensionMembers : dimensionSets,
      geography: activeMode === "members" ? geographyMembers : geographySets,
      time: activeMode === "members" ? timeMembers : timeSets,
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
  }, [
    activeLibraryTab,
    dataFields,
    dimensionMembers,
    dimensionSets,
    geographyMembers,
    geographySets,
    libraryModes,
    librarySearch,
    timeMembers,
    timeSets,
  ]);

  function bilingualScopeForItem(item: LibraryItem): BilingualLabelScope | null {
    if (item.type === "GEOGRAPHY_SET" || item.type === "GEOGRAPHY_MEMBER") return "geography";
    if (item.type === "DIMENSION_SET" || item.type === "DIMENSION_MEMBER") return "dimensions";
    if (item.type === "MEASURE") return "measures";
    return null;
  }

  function isBilingualEnabled(item: LibraryItem) {
    const scope = bilingualScopeForItem(item);
    return scope ? Boolean(previewSettings.bilingualLabels[scope]) : false;
  }

  function bilingualText(primary: string, secondary?: string | null) {
    const cleanPrimary = textValue(primary);
    const cleanSecondary = textValue(secondary);
    if (!cleanSecondary || cleanSecondary === "-" || cleanSecondary === cleanPrimary) return cleanPrimary;
    return `${cleanSecondary} / ${cleanPrimary}`;
  }

  function libraryItemLabel(item: LibraryItem) {
    if (!isBilingualEnabled(item)) return item.label;
    if (item.type === "MEASURE") return bilingualText(item.label, secondaryMeasureLabelCache[item.code]);
    return bilingualText(item.label, secondaryMemberLabelCache[item.id]?.[item.code]);
  }

  function previewLabelsForItem(item: LibraryItem): PreviewLabel[] {
    if (isMemberItem(item)) {
      const label = isBilingualEnabled(item) ? bilingualText(item.label, secondaryMemberLabelCache[item.id]?.[item.code]) : item.label;
      return [{ code: item.code, label }];
    }
    const rows = maxPreviewItems(memberCache[item.id], item.label);
    if (!isBilingualEnabled(item)) return rows;
    const secondaryLabels = secondaryMemberLabelCache[item.id] ?? {};
    return rows.map((row) => ({
      ...row,
      label: bilingualText(row.label, secondaryLabels[row.code]),
    }));
  }

  const activeRowLevels = useMemo(() => {
    const levelsWithItems = rowLevels.filter((level) => level.items.length > 0);
    if (levelsWithItems.length) return levelsWithItems;
    return builder.rowRepresents.length ? [makeRowLevel(0, builder.rowRepresents)] : [];
  }, [builder.rowRepresents, rowLevels]);

  const rowTimeItemsForColumnPreview = useMemo(
    () =>
      activeRowLevels
        .flatMap((level) => level.items)
        .filter(isTimeLibraryItem),
    [activeRowLevels],
  );

  const previewRowLevels = useMemo(() => {
    const levels = activeRowLevels
      .map((level) => levelWithItems(level, level.items.filter((item) => !isTimeLibraryItem(item))))
      .filter((level) => level.items.length > 0);
    return levels.length ? levels : activeRowLevels;
  }, [activeRowLevels]);

  const previewRowLevelRows = useMemo(() => {
    return previewRowLevels
      .map((level) =>
        level.items.flatMap((item) => {
          if (item.type === "MEASURE") return [];
          return previewLabelsForItem(item);
        }),
      )
      .filter((rows) => rows.length > 0);
  }, [previewRowLevels, memberCache, previewSettings.bilingualLabels, secondaryMemberLabelCache]);

  const previewRows = useMemo<PreviewRow[]>(() => {
    const baseRows = previewRowLevelRows.length
      ? cartesianPreviewRows(previewRowLevelRows)
      : ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5"].map((label) => ({ code: label, label, path: [{ code: label, label }] }));
    const rollupRows = computedColumns
      .filter((column) => column.mode === "rollup" && column.showInPreview !== false)
      .map((column) => ({
        code: column.rollupParentMemberCode || column.code,
        label: column.label,
        path: [{ code: column.rollupParentMemberCode || column.code, label: column.label }],
        generatedRollup: column,
      }));
    return [...baseRows, ...rollupRows];
  }, [computedColumns, previewRowLevelRows]);

  const activeColumnLevels = useMemo(() => {
    const levelsWithItems = columnLevels.filter((level) => level.items.length > 0);
    if (levelsWithItems.length) return levelsWithItems;
    return builder.columns.length ? [makeColumnLevel(0, builder.columns)] : [];
  }, [builder.columns, columnLevels]);

  const previewColumnLevels = useMemo(() => {
    const hasTimeColumn = activeColumnLevels.some((level) => level.items.some(isTimeLibraryItem));
    if (hasTimeColumn || !rowTimeItemsForColumnPreview.length) return activeColumnLevels;
    return [
      { id: "column-level-time-preview", label: "Time Period", items: rowTimeItemsForColumnPreview },
      ...activeColumnLevels,
    ];
  }, [activeColumnLevels, rowTimeItemsForColumnPreview]);

  const previewColumnLevelRows = useMemo(() => {
    return previewColumnLevels
      .map((level) =>
        level.items.flatMap((item) => {
          if (item.type === "MEASURE") return [{ code: item.code, label: libraryItemLabel(item) }];
          return previewLabelsForItem(item);
        }),
      )
      .filter((rows) => rows.length > 0);
  }, [previewColumnLevels, memberCache, previewSettings.bilingualLabels, secondaryMemberLabelCache, secondaryMeasureLabelCache]);

  const previewColumnGroups = useMemo<PreviewColumn[]>(() => {
    if (previewColumnLevelRows.length) return cartesianPreviewColumns(previewColumnLevelRows);
    const sourceFields = builder.fields.filter((field) => !field.generatedMode);
    if (sourceFields.length) {
      return sourceFields.map((field) => ({
        code: field.code,
        label: libraryItemLabel(field),
        path: [{ code: field.code, label: libraryItemLabel(field) }],
      }));
    }
    return ["Column", "Column", "Column"].map((label, index) => ({
      code: `${label}_${index + 1}`,
      label,
      path: [{ code: `${label}_${index + 1}`, label }],
    }));
  }, [builder.fields, previewColumnLevelRows, previewSettings.bilingualLabels, secondaryMeasureLabelCache]);

  const previewTabItems = useMemo(() => {
    if (!builder.tabsBy.length) return [];
    return builder.tabsBy.flatMap((item) => previewLabelsForItem(item));
  }, [builder.tabsBy, memberCache, previewSettings.bilingualLabels, secondaryMemberLabelCache]);

  const basePreviewColumns = useMemo<PreviewColumn[]>(() => {
    return previewColumnGroups.flatMap<PreviewColumn>((group) =>
      previewTabItems.length
        ? previewTabItems.map((tab) => ({
            code: `${group.code}:${tab.code}`,
            label: tab.label,
            groupCode: group.code,
            groupLabel: group.label,
            path: [...(group.path ?? [{ code: group.code, label: group.label }]), tab],
          }))
        : [{ ...group, path: group.path ?? [{ code: group.code, label: group.label }] }],
    );
  }, [previewColumnGroups, previewTabItems]);

  const generatedTargetOptions = useMemo(() => {
    const targets = new Map<string, { key: string; label: string; path: PreviewLabel[] }>();
    basePreviewColumns.forEach((column) => {
      const path = column.path ?? [{ code: column.code, label: column.label }];
      path.forEach((_, index) => {
        const targetPath = path.slice(0, index + 1);
        const key = previewPathKey(targetPath);
        if (key && !targets.has(key)) {
          targets.set(key, { key, label: previewPathLabel(targetPath), path: targetPath });
        }
      });
    });
    const options = Array.from(targets.values());
    return options.length ? [{ key: ALL_GENERATED_GROUPS_KEY, label: "All groups", path: [] }, ...options] : options;
  }, [basePreviewColumns]);

  useEffect(() => {
    if (settingsTab === "rollup") return;
    if (selectedGeneratedTargetKey && generatedTargetOptions.some((target) => target.key === selectedGeneratedTargetKey)) return;
    setSelectedGeneratedTargetKey(generatedTargetOptions[0]?.key ?? "");
  }, [generatedTargetOptions, selectedGeneratedTargetKey, settingsTab]);

  const previewColumns = useMemo<PreviewColumn[]>(() => {
    const visibleGeneratedColumns = computedColumns.filter((column) => column.mode !== "rollup" && column.showInPreview !== false);
    if (!visibleGeneratedColumns.length) return basePreviewColumns;
    const repeatingGenerated = visibleGeneratedColumns.filter(
      (column) => Boolean(column.repeatForAllGroups) || column.targetGroupKey === ALL_GENERATED_GROUPS_KEY,
    );
    const generatedByTarget = new Map<string, ComputedColumnDraft[]>();
    const rootGenerated: ComputedColumnDraft[] = [];
    visibleGeneratedColumns.forEach((column) => {
      if (Boolean(column.repeatForAllGroups) || column.targetGroupKey === ALL_GENERATED_GROUPS_KEY) return;
      const targetKey = column.targetGroupKey || previewPathKey(column.targetPath);
      if (!targetKey) {
        rootGenerated.push(column);
        return;
      }
      generatedByTarget.set(targetKey, [...(generatedByTarget.get(targetKey) ?? []), column]);
    });
    const next: PreviewColumn[] = [];
    basePreviewColumns.forEach((column, index) => {
      next.push(column);
      if (repeatingGenerated.length) {
        const currentGroupPath = column.path?.slice(0, 1) ?? [{ code: column.code, label: column.label }];
        const nextColumn = basePreviewColumns[index + 1];
        if (!nextColumn || !isPathPrefix(currentGroupPath, nextColumn.path)) {
          const parent = currentGroupPath[currentGroupPath.length - 1];
          repeatingGenerated.forEach((generated) => {
            const item: LibraryItem = {
              id: `MEASURE:${generated.code}`,
              type: "MEASURE",
              code: generated.code,
              label: generated.label,
              subLabel: `${generated.mode === "individual" ? "Individual" : generated.mode === "compute" ? "Computed" : "Calculated"} | ${generated.formula}`,
              badge: generated.outputUom || "Calculated",
              generatedMode: generated.mode,
            };
            next.push({
              code: `${previewPathKey(currentGroupPath)}:${generated.code}`,
              label: generated.label,
              groupCode: parent?.code,
              groupLabel: parent?.label,
              generatedMeasure: item,
              path: [...currentGroupPath, { code: generated.code, label: generated.label }],
            });
          });
        }
      }
      generatedByTarget.forEach((columns, targetKey) => {
        const targetPath = columns[0]?.targetPath;
        if (!targetPath?.length || !isPathPrefix(targetPath, column.path)) return;
        const nextColumn = basePreviewColumns[index + 1];
        if (nextColumn && isPathPrefix(targetPath, nextColumn.path)) return;
        const parent = targetPath[targetPath.length - 1];
        columns.forEach((generated) => {
          const item: LibraryItem = {
            id: `MEASURE:${generated.code}`,
            type: "MEASURE",
            code: generated.code,
            label: generated.label,
            subLabel: `${generated.mode === "individual" ? "Individual" : generated.mode === "compute" ? "Computed" : "Calculated"} | ${generated.formula}`,
            badge: generated.outputUom || "Calculated",
            generatedMode: generated.mode,
          };
          next.push({
            code: `${targetKey}:${generated.code}`,
            label: generated.label,
            groupCode: parent?.code,
            groupLabel: parent?.label,
            generatedMeasure: item,
            path: [...targetPath, { code: generated.code, label: generated.label }],
          });
        });
      });
    });
    rootGenerated.forEach((generated) => {
      const item: LibraryItem = {
        id: `MEASURE:${generated.code}`,
        type: "MEASURE",
        code: generated.code,
        label: generated.label,
        subLabel: `${generated.mode === "individual" ? "Individual" : generated.mode === "compute" ? "Computed" : "Calculated"} | ${generated.formula}`,
        badge: generated.outputUom || "Calculated",
        generatedMode: generated.mode,
      };
      next.push({
        code: generated.code,
        label: generated.label,
        generatedMeasure: item,
        path: [{ code: generated.code, label: generated.label }],
      });
    });
    return next;
  }, [basePreviewColumns, computedColumns]);

  const previewStructuralHeaderDepth = useMemo(() => {
    return previewColumns.reduce((maxDepth, column) => Math.max(maxDepth, (column.path?.length ?? 1) - 1), 0);
  }, [previewColumns]);

  const previewHeaderRows = useMemo(
    () => groupedHeaderRows(previewColumns, previewStructuralHeaderDepth),
    [previewColumns, previewStructuralHeaderDepth],
  );

  const previewRowHeaderCount = Math.max(1, previewRowLevelRows.length);
  const previewColumnMinWidth = Math.max(760, previewRowHeaderCount * 132 + previewColumns.length * 168);
  const activeCellMapKeys = useMemo(() => {
    const keys = new Set<string>();
    previewColumns.forEach((column, index) => keys.add(measureColumnKey(column, index)));
    previewRows.forEach((_, rowIndex) => {
      previewColumns.forEach((__, columnIndex) => keys.add(`${rowIndex}:${columnIndex}`));
    });
    return keys;
  }, [previewColumns, previewRows]);
  const publicationPreviewColumns = useMemo(
    () => previewColumns.filter((column, index) => isPublicationColumnEnabled(column, index)),
    [previewColumns, publicationColumns],
  );
  const publicationPeriodicityText = useMemo(
    () => inferPublicationPeriodicity(publicationPreviewColumns),
    [publicationPreviewColumns],
  );
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

  const editableMeasureItems = useMemo(() => {
    const deduped = new Map<string, LibraryItem>();
    builder.fields
      .filter((field) => field.type === "MEASURE" && !field.generatedMode)
      .forEach((field) => deduped.set(normalizeCode(field.sourceMeasureCode ?? field.code), field));
    Object.entries(cellMap)
      .filter(([key]) => activeCellMapKeys.has(key))
      .map(([, field]) => field)
      .filter((field) => field.type === "MEASURE" && !field.generatedMode)
      .forEach((field) => deduped.set(normalizeCode(field.sourceMeasureCode ?? field.code), field));
    return Array.from(deduped.values());
  }, [activeCellMapKeys, builder.fields, cellMap]);

  const templateGrainLabels = useMemo(() => {
    const levelLabel = (items: LibraryItem[]) =>
      items
        .map((item) => libraryItemLabel(item))
        .map((label) => label.trim())
        .filter(Boolean)
        .join("/");
    const labels = [
      ...builder.tabsBy.map((item) => libraryItemLabel(item)).filter(Boolean),
      ...activeColumnLevels.map((level) => levelLabel(level.items)).filter(Boolean),
      ...activeRowLevels.map((level) => levelLabel(level.items)).filter(Boolean),
    ];
    const grainPath = labels.join(" - ");
    return grainPath ? [grainPath] : ["Template grain not configured"];
  }, [activeColumnLevels, activeRowLevels, builder.tabsBy, previewSettings.bilingualLabels, secondaryMemberLabelCache, secondaryMeasureLabelCache]);

  const editableTemplateColumns = useMemo(() => {
    const columns = new Map<
      string,
      {
        key: string;
        label: string;
        measureCode: string;
        measureLabel: string;
        uom: string;
      }
    >();
    previewColumns.forEach((column, index) => {
      if (column.generatedMeasure) return;
      const measure = measureForColumn(index);
      if (!measure) return;
      const measureCode = normalizeCode(measure.sourceMeasureCode ?? measure.code);
      const columnLabel = previewSettings.showCodes ? column.code : column.label;
      const key = `${measureCode}:${measureColumnKey(column, index)}`;
      if (columns.has(key)) return;
      columns.set(key, {
        key,
        label: columnLabel,
        measureCode,
        measureLabel: libraryItemLabel(measure),
        uom: measure.badge || "UOM",
      });
    });
    return Array.from(columns.values());
  }, [builder.fields, cellMap, previewColumns, previewSettings.showCodes, previewSettings.bilingualLabels, secondaryMeasureLabelCache]);

  const generatedDataEntryColumns = useMemo(() => {
    return computedColumns
      .filter((column) => column.mode !== "rollup")
      .map((column) => ({
        code: column.code,
        label: column.label,
        mode: column.mode,
        uom: column.outputUom || "Calculated",
        showInDataEntry: Boolean(column.showInDataEntry),
        targetGroupLabel: column.targetGroupLabel,
      }));
  }, [computedColumns]);

  const organizationByCode = useMemo(() => {
    const map = new Map<string, MasterRecord>();
    organizationRecords.forEach((record) => {
      const code = normalizeCode(recordCode(record, "organization_code"));
      if (code) map.set(code, record);
    });
    return map;
  }, [organizationRecords]);

  function resolveSourceDisplay(source: DataFieldMapping, detail?: DataFieldDetail) {
    const sourceCode = sourceCodeFromMapping(source, detail?.source_organization_code ?? "");
    const normalizedSourceCode = normalizeCode(sourceCode);
    const sourceRecord = organizationByCode.get(normalizedSourceCode);
    const parentCode =
      mappingString(source, ["parent_organization_code", "ministry_organization_code"]) ||
      recordCode(sourceRecord ?? {}, "parent_organization_code") ||
      "";
    const parentRecord = organizationByCode.get(normalizeCode(parentCode));
    const mappedOrgName =
      recordName(sourceRecord) ||
      mappingText(source, ["department_organization_name", "source_organization_name", "organization_name"], detail?.source_organization_name ?? sourceCode);
    const parentOrgName =
      recordName(parentRecord) ||
      mappingString(source, ["parent_organization_name", "ministry_name"]);
    if (parentCode && parentOrgName && normalizeCode(parentCode) !== normalizedSourceCode) {
      return {
        sourceName: parentOrgName,
        departmentName: mappedOrgName,
      };
    }
    const explicitDepartmentCode = mappingString(source, ["department_organization_code"]);
    const explicitDepartmentName = mappingString(source, ["department_organization_name", "department_name"]);
    if (explicitDepartmentCode && explicitDepartmentName && normalizeCode(explicitDepartmentCode) !== normalizedSourceCode) {
      return {
        sourceName: mappingText(source, ["source_organization_name", "organization_name", "ministry_name"], detail?.source_organization_name ?? sourceCode),
        departmentName: explicitDepartmentName,
      };
    }
    return {
      sourceName: mappingText(source, ["source_organization_name", "organization_name", "ministry_name"], mappedOrgName || "Source not mapped"),
      departmentName: "-",
    };
  }

  const recipientSourceCodes = useMemo(() => {
    const codes = new Map<string, string>();
    editableMeasureItems.forEach((measure) => {
      const measureCode = normalizeCode(measure.sourceMeasureCode ?? measure.code);
      const detail = dataFieldDetails[measureCode];
      activeMappings(detail?.source_mappings ?? detail?.source_organizations).forEach((source) => {
        const sourceCode = sourceCodeFromMapping(source);
        const normalizedSourceCode = normalizeCode(sourceCode);
        if (normalizedSourceCode) codes.set(normalizedSourceCode, sourceCode);
      });
    });
    return Array.from(codes.values());
  }, [dataFieldDetails, editableMeasureItems]);

  const recipientGroups = useMemo<RecipientSourceGroup[]>(() => {
    const groups = new Map<string, RecipientSourceGroup>();
    editableMeasureItems.forEach((measure) => {
      const measureCode = normalizeCode(measure.sourceMeasureCode ?? measure.code);
      if (!measureCode) return;
      const detail = dataFieldDetails[measureCode];
      const sources = activeMappings(detail?.source_mappings ?? detail?.source_organizations);
      const periodicities = activeMappings(detail?.periodicity_mappings ?? detail?.periodicities);
      const assignedColumns = editableTemplateColumns.filter((column) => column.measureCode === measureCode);
      const allEditableColumnLabels = editableTemplateColumns.map((column) => `${column.label} (${column.measureLabel})`);
      const assignedColumnLabels = assignedColumns.map((column) => `${column.label} (${column.uom})`);
      const visibleGeneratedColumnLabels = generatedDataEntryColumns
        .filter((column) => column.showInDataEntry)
        .map((column) => `${column.label} (${column.mode.toUpperCase()} | ${column.uom})`);
      const sourceRows = sources.length ? sources : [{} as DataFieldMapping];
      sourceRows.forEach((source) => {
        const sourceCode = sourceCodeFromMapping(source, detail?.source_organization_code ?? "MISSING_SOURCE");
        const normalizedSourceCode = normalizeCode(sourceCode);
        const { sourceName, departmentName } = resolveSourceDisplay(source, detail);
        const key = `${sourceCode}:${departmentName}`;
        const existing =
          groups.get(key) ??
          {
            key,
            sourceCode,
            sourceName,
            departmentName,
            measureCodes: [],
            measureLabels: [],
            assignedColumnLabels: [],
            dataEntryColumnLabels: [],
            generatedColumnLabels: [],
            periodicities: [],
            grains: [],
            officers: [],
            readiness: "READY" as RecipientReadiness,
          };
        existing.measureCodes = compactList([...existing.measureCodes, measureCode]);
        existing.measureLabels = compactList([...existing.measureLabels, libraryItemLabel(measure)]);
        existing.assignedColumnLabels = compactList([...existing.assignedColumnLabels, ...assignedColumnLabels]);
        existing.dataEntryColumnLabels = compactList([
          ...existing.dataEntryColumnLabels,
          ...(previewSettings.showAllRecipientColumns ? allEditableColumnLabels : assignedColumnLabels),
          ...visibleGeneratedColumnLabels,
        ]);
        existing.generatedColumnLabels = compactList([...existing.generatedColumnLabels, ...visibleGeneratedColumnLabels]);
        existing.periodicities = compactList([
          ...existing.periodicities,
          publicationPeriodicityText,
          ...periodicities.map((item) => mappingText(item, ["periodicity_name", "periodicity_code", "mapping_role"])),
          detail?.periodicity_name,
        ]);
        existing.grains = compactList([...existing.grains, ...templateGrainLabels]);
        const embeddedOfficerLabels = [
          officerLabel(source),
          ...activeMappings((detail?.source_officers as DataFieldMapping[] | undefined) ?? (detail?.source_officer_mappings as DataFieldMapping[] | undefined))
            .filter((officer) => normalizeCode(sourceCodeFromMapping(officer, mappingText(officer, ["assigned_source_organization_code", "mapped_source_organization_code"]))) === normalizedSourceCode)
            .map((officer) => officerLabel(officer)),
        ].filter((label) => label !== "Officer mapping pending");
        const fallbackOfficerLabels = (sourceOfficersByOrg[normalizedSourceCode] ?? []).map((officer) => officerLabel(officer));
        const officerLabels = compactList([...embeddedOfficerLabels, ...fallbackOfficerLabels], "Officer mapping pending");
        existing.officers = compactList([...existing.officers, ...officerLabels]);
        if (!sources.length) existing.readiness = "MISSING_SOURCE";
        else if (!publicationPeriodicityText && !periodicities.length && !detail?.periodicity_name) existing.readiness = "MISSING_PERIODICITY";
        else if (!activeRowLevels.length && !activeColumnLevels.length && !builder.tabsBy.length) existing.readiness = "MISSING_GRAIN";
        else if (officerLabels.length === 1 && officerLabels[0] === "Officer mapping pending") existing.readiness = "MISSING_OFFICER";
        groups.set(key, existing);
      });
    });
    return Array.from(groups.values()).sort((a, b) => a.sourceName.localeCompare(b.sourceName));
  }, [
    activeColumnLevels.length,
    activeRowLevels.length,
    builder.tabsBy.length,
    dataFieldDetails,
    editableMeasureItems,
    editableTemplateColumns,
    generatedDataEntryColumns,
    organizationByCode,
    publicationPeriodicityText,
    previewSettings.bilingualLabels,
    previewSettings.showAllRecipientColumns,
    secondaryMeasureLabelCache,
    sourceOfficersByOrg,
    templateGrainLabels,
  ]);

  const recipientSourceOptions = useMemo(() => {
    return recipientGroups.map((group) => ({
      value: group.key,
      label: `${group.sourceName}${group.departmentName && group.departmentName !== "-" ? ` / ${group.departmentName}` : ""}`,
    }));
  }, [recipientGroups]);

  const visibleRecipientGroups = useMemo(() => {
    if (selectedRecipientSource === "ALL") return recipientGroups;
    return recipientGroups.filter((group) => group.key === selectedRecipientSource);
  }, [recipientGroups, selectedRecipientSource]);

  const publishChecks = useMemo<PublishCheck[]>(() => {
    const missingSourceMeasures = editableMeasureItems.filter((measure) => {
      const measureCode = normalizeCode(measure.sourceMeasureCode ?? measure.code);
      const detail = dataFieldDetails[measureCode];
      return activeMappings(detail?.source_mappings ?? detail?.source_organizations).length === 0;
    });
    const checks: PublishCheck[] = [
      {
        label: "Template version",
        status: selectedVersion?.version_code ? "PASS" : "BLOCK",
        detail: selectedVersion?.version_code ? textValue(selectedVersion.title ?? selectedVersion.version_code) : "Select a template version.",
      },
      {
        label: "Row structure",
        status: activeRowLevels.length ? "PASS" : "BLOCK",
        detail: activeRowLevels.length ? `${activeRowLevels.length} row level(s) configured.` : "Add at least one row level.",
      },
      {
        label: "Column structure",
        status: activeColumnLevels.length ? "PASS" : "WARN",
        detail: activeColumnLevels.length ? `${activeColumnLevels.length} column level(s) configured.` : "No column levels. This is valid only for simple row-only forms.",
      },
      {
        label: "Editable measures",
        status: editableMeasureItems.length ? "PASS" : "BLOCK",
        detail: editableMeasureItems.length ? `${editableMeasureItems.length} measure(s) selected.` : "Add at least one Data Field / Measure.",
      },
      {
        label: "Recipients",
        status: missingSourceMeasures.length ? "BLOCK" : recipientGroups.length ? "PASS" : "WARN",
        detail: missingSourceMeasures.length
          ? `Missing active primary source/provider mapping: ${missingSourceMeasures.map((item) => item.code).join(", ")}`
          : recipientGroups.length
            ? `${recipientGroups.length} source group(s) derived from measure mappings.`
            : "No recipients derived yet.",
      },
      {
        label: "Validation",
        status: Object.keys(columnValidations).length ? "PASS" : "WARN",
        detail: Object.keys(columnValidations).length ? `${Object.keys(columnValidations).length} column validation(s) configured.` : "Validation is optional and can be added later.",
      },
      {
        label: "Generated outputs",
        status: computedColumns.length ? "PASS" : "WARN",
        detail: computedColumns.length ? `${computedColumns.length} computed/calculated/rollup output(s) configured.` : "No generated output columns configured.",
      },
      {
        label: "Publication columns",
        status: publicationPreviewColumns.length ? "PASS" : "BLOCK",
        detail: publicationPreviewColumns.length
          ? `${publicationPreviewColumns.length} column(s) selected for final publication${publicationPeriodicityText ? `; periodicity: ${publicationPeriodicityText}` : ""}.`
          : "Select at least one column for final publication.",
      },
    ];
    return checks;
  }, [
    activeColumnLevels.length,
    activeRowLevels.length,
    columnValidations,
    computedColumns.length,
    dataFieldDetails,
    editableMeasureItems,
    publicationPeriodicityText,
    publicationPreviewColumns.length,
    recipientGroups.length,
    selectedVersion?.title,
    selectedVersion?.version_code,
  ]);

  const publishBlockers = useMemo(
    () => publishChecks.filter((check) => check.status === "BLOCK"),
    [publishChecks],
  );

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
      setRowLevels([makeRowLevel(0)]);
      setActiveRowLevelId("row-level-1");
      setMemberCache({});
      setDataFieldDetails({});
      setSecondaryMemberLabelCache({});
      setSecondaryMeasureLabelCache({});
      void loadAll({ forceLibrary: true });
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
      setSelectedVersionCode("");
      return;
    }
    const requestedVersionCode = params.get("version_code") ?? "";
    setVersions([]);
    setSelectedVersionCode((current) => requestedVersionCode || current);
    void loadVersions(selectedTemplate.template_code);
  }, [selectedTemplate?.template_code]);

  useEffect(() => {
    if (!selectedVersion?.version_code) {
      setAxes([]);
      setMeasures([]);
      setRenderContract(null);
      setBuilder(emptyBuilder);
      setRowLevels([makeRowLevel(0)]);
      setActiveRowLevelId("row-level-1");
      setCellMap({});
      setColumnValidations({});
      setPublicationColumns({});
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
    if (!selectedVersion?.version_code || isSelectedVersionFrozen || !versionHydratedRef.current || isLoading || isVersionLoading || isPreviewHydrating) return undefined;
    if (!hasDraftContent(builder, cellMap, columnValidations, computedColumns, columnLevels, rowLevels)) return undefined;
    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      void saveDraftSnapshot({ silent: true });
    }, 1800);
    return () => window.clearTimeout(autosaveTimerRef.current);
  }, [activeStep, builder, cellMap, columnLevels, rowLevels, columnValidations, publicationColumns, computedColumns, previewSettings, selectedVersion?.version_code, isSelectedVersionFrozen, isLoading, isVersionLoading, isPreviewHydrating]);

  useEffect(() => {
    if (!["recipients", "preview", "publish"].includes(activeStep)) return undefined;
    const missingMeasures = editableMeasureItems
      .map((measure) => normalizeCode(measure.sourceMeasureCode ?? measure.code))
      .filter((code) => code && !dataFieldDetails[code]);
    const uniqueMissing = Array.from(new Set(missingMeasures));
    if (!uniqueMissing.length) return undefined;
    let cancelled = false;
    setIsRecipientLoading(true);
    Promise.all(
      uniqueMissing.map(async (measureCode) => {
        const detail = await getDataFieldDetail(measureCode);
        return [measureCode, detail] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setDataFieldDetails((current) => {
          const next = { ...current };
          entries.forEach(([measureCode, detail]) => {
            next[measureCode] = detail;
          });
          return next;
        });
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Recipient mappings could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsRecipientLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStep, dataFieldDetails, editableMeasureItems]);

  useEffect(() => {
    if (!["recipients", "preview", "publish"].includes(activeStep) || organizationRecords.length) return undefined;
    let cancelled = false;
    listMasterRecords({ endpoint: "/masters/organizations" })
      .then((response) => {
        if (!cancelled) setOrganizationRecords(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrganizationRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStep, organizationRecords.length]);

  useEffect(() => {
    if (selectedRecipientSource === "ALL") return;
    if (!recipientGroups.some((group) => group.key === selectedRecipientSource)) {
      setSelectedRecipientSource("ALL");
    }
  }, [recipientGroups, selectedRecipientSource]);

  useEffect(() => {
    if (!["recipients", "preview", "publish"].includes(activeStep)) return undefined;
    const missingSourceCodes = recipientSourceCodes.filter((code) => !sourceOfficersByOrg[normalizeCode(code)]);
    if (!missingSourceCodes.length) return undefined;
    let cancelled = false;
    Promise.all(
      missingSourceCodes.map(async (sourceCode) => {
        const response = await listMasterRecords({
          endpoint: "/masters/officers",
          params: { organization_code: sourceCode },
        });
        return [sourceCode, response.data ?? []] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setSourceOfficersByOrg((current) => {
          const next = { ...current };
          entries.forEach(([sourceCode, officers]) => {
            next[normalizeCode(sourceCode)] = officers.filter((officer) => officer.is_active !== false);
          });
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setSourceOfficersByOrg((current) => {
            const next = { ...current };
            missingSourceCodes.forEach((sourceCode) => {
              next[normalizeCode(sourceCode)] = [];
            });
            return next;
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeStep, recipientSourceCodes, sourceOfficersByOrg]);

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
  }, [builder.columns, builder.rowRepresents, builder.tabsBy, rowLevels, columnLevels, settingsDrawerOpen, settingsTab]);

  useEffect(() => {
    const enabledItems = [
      ...builder.tabsBy,
      ...builder.rowRepresents,
      ...builder.columns,
      ...rowLevels.flatMap((level) => level.items),
      ...columnLevels.flatMap((level) => level.items),
    ].filter((item) => isBilingualEnabled(item));
    const needsMeasures = previewSettings.bilingualLabels.measures && builder.fields.some((item) => item.type === "MEASURE");
    if (!enabledItems.length && !needsMeasures) return undefined;
    let cancelled = false;
    setIsSecondaryLabelLoading(true);
    void Promise.all([
      ...enabledItems.map((item) => loadSecondaryMembersForItem(item)),
      needsMeasures ? loadSecondaryMeasureLabels() : Promise.resolve(),
    ]).finally(() => {
      if (!cancelled) setIsSecondaryLabelLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [
    builder.tabsBy,
    builder.rowRepresents,
    builder.columns,
    builder.fields,
    rowLevels,
    columnLevels,
    previewSettings.bilingualLabels.geography,
    previewSettings.bilingualLabels.dimensions,
    previewSettings.bilingualLabels.measures,
    previewSettings.bilingualLabels.locale,
  ]);

  function changeLibraryTab(tab: LibraryTab) {
    setLibrarySearch("");
    setActiveLibraryTab(tab);
  }

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (selectedTemplate?.template_code) next.set("template_code", selectedTemplate.template_code);
    if (selectedVersion?.version_code) next.set("version_code", selectedVersion.version_code);
    next.delete("step");
    setParams(next, { replace: true });
  }, [selectedTemplate?.template_code, selectedVersion?.version_code]);

  async function loadAll(options: { forceLibrary?: boolean } = {}) {
    setIsLoading(true);
    setError("");
    try {
      const templateResponse = await listTemplates({ limit: 200 });
      const nextTemplates = templateResponse.data ?? [];
      setTemplates(nextTemplates);
      setSelectedTemplateCode((current) => current || nextTemplates[0]?.template_code || "");
      void loadDataLibrary({ force: options.forceLibrary });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Template Designer data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  function applyDataLibraryCache(cache: TemplateDataLibraryCache) {
    setDimensionSets(cache.dimensionSets);
    setDimensionMembers(cache.dimensionMembers);
    setGeographySets(cache.geographySets);
    setGeographyMembers(cache.geographyMembers);
    setTimeSets(cache.timeSets);
    setTimeMembers(cache.timeMembers);
    setDataFields(cache.dataFields);
    setAllTimePeriods(cache.allTimePeriods);
  }

  async function loadDataLibrary(options: { force?: boolean } = {}) {
    const cacheKey = dataLibraryCacheKey();
    const cached = templateDataLibraryCache.get(cacheKey);
    if (cached && !options.force) {
      applyDataLibraryCache(cached);
      setIsLibraryLoading(false);
      return;
    }

    setIsLibraryLoading(true);
    try {
      const [dimensionResponse, geographySetResponse, geographyResponse, timeSetResponse, timePeriodResponse, dataFieldResponse] =
        await Promise.all([
          listDimensionManagementRows({ limit: 300, offset: 0 }),
          listDimensionMemberSets("GEOGRAPHY").catch(() => ({ data: [] })),
          listGeographies({ limit: 500, offset: 0 }).catch(() => ({ data: [] })),
          listTimePeriodSets(),
          listAllTimePeriods().catch(() => ({ data: [] })),
          listDataFields({ limit: 500, offset: 0 }),
        ]);

      const nextDimensions = (dimensionResponse.data?.rows ?? []).filter(isGeneralDimension);
      const setResults = await Promise.all(
        nextDimensions.map(async (dimension: DimensionManagementRow) => {
          const dimensionCode = dimension.dimension_code ?? "";
          if (!dimensionCode) return [];
          const response = await listDimensionMemberSets(dimensionCode).catch(() => ({ data: [] }));
          return (response.data ?? []).map((set) => mapSetToLibraryItem(set, "DIMENSION_SET", dimensionCode, dimension));
        }),
      );
      const memberResults = await Promise.all(
        nextDimensions.map(async (dimension: DimensionManagementRow) => {
          const dimensionCode = dimension.dimension_code ?? "";
          if (!dimensionCode) return [];
          const response = await listDimensionMembers(dimensionCode, 500).catch(() => ({ data: [] }));
          return (response.data ?? []).map((member) => mapDimensionMemberToLibraryItem(member, dimension));
        }),
      );
      const cache: TemplateDataLibraryCache = {
        dimensionSets: setResults.flat(),
        dimensionMembers: memberResults.flat(),
        geographySets: (geographySetResponse.data ?? []).map((set) => mapSetToLibraryItem(set, "GEOGRAPHY_SET", "GEOGRAPHY")),
        geographyMembers: (geographyResponse.data ?? []).map(mapGeographyToLibraryItem),
        timeSets: (timeSetResponse.data ?? []).map((set) => mapSetToLibraryItem(set, "TIME_SET", "TIME_PERIOD")),
        timeMembers: (timePeriodResponse.data ?? []).map(mapTimePeriodToLibraryItem),
        allTimePeriods: timePeriodResponse.data ?? [],
        dataFields: (dataFieldResponse.data ?? []).map((field) => ({
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
      };
      templateDataLibraryCache.set(cacheKey, cache);
      applyDataLibraryCache(cache);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Template Studio Data Library could not be loaded.");
    } finally {
      setIsLibraryLoading(false);
    }
  }

  async function loadVersions(templateCode: string) {
    setIsVersionListLoading(true);
    try {
      let nextVersions: TemplateVersion[] = [];
      const requestedVersionCode = params.get("version_code") ?? "";
      try {
        const response = await listTemplateVersions(templateCode);
        nextVersions = response.data ?? [];
      } catch {
        nextVersions = [];
      }
      if (requestedVersionCode && !nextVersions.some((version) => samePublicCode(version.version_code, requestedVersionCode))) {
        try {
          const detailResponse = await getTemplateVersion(requestedVersionCode);
          const requestedVersion = detailResponse.data;
          const requestedTemplateCode = requestedVersion?.template_code ?? templateCode;
          if (requestedVersion?.version_code && samePublicCode(requestedTemplateCode, templateCode)) {
            nextVersions = [
              requestedVersion,
              ...nextVersions.filter((version) => !samePublicCode(version.version_code, requestedVersion.version_code)),
            ];
          }
        } catch {
          nextVersions = [urlVersionFallback(templateCode, requestedVersionCode), ...nextVersions];
        }
      }
      setVersions(nextVersions);
      setSelectedVersionCode(
        (current) =>
          nextVersions.some((version) => samePublicCode(version.version_code, requestedVersionCode))
            ? requestedVersionCode
            : nextVersions.some((version) => samePublicCode(version.version_code, current))
              ? current
              : nextVersions.find((version) => version.is_current)?.version_code || nextVersions[0]?.version_code || "",
      );
    } catch {
      setVersions([]);
      setSelectedVersionCode("");
    } finally {
      setIsVersionListLoading(false);
    }
  }

  async function refreshTimeSetLibrary() {
    const response = await listTimePeriodSets();
    const nextTimeSets = (response.data ?? []).map((set) => mapSetToLibraryItem(set, "TIME_SET", "TIME_PERIOD"));
    setTimeSets(nextTimeSets);
    const cacheKey = dataLibraryCacheKey();
    const cached = templateDataLibraryCache.get(cacheKey);
    if (cached) {
      templateDataLibraryCache.set(cacheKey, { ...cached, timeSets: nextTimeSets });
    }
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
      setRowLevels([makeRowLevel(0)]);
      setActiveRowLevelId("row-level-1");
      setColumnLevels([makeColumnLevel(0)]);
      setActiveColumnLevelId("column-level-1");
      setCellMap({});
      setColumnValidations({});
      setAvailableValidations({});
      setComputedColumns([]);
      setPreviewSettings(defaultPreviewSettings);
      setIsPreviewHydrating(false);
      const draftPayload = draftResponse.data as (TemplateStudioDraft & { data?: TemplateStudioDraft; studio_state?: unknown }) | null;
      const studioState = safeStudioState(draftPayload?.studio_state ?? draftPayload?.data?.studio_state);
      if (studioState && Object.keys(studioState).length > 0) {
        if (isBuilderState(studioState.builder)) {
          const nextBuilder = safeBuilderState(studioState.builder);
          const nextRowLevels = safeRowLevels(studioState.rowLevels, nextBuilder.rowRepresents);
          const nextColumnLevels = safeColumnLevels(studioState.columnLevels, nextBuilder.columns);
          const levelOneRows = nextRowLevels[0]?.items ?? nextBuilder.rowRepresents;
          const levelOneColumns = nextColumnLevels[0]?.items ?? nextBuilder.columns;
          const compatibleBuilder = { ...nextBuilder, rowRepresents: levelOneRows, columns: levelOneColumns };
          setBuilder(compatibleBuilder);
          setRowLevels(nextRowLevels);
          setActiveRowLevelId(nextRowLevels[0]?.id ?? "row-level-1");
          setColumnLevels(nextColumnLevels);
          setActiveColumnLevelId(nextColumnLevels[0]?.id ?? "column-level-1");
          const previewMemberItems = [
            ...compatibleBuilder.tabsBy,
            ...compatibleBuilder.rowRepresents,
            ...nextRowLevels.flatMap((level) => level.items),
            ...nextColumnLevels.flatMap((level) => level.items),
          ];
          if (previewMemberItems.length > 0) {
            setIsPreviewHydrating(true);
            void Promise.all(previewMemberItems.map((item) => loadMembersForItem(item))).finally(() => setIsPreviewHydrating(false));
          }
        }
        if (studioState.cellMap && typeof studioState.cellMap === "object") {
          setCellMap(safeRecordOfLibraryItems(studioState.cellMap));
        }
        if (studioState.columnValidations && typeof studioState.columnValidations === "object") {
          const nextValidations = safeValidationMap(studioState.columnValidations);
          setColumnValidations(nextValidations);
          setAvailableValidations(nextValidations);
        }
        if (studioState.publicationColumns && typeof studioState.publicationColumns === "object") {
          setPublicationColumns(safeBooleanMap(studioState.publicationColumns));
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
          const metadata = (formula.render_metadata ?? {}) as {
            visibility?: {
              show_in_data_entry?: boolean;
              show_in_preview?: boolean;
              show_in_published_output?: boolean;
            };
            target_group_key?: string | null;
            target_group_label?: string | null;
            target_path?: PreviewLabel[];
            repeat_for_all_groups?: boolean;
            repeat_per_column_group?: boolean;
            rollup_dimension_code?: string | null;
            rollup_parent_member_code?: string | null;
            rollup_aggregation_method?: string | null;
          };
          const repeatForAllGroups =
            Boolean(metadata.repeat_for_all_groups ?? metadata.repeat_per_column_group) ||
            metadata.target_group_key === ALL_GENERATED_GROUPS_KEY;
          return {
            code: formula.formula_code ?? "",
            label: formula.formula_name ?? formula.formula_code ?? "Generated value",
            formula: formula.expression_text ?? "",
            outputUom: formula.output_uom_code ?? "Calculated",
            mode: mode === "calculated" || mode === "rollup" ? mode : "compute",
            functionCode: formula.function_code ?? undefined,
            showInDataEntry: Boolean(metadata.visibility?.show_in_data_entry),
            showInPreview: metadata.visibility?.show_in_preview !== false,
            showInPublishedOutput: metadata.visibility?.show_in_published_output === true,
            repeatForAllGroups,
            targetGroupKey: repeatForAllGroups ? ALL_GENERATED_GROUPS_KEY : metadata.target_group_key ?? undefined,
            targetGroupLabel: repeatForAllGroups ? "All groups" : metadata.target_group_label ?? undefined,
            targetPath: repeatForAllGroups ? undefined : Array.isArray(metadata.target_path) ? metadata.target_path : undefined,
            rollupDimensionCode: metadata.rollup_dimension_code ?? undefined,
            rollupParentMemberCode: metadata.rollup_parent_member_code ?? undefined,
            rollupAggregationMethod: metadata.rollup_aggregation_method ?? undefined,
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

  function mapDimensionMemberToLibraryItem(member: DimensionMember, dimension: DimensionManagementRow): LibraryItem {
    const dimensionCode = dimension.dimension_code ?? member.dimension_code ?? "";
    const code = member.member_code ?? "";
    const dimensionName = dimension.dimension_name ?? dimension.name ?? dimensionCode;
    const label = firstDisplayName([member.name, member.short_name], code);
    return {
      id: `DIMENSION_MEMBER:${dimensionCode}:${code}`,
      type: "DIMENSION_MEMBER",
      code,
      label: label !== "-" ? label : code,
      subLabel: `${dimensionName} member`,
      badge: "Member",
      dimensionCode,
      memberCount: 1,
    };
  }

  function mapGeographyToLibraryItem(geography: Geography): LibraryItem {
    const code = geography.member_code ?? geography.geography_code ?? "";
    const label = firstDisplayName([geography.name, geography.short_name], code);
    return {
      id: `GEOGRAPHY_MEMBER:${code}`,
      type: "GEOGRAPHY_MEMBER",
      code,
      label: label !== "-" ? label : code,
      subLabel: [geography.level_name ?? geography.level_code, geography.parent_geography_name ?? geography.parent_geography_code]
        .filter(Boolean)
        .join(" under ") || "Geography member",
      badge: "Member",
      dimensionCode: "GEOGRAPHY",
      memberCount: 1,
    };
  }

  function mapTimePeriodToLibraryItem(period: TimePeriod): LibraryItem {
    const code = period.member_code ?? period.time_period_code ?? "";
    const label = firstDisplayName([period.name, period.short_name], code);
    return {
      id: `TIME_MEMBER:${code}`,
      type: "TIME_MEMBER",
      code,
      label: label !== "-" ? label : code,
      subLabel: [period.frequency_name ?? period.frequency_code, period.period_year].filter(Boolean).join(" | ") || "Time period member",
      badge: "Member",
      dimensionCode: "TIME_PERIOD",
      memberCount: 1,
    };
  }

  function onDragStart(event: DragEvent, item: LibraryItem) {
    if (isSelectedVersionFrozen) {
      event.preventDefault();
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    event.dataTransfer.setData("application/json", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "copy";
  }

  function syncLevelOneRows(levels: RowLevel[]) {
    const nextLevelOne = levels[0]?.items ?? [];
    setBuilder((current) => ({ ...current, rowRepresents: nextLevelOne }));
  }

  function updateRowLevels(updater: (current: RowLevel[]) => RowLevel[]) {
    setRowLevels((current) => {
      const next = reindexRowLevels(updater(current));
      syncLevelOneRows(next);
      return next;
    });
  }

  function syncLevelOneColumns(levels: ColumnLevel[]) {
    const nextLevelOne = levels[0]?.items ?? [];
    setBuilder((current) => ({ ...current, columns: nextLevelOne }));
  }

  function updateColumnLevels(updater: (current: ColumnLevel[]) => ColumnLevel[]) {
    setColumnLevels((current) => {
      const next = reindexColumnLevels(updater(current));
      syncLevelOneColumns(next);
      return next;
    });
  }

  function addColumnLevel() {
    const nextLevelId = `column-level-${columnLevels.length + 1}`;
    updateColumnLevels((current) => [...current, makeColumnLevel(current.length)]);
    setActiveColumnLevelId(nextLevelId);
  }

  function removeColumnLevel(levelId: string) {
    updateColumnLevels((current) => (current.length <= 1 ? [makeColumnLevel(0)] : current.filter((level) => level.id !== levelId)));
    setActiveColumnLevelId("column-level-1");
  }

  function addRowLevel() {
    const nextLevelId = `row-level-${rowLevels.length + 1}`;
    updateRowLevels((current) => [...current, makeRowLevel(current.length)]);
    setActiveRowLevelId(nextLevelId);
  }

  function removeRowLevel(levelId: string) {
    updateRowLevels((current) => (current.length <= 1 ? [makeRowLevel(0)] : current.filter((level) => level.id !== levelId)));
    setActiveRowLevelId("row-level-1");
  }

  async function toggleRowLevelItem(levelId: string, item: LibraryItem) {
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    if (item.type === "MEASURE") {
      setNotice("Drop measures into Fields To Fill. Row levels accept dimensions, geography, and time-period items.");
      return;
    }
    updateRowLevels((current) =>
      current.map((level) => {
        if (level.id !== levelId) return level;
        const exists = level.items.some((existing) => existing.id === item.id);
        return {
          ...level,
          items: exists ? level.items.filter((existing) => existing.id !== item.id) : [...level.items, item],
        };
      }),
    );
    setActiveRowLevelId(levelId);
    await loadMembersForItem(item);
  }

  async function toggleColumnLevelItem(levelId: string, item: LibraryItem) {
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    if (item.type === "MEASURE") {
      setNotice("Drop measures into Fields To Fill. Column levels accept dimensions, geography, and time-period items.");
      return;
    }
    updateColumnLevels((current) =>
      current.map((level) => {
        if (level.id !== levelId) return level;
        const exists = level.items.some((existing) => existing.id === item.id);
        return {
          ...level,
          items: exists ? level.items.filter((existing) => existing.id !== item.id) : [...level.items, item],
        };
      }),
    );
    setActiveColumnLevelId(levelId);
    await loadMembersForItem(item);
  }

  async function onColumnLevelDrop(event: DragEvent, levelId: string) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    await toggleColumnLevelItem(levelId, JSON.parse(raw) as LibraryItem);
  }

  async function onRowLevelDrop(event: DragEvent, levelId: string) {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    await toggleRowLevelItem(levelId, JSON.parse(raw) as LibraryItem);
  }

  function removeColumnLevelItem(levelId: string, itemId: string) {
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    updateColumnLevels((current) =>
      current.map((level) => (level.id === levelId ? { ...level, items: level.items.filter((item) => item.id !== itemId) } : level)),
    );
  }

  function removeRowLevelItem(levelId: string, itemId: string) {
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    updateRowLevels((current) =>
      current.map((level) => (level.id === levelId ? { ...level, items: level.items.filter((item) => item.id !== itemId) } : level)),
    );
  }

  async function onDrop(event: DragEvent, zone: DropZone) {
    event.preventDefault();
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
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
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
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
    if (actualZone === "columns") {
      await toggleColumnLevelItem(columnLevels[0]?.id ?? "column-level-1", item);
      return;
    }
    if (actualZone === "rowRepresents") {
      await toggleRowLevelItem(rowLevels[0]?.id ?? "row-level-1", item);
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
    if (isMemberItem(item)) {
      const row = {
        dimension_code: item.dimensionCode,
        member_code: item.code,
        member_name: item.label,
        name: item.label,
        sort_order: 1,
        is_active: true,
      } satisfies DimensionMemberSetItem;
      setMemberCache((current) => ({ ...current, [item.id]: [row] }));
      return [row];
    }
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

  async function loadSecondaryMembersForItem(item: LibraryItem): Promise<void> {
    if (secondaryMemberLabelCache[item.id] || item.type === "MEASURE" || item.type === "TIME_SET" || item.type === "TIME_MEMBER" || !item.code) return;
    try {
      let labels: Record<string, string> = {};
      if (item.type === "DIMENSION_MEMBER" && item.dimensionCode) {
        const response = await listDimensionMembers(item.dimensionCode, 500, { locale: previewSettings.bilingualLabels.locale });
        labels = (response.data ?? []).reduce<Record<string, string>>((next, row) => {
          const code = textValue(row.member_code);
          const label = firstDisplayName([row.name, row.short_name], row.member_code);
          if (code !== "-" && label !== "-") next[code] = label;
          return next;
        }, {});
      } else if (item.type === "GEOGRAPHY_MEMBER") {
        const response = await listGeographies({ limit: 500, offset: 0, locale: previewSettings.bilingualLabels.locale });
        labels = (response.data ?? []).reduce<Record<string, string>>((next, row) => {
          const code = textValue(row.member_code ?? row.geography_code);
          const label = firstDisplayName([row.name, row.short_name], code);
          if (code !== "-" && label !== "-") next[code] = label;
          return next;
        }, {});
      } else {
        const response = await listDimensionMemberSetMembers(item.code, 500, { locale: previewSettings.bilingualLabels.locale });
        labels = (response.data ?? []).reduce<Record<string, string>>((next, row) => {
          const code = textValue(row.member_code);
          const label = itemName(row);
          if (code !== "-" && label !== "-") next[code] = label;
          return next;
        }, {});
      }
      setSecondaryMemberLabelCache((current) => ({ ...current, [item.id]: labels }));
    } catch {
      setSecondaryMemberLabelCache((current) => ({ ...current, [item.id]: {} }));
    }
  }

  async function loadSecondaryMeasureLabels(): Promise<void> {
    if (Object.keys(secondaryMeasureLabelCache).length > 0) return;
    try {
      const response = await listDataFields({ limit: 500, offset: 0, locale: previewSettings.bilingualLabels.locale });
      const labels = (response.data ?? []).reduce<Record<string, string>>((next, field) => {
        const code = field.measure_code ?? field.data_field_code ?? "";
        const label = measureName(field);
        if (code && label !== "-") next[code] = label;
        return next;
      }, {});
      setSecondaryMeasureLabelCache(labels);
    } catch {
      setSecondaryMeasureLabelCache({});
    }
  }

  async function loadAvailableRollups() {
    const dimensionCodes = Array.from(
      new Set(
        [...builder.tabsBy, ...builder.rowRepresents, ...builder.columns]
          .concat(rowLevels.flatMap((level) => level.items))
          .concat(columnLevels.flatMap((level) => level.items))
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
    if (zone === "rowRepresents") {
      removeRowLevelItem(rowLevels[0]?.id ?? "row-level-1", id);
    }
    if (zone === "columns") {
      removeColumnLevelItem(columnLevels[0]?.id ?? "column-level-1", id);
    }
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

  function isPublicationColumnEnabled(column: PreviewColumn, columnIndex: number) {
    const key = measureColumnKey(column, columnIndex);
    return publicationColumns[key] === true;
  }

  function togglePublicationColumn(event: MouseEvent, column: PreviewColumn, columnIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    const key = measureColumnKey(column, columnIndex);
    const nextPublicationColumns = {
      ...publicationColumns,
      [key]: publicationColumns[key] !== true,
    };
    setPublicationColumns(nextPublicationColumns);
    void saveDraftSnapshot({ silent: true, overrides: { publicationColumns: nextPublicationColumns } });
  }

  function isIndividualGeneratedMeasure(measure?: LibraryItem | null) {
    return normalizeCode(measure?.generatedMode ?? "") === "INDIVIDUAL";
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
    return `Fill data for:\n${libraryItemLabel(field)}\nUOM: ${field.badge || "Not mapped"}\nCode: ${field.code}`;
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
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    const selectedRollup = availableRollups.find((rollup) => rollupKey(rollup) === selectedRollupKey);
    const selectedTarget = generatedTargetOptions.find((target) => target.key === selectedGeneratedTargetKey);
    const repeatForAllGroups = mode !== "rollup" && selectedTarget?.key === ALL_GENERATED_GROUPS_KEY;
    const label = mode === "rollup" && selectedRollup ? rollupLabel(selectedRollup) : computeName.trim();
    const formula =
      mode === "rollup" && selectedRollup
        ? `${selectedRollup.dimension_code ?? "DIMENSION"}.${selectedRollup.rule_code ?? "ROLLUP"}`
        : mode === "individual"
          ? (computeFormula.trim() || "INDIVIDUAL_COLUMN")
        : computeFormula.trim();
    if (!label || !formula) {
      setError(
        mode === "rollup"
          ? "Select an available rollup before adding the rollup row."
          : mode === "individual"
            ? "Enter an individual column name before adding it."
            : "Enter a value name and formula before adding the computed column.",
      );
      return;
    }
    if (mode !== "rollup" && !selectedTarget) {
      setError("Select the column group where this generated value should be added.");
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
      showInDataEntry: mode === "individual",
      showInPreview: true,
      showInPublishedOutput: false,
      repeatForAllGroups,
      targetGroupKey: mode === "rollup" ? undefined : repeatForAllGroups ? ALL_GENERATED_GROUPS_KEY : selectedTarget?.key,
      targetGroupLabel: mode === "rollup" ? undefined : repeatForAllGroups ? "All groups" : selectedTarget?.label,
      targetPath: mode === "rollup" || repeatForAllGroups ? undefined : selectedTarget?.path,
      rollupDimensionCode: selectedRollup?.dimension_code,
      rollupParentMemberCode: selectedRollup?.parent_member_code,
      rollupAggregationMethod: selectedRollup?.aggregation_method,
    };
    setComputedColumns((current) => [computed, ...current]);
    setComputeName("");
    setComputeFormula("");
    setComputeColumnSearch("");
    setNotice(
      mode === "rollup"
        ? "Rollup row added to the draft preview."
        : `${mode === "individual" ? "Individual" : mode === "calculated" ? "Calculated" : "Computed"} column added under ${repeatForAllGroups ? "all groups" : selectedTarget?.label}.`,
    );
  }

  function toggleGeneratedColumnDataEntryVisibility(code: string) {
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    const normalizedCode = normalizeCode(code);
    setComputedColumns((current) =>
      current.map((column) =>
        normalizeCode(column.code) === normalizedCode
          ? { ...column, showInDataEntry: !Boolean(column.showInDataEntry) }
          : column,
      ),
    );
  }

  function addGeneratedColumnToPreview(column: ComputedColumnDraft) {
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    const normalizedCode = normalizeCode(column.code);
    setComputedColumns((current) =>
      current.map((item) =>
        normalizeCode(item.code) === normalizedCode
          ? { ...item, showInPreview: true }
          : item,
      ),
    );
    setNotice(`${column.label} enabled in preview.`);
  }

  function removeGeneratedColumn(column: ComputedColumnDraft) {
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    const normalizedCode = normalizeCode(column.code);
    setComputedColumns((current) => current.filter((item) => normalizeCode(item.code) !== normalizedCode));
    setCellMap((current) => {
      const next = { ...current };
      Object.entries(next).forEach(([key, value]) => {
        if (normalizeCode(value.code) === normalizedCode) delete next[key];
      });
      return next;
    });
    setNotice(`${column.label} removed from generated outputs.`);
  }

  function sourceKeysForFormula(formula: string) {
    const normalizedFormula = formula.toLowerCase();
    return editableColumnSources
      .filter((source) => normalizedFormula.includes(source.label.toLowerCase()) || normalizedFormula.includes(source.measureLabel.toLowerCase()))
      .map((source) => source.key);
  }

  function sanitizeCellMapForPreview(input: Record<string, LibraryItem>) {
    const next: Record<string, LibraryItem> = {};
    Object.entries(input).forEach(([key, value]) => {
      if (activeCellMapKeys.has(key)) next[key] = value;
    });
    return next;
  }

  function sanitizePublicationColumnsForPreview(input: Record<string, boolean>) {
    const next: Record<string, boolean> = {};
    Object.entries(input).forEach(([key, value]) => {
      if (activeCellMapKeys.has(key) && value === true) next[key] = true;
    });
    return next;
  }

  function buildStudioDraftState(
    overrides: Partial<{
      builder: BuilderState;
      rowLevels: RowLevel[];
      columnLevels: ColumnLevel[];
      cellMap: Record<string, LibraryItem>;
      columnValidations: Record<string, ColumnValidationConfig>;
      publicationColumns: Record<string, boolean>;
      computedColumns: ComputedColumnDraft[];
      previewSettings: typeof defaultPreviewSettings;
      activeStep: StudioStep;
    }> = {},
  ) {
    const nextCellMap = sanitizeCellMapForPreview(overrides.cellMap ?? cellMap);
    const nextPublicationColumns = sanitizePublicationColumnsForPreview(overrides.publicationColumns ?? publicationColumns);
    return {
      builder: overrides.builder ?? builder,
      rowLevels: overrides.rowLevels ?? rowLevels,
      columnLevels: overrides.columnLevels ?? columnLevels,
      cellMap: nextCellMap,
      columnValidations: overrides.columnValidations ?? columnValidations,
      publicationColumns: nextPublicationColumns,
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
    if (isSelectedVersionFrozen) {
      if (!options.silent) setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
    const draftBuilder = options.overrides?.builder ?? builder;
    const draftRowLevels = options.overrides?.rowLevels ?? rowLevels;
    const draftColumnLevels = options.overrides?.columnLevels ?? columnLevels;
    const draftCellMap = sanitizeCellMapForPreview(options.overrides?.cellMap ?? cellMap);
    const draftValidations = options.overrides?.columnValidations ?? columnValidations;
    const draftComputedColumns = options.overrides?.computedColumns ?? computedColumns;
    if (!hasDraftContent(draftBuilder, draftCellMap, draftValidations, draftComputedColumns, draftColumnLevels, draftRowLevels)) {
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
            repeat_for_all_groups: Boolean(column.repeatForAllGroups),
            repeat_per_column_group: Boolean(column.repeatForAllGroups),
            target_group_key: column.repeatForAllGroups ? ALL_GENERATED_GROUPS_KEY : column.targetGroupKey ?? null,
            target_group_label: column.repeatForAllGroups ? "All groups" : column.targetGroupLabel ?? null,
            target_path: column.repeatForAllGroups ? [] : column.targetPath ?? [],
            rollup_dimension_code: column.rollupDimensionCode ?? null,
            rollup_parent_member_code: column.rollupParentMemberCode ?? null,
            rollup_aggregation_method: column.rollupAggregationMethod ?? null,
            preview_behavior: column.mode === "rollup" ? "DERIVED_ROW_ROLLUP" : "NON_EDITABLE_GENERATED_COLUMN",
            visibility: {
              show_in_data_entry: Boolean(column.showInDataEntry),
              show_in_preview: column.showInPreview !== false,
              show_in_published_output: column.showInPublishedOutput === true,
            },
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

  async function syncActiveTemplateMeasures(versionCode: string) {
    const currentMeasureCodes = new Set(
      editableMeasureItems
        .map((measure) => normalizeCode(measure.sourceMeasureCode ?? measure.code))
        .filter(Boolean),
    );

    for (const measure of editableMeasureItems) {
      await ensureTemplateMeasure(measure);
    }

    const latestMeasures = await listTemplateMeasures(versionCode);
    const activeMeasures = latestMeasures.data ?? [];
    const staleMeasures = activeMeasures.filter((measure) => {
      const measureCode = normalizeCode(measure.measure_code);
      return measureCode && measure.is_active !== false && !currentMeasureCodes.has(measureCode);
    });

    if (staleMeasures.length) {
      await Promise.all(
        staleMeasures.map((measure) => deactivateTemplateMeasure(versionCode, String(measure.measure_code ?? ""))),
      );
    }

    const refreshedMeasures = await listTemplateMeasures(versionCode);
    setMeasures(refreshedMeasures.data ?? []);
  }

  async function saveColumnValidation() {
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return;
    }
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
      rowLevels,
      columnLevels,
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
      setRowLevels(draftSnapshot.rowLevels);
      setColumnLevels(draftSnapshot.columnLevels);
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
    if (isSelectedVersionFrozen) {
      setError("This template version is published and locked. Create a new version to make changes.");
      return false;
    }
    setIsSaving(true);
    setError("");
    try {
      const rowLevelItems = rowLevels.flatMap((level) => level.items);
      const columnLevelItems = columnLevels.flatMap((level) => level.items);
      const timeItem = [...rowLevelItems, ...columnLevelItems, ...builder.rowRepresents, ...builder.columns, ...builder.tabsBy].find((item) => item.type === "TIME_SET");
      if (timeItem) {
        const existingTimeAxis = axes.find((axis) => normalizeCode(axis.dimension_code) === "TIME_PERIOD");
        const isColumnTime = columnLevelItems.some((item) => item.id === timeItem.id) || builder.columns.some((item) => item.id === timeItem.id);
        const isRowTime = rowLevelItems.some((item) => item.id === timeItem.id) || builder.rowRepresents.some((item) => item.id === timeItem.id);
        const payload = {
          axis_code: existingTimeAxis?.axis_code ?? "AXIS_TIME_PERIOD",
          axis_role: isColumnTime ? "COLUMN" : isRowTime ? "ROW" : "PAGE",
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
            builder_zone: isColumnTime ? "columns" : isRowTime ? "rowRepresents" : "tabsBy",
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
      await syncActiveTemplateMeasures(selectedVersion.version_code);
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

  async function persistRecipientProviderPolicies(versionCode: string) {
    const unitCode = getSelectedUnitCode();
    const policyKeys = new Set<string>();
    for (const measure of editableMeasureItems) {
      const measureCode = normalizeCode(measure.sourceMeasureCode ?? measure.code);
      if (!measureCode) continue;
      const detail = dataFieldDetails[measureCode] ?? await getDataFieldDetail(measureCode);
      const sources = activeMappings(detail?.source_mappings ?? detail?.source_organizations);
      for (const source of sources) {
        const organizationCode = sourceCodeFromMapping(source);
        const normalizedOrganizationCode = normalizeCode(organizationCode);
        if (!normalizedOrganizationCode) continue;
        const policyKey = `${measureCode}:${normalizedOrganizationCode}`;
        if (policyKeys.has(policyKey)) continue;
        policyKeys.add(policyKey);
        await upsertTemplateMeasureAccessPolicy(versionCode, {
          measure_code: measureCode,
          organization_code: organizationCode,
          unit_code: unitCode,
          access_role: "DATA_PROVIDER",
          can_enter_data: true,
          can_view_data: true,
          can_view_other_measure_data: Boolean(previewSettings.showAllRecipientColumns),
          can_view_after_submission: false,
          is_primary_provider: true,
          is_required: true,
          policy_metadata: {
            source: "TEMPLATE_STUDIO_RECIPIENTS",
            template_grain: templateGrainLabels,
            assigned_columns: editableTemplateColumns
              .filter((column) => column.measureCode === measureCode)
              .map((column) => column.label),
          },
          is_active: true,
        });
      }
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
    if (isSelectedVersionFrozen) {
      setError("This template version is already published and locked. Create a new version for changes.");
      return;
    }
    if (publishBlockers.length) {
      setError(`Publish blocked. Resolve: ${publishBlockers.map((check) => check.label).join(", ")}.`);
      return;
    }
    setIsPublishing(true);
    setError("");
    try {
      const saved = await saveStructureDraft();
      if (!saved) return;
      await persistRecipientProviderPolicies(selectedVersion.version_code);
      await publishTemplateVersion(selectedVersion.version_code, {
        unit_code: getSelectedUnitCode(),
        publish_notes: "Published from Template Studio after structure preview review.",
      });
      setNotice("Template version published successfully.");
      setVersions((current) =>
        current.map((version) =>
          version.version_code === selectedVersion.version_code
            ? { ...version, status: "PUBLISHED", is_current: true }
            : version,
        ),
      );
      setTemplates((current) =>
        current.map((template) =>
          template.template_code === selectedTemplate?.template_code
            ? { ...template, status: "PUBLISHED", current_version_code: selectedVersion.version_code }
            : template,
        ),
      );
      if (selectedTemplate?.template_code) {
        await Promise.all([loadVersions(selectedTemplate.template_code), loadAll()]);
      }
    } catch (publishError) {
      const message = publishError instanceof Error ? publishError.message : "";
      if (message.includes("approved data contract") || message.includes("API request failed: 400")) {
        setError("Publish blocked. Complete Recipients mapping first: every editable measure needs at least one active primary data provider.");
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

  function renderReadOnlyPreviewTable(options: { columns?: PreviewColumn[]; title?: string } = {}) {
    const columns = options.columns ?? previewColumns;
    const structuralDepth = columns.reduce((maxDepth, column) => Math.max(maxDepth, (column.path?.length ?? 1) - 1), 0);
    const headerRows = groupedHeaderRows(columns, structuralDepth);
    const columnMinWidth = Math.max(720, previewRowHeaderCount * 132 + columns.length * 156);
    return (
      <div className="template-excel-wrap template-final-preview-wrap">
        <table
          className={`template-excel-table ${previewSettings.compactCells ? "compact" : ""} ${previewSettings.zebraRows ? "zebra" : ""}`}
          style={{ minWidth: `${columnMinWidth}px` }}
        >
          <thead>
            {headerRows.map((row, rowIndex) => (
              <tr key={`final-preview-header-level-${rowIndex}`}>
                <th colSpan={previewRowHeaderCount}>{rowIndex === 0 ? options.title ?? "Column Groups" : ""}</th>
                {row.map((cell, index) => (
                  <th key={`${cell.code}-${rowIndex}-${index}`} colSpan={cell.colSpan}>
                    {previewSettings.showCodes ? cell.code : cell.label}
                  </th>
                ))}
              </tr>
            ))}
            <tr>
              {Array.from({ length: previewRowHeaderCount }, (_, index) => {
                const rowLevel = previewRowLevels[index];
                return (
                  <th key={`final-preview-row-header-${index}`} className="template-row-header-cell">
                    {rowLevel?.items.map((item) => libraryItemLabel(item)).join(" / ") || (index === 0 ? "Rows" : `Row Level ${index + 1}`)}
                  </th>
                );
              })}
              {columns.map((column) => {
                const originalIndex = previewColumns.indexOf(column);
                const columnMeasure = measureForColumn(originalIndex);
                return (
                  <th key={`${column.code}-${originalIndex}`} title={columnMeasure ? measureTitle(columnMeasure) : undefined}>
                    <span className="template-preview-header-label">
                      <span className="template-preview-header-text">{previewSettings.showCodes ? column.code : column.label}</span>
                      {columnMeasure && (
                        <span className="template-measure-meta">
                          <span className="template-measure-info"><Info size={11} /></span>
                          <span className="template-measure-uom">{columnMeasure.badge || "UOM"}</span>
                        </span>
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
                {Array.from({ length: previewRowHeaderCount }, (_, levelIndex) => {
                  const part = row.path?.[levelIndex] ?? (levelIndex === 0 ? row : { code: "-", label: "-" });
                  return (
                    <td key={`${row.code}-final-row-level-${levelIndex}`} className={`template-row-header-cell ${row.generatedRollup ? "generated-rollup-row" : ""}`}>
                      {previewSettings.showCodes ? part.code : part.label}
                  </td>
                );
              })}
                {columns.map((column) => {
                  const originalIndex = previewColumns.indexOf(column);
                  return (
                  <td key={`${row.code}-${column.code}-${originalIndex}`}>
                    {row.generatedRollup ? (
                      <span className="computed-cell-preview" title={`${row.generatedRollup.label} derives ${row.generatedRollup.rollupAggregationMethod ?? "configured"} values from child rows`}>Auto</span>
                    ) : column.generatedMeasure && !isIndividualGeneratedMeasure(column.generatedMeasure) ? (
                      <span className="computed-cell-preview" title={column.generatedMeasure.subLabel}>Auto</span>
                    ) : (
                      <span className={measureForColumn(originalIndex) ? "editable-cell-preview" : "empty-cell-preview"} />
                    )}
                  </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderRecipientsStep() {
    return (
      <section className="template-work-card template-step-card">
        <div className="template-step-header">
          <div>
            <span>Recipients</span>
            <h3>Source and officer readiness</h3>
            <p>
              Source views are generated from template grain, assigned measure columns, generated columns allowed for Data Entry,
              and the show all/hide non-assigned setting.
            </p>
          </div>
          <div className="template-recipient-header-actions">
            <select
              className="template-recipient-source-filter"
              value={selectedRecipientSource}
              onChange={(event) => setSelectedRecipientSource(event.target.value)}
              title="Filter by source organization"
            >
              <option value="ALL">All sources</option>
              {recipientSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <label className="template-toggle-label" title="Default hides columns that are not owned by the source. Enable this only when a recipient must see all template columns.">
              <input
                type="checkbox"
                checked={previewSettings.showAllRecipientColumns}
                onChange={(event) =>
                  setPreviewSettings((current) => ({
                    ...current,
                    showAllRecipientColumns: event.target.checked,
                  }))
                }
              />
              Show all columns to recipients
            </label>
            {isRecipientLoading && <span className="template-inline-loader"><span className="spinner" /> Loading mappings</span>}
          </div>
        </div>
        <div className="template-summary-grid">
          <div><strong>{editableMeasureItems.length}</strong><span>Editable measures</span></div>
          <div><strong>{recipientGroups.length}</strong><span>Source groups</span></div>
          <div><strong>{recipientGroups.filter((group) => group.readiness === "READY").length}</strong><span>Ready groups</span></div>
          <div><strong>{recipientGroups.filter((group) => group.readiness !== "READY").length}</strong><span>Needs review</span></div>
        </div>
        <div className="template-recipient-table-wrap">
          <table className="template-recipient-table">
            <thead>
              <tr>
                <th>Source / Ministry</th>
                <th>Department</th>
                <th>Assigned Measures</th>
                <th>Data Entry Columns</th>
                <th>Cadence</th>
                <th>Template Grain</th>
                <th>Officers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecipientGroups.map((group) => (
                <tr key={group.key}>
                  <td><strong>{group.sourceName}</strong><small>{group.sourceCode}</small></td>
                  <td>{group.departmentName}</td>
                  <td>{group.measureLabels.map((label) => <span key={label} className="template-soft-chip">{label}</span>)}</td>
                  <td>{group.dataEntryColumnLabels.map((label) => <span key={label} className="template-soft-chip blue">{label}</span>)}</td>
                  <td>{group.periodicities.map((item) => <span key={item} className="template-soft-chip blue">{item}</span>)}</td>
                  <td>{group.grains.map((item) => <span key={item} className="template-soft-chip green">{item}</span>)}</td>
                  <td>{group.officers.map((item) => <span key={item} className="template-soft-chip gray">{item}</span>)}</td>
                  <td><span className={`template-readiness ${group.readiness.toLowerCase()}`}>{group.readiness.replaceAll("_", " ")}</span></td>
                </tr>
              ))}
              {!visibleRecipientGroups.length && (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    {recipientGroups.length
                      ? "No recipient rows match the selected source filter."
                      : "Add measures in Structure and map their source providers in Data Field Library before publishing."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderPreviewStep() {
    const validationEntries = Object.entries(columnValidations);
    const generatedInPreview = computedColumns.filter((column) =>
      builder.fields.some((field) => normalizeCode(field.code) === normalizeCode(column.code)),
    );
    const columnsForRecipient = (group: RecipientSourceGroup) => {
      const assignedMeasures = new Set(group.measureCodes.map(normalizeCode));
      return previewColumns.filter((column, index) => {
        if (column.generatedMeasure) {
          return generatedDataEntryColumns.some(
            (generated) => normalizeCode(generated.code) === normalizeCode(column.generatedMeasure?.code) && generated.showInDataEntry,
          );
        }
        if (previewSettings.showAllRecipientColumns) return Boolean(measureForColumn(index));
        const measure = measureForColumn(index);
        return Boolean(measure && assignedMeasures.has(normalizeCode(measure.sourceMeasureCode ?? measure.code)));
      });
    };
    return (
      <section className="template-work-card template-step-card">
        <div className="template-step-header">
          <div>
            <span>Preview</span>
            <h3>Final template contract preview</h3>
            <p>Review structure, recipients, validations, and generated outputs before publish.</p>
          </div>
        </div>
        <div className="template-preview-summary-grid">
          <div><span>Template</span><strong>{templateName(selectedTemplate)}</strong></div>
          <div><span>Version</span><strong>{textValue(selectedVersion?.title ?? selectedVersion?.version_code)}</strong></div>
          <div><span>Rows</span><strong>{previewRows.length}</strong></div>
          <div><span>Columns</span><strong>{previewColumns.length}</strong></div>
          <div><span>Editable Cells</span><strong>{Math.max(1, previewRows.length) * Math.max(1, previewColumns.length)}</strong></div>
          <div><span>Recipients</span><strong>{recipientGroups.length}</strong></div>
          <div><span>Validations</span><strong>{Object.keys(columnValidations).length}</strong></div>
          <div><span>Generated Outputs</span><strong>{computedColumns.length}</strong></div>
        </div>
        <div className="template-preview-contract-grid">
          <article>
            <span>Template Grain</span>
            <div className="template-preview-chip-list">
              {templateGrainLabels.length
                ? templateGrainLabels.map((label) => <em key={label}>{label}</em>)
                : <small>No grain configured.</small>}
            </div>
          </article>
          <article>
            <span>Row Headers</span>
            <div className="template-preview-chip-list">
              {activeRowLevels.length
                ? activeRowLevels.map((level, index) => <em key={level.id}>L{index + 1}: {level.items.map((item) => item.label).join(" / ")}</em>)
                : <small>No row headers.</small>}
            </div>
          </article>
          <article>
            <span>Column Headers</span>
            <div className="template-preview-chip-list">
              {activeColumnLevels.length
                ? activeColumnLevels.map((level, index) => <em key={level.id}>L{index + 1}: {level.items.map((item) => item.label).join(" / ")}</em>)
                : <small>No column headers.</small>}
            </div>
          </article>
          <article>
            <span>Fields To Fill</span>
            <div className="template-preview-chip-list">
              {builder.fields.length
                ? builder.fields.map((field) => (
                    <em key={field.id}>
                      {field.label} {field.generatedMode ? `(${field.generatedMode})` : "(editable)"}
                    </em>
                  ))
                : <small>No fields selected.</small>}
            </div>
          </article>
        </div>

        <div className="template-preview-section template-main-preview-section">
          <header>
            <div>
              <span>Main Template</span>
              <h4>Full configured output</h4>
            </div>
            <small>Includes editable columns plus generated outputs added to preview.</small>
          </header>
          {renderReadOnlyPreviewTable()}
        </div>

        <div className="template-preview-section template-recipient-preview-section">
          <header>
            <div>
              <span>Recipient Views</span>
              <h4>Source-specific template previews</h4>
            </div>
            <small>Each source sees the same grain with its assigned editable measures and allowed generated outputs.</small>
          </header>
          <div className="template-source-preview-list">
            {recipientGroups.length ? recipientGroups.map((group) => (
              <article key={group.key} className="template-source-preview-card">
                <header>
                  <div>
                    <strong>{group.sourceName}</strong>
                    <small>{group.departmentName && group.departmentName !== "-" ? group.departmentName : group.sourceCode}</small>
                  </div>
                  <span className={`template-readiness ${group.readiness.toLowerCase()}`}>{group.readiness.replaceAll("_", " ")}</span>
                </header>
                <div className="template-source-preview-meta">
                  <span>Measures: {group.measureLabels.join(" | ")}</span>
                  <span>Officers: {group.officers.join(" | ")}</span>
                  <span>Grain: {group.grains.join(" | ")}</span>
                </div>
                {columnsForRecipient(group).length
                  ? renderReadOnlyPreviewTable({ columns: columnsForRecipient(group), title: "Recipient Template" })
                  : <div className="template-empty-note">No visible columns for this source. Check source mappings and generated column visibility.</div>}
              </article>
            )) : <div className="template-empty-note">No source views are available yet.</div>}
          </div>
        </div>

        <div className="template-preview-two-column">
          <section className="template-preview-section">
            <header>
              <div>
                <span>Validation Rules</span>
                <h4>Configured column validations</h4>
              </div>
            </header>
            <div className="template-preview-rule-list">
              {validationEntries.length ? validationEntries.map(([key, rule]) => (
                <article key={key}>
                  <strong>{key.replace("column-repeat-label:", "")}</strong>
                  <span>{rule.requirement} | {rule.numericBehavior} | {rule.failureBehavior}</span>
                  <small>
                    Min {rule.minValue === "" ? "-" : rule.minValue} / Max {rule.maxValue === "" ? "-" : rule.maxValue}
                  </small>
                </article>
              )) : <div className="template-empty-note">No validations configured. Validation can be added later.</div>}
            </div>
          </section>

          <section className="template-preview-section">
            <header>
              <div>
                <span>Generated Outputs</span>
                <h4>Computed, calculated, and rollup columns</h4>
              </div>
            </header>
            <div className="template-preview-rule-list">
              {computedColumns.length ? computedColumns.map((column) => (
                <article key={column.code}>
                  <strong>{column.label}</strong>
                  <span>
                    {column.mode.toUpperCase()} | {column.outputUom || "No UOM"} | {generatedInPreview.some((item) => normalizeCode(item.code) === normalizeCode(column.code)) ? "In preview" : "Not in preview"}
                  </span>
                  <small>{column.showInDataEntry ? "Visible to data provider" : "Hidden from data provider"} | {column.formula}</small>
                </article>
              )) : <div className="template-empty-note">No generated outputs configured.</div>}
            </div>
          </section>
        </div>
      </section>
    );
  }

  function renderPublishStep() {
    return (
      <section className="template-work-card template-step-card">
        <div className="template-step-header">
          <div>
            <span>Publish</span>
            <h3>Readiness checks</h3>
            <p>Publish is allowed only when blocking contract checks are resolved.</p>
          </div>
          <span className={`template-publish-state ${publishBlockers.length ? "blocked" : "ready"}`}>
            {publishBlockers.length ? `${publishBlockers.length} blocker(s)` : "Ready to publish"}
          </span>
        </div>
        <div className="template-publish-checks">
          {publishChecks.map((check) => (
            <article key={check.label} className={`template-publish-check ${check.status.toLowerCase()}`}>
              <span>{check.status}</span>
              <strong>{check.label}</strong>
              <p>{check.detail}</p>
            </article>
          ))}
        </div>
        {publishBlockers.length > 0 && (
          <div className="template-publish-blocker-note">
            Backend publish also verifies source-provider readiness. Resolve missing Data Field source mappings before publishing.
          </div>
        )}
      </section>
    );
  }

  function renderWorkflowStep() {
    if (activeStep === "recipients") return renderRecipientsStep();
    if (activeStep === "preview") return renderPreviewStep();
    if (activeStep === "publish") return renderPublishStep();
    return null;
  }

  if (!isShellLoading && selectedTemplateCode && !selectedTemplate) {
    return (
      <section className="template-designer-page">
        <div className="template-designer-header">
          <div>
            <div className="breadcrumb-line">Home / Data Definition / Template Studio</div>
            <h2>Template Studio</h2>
          </div>
          <button className="secondary-button compact" type="button" onClick={() => navigate("/template/library")}>Library</button>
        </div>
        <div className="template-studio-empty-state">
          <FileSpreadsheet size={24} />
          <h3>Template not found</h3>
          <p>The selected template is not available for this unit or locale. Return to Template Library and open a valid template.</p>
          <button className="primary-button compact" type="button" onClick={() => navigate("/template/library")}>Back to Template Library</button>
        </div>
      </section>
    );
  }

  if (!isShellLoading && !isVersionListLoading && selectedTemplate && versions.length === 0 && !params.get("version_code")) {
    return (
      <section className="template-designer-page">
        <div className="template-designer-header">
          <div>
            <div className="breadcrumb-line">Home / Data Definition / Template Studio</div>
            <h2>Template Studio</h2>
          </div>
          <button className="secondary-button compact" type="button" onClick={() => navigate("/template/library")}>Library</button>
        </div>
        <div className="template-studio-empty-state">
          <Plus size={24} />
          <h3>Create a draft version first</h3>
          <p>Studio opens only after this template has a draft version. Use Add Version in Template Library, then open Studio for that version.</p>
          <button className="primary-button compact" type="button" onClick={() => navigate("/template/library")}>Back to Template Library</button>
        </div>
      </section>
    );
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
          <button className="secondary-button compact" type="button" onClick={() => void loadAll({ forceLibrary: true })} disabled={isShellLoading || isStudioHydrating}><RefreshCw size={13} /> Refresh</button>
          <button className="secondary-button compact" type="button" onClick={() => void saveStructureDraft()} disabled={isSaving || isPublishing || isStudioHydrating || isSelectedVersionFrozen}><Save size={13} /> Save</button>
          <button className="primary-button compact" type="button" onClick={handlePrimaryAction} disabled={isSaving || isPublishing || isStudioHydrating || isSelectedVersionFrozen || (activeStep === "publish" && publishBlockers.length > 0)}>
            <CheckCircle2 size={13} /> {isSelectedVersionFrozen ? "Published" : activeStep === "publish" ? (isPublishing ? "Publishing" : "Publish") : "Done"}
          </button>
        </div>
      </div>

      {notice && <div className="toast-notice success">{notice}</div>}
      {error && <div className="toast-notice error">{error}</div>}
      {isSelectedVersionFrozen && (
        <div className="template-lock-banner">
          <ShieldCheck size={15} />
          <span>Published template version is locked. Create a new version from Template Library to make changes.</span>
        </div>
      )}

      <div className={`template-designer-shell ${isStudioHydrating || isShellLoading ? "is-hydrating" : ""}`}>
        {(isStudioHydrating || isShellLoading) && (
          <div className="template-studio-loader" role="status" aria-live="polite">
            <span className="spinner" />
            <strong>{isShellLoading ? "Loading templates" : "Loading template design"}</strong>
            <small>
              {isShellLoading
                ? "Preparing template and version list."
                : "Preparing saved structure, preview bindings, formulas, and validation suggestions."}
            </small>
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
              <select value={selectedVersion?.version_code ?? selectedVersionCode} onChange={(event) => setSelectedVersionCode(event.target.value)}>
                {versions.length === 0 && selectedVersionCode && (
                  <option value={selectedVersionCode}>{selectedVersionCode}</option>
                )}
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
            <button className={activeLibraryTab === "dimensions" ? "active" : ""} type="button" disabled={isLibraryLoading} onClick={() => changeLibraryTab("dimensions")}>Dimensions</button>
            <button className={activeLibraryTab === "geography" ? "active" : ""} type="button" disabled={isLibraryLoading} onClick={() => changeLibraryTab("geography")}>Geography</button>
            <button className={activeLibraryTab === "time" ? "active" : ""} type="button" disabled={isLibraryLoading} onClick={() => changeLibraryTab("time")}>Time Period</button>
            <button className={activeLibraryTab === "measures" ? "active" : ""} type="button" disabled={isLibraryLoading} onClick={() => changeLibraryTab("measures")}>Measures</button>
          </div>
          {activeLibraryTab !== "measures" && (
            <div className="template-library-mode-row">
              <div className="template-library-mode-toggle" role="group" aria-label={`${activeLibraryTab} library mode`}>
                <button
                  className={libraryModes[activeLibraryTab] === "sets" ? "active" : ""}
                  type="button"
                  disabled={isLibraryLoading}
                  onClick={() => {
                    setLibrarySearch("");
                    setLibraryModes((current) => ({ ...current, [activeLibraryTab]: "sets" }));
                  }}
                >
                  Sets
                </button>
                <button
                  className={libraryModes[activeLibraryTab] === "members" ? "active" : ""}
                  type="button"
                  disabled={isLibraryLoading}
                  onClick={() => {
                    setLibrarySearch("");
                    setLibraryModes((current) => ({ ...current, [activeLibraryTab]: "members" }));
                  }}
                >
                  Members
                </button>
              </div>
              {activeLibraryTab === "time" && libraryModes.time === "sets" && (
                <button className="secondary-button compact" type="button" disabled={isLibraryLoading} onClick={() => setTimeSetDrawerOpen(true)}>
                  <Plus size={12} /> New Set
                </button>
              )}
            </div>
          )}
          <div key={`${activeLibraryTab}-${activeLibraryTab === "measures" ? "measures" : libraryModes[activeLibraryTab]}`} className="template-library-list">
            {isLibraryLoading ? (
              <div className="template-library-empty">Loading library...</div>
            ) : libraryItems.length === 0 ? (
              <div className="template-library-empty">No matching records.</div>
            ) : (
              libraryItems.map((item) => (
                <div
                  key={item.id}
                  className="template-library-item"
                  draggable={!isSelectedVersionFrozen}
                  onDragStart={(event) => onDragStart(event, item)}
                  title={`${libraryItemLabel(item)} | ${item.code}`}
                >
                  <GripVertical size={13} />
                  <span>
                    <strong>{libraryItemLabel(item)}</strong>
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

        <main className={`template-builder-workspace template-step-${activeStep}`}>
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
                    <details className="template-lang-menu">
                      <summary>Lang</summary>
                      <div>
                        <label>
                          <input
                            type="checkbox"
                            checked={previewSettings.bilingualLabels.geography}
                            onChange={(event) =>
                              setPreviewSettings((current) => ({
                                ...current,
                                bilingualLabels: { ...current.bilingualLabels, geography: event.target.checked },
                              }))
                            }
                          />
                          Geography Hindi
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={previewSettings.bilingualLabels.dimensions}
                            onChange={(event) =>
                              setPreviewSettings((current) => ({
                                ...current,
                                bilingualLabels: { ...current.bilingualLabels, dimensions: event.target.checked },
                              }))
                            }
                          />
                          Dimensions Hindi
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={previewSettings.bilingualLabels.measures}
                            onChange={(event) =>
                              setPreviewSettings((current) => ({
                                ...current,
                                bilingualLabels: { ...current.bilingualLabels, measures: event.target.checked },
                              }))
                            }
                          />
                          Measures Hindi
                        </label>
                      </div>
                    </details>
                    <button className="template-settings-button" type="button" title="Template preview settings" onClick={() => setSettingsDrawerOpen(true)}>
                      <Settings2 size={12} /> Settings
                    </button>
                  </div>
                </div>
                <div className="template-drop-grid">
                  <DropZoneCard title="Separate Into Tabs By" hint="e.g. Rural/Urban, Gender" zone="tabsBy" items={builder.tabsBy} onDropItem={onDrop} onRemove={removeDroppedItem} labelForItem={libraryItemLabel} />
                  <ColumnLevelsZone
                    title="Each Row Represents"
                    emptyHint="Drop country, state, district, time, or dimension set/member"
                    filledHint="Drop another item here or use View items to manage row levels."
                    levels={rowLevels}
                    activeLevelId={activeRowLevelId}
                    isItemsOpen={rowLevelItemsOpen}
                    onActiveLevelChange={setActiveRowLevelId}
                    onItemsOpenChange={setRowLevelItemsOpen}
                    onDropItem={onRowLevelDrop}
                    onAddLevel={addRowLevel}
                    onRemoveLevel={removeRowLevel}
                    onRemoveItem={removeRowLevelItem}
                    labelForItem={libraryItemLabel}
                  />
                  <ColumnLevelsZone
                    title="Show Across Columns"
                    emptyHint="Drop time period, geography, or dimension set/member"
                    filledHint="Drop another item here or use View items to manage selected items."
                    levels={columnLevels}
                    activeLevelId={activeColumnLevelId}
                    isItemsOpen={columnLevelItemsOpen}
                    onActiveLevelChange={setActiveColumnLevelId}
                    onItemsOpenChange={setColumnLevelItemsOpen}
                    onDropItem={onColumnLevelDrop}
                    onAddLevel={addColumnLevel}
                    onRemoveLevel={removeColumnLevel}
                    onRemoveItem={removeColumnLevelItem}
                    labelForItem={libraryItemLabel}
                  />
                  <DropZoneCard title="Fields To Fill" hint="Drop measures/data fields" zone="fields" items={builder.fields} onDropItem={onDrop} onRemove={removeDroppedItem} labelForItem={libraryItemLabel} />
                </div>
              </section>

              <section className="template-preview-card">
                <div className="template-preview-title">
                  <FileSpreadsheet size={15} />
                  <strong>Preview</strong>
                  <span>~{Math.max(1, previewRows.length) * Math.max(1, previewColumns.length)} editable cells</span>
                  {isSecondaryLabelLoading && <span className="template-secondary-label-status">Hindi labels loading...</span>}
                  <em>Drop directly on row headers, column headers, or cells.</em>
                </div>
                {isPreviewHydrating && (
                  <div className="template-preview-loader" role="status" aria-live="polite">
                    <span className="spinner" />
                    Loading saved preview structure...
                  </div>
                )}
                <div className="template-excel-wrap">
                  <table
                    className={`template-excel-table ${previewSettings.compactCells ? "compact" : ""} ${previewSettings.zebraRows ? "zebra" : ""}`}
                    style={{ minWidth: `${previewColumnMinWidth}px` }}
                  >
                    <thead>
                      {previewHeaderRows.map((row, rowIndex) => (
                        <tr key={`preview-header-level-${rowIndex}`}>
                          <th colSpan={previewRowHeaderCount}>{rowIndex === 0 ? "Column Groups" : ""}</th>
                          {row.map((cell, index) => (
                            <th key={`${cell.code}-${rowIndex}-${index}`} colSpan={cell.colSpan}>
                              {previewSettings.showCodes ? cell.code : cell.label}
                            </th>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        {Array.from({ length: previewRowHeaderCount }, (_, index) => {
                          const rowLevel = previewRowLevels[index];
                          const dropRowLevel = activeRowLevels[index];
                          return (
                            <th
                              key={`preview-row-header-${index}`}
                              className="preview-drop-target template-row-header-cell"
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => void onRowLevelDrop(event, dropRowLevel?.id ?? rowLevel?.id ?? `row-level-${index + 1}`)}
                              title={`Drop a dimension/geography/time set here to map row level ${index + 1}`}
                            >
                              <span className="template-preview-header-label">
                                {rowLevel?.items.map((item) => libraryItemLabel(item)).join(" / ") || (index === 0 ? "Drop row dimension" : `Row Level ${index + 1}`)}
                              </span>
                            </th>
                          );
                        })}
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
                                <button
                                  className={`template-column-validation-button ${isPublicationColumnEnabled(column, index) ? "configured" : ""}`}
                                  type="button"
                                  title={
                                    isPublicationColumnEnabled(column, index)
                                      ? "Included in final publication output"
                                      : "Excluded from final publication output"
                                  }
                                  onClick={(event) => togglePublicationColumn(event, column, index)}
                                >
                                  <CheckCircle2 size={11} />
                                </button>
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
                          {Array.from({ length: previewRowHeaderCount }, (_, levelIndex) => {
                            const part = row.path?.[levelIndex] ?? (levelIndex === 0 ? row : { code: "-", label: "-" });
                            return (
                              <td key={`${row.code}-row-level-${levelIndex}`} className={`template-row-header-cell ${row.generatedRollup ? "generated-rollup-row" : ""}`}>
                                {previewSettings.showCodes ? part.code : part.label}
                              </td>
                            );
                          })}
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
                              {row.generatedRollup ? (
                                <span className="computed-cell-preview" title={`${row.generatedRollup.label} derives ${row.generatedRollup.rollupAggregationMethod ?? "configured"} values from child rows`}>
                                  Auto
                                </span>
                              ) : column.generatedMeasure && !isIndividualGeneratedMeasure(column.generatedMeasure) ? (
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
            renderWorkflowStep()
          )}
        </main>
      </div>

      <div className="sticky-form-footer">
        <button className="ghost-button" type="button" onClick={goBack} disabled={isPublishing || isStudioHydrating}>Back</button>
        <button className="primary-button compact" type="button" onClick={handlePrimaryAction} disabled={isSaving || isPublishing || isStudioHydrating || (activeStep === "publish" && (isSelectedVersionFrozen || publishBlockers.length > 0))}>
          {activeStep === "publish" ? (isSelectedVersionFrozen ? "Published" : isPublishing ? "Publishing" : "Publish") : "Continue"}
        </button>
      </div>

      {validationDrawer && (
        <div className="drawer-backdrop">
          <aside className="side-drawer template-drawer template-form-drawer">
            <div className="drawer-header">
              <span>Column Validation</span>
              <h3>{validationDrawer.measure ? libraryItemLabel(validationDrawer.measure) : `Column ${validationDrawer.columnIndex + 1}`}</h3>
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
                <strong>{validationDrawer.measure ? libraryItemLabel(validationDrawer.measure) : "No measure mapped"}</strong>
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
              <h3>Computed, calculated, individual, and rollup values</h3>
              <button type="button" onClick={() => setSettingsDrawerOpen(false)}>x</button>
            </div>
            <div className="drawer-info-note">
              Use editable preview columns as inputs. Generated outputs are non-editable and should later be persisted through the approved template formula contract.
            </div>
            <div className="template-settings-tabs">
              {(["compute", "calculated", "individual", "rollup"] as SettingsTab[]).map((tab) => (
                <button
                  key={tab}
                  className={settingsTab === tab ? "active" : ""}
                  type="button"
                  onClick={() => setSettingsTab(tab)}
                >
                  {tab === "compute" ? "Compute" : tab === "calculated" ? "Calculated" : tab === "individual" ? "Individual Column" : "Rollup"}
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
                    <label>
                      Add under column group
                      <select value={selectedGeneratedTargetKey} onChange={(event) => setSelectedGeneratedTargetKey(event.target.value)}>
                        {generatedTargetOptions.length === 0 ? (
                          <option value="">Configure columns first</option>
                        ) : (
                          generatedTargetOptions.map((target) => (
                            <option key={target.key} value={target.key}>{target.label}</option>
                          ))
                        )}
                      </select>
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
                    <label>
                      Add under column group
                      <select value={selectedGeneratedTargetKey} onChange={(event) => setSelectedGeneratedTargetKey(event.target.value)}>
                        {generatedTargetOptions.length === 0 ? (
                          <option value="">Configure columns first</option>
                        ) : (
                          generatedTargetOptions.map((target) => (
                            <option key={target.key} value={target.key}>{target.label}</option>
                          ))
                        )}
                      </select>
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

            {settingsTab === "individual" && (
              <section className="template-settings-panel">
                <div className="template-settings-section-title">
                  <div>
                    <h4>Individual Column</h4>
                    <p>Add a standalone read-only column in all groups, one group, or after the selected group path.</p>
                  </div>
                  <span className="template-settings-badge">Manual</span>
                </div>
                <div className="template-validation-form">
                  <label>
                    Column name
                    <input value={computeName} onChange={(event) => setComputeName(event.target.value)} placeholder="e.g. Remarks total" />
                  </label>
                  <label>
                    UOM / label
                    <input value={calculatedOutputUom} onChange={(event) => setCalculatedOutputUom(event.target.value)} placeholder="e.g. Number" />
                  </label>
                  <label>
                    Add under column group
                    <select value={selectedGeneratedTargetKey} onChange={(event) => setSelectedGeneratedTargetKey(event.target.value)}>
                      {generatedTargetOptions.length === 0 ? (
                        <option value="">Configure columns first</option>
                      ) : (
                        generatedTargetOptions.map((target) => (
                          <option key={target.key} value={target.key}>{target.label}</option>
                        ))
                      )}
                    </select>
                  </label>
                  <label className="template-validation-wide">
                    Note / purpose
                    <textarea
                      rows={3}
                      value={computeFormula === "INDIVIDUAL_COLUMN" ? "" : computeFormula}
                      onChange={(event) => setComputeFormula(event.target.value)}
                      placeholder="Optional note for reviewers"
                    />
                  </label>
                </div>
              </section>
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
                      <header>
                        <strong>{column.label}</strong>
                      </header>
                      <span>
                        {column.mode.toUpperCase()} | {column.outputUom} | {column.mode === "rollup" ? "Row aggregate" : column.repeatForAllGroups ? "All groups" : column.targetGroupLabel || "Template output"} | {column.showInDataEntry ? "Visible to provider" : "Hidden from provider"}
                      </span>
                      <small>{column.formula}</small>
                      <div className="template-computed-action-row">
                        <button
                          className="secondary-button compact"
                          type="button"
                          disabled={column.showInPreview !== false}
                          onClick={() => addGeneratedColumnToPreview(column)}
                        >
                          {column.showInPreview !== false ? "In Preview" : "Show Preview"}
                        </button>
                        <label className="template-toggle-label compact" title="Generated columns are hidden from data-entry recipients by default. Enable only when the data provider should see this read-only output.">
                          <input
                            type="checkbox"
                            checked={Boolean(column.showInDataEntry)}
                            onChange={() => toggleGeneratedColumnDataEntryVisibility(column.code)}
                          />
                          Show Data Entry
                        </label>
                        <button
                          className="danger-button compact"
                          type="button"
                          onClick={() => removeGeneratedColumn(column)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <div className="drawer-footer">
              <button className="ghost-button" type="button" onClick={() => setSettingsDrawerOpen(false)}>Cancel</button>
              <button className="primary-button" type="button" onClick={() => addComputedColumn(settingsTab)}>
                Add {settingsTab === "rollup" ? "Rollup" : settingsTab === "individual" ? "Individual" : settingsTab === "calculated" ? "Calculated" : "Computed"} Column
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
  labelForItem,
}: {
  title: string;
  hint: string;
  zone: DropZone;
  items: LibraryItem[];
  onDropItem: (event: DragEvent, zone: DropZone) => Promise<void>;
  onRemove: (zone: DropZone, id: string) => void;
  labelForItem?: (item: LibraryItem) => string;
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
              {labelForItem ? labelForItem(item) : item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColumnLevelsZone({
  title = "Show Across Columns",
  emptyHint = "Drop time period, geography, or dimension set/member",
  filledHint = "Drop another item here or use View items to manage selected items.",
  levels,
  activeLevelId,
  isItemsOpen,
  onActiveLevelChange,
  onItemsOpenChange,
  onDropItem,
  onAddLevel,
  onRemoveLevel,
  onRemoveItem,
  labelForItem,
}: {
  title?: string;
  emptyHint?: string;
  filledHint?: string;
  levels: ColumnLevel[];
  activeLevelId: string;
  isItemsOpen: boolean;
  onActiveLevelChange: (levelId: string) => void;
  onItemsOpenChange: (isOpen: boolean) => void;
  onDropItem: (event: DragEvent, levelId: string) => Promise<void>;
  onAddLevel: () => void;
  onRemoveLevel: (levelId: string) => void;
  onRemoveItem: (levelId: string, itemId: string) => void;
  labelForItem: (item: LibraryItem) => string;
}) {
  const activeLevel = levels.find((level) => level.id === activeLevelId) ?? levels[0] ?? makeColumnLevel(0);
  const activeLevelNumber = Math.max(1, levels.findIndex((level) => level.id === activeLevel.id) + 1);
  const itemCount = activeLevel.items.length;
  return (
    <div className="template-column-levels-zone">
      <div className="template-column-levels-title">
        <div>
          <span>{title}</span>
        </div>
        <div className="template-column-active-row">
          {levels.length > 1 ? (
            <select value={activeLevel.id} onChange={(event) => onActiveLevelChange(event.target.value)}>
              {levels.map((level, index) => (
                <option key={level.id} value={level.id}>Level {index + 1}</option>
              ))}
            </select>
          ) : (
            <strong>Level 1</strong>
          )}
          <button type="button" onClick={onAddLevel}>+ Level</button>
          {levels.length > 1 && (
            <button className="template-column-level-remove" type="button" onClick={() => onRemoveLevel(activeLevel.id)} title="Remove active column level">
              x
            </button>
          )}
        </div>
      </div>
      <div
        className={`template-column-active-drop ${itemCount ? "has-items" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => void onDropItem(event, activeLevel.id)}
      >
        <div>
          <strong>Level {activeLevelNumber}</strong>
          <em>{itemCount ? filledHint : emptyHint}</em>
        </div>
        <button type="button" onClick={() => onItemsOpenChange(true)}>
          {itemCount ? `${itemCount} item${itemCount === 1 ? "" : "s"}` : "View items"}
        </button>
      </div>
      {isItemsOpen && (
        <div className="template-column-level-popup" role="dialog" aria-label="Column level items">
          <div className="template-column-level-popup-header">
            <div>
              <span>{title}</span>
              <strong>Level {activeLevelNumber} Items</strong>
            </div>
            <button type="button" onClick={() => onItemsOpenChange(false)} aria-label="Close column level items">
              <X size={14} />
            </button>
          </div>
          <div className="template-column-level-popup-list">
            {levels.map((level, index) => (
              <section key={level.id}>
                <h4>Level {index + 1}</h4>
                {level.items.length === 0 ? (
                  <p>No items added.</p>
                ) : (
                  level.items.map((item) => (
                    <div key={item.id} className="template-column-level-popup-item">
                      <div>
                        <strong>{labelForItem(item)}</strong>
                        <small>{item.type.replace("_", " ")} | {item.code}</small>
                      </div>
                      <button type="button" onClick={() => onRemoveItem(level.id, item.id)}>Remove</button>
                    </div>
                  ))
                )}
              </section>
            ))}
          </div>
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
