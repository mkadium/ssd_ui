import {
  Building2,
  CalendarClock,
  KeyRound,
  Languages,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
import {
  currentUserProfile,
  userUnitRoles,
} from "@/data/userExperience.sample";

export function ProfilePage() {
  const navigate = useNavigate();
  const profileStats = [
    { label: "Primary role", value: currentUserProfile.primary_role, note: "Active login context", icon: ShieldCheck },
    { label: "Active unit", value: currentUserProfile.active_unit_code, note: currentUserProfile.active_unit_name, icon: Building2 },
    { label: "Language", value: currentUserProfile.preferred_language, note: "Can be changed in preferences", icon: Languages },
    { label: "Last login", value: currentUserProfile.last_login_at, note: "Session metadata is summarized only", icon: CalendarClock },
  ];

  return (
    <AppShell persona={currentUserProfile.primary_role} activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="profile-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="profile-title" className="text-2xl font-bold">Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">View account, role, unit, and session-safe profile details.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate("/password-management")}><KeyRound aria-hidden="true" className="size-4" /> Change password</Button>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {profileStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
                  <Icon aria-hidden="true" className="size-4 text-primary" />
                </div>
                <p className="mt-2 truncate text-lg font-bold">{stat.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{stat.note}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
          <Card>
            <CardContent className="grid gap-4">
              <div className="grid place-items-center gap-3 border-b border-border pb-4 text-center">
                <div className="grid size-20 place-items-center rounded-md bg-primary/10 text-primary">
                  <UserCircle aria-hidden="true" className="size-12" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{currentUserProfile.display_name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{currentUserProfile.user_code}</p>
                </div>
                <Badge variant="secondary">ACTIVE</Badge>
              </div>
              <dl className="grid gap-3 text-sm">
                {[
                  ["Email", currentUserProfile.email],
                  ["Mobile", currentUserProfile.mobile_number],
                  ["Default dashboard", currentUserProfile.default_dashboard],
                  ["Accessibility mode", currentUserProfile.accessibility_mode],
                  ["Password changed", currentUserProfile.password_changed_at],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-1 rounded-md bg-muted/40 p-3">
                    <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
                    <dd className="break-words font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-bold">Unit roles and access</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Role and review-level summary is shown without exposing internal IDs or tokens.</p>
                </div>
                <Badge variant="outline">{userUnitRoles.length} active mappings</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Review level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userUnitRoles.map((role) => (
                    <TableRow key={`${role.unit_code}-${role.role_name}`}>
                      <TableCell>
                        <span className="block font-semibold">{role.unit_name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{role.unit_code}</span>
                      </TableCell>
                      <TableCell>{role.role_name}</TableCell>
                      <TableCell>{role.review_level}</TableCell>
                      <TableCell><Badge variant={role.status === "ACTIVE" ? "secondary" : "outline"}>{role.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Security boundary</p>
              <p className="mt-1 text-xs text-muted-foreground">Profile screen never displays access tokens, refresh tokens, password hashes, or raw session secrets.</p>
            </div>
            <Badge variant="outline">Safe profile summary</Badge>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
