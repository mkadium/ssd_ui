import { ArrowLeft, CheckCircle2, Download, EyeOff, FileSpreadsheet, Info, MessageSquarePlus, Paperclip, Pin, Plus, RefreshCw, Save, ShieldCheck, Upload, X } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { listDataFields } from "../../api/data-fields.api";
import { listDimensionMembers, listDimensionMemberSetMembers, listGeographies } from "../../api/dimensions.api";
import {
  deactivateRequestAccessDerivedTimePeriodSet,
  getRequestAccessSession,
  saveRequestAccessDataEntryDraft,
  saveRequestAccessDerivedTimePeriodSet,
  submitRequestAccessDataEntry,
  type RequestAccessAssignment,
  type RequestAccessSessionDetail,
} from "../../api/requests.api";

function text(value: unknown, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

type PreviewPart = { code: string; label: string };
type PreviewRow = PreviewPart & { path: PreviewPart[]; addedPeriod?: boolean };
type PreviewColumn = PreviewPart & { path: PreviewPart[]; groupCode?: string; groupLabel?: string; measure?: Record<string, unknown>; generatedMeasure?: Record<string, unknown>; addedPeriod?: boolean };
type PreviewHeaderCell = PreviewPart & { colSpan: number };
type CellKey = string;
type PreviewOptions = {
  showCodes: boolean;
  zebraRows: boolean;
  compactCells: boolean;
  editablePreview: boolean;
  bilingualLabels: {
    geography: boolean;
    dimensions: boolean;
    measures: boolean;
  };
};
type DataEntryAttachment = {
  id: string;
  name: string;
  filename?: string;
  size: number;
  contentType?: string;
  contentBase64?: string;
};

function cartesian(parts: PreviewPart[][]): PreviewRow[] {
  if (!parts.length) return [];
  return parts.reduce<PreviewRow[]>((current, level) => {
    if (!current.length) return level.map((item) => ({ ...item, path: [item] }));
    return current.flatMap((parent) =>
      level.map((item) => ({
        code: `${parent.code}:${item.code}`,
        label: item.label,
        path: [...parent.path, item],
      })),
    );
  }, []);
}

function groupedHeaderRows(columns: PreviewColumn[], levelCount: number): PreviewHeaderCell[][] {
  if (!levelCount) return [];
  return Array.from({ length: levelCount }, (_, levelIndex) => {
    const cells: (PreviewHeaderCell & { groupKey: string })[] = [];
    columns.forEach((column) => {
      const part = column.path[levelIndex] ?? { code: column.code, label: column.label };
      const groupKey = column.path
        .slice(0, levelIndex + 1)
        .map((pathPart) => `${pathPart.code}:${pathPart.label}`)
        .join(">");
      const previous = cells[cells.length - 1];
      if (previous?.groupKey === groupKey) {
        previous.colSpan += 1;
      } else {
        cells.push({ ...part, colSpan: 1, groupKey });
      }
    });
    return cells.map(({ groupKey: _groupKey, ...cell }) => cell);
  });
}

const ALL_GENERATED_GROUPS_KEY = "__ALL_COLUMN_GROUPS__";

function previewPathKey(path: PreviewPart[] | undefined) {
  return (path ?? []).map((part) => normalize(part.code || part.label)).filter(Boolean).join(">");
}

function isPathPrefix(targetPath: PreviewPart[] | undefined, columnPath: PreviewPart[] | undefined) {
  const target = targetPath ?? [];
  const path = columnPath ?? [];
  if (!target.length || target.length > path.length) return false;
  return target.every((part, index) => normalize(part.code || part.label) === normalize(path[index]?.code || path[index]?.label));
}

function generatedFieldsFromStudio(studioState: Record<string, unknown>, includeDataEntryOnly: boolean) {
  return asArray(studioState.computedColumns)
    .filter((field) => text(field.mode, "").toLowerCase() !== "rollup")
    .filter((field) => field.showInPreview !== false)
    .filter((field) => !includeDataEntryOnly || field.showInDataEntry === true)
    .map((field) => ({
      ...field,
      type: "MEASURE",
      generatedMode: text(field.mode, "compute"),
      code: text(field.code, ""),
      label: text(field.label ?? field.code),
      badge: text(field.outputUom, "Calculated"),
    }))
    .filter((field) => field.code);
}

function axisCodesByRole(axes: Record<string, unknown>[], role: string) {
  return axes
    .filter((axis) => text(axis.axis_role, "").toUpperCase() === role)
    .sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0))
    .map((axis) => text(axis.axis_code, ""));
}

function labelsForAxis(axisCode: string, members: Record<string, unknown>[]) {
  return members
    .filter((member) => text(member.axis_code, "") === axisCode)
    .sort((left, right) => Number(left.member_order ?? 0) - Number(right.member_order ?? 0))
    .map((member) => ({
      code: text(member.member_code, ""),
      label: text(member.name ?? member.short_name ?? member.member_code),
    }))
    .filter((item) => item.code);
}

function measureCode(measure: Record<string, unknown>) {
  return text(measure.measure_code ?? measure.measureCode, "");
}

function measureLabel(measure: Record<string, unknown>) {
  return text(measure.label ?? measure.measure_label ?? measureCode(measure));
}

function measureUom(measure: Record<string, unknown>) {
  return text(measure.measureUnitCode ?? measure.measure_unit_code ?? measure.unit_code ?? measure.uom ?? measure.badge, "");
}

function generatedMode(measure?: Record<string, unknown> | null) {
  return text(measure?.generatedMode ?? measure?.generated_mode ?? measure?.mode ?? measure?.formula_type, "").toLowerCase();
}

function isIndividualColumn(column: PreviewColumn, detail?: { measure?: Record<string, unknown> | null }) {
  return generatedMode(column.generatedMeasure) === "individual" || generatedMode(detail?.measure) === "individual";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter((value) => value && value !== "-")));
}

function normalize(value: unknown) {
  return text(value, "").trim().toUpperCase();
}

function assignmentIndicatorDisplay(assignment: RequestAccessAssignment) {
  const number = assignment.indicatorNumber || assignment.indicatorCode || "";
  const name = assignment.indicatorName || assignment.indicatorLabel || "";
  if (number && name && name !== number) return `${number} - ${name}`;
  return name || number || "-";
}

function assignmentIndicatorName(assignment: RequestAccessAssignment, measures: Record<string, unknown>[]) {
  const direct = meaningful(assignment.indicatorName);
  if (direct && direct !== assignment.indicatorCode && direct !== assignment.indicatorNumber) return direct;
  const label = meaningful(assignment.indicatorLabel);
  if (label && label !== assignment.indicatorCode && label !== assignment.indicatorNumber) return label;
  return measureLabel(measures[0] ?? {}) || "-";
}

function arrayFromRecord(record: Record<string, unknown>, key: string) {
  return Array.isArray(record[key]) ? (record[key] as Record<string, unknown>[]) : [];
}

function levelItems(levels: Record<string, unknown>[], fallback: Record<string, unknown>[]) {
  const populated = levels
    .map((level) => arrayFromRecord(level, "items"))
    .filter((items) => items.length);
  return populated.length ? populated : fallback.length ? [fallback] : [];
}

function levelHeaderLabels(levels: Record<string, unknown>[], fallbackCodes: string[], fallbackLabel: string) {
  const labels = levels
    .map((level) => {
      const itemLabels = arrayFromRecord(level, "items").map((item) => text(item.label ?? item.name ?? item.code, "")).filter(Boolean);
      if (itemLabels.length) return itemLabels.join(" / ");
      return text(level.label ?? level.name ?? level.title, "");
    })
    .filter(Boolean);
  if (labels.length) return labels;
  return fallbackCodes.length ? fallbackCodes : [fallbackLabel];
}

function bilingualScopeForItem(item: Record<string, unknown>) {
  const type = text(item.type, "");
  if (type.startsWith("GEOGRAPHY")) return "geography";
  if (type.startsWith("DIMENSION")) return "dimensions";
  if (type === "MEASURE") return "measures";
  return "";
}

function bilingualText(primary: string, secondary?: string | null) {
  const cleanPrimary = text(primary, "");
  const cleanSecondary = text(secondary, "");
  if (!cleanSecondary || cleanSecondary === "-" || cleanSecondary === cleanPrimary) return cleanPrimary;
  return `${cleanSecondary} / ${cleanPrimary}`;
}

function labelsForStudioItem(
  item: Record<string, unknown>,
  cache: Record<string, unknown>,
  options?: PreviewOptions,
  secondaryMemberLabelCache: Record<string, Record<string, string>> = {},
  secondaryMeasureLabelCache: Record<string, string> = {},
): PreviewPart[] {
  const type = text(item.type, "");
  const code = text(item.code, "");
  const scope = bilingualScopeForItem(item);
  const id = text(item.id, code);
  const bilingual = scope ? Boolean(options?.bilingualLabels[scope as keyof PreviewOptions["bilingualLabels"]]) : false;
  const baseLabel = text(item.label, code);
  const label = bilingual
    ? type === "MEASURE"
      ? bilingualText(baseLabel, secondaryMeasureLabelCache[code])
      : bilingualText(baseLabel, secondaryMemberLabelCache[id]?.[code])
    : baseLabel;
  if (!type.endsWith("_SET")) return [{ code, label }];
  const cached = asArray(cache[code]);
  const secondaryLabels = secondaryMemberLabelCache[id] ?? secondaryMemberLabelCache[code] ?? {};
  return cached.length
    ? cached.map((member) => {
        const memberCode = text(member.code, "");
        const memberLabel = text(member.label ?? member.name ?? member.code);
        return { code: memberCode, label: bilingual ? bilingualText(memberLabel, secondaryLabels[memberCode]) : memberLabel };
      }).filter((member) => member.code)
    : [{ code, label }];
}

function measureColumnKey(column: PreviewColumn, columnIndex: number) {
  if (column.generatedMeasure) {
    return `column-generated:${normalize(column.groupCode ?? column.code)}:${normalize(measureCode(column.generatedMeasure))}`;
  }
  if (column.groupCode) return `column-repeat-label:${normalize(column.label)}`;
  return `column:${columnIndex}`;
}

function publicationColumnEnabled(studioState: Record<string, unknown>, column: PreviewColumn, columnIndex: number) {
  const map = asRecord(studioState.publicationColumns);
  const key = measureColumnKey(column, columnIndex);
  return map[key] === true;
}

function studioMeasureForColumn(column: PreviewColumn, columnIndex: number, fields: Record<string, unknown>[], cellMap: Record<string, unknown>) {
  const columnKey = measureColumnKey(column, columnIndex);
  const override = asRecord(cellMap[columnKey]);
  if (override.code) return override;
  return fields.find((field) => !field.generatedMode) ?? null;
}

function measureTitle(measure: Record<string, unknown>) {
  return `Fill data for:\n${measureLabel(measure)}\nUOM: ${measureUom(measure) || "Not mapped"}\nCode: ${measureCode(measure)}`;
}

function validationSummary(config: Record<string, unknown> | null | undefined) {
  if (!config || !Object.keys(config).length) return "No validation configured for this column.";
  const requirement = text(config.requirement, "") === "REQUIRED" ? "Value is required." : "Value is optional.";
  const behavior = text(config.failureBehavior, "WARNING") === "BLOCK" ? "Invalid values will be blocked." : "Invalid values will show a warning.";
  const numericBehavior = text(config.numericBehavior, "");
  const minValue = meaningful(config.minValue);
  const maxValue = meaningful(config.maxValue);
  let range = "Any numeric value is accepted.";
  if (numericBehavior === "NON_NEGATIVE") range = "Value must be zero or greater.";
  if (numericBehavior === "MIN_ONLY") range = `Value must be at least ${minValue || "the configured minimum"}.`;
  if (numericBehavior === "MAX_ONLY") range = `Value must be at most ${maxValue || "the configured maximum"}.`;
  if (numericBehavior === "MIN_MAX") range = `Value must be between ${minValue || "minimum"} and ${maxValue || "maximum"}.`;
  return `${requirement} ${range} ${behavior}`;
}

function validationStatus(config: Record<string, unknown> | null | undefined) {
  if (!config || !Object.keys(config).length) return "none";
  return text(config.failureBehavior, "WARNING") === "WARNING" ? "warning" : "passed";
}

function evaluateValidation(value: string, required: boolean, config: Record<string, unknown> | null | undefined) {
  const clean = value.trim();
  if (!clean) {
    return required ? { passed: false, message: "Value is required." } : { passed: true, message: "" };
  }
  const numeric = Number(clean);
  if (!Number.isFinite(numeric)) return { passed: false, message: "Only numeric values are allowed." };
  const numericBehavior = text(config?.numericBehavior, "");
  const minValue = meaningful(config?.minValue);
  const maxValue = meaningful(config?.maxValue);
  const min = minValue ? Number(minValue) : null;
  const max = maxValue ? Number(maxValue) : null;
  if (numericBehavior === "NON_NEGATIVE" && numeric < 0) return { passed: false, message: "Value must be zero or greater." };
  if ((numericBehavior === "MIN_ONLY" || numericBehavior === "MIN_MAX") && min !== null && numeric < min) {
    return { passed: false, message: `Value must be at least ${min}.` };
  }
  if ((numericBehavior === "MAX_ONLY" || numericBehavior === "MIN_MAX") && max !== null && numeric > max) {
    return { passed: false, message: `Value must be at most ${max}.` };
  }
  return { passed: true, message: "" };
}

function inferPeriodicityFromStudio(studioState: Record<string, unknown>, columns: PreviewColumn[]) {
  const years = unique(
    columns
      .flatMap((column) => column.path)
      .map((part) => text(part.label, ""))
      .filter((label) => /^\d{4}$/.test(label)),
  )
    .map(Number)
    .sort((left, right) => left - right);
  if (years.length >= 2) {
    const gap = years[1] - years[0];
    if (gap === 1) return "Annual";
    if (gap > 1) return `Every ${gap} years`;
  }
  const levelItems = asArray(studioState.columnLevels).flatMap((level) => arrayFromRecord(level, "items"));
  const timeItem = levelItems.find((item) => text(item.type, "").startsWith("TIME_"));
  const timeLabel = text(timeItem?.label, "");
  if (timeLabel && !/sequence|set|members/i.test(timeLabel)) return timeLabel;
  return "";
}

function boolPolicy(policy: Record<string, unknown>, key: string, fallback: boolean) {
  const accessRules = asRecord(policy.accessRules ?? policy.access_rules);
  const dataEntryRules = asRecord(policy.dataEntryRules ?? policy.data_entry_rules);
  const submissionControls = asRecord(policy.submissionControls ?? policy.submission_controls);
  const submissionMethods = asRecord(policy.submissionMethods ?? policy.submission_methods);
  const aliases: Record<string, string[]> = {
    allowDraftSave: ["allowDraftSave", "saveDraftAllowed"],
    allowSubmit: ["allowSubmit", "openSubmit", "webForm"],
    allowAttachments: ["allowAttachments", "excelUpload"],
    allowMissingValueWithRemarks: ["allowMissingValueWithRemarks"],
  };
  const keys = aliases[key] ?? [key];
  const value = keys
    .map((candidate) => dataEntryRules[candidate] ?? submissionControls[candidate] ?? submissionMethods[candidate] ?? accessRules[candidate] ?? policy[candidate])
    .find((candidate) => candidate !== undefined);
  return value === undefined ? fallback : value !== false;
}

function previewOptionsFromSettings(settings: Record<string, unknown>): PreviewOptions {
  return {
    showCodes: Boolean(settings.showCodes),
    zebraRows: settings.zebraRows !== false,
    compactCells: settings.compactCells !== false,
    editablePreview: settings.editablePreview !== false,
    bilingualLabels: {
      geography: Boolean(asRecord(settings.bilingualLabels).geography),
      dimensions: Boolean(asRecord(settings.bilingualLabels).dimensions),
      measures: Boolean(asRecord(settings.bilingualLabels).measures),
    },
  };
}

function policyCertification(policy: Record<string, unknown>) {
  const settings = asRecord(policy.certificationSettings ?? policy.certification_settings);
  const required = settings.ministryMustCertify !== false && settings.certificationRequired !== false;
  return {
    required,
    text: text(
      settings.certificationText ?? settings.certification_text,
      "I certify that the submitted data has been verified by the concerned department and is correct to the best of my knowledge.",
    ),
  };
}

function cellKey(row: PreviewRow, column: PreviewColumn) {
  return `${row.code}::${column.code}`;
}

function numericValue(value: string) {
  return value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

function meaningful(value: unknown) {
  const next = text(value, "").trim();
  return next && next !== "-" ? next : "";
}

function timePeriodCodeFromLabel(label: string) {
  const clean = label.trim();
  return /^\d{4}$/.test(clean) ? `CALENDAR_YEAR_${clean}` : clean.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

function samePeriod(left: unknown, right: unknown) {
  const leftText = text(left, "").trim();
  const rightText = text(right, "").trim();
  if (!leftText || !rightText) return false;
  return leftText === rightText || normalize(leftText) === normalize(rightText) || normalize(timePeriodCodeFromLabel(leftText)) === normalize(timePeriodCodeFromLabel(rightText));
}

function excelCellText(value: unknown) {
  return text(value, "").replace(/\s+/g, " ").trim();
}

function excelColumnHeader(column: PreviewColumn, showCodes: boolean) {
  return column.path.map((part) => showCodes ? part.code : part.label).filter(Boolean).join(" / ") || column.label || column.code;
}

function excelRowHeader(row: PreviewRow, showCodes: boolean) {
  return row.path.map((part) => showCodes ? part.code : part.label).filter(Boolean).join(" / ") || row.label || row.code;
}

function importedNumericText(value: unknown) {
  if (value === undefined || value === null) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const cleaned = raw.replace(/,/g, "");
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? cleaned : "";
}

function csvValue(value: unknown) {
  const clean = text(value, "").replace(/\r?\n/g, " ");
  return /[",\n]/.test(clean) ? `"${clean.replace(/"/g, '""')}"` : clean;
}

function parseCsv(textContent: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < textContent.length; index += 1) {
    const char = textContent[index];
    const next = textContent[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => item !== "") || rows.length) rows.push(row);
  return rows;
}

function downloadTextFile(filename: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function fileToDataEntryAttachment(file: File): Promise<DataEntryAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`${file.name} could not be read.`));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve({
        id: `${file.name}-${file.size}-${Date.now()}`,
        name: file.name,
        filename: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
        contentBase64: result.split(",", 2)[1] ?? result,
      });
    };
    reader.readAsDataURL(file);
  });
}

function timePeriodStateSignature(
  additions: PreviewPart[],
  overrides: Record<string, string>,
  removed: string[],
) {
  return JSON.stringify({
    additions: additions.map((period) => [period.code, period.label]).sort(),
    overrides: Object.entries(overrides).sort(),
    removed: [...removed].sort(),
  });
}

function assignmentOpenError(caught: unknown, fallback: string) {
  const message = caught instanceof Error ? caught.message : "";
  if (/database request/i.test(message)) {
    return "Assignment preview could not be opened right now. Please refresh or contact SSD support if this link was recently issued.";
  }
  return message || fallback;
}

const DataEntryCell = memo(function DataEntryCell({
  cellId,
  ariaLabel,
  disabled,
  required,
  selected,
  value,
  remark,
  canRemark,
  onCommit,
  onSelect,
  onOpenRemark,
}: {
  cellId: string;
  ariaLabel: string;
  disabled: boolean;
  required: boolean;
  selected: boolean;
  value: string;
  remark: string;
  canRemark: boolean;
  onCommit: (key: string, value: string) => void;
  onSelect: (key: string) => void;
  onOpenRemark: (key: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="request-data-entry-cell">
      <input
        aria-label={ariaLabel}
        className={required ? "required" : ""}
        disabled={disabled}
        inputMode="decimal"
        placeholder={required ? "Required" : ""}
        value={draft}
        onBlur={() => onCommit(cellId, draft)}
        onChange={(event) => setDraft(numericValue(event.target.value))}
        onFocus={() => onSelect(cellId)}
      />
      <button
        type="button"
        title="Add correction or missing-value remark"
        className={remark || selected ? "has-remark" : ""}
        disabled={!canRemark}
        onClick={() => onOpenRemark(cellId)}
      >
        <MessageSquarePlus size={12} />
      </button>
    </div>
  );
});

export function RequestDataEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = searchParams.get("session") ?? "";
  const runItemCode = searchParams.get("run_item_code") ?? "";
  const [detail, setDetail] = useState<RequestAccessSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCellKey, setSelectedCellKey] = useState<CellKey>("");
  const [cellValues, setCellValues] = useState<Record<CellKey, string>>({});
  const [cellRemarks, setCellRemarks] = useState<Record<CellKey, string>>({});
  const [remarkDraft, setRemarkDraft] = useState("");
  const [remarkPopupKey, setRemarkPopupKey] = useState<CellKey>("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [isMissingSubmitOpen, setIsMissingSubmitOpen] = useState(false);
  const [additionalTimePeriods, setAdditionalTimePeriods] = useState<PreviewPart[]>([]);
  const [timePeriodOverrides, setTimePeriodOverrides] = useState<Record<string, string>>({});
  const [removedTimePeriodCodes, setRemovedTimePeriodCodes] = useState<string[]>([]);
  const [activeTimeEdit, setActiveTimeEdit] = useState("");
  const [timeEditDraft, setTimeEditDraft] = useState("");
  const [timeEditWarning, setTimeEditWarning] = useState("");
  const [validationPopupKey, setValidationPopupKey] = useState("");
  const [frozenColumnCount, setFrozenColumnCount] = useState(0);
  const [freezeRowHeaders, setFreezeRowHeaders] = useState(true);
  const [hiddenColumnGroups, setHiddenColumnGroups] = useState<string[]>([]);
  const [isTimeSetPromptOpen, setIsTimeSetPromptOpen] = useState(false);
  const [isDerivedTimeSetSaved, setIsDerivedTimeSetSaved] = useState(true);
  const [isSavingTimeSet, setIsSavingTimeSet] = useState(false);
  const [derivedTimeSetCode, setDerivedTimeSetCode] = useState("");
  const [loadedDerivedTimeSetCode, setLoadedDerivedTimeSetCode] = useState("");
  const [loadedTimePeriodSignature, setLoadedTimePeriodSignature] = useState(timePeriodStateSignature([], {}, []));
  const [deletedDerivedTimeSetCodes, setDeletedDerivedTimeSetCodes] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<DataEntryAttachment[]>([]);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [previewOptions, setPreviewOptions] = useState<PreviewOptions>(() => previewOptionsFromSettings({}));
  const [hasTouchedPreviewOptions, setHasTouchedPreviewOptions] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [secondaryMemberLabelCache, setSecondaryMemberLabelCache] = useState<Record<string, Record<string, string>>>({});
  const [secondaryMeasureLabelCache, setSecondaryMeasureLabelCache] = useState<Record<string, string>>({});

  function goBackToAssignedList() {
    const token = searchParams.get("token");
    if (token) {
      navigate(`/request-access?${new URLSearchParams({ token, verified: "1", session }).toString()}`);
      return;
    }
    navigate(-1);
  }

  async function loadDetail() {
    if (!session) {
      setError("Request access session is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setDetail(await getRequestAccessSession(session, runItemCode));
    } catch (caught) {
      setError(assignmentOpenError(caught, "Assignment could not be opened."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDetail();
  }, [session, runItemCode]);

  const assignment = useMemo<RequestAccessAssignment>(() => detail?.assignment ?? {}, [detail]);
  const dispatch = detail?.dispatch ?? {};
  const policy = useMemo(() => asRecord(detail?.policy), [detail?.policy]);
  const templateContract = useMemo(() => asRecord(assignment.templateContract), [assignment.templateContract]);
  const studioState = useMemo(() => asRecord(templateContract.studioState), [templateContract]);
  const builder = useMemo(() => asRecord(studioState.builder), [studioState]);
  const previewMemberCache = useMemo(() => asRecord(templateContract.previewMemberCache), [templateContract]);
  const cellMap = useMemo(() => asRecord(studioState.cellMap), [studioState]);
  const columnValidationMap = useMemo(() => asRecord(studioState.columnValidations), [studioState]);
  const previewSettings = useMemo(() => asRecord(studioState.previewSettings), [studioState]);
  const builderFields = useMemo(() => asArray(builder.fields), [builder]);
  const axes = useMemo(() => asArray(templateContract.axes), [templateContract]);
  const axisMembers = useMemo(() => asArray(templateContract.axisMembers), [templateContract]);
  const measures = useMemo(() => asArray(assignment.measures?.length ? assignment.measures : templateContract.measures), [assignment.measures, templateContract]);
  const validations = useMemo(() => asArray(assignment.validations), [assignment.validations]);
  const valueBindings = useMemo(() => asArray(asRecord(templateContract.dataEntryContract).valueBindings ?? templateContract.dataEntryCellBindings), [templateContract]);
  const rowAxisCodes = useMemo(() => axisCodesByRole(axes, "ROW"), [axes]);
  const columnAxisCodes = useMemo(() => axisCodesByRole(axes, "COLUMN"), [axes]);
  const rowHeaderLabels = useMemo(
    () => levelHeaderLabels(asArray(studioState.rowLevels), rowAxisCodes, "Row"),
    [rowAxisCodes, studioState],
  );
  const studioRowLevelParts = useMemo(() => {
    return levelItems(asArray(studioState.rowLevels), asArray(builder.rowRepresents))
      .map((items) => items.flatMap((item) => text(item.type, "") === "MEASURE" ? [] : labelsForStudioItem(item, previewMemberCache, previewOptions, secondaryMemberLabelCache, secondaryMeasureLabelCache)))
      .filter((parts) => parts.length);
  }, [builder, previewMemberCache, previewOptions, secondaryMeasureLabelCache, secondaryMemberLabelCache, studioState]);
  const studioColumnLevelParts = useMemo(() => {
    return levelItems(asArray(studioState.columnLevels), asArray(builder.columns))
      .map((items) => items.flatMap((item) => labelsForStudioItem(item, previewMemberCache, previewOptions, secondaryMemberLabelCache, secondaryMeasureLabelCache)))
      .filter((parts) => parts.length);
  }, [builder, previewMemberCache, previewOptions, secondaryMeasureLabelCache, secondaryMemberLabelCache, studioState]);
  const originalTimeSetCode = useMemo(() => {
    const items = asArray(studioState.columnLevels).flatMap((level) => arrayFromRecord(level, "items"));
    return text(items.find((item) => text(item.type, "").startsWith("TIME_"))?.code, "");
  }, [studioState]);
  const studioTabParts = useMemo(() => {
    return asArray(builder.tabsBy).flatMap((item) => labelsForStudioItem(item, previewMemberCache, previewOptions, secondaryMemberLabelCache, secondaryMeasureLabelCache));
  }, [builder, previewMemberCache, previewOptions, secondaryMeasureLabelCache, secondaryMemberLabelCache]);
  const originalTimeLabels = useMemo(() => {
    const labels = new Map<string, string>();
    cartesian(studioColumnLevelParts).forEach((column) => {
      const part = column.path[0];
      if (part) labels.set(part.code, part.label);
    });
    return labels;
  }, [studioColumnLevelParts]);
  const originalTimeParts = useMemo(() => {
    const seen = new Set<string>();
    return cartesian(studioColumnLevelParts)
      .map((column) => column.path[0])
      .filter((part): part is PreviewPart => Boolean(part?.code))
      .filter((part) => {
        if (seen.has(part.code)) return false;
        seen.add(part.code);
        return true;
      });
  }, [studioColumnLevelParts]);
  const previewRows = useMemo(() => {
    const studioRows = cartesian(studioRowLevelParts);
    if (studioRows.length) return studioRows;
    const rowParts = rowAxisCodes.map((axisCode) => labelsForAxis(axisCode, axisMembers)).filter((rows) => rows.length);
    return cartesian(rowParts).length ? cartesian(rowParts) : ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5"].map((label) => ({ code: label, label, path: [{ code: label, label }] }));
  }, [axisMembers, rowAxisCodes, studioRowLevelParts]);
  const previewColumns = useMemo<PreviewColumn[]>(() => {
    const studioColumnGroups = cartesian(studioColumnLevelParts);
    if (studioColumnGroups.length || builderFields.length) {
      const generatedFields = [
        ...builderFields.filter((field) => field.generatedMode && field.showInDataEntry === true),
        ...generatedFieldsFromStudio(studioState, true),
      ];
      const baseGroups = studioColumnGroups.length
        ? studioColumnGroups.map((group) => ({
            ...group,
            label: timePeriodOverrides[group.code] ?? group.label,
            path: group.path.map((part, index) => index === 0 ? { ...part, label: timePeriodOverrides[part.code] ?? part.label } : part),
          })).filter((group) => !removedTimePeriodCodes.some((removed) => samePeriod(removed, group.path[0]?.code ?? group.code) || samePeriod(removed, group.path[0]?.label ?? group.label)))
        : builderFields.filter((field) => !field.generatedMode).map((field) => ({
            code: text(field.code, ""),
            label: text(field.label ?? field.code),
            path: [{ code: text(field.code, ""), label: text(field.label ?? field.code) }],
          }));
      const groups: PreviewRow[] = [
        ...(baseGroups.length ? baseGroups : [{ code: "Column_1", label: "Column", path: [{ code: "Column_1", label: "Column" }] }]),
        ...additionalTimePeriods
          .filter((period) => !removedTimePeriodCodes.some((removed) => samePeriod(removed, period.code) || samePeriod(removed, period.label)))
          .map((period) => ({ ...period, path: [period], addedPeriod: true })),
      ];
      return groups.flatMap((group) => {
        const baseColumns = studioTabParts.length
          ? studioTabParts.map((tab) => ({
              code: `${group.code}:${tab.code}`,
              label: tab.label,
              groupCode: group.code,
              groupLabel: group.label,
              addedPeriod: group.addedPeriod,
              path: [...group.path, tab],
            }))
          : [{ ...group, path: group.path, addedPeriod: group.addedPeriod }];
        const generatedColumns = generatedFields
          .filter((field) => {
            const generatedField = asRecord(field);
            if (generatedField.repeatForAllGroups === true || generatedField.targetGroupKey === ALL_GENERATED_GROUPS_KEY) return true;
            const targetPath = Array.isArray(generatedField.targetPath) ? generatedField.targetPath as PreviewPart[] : undefined;
            const targetKey = text(generatedField.targetGroupKey, "");
            if (targetPath?.length) return isPathPrefix(targetPath, group.path);
            if (targetKey) return targetKey === previewPathKey(group.path);
            return true;
          })
          .map((field) => ({
            code: `${group.code}:${text(field.code, "")}`,
            label: text(field.label ?? field.code),
            groupCode: group.code,
            groupLabel: group.label,
            generatedMeasure: field,
            measure: field,
            addedPeriod: group.addedPeriod,
            path: [...group.path, { code: text(field.code, ""), label: text(field.label ?? field.code) }],
          }));
        return [...baseColumns, ...generatedColumns];
      });
    }
    const columnParts = columnAxisCodes.map((axisCode) => labelsForAxis(axisCode, axisMembers)).filter((rows) => rows.length);
    const columnGroups = cartesian(columnParts);
    const editableMeasures = measures.filter((measure) => measure.is_editable !== false);
    if (columnGroups.length && editableMeasures.length) {
      return columnGroups.flatMap((column) =>
        editableMeasures.map((measure) => ({
          code: `${column.code}:${measureCode(measure)}`,
          label: `${column.label} / ${measureLabel(measure)}`,
          path: [...column.path, { code: measureCode(measure), label: measureLabel(measure) }],
          measure,
        })),
      );
    }
    if (columnGroups.length) return columnGroups.map((column) => ({ ...column, measure: editableMeasures[0] }));
    if (editableMeasures.length) {
      return editableMeasures.map((measure) => ({
        code: measureCode(measure),
        label: measureLabel(measure),
        path: [{ code: measureCode(measure), label: measureLabel(measure) }],
        measure,
      }));
    }
    return ["Column 1", "Column 2", "Column 3"].map((label) => ({ code: label, label, path: [{ code: label, label }] }));
  }, [additionalTimePeriods, axisMembers, builderFields, columnAxisCodes, measures, removedTimePeriodCodes, studioColumnLevelParts, studioState, studioTabParts, timePeriodOverrides]);
  const rowHeaderCount = Math.max(1, studioRowLevelParts.length || rowAxisCodes.length);
  const uomText = unique([assignment.uom || "", ...measures.map(measureUom)]).join(", ") || "-";
  const requestPeriodText = assignment.reportingPeriod || text(dispatch.requestPeriod, "");
  const publicationPreviewColumns = useMemo(
    () => previewColumns.filter((column, index) => publicationColumnEnabled(studioState, column, index)),
    [previewColumns, studioState],
  );
  const periodicityText =
    inferPeriodicityFromStudio(studioState, publicationPreviewColumns) ||
    meaningful(assignment.periodicity) ||
    (/^\d{4}$/.test(requestPeriodText) ? "Annual" : "") ||
    meaningful(asRecord(templateContract.version).periodicity) ||
    inferPeriodicityFromStudio(studioState, previewColumns) ||
    "-";
  const visiblePreviewColumns = useMemo(
    () =>
      previewColumns.filter(
        (column) =>
          !column.path.some((part) => hiddenColumnGroups.includes(part.code)) &&
          !removedTimePeriodCodes.some((removed) =>
            column.path.some((part) => samePeriod(removed, part.code) || samePeriod(removed, part.label)) || samePeriod(removed, column.groupCode) || samePeriod(removed, column.groupLabel),
          ),
      ),
    [hiddenColumnGroups, previewColumns, removedTimePeriodCodes],
  );
  const timePeriodDirty = useMemo(() => {
    return timePeriodStateSignature(additionalTimePeriods, timePeriodOverrides, removedTimePeriodCodes) !== loadedTimePeriodSignature;
  }, [additionalTimePeriods, loadedTimePeriodSignature, removedTimePeriodCodes, timePeriodOverrides]);
  const editableCellCount = valueBindings.filter((binding) => binding.is_editable !== false).length || previewRows.length * previewColumns.length;
  const visibleEditableCellCount = previewRows.length * visiblePreviewColumns.length;
  const headerDepth = Math.max(0, visiblePreviewColumns.reduce((max, column) => Math.max(max, column.path.length - 1), 0));
  const headerRows = useMemo(() => groupedHeaderRows(visiblePreviewColumns, headerDepth), [headerDepth, visiblePreviewColumns]);
  const rowHeaderWidth = Math.max(126, rowHeaderCount * 128);
  const columnWidth = 168;
  const columnDetails = useMemo(
    () =>
      visiblePreviewColumns.map((column, index) => {
        const measure = column.generatedMeasure ?? studioMeasureForColumn(column, index, builderFields, cellMap);
        const columnKey = measureColumnKey(column, index);
        const validation = asRecord(columnValidationMap[columnKey]);
        const hasValidation = Boolean(Object.keys(validation).length) || validations.some((rule) => {
          const ruleKey = text(rule.column_key ?? rule.columnKey ?? rule.binding_key ?? rule.bindingKey, "");
          return ruleKey ? normalize(ruleKey) === normalize(columnKey) : false;
        });
        return {
          measure,
          columnKey,
          popupKey: `${columnKey}:${index}`,
          validation,
          hasValidation,
          validationStatus: validationStatus(validation),
          validationSummary: validationSummary(validation),
        };
      }),
    [builderFields, cellMap, columnValidationMap, visiblePreviewColumns, validations],
  );
  const cellValidationMap = useMemo(() => {
    const result: Record<CellKey, { passed: boolean; message: string; severity: string }> = {};
    previewRows.forEach((row) => {
      visiblePreviewColumns.forEach((column, columnIndex) => {
        const key = cellKey(row, column);
        const detail = columnDetails[columnIndex];
        const effectiveMeasure = detail?.measure ?? studioMeasureForColumn(column, columnIndex, builderFields, cellMap);
        const binding = valueBindings.find((item) => measureCode(item) === measureCode(effectiveMeasure ?? {}));
        const required = binding?.is_required !== false;
        const evaluated = evaluateValidation(cellValues[key] ?? "", required, detail?.validation);
        result[key] = {
          ...evaluated,
          severity: text(detail?.validation?.failureBehavior, "WARNING") === "BLOCK" ? "error" : "warning",
        };
      });
    });
    return result;
  }, [builderFields, cellMap, cellValues, columnDetails, previewRows, valueBindings, visiblePreviewColumns]);
  const columnValidationState = useMemo(() => {
    return visiblePreviewColumns.map((column, columnIndex) => {
      const detail = columnDetails[columnIndex];
      if (!detail?.hasValidation) return { status: "none", message: detail?.validationSummary ?? "No validation configured for this column." };
      const failures = previewRows
        .map((row) => cellValidationMap[cellKey(row, column)])
        .filter((item) => item && !item.passed);
      if (failures.length) {
        return {
          status: "warning",
          message: `${failures.length} cell(s) need attention. ${failures[0]?.message || detail.validationSummary}`,
        };
      }
      return { status: "passed", message: "All entered values in this column pass validation." };
    });
  }, [cellValidationMap, columnDetails, previewRows, visiblePreviewColumns]);
  const selectedCell = useMemo(() => {
    for (const row of previewRows) {
      for (const column of visiblePreviewColumns) {
        if (cellKey(row, column) === selectedCellKey) return { row, column };
      }
    }
    return previewRows[0] && visiblePreviewColumns[0] ? { row: previewRows[0], column: visiblePreviewColumns[0] } : null;
  }, [previewRows, selectedCellKey, visiblePreviewColumns]);
  const selectedKey = selectedCell ? cellKey(selectedCell.row, selectedCell.column) : "";
  const selectedColumnIndex = selectedCell ? visiblePreviewColumns.findIndex((column) => column.code === selectedCell.column.code) : -1;
  const selectedColumnDetail = selectedColumnIndex >= 0 ? columnDetails[selectedColumnIndex] : null;
  const timePeriodPattern = useMemo(() => {
    const sample = previewColumns.flatMap((column) => column.path).map((part) => part.label).find((label) => /^\d{4}$/.test(label));
    return sample ? /^\d{4}$/ : /^.+$/;
  }, [previewColumns]);
  const missingCells = useMemo(
    () =>
      previewRows.flatMap((row) =>
        visiblePreviewColumns
          .filter((column) => !cellValues[cellKey(row, column)])
          .map((column) => ({ key: cellKey(row, column), row, column })),
      ),
    [cellValues, previewRows, visiblePreviewColumns],
  );
  const missingCellsByRow = useMemo(() => {
    const counts = new Map<string, number>();
    missingCells.forEach((cell) => counts.set(cell.row.code, (counts.get(cell.row.code) ?? 0) + 1));
    return counts;
  }, [missingCells]);
  const remarkRows = Object.entries(cellRemarks).filter(([, value]) => value.trim());
  const warnings = missingCells.filter((cell) => !cellRemarks[cell.key]).length;
  const canSaveDraft = boolPolicy(policy, "allowDraftSave", true);
  const canSubmit = boolPolicy(policy, "allowSubmit", true);
  const canAttach = boolPolicy(policy, "allowAttachments", true);
  const canRemarkMissing = boolPolicy(policy, "allowMissingValueWithRemarks", true);
  const certification = useMemo(() => policyCertification(policy), [policy]);
  const canEditCells = canSubmit && previewOptions.editablePreview;

  useEffect(() => {
    if (hasTouchedPreviewOptions) return;
    setPreviewOptions(previewOptionsFromSettings(previewSettings));
  }, [hasTouchedPreviewOptions, previewSettings]);

  useEffect(() => {
    const bilingual = previewOptions.bilingualLabels;
    const needsMembers = bilingual.geography || bilingual.dimensions;
    const needsMeasures = bilingual.measures;
    const items = [
      ...asArray(builder.rowRepresents),
      ...asArray(builder.columns),
      ...asArray(builder.tabsBy),
      ...asArray(builder.fields),
      ...asArray(studioState.rowLevels).flatMap((level) => arrayFromRecord(level, "items")),
      ...asArray(studioState.columnLevels).flatMap((level) => arrayFromRecord(level, "items")),
    ];
    if (needsMembers) {
      items
        .filter((item) => {
          const scope = bilingualScopeForItem(item);
          const id = text(item.id, text(item.code, ""));
          return id && scope && scope !== "measures" && Boolean(bilingual[scope as keyof typeof bilingual]) && !secondaryMemberLabelCache[id];
        })
        .forEach((item) => {
          const id = text(item.id, text(item.code, ""));
          const code = text(item.code, "");
          const type = text(item.type, "");
          const dimensionCode = text(item.dimensionCode ?? item.dimension_code, "");
          void (async () => {
            try {
              let labels: Record<string, string> = {};
              if (type === "DIMENSION_MEMBER" && dimensionCode) {
                const response = await listDimensionMembers(dimensionCode, 500, { locale: "hi-IN" });
                labels = Object.fromEntries((response.data ?? []).map((row) => [text(row.member_code, ""), text(row.name ?? row.short_name ?? row.member_code, "")]).filter(([key, value]) => key && value));
              } else if (type === "GEOGRAPHY_MEMBER") {
                const response = await listGeographies({ limit: 500, offset: 0, locale: "hi-IN" });
                labels = Object.fromEntries((response.data ?? []).map((row) => [text(row.member_code ?? row.geography_code, ""), text(row.name ?? row.short_name ?? row.member_code ?? row.geography_code, "")]).filter(([key, value]) => key && value));
              } else if (code) {
                const response = await listDimensionMemberSetMembers(code, 500, { locale: "hi-IN" });
                labels = Object.fromEntries((response.data ?? []).map((row) => [text(row.member_code, ""), text(row.name ?? row.short_name ?? row.member_code, "")]).filter(([key, value]) => key && value));
              }
              setSecondaryMemberLabelCache((current) => ({ ...current, [id]: labels, [code]: labels }));
            } catch {
              setSecondaryMemberLabelCache((current) => ({ ...current, [id]: {}, [code]: {} }));
            }
          })();
        });
    }
    if (needsMeasures && !Object.keys(secondaryMeasureLabelCache).length) {
      void (async () => {
        try {
          const response = await listDataFields({ limit: 500, offset: 0, locale: "hi-IN" });
          setSecondaryMeasureLabelCache(
            Object.fromEntries((response.data ?? []).map((field) => [
              text(field.measure_code ?? field.data_field_code, ""),
              text(field.name ?? field.measure_name ?? field.label ?? field.measure_code ?? field.data_field_code, ""),
            ]).filter(([key, value]) => key && value)),
          );
        } catch {
          setSecondaryMeasureLabelCache({});
        }
      })();
    }
  }, [builder, previewOptions.bilingualLabels, secondaryMeasureLabelCache, secondaryMemberLabelCache, studioState]);

  useEffect(() => {
    setRemarkDraft(selectedKey ? cellRemarks[selectedKey] ?? "" : "");
  }, [cellRemarks, selectedKey]);

  useEffect(() => {
    if (additionalTimePeriods.length || Object.keys(timePeriodOverrides).length || removedTimePeriodCodes.length) return;
    const dataEntry = asRecord(detail?.dataEntry);
    const draftStructure = asRecord(asRecord(dataEntry.draft).structureOverrides ?? asRecord(dataEntry.draft).structure_overrides);
    const instanceStructure = asRecord(asRecord(dataEntry.instance).structureOverrides ?? asRecord(dataEntry.instance).structure_overrides);
    const savedStructure = Object.keys(draftStructure).length ? draftStructure : instanceStructure;
    const savedAdditional = asArray(savedStructure.additionalTimePeriods);
    const savedOverrides = asRecord(savedStructure.timePeriodOverrides);
    const savedRemoved = Array.isArray(savedStructure.removedTimePeriodCodes) ? savedStructure.removedTimePeriodCodes.map((value) => text(value, "")).filter(Boolean) : [];
    if (Object.keys(savedStructure).length && (savedAdditional.length || Object.keys(savedOverrides).length || savedRemoved.length || savedStructure.derivedTimeSetCode)) {
      setTimePeriodOverrides(Object.fromEntries(Object.entries(savedOverrides).map(([key, value]) => [key, text(value, "")]).filter(([, value]) => value)));
      setAdditionalTimePeriods(
        savedAdditional
          .map((period) => ({ code: text(period.code ?? period.label, ""), label: text(period.label ?? period.code, "") }))
          .filter((period) => period.code && period.label),
      );
      setRemovedTimePeriodCodes(savedRemoved);
      setDerivedTimeSetCode(meaningful(savedStructure.derivedTimeSetCode));
      setLoadedDerivedTimeSetCode(meaningful(savedStructure.derivedTimeSetCode));
      setIsDerivedTimeSetSaved(Boolean(savedStructure.derivedTimeSetCode));
      setLoadedTimePeriodSignature(timePeriodStateSignature(
        savedAdditional.map((period) => ({ code: text(period.code ?? period.label, ""), label: text(period.label ?? period.code, "") })).filter((period) => period.code && period.label),
        Object.fromEntries(Object.entries(savedOverrides).map(([key, value]) => [key, text(value, "")]).filter(([, value]) => value)),
        savedRemoved,
      ));
      return;
    }

    const override = asRecord(assignment.timePeriodSetOverride);
    const periods = asArray(override.periods);
    const savedSetCode = meaningful(override.derivedSetCode);
    if (!savedSetCode || !periods.length || !originalTimeParts.length) return;
    const overrides: Record<string, string> = {};
    const additions: PreviewPart[] = [];
    const removed: string[] = [];
    const incomingOriginalCodes = new Set<string>();
    periods.forEach((period, index) => {
      const label = text(period.label ?? period.time_period_code, "");
      const original = originalTimeParts[index];
      if (original) {
        incomingOriginalCodes.add(original.code);
        if (original.label !== label) overrides[original.code] = label;
        return;
      }
      const code = text(period.time_period_code ?? label, label);
      additions.push({ code, label });
    });
    originalTimeParts.forEach((part) => {
      if (!incomingOriginalCodes.has(part.code) && periods.length < originalTimeParts.length) removed.push(part.code);
    });
    setTimePeriodOverrides(overrides);
    setAdditionalTimePeriods(additions);
    setRemovedTimePeriodCodes(removed);
    setDerivedTimeSetCode(savedSetCode);
    setLoadedDerivedTimeSetCode(savedSetCode);
    setIsDerivedTimeSetSaved(true);
    setLoadedTimePeriodSignature(timePeriodStateSignature(additions, overrides, removed));
  }, [additionalTimePeriods.length, assignment.timePeriodSetOverride, detail?.dataEntry, originalTimeParts, removedTimePeriodCodes.length, timePeriodOverrides]);

  useEffect(() => {
    const draft = asRecord(asRecord(detail?.dataEntry).draft);
    if (!Object.keys(draft).length) return;
    const values = asRecord(draft.values);
    const remarks = asRecord(draft.remarks);
    const savedAttachments = asArray(draft.attachments);
    if (Object.keys(values).length) {
      setCellValues(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, text(value, "")])));
    }
    if (Object.keys(remarks).length) {
      setCellRemarks(Object.fromEntries(Object.entries(remarks).map(([key, value]) => [key, text(value, "")])));
    }
    if (savedAttachments.length) {
      setAttachments(savedAttachments.map((file, index) => ({
        id: text(file.id, `saved-${index}`),
        name: text(file.name ?? file.filename, "Attachment"),
        filename: text(file.filename ?? file.name, "Attachment"),
        size: Number(file.size ?? 0),
        contentType: text(file.contentType ?? file.content_type, ""),
        contentBase64: text(file.contentBase64 ?? file.content_base64, ""),
      })));
    }
    setSubmissionNote(text(draft.submissionNote ?? draft.submission_note, ""));
  }, [detail?.dataEntry]);

  function openRemarkPopup(key: string) {
    setSelectedCellKey(key);
    setRemarkPopupKey(key);
    setRemarkDraft(cellRemarks[key] ?? "");
  }

  function saveRemark() {
    if (!remarkPopupKey) return;
    setCellRemarks((current) => ({ ...current, [remarkPopupKey]: remarkDraft }));
    setRemarkPopupKey("");
  }

  function currentTimePeriodsForSet() {
    const seen = new Set<string>();
    return previewColumns
      .map((column) => column.path[0])
      .filter(Boolean)
      .map((period) => ({ ...period, label: timePeriodOverrides[period.code] ?? period.label }))
      .filter((period) => !removedTimePeriodCodes.some((removed) => samePeriod(removed, period.code) || samePeriod(removed, period.label)))
      .filter((period) => {
        const key = `${period.code}:${period.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((period, index) => ({
        time_period_code: timePeriodCodeFromLabel(period.label || period.code),
        label: period.label || period.code,
        sort_order: index + 1,
      }));
  }

  function isOnlyOriginalTimeSet(currentOverrides: Record<string, string>, currentAdditional: PreviewPart[], currentRemoved = removedTimePeriodCodes) {
    const hasEdited = Object.entries(currentOverrides).some(([code, label]) => {
      const original = originalTimeLabels.get(code);
      return original && original !== label;
    });
    return !currentAdditional.length && !hasEdited && !currentRemoved.length;
  }

  async function deactivateDerivedTimeSet(setCode: string) {
    if (!setCode || !session) return;
    try {
      await deactivateRequestAccessDerivedTimePeriodSet({
        session,
        run_item_code: runItemCode || undefined,
        derived_set_code: setCode,
      });
      setDeletedDerivedTimeSetCodes((deleted) => (deleted.includes(setCode) ? deleted : [...deleted, setCode]));
    } catch (caught) {
      setError(assignmentOpenError(caught, "Derived time-period set could not be deactivated."));
    }
  }

  function hideColumnGroup(code: string) {
    setHiddenColumnGroups((current) => (current.includes(code) ? current : [...current, code]));
    setFrozenColumnCount(0);
  }

  function nextTimePeriod() {
    const years = unique(
      [...previewColumns, ...additionalTimePeriods]
        .flatMap((column) => ("path" in column ? column.path : [column]) as PreviewPart[])
        .map((part) => text(part.label, ""))
        .filter((label) => /^\d{4}$/.test(label)),
    ).map(Number);
    const nextYear = years.length ? Math.max(...years) + 1 : new Date().getFullYear();
    const clean = String(nextYear);
    if ([...previewColumns, ...additionalTimePeriods].some((column) => text(column.label) === clean || text(column.code) === clean)) {
      setError("This time period already exists in the preview.");
      return;
    }
    setAdditionalTimePeriods((current) => [...current, { code: clean, label: clean }]);
    setActiveTimeEdit(clean);
    setTimeEditDraft(clean);
    setTimeEditWarning("");
    setIsDerivedTimeSetSaved(false);
  }

  function beginTimePeriodEdit(code: string, label: string) {
    setActiveTimeEdit(code);
    setTimeEditDraft(label);
    setTimeEditWarning("");
  }

  function commitTimePeriodEdit(code: string) {
    const clean = timeEditDraft.trim();
    const original = originalTimeLabels.get(code);
    if (!timePeriodPattern.test(clean)) {
      setTimeEditWarning("Use the same format as existing time periods.");
      return;
    }
    if (previewColumns.some((column) => column.path[0]?.code !== code && column.path[0]?.label === clean)) {
      setTimeEditWarning("This time period already exists.");
      return;
    }
    const nextOverrides = { ...timePeriodOverrides };
    if (original && original === clean) {
      delete nextOverrides[code];
    } else {
      nextOverrides[code] = clean;
    }
    const nextAdditional = additionalTimePeriods.map((period) => period.code === code ? { ...period, label: clean } : period);
    const nextRemoved = removedTimePeriodCodes.filter((item) => !samePeriod(item, code));
    setTimePeriodOverrides(nextOverrides);
    setAdditionalTimePeriods(nextAdditional);
    setRemovedTimePeriodCodes(nextRemoved);
    setActiveTimeEdit("");
    setTimeEditWarning("");
    if (nextAdditional.some((period) => period.code === code) || (original && original !== clean)) {
      setIsDerivedTimeSetSaved(false);
      if (!isOnlyOriginalTimeSet(nextOverrides, nextAdditional, nextRemoved)) setDerivedTimeSetCode("");
    }
    if (isOnlyOriginalTimeSet(nextOverrides, nextAdditional, nextRemoved)) {
      setIsDerivedTimeSetSaved(true);
      if (derivedTimeSetCode) void deactivateDerivedTimeSet(derivedTimeSetCode);
      setDerivedTimeSetCode("");
    }
  }

  function removeTimePeriod(code: string, label = "") {
    const originalCode = Array.from(originalTimeLabels.entries()).find(([originalCodeValue, originalLabel]) => samePeriod(originalCodeValue, code) || samePeriod(originalLabel, label || code))?.[0] ?? "";
    const removalCode = originalCode || code || label;
    const nextAdditional = additionalTimePeriods.filter((period) => !samePeriod(period.code, code) && !samePeriod(period.label, label || code));
    const nextOverrides = { ...timePeriodOverrides };
    Object.keys(nextOverrides).forEach((key) => {
      if (samePeriod(key, code) || samePeriod(key, label)) delete nextOverrides[key];
    });
    const removalMarkers = unique([removalCode, code, label, timePeriodCodeFromLabel(label || code)]).filter(Boolean);
    const nextRemoved = unique([
      ...removedTimePeriodCodes.filter((item) => !removalMarkers.some((marker) => samePeriod(item, marker))),
      ...removalMarkers,
    ]);
    setAdditionalTimePeriods(nextAdditional);
    setTimePeriodOverrides(nextOverrides);
    setRemovedTimePeriodCodes(nextRemoved);
    setHiddenColumnGroups((current) => unique([...current, ...removalMarkers]));
    if (isOnlyOriginalTimeSet(nextOverrides, nextAdditional, nextRemoved)) {
      setIsDerivedTimeSetSaved(true);
      if (derivedTimeSetCode) void deactivateDerivedTimeSet(derivedTimeSetCode);
      setDerivedTimeSetCode("");
    } else {
      setIsDerivedTimeSetSaved(false);
      setDerivedTimeSetCode("");
      setIsTimeSetPromptOpen(true);
    }
    setCellValues((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.includes(`::${code}:`) && !key.endsWith(`::${code}`) && !key.includes(`::${removalCode}:`) && !key.endsWith(`::${removalCode}`))));
    setCellRemarks((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.includes(`::${code}:`) && !key.endsWith(`::${code}`) && !key.includes(`::${removalCode}:`) && !key.endsWith(`::${removalCode}`))));
  }

  async function confirmDerivedTimeSet() {
    if (!session) return;
    setIsSavingTimeSet(true);
    setError("");
    try {
      const data = await saveRequestAccessDerivedTimePeriodSet({
        session,
        run_item_code: runItemCode || undefined,
        original_set_code: originalTimeSetCode || "TIME_PERIOD_SET",
        derived_set_code: derivedTimeSetCode || loadedDerivedTimeSetCode || undefined,
        periods: currentTimePeriodsForSet(),
      });
      setDerivedTimeSetCode(meaningful(data.derivedSetCode));
      setLoadedDerivedTimeSetCode(meaningful(data.derivedSetCode));
      setIsDerivedTimeSetSaved(true);
      setLoadedTimePeriodSignature(timePeriodStateSignature(additionalTimePeriods, timePeriodOverrides, removedTimePeriodCodes));
      setIsTimeSetPromptOpen(false);
    } catch (caught) {
      setError(assignmentOpenError(caught, "Derived time-period set could not be saved."));
    } finally {
      setIsSavingTimeSet(false);
    }
  }

  function dataEntryPayload() {
    const failedCells = Object.entries(cellValidationMap)
      .filter(([, validation]) => !validation.passed)
      .map(([key, validation]) => ({ key, message: validation.message, severity: validation.severity }));
    return {
      session,
      run_item_code: runItemCode || undefined,
      values: cellValues,
      remarks: cellRemarks,
      attachments,
      submission_note: submissionNote,
      certification: {
        required: certification.required,
        certified: isCertified,
        text: certification.text,
      },
      validation_summary: {
        failedCellCount: failedCells.length,
        failedCells,
        missingCellCount: missingCells.length,
        warningCount: warnings,
      },
      structure_overrides: {
        originalTimeSetCode,
        derivedTimeSetCode,
        additionalTimePeriods,
        timePeriodOverrides,
        removedTimePeriodCodes,
      },
    };
  }

  async function saveDataEntryDraft() {
    if (!canSaveDraft || isSavingEntry) return;
    setIsSavingEntry(true);
    setSaveNotice("");
    setError("");
    try {
      const data = await saveRequestAccessDataEntryDraft(dataEntryPayload());
      setSaveNotice(`Draft saved${data.savedAt ? ` at ${new Date(String(data.savedAt)).toLocaleString()}` : ""}.`);
      const statusPatch = {
        status: String(data.status || "DRAFT"),
        lifecycleStatus: String(data.lifecycleStatus || data.status || "DRAFT"),
        validationStatus: String(data.validationStatus || "NOT_RUN"),
        reviewStatus: String(data.reviewStatus || "NOT_READY"),
        approvalStatus: String(data.approvalStatus || "NOT_READY"),
        publicationStatus: String(data.publicationStatus || "NOT_PUBLISHED"),
      };
      setDetail((current) => current ? {
        ...current,
        assignment: current.assignment ? { ...current.assignment, ...statusPatch } : current.assignment,
        assignments: current.assignments?.map((assignment) =>
          assignment.runItemCode === runItemCode ? { ...assignment, ...statusPatch } : assignment,
        ),
      } : current);
    } catch (caught) {
      setError(assignmentOpenError(caught, "Draft could not be saved."));
    } finally {
      setIsSavingEntry(false);
    }
  }

  function canSubmitWithMissingCells() {
    if (!missingCells.length) return true;
    if (submissionNote.trim()) return true;
    return missingCells.every((cell) => (cellRemarks[cell.key] ?? "").trim());
  }

  async function persistDataEntrySubmission() {
    if (!canSubmit || isSavingEntry) return;
    if (certification.required && !isCertified) {
      setError("Certification is required before submitting this assignment.");
      return;
    }
    setIsSavingEntry(true);
    setSaveNotice("");
    setError("");
    try {
      const data = await submitRequestAccessDataEntry(dataEntryPayload());
      setSaveNotice(`Submitted successfully${data.submissionVersion ? ` as version ${data.submissionVersion}` : ""}.`);
      const submittedVersion = text(data.submissionVersion ?? data.latestSubmissionVersion, "");
      const statusPatch = {
        status: String(data.status || "SUBMITTED"),
        latestSubmissionVersion: submittedVersion || undefined,
        lifecycleStatus: String(data.lifecycleStatus || "REVIEW_PENDING"),
        validationStatus: String(data.validationStatus || "NOT_RUN"),
        reviewStatus: String(data.reviewStatus || "PENDING_REVIEW"),
        approvalStatus: String(data.approvalStatus || "PENDING"),
        publicationStatus: String(data.publicationStatus || "NOT_PUBLISHED"),
      };
      setDetail((current) => current ? {
        ...current,
        assignment: current.assignment ? { ...current.assignment, ...statusPatch } : current.assignment,
        assignments: current.assignments?.map((assignment) =>
          assignment.runItemCode === runItemCode ? { ...assignment, ...statusPatch } : assignment,
        ),
      } : current);
    } catch (caught) {
      setError(assignmentOpenError(caught, "Submission could not be saved."));
    } finally {
      setIsSavingEntry(false);
    }
  }

  async function submitDataEntry() {
    if (!canSubmit || isSavingEntry) return;
    if (missingCells.length) {
      setIsMissingSubmitOpen(true);
      return;
    }
    await persistDataEntrySubmission();
  }

  function editableExcelColumns() {
    return visiblePreviewColumns
      .map((column, index) => ({ column, index, detail: columnDetails[index] }))
      .filter(({ column, detail }) => isIndividualColumn(column, detail) || (!column.generatedMeasure && !generatedMode(asRecord(detail?.measure))));
  }

  function downloadExcelTemplate() {
    const editableColumns = editableExcelColumns();
    if (!previewRows.length || !editableColumns.length) {
      setError("Excel template cannot be generated because this assignment has no editable cells.");
      return;
    }
    const metadataRows = [
      ["SSD Enterprise Portal - Data Entry Template"],
      ["Template", text(asRecord(assignment.template).template_name ?? asRecord(assignment.template).title, "Assigned template")],
      ["Indicator", assignmentIndicatorDisplay(assignment)],
      ["Source", `${text(assignment.ministry)}${assignment.department && assignment.department !== "-" ? ` / ${assignment.department}` : ""}`],
      ["Reporting Period", requestPeriodText || "-"],
      ["Due Date", text(dispatch.dueDate)],
      [],
      ["Do not edit hidden/internal columns. Fill numeric values only in the data columns below."],
      [],
    ];
    const header = [
      "__ROW_KEY",
      ...Array.from({ length: rowHeaderCount }, (_, index) => rowHeaderLabels[index] || `Level ${index + 1}`),
      ...editableColumns.map(({ column }) => excelColumnHeader(column, previewOptions.showCodes)),
    ];
    const sampleRow = [
      "__SAMPLE_DO_NOT_UPLOAD__",
      ...Array.from({ length: rowHeaderCount }, (_, index) => index === 0 ? "Sample State/UT" : "Sample"),
      ...editableColumns.map(() => "10"),
    ];
    const dataRows = previewRows.map((row) => [
      row.code,
      ...Array.from({ length: rowHeaderCount }, (_, index) => excelCellText(previewOptions.showCodes ? row.path[index]?.code || row.code : row.path[index]?.label || row.label)),
      ...editableColumns.map(({ column }) => cellValues[cellKey(row, column)] ?? ""),
    ]);
    const csv = [...metadataRows, header, sampleRow, ...dataRows]
      .map((row) => row.map(csvValue).join(","))
      .join("\n");
    const filename = `${text(assignment.indicatorCode || assignment.indicatorNumber, "assignment")}-${requestPeriodText || "period"}-data-entry.csv`
      .replace(/[^A-Za-z0-9_.-]+/g, "_");
    downloadTextFile(filename, "text/csv;charset=utf-8", csv);
    setSaveNotice("Excel-compatible template downloaded. Open it in Excel, fill numeric values, save, and upload the same CSV file.");
  }

  async function uploadExcelTemplate(file: File | null | undefined) {
    if (!file) return;
    setIsImportingExcel(true);
    setError("");
    setSaveNotice("");
    try {
      const rows = parseCsv(await file.text());
      const headerIndex = rows.findIndex((row) => text(row[0], "") === "__ROW_KEY");
      if (headerIndex < 0) throw new Error("Uploaded file is not the SSD data-entry CSV template. Please download the latest Excel format and try again.");
      const editableColumns = editableExcelColumns();
      const rowByCode = new Map(previewRows.map((row) => [row.code, row]));
      const importedValues: Record<CellKey, string> = {};
      let importedCount = 0;
      let invalidCount = 0;
      rows.slice(headerIndex + 1).forEach((sheetRow) => {
        const rowCode = text(sheetRow[0], "");
        if (!rowCode || rowCode === "__SAMPLE_DO_NOT_UPLOAD__") return;
        const previewRow = rowByCode.get(rowCode);
        if (!previewRow) return;
        editableColumns.forEach(({ column }, index) => {
          const raw = sheetRow[1 + rowHeaderCount + index];
          const value = importedNumericText(raw);
          const rawText = text(raw, "").trim();
          if (rawText && !value) {
            invalidCount += 1;
            return;
          }
          importedValues[cellKey(previewRow, column)] = value;
          if (value) importedCount += 1;
        });
      });
      setCellValues((current) => ({ ...current, ...importedValues }));
      setSaveNotice(`Excel uploaded. ${importedCount} value(s) filled in the preview. Review and save draft or submit.`);
      if (invalidCount) {
        setError(`${invalidCount} non-numeric cell(s) were skipped. Please correct them in Excel or enter them manually.`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Excel file could not be imported.");
    } finally {
      setIsImportingExcel(false);
    }
  }

  return (
    <main className="request-access-page request-data-entry-page">
      <section className="request-access-shell">
        <header className="request-access-header request-data-entry-header">
          <div className="request-data-entry-heading">
            <div>
              <span>SSD Enterprise Portal</span>
              <h1>Data Entry</h1>
              <p>Enter and save data for the assigned template.</p>
            </div>
          </div>
          <div className="request-data-entry-header-actions">
            <button className="secondary-button compact" type="button" onClick={goBackToAssignedList}>
              <ArrowLeft size={14} /> Back to assigned list
            </button>
            <button className="secondary-button compact" type="button" onClick={() => void loadDetail()}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </header>

        {saveNotice ? <div className="notice success">{saveNotice}</div> : null}
        {error ? <div className="notice error">{error}</div> : null}
        {isLoading ? (
          <div className="request-access-empty">
            <RefreshCw size={18} />
            Loading assignment...
          </div>
        ) : null}

        {!isLoading && detail ? (
          <>
            <section className="request-access-summary request-data-entry-summary">
              <div>
                <span>Template</span>
                <strong>{text(asRecord(assignment.template).template_name ?? asRecord(assignment.template).title, "Assigned template")}</strong>
              </div>
              <div>
                <span>Indicator Code</span>
                <strong>{assignment.indicatorCode || assignment.indicatorNumber || "-"}</strong>
              </div>
              <div>
                <span>Indicator Name</span>
                <strong>{assignmentIndicatorName(assignment, measures)}</strong>
              </div>
              <div>
                <span>UOM</span>
                <strong>{uomText}</strong>
              </div>
              <div>
                <span>Periodicity</span>
                <strong>{periodicityText}</strong>
              </div>
              <div>
                <span>Reporting Period</span>
                <strong>{requestPeriodText || "-"}</strong>
              </div>
              <div>
                <span>Due Date</span>
                <strong>{text(dispatch.dueDate)}</strong>
              </div>
            </section>

            <section className="request-data-entry-workspace-grid">
              <section className="request-access-card request-data-entry-workspace">
                <div className="request-data-entry-title-row">
                  <div>
                    <h2><FileSpreadsheet size={16} /> Template Preview <span>~{hiddenColumnGroups.length ? visibleEditableCellCount : editableCellCount} editable cells</span></h2>
                    <p>{assignmentIndicatorDisplay(assignment)}</p>
                  </div>
                  <div className="request-data-entry-preview-controls">
                    <button className="secondary-button compact" type="button" onClick={downloadExcelTemplate}>
                      <Download size={13} /> Excel Format
                    </button>
                    <label className={`secondary-button compact request-data-entry-excel-upload ${!canEditCells || isImportingExcel ? "disabled" : ""}`}>
                      <Upload size={13} /> {isImportingExcel ? "Uploading..." : "Upload Filled File"}
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        disabled={!canEditCells || isImportingExcel}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          void uploadExcelTemplate(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {([
                      ["showCodes", "Codes"],
                      ["zebraRows", "Zebra"],
                      ["compactCells", "Compact"],
                    ] as const).map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={previewOptions[key]}
                          onChange={(event) => {
                            setHasTouchedPreviewOptions(true);
                            setPreviewOptions((current) => ({ ...current, [key]: event.target.checked }));
                          }}
                        />
                        {label}
                      </label>
                    ))}
                    <details className="request-data-entry-lang-menu">
                      <summary>Lang</summary>
                      <div>
                        {([
                          ["geography", "Geography Hindi"],
                          ["dimensions", "Dimensions Hindi"],
                          ["measures", "Measures Hindi"],
                        ] as const).map(([key, label]) => (
                          <label key={key}>
                            <input
                              type="checkbox"
                              checked={previewOptions.bilingualLabels[key]}
                              onChange={(event) => {
                                setHasTouchedPreviewOptions(true);
                                setPreviewOptions((current) => ({
                                  ...current,
                                  bilingualLabels: { ...current.bilingualLabels, [key]: event.target.checked },
                                }));
                              }}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </details>
                  </div>
                  {hiddenColumnGroups.length ? (
                    <div className="request-data-entry-hidden-groups">
                      {hiddenColumnGroups.map((code) => (
                        <button
                          className="secondary-button compact"
                          type="button"
                          key={code}
                          onClick={() => setHiddenColumnGroups((current) => current.filter((item) => item !== code))}
                        >
                          Show {code}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <section className="request-data-entry-preview">
                  <div className="request-data-entry-table-wrap">
                    <table
                      className={`request-data-entry-table ${previewOptions.compactCells ? "compact" : ""} ${previewOptions.zebraRows ? "zebra" : ""}`}
                      style={{ minWidth: Math.max(980, rowHeaderWidth + visiblePreviewColumns.length * columnWidth + 126) }}
                    >
                      <thead>
                        {headerRows.map((row, rowIndex) => (
                          <tr key={`entry-header-${rowIndex}`}>
                            <th
                              className={freezeRowHeaders ? "frozen-row-header" : ""}
                              style={{ top: rowIndex * 34, left: freezeRowHeaders ? 0 : undefined, width: rowHeaderWidth, minWidth: rowHeaderWidth }}
                              colSpan={rowHeaderCount}
                            >
                              {rowIndex === 0 ? "Column Groups" : ""}
                            </th>
                            {row.map((cell, index) => (
                            <th style={{ top: rowIndex * 34, minWidth: cell.colSpan * columnWidth }} key={`${cell.code}-${rowIndex}-${index}`} colSpan={cell.colSpan}>
                                <span className={`request-data-entry-period-header ${timeEditWarning && activeTimeEdit === cell.code ? "has-warning" : ""}`}>
                                  {activeTimeEdit === cell.code ? (
                                    <input
                                      autoFocus
                                      value={timeEditDraft}
                                      onBlur={() => commitTimePeriodEdit(cell.code)}
                                      onChange={(event) => {
                                        setTimeEditDraft(event.target.value);
                                        setTimeEditWarning(timePeriodPattern.test(event.target.value.trim()) ? "" : "Use the same format as existing time periods.");
                                      }}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") commitTimePeriodEdit(cell.code);
                                        if (event.key === "Escape") setActiveTimeEdit("");
                                      }}
                                    />
                                  ) : (
                                    <button className="request-data-entry-period-label" type="button" onClick={() => beginTimePeriodEdit(cell.code, cell.label)}>
                                      {previewOptions.showCodes ? cell.code : cell.label}
                                    </button>
                                  )}
                                  {rowIndex === 0 ? (
                                    <button type="button" title="Remove reporting period from this assignment" onClick={() => removeTimePeriod(cell.code, cell.label)}>
                                      <X size={12} />
                                    </button>
                                  ) : null}
                                  {rowIndex === 0 && index === row.length - 1 ? (
                                    <button type="button" title="Add reporting period" onClick={nextTimePeriod}>
                                      <Plus size={12} />
                                    </button>
                                  ) : null}
                                  <button type="button" title={`Hide ${cell.label}`} onClick={() => hideColumnGroup(cell.code)}>
                                    <EyeOff size={12} />
                                  </button>
                                </span>
                                {timeEditWarning && activeTimeEdit === cell.code ? <small className="request-data-entry-period-warning">{timeEditWarning}</small> : null}
                              </th>
                            ))}
                            {rowIndex === 0 ? <th className="request-data-entry-row-check-header" style={{ top: 0 }} rowSpan={headerRows.length + 1}>Row Check</th> : null}
                          </tr>
                        ))}
                        <tr>
                          {Array.from({ length: rowHeaderCount }, (_, index) => (
                            <th
                              className={freezeRowHeaders ? "frozen-row-header" : ""}
                              style={{ top: headerRows.length * 34, left: freezeRowHeaders ? index * 128 : undefined, width: 128, minWidth: 128 }}
                              key={`row-head-${index}`}
                            >
                              <span className="request-data-entry-row-header-label">
                                <span>{rowHeaderLabels[index] || `Row ${index + 1}`}</span>
                                {index === 0 ? (
                                  <button
                                    className={`request-data-entry-freeze-button ${freezeRowHeaders ? "active" : ""}`}
                                    type="button"
                                    title={freezeRowHeaders ? "Unfreeze first column" : "Freeze first column"}
                                    onClick={() => setFreezeRowHeaders((current) => !current)}
                                  >
                                    <Pin size={10} />
                                  </button>
                                ) : null}
                              </span>
                            </th>
                          ))}
                          {visiblePreviewColumns.map((column, columnIndex) => {
                            const columnDetail = columnDetails[columnIndex];
                            const columnState = columnValidationState[columnIndex];
                            const columnMeasure = columnDetail?.measure ?? {};
                            const columnUom = measureUom(columnMeasure);
                            const isFrozen = columnIndex < frozenColumnCount;
                            const frozenLeft = rowHeaderWidth + columnIndex * columnWidth;
                            return (
                            <th
                              className={isFrozen ? "frozen-data-column" : ""}
                              style={{
                                top: headerRows.length * 34,
                                left: isFrozen ? frozenLeft : undefined,
                                width: columnWidth,
                                minWidth: columnWidth,
                              }}
                              key={column.code}
                            >
                              <span className="request-data-entry-header-label">
                                <span className="request-data-entry-header-text">{previewOptions.showCodes ? column.code : column.path[column.path.length - 1]?.label || column.label}</span>
                                {columnDetail?.measure ? (
                                  <>
                                    <span className="template-measure-meta" title={measureTitle(columnMeasure)}>
                                      <span className="template-measure-info"><Info size={11} /></span>
                                      <span className="template-measure-uom">{columnUom || "UOM"}</span>
                                    </span>
                                    <button
                                      className={`template-column-validation-button ${columnDetail.hasValidation ? "configured" : ""} ${columnState?.status ?? columnDetail.validationStatus}`}
                                      type="button"
                                      title={columnState?.message || columnDetail.validationSummary}
                                      onClick={() => setValidationPopupKey(validationPopupKey === columnDetail.popupKey ? "" : columnDetail.popupKey)}
                                    >
                                      <ShieldCheck size={11} />
                                    </button>
                                    <button
                                      className={`request-data-entry-freeze-button ${isFrozen ? "active" : ""}`}
                                      type="button"
                                      title={isFrozen && frozenColumnCount === columnIndex + 1 ? "Unfreeze this column" : `Freeze columns 1-${columnIndex + 1}`}
                                      onClick={() => setFrozenColumnCount(frozenColumnCount === columnIndex + 1 ? columnIndex : columnIndex + 1)}
                                    >
                                      <Pin size={10} />
                                    </button>
                                    <button className="request-data-entry-freeze-button" type="button" title={`Hide ${column.path.map((part) => part.label).join(" / ")}`} onClick={() => hideColumnGroup(column.path[column.path.length - 1]?.code || column.code)}>
                                      <EyeOff size={10} />
                                    </button>
                                  </>
                                ) : null}
                              </span>
                              {validationPopupKey === columnDetail?.popupKey ? (
                                <div className="request-data-entry-validation-popover">
                                  <button type="button" onClick={() => setValidationPopupKey("")}>x</button>
                                  <strong>Validation Applied</strong>
                                  {columnDetail.hasValidation ? (
                                    <>
                                      <span>{column.path.map((part) => part.label).join(" / ")}</span>
                                      <p>{columnState?.message || columnDetail.validationSummary}</p>
                                    </>
                                  ) : (
                                    <span>No validation configured for this column.</span>
                                  )}
                                </div>
                              ) : null}
                            </th>
                            );
                          })}
                          {!headerRows.length ? <th style={{ top: 0 }}>Row Check</th> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, rowIndex) => (
                          <tr key={`${row.code}-${rowIndex}`}>
                            {Array.from({ length: rowHeaderCount }, (_, levelIndex) => (
                              <td
                                className={`request-data-entry-row-header ${freezeRowHeaders ? "frozen-row-header-cell" : ""}`}
                                style={{ left: freezeRowHeaders ? levelIndex * 128 : undefined, width: 128, minWidth: 128 }}
                                key={`${row.code}-${levelIndex}`}
                              >
                                {previewOptions.showCodes ? row.path[levelIndex]?.code || row.code : row.path[levelIndex]?.label || row.label}
                              </td>
                            ))}
                            {visiblePreviewColumns.map((column, columnIndex) => {
                              const key = cellKey(row, column);
                              const effectiveMeasure = columnDetails[columnIndex]?.measure ?? studioMeasureForColumn(column, columnIndex, builderFields, cellMap);
                              const binding = valueBindings.find((item) => measureCode(item) === measureCode(effectiveMeasure ?? {}));
                              const required = binding?.is_required !== false;
                              const generated = Boolean(generatedMode(effectiveMeasure)) && !isIndividualColumn(column, columnDetails[columnIndex]);
                              const isFrozen = columnIndex < frozenColumnCount;
                              const validation = cellValidationMap[key];
                              return (
                                <td
                                  key={`${row.code}-${column.code}-${columnIndex}`}
                                  className={`${selectedKey === key ? "selected-cell" : ""} ${isFrozen ? "frozen-data-column" : ""} ${validation && !validation.passed ? "validation-warning-cell" : validation?.passed && cellValues[key] ? "validation-passed-cell" : ""}`}
                                  style={{ left: isFrozen ? rowHeaderWidth + columnIndex * columnWidth : undefined, width: columnWidth, minWidth: columnWidth }}
                                >
                                  <DataEntryCell
                                    cellId={key}
                                    ariaLabel={`${row.label} ${column.label}`}
                                    disabled={generated || !canEditCells}
                                    required={required}
                                    selected={remarkPopupKey === key}
                                    value={cellValues[key] ?? ""}
                                    remark={cellRemarks[key] ?? ""}
                                    canRemark={canRemarkMissing}
                                    onCommit={(cellId, value) => setCellValues((current) => ({ ...current, [cellId]: value }))}
                                    onSelect={(cellId) => {
                                      setSelectedCellKey(cellId);
                                      if (timePeriodDirty && !isDerivedTimeSetSaved) setIsTimeSetPromptOpen(true);
                                    }}
                                    onOpenRemark={openRemarkPopup}
                                  />
                                  {remarkPopupKey === key ? (
                                    <div className="request-data-entry-cell-popover">
                                      <button className="request-data-entry-popover-close" type="button" onClick={() => setRemarkPopupKey("")}>x</button>
                                      <strong>Remarks</strong>
                                      <span>{row.label} - {column.path.map((part) => part.label).join(" / ")}</span>
                                      <label>
                                        Remarks
                                        <textarea
                                          value={remarkDraft}
                                          onChange={(event) => setRemarkDraft(event.target.value)}
                                          placeholder="Add remarks"
                                        />
                                      </label>
                                      <div>
                                        <button className="secondary-button compact" type="button" onClick={() => setRemarkPopupKey("")}>Cancel</button>
                                        <button className="primary-button compact" type="button" onClick={saveRemark}>Save Remark</button>
                                      </div>
                                    </div>
                                  ) : null}
                                </td>
                              );
                            })}
                            <td className="request-data-entry-row-check">
                              {missingCellsByRow.get(row.code) ? (
                                <span className="warning">{missingCellsByRow.get(row.code)} missing</span>
                              ) : (
                                <span className="ok">Complete</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </section>

              <aside className="request-data-entry-side-panel">
                <section>
                  <h3>Submission</h3>
                  <div className="request-data-entry-selected-cell">
                    <span>Latest submitted version</span>
                    <strong>{assignment.latestSubmissionVersion ? `Version ${assignment.latestSubmissionVersion}` : "Not submitted"}</strong>
                    <small>{assignment.lifecycleStatus || assignment.status || "NOT STARTED"}</small>
                  </div>
                </section>

                <section>
                  <h3>Editing</h3>
                  {selectedCell ? (
                    <div className="request-data-entry-selected-cell">
                      <span>{selectedCell.row.label}</span>
                      <strong>{selectedCell.column.path.map((part) => part.label).join(" / ")}</strong>
                      <small>{measureLabel(selectedColumnDetail?.measure ?? {})} / {measureUom(selectedColumnDetail?.measure ?? {}) || uomText}</small>
                    </div>
                  ) : <p>Select a cell to view details.</p>}
                </section>

                <section>
                  <h3>Stats</h3>
                  <div className="request-data-entry-stat-list">
                    <span><strong>{editableCellCount}</strong> Editable cells</span>
                    <span><strong>{missingCells.length}</strong> Missing cells</span>
                    <span><strong>{remarkRows.length}</strong> Remarks</span>
                    <span><strong>{warnings}</strong> Warnings</span>
                    <span><strong>{validations.length + Object.keys(columnValidationMap).length}</strong> Validation rules</span>
                  </div>
                </section>
                <section>
                  <h3>Remarks</h3>
                  <div className="request-data-entry-remark-list">
                    {remarkRows.length ? remarkRows.map(([key, remark]) => (
                      <article key={key}>
                        <div>
                          <strong>{key.split("::").slice(0, 2).join(" / ")}</strong>
                          <button type="button" title="Remove remark" onClick={() => setCellRemarks((current) => {
                            const next = { ...current };
                            delete next[key];
                            return next;
                          })}>
                            <X size={12} />
                          </button>
                        </div>
                        <span>{remark}</span>
                      </article>
                    )) : <small>No cell remarks added.</small>}
                  </div>
                </section>

                <section>
                  <h3>Attachments</h3>
                  <label className={`request-data-entry-attachment-button ${!canAttach ? "disabled" : ""}`}>
                    <Paperclip size={13} />
                    Add Attachment
                    <input
                      type="file"
                      disabled={!canAttach}
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        void Promise.all(files.map(fileToDataEntryAttachment))
                          .then((nextAttachments) => setAttachments((current) => [...current, ...nextAttachments]))
                          .catch((caught) => setError(caught instanceof Error ? caught.message : "Attachment could not be added."));
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <div className="request-data-entry-attachment-list">
                    {attachments.length ? attachments.map((file) => (
                      <article key={file.id}>
                        <span>{file.name}</span>
                        <small>{Math.ceil(file.size / 1024)} KB</small>
                        <button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}>
                          <X size={12} />
                        </button>
                      </article>
                    )) : <small>No attachments added.</small>}
                  </div>
                </section>
                {certification.required ? (
                  <section>
                    <h3>Evidence & Certification</h3>
                    <label className="request-data-entry-certification">
                      <input
                        type="checkbox"
                        checked={isCertified}
                        onChange={(event) => setIsCertified(event.target.checked)}
                      />
                      <span>{certification.text}</span>
                    </label>
                  </section>
                ) : null}
              </aside>
            </section>

            <div className="request-data-entry-bottom-bar">
              <button className="secondary-button compact" type="button" disabled={!canSaveDraft || isSavingEntry} onClick={() => void saveDataEntryDraft()}>
                <Save size={13} /> {isSavingEntry ? "Saving..." : "Save Draft"}
              </button>
              <button className="primary-button compact" type="button" disabled={!canSubmit || isSavingEntry || (certification.required && !isCertified)} onClick={() => void submitDataEntry()}>
                <CheckCircle2 size={13} /> {isSavingEntry ? "Saving..." : "Submit"}
              </button>
            </div>
            {isTimeSetPromptOpen ? (
              <div className="drawer-backdrop">
                <div className="request-data-entry-time-set-dialog">
                  <button type="button" onClick={() => setIsTimeSetPromptOpen(false)}>x</button>
                  <strong>Save Added Time Periods</strong>
                  <p>
                    Added reporting period columns must be saved as a new time-period set before values are entered.
                    The new set will copy the current time-period structure and include the added period(s).
                  </p>
                  <small>Original set: {originalTimeSetCode || "-"}</small>
                  <small>Derived set: {derivedTimeSetCode || "Not saved yet"}</small>
                  {deletedDerivedTimeSetCodes.length ? <small>Deleted derived set(s): {deletedDerivedTimeSetCodes.join(", ")}</small> : null}
                  <div>
                    <button className="secondary-button compact" type="button" onClick={() => setIsTimeSetPromptOpen(false)}>Cancel</button>
                    <button className="primary-button compact" type="button" disabled={isSavingTimeSet} onClick={confirmDerivedTimeSet}>
                      {isSavingTimeSet ? "Saving..." : "Save New Set"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {isMissingSubmitOpen ? (
              <div className="drawer-backdrop">
                <div className="request-data-entry-time-set-dialog request-data-entry-submit-note-dialog">
                  <button type="button" onClick={() => setIsMissingSubmitOpen(false)}>x</button>
                  <strong>Missing Values Need Remarks</strong>
                  <p>
                    {missingCells.length} required cell(s) are empty. Add remarks against every missing cell, or enter one note that applies to all missing cells before submitting.
                  </p>
                  <label>
                    Note for all missing cells
                    <textarea
                      value={submissionNote}
                      onChange={(event) => setSubmissionNote(event.target.value)}
                      placeholder="Explain why the remaining required values are unavailable."
                    />
                  </label>
                  <small>{missingCells.filter((cell) => !(cellRemarks[cell.key] ?? "").trim()).length} missing cell(s) do not have cell-level remarks.</small>
                  <div>
                    <button className="secondary-button compact" type="button" onClick={() => setIsMissingSubmitOpen(false)}>Add Cell Remarks</button>
                    <button
                      className="primary-button compact"
                      type="button"
                      disabled={!submissionNote.trim() && !canSubmitWithMissingCells()}
                      onClick={() => {
                        setIsMissingSubmitOpen(false);
                        void persistDataEntrySubmission();
                      }}
                    >
                      Submit With Note
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
