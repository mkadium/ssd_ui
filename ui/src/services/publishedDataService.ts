import { apiRequest } from "@/api/client";
import type { ApiDetailResponse, ApiListResponse, WorkflowRecord } from "@/types/workflow";

const params = (values: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
};

type ObservationFilters = {
  locale: string;
  unitCode?: string;
  nationalIndicatorCode?: string;
  sourceOrganizationCode?: string;
  measureCode?: string;
  timePeriodMemberCode?: string;
};

export const publishedDataService = {
  getSnapshot: ({ locale, unitCode, snapshotCode }: { locale: string; unitCode?: string; snapshotCode: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/published-data/snapshots/${encodeURIComponent(snapshotCode)}?${params({ locale, unit_code: unitCode })}`),

  listLatestObservations: ({ locale, unitCode, nationalIndicatorCode, sourceOrganizationCode, measureCode, timePeriodMemberCode }: ObservationFilters) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(
      `/published-data/observations/latest?${params({
        locale,
        unit_code: unitCode,
        national_indicator_code: nationalIndicatorCode,
        source_organization_code: sourceOrganizationCode,
        measure_code: measureCode,
        time_period_member_code: timePeriodMemberCode,
      })}`,
    ),

  getPreviousApprovedForStagedRecord: ({ locale, unitCode, recordCode }: { locale: string; unitCode?: string; recordCode: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/published-data/staged-records/${encodeURIComponent(recordCode)}/previous-approved?${params({ locale, unit_code: unitCode })}`),
};
