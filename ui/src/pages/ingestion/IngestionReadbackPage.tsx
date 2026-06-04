import {
  Database,
  Eye,
  FileJson,
  RefreshCw,
  Search,
  ServerCog,
  X,
} from "lucide-react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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
import { useLanguage } from "@/providers/language-context";
import { ingestionService } from "@/services/ingestionService";
import type { IngestionSubmissionItem } from "@/types/ingestion";

type IngestionStatusFilter = IngestionSubmissionStatus | "ALL";
const ingestionUnitCode = "SDG";

const statusVariant = (status: string) => {
  if (["INGESTED", "COMPLETED", "READY", "STAGED"].includes(status)) return "secondary";
  if (["RECEIVED", "PENDING", "DEFERRED", "NOT_STARTED"].includes(status)) return "outline";
  return "destructive";
};

const readString = (value: unknown, fallback = "") => typeof value === "string" && value ? value : fallback;
const readNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value) || fallback;
  return fallback;
};

function apiSubmissionToSample(submission: IngestionSubmissionItem): IngestionSubmissionSample {
  const channel = readString(submission.submission_channel, "WEB_FORM");
  return {
    submission_code: submission.submission_code,
    request_code: readString(submission.request_code, "-"),
    item_code: readString(submission.item_code, "-"),
    template_instance_code: readString(submission.template_instance_code, "-"),
    source_organization_name: readString(submission.source_organization_name, "-"),
    submission_channel: channel === "API_JSON" ? "API_JSON" : "WEB_FORM",
    received_at: readString(submission.received_at, ""),
    current_version_number: readNumber(submission.current_version_number, 1),
    status: readString(submission.status, "RECEIVED") as IngestionSubmissionStatus,
    latest_ingestion_status: readString(submission.latest_ingestion_status, "NOT_STARTED"),
  };
}

const recordCode = (record: Record<string, unknown>) => readString(record.record_code);
const statusValue = (record: Record<string, unknown>, fallback = "PENDING") => readString(record.status ?? record.manifest_status ?? record.worker_status ?? record.validation_status ?? record.value_status, fallback);

function SubmissionDetailModal({
  submission,
  onClose,
}: {
  submission: IngestionSubmissionSample;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const versionsQuery = useQuery({
    queryKey: ["ingestion", "submission-versions", submission.submission_code, ingestionUnitCode, language],
    queryFn: () => ingestionService.listSubmissionVersions({ submissionCode: submission.submission_code, locale: language, unitCode: ingestionUnitCode }),
  });
  const versions = versionsQuery.data?.data.map((version) => ({
    version_code: version.version_code,
    submission_code: readString(version.submission_code, submission.submission_code),
    version_number: readNumber(version.version_number, 1),
    status: readString(version.status, "RECEIVED") as IngestionSubmissionStatus,
    submitted_at: readString(version.submitted_at, ""),
    received_at: readString(version.received_at, ""),
    worker_status: readString(version.worker_status, "PENDING"),
    validation_status: readString(version.validation_status, "NOT_STARTED"),
  })) ?? ingestionVersions.filter((version) => version.submission_code === submission.submission_code);
  const versionCodes = versions.map((version) => version.version_code);
  const activeVersionCode = versionCodes[0] ?? "";
  const manifestsQuery = useQuery({
    queryKey: ["ingestion", "manifests", activeVersionCode, ingestionUnitCode, language],
    queryFn: () => ingestionService.listManifests({ versionCode: activeVersionCode, locale: language, unitCode: ingestionUnitCode }),
    enabled: Boolean(activeVersionCode),
  });
  const jobsQuery = useQuery({
    queryKey: ["ingestion", "jobs", activeVersionCode, ingestionUnitCode, language],
    queryFn: () => ingestionService.listJobs({ versionCode: activeVersionCode, locale: language, unitCode: ingestionUnitCode }),
    enabled: Boolean(activeVersionCode),
  });
  const runsQuery = useQuery({
    queryKey: ["ingestion", "runs", activeVersionCode, ingestionUnitCode, language],
    queryFn: () => ingestionService.listRuns({ versionCode: activeVersionCode, locale: language, unitCode: ingestionUnitCode }),
    enabled: Boolean(activeVersionCode),
  });
  const stagedRecordsQuery = useQuery({
    queryKey: ["ingestion", "staged-records", activeVersionCode, ingestionUnitCode, language],
    queryFn: () => ingestionService.listStagedRecords({ versionCode: activeVersionCode, locale: language, unitCode: ingestionUnitCode }),
    enabled: Boolean(activeVersionCode),
  });
  const manifests = manifestsQuery.data?.data ?? ingestionManifests.filter((manifest) => versionCodes.includes(manifest.version_code));
  const jobs = jobsQuery.data?.data ?? ingestionJobs.filter((job) => versionCodes.includes(job.version_code));
  const runs = runsQuery.data?.data ?? ingestionRuns.filter((run) => versionCodes.includes(run.version_code));
  const records = stagedRecordsQuery.data?.data ?? stagedRecords.filter((record) => versionCodes.includes(record.version_code));
  const dimensionQueries = useQueries({
    queries: records.slice(0, 6).map((record) => ({
      queryKey: ["ingestion", "staged-record-dimensions", recordCode(record), ingestionUnitCode, language],
      queryFn: () => ingestionService.listStagedRecordDimensions({ recordCode: recordCode(record), locale: language, unitCode: ingestionUnitCode }),
      enabled: Boolean(recordCode(record)),
    })),
  });
  const isLoadingDetail = versionsQuery.isFetching || manifestsQuery.isFetching || jobsQuery.isFetching || runsQuery.isFetching || stagedRecordsQuery.isFetching || dimensionQueries.some((query) => query.isFetching);
  const hasDetailError = versionsQuery.error || manifestsQuery.error || jobsQuery.error || runsQuery.error || stagedRecordsQuery.error || dimensionQueries.some((query) => query.error);

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
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
            <span className="font-semibold">API readback: versions, manifests, jobs, runs, staged records, dimensions</span>
            <div className="flex flex-wrap items-center gap-2">
              {isLoadingDetail ? <Loader variant="inline" label="Loading ingestion readback" /> : null}
              {hasDetailError ? <span className="font-semibold text-destructive">Some readback APIs failed; safe fallback remains visible.</span> : null}
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => {
                  void versionsQuery.refetch();
                  void manifestsQuery.refetch();
                  void jobsQuery.refetch();
                  void runsQuery.refetch();
                  void stagedRecordsQuery.refetch();
                  dimensionQueries.forEach((query) => void query.refetch());
                }}
              >
                <RefreshCw aria-hidden="true" className="size-3" /> Retry
              </Button>
            </div>
          </div>
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
                      <TableRow key={readString(manifest.manifest_code, readString(manifest.payload_role, "manifest"))}>
                        <TableCell>
                          <span className="block font-mono text-[11px]">{readString(manifest.manifest_code, "-")}</span>
                          <span className="text-[11px] text-muted-foreground">{readString(manifest.payload_role, "-")} / {readString(manifest.content_type, "-")}</span>
                        </TableCell>
                        <TableCell>{readString(manifest.storage_provider, "-")}</TableCell>
                        <TableCell>{readNumber(manifest.record_count, 0)}</TableCell>
                        <TableCell><Badge variant={statusVariant(statusValue(manifest))}>{statusValue(manifest)}</Badge></TableCell>
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
                      <TableRow key={readString(job.job_code, "job")}>
                        <TableCell>{readString(job.job_type, "-")}</TableCell>
                        <TableCell className="font-mono text-[11px]">{readString(job.job_code, "-")}</TableCell>
                        <TableCell><Badge variant={statusVariant(statusValue(job))}>{statusValue(job)}</Badge></TableCell>
                        <TableCell>{readNumber(job.attempt_count, 0)}/{readNumber(job.max_attempts, 0)}</TableCell>
                      </TableRow>
                    ))}
                    {runs.map((run) => (
                      <TableRow key={readString(run.run_code, "run")}>
                        <TableCell>{readString(run.run_type, "-")}</TableCell>
                        <TableCell className="font-mono text-[11px]">{readString(run.run_code, "-")}</TableCell>
                        <TableCell><Badge variant={statusVariant(statusValue(run))}>{statusValue(run)}</Badge></TableCell>
                        <TableCell>{readNumber(run.attempt_number, 0)}</TableCell>
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
                    {records.map((record, index) => {
                      const dimensions = dimensionQueries[index]?.data?.data;
                      const dimensionLabel = dimensions?.length
                        ? dimensions.map((dimension) => `${readString(dimension.dimension_code)}:${readString(dimension.member_code)}`).join(" / ")
                        : `${readString(record.geography_label, "-")} / ${readString(record.time_period, "-")} / ${readString(record.area_type, "-")}`;
                      return (
                      <TableRow key={recordCode(record) || `${readString(record.cell_code, "cell")}-${index}`}>
                        <TableCell>
                          <span className="block font-semibold">{readString(record.cell_code, "-")}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">#{readNumber(record.record_number, index + 1)}</span>
                        </TableCell>
                        <TableCell className="max-w-72 whitespace-normal text-xs">
                          {dimensionLabel}
                        </TableCell>
                        <TableCell>{readString(record.raw_value_text, "Blank")}</TableCell>
                        <TableCell><Badge variant={statusVariant(statusValue(record, "STAGED"))}>{statusValue(record, "STAGED")}</Badge></TableCell>
                      </TableRow>
                    );})}
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
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<IngestionStatusFilter>("ALL");
  const [selectedSubmissionCode, setSelectedSubmissionCode] = useState<string | null>(null);

  const submissionsQuery = useQuery({
    queryKey: ["ingestion", "submissions", ingestionUnitCode, language],
    queryFn: () => ingestionService.listSubmissions({ locale: language, unitCode: ingestionUnitCode }),
  });
  const submissions = useMemo(
    () => submissionsQuery.data?.data.map(apiSubmissionToSample) ?? ingestionSubmissions,
    [submissionsQuery.data],
  );
  const filteredSubmissions = useMemo(() => {
    const normalized = query.toLowerCase();
    return submissions.filter((submission) => {
      const matchesStatus = statusFilter === "ALL" || submission.status === statusFilter;
      const matchesQuery = Object.values(submission).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, submissions]);

  const selectedSubmission = submissions.find((submission) => submission.submission_code === selectedSubmissionCode) ?? null;
  const stats = [
    { label: "Submissions", value: submissions.length, note: "Readback records", icon: Database },
    { label: "Received", value: submissions.filter((item) => item.status === "RECEIVED").length, note: "Awaiting worker", icon: FileJson },
    { label: "Ingested", value: submissions.filter((item) => item.status === "INGESTED").length, note: "Ready for validation", icon: ServerCog },
    // { label: "Staged records", value: stagedRecords.length, note: "Safe staged summary", icon: FileJson },
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
            {submissionsQuery.isFetching ? (
              <Loader variant="inline" label="Loading ingestion submissions from API" className="text-xs text-muted-foreground" />
            ) : null}
            {submissionsQuery.error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                Unable to load Ingestion API data. Showing local sample fallback.
              </div>
            ) : null}

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
                {filteredSubmissions.length ? filteredSubmissions.map((submission) => (
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
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      No ingestion submissions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {selectedSubmission ? <SubmissionDetailModal submission={selectedSubmission} onClose={() => setSelectedSubmissionCode(null)} /> : null}
    </AppShell>
  );
}
