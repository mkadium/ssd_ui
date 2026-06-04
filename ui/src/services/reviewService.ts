import { apiRequest } from "@/api/client";
import type { ApiDetailResponse, ApiListResponse, ReviewActionRequest, ReviewApprovalRequest, WorkflowRecord } from "@/types/workflow";

const params = (values: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
};

export const reviewService = {
  listTasks: ({ locale, unitCode, status }: { locale: string; unitCode?: string; status?: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/review/tasks?${params({ locale, unit_code: unitCode, status })}`),

  getTask: ({ locale, unitCode, taskCode }: { locale: string; unitCode?: string; taskCode: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/review/tasks/${encodeURIComponent(taskCode)}?${params({ locale, unit_code: unitCode })}`),

  getPreviousApproved: ({ locale, unitCode, taskCode }: { locale: string; unitCode?: string; taskCode: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/review/tasks/${encodeURIComponent(taskCode)}/previous-approved?${params({ locale, unit_code: unitCode })}`),

  listActions: ({ locale, unitCode, taskCode }: { locale: string; unitCode?: string; taskCode: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/review/tasks/${encodeURIComponent(taskCode)}/actions?${params({ locale, unit_code: unitCode })}`),

  listApprovals: ({ locale, unitCode, taskCode }: { locale: string; unitCode?: string; taskCode: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/review/tasks/${encodeURIComponent(taskCode)}/approvals?${params({ locale, unit_code: unitCode })}`),

  createAction: ({ locale, taskCode, payload }: { locale: string; taskCode: string; payload: ReviewActionRequest }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/review/tasks/${encodeURIComponent(taskCode)}/actions?${params({ locale })}`, {
      method: "POST",
      json: payload,
    }),

  createApproval: ({ locale, taskCode, payload }: { locale: string; taskCode: string; payload: ReviewApprovalRequest }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/review/tasks/${encodeURIComponent(taskCode)}/approvals?${params({ locale })}`, {
      method: "POST",
      json: payload,
    }),
};
