import { apiRequest } from "@/api/client";
import type {
  DimensionDefinitionItem,
  DimensionDetailResponse,
  DimensionListResponse,
  DimensionMemberItem,
  DimensionMemberSetItem,
  DimensionMemberSetMemberItem,
  DimensionsHealthResponse,
  GeographyItem,
  TimePeriodItem,
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
};
