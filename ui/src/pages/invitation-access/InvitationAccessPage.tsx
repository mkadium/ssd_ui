import {
  Copy,
  Eye,
  RotateCcw,
  Search,
  ShieldAlert,
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
  invitationEvents,
  invitationRecords,
  notificationOutbox,
  type DeliveryStatus,
  type InvitationRecordSample,
  type InvitationStatus,
} from "@/data/invitationAccess.sample";

type InvitationAction = "resend" | "revoke" | "copy-link" | null;

const invitationStatusVariant = (status: InvitationStatus) => {
  if (["SENT", "OPENED", "SETUP_COMPLETED"].includes(status)) return "secondary";
  if (["CREATED"].includes(status)) return "outline";
  return "destructive";
};

const deliveryStatusVariant = (status: DeliveryStatus) => {
  if (["SENT", "DELIVERED"].includes(status)) return "secondary";
  if (["PENDING_MANUAL_SEND", "QUEUED"].includes(status)) return "outline";
  return "destructive";
};

function ActionStateModal({
  action,
  invitation,
  onClose,
}: {
  action: Exclude<InvitationAction, null>;
  invitation: InvitationRecordSample;
  onClose: () => void;
}) {
  const config: Record<Exclude<InvitationAction, null>, { title: string; message: string; icon: typeof RotateCcw }> = {
    resend: {
      title: "Resend invitation",
      message: "Resend is a visual state only. A governed API should supersede any previous setup token hash and create new outbox/audit events.",
      icon: RotateCcw,
    },
    revoke: {
      title: "Revoke invitation",
      message: "Revoke is a visual state only. A governed API must mark invitation access as revoked and write an audit event.",
      icon: ShieldAlert,
    },
    "copy-link": {
      title: "Copy one-time link",
      message: "Raw setup links are available only immediately after generation. This sample UI never stores or displays a real token.",
      icon: Copy,
    },
  };
  const Icon = config[action].icon;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="invitation-action-title">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Invitation action</p>
            <h2 id="invitation-action-title" className="text-xl font-bold">{config[action].title}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5">
          <div className="flex gap-3 rounded-md bg-muted/40 p-4 text-sm">
            <Icon aria-hidden="true" className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-bold">{invitation.invitation_code}</p>
              <p className="mt-1 text-muted-foreground">{config[action].message}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs max-sm:grid-cols-1">
            {[
              ["Request", invitation.request_code],
              ["Assignment", invitation.assignment_code],
              ["Officer", invitation.officer_name],
              ["Expires", invitation.expires_at],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted/40 p-3">
                <p className="font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 break-words font-semibold">{value}</p>
              </div>
            ))}
          </div>
          {action === "copy-link" ? (
            <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-950">
              Placeholder only: `https://ssd.example.gov.in/setup/&lt;one-time-token-shown-once&gt;`
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-4">
          <span className="text-xs text-muted-foreground">No token, token hash, email, or revoke mutation is executed.</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={onClose}>Save/Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvitationDetailModal({
  invitation,
  onAction,
  onClose,
}: {
  invitation: InvitationRecordSample;
  onAction: (action: Exclude<InvitationAction, null>) => void;
  onClose: () => void;
}) {
  const events = invitationEvents.filter((event) => event.invitation_code === invitation.invitation_code);
  const outbox = notificationOutbox.filter((item) => item.invitation_code === invitation.invitation_code);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="invitation-detail-title">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Invitation access detail</p>
            <h2 id="invitation-detail-title" className="text-xl font-bold">{invitation.invitation_code}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-5">
          <section className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold">Request-linked access</h3>
              <div className="flex gap-2">
                <Badge variant={invitationStatusVariant(invitation.invitation_status)}>{invitation.invitation_status}</Badge>
                <Badge variant={deliveryStatusVariant(invitation.delivery_status)}>{invitation.delivery_status}</Badge>
              </div>
            </div>
            <dl className="grid grid-cols-4 gap-3 text-xs max-lg:grid-cols-2 max-sm:grid-cols-1">
              {[
                ["Request", invitation.request_code],
                ["Item", invitation.item_code],
                ["Assignment", invitation.assignment_code],
                ["Access scope", invitation.access_scope_label],
                ["Organization", invitation.source_organization_name],
                ["Officer", invitation.officer_name],
                ["Email", invitation.contact_email],
                ["Channel", invitation.delivery_channel],
                ["Created", invitation.created_at],
                ["Sent", invitation.sent_at ?? "Not sent"],
                ["Expires", invitation.expires_at],
                ["First opened", invitation.first_opened_at ?? "Not opened"],
                ["Setup completed", invitation.setup_completed_at ?? "Not completed"],
                ["Revoked", invitation.revoked_at ?? "No"],
                ["One-time link", invitation.one_time_link_available ? "Available in current generation session" : "Not available"],
                ["Token storage", "Hash-only; raw token hidden"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-muted/40 p-3">
                  <dt className="font-semibold text-muted-foreground">{label}</dt>
                  <dd className="mt-1 break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold">Controlled actions</h3>
              <p className="text-xs text-muted-foreground">Actions are visual states until governed APIs exist.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => onAction("resend")}><RotateCcw aria-hidden="true" className="size-4" /> Resend</Button>
              <Button type="button" variant="destructive" onClick={() => onAction("revoke")}><ShieldAlert aria-hidden="true" className="size-4" /> Revoke</Button>
              <Button type="button" disabled={!invitation.one_time_link_available} onClick={() => onAction("copy-link")}><Copy aria-hidden="true" className="size-4" /> Copy one-time link</Button>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
            <Card>
              <CardContent className="grid gap-3">
                <h3 className="text-base font-bold">Audit events</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.event_code}>
                        <TableCell>
                          <span className="block font-semibold">{event.event_type}</span>
                          <span className="text-[11px] text-muted-foreground">{event.message}</span>
                        </TableCell>
                        <TableCell><Badge variant={event.event_status === "INFO" ? "secondary" : "outline"}>{event.event_status}</Badge></TableCell>
                        <TableCell>{event.actor}</TableCell>
                        <TableCell>{event.occurred_at}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-3">
                <h3 className="text-base font-bold">Notification outbox</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outbox</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outbox.map((item) => (
                      <TableRow key={item.outbox_code}>
                        <TableCell>
                          <span className="block font-mono text-[11px]">{item.outbox_code}</span>
                          <span className="text-[11px] text-muted-foreground">{item.recipient}</span>
                        </TableCell>
                        <TableCell>{item.channel}</TableCell>
                        <TableCell><Badge variant={deliveryStatusVariant(item.delivery_status)}>{item.delivery_status}</Badge></TableCell>
                        <TableCell>{item.attempt_count}</TableCell>
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

export function InvitationAccessPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | "ALL">("ALL");
  const [selectedInvitationCode, setSelectedInvitationCode] = useState<string | null>(null);
  const [action, setAction] = useState<InvitationAction>(null);

  const filteredInvitations = useMemo(() => {
    const normalized = query.toLowerCase();
    return invitationRecords.filter((invitation) => {
      const matchesStatus = statusFilter === "ALL" || invitation.invitation_status === statusFilter;
      const matchesQuery = Object.values(invitation).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const selectedInvitation = invitationRecords.find((invitation) => invitation.invitation_code === selectedInvitationCode) ?? null;

  const stats = [
    { label: "Invitations", value: filteredInvitations.length, note: "Visible request-linked records" },
    { label: "Sent/opened", value: invitationRecords.filter((invitation) => ["SENT", "OPENED", "SETUP_COMPLETED"].includes(invitation.invitation_status)).length, note: "Contributor has access path" },
    { label: "Manual send", value: invitationRecords.filter((invitation) => invitation.delivery_status === "PENDING_MANUAL_SEND").length, note: "Needs admin delivery" },
    { label: "Revoked/expired", value: invitationRecords.filter((invitation) => ["REVOKED", "EXPIRED"].includes(invitation.invitation_status)).length, note: "No active access" },
  ];

  return (
    <AppShell persona="Request Access Admin" activeDashboard="/dashboard/unit-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="invitation-access-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="invitation-access-title" className="text-2xl font-bold">Invitation Access Monitor</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track request-linked temporary contributor invitations generated from request send/resend flow.</p>
          </div>
          <Badge variant="outline">No manual random invites</Badge>
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
                <h2 className="text-base font-bold">Request-linked invitations</h2>
                <p className="mt-1 text-xs text-muted-foreground">Open a row to inspect access scope, outbox status, and audit trail.</p>
              </div>
              <Badge variant="outline">{filteredInvitations.length} records</Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search invitations</span>
                <Input
                  className="border-0 bg-transparent"
                  placeholder="Search request, assignment, officer, email"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <select
                className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as InvitationStatus | "ALL")}
              >
                <option value="ALL">status: all</option>
                <option value="CREATED">CREATED</option>
                <option value="SENT">SENT</option>
                <option value="OPENED">OPENED</option>
                <option value="SETUP_COMPLETED">SETUP_COMPLETED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="REVOKED">REVOKED</option>
                <option value="SUPERSEDED">SUPERSEDED</option>
              </select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invitation / request</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Officer / contact</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => (
                  <TableRow
                    key={invitation.invitation_code}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedInvitationCode(invitation.invitation_code)}
                  >
                    <TableCell>
                      <span className="block font-mono text-[11px]">{invitation.invitation_code}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{invitation.request_code}</span>
                    </TableCell>
                    <TableCell>
                      <span className="block font-mono text-[11px]">{invitation.assignment_code}</span>
                      <span className="text-[11px] text-muted-foreground">{invitation.item_code}</span>
                    </TableCell>
                    <TableCell className="max-w-64 whitespace-normal">
                      <span className="block font-semibold">{invitation.officer_name}</span>
                      <span className="text-[11px] text-muted-foreground">{invitation.contact_email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="block text-xs font-semibold">{invitation.delivery_channel}</span>
                      <Badge variant={deliveryStatusVariant(invitation.delivery_status)}>{invitation.delivery_status}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="block">{invitation.expires_at}</span>
                      <span className="text-[11px] text-muted-foreground">{invitation.first_opened_at ? `Opened ${invitation.first_opened_at}` : "Not opened"}</span>
                    </TableCell>
                    <TableCell><Badge variant={invitationStatusVariant(invitation.invitation_status)}>{invitation.invitation_status}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setSelectedInvitationCode(invitation.invitation_code); }}>
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

      {selectedInvitation ? (
        <InvitationDetailModal
          invitation={selectedInvitation}
          onAction={setAction}
          onClose={() => setSelectedInvitationCode(null)}
        />
      ) : null}
      {selectedInvitation && action ? (
        <ActionStateModal action={action} invitation={selectedInvitation} onClose={() => setAction(null)} />
      ) : null}
    </AppShell>
  );
}
