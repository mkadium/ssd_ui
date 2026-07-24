import { apiGet, apiPatch, apiPost } from "./http-client";
import { getSelectedLocale, getSelectedUnitCode } from "./session.api";

export const DEFAULT_CERTIFICATION_TEXT =
  "I certify that the submitted data has been verified by the concerned department and is correct to the best of my knowledge.";

export type DispatchPolicy = {
  policyCode?: string;
  policyName?: string;
  scopeType?: string;
  unitCode?: string;
  templateVersionCode?: string | null;
  sourceOrganizationCode?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  dueDays?: number;
  scheduleEnabled?: boolean;
  recurrenceType?: string;
  scheduleStartDate?: string | null;
  scheduleEndDate?: string | null;
  accessRules?: Record<string, unknown>;
  otpSettings?: Record<string, unknown>;
  submissionMethods?: Record<string, unknown>;
  submissionControls?: Record<string, unknown>;
  certificationSettings?: Record<string, unknown>;
  attachmentSettings?: Record<string, unknown>;
  reminderSettings?: Record<string, unknown>;
  updatedAt?: string;
};

export type DispatchPolicyPayload = {
  policy_code?: string;
  policy_name: string;
  scope_type: string;
  unit_code: string;
  template_version_code?: string | null;
  source_organization_code?: string | null;
  is_default: boolean;
  is_active: boolean;
  due_days: number;
  schedule_enabled: boolean;
  recurrence_type: string;
  schedule_start_date?: string | null;
  schedule_end_date?: string | null;
  access_rules: Record<string, unknown>;
  otp_settings: Record<string, unknown>;
  submission_methods: Record<string, unknown>;
  submission_controls: Record<string, unknown>;
  certification_settings: Record<string, unknown>;
  attachment_settings: Record<string, unknown>;
  reminder_settings: Record<string, unknown>;
  updated_by_username?: string;
};

type ListResponse<T> = {
  data: T[];
  count: number;
  locale: string;
};

type DetailResponse<T> = {
  data: T;
  locale: string;
};

export type DispatchPlan = {
  dispatchPlanCode?: string;
  planName?: string;
  dispatchPlanName?: string;
  unitCode?: string;
  templateVersionCode?: string;
  templateName?: string;
  dispatchPolicyCode?: string | null;
  indicatorCodes?: string[];
  reportingPeriodMode?: string;
  reportingPeriodStartCode?: string | null;
  reportingPeriodEndRule?: string;
  reportingPeriodFixedEndCode?: string | null;
  allowRequestPeriodAdjustment?: boolean;
  allowDataEntryPeriodAdjustment?: boolean;
  sourceGroupingMode?: string;
  recipientRules?: Record<string, unknown>;
  providerGroupSnapshot?: Record<string, unknown>[] | Record<string, unknown>;
  status?: string;
  isActive?: boolean;
  latestRunCode?: string | null;
  latestRunStatus?: string | null;
  runCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DispatchRun = {
  dispatchRunCode?: string;
  dispatchPlanCode?: string;
  unitCode?: string;
  requestPeriodCode?: string;
  requestPeriodLabel?: string;
  reportingPeriodStartCode?: string | null;
  reportingPeriodEndCode?: string | null;
  reportingPeriodLabel?: string | null;
  status?: string;
  dispatchStatus?: string;
  scheduleStartDate?: string | null;
  dueDate?: string | null;
  itemCount?: number;
  dispatchStartedAt?: string | null;
  dispatchCompletedAt?: string | null;
  queuedNotificationEvents?: number;
  items?: Record<string, unknown>[];
  createdAt?: string;
  updatedAt?: string;
};

export type DispatchPlanPayload = {
  dispatch_plan_code?: string;
  plan_name: string;
  unit_code: string;
  template_version_code: string;
  dispatch_policy_code?: string | null;
  indicator_codes: string[];
  reporting_period_mode: string;
  reporting_period_start_code?: string | null;
  reporting_period_end_rule: string;
  reporting_period_fixed_end_code?: string | null;
  allow_request_period_adjustment: boolean;
  allow_data_entry_period_adjustment: boolean;
  source_grouping_mode: string;
  recipient_rules: Record<string, unknown>;
  provider_group_snapshot: Record<string, unknown>[];
  status: string;
  is_active: boolean;
  updated_by_username?: string;
};

export type DispatchRunPayload = {
  dispatch_run_code?: string;
  unit_code?: string;
  request_period_code: string;
  request_period_label?: string;
  schedule_start_date?: string | null;
  due_date?: string | null;
  run_metadata?: Record<string, unknown>;
  created_by_username?: string;
};

export type EmailTemplate = {
  emailTemplateCode?: string;
  templateName?: string;
  templateType?: string;
  unitCode?: string;
  scopeType?: string;
  templateVersionCode?: string | null;
  sourceOrganizationCode?: string | null;
  subject?: string;
  body?: string;
  variables?: string[];
  isDefault?: boolean;
  isActive?: boolean;
  updatedAt?: string;
};

export type EmailTemplatePayload = {
  email_template_code?: string;
  template_name: string;
  template_type: string;
  unit_code: string;
  scope_type: string;
  template_version_code?: string | null;
  source_organization_code?: string | null;
  subject: string;
  body: string;
  variables: string[];
  is_default: boolean;
  is_active: boolean;
  updated_by_username?: string;
};

export type NotificationRule = {
  notificationRuleCode?: string;
  ruleName?: string;
  actionCode?: string;
  unitCode?: string;
  scopeType?: string;
  templateVersionCode?: string | null;
  sourceOrganizationCode?: string | null;
  emailTemplateCode?: string | null;
  templateType?: string;
  senderType?: string;
  senderEmail?: string | null;
  receiverRules?: Record<string, string[]>;
  triggerRules?: Record<string, unknown>;
  appliesToStatuses?: string[];
  approvalLevel?: number | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
  updatedAt?: string;
};

export type NotificationRulePayload = {
  notification_rule_code?: string;
  rule_name: string;
  action_code: string;
  unit_code: string;
  scope_type: string;
  template_version_code?: string | null;
  source_organization_code?: string | null;
  email_template_code?: string | null;
  template_type: string;
  sender_type: string;
  sender_email?: string | null;
  receiver_rules: Record<string, string[]>;
  trigger_rules: Record<string, unknown>;
  applies_to_statuses: string[];
  approval_level?: number | null;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  updated_by_username?: string;
};

export type NotificationReceiverGroup = {
  receiverGroupCode?: string;
  groupName?: string;
  description?: string;
  resolverType?: string;
  resolverConfig?: Record<string, unknown>;
  isSystem?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  updatedAt?: string;
};

export function createDefaultDispatchPolicy(unitCode = getSelectedUnitCode()): DispatchPolicyPayload {
  return {
    policy_name: "Default Dispatch Policy",
    scope_type: "GLOBAL",
    unit_code: unitCode,
    template_version_code: null,
    source_organization_code: null,
    is_default: true,
    is_active: true,
    due_days: 30,
    schedule_enabled: false,
    recurrence_type: "NONE",
    schedule_start_date: null,
    schedule_end_date: null,
    access_rules: {
      otpRequired: false,
      openSubmit: true,
    },
    otp_settings: {
      validityMinutes: 10,
      maxAttempts: 3,
      resendLimit: 0,
    },
    submission_methods: {
      webForm: true,
      excelUpload: true,
      manualEntry: true,
    },
    submission_controls: {
      saveDraftAllowed: true,
      allowLateSubmission: true,
      allowRevisionAfterApproval: false,
      lockSubmissionAfterApproval: true,
    },
    certification_settings: {
      evidenceRequired: true,
      certificationRequired: true,
      ministryMustCertify: true,
      certificationText: DEFAULT_CERTIFICATION_TEXT,
    },
    attachment_settings: {
      allowedTypes: ["PDF", "XLSX", "CSV", "JPG", "PNG"],
      maxFileSizeMb: 20,
    },
    reminder_settings: {
      firstReminderDaysBeforeDue: 7,
      dueDateReminderEnabled: true,
      overdueReminderDaysAfterDue: 1,
      escalationDaysAfterDue: 7,
    },
  };
}

export async function listDispatchPolicies(params?: {
  scopeType?: string;
  unitCode?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
  locale?: string;
}): Promise<DispatchPolicy[]> {
  const query = new URLSearchParams({
    locale: params?.locale ?? getSelectedLocale(),
    unit_code: params?.unitCode ?? getSelectedUnitCode(),
    include_inactive: String(params?.includeInactive ?? true),
    limit: String(params?.limit ?? 200),
    offset: String(params?.offset ?? 0),
  });
  if (params?.scopeType) {
    query.set("scope_type", params.scopeType);
  }

  const result = await apiGet<ListResponse<DispatchPolicy>>(`/requests/dispatch-policies?${query.toString()}`);
  return result.data.data;
}

export async function getEffectiveDispatchPolicy(params?: {
  unitCode?: string;
  templateVersionCode?: string;
  sourceOrganizationCode?: string;
  locale?: string;
}): Promise<DispatchPolicy> {
  const query = new URLSearchParams({
    locale: params?.locale ?? getSelectedLocale(),
    unit_code: params?.unitCode ?? getSelectedUnitCode(),
  });
  if (params?.templateVersionCode) {
    query.set("template_version_code", params.templateVersionCode);
  }
  if (params?.sourceOrganizationCode) {
    query.set("source_organization_code", params.sourceOrganizationCode);
  }

  const result = await apiGet<DetailResponse<DispatchPolicy>>(`/requests/dispatch-policies/effective?${query.toString()}`);
  return result.data.data;
}

export async function saveDispatchPolicy(
  policyCode: string | undefined,
  payload: DispatchPolicyPayload,
): Promise<DispatchPolicy> {
  const result = policyCode
    ? await apiPatch<DetailResponse<DispatchPolicy>, DispatchPolicyPayload>(
        `/requests/dispatch-policies/${policyCode}`,
        payload,
      )
    : await apiPost<DetailResponse<DispatchPolicy>, DispatchPolicyPayload>("/requests/dispatch-policies", payload);
  return result.data.data;
}

export async function setDispatchPolicyActive(
  policyCode: string,
  unitCode: string,
  isActive: boolean,
): Promise<DispatchPolicy> {
  const result = await apiPatch<
    DetailResponse<DispatchPolicy>,
    { unit_code: string; is_active: boolean; updated_by_username?: string }
  >(`/requests/dispatch-policies/${policyCode}/status`, {
    unit_code: unitCode,
    is_active: isActive,
  });
  return result.data.data;
}

export function createDefaultDispatchPlan(unitCode = getSelectedUnitCode()): DispatchPlanPayload {
  return {
    plan_name: "Annual Template Dispatch Plan",
    unit_code: unitCode,
    template_version_code: "",
    dispatch_policy_code: null,
    indicator_codes: [],
    reporting_period_mode: "EXPANDING_RANGE",
    reporting_period_start_code: "",
    reporting_period_end_rule: "REQUEST_PERIOD",
    reporting_period_fixed_end_code: null,
    allow_request_period_adjustment: true,
    allow_data_entry_period_adjustment: true,
    source_grouping_mode: "MEASURE_PROVIDER",
    recipient_rules: {
      deriveFromMeasureProviders: true,
      allowAdditionalOfficers: true,
      officerRoles: ["TO", "CC", "BCC"],
    },
    provider_group_snapshot: [],
    status: "DRAFT",
    is_active: true,
  };
}

export async function listDispatchPlans(params?: {
  status?: string;
  unitCode?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
  locale?: string;
}): Promise<DispatchPlan[]> {
  const query = new URLSearchParams({
    locale: params?.locale ?? getSelectedLocale(),
    unit_code: params?.unitCode ?? getSelectedUnitCode(),
    include_inactive: String(params?.includeInactive ?? true),
    limit: String(params?.limit ?? 200),
    offset: String(params?.offset ?? 0),
  });
  if (params?.status) {
    query.set("status", params.status);
  }

  const result = await apiGet<ListResponse<DispatchPlan>>(`/requests/dispatch-plans?${query.toString()}`);
  return result.data.data;
}

export async function getDispatchPlan(
  dispatchPlanCode: string,
  unitCode = getSelectedUnitCode(),
  locale = getSelectedLocale(),
): Promise<DispatchPlan> {
  const query = new URLSearchParams({ locale, unit_code: unitCode });
  const result = await apiGet<DetailResponse<DispatchPlan>>(
    `/requests/dispatch-plans/${dispatchPlanCode}?${query.toString()}`,
  );
  return result.data.data;
}

export async function saveDispatchPlan(
  dispatchPlanCode: string | undefined,
  payload: DispatchPlanPayload,
): Promise<DispatchPlan> {
  const result = dispatchPlanCode
    ? await apiPatch<DetailResponse<DispatchPlan>, DispatchPlanPayload>(
        `/requests/dispatch-plans/${dispatchPlanCode}`,
        payload,
      )
    : await apiPost<DetailResponse<DispatchPlan>, DispatchPlanPayload>("/requests/dispatch-plans", payload);
  return result.data.data;
}

export async function setDispatchPlanActive(
  dispatchPlanCode: string,
  unitCode: string,
  isActive: boolean,
  status?: string,
): Promise<DispatchPlan> {
  const result = await apiPatch<
    DetailResponse<DispatchPlan>,
    { unit_code: string; is_active: boolean; status?: string; updated_by_username?: string }
  >(`/requests/dispatch-plans/${dispatchPlanCode}/status`, {
    unit_code: unitCode,
    is_active: isActive,
    status,
  });
  return result.data.data;
}

export async function listDispatchRuns(params?: {
  dispatchPlanCode?: string;
  status?: string;
  unitCode?: string;
  limit?: number;
  offset?: number;
  locale?: string;
}): Promise<DispatchRun[]> {
  const query = new URLSearchParams({
    locale: params?.locale ?? getSelectedLocale(),
    unit_code: params?.unitCode ?? getSelectedUnitCode(),
    limit: String(params?.limit ?? 200),
    offset: String(params?.offset ?? 0),
  });
  if (params?.dispatchPlanCode) {
    query.set("dispatch_plan_code", params.dispatchPlanCode);
  }
  if (params?.status) {
    query.set("status", params.status);
  }

  const result = await apiGet<ListResponse<DispatchRun>>(`/requests/dispatch-runs?${query.toString()}`);
  return result.data.data;
}

export async function createDispatchRun(
  dispatchPlanCode: string,
  payload: DispatchRunPayload,
): Promise<DispatchRun> {
  const result = await apiPost<DetailResponse<DispatchRun>, DispatchRunPayload>(
    `/requests/dispatch-plans/${dispatchPlanCode}/runs`,
    payload,
  );
  return result.data.data;
}

export async function getDispatchRun(
  dispatchRunCode: string,
  unitCode = getSelectedUnitCode(),
  locale = getSelectedLocale(),
): Promise<DispatchRun> {
  const query = new URLSearchParams({ locale, unit_code: unitCode });
  const result = await apiGet<DetailResponse<DispatchRun>>(
    `/requests/dispatch-runs/${encodeURIComponent(dispatchRunCode)}?${query.toString()}`,
  );
  return result.data.data;
}

export async function resendDispatchRunNotification(
  dispatchRunCode: string,
  actionCode = "SEND_REQUEST",
  locale = getSelectedLocale(),
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<Record<string, unknown>>, Record<string, never>>(
    `/requests/dispatch-runs/${encodeURIComponent(dispatchRunCode)}/notifications/${encodeURIComponent(actionCode)}/resend?${query.toString()}`,
    {},
  );
  return result.data.data;
}

export async function reviewDispatchRunItemSubmission(
  dispatchRunCode: string,
  runItemCode: string,
  payload: {
    action: "APPROVE" | "RETURN";
    submission_version?: number | null;
    approval_level?: number | null;
    is_final_level?: boolean;
    comments?: string | null;
  },
  locale = getSelectedLocale(),
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<Record<string, unknown>>, typeof payload & { run_item_code: string }>(
    `/requests/dispatch-runs/${encodeURIComponent(dispatchRunCode)}/items/${encodeURIComponent(runItemCode)}/review?${query.toString()}`,
    { ...payload, run_item_code: runItemCode },
  );
  return result.data.data;
}

export async function publishDispatchRunItemSubmission(
  dispatchRunCode: string,
  runItemCode: string,
  payload: {
    submission_version?: number | null;
    generated_values?: Record<string, unknown>;
    publish_config?: Record<string, unknown>;
    publish_note?: string | null;
    published_by_username?: string | null;
  } = {},
  locale = getSelectedLocale(),
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<Record<string, unknown>>, typeof payload & { run_item_code: string }>(
    `/requests/dispatch-runs/${encodeURIComponent(dispatchRunCode)}/items/${encodeURIComponent(runItemCode)}/publish?${query.toString()}`,
    { ...payload, run_item_code: runItemCode },
  );
  return result.data.data;
}

export async function processNotificationEvents(params?: {
  limit?: number;
  sendEmail?: boolean;
  locale?: string;
}): Promise<Record<string, number>> {
  const query = new URLSearchParams({
    locale: params?.locale ?? getSelectedLocale(),
    limit: String(params?.limit ?? 25),
    send_email: String(params?.sendEmail ?? true),
  });
  const result = await apiPost<DetailResponse<Record<string, number>>, Record<string, never>>(
    `/requests/notifications/process?${query.toString()}`,
    {},
  );
  return result.data.data;
}

export type RequestAccessPreview = {
  dispatchRunCode?: string;
  runItemCode?: string;
  requestPeriod?: string;
  dueDate?: string;
  ministry?: string;
  department?: string;
  sourceOrganizationCode?: string;
  templateVersionCode?: string;
  indicatorCode?: string;
  indicatorName?: string;
  otpSettings?: {
    validityMinutes?: number;
    maxAttempts?: number;
    resendLimit?: number;
  };
};

export type RequestAccessAssignment = {
  runItemCode?: string;
  templateVersionCode?: string;
  indicatorCode?: string;
  indicatorNumber?: string;
  indicatorName?: string;
  indicatorLabel?: string;
  reportingPeriod?: string;
  ministry?: string;
  department?: string;
  periodicity?: string;
  uom?: string;
  timePeriodSetOverride?: Record<string, unknown>;
  measureCodes?: string[];
  measures?: Record<string, unknown>[];
  validations?: Record<string, unknown>[];
  template?: Record<string, unknown>;
  templateContract?: Record<string, unknown>;
  status?: string;
  latestSubmissionVersion?: string | number;
  lifecycleStatus?: string;
  validationStatus?: string;
  reviewStatus?: string;
  approvalStatus?: string;
  publicationStatus?: string;
};

export type RequestAccessOtpResponse = {
  otpSent?: boolean;
  expiresInMinutes?: number;
  resendLimit?: number;
  resendAllowedAt?: string;
};

export type RequestAccessVerified = {
  verified?: boolean;
  accessSession?: string;
  dispatch?: Record<string, unknown>;
  assignments?: RequestAccessAssignment[];
};

export type RequestAccessSessionDetail = {
  dispatch?: Record<string, unknown>;
  assignment?: RequestAccessAssignment;
  assignments?: RequestAccessAssignment[];
  dataEntry?: Record<string, unknown>;
  policy?: Record<string, unknown>;
};

export type RequestAccessDerivedTimePeriodSetPayload = {
  session: string;
  run_item_code?: string;
  original_set_code: string;
  derived_set_code?: string;
  periods: {
    time_period_code: string;
    label?: string;
    sort_order: number;
  }[];
};

export type RequestAccessDerivedTimePeriodSetDeactivatePayload = {
  session: string;
  run_item_code?: string;
  derived_set_code: string;
};

export async function previewRequestAccess(token: string, locale = getSelectedLocale()): Promise<RequestAccessPreview> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<RequestAccessPreview>, { token: string }>(
    `/requests/public/access/preview?${query.toString()}`,
    { token },
  );
  return result.data.data;
}

export async function sendRequestAccessOtp(
  token: string,
  locale = getSelectedLocale(),
): Promise<RequestAccessOtpResponse> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<RequestAccessOtpResponse>, { token: string }>(
    `/requests/public/access/otp?${query.toString()}`,
    { token },
  );
  return result.data.data;
}

export async function verifyRequestAccessOtp(
  token: string,
  otp: string,
  locale = getSelectedLocale(),
): Promise<RequestAccessVerified> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<RequestAccessVerified>, { token: string; otp: string }>(
    `/requests/public/access/verify?${query.toString()}`,
    { token, otp },
  );
  return result.data.data;
}

export async function getRequestAccessSession(
  session: string,
  runItemCode?: string,
  locale = getSelectedLocale(),
): Promise<RequestAccessSessionDetail> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<RequestAccessSessionDetail>, { session: string; run_item_code?: string }>(
    `/requests/public/access/session?${query.toString()}`,
    { session, run_item_code: runItemCode },
  );
  return result.data.data;
}

export async function saveRequestAccessDerivedTimePeriodSet(
  payload: RequestAccessDerivedTimePeriodSetPayload,
  locale = getSelectedLocale(),
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<Record<string, unknown>>, RequestAccessDerivedTimePeriodSetPayload>(
    `/requests/public/access/derived-time-period-set?${query.toString()}`,
    payload,
  );
  return result.data.data;
}

export async function deactivateRequestAccessDerivedTimePeriodSet(
  payload: RequestAccessDerivedTimePeriodSetDeactivatePayload,
  locale = getSelectedLocale(),
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<Record<string, unknown>>, RequestAccessDerivedTimePeriodSetDeactivatePayload>(
    `/requests/public/access/derived-time-period-set/deactivate?${query.toString()}`,
    payload,
  );
  return result.data.data;
}

export type RequestAccessDataEntryPayload = {
  session: string;
  run_item_code?: string;
  values: Record<string, string>;
  remarks: Record<string, string>;
  attachments: Record<string, unknown>[];
  validation_summary: Record<string, unknown>;
  structure_overrides: Record<string, unknown>;
  submission_note?: string;
  certification?: Record<string, unknown>;
};

export async function saveRequestAccessDataEntryDraft(
  payload: RequestAccessDataEntryPayload,
  locale = getSelectedLocale(),
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<Record<string, unknown>>, RequestAccessDataEntryPayload>(
    `/requests/public/access/data-entry/draft?${query.toString()}`,
    payload,
  );
  return result.data.data;
}

export async function submitRequestAccessDataEntry(
  payload: RequestAccessDataEntryPayload,
  locale = getSelectedLocale(),
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ locale });
  const result = await apiPost<DetailResponse<Record<string, unknown>>, RequestAccessDataEntryPayload>(
    `/requests/public/access/data-entry/submit?${query.toString()}`,
    payload,
  );
  return result.data.data;
}

export function createDefaultEmailTemplate(unitCode = getSelectedUnitCode()): EmailTemplatePayload {
  return {
    template_name: "Initial data request",
    template_type: "SEND_REQUEST",
    unit_code: unitCode,
    scope_type: "GLOBAL",
    template_version_code: null,
    source_organization_code: null,
    subject: "Data request: {template_name} for {request_period}",
    body:
      "Dear {officer_name},\n\n" +
      "Please submit data for {template_name} ({indicator_number} - {indicator_name}) for {request_period}.\n\n" +
      "Due date: {due_date}\n\n" +
      "Open your assignment here: {submission_link}\n\n" +
      "Regards,\nSSD Enterprise Portal",
    variables: [
      "officer_name",
      "template_name",
      "indicator_number",
      "indicator_name",
      "request_period",
      "due_date",
      "submission_link",
    ],
    is_default: false,
    is_active: true,
  };
}

export async function listEmailTemplates(params?: {
  templateType?: string;
  unitCode?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
  locale?: string;
}): Promise<EmailTemplate[]> {
  const query = new URLSearchParams({
    locale: params?.locale ?? getSelectedLocale(),
    unit_code: params?.unitCode ?? getSelectedUnitCode(),
    include_inactive: String(params?.includeInactive ?? true),
    limit: String(params?.limit ?? 200),
    offset: String(params?.offset ?? 0),
  });
  if (params?.templateType) {
    query.set("template_type", params.templateType);
  }

  const result = await apiGet<ListResponse<EmailTemplate>>(`/requests/email-templates?${query.toString()}`);
  return result.data.data;
}

export async function saveEmailTemplate(
  emailTemplateCode: string | undefined,
  payload: EmailTemplatePayload,
): Promise<EmailTemplate> {
  const result = emailTemplateCode
    ? await apiPatch<DetailResponse<EmailTemplate>, EmailTemplatePayload>(
        `/requests/email-templates/${emailTemplateCode}`,
        payload,
      )
    : await apiPost<DetailResponse<EmailTemplate>, EmailTemplatePayload>("/requests/email-templates", payload);
  return result.data.data;
}

export async function setEmailTemplateActive(
  emailTemplateCode: string,
  unitCode: string,
  isActive: boolean,
): Promise<EmailTemplate> {
  const result = await apiPatch<
    DetailResponse<EmailTemplate>,
    { unit_code: string; is_active: boolean; updated_by_username?: string }
  >(`/requests/email-templates/${emailTemplateCode}/status`, {
    unit_code: unitCode,
    is_active: isActive,
  });
  return result.data.data;
}

export function createDefaultNotificationRule(unitCode = getSelectedUnitCode()): NotificationRulePayload {
  return {
    rule_name: "",
    action_code: "SEND_REQUEST",
    unit_code: unitCode,
    scope_type: "GLOBAL",
    template_version_code: null,
    source_organization_code: null,
    email_template_code: null,
    template_type: "SEND_REQUEST",
    sender_type: "SYSTEM_MAILBOX",
    sender_email: null,
    receiver_rules: { to: ["SOURCE_OFFICERS"], cc: [], bcc: [] },
    trigger_rules: { trigger: "MANUAL_SEND" },
    applies_to_statuses: ["READY"],
    approval_level: null,
    sort_order: 0,
    is_default: false,
    is_active: true,
  };
}

export async function listNotificationRules(params?: {
  actionCode?: string;
  unitCode?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
  locale?: string;
}): Promise<NotificationRule[]> {
  const query = new URLSearchParams({
    locale: params?.locale ?? getSelectedLocale(),
    unit_code: params?.unitCode ?? getSelectedUnitCode(),
    include_inactive: String(params?.includeInactive ?? true),
    limit: String(params?.limit ?? 200),
    offset: String(params?.offset ?? 0),
  });
  if (params?.actionCode) {
    query.set("action_code", params.actionCode);
  }

  const result = await apiGet<ListResponse<NotificationRule>>(`/requests/notification-rules?${query.toString()}`);
  return result.data.data;
}

export async function saveNotificationRule(
  notificationRuleCode: string | undefined,
  payload: NotificationRulePayload,
): Promise<NotificationRule> {
  const result = notificationRuleCode
    ? await apiPatch<DetailResponse<NotificationRule>, NotificationRulePayload>(
        `/requests/notification-rules/${notificationRuleCode}`,
        payload,
      )
    : await apiPost<DetailResponse<NotificationRule>, NotificationRulePayload>("/requests/notification-rules", payload);
  return result.data.data;
}

export async function setNotificationRuleActive(
  notificationRuleCode: string,
  unitCode: string,
  isActive: boolean,
): Promise<NotificationRule> {
  const result = await apiPatch<
    DetailResponse<NotificationRule>,
    { unit_code: string; is_active: boolean; updated_by_username?: string }
  >(`/requests/notification-rules/${notificationRuleCode}/status`, {
    unit_code: unitCode,
    is_active: isActive,
  });
  return result.data.data;
}

export async function listNotificationReceiverGroups(params?: {
  includeInactive?: boolean;
  locale?: string;
}): Promise<NotificationReceiverGroup[]> {
  const query = new URLSearchParams({
    locale: params?.locale ?? getSelectedLocale(),
    include_inactive: String(params?.includeInactive ?? false),
  });
  const result = await apiGet<ListResponse<NotificationReceiverGroup>>(
    `/requests/notification-receiver-groups?${query.toString()}`,
  );
  return result.data.data;
}
