import {
  Bell,
  CheckCircle2,
  Eye,
  Search,
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
  notifications,
  type NotificationSample,
  type NotificationSeverity,
  type NotificationStatus,
} from "@/data/userExperience.sample";

type NotificationFilter = NotificationStatus | "ALL";

const notificationStatusVariant = (status: NotificationStatus) => {
  if (status === "UNREAD") return "outline";
  if (status === "READ") return "secondary";
  return "ghost";
};

const severityVariant = (severity: NotificationSeverity) => {
  if (severity === "ERROR") return "destructive";
  if (severity === "WARNING") return "outline";
  return "secondary";
};

function NotificationDetailModal({ notification, onClose }: { notification: NotificationSample; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="notification-detail-title">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Notification detail</p>
            <h2 id="notification-detail-title" className="text-xl font-bold">{notification.title}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={notificationStatusVariant(notification.status)}>{notification.status}</Badge>
            <Badge variant={severityVariant(notification.severity)}>{notification.severity}</Badge>
            <Badge variant="outline">{notification.module}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs max-lg:grid-cols-2 max-sm:grid-cols-1">
            {[
              ["Notification", notification.notification_code],
              ["Related record", notification.related_record_code],
              ["Sender", notification.sender],
              ["Created", notification.created_at],
              ["Module", notification.module],
              ["Status", notification.status],
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
              <p className="mt-2 text-sm text-muted-foreground">{notification.message}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-4">
              <p className="text-sm font-bold">Record-specific detail</p>
              <p className="mt-2 text-sm text-muted-foreground">{notification.detail_summary}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-4">
          <span className="text-xs text-muted-foreground">Mark read/archive actions are visual until governed notification APIs exist.</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="button" onClick={onClose}>Mark as read</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationFilter>("ALL");
  const [selectedNotificationCode, setSelectedNotificationCode] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    const normalized = query.toLowerCase();
    return notifications.filter((notification) => {
      const matchesStatus = statusFilter === "ALL" || notification.status === statusFilter;
      const matchesQuery = Object.values(notification).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const selectedNotification = notifications.find((notification) => notification.notification_code === selectedNotificationCode) ?? null;
  const cards = [
    { label: "All notifications", value: notifications.length, note: "Visible sample records" },
    { label: "Unread", value: notifications.filter((notification) => notification.status === "UNREAD").length, note: "Needs attention" },
    { label: "Warnings", value: notifications.filter((notification) => notification.severity === "WARNING").length, note: "Review soon" },
    { label: "Workflow modules", value: new Set(notifications.map((notification) => notification.module)).size, note: "Source systems" },
  ];

  return (
    <AppShell persona={currentUserProfile.primary_role} activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="notifications-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="notifications-title" className="text-2xl font-bold">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">View workflow notifications and record-specific details across requests, ingestion, validation, review, dashboard, and invitations.</p>
          </div>
          <Badge variant="outline">Sanitized summaries</Badge>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {cards.map((card) => (
            <div key={card.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                <Bell aria-hidden="true" className="size-4 text-primary" />
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
                <h2 className="text-base font-bold">Notification list</h2>
                <p className="mt-1 text-xs text-muted-foreground">Click a notification to inspect its module and related workflow record.</p>
              </div>
              <Badge variant="outline">{filteredNotifications.length} records</Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2 max-sm:min-w-full">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search notifications</span>
                <Input
                  className="border-0 bg-transparent"
                  placeholder="Search title, module, sender, record"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <select
                className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as NotificationFilter)}
              >
                <option value="ALL">status: all</option>
                <option value="UNREAD">UNREAD</option>
                <option value="READ">READ</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notification</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow
                    key={notification.notification_code}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedNotificationCode(notification.notification_code)}
                  >
                    <TableCell className="max-w-80 whitespace-normal">
                      <span className="block font-semibold">{notification.title}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{notification.notification_code}</span>
                    </TableCell>
                    <TableCell>{notification.module}</TableCell>
                    <TableCell className="font-mono text-[11px]">{notification.related_record_code}</TableCell>
                    <TableCell>{notification.sender}</TableCell>
                    <TableCell>{notification.created_at}</TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <Badge variant={notificationStatusVariant(notification.status)}>{notification.status}</Badge>
                        <Badge variant={severityVariant(notification.severity)}>{notification.severity}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setSelectedNotificationCode(notification.notification_code); }}>
                        <Eye aria-hidden="true" className="size-4" /> Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Rows 1-{filteredNotifications.length} of {filteredNotifications.length}. Sort/pagination are visual until APIs are connected.</p>
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
              <p className="text-sm font-bold">Notification safety</p>
              <p className="mt-1 text-xs text-muted-foreground">Notifications show workflow summaries only. No secrets, raw payloads, tokens, token hashes, or full sensitive response bodies are displayed.</p>
            </div>
            <CheckCircle2 aria-hidden="true" className="size-5 text-primary" />
          </CardContent>
        </Card>
      </section>

      {selectedNotification ? (
        <NotificationDetailModal notification={selectedNotification} onClose={() => setSelectedNotificationCode(null)} />
      ) : null}
    </AppShell>
  );
}
