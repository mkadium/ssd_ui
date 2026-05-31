import {
  Bell,
  CalendarClock,
  Eye,
  Languages,
  LayoutDashboard,
  RotateCcw,
  Save,
} from "lucide-react";

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
  userPreferences,
} from "@/data/userExperience.sample";

function SelectField({ label, defaultValue, options }: { label: string; defaultValue: string; options: string[] }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export function PreferencesPage() {
  const cards = [
    { label: "Language", value: "EN", note: "Hindi ready", icon: Languages },
    { label: "Dashboard", value: "Super Admin", note: "Default landing", icon: LayoutDashboard },
    { label: "Reminders", value: "3 days", note: "Before due date", icon: CalendarClock },
    { label: "Notifications", value: "Daily", note: "Digest setting", icon: Bell },
  ];

  return (
    <AppShell persona={currentUserProfile.primary_role} activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="preferences-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="preferences-title" className="text-2xl font-bold">Preferences</h1>
            <p className="mt-1 text-sm text-muted-foreground">Configure personal language, dashboard, accessibility, reminder, and notification preferences.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline"><RotateCcw aria-hidden="true" className="size-4" /> Reset</Button>
            <Button type="button"><Save aria-hidden="true" className="size-4" /> Save</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                  <Icon aria-hidden="true" className="size-4 text-primary" />
                </div>
                <p className="mt-2 text-lg font-bold">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-4 max-xl:grid-cols-1">
          <Card>
            <CardContent className="grid gap-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold">Preference setup</h2>
                <p className="mt-1 text-xs text-muted-foreground">Save is visual until governed user preference APIs exist.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
                <SelectField label="Default language" defaultValue="English (en-IN)" options={["English (en-IN)", "Hindi (hi-IN)"]} />
                <SelectField label="Default dashboard" defaultValue="Super Admin Dashboard" options={["Super Admin Dashboard", "Unit Admin Dashboard", "Submitted Snapshot Dashboard"]} />
                <SelectField label="Accessibility mode" defaultValue="Standard contrast" options={["Standard contrast", "High contrast", "Large text"]} />
                <SelectField label="Reminder window" defaultValue="3 days before due date" options={["Same day", "1 day before due date", "3 days before due date", "7 days before due date"]} />
                <SelectField label="Notification digest" defaultValue="Daily 09:00" options={["Immediate", "Daily 09:00", "Weekly Monday 09:00", "Off"]} />
                <SelectField label="Desktop toast" defaultValue="Enabled" options={["Enabled", "Disabled"]} />
              </div>
              <label className="grid gap-1 text-xs font-semibold">
                Alternate email for notifications
                <Input defaultValue={currentUserProfile.email} />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-base font-bold">Accessibility preview</h2>
                <p className="mt-1 text-xs text-muted-foreground">Visual-only preview for future preference API integration.</p>
              </div>
              <div className="rounded-md bg-sidebar p-4 text-sidebar-foreground">
                <p className="text-lg font-bold">SSD-SDG Portal</p>
                <p className="mt-2 text-xs text-blue-100">Readable labels, focus states, and bilingual expansion are retained.</p>
              </div>
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
                  <span className="font-semibold">Keyboard focus</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
                  <span className="font-semibold">Color-only meaning</span>
                  <Badge variant="outline">Avoided</Badge>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
                  <span className="font-semibold">Screen reader labels</span>
                  <Badge variant="secondary">Ready</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold">Current preference records</h2>
                <p className="mt-1 text-xs text-muted-foreground">Contract-shaped sample records; technical codes stay stable across languages.</p>
              </div>
              <Badge variant="outline">{userPreferences.length} records</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preference</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPreferences.map((preference) => (
                  <TableRow key={preference.preference_code}>
                    <TableCell>
                      <span className="block font-semibold">{preference.label}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{preference.preference_code}</span>
                    </TableCell>
                    <TableCell>{preference.category}</TableCell>
                    <TableCell>{preference.value}</TableCell>
                    <TableCell className="max-w-lg whitespace-normal">{preference.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Preference actions</p>
              <p className="mt-1 text-xs text-muted-foreground">Save and reset are visual states only. No API, secret, or auth-session mutation is executed.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline"><Eye aria-hidden="true" className="size-4" /> Preview</Button>
              <Button type="button"><Save aria-hidden="true" className="size-4" /> Save</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
