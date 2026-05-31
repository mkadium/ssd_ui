import {
  CheckCircle2,
  Eye,
  Keyboard,
  Languages,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currentUserProfile } from "@/data/userExperience.sample";

const complianceChecks = [
  {
    area: "Keyboard navigation",
    status: "STARTED",
    evidence: "Skip link, button controls, visible focus styles, route-level landmarks.",
    next: "Add manual tab-order evidence for each workflow before Go-Live.",
  },
  {
    area: "Bilingual behavior",
    status: "IMPLEMENTED",
    evidence: "Language provider stores preference, updates document language, and translates shell/common labels.",
    next: "Expand page-body glossary once final Hindi copy is approved.",
  },
  {
    area: "Responsive layout",
    status: "IMPLEMENTED",
    evidence: "Dashboard, masters, request, validation, review, and monitor pages use responsive grids/tables.",
    next: "Capture screenshots at 1366x768, tablet, and mobile breakpoints.",
  },
  {
    area: "Color and status meaning",
    status: "STARTED",
    evidence: "Status chips use text labels plus color; no color-only labels in critical tables.",
    next: "Run contrast check for final theme tokens.",
  },
  {
    area: "Sensitive data masking",
    status: "IMPLEMENTED",
    evidence: "Screens avoid raw tokens, token hashes, source hashes, internal IDs, and full sensitive payloads.",
    next: "Verify with API integration responses before UAT.",
  },
  {
    area: "Modal accessibility",
    status: "STARTED",
    evidence: "Modals use role=dialog and aria-modal with headings.",
    next: "Add focus trap when final component package is governed.",
  },
];

const baselineItems = [
  "Use semantic headings and table headers.",
  "Provide skip-to-content navigation.",
  "Retain language preference where applicable.",
  "Show fallback English labels if translation is unavailable.",
  "Avoid raw secrets, tokens, hashes, and internal database IDs.",
  "Keep left navigation fixed and scrollable.",
  "Support 1366x768 baseline plus responsive tablet/mobile layouts.",
  "Use text labels with status colors for accessible meaning.",
];

const statusVariant = (status: string) => {
  if (status === "IMPLEMENTED") return "secondary";
  if (status === "STARTED") return "outline";
  return "destructive";
};

export function AccessibilityCompliancePage() {
  const stats = [
    { label: "Baseline checks", value: complianceChecks.length, note: "Tracked UI controls", icon: ShieldCheck },
    { label: "Implemented", value: complianceChecks.filter((item) => item.status === "IMPLEMENTED").length, note: "Ready for evidence", icon: CheckCircle2 },
    { label: "Responsive", value: "1366+", note: "Desktop-first, responsive", icon: MonitorSmartphone },
    { label: "Bilingual", value: "EN/HN", note: "Shell and common labels", icon: Languages },
  ];

  return (
    <AppShell persona={currentUserProfile.primary_role} activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="accessibility-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="accessibility-title" className="text-2xl font-bold">Accessibility & GIGW Baseline</h1>
            <p className="mt-1 text-sm text-muted-foreground">Evidence screen for bilingual, accessible, secure, and compliance-aligned UI behavior.</p>
          </div>
          <Badge variant="outline">Design baseline evidence</Badge>
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

        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
          <Card>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-bold">Compliance checks</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Tracks what is implemented now and what still needs formal evidence before Go-Live.</p>
                </div>
                <Button type="button" variant="outline"><Eye aria-hidden="true" className="size-4" /> Evidence view</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Next evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceChecks.map((check) => (
                    <TableRow key={check.area}>
                      <TableCell className="font-semibold">{check.area}</TableCell>
                      <TableCell><Badge variant={statusVariant(check.status)}>{check.status}</Badge></TableCell>
                      <TableCell className="max-w-96 whitespace-normal text-xs">{check.evidence}</TableCell>
                      <TableCell className="max-w-80 whitespace-normal text-xs text-muted-foreground">{check.next}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Keyboard aria-hidden="true" className="size-5 text-primary" />
                  <h2 className="text-base font-bold">Baseline rules</h2>
                </div>
                <ul className="grid gap-2 text-xs text-muted-foreground">
                  {baselineItems.map((item) => (
                    <li key={item} className="flex gap-2 rounded-md bg-muted/40 p-2">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-green-700" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-3">
                <h2 className="text-base font-bold">Compliance boundary</h2>
                <p className="text-sm text-muted-foreground">
                  This screen does not certify STQC, GIGW, VAPT, or production compliance by itself. It gives the UI team a governed checklist and evidence trail to complete during testing.
                </p>
                <Badge variant="outline">Formal audit still required</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
