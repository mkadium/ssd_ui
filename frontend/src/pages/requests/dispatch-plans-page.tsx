import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  Layers,
  Mail,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Table2,
  UserPlus,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getIndicator, type IndicatorSourceOfficerAssignment, type PublishedTemplateUsage } from "../../api/indicators.api";
import { createMasterRecord, listMasterRecords, type MasterRecord } from "../../api/masters-reference.api";
import {
  createDispatchRun,
  DispatchPlan,
  DispatchPlanPayload,
  DispatchPolicy,
  DispatchRun,
  DispatchRunPayload,
  listDispatchPlans,
  listDispatchPolicies,
  listDispatchRuns,
  saveDispatchPlan,
} from "../../api/requests.api";
import { getSelectedUnitCode } from "../../api/session.api";
import {
  listTemplateAxes,
  listTemplateIndicatorMappings,
  listTemplateMeasureAccessPolicies,
  listTemplates,
  listTemplateVersions,
  type TemplateAxis,
  type TemplateDefinition,
  type TemplateIndicatorMapping,
  type TemplateMeasureAccessPolicy,
  type TemplateVersion,
} from "../../api/templates.api";

type PublishedTemplate = {
  template: TemplateDefinition;
  version: TemplateVersion;
  mappings: TemplateIndicatorMapping[];
  providerPolicies: TemplateMeasureAccessPolicy[];
  publishedUsage: PublishedTemplateUsage[];
  axes: TemplateAxis[];
};

type SourceInfo = {
  code: string;
  name: string;
  ministryCode: string;
  ministryName: string;
  departmentCode: string;
  departmentName: string;
};

type Officer = {
  officerCode: string;
  name: string;
  email: string;
  designation: string;
  organizationCode: string;
};

type Recipient = {
  name: string;
  email: string;
  type: "TO" | "CC" | "BCC";
};

type DispatchRow = {
  rowKey: string;
  dispatchId: string;
  technicalDispatchId: string;
  templateCode: string;
  templateName: string;
  versionCode: string;
  indicatorCode: string;
  indicatorLabel: string;
  source: SourceInfo;
  plan?: DispatchPlan;
  latestRun?: DispatchRun;
  policy?: DispatchPolicy;
  measureCodes: string[];
  recipientDefaults: { to: string[]; cc: string[]; bcc: string[] };
  recipients: Recipient[];
  reportingStartCode: string;
  reportingPeriodHint: string;
};

type SendDraft = {
  row: DispatchRow;
  requestPeriodCode: string;
  requestPeriodLabel: string;
  scheduleStartDate: string;
  to: string[];
  cc: string[];
  bcc: string[];
  recipients: Recipient[];
  newOfficer: {
    displayName: string;
    email: string;
    designation: string;
  };
  showOfficerForm: boolean;
};

type ViewMode = "TABLE" | "MINISTRY";

function textValue(value: unknown, fallback = "-") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function normalize(value: unknown) {
  return textValue(value, "").trim().toUpperCase();
}

function isPublishedStatus(value: unknown) {
  return ["PUBLISHED", "ACTIVE"].includes(normalize(value));
}

function templateName(template: TemplateDefinition) {
  return textValue(template.name ?? template.template_name ?? template.template_code);
}

function versionCode(version: TemplateVersion) {
  return textValue(version.version_code, "");
}

function planCode(plan?: DispatchPlan) {
  return textValue(plan?.dispatchPlanCode ?? (plan as Record<string, unknown> | undefined)?.dispatch_plan_code, "");
}

function planTemplateVersion(plan: DispatchPlan) {
  return textValue(plan.templateVersionCode ?? (plan as Record<string, unknown>).template_version_code, "");
}

function planIndicators(plan: DispatchPlan) {
  const value = plan.indicatorCodes ?? (plan as Record<string, unknown>).indicator_codes;
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function runPlanCode(run: DispatchRun) {
  return textValue(run.dispatchPlanCode ?? (run as Record<string, unknown>).dispatch_plan_code, "");
}

function runStatus(run?: DispatchRun) {
  return textValue(run?.status ?? (run as Record<string, unknown> | undefined)?.dispatchStatus, "");
}

function runDueDate(run?: DispatchRun) {
  return textValue(run?.dueDate ?? (run as Record<string, unknown> | undefined)?.due_date, "");
}

function runRequestPeriod(run?: DispatchRun) {
  return textValue(run?.requestPeriodLabel ?? run?.requestPeriodCode ?? (run as Record<string, unknown> | undefined)?.request_period_code, "-");
}

function runCode(run?: DispatchRun) {
  return textValue(run?.dispatchRunCode ?? (run as Record<string, unknown> | undefined)?.dispatch_run_code, "");
}

function runItems(run?: DispatchRun) {
  const value = run?.items ?? (run as Record<string, unknown> | undefined)?.items;
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function itemProviderSnapshot(item?: Record<string, unknown>) {
  const value = item?.providerSnapshot ?? item?.provider_snapshot;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function runCreatedAt(run?: DispatchRun) {
  return textValue(run?.createdAt ?? (run as Record<string, unknown> | undefined)?.created_at, "");
}

function compactDispatchReference(run: DispatchRun | undefined, index: number, fallback = "Not generated") {
  if (!run) return fallback;
  const createdAt = runCreatedAt(run);
  const parsed = createdAt ? new Date(createdAt) : null;
  const year = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getFullYear() : new Date().getFullYear();
  return `DIS-${year}-${String(index + 1).padStart(3, "0")}`;
}

function makeDispatchRunCode(periodLabel: string) {
  const year = periodLabel || String(new Date().getFullYear());
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `DIS-${year}-${stamp}`;
}

function studioUrl(row: DispatchRow) {
  const query = new URLSearchParams({
    template_code: row.templateCode,
    version_code: row.versionCode,
    step: "preview",
  });
  return `/template/studio?${query.toString()}`;
}

function policyCode(policy?: DispatchPolicy) {
  return textValue(policy?.policyCode ?? (policy as Record<string, unknown> | undefined)?.policy_code, "");
}

function policyName(policy?: DispatchPolicy) {
  return textValue(policy?.policyName ?? (policy as Record<string, unknown> | undefined)?.policy_name, policyCode(policy));
}

function dueDays(policy?: DispatchPolicy) {
  return Number(policy?.dueDays ?? (policy as Record<string, unknown> | undefined)?.due_days ?? 30);
}

function mappingIndicatorCode(mapping?: TemplateIndicatorMapping) {
  return textValue(mapping?.indicator_code ?? mapping?.national_indicator_code, "");
}

function mappingIndicatorLabel(mapping?: TemplateIndicatorMapping) {
  const number = textValue(mapping?.indicator_number ?? mappingIndicatorCode(mapping));
  const name = textValue(mapping?.indicator_name, "");
  return name ? `${number} - ${name}` : number;
}

function policySource(policy: TemplateMeasureAccessPolicy) {
  return textValue(
    policy.organization_code ??
      (policy as Record<string, unknown>).sourceOrganizationCode ??
      (policy as Record<string, unknown>).source_organization_code,
    "",
  );
}

function policyMeasure(policy: TemplateMeasureAccessPolicy) {
  return textValue(policy.measure_code ?? (policy as Record<string, unknown>).measureCode, "");
}

function sourceFromPlanSnapshot(plan?: DispatchPlan) {
  const snapshot = plan?.providerGroupSnapshot ?? (plan as Record<string, unknown> | undefined)?.provider_group_snapshot;
  if (!Array.isArray(snapshot)) return [];
  return snapshot
    .map((item) => item as Record<string, unknown>)
    .map((item) => textValue(item.sourceOrganizationCode ?? item.source_organization_code, ""))
    .filter(Boolean);
}

function firstTimeAxis(axes: TemplateAxis[]) {
  return axes.find((axis) => normalize(axis.dimension_code).includes("TIME") || normalize(axis.axis_role).includes("TIME"));
}

function reportingStartFromAxes(axes: TemplateAxis[]) {
  const axis = firstTimeAxis(axes);
  const metadata = axis?.render_metadata ?? {};
  const candidates = [
    metadata.startPeriodCode,
    metadata.start_period_code,
    metadata.defaultStartPeriodCode,
    metadata.default_start_period_code,
    axis?.member_set_code,
  ];
  return textValue(candidates.find(Boolean), "");
}

function reportingHint(axes: TemplateAxis[]) {
  const axis = firstTimeAxis(axes);
  if (!axis) return "Template time period not configured";
  return textValue(axis.label ?? axis.member_set_code ?? axis.axis_code, "Template time period");
}

function requestPeriodOptions() {
  const year = new Date().getFullYear();
  return [year, year - 1, year - 2, year - 3].map((item) => ({
    code: `CALENDAR_YEAR_${item}`,
    label: String(item),
  }));
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusLabel(value: unknown) {
  return textValue(value).replace(/_/g, " ");
}

function dispatchStatus(row: DispatchRow) {
  if (row.latestRun) return runStatus(row.latestRun) || "SENT";
  return row.source.code === "SOURCE_PENDING" ? "NOT_READY" : "READY";
}

function matchingRunItem(row: DispatchRow) {
  const items = runItems(row.latestRun);
  if (!items.length) return undefined;
  const sourceCode = normalize(row.source.code);
  const indicatorCode = normalize(row.indicatorCode);
  const versionCodeValue = normalize(row.versionCode);
  return (
    items.find((item) => {
      const provider = itemProviderSnapshot(item);
      const itemSource = normalize(item.sourceOrganizationCode ?? item.source_organization_code ?? provider.sourceOrganizationCode ?? provider.source_organization_code);
      const itemIndicator = normalize(item.indicatorCode ?? item.indicator_code ?? provider.indicatorCode ?? provider.indicator_code);
      const itemVersion = normalize(item.templateVersionCode ?? item.template_version_code ?? provider.templateVersionCode ?? provider.template_version_code);
      const sourceMatches = !sourceCode || !itemSource || itemSource === sourceCode;
      const indicatorMatches = !indicatorCode || !itemIndicator || itemIndicator === indicatorCode;
      const versionMatches = !versionCodeValue || !itemVersion || itemVersion === versionCodeValue;
      return sourceMatches && indicatorMatches && versionMatches;
    }) ?? items[0]
  );
}

function submissionStatus(row: DispatchRow) {
  const item = matchingRunItem(row);
  const provider = itemProviderSnapshot(item);
  const status = normalize(
    provider.submissionStatus ??
      provider.submission_status ??
      item?.submissionStatus ??
      item?.submission_status ??
      "",
  );
  if (status) return status;
  return "NOT_STARTED";
}

function buildSourceInfo(sourceCode: string, sourceNames: Record<string, SourceInfo>) {
  if (!sourceCode || sourceCode === "SOURCE_PENDING") {
    return {
      code: "SOURCE_PENDING",
      name: "Source pending",
      ministryCode: "SOURCE_PENDING",
      ministryName: "Source pending",
      departmentCode: "",
      departmentName: "-",
    };
  }
  return (
    sourceNames[normalize(sourceCode)] ?? {
      code: sourceCode,
      name: sourceCode,
      ministryCode: sourceCode,
      ministryName: sourceCode,
      departmentCode: "",
      departmentName: "-",
    }
  );
}

function sourceInfoFromUsage(usage: PublishedTemplateUsage, sourceNames: Record<string, SourceInfo>) {
  const code = textValue(usage.source_organization_code, "");
  const fallback = buildSourceInfo(code, sourceNames);
  const ministryCode = textValue(usage.ministry_organization_code ?? usage.parent_organization_code, "") || fallback.ministryCode;
  const ministryName = textValue(usage.ministry_name ?? usage.parent_organization_name, "") || fallback.ministryName;
  const departmentCode = textValue(usage.department_organization_code, "") || (ministryCode && code !== ministryCode ? code : fallback.departmentCode);
  const departmentName =
    textValue(usage.department_organization_name ?? usage.source_organization_name, "") ||
    (departmentCode ? fallback.departmentName : "-");
  return {
    code,
    name: textValue(usage.source_organization_name, "") || fallback.name,
    ministryCode: ministryCode || code,
    ministryName: ministryName || textValue(usage.source_organization_name, code),
    departmentCode,
    departmentName: departmentName || "-",
  };
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function recipientEmail(officer: IndicatorSourceOfficerAssignment | Record<string, unknown>) {
  return textValue(
    (officer as IndicatorSourceOfficerAssignment).email_address ??
      (officer as Record<string, unknown>).email ??
      (officer as Record<string, unknown>).emailAddress,
    "",
  );
}

function recipientsFromUsage(usageRows: PublishedTemplateUsage[]) {
  const result = { to: [] as string[], cc: [] as string[], bcc: [] as string[] };
  usageRows.forEach((usage) => {
    (usage.officers ?? []).forEach((officer) => {
      const email = recipientEmail(officer);
      if (!email) return;
      const type = normalize(officer.recipient_type);
      if (type === "CC") result.cc.push(email);
      else if (type === "BCC") result.bcc.push(email);
      else result.to.push(email);
    });
  });
  return {
    to: uniqueValues(result.to),
    cc: uniqueValues(result.cc),
    bcc: uniqueValues(result.bcc),
  };
}

function recipientDetailsFromUsage(usageRows: PublishedTemplateUsage[]) {
  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  usageRows.forEach((usage) => {
    (usage.officers ?? []).forEach((officer) => {
      const email = recipientEmail(officer);
      if (!email || seen.has(email.toLowerCase())) return;
      seen.add(email.toLowerCase());
      recipients.push({
        name: textValue(officer.officer_display_name ?? officer.display_name ?? officer.officer_code, email),
        email,
        type: normalize(officer.recipient_type) === "CC" ? "CC" : normalize(officer.recipient_type) === "BCC" ? "BCC" : "TO",
      });
    });
  });
  return recipients;
}

function getOfficerFields(record: MasterRecord): Officer {
  return {
    officerCode: textValue(record.officer_code ?? record.officerCode, ""),
    name: textValue(record.display_name ?? record.displayName ?? record.name, ""),
    email: textValue(record.email ?? record.email_address ?? record.emailAddress, ""),
    designation: textValue(record.designation, ""),
    organizationCode: textValue(record.organization_code ?? record.organizationCode, ""),
  };
}

function makePlanPayload(row: DispatchRow, unitCode: string): DispatchPlanPayload {
  const policy = row.policy;
  return {
    dispatch_plan_code: planCode(row.plan) || undefined,
    plan_name: `${row.source.ministryName} - ${row.templateName} - ${row.indicatorCode || "INDICATOR"}`,
    unit_code: unitCode,
    template_version_code: row.versionCode,
    dispatch_policy_code: policyCode(policy) || null,
    indicator_codes: row.indicatorCode ? [row.indicatorCode] : [],
    reporting_period_mode: "EXPANDING_RANGE",
    reporting_period_start_code: row.reportingStartCode || null,
    reporting_period_end_rule: "REQUEST_PERIOD",
    reporting_period_fixed_end_code: null,
    allow_request_period_adjustment: true,
    allow_data_entry_period_adjustment: true,
    source_grouping_mode: "MEASURE_PROVIDER",
    recipient_rules: {
      deriveFromMeasureProviders: true,
      allowAdditionalOfficers: true,
      officerRoles: ["TO", "CC", "BCC"],
    },
    provider_group_snapshot: [
      {
        sourceOrganizationCode: row.source.code,
        sourceOrganizationName: row.source.name,
        ministryOrganizationCode: row.source.ministryCode,
        ministryName: row.source.ministryName,
        departmentOrganizationCode: row.source.departmentCode || null,
        departmentName: row.source.departmentName === "-" ? null : row.source.departmentName,
        indicatorCode: row.indicatorCode,
        indicatorLabel: row.indicatorLabel,
        indicatorNumber: row.indicatorLabel.includes(" - ") ? row.indicatorLabel.split(" - ")[0] : row.indicatorCode,
        indicatorName: row.indicatorLabel.includes(" - ") ? row.indicatorLabel.split(" - ").slice(1).join(" - ") : row.indicatorLabel,
        templateVersionCode: row.versionCode,
        measureCodes: row.measureCodes,
        recipients: { to: [], cc: [], bcc: [] },
      },
    ],
    status: "ACTIVE",
    is_active: true,
  };
}

function makeRunPayload(draft: SendDraft, unitCode: string): DispatchRunPayload {
  return {
    dispatch_run_code: makeDispatchRunCode(draft.requestPeriodLabel),
    unit_code: unitCode,
    request_period_code: draft.requestPeriodCode,
    request_period_label: draft.requestPeriodLabel,
    schedule_start_date: draft.scheduleStartDate,
    run_metadata: {
      sourceOrganizationCode: draft.row.source.code,
      sourceOrganizationName: draft.row.source.name,
      ministryOrganizationCode: draft.row.source.ministryCode,
      ministryName: draft.row.source.ministryName,
      departmentOrganizationCode: draft.row.source.departmentCode || null,
      departmentName: draft.row.source.departmentName === "-" ? null : draft.row.source.departmentName,
      indicatorCode: draft.row.indicatorCode,
      indicatorLabel: draft.row.indicatorLabel,
      indicatorNumber: draft.row.indicatorLabel.includes(" - ") ? draft.row.indicatorLabel.split(" - ")[0] : draft.row.indicatorCode,
      indicatorName: draft.row.indicatorLabel.includes(" - ") ? draft.row.indicatorLabel.split(" - ").slice(1).join(" - ") : draft.row.indicatorLabel,
      templateVersionCode: draft.row.versionCode,
      submissionBaseUrl: `${window.location.origin}/request-access`,
      recipientSnapshot: { to: draft.to, cc: draft.cc, bcc: draft.bcc },
    },
    created_by_username: "ui-template-dispatch",
  };
}

export function DispatchPlansPage() {
  const unitCode = getSelectedUnitCode();
  const navigate = useNavigate();
  const [publishedTemplates, setPublishedTemplates] = useState<PublishedTemplate[]>([]);
  const [plans, setPlans] = useState<DispatchPlan[]>([]);
  const [runs, setRuns] = useState<DispatchRun[]>([]);
  const [policies, setPolicies] = useState<DispatchPolicy[]>([]);
  const [sourceNames, setSourceNames] = useState<Record<string, SourceInfo>>({});
  const [officersBySource, setOfficersBySource] = useState<Record<string, Officer[]>>({});
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("ALL");
  const [dispatchFilter, setDispatchFilter] = useState("ALL");
  const [submissionFilter, setSubmissionFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("MINISTRY");
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sendDraft, setSendDraft] = useState<SendDraft | null>(null);

  const activePolicies = useMemo(() => policies.filter((policy) => policy.isActive !== false), [policies]);
  const defaultPolicy = useMemo(
    () =>
      activePolicies.find((policy) => policy.isDefault && normalize(policy.scopeType) === "GLOBAL") ??
      activePolicies.find((policy) => normalize(policy.scopeType) === "GLOBAL") ??
      activePolicies[0],
    [activePolicies],
  );

  const policyByCode = useMemo(
    () => Object.fromEntries(activePolicies.map((policy) => [normalize(policyCode(policy)), policy])),
    [activePolicies],
  );

  const dispatchRows = useMemo(() => {
    const rows: DispatchRow[] = [];
    const plansByVersion = new Map<string, DispatchPlan[]>();
    const runsByPlan = new Map<string, DispatchRun[]>();
    const runReferences = new Map<string, string>();

    [...runs]
      .sort((left, right) => runCreatedAt(left).localeCompare(runCreatedAt(right)) || runCode(left).localeCompare(runCode(right)))
      .forEach((run, index) => {
        const code = runCode(run);
        if (code) runReferences.set(normalize(code), compactDispatchReference(run, index));
      });
    plans.forEach((plan) => {
      const key = normalize(planTemplateVersion(plan));
      if (!key) return;
      plansByVersion.set(key, [...(plansByVersion.get(key) ?? []), plan]);
    });
    runs.forEach((run) => {
      const key = normalize(runPlanCode(run));
      if (!key) return;
      runsByPlan.set(key, [...(runsByPlan.get(key) ?? []), run]);
    });

    publishedTemplates.forEach((item) => {
      const currentVersionCode = versionCode(item.version);
      const mappings = item.mappings.length ? item.mappings : [undefined];
      const providerSources = item.providerPolicies.map(policySource).filter(Boolean);
      const providerMeasureCodes = uniqueValues(item.providerPolicies.map(policyMeasure).filter(Boolean)).map(normalize);
      const sourceMeasureCodes = item.providerPolicies.reduce<Record<string, Set<string>>>((next, policy) => {
        const source = policySource(policy);
        const measure = policyMeasure(policy);
        if (!source) return next;
        next[normalize(source)] = next[normalize(source)] ?? new Set<string>();
        if (measure) next[normalize(source)].add(measure);
        return next;
      }, {});

      mappings.forEach((mapping) => {
        const indicatorCode = mappingIndicatorCode(mapping);
        const usageRows = item.publishedUsage.filter(
          (usage) =>
            (!indicatorCode || normalize(usage.national_indicator_code) === normalize(indicatorCode)) &&
            (!currentVersionCode || normalize(usage.version_code) === normalize(currentVersionCode)),
        );
        const scopedUsageRows = providerMeasureCodes.length
          ? usageRows.filter((usage) =>
              providerMeasureCodes.includes(normalize(usage.template_measure_code ?? usage.measure_code)),
            )
          : usageRows;
        const usageSources = scopedUsageRows.map((usage) => textValue(usage.source_organization_code, "")).filter(Boolean);
        const matchingPlan =
          (plansByVersion.get(normalize(currentVersionCode)) ?? []).find((plan) => {
            const indicators = planIndicators(plan).map(normalize);
            const sources = sourceFromPlanSnapshot(plan).map(normalize);
            const sourceMatches =
              sources.length === 0 ||
              [...usageSources, ...providerSources].some((source) => sources.includes(normalize(source)));
            const indicatorMatches = !indicatorCode || indicators.length === 0 || indicators.includes(normalize(indicatorCode));
            return sourceMatches && indicatorMatches;
          }) ?? undefined;

        const sourceCodes =
          usageSources.length > 0
            ? uniqueValues(usageSources)
            : providerSources.length > 0
              ? uniqueValues(providerSources)
              : sourceFromPlanSnapshot(matchingPlan).length > 0
                ? uniqueValues(sourceFromPlanSnapshot(matchingPlan))
                : [];
        const finalSources = sourceCodes.length ? sourceCodes : ["SOURCE_PENDING"];

        finalSources.forEach((sourceCode, index) => {
          const matchingUsage = scopedUsageRows.find((usage) => normalize(usage.source_organization_code) === normalize(sourceCode));
          const source = matchingUsage ? sourceInfoFromUsage(matchingUsage, sourceNames) : buildSourceInfo(sourceCode, sourceNames);
          const planRuns = [...(runsByPlan.get(normalize(planCode(matchingPlan))) ?? [])].sort(
            (left, right) => runCreatedAt(right).localeCompare(runCreatedAt(left)) || runCode(right).localeCompare(runCode(left)),
          );
          const latestRun = planRuns[0];
          const latestRunCode = runCode(latestRun);
          const storedPolicyCode = textValue(
            matchingPlan?.dispatchPolicyCode ?? (matchingPlan as Record<string, unknown> | undefined)?.dispatch_policy_code,
            "",
          );
          const effectivePolicy = policyByCode[normalize(storedPolicyCode)] ?? defaultPolicy;
          const measureCodes = uniqueValues([
            ...Array.from(sourceMeasureCodes[normalize(sourceCode)] ?? new Set<string>()),
            ...scopedUsageRows
              .filter((usage) => normalize(usage.source_organization_code) === normalize(sourceCode))
              .map((usage) => textValue(usage.template_measure_code ?? usage.measure_code, ""))
              .filter(Boolean),
          ]);
          rows.push({
            rowKey: `${currentVersionCode}:${indicatorCode || "UNMAPPED"}:${source.code}:${index}`,
            dispatchId: latestRun ? textValue(runReferences.get(normalize(latestRunCode)), compactDispatchReference(latestRun, 0)) : "Not generated",
            technicalDispatchId: textValue(latestRunCode || planCode(matchingPlan), ""),
            templateCode: textValue(item.template.template_code, ""),
            templateName: templateName(item.template),
            versionCode: currentVersionCode,
            indicatorCode,
            indicatorLabel: mappingIndicatorLabel(mapping) || "Indicator mapping pending",
            source,
            plan: matchingPlan,
            latestRun,
            policy: effectivePolicy,
            measureCodes,
            recipientDefaults: recipientsFromUsage(scopedUsageRows.filter((usage) => normalize(usage.source_organization_code) === normalize(sourceCode))),
            recipients: recipientDetailsFromUsage(scopedUsageRows.filter((usage) => normalize(usage.source_organization_code) === normalize(sourceCode))),
            reportingStartCode: reportingStartFromAxes(item.axes),
            reportingPeriodHint: reportingHint(item.axes),
          });
        });
      });
    });

    return rows.sort((left, right) =>
      `${left.source.ministryName} ${left.source.departmentName} ${left.templateName}`.localeCompare(
        `${right.source.ministryName} ${right.source.departmentName} ${right.templateName}`,
      ),
    );
  }, [defaultPolicy, plans, policyByCode, publishedTemplates, runs, sourceNames]);

  const ministries = useMemo(() => {
    const rows = new Map<string, string>();
    dispatchRows.forEach((row) => rows.set(row.source.ministryCode, row.source.ministryName));
    return Array.from(rows.entries()).sort((left, right) => left[1].localeCompare(right[1]));
  }, [dispatchRows]);

  const submissionStatusOptions = useMemo(() => {
    const defaults = [
      "NOT_STARTED",
      "DRAFT",
      "IN_PROGRESS",
      "PARTIAL",
      "SUBMITTED",
      "RESUBMITTED",
      "VALIDATION_FAILED",
      "VALIDATED_WITH_WARNINGS",
      "REVIEW_PENDING",
      "PENDING_REVIEW",
      "RETURNED",
      "REJECTED",
      "APPROVED",
      "PUBLISHED",
    ];
    return Array.from(new Set([...defaults, ...dispatchRows.map(submissionStatus).filter(Boolean)])).sort();
  }, [dispatchRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dispatchRows.filter((row) => {
      const status = dispatchStatus(row);
      const submission = submissionStatus(row);
      const matchesMinistry = ministryFilter === "ALL" || normalize(row.source.ministryCode) === normalize(ministryFilter);
      const matchesDispatch = dispatchFilter === "ALL" || normalize(status) === normalize(dispatchFilter);
      const matchesSubmission = submissionFilter === "ALL" || normalize(submission) === normalize(submissionFilter);
      const matchesSearch =
        !q ||
        [
          row.dispatchId,
          row.technicalDispatchId,
          row.templateName,
          row.versionCode,
          row.indicatorCode,
          row.indicatorLabel,
          row.source.ministryName,
          row.source.departmentName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      return matchesMinistry && matchesDispatch && matchesSubmission && matchesSearch;
    });
  }, [dispatchFilter, dispatchRows, ministryFilter, search, submissionFilter]);

  const groupedRows = useMemo(() => {
    const groups = new Map<string, DispatchRow[]>();
    filteredRows.forEach((row) => {
      groups.set(row.source.ministryName, [...(groups.get(row.source.ministryName) ?? []), row]);
    });
    return Array.from(groups.entries()).sort((left, right) => left[0].localeCompare(right[0]));
  }, [filteredRows]);

  const metrics = useMemo(
    () => ({
      total: dispatchRows.length,
      ready: dispatchRows.filter((row) => dispatchStatus(row) === "READY").length,
      sent: dispatchRows.filter((row) => dispatchStatus(row) === "SENT").length,
      submitted: dispatchRows.filter((row) => submissionStatus(row) === "SUBMITTED").length,
      overdue: dispatchRows.filter((row) => dispatchStatus(row) === "OVERDUE").length,
      approved: dispatchRows.filter((row) => submissionStatus(row) === "APPROVED").length,
    }),
    [dispatchRows],
  );

  useEffect(() => {
    void loadPage();
  }, [unitCode]);

  useEffect(() => {
    if (!notice && !error) return;
    const timeout = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 3500);
    return () => window.clearTimeout(timeout);
  }, [notice, error]);

  async function loadPage() {
    setIsLoading(true);
    setError("");
    try {
      const [templateResponse, planRows, runRows, policyRows, orgResponse, officerResponse] = await Promise.all([
        listTemplates({ limit: 500 }),
        listDispatchPlans({ unitCode, includeInactive: true, limit: 500 }),
        listDispatchRuns({ unitCode, limit: 500 }),
        listDispatchPolicies({ unitCode, includeInactive: false, limit: 500 }),
        listMasterRecords({ endpoint: "/masters/organizations", params: { include_inactive: false } }).catch(() => ({ data: [] })),
        Promise.resolve({ data: [] }),
      ]);

      const orgRows = Object.fromEntries(
        (orgResponse.data ?? []).map((record) => {
          const row = record as Record<string, unknown>;
          const code = textValue(row.organization_code ?? row.organizationCode ?? row.code, "");
          const name = textValue(row.name ?? row.organization_name ?? row.organizationName ?? row.display_name, code);
          const parentCode = textValue(row.parent_organization_code ?? row.parentOrganizationCode, "");
          const parentName = textValue(row.parent_organization_name ?? row.parentOrganizationName, "");
          const source: SourceInfo = {
            code,
            name,
            ministryCode: parentCode || code,
            ministryName: parentName || name,
            departmentCode: parentCode ? code : "",
            departmentName: parentCode ? name : "-",
          };
          return [normalize(code), source];
        }),
      );
      setSourceNames(orgRows);

      const officerGroups = (officerResponse.data ?? []).reduce<Record<string, Officer[]>>((next, record) => {
        const officer = getOfficerFields(record);
        const key = normalize(officer.organizationCode);
        if (!key) return next;
        next[key] = [...(next[key] ?? []), officer].filter((item) => item.email);
        return next;
      }, {});
      setOfficersBySource(officerGroups);

      const published = (
        await Promise.all(
          (templateResponse.data ?? []).map(async (template) => {
            const templateCode = textValue(template.template_code, "");
            if (!templateCode) return [];
            const versions = (await listTemplateVersions(templateCode).catch(() => ({ data: [] }))).data ?? [];
            const publishedVersions = versions.filter((version) => isPublishedStatus(version.status));
            return Promise.all(
              publishedVersions.map(async (version) => {
                const currentVersionCode = versionCode(version);
                const [mappingsResult, providerResult, axesResult] = await Promise.allSettled([
                  listTemplateIndicatorMappings(currentVersionCode),
                  listTemplateMeasureAccessPolicies(currentVersionCode, false),
                  listTemplateAxes(currentVersionCode),
                ]);
                const mappings = mappingsResult.status === "fulfilled" ? mappingsResult.value.data ?? [] : [];
                const sourceData = await Promise.all(
                  mappings
                    .map((mapping) => mappingIndicatorCode(mapping))
                    .filter(Boolean)
                    .map(async (indicatorCode) => {
                      const detail = await getIndicator(indicatorCode).catch(() => ({ data: null }));
                      return {
                        publishedUsage: detail.data?.published_template_usage ?? [],
                      };
                    }),
                );
                return {
                  template,
                  version,
                  mappings,
                  providerPolicies: providerResult.status === "fulfilled" ? providerResult.value.data ?? [] : [],
                  publishedUsage: sourceData.flatMap((item) => item.publishedUsage),
                  axes: axesResult.status === "fulfilled" ? axesResult.value.data ?? [] : [],
                };
              }),
            );
          }),
        )
      ).flat();

      setPublishedTemplates(published);
      setPlans(planRows);
      setRuns(runRows);
      setPolicies(policyRows);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Template Dispatch could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function ensureReadyPlan(row: DispatchRow) {
    if (row.plan && normalize(row.plan.status) === "ACTIVE") return row.plan;
    const saved = await saveDispatchPlan(planCode(row.plan) || undefined, makePlanPayload(row, unitCode));
    setPlans((current) => {
      const code = planCode(saved);
      return current.some((plan) => planCode(plan) === code)
        ? current.map((plan) => (planCode(plan) === code ? saved : plan))
        : [saved, ...current];
    });
    return saved;
  }

  function openSend(row: DispatchRow) {
    const period = requestPeriodOptions()[0];
    const officers = officersBySource[normalize(row.source.code)] ?? [];
    const extraRecipients = officers
      .filter((officer) => officer.email)
      .map((officer) => ({ name: officer.name || officer.officerCode || officer.email, email: officer.email, type: "TO" as const }));
    const recipients = [...row.recipients, ...extraRecipients].filter(
      (recipient, index, all) => all.findIndex((item) => item.email.toLowerCase() === recipient.email.toLowerCase()) === index,
    );
    setSendDraft({
      row,
      requestPeriodCode: period.code,
      requestPeriodLabel: period.label,
      scheduleStartDate: new Date().toISOString().slice(0, 10),
      to: uniqueValues([...row.recipientDefaults.to, ...officers.map((officer) => officer.email)]),
      cc: uniqueValues(row.recipientDefaults.cc),
      bcc: uniqueValues(row.recipientDefaults.bcc),
      recipients,
      newOfficer: { displayName: "", email: "", designation: "" },
      showOfficerForm: false,
    });
  }

  function openTemplateView(row: DispatchRow) {
    window.open(studioUrl(row), "_blank", "noopener,noreferrer");
  }

  function openDispatchRun(row: DispatchRow) {
    const code = runCode(row.latestRun);
    if (!code) {
      openSend(row);
      return;
    }
    navigate(`/requests/dispatch-runs/${encodeURIComponent(code)}`);
  }

  async function addOfficer() {
    if (!sendDraft) return;
    const draft = sendDraft.newOfficer;
    if (!draft.displayName.trim() || !draft.email.trim()) {
      setError("Officer name and email are required.");
      return;
    }
    try {
      const saved = await createMasterRecord({
        endpoint: "/masters/officers",
        payload: {
          organization_code: sendDraft.row.source.code,
          officer_code: draft.email.split("@")[0].replace(/[^A-Za-z0-9]+/g, "_").toUpperCase(),
          display_name: draft.displayName,
          email: draft.email,
          designation: draft.designation || null,
          is_active: true,
        },
      });
      const officer = getOfficerFields(saved);
      setOfficersBySource((current) => ({
        ...current,
        [normalize(sendDraft.row.source.code)]: [...(current[normalize(sendDraft.row.source.code)] ?? []), officer],
      }));
      setSendDraft({
        ...sendDraft,
        to: uniqueValues([...sendDraft.to, officer.email]),
        recipients: [...sendDraft.recipients, { name: officer.name || officer.email, email: officer.email, type: "TO" }],
        newOfficer: { displayName: "", email: "", designation: "" },
        showOfficerForm: false,
      });
      setNotice("Officer added to source.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Officer could not be created.");
    }
  }

  async function sendDispatch(event: FormEvent) {
    event.preventDefault();
    if (!sendDraft) return;
    if (sendDraft.to.length === 0) {
      setError("Add at least one TO recipient before sending.");
      return;
    }
    setError("");
    try {
      const readyPlan = await ensureReadyPlan(sendDraft.row);
      const saved = await createDispatchRun(planCode(readyPlan), makeRunPayload(sendDraft, unitCode));
      setRuns((current) => [saved, ...current.filter((run) => textValue(run.dispatchRunCode) !== textValue(saved.dispatchRunCode))]);
      setSendDraft(null);
      const sendNotice = `Dispatch queued ${saved.queuedNotificationEvents ?? 0} email event(s).`;
      setNotice(sendNotice);
      const savedRunCode = runCode(saved);
      if (savedRunCode) {
        navigate(`/requests/dispatch-runs/${encodeURIComponent(savedRunCode)}`, {
          state: { notice: sendNotice },
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Template dispatch could not be sent.");
    }
  }

  const summaryText = `Showing ${filteredRows.length ? 1 : 0}-${filteredRows.length} of ${dispatchRows.length} dispatches`;

  return (
    <section className="template-dispatch-page">
      {notice ? <div className="toast-message success">{notice}</div> : null}
      {error ? <div className="toast-message error">{error}</div> : null}

      <div className="template-dispatch-title-row">
        <h1>Template Dispatch</h1>
        <div className="template-dispatch-title-actions">
          <button className="secondary-button compact" type="button">
            <Download size={14} /> Export
          </button>
          <button className="secondary-button compact" type="button" onClick={() => void loadPage()}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="template-dispatch-kpis">
        <div><strong>{metrics.total}</strong><span>Total Dispatches</span></div>
        <div><strong>{metrics.ready}</strong><span>Ready</span></div>
        <div><strong>{metrics.sent}</strong><span>Sent</span></div>
        <div><strong>{metrics.submitted}</strong><span>Submitted</span></div>
        <div><strong>{metrics.overdue}</strong><span>Overdue</span></div>
        <div><strong>{metrics.approved}</strong><span>Approved</span></div>
      </div>

      <div className="template-dispatch-filters">
        <label className="template-dispatch-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by template, ministry, department, indicator, or dispatch ID"
          />
        </label>
        <select value={ministryFilter} onChange={(event) => setMinistryFilter(event.target.value)}>
          <option value="ALL">Ministry</option>
          {ministries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
        <select value={dispatchFilter} onChange={(event) => setDispatchFilter(event.target.value)}>
          <option value="ALL">Dispatch Status</option>
          <option value="READY">Ready</option>
          <option value="SENT">Sent</option>
        </select>
        <select value={submissionFilter} onChange={(event) => setSubmissionFilter(event.target.value)}>
          <option value="ALL">Submission Status</option>
          {submissionStatusOptions.map((status) => (
            <option value={status} key={status}>{statusLabel(status)}</option>
          ))}
        </select>
        <button className="secondary-button compact" type="button">
          <SlidersHorizontal size={14} />
        </button>
      </div>

      <div className="template-dispatch-viewbar">
        <span>{summaryText}</span>
        <div>
          <button className={viewMode === "TABLE" ? "active" : ""} type="button" onClick={() => setViewMode("TABLE")}>
            <Table2 size={14} /> Table View
          </button>
          <button className={viewMode === "MINISTRY" ? "active" : ""} type="button" onClick={() => setViewMode("MINISTRY")}>
            <Layers size={14} /> By Ministry
          </button>
        </div>
      </div>

      {isLoading ? <div className="template-dispatch-empty">Loading published template dispatches...</div> : null}
      {!isLoading && filteredRows.length === 0 ? <div className="template-dispatch-empty">No published template dispatches found.</div> : null}

      {!isLoading && filteredRows.length > 0 && viewMode === "TABLE" ? (
        <div className="template-dispatch-table-card">
          <table className="template-dispatch-grid-table">
            <thead>
              <tr>
                <th>Dispatch Info</th>
                <th>Template</th>
                <th>Indicator</th>
                <th>Ministry</th>
                <th>Department</th>
                <th>Due Date</th>
                <th>Dispatch Status</th>
                <th>Submission Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.rowKey}>
                  <td>
                    <strong>{row.dispatchId}</strong>
                    <small>{row.latestRun ? `Sent: ${runRequestPeriod(row.latestRun)}` : "Ready to send"}</small>
                  </td>
                  <td>
                    <strong>{row.templateCode}</strong>
                    <small>{row.templateName}</small>
                    <small>{row.versionCode}</small>
                  </td>
                  <td>
                    <span className="template-dispatch-indicator">{row.indicatorCode || "-"}</span>
                    <small>{row.indicatorLabel}</small>
                  </td>
                  <td>{row.source.ministryName}</td>
                  <td>{row.source.departmentName}</td>
                  <td>{runDueDate(row.latestRun) ? formatDate(runDueDate(row.latestRun)) : `Generated on send (+${dueDays(row.policy)} days)`}</td>
                  <td><span className={`template-dispatch-badge ${normalize(dispatchStatus(row)).toLowerCase()}`}>{statusLabel(dispatchStatus(row))}</span></td>
                  <td><span className={`template-dispatch-badge ${normalize(submissionStatus(row)).toLowerCase()}`}>{statusLabel(submissionStatus(row))}</span></td>
                  <td>
                    <div className="template-dispatch-actions">
                      <button className="secondary-button compact icon-only" type="button" title="View template" onClick={() => openTemplateView(row)}>
                        <FileSpreadsheet size={12} />
                      </button>
                      {row.latestRun ? (
                        <button className="secondary-button compact" type="button" onClick={() => openDispatchRun(row)}>View</button>
                      ) : (
                        <button className="primary-button compact" type="button" onClick={() => openSend(row)}>
                          <Send size={12} /> Send
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!isLoading && filteredRows.length > 0 && viewMode === "MINISTRY" ? (
        <div className="template-dispatch-ministry-list">
          {groupedRows.map(([ministryName, rows]) => {
            const isOpen = expandedSources[ministryName] ?? true;
            return (
              <section className="template-dispatch-ministry-card" key={ministryName}>
                <button
                  className="template-dispatch-ministry-header"
                  type="button"
                  onClick={() => setExpandedSources((current) => ({ ...current, [ministryName]: !isOpen }))}
                >
                  <span>
                    <strong>{ministryName}</strong>
                    <small>
                      {rows.length} Dispatches&nbsp;&nbsp;
                      {rows.filter((row) => dispatchStatus(row) === "SENT").length} Sent&nbsp;&nbsp;
                      {rows.filter((row) => dispatchStatus(row) === "READY").length} Ready&nbsp;&nbsp;
                      {rows.filter((row) => submissionStatus(row) === "SUBMITTED").length} Submitted
                    </small>
                  </span>
                  <ChevronDown size={16} className={isOpen ? "open" : ""} />
                </button>
                {isOpen ? (
                  <div className="template-dispatch-ministry-rows">
                    {rows.map((row) => (
                      <article className="template-dispatch-group-row" key={row.rowKey}>
                        <div>
                          <span>Dispatch Info</span>
                          <strong>{row.dispatchId}</strong>
                          <small>{row.latestRun ? `Sent: ${runRequestPeriod(row.latestRun)}` : "Ready to send"}</small>
                        </div>
                        <div>
                          <span>Template</span>
                          <strong>{row.templateCode}</strong>
                          <small>{row.templateName}</small>
                          <small>{row.versionCode}</small>
                        </div>
                        <div>
                          <span>Indicator</span>
                          <strong className="template-dispatch-indicator">{row.indicatorCode || "-"}</strong>
                          <small>{row.indicatorLabel}</small>
                        </div>
                        <div>
                          <span>Ministry</span>
                          <strong>{row.source.ministryName}</strong>
                        </div>
                        <div>
                          <span>Department</span>
                          <strong>{row.source.departmentName}</strong>
                        </div>
                        <div>
                          <span>Due Date</span>
                          <strong>{runDueDate(row.latestRun) ? formatDate(runDueDate(row.latestRun)) : `Generated on send (+${dueDays(row.policy)} days)`}</strong>
                        </div>
                        <div>
                          <span>Dispatch</span>
                          <em className={`template-dispatch-badge ${normalize(dispatchStatus(row)).toLowerCase()}`}>{statusLabel(dispatchStatus(row))}</em>
                        </div>
                        <div>
                          <span>Submission</span>
                          <em className={`template-dispatch-badge ${normalize(submissionStatus(row)).toLowerCase()}`}>{statusLabel(submissionStatus(row))}</em>
                        </div>
                        <div className="template-dispatch-actions">
                          <button className="secondary-button compact icon-only" type="button" title="View template" onClick={() => openTemplateView(row)}>
                            <FileSpreadsheet size={12} />
                          </button>
                          {row.latestRun ? (
                            <button className="secondary-button compact" type="button" onClick={() => openDispatchRun(row)}>View</button>
                          ) : (
                            <button className="primary-button compact" type="button" onClick={() => openSend(row)}>
                              <Send size={12} /> Send
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : null}

      {sendDraft ? (
        <div className="drawer-backdrop">
          <aside className="side-drawer template-dispatch-drawer">
            <div className="drawer-header">
              <div>
                <p>Template Dispatch</p>
                <h2>Send Request</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setSendDraft(null)}><X size={18} /></button>
            </div>
            <form className="drawer-form template-dispatch-drawer-form" onSubmit={sendDispatch}>
              <section className="template-dispatch-drawer-summary">
                <h3>{sendDraft.row.templateName}</h3>
                <p>{sendDraft.row.indicatorLabel}</p>
                <div className="template-dispatch-context-grid">
                  <div><span>Ministry</span><strong>{sendDraft.row.source.ministryName}</strong></div>
                  <div><span>Department</span><strong>{sendDraft.row.source.departmentName}</strong></div>
                  <div><span>Policy</span><strong>{policyName(sendDraft.row.policy) || "Global default"}</strong></div>
                  <div><span>Due rule</span><strong>Send date + {dueDays(sendDraft.row.policy)} days</strong></div>
                  <div><span>Template time period</span><strong>{sendDraft.row.reportingPeriodHint}</strong></div>
                  <div><span>Dispatch readiness</span><strong>Ready</strong></div>
                </div>
              </section>

              <section className="template-dispatch-form-section">
                <h4>Request Period</h4>
                <div className="template-dispatch-inline-fields">
                  <label>
                    Period
                    <select
                      value={sendDraft.requestPeriodCode}
                      onChange={(event) => {
                        const option = requestPeriodOptions().find((item) => item.code === event.target.value);
                        setSendDraft({
                          ...sendDraft,
                          requestPeriodCode: event.target.value,
                          requestPeriodLabel: option?.label ?? event.target.value,
                        });
                      }}
                    >
                      {requestPeriodOptions().map((option) => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Send date
                    <input
                      type="date"
                      value={sendDraft.scheduleStartDate}
                      onChange={(event) => setSendDraft({ ...sendDraft, scheduleStartDate: event.target.value })}
                    />
                  </label>
                </div>
                <p className="field-help">Due date is generated by backend from the active dispatch policy.</p>
              </section>

              <section className="template-dispatch-form-section">
                <div className="template-dispatch-section-title">
                  <h4>Recipients</h4>
                  <small>Defaults from published template source/officer usage</small>
                </div>
                <div className="template-dispatch-recipient-list">
                  {sendDraft.recipients.length === 0 ? (
                    <p>No officers are mapped to this published template source yet.</p>
                  ) : (
                    sendDraft.recipients.map((recipient) => (
                      <span key={`${recipient.type}-${recipient.email}`}>
                        <strong>{recipient.name}</strong>
                        <small>{recipient.email}</small>
                      </span>
                    ))
                  )}
                </div>
                <button className="secondary-button compact" type="button" onClick={() => setSendDraft({ ...sendDraft, showOfficerForm: !sendDraft.showOfficerForm })}>
                  <UserPlus size={14} /> Add Officer
                </button>
                {sendDraft.showOfficerForm ? (
                  <div className="template-dispatch-officer-form">
                    <label>
                      Officer name
                      <input
                        value={sendDraft.newOfficer.displayName}
                        onChange={(event) => setSendDraft({ ...sendDraft, newOfficer: { ...sendDraft.newOfficer, displayName: event.target.value } })}
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        value={sendDraft.newOfficer.email}
                        onChange={(event) => setSendDraft({ ...sendDraft, newOfficer: { ...sendDraft.newOfficer, email: event.target.value } })}
                      />
                    </label>
                    <label>
                      Designation
                      <input
                        value={sendDraft.newOfficer.designation}
                        onChange={(event) => setSendDraft({ ...sendDraft, newOfficer: { ...sendDraft.newOfficer, designation: event.target.value } })}
                      />
                    </label>
                    <button className="secondary-button compact" type="button" onClick={() => void addOfficer()}>
                      Save Officer
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="template-dispatch-email-note">
                <Mail size={16} />
                <span>Email subject/body is resolved from the active Notification Rule and Email Template.</span>
              </section>

              <div className="drawer-footer">
                <button className="secondary-button" type="button" onClick={() => setSendDraft(null)}>Cancel</button>
                <button className="primary-button" type="submit">Send</button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
