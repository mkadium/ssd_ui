import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPostLoginPath, loadCurrentUser, login } from "../../api/session.api";

export function LoginPage() {
  const navigate = useNavigate();
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await login(loginIdentifier, password);
      const currentUser = await loadCurrentUser().catch(() => ({
        displayName: response.user_profile.display_name ?? response.user_profile.username ?? "SSD User",
        email: response.user_profile.email ?? "",
        unitCode: response.user_profile.owning_unit_code ?? response.user_profile.unit_code,
        roles: response.roles.map((role) => role.role_code ?? role.code ?? role.role_name ?? role.name ?? "USER"),
      }));

      navigate(getPostLoginPath(currentUser.roles), { replace: true });
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-brand-row">
          <div className="login-emblem">GoI</div>
          <div>
            <div className="login-brand-title">Government of India</div>
            <div className="login-brand-subtitle">Ministry of Statistics and Programme Implementation</div>
          </div>
        </div>
        <div className="login-hero-copy">
          <div className="login-kicker">SSD Secure Workspace</div>
          <h1>Statistical Data Management System</h1>
          <p>
            Governed platform for templates, data collection, validation, review, approvals, dashboards, CMS, and DMS.
          </p>
        </div>
        <div className="login-flow-card">
          <span>Collect</span>
          <span>Validate</span>
          <span>Review</span>
          <span>Publish</span>
        </div>
      </section>

      <section className="login-panel" aria-label="Sign in">
        <div className="secure-badge">
          <ShieldCheck size={16} />
          Authorized access
        </div>
        <h2>Sign in to SSD Portal</h2>
        <p>Use your official credentials to continue.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Official email or username</span>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                autoComplete="username"
                onChange={(event) => setLoginIdentifier(event.target.value)}
                placeholder="officer@mospi.gov.in"
                required
                type="text"
                value={loginIdentifier}
              />
            </div>
          </label>
          <label>
            <span>Password</span>
            <div className="input-with-icon">
              <LockKeyhole size={16} />
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
                type="password"
                value={password}
              />
            </div>
          </label>
          {errorMessage && <div className="login-error">{errorMessage}</div>}
          <div className="login-options">
            <label className="checkbox-row">
              <input type="checkbox" />
              Remember device
            </label>
            <a href="#forgot">Forgot password?</a>
          </div>
          <button className="primary-action" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}

function getLoginErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("invalid")) {
    return "The username or password you entered is incorrect.";
  }
  return "We could not sign you in right now. Please try again in a few moments.";
}
