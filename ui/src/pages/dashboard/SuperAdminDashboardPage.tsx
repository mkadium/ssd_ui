import type { EChartsCoreOption } from "echarts/core";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  DatabaseZap,
  Download,
  Eye,
  ListFilter,
  Mail,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { EChart } from "@/components/charts/EChart";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  goalProgressRows,
  operationItems,
  pendingItems,
  pipelineSteps,
  reviewQueueRows,
  summaryCards,
  unitProgressRows,
  type SummaryCard,
} from "@/data/superAdminDashboard.sample";

const toneClasses: Record<SummaryCard["tone"], string> = {
  blue: "border-l-blue-700 bg-blue-50 text-blue-900",
  green: "border-l-emerald-700 bg-emerald-50 text-emerald-950",
  orange: "border-l-amber-700 bg-amber-50 text-amber-950",
  purple: "border-l-violet-700 bg-violet-50 text-violet-950",
  red: "border-l-red-700 bg-red-50 text-red-950",
};

const workflowSteps = ["Setup", "Template", "Request", "Ingest", "Validate", "Review", "Publish"];

export function SuperAdminDashboardPage() {
  const [activeDrilldown, setActiveDrilldown] = useState("ACTIVE_UNITS");

  const goalChartOption = useMemo<EChartsCoreOption>(
    () => ({
      color: ["#1d5fd1", "#0e8f70", "#d97706", "#be123c"],
      tooltip: { trigger: "axis" },
      legend: {
        bottom: 0,
        textStyle: { fontSize: 11 },
      },
      grid: { left: 36, right: 16, top: 20, bottom: 42 },
      xAxis: {
        type: "category",
        data: goalProgressRows.map((row) => row.goal_code.replace("GOAL_", "G")),
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          name: "Requested",
          type: "bar",
          data: goalProgressRows.map((row) => row.requested_indicators),
        },
        {
          name: "Submitted",
          type: "bar",
          data: goalProgressRows.map((row) => row.submitted_indicators),
        },
        {
          name: "Approved",
          type: "bar",
          data: goalProgressRows.map((row) => row.approved_indicators),
        },
        {
          name: "Blocked",
          type: "bar",
          data: goalProgressRows.map((row) => row.blocked_indicators),
        },
      ],
    }),
    [],
  );

  const unitDonutOption = useMemo<EChartsCoreOption>(
    () => ({
      color: ["#0e8f70", "#1d5fd1", "#d97706", "#7c3aed"],
      tooltip: { trigger: "item" },
      series: [
        {
          name: "Unit health",
          type: "pie",
          radius: ["48%", "72%"],
          center: ["50%", "48%"],
          avoidLabelOverlap: true,
          label: {
            formatter: "{b}\n{d}%",
            fontSize: 11,
          },
          data: unitProgressRows.map((row) => ({
            name: row.unit_name,
            value: row.health_percent,
          })),
        },
      ],
    }),
    [],
  );

  return (
    <AppShell showUnitSelector={false}>
      <section className="mx-auto flex min-h-[688px] max-w-[1110px] flex-col gap-4" aria-labelledby="dashboard-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              First-demo MVP / 1366 x 768 baseline
            </p>
            <h1 id="dashboard-title" className="mt-1 text-3xl font-bold text-foreground">
              Super Admin Dashboard
            </h1>
            <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
              Cross-module operations view from Auth, Masters, Dimensions, Templates, Requests,
              Ingestion, Validation, Review, and Dashboard APIs.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw aria-hidden="true" className="size-4" />
              Refresh
            </Button>
            <Button>
              <Download aria-hidden="true" className="size-4" />
              Export
            </Button>
          </div>
        </div>

        <Card className="py-3">
          <CardContent className="flex items-center justify-between gap-4">
            <div className="min-w-[220px]">
              <p className="text-sm font-bold">First-demo workflow path</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Informational sequence; cards and charts open API-shaped drilldown lists.
              </p>
            </div>
            <ol className="flex flex-1 items-center justify-end gap-2" aria-label="Workflow path">
              {workflowSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-accent px-4 py-2 text-xs font-bold text-accent-foreground">
                    {step}
                  </span>
                  {index < workflowSteps.length - 1 && (
                    <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="grid grid-cols-6 gap-3">
          {summaryCards.map((card) => (
            <button
              key={card.code}
              type="button"
              onClick={() => setActiveDrilldown(card.code)}
              className={[
                "rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                toneClasses[card.tone],
                activeDrilldown === card.code ? "ring-2 ring-primary/40" : "",
              ].join(" ")}
              aria-label={`Open ${card.label} drilldown`}
            >
              <span className="text-xs font-semibold text-muted-foreground">{card.label}</span>
              <span className="mt-1 block text-3xl font-bold text-foreground">{card.value}</span>
              <span className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold">
                {card.helper}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1.15fr_1fr_1.15fr] gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Unit performance</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveDrilldown("UNIT_PERFORMANCE")}>
                  <Eye aria-hidden="true" className="size-4" />
                  View
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EChart
                title="Unit health donut chart"
                option={unitDonutOption}
                className="h-[190px] w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[190px] items-center justify-between">
                {pipelineSteps.map((step, index) => (
                  <button
                    key={step.code}
                    type="button"
                    onClick={() => setActiveDrilldown(step.code)}
                    className="group flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
                  >
                    <span
                      className={[
                        "grid size-12 place-items-center rounded-full border text-lg font-bold",
                        step.status === "complete" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "",
                        step.status === "active" ? "border-blue-300 bg-blue-50 text-blue-900" : "",
                        step.status === "pending" ? "border-slate-300 bg-slate-50 text-slate-700" : "",
                      ].join(" ")}
                    >
                      {step.count}
                    </span>
                    <span className="text-[11px] leading-tight text-muted-foreground group-hover:text-foreground">
                      {step.label}
                    </span>
                    {index < pipelineSteps.length - 1 && <span className="sr-only">then</span>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top pending list</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveDrilldown("PENDING_LIST")}>
                  Open
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {pendingItems.map((item) => (
                  <li key={item.code}>
                    <button
                      type="button"
                      onClick={() => setActiveDrilldown(item.code)}
                      className="flex w-full items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-left text-xs hover:bg-accent"
                    >
                      <span>
                        <span className="block font-semibold">{item.label}</span>
                        <span className="text-muted-foreground">{item.owner}</span>
                      </span>
                      <Badge variant={item.severity === "action" ? "destructive" : "secondary"}>
                        {item.severity}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-[1.25fr_1fr_1.1fr] gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Goal and target coverage</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveDrilldown("GOAL_COVERAGE")}>
                  <ListFilter aria-hidden="true" className="size-4" />
                  Drilldown
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EChart
                title="Goal coverage grouped bar chart"
                option={goalChartOption}
                className="h-[210px] w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviewQueueRows.map((row) => (
                  <button
                    key={row.queue_code}
                    type="button"
                    onClick={() => setActiveDrilldown(row.queue_code)}
                    className="grid w-full grid-cols-[110px_1fr_56px] items-center gap-3 text-left text-xs"
                  >
                    <span className="font-semibold">{row.review_level_label}</span>
                    <span className="h-2 rounded-full bg-muted">
                      <span
                        className="block h-2 rounded-full bg-primary"
                        style={{ width: `${Math.min(100, row.pending_count * 7)}%` }}
                      />
                    </span>
                    <span className="text-right font-bold">{row.pending_count}</span>
                    {row.overdue_count > 0 && (
                      <span className="col-span-3 text-[11px] text-red-700">
                        {row.overdue_count} overdue
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Planned operations</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveDrilldown("PLANNED_OPS")}>
                  Runs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex gap-4 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-amber-600" /> Pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-blue-700" /> Upcoming
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {operationItems.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setActiveDrilldown(item.code)}
                    className="rounded-md border border-border bg-muted/30 p-2 text-left text-xs hover:bg-accent"
                  >
                    <span className="font-bold">{item.label}</span>
                    <span className="mt-2 flex gap-2">
                      <Badge variant={item.pending_count > 0 ? "destructive" : "secondary"}>
                        {item.pending_count} pending
                      </Badge>
                      <Badge variant="secondary">{item.upcoming_count} upcoming</Badge>
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-[1.35fr_1fr] gap-4 pb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Drilldown table</CardTitle>
                <label className="flex w-72 items-center gap-2 rounded-md border border-border px-2">
                  <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="sr-only">Search drilldown rows</span>
                  <Input className="border-0 bg-transparent" placeholder="Search code, unit, status" />
                </label>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Active drilldown: <strong>{activeDrilldown}</strong>. Data shape follows dashboard drilldown and unit summary APIs.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit code</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitProgressRows.map((row) => (
                    <TableRow key={row.unit_code}>
                      <TableCell className="font-mono text-[11px]">{row.unit_code}</TableCell>
                      <TableCell className="font-semibold">{row.unit_name}</TableCell>
                      <TableCell>{row.required_count}</TableCell>
                      <TableCell>{row.requested_count}</TableCell>
                      <TableCell>{row.submitted_count}</TableCell>
                      <TableCell>{row.approved_count}</TableCell>
                      <TableCell>
                        <Badge variant={row.health_percent >= 80 ? "secondary" : "destructive"}>
                          {row.health_percent}%
                        </Badge>
                      </TableCell>
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
              <div className="flex items-center justify-between">
                <CardTitle>Infrastructure monitor</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveDrilldown("INFRA_LOGS")}>
                  Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {[
                  ["API health", "OK", "green"],
                  ["DB connectivity", "OK", "green"],
                  ["Docker deploy", "OK", "green"],
                  ["File storage", "LOCAL", "orange"],
                ].map(([label, value, tone]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveDrilldown(label)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      {tone === "green" ? (
                        <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-700" />
                      ) : (
                        <AlertTriangle aria-hidden="true" className="size-4 text-amber-700" />
                      )}
                      {label}
                    </span>
                    <Badge variant={tone === "green" ? "secondary" : "outline"}>{value}</Badge>
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <DatabaseZap aria-hidden="true" className="mt-0.5 size-4 text-primary" />
                  <p>
                    Monitoring is informational for the first demo. Alerts, reminders, emails, backups,
                    and logs are shown as UX placeholders until their governed APIs are approved.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm">
                  <Mail aria-hidden="true" className="size-4" />
                  Email queue
                </Button>
                <Button variant="outline" size="sm">
                  <Activity aria-hidden="true" className="size-4" />
                  Runs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
