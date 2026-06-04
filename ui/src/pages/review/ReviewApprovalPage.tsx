import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  MessageSquareText,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ApiError } from "@/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
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
  reviewActions,
  reviewApprovals,
  reviewCellDetail,
  reviewContextTrail,
  reviewTasks,
  type ApprovalStatus,
  type ReviewActionSample,
  type ReviewActionType,
  type ReviewPriority,
  type ReviewTaskSample,
  type ReviewTaskStatus,
} from "@/data/review.sample";
import { useLanguage } from "@/providers/language-context";
import { reviewService } from "@/services/reviewService";
import type { WorkflowRecord } from "@/types/workflow";

type ReviewModal = ReviewActionType | "cell-detail" | null;
const reviewUnitCode = "SDG";

const readString = (record: WorkflowRecord, keys: string[], fallback = "-") => {
  const value = keys.map((key) => record[key]).find((item) => typeof item === "string" && item.length > 0);
  return typeof value === "string" ? value : fallback;
};

const readNumber = (record: WorkflowRecord, keys: string[], fallback = 0) => {
  const value = keys.map((key) => record[key]).find((item) => typeof item === "number" || typeof item === "string");
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const apiErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return "You are not authorized to review these tasks.";
    if (error.status === 0) return "Unable to reach Review API.";
    return `Review API returned ${error.status}.`;
  }
  return error instanceof Error ? error.message : "Unable to load review data.";
};

const toReviewTask = (record: WorkflowRecord): ReviewTaskSample => ({
  task_code: readString(record, ["task_code", "review_task_code", "code"]),
  request_code: readString(record, ["request_code"]),
  item_code: readString(record, ["item_code", "request_item_code"]),
  submission_version_code: readString(record, ["submission_version_code", "version_code"]),
  validation_run_code: readString(record, ["validation_run_code", "run_code"]),
  template_instance_code: readString(record, ["template_instance_code"]),
  national_indicator_code: readString(record, ["national_indicator_code", "indicator_code"]),
  indicator_label: readString(record, ["indicator_label", "indicator_name", "national_indicator_name"]),
  goal_path: readString(record, ["goal_path", "goal_label"], "-"),
  target_path: readString(record, ["target_path", "target_label"], "-"),
  source_organization_name: readString(record, ["source_organization_name", "source_unit_name"]),
  submitted_by: readString(record, ["submitted_by", "submitted_by_name"]),
  reviewer_name: readString(record, ["reviewer_name", "assigned_to_name"]),
  review_level: readNumber(record, ["review_level"], 1),
  max_review_level: readNumber(record, ["max_review_level"], 1),
  priority: readString(record, ["priority"], "NORMAL") as ReviewPriority,
  status: readString(record, ["status", "task_status"], "READY") as ReviewTaskStatus,
  assigned_at: readString(record, ["assigned_at", "created_at"], "-"),
  due_date: readString(record, ["due_date"], "-"),
  validation_status: readString(record, ["validation_status"], "PASSED") as ReviewTaskSample["validation_status"],
  validation_error_count: readNumber(record, ["validation_error_count", "error_count"]),
  validation_warning_count: readNumber(record, ["validation_warning_count", "warning_count"]),
});

const toReviewAction = (record: WorkflowRecord, taskCode: string): ReviewActionSample => ({
  action_code: readString(record, ["action_code", "review_action_code", "code"], `${taskCode}_ACTION`),
  task_code: readString(record, ["task_code"], taskCode),
  action_type: readString(record, ["action_type"], "REQUEST_CLARIFICATION") as ReviewActionType,
  action_status: readString(record, ["action_status", "status"], "RECORDED") as ReviewActionSample["action_status"],
  actor_name: readString(record, ["actor_name", "reviewer_name", "created_by"]),
  review_level: readNumber(record, ["review_level"], 1),
  action_at: readString(record, ["action_at", "created_at"], "-"),
  note: readString(record, ["note", "comment", "message"], "-"),
});

const toReviewApproval = (record: WorkflowRecord, taskCode: string) => ({
  approval_code: readString(record, ["approval_code", "review_approval_code", "code"], `${taskCode}_APPROVAL`),
  task_code: readString(record, ["task_code"], taskCode),
  review_level: readNumber(record, ["review_level"], 1),
  approver_role: readString(record, ["approver_role", "role"], "-"),
  approver_name: readString(record, ["approver_name", "actor_name"], "-"),
  status: readString(record, ["status", "approval_status"], "PENDING") as ApprovalStatus,
  decided_at: readString(record, ["decided_at", "created_at"], "-"),
  note: readString(record, ["note", "comment"], "-"),
});

const reviewStatusVariant = (status: ReviewTaskStatus | string) => {
  if (["READY", "APPROVED", "PASSED", "SUBMITTED", "RECEIVED"].includes(status)) return "secondary";
  if (["IN_REVIEW", "PENDING", "WAITING_CLARIFICATION", "BLOCKED_UNTIL_APPROVED"].includes(status)) return "outline";
  return "destructive";
};

const priorityVariant = (priority: ReviewPriority) => {
  if (priority === "URGENT" || priority === "HIGH") return "destructive";
  if (priority === "NORMAL") return "outline";
  return "secondary";
};

const approvalVariant = (status: ApprovalStatus) => {
  if (status === "APPROVED") return "secondary";
  if (status === "PENDING") return "outline";
  return "destructive";
};

function ReviewTemplatePreview({ selectedCell = "B4" }: { selectedCell?: string }) {
  const rows = [
    ["4", "Karnataka", "28.4", "18.1", "10.3", "26.7", "17.2", "9.5", "Valid"],
    ["5", "Tamil Nadu", "24.5", "14.9", "8.6", "24.1", "13.0", "8.0", "Valid"],
    ["6", "Maharashtra", "21.0", "12.2", "7.8", "19.8", "11.5", "7.1", "Valid"],
    ["7", "Kerala", "9.1", "5.2", "3.2", "8.3", "4.8", "3.0", "Valid"],
  ];
  const columns = ["#", "Location", "Total", "Rural", "Urban", "Total", "Rural", "Urban", "Status"];

  return (
    <div className="overflow-x-auto rounded-md border border-border/70 bg-background">
      <table className="min-w-[820px] border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-primary/5 font-bold text-primary">
            <th className="border-b border-r border-border/60 px-3 py-2" colSpan={9}>NIF 1.2.1 - Population below poverty line | Reviewed submitted data</th>
          </tr>
          <tr className="bg-amber-50 text-center font-bold text-amber-900">
            <th className="border-b border-r border-border/60 px-3 py-2" colSpan={2} />
            <th className="border-b border-r border-border/60 px-3 py-2" colSpan={3}>2011-12</th>
            <th className="border-b border-r border-border/60 px-3 py-2" colSpan={3}>2012-13</th>
            <th className="border-b border-border/60 px-3 py-2" />
          </tr>
          <tr className="bg-muted/50 font-bold">
            {columns.map((column) => (
              <th key={column} className="border-b border-r border-border/60 px-3 py-2 last:border-r-0">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="hover:bg-muted/30">
              {row.map((cell, index) => {
                const address = `${String.fromCharCode(64 + index)}${row[0]}`;
                const selected = selectedCell === address;

                return (
                  <td
                    key={`${row[0]}-${index}`}
                    className={[
                      "border-b border-r border-border/40 px-3 py-2 last:border-r-0",
                      selected ? "bg-primary/10 ring-2 ring-primary/60" : "",
                    ].join(" ")}
                  >
                    {index === 8 ? <Badge variant="secondary">{cell}</Badge> : cell}
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

function ReviewQueue({
  query,
  statusFilter,
  tasks,
  onQueryChange,
  onStatusChange,
  onOpenTask,
  isLoading,
  error,
}: {
  query: string;
  statusFilter: ReviewTaskStatus | "ALL";
  tasks: ReviewTaskSample[];
  onQueryChange: (query: string) => void;
  onStatusChange: (status: ReviewTaskStatus | "ALL") => void;
  onOpenTask: (taskCode: string) => void;
  isLoading: boolean;
  error?: unknown;
}) {
  const stats = [
    { label: "Tasks", value: tasks.length, note: "Visible reviewer tasks" },
    { label: "Ready", value: tasks.filter((task) => task.status === "READY").length, note: "Can be reviewed" },
    { label: "Clarification", value: tasks.filter((task) => task.status === "WAITING_CLARIFICATION").length, note: "Waiting on source" },
    { label: "High priority", value: tasks.filter((task) => task.priority === "HIGH" || task.priority === "URGENT").length, note: "Due attention" },
  ];

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="review-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="review-title" className="text-2xl font-bold">Review / Approval Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review validated submissions with request, data entry, ingestion, and validation context.</p>
        </div>
        <Badge variant="outline">Visual action states only</Badge>
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

      {isLoading ? <Loader variant="inline" label="Loading review tasks from API" className="text-xs text-muted-foreground" /> : null}
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {apiErrorMessage(error)}
        </div>
      ) : null}

      <Card>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold">Reviewer task queue</h2>
              <p className="mt-1 text-xs text-muted-foreground">Click a task to open the full review workspace.</p>
            </div>
            <Badge variant="outline">{tasks.length} records</Badge>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
              <Search aria-hidden="true" className="size-4 text-muted-foreground" />
              <span className="sr-only">Search review tasks</span>
              <Input
                className="border-0 bg-transparent"
                placeholder="Search task, request, indicator, department, reviewer"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </label>
            <select
              className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold"
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value as ReviewTaskStatus | "ALL")}
            >
              <option value="ALL">status: all</option>
              <option value="READY">READY</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="WAITING_CLARIFICATION">WAITING_CLARIFICATION</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="SENT_BACK">SENT_BACK</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task / request</TableHead>
                <TableHead>Indicator context</TableHead>
                <TableHead>Source / reviewer</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Validation</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.task_code}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onOpenTask(task.task_code)}
                >
                  <TableCell>
                    <span className="block font-mono text-[11px]">{task.task_code}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{task.request_code}</span>
                  </TableCell>
                  <TableCell className="max-w-80 whitespace-normal">
                    <span className="block font-semibold">{task.national_indicator_code} - {task.indicator_label}</span>
                    <span className="text-[11px] text-muted-foreground">{task.goal_path} / {task.target_path}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-xs font-semibold">{task.source_organization_name}</span>
                    <span className="text-[11px] text-muted-foreground">{task.submitted_by} &gt; {task.reviewer_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block font-semibold">Level {task.review_level}</span>
                    <span className="text-[11px] text-muted-foreground">of {task.max_review_level}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-xs font-semibold">{task.validation_status}</span>
                    <span className="text-[11px] text-muted-foreground">{task.validation_error_count} errors / {task.validation_warning_count} warnings</span>
                  </TableCell>
                  <TableCell>{task.due_date}</TableCell>
                  <TableCell>
                    <div className="grid gap-1">
                      <Badge variant={reviewStatusVariant(task.status)}>{task.status}</Badge>
                      <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onOpenTask(task.task_code); }}>
                      <ShieldCheck aria-hidden="true" className="size-4" /> Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!tasks.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No review tasks found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}

function ReviewActionModal({
  modal,
  task,
  isPending,
  error,
  onSubmit,
  onClose,
}: {
  modal: ReviewActionType;
  task: ReviewTaskSample;
  isPending: boolean;
  error?: unknown;
  onSubmit: (comment: string) => void;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("Reviewed validation summary and submitted template values.");
  const actionConfig: Record<ReviewActionType, { title: string; tone: string; icon: typeof CheckCircle2 }> = {
    APPROVE: { title: "Approve submission", tone: "Approval will move this task to the next configured review level or final approval.", icon: CheckCircle2 },
    REJECT: { title: "Reject submission", tone: "Reject is a terminal visual action until governed review mutation APIs are approved.", icon: XCircle },
    SEND_BACK: { title: "Send back to data entry", tone: "Send back should return the task to source correction after governed API support exists.", icon: RotateCcw },
    REQUEST_CLARIFICATION: { title: "Request clarification", tone: "Clarification asks the source to explain or correct values before review continues.", icon: MessageSquareText },
  };
  const config = actionConfig[modal];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="review-action-title">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Review action</p>
            <h2 id="review-action-title" className="text-xl font-bold">{config.title}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5">
          <div className="flex gap-3 rounded-md bg-muted/40 p-4 text-sm">
            <Icon aria-hidden="true" className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-bold">{task.task_code}</p>
              <p className="mt-1 text-muted-foreground">{config.tone}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs max-lg:grid-cols-1">
            {[
              ["Request", task.request_code],
              ["Indicator", task.national_indicator_code],
              ["Review level", `Level ${task.review_level} of ${task.max_review_level}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted/40 p-3">
                <p className="font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <label className="grid gap-1 text-xs font-semibold">
            Reviewer note
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} />
          </label>
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {apiErrorMessage(error)}
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-4">
          <span className="text-xs text-muted-foreground">Decision is submitted to governed Review APIs.</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={() => onSubmit(comment)} disabled={isPending || !comment.trim()}>
              {isPending ? "Submitting..." : "Save/Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CellDetailModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="review-cell-title">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Cell and validation detail</p>
            <h2 id="review-cell-title" className="text-xl font-bold">{reviewCellDetail.cell_address} - {reviewCellDetail.geography_label}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5">
          <ReviewTemplatePreview selectedCell={reviewCellDetail.cell_address} />
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-lg:grid-cols-1">
            <div className="rounded-md bg-muted/40 p-4 text-sm">
              <p className="font-bold">Validation message</p>
              <p className="mt-2 text-muted-foreground">{reviewCellDetail.validation_message}</p>
              <p className="mt-3 font-bold">Reviewer observation</p>
              <p className="mt-2 text-muted-foreground">{reviewCellDetail.reviewer_observation}</p>
            </div>
            <dl className="grid gap-2 rounded-md bg-muted/40 p-4 text-xs">
              {[
                ["Submitted value", reviewCellDetail.submitted_value],
                ["Previous approved", reviewCellDetail.previous_approved_value],
                ["Time period", reviewCellDetail.time_period],
                ["Area type", reviewCellDetail.area_type],
                ["Rule", reviewCellDetail.validation_rule],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-border/70 pb-2">
                  <dt className="font-semibold text-muted-foreground">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewWorkspace({
  task,
  selectedAction,
  approvals,
  onBack,
  onOpenAction,
  onOpenCell,
}: {
  task: ReviewTaskSample;
  selectedAction?: ReviewActionSample;
  approvals: ReturnType<typeof reviewApprovals.filter>;
  onBack: () => void;
  onOpenAction: (action: ReviewActionType) => void;
  onOpenCell: () => void;
}) {
  const summaryCards = [
    { label: "Review level", value: `${task.review_level} / ${task.max_review_level}`, note: "Dynamic unit review depth" },
    { label: "Validation", value: task.validation_status, note: `${task.validation_error_count} errors / ${task.validation_warning_count} warnings` },
    { label: "Priority", value: task.priority, note: `Due ${task.due_date}` },
    { label: "Task status", value: task.status, note: task.task_code },
  ];

  return (
    <section className="mx-auto flex max-w-[1280px] flex-col gap-4" aria-labelledby="review-workspace-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Button type="button" variant="outline" size="icon-sm" onClick={onBack} aria-label="Back to review queue">
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <div>
            <h1 id="review-workspace-title" className="text-2xl font-bold">Review / Approval Workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">Review submitted data with request, ingestion, validation, and approval history context.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={reviewStatusVariant(task.status)}>{task.status}</Badge>
          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-lg:grid-cols-1">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Indicator review context</p>
              <h2 className="mt-1 text-lg font-bold">{task.national_indicator_code} - {task.indicator_label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{task.goal_path} / {task.target_path}</p>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">{task.submission_version_code} / {task.validation_run_code}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-xs">
              <p className="font-bold">Submitted by / reviewer</p>
              <p className="mt-2">From: <span className="font-semibold">{task.source_organization_name} / {task.submitted_by}</span></p>
              <p className="mt-1">Reviewer: <span className="font-semibold">{task.reviewer_name}</span></p>
              <p className="mt-1 text-muted-foreground">Assigned: {task.assigned_at}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {summaryCards.map((card) => (
          <div key={card.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
            <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
            <p className="mt-2 truncate text-lg font-bold">{card.value}</p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-4 max-xl:grid-cols-1">
        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">Template and validation preview</h2>
                <p className="text-xs text-muted-foreground">Submitted values are shown as a governed template view. Raw payloads and metadata are hidden.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onOpenCell}>
                <Eye aria-hidden="true" className="size-4" /> View cell detail
              </Button>
            </div>
            <ReviewTemplatePreview selectedCell={reviewCellDetail.cell_address} />
            <div className="grid grid-cols-3 gap-3 text-xs max-lg:grid-cols-1">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="font-bold">Validation summary</p>
                <p className="mt-2">{task.validation_status}</p>
                <p className="mt-1 text-muted-foreground">{task.validation_error_count} errors / {task.validation_warning_count} warnings</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="font-bold">Selected cell</p>
                <p className="mt-2 font-mono">{reviewCellDetail.cell_address}</p>
                <p className="mt-1 text-muted-foreground">{reviewCellDetail.geography_label} / {reviewCellDetail.time_period} / {reviewCellDetail.area_type}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="font-bold">Previous approved</p>
                <p className="mt-2">{reviewCellDetail.previous_approved_value}</p>
                <p className="mt-1 text-muted-foreground">For reviewer comparison only</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4">
            <div>
              <h2 className="text-base font-bold">Reviewer decision</h2>
              <p className="mt-1 text-xs text-muted-foreground">Actions are visual until governed Review APIs and permissions are approved.</p>
            </div>

            <label className="grid gap-1 text-xs font-semibold">
              Reviewer note
              <Textarea defaultValue="Reviewed submitted values, validation summary, and comparison context. No raw payload or internal metadata is visible." />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" onClick={() => onOpenAction("APPROVE")}><CheckCircle2 aria-hidden="true" className="size-4" /> Approve</Button>
              <Button type="button" variant="destructive" onClick={() => onOpenAction("REJECT")}><XCircle aria-hidden="true" className="size-4" /> Reject</Button>
              <Button type="button" variant="outline" onClick={() => onOpenAction("SEND_BACK")}><RotateCcw aria-hidden="true" className="size-4" /> Send back</Button>
              <Button type="button" variant="outline" onClick={() => onOpenAction("REQUEST_CLARIFICATION")}><MessageSquareText aria-hidden="true" className="size-4" /> Clarify</Button>
            </div>

            <div className="rounded-md bg-muted/40 p-3 text-xs">
              <p className="font-bold">Latest action</p>
              <p className="mt-2 font-mono text-[11px]">{selectedAction?.action_code ?? "No action recorded"}</p>
              <p className="mt-1 text-muted-foreground">{selectedAction?.note ?? "Awaiting reviewer decision."}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
        <Card>
          <CardContent className="grid gap-3">
            <h2 className="text-base font-bold">Approval history</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decision time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.approval_code}>
                    <TableCell>Level {approval.review_level}</TableCell>
                    <TableCell>
                      <span className="block font-semibold">{approval.approver_name}</span>
                      <span className="text-[11px] text-muted-foreground">{approval.approver_role}</span>
                    </TableCell>
                    <TableCell><Badge variant={approvalVariant(approval.status)}>{approval.status}</Badge></TableCell>
                    <TableCell>{approval.decided_at}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3">
            <h2 className="text-base font-bold">Previous actions</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(selectedAction ? [selectedAction] : []).map((action) => (
                  <TableRow key={action.action_code}>
                    <TableCell>{action.action_type}</TableCell>
                    <TableCell>{action.actor_name}</TableCell>
                    <TableCell><Badge variant={action.action_status === "RECORDED" ? "secondary" : "outline"}>{action.action_status}</Badge></TableCell>
                    <TableCell>{action.action_at}</TableCell>
                  </TableRow>
                ))}
                {!selectedAction ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">No previous action recorded for this task.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3">
          <h2 className="text-base font-bold">Request to dashboard trail</h2>
          <div className="grid gap-2">
            {reviewContextTrail.map((step, index) => (
              <div key={step.label} className="grid grid-cols-[32px_140px_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-muted/40 p-3 text-xs max-lg:grid-cols-[32px_1fr]">
                <div className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{index + 1}</div>
                <p className="font-bold">{step.label}</p>
                <div>
                  <p className="font-mono text-[11px]">{step.code}</p>
                  <p className="text-muted-foreground">{step.note}</p>
                </div>
                <Badge variant={reviewStatusVariant(step.status)}>{step.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function ReviewApprovalPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewTaskStatus | "ALL">("ALL");
  const [selectedTaskCode, setSelectedTaskCode] = useState<string | null>(null);
  const [modal, setModal] = useState<ReviewModal>(null);

  const tasksQuery = useQuery({
    queryKey: ["review", "tasks", reviewUnitCode, language, statusFilter],
    queryFn: () => reviewService.listTasks({ locale: language, unitCode: reviewUnitCode, status: statusFilter === "ALL" ? undefined : statusFilter }),
  });
  const tasks = useMemo(() => tasksQuery.data?.data.map(toReviewTask) ?? reviewTasks, [tasksQuery.data]);

  const filteredTasks = useMemo(() => {
    const normalized = query.toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesQuery = Object.values(task).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, tasks]);

  const selectedTask = tasks.find((task) => task.task_code === selectedTaskCode) ?? null;
  const actionsQuery = useQuery({
    queryKey: ["review", "actions", selectedTaskCode, reviewUnitCode, language],
    queryFn: () => reviewService.listActions({ taskCode: selectedTaskCode ?? "", locale: language, unitCode: reviewUnitCode }),
    enabled: Boolean(selectedTaskCode),
  });
  const approvalsQuery = useQuery({
    queryKey: ["review", "approvals", selectedTaskCode, reviewUnitCode, language],
    queryFn: () => reviewService.listApprovals({ taskCode: selectedTaskCode ?? "", locale: language, unitCode: reviewUnitCode }),
    enabled: Boolean(selectedTaskCode),
  });
  const actions = selectedTask ? (actionsQuery.data?.data.map((item) => toReviewAction(item, selectedTask.task_code)) ?? reviewActions.filter((action) => action.task_code === selectedTask.task_code)) : [];
  const selectedAction = actions[0];
  const approvals = selectedTask ? (approvalsQuery.data?.data.map((item) => toReviewApproval(item, selectedTask.task_code)) ?? reviewApprovals.filter((approval) => approval.task_code === selectedTask.task_code)) : [];

  const reviewActionMutation = useMutation({
    mutationFn: async ({ actionType, comment }: { actionType: ReviewActionType; comment: string }) => {
      if (!selectedTask) throw new Error("Open a review task before submitting a decision.");
      if (actionType === "APPROVE") {
        return reviewService.createApproval({
          locale: language,
          taskCode: selectedTask.task_code,
          payload: {
            unit_code: reviewUnitCode,
            approval_status: "APPROVED",
            comment,
            is_final_approval: selectedTask.review_level >= selectedTask.max_review_level,
          },
        });
      }
      return reviewService.createAction({
        locale: language,
        taskCode: selectedTask.task_code,
        payload: {
          unit_code: reviewUnitCode,
          action_type: actionType,
          comment,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["review"] });
      setModal(null);
    },
  });

  return (
    <AppShell persona="Reviewer" activeDashboard="/dashboard/unit-admin">
      {selectedTask ? (
        <ReviewWorkspace
          task={selectedTask}
          selectedAction={selectedAction}
          approvals={approvals}
          onBack={() => setSelectedTaskCode(null)}
          onOpenAction={setModal}
          onOpenCell={() => setModal("cell-detail")}
        />
      ) : (
        <ReviewQueue
          query={query}
          statusFilter={statusFilter}
          tasks={filteredTasks}
          onQueryChange={setQuery}
          onStatusChange={setStatusFilter}
          onOpenTask={setSelectedTaskCode}
          isLoading={tasksQuery.isFetching}
          error={tasksQuery.error}
        />
      )}
      {selectedTask && modal && modal !== "cell-detail" ? (
        <ReviewActionModal
          modal={modal}
          task={selectedTask}
          isPending={reviewActionMutation.isPending}
          error={reviewActionMutation.error}
          onSubmit={(comment) => reviewActionMutation.mutate({ actionType: modal, comment })}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === "cell-detail" ? (
        <CellDetailModal onClose={() => setModal(null)} />
      ) : null}
    </AppShell>
  );
}
