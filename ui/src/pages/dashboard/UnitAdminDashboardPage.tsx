import type { EChartsCoreOption } from "echarts/core";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Eye,
  FileSpreadsheet,
  ListFilter,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ApiError } from "@/api/client";
import { EChart } from "@/components/charts/EChart";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  goalStatusRows,
  indicatorStatusRows,
  targetStatusRows,
  unitSummaryCards,
  type UnitSummaryCard,
} from "@/data/unitAdminDashboard.sample";
import { useLanguage } from "@/providers/language-context";
import { dashboardService } from "@/services/dashboardService";
import type { WorkflowRecord } from "@/types/workflow";

const dashboardUnitCode = "SDG";

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
    if (error.status === 401 || error.status === 403) return "You are not authorized to view dashboard data.";
    if (error.status === 0) return "Unable to reach Dashboard API.";
    return `Dashboard API returned ${error.status}.`;
  }
  return "Unable to load dashboard data.";
};

const toGoalStatus = (record: WorkflowRecord) => ({
  goal_code: readString(record, ["goal_code", "code"]),
  goal_label: readString(record, ["goal_label", "name", "label"]),
  required_indicators: readNumber(record, ["required_indicators", "required_count"]),
  requested_indicators: readNumber(record, ["requested_indicators", "requested_count"]),
  submitted_indicators: readNumber(record, ["submitted_indicators", "submitted_count"]),
  approved_indicators: readNumber(record, ["approved_indicators", "approved_count"]),
  pending_indicators: readNumber(record, ["pending_indicators", "pending_count"]),
});

const toTargetStatus = (record: WorkflowRecord) => ({
  target_code: readString(record, ["target_code", "code"]),
  target_label: readString(record, ["target_label", "name", "label"]),
  goal_code: readString(record, ["goal_code"]),
  required_indicators: readNumber(record, ["required_indicators", "required_count"]),
  requested_indicators: readNumber(record, ["requested_indicators", "requested_count"]),
  submitted_indicators: readNumber(record, ["submitted_indicators", "submitted_count"]),
  validation_errors: readNumber(record, ["validation_errors", "error_count"]),
  review_pending: readNumber(record, ["review_pending", "review_pending_count"]),
});

const toIndicatorStatus = (record: WorkflowRecord) => ({
  indicator_code: readString(record, ["indicator_code", "national_indicator_code", "code"]),
  indicator_label: readString(record, ["indicator_label", "national_indicator_name", "name"]),
  goal_code: readString(record, ["goal_code"]),
  target_code: readString(record, ["target_code"]),
  request_code: readString(record, ["request_code"]),
  template_version_code: readString(record, ["template_version_code"]),
  required: true,
  request_status: readString(record, ["request_status"], "PENDING"),
  submission_status: readString(record, ["submission_status"], "NOT_SENT"),
  validation_status: readString(record, ["validation_status"], "NOT_RUN"),
  review_status: readString(record, ["review_status"], "NOT_STARTED"),
  due_date: readString(record, ["due_date"], "-"),
});

const toneClasses: Record<UnitSummaryCard["tone"], string> = {
  blue: "border-l-blue-700 bg-blue-50",
  green: "border-l-emerald-700 bg-emerald-50",
  orange: "border-l-amber-700 bg-amber-50",
  purple: "border-l-violet-700 bg-violet-50",
  red: "border-l-red-700 bg-red-50",
};

const statusVariant = (status: string) => {
  if (["PASSED", "APPROVED", "SUBMITTED", "RECEIVED"].includes(status)) return "secondary";
  if (["HAS_ERRORS", "BLOCKED", "PENDING"].includes(status)) return "destructive";
  return "outline";
};

export function UnitAdminDashboardPage() {
  const { language } = useLanguage();
  const [activeFocus, setActiveFocus] = useState("REQUIRED_INDICATORS");

  const overallQuery = useQuery({
    queryKey: ["dashboard", "overall-summary", dashboardUnitCode, language],
    queryFn: () => dashboardService.getOverallSummary({ locale: language, unitCode: dashboardUnitCode }),
  });
  const goalsQuery = useQuery({
    queryKey: ["dashboard", "goals", dashboardUnitCode, language],
    queryFn: () => dashboardService.listGoals({ locale: language, unitCode: dashboardUnitCode }),
  });
  const targetsQuery = useQuery({
    queryKey: ["dashboard", "targets", dashboardUnitCode, language],
    queryFn: () => dashboardService.listTargets({ locale: language, unitCode: dashboardUnitCode }),
  });
  const indicatorsQuery = useQuery({
    queryKey: ["dashboard", "national-indicators", dashboardUnitCode, language],
    queryFn: () => dashboardService.listNationalIndicators({ locale: language, unitCode: dashboardUnitCode }),
  });

  const goals = useMemo(() => goalsQuery.data?.data.map(toGoalStatus) ?? goalStatusRows, [goalsQuery.data]);
  const targets = useMemo(() => targetsQuery.data?.data.map(toTargetStatus) ?? targetStatusRows, [targetsQuery.data]);
  const indicators = useMemo(() => indicatorsQuery.data?.data.map(toIndicatorStatus) ?? indicatorStatusRows, [indicatorsQuery.data]);
  const summaryCards = useMemo(() => {
    const summary = overallQuery.data?.data;
    if (!summary) return unitSummaryCards;
    return unitSummaryCards.map((card) => ({
      ...card,
      value: String(summary[card.code.toLowerCase()] ?? summary[card.code] ?? card.value),
    }));
  }, [overallQuery.data]);
  const dashboardError = overallQuery.error ?? goalsQuery.error ?? targetsQuery.error ?? indicatorsQuery.error;
  const dashboardLoading = overallQuery.isFetching || goalsQuery.isFetching || targetsQuery.isFetching || indicatorsQuery.isFetching;

  const goalBarOption = useMemo<EChartsCoreOption>(
    () => ({
      color: ["#1d5fd1", "#0e8f70", "#d97706"],
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 38, right: 16, top: 22, bottom: 42 },
      xAxis: {
        type: "category",
        data: goals.map((row) => row.goal_code.replace("GOAL_", "G")),
        axisLabel: { fontSize: 11 },
      },
      yAxis: { type: "value", axisLabel: { fontSize: 11 } },
      series: [
        {
          name: "Required",
          type: "bar",
          data: goals.map((row) => row.required_indicators),
        },
        {
          name: "Submitted",
          type: "bar",
          data: goals.map((row) => row.submitted_indicators),
        },
        {
          name: "Pending",
          type: "bar",
          data: goals.map((row) => row.pending_indicators),
        },
      ],
    }),
    [goals],
  );

  const targetPieOption = useMemo<EChartsCoreOption>(
    () => ({
      color: ["#0e8f70", "#1d5fd1", "#d97706", "#be123c"],
      tooltip: { trigger: "item" },
      series: [
        {
          name: "Target status",
          type: "pie",
          radius: ["42%", "72%"],
          center: ["50%", "48%"],
          label: { formatter: "{b}\n{c}", fontSize: 11 },
          data: [
            { name: "Submitted", value: 11 },
            { name: "Requested", value: 13 },
            { name: "Warnings", value: 3 },
            { name: "Errors", value: 2 },
          ],
        },
      ],
    }),
    [],
  );

  return (
    <AppShell persona="Unit Admin" activeDashboard="/dashboard/unit-admin">
      <section className="mx-auto flex min-h-[688px] max-w-[1110px] flex-col gap-4" aria-labelledby="unit-dashboard-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Unit workspace / 1366 x 768 baseline
            </p>
            <h1 id="unit-dashboard-title" className="mt-1 text-3xl font-bold text-foreground">
              Unit Admin Dashboard
            </h1>
            <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
              Goal, target, and indicator status for the selected source unit. This follows the request
              to validation to review trail for each indicator.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileSpreadsheet aria-hidden="true" className="size-4" />
              Templates
            </Button>
            <Button>
              <ClipboardCheck aria-hidden="true" className="size-4" />
              Open requests
            </Button>
          </div>
        </div>

        <Card className="py-3">
          <CardContent className="grid grid-cols-[260px_1fr_auto] items-center gap-4">
            <div>
              <p className="text-sm font-bold">Indicator status trail</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select any card, chart, target, or indicator to inspect its request, data entry,
                validation, and review status.
              </p>
            </div>
            <ol className="flex items-center gap-2 text-xs" aria-label="Indicator status trail">
              {["Required", "Requested", "Template filled", "Validated", "Reviewed"].map((step, index, steps) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-accent px-3 py-2 font-bold text-accent-foreground">
                    {step}
                  </span>
                  {index < steps.length - 1 && <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />}
                </li>
              ))}
            </ol>
            <Badge variant="outline">Unit: SSD_DEMO_SOURCE</Badge>
          </CardContent>
        </Card>

        {dashboardLoading ? <Loader variant="inline" label="Loading dashboard API data" className="text-xs text-muted-foreground" /> : null}
        {dashboardError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            {apiErrorMessage(dashboardError)}
          </div>
        ) : null}

        <div className="grid grid-cols-5 gap-3">
          {summaryCards.map((card) => (
            <button
              key={card.code}
              type="button"
              onClick={() => setActiveFocus(card.code)}
              className={[
                "rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                toneClasses[card.tone],
                activeFocus === card.code ? "ring-2 ring-primary/40" : "",
              ].join(" ")}
            >
              <span className="text-xs font-semibold text-muted-foreground">{card.label}</span>
              <span className="mt-1 block text-3xl font-bold text-foreground">{card.value}</span>
              <span className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold">
                {card.helper}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1.35fr_0.95fr_1fr] gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Level-1 goal status</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveFocus("GOAL_STATUS")}>
                  <ListFilter aria-hidden="true" className="size-4" />
                  View goals
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EChart
                title="Unit goal status grouped bar chart"
                option={goalBarOption}
                className="h-[218px] w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Level-2 target status</CardTitle>
            </CardHeader>
            <CardContent>
              <EChart
                title="Target status pie chart"
                option={targetPieOption}
                className="h-[218px] w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Target action list</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveFocus("TARGET_ACTIONS")}>
                  Open
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {targets.map((target) => (
                  <li key={target.target_code}>
                    <button
                      type="button"
                      onClick={() => setActiveFocus(target.target_code)}
                      className="grid w-full grid-cols-[1fr_auto] gap-2 rounded-md bg-muted/60 px-3 py-2 text-left text-xs hover:bg-accent"
                    >
                      <span>
                        <span className="block font-bold">{target.target_code}</span>
                        <span className="text-muted-foreground">{target.target_label}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <Badge variant={target.validation_errors > 0 ? "destructive" : "secondary"}>
                          {target.validation_errors} errors
                        </Badge>
                        <span className="text-muted-foreground">{target.review_pending} in review</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-[1.45fr_0.9fr] gap-4 pb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Indicator-level trail</CardTitle>
                <label className="flex w-72 items-center gap-2 rounded-md border border-border px-2">
                  <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="sr-only">Search indicators</span>
                  <Input className="border-0 bg-transparent" placeholder="Search indicator, target, request" />
                </label>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Active focus: <strong>{activeFocus}</strong>. Table links the same indicator through request,
                template, submission, validation, and review context.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicator</TableHead>
                    <TableHead>Goal / Target</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Submission</TableHead>
                    <TableHead>Validation</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indicators.map((row) => (
                    <TableRow key={row.indicator_code}>
                      <TableCell>
                        <span className="block font-mono text-[11px]">{row.indicator_code}</span>
                        <span className="text-xs font-semibold">{row.indicator_label}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="block">{row.goal_code}</span>
                        <span className="text-muted-foreground">{row.target_code}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.request_status)}>{row.request_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.submission_status)}>{row.submission_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.validation_status)}>{row.validation_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.review_status)}>{row.review_status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{row.due_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <span>Rows 1-4 of 4</span>
                <Button variant="outline" size="xs">Previous</Button>
                <Button variant="outline" size="xs">Next</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected indicator next action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 text-amber-700" />
                  <div>
                    <p className="font-bold">NIF 1.2.1 needs correction before review.</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Validation found blocking errors for one required cell. Open the rendered template,
                      fix the missing value or add a justified note, then re-submit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <Button className="h-10 justify-start">
                  <FileSpreadsheet aria-hidden="true" className="size-4" />
                  Open data entry form
                </Button>
                <Button variant="outline" className="h-10 justify-start">
                  <Eye aria-hidden="true" className="size-4" />
                  View validation report
                </Button>
                <Button variant="outline" className="h-10 justify-start">
                  <ClipboardCheck aria-hidden="true" className="size-4" />
                  View review trail
                </Button>
              </div>

              <div className="mt-5 rounded-md border border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
                This screen reads Dashboard APIs when available and falls back to local display rows when DEV has no records.
                Internal IDs, raw payloads, hashes, and tokens are not displayed.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
