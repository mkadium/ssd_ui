export type ReminderStatus = "DUE_SOON" | "OVERDUE" | "SCHEDULED" | "DONE";
export type ReminderPriority = "LOW" | "NORMAL" | "HIGH";
export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";
export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export type UserProfileSample = {
  user_code: string;
  display_name: string;
  email: string;
  mobile_number: string;
  primary_role: string;
  active_unit_code: string;
  active_unit_name: string;
  last_login_at: string;
  password_changed_at: string;
  preferred_language: "en-IN" | "hi-IN";
  default_dashboard: string;
  accessibility_mode: "standard" | "high_contrast" | "large_text";
};

export type UserUnitRoleSample = {
  unit_code: string;
  unit_name: string;
  role_name: string;
  review_level: string;
  status: "ACTIVE" | "INACTIVE";
};

export type UserPreferenceSample = {
  preference_code: string;
  label: string;
  value: string;
  category: "Language" | "Dashboard" | "Accessibility" | "Notifications" | "Reminders";
  note: string;
};

export type ReminderSample = {
  reminder_code: string;
  title: string;
  module: "Requests" | "Data Entry" | "Validation" | "Review" | "Templates";
  related_record_code: string;
  status: ReminderStatus;
  priority: ReminderPriority;
  due_at: string;
  owner: string;
  message: string;
  action_label: string;
  detail_summary: string;
};

export type NotificationSample = {
  notification_code: string;
  title: string;
  module: "Requests" | "Ingestion" | "Validation" | "Review" | "Dashboard" | "Invitation Access";
  related_record_code: string;
  status: NotificationStatus;
  severity: NotificationSeverity;
  created_at: string;
  sender: string;
  message: string;
  detail_summary: string;
};

export const currentUserProfile: UserProfileSample = {
  user_code: "USER_SUPERADMIN",
  display_name: "SSD Super Admin",
  email: "admin@example.gov.in",
  mobile_number: "Not set",
  primary_role: "Super Admin",
  active_unit_code: "SDG",
  active_unit_name: "SDG Coordination Unit",
  last_login_at: "2026-05-31 15:50",
  password_changed_at: "2026-05-29 10:15",
  preferred_language: "en-IN",
  default_dashboard: "Dashboard: Super Admin",
  accessibility_mode: "standard",
};

export const userUnitRoles: UserUnitRoleSample[] = [
  {
    unit_code: "SDG",
    unit_name: "SDG Coordination Unit",
    role_name: "Super Admin",
    review_level: "All levels",
    status: "ACTIVE",
  },
  {
    unit_code: "STATE_UNIT",
    unit_name: "State Planning Unit",
    role_name: "Unit Admin",
    review_level: "Level 1",
    status: "ACTIVE",
  },
  {
    unit_code: "HEALTH",
    unit_name: "Health Statistics Unit",
    role_name: "Reviewer",
    review_level: "Level 2",
    status: "ACTIVE",
  },
];

export const userPreferences: UserPreferenceSample[] = [
  {
    preference_code: "PREF_LANGUAGE",
    label: "Default language",
    value: "English (en-IN)",
    category: "Language",
    note: "Hindi can be selected from the top bar or preferences.",
  },
  {
    preference_code: "PREF_DASHBOARD",
    label: "Default dashboard",
    value: "Super Admin Dashboard",
    category: "Dashboard",
    note: "Users with multiple roles can switch dashboards from the top bar.",
  },
  {
    preference_code: "PREF_ACCESSIBILITY",
    label: "Accessibility mode",
    value: "Standard contrast",
    category: "Accessibility",
    note: "High contrast and large text are planned UI states.",
  },
  {
    preference_code: "PREF_EMAIL_DIGEST",
    label: "Email digest",
    value: "Daily 09:00",
    category: "Notifications",
    note: "Visual state until governed notification APIs exist.",
  },
  {
    preference_code: "PREF_REMINDER_WINDOW",
    label: "Reminder window",
    value: "3 days before due date",
    category: "Reminders",
    note: "Used for request, validation, and review due-date prompts.",
  },
];

export const reminders: ReminderSample[] = [
  {
    reminder_code: "REM_REQ_DUE_0001",
    title: "Request assignments due this week",
    module: "Requests",
    related_record_code: "REQ_SDG_NIF_2025_0001",
    status: "DUE_SOON",
    priority: "HIGH",
    due_at: "2026-06-03 17:00",
    owner: "SDG Request Admin",
    message: "Three request assignments are due this week.",
    action_label: "Open request",
    detail_summary: "Review assignments, pending contributors, and generated invitation access before the due date.",
  },
  {
    reminder_code: "REM_VALIDATION_0001",
    title: "Validation follow-up pending",
    module: "Validation",
    related_record_code: "VALRUN_REQ_SDG_NIF_2025_0001_V2",
    status: "OVERDUE",
    priority: "HIGH",
    due_at: "2026-05-31 12:00",
    owner: "Validation Officer",
    message: "One validation issue is waiting for follow-up.",
    action_label: "Open validation",
    detail_summary: "Open the validation report and check affected indicator, row, and rule summary.",
  },
  {
    reminder_code: "REM_TEMPLATE_REVIEW_0001",
    title: "Template review scheduled",
    module: "Templates",
    related_record_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP",
    status: "SCHEDULED",
    priority: "NORMAL",
    due_at: "2026-06-01 11:00",
    owner: "Template Admin",
    message: "Template draft review is scheduled tomorrow.",
    action_label: "Open template",
    detail_summary: "Confirm indicator mapping, dimension headers, editable cells, and validation rule references before publishing.",
  },
  {
    reminder_code: "REM_REVIEW_QUEUE_0001",
    title: "Review queue waiting",
    module: "Review",
    related_record_code: "TASK_REQ_SDG_NIF_2025_0001_L1",
    status: "DUE_SOON",
    priority: "NORMAL",
    due_at: "2026-06-02 15:00",
    owner: "Level 1 Reviewer",
    message: "One review task is ready for approval.",
    action_label: "Open review",
    detail_summary: "Reviewer should inspect request, data entry, ingestion, validation, and approval history context.",
  },
];

export const notifications: NotificationSample[] = [
  {
    notification_code: "NTF_SUBMITTED_0001",
    title: "NIF 1.2.1 submitted",
    module: "Ingestion",
    related_record_code: "SUB_REQ_SDG_NIF_2025_0001_V1",
    status: "UNREAD",
    severity: "SUCCESS",
    created_at: "2026-05-31 14:10",
    sender: "Data Entry Workspace",
    message: "A department submitted template data for NIF 1.2.1.",
    detail_summary: "Submission is available for validation. Raw payload and source hashes are not shown.",
  },
  {
    notification_code: "NTF_DASHBOARD_0001",
    title: "Dashboard snapshot ready",
    module: "Dashboard",
    related_record_code: "SNAPSHOT_SDG_NIF_2025_0001",
    status: "UNREAD",
    severity: "INFO",
    created_at: "2026-05-31 13:35",
    sender: "Dashboard Service",
    message: "A submitted snapshot is ready for review in dashboard views.",
    detail_summary: "Published-only data boundary applies before public display.",
  },
  {
    notification_code: "NTF_ASSIGNMENT_0001",
    title: "New source assignment pending",
    module: "Requests",
    related_record_code: "ASN_REQ_SDG_NIF_2025_0001_PROVIDER",
    status: "READ",
    severity: "WARNING",
    created_at: "2026-05-31 12:45",
    sender: "Request Service",
    message: "A source assignment requires contributor follow-up.",
    detail_summary: "Invitation access may be resent or revoked from request-linked monitor screens when governed APIs exist.",
  },
  {
    notification_code: "NTF_REVIEW_LEVEL_0001",
    title: "Review task moved to Level 2",
    module: "Review",
    related_record_code: "TASK_REQ_SDG_NIF_2025_0001_L2",
    status: "UNREAD",
    severity: "INFO",
    created_at: "2026-05-31 11:20",
    sender: "Review Service",
    message: "A review task moved to the next configured level.",
    detail_summary: "Review depth is dynamic by unit and should not be hardcoded.",
  },
];
