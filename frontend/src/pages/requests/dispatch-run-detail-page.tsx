import { ArrowLeft, Check, Clock, Download, EyeOff, MessageSquareText, Paperclip, Pin, RefreshCw, Search, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { listDataFields } from "../../api/data-fields.api";
import { listDimensionMembers, listDimensionMemberSetMembers, listGeographies } from "../../api/dimensions.api";
import { getIndicator, type IndicatorDetail } from "../../api/indicators.api";
import { DispatchRun, getDispatchRun, listDispatchRuns, publishDispatchRunItemSubmission, resendDispatchRunNotification, reviewDispatchRunItemSubmission } from "../../api/requests.api";
import { listAuthReviewWorkflows, type AuthReviewWorkflowLevel } from "../../api/auth-admin.api";

type DispatchTab = "OVERVIEW" | "RECIPIENT" | "PROGRESS" | "SUBMISSION" | "COMMUNICATIONS" | "TIMELINE";

const TABS: { code: DispatchTab; label: string }[] = [
  { code: "OVERVIEW", label: "Overview" },
  { code: "RECIPIENT", label: "Recipient" },
  { code: "PROGRESS", label: "Progress" },
  { code: "SUBMISSION", label: "Submission" },
  { code: "COMMUNICATIONS", label: "Communications" },
  { code: "TIMELINE", label: "Timeline" },
];

const RESEND_EMAIL_TYPES = [
  "SEND_REQUEST",
  "FIRST_REMINDER",
  "DUE_DATE_REMINDER",
  "OVERDUE_ALERT",
  "ESCALATION",
  "SUBMITTED_FOR_REVIEW",
  "REVIEW_APPROVED",
  "REVIEW_REJECTED",
  "RESENT_FOR_SUBMISSION",
  "RESUBMITTED_FOR_REVIEW",
  "PUBLISHED",
];

function text(value: unknown, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function normalize(value: unknown) {
  return text(value, "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function field(row: Record<string, unknown> | null | undefined, camel: string, snake: string, fallback = "-") {
  return text(row?.[camel] ?? row?.[snake], fallback);
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

type PreviewPart = { code: string; label: string };
type PreviewRow = PreviewPart & { path: PreviewPart[] };
type PreviewColumn = PreviewPart & { path: PreviewPart[]; groupCode?: string; groupLabel?: string; generatedField?: Record<string, unknown> };
type PreviewHeaderCell = PreviewPart & { colSpan: number };
type SubmissionPreviewScope = "SOURCE" | "COMBINED";
type GeneratedColumnMode = "INCLUDE" | "EXCLUDE" | "ONLY";
type PublishMode = "ALL_COLUMNS" | "BASE_COLUMNS_ONLY" | "GENERATED_COLUMNS_ONLY" | "SELECTED_COLUMNS";
type EmailAttachment = {
  filename: string;
  contentType: string;
  size: number;
  contentBase64: string;
};
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

const ALL_GENERATED_GROUPS_KEY = "__ALL_COLUMN_GROUPS__";
const MAX_EMAIL_ATTACHMENT_BYTES = 20 * 1024 * 1024;

function arrayFromRecord(record: Record<string, unknown>, key: string) {
  return Array.isArray(record[key]) ? (record[key] as Record<string, unknown>[]) : [];
}

function cartesian(parts: PreviewPart[][]): (PreviewPart & { path: PreviewPart[] })[] {
  if (!parts.length) return [];
  return parts.reduce<(PreviewPart & { path: PreviewPart[] })[]>((current, level) => {
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

function levelItems(levels: Record<string, unknown>[], fallback: Record<string, unknown>[]) {
  const populated = levels
    .map((level) => arrayFromRecord(level, "items"))
    .filter((items) => items.length);
  return populated.length ? populated : fallback.length ? [fallback] : [];
}

function cellKey(row: PreviewRow, column: PreviewColumn) {
  return `${row.code}::${column.code}`;
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
      if (previous?.groupKey === groupKey) previous.colSpan += 1;
      else cells.push({ ...part, colSpan: 1, groupKey });
    });
    return cells.map(({ groupKey: _groupKey, ...cell }) => cell);
  });
}

function previewPathKey(path: PreviewPart[] | undefined) {
  return (path ?? []).map((part) => normalize(part.code || part.label)).filter(Boolean).join(">");
}

function isPathPrefix(targetPath: PreviewPart[] | undefined, columnPath: PreviewPart[] | undefined) {
  const target = targetPath ?? [];
  const path = columnPath ?? [];
  if (!target.length || target.length > path.length) return false;
  return target.every((part, index) => normalize(part.code || part.label) === normalize(path[index]?.code || path[index]?.label));
}

function generatedFieldsFromStudio(studioState: Record<string, unknown>) {
  return asArray(studioState.computedColumns)
    .filter((field) => text(field.mode, "").toLowerCase() !== "rollup")
    .filter((field) => field.showInPreview !== false)
    .map((field) => ({
      ...field,
      generatedMode: text(field.mode, "compute"),
      code: text(field.code, ""),
      label: text(field.label ?? field.code),
      badge: text(field.outputUom, "Calculated"),
    }))
    .filter((field) => field.code);
}

function rowHeaderLabelsFromStudio(studioState: Record<string, unknown>, rows: PreviewRow[]) {
  const labels = asArray(studioState.rowLevels)
    .map((level) => {
      const direct = text(level.label ?? level.name ?? level.title, "");
      const itemLabels = arrayFromRecord(level, "items").map((item) => text(item.label ?? item.name ?? item.code, "")).filter(Boolean);
      if (/^Level\s+\d+$/i.test(direct) && itemLabels.length) return itemLabels.join(" / ");
      if (direct) return direct;
      return itemLabels.join(" / ");
    })
    .filter(Boolean);
  if (labels.length) return labels;
  const depth = Math.max(1, rows.reduce((max, row) => Math.max(max, row.path.length), 0));
  return Array.from({ length: depth }, (_, index) => index === 0 ? "Row" : `Level ${index + 1}`);
}

function buildSubmittedPreview(
  contract: Record<string, unknown>,
  options: PreviewOptions,
  secondaryMemberLabelCache: Record<string, Record<string, string>>,
  secondaryMeasureLabelCache: Record<string, string>,
  generatedMode: GeneratedColumnMode = "INCLUDE",
): { rows: PreviewRow[]; columns: PreviewColumn[]; rowHeaders: string[] } {
  const studioState = asRecord(contract.studioState);
  const builder = asRecord(studioState.builder);
  const cache = asRecord(contract.previewMemberCache);
  const rowParts = levelItems(asArray(studioState.rowLevels), asArray(builder.rowRepresents))
    .map((items) => items.flatMap((item) => text(item.type, "") === "MEASURE" ? [] : labelsForStudioItem(item, cache, options, secondaryMemberLabelCache, secondaryMeasureLabelCache)))
    .filter((parts) => parts.length);
  const columnParts = levelItems(asArray(studioState.columnLevels), asArray(builder.columns))
    .map((items) => items.flatMap((item) => labelsForStudioItem(item, cache, options, secondaryMemberLabelCache, secondaryMeasureLabelCache)))
    .filter((parts) => parts.length);
  const tabParts = asArray(builder.tabsBy).flatMap((item) => labelsForStudioItem(item, cache, options, secondaryMemberLabelCache, secondaryMeasureLabelCache));
  const generatedFields = [
    ...asArray(builder.fields).filter((field) => Boolean(field.generatedMode)),
    ...generatedFieldsFromStudio(studioState),
  ];
  const showBaseColumns = generatedMode !== "ONLY";
  const showGeneratedColumns = generatedMode !== "EXCLUDE";
  const rows = cartesian(rowParts) as PreviewRow[];
  const groups = cartesian(columnParts) as PreviewColumn[];
  const columns: PreviewColumn[] = groups.length
    ? groups.flatMap((group) =>
        [
          ...(showBaseColumns
            ? tabParts.length
              ? tabParts.map((tab) => ({ code: `${group.code}:${tab.code}`, label: tab.label, groupCode: group.code, groupLabel: group.label, path: [...group.path, tab] }))
              : [{ ...group, groupCode: group.code, groupLabel: group.label, path: group.path }]
            : []),
          ...(showGeneratedColumns
            ? generatedFields
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
                  generatedField: field,
                  path: [...group.path, { code: text(field.code, ""), label: text(field.label ?? field.code) }],
                }))
            : []),
        ],
      )
    : [
        ...(showBaseColumns ? tabParts.map((tab) => ({ ...tab, path: [tab] })) : []),
        ...(showGeneratedColumns ? generatedFields.map((field) => ({ code: text(field.code, ""), label: text(field.label ?? field.code), generatedField: field, path: [{ code: text(field.code, ""), label: text(field.label ?? field.code) }] })) : []),
      ];
  return { rows, columns, rowHeaders: rowHeaderLabelsFromStudio(studioState, rows) };
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

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function compactDispatchReference(run: Record<string, unknown>) {
  const code = field(run, "dispatchRunCode", "dispatch_run_code", "");
  if (!code) return "-";
  if (/^DIS-\d{4}-\d+$/i.test(code)) return code;
  const createdAt = field(run, "createdAt", "created_at", "");
  const parsed = createdAt ? new Date(createdAt) : null;
  const year = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getFullYear() : new Date().getFullYear();
  return `DIS-${year}-001`;
}

function statusClass(value: unknown) {
  return normalize(value).toLowerCase();
}

function statusLabel(value: unknown) {
  return text(value).replace(/_/g, " ");
}

function senderDisplay(communication: Record<string, unknown>) {
  const fromName = text(communication.fromName ?? communication.from_name, "");
  const fromEmail = text(communication.fromEmail ?? communication.from_email, "");
  if (fromName && fromEmail) return `${fromName} <${fromEmail}>`;
  if (fromEmail) return fromEmail;
  return text(communication.smtpProfileCode ?? communication.smtp_profile_code, "System mailbox");
}

function fileToEmailAttachment(file: File): Promise<EmailAttachment> {
  if (file.size > MAX_EMAIL_ATTACHMENT_BYTES) {
    return Promise.reject(new Error(`${file.name} exceeds the 20 MB attachment limit.`));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`${file.name} could not be read.`));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        contentBase64: result.split(",", 2)[1] ?? result,
      });
    };
    reader.readAsDataURL(file);
  });
}

function recipientRows(source: Record<string, unknown>, bucket: "to" | "cc" | "bcc") {
  const rows = asArray(source[bucket]);
  if (rows.length) return rows;
  const emails = Array.isArray(source[bucket]) ? (source[bucket] as unknown[]).map((item) => String(item)) : [];
  return emails.map((email) => ({ email_address: email, display_name: email }));
}

function payloadValues(payload: Record<string, unknown>) {
  const values = asRecord(payload.values);
  return Object.entries(values)
    .filter(([, value]) => text(value, "").trim() !== "")
    .map(([cell, value]) => ({ cell, value: text(value, "") }));
}

function payloadRemarks(payload: Record<string, unknown>) {
  const remarks = asRecord(payload.remarks);
  return Object.entries(remarks)
    .filter(([, value]) => text(value, "").trim() !== "")
    .map(([cell, value]) => ({ cell, value: text(value, "") }));
}

function payloadAttachments(payload: Record<string, unknown>) {
  return asArray(payload.attachments);
}

function attachmentName(attachment: Record<string, unknown>, fallback = "attachment") {
  return text(attachment.filename ?? attachment.name, fallback);
}

function attachmentSizeLabel(attachment: Record<string, unknown>) {
  const size = Number(attachment.size ?? 0);
  return size > 0 ? `${Math.ceil(size / 1024)} KB` : "";
}

function attachmentContent(attachment: Record<string, unknown>) {
  return text(attachment.contentBase64 ?? attachment.content_base64, "");
}

function approvedObservationPeriod(row: Record<string, unknown>) {
  const direct = text(row.reportingPeriod ?? row.reporting_period ?? row.period ?? row.timePeriod ?? row.time_period, "");
  if (direct) return direct;
  const timeDimension = asArray(row.dimensions).find((dimension) => {
    const code = normalize(dimension.dimension_code ?? dimension.dimensionCode ?? dimension.axis_code ?? dimension.axisCode);
    return code.includes("TIME");
  });
  return text(timeDimension?.label ?? timeDimension?.member_code ?? timeDimension?.memberCode, "");
}

function measureUom(measure: Record<string, unknown>) {
  return text(measure.measureUnitCode ?? measure.measure_unit_code ?? measure.unit_code ?? measure.uom ?? measure.badge, "");
}

function generatedFieldMode(field: Record<string, unknown>) {
  return text(field.generatedMode ?? field.mode ?? field.formula_type, "compute").toLowerCase();
}

function isIndividualGeneratedField(field?: Record<string, unknown> | null) {
  return generatedFieldMode(asRecord(field)) === "individual";
}

function generatedFieldFormula(field: Record<string, unknown>) {
  return text(field.formula ?? field.expression_text ?? field.subLabel, "").replace(/^(Computed|Calculated|Rollup)\s*\|\s*/i, "");
}

function normalizedLookup(value: unknown) {
  return text(value, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function evaluateGeneratedValue(
  row: PreviewRow,
  column: PreviewColumn,
  columns: PreviewColumn[],
  values: Record<string, unknown>,
) {
  const field = asRecord(column.generatedField);
  if (!Object.keys(field).length) return "";
  const mode = generatedFieldMode(field);
  const formula = generatedFieldFormula(field);
  if (mode === "rollup") return "Rollup pending";
  if (mode === "individual") return "";
  if (!formula) return "Formula missing";
  const groupColumns = columns.filter((candidate) => candidate.groupCode === column.groupCode && !candidate.generatedField);
  const tokenPattern = /\{\{([^}]+)\}\}/g;
  let missingInput = "";
  const expression = formula.replace(tokenPattern, (_match, rawToken) => {
    const token = normalizedLookup(rawToken);
    const match = groupColumns.find((candidate) => {
      const labels = [
        candidate.code,
        candidate.label,
        candidate.path.map((part) => part.label).join(" "),
        candidate.path.map((part) => part.code).join(" "),
      ].map(normalizedLookup);
      return labels.some((label) => label.includes(token) || token.includes(label));
    });
    if (!match) {
      missingInput = text(rawToken, "input");
      return "NaN";
    }
    const value = Number(text(values[cellKey(row, match)], "").replace(/,/g, ""));
    if (!Number.isFinite(value)) {
      missingInput = text(rawToken, "input");
      return "NaN";
    }
    return String(value);
  });
  if (missingInput) return `Input missing: ${missingInput}`;
  if (!/^[\d\s+\-*/().%NaN]+$/.test(expression)) return "Formula unsupported";
  try {
    const result = Function(`"use strict"; return (${expression.replace(/%/g, "/100")});`)();
    return Number.isFinite(Number(result)) ? Number(result).toLocaleString("en-IN", { maximumFractionDigits: 3 }) : "Unavailable";
  } catch {
    return "Formula error";
  }
}

function inferPeriodicityFromColumns(columns: PreviewColumn[], requestPeriod: string) {
  const years = Array.from(new Set(columns.flatMap((column) => column.path).map((part) => text(part.label, "")).filter((label) => /^\d{4}$/.test(label))))
    .map(Number)
    .sort((left, right) => left - right);
  if (years.length >= 2) {
    const gap = years[1] - years[0];
    if (gap === 1) return "Annual";
    if (gap > 1) return `Every ${gap} years`;
  }
  if (/^\d{4}$/.test(requestPeriod)) return "Annual";
  return "";
}

function submittedPublicationColumnKey(column: PreviewColumn, columnIndex: number) {
  if (column.generatedField) {
    const field = asRecord(column.generatedField);
    return `column-generated:${normalize(column.groupCode ?? column.code)}:${normalize(field.code ?? column.label)}`;
  }
  if (column.groupCode) return `column-repeat-label:${normalize(column.label)}`;
  return `column:${columnIndex}`;
}

function publicationColumnEnabled(studioState: Record<string, unknown>, column: PreviewColumn, columnIndex: number) {
  const map = asRecord(studioState.publicationColumns);
  return map[submittedPublicationColumnKey(column, columnIndex)] === true;
}

function downloadTextFile(filename: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadBase64Attachment(attachment: Record<string, unknown>) {
  const content = attachmentContent(attachment);
  if (!content) return;
  const contentType = text(attachment.contentType ?? attachment.content_type, "application/octet-stream");
  const binary = atob(content.split(",", 2).pop() || content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = attachmentName(attachment);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvValue(value: unknown) {
  const clean = text(value, "").replace(/\r?\n/g, " ");
  return /[",\n]/.test(clean) ? `"${clean.replace(/"/g, '""')}"` : clean;
}

function htmlEscape(value: unknown) {
  return text(value, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

type DetailRow = [string, unknown, "badge"?];

function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="dispatch-detail-definition-list">
      {rows.map(([label, value, type]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {type === "badge" ? (
              <span className={`template-dispatch-badge ${statusClass(value)}`}>{statusLabel(value)}</span>
            ) : (
              text(value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DispatchRunDetailPage() {
  const { dispatchRunCode = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeNotice = (location.state as { notice?: string } | null)?.notice;
  const [run, setRun] = useState<DispatchRun | null>(null);
  const [dispatchHistory, setDispatchHistory] = useState<DispatchRun[]>([]);
  const [indicator, setIndicator] = useState<IndicatorDetail | null>(null);
  const [activeTab, setActiveTab] = useState<DispatchTab>("OVERVIEW");
  const [selectedCommunicationIndex, setSelectedCommunicationIndex] = useState(0);
  const [communicationSearch, setCommunicationSearch] = useState("");
  const [selectedEmailType, setSelectedEmailType] = useState("SEND_REQUEST");
  const [selectedRunItemCode, setSelectedRunItemCode] = useState("");
  const [selectedSubmissionVersion, setSelectedSubmissionVersion] = useState("");
  const [selectedComparePeriods, setSelectedComparePeriods] = useState<string[]>([]);
  const [submissionPreviewScope, setSubmissionPreviewScope] = useState<SubmissionPreviewScope>("SOURCE");
  const [generatedColumnMode, setGeneratedColumnMode] = useState<GeneratedColumnMode>("INCLUDE");
  const [publishMode, setPublishMode] = useState<PublishMode>("ALL_COLUMNS");
  const [submissionPreviewOptions, setSubmissionPreviewOptions] = useState<PreviewOptions>(() => previewOptionsFromSettings({}));
  const [hasTouchedSubmissionPreviewOptions, setHasTouchedSubmissionPreviewOptions] = useState(false);
  const [secondaryMemberLabelCache, setSecondaryMemberLabelCache] = useState<Record<string, Record<string, string>>>({});
  const [secondaryMeasureLabelCache, setSecondaryMeasureLabelCache] = useState<Record<string, string>>({});
  const [hiddenSubmittedColumns, setHiddenSubmittedColumns] = useState<string[]>([]);
  const [frozenSubmittedColumnCount, setFrozenSubmittedColumnCount] = useState(0);
  const [resendAttachments, setResendAttachments] = useState<EmailAttachment[]>([]);
  const [isResending, setIsResending] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [reviewLevels, setReviewLevels] = useState<AuthReviewWorkflowLevel[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadRun() {
    if (!dispatchRunCode) return;
    setIsLoading(true);
    setError("");
    try {
      const loadedRun = await getDispatchRun(dispatchRunCode);
      setRun(loadedRun);
      const loadedRunRecord = loadedRun as Record<string, unknown>;
      const loadedPlanCode = text(loadedRunRecord.dispatchPlanCode ?? loadedRunRecord.dispatch_plan_code, "");
      const loadedUnitCode = text(loadedRunRecord.unitCode ?? loadedRunRecord.unit_code, "");
      const loadedItems = asArray((loadedRun as Record<string, unknown>).items);
      const referenceItem = loadedItems[0] ?? {};
      const referenceTemplateVersion = text(referenceItem.templateVersionCode ?? referenceItem.template_version_code, "");
      const referenceIndicator = text(referenceItem.indicatorCode ?? referenceItem.indicator_code, "");
      const referenceSource = text(referenceItem.sourceOrganizationCode ?? referenceItem.source_organization_code, "");
      if (loadedPlanCode || loadedUnitCode) {
        const history = await listDispatchRuns({
          unitCode: loadedUnitCode || undefined,
          limit: 500,
        }).catch(() => []);
        const matchingHistory = history.filter((historyRun) => {
          const historyRecord = historyRun as Record<string, unknown>;
          const historyPlanCode = text(historyRecord.dispatchPlanCode ?? historyRecord.dispatch_plan_code, "");
          if (loadedPlanCode && historyPlanCode === loadedPlanCode) return true;
          const historyItems = asArray(historyRecord.items);
          return historyItems.some((item) => (
            (!referenceTemplateVersion || text(item.templateVersionCode ?? item.template_version_code, "") === referenceTemplateVersion)
            && (!referenceIndicator || text(item.indicatorCode ?? item.indicator_code, "") === referenceIndicator)
            && (!referenceSource || text(item.sourceOrganizationCode ?? item.source_organization_code, "") === referenceSource)
          ));
        });
        setDispatchHistory(
          (matchingHistory.length ? matchingHistory : [loadedRun]).sort((left, right) => text((right as Record<string, unknown>).createdAt ?? (right as Record<string, unknown>).created_at, "").localeCompare(
            text((left as Record<string, unknown>).createdAt ?? (left as Record<string, unknown>).created_at, ""),
          )),
        );
      } else {
        setDispatchHistory([loadedRun]);
      }
      const firstIndicatorCode = text(loadedItems[0]?.indicatorCode ?? loadedItems[0]?.indicator_code, "");
      if (firstIndicatorCode) {
        const result = await getIndicator(firstIndicatorCode).catch(() => null);
        setIndicator(result?.data ?? null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dispatch detail could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function publishFacts() {
    if (!run?.dispatchRunCode || !firstItemCode) return;
    setIsPublishing(true);
    setError("");
    try {
      const result = await publishDispatchRunItemSubmission(run.dispatchRunCode, firstItemCode, {
        submission_version: Number(selectedSubmissionVersion) || null,
        generated_values: generatedPublicationValues,
        publish_config: {
          publishMode,
          selectedCellKeys: publishCellKeys,
          selectedColumnCodes: publishColumns.map((column) => column.code),
          generatedColumnMode,
          submissionPreviewScope,
        },
      });
      setNotice(`Facts published${result.snapshotCode ? ` as ${text(result.snapshotCode)}` : ""}.`);
      await loadRun();
      setActiveTab("SUBMISSION");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Facts could not be published.");
    } finally {
      setIsPublishing(false);
    }
  }

  useEffect(() => {
    void loadRun();
  }, [dispatchRunCode]);

  useEffect(() => {
    void (async () => {
      const unitCode = text((run as Record<string, unknown> | null)?.unitCode ?? (run as Record<string, unknown> | null)?.unit_code, "");
      if (!unitCode || unitCode === "-") return;
      try {
        const workflows = await listAuthReviewWorkflows(false);
        const workflow = workflows.find((item) => normalize(item.unit_code) === normalize(unitCode)) ?? workflows[0];
        setReviewLevels([...(workflow?.levels ?? [])].filter((level) => level.is_active !== false).sort((a, b) => Number(a.level_number ?? 0) - Number(b.level_number ?? 0)));
      } catch {
        setReviewLevels([]);
      }
    })();
  }, [run]);

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get("tab")?.toUpperCase();
    if (tabParam && TABS.some((tab) => tab.code === tabParam)) {
      setActiveTab(tabParam as DispatchTab);
    }
  }, [location.search]);

  async function resendEmail() {
    if (!dispatchCode) return;
    setIsResending(true);
    setNotice("");
    setError("");
    try {
      const queued = await resendDispatchRunNotification(dispatchCode, selectedEmailType, undefined, {
        attachments: resendAttachments,
      });
      const queuedCount = Number(queued.queuedNotificationEvents ?? 1);
      const processed = asRecord(queued.processedNotifications);
      const sentCount = Number(processed.sentEvents ?? 0);
      const failedCount = Number(processed.failedEvents ?? 0);
      const skippedCount = Number(processed.skippedEvents ?? 0);
      setNotice(sentCount > 0
        ? `${statusLabel(selectedEmailType)} email sent (${sentCount}/${queuedCount}).`
        : `${statusLabel(selectedEmailType)} resend queued but not sent. Failed: ${failedCount}, skipped: ${skippedCount}.`);
      await loadRun();
      setResendAttachments([]);
      setActiveTab("COMMUNICATIONS");
      setSelectedCommunicationIndex(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Email could not be resent.");
    } finally {
      setIsResending(false);
    }
  }

  async function addResendAttachments(files: FileList | null) {
    if (!files?.length) return;
    try {
      const selected = Array.from(files);
      const totalSize = selected.reduce((sum, file) => sum + file.size, 0) + resendAttachments.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_EMAIL_ATTACHMENT_BYTES) {
        setError("Email attachments cannot exceed 20 MB total.");
        return;
      }
      const nextAttachments = await Promise.all(selected.map(fileToEmailAttachment));
      setResendAttachments((current) => [...current, ...nextAttachments].filter(
        (attachment, index, all) => all.findIndex((item) => item.filename === attachment.filename && item.size === attachment.size) === index,
      ));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Attachment could not be added.");
    }
  }

  async function submitReviewAction(action: "APPROVE" | "RETURN") {
    const runItemCode = text(firstItem.runItemCode ?? firstItem.run_item_code, "");
    if (!dispatchCode || !runItemCode) return;
    if (action === "RETURN" && !reviewComments.trim()) {
      setError("Comments are required when returning a submission for correction.");
      return;
    }
    setIsReviewing(true);
    setError("");
    setNotice("");
    try {
      const result = await reviewDispatchRunItemSubmission(dispatchCode, runItemCode, {
        action,
        submission_version: Number(selectedSubmission.submissionVersion || 0) || null,
        approval_level: nextApprovalLevelNumber,
        is_final_level: isFinalReviewLevel,
        comments: reviewComments.trim() || null,
      });
      setNotice(
        action === "APPROVE"
          ? `Submission approved. ${Number(result.queuedNotificationEvents ?? 0)} notification event(s) queued.`
          : `Submission returned for correction. ${Number(result.queuedNotificationEvents ?? 0)} notification event(s) queued.`,
      );
      setReviewComments("");
      setIsReviewModalOpen(false);
      await loadRun();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review action could not be completed.");
    } finally {
      setIsReviewing(false);
    }
  }

  const runRecord = (run ?? {}) as Record<string, unknown>;
  const items = useMemo(() => asArray(runRecord.items), [runRecord.items]);
  useEffect(() => {
    const firstCode = text(items[0]?.runItemCode ?? items[0]?.run_item_code, "");
    if (!items.length) {
      setSelectedRunItemCode("");
      return;
    }
    if (!selectedRunItemCode || !items.some((item) => text(item.runItemCode ?? item.run_item_code, "") === selectedRunItemCode)) {
      setSelectedRunItemCode(firstCode);
    }
  }, [items, selectedRunItemCode]);
  const selectedRunItem = items.find((item) => text(item.runItemCode ?? item.run_item_code, "") === selectedRunItemCode) ?? items[0] ?? {};
  const firstItem = selectedRunItem;
  const firstItemCode = text(selectedRunItem.runItemCode ?? selectedRunItem.run_item_code, "");
  const dataEntryState = asRecord(selectedRunItem.dataEntryState ?? selectedRunItem.data_entry_state);
  const draftPayload = asRecord(dataEntryState.draft);
  const latestSubmission = asRecord(dataEntryState.latestSubmission ?? dataEntryState.latest_submission);
  const latestSubmissionPayload = asRecord(latestSubmission.payload);
  const submissionHistory = asArray(dataEntryState.submissions);
  const selectedSubmission =
    submissionHistory.find((item) => text(item.submissionVersion, "") === selectedSubmissionVersion) ??
    latestSubmission;
  const selectedSubmissionPayload = Object.keys(asRecord(selectedSubmission.payload)).length
    ? asRecord(selectedSubmission.payload)
    : Object.keys(latestSubmissionPayload).length
      ? latestSubmissionPayload
      : draftPayload;
  const submittedValues = payloadValues(selectedSubmissionPayload);
  const submittedRemarks = payloadRemarks(selectedSubmissionPayload);
  const submittedAttachments = payloadAttachments(selectedSubmissionPayload);
  const provider = asRecord(firstItem.providerSnapshot ?? firstItem.provider_snapshot);
  const templateContract = asRecord(firstItem.templateContract ?? firstItem.template_contract);
  const studioState = asRecord(templateContract.studioState);
  const builder = asRecord(studioState.builder);
  const storedPreviewSettings = asRecord(studioState.previewSettings);
  const submittedPreview = useMemo(
    () => buildSubmittedPreview(templateContract, submissionPreviewOptions, secondaryMemberLabelCache, secondaryMeasureLabelCache, generatedColumnMode),
    [generatedColumnMode, secondaryMeasureLabelCache, secondaryMemberLabelCache, submissionPreviewOptions, templateContract],
  );
  const fullGeneratedSubmittedPreview = useMemo(
    () => buildSubmittedPreview(templateContract, submissionPreviewOptions, secondaryMemberLabelCache, secondaryMeasureLabelCache, "INCLUDE"),
    [secondaryMeasureLabelCache, secondaryMemberLabelCache, submissionPreviewOptions, templateContract],
  );
  const publicationSubmittedColumns = useMemo(
    () => fullGeneratedSubmittedPreview.columns.filter((column, index) => publicationColumnEnabled(studioState, column, index)),
    [fullGeneratedSubmittedPreview.columns, studioState],
  );
  const visibleSubmittedColumns = useMemo(
    () => submittedPreview.columns.filter((column) => !hiddenSubmittedColumns.includes(column.code)),
    [hiddenSubmittedColumns, submittedPreview.columns],
  );
  const approvedHistory = asArray(firstItem.approvedHistory ?? firstItem.approved_history ?? provider.approvedHistory ?? provider.approved_history);
  const approvedPeriods = useMemo(
    () => Array.from(new Set(approvedHistory.map(approvedObservationPeriod).filter(Boolean))).slice(0, 12),
    [approvedHistory],
  );
  const approvedComparisonRows = useMemo(
    () => approvedHistory.filter((item) => selectedComparePeriods.includes(approvedObservationPeriod(item))),
    [approvedHistory, selectedComparePeriods],
  );
  const runMetadata = asRecord(runRecord.runMetadata ?? runRecord.run_metadata);
  const dispatchReference = compactDispatchReference(runRecord);
  const dispatchCode = field(runRecord, "dispatchRunCode", "dispatch_run_code");
  const communications = useMemo(() => asArray(runRecord.communications), [runRecord.communications]);
  const communicationTypes = useMemo(() => {
    const observedTypes = communications
      .map((item) => text(item.actionCode ?? item.action_code, ""))
      .filter(Boolean);
    return Array.from(new Set([...RESEND_EMAIL_TYPES, ...observedTypes]));
  }, [communications]);
  const filteredCommunications = useMemo(() => {
    const search = communicationSearch.trim().toLowerCase();
    return communications.filter((item) => {
      const actionCode = text(item.actionCode ?? item.action_code, "");
      const matchesType = !selectedEmailType || actionCode === selectedEmailType;
      const haystack = [
        dispatchReference,
        actionCode,
        text(item.subject, ""),
        text(item.body, ""),
        text(item.eventStatus ?? item.event_status, ""),
      ].join(" ").toLowerCase();
      return matchesType && (!search || haystack.includes(search));
    });
  }, [communications, communicationSearch, selectedEmailType, dispatchReference]);
  const selectedCommunication = filteredCommunications[selectedCommunicationIndex] ?? filteredCommunications[0] ?? {};
  const selectedEmailHistoryCount = communications.filter(
    (item) => text(item.actionCode ?? item.action_code, "") === selectedEmailType,
  ).length;
  const timeline = useMemo(() => asArray(runRecord.timeline), [runRecord.timeline]);
  const resolvedRecipients = asRecord(selectedCommunication.resolvedRecipients ?? selectedCommunication.resolved_recipients);
  const selectedCommunicationAttachments = asArray(selectedCommunication.attachments);
  const snapshotRecipients = asRecord(runMetadata.recipientSnapshot ?? runMetadata.recipient_snapshot ?? firstItem.recipientSnapshot);
  const effectiveRecipients = Object.keys(resolvedRecipients).length ? resolvedRecipients : snapshotRecipients;
  const dispatchStatus = field(runRecord, "dispatchStatus", "dispatch_status", "READY");
  const providerSubmissionStatus = normalize(
    provider.submissionStatus ??
      provider.submission_status ??
      firstItem.submissionStatus ??
      firstItem.submission_status ??
      "",
  );
  const submissionStatus = providerSubmissionStatus || "NOT_STARTED";
  const lifecycleStatus = normalize(latestSubmission.lifecycleStatus ?? provider.lifecycleStatus ?? provider.lifecycle_status ?? submissionStatus);
  const validationStatus = normalize(latestSubmission.validationStatus ?? provider.validationStatus ?? provider.validation_status ?? "NOT_RUN");
  const reviewStatus = normalize(latestSubmission.reviewStatus ?? provider.reviewStatus ?? provider.review_status ?? "NOT_READY");
  const approvalStatus = normalize(latestSubmission.approvalStatus ?? provider.approvalStatus ?? provider.approval_status ?? "NOT_READY");
  const publicationStatus = normalize(latestSubmission.publicationStatus ?? provider.publicationStatus ?? provider.publication_status ?? "NOT_PUBLISHED");
  const selectedReviewMetadata = asRecord(selectedSubmission.reviewMetadata ?? selectedSubmission.review_metadata);
  const reviewActions = asArray(selectedReviewMetadata.reviewActions ?? selectedReviewMetadata.review_actions);
  const completedApprovalLevels = new Set(
    reviewActions
      .filter((item) => normalize(asRecord(item).action) === "APPROVE")
      .map((item) => Number(asRecord(item).approvalLevel ?? asRecord(item).approval_level ?? 0) || 0)
      .filter(Boolean),
  );
  const returnedReviewAction = [...reviewActions].reverse().find((item) => normalize(asRecord(item).action) === "RETURN");
  const lastCompletedApprovalLevel = completedApprovalLevels.size ? Math.max(...Array.from(completedApprovalLevels)) : 0;
  const metadataApprovalLevel =
    normalize(selectedReviewMetadata.action) === "APPROVE"
      ? Number(selectedReviewMetadata.approvalLevel ?? selectedReviewMetadata.approval_level ?? 0) || 0
      : 0;
  const previousApprovalLevel = Math.max(lastCompletedApprovalLevel, metadataApprovalLevel);
  const nextReviewLevel = reviewLevels.find((level) => Number(level.level_number ?? 0) > previousApprovalLevel) ?? reviewLevels[0] ?? { level_number: 1, level_name: "Level 1", is_final_level: true };
  const nextApprovalLevelNumber = Number(nextReviewLevel.level_number ?? 1) || 1;
  const nextApprovalLevelName = text(nextReviewLevel.level_name ?? nextReviewLevel.level_code, `Level ${nextApprovalLevelNumber}`);
  const isFinalReviewLevel = nextReviewLevel.is_final_level !== false && (!reviewLevels.length || nextApprovalLevelNumber >= Math.max(...reviewLevels.map((level) => Number(level.level_number ?? 0) || 0)));
  const canReviewSubmission = ["SUBMITTED", "RESUBMITTED"].includes(normalize(selectedSubmission.submissionStatus ?? submissionStatus)) && ["PENDING_REVIEW", "IN_REVIEW", "PENDING", "NOT_READY"].includes(reviewStatus);
  const approvalTimelineLevels = reviewLevels.length ? reviewLevels : [{ level_number: 1, level_name: "Level 1", is_final_level: true }];
  const indicatorOverview = asRecord(indicator?.overview ?? indicator);
  const indicatorCode = text(firstItem.indicatorCode ?? firstItem.indicator_code ?? provider.indicatorCode ?? runMetadata.indicatorCode);
  const indicatorNumber = text(indicatorOverview.indicator_number ?? provider.indicatorNumber ?? provider.indicatorCode ?? indicatorCode);
  const indicatorName = text(indicatorOverview.name ?? provider.indicatorName ?? provider.indicatorLabel ?? indicatorCode);
  const templateVersion = text(firstItem.templateVersionCode ?? provider.templateVersionCode ?? runMetadata.templateVersionCode);
  const ministry = text(provider.ministryName ?? runMetadata.ministryName);
  const department = text(provider.departmentName ?? runMetadata.departmentName);
  const measures = asArray(templateContract.measures);
  const uom = text(provider.uom ?? provider.unitOfMeasure ?? provider.unit_of_measure ?? firstItem.uom ?? measures.map(measureUom).filter(Boolean).join(", "), "-");
  const publicationPeriodicity = inferPeriodicityFromColumns(publicationSubmittedColumns, field(runRecord, "requestPeriodLabel", "request_period_label", ""));
  const periodicity = text(
    publicationPeriodicity ||
      (provider.periodicity ??
      provider.periodicityLabel ??
      firstItem.periodicity ??
      runMetadata.periodicity ??
      asRecord(templateContract.version).periodicity ??
      inferPeriodicityFromColumns(submittedPreview.columns, field(runRecord, "requestPeriodLabel", "request_period_label", ""))),
    "-",
  );
  const createdAt = field(runRecord, "createdAt", "created_at", "");
  const updatedAt = field(runRecord, "updatedAt", "updated_at", "");
  const sentCommunication = communications.find((item) => text(item.eventStatus ?? item.event_status) === "SENT");
  const currentTimelineState = useMemo(() => {
    if (publicationStatus === "PUBLISHED") return { title: "Facts published", description: "Published data is available for reporting." };
    if (approvalStatus === "APPROVED") return { title: "Approved", description: "Approved and ready to publish facts." };
    if (reviewStatus === "PENDING_REVIEW" || reviewStatus === "IN_REVIEW") return { title: `Pending ${nextApprovalLevelName}`, description: "Submission is waiting for review action." };
    if (lifecycleStatus === "SUBMITTED" || submissionStatus === "SUBMITTED" || submissionStatus === "RESUBMITTED") return { title: "Submitted for review", description: "Latest submission is with reviewers." };
    if (submissionStatus === "IN_PROGRESS" || submissionStatus === "DRAFT") return { title: "Data entry in progress", description: "Officer has started entering data." };
    if (dispatchStatus === "SENT") return { title: "Waiting for submission", description: sentCommunication ? "Request email was sent to recipient." : "Dispatch is sent; communication is being processed." };
    if (dispatchStatus === "READY") return { title: "Ready to send", description: "Dispatch is configured but not sent yet." };
    return { title: statusLabel(dispatchStatus || "Ready"), description: "Current dispatch state." };
  }, [approvalStatus, dispatchStatus, lifecycleStatus, nextApprovalLevelName, publicationStatus, reviewStatus, sentCommunication, submissionStatus]);
  const combinedSubmissionValues = useMemo(() => {
    const merged: Record<string, unknown> = {};
    items.forEach((item) => {
      const state = asRecord(item.dataEntryState ?? item.data_entry_state);
      const latest = asRecord(state.latestSubmission ?? state.latest_submission);
      const payload = asRecord(latest.payload);
      Object.entries(asRecord(payload.values)).forEach(([key, value]) => {
        if (text(value, "").trim()) merged[key] = value;
      });
    });
    return merged;
  }, [items]);
  const effectiveSubmittedValues = submissionPreviewScope === "COMBINED" ? combinedSubmissionValues : asRecord(selectedSubmissionPayload.values);
  const generatedPublicationValues = useMemo(() => {
    const generated: Record<string, unknown> = {};
    const sourceValues = asRecord(selectedSubmissionPayload.values);
    fullGeneratedSubmittedPreview.rows.forEach((row) => {
      fullGeneratedSubmittedPreview.columns.forEach((column) => {
        if (!column.generatedField) return;
        generated[cellKey(row, column)] = isIndividualGeneratedField(column.generatedField)
          ? text(sourceValues[cellKey(row, column)], "")
          : evaluateGeneratedValue(
              row,
              column,
              fullGeneratedSubmittedPreview.columns,
              sourceValues,
            );
      });
    });
    return generated;
  }, [fullGeneratedSubmittedPreview, selectedSubmissionPayload]);
  const publishColumns = useMemo(() => {
    const allColumns = publicationSubmittedColumns;
    if (publishMode === "BASE_COLUMNS_ONLY") return allColumns.filter((column) => !column.generatedField);
    if (publishMode === "GENERATED_COLUMNS_ONLY") return allColumns.filter((column) => column.generatedField);
    if (publishMode === "SELECTED_COLUMNS") {
      const visibleCodes = new Set(visibleSubmittedColumns.map((column) => column.code));
      return allColumns.filter((column) => visibleCodes.has(column.code));
    }
    return allColumns;
  }, [publicationSubmittedColumns, publishMode, visibleSubmittedColumns]);
  const publishCellKeys = useMemo(
    () => fullGeneratedSubmittedPreview.rows.flatMap((row) => publishColumns.map((column) => cellKey(row, column))),
    [fullGeneratedSubmittedPreview.rows, publishColumns],
  );

  useEffect(() => {
    if (!submissionHistory.length) {
      setSelectedSubmissionVersion("");
      return;
    }
    const latest = submissionHistory.find((item) => item.isLatest) ?? submissionHistory[0];
    setSelectedSubmissionVersion(text(latest.submissionVersion, ""));
  }, [firstItemCode, submissionHistory]);

  useEffect(() => {
    if (hasTouchedSubmissionPreviewOptions) return;
    setSubmissionPreviewOptions(previewOptionsFromSettings(storedPreviewSettings));
  }, [hasTouchedSubmissionPreviewOptions, storedPreviewSettings]);

  useEffect(() => {
    const bilingual = submissionPreviewOptions.bilingualLabels;
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
  }, [builder, secondaryMeasureLabelCache, secondaryMemberLabelCache, studioState, submissionPreviewOptions.bilingualLabels]);

  const submissionMetaRows: DetailRow[] = [
    ["Indicator Code", indicatorCode],
    ["Indicator Name", indicatorName],
    ["UOM", uom],
    ["Periodicity", periodicity],
    ["Source Ministry", ministry],
    ["Department", department],
    ["Reporting Period", field(runRecord, "reportingPeriodLabel", "reporting_period_label")],
    ["Due Date", formatDate(field(runRecord, "dueDate", "due_date", ""))],
  ];

  function exportSubmittedData(format: "csv" | "excel") {
    const rowHeaderCount = Math.max(1, submittedPreview.rows.reduce((max, row) => Math.max(max, row.path.length), submittedPreview.rowHeaders.length));
    const leafHeaders = [
      ...Array.from({ length: rowHeaderCount }, (_, index) => submittedPreview.rowHeaders[index] || `Level ${index + 1}`),
      ...visibleSubmittedColumns.map((column) => column.path.map((part) => submissionPreviewOptions.showCodes ? part.code : part.label).join(" / ")),
    ];
    const bodyRows = submittedPreview.rows.map((row) => [
      ...Array.from({ length: rowHeaderCount }, (_, index) => submissionPreviewOptions.showCodes ? row.path[index]?.code || row.code : row.path[index]?.label || row.label),
      ...visibleSubmittedColumns.map((column) => {
        const value = column.generatedField && !isIndividualGeneratedField(column.generatedField)
          ? evaluateGeneratedValue(row, column, visibleSubmittedColumns, effectiveSubmittedValues)
          : text(effectiveSubmittedValues[cellKey(row, column)], "Missing");
        return value || "Missing";
      }),
    ]);
    const infoRows = [
      ["Source", `${ministry}${department && department !== "-" ? `, ${department}` : ""}`],
      ["Indicator", `${indicatorCode} - ${indicatorName}`],
      ["UOM", uom],
      ["Periodicity", periodicity],
      ["Submission version", text(selectedSubmission.submissionVersion, "-")],
      ["Generated on", formatDateTime(new Date().toISOString())],
    ];
    const filenameBase = `submitted-${submissionPreviewScope.toLowerCase()}-${generatedColumnMode.toLowerCase()}-${dispatchReference}-${text(selectedSubmission.submissionVersion, "draft")}`.replace(/[^A-Za-z0-9_-]+/g, "_");
    if (format === "csv") {
      const csv = [
        leafHeaders.map(csvValue).join(","),
        ...bodyRows.map((row) => row.map(csvValue).join(",")),
        "",
        ...infoRows.map((row) => row.map(csvValue).join(",")),
      ].join("\n");
      downloadTextFile(`${filenameBase}.csv`, "text/csv;charset=utf-8", csv);
      return;
    }
    const tableRows = [
      `<tr>${leafHeaders.map((header) => `<th>${htmlEscape(header)}</th>`).join("")}</tr>`,
      ...bodyRows.map((row) => `<tr>${row.map((value) => `<td>${htmlEscape(value)}</td>`).join("")}</tr>`),
      ...infoRows.map((row) => `<tr><td colspan="${Math.max(1, leafHeaders.length)}">${htmlEscape(row[0])}: ${htmlEscape(row[1])}</td></tr>`),
    ].join("");
    const html = `<!doctype html><html><head><meta charset="utf-8" /><style>
      body{font-family:Arial,sans-serif;color:#08264b}
      table{border-collapse:collapse;width:100%;font-size:11px}
      th,td{border:1px solid #9fb4cc;padding:6px;vertical-align:top}
      th{background:#eaf4ff;font-weight:700;text-align:center}
      td:first-child{font-weight:700}
    </style></head><body><h3>${htmlEscape(indicatorNumber)}: ${htmlEscape(indicatorName)}</h3><table>${tableRows}</table></body></html>`;
    if (format === "excel") {
      downloadTextFile(`${filenameBase}.xls`, "application/vnd.ms-excel;charset=utf-8", html);
    }
  }

  return (
    <section className="dispatch-detail-page">
      <div className="template-dispatch-title-row">
        <div>
          <Link className="dispatch-back-link" to="/requests/dispatch-plans"><ArrowLeft size={14} /> Template Dispatch</Link>
          <h1>Dispatch {dispatchReference}</h1>
        </div>
        <div className="dispatch-detail-title-actions">
          <select
            className="secondary-select compact"
            value={dispatchCode}
            onChange={(event) => {
              if (event.target.value && event.target.value !== dispatchCode) {
                navigate(`/requests/dispatch-runs/${encodeURIComponent(event.target.value)}${location.search || ""}`);
              }
            }}
            title="View previous dispatch cycles for this template/source/period"
          >
            {(dispatchHistory.length ? dispatchHistory : run ? [run] : []).map((historyRun, index) => {
              const record = historyRun as Record<string, unknown>;
              const code = text(record.dispatchRunCode ?? record.dispatch_run_code, "");
              const period = text(record.requestPeriodLabel ?? record.request_period_label ?? record.requestPeriodCode, "-");
              const sequence = Number(record.dispatchSequence ?? record.dispatch_sequence ?? index + 1);
              const created = formatDate(text(record.createdAt ?? record.created_at, ""));
              return <option key={code} value={code}>{`DIS-${period}-${String(sequence).padStart(3, "0")} | ${statusLabel(record.dispatchStatus)} | ${created}`}</option>;
            })}
          </select>
          <button className="secondary-button compact" type="button" onClick={() => void loadRun()}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {routeNotice ? <div className="notice success">{routeNotice}</div> : null}
      {notice ? <div className="notice success">{notice}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}
      {isLoading ? <div className="template-dispatch-empty">Loading dispatch...</div> : null}

      {run ? (
        <>
          <nav className="dispatch-detail-tabbar" aria-label="Dispatch detail tabs">
            {TABS.map((tab) => (
              <button
                className={activeTab === tab.code ? "active" : ""}
                key={tab.code}
                type="button"
                onClick={() => setActiveTab(tab.code)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === "OVERVIEW" ? (
            <div className="dispatch-detail-overview-grid">
              <section className="dispatch-detail-panel">
                <h3>Dispatch Information</h3>
                <DetailRows
                  rows={[
                    ["Dispatch ID", dispatchReference],
                    ["Template", templateVersion],
                    ["Indicator Component", indicatorName],
                    ["Full Indicator", `${indicatorNumber} - ${indicatorName}`],
                    ["Goal / Target", text(indicator?.framework_mappings?.[0]?.parents?.map((item) => item.name || item.node_number).filter(Boolean).join(" / "), "-")],
                    ["Reporting Period", field(runRecord, "reportingPeriodLabel", "reporting_period_label")],
                    ["Request Period", field(runRecord, "requestPeriodLabel", "request_period_label")],
                    ["Due Date", formatDate(field(runRecord, "dueDate", "due_date", ""))],
                    ["Dispatch Status", dispatchStatus, "badge"],
                    ["Submission Status", submissionStatus, "badge"],
                    ["Lifecycle Status", lifecycleStatus, "badge"],
                    ["Validation Status", validationStatus, "badge"],
                    ["Review Status", reviewStatus, "badge"],
                    ["Approval Status", approvalStatus, "badge"],
                    ["Last Activity", sentCommunication ? "Email notification sent" : "Dispatch created"],
                  ]}
                />
              </section>
              <aside className="dispatch-detail-side-stack">
                <section className="dispatch-detail-panel">
                  <h3>Progress</h3>
                  <ProgressStepper
                    dispatchStatus={dispatchStatus}
                    submissionStatus={submissionStatus}
                    lifecycleStatus={lifecycleStatus}
                    validationStatus={validationStatus}
                    reviewStatus={reviewStatus}
                    approvalStatus={approvalStatus}
                    publicationStatus={publicationStatus}
                  />
                  <DetailRows rows={[["Opened by Ministry", "No"], ["Last Communication", sentCommunication ? "Initial email sent" : "-"]]} />
                </section>
                <section className="dispatch-detail-panel">
                  <h3>Audit Snapshot</h3>
                  <DetailRows
                    rows={[
                      ["Created On", formatDate(createdAt)],
                      ["Sent On", formatDate(text(sentCommunication?.processedAt ?? sentCommunication?.processed_at, ""))],
                      ["Sent By", text(runRecord.createdByUsername ?? runRecord.created_by_username, "System")],
                      ["Last Communication", sentCommunication ? "Initial email sent" : "-"],
                    ]}
                  />
                </section>
              </aside>
            </div>
          ) : null}

          {activeTab === "RECIPIENT" ? (
            <section className="dispatch-detail-panel dispatch-recipient-panel">
              <h3>Recipient Details</h3>
              <DetailRows rows={[["Ministry", ministry], ["Department / Division", department]]} />
              <RecipientBucket title="To" rows={recipientRows(effectiveRecipients, "to")} />
              <RecipientBucket title="CC" rows={recipientRows(effectiveRecipients, "cc")} />
              <RecipientBucket title="BCC" rows={recipientRows(effectiveRecipients, "bcc")} />
            </section>
          ) : null}

          {activeTab === "PROGRESS" ? (
            <section className="dispatch-detail-panel dispatch-progress-panel">
              <h3>Collection Progress</h3>
              <ProgressStepper
                dispatchStatus={dispatchStatus}
                submissionStatus={submissionStatus}
                lifecycleStatus={lifecycleStatus}
                validationStatus={validationStatus}
                reviewStatus={reviewStatus}
                approvalStatus={approvalStatus}
                publicationStatus={publicationStatus}
                large
              />
              <DetailRows
                rows={[
                  ["Dispatch Status", dispatchStatus, "badge"],
                  ["Submission Status", submissionStatus, "badge"],
                  ["Lifecycle Status", lifecycleStatus, "badge"],
                  ["Validation Status", validationStatus, "badge"],
                  ["Review Status", reviewStatus, "badge"],
                  ["Approval Status", approvalStatus, "badge"],
                  ["Publication Status", publicationStatus, "badge"],
                  ["Opened by Ministry", "No"],
                  ["Last Communication", sentCommunication ? "Initial email sent" : "-"],
                ]}
              />
            </section>
          ) : null}

          {activeTab === "SUBMISSION" ? (
            <section className="dispatch-detail-panel">
              <div className="dispatch-detail-panel-title-row">
                <h3>Submission</h3>
                <div className="dispatch-submission-toolbar">
                  <select
                    value={submissionPreviewScope}
                    onChange={(event) => setSubmissionPreviewScope(event.target.value as SubmissionPreviewScope)}
                    aria-label="Submission preview scope"
                  >
                    <option value="SOURCE">Source View</option>
                    <option value="COMBINED">Combined Template View</option>
                  </select>
                  <select
                    value={generatedColumnMode}
                    onChange={(event) => {
                      setGeneratedColumnMode(event.target.value as GeneratedColumnMode);
                      setHiddenSubmittedColumns([]);
                      setFrozenSubmittedColumnCount(0);
                    }}
                    aria-label="Generated column export mode"
                  >
                    <option value="INCLUDE">With computed/rollup</option>
                    <option value="EXCLUDE">Without computed/rollup</option>
                    <option value="ONLY">Only computed/rollup</option>
                  </select>
                  <select
                    value={publishMode}
                    onChange={(event) => setPublishMode(event.target.value as PublishMode)}
                    aria-label="Publish mode"
                    title="Select which columns become official published facts"
                  >
                    <option value="ALL_COLUMNS">Publish all columns</option>
                    <option value="BASE_COLUMNS_ONLY">Publish entered columns only</option>
                    <option value="GENERATED_COLUMNS_ONLY">Publish generated only</option>
                    <option value="SELECTED_COLUMNS">Publish visible columns</option>
                  </select>
                  <select
                    value={selectedSubmissionVersion}
                    onChange={(event) => setSelectedSubmissionVersion(event.target.value)}
                    aria-label="Submission version"
                  >
                    {submissionHistory.length ? submissionHistory.map((item) => (
                      <option value={text(item.submissionVersion, "")} key={text(item.submissionVersion)}>
                        Version {text(item.submissionVersion)} {item.isLatest ? "(Latest)" : ""}
                      </option>
                    )) : <option value="">No submitted version</option>}
                  </select>
                  <button className="secondary-button compact" type="button" onClick={() => exportSubmittedData("excel")}><Download size={13} /> Excel</button>
                  <button className="secondary-button compact" type="button" onClick={() => exportSubmittedData("csv")}><Download size={13} /> CSV</button>
                  {canReviewSubmission ? (
                    <button className="primary-button compact" type="button" onClick={() => setIsReviewModalOpen(true)}>
                      Approve ({nextApprovalLevelName})
                    </button>
                  ) : approvalStatus === "APPROVED" && publicationStatus !== "PUBLISHED" ? (
                    <button className="primary-button compact" type="button" onClick={() => void publishFacts()} disabled={isPublishing}>
                      {isPublishing ? "Publishing..." : "Publish Facts"}
                    </button>
                  ) : null}
                </div>
              </div>
              {items.length > 1 ? (
                <section className="dispatch-submission-source-strip" aria-label="Submission sources">
                  {items.map((item, index) => {
                    const code = text(item.runItemCode ?? item.run_item_code, `ITEM_${index + 1}`);
                    const itemProvider = asRecord(item.providerSnapshot ?? item.provider_snapshot);
                    const itemState = asRecord(item.dataEntryState ?? item.data_entry_state);
                    const itemSubmission = asRecord(itemState.latestSubmission ?? itemState.latest_submission);
                    const itemStatus = normalize(itemSubmission.submissionStatus ?? itemProvider.submissionStatus ?? "NOT_STARTED");
                    return (
                      <button
                        type="button"
                        className={code === firstItemCode ? "active" : ""}
                        key={code}
                        onClick={() => {
                          setSelectedRunItemCode(code);
                          setHiddenSubmittedColumns([]);
                          setFrozenSubmittedColumnCount(0);
                        }}
                      >
                        <strong>{text(itemProvider.ministryName ?? item.ministryName ?? `Source ${index + 1}`)}</strong>
                        <span>{text(itemProvider.departmentName ?? item.departmentName, "-")}</span>
                        <span>{text(item.templateVersionCode ?? itemProvider.templateVersionCode)} / {text(item.indicatorCode ?? itemProvider.indicatorCode)}</span>
                        <small>{statusLabel(itemStatus)}</small>
                      </button>
                    );
                  })}
                </section>
              ) : null}
              {Object.keys(dataEntryState).length ? (
                <div className="dispatch-submission-content">
                  <section className="dispatch-submission-meta-grid">
                    {submissionMetaRows.map(([label, value]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong>{text(value)}</strong>
                      </div>
                    ))}
                  </section>
                  <section className="dispatch-submission-summary-grid">
                    <div>
                      <span>Entry status</span>
                      <strong>{statusLabel(asRecord(dataEntryState.instance).instanceStatus ?? provider.submissionStatus ?? "NOT_STARTED")}</strong>
                    </div>
                    <div>
                      <span>Latest submission</span>
                      <strong>{latestSubmission.submissionVersion ? `Version ${latestSubmission.submissionVersion}` : "Not submitted"}</strong>
                    </div>
                    <div>
                      <span>Validation</span>
                      <strong>{statusLabel(validationStatus)}</strong>
                    </div>
                    <div>
                      <span>Review status</span>
                      <strong>{statusLabel(reviewStatus)}</strong>
                    </div>
                    <div>
                      <span>Approval</span>
                      <strong>{statusLabel(approvalStatus)}</strong>
                    </div>
                  </section>
                  <section className="dispatch-approval-timeline">
                    <header>
                      <div>
                        <span>Approval Timeline</span>
                        <strong>
                          {approvalStatus === "APPROVED"
                            ? "All approval levels completed"
                            : returnedReviewAction
                              ? "Returned for correction"
                              : canReviewSubmission
                                ? `Needs review: ${nextApprovalLevelName}`
                                : "Waiting for submitted data"}
                        </strong>
                      </div>
                      <small>{reviewActions.length} action(s)</small>
                    </header>
                    <div className="dispatch-approval-levels">
                      {approvalTimelineLevels.map((level) => {
                        const levelNumber = Number(level.level_number ?? 0) || 1;
                        const levelName = text(level.level_name ?? level.level_code, `Level ${levelNumber}`);
                        const isDone = completedApprovalLevels.has(levelNumber) || (approvalStatus === "APPROVED" && previousApprovalLevel >= levelNumber);
                        const isCurrent = !isDone && canReviewSubmission && levelNumber === nextApprovalLevelNumber;
                        const levelAction = [...reviewActions].reverse().find(
                          (item) => Number(asRecord(item).approvalLevel ?? asRecord(item).approval_level ?? 0) === levelNumber,
                        );
                        return (
                          <article className={`${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`} key={levelName}>
                            <i>{isDone ? <Check size={12} /> : levelNumber}</i>
                            <div>
                              <strong>{levelName}</strong>
                              <span>
                                {isDone
                                  ? `Approved${text(asRecord(levelAction).reviewedBy ?? asRecord(levelAction).reviewed_by, "") ? ` by ${text(asRecord(levelAction).reviewedBy ?? asRecord(levelAction).reviewed_by)}` : ""}`
                                  : isCurrent
                                    ? "Pending review"
                                    : "Pending"}
                              </span>
                            </div>
                          </article>
                        );
                      })}
                      {returnedReviewAction ? (
                        <article className="returned">
                          <i>!</i>
                          <div>
                            <strong>Returned for correction</strong>
                            <span>{text(asRecord(returnedReviewAction).comments, "Correction requested.")}</span>
                          </div>
                        </article>
                      ) : null}
                    </div>
                  </section>
                  <section className="dispatch-publish-config-summary">
                    <span>Publish mode</span>
                    <strong>{statusLabel(publishMode)}</strong>
                    <span>{publishColumns.length} column(s), {publishCellKeys.length} cell(s)</span>
                    <span>{publishColumns.filter((column) => column.generatedField).length} generated column(s)</span>
                  </section>

                  <section className="dispatch-submission-preview-grid">
                    <div className="dispatch-submission-box dispatch-submitted-template-box">
                      <div className="dispatch-submitted-preview-title">
                        <h4>Submitted Template Preview</h4>
                        <div className="request-data-entry-preview-controls">
                          {([
                            ["showCodes", "Codes"],
                            ["zebraRows", "Zebra"],
                            ["compactCells", "Compact"],
                          ] as const).map(([key, label]) => (
                            <label key={key}>
                              <input
                                type="checkbox"
                                checked={submissionPreviewOptions[key]}
                                onChange={(event) => {
                                  setHasTouchedSubmissionPreviewOptions(true);
                                  setSubmissionPreviewOptions((current) => ({ ...current, [key]: event.target.checked }));
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
                                    checked={submissionPreviewOptions.bilingualLabels[key]}
                                    onChange={(event) => {
                                      setHasTouchedSubmissionPreviewOptions(true);
                                      setSubmissionPreviewOptions((current) => ({
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
                      </div>
                      {hiddenSubmittedColumns.length ? (
                        <div className="dispatch-submitted-hidden-columns">
                          {hiddenSubmittedColumns.map((code) => (
                            <button
                              className="secondary-button compact"
                              type="button"
                              key={code}
                              onClick={() => setHiddenSubmittedColumns((current) => current.filter((item) => item !== code))}
                            >
                              Show {code}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <SubmittedTemplatePreview
                        rows={submittedPreview.rows}
                        columns={visibleSubmittedColumns}
                        rowHeaders={submittedPreview.rowHeaders}
                        values={effectiveSubmittedValues}
                        remarks={asRecord(selectedSubmissionPayload.remarks)}
                        options={submissionPreviewOptions}
                        frozenColumnCount={frozenSubmittedColumnCount}
                        onSetFrozenColumnCount={setFrozenSubmittedColumnCount}
                        onHideColumn={(code) => {
                          setHiddenSubmittedColumns((current) => Array.from(new Set([...current, code])));
                          setFrozenSubmittedColumnCount((current) => Math.min(current, visibleSubmittedColumns.length - 1));
                        }}
                      />
                    </div>
                    <div className="dispatch-submission-box">
                      <h4>Submission Notes</h4>
                      <article>
                        <strong>Note for all missing cells</strong>
                        <span>{text(selectedSubmissionPayload.submissionNote ?? selectedSubmissionPayload.submission_note, "No overall note added.")}</span>
                      </article>
                      <h4>Evidence & Certification</h4>
                      <article>
                        <strong>{asRecord(selectedSubmissionPayload.certification).certified ? "Certified" : "Not certified"}</strong>
                        <span>{text(asRecord(selectedSubmissionPayload.certification).text, "Certification was not captured for this submission.")}</span>
                      </article>
                      <h4>Cell Remarks</h4>
                      {submittedRemarks.length ? submittedRemarks.map((row) => (
                        <article key={row.cell}>
                          <strong>{row.cell}</strong>
                          <span>{row.value}</span>
                        </article>
                      )) : <p>No remarks added.</p>}
                      <h4>Attachments</h4>
                      {submittedAttachments.length ? (
                        <ul className="dispatch-submission-attachment-list">
                          {submittedAttachments.map((item, index) => (
                            <li key={`${text(item.name)}-${index}`}>
                              <Paperclip size={12} />
                              <span>{attachmentName(item)}</span>
                              <small>{attachmentSizeLabel(item)}</small>
                              <button type="button" disabled={!attachmentContent(item)} onClick={() => downloadBase64Attachment(item)}>Download</button>
                            </li>
                          ))}
                        </ul>
                      ) : <p>No attachments added.</p>}
                      <h4>Compare With Approved Data</h4>
                      {approvedPeriods.length ? (
                        <div className="dispatch-submission-compare-list">
                          {approvedPeriods.map((period) => (
                            <label key={period}>
                              <input
                                type="checkbox"
                                checked={selectedComparePeriods.includes(period)}
                                disabled={!selectedComparePeriods.includes(period) && selectedComparePeriods.length >= 3}
                                onChange={(event) => {
                                  setSelectedComparePeriods((current) =>
                                    event.target.checked
                                      ? [...current, period].slice(0, 3)
                                      : current.filter((item) => item !== period),
                                  );
                                }}
                              />
                              {period}
                            </label>
                          ))}
                          {approvedComparisonRows.length ? (
                            <div className="dispatch-submission-approved-table">
                              <table>
                                <thead>
                                  <tr><th>Period</th><th>Measure</th><th>Approved value</th></tr>
                                </thead>
                                <tbody>
                                  {approvedComparisonRows.slice(0, 30).map((row, index) => (
                                    <tr key={`${text(row.observation_code ?? row.observationCode)}-${index}`}>
                                      <td>{approvedObservationPeriod(row)}</td>
                                      <td>{text(row.measure_code ?? row.measureCode)}</td>
                                      <td>{text(row.approved_value_text ?? row.approvedValueText ?? row.approved_value_numeric ?? row.approvedValueNumeric)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p>No approved historical data is available yet for this template/source. It will appear after approved data is published.</p>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="dispatch-submission-empty">
                  <strong>No submission received yet</strong>
                  <span>Drafts and submitted versions will appear here after the officer saves or submits the assigned template.</span>
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "COMMUNICATIONS" ? (
            <section className="dispatch-communications-shell">
              <aside className="dispatch-communication-list">
                <div className="dispatch-communication-action-row">
                  <select
                    className="dispatch-communication-type-filter"
                    aria-label="Email type"
                    value={selectedEmailType}
                    onChange={(event) => {
                      setSelectedEmailType(event.target.value);
                      setSelectedCommunicationIndex(0);
                    }}
                  >
                    {communicationTypes.map((type) => (
                      <option value={type} key={type}>{statusLabel(type)}</option>
                    ))}
                  </select>
                  <button
                    className="dispatch-resend-button"
                    type="button"
                    onClick={() => void resendEmail()}
                    disabled={isResending || !selectedEmailType || selectedEmailHistoryCount === 0}
                    title={selectedEmailHistoryCount === 0 ? "This email type has no previous communication to resend." : "Queue resend"}
                  >
                    <Send size={13} />
                    {isResending ? "Sending..." : "Resend"}
                  </button>
                </div>
                <label className="dispatch-resend-attachment-picker">
                  <Paperclip size={13} />
                  <span>Add attachments</span>
                  <input
                    type="file"
                    multiple
                    onChange={(event) => {
                      void addResendAttachments(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {resendAttachments.length ? (
                  <div className="dispatch-resend-attachments">
                    {resendAttachments.map((attachment) => (
                      <span key={`${attachment.filename}-${attachment.size}`}>
                        {attachment.filename}
                        <button
                          type="button"
                          aria-label={`Remove ${attachment.filename}`}
                          onClick={() => setResendAttachments((current) => current.filter((item) => item !== attachment))}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <label>
                  <Search size={13} />
                  <input
                    placeholder="Search subject, type, dispatch ID"
                    value={communicationSearch}
                    onChange={(event) => {
                      setCommunicationSearch(event.target.value);
                      setSelectedCommunicationIndex(0);
                    }}
                  />
                </label>
                {filteredCommunications.length ? filteredCommunications.map((item, index) => (
                  <button
                    className={index === selectedCommunicationIndex ? "active" : ""}
                    key={text(item.notificationEventCode ?? item.notification_event_code, String(index))}
                    type="button"
                    onClick={() => setSelectedCommunicationIndex(index)}
                  >
                    <span>{dispatchReference}</span>
                    <em>{statusLabel(item.actionCode ?? item.action_code)}</em>
                    <strong>{text(item.subject, text(item.actionCode ?? item.action_code))}</strong>
                    <small>{formatDateTime(text(item.processedAt ?? item.processed_at ?? item.createdAt ?? item.created_at, ""))}</small>
                    <span className={`template-dispatch-badge ${statusClass(item.eventStatus ?? item.event_status)}`}>
                      {statusLabel(item.eventStatus ?? item.event_status)}
                    </span>
                  </button>
                )) : <p>No matching communication events.</p>}
              </aside>
              <article className="dispatch-communication-detail">
                {filteredCommunications.length ? (
                  <>
                    <header>
                      <h3>{text(selectedCommunication.subject, "Communication")}</h3>
                      <span className={`template-dispatch-badge ${statusClass(selectedCommunication.eventStatus ?? selectedCommunication.event_status)}`}>{text(selectedCommunication.eventStatus ?? selectedCommunication.event_status)}</span>
                    </header>
                    <DetailRows
                      rows={[
                        ["From", senderDisplay(selectedCommunication)],
                        ["To", recipientRows(asRecord(selectedCommunication.resolvedRecipients), "to").map((row) => text(row.display_name ?? row.email_address)).join(", ")],
                        ["CC", recipientRows(asRecord(selectedCommunication.resolvedRecipients), "cc").map((row) => text(row.display_name ?? row.email_address)).join(", ")],
                        ["Sent on", formatDateTime(text(selectedCommunication.processedAt ?? selectedCommunication.processed_at, ""))],
                        ["Type", statusLabel(selectedCommunication.actionCode ?? selectedCommunication.action_code)],
                      ]}
                    />
                    <pre>{text(selectedCommunication.body, "No rendered body captured.")}</pre>
                    <section className="dispatch-communication-attachments">
                      <div>
                        <h4>Attachments</h4>
                        {selectedCommunicationAttachments.length ? (
                          <button className="secondary-button compact" type="button" onClick={() => selectedCommunicationAttachments.forEach(downloadBase64Attachment)}>
                            <Download size={12} /> Download all
                          </button>
                        ) : null}
                      </div>
                      {selectedCommunicationAttachments.length ? (
                        <ul className="dispatch-submission-attachment-list">
                          {selectedCommunicationAttachments.map((attachment, index) => (
                            <li key={`${attachmentName(attachment)}-${index}`}>
                              <Paperclip size={12} />
                              <span>{attachmentName(attachment)}</span>
                              <small>{attachmentSizeLabel(attachment)}</small>
                              <button type="button" disabled={!attachmentContent(attachment)} onClick={() => downloadBase64Attachment(attachment)}>
                                Download
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : <p>No attachments sent with this email.</p>}
                    </section>
                  </>
                ) : (
                  <div className="dispatch-submission-empty">
                    <strong>No communication available</strong>
                    <span>Emails, reminders, and escalation messages will be listed here once generated.</span>
                  </div>
                )}
              </article>
            </section>
          ) : null}

          {activeTab === "TIMELINE" ? (
            <section className="dispatch-detail-panel dispatch-timeline-panel">
              <div className="dispatch-detail-panel-title-row">
                <h3>Activity Timeline</h3>
                <span className="template-dispatch-badge">{timeline.length} events</span>
              </div>
              <div className="dispatch-timeline-list">
                {timeline.map((item, index) => (
                  <article key={`${text(item.label)}-${index}`}>
                    <span className="dispatch-timeline-icon">{index === 0 ? <Check size={13} /> : <Send size={13} />}</span>
                    <div>
                      <strong>{text(item.label)}</strong>
                      <small>{text(item.description)}</small>
                    </div>
                    <time>{formatDate(text(item.occurredAt ?? item.occurred_at, ""))}</time>
                  </article>
                ))}
                <article>
                  <span className="dispatch-timeline-icon current"><Clock size={13} /></span>
                  <div>
                    <strong>{currentTimelineState.title}</strong>
                    <small>{currentTimelineState.description}</small>
                  </div>
                  <time>Now</time>
                </article>
              </div>
            </section>
          ) : null}
          {isReviewModalOpen ? (
            <div className="drawer-backdrop review-modal-backdrop">
              <div className="dispatch-review-modal">
                <button className="dispatch-review-modal-close" type="button" onClick={() => setIsReviewModalOpen(false)}>
                  <X size={14} />
                </button>
                <h3>Review Submission</h3>
                <p>{nextApprovalLevelName}{isFinalReviewLevel ? " (final approval)" : ""}</p>
                <label>
                  Remarks
                  <textarea
                    value={reviewComments}
                    onChange={(event) => setReviewComments(event.target.value)}
                    placeholder="Add approval note or correction instruction"
                  />
                </label>
                <div className="dispatch-review-modal-actions">
                  <button
                    className="secondary-button compact"
                    type="button"
                    disabled={isReviewing || !selectedSubmission.submissionVersion}
                    onClick={() => void submitReviewAction("RETURN")}
                  >
                    Return for Correction
                  </button>
                  <button
                    className="primary-button compact"
                    type="button"
                    disabled={isReviewing || !selectedSubmission.submissionVersion}
                    onClick={() => void submitReviewAction("APPROVE")}
                  >
                    {isReviewing ? "Saving..." : `Approve (${nextApprovalLevelName})`}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function RecipientBucket({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  return (
    <div className="dispatch-recipient-section">
      <span>{title}</span>
      <div>
        {rows.length ? rows.map((row, index) => {
          const name = text(row.display_name ?? row.officer_display_name ?? row.email_address ?? row.email);
          const email = text(row.email_address ?? row.email);
          return (
            <article key={`${title}-${email}-${index}`}>
              <i>{initials(name)}</i>
              <p>
                <strong>{name}</strong>
                <small>{email}</small>
              </p>
            </article>
          );
        }) : <small>-</small>}
      </div>
    </div>
  );
}

function SubmittedTemplatePreview({
  rows,
  columns,
  rowHeaders,
  values,
  remarks,
  options,
  frozenColumnCount,
  onSetFrozenColumnCount,
  onHideColumn,
}: {
  rows: PreviewRow[];
  columns: PreviewColumn[];
  rowHeaders: string[];
  values: Record<string, unknown>;
  remarks: Record<string, unknown>;
  options: PreviewOptions;
  frozenColumnCount: number;
  onSetFrozenColumnCount: (count: number) => void;
  onHideColumn: (code: string) => void;
}) {
  if (!rows.length || !columns.length) {
    return (
      <div className="dispatch-submission-empty">
        <strong>Template preview is unavailable</strong>
        <span>The published template contract is not available for this dispatch item.</span>
      </div>
    );
  }
  const headerDepth = Math.max(...columns.map((column) => column.path.length), 1);
  const groupRows = groupedHeaderRows(columns, Math.max(0, headerDepth - 1));
  const rowHeaderCount = Math.max(1, rows.reduce((max, row) => Math.max(max, row.path.length), rowHeaders.length));
  const rowHeaderWidth = 150 * rowHeaderCount;
  const columnWidth = options.compactCells ? 140 : 160;
  return (
    <div className="dispatch-submitted-preview-wrap">
      <table className={`dispatch-submitted-preview-table ${options.compactCells ? "compact" : ""} ${options.zebraRows ? "zebra" : ""}`}>
        <thead>
          {groupRows.map((headerRow, rowIndex) => (
            <tr key={`submitted-group-${rowIndex}`}>
              <th style={{ top: rowIndex * 34 }} colSpan={rowHeaderCount}>{rowIndex === 0 ? "Column Groups" : ""}</th>
              {headerRow.map((cell, index) => (
                <th style={{ top: rowIndex * 34 }} colSpan={cell.colSpan} key={`${cell.code}-${rowIndex}-${index}`}>
                  {options.showCodes ? cell.code : cell.label}
                </th>
              ))}
            </tr>
          ))}
          <tr>
            {Array.from({ length: rowHeaderCount }, (_, index) => (
              <th style={{ top: groupRows.length * 34 }} key={`submitted-row-head-${index}`}>
                {rowHeaders[index] || `Level ${index + 1}`}
              </th>
            ))}
            {columns.map((column) => (
              <th
                className={columns.indexOf(column) < frozenColumnCount ? "frozen-submitted-column" : ""}
                style={{
                  top: groupRows.length * 34,
                  left: columns.indexOf(column) < frozenColumnCount ? rowHeaderWidth + columns.indexOf(column) * columnWidth : undefined,
                }}
                key={column.code}
              >
                <span className="dispatch-submitted-header-label">
                  <span>{options.showCodes ? column.code : column.path[column.path.length - 1]?.label || column.label}</span>
                  <button
                    type="button"
                    title={columns.indexOf(column) < frozenColumnCount && frozenColumnCount === columns.indexOf(column) + 1 ? "Unfreeze this column" : `Freeze columns 1-${columns.indexOf(column) + 1}`}
                    onClick={() => onSetFrozenColumnCount(frozenColumnCount === columns.indexOf(column) + 1 ? columns.indexOf(column) : columns.indexOf(column) + 1)}
                  >
                    <Pin size={10} />
                  </button>
                  <button type="button" title="Hide column" onClick={() => onHideColumn(column.code)}>
                    <EyeOff size={10} />
                  </button>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code}>
              {Array.from({ length: rowHeaderCount }, (_, index) => (
                <td key={`${row.code}-row-${index}`}>{options.showCodes ? row.path[index]?.code || row.code : row.path[index]?.label || row.label}</td>
              ))}
              {columns.map((column, columnIndex) => {
                const key = cellKey(row, column);
                const value = column.generatedField && !isIndividualGeneratedField(column.generatedField)
                  ? evaluateGeneratedValue(row, column, columns, values)
                  : text(values[key], "");
                const remark = text(remarks[key], "");
                return (
                  <td
                    className={`${!value || value.startsWith("Input missing") || value.endsWith("pending") ? "missing" : ""} ${column.generatedField ? "generated" : ""} ${columnIndex < frozenColumnCount ? "frozen-submitted-column" : ""}`}
                    style={{ left: columnIndex < frozenColumnCount ? rowHeaderWidth + columnIndex * columnWidth : undefined }}
                    key={column.code}
                  >
                    <span>{value || "Missing"}</span>
                    {remark ? (
                      <button type="button" title={remark}>
                        <MessageSquareText size={12} />
                      </button>
                    ) : null}
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

function ProgressStepper({
  dispatchStatus,
  submissionStatus,
  lifecycleStatus = "",
  validationStatus = "",
  reviewStatus = "",
  approvalStatus = "",
  publicationStatus = "",
  large = false,
}: {
  dispatchStatus: string;
  submissionStatus: string;
  lifecycleStatus?: string;
  validationStatus?: string;
  reviewStatus?: string;
  approvalStatus?: string;
  publicationStatus?: string;
  large?: boolean;
}) {
  const dispatch = normalize(dispatchStatus);
  const submission = normalize(submissionStatus);
  const lifecycle = normalize(lifecycleStatus);
  const validation = normalize(validationStatus);
  const review = normalize(reviewStatus);
  const approval = normalize(approvalStatus);
  const publication = normalize(publicationStatus);
  const published = publication === "PUBLISHED" || lifecycle === "PUBLISHED";
  const approved = published || approval === "APPROVED" || review === "APPROVED" || ["APPROVED", "PUBLISHED"].includes(lifecycle);
  const reviewStarted = approved || ["PENDING_REVIEW", "IN_REVIEW", "RETURNED", "APPROVED"].includes(review) || ["REVIEW_PENDING", "APPROVED", "PUBLISHED"].includes(lifecycle);
  const validated = reviewStarted || ["PASSED", "PASSED_WITH_WARNINGS", "FAILED"].includes(validation) || lifecycle.startsWith("VALIDATION_");
  const submitted = validated || ["SUBMITTED", "RESUBMITTED", "APPROVED"].includes(submission);
  const inProgress = submitted || ["IN_PROGRESS", "SUBMITTED", "APPROVED"].includes(dispatch) || ["DRAFT", "IN_PROGRESS", "SUBMITTED", "RESUBMITTED", "APPROVED"].includes(submission);
  const sent = inProgress || ["SENT", "OPENED", "IN_PROGRESS", "SUBMITTED", "APPROVED"].includes(dispatch);
  const steps = [
    ["Dispatched", sent],
    ["In Progress", inProgress],
    ["Submitted", submitted],
    ["Validated", validated],
    ["Review", reviewStarted],
    ["Approved", approved],
    ["Published", published],
  ] as const;
  return (
    <div className={`dispatch-progress-stepper ${large ? "large" : ""}`}>
      {steps.map(([label, done]) => (
        <div className={done ? "done" : ""} key={label}>
          <i>{done ? <Check size={12} /> : null}</i>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
