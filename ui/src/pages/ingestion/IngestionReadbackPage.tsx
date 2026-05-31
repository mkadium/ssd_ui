import {
  Database,
  Eye,
  FileJson,
  Search,
  ServerCog,
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
  ingestionJobs,
  ingestionManifests,
  ingestionRuns,
  ingestionSubmissions,
  ingestionVersions,
  stagedRecords,
  type IngestionSubmissionSample,
  type IngestionSubmissionStatus,
} from "@/data/ingestionReadback.sample";

type IngestionStatusFilter = IngestionSubmissionStatus | "ALL";

const statusVariant = (status: string) => {
  if (["INGESTED", "COMPLETED", "READY", "STAGED"].includes(status)) return "secondary";
  if (["RECEIVED", "PENDING", "DEFERRED", "NOT_STARTED"].includes(status)) return "outline";
  return "destructive";
};

function SubmissionDetailModal({
  submission,
  onClose,
}: {
  submission: IngestionSubmissionSample;
  onClose: () => void;
}) {
  const versions = ingestionVersions.filter((version) => version.submission_code === submission.submission_code);
  const versionCodes = versions.map((version) => version.version_code);
  const manifests = ingestionManifests.filter((manifest) => versionCodes.includes(manifest.version_code));
  const jobs = ingestionJobs.filter((job) => versionCodes.includes(job.version_code));
  const runs = ingestionRuns.filter((run) => versionCodes.includes(run.version_code));
  const records = stagedRecords.filter((record) => versionCodes.includes(record.version_code));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="ingestion-detail-title">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Ingestion readback</p>
            <h2 id="ingestion-detail-title" className="text-xl font-bold">{submission.submission_code}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{submission.request_code} / {submission.item_code}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-5">
          <section className="grid grid-cols-4 gap-3 text-xs max-lg:grid-cols-2 max-sm:grid-cols-1">
            {[
              ["Template instance", submission.template_instance_code],
              ["Source organization", submission.source_organization_name],
              ["Channel", submission.submission_channel],
              ["Received", submission.received_at],
              ["Current version", `V${submission.current_version_number}`],
              ["Submission status", submission.status],
              ["Latest ingestion", submission.latest_ingestion_status],
              ["Payload boundary", "Raw payload/source hash hidden"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted/40 p-3">
                <dt className="font-semibold text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words font-semibold">{value}</dd>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
            <Card>
              <CardContent className="grid gap-3">
                <h3 className="text-base font-bold">Versions</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Validation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => (
                      <TableRow key={version.version_code}>
                        <TableCell>
                          <span className="block font-mono text-[11px]">{version.version_code}</span>
                          <span className="text-[11px] text-muted-foreground">V{version.version_number} / {version.received_at}</span>
                        </TableCell>
                        <TableCell><Badge variant={statusVariant(version.status)}>{version.status}</Badge></TableCell>
                        <TableCell><Badge variant={statusVariant(version.worker_status)}>{version.worker_status}</Badge></TableCell>
                        <TableCell><Badge variant={statusVariant(version.validation_status)}>{version.validation_status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-3">
                <h3 className="text-base font-bold">Manifests</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manifest</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manifests.map((manifest) => (
                      <TableRow key={manifest.manifest_code}>
                        <TableCell>
                          <span className="block font-mono text-[11px]">{manifest.manifest_code}</span>
                          <span className="text-[11px] text-muted-foreground">{manifest.payload_role} / {manifest.content_type}</span>
                        </TableCell>
                        <TableCell>{manifest.storage_provider}</TableCell>
                        <TableCell>{manifest.record_count}</TableCell>
                        <TableCell><Badge variant={statusVariant(manifest.manifest_status)}>{manifest.manifest_status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-950">Only safe storage URI labels are shown. Raw payload bodies and source hashes are intentionally hidden.</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
            <Card>
              <CardContent className="grid gap-3">
                <h3 className="text-base font-bold">Jobs and runs</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.job_code}>
                        <TableCell>{job.job_type}</TableCell>
                        <TableCell className="font-mono text-[11px]">{job.job_code}</TableCell>
                        <TableCell><Badge variant={statusVariant(job.status)}>{job.status}</Badge></TableCell>
                        <TableCell>{job.attempt_count}/{job.max_attempts}</TableCell>
                      </TableRow>
                    ))}
                    {runs.map((run) => (
                      <TableRow key={run.run_code}>
                        <TableCell>{run.run_type}</TableCell>
                        <TableCell className="font-mono text-[11px]">{run.run_code}</TableCell>
                        <TableCell><Badge variant={statusVariant(run.status)}>{run.status}</Badge></TableCell>
                        <TableCell>{run.attempt_number}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-3">
                <h3 className="text-base font-bold">Staged records</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cell</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.record_code}>
                        <TableCell>
                          <span className="block font-semibold">{record.cell_code}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">#{record.record_number}</span>
                        </TableCell>
                        <TableCell className="max-w-72 whitespace-normal text-xs">
                          {record.geography_label} / {record.time_period} / {record.area_type}
                        </TableCell>
                        <TableCell>{record.raw_value_text || "Blank"}</TableCell>
                        <TableCell><Badge variant={statusVariant(record.status)}>{record.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

export function IngestionReadbackPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<IngestionStatusFilter>("ALL");
  const [selectedSubmissionCode, setSelectedSubmissionCode] = useState<string | null>(null);

  const filteredSubmissions = useMemo(() => {
    const normalized = query.toLowerCase();
    return ingestionSubmissions.filter((submission) => {
      const matchesStatus = statusFilter === "ALL" || submission.status === statusFilter;
      const matchesQuery = Object.values(submission).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const selectedSubmission = ingestionSubmissions.find((submission) => submission.submission_code === selectedSubmissionCode) ?? null;
  const stats = [
    { label: "Submissions", value: ingestionSubmissions.length, note: "Readback records", icon: Database },
    { label: "Received", value: ingestionSubmissions.filter((item) => item.status === "RECEIVED").length, note: "Awaiting worker", icon: FileJson },
    { label: "Ingested", value: ingestionSubmissions.filter((item) => item.status === "INGESTED").length, note: "Ready for validation", icon: ServerCog },
    { label: "Staged records", value: stagedRecords.length, note: "Safe staged summary", icon: FileJson },
  ];

  return (
    <AppShell persona="Ingestion Admin" activeDashboard="/dashboard/unit-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="ingestion-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="ingestion-title" className="text-2xl font-bold">Ingestion Readback</h1>
            <p className="mt-1 text-sm text-muted-foreground">Monitor submitted payload lifecycle without exposing raw payloads, source hashes, or internal database IDs.</p>
          </div>
          <Badge variant="outline">Read-only admin view</Badge>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
                  <Icon aria-hidden="true" className="size-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
              </div>
            );
          })}
        </div>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold">Submission lifecycle records</h2>
                <p className="mt-1 text-xs text-muted-foreground">Open a submission to view versions, manifests, jobs, runs, and staged record summaries.</p>
              </div>
              <Badge variant="outline">{filteredSubmissions.length} visible</Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search ingestion submissions</span>
                <Input
                  className="border-0 bg-transparent"
                  placeholder="Search submission, request, item, organization"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <select
                className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as IngestionStatusFilter)}
              >
                <option value="ALL">status: all</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="INGESTED">INGESTED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submission / request</TableHead>
                  <TableHead>Template instance</TableHead>
                  <TableHead>Source organization</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow
                    key={submission.submission_code}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedSubmissionCode(submission.submission_code)}
                  >
                    <TableCell>
                      <span className="block font-mono text-[11px]">{submission.submission_code}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{submission.request_code} / {submission.item_code}</span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">{submission.template_instance_code}</TableCell>
                    <TableCell>{submission.source_organization_name}</TableCell>
                    <TableCell>V{submission.current_version_number}</TableCell>
                    <TableCell>{submission.received_at}</TableCell>
                    <TableCell><Badge variant={statusVariant(submission.status)}>{submission.status}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setSelectedSubmissionCode(submission.submission_code); }}>
                        <Eye aria-hidden="true" className="size-4" /> Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {selectedSubmission ? <SubmissionDetailModal submission={selectedSubmission} onClose={() => setSelectedSubmissionCode(null)} /> : null}
    </AppShell>
  );
}
