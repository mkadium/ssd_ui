import { apiRequest } from "@/api/client";
import type {
  IngestionAcceptedResponse,
  IngestionDetailResponse,
  IngestionListResponse,
  IngestionSubmissionItem,
  IngestionSubmissionPayload,
  IngestionVersionItem,
} from "@/types/ingestion";

const buildParams = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

export const ingestionService = {
  listSubmissions: ({
    locale,
    unitCode,
    status,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    unitCode?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiRequest<IngestionListResponse<IngestionSubmissionItem>>(
      `/ingestion/submissions?${buildParams({ locale, unit_code: unitCode, status, limit, offset })}`,
    ),

  getSubmission: ({ submissionCode, locale, unitCode }: { submissionCode: string; locale: string; unitCode?: string }) =>
    apiRequest<IngestionDetailResponse<IngestionSubmissionItem>>(
      `/ingestion/submissions/${encodeURIComponent(submissionCode)}?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  listSubmissionVersions: ({ submissionCode, locale, unitCode }: { submissionCode: string; locale: string; unitCode?: string }) =>
    apiRequest<IngestionListResponse<IngestionVersionItem>>(
      `/ingestion/submissions/${encodeURIComponent(submissionCode)}/versions?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  listManifests: ({ versionCode, locale, unitCode }: { versionCode: string; locale: string; unitCode?: string }) =>
    apiRequest<IngestionListResponse<Record<string, unknown>>>(
      `/ingestion/versions/${encodeURIComponent(versionCode)}/manifests?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  listJobs: ({ versionCode, locale, unitCode }: { versionCode: string; locale: string; unitCode?: string }) =>
    apiRequest<IngestionListResponse<Record<string, unknown>>>(
      `/ingestion/versions/${encodeURIComponent(versionCode)}/jobs?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  listRuns: ({ versionCode, locale, unitCode }: { versionCode: string; locale: string; unitCode?: string }) =>
    apiRequest<IngestionListResponse<Record<string, unknown>>>(
      `/ingestion/versions/${encodeURIComponent(versionCode)}/runs?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  listStagedRecords: ({ versionCode, locale, unitCode }: { versionCode: string; locale: string; unitCode?: string }) =>
    apiRequest<IngestionListResponse<Record<string, unknown>>>(
      `/ingestion/versions/${encodeURIComponent(versionCode)}/staged-records?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  listStagedRecordDimensions: ({ recordCode, locale, unitCode }: { recordCode: string; locale: string; unitCode?: string }) =>
    apiRequest<IngestionListResponse<Record<string, unknown>>>(
      `/ingestion/staged-records/${encodeURIComponent(recordCode)}/dimensions?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  submit: ({ payload }: { payload: IngestionSubmissionPayload }) =>
    apiRequest<IngestionAcceptedResponse>("/ingestion/submissions", {
      method: "POST",
      json: payload,
    }),
};
