import {
  KeyRound,
  LockKeyhole,
  Save,
  Search,
  ShieldCheck,
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
import { currentUserProfile, userUnitRoles } from "@/data/userExperience.sample";

export function PasswordManagementPage() {
  const users = [
    { user_code: "USER_SUPERADMIN", username: "superadmin", display_name: "SSD Super Admin", unit: "SDG", status: "ACTIVE" },
    { user_code: "USER_SSD_DEMO_OFFICER", username: "ssd_demo_officer", display_name: "SSD Demo Officer", unit: "SDG", status: "ACTIVE" },
    { user_code: "USER_STATE_REVIEWER", username: "state_reviewer", display_name: "State Reviewer", unit: "STATE_UNIT", status: "ACTIVE" },
  ];

  return (
    <AppShell persona={currentUserProfile.primary_role} activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="password-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="password-title" className="text-2xl font-bold">Password Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Change your password or prepare admin set-password actions from approved Auth API contracts.</p>
          </div>
          <Badge variant="outline">No password logging</Badge>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
          <Card>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <LockKeyhole aria-hidden="true" className="size-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold">Change my password</h2>
                  <p className="text-xs text-muted-foreground">Maps to `POST /auth/password/change` when integration is enabled.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <label className="grid gap-1 text-xs font-semibold">
                  Current password
                  <Input type="password" defaultValue="************" />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  New password
                  <Input type="password" defaultValue="************" />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Confirm new password
                  <Input type="password" defaultValue="************" />
                </label>
              </div>
              <div className="rounded-md bg-muted/40 p-3 text-xs">
                Password verification and Argon2 hashing are API-owned. UI never stores raw passwords beyond the submit interaction.
              </div>
              <Button type="button"><Save aria-hidden="true" className="size-4" /> Save/Submit</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold">Admin set password</h2>
                  <p className="text-xs text-muted-foreground">Requires `AUTH:update`; API remains authoritative.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search users</span>
                <Input className="border-0 bg-transparent" placeholder="Search user, unit, role" />
              </label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_code}>
                      <TableCell>
                        <span className="block font-semibold">{user.display_name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{user.username}</span>
                      </TableCell>
                      <TableCell>{user.unit}</TableCell>
                      <TableCell><Badge variant="secondary">{user.status}</Badge></TableCell>
                      <TableCell><Button size="sm" variant="outline"><KeyRound aria-hidden="true" className="size-4" /> Set</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <label className="grid gap-1 text-xs font-semibold">
                  Temporary new password
                  <Input type="password" defaultValue="************" />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Confirm password
                  <Input type="password" defaultValue="************" />
                </label>
              </div>
              <Button type="button" variant="outline"><ShieldCheck aria-hidden="true" className="size-4" /> Admin save/submit</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="grid gap-3">
            <h2 className="text-base font-bold">Role visibility</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Review level</TableHead>
                  <TableHead>Password action visibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userUnitRoles.map((role) => (
                  <TableRow key={`${role.unit_code}-${role.role_name}`}>
                    <TableCell>{role.unit_name}</TableCell>
                    <TableCell>{role.role_name}</TableCell>
                    <TableCell>{role.review_level}</TableCell>
                    <TableCell>{role.role_name === "Super Admin" ? "Change + admin set password" : "Change password only"}</TableCell>
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
