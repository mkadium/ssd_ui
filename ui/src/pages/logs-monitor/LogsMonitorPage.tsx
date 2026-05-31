import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  FileText,
  HardDrive,
  Mail,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  X,
  XCircle,
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
  auditLogs,
  operationsJobs,
  systemHealth,
  type AuditLogSample,
  type HealthStatus,
  type JobStatus,
  type LogSeverity,
} from "@/data/logsMonitor.sample";

type LogFilter = LogSeverity | "ALL";

const healthStatusVariant = (status: HealthStatus) => {
  if (status === "OK") return "secondary";
  if (status === "PENDING") return "outline";
  return "destructive";
};

const jobStatusVariant = (status: JobStatus) => {
  if (status === "COMPLETED" || status === "RUNNING") return "secondary";
  if (status === "PENDING" || status === "WARNING") return "outline";
  return "destructive";
};

const severityVariant = (severity: LogSeverity) => {
  if (severity === "ERROR") return "destructive";
  if (severity === "WARNING") return "outline";
  return "secondary";
};

const componentIcon = (category: string) => {
  if (category === "API") return Server;
  if (category === "DATABASE") return Database;
  if (category === "STORAGE") return HardDrive;
  if (category === "DEPLOYMENT") return RefreshCw;
  return Clock3;
};

function LogDetailModal({ log, onClose }: { log: AuditLogSample; onClose: () => void }) {
  const detailRows = [
    ["Event", log.event_code],
    ["Module", log.module],
    ["Severity", log.severity],
    ["Actor", log.actor],
    ["Action", log.action],
    ["Entity", log.entity_code],
    ["Occurred", log.occurred_at],
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="log-detail-title">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Sanitized audit/log event</p>
            <h2 id="log-detail-title" className="text-xl font-bold">{log.event_code}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={severityVariant(log.severity)}>{log.severity}</Badge>
            <Badge variant="outline">{log.module}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs max-lg:grid-cols-2 max-sm:grid-cols-1">
            {detailRows.map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted/40 p-3">
                <p className="font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 break-words font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
            <div className="rounded-md bg-muted/40 p-4">
              <p className="text-sm font-bold">Message</p>
              <p className="mt-2 text-sm text-muted-foreground">{log.sanitized_message}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-4">
              <p className="text-sm font-bold">Detail summary</p>
              <p className="mt-2 text-sm text-muted-foreground">{log.detail_summary}</p>
            </div>
          </div>
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-950">
            This screen intentionally shows summarized, sanitized evidence only. Secrets, bearer tokens, token hashes, raw payloads, source hashes, internal database IDs, and full sensitive log bodies are not displayed.
          </div>
        </div>
      </div>
    </div>
  );
}

export function LogsMonitorPage() {
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<LogFilter>("ALL");
  const [selectedLogCode, setSelectedLogCode] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    const normalized = query.toLowerCase();
    return auditLogs.filter((log) => {
      const matchesSeverity = severityFilter === "ALL" || log.severity === severityFilter;
      const matchesQuery = Object.values(log).join(" ").toLowerCase().includes(normalized);
      return matchesSeverity && matchesQuery;
    });
  }, [query, severityFilter]);

  const selectedLog = auditLogs.find((log) => log.event_code === selectedLogCode) ?? null;
  const healthOkCount = systemHealth.filter((item) => item.status === "OK").length;
  const pendingJobCount = operationsJobs.filter((job) => ["PENDING", "RUNNING", "WARNING"].includes(job.status)).length;
  const alertLogCount = auditLogs.filter((log) => ["WARNING", "ERROR"].includes(log.severity)).length;

  const summaryCards = [
    { label: "System health", value: `${healthOkCount}/${systemHealth.length}`, note: "Components OK", icon: CheckCircle2 },
    { label: "Active jobs", value: pendingJobCount, note: "Pending, running, warning", icon: Activity },
    { label: "Audit events", value: auditLogs.length, note: "Sanitized events", icon: FileText },
    { label: "Alerts", value: alertLogCount, note: "Warnings/errors", icon: AlertTriangle },
  ];

  return (
    <AppShell persona="Operations Admin" activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="logs-monitor-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="logs-monitor-title" className="text-2xl font-bold">Logs & Monitor</h1>
            <p className="mt-1 text-sm text-muted-foreground">Monitor API, DB, storage, deployment, jobs, reminders, invitations, backups, and audit events.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Sanitized only</Badge>
            <Button type="button" variant="outline"><RefreshCw aria-hidden="true" className="size-4" /> Refresh</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                  <Icon aria-hidden="true" className="size-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
              </div>
            );
          })}
        </div>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold">System health</h2>
                <p className="mt-1 text-xs text-muted-foreground">Component checks are sample-shaped from DEV deployment and runtime monitoring needs.</p>
              </div>
              <Badge variant="outline">Last refresh 15:58</Badge>
            </div>
            <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {systemHealth.map((component) => {
                const Icon = componentIcon(component.category);

                return (
                  <div key={component.component_code} className="grid min-h-36 gap-3 rounded-md bg-muted/35 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Icon aria-hidden="true" className="size-5 text-primary" />
                      <Badge variant={healthStatusVariant(component.status)}>{component.status}</Badge>
                    </div>
                    <div>
                      <p className="font-semibold">{component.component_name}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{component.summary}</p>
                    </div>
                    <div className="flex justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>{component.last_checked_at}</span>
                      <span>{component.response_time_ms ? `${component.response_time_ms} ms` : "n/a"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-4 max-xl:grid-cols-1">
          <Card>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-bold">Operations jobs</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Ingestion, validation, review, invitations, reminders/email, and backup monitoring.</p>
                </div>
                <Badge variant="outline">{operationsJobs.length} jobs</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Next run</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationsJobs.map((job) => (
                    <TableRow key={job.job_code}>
                      <TableCell className="max-w-72 whitespace-normal">
                        <span className="block font-mono text-[11px]">{job.job_code}</span>
                        <span className="text-[11px] text-muted-foreground">{job.related_code}</span>
                      </TableCell>
                      <TableCell>{job.job_type}</TableCell>
                      <TableCell><Badge variant={jobStatusVariant(job.status)}>{job.status}</Badge></TableCell>
                      <TableCell>
                        <span className="block text-xs">{job.scheduled_for}</span>
                        <span className="text-[11px] text-muted-foreground">{job.attempts}</span>
                      </TableCell>
                      <TableCell>{job.owner}</TableCell>
                      <TableCell>
                        <span className="block">{job.next_run_at}</span>
                        <span className="text-[11px] text-muted-foreground">{job.note}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold">Planned operations</h2>
                <p className="mt-1 text-xs text-muted-foreground">Visual status only until governed scheduler/notification APIs exist.</p>
              </div>
              {[
                { label: "Reminder emails", value: "1 pending run", icon: Mail, status: "PENDING" },
                { label: "Invitation expiry scan", value: "1 upcoming run", icon: ShieldCheck, status: "PENDING" },
                { label: "Daily backup", value: "Completed today", icon: Archive, status: "COMPLETED" },
                { label: "Validation queue sync", value: "1 warning state", icon: AlertTriangle, status: "WARNING" },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-3 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon aria-hidden="true" className="size-5 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.value}</p>
                      </div>
                    </div>
                    <Badge variant={jobStatusVariant(item.status as JobStatus)}>{item.status}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold">Recent audit and log events</h2>
                <p className="mt-1 text-xs text-muted-foreground">Searchable, filtered, sanitized event list. Open a row for detail summary.</p>
              </div>
              <Badge variant="outline">{filteredLogs.length} visible</Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2 max-sm:min-w-full">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search logs</span>
                <Input
                  className="border-0 bg-transparent"
                  placeholder="Search module, actor, action, entity, message"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold"
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value as LogFilter)}
                >
                  <option value="ALL">severity: all</option>
                  <option value="INFO">INFO</option>
                  <option value="AUDIT">AUDIT</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                </select>
                <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold" defaultValue="newest">
                  <option value="newest">sort: newest</option>
                  <option value="module">sort: module</option>
                  <option value="severity">sort: severity</option>
                </select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action / entity</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={log.event_code}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLogCode(log.event_code)}
                  >
                    <TableCell>{log.occurred_at}</TableCell>
                    <TableCell><Badge variant={severityVariant(log.severity)}>{log.severity}</Badge></TableCell>
                    <TableCell>{log.module}</TableCell>
                    <TableCell>{log.actor}</TableCell>
                    <TableCell>
                      <span className="block font-semibold">{log.action}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{log.entity_code}</span>
                    </TableCell>
                    <TableCell className="max-w-80 whitespace-normal">{log.sanitized_message}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setSelectedLogCode(log.event_code); }}>
                        <Eye aria-hidden="true" className="size-4" /> Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Rows 1-{filteredLogs.length} of {filteredLogs.length}. Pagination controls are visual until API pagination is connected.</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled>Previous</Button>
                <Button type="button" variant="outline" disabled>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Operational safety boundary</p>
              <p className="mt-1 text-xs text-muted-foreground">Monitor views show status and sanitized summaries only. Full logs, secrets, tokens, raw payloads, and source hashes remain outside the UI.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <XCircle aria-hidden="true" className="size-4 text-destructive" />
              No sensitive body display
            </div>
          </CardContent>
        </Card>
      </section>

      {selectedLog ? <LogDetailModal log={selectedLog} onClose={() => setSelectedLogCode(null)} /> : null}
    </AppShell>
  );
}
