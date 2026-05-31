import {
  BellRing,
  CheckCircle2,
  Eye,
  Plus,
  Search,
  Send,
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
import { Textarea } from "@/components/ui/textarea";
import { dimensionMembers } from "@/data/dimensionsManagement.sample";
import { nationalIndicatorOptions, officerOptions, organizationOptions } from "@/data/mastersManagement.sample";
import {
  collectionCycles,
  collectionRequests,
  requestAssignments,
  requestItems,
  requestScopeMembers,
  requestStatusTrail,
  templateInstances,
  type AssignmentStatus,
  type CollectionRequestSample,
  type RequestStatus,
} from "@/data/requestsManagement.sample";
import { templateDefinitions } from "@/data/templatesManagement.sample";

type RequestModal = "request-detail" | "create-request" | "template-canvas" | "scope-preview" | "scope-json" | "follow-up" | "send-confirm" | null;

const statusVariant = (status?: string) => {
  if (["ACTIVE", "READY", "SENT", "SUBMITTED", "CLOSED", "ASSIGNED", "ACCEPTED", "COMPLETED"].includes(status ?? "")) return "secondary";
  if (["DRAFT", "OPEN", "IN_PROGRESS", "PENDING"].includes(status ?? "")) return "outline";
  if (["EXPIRED", "CANCELLED", "URGENT", "BLOCKED_UNTIL_INGESTED", "BLOCKED_UNTIL_VALIDATED", "BLOCKED_UNTIL_APPROVED"].includes(status ?? "")) return "destructive";
  return "ghost";
};

function Field({ label, value, readOnly = false }: { label: string; value?: string | number; readOnly?: boolean }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <Input defaultValue={value ?? ""} readOnly={readOnly} className={readOnly ? "bg-muted/60" : undefined} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
}: {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TemplateCanvasPreview({ dense = false }: { dense?: boolean }) {
  const rows = [
    ["Karnataka", "28.4", "18.1", "10.3", "26.7", "17.2", "9.5", "Draft"],
    ["Tamil Nadu", "-", "14.9", "8.6", "24.1", "13.0", "8.0", "Missing"],
    ["Maharashtra", "21.0", "12.2", "7.8", "19.8", "11.5", "7.1", "Draft"],
    ["Kerala", "9.1", "5.2", "3.2", "8.3", "4.8", "3.0", "Draft"],
  ];

  return (
    <div className="overflow-x-auto rounded-md border border-border/70 bg-background">
      <table className="min-w-[780px] border-collapse text-left text-[11px]">
        <tbody>
          <tr className="bg-primary/5 font-bold text-primary">
            <td className="border-b border-r border-border/60 px-3 py-2" colSpan={8}>
              Indicator: Population below poverty line | Code: NIF_1_2_1 | Measure: Percent
            </td>
          </tr>
          <tr className="bg-amber-50 text-center font-bold text-amber-900">
            <td className="border-b border-r border-border/60 px-3 py-2" />
            <td className="border-b border-r border-border/60 px-3 py-2" colSpan={3}>2011-12</td>
            <td className="border-b border-r border-border/60 px-3 py-2" colSpan={3}>2012-13</td>
            <td className="border-b border-border/60 px-3 py-2">Status</td>
          </tr>
          <tr className="bg-muted/50 font-bold">
            {["Location", "Total", "Rural", "Urban", "Total", "Rural", "Urban", "Status"].map((column) => (
              <td key={column} className="border-b border-r border-border/60 px-3 py-2 last:border-r-0">{column}</td>
            ))}
          </tr>
          {rows.slice(0, dense ? 3 : rows.length).map((row) => (
            <tr key={row[0]} className="hover:bg-muted/30">
              {row.map((cell, index) => (
                <td key={`${row[0]}-${index}`} className="border-b border-r border-border/40 px-3 py-2 last:border-r-0">
                  {index === 7 ? <Badge variant={cell === "Missing" ? "destructive" : "outline"}>{cell}</Badge> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RequestModalView({
  modal,
  selectedRequest,
  selectedCycleCode,
  onOpenModal,
  onClose,
}: {
  modal: RequestModal;
  selectedRequest: CollectionRequestSample;
  selectedCycleCode: string;
  onOpenModal: (modal: RequestModal) => void;
  onClose: () => void;
}) {
  if (!modal) return null;

  const requestItemsForRequest = requestItems.filter((item) => item.request_code === selectedRequest.request_code);
  const requestAssignmentsForRequest = requestAssignments.filter((assignment) => assignment.request_code === selectedRequest.request_code);
  const requestItemCodes = new Set(requestItemsForRequest.map((item) => item.item_code));
  const scopeForRequest = requestScopeMembers.filter((scope) => requestItemCodes.has(scope.item_code));
  const primaryTemplateInstance = templateInstances.find((templateInstance) => requestItemCodes.has(templateInstance.item_code));
  const statusTrailForRequest = selectedRequest.request_code === "REQ_SDG_NIF_2025_0001"
    ? requestStatusTrail
    : [
        {
          stage: "Request" as const,
          status: selectedRequest.status,
          code: selectedRequest.request_code,
          timestamp: selectedRequest.sent_at ?? "Draft",
          action: "Request record created for collection workflow",
        },
      ];
  const titleMap: Record<Exclude<RequestModal, null>, string> = {
    "request-detail": "Collection request detail",
    "create-request": "Create collection request",
    "template-canvas": "Template canvas preview",
    "scope-preview": "Scope rows",
    "scope-json": "Scope JSON preview",
    "follow-up": "Follow-up reminder",
    "send-confirm": "Send request confirmation",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Collection Requests</p>
            <h2 id="request-modal-title" className="text-xl font-bold">{titleMap[modal]}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-5">
          {modal === "create-request" ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 p-3">
                <div>
                  <p className="text-sm font-bold">Request setup sequence</p>
                  <p className="mt-1 text-xs text-muted-foreground">Cycle &gt; request header &gt; indicator item &gt; template instance &gt; assignments. Token delivery remains governed by API.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => onOpenModal("template-canvas")}>
                  <Eye aria-hidden="true" className="size-4" /> View template canvas
                </Button>
              </div>

              <section className="grid gap-3">
                <h3 className="text-sm font-bold">Collection details</h3>
                <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
                  <SelectField
                    label="Collection cycle"
                    value={selectedCycleCode}
                    options={collectionCycles.map((cycle) => ({ value: cycle.cycle_code, label: cycle.name }))}
                  />
                  <Field label="Request code" value="REQ_SDG_NIF_2025_0004" />
                  <Field label="Due date" value="2025-09-30" />
                  <SelectField label="Request type" value="NEW_DATA" options={["NEW_DATA", "BACKFILL", "CORRECTION", "REVISION"].map((value) => ({ value, label: value }))} />
                  <SelectField label="Priority" value="NORMAL" options={["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => ({ value, label: value }))} />
                  <SelectField label="Request status" value="DRAFT" options={["DRAFT", "READY"].map((value) => ({ value, label: value }))} />
                </div>
              </section>

              <section className="grid gap-3">
                <h3 className="text-sm font-bold">Indicator, template, and scope</h3>
                <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
                  <SelectField label="Indicator" value="NIF_1_2_1" options={nationalIndicatorOptions.map((indicator) => ({ value: indicator.national_indicator_code ?? indicator.id, label: `${indicator.national_indicator_code ?? indicator.id} - ${indicator.name ?? ""}` }))} />
                  <SelectField label="Template" value="TPL_SDG_NIF_1_2_1_STATE_SUBGROUP" options={templateDefinitions.map((template) => ({ value: template.template_code, label: `${template.template_code} - ${template.status}` }))} />
                  <SelectField label="Time period" value="TIME_2025" options={dimensionMembers.filter((member) => member.dimension_code === "TIME_PERIOD").map((member) => ({ value: member.member_code, label: member.name }))} />
                </div>
                <div className="rounded-md bg-muted/30 p-3">
                  <TemplateCanvasPreview dense />
                </div>
              </section>

              <section className="grid gap-3">
                <h3 className="text-sm font-bold">Source assignment</h3>
                <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
                  <SelectField label="Source organization" value="SSD_DEMO_SOURCE" options={organizationOptions.map((organization) => ({ value: organization.organization_code ?? organization.id, label: `${organization.organization_code ?? organization.id} - ${organization.name ?? ""}` }))} />
                  <SelectField label="Source officer" value="SSD_DEMO_OFFICER" options={officerOptions.map((officer) => ({ value: officer.officer_code ?? officer.id, label: `${officer.officer_code ?? officer.id} - ${officer.display_name ?? officer.name ?? ""}` }))} />
                  <SelectField label="Assignment role" value="DATA_PROVIDER" options={["DATA_PROVIDER", "REQUEST_OWNER", "OBSERVER"].map((value) => ({ value, label: value }))} />
                </div>
              </section>

              <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-3 max-lg:grid-cols-1">
                <label className="grid gap-1 text-xs font-semibold">
                  Request note
                  <Textarea defaultValue="Request generated from active template and selected dimension scope. Raw token will not be displayed." />
                </label>
                <div className="rounded-md bg-muted/40 p-3 text-xs">
                  <p className="font-bold">Readiness checklist</p>
                  {["Cycle active", "Indicator current version", "Template active", "Source officer mapped", "Scope members selected"].map((item) => (
                    <div key={item} className="mt-2 flex items-center gap-2">
                      <CheckCircle2 aria-hidden="true" className="size-4 text-green-700" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {modal === "request-detail" ? (
            <div className="grid gap-5">
              <section className="grid gap-3" aria-labelledby="request-collection-detail">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 id="request-collection-detail" className="text-sm font-bold">Collection detail</h3>
                  <Badge variant={statusVariant(selectedRequest.status)}>{selectedRequest.status}</Badge>
                </div>
                <dl className="grid grid-cols-4 gap-3 text-xs max-lg:grid-cols-2 max-sm:grid-cols-1">
                  {[
                    ["Request code", selectedRequest.request_code],
                    ["Cycle", selectedRequest.cycle_code],
                    ["Type / priority", `${selectedRequest.request_type} / ${selectedRequest.priority}`],
                    ["Due date", selectedRequest.due_date],
                    ["Source organization", selectedRequest.source_organization_name],
                    ["Officer", selectedRequest.officer_name],
                    ["Assigned unit", selectedRequest.assigned_unit_code],
                    ["Sent / submitted", `${selectedRequest.sent_at ?? "Not sent"} / ${selectedRequest.submitted_at ?? "Not submitted"}`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-muted/40 p-3">
                      <dt className="font-semibold text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-words font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="grid gap-3" aria-labelledby="request-item-scope">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 id="request-item-scope" className="text-sm font-bold">Item & scope</h3>
                    <p className="text-xs text-muted-foreground">Template-first view. Governed rows, columns, and dimensions stay behind the canvas.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenModal("scope-preview")}>Rows</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenModal("scope-json")}>JSON</Button>
                  </div>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-3 max-lg:grid-cols-1">
                  <TemplateCanvasPreview dense />
                  <div className="grid content-start gap-2 rounded-md bg-muted/40 p-3 text-xs">
                    <p className="font-bold">Resolved template</p>
                    <p className="break-words font-mono text-[11px]">{primaryTemplateInstance?.template_instance_code ?? "Not generated"}</p>
                    <p className="text-muted-foreground">{primaryTemplateInstance?.template_version_code ?? requestItemsForRequest[0]?.template_version_code ?? "No template item"}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="text-lg font-bold">{requestItemsForRequest.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Scope</p>
                        <p className="text-lg font-bold">{scopeForRequest.length}</p>
                      </div>
                    </div>
                    {requestItemsForRequest.map((item) => (
                      <div key={item.item_code} className="mt-2 rounded-md bg-background px-2 py-2">
                        <p className="font-semibold">{item.indicator_label}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{item.item_code}</p>
                        <Badge className="mt-2" variant={statusVariant(item.status)}>{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-3" aria-labelledby="request-assignments">
                <h3 id="request-assignments" className="text-sm font-bold">Assignments</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Officer</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestAssignmentsForRequest.length > 0 ? requestAssignmentsForRequest.map((assignment) => (
                      <TableRow key={assignment.assignment_code}>
                        <TableCell className="font-mono text-[11px]">{assignment.assignment_code}</TableCell>
                        <TableCell>{assignment.assignment_role}</TableCell>
                        <TableCell>{assignment.assigned_to_organization_code}</TableCell>
                        <TableCell>{assignment.officer_name}</TableCell>
                        <TableCell>{assignment.due_date}</TableCell>
                        <TableCell><Badge variant={statusVariant(assignment.status)}>{assignment.status}</Badge></TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">No assignment record is available for this request yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </section>

              <section className="grid gap-3" aria-labelledby="request-status-trail">
                <h3 id="request-status-trail" className="text-sm font-bold">Status trail</h3>
                <div className="grid gap-2">
                  {statusTrailForRequest.map((trail, index) => (
                    <div key={`${trail.stage}-${trail.code}`} className="grid grid-cols-[32px_140px_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-muted/40 p-3 text-xs max-lg:grid-cols-[32px_1fr]">
                      <div className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{index + 1}</div>
                      <div>
                        <p className="font-bold">{trail.stage}</p>
                        <Badge variant={statusVariant(trail.status)}>{trail.status}</Badge>
                      </div>
                      <div>
                        <p className="font-mono text-[11px]">{trail.code}</p>
                        <p className="text-muted-foreground">{trail.action}</p>
                      </div>
                      <span className="text-muted-foreground">{trail.timestamp}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {modal === "template-canvas" ? (
            <div className="grid gap-4">
              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                This preview shows how the selected indicator template appears to the department user. The saved contract still uses stable item, scope, dimension, and template codes.
              </div>
              <TemplateCanvasPreview />
            </div>
          ) : null}

          {modal === "scope-preview" ? (
            <div className="grid gap-4">
              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Row view is for audit and troubleshooting. Normal request users should work from the template canvas.
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Axis</TableHead>
                    <TableHead>Dimension</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopeForRequest.map((scope) => (
                    <TableRow key={`${scope.item_code}-${scope.axis_code}-${scope.member_code}`}>
                      <TableCell className="font-mono text-[11px]">{scope.item_code}</TableCell>
                      <TableCell className="font-mono text-[11px]">{scope.axis_code}</TableCell>
                      <TableCell>{scope.dimension_code}</TableCell>
                      <TableCell>{scope.member_label}</TableCell>
                      <TableCell><Badge variant="outline">{scope.scope_role}</Badge></TableCell>
                      <TableCell>{scope.is_required ? "YES" : "NO"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {modal === "scope-json" ? (
            <div className="grid gap-4">
              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                JSON preview is sanitized sample shape only. It does not expose internal IDs, raw tokens, token hashes, or metadata JSON from the API.
              </div>
              <pre className="max-h-[58vh] overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-50">
                {JSON.stringify({
                  request_code: selectedRequest.request_code,
                  items: requestItemsForRequest.map((item) => ({
                    item_code: item.item_code,
                    indicator_code: item.national_indicator_code,
                    template_version_code: item.template_version_code,
                    scope: scopeForRequest
                      .filter((scope) => scope.item_code === item.item_code)
                      .map((scope) => ({
                        axis_code: scope.axis_code,
                        axis_role: scope.axis_role,
                        dimension_code: scope.dimension_code,
                        member_code: scope.member_code,
                        scope_role: scope.scope_role,
                        required: scope.is_required,
                      })),
                  })),
                }, null, 2)}
              </pre>
            </div>
          ) : null}

          {modal === "follow-up" ? (
            <div className="grid gap-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                Follow-up delivery is a visual state only. Actual email, WhatsApp, reminder, and notification delivery needs a governed API/workflow.
              </div>
              <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
                <Field label="request_code" value={selectedRequest.request_code} readOnly />
                <Field label="officer" value={selectedRequest.officer_name} readOnly />
                <Field label="due_date" value={selectedRequest.due_date} />
              </div>
              <label className="grid gap-1 text-xs font-semibold">
                Message
                <Textarea defaultValue={`Reminder: Please complete ${selectedRequest.request_code} before ${selectedRequest.due_date}.`} />
              </label>
            </div>
          ) : null}

          {modal === "send-confirm" ? (
            <div className="grid gap-4">
              <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-950">
                This visual state represents moving READY requests to SENT. It must not expose raw request tokens. Token generation and secure delivery require governed APIs.
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Officer</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestAssignmentsForRequest.map((assignment) => (
                    <TableRow key={assignment.assignment_code}>
                      <TableCell className="font-mono text-[11px]">{assignment.assignment_code}</TableCell>
                      <TableCell>{assignment.officer_name}</TableCell>
                      <TableCell>{assignment.assignment_role}</TableCell>
                      <TableCell><Badge variant={statusVariant(assignment.status)}>{assignment.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border/70 bg-muted/40 px-5 py-4">
          <span className="text-xs text-muted-foreground">No request mutation or raw token action is executed from this sample UI.</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            {["create-request", "follow-up", "send-confirm"].includes(modal) ? (
              <Button type="button" onClick={onClose}>Save/Submit</Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CollectionRequestPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL");
  const [selectedCycleCode, setSelectedCycleCode] = useState(collectionCycles[0].cycle_code);
  const [selectedRequestCode, setSelectedRequestCode] = useState(collectionRequests[0].request_code);
  const [modal, setModal] = useState<RequestModal>(null);

  const selectedCycle = collectionCycles.find((cycle) => cycle.cycle_code === selectedCycleCode) ?? collectionCycles[0];
  const selectedRequest = collectionRequests.find((request) => request.request_code === selectedRequestCode) ?? collectionRequests[0];
  const filteredRequests = useMemo(() => {
    const normalized = query.toLowerCase();
    return collectionRequests.filter((request) => {
      const matchesCycle = request.cycle_code === selectedCycleCode;
      const matchesStatus = statusFilter === "ALL" || request.status === statusFilter;
      const matchesQuery = Object.values(request).join(" ").toLowerCase().includes(normalized);
      return matchesCycle && matchesStatus && matchesQuery;
    });
  }, [query, selectedCycleCode, statusFilter]);

  const statusCounts = collectionRequests.reduce<Record<string, number>>((accumulator, request) => {
    accumulator[request.status] = (accumulator[request.status] ?? 0) + 1;
    return accumulator;
  }, {});
  const dueSoonCount = collectionRequests.filter((request) => ["READY", "SENT", "OPEN", "IN_PROGRESS"].includes(request.status)).length;
  const assignmentStatusCounts = requestAssignments.reduce<Record<AssignmentStatus, number>>((accumulator, assignment) => {
    accumulator[assignment.status] = (accumulator[assignment.status] ?? 0) + 1;
    return accumulator;
  }, {} as Record<AssignmentStatus, number>);

  const statCards = [
    { label: "Active cycle", value: selectedCycle.reporting_year, helper: selectedCycle.status, detail: selectedCycle.cycle_code },
    { label: "Requests", value: filteredRequests.length, helper: `${statusCounts.SENT ?? 0} sent`, detail: `${statusCounts.READY ?? 0} ready / ${statusCounts.DRAFT ?? 0} draft` },
    { label: "Due / follow-up", value: dueSoonCount, helper: "pending action", detail: "Ready, sent, open, or in-progress" },
    { label: "Assignments", value: requestAssignments.length, helper: `${assignmentStatusCounts.ASSIGNED ?? 0} assigned`, detail: "Provider/owner/observer roles" },
  ];

  return (
    <AppShell persona="Unit Request Admin" activeDashboard="/dashboard/unit-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="requests-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="requests-title" className="text-2xl font-bold">Collection Request Creation</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create request drafts, assign indicator templates, scope dimensions, and prepare source officers for data collection.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModal("create-request")}><Plus aria-hidden="true" className="size-4" /> New request</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {statCards.map((card) => (
            <button key={card.label} type="button" className="min-h-[104px] rounded-md bg-card p-3 text-left shadow-sm ring-1 ring-border/60 hover:bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs font-semibold">{card.helper}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{card.detail}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <Card>
            <CardContent>
              <div className="grid grid-cols-[minmax(260px,360px)_minmax(0,1fr)_auto] items-center gap-4 max-xl:grid-cols-1">
                <label className="grid gap-1 text-xs font-semibold">
                  Collection cycle
                <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" value={selectedCycleCode} onChange={(event) => setSelectedCycleCode(event.target.value)}>
                  {collectionCycles.map((cycle) => (
                    <option key={cycle.cycle_code} value={cycle.cycle_code}>{cycle.name}</option>
                  ))}
                </select>
              </label>
                <div className="grid grid-cols-5 gap-2 text-xs max-lg:grid-cols-2">
                  <div>
                    <p className="font-semibold text-muted-foreground">Framework</p>
                    <p className="mt-1 font-mono font-bold">{selectedCycle.framework_code}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Edition</p>
                    <p className="mt-1 font-mono font-bold">{selectedCycle.edition_code}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Window</p>
                    <p className="mt-1 font-bold">{selectedCycle.start_date} to {selectedCycle.end_date}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Requests</p>
                    <p className="mt-1 font-bold">{selectedCycle.request_count} total / {selectedCycle.submitted_count} submitted</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Lifecycle</p>
                    <p className="mt-1 font-bold">Draft to Closed</p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge variant={statusVariant(selectedCycle.status)}>{selectedCycle.status}</Badge>
                  <Badge variant="outline">{selectedCycle.cycle_type}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-bold">Request records</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Click any request to view collection detail, item scope, assignments, and status trail together.</p>
                </div>
                <Badge variant="outline">{filteredRequests.length} records</Badge>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
                  <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="sr-only">Search requests</span>
                  <Input className="border-0 bg-transparent" placeholder="Search request, officer, organization" value={query} onChange={(event) => setQuery(event.target.value)} />
                </label>
                <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RequestStatus | "ALL")}>
                  <option value="ALL">status: all</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="SENT">SENT</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Source organization</TableHead>
                    <TableHead>Officer</TableHead>
                    <TableHead>Items / assignments</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow
                      key={request.request_code}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedRequestCode(request.request_code);
                        setModal("request-detail");
                      }}
                    >
                      <TableCell className="max-w-72 whitespace-normal">
                        <span className="block font-mono text-[11px]">{request.request_code}</span>
                        <span className="text-xs">{request.request_type} / {request.priority}</span>
                      </TableCell>
                      <TableCell>
                        <span className="block text-xs font-semibold">{request.source_organization_name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{request.source_organization_code}</span>
                      </TableCell>
                      <TableCell>{request.officer_name}</TableCell>
                      <TableCell>{request.item_count} / {request.assignment_count}</TableCell>
                      <TableCell>{request.due_date}</TableCell>
                      <TableCell><Badge variant={statusVariant(request.status)}>{request.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
                          <Button size="icon-xs" variant="outline" aria-label="View request" onClick={() => { setSelectedRequestCode(request.request_code); setModal("request-detail"); }}><Eye aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Send request" onClick={() => { setSelectedRequestCode(request.request_code); setModal("send-confirm"); }}><Send aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Follow up" onClick={() => { setSelectedRequestCode(request.request_code); setModal("follow-up"); }}><BellRing aria-hidden="true" className="size-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rows 1-{filteredRequests.length} of {filteredRequests.length}. Click a row to open the full request detail modal.</span>
                <div className="flex gap-2">
                  <Button size="xs" variant="outline">Previous</Button>
                  <Button size="xs" variant="outline">Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <RequestModalView modal={modal} selectedRequest={selectedRequest} selectedCycleCode={selectedCycleCode} onOpenModal={setModal} onClose={() => setModal(null)} />
    </AppShell>
  );
}
