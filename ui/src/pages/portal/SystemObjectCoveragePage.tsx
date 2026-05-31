import {
  Boxes,
  Database,
  Eye,
  ShieldAlert,
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

const objectCoverage = [
  {
    module: "Auth",
    objects: "users, roles, permissions, sessions, audits",
    route: "/login, /profile, /password-management",
    status: "COVERED",
    boundary: "Password and JWT logic remain API-owned.",
  },
  {
    module: "Masters",
    objects: "locales, organizations, officers, measures, periodicities",
    route: "/masters/reference",
    status: "COVERED",
    boundary: "CRUD is visual until mutations are governed.",
  },
  {
    module: "Dimensions",
    objects: "dimensions, hierarchy levels, members, relationships, aliases",
    route: "/dimensions",
    status: "COVERED",
    boundary: "Bulk upload and hierarchy editing are UI states.",
  },
  {
    module: "Templates",
    objects: "templates, versions, axes, cells, render elements, validation refs",
    route: "/templates",
    status: "COVERED",
    boundary: "Designer saves are visual until mutation APIs exist.",
  },
  {
    module: "Requests",
    objects: "cycles, requests, items, scope members, instances, assignments",
    route: "/requests",
    status: "COVERED",
    boundary: "Send/resend/status actions are visual.",
  },
  {
    module: "Ingestion",
    objects: "submissions, versions, manifests, jobs, runs, staged records",
    route: "/ingestion, /data-entry",
    status: "COVERED",
    boundary: "Raw payloads and source hashes are hidden.",
  },
  {
    module: "Validation",
    objects: "rules, bindings, runs, results, comparison context",
    route: "/validation, /validation/rules",
    status: "COVERED",
    boundary: "Execution trigger remains future/governed.",
  },
  {
    module: "Review",
    objects: "tasks, statuses, action types, actions, approvals",
    route: "/review",
    status: "COVERED",
    boundary: "Approve/reject/send-back are visual until mutations are approved.",
  },
  {
    module: "Dashboard",
    objects: "summary views, unit views, indicators, queue, pipeline",
    route: "/dashboard/super-admin, /dashboard/unit-admin, /dashboard/snapshot",
    status: "COVERED",
    boundary: "Dashboard schema remains read-only.",
  },
  {
    module: "Invitation access",
    objects: "invitations, outbox, token hash metadata, audit events",
    route: "/invitation-access, /invitation-setup",
    status: "COVERED",
    boundary: "Raw one-time token is represented only as a placeholder.",
  },
];

const statusVariant = (status: string) => {
  if (status === "COVERED") return "secondary";
  if (status === "PARTIAL") return "outline";
  return "destructive";
};

export function SystemObjectCoveragePage() {
  const stats = [
    { label: "Modules", value: objectCoverage.length, note: "DB/API contract groups", icon: Boxes },
    { label: "Covered routes", value: objectCoverage.filter((item) => item.status === "COVERED").length, note: "UI sample surfaces", icon: Eye },
    { label: "Mutation boundary", value: "Visual", note: "Until governed APIs exist", icon: ShieldAlert },
    { label: "Sensitive fields", value: "Hidden", note: "Tokens/hashes/raw payloads", icon: Database },
  ];

  return (
    <AppShell persona={currentUserProfile.primary_role} activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="object-coverage-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="object-coverage-title" className="text-2xl font-bold">DB/API Object Coverage</h1>
            <p className="mt-1 text-sm text-muted-foreground">One place to verify which governed database/API objects have matching UI surfaces and where mutation boundaries remain visual.</p>
          </div>
          <Badge variant="outline">UI contract alignment</Badge>
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
                <h2 className="text-base font-bold">Coverage matrix</h2>
                <p className="mt-1 text-xs text-muted-foreground">This prevents the UI from drifting away from approved module contracts.</p>
              </div>
              <Button type="button" variant="outline"><Eye aria-hidden="true" className="size-4" /> Review coverage</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>DB/API objects represented</TableHead>
                  <TableHead>UI route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Boundary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {objectCoverage.map((item) => (
                  <TableRow key={item.module}>
                    <TableCell className="font-semibold">{item.module}</TableCell>
                    <TableCell className="max-w-80 whitespace-normal text-xs">{item.objects}</TableCell>
                    <TableCell className="max-w-72 whitespace-normal font-mono text-[11px]">{item.route}</TableCell>
                    <TableCell><Badge variant={statusVariant(item.status)}>{item.status}</Badge></TableCell>
                    <TableCell className="max-w-80 whitespace-normal text-xs text-muted-foreground">{item.boundary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
