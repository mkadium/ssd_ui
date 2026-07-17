import { apiGet, apiPatch, apiPost } from "./http-client";
import { getSelectedLocale, getSelectedUnitCode } from "./session.api";

export type MetadataListResponse<T> = {
  data: T[];
  locale: string;
  count: number;
};

export type MasterRecord = Record<string, unknown>;

export type MasterListOptions = {
  endpoint: string;
  includeUnit?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
};

export type MasterMutationOptions = {
  endpoint: string;
  code?: string;
  payload: MasterRecord;
  patchPath?: string;
};

export async function listMasterRecords({ endpoint, includeUnit = false, params = {} }: MasterListOptions) {
  const query = new URLSearchParams({
    locale: getSelectedLocale(),
    limit: "500",
    offset: "0",
  });

  if (includeUnit) {
    query.set("unit_code", getSelectedUnitCode());
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  const result = await apiGet<MetadataListResponse<MasterRecord>>(`${endpoint}?${query}`);
  return result.data;
}

export async function createMasterRecord({ endpoint, payload }: MasterMutationOptions) {
  const query = new URLSearchParams({ locale: getSelectedLocale() });
  const result = await apiPost<{ data: MasterRecord; locale: string }, MasterRecord>(`${endpoint}?${query}`, payload);
  return result.data.data;
}

export async function updateMasterRecord({ endpoint, payload, patchPath }: MasterMutationOptions) {
  const query = new URLSearchParams({ locale: getSelectedLocale() });
  const result = await apiPatch<{ data: MasterRecord; locale: string }, MasterRecord>(`${patchPath ?? endpoint}?${query}`, payload);
  return result.data.data;
}
