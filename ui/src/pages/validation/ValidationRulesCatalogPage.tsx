import {
  Eye,
  Link2,
  ListChecks,
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
  validationBindings,
  validationRules,
  type ValidationRuleSample,
  type ValidationRuleStatus,
} from "@/data/validationRules.sample";

type RuleFilter = ValidationRuleStatus | "ALL";

const statusVariant = (status: string) => {
  if (status === "ACTIVE") return "secondary";
  if (status === "DRAFT") return "outline";
  return "destructive";
};

const severityVariant = (severity: string) => {
  if (severity === "INFO") return "secondary";
  if (severity === "WARNING") return "outline";
  return "destructive";
};

function RuleDetailModal({
  rule,
  onClose,
}: {
  rule: ValidationRuleSample;
  onClose: () => void;
}) {
  const bindings = validationBindings.filter((binding) => binding.rule_code === rule.rule_code);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="rule-detail-title">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Validation rule catalog</p>
            <h2 id="rule-detail-title" className="text-xl font-bold">{rule.rule_code}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{rule.name}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-5">
          <section className="grid grid-cols-4 gap-3 text-xs max-lg:grid-cols-2 max-sm:grid-cols-1">
            {[
              ["Rule type", rule.rule_type],
              ["Severity", rule.severity],
              ["Status", rule.status],
              ["Expression boundary", rule.safe_expression_label],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted/40 p-3">
                <dt className="font-semibold text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words font-semibold">{value}</dd>
              </div>
            ))}
          </section>

          <Card>
            <CardContent className="grid gap-3">
              <h3 className="text-base font-bold">Message template</h3>
              <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">{rule.message_template}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold">Template bindings</h3>
                  <p className="text-xs text-muted-foreground">Bindings resolve to template versions, measures, and cell scopes from the approved contract.</p>
                </div>
                <Badge variant="outline">{bindings.length} bindings</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Binding</TableHead>
                    <TableHead>Template version</TableHead>
                    <TableHead>Measure</TableHead>
                    <TableHead>Cell scope</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bindings.map((binding) => (
                    <TableRow key={binding.binding_code}>
                      <TableCell className="font-mono text-[11px]">{binding.binding_code}</TableCell>
                      <TableCell className="font-mono text-[11px]">{binding.template_version_code}</TableCell>
                      <TableCell>{binding.measure_code}</TableCell>
                      <TableCell>{binding.cell_scope}</TableCell>
                      <TableCell><Badge variant={statusVariant(binding.status)}>{binding.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ValidationRulesCatalogPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RuleFilter>("ALL");
  const [selectedRuleCode, setSelectedRuleCode] = useState<string | null>(null);

  const filteredRules = useMemo(() => {
    const normalized = query.toLowerCase();
    return validationRules.filter((rule) => {
      const matchesStatus = statusFilter === "ALL" || rule.status === statusFilter;
      const matchesQuery = Object.values(rule).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const selectedRule = validationRules.find((rule) => rule.rule_code === selectedRuleCode) ?? null;
  const stats = [
    { label: "Rules", value: validationRules.length, note: "Catalog entries", icon: ListChecks },
    { label: "Active", value: validationRules.filter((rule) => rule.status === "ACTIVE").length, note: "Applied to templates", icon: ShieldCheck },
    { label: "Bindings", value: validationBindings.length, note: "Template rule refs", icon: Link2 },
    { label: "Blocker/error", value: validationRules.filter((rule) => ["ERROR", "BLOCKER"].includes(rule.severity)).length, note: "Hard validation checks", icon: ShieldCheck },
  ];

  return (
    <AppShell persona="Validation Officer" activeDashboard="/dashboard/unit-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="validation-rules-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="validation-rules-title" className="text-2xl font-bold">Validation Rules Catalog</h1>
            <p className="mt-1 text-sm text-muted-foreground">Inspect governed validation rules, messages, and template bindings before they run against staged records.</p>
          </div>
          <Badge variant="outline">Read-only foundation</Badge>
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
                <h2 className="text-base font-bold">Rule records</h2>
                <p className="mt-1 text-xs text-muted-foreground">Open a rule to see message and template binding detail.</p>
              </div>
              <Badge variant="outline">{filteredRules.length} visible</Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search validation rules</span>
                <Input
                  className="border-0 bg-transparent"
                  placeholder="Search rule, type, severity, message"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <select
                className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as RuleFilter)}
              >
                <option value="ALL">status: all</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="RETIRED">RETIRED</option>
              </select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Bindings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => {
                  const bindingCount = validationBindings.filter((binding) => binding.rule_code === rule.rule_code).length;

                  return (
                    <TableRow
                      key={rule.rule_code}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRuleCode(rule.rule_code)}
                    >
                      <TableCell>
                        <span className="block font-semibold">{rule.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{rule.rule_code}</span>
                      </TableCell>
                      <TableCell>{rule.rule_type}</TableCell>
                      <TableCell><Badge variant={severityVariant(rule.severity)}>{rule.severity}</Badge></TableCell>
                      <TableCell className="max-w-96 whitespace-normal text-xs">{rule.message_template}</TableCell>
                      <TableCell>{bindingCount}</TableCell>
                      <TableCell><Badge variant={statusVariant(rule.status)}>{rule.status}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setSelectedRuleCode(rule.rule_code); }}>
                          <Eye aria-hidden="true" className="size-4" /> Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {selectedRule ? <RuleDetailModal rule={selectedRule} onClose={() => setSelectedRuleCode(null)} /> : null}
    </AppShell>
  );
}
