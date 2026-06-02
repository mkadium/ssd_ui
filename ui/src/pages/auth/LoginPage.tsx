import {
  ArrowRight,
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import {
  useForm,
  type FieldErrors,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { getDefaultDashboardPath } from "@/lib/authRedirect";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const loginSchema = z.object({
  login_identifier: z
    .string()
    .trim()
    .min(1, "Login identifier is required.")
    .max(255, "Login identifier must be 255 characters or less."),
  password: z.string().min(1, "Password is required."),
  unit_id: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || uuidPattern.test(value), "Unit ID must be a valid UUID."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const loginResolver: Resolver<LoginFormValues> = async (values) => {
  const result = loginSchema.safeParse(values);

  if (result.success) {
    return {
      values: result.data,
      errors: {},
    };
  }

  const errors = result.error.issues.reduce<FieldErrors<LoginFormValues>>(
    (fieldErrors, issue) => {
      const fieldName = issue.path[0] as keyof LoginFormValues | undefined;

      if (fieldName) {
        fieldErrors[fieldName] = {
          type: issue.code,
          message: issue.message,
        };
      }

      return fieldErrors;
    },
    {},
  );

  return {
    values: {},
    errors,
  };
};

function getLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Unable to reach the API. Check server availability and CORS.";
    }

    if (error.status === 401) {
      return "Invalid login credentials.";
    }

    if (error.status === 403) {
      return "You do not have permission to access this portal.";
    }

    if (error.status === 422) {
      return "Check the login fields and try again.";
    }

    if (error.status >= 500) {
      return "Login is temporarily unavailable. Try again later.";
    }

    return "Login failed. Check credentials and try again.";
  }

  return "Login failed. Check credentials, API URL, and server availability.";
}

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, roles, pages } = useAuth();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: loginResolver,
    defaultValues: {
      login_identifier: "",
      password: "",
      unit_id: "",
    },
  });

  if (isAuthenticated) {
    return <Navigate to={getDefaultDashboardPath({ roles, pages })} replace />;
  }

  const onSubmit: SubmitHandler<LoginFormValues> = (values) => {
    loginMutation.mutate(
      {
        login_identifier: values.login_identifier,
        password: values.password,
        unit_id: values.unit_id || null,
      },
      {
        onSuccess: (data) =>
          navigate(getDefaultDashboardPath(data), { replace: true }),
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
                Use your SSD account to open the secure workspace.
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

          <form onSubmit={handleSubmit(onSubmit)} className="shrink-0 rounded-md border border-border bg-background p-4 max-sm:p-3 max-[380px]:p-2.5 [@media(max-height:680px)]:p-3">
            <div className="grid gap-3 max-[380px]:gap-2 [@media(max-height:680px)]:gap-2">
              <label className="grid gap-1 text-sm font-semibold">
                Login identifier
                <span className="relative">
                  <UserRound aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 pl-10 [@media(max-height:680px)]:h-10"
                    {...register("login_identifier")}
                    placeholder="Username, email, or mobile number"
                    autoComplete="username"
                    aria-invalid={Boolean(errors.login_identifier)}
                    aria-describedby={errors.login_identifier ? "login-identifier-error" : undefined}
                  />
                </span>
                {errors.login_identifier ? (
                  <span id="login-identifier-error" className="text-xs font-medium text-red-700">
                    {errors.login_identifier.message}
                  </span>
                ) : null}
              </label>

              <label className="grid gap-1 text-sm font-semibold">
                Password
                <span className="relative">
                  <LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 pl-10 pr-10 [@media(max-height:680px)]:h-10"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
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
                {errors.password ? (
                  <span id="password-error" className="text-xs font-medium text-red-700">
                    {errors.password.message}
                  </span>
                ) : null}
              </label>

              <label className="grid gap-1 text-sm font-semibold">
                Unit ID <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                <Input
                  className="h-11 [@media(max-height:680px)]:h-10"
                  {...register("unit_id")}
                  placeholder="Only if a specific unit context is required"
                  aria-invalid={Boolean(errors.unit_id)}
                  aria-describedby={errors.unit_id ? "unit-id-error" : undefined}
                />
                {errors.unit_id ? (
                  <span id="unit-id-error" className="text-xs font-medium text-red-700">
                    {errors.unit_id.message}
                  </span>
                ) : null}
              </label>
            </div>

            {loginMutation.isError && (
              <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                {getLoginErrorMessage(loginMutation.error)}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch max-[380px]:mt-2">
              <p className="text-xs text-muted-foreground max-[380px]:hidden">
                Passwords and tokens are not displayed.
              </p>
              <Button type="submit" className="h-11 shrink-0 px-5 [@media(max-height:680px)]:h-10" disabled={loginMutation.isPending || isSubmitting}>
                {loginMutation.isPending ? (
                  <Loader variant="inline" label="Signing in" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
