import { apiRequest } from "@/api/client";
import type {
  DimensionDefinitionItem,
  DimensionMemberRequest,
  DimensionMemberRelationshipRequest,
  DimensionDetailResponse,
  DimensionListResponse,
  DimensionMemberItem,
  DimensionMemberRelationshipItem,
  DimensionMemberRollupRuleItem,
  DimensionMemberSetItem,
  DimensionMemberSetRequest,
  DimensionMemberSetMemberItem,
  DimensionMemberSetItemRequest,
  DimensionRequest,
  DimensionsHealthResponse,
  GeographyLevelItem,
  GeographyItem,
  GeographyRequest,
  TimeFrequencyItem,
  TimePeriodItem,
  TimePeriodRequest,
} from "@/types/dimensions";

export const dimensionsService = {
  getHealth: async (): Promise<DimensionsHealthResponse> => {
    return apiRequest<DimensionsHealthResponse>("/dimensions/health", { auth: false });
  },

  listDimensions: async ({
    locale,
  }: {
    locale: string;
  }): Promise<DimensionListResponse<DimensionDefinitionItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionListResponse<DimensionDefinitionItem>>(
      `/dimensions?${params.toString()}`,
    );
  },

  getDimension: async ({
    dimensionCode,
    locale,
  }: {
    dimensionCode: string;
    locale: string;
  }): Promise<DimensionDetailResponse<DimensionDefinitionItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<DimensionDefinitionItem>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}?${params.toString()}`,
    );
  },

  createDimension: async ({
    locale,
    body,
  }: {
    locale: string;
    body: DimensionRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateDimension: async ({
    dimensionCode,
    locale,
    body,
  }: {
    dimensionCode: string;
    locale: string;
    body: DimensionRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  setDimensionActive: async ({
    dimensionCode,
    locale,
    active,
  }: {
    dimensionCode: string;
    locale: string;
    active: boolean;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });
    const path = active
      ? `/dimensions/${encodeURIComponent(dimensionCode)}/restore`
      : `/dimensions/${encodeURIComponent(dimensionCode)}`;

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `${path}?${params.toString()}`,
      { method: active ? "POST" : "DELETE" },
    );
  },

  listMembers: async ({
    dimensionCode,
    locale,
    parentMemberCode,
    limit = 500,
    offset = 0,
  }: {
    dimensionCode: string;
    locale: string;
    parentMemberCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<DimensionListResponse<DimensionMemberItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    if (parentMemberCode) {
      params.set("parent_member_code", parentMemberCode);
    }

    return apiRequest<DimensionListResponse<DimensionMemberItem>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}/members?${params.toString()}`,
    );
  },

  createMember: async ({
    dimensionCode,
    locale,
    body,
  }: {
    dimensionCode: string;
    locale: string;
    body: DimensionMemberRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}/members?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateMember: async ({
    dimensionCode,
    memberCode,
    locale,
    body,
  }: {
    dimensionCode: string;
    memberCode: string;
    locale: string;
    body: DimensionMemberRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}/members/${encodeURIComponent(memberCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  setMemberActive: async ({
    dimensionCode,
    memberCode,
    locale,
    active,
  }: {
    dimensionCode: string;
    memberCode: string;
    locale: string;
    active: boolean;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });
    const path = active
      ? `/dimensions/${encodeURIComponent(dimensionCode)}/members/${encodeURIComponent(memberCode)}/restore`
      : `/dimensions/${encodeURIComponent(dimensionCode)}/members/${encodeURIComponent(memberCode)}`;

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `${path}?${params.toString()}`,
      { method: active ? "POST" : "DELETE" },
    );
  },

  createMemberRelationship: async ({
    dimensionCode,
    locale,
    body,
  }: {
    dimensionCode: string;
    locale: string;
    body: DimensionMemberRelationshipRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}/member-relationships?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  listMemberRelationships: async ({
    dimensionCode,
    locale,
    limit = 500,
    offset = 0,
  }: {
    dimensionCode: string;
    locale: string;
    limit?: number;
    offset?: number;
  }): Promise<DimensionListResponse<DimensionMemberRelationshipItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    return apiRequest<DimensionListResponse<DimensionMemberRelationshipItem>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}/member-relationships?${params.toString()}`,
    );
  },

  listMemberSets: async ({
    locale,
    dimensionCode,
  }: {
    locale: string;
    dimensionCode?: string;
  }): Promise<DimensionListResponse<DimensionMemberSetItem>> => {
    const params = new URLSearchParams({ locale });

    if (dimensionCode) {
      params.set("dimension_code", dimensionCode);
    }

    return apiRequest<DimensionListResponse<DimensionMemberSetItem>>(
      `/dimensions/member-sets?${params.toString()}`,
    );
  },

  createMemberSet: async ({
    dimensionCode,
    locale,
    body,
  }: {
    dimensionCode: string;
    locale: string;
    body: DimensionMemberSetRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}/member-sets?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateMemberSet: async ({
    dimensionCode,
    setCode,
    locale,
    body,
  }: {
    dimensionCode: string;
    setCode: string;
    locale: string;
    body: DimensionMemberSetRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}/member-sets/${encodeURIComponent(setCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  setMemberSetActive: async ({
    dimensionCode,
    setCode,
    locale,
    active,
  }: {
    dimensionCode: string;
    setCode: string;
    locale: string;
    active: boolean;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });
    const path = active
      ? `/dimensions/${encodeURIComponent(dimensionCode)}/member-sets/${encodeURIComponent(setCode)}/restore`
      : `/dimensions/${encodeURIComponent(dimensionCode)}/member-sets/${encodeURIComponent(setCode)}`;

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `${path}?${params.toString()}`,
      { method: active ? "POST" : "DELETE" },
    );
  },

  listMemberSetMembers: async ({
    setCode,
    locale,
    limit = 500,
    offset = 0,
  }: {
    setCode: string;
    locale: string;
    limit?: number;
    offset?: number;
  }): Promise<DimensionListResponse<DimensionMemberSetMemberItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    return apiRequest<DimensionListResponse<DimensionMemberSetMemberItem>>(
      `/dimensions/member-sets/${encodeURIComponent(setCode)}/members?${params.toString()}`,
    );
  },

  createMemberSetMember: async ({
    setCode,
    locale,
    body,
  }: {
    setCode: string;
    locale: string;
    body: DimensionMemberSetItemRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/member-sets/${encodeURIComponent(setCode)}/members?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateMemberSetMember: async ({
    setCode,
    memberCode,
    locale,
    body,
  }: {
    setCode: string;
    memberCode: string;
    locale: string;
    body: DimensionMemberSetItemRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/member-sets/${encodeURIComponent(setCode)}/members/${encodeURIComponent(memberCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  listGeographyLevels: async ({
    locale,
  }: {
    locale: string;
  }): Promise<DimensionListResponse<GeographyLevelItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionListResponse<GeographyLevelItem>>(
      `/dimensions/geography-levels?${params.toString()}`,
    );
  },

  listGeographies: async ({
    locale,
    parentGeographyCode,
    levelCode,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    parentGeographyCode?: string;
    levelCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<DimensionListResponse<GeographyItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    if (parentGeographyCode) {
      params.set("parent_geography_code", parentGeographyCode);
    }

    if (levelCode) {
      params.set("level_code", levelCode);
    }

    return apiRequest<DimensionListResponse<GeographyItem>>(
      `/dimensions/geographies?${params.toString()}`,
    );
  },

  getGeography: async ({
    geographyCode,
    locale,
  }: {
    geographyCode: string;
    locale: string;
  }): Promise<DimensionDetailResponse<GeographyItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<GeographyItem>>(
      `/dimensions/geographies/${encodeURIComponent(geographyCode)}?${params.toString()}`,
    );
  },

  createGeography: async ({
    locale,
    body,
  }: {
    locale: string;
    body: GeographyRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/geographies?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateGeography: async ({
    geographyCode,
    locale,
    body,
  }: {
    geographyCode: string;
    locale: string;
    body: GeographyRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/geographies/${encodeURIComponent(geographyCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  setGeographyActive: async ({
    geographyCode,
    locale,
    active,
  }: {
    geographyCode: string;
    locale: string;
    active: boolean;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });
    const path = active
      ? `/dimensions/geographies/${encodeURIComponent(geographyCode)}/restore`
      : `/dimensions/geographies/${encodeURIComponent(geographyCode)}`;

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `${path}?${params.toString()}`,
      { method: active ? "POST" : "DELETE" },
    );
  },

  listTimeFrequencies: async ({
    locale,
  }: {
    locale: string;
  }): Promise<DimensionListResponse<TimeFrequencyItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionListResponse<TimeFrequencyItem>>(
      `/dimensions/time-frequencies?${params.toString()}`,
    );
  },

  listTimePeriods: async ({
    locale,
    frequencyCode,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    frequencyCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<DimensionListResponse<TimePeriodItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    if (frequencyCode) {
      params.set("frequency_code", frequencyCode);
    }

    return apiRequest<DimensionListResponse<TimePeriodItem>>(
      `/dimensions/time-periods?${params.toString()}`,
    );
  },

  getTimePeriod: async ({
    timePeriodCode,
    locale,
  }: {
    timePeriodCode: string;
    locale: string;
  }): Promise<DimensionDetailResponse<TimePeriodItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<TimePeriodItem>>(
      `/dimensions/time-periods/${encodeURIComponent(timePeriodCode)}?${params.toString()}`,
    );
  },

  createTimePeriod: async ({
    locale,
    body,
  }: {
    locale: string;
    body: TimePeriodRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/time-periods?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateTimePeriod: async ({
    timePeriodCode,
    locale,
    body,
  }: {
    timePeriodCode: string;
    locale: string;
    body: TimePeriodRequest;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `/dimensions/time-periods/${encodeURIComponent(timePeriodCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  setTimePeriodActive: async ({
    timePeriodCode,
    locale,
    active,
  }: {
    timePeriodCode: string;
    locale: string;
    active: boolean;
  }): Promise<DimensionDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });
    const path = active
      ? `/dimensions/time-periods/${encodeURIComponent(timePeriodCode)}/restore`
      : `/dimensions/time-periods/${encodeURIComponent(timePeriodCode)}`;

    return apiRequest<DimensionDetailResponse<Record<string, unknown>>>(
      `${path}?${params.toString()}`,
      { method: active ? "POST" : "DELETE" },
    );
  },

  listRollupRules: async ({
    dimensionCode,
    locale,
    limit = 500,
    offset = 0,
  }: {
    dimensionCode: string;
    locale: string;
    limit?: number;
    offset?: number;
  }): Promise<DimensionListResponse<DimensionMemberRollupRuleItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    return apiRequest<DimensionListResponse<DimensionMemberRollupRuleItem>>(
      `/dimensions/${encodeURIComponent(dimensionCode)}/rollup-rules?${params.toString()}`,
    );
  },
};
