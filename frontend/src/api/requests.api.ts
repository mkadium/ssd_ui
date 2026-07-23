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
  scheduleStartDate?: string | null;
  dueDate?: string | null;
  itemCount?: number;
  dispatchStartedAt?: string | null;
  dispatchCompletedAt?: string | null;
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
