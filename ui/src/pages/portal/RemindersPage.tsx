import {
  CalendarClock,
  CheckCircle2,
  Eye,
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
import {
  currentUserProfile,
  reminders,
  type ReminderPriority,
  type ReminderSample,
  type ReminderStatus,
} from "@/data/userExperience.sample";

type ReminderFilter = ReminderStatus | "ALL";

const reminderStatusVariant = (status: ReminderStatus) => {
  if (status === "DONE") return "secondary";
  if (status === "SCHEDULED" || status === "DUE_SOON") return "outline";
  return "destructive";
};

const priorityVariant = (priority: ReminderPriority) => {
  if (priority === "HIGH") return "destructive";
  if (priority === "NORMAL") return "outline";
  return "secondary";
};

function ReminderDetailModal({ reminder, onClose }: { reminder: ReminderSample; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reminder-detail-title">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Reminder detail</p>
            <h2 id="reminder-detail-title" className="text-xl font-bold">{reminder.title}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={reminderStatusVariant(reminder.status)}>{reminder.status}</Badge>
            <Badge variant={priorityVariant(reminder.priority)}>{reminder.priority}</Badge>
            <Badge variant="outline">{reminder.module}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs max-lg:grid-cols-2 max-sm:grid-cols-1">
            {[
              ["Reminder", reminder.reminder_code],
              ["Related record", reminder.related_record_code],
              ["Owner", reminder.owner],
              ["Due at", reminder.due_at],
              ["Module", reminder.module],
              ["Action", reminder.action_label],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted/40 p-3">
                <p className="font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 break-words font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
            <div className="rounded-md bg-muted/40 p-4">
              <p className="text-sm font-bold">Message</p>
              <p className="mt-2 text-sm text-muted-foreground">{reminder.message}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-4">
              <p className="text-sm font-bold">Record-specific context</p>
              <p className="mt-2 text-sm text-muted-foreground">{reminder.detail_summary}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-4">
          <span className="text-xs text-muted-foreground">Follow-up/send actions are visual until governed notification APIs exist.</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="button" onClick={onClose}><Send aria-hidden="true" className="size-4" /> Follow up</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RemindersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReminderFilter>("ALL");
  const [selectedReminderCode, setSelectedReminderCode] = useState<string | null>(null);

  const filteredReminders = useMemo(() => {
    const normalized = query.toLowerCase();
    return reminders.filter((reminder) => {
      const matchesStatus = statusFilter === "ALL" || reminder.status === statusFilter;
      const matchesQuery = Object.values(reminder).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const selectedReminder = reminders.find((reminder) => reminder.reminder_code === selectedReminderCode) ?? null;
  const cards = [
    { label: "All reminders", value: reminders.length, note: "Visible sample records" },
    { label: "Due soon", value: reminders.filter((reminder) => reminder.status === "DUE_SOON").length, note: "Needs attention" },
    { label: "Overdue", value: reminders.filter((reminder) => reminder.status === "OVERDUE").length, note: "Follow-up first" },
    { label: "Scheduled", value: reminders.filter((reminder) => reminder.status === "SCHEDULED").length, note: "Upcoming" },
  ];

  return (
    <AppShell persona={currentUserProfile.primary_role} activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="reminders-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="reminders-title" className="text-2xl font-bold">Reminders</h1>
            <p className="mt-1 text-sm text-muted-foreground">View due-date reminders and record-specific follow-up context across SSD workflows.</p>
          </div>
          <Badge variant="outline">Visual follow-up only</Badge>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {cards.map((card) => (
            <div key={card.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                <CalendarClock aria-hidden="true" className="size-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold">Reminder list</h2>
                <p className="mt-1 text-xs text-muted-foreground">Click a record to view its request, validation, review, or template-specific detail.</p>
              </div>
              <Badge variant="outline">{filteredReminders.length} records</Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2 max-sm:min-w-full">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search reminders</span>
                <Input
                  className="border-0 bg-transparent"
                  placeholder="Search title, module, owner, record"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <select
                className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ReminderFilter)}
              >
                <option value="ALL">status: all</option>
                <option value="DUE_SOON">DUE_SOON</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="DONE">DONE</option>
              </select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reminder</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReminders.map((reminder) => (
                  <TableRow
                    key={reminder.reminder_code}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedReminderCode(reminder.reminder_code)}
                  >
                    <TableCell className="max-w-80 whitespace-normal">
                      <span className="block font-semibold">{reminder.title}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{reminder.reminder_code}</span>
                    </TableCell>
                    <TableCell>{reminder.module}</TableCell>
                    <TableCell className="font-mono text-[11px]">{reminder.related_record_code}</TableCell>
                    <TableCell>{reminder.owner}</TableCell>
                    <TableCell>{reminder.due_at}</TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <Badge variant={reminderStatusVariant(reminder.status)}>{reminder.status}</Badge>
                        <Badge variant={priorityVariant(reminder.priority)}>{reminder.priority}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setSelectedReminderCode(reminder.reminder_code); }}>
                        <Eye aria-hidden="true" className="size-4" /> Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Rows 1-{filteredReminders.length} of {filteredReminders.length}. Sort/pagination are visual until APIs are connected.</p>
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
              <p className="text-sm font-bold">Reminder safety</p>
              <p className="mt-1 text-xs text-muted-foreground">Reminder details show only public workflow codes and summarized context. No tokens, secrets, or raw payloads are displayed.</p>
            </div>
            <CheckCircle2 aria-hidden="true" className="size-5 text-primary" />
          </CardContent>
        </Card>
      </section>

      {selectedReminder ? <ReminderDetailModal reminder={selectedReminder} onClose={() => setSelectedReminderCode(null)} /> : null}
    </AppShell>
  );
}
