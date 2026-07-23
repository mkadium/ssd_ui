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

type ListResponse = {
  data: DispatchPolicy[];
  count: number;
  locale: string;
};

type DetailResponse = {
  data: DispatchPolicy;
  locale: string;
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

  const result = await apiGet<ListResponse>(`/requests/dispatch-policies?${query.toString()}`);
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

  const result = await apiGet<DetailResponse>(`/requests/dispatch-policies/effective?${query.toString()}`);
  return result.data.data;
}

export async function saveDispatchPolicy(
  policyCode: string | undefined,
  payload: DispatchPolicyPayload,
): Promise<DispatchPolicy> {
  const result = policyCode
    ? await apiPatch<DetailResponse, DispatchPolicyPayload>(`/requests/dispatch-policies/${policyCode}`, payload)
    : await apiPost<DetailResponse, DispatchPolicyPayload>("/requests/dispatch-policies", payload);
  return result.data.data;
}

export async function setDispatchPolicyActive(
  policyCode: string,
  unitCode: string,
  isActive: boolean,
): Promise<DispatchPolicy> {
  const result = await apiPatch<
    DetailResponse,
    { unit_code: string; is_active: boolean; updated_by_username?: string }
  >(`/requests/dispatch-policies/${policyCode}/status`, {
    unit_code: unitCode,
    is_active: isActive,
  });
  return result.data.data;
}
