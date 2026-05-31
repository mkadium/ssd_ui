import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
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
import {
  validationQueueItems,
  validationResults,
  validationTrailSteps,
  type ValidationQueueItemSample,
  type ValidationQueueStatus,
  type ValidationResultSample,
  type ValidationResultStatus,
  type ValidationSeverity,
} from "@/data/validation.sample";

type ValidationModal = "template-cell" | null;

const queueStatusVariant = (status: ValidationQueueStatus | string) => {
  if (["COMPLETED", "READY_FOR_REVIEW", "PASS", "SUBMITTED", "RECEIVED"].includes(status)) return "secondary";
  if (["PENDING", "WARNING", "SENT"].includes(status)) return "outline";
  return "destructive";
};

const resultStatusVariant = (status: ValidationResultStatus) => {
  if (status === "PASS") return "secondary";
  if (status === "WARNING") return "outline";
  return "destructive";
};

const severityVariant = (severity: ValidationSeverity) => {
  if (severity === "INFO") return "secondary";
  if (severity === "WARNING") return "outline";
  return "destructive";
};

function TemplatePreview({ selectedCell }: { selectedCell?: string }) {
  const rows = [
    ["4", "Karnataka", "28.4", "18.1", "10.3", "26.7", "17.2", "9.5", "Valid"],
    ["5", "Tamil Nadu", "", "14.9", "8.6", "24.1", "13.0", "8.0", "Error"],
    ["6", "Maharashtra", "21.0", "12.2", "7.8", "19.8", "11.5", "7.1", "Valid"],
    ["7", "Kerala", "9.1", "5.2", "3.2", "8.3", "4.8", "3.0", "Valid"],
  ];
  const columns = ["#", "Location", "Total", "Rural", "Urban", "Total", "Rural", "Urban", "Status"];

  return (
    <div className="overflow-x-auto rounded-md border border-border/70 bg-background">
      <table className="min-w-[820px] border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-primary/5 font-bold text-primary">
            <th className="border-b border-r border-border/60 px-3 py-2" colSpan={9}>NIF 1.2.1 - Population below poverty line | Template instance preview</th>
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
                    {index === 8 ? <Badge variant={cell === "Error" ? "destructive" : "secondary"}>{cell}</Badge> : cell || "-"}
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

function ValidationQueue({
  query,
  statusFilter,
  queueItems,
  onQueryChange,
  onStatusChange,
  onOpenRun,
}: {
  query: string;
  statusFilter: ValidationQueueStatus | "ALL";
  queueItems: ValidationQueueItemSample[];
  onQueryChange: (query: string) => void;
  onStatusChange: (status: ValidationQueueStatus | "ALL") => void;
  onOpenRun: (runCode: string) => void;
}) {
  const stats = [
    { label: "Runs", value: queueItems.length, note: "Visible validation records" },
    { label: "Failed", value: queueItems.filter((item) => item.status === "FAILED").length, note: "Needs data correction" },
    { label: "Ready for review", value: queueItems.filter((item) => item.status === "READY_FOR_REVIEW").length, note: "Can move forward" },
    { label: "Warnings", value: queueItems.reduce((total, item) => total + item.warning_count, 0), note: "Needs reviewer attention" },
  ];

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="validation-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="validation-title" className="text-2xl font-bold">Validation Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review submitted request items, inspect validation results, and decide whether to return to data entry or continue to review.</p>
        </div>
        <Badge variant="outline">Read-only evidence view</Badge>
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
              <h2 className="text-base font-bold">Submitted request items</h2>
              <p className="mt-1 text-xs text-muted-foreground">Click a record to open its validation report.</p>
            </div>
            <Badge variant="outline">{queueItems.length} records</Badge>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
              <Search aria-hidden="true" className="size-4 text-muted-foreground" />
              <span className="sr-only">Search validation queue</span>
              <Input
                className="border-0 bg-transparent"
                placeholder="Search request, indicator, department, officer"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </label>
            <select
              className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold"
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value as ValidationQueueStatus | "ALL")}
            >
              <option value="ALL">status: all</option>
              <option value="PENDING">PENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
              <option value="READY_FOR_REVIEW">READY_FOR_REVIEW</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run / request</TableHead>
                <TableHead>Indicator context</TableHead>
                <TableHead>Submitted by / to</TableHead>
                <TableHead>Results</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueItems.map((item) => (
                <TableRow
                  key={item.validation_run_code}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onOpenRun(item.validation_run_code)}
                >
                  <TableCell>
                    <span className="block font-mono text-[11px]">{item.validation_run_code}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{item.request_code}</span>
                  </TableCell>
                  <TableCell className="max-w-80 whitespace-normal">
                    <span className="block font-semibold">{item.national_indicator_code} - {item.indicator_label}</span>
                    <span className="text-[11px] text-muted-foreground">{item.goal_path} / {item.target_path}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-xs font-semibold">From: {item.submitted_by}</span>
                    <span className="text-[11px] text-muted-foreground">To: {item.submitted_to}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-xs font-semibold">{item.passed_count} pass / {item.error_count} errors</span>
                    <span className="text-[11px] text-muted-foreground">{item.warning_count} warnings / {item.blocker_count} blockers</span>
                  </TableCell>
                  <TableCell>{item.received_at}</TableCell>
                  <TableCell><Badge variant={queueStatusVariant(item.status)}>{item.status}</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onOpenRun(item.validation_run_code); }}>
                      <ShieldCheck aria-hidden="true" className="size-4" /> Open
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

function TemplateCellModal({
  selectedResult,
  onClose,
}: {
  selectedResult: ValidationResultSample;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="validation-cell-title">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Template cell drilldown</p>
            <h2 id="validation-cell-title" className="text-xl font-bold">{selectedResult.cell_address} - {selectedResult.rule_code}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5">
          <TemplatePreview selectedCell={selectedResult.cell_address} />
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-lg:grid-cols-1">
            <div className="rounded-md bg-muted/40 p-4 text-sm">
              <p className="font-bold">Validation message</p>
              <p className="mt-2 text-muted-foreground">{selectedResult.message}</p>
              <p className="mt-3 font-bold">Suggested action</p>
              <p className="mt-2 text-muted-foreground">{selectedResult.suggested_action}</p>
            </div>
            <dl className="grid gap-2 rounded-md bg-muted/40 p-4 text-xs">
              {[
                ["Record", selectedResult.record_code],
                ["Geography", selectedResult.geography_label],
                ["Time period", selectedResult.time_period],
                ["Area type", selectedResult.area_type],
                ["Comparison", selectedResult.comparison_type],
                ["Status", selectedResult.status],
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

function ValidationReport({
  queueItem,
  selectedResult,
  onSelectResult,
  onBack,
  onOpenCell,
}: {
  queueItem: ValidationQueueItemSample;
  selectedResult: ValidationResultSample;
  onSelectResult: (resultCode: string) => void;
  onBack: () => void;
  onOpenCell: () => void;
}) {
  const runResults = validationResults.filter((result) => result.validation_run_code === queueItem.validation_run_code);
  const resultRows = runResults.length > 0 ? runResults : validationResults.filter((result) => result.validation_run_code === "VALRUN_REQ_SDG_NIF_2025_0001_V1");
  const resultCounts = [
    { label: "Records", value: queueItem.record_count, note: "Validated staged rows", variant: "outline" },
    { label: "Passed", value: queueItem.passed_count, note: "Rule checks passed", variant: "secondary" },
    { label: "Warnings", value: queueItem.warning_count, note: "Reviewer attention", variant: "outline" },
    { label: "Errors", value: queueItem.error_count, note: "Must fix before review", variant: "destructive" },
    { label: "Blockers", value: queueItem.blocker_count, note: "Hard stop checks", variant: "destructive" },
  ] as const;

  return (
    <section className="mx-auto flex max-w-[1280px] flex-col gap-4" aria-labelledby="validation-report-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Button type="button" variant="outline" size="icon-sm" onClick={onBack} aria-label="Back to validation queue">
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <div>
            <h1 id="validation-report-title" className="text-2xl font-bold">Validation Report</h1>
            <p className="mt-1 text-sm text-muted-foreground">Indicator validation context for the submitted template before review.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={queueStatusVariant(queueItem.status)}>{queueItem.status}</Badge>
          <Button type="button" variant="outline"><FileSpreadsheet aria-hidden="true" className="size-4" /> Export view</Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-lg:grid-cols-1">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Indicator validation context</p>
              <h2 className="mt-1 text-lg font-bold">{queueItem.national_indicator_code} - {queueItem.indicator_label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{queueItem.goal_path} &gt; {queueItem.target_path}</p>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">{queueItem.submission_version_code} / {queueItem.template_instance_code}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-xs">
              <p className="font-bold">Submitted by / to</p>
              <p className="mt-2">From: <span className="font-semibold">{queueItem.source_organization_name} / {queueItem.submitted_by}</span></p>
              <p className="mt-1">To: <span className="font-semibold">{queueItem.submitted_to}</span></p>
              <p className="mt-1 text-muted-foreground">Received: {queueItem.received_at}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-5 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {resultCounts.map((count) => (
          <div key={count.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
            <p className="text-xs font-semibold text-muted-foreground">{count.label}</p>
            <p className="mt-2 text-2xl font-bold">{count.value}</p>
            <Badge className="mt-1" variant={count.variant}>{count.note}</Badge>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">Template preview</h2>
                <p className="text-xs text-muted-foreground">Click result rows to highlight affected cells.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onOpenCell}>
                <Eye aria-hidden="true" className="size-4" /> View cell
              </Button>
            </div>
            <TemplatePreview selectedCell={selectedResult.cell_address} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cell</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultRows.map((result) => (
                  <TableRow
                    key={result.result_code}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectResult(result.result_code)}
                  >
                    <TableCell className="font-mono text-[11px]">{result.cell_address}</TableCell>
                    <TableCell>{result.geography_label}</TableCell>
                    <TableCell className="font-mono text-[11px]">{result.rule_code}</TableCell>
                    <TableCell><Badge variant={severityVariant(result.severity)}>{result.severity}</Badge></TableCell>
                    <TableCell><Badge variant={resultStatusVariant(result.status)}>{result.status}</Badge></TableCell>
                    <TableCell className="max-w-96 whitespace-normal text-xs">{result.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">Selected result detail</h2>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{selectedResult.result_code}</p>
              </div>
              <Badge variant={resultStatusVariant(selectedResult.status)}>{selectedResult.status}</Badge>
            </div>

            <div className="rounded-md bg-muted/40 p-3 text-xs">
              <p className="font-bold">Message</p>
              <p className="mt-2 text-muted-foreground">{selectedResult.message}</p>
            </div>

            <dl className="grid gap-2 text-xs">
              {[
                ["Cell", selectedResult.cell_address],
                ["Geography", selectedResult.geography_label],
                ["Time period", selectedResult.time_period],
                ["Area type", selectedResult.area_type],
                ["Rule", selectedResult.rule_code],
                ["Comparison", selectedResult.comparison_type],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-border/70 pb-2">
                  <dt className="font-semibold text-muted-foreground">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="rounded-md bg-muted/40 p-3 text-xs">
              <p className="font-bold">Suggested action</p>
              <p className="mt-2 text-muted-foreground">{selectedResult.suggested_action}</p>
            </div>

            <div className="grid gap-2">
              <Button type="button" variant="outline" onClick={onOpenCell}><Eye aria-hidden="true" className="size-4" /> Open template cell</Button>
              <Button type="button" variant="outline"><ArrowLeft aria-hidden="true" className="size-4" /> Back to data entry</Button>
              <Button type="button" disabled={queueItem.error_count > 0 || queueItem.blocker_count > 0}>
                <CheckCircle2 aria-hidden="true" className="size-4" /> Continue to review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3">
          <h2 className="text-base font-bold">Request to review status trail</h2>
          <div className="grid gap-2">
            {validationTrailSteps.map((step, index) => (
              <div key={step.label} className="grid grid-cols-[32px_160px_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-muted/40 p-3 text-xs max-lg:grid-cols-[32px_1fr]">
                <div className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{index + 1}</div>
                <p className="font-bold">{step.label}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{step.code}</p>
                <Badge variant={queueStatusVariant(step.status)}>{step.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function ValidationQueuePage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ValidationQueueStatus | "ALL">("ALL");
  const [selectedRunCode, setSelectedRunCode] = useState<string | null>(null);
  const [selectedResultCode, setSelectedResultCode] = useState(validationResults[0].result_code);
  const [modal, setModal] = useState<ValidationModal>(null);

  const filteredQueueItems = useMemo(() => {
    const normalized = query.toLowerCase();
    return validationQueueItems.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesQuery = Object.values(item).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const selectedQueueItem = validationQueueItems.find((item) => item.validation_run_code === selectedRunCode) ?? null;
  const selectedResult = validationResults.find((result) => result.result_code === selectedResultCode) ?? validationResults[0];

  const openRun = (runCode: string) => {
    setSelectedRunCode(runCode);
    const firstResultForRun = validationResults.find((result) => result.validation_run_code === runCode);
    setSelectedResultCode(firstResultForRun?.result_code ?? validationResults[0].result_code);
  };

  return (
    <AppShell persona="Validation Officer" activeDashboard="/dashboard/unit-admin">
      {selectedQueueItem ? (
        <ValidationReport
          queueItem={selectedQueueItem}
          selectedResult={selectedResult}
          onSelectResult={setSelectedResultCode}
          onBack={() => setSelectedRunCode(null)}
          onOpenCell={() => setModal("template-cell")}
        />
      ) : (
        <ValidationQueue
          query={query}
          statusFilter={statusFilter}
          queueItems={filteredQueueItems}
          onQueryChange={setQuery}
          onStatusChange={setStatusFilter}
          onOpenRun={openRun}
        />
      )}
      {modal === "template-cell" ? (
        <TemplateCellModal selectedResult={selectedResult} onClose={() => setModal(null)} />
      ) : null}
    </AppShell>
  );
}
