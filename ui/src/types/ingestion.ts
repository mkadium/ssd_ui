export type IngestionListResponse<T> = {
  data: T[];
  locale: string;
  count: number;
};

export type IngestionDetailResponse<T> = {
  data: T;
  locale: string;
};

export type IngestionAcceptedResponse<T = Record<string, unknown>> = {
  data: T;
};

export type IngestionSubmissionItem = Record<string, unknown> & {
  submission_code: string;
  request_code?: string | null;
  item_code?: string | null;
  template_instance_code?: string | null;
  source_organization_name?: string | null;
  submission_channel?: string | null;
  received_at?: string | null;
  current_version_number?: number | string | null;
  status?: string | null;
  latest_ingestion_status?: string | null;
};

export type IngestionVersionItem = Record<string, unknown> & {
  version_code: string;
  submission_code?: string | null;
  version_number?: number | string | null;
  status?: string | null;
  worker_status?: string | null;
  validation_status?: string | null;
  received_at?: string | null;
};

export type IngestionSubmittedValue = {
  cell_code: string;
  measure_code: string;
  value_numeric?: number | null;
  value_text?: string | null;
  raw_value_text?: string | null;
  axis_tuple: Array<{
    axis_code: string;
    dimension_code?: string;
    member_code: string;
    label?: string;
  }>;
};

export type IngestionSubmissionPayload = {
  unit_code: string;
  request_code: string;
  item_code: string;
  template_instance_code?: string | null;
  submission_channel?: string;
  content_type?: string;
  payload: {
    submitted_values: IngestionSubmittedValue[];
  };
};
