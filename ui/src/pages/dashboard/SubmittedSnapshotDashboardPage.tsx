import type { EChartsCoreOption } from "echarts/core";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Globe2,
  LockKeyhole,
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
  snapshotGoalRows,
  snapshotIndicators,
  snapshotSourceUnits,
  snapshotSummaryCards,
  type SnapshotSummaryCard,
} from "@/data/submittedSnapshotDashboard.sample";

const toneClasses: Record<SnapshotSummaryCard["tone"], string> = {
  blue: "border-l-blue-700 bg-blue-50",
  green: "border-l-emerald-700 bg-emerald-50",
  orange: "border-l-amber-700 bg-amber-50",
  purple: "border-l-violet-700 bg-violet-50",
  red: "border-l-red-700 bg-red-50",
};

const statusVariant = (status: string) => {
  if (["PASSED", "APPROVED", "PUBLISHED", "ON"].includes(status)) return "secondary";
  if (["READY"].includes(status)) return "outline";
  return "destructive";
};

export function SubmittedSnapshotDashboardPage() {
  const [activeSnapshot, setActiveSnapshot] = useState("PUBLISHED_INDICATORS");

  const goalPublicationOption = useMemo<EChartsCoreOption>(
    () => ({
      color: ["#0e8f70", "#1d5fd1", "#d97706"],
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 38, right: 16, top: 22, bottom: 42 },
      xAxis: {
        type: "category",
        data: snapshotGoalRows.map((row) => row.goal_code.replace("GOAL_", "G")),
        axisLabel: { fontSize: 11 },
      },
      yAxis: { type: "value", axisLabel: { fontSize: 11 } },
      series: [
        {
          name: "Approved",
          type: "bar",
          data: snapshotGoalRows.map((row) => row.approved_indicators),
        },
        {
          name: "Published",
          type: "bar",
          data: snapshotGoalRows.map((row) => row.published_indicators),
        },
        {
          name: "Pending",
          type: "bar",
          data: snapshotGoalRows.map((row) => row.pending_publication),
        },
      ],
    }),
    [],
  );

  const publicationDonutOption = useMemo<EChartsCoreOption>(
    () => ({
      color: ["#1d5fd1", "#d97706", "#0e8f70"],
      tooltip: { trigger: "item" },
      series: [
        {
          name: "Publication status",
          type: "pie",
          radius: ["46%", "72%"],
          center: ["50%", "48%"],
          label: { formatter: "{b}\n{c}", fontSize: 11 },
          data: [
            { name: "Published", value: 18 },
            { name: "Ready", value: 6 },
            { name: "Public boundary on", value: 1 },
          ],
        },
      ],
    }),
    [],
  );

  return (
    <AppShell persona="Dashboard Publisher" activeDashboard="/dashboard/snapshot">
      <section className="mx-auto flex min-h-[688px] max-w-[1110px] flex-col gap-4" aria-labelledby="snapshot-dashboard-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Submitted snapshot / 1366 x 768 baseline
            </p>
            <h1 id="snapshot-dashboard-title" className="mt-1 text-3xl font-bold text-foreground">
              Submitted Snapshot Dashboard
            </h1>
            <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
              Approved and published indicator view after validation and review. Public visibility is
              controlled at unit/dashboard level and never exposes internal IDs, raw payloads, or source hashes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Eye aria-hidden="true" className="size-4" />
              Public preview
            </Button>
            <Button>
              <Download aria-hidden="true" className="size-4" />
              Export snapshot
            </Button>
          </div>
        </div>

        <Card className="py-3">
          <CardContent className="grid grid-cols-[280px_1fr_auto] items-center gap-4">
            <div>
              <p className="text-sm font-bold">Publication boundary</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Internal approval context remains protected; public users see only approved dashboard data.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                ["Validated", "PASSED"],
                ["Reviewed", "APPROVED"],
                ["Published", "18 indicators"],
                ["Public view", "Enabled"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-muted/40 p-3">
                  <span className="block text-muted-foreground">{label}</span>
                  <span className="mt-1 block font-bold">{value}</span>
                </div>
              ))}
            </div>
            <Badge variant="secondary">Public-ready sample</Badge>
          </CardContent>
        </Card>

        <div className="grid grid-cols-5 gap-3">
          {snapshotSummaryCards.map((card) => (
            <button
              key={card.code}
              type="button"
              onClick={() => setActiveSnapshot(card.code)}
              className={[
                "rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                toneClasses[card.tone],
                activeSnapshot === card.code ? "ring-2 ring-primary/40" : "",
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
                <CardTitle>Goal publication coverage</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveSnapshot("GOAL_PUBLICATION")}>
                  <FileText aria-hidden="true" className="size-4" />
                  View goals
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EChart
                title="Goal publication coverage grouped bar chart"
                option={goalPublicationOption}
                className="h-[218px] w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publication mix</CardTitle>
            </CardHeader>
            <CardContent>
              <EChart
                title="Publication status donut chart"
                option={publicationDonutOption}
                className="h-[218px] w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Source contribution</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveSnapshot("SOURCE_UNITS")}>
                  Open
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {snapshotSourceUnits.map((unit) => (
                  <button
                    key={unit.unit_code}
                    type="button"
                    onClick={() => setActiveSnapshot(unit.unit_code)}
                    className="grid w-full grid-cols-[1fr_64px] gap-3 rounded-md bg-muted/60 px-3 py-2 text-left text-xs hover:bg-accent"
                  >
                    <span>
                      <span className="block font-bold">{unit.unit_name}</span>
                      <span className="text-muted-foreground">{unit.unit_code}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-bold">{unit.health_percent}%</span>
                      <span className="text-muted-foreground">health</span>
                    </span>
                    <span className="col-span-2 h-2 rounded-full bg-white">
                      <span
                        className="block h-2 rounded-full bg-primary"
                        style={{ width: `${unit.health_percent}%` }}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-[1.45fr_0.9fr] gap-4 pb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Published indicator snapshot</CardTitle>
                <label className="flex w-72 items-center gap-2 rounded-md border border-border px-2">
                  <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="sr-only">Search published indicators</span>
                  <Input className="border-0 bg-transparent" placeholder="Search indicator, goal, unit" />
                </label>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Active snapshot: <strong>{activeSnapshot}</strong>. Table represents approved/published
                indicator records, not raw submitted payloads.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicator</TableHead>
                    <TableHead>Goal / Target</TableHead>
                    <TableHead>Source unit</TableHead>
                    <TableHead>Latest period</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Publication</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshotIndicators.map((row) => (
                    <TableRow key={row.indicator_code}>
                      <TableCell>
                        <span className="block font-mono text-[11px]">{row.indicator_code}</span>
                        <span className="text-xs font-semibold">{row.indicator_label}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="block">{row.goal_code}</span>
                        <span className="text-muted-foreground">{row.target_code}</span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{row.source_unit_code}</TableCell>
                      <TableCell>{row.latest_year}</TableCell>
                      <TableCell className="font-bold">{row.latest_value}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.review_status)}>{row.review_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.publication_status)}>{row.publication_status}</Badge>
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
              <CardTitle>Public dashboard readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  ["Approved data only", "No drafts or failed validation rows", "green"],
                  ["Internal data hidden", "No raw payloads or source hashes", "green"],
                  ["Public toggle", "Enabled at dashboard/unit level", "green"],
                  ["Publication queue", "6 approved indicators still pending release", "orange"],
                ].map(([label, description, tone]) => (
                  <div key={label} className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3">
                    {tone === "green" ? (
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 text-emerald-700" />
                    ) : (
                      <Globe2 aria-hidden="true" className="mt-0.5 size-5 text-amber-700" />
                    )}
                    <div>
                      <p className="text-sm font-bold">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
                <div className="flex gap-2">
                  <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 text-primary" />
                  <p>
                    Public dashboard access is allowed only when enabled by admin/unit configuration.
                    Review evidence and protected operational details stay internal.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button className="h-10">
                  <Globe2 aria-hidden="true" className="size-4" />
                  Preview public
                </Button>
                <Button variant="outline" className="h-10">
                  <FileText aria-hidden="true" className="size-4" />
                  Evidence list
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
