import { apiRequest } from "@/api/client";
import type { ApiDetailResponse, ApiListResponse, WorkflowRecord } from "@/types/workflow";

const params = (values: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
};

export const validationService = {
  listRuns: ({ locale, unitCode, status }: { locale: string; unitCode?: string; status?: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/validation/runs?${params({ locale, unit_code: unitCode, status })}`),

  listRunsForSubmissionVersion: ({ locale, unitCode, versionCode }: { locale: string; unitCode?: string; versionCode: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/validation/submission-versions/${encodeURIComponent(versionCode)}/runs?${params({ locale, unit_code: unitCode })}`),

  executeSubmissionVersion: ({ locale, versionCode, payload }: { locale: string; versionCode: string; payload: WorkflowRecord }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/validation/submission-versions/${encodeURIComponent(versionCode)}/execute?${params({ locale })}`, {
      method: "POST",
      json: payload,
    }),

  executeRun: ({ locale, runCode, payload }: { locale: string; runCode: string; payload: WorkflowRecord }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/validation/runs/${encodeURIComponent(runCode)}/execute?${params({ locale })}`, {
      method: "POST",
      json: payload,
    }),

  getRun: ({ locale, unitCode, runCode }: { locale: string; unitCode?: string; runCode: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/validation/runs/${encodeURIComponent(runCode)}?${params({ locale, unit_code: unitCode })}`),

  getSummary: ({ locale, unitCode, runCode }: { locale: string; unitCode?: string; runCode: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/validation/runs/${encodeURIComponent(runCode)}/summary?${params({ locale, unit_code: unitCode })}`),

  listResults: ({ locale, unitCode, runCode }: { locale: string; unitCode?: string; runCode: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/validation/runs/${encodeURIComponent(runCode)}/results?${params({ locale, unit_code: unitCode })}`),

  getReport: ({ locale, unitCode, runCode }: { locale: string; unitCode?: string; runCode: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/validation/runs/${encodeURIComponent(runCode)}/report?${params({ locale, unit_code: unitCode })}`),

  getComparison: ({ locale, unitCode, resultCode }: { locale: string; unitCode?: string; resultCode: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/validation/results/${encodeURIComponent(resultCode)}/comparison?${params({ locale, unit_code: unitCode })}`),
};
