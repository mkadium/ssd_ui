import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  KeyRound,
  LockKeyhole,
  Send,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dataEntryGridRows } from "@/data/dataEntry.sample";
import { invitationRecords } from "@/data/invitationAccess.sample";

const invitation = invitationRecords[0];

export function TemporaryContributorSetupPage() {
  const steps = [
    { label: "Open one-time setup URL", status: "DONE" },
    { label: "Verify request scope", status: "DONE" },
    { label: "Create contributor password", status: "CURRENT" },
    { label: "Open assigned template", status: "PENDING" },
    { label: "Submit governed data", status: "PENDING" },
  ];

  return (
    <main className="min-h-screen bg-background p-4 text-foreground lg:p-5" id="temporary-contributor-content">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="temporary-contributor-title">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-card p-4 shadow-sm ring-1 ring-border/60">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Temporary contributor access</p>
            <h1 id="temporary-contributor-title" className="mt-1 text-2xl font-bold">Invitation Setup</h1>
            <p className="mt-1 text-sm text-muted-foreground">Request-linked setup for a temporary data provider. No raw setup token is displayed or stored.</p>
          </div>
          <div className="grid size-14 place-items-center rounded-md bg-sidebar text-center text-[10px] font-bold leading-tight text-sidebar-foreground">
            Logo
            <span>path:</span>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.label} className="flex items-center gap-2 text-xs">
                <span className="grid size-6 place-items-center rounded-full bg-muted font-bold">{index + 1}</span>
                <span className="font-semibold">{step.label}</span>
                <Badge variant={step.status === "DONE" ? "secondary" : step.status === "CURRENT" ? "outline" : "ghost"}>{step.status}</Badge>
                {index < steps.length - 1 ? <span className="text-muted-foreground">&gt;</span> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-[360px_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
          <Card>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <UserPlus aria-hidden="true" className="size-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold">Invitation scope</h2>
                  <p className="text-xs text-muted-foreground">Request-scoped boundary enforced by API later.</p>
                </div>
              </div>
              <dl className="grid gap-3 text-xs">
                {[
                  ["Invitation", invitation.invitation_code],
                  ["Request", invitation.request_code],
                  ["Item", invitation.item_code],
                  ["Assignment", invitation.assignment_code],
                  ["Organization", invitation.source_organization_name],
                  ["Officer", invitation.officer_name],
                  ["Expires", invitation.expires_at],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-muted/40 p-3">
                    <dt className="font-semibold text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-950">
                Raw setup URL is available only immediately after generation. This screen shows a placeholder route only.
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <LockKeyhole aria-hidden="true" className="size-5 text-primary" />
                  <div>
                    <h2 className="text-base font-bold">Account setup</h2>
                    <p className="text-xs text-muted-foreground">Password setup is visual until governed invitation setup API exists.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                  <label className="grid gap-1 text-xs font-semibold">
                    Display name
                    <Input defaultValue={invitation.officer_name} />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold">
                    Email
                    <Input defaultValue={invitation.contact_email} />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold">
                    New password
                    <Input type="password" defaultValue="************" />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold">
                    Confirm password
                    <Input type="password" defaultValue="************" />
                  </label>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 p-3">
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 text-green-700" />
                    <p>Password rules and token hash verification must be enforced server-side. UI never stores raw setup token.</p>
                  </div>
                  <Button type="button"><KeyRound aria-hidden="true" className="size-4" /> Setup account</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h2 className="text-base font-bold">Assigned template preview</h2>
                    <p className="text-xs text-muted-foreground">Temporary contributor sees only the assigned request item.</p>
                  </div>
                  <Badge variant="outline">Scoped access</Badge>
                </div>
                <div className="overflow-x-auto rounded-md border border-border/70 bg-background">
                  <table className="min-w-[760px] border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="bg-primary/5 font-bold text-primary">
                        <th className="border-b border-r border-border/60 px-3 py-2" colSpan={8}>NIF 1.2.1 - Population below poverty line</th>
                      </tr>
                      <tr className="bg-muted/50 font-bold">
                        {["Location", "2011 Total", "2011 Rural", "2011 Urban", "2012 Total", "2012 Rural", "2012 Urban", "Status"].map((column) => (
                          <th key={column} className="border-b border-r border-border/60 px-3 py-2 last:border-r-0">{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataEntryGridRows.slice(0, 3).map((row) => (
                        <tr key={row.geography_code}>
                          <td className="border-b border-r border-border/40 px-3 py-2 font-semibold">{row.geography_label}</td>
                          <td className="border-b border-r border-border/40 px-3 py-2">{row.values.total_2011 || "-"}</td>
                          <td className="border-b border-r border-border/40 px-3 py-2">{row.values.rural_2011 || "-"}</td>
                          <td className="border-b border-r border-border/40 px-3 py-2">{row.values.urban_2011 || "-"}</td>
                          <td className="border-b border-r border-border/40 px-3 py-2">{row.values.total_2012 || "-"}</td>
                          <td className="border-b border-r border-border/40 px-3 py-2">{row.values.rural_2012 || "-"}</td>
                          <td className="border-b border-r border-border/40 px-3 py-2">{row.values.urban_2012 || "-"}</td>
                          <td className="border-b border-border/40 px-3 py-2"><Badge variant="outline">{row.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <label className="grid gap-1 text-xs font-semibold">
                  Submission note
                  <Textarea defaultValue="Temporary contributor note for assigned request item." />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle aria-hidden="true" className="size-4 text-amber-700" />
                    Only assigned fields are editable after server-side invitation scope check.
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline"><FileSpreadsheet aria-hidden="true" className="size-4" /> Save draft</Button>
                    <Button type="button"><Send aria-hidden="true" className="size-4" /> Submit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
