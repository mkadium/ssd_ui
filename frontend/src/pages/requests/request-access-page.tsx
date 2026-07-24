import { CheckCircle2, Edit3, KeyRound, RefreshCw, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  getRequestAccessSession,
  previewRequestAccess,
  sendRequestAccessOtp,
  verifyRequestAccessOtp,
  type RequestAccessAssignment,
  type RequestAccessPreview,
} from "../../api/requests.api";

const verifiedAccessStoragePrefix = "ssd.requestAccess.verified.";

function accessPageError(caught: unknown, fallback: string) {
  const message = caught instanceof Error ? caught.message : "";
  if (/database request/i.test(message)) {
    return "Request access could not be opened right now. Please refresh or contact SSD support if this link was recently issued.";
  }
  return message || fallback;
}

function sessionAssignments(detail: Awaited<ReturnType<typeof getRequestAccessSession>>) {
  return detail.assignments?.length ? detail.assignments : detail.assignment ? [detail.assignment] : [];
}

function statusLabel(value: unknown) {
  const status = String(value || "NOT_STARTED").trim().toUpperCase().replace(/\s+/g, "_");
  const labels: Record<string, string> = {
    NOT_STARTED: "Not started",
    DRAFT: "Draft",
    IN_PROGRESS: "In progress",
    SUBMITTED: "Submitted",
    RESUBMITTED: "Resubmitted",
    APPROVED: "Approved",
  };
  return labels[status] ?? status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
}

export function RequestAccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const accessSessionParam = searchParams.get("session") ?? "";
  const [preview, setPreview] = useState<RequestAccessPreview | null>(null);
  const [otp, setOtp] = useState("");
  const [assignments, setAssignments] = useState<RequestAccessAssignment[]>([]);
  const [accessSession, setAccessSession] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpResendAt, setOtpResendAt] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const storageKey = token ? `${verifiedAccessStoragePrefix}${token}` : "";
  const verifiedFromCache = searchParams.get("verified") === "1";

  useEffect(() => {
    async function loadPreview() {
      if (!token) {
        setError("Request access link is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const data = await previewRequestAccess(token);
        setPreview(data);
        if (verifiedFromCache) {
          const cached = storageKey ? window.sessionStorage.getItem(storageKey) : "";
          const parsed = cached ? JSON.parse(cached) as { assignments?: RequestAccessAssignment[]; accessSession?: string } : {};
          const storedSession = accessSessionParam || parsed.accessSession || "";
          if (storedSession) {
            try {
              const sessionDetail = await getRequestAccessSession(storedSession);
              const freshAssignments = sessionAssignments(sessionDetail);
              setAssignments(freshAssignments);
              setAccessSession(storedSession);
              if (storageKey) {
                window.sessionStorage.setItem(
                  storageKey,
                  JSON.stringify({
                    assignments: freshAssignments,
                    accessSession: storedSession,
                  }),
                );
              }
              return;
            } catch {
              // Fall back to the last verified cache so a temporary refresh failure does not lock the officer out.
            }
          }
          if (cached) {
            setAssignments(parsed.assignments ?? []);
            setAccessSession(parsed.accessSession ?? "");
          } else if (accessSessionParam) {
            const sessionDetail = await getRequestAccessSession(accessSessionParam);
            const freshAssignments = sessionAssignments(sessionDetail);
            setAssignments(freshAssignments);
            setAccessSession(accessSessionParam);
            if (storageKey) {
              window.sessionStorage.setItem(
                storageKey,
                JSON.stringify({
                  assignments: freshAssignments,
                  accessSession: accessSessionParam,
                }),
              );
            }
          }
        }
      } catch (caught) {
        setError(accessPageError(caught, "Request access link could not be opened."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadPreview();
  }, [accessSessionParam, storageKey, token, verifiedFromCache]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const otpCooldownSeconds = Math.max(Math.ceil((otpResendAt - now) / 1000), 0);
  const canSendOtp = useMemo(() => Boolean(token && !isSendingOtp && otpCooldownSeconds === 0), [isSendingOtp, otpCooldownSeconds, token]);
  const canVerify = useMemo(() => Boolean(token && otp.trim().length >= 4 && !isVerifying), [isVerifying, otp, token]);

  function indicatorDisplay(assignment: RequestAccessAssignment) {
    const number = assignment.indicatorNumber || assignment.indicatorCode || "";
    const name = assignment.indicatorName || assignment.indicatorLabel || "";
    if (number && name && name !== number) return `${number} - ${name}`;
    return name || number || "-";
  }

  async function handleSendOtp() {
    if (!canSendOtp) return;
    setIsSendingOtp(true);
    setNotice("");
    setError("");
    try {
      const result = await sendRequestAccessOtp(token);
      const resendAt = result.resendAllowedAt ? new Date(result.resendAllowedAt).getTime() : Date.now() + Number(result.expiresInMinutes ?? 10) * 60_000;
      setOtpResendAt(resendAt);
      setNotice(`OTP sent to your email address. It is valid for ${result.expiresInMinutes ?? preview?.otpSettings?.validityMinutes ?? 10} minutes.`);
    } catch (caught) {
      setError(accessPageError(caught, "OTP could not be sent."));
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!canVerify) return;
    setIsVerifying(true);
    setNotice("");
    setError("");
    try {
      const result = await verifyRequestAccessOtp(token, otp.trim());
      setAssignments(result.assignments ?? []);
      setAccessSession(result.accessSession ?? "");
      if (storageKey) {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            assignments: result.assignments ?? [],
            accessSession: result.accessSession ?? "",
          }),
        );
      }
      setNotice("Access verified.");
    } catch (caught) {
      setError(accessPageError(caught, "OTP verification failed."));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <main className="request-access-page">
      {notice ? <div className="notice success">{notice}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      <section className="request-access-shell">
        <header className="request-access-header">
          <span>SSD Enterprise Portal</span>
          <h1>Request Access</h1>
          <p>Verify your email with OTP to open assigned templates.</p>
        </header>

        {isLoading ? (
          <div className="request-access-empty">
            <RefreshCw size={18} />
            Loading request access...
          </div>
        ) : null}

        {!isLoading && preview ? (
          <>
            <section className="request-access-summary">
              <div>
                <span>Ministry</span>
                <strong>{preview.ministry || "-"}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{preview.department || "-"}</strong>
              </div>
              <div>
                <span>Request Period</span>
                <strong>{preview.requestPeriod || "-"}</strong>
              </div>
              <div>
                <span>Due Date</span>
                <strong>{preview.dueDate || "-"}</strong>
              </div>
            </section>

            {!assignments.length ? (
              <section className="request-access-card">
                <h2><KeyRound size={16} /> Verify Access</h2>
                <div className="request-access-otp-row">
                  <label>
                    OTP
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </label>
                  <button className="secondary-button" type="button" onClick={() => void handleSendOtp()} disabled={!canSendOtp}>
                    <Send size={14} />
                    {isSendingOtp ? "Sending..." : otpCooldownSeconds > 0 ? `Resend in ${otpCooldownSeconds}s` : "Send OTP"}
                  </button>
                </div>
                <button className="primary-button" type="button" onClick={() => void handleVerifyOtp()} disabled={!canVerify}>
                  <CheckCircle2 size={15} />
                  Verify and Continue
                </button>
              </section>
            ) : (
              <section className="request-access-card">
                <h2><CheckCircle2 size={16} /> Assigned Templates</h2>
                <div className="request-access-table-wrap">
                  <table className="request-access-table">
                    <thead>
                      <tr>
                        <th>Indicator</th>
                        <th>Reporting Period</th>
                        <th>Ministry</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Version</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assignment, index) => (
                        <tr key={assignment.runItemCode ?? index}>
                          <td>{indicatorDisplay(assignment)}</td>
                          <td>{assignment.reportingPeriod || preview.requestPeriod || "-"}</td>
                          <td>{assignment.ministry || "-"}</td>
                          <td>{assignment.department || "-"}</td>
                          <td>{statusLabel(assignment.status)}</td>
                          <td>{assignment.latestSubmissionVersion ? `v${assignment.latestSubmissionVersion}` : "-"}</td>
                          <td>
                            <button
                              className="secondary-button compact"
                              type="button"
                              disabled={!accessSession}
                              onClick={() => {
                                const params = new URLSearchParams({
                                  session: accessSession,
                                  run_item_code: assignment.runItemCode ?? "",
                                  token,
                                });
                                navigate(`/request-data-entry?${params.toString()}`);
                              }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
