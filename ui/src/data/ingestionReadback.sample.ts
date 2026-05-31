export type IngestionSubmissionStatus = "RECEIVED" | "INGESTED" | "FAILED";
export type IngestionJobStatus = "PENDING" | "COMPLETED" | "FAILED";

export type IngestionSubmissionSample = {
  submission_code: string;
  current_version_number: number;
  status: IngestionSubmissionStatus;
  submission_channel: "WEB_FORM" | "API_JSON";
  request_code: string;
  item_code: string;
  template_instance_code: string;
  source_organization_name: string;
  received_at: string;
  latest_ingestion_status: string;
};

export type IngestionVersionSample = {
  version_code: string;
  submission_code: string;
  version_number: number;
  status: IngestionSubmissionStatus;
  submitted_at: string;
  received_at: string;
  worker_status: string;
  validation_status: string;
};

export type IngestionManifestSample = {
  manifest_code: string;
  version_code: string;
  payload_role: string;
  storage_provider: "LOCAL_SECURE_STORAGE" | "OBJECT_STORAGE";
  payload_uri: string;
  content_type: string;
  record_count: number;
  manifest_status: string;
};

export type IngestionJobSample = {
  job_code: string;
  version_code: string;
  job_type: string;
  status: IngestionJobStatus;
  attempt_count: number;
  max_attempts: number;
  available_at: string;
};

export type IngestionRunSample = {
  run_code: string;
  version_code: string;
  run_type: string;
  status: string;
  attempt_number: number;
  started_at: string;
  completed_at: string;
};

export type StagedRecordSample = {
  record_code: string;
  version_code: string;
  record_number: number;
  cell_code: string;
  geography_label: string;
  time_period: string;
  area_type: string;
  value_type: string;
  raw_value_text: string;
  value_numeric: string;
  status: string;
};

export const ingestionSubmissions: IngestionSubmissionSample[] = [
  {
    submission_code: "SUB_REQ_SDG_NIF_2025_0001_V1",
    current_version_number: 2,
    status: "RECEIVED",
    submission_channel: "WEB_FORM",
    request_code: "REQ_SDG_NIF_2025_0001",
    item_code: "REQITEM_NIF_1_2_1_2025",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0001_NIF_1_2_1",
    source_organization_name: "Social Statistics Division",
    received_at: "2026-05-29 13:55",
    latest_ingestion_status: "PENDING",
  },
  {
    submission_code: "SUB_REQ_SDG_NIF_2025_0002_V1",
    current_version_number: 1,
    status: "INGESTED",
    submission_channel: "WEB_FORM",
    request_code: "REQ_SDG_NIF_2025_0002",
    item_code: "REQITEM_NIF_1_2_1_2025_STATE",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0002_NIF_1_2_1",
    source_organization_name: "State Planning Unit",
    received_at: "2026-05-30 11:15",
    latest_ingestion_status: "COMPLETED",
  },
];

export const ingestionVersions: IngestionVersionSample[] = [
  {
    version_code: "SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2",
    submission_code: "SUB_REQ_SDG_NIF_2025_0001_V1",
    version_number: 2,
    status: "RECEIVED",
    submitted_at: "2026-05-29 13:55",
    received_at: "2026-05-29 13:55",
    worker_status: "DEFERRED",
    validation_status: "NOT_STARTED",
  },
  {
    version_code: "SUBVER_REQ_SDG_NIF_2025_0002_V1",
    submission_code: "SUB_REQ_SDG_NIF_2025_0002_V1",
    version_number: 1,
    status: "INGESTED",
    submitted_at: "2026-05-30 11:15",
    received_at: "2026-05-30 11:15",
    worker_status: "COMPLETED",
    validation_status: "READY",
  },
];

export const ingestionManifests: IngestionManifestSample[] = [
  {
    manifest_code: "MANIFEST_SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2",
    version_code: "SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2",
    payload_role: "PRIMARY_PAYLOAD",
    storage_provider: "LOCAL_SECURE_STORAGE",
    payload_uri: "local://ingestion/SUB_REQ_SDG_NIF_2025_0001_V1/SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2/payload.json",
    content_type: "application/json",
    record_count: 36,
    manifest_status: "READY",
  },
  {
    manifest_code: "MANIFEST_REQ_SDG_NIF_2025_0002_V1",
    version_code: "SUBVER_REQ_SDG_NIF_2025_0002_V1",
    payload_role: "PRIMARY_PAYLOAD",
    storage_provider: "LOCAL_SECURE_STORAGE",
    payload_uri: "local://ingestion/SUB_REQ_SDG_NIF_2025_0002_V1/payload.json",
    content_type: "application/json",
    record_count: 72,
    manifest_status: "READY",
  },
];

export const ingestionJobs: IngestionJobSample[] = [
  {
    job_code: "JOB_SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2_FULL",
    version_code: "SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2",
    job_type: "FULL_INGESTION",
    status: "PENDING",
    attempt_count: 0,
    max_attempts: 3,
    available_at: "2026-05-29 13:55",
  },
  {
    job_code: "JOB_REQ_SDG_NIF_2025_0002_V1_FULL",
    version_code: "SUBVER_REQ_SDG_NIF_2025_0002_V1",
    job_type: "FULL_INGESTION",
    status: "COMPLETED",
    attempt_count: 1,
    max_attempts: 3,
    available_at: "2026-05-30 11:15",
  },
];

export const ingestionRuns: IngestionRunSample[] = [
  {
    run_code: "INGRUN_REQ_SDG_NIF_2025_0002_V1_A1",
    version_code: "SUBVER_REQ_SDG_NIF_2025_0002_V1",
    run_type: "FULL_INGESTION",
    status: "COMPLETED",
    attempt_number: 1,
    started_at: "2026-05-30 11:16",
    completed_at: "2026-05-30 11:17",
  },
];

export const stagedRecords: StagedRecordSample[] = [
  {
    record_code: "STG_REQ_SDG_NIF_2025_0001_IND009_TOTAL",
    version_code: "SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2",
    record_number: 1,
    cell_code: "CELL_KA_2011_TOTAL",
    geography_label: "Karnataka",
    time_period: "2011-12",
    area_type: "Total",
    value_type: "NUMERIC",
    raw_value_text: "28.4",
    value_numeric: "28.4",
    status: "STAGED",
  },
  {
    record_code: "STG_REQ_SDG_NIF_2025_0001_TN_TOTAL",
    version_code: "SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2",
    record_number: 2,
    cell_code: "CELL_TN_2011_TOTAL",
    geography_label: "Tamil Nadu",
    time_period: "2011-12",
    area_type: "Total",
    value_type: "NUMERIC",
    raw_value_text: "",
    value_numeric: "",
    status: "MISSING_VALUE",
  },
];
