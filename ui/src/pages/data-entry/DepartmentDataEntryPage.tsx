import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Code2,
  Eye,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  dataEntryAssignments,
  dataEntryGridRows,
  dataEntrySelectedCell,
  dataEntryValidationHints,
  type DataEntryAssignmentSample,
  type DataEntryAssignmentStatus,
  type DataEntryCellStatus,
  type DataEntryGridRowSample,
  type DataEntrySelectedCellSample,
  type DataEntryWorkflowStepSample,
} from "@/data/dataEntry.sample";

type DataEntryModal = "preview-submit" | "json-structure" | null;
type DataEntryStage = "editing" | "draft" | "validation_failed" | "validated" | "submitted";

type DataEntryYearHeader = {
  id: string;
  label: string;
};

type DataEntryCanvasColumn = {
  key: string;
  yearId: string;
  yearLabel: string;
  areaType: string;
  gender: string;
};

type DataEntryNavigationDirection = "up" | "down" | "left" | "right";

const areaTypeHeaders = ["Total", "Rural", "Urban"];
const genderHeaders = ["Female", "Male"];
const initialDataEntryYears: DataEntryYearHeader[] = [{ id: "Y1", label: "2011-12" }];
const yearLabelPattern = /^\d{4}-\d{2}$/;

const columnKey = (yearId: string, areaType: string, gender: string) =>
  `${yearId}_${areaType}_${gender}`.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase();

const getDataEntryColumns = (years: DataEntryYearHeader[]): DataEntryCanvasColumn[] =>
  years.flatMap((year) =>
    areaTypeHeaders.flatMap((areaType) =>
      genderHeaders.map((gender) => ({
        key: columnKey(year.id, areaType, gender),
        yearId: year.id,
        yearLabel: year.label,
        areaType,
        gender,
      })),
    ),
  );

const splitSampleValue = (value: string, gender: string) => {
  const numeric = Number(value);
  if (!value.trim() || Number.isNaN(numeric)) return "";
  const weighted = gender === "Female" ? numeric * 0.49 : numeric * 0.51;
  return weighted.toFixed(1);
};

const initialGridRows = (): DataEntryGridRowSample[] => {
  const columns = getDataEntryColumns(initialDataEntryYears);
  return dataEntryGridRows.map((row) => {
    const values = columns.reduce<Record<string, string>>((accumulator, column) => {
      const sourceKey = `${column.areaType.toLowerCase()}_2011`;
      accumulator[column.key] = splitSampleValue(row.values[sourceKey] ?? "", column.gender);
      return accumulator;
    }, {});
    return { ...row, values };
  });
};

const nextYearLabel = (label: string) => {
  const match = label.match(/^(\d{4})-(\d{2})$/);
  if (!match) return "2012-13";
  const start = Number(match[1]) + 1;
  const end = String((Number(match[2]) + 1) % 100).padStart(2, "0");
  return `${start}-${end}`;
};

const isNumericPercentValue = (value: string) => value === "" || /^\d+(\.\d{0,2})?$/.test(value);

const focusDataEntryCell = (address: string) => {
  window.setTimeout(() => {
    document.querySelector<HTMLElement>(`[data-data-entry-cell="${address}"]`)?.focus();
  }, 0);
};

const assignmentStatusVariant = (status: DataEntryAssignmentStatus) => {
  if (["READY_TO_SUBMIT", "SUBMITTED"].includes(status)) return "secondary";
  if (["ASSIGNED", "IN_PROGRESS", "DRAFT_SAVED"].includes(status)) return "outline";
  return "destructive";
};

const cellStatusVariant = (status: DataEntryCellStatus) => {
  if (status === "VALID") return "secondary";
  if (status === "MISSING") return "destructive";
  return "outline";
};

const workflowVariant = (status: "DONE" | "PENDING" | "BLOCKED") => {
  if (status === "DONE") return "secondary";
  if (status === "PENDING") return "outline";
  return "destructive";
};

function AssignmentInbox({
  query,
  statusFilter,
  assignments,
  onQueryChange,
  onStatusChange,
  onOpenAssignment,
}: {
  query: string;
  statusFilter: DataEntryAssignmentStatus | "ALL";
  assignments: DataEntryAssignmentSample[];
  onQueryChange: (query: string) => void;
  onStatusChange: (status: DataEntryAssignmentStatus | "ALL") => void;
  onOpenAssignment: (assignmentCode: string) => void;
}) {
  const stats = [
    { label: "Assignments", value: assignments.length, note: "Visible records" },
    { label: "In progress", value: assignments.filter((assignment) => assignment.status === "IN_PROGRESS").length, note: "Draft work started" },
    { label: "Issues", value: assignments.reduce((total, assignment) => total + assignment.issue_count, 0), note: "Needs value or comment" },
    { label: "Due soon", value: assignments.filter((assignment) => assignment.status !== "SUBMITTED").length, note: "Open assignments" },
  ];

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="data-entry-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="data-entry-title" className="text-2xl font-bold">Department Data Entry</h1>
          <p className="mt-1 text-sm text-muted-foreground">Open assigned request items, fill governed templates, validate, and submit for ingestion.</p>
        </div>
        <Badge variant="outline">Unit scoped</Badge>
      </div>

      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {stats.map((stat) => (
          <div key={stat.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
            <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold">Assigned request items</h2>
              <p className="mt-1 text-xs text-muted-foreground">Click an assignment to open the full template workspace.</p>
            </div>
            <Badge variant="outline">{assignments.length} records</Badge>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
              <Search aria-hidden="true" className="size-4 text-muted-foreground" />
              <span className="sr-only">Search assignments</span>
              <Input
                className="border-0 bg-transparent"
                placeholder="Search request, indicator, officer, organization"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </label>
            <select
              className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold"
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value as DataEntryAssignmentStatus | "ALL")}
            >
              <option value="ALL">status: all</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DRAFT_SAVED">DRAFT_SAVED</option>
              <option value="VALIDATION_FAILED">VALIDATION_FAILED</option>
              <option value="READY_TO_SUBMIT">READY_TO_SUBMIT</option>
              <option value="SUBMITTED">SUBMITTED</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Request / item</TableHead>
                <TableHead>Indicator</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow
                  key={assignment.assignment_code}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onOpenAssignment(assignment.assignment_code)}
                >
                  <TableCell className="font-mono text-[11px]">{assignment.assignment_code}</TableCell>
                  <TableCell>
                    <span className="block font-mono text-[11px]">{assignment.request_code}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{assignment.item_code}</span>
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal">
                    <span className="block font-semibold">{assignment.indicator_label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{assignment.national_indicator_code}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-xs font-semibold">{assignment.source_organization_name}</span>
                    <span className="text-[11px] text-muted-foreground">{assignment.officer_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block font-semibold">{assignment.completion_label}</span>
                    <span className="text-[11px] text-muted-foreground">{assignment.issue_count} issue(s)</span>
                  </TableCell>
                  <TableCell>{assignment.due_date}</TableCell>
                  <TableCell><Badge variant={assignmentStatusVariant(assignment.status)}>{assignment.status}</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onOpenAssignment(assignment.assignment_code); }}>
                      <FileSpreadsheet aria-hidden="true" className="size-4" /> Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}

function DataEntryGrid({
  rows,
  years,
  columns,
  selectedCellAddress,
  editingCellAddress,
  yearWarnings,
  onSelectCell,
  onStartEdit,
  onStopEdit,
  onNavigateCell,
  onUpdateCell,
  onYearChange,
  onAddYear,
  onDeleteYear,
}: {
  rows: DataEntryGridRowSample[];
  years: DataEntryYearHeader[];
  columns: DataEntryCanvasColumn[];
  selectedCellAddress: string;
  editingCellAddress: string | null;
  yearWarnings: Record<string, string>;
  onSelectCell: (address: string) => void;
  onStartEdit: (address: string) => void;
  onStopEdit: () => void;
  onNavigateCell: (address: string, direction: DataEntryNavigationDirection) => void;
  onUpdateCell: (address: string, value: string) => void;
  onYearChange: (yearId: string, value: string) => void;
  onAddYear: () => void;
  onDeleteYear: (yearId: string) => void;
}) {
  const columnCount = Math.max(columns.length, 1);
  const areaSpan = genderHeaders.length;
  const yearSpan = areaTypeHeaders.length * genderHeaders.length;

  return (
    <div className="overflow-x-auto rounded-md border border-border/70 bg-background">
      <table className="w-full min-w-[1040px] table-fixed border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-primary/5 font-bold text-primary">
            <th className="border-b border-r border-border/60 px-3 py-2" colSpan={columnCount + 2}>
              NIF 1.2.1 - Population below poverty line | Measure: indicator_value | Unit: PERCENT | Editable: numeric data cells + year labels only
            </th>
          </tr>
          <tr className="bg-amber-50 text-center font-bold text-amber-900">
            <th className="border-b border-r border-border/60 px-3 py-2" />
            {years.map((year) => (
              <th key={year.id} className="border-b border-r border-border/60 px-2 py-2" colSpan={yearSpan}>
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-8 flex-1 border-amber-200 bg-card text-center text-[11px] font-bold text-amber-900"
                      value={year.label}
                      onChange={(event) => onYearChange(year.id, event.target.value)}
                      aria-label={`Edit year ${year.label}`}
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="shrink-0 text-red-700 hover:bg-red-50 hover:text-red-800"
                      disabled={years.length === 1}
                      onClick={() => onDeleteYear(year.id)}
                      aria-label={`Delete year ${year.label}`}
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    </Button>
                  </div>
                  {yearWarnings[year.id] ? (
                    <span className="text-[10px] font-semibold text-red-700">{yearWarnings[year.id]}</span>
                  ) : null}
                </div>
              </th>
            ))}
            <th className="border-b border-border/60 px-3 py-2">
              <Button type="button" size="sm" variant="outline" onClick={onAddYear}>
                <Plus aria-hidden="true" className="size-3" /> Year
              </Button>
            </th>
          </tr>
          <tr className="bg-amber-50 text-center font-bold text-amber-900">
            <th className="border-b border-r border-border/60 px-3 py-2">Location</th>
            {years.flatMap((year) =>
              areaTypeHeaders.map((areaType) => (
                <th key={`${year.id}-${areaType}`} className="border-b border-r border-border/60 px-3 py-2" colSpan={areaSpan}>
                  {areaType}
                </th>
              )),
            )}
            <th className="border-b border-border/60 px-3 py-2">Status</th>
          </tr>
          <tr className="bg-muted/50 text-center font-bold">
            <th className="border-b border-r border-border/60 px-3 py-2">Geography</th>
            {columns.map((column) => (
              <th key={column.key} className="border-b border-r border-border/60 px-3 py-2">{column.gender}</th>
            ))}
            <th className="border-b border-border/60 px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.geography_code} className="hover:bg-muted/30">
              <td className="border-b border-r border-border/40 px-3 py-2 font-semibold">{row.geography_label}</td>
              {columns.map((column, index) => {
                const address = `${String.fromCharCode(66 + index)}${row.row_number + 4}`;
                const selected = selectedCellAddress === address;
                const editing = editingCellAddress === address;
                const value = row.values[column.key];

                return (
                  <td key={`${row.geography_code}-${column.key}`} className="border-b border-r border-border/40 p-0">
                    {editing ? (
                      <input
                        data-data-entry-cell={address}
                        className="h-9 w-full bg-primary/10 px-3 font-mono outline-none ring-2 ring-primary/60"
                        value={value}
                        inputMode="decimal"
                        onChange={(event) => onUpdateCell(address, event.target.value)}
                        onFocus={(event) => event.currentTarget.select()}
                        onKeyDown={(event) => {
                          if (event.key === "ArrowUp") {
                            event.preventDefault();
                            onNavigateCell(address, "up");
                          }
                          if (event.key === "ArrowDown") {
                            event.preventDefault();
                            onNavigateCell(address, "down");
                          }
                          if (event.key === "ArrowLeft") {
                            event.preventDefault();
                            onNavigateCell(address, "left");
                          }
                          if (event.key === "ArrowRight") {
                            event.preventDefault();
                            onNavigateCell(address, "right");
                          }
                          if (event.key === "Enter" || event.key === "Escape") {
                            event.preventDefault();
                            onStopEdit();
                          }
                        }}
                        aria-label={`Edit ${address}`}
                      />
                    ) : (
                      <button
                        type="button"
                        data-data-entry-cell={address}
                        onClick={() => onSelectCell(address)}
                        onDoubleClick={() => onStartEdit(address)}
                        onKeyDown={(event) => {
                          if (event.key === " ") {
                            event.preventDefault();
                            onSelectCell(address);
                          }
                          if (event.key === "Enter") {
                            event.preventDefault();
                            onStartEdit(address);
                          }
                          if (/^[0-9]$/.test(event.key)) {
                            event.preventDefault();
                            onStartEdit(address);
                            onUpdateCell(address, event.key);
                          }
                          if (event.key === ".") {
                            event.preventDefault();
                            onStartEdit(address);
                            onUpdateCell(address, "0.");
                          }
                          if (event.key === "Backspace" || event.key === "Delete") {
                            event.preventDefault();
                            onStartEdit(address);
                            onUpdateCell(address, "");
                          }
                          if (event.key === "ArrowUp") {
                            event.preventDefault();
                            onNavigateCell(address, "up");
                          }
                          if (event.key === "ArrowDown") {
                            event.preventDefault();
                            onNavigateCell(address, "down");
                          }
                          if (event.key === "ArrowLeft") {
                            event.preventDefault();
                            onNavigateCell(address, "left");
                          }
                          if (event.key === "ArrowRight") {
                            event.preventDefault();
                            onNavigateCell(address, "right");
                          }
                        }}
                        className={`h-9 w-full px-3 text-left font-mono outline-none hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/40 ${selected ? "bg-primary/10 ring-2 ring-primary/50" : ""}`}
                        aria-label={`Select ${address}`}
                      >
                        {value ? `${value}` : "-"}
                      </button>
                    )}
                  </td>
                );
              })}
              <td className="border-b border-border/40 px-3 py-2">
                <Badge variant={cellStatusVariant(row.status)}>{row.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewSubmitModal({
  assignment,
  missingCount,
  yearWarningCount,
  dataEntryJson,
  onClose,
  onSubmit,
}: {
  assignment: DataEntryAssignmentSample;
  missingCount: number;
  yearWarningCount: number;
  dataEntryJson: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = missingCount === 0 && yearWarningCount === 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="submit-preview-title">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Submission preview</p>
            <h2 id="submit-preview-title" className="text-xl font-bold">Preview governed submission</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-3 text-xs max-lg:grid-cols-1">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="font-semibold text-muted-foreground">Request</p>
              <p className="mt-1 font-mono font-bold">{assignment.request_code}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="font-semibold text-muted-foreground">Item</p>
              <p className="mt-1 font-mono font-bold">{assignment.item_code}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="font-semibold text-muted-foreground">Template instance</p>
              <p className="mt-1 font-mono font-bold">{assignment.template_instance_code}</p>
            </div>
          </div>
          <div className="rounded-md bg-muted/40 p-4 text-sm">
            Submit will create a governed submission/version/manifest for ingestion. This UI preview intentionally hides raw payload bodies, token values, token hashes, source hashes, and internal database IDs.
          </div>
          <details className="rounded-md border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-bold">View dynamic data-entry JSON object</summary>
            <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-50">
              {dataEntryJson}
            </pre>
          </details>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Required values", missingCount === 0 ? "READY" : "BLOCKED", missingCount === 0 ? "All required values are available" : `${missingCount} required value(s) missing`],
                ["Reporting years", yearWarningCount === 0 ? "READY" : "BLOCKED", yearWarningCount === 0 ? "Year labels match YYYY-YY" : `${yearWarningCount} year label(s) need YYYY-YY format`],
                ["Cell comments", "READY", "Optional clarification note saved"],
                ["Submission note", "READY", "Reviewer-visible note included"],
                ["Ingestion handoff", "READY", "Manifest can be created after submit"],
              ].map(([check, status, note]) => (
                <TableRow key={check}>
                  <TableCell>{check}</TableCell>
                  <TableCell><Badge variant={status === "BLOCKED" ? "destructive" : "secondary"}>{status}</Badge></TableCell>
                  <TableCell>{note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-4">
          <span className="text-xs text-muted-foreground">Visual state only. No API mutation is executed.</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="button" onClick={onSubmit} disabled={!canSubmit}>Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataEntryJsonModal({
  dataEntryJson,
  onClose,
}: {
  dataEntryJson: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="data-json-title">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Data-entry JSON</p>
            <h2 id="data-json-title" className="text-xl font-bold">Template structure with submitted values</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close JSON view">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="overflow-auto p-5">
          <pre className="max-h-[68vh] overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed text-foreground">
            {dataEntryJson}
          </pre>
        </div>
      </div>
    </div>
  );
}

function DataEntryWorkspace({
  assignment,
  rows,
  years,
  columns,
  yearWarnings,
  selectedCell,
  missingCount,
  completionLabel,
  stage,
  workflowSteps,
  selectedCellAddress,
  editingCellAddress,
  cellInputWarning,
  onSelectCell,
  onStartEdit,
  onStopEdit,
  onNavigateCell,
  onUpdateCell,
  onYearChange,
  onAddYear,
  onDeleteYear,
  onSaveDraft,
  onValidate,
  onSubmit,
  onBack,
  onPreviewSubmit,
  onViewJson,
  isFullPage,
  onToggleFullPage,
}: {
  assignment: DataEntryAssignmentSample;
  rows: DataEntryGridRowSample[];
  years: DataEntryYearHeader[];
  columns: DataEntryCanvasColumn[];
  yearWarnings: Record<string, string>;
  selectedCell: DataEntrySelectedCellSample;
  missingCount: number;
  completionLabel: string;
  stage: DataEntryStage;
  workflowSteps: DataEntryWorkflowStepSample[];
  selectedCellAddress: string;
  editingCellAddress: string | null;
  cellInputWarning: string;
  onSelectCell: (address: string) => void;
  onStartEdit: (address: string) => void;
  onStopEdit: () => void;
  onNavigateCell: (address: string, direction: DataEntryNavigationDirection) => void;
  onUpdateCell: (address: string, value: string) => void;
  onYearChange: (yearId: string, value: string) => void;
  onAddYear: () => void;
  onDeleteYear: (yearId: string) => void;
  onSaveDraft: () => void;
  onValidate: () => void;
  onSubmit: () => void;
  onBack: () => void;
  onPreviewSubmit: () => void;
  onViewJson: () => void;
  isFullPage: boolean;
  onToggleFullPage: () => void;
}) {
  const yearWarningCount = Object.keys(yearWarnings).length;
  const statCards = [
    { label: "Request", value: assignment.request_code, note: stage === "submitted" ? "SUBMITTED" : assignment.status },
    { label: "Item", value: assignment.national_indicator_code, note: assignment.indicator_label },
    { label: "Completion", value: completionLabel, note: `${missingCount} required issue(s)` },
    { label: "Years", value: years.length, note: Object.keys(yearWarnings).length ? "format warning" : "editable headers" },
  ];

  const sectionClassName = isFullPage
    ? "fixed inset-0 z-50 flex flex-col gap-4 overflow-y-auto bg-background p-4 lg:p-5"
    : "mx-auto flex max-w-[1280px] flex-col gap-4";

  const infoGridClassName = isFullPage ? "hidden" : "grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1";
  const workflowClassName = isFullPage ? "hidden" : "";
  const contentGridClassName = isFullPage ? "grid grid-cols-1 gap-4" : "grid grid-cols-[minmax(0,1fr)_330px] gap-4 max-xl:grid-cols-1";

  return (
    <section className={sectionClassName} aria-labelledby="data-workspace-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Button type="button" variant="outline" size="icon-sm" onClick={onBack} aria-label="Back to assignments">
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <div>
            <h1 id="data-workspace-title" className="text-2xl font-bold">Department Data Entry Form</h1>
            <p className="mt-1 text-sm text-muted-foreground">Fill the assigned governed template, add notes, validate, then submit to ingestion.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Autosaved 10:42</Badge>
          <Badge variant={stage === "submitted" ? "secondary" : assignmentStatusVariant(assignment.status)}>
            {stage === "submitted" ? "SUBMITTED" : assignment.status}
          </Badge>
          <Button type="button" variant="outline" size="sm" onClick={onToggleFullPage}>
            {isFullPage ? <Minimize2 aria-hidden="true" className="size-4" /> : <Maximize2 aria-hidden="true" className="size-4" />}
            {isFullPage ? "Exit full page" : "Full page"}
          </Button>
        </div>
      </div>

      <div className={infoGridClassName}>
        {statCards.map((card) => (
          <div key={card.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
            <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
            <p className="mt-2 truncate text-lg font-bold">{card.value}</p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">{card.note}</p>
          </div>
        ))}
      </div>

      <Card className={workflowClassName}>
        <CardContent className="flex flex-wrap items-center gap-2">
          {workflowSteps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2 text-xs">
              <span className="grid size-6 place-items-center rounded-full bg-muted font-bold">{index + 1}</span>
              <span className="font-semibold">{step.label}</span>
              <Badge variant={workflowVariant(step.status)}>{step.status}</Badge>
              {index < workflowSteps.length - 1 ? <span className="text-muted-foreground">&gt;</span> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className={contentGridClassName}>
        <Card>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">Rendered template instance</h2>
                <p className="text-xs text-muted-foreground">{assignment.template_instance_code}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={onViewJson}>
                  <Code2 aria-hidden="true" className="size-4" /> JSON
                </Button>
                <Button size="sm" variant="outline">
                  <Eye aria-hidden="true" className="size-4" /> Cell help
                </Button>
              </div>
            </div>
            <DataEntryGrid
              rows={rows}
              years={years}
              columns={columns}
              selectedCellAddress={selectedCellAddress}
              editingCellAddress={editingCellAddress}
              yearWarnings={yearWarnings}
              onSelectCell={onSelectCell}
              onStartEdit={onStartEdit}
              onStopEdit={onStopEdit}
              onNavigateCell={onNavigateCell}
              onUpdateCell={onUpdateCell}
              onYearChange={onYearChange}
              onAddYear={onAddYear}
              onDeleteYear={onDeleteYear}
            />
            <p className="text-xs text-muted-foreground">Department users can edit numeric percent values and reporting year labels only. Geography, area type, gender, unit, measure, required flag, and validation rules are generated from the governed template.</p>
          </CardContent>
        </Card>

        <Card className={isFullPage ? "max-w-none" : ""}>
          <CardContent className="grid gap-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">Selected cell context</h2>
                <p className="mt-1 text-xs text-muted-foreground">Cell {selectedCell.address} | value: {selectedCell.value || "blank"}</p>
              </div>
              <Badge variant={selectedCell.value ? "secondary" : "destructive"}>{selectedCell.value ? "Has value" : "Needs value"}</Badge>
            </div>

            <div className="grid gap-2 text-xs">
              {[
                ["Geography", selectedCell.row_label],
                ["Time", selectedCell.time_period],
                ["Area type", selectedCell.area_type],
                ["Gender", selectedCell.gender ?? "Not applicable"],
                ["Measure", selectedCell.measure_code],
                ["Data type", `${selectedCell.value_type} / ${selectedCell.unit_code}`],
                ["Rule", selectedCell.validation_profile_code],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-border/70 pb-2">
                  <span className="font-semibold text-muted-foreground">{label}</span>
                  <span className="text-right font-semibold">{value}</span>
                </div>
              ))}
            </div>

            <div className="grid gap-2 rounded-md bg-muted/40 p-3 text-xs">
              <p className="font-bold">Editable rule for this cell</p>
              <p className="text-muted-foreground">Only numeric percent values with up to two decimals are accepted. The unit is fixed by the template as PERCENT.</p>
              {cellInputWarning ? (
                <div className="flex gap-2 rounded-md bg-red-50 p-2 font-semibold text-red-800">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 size-4" />
                  <span>{cellInputWarning}</span>
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <p className="text-xs font-bold">Validation hints</p>
              {dataEntryValidationHints.map((hint) => (
                <div key={hint.rule_code} className="flex gap-2 rounded-md bg-muted/40 p-2 text-xs">
                  {hint.severity === "ERROR" ? <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 text-red-700" /> : <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 text-green-700" />}
                  <div>
                    <p className="font-semibold">{hint.rule_code}</p>
                    <p className="text-muted-foreground">{hint.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <label className="grid gap-1 text-xs font-semibold">
              Cell comment
              <Textarea defaultValue={selectedCell.comment} />
            </label>

            <label className="grid gap-1 text-xs font-semibold">
              Submission note before submit
              <Textarea defaultValue="Values entered from department workspace. Missing value needs source clarification before final submit." />
            </label>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Ready to submit?</p>
            <p className="mt-1 text-xs text-muted-foreground">Complete the missing required value or add a clear note before submit. Preview shows governed submission summary only.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={missingCount > 0 ? "destructive" : "secondary"}>{missingCount} missing required value(s)</Badge>
            <Badge variant={yearWarningCount > 0 ? "destructive" : "secondary"}>{yearWarningCount} year format warning(s)</Badge>
            <Badge variant="secondary">Note supported</Badge>
            <Button type="button" variant="outline" onClick={onSaveDraft}><Save aria-hidden="true" className="size-4" /> Save draft</Button>
            <Button type="button" variant="outline" onClick={onValidate}><CheckCircle2 aria-hidden="true" className="size-4" /> Validate</Button>
            <Button type="button" variant="outline" onClick={onPreviewSubmit}><Eye aria-hidden="true" className="size-4" /> Preview submit</Button>
            <Button type="button" onClick={onSubmit} disabled={missingCount > 0 || yearWarningCount > 0 || stage !== "validated"}><Send aria-hidden="true" className="size-4" /> Submit</Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function DepartmentDataEntryPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DataEntryAssignmentStatus | "ALL">("ALL");
  const [selectedAssignmentCode, setSelectedAssignmentCode] = useState<string | null>(null);
  const [selectedCellAddress, setSelectedCellAddress] = useState("B5");
  const [editingCellAddress, setEditingCellAddress] = useState<string | null>(null);
  const [years, setYears] = useState<DataEntryYearHeader[]>(initialDataEntryYears);
  const [gridRows, setGridRows] = useState<DataEntryGridRowSample[]>(initialGridRows);
  const [stage, setStage] = useState<DataEntryStage>("editing");
  const [modal, setModal] = useState<DataEntryModal>(null);
  const [cellInputWarning, setCellInputWarning] = useState("");
  const [isWorkspaceFullPage, setIsWorkspaceFullPage] = useState(false);

  const columns = useMemo(() => getDataEntryColumns(years), [years]);
  const yearWarnings = useMemo(
    () => {
      const labelCounts = years.reduce<Record<string, number>>((accumulator, year) => {
        const normalized = year.label.trim().toLowerCase();
        if (normalized) accumulator[normalized] = (accumulator[normalized] ?? 0) + 1;
        return accumulator;
      }, {});

      return years.reduce<Record<string, string>>((accumulator, year) => {
        const normalized = year.label.trim().toLowerCase();
        if (!yearLabelPattern.test(year.label)) {
          accumulator[year.id] = "Use YYYY-YY, e.g. 2011-12";
        } else if (labelCounts[normalized] > 1) {
          accumulator[year.id] = "Duplicate year";
        }
        return accumulator;
      }, {});
    },
    [years],
  );
  const totalCellCount = gridRows.length * columns.length;
  const missingCount = gridRows.reduce(
    (total, row) => total + columns.filter((column) => (row.values[column.key] ?? "").trim() === "").length,
    0,
  );
  const yearWarningCount = Object.keys(yearWarnings).length;
  const completionLabel = `${totalCellCount - missingCount} / ${totalCellCount} cells`;

  const filteredAssignments = useMemo(() => {
    const normalized = query.toLowerCase();
    return dataEntryAssignments.filter((assignment) => {
      const matchesStatus = statusFilter === "ALL" || assignment.status === statusFilter;
      const matchesQuery = Object.values(assignment).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const selectedAssignment = dataEntryAssignments.find((assignment) => assignment.assignment_code === selectedAssignmentCode) ?? null;
  const selectedColumnIndex = Math.max(0, selectedCellAddress.charCodeAt(0) - 66);
  const selectedColumn = columns[selectedColumnIndex] ?? columns[0];
  const selectedRowNumber = Number(selectedCellAddress.slice(1)) - 4;
  const selectedRow = gridRows.find((row) => row.row_number === selectedRowNumber) ?? gridRows[0];
  const selectedCell: DataEntrySelectedCellSample = {
    ...dataEntrySelectedCell,
    address: selectedCellAddress,
    value: selectedColumn ? selectedRow?.values[selectedColumn.key] ?? "" : "",
    row_label: selectedRow?.geography_label ?? dataEntrySelectedCell.row_label,
    time_period: selectedColumn?.yearLabel ?? dataEntrySelectedCell.time_period,
    area_type: selectedColumn?.areaType ?? dataEntrySelectedCell.area_type,
    gender: selectedColumn?.gender,
  };

  const dataEntryJson = useMemo(() => {
    const submittedValues = gridRows.flatMap((row) =>
      columns.map((column) => ({
        cell_code: `${row.geography_code}_${column.yearLabel}_${column.areaType}_${column.gender}`.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase(),
        geography_code: row.geography_code,
        geography_label: row.geography_label,
        time_period: column.yearLabel,
        time_period_code: column.yearId,
        area_type: column.areaType,
        area_type_code: column.areaType.toUpperCase(),
        gender: column.gender,
        gender_code: column.gender.toUpperCase(),
        measure_code: "INDICATOR_VALUE",
        unit_code: "PERCENT",
        value_numeric: row.values[column.key] ?? "",
        column_key: column.key,
      })),
    );

    return JSON.stringify(
      {
        template_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP",
        template_version_code: selectedAssignment?.template_version_code ?? null,
        indicator: {
          national_indicator_code: selectedAssignment?.national_indicator_code ?? "NIF_1_2_1",
          global_indicator_code: "GIND_1_2_1",
          name: selectedAssignment?.indicator_label ?? "Population below poverty line",
          source_unit_code: "SSD_DEMO_SOURCE",
        },
        geography_scope: "STATE_ONLY",
        request: {
          request_code: selectedAssignment?.request_code ?? null,
          item_code: selectedAssignment?.item_code ?? null,
          assignment_code: selectedAssignment?.assignment_code ?? null,
        },
        template_instance_code: selectedAssignment?.template_instance_code ?? null,
        row_axes: [
          {
            axis_code: "GEOGRAPHY",
            axis_role: "ROW",
            members: gridRows.map((row) => ({
              member_code: row.geography_code,
              label: row.geography_label,
              parent_member_code: "IND",
            })),
          },
        ],
        column_axes: [
          {
            axis_code: "TIME_PERIOD",
            axis_role: "COLUMN",
            members: years.map((year) => ({
              member_code: year.id,
              label: year.label,
              parent_member_code: null,
            })),
          },
          {
            axis_code: "AREA_TYPE",
            axis_role: "COLUMN",
            members: areaTypeHeaders.map((areaType) => ({
              member_code: areaType.toUpperCase(),
              label: areaType,
              parent_member_code: null,
            })),
          },
          {
            axis_code: "GENDER",
            axis_role: "COLUMN",
            members: genderHeaders.map((gender) => ({
              member_code: gender.toUpperCase(),
              label: gender,
              parent_member_code: null,
            })),
          },
        ],
        measure: {
          measure_code: "INDICATOR_VALUE",
          value_type: "NUMERIC",
          unit_code: "PERCENT",
          required: true,
          decimal_places: 2,
          validation_rule: "NUMERIC_NON_NEGATIVE",
        },
        editable_years: years.map((year) => ({ year_id: year.id, display_label: year.label })),
        fixed_template_axes: {
          row_axis: "GEOGRAPHY",
          column_axes: ["TIME_PERIOD", "AREA_TYPE", "GENDER"],
          measure_code: "INDICATOR_VALUE",
          unit_code: "PERCENT",
          value_type: "NUMERIC",
        },
        data_entry_binding_shape: {
          rows_from: ["GEOGRAPHY"],
          columns_from: ["TIME_PERIOD", "AREA_TYPE", "GENDER"],
          value_object: {
            cell_code: "generated from row/column axis members",
            value_numeric: "entered by department user",
            unit_code: "PERCENT",
            dimensions: ["geography", "time_period", "area_type", "gender"],
          },
        },
        submitted_values: submittedValues,
      },
      null,
      2,
    );
  }, [columns, gridRows, selectedAssignment, years]);

  const workflowSteps: DataEntryWorkflowStepSample[] = [
    { label: "Assigned", status: "DONE" },
    { label: "Fill template", status: missingCount === 0 ? "DONE" : "PENDING" },
    { label: "Add note/comment", status: stage === "draft" || stage === "validated" || stage === "submitted" ? "DONE" : "PENDING" },
    { label: "Validate", status: stage === "validated" || stage === "submitted" ? "DONE" : stage === "validation_failed" || yearWarningCount > 0 ? "BLOCKED" : "PENDING" },
    { label: "Preview submit", status: stage === "submitted" ? "DONE" : stage === "validated" ? "PENDING" : "BLOCKED" },
    { label: "Submit", status: stage === "submitted" ? "DONE" : stage === "validated" ? "PENDING" : "BLOCKED" },
  ];

  const handleOpenAssignment = (assignmentCode: string) => {
    setSelectedAssignmentCode(assignmentCode);
    setSelectedCellAddress("B5");
    setEditingCellAddress(null);
    setYears(initialDataEntryYears);
    setGridRows(initialGridRows());
    setStage("editing");
    setCellInputWarning("");
    setIsWorkspaceFullPage(false);
    focusDataEntryCell("B5");
  };

  const handleSelectCell = (address: string) => {
    setSelectedCellAddress(address);
    setEditingCellAddress(null);
    focusDataEntryCell(address);
  };

  const handleStartEdit = (address: string) => {
    setSelectedCellAddress(address);
    setEditingCellAddress(address);
    focusDataEntryCell(address);
  };

  const handleStopEdit = () => {
    setEditingCellAddress(null);
    focusDataEntryCell(selectedCellAddress);
  };

  const handleNavigateCell = (address: string, direction: DataEntryNavigationDirection) => {
    const columnIndex = address.charCodeAt(0) - 66;
    const rowNumber = Number(address.slice(1)) - 4;
    const nextColumnIndex = {
      left: Math.max(0, columnIndex - 1),
      right: Math.min(columns.length - 1, columnIndex + 1),
      up: columnIndex,
      down: columnIndex,
    }[direction];
    const nextRowNumber = {
      up: Math.max(1, rowNumber - 1),
      down: Math.min(gridRows.length, rowNumber + 1),
      left: rowNumber,
      right: rowNumber,
    }[direction];
    const nextAddress = `${String.fromCharCode(66 + nextColumnIndex)}${nextRowNumber + 4}`;
    setSelectedCellAddress(nextAddress);
    setEditingCellAddress(null);
    focusDataEntryCell(nextAddress);
  };

  const handleUpdateCell = (address: string, value: string) => {
    if (!isNumericPercentValue(value)) {
      setCellInputWarning("Only numeric percent values with up to two decimals are accepted.");
      return;
    }

    setCellInputWarning("");
    const columnIndex = address.charCodeAt(0) - 66;
    const column = columns[columnIndex];
    const rowNumber = Number(address.slice(1)) - 4;
    if (!column) return;

    setGridRows((current) =>
      current.map((row) => {
        if (row.row_number !== rowNumber) return row;
        const values = { ...row.values, [column.key]: value };
        const rowMissing = columns.some((gridColumn) => (values[gridColumn.key] ?? "").trim() === "");
        return { ...row, values, status: rowMissing ? "MISSING" : "VALID" };
      }),
    );
    setStage("editing");
  };

  const handleYearChange = (yearId: string, value: string) => {
    setYears((current) => current.map((year) => (year.id === yearId ? { ...year, label: value } : year)));
    setStage("editing");
  };

  const handleAddYear = () => {
    const lastYear = years.at(-1);
    const nextYear: DataEntryYearHeader = {
      id: `Y${years.length + 1}`,
      label: nextYearLabel(lastYear?.label ?? "2011-12"),
    };
    const newColumns = getDataEntryColumns([nextYear]);
    setYears((current) => [...current, nextYear]);
    setGridRows((current) =>
      current.map((row) => ({
        ...row,
        values: {
          ...row.values,
          ...Object.fromEntries(newColumns.map((column) => [column.key, ""])),
        },
        status: "MISSING",
      })),
    );
    setStage("editing");
  };

  const handleDeleteYear = (yearId: string) => {
    if (years.length === 1) return;
    const deletedColumns = getDataEntryColumns(years.filter((year) => year.id === yearId)).map((column) => column.key);
    setYears((current) => current.filter((year) => year.id !== yearId));
    setGridRows((current) =>
      current.map((row) => {
        const values = { ...row.values };
        deletedColumns.forEach((key) => {
          delete values[key];
        });
        return { ...row, values };
      }),
    );
    setSelectedCellAddress("B5");
    setEditingCellAddress(null);
    setStage("editing");
  };

  const handleSaveDraft = () => {
    setStage("draft");
  };

  const handleValidate = () => {
    setStage(missingCount > 0 || yearWarningCount > 0 ? "validation_failed" : "validated");
  };

  const handleSubmit = () => {
    if (missingCount > 0 || yearWarningCount > 0) {
      setStage("validation_failed");
      return;
    }

    setStage("submitted");
    setModal(null);
  };

  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground">
      <a
        href="#data-entry-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to data entry content
      </a>
      <main id="data-entry-content" className="min-h-screen p-4 lg:p-5">
      {selectedAssignment ? (
        <DataEntryWorkspace
          assignment={selectedAssignment}
          rows={gridRows}
          years={years}
          columns={columns}
          yearWarnings={yearWarnings}
          selectedCell={selectedCell}
          missingCount={missingCount}
          completionLabel={completionLabel}
          stage={stage}
          workflowSteps={workflowSteps}
          selectedCellAddress={selectedCellAddress}
          editingCellAddress={editingCellAddress}
          cellInputWarning={cellInputWarning}
          onSelectCell={handleSelectCell}
          onStartEdit={handleStartEdit}
          onStopEdit={handleStopEdit}
          onNavigateCell={handleNavigateCell}
          onUpdateCell={handleUpdateCell}
          onYearChange={handleYearChange}
          onAddYear={handleAddYear}
          onDeleteYear={handleDeleteYear}
          onSaveDraft={handleSaveDraft}
          onValidate={handleValidate}
          onSubmit={handleSubmit}
          onBack={() => {
            setSelectedAssignmentCode(null);
            setIsWorkspaceFullPage(false);
          }}
          onPreviewSubmit={() => setModal("preview-submit")}
          onViewJson={() => setModal("json-structure")}
          isFullPage={isWorkspaceFullPage}
          onToggleFullPage={() => setIsWorkspaceFullPage((current) => !current)}
        />
      ) : (
        <AssignmentInbox
          query={query}
          statusFilter={statusFilter}
          assignments={filteredAssignments}
          onQueryChange={setQuery}
          onStatusChange={setStatusFilter}
          onOpenAssignment={handleOpenAssignment}
        />
      )}
      {modal === "preview-submit" && selectedAssignment ? (
        <PreviewSubmitModal
          assignment={selectedAssignment}
          missingCount={missingCount}
          yearWarningCount={yearWarningCount}
          dataEntryJson={dataEntryJson}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      ) : null}
      {modal === "json-structure" ? (
        <DataEntryJsonModal
          dataEntryJson={dataEntryJson}
          onClose={() => setModal(null)}
        />
      ) : null}
      </main>
    </div>
  );
}
