import { apiRequest } from "@/api/client";
import type {
  TemplateAxisMemberRequest,
  TemplateAxisRequest,
  TemplateActiveRequest,
  TemplateBindingGroupRequest,
  TemplateCellAxisMembersRequest,
  TemplateCellRequest,
  TemplateDefinitionDetail,
  TemplateDefinitionListItem,
  TemplateDefinitionRequest,
  TemplateDetailResponse,
  TemplateListResponse,
  TemplateMeasureRequest,
  TemplatePublishRequest,
  TemplateRenderContract,
  TemplateRenderElementRequest,
  TemplateValidationRuleRefRequest,
  TemplateVersionListItem,
  TemplateVersionRequest,
} from "@/types/templates";

export const templatesService = {
  listTemplates: async ({
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
  }): Promise<TemplateListResponse<TemplateDefinitionListItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    if (status) {
      params.set("status", status);
    }

    return apiRequest<TemplateListResponse<TemplateDefinitionListItem>>(
      `/templates?${params.toString()}`,
    );
  },

  getTemplate: async ({
    templateCode,
    locale,
    unitCode,
  }: {
    templateCode: string;
    locale: string;
    unitCode?: string;
  }): Promise<TemplateDetailResponse<TemplateDefinitionDetail>> => {
    const params = new URLSearchParams({ locale });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<TemplateDetailResponse<TemplateDefinitionDetail>>(
      `/templates/${encodeURIComponent(templateCode)}?${params.toString()}`,
    );
  },

  listTemplateVersions: async ({
    templateCode,
    locale,
    unitCode,
  }: {
    templateCode: string;
    locale: string;
    unitCode?: string;
  }): Promise<TemplateListResponse<TemplateVersionListItem>> => {
    const params = new URLSearchParams({ locale });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<TemplateListResponse<TemplateVersionListItem>>(
      `/templates/${encodeURIComponent(templateCode)}/versions?${params.toString()}`,
    );
  },

  getTemplateVersion: async ({
    versionCode,
    locale,
    unitCode,
  }: {
    versionCode: string;
    locale: string;
    unitCode?: string;
  }): Promise<TemplateDetailResponse<TemplateVersionListItem>> => {
    const params = new URLSearchParams({ locale });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<TemplateDetailResponse<TemplateVersionListItem>>(
      `/templates/versions/${encodeURIComponent(versionCode)}?${params.toString()}`,
    );
  },

  getRenderContract: async ({
    versionCode,
    locale,
    unitCode,
  }: {
    versionCode: string;
    locale: string;
    unitCode?: string;
  }): Promise<TemplateDetailResponse<TemplateRenderContract>> => {
    const params = new URLSearchParams({ locale });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<TemplateDetailResponse<TemplateRenderContract>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/render-contract?${params.toString()}`,
    );
  },

  upsertTemplate: async ({
    locale,
    payload,
    templateCode,
    method = "POST",
  }: {
    locale: string;
    payload: TemplateDefinitionRequest;
    templateCode?: string;
    method?: "POST" | "PATCH";
  }): Promise<TemplateDetailResponse<TemplateDefinitionListItem>> => {
    const params = new URLSearchParams({ locale });
    const path = templateCode ? `/templates/${encodeURIComponent(templateCode)}` : "/templates";

    return apiRequest<TemplateDetailResponse<TemplateDefinitionListItem>>(
      `${path}?${params.toString()}`,
      { method, json: payload },
    );
  },

  upsertTemplateVersion: async ({
    locale,
    templateCode,
    versionCode,
    payload,
    method = "POST",
  }: {
    locale: string;
    templateCode: string;
    versionCode?: string;
    payload: TemplateVersionRequest;
    method?: "POST" | "PATCH";
  }): Promise<TemplateDetailResponse<TemplateVersionListItem>> => {
    const params = new URLSearchParams({ locale });
    const versionPath = versionCode ? `/${encodeURIComponent(versionCode)}` : "";

    return apiRequest<TemplateDetailResponse<TemplateVersionListItem>>(
      `/templates/${encodeURIComponent(templateCode)}/versions${versionPath}?${params.toString()}`,
      { method, json: payload },
    );
  },

  publishTemplateVersion: async ({
    locale,
    versionCode,
    payload,
  }: {
    locale: string;
    versionCode: string;
    payload: TemplatePublishRequest;
  }): Promise<TemplateDetailResponse<TemplateVersionListItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<TemplateVersionListItem>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/publish?${params.toString()}`,
      { method: "POST", json: payload },
    );
  },

  deactivateTemplate: async ({
    locale,
    templateCode,
    payload,
  }: {
    locale: string;
    templateCode: string;
    payload: TemplateActiveRequest;
  }): Promise<TemplateDetailResponse<TemplateDefinitionListItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<TemplateDefinitionListItem>>(
      `/templates/${encodeURIComponent(templateCode)}?${params.toString()}`,
      { method: "DELETE", json: payload },
    );
  },

  restoreTemplate: async ({
    locale,
    templateCode,
    payload,
  }: {
    locale: string;
    templateCode: string;
    payload: TemplateActiveRequest;
  }): Promise<TemplateDetailResponse<TemplateDefinitionListItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<TemplateDefinitionListItem>>(
      `/templates/${encodeURIComponent(templateCode)}/restore?${params.toString()}`,
      { method: "POST", json: payload },
    );
  },

  upsertMeasure: async ({
    locale,
    versionCode,
    payload,
  }: {
    locale: string;
    versionCode: string;
    payload: TemplateMeasureRequest;
  }) => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<Record<string, unknown>>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/measures?${params.toString()}`,
      { method: "POST", json: payload },
    );
  },

  upsertAxis: async ({
    locale,
    versionCode,
    payload,
  }: {
    locale: string;
    versionCode: string;
    payload: TemplateAxisRequest;
  }) => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<Record<string, unknown>>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/axes?${params.toString()}`,
      { method: "POST", json: payload },
    );
  },

  upsertAxisMember: async ({
    locale,
    versionCode,
    axisCode,
    payload,
  }: {
    locale: string;
    versionCode: string;
    axisCode: string;
    payload: TemplateAxisMemberRequest;
  }) => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<Record<string, unknown>>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/axes/${encodeURIComponent(axisCode)}/members?${params.toString()}`,
      { method: "POST", json: payload },
    );
  },

  upsertBindingGroup: async ({
    locale,
    versionCode,
    payload,
  }: {
    locale: string;
    versionCode: string;
    payload: TemplateBindingGroupRequest;
  }) => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<Record<string, unknown>>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/binding-groups?${params.toString()}`,
      { method: "POST", json: payload },
    );
  },

  upsertCell: async ({
    locale,
    versionCode,
    payload,
  }: {
    locale: string;
    versionCode: string;
    payload: TemplateCellRequest;
  }) => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<Record<string, unknown>>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/cells?${params.toString()}`,
      { method: "POST", json: payload },
    );
  },

  replaceCellAxisMembers: async ({
    locale,
    versionCode,
    cellCode,
    payload,
  }: {
    locale: string;
    versionCode: string;
    cellCode: string;
    payload: TemplateCellAxisMembersRequest;
  }) => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<Record<string, unknown>>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/cells/${encodeURIComponent(cellCode)}/axis-members?${params.toString()}`,
      { method: "PUT", json: payload },
    );
  },

  upsertRenderElement: async ({
    locale,
    versionCode,
    payload,
  }: {
    locale: string;
    versionCode: string;
    payload: TemplateRenderElementRequest;
  }) => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<Record<string, unknown>>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/render-elements?${params.toString()}`,
      { method: "POST", json: payload },
    );
  },

  upsertValidationRuleRef: async ({
    locale,
    versionCode,
    payload,
  }: {
    locale: string;
    versionCode: string;
    payload: TemplateValidationRuleRefRequest;
  }) => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<Record<string, unknown>>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/validation-rule-refs?${params.toString()}`,
      { method: "POST", json: payload },
    );
  },
};
