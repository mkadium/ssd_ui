export type HealthStatus = "OK" | "DEGRADED" | "DOWN" | "PENDING";
export type JobStatus = "COMPLETED" | "RUNNING" | "PENDING" | "FAILED" | "WARNING";
export type LogSeverity = "INFO" | "WARNING" | "ERROR" | "AUDIT";

export type SystemHealthSample = {
  component_code: string;
  component_name: string;
  category: "API" | "DATABASE" | "STORAGE" | "DEPLOYMENT" | "SCHEDULER";
  status: HealthStatus;
  last_checked_at: string;
  response_time_ms: number | null;
  summary: string;
};

export type OperationsJobSample = {
  job_code: string;
  job_type: "INGESTION" | "VALIDATION" | "REVIEW_QUEUE" | "REMINDER_EMAIL" | "INVITATION" | "BACKUP";
  status: JobStatus;
  related_code: string;
  scheduled_for: string;
  last_run_at: string;
  next_run_at: string;
  attempts: string;
  owner: string;
  note: string;
};

export type AuditLogSample = {
  event_code: string;
  occurred_at: string;
  severity: LogSeverity;
  module: "Auth" | "Requests" | "Ingestion" | "Validation" | "Review" | "Invitation Access" | "Dashboard" | "Deployment";
  actor: string;
  action: string;
  entity_code: string;
  sanitized_message: string;
  detail_summary: string;
};

export const systemHealth: SystemHealthSample[] = [
  {
    component_code: "API_HEALTH",
    component_name: "SSD API health endpoint",
    category: "API",
    status: "OK",
    last_checked_at: "2026-05-31 15:58",
    response_time_ms: 42,
    summary: "Health endpoint reachable on DEV port 8100.",
  },
  {
    component_code: "DB_CONNECTIVITY",
    component_name: "PostgreSQL DEV connectivity",
    category: "DATABASE",
    status: "OK",
    last_checked_at: "2026-05-31 15:58",
    response_time_ms: 63,
    summary: "DB connection pool accepts authenticated API checks.",
  },
  {
    component_code: "LOCAL_FILE_STORAGE",
    component_name: "Local files path",
    category: "STORAGE",
    status: "DEGRADED",
    last_checked_at: "2026-05-31 15:57",
    response_time_ms: null,
    summary: "Local folder exists; retention and object storage migration are pending governance decisions.",
  },
  {
    component_code: "DEV_DOCKER",
    component_name: "DEV Docker deployment",
    category: "DEPLOYMENT",
    status: "OK",
    last_checked_at: "2026-05-31 15:55",
    response_time_ms: null,
    summary: "Latest API container is reported healthy after deployment script verification.",
  },
  {
    component_code: "REMINDER_SCHEDULER",
    component_name: "Reminder and email scheduler",
    category: "SCHEDULER",
    status: "PENDING",
    last_checked_at: "2026-05-31 15:51",
    response_time_ms: null,
    summary: "Scheduler API is future work; UI shows planned run monitoring only.",
  },
];

export const operationsJobs: OperationsJobSample[] = [
  {
    job_code: "JOB_INGESTION_FULL_0001",
    job_type: "INGESTION",
    status: "COMPLETED",
    related_code: "SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2",
    scheduled_for: "Immediate",
    last_run_at: "2026-05-31 14:10",
    next_run_at: "On new submission",
    attempts: "1 / 3",
    owner: "Data Operations",
    note: "Submission manifest and staged records read back successfully.",
  },
  {
    job_code: "JOB_VALIDATION_0001",
    job_type: "VALIDATION",
    status: "WARNING",
    related_code: "VALRUN_REQ_SDG_NIF_2025_0001_V2",
    scheduled_for: "After ingestion",
    last_run_at: "2026-05-31 14:13",
    next_run_at: "On corrected draft",
    attempts: "1 / 3",
    owner: "Validation Officer",
    note: "One required cell warning remains for reviewer visibility.",
  },
  {
    job_code: "JOB_REVIEW_QUEUE_SYNC",
    job_type: "REVIEW_QUEUE",
    status: "RUNNING",
    related_code: "TASK_REQ_SDG_NIF_2025_0001_L1",
    scheduled_for: "Every 15 minutes",
    last_run_at: "2026-05-31 15:45",
    next_run_at: "2026-05-31 16:00",
    attempts: "0 / 3",
    owner: "Review Service",
    note: "Reviewer task queue refresh is in progress.",
  },
  {
    job_code: "JOB_REMINDER_EMAIL_DAILY",
    job_type: "REMINDER_EMAIL",
    status: "PENDING",
    related_code: "REQ_SDG_NIF_2025_0001",
    scheduled_for: "Daily 09:00",
    last_run_at: "Not executed",
    next_run_at: "2026-06-01 09:00",
    attempts: "0 / 3",
    owner: "Notification Service",
    note: "Reminder/email send API is visual-planned until governed service exists.",
  },
  {
    job_code: "JOB_INVITATION_EXPIRY_SCAN",
    job_type: "INVITATION",
    status: "PENDING",
    related_code: "INV_REQ_SDG_NIF_2025_0001_PROVIDER",
    scheduled_for: "Hourly",
    last_run_at: "2026-05-31 15:00",
    next_run_at: "2026-05-31 16:00",
    attempts: "0 / 3",
    owner: "Access Service",
    note: "Expiry scan tracks request-linked setup invitations without exposing raw links.",
  },
  {
    job_code: "JOB_BACKUP_DEV_DAILY",
    job_type: "BACKUP",
    status: "COMPLETED",
    related_code: "DEV_BACKUP_20260531",
    scheduled_for: "Daily 02:00",
    last_run_at: "2026-05-31 02:00",
    next_run_at: "2026-06-01 02:00",
    attempts: "1 / 1",
    owner: "Infrastructure",
    note: "Backup status is sample-only until infrastructure evidence APIs are approved.",
  },
];

export const auditLogs: AuditLogSample[] = [
  {
    event_code: "AUDIT_AUTH_LOGIN_0001",
    occurred_at: "2026-05-31 15:50:20",
    severity: "AUDIT",
    module: "Auth",
    actor: "superadmin",
    action: "LOGIN_SUCCESS",
    entity_code: "USER_SUPERADMIN",
    sanitized_message: "Admin signed in successfully.",
    detail_summary: "Session established with bearer token hidden from UI and logs.",
  },
  {
    event_code: "AUDIT_REQ_OPEN_0001",
    occurred_at: "2026-05-31 15:44:10",
    severity: "INFO",
    module: "Requests",
    actor: "request.admin",
    action: "VIEW_REQUEST_DETAIL",
    entity_code: "REQ_SDG_NIF_2025_0001",
    sanitized_message: "Collection request detail viewed.",
    detail_summary: "Read-only request, items, assignments, and status trail were displayed.",
  },
  {
    event_code: "AUDIT_INGESTION_0001",
    occurred_at: "2026-05-31 14:10:45",
    severity: "INFO",
    module: "Ingestion",
    actor: "data.provider",
    action: "SUBMISSION_RECEIVED",
    entity_code: "SUB_REQ_SDG_NIF_2025_0001_V1",
    sanitized_message: "Submission accepted and staged for validation.",
    detail_summary: "Raw payload and source hash are not shown in the monitor.",
  },
  {
    event_code: "AUDIT_VALIDATION_WARN_0001",
    occurred_at: "2026-05-31 14:13:02",
    severity: "WARNING",
    module: "Validation",
    actor: "validation.service",
    action: "VALIDATION_COMPLETED_WITH_WARNING",
    entity_code: "VALRUN_REQ_SDG_NIF_2025_0001_V2",
    sanitized_message: "Validation completed with one warning.",
    detail_summary: "Only rule code and affected public record code are visible.",
  },
  {
    event_code: "AUDIT_REVIEW_QUEUE_0001",
    occurred_at: "2026-05-31 14:15:18",
    severity: "INFO",
    module: "Review",
    actor: "review.service",
    action: "TASK_QUEUED",
    entity_code: "TASK_REQ_SDG_NIF_2025_0001_L1",
    sanitized_message: "Review task queued for level 1 reviewer.",
    detail_summary: "Review metadata JSON and internal database IDs are hidden.",
  },
  {
    event_code: "AUDIT_INVITE_0001",
    occurred_at: "2026-05-31 13:40:12",
    severity: "AUDIT",
    module: "Invitation Access",
    actor: "request.admin",
    action: "INVITATION_SENT",
    entity_code: "INV_REQ_SDG_NIF_2025_0001_PROVIDER",
    sanitized_message: "Request-linked invitation sent.",
    detail_summary: "Raw setup link and token hash are never displayed.",
  },
  {
    event_code: "AUDIT_DEPLOY_0001",
    occurred_at: "2026-05-31 12:20:31",
    severity: "INFO",
    module: "Deployment",
    actor: "devops.admin",
    action: "DEV_DEPLOY_VERIFIED",
    entity_code: "SSD_API_DEV",
    sanitized_message: "DEV deployment health check passed.",
    detail_summary: "Health endpoint status captured without environment secret values.",
  },
];
