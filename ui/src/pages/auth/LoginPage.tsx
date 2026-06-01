import {
  ArrowRight,
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoSuperAdminLogin, demoUnitAdminLogin } from "@/data/auth.sample";
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import type { LoginResponse } from "@/types/auth";

type LoginLocationState = {
  from?: string;
};

const landingRoles = [
  {
    code: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Govern framework, masters, requests, review queue, and cross-unit dashboards.",
    route: "/dashboard/super-admin",
    sample: demoSuperAdminLogin,
  },
  {
    code: "UNIT_ADMIN",
    label: "Unit Admin",
    description: "Track assigned indicators, submissions, validation issues, and review readiness.",
    route: "/dashboard/unit-admin",
    sample: demoUnitAdminLogin,
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setAuth } = useAuth();
  const loginMutation = useLogin();
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [unitId, setUnitId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("SUPER_ADMIN");

  const redirectTo = (location.state as LoginLocationState | null)?.from ?? "/dashboard/super-admin";
  const selectedLandingRole = useMemo(
    () => landingRoles.find((role) => role.code === selectedRole) ?? landingRoles[0],
    [selectedRole],
  );

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const completeLogin = (data: LoginResponse, route = redirectTo) => {
    setAuth(data);
    navigate(route, { replace: true });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    loginMutation.mutate(
      {
        login_identifier: loginIdentifier.trim(),
        password,
        unit_id: unitId.trim() || null,
      },
      {
        onSuccess: () => navigate(redirectTo, { replace: true }),
      },
    );
  };

  return (
    <main className="h-dvh overflow-hidden bg-background p-2 text-foreground sm:p-4 [@media(max-height:680px)]:p-2">
      <section
        aria-labelledby="login-title"
        className="mx-auto grid h-full max-w-[1120px] grid-cols-[minmax(300px,380px)_minmax(0,1fr)] overflow-hidden rounded-md border border-border bg-card shadow-sm max-lg:grid-cols-1"
      >
        <div className="flex min-h-0 flex-col justify-between gap-5 bg-sidebar p-6 text-sidebar-foreground max-lg:hidden">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-md bg-white text-[10px] font-bold leading-tight text-[#0c2f55]">
                Logo
                <span>path:</span>
              </div>
              <div>
                <p className="text-xl font-bold">SSD-SDG Portal</p>
                <p className="text-xs text-blue-100">Secure workspace</p>
              </div>
            </div>

            <div className="mt-12 max-w-sm max-[900px]:mt-7">
              <Badge className="mb-4 bg-white/15 text-white">Internal access</Badge>
              <h1 id="login-title" className="text-3xl font-bold leading-tight">
                Sign in to continue.
              </h1>
              <p className="mt-4 text-sm leading-6 text-blue-100">
                Use your SSD account or choose a demo role for UI review.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-white/20 bg-white/10 p-3 text-xs leading-5 text-blue-50 max-[760px]:hidden">
            Bilingual-ready. Keyboard accessible. No passwords or tokens are displayed.
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3 overflow-hidden p-5 max-sm:p-3 max-[380px]:gap-2 [@media(max-height:680px)]:gap-2 [@media(max-height:680px)]:p-3">
          <div className="flex shrink-0 items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Secure access</p>
              <h2 className="mt-1 text-2xl font-bold max-[380px]:text-xl [@media(max-height:680px)]:text-xl">Login</h2>
            </div>
            <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold">
              <Languages aria-hidden="true" className="size-4 text-primary" />
              <span className="sr-only">Language</span>
              <select className="bg-transparent outline-none" defaultValue="en-IN">
                <option value="en-IN">EN</option>
                <option value="hi-IN">HN</option>
              </select>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 rounded-md border border-border bg-background p-4 max-sm:p-3 max-[380px]:p-2.5 [@media(max-height:680px)]:p-3">
            <div className="grid gap-3 max-[380px]:gap-2 [@media(max-height:680px)]:gap-2">
              <label className="grid gap-1 text-sm font-semibold">
                Login identifier
                <span className="relative">
                  <UserRound aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 pl-10 [@media(max-height:680px)]:h-10"
                    value={loginIdentifier}
                    onChange={(event) => setLoginIdentifier(event.target.value)}
                    placeholder="Username, email, or mobile number"
                    autoComplete="username"
                    required
                  />
                </span>
              </label>

              <label className="grid gap-1 text-sm font-semibold">
                Password
                <span className="relative">
                  <LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 pl-10 pr-10 [@media(max-height:680px)]:h-10"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                  </button>
                </span>
              </label>

              <label className="grid gap-1 text-sm font-semibold">
                Unit ID <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                <Input
                  className="h-11 [@media(max-height:680px)]:h-10"
                  value={unitId}
                  onChange={(event) => setUnitId(event.target.value)}
                  placeholder="Only if a specific unit context is required"
                />
              </label>
            </div>

            {loginMutation.isError && (
              <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                Login failed. Check credentials, API URL, and server availability.
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch max-[380px]:mt-2">
              <p className="text-xs text-muted-foreground max-[380px]:hidden">
                Passwords and tokens are not displayed.
              </p>
              <Button type="submit" className="h-11 shrink-0 px-5 [@media(max-height:680px)]:h-10" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </form>

          <div className="min-h-0 flex-1 rounded-md border border-border bg-card p-4 max-sm:p-3 max-[380px]:p-2.5 [@media(max-height:680px)]:p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold">Demo role</h3>
              <Badge variant="outline">UI review only</Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 max-sm:grid-cols-1 max-[380px]:mt-2 max-[380px]:gap-2 [@media(max-height:680px)]:mt-2 [@media(max-height:680px)]:gap-2">
              {landingRoles.map((role) => (
                <button
                  key={role.code}
                  type="button"
                  onClick={() => setSelectedRole(role.code)}
                  className={[
                    "rounded-md border p-3 text-left transition hover:border-primary hover:bg-accent max-[380px]:p-2 [@media(max-height:680px)]:p-2",
                    selectedRole === role.code ? "border-primary bg-accent" : "border-border bg-background",
                  ].join(" ")}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-sm font-bold">{role.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground max-[480px]:hidden [@media(max-height:680px)]:hidden">
                        {role.description}
                      </span>
                    </span>
                    <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
                  </span>
                </button>
              ))}
            </div>

            <Button
              type="button"
              className="mt-3 h-11 w-full max-[380px]:mt-2 [@media(max-height:680px)]:mt-2 [@media(max-height:680px)]:h-10"
              onClick={() => completeLogin(selectedLandingRole.sample, selectedLandingRole.route)}
            >
              Continue with {selectedLandingRole.label}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
