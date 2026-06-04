import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { ApiError } from "@/api/client";
// import { EChart } from "@/components/charts/EChart";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "@/components/ui/loader";
import {
  frameworkEditions as sampleFrameworkEditions,
  frameworkLevels as sampleFrameworkLevels,
  frameworkNodes as sampleFrameworkNodes,
  indicatorMappings as sampleIndicatorMappings,
  type FrameworkEdition,
  type FrameworkLevel,
  type FrameworkNode,
  type IndicatorMapping,
} from "@/data/frameworkSetup.sample";
import { useLanguage } from "@/providers/language-context";
import { mastersService } from "@/services/mastersService";
import type {
  FrameworkHierarchyDetail,
  IndicatorListItem,
  SourceAssignmentListItem,
} from "@/types/masters";

type FrameworkModal =
  | "create-edition"
  | "edit-edition"
  | "delete-edition"
  | "restore-edition"
  | "create-level"
  | "edit-level"
  | "add-root"
  | "add-child"
  | "edit-node"
  | "delete"
  | "bulk-upload"
  | null;



const statusVariant = (status: string) => {
  if (status === "ACTIVE" || status === "READY") return "secondary";
  if (status === "DRAFT") return "outline";
  return "destructive";
};

function getSafeApiMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sign in again to load Masters data.";
    if (error.status === 403) return "You do not have permission to view Masters data.";
    if (error.status === 404) return "Selected framework was not found.";
    if (error.status === 0) return "Unable to reach the API.";
    return "Masters data is temporarily unavailable.";
  }

  return "Masters data is temporarily unavailable.";
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value ? value : null;
}

function readBoolean(formData: FormData, key: string) {
  const value = readString(formData, key).toUpperCase();
  return value === "YES" || value === "TRUE" || value === "ACTIVE";
}

function readPositiveInteger(formData: FormData, key: string, fallback: number) {
  const parsed = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toUpperCase();
    return normalized === "TRUE" || normalized === "YES" || normalized === "ACTIVE";
  }
  return fallback;
}

function editionTimestamp(edition: FrameworkEdition) {
  const timestamp = Date.parse(edition.effective_from);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function toFrameworkEdition(item: FrameworkEdition): FrameworkEdition;
function toFrameworkEdition(item: Record<string, unknown>): FrameworkEdition;
function toFrameworkEdition(item: Record<string, unknown>) {
  return {
    framework_code: String(item.framework_code ?? ""),
    edition_code: String(item.edition_code ?? ""),
    version_label: String(item.version_label ?? item.edition_code ?? ""),
    status: String(item.status ?? "ACTIVE") as FrameworkEdition["status"],
    is_active: normalizeBoolean(item.is_active, item.status === "ACTIVE"),
    name: String(item.name ?? item.framework_code ?? ""),
    description: String(item.description ?? ""),
    effective_from: String(item.effective_from ?? "-"),
  };
}

function getParentByChild(relationships: FrameworkHierarchyDetail["relationships"]) {
  return new Map(
    (relationships ?? [])
      .filter((relationship) => relationship.relationship_type === "PARENT_CHILD")
      .map((relationship) => [
        relationship.child_node_code,
        relationship.parent_node_code,
      ]),
  );
}

function getNodeIndicatorCount() {
  return 0;
}

function toFrameworkNodes(hierarchy?: FrameworkHierarchyDetail): FrameworkNode[] {
  if (!hierarchy) return sampleFrameworkNodes;
  if (!hierarchy.nodes?.length) return [];

  const parentByChild = getParentByChild(hierarchy.relationships);

  return hierarchy.nodes.map((node) => ({
    node_code: node.node_code,
    level_code: node.level_code,
    node_number: node.node_number,
    name: node.name,
    parent_node_code: parentByChild.get(node.node_code),
    color_value: node.color_value ?? "#64748b",
    mapped_indicator_count: getNodeIndicatorCount(),
  }));
}

function toFrameworkLevels(
  hierarchy: FrameworkHierarchyDetail | undefined,
  nodes: FrameworkNode[],
): FrameworkLevel[] {
  if (!hierarchy?.levels?.length) return sampleFrameworkLevels;

  return hierarchy.levels.map((level) => ({
    level_code: level.level_code,
    level_number: level.level_number,
    name: level.name,
    allows_indicator_mapping: level.allows_indicator_mapping,
    node_count: nodes.filter((node) => node.level_code === level.level_code).length,
  }));
}

function toIndicatorMappings(
  indicators: IndicatorListItem[],
  sourceAssignments: SourceAssignmentListItem[],
  selectedFrameworkCode: string,
): IndicatorMapping[] {
  const sourcesByIndicator = new Map<string, SourceAssignmentListItem[]>();

  for (const source of sourceAssignments) {
    const existingSources = sourcesByIndicator.get(source.national_indicator_code) ?? [];
    sourcesByIndicator.set(source.national_indicator_code, [...existingSources, source]);
  }

  return indicators
    .filter((indicator) => !indicator.framework_code || indicator.framework_code === selectedFrameworkCode)
    .map((indicator) => {
      const primarySource = sourcesByIndicator.get(indicator.national_indicator_code)?.[0];

      return {
        national_indicator_code: indicator.national_indicator_code,
        indicator_number: indicator.indicator_number,
        indicator_name: indicator.name,
        mapped_node_code: "NOT_AVAILABLE",
        mapped_node_path: "Framework node mapping is not exposed by current API",
        global_indicator_code: indicator.current_version_code ?? "NONE",
        source_organization_code: primarySource?.source_organization_code ?? "NONE",
        officer_code: primarySource?.officer_code ?? "NONE",
        periodicity_code: primarySource?.periodicity_code ?? "NONE",
        readiness_status: primarySource ? "READY" : "SOURCE_PENDING",
      };
    });
}

function getFallbackIndicatorMappings(unitCode: string) {
  if (unitCode.toUpperCase() === "SDG") {
    return sampleIndicatorMappings
      .filter((mapping) => mapping.readiness_status === "READY")
      .slice(0, 2);
  }

  return sampleIndicatorMappings;
}

const modalFieldLabelClass = "grid gap-1.5 text-xs font-semibold text-slate-700";
const modalInputClass =
  "h-10 border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const modalSelectClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const modalTextareaClass =
  "min-h-24 border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

function FormModal({
  modal,
  selectedEdition,
  selectedNode,
  frameworkLevels,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: {
  modal: FrameworkModal;
  selectedEdition: FrameworkEdition;
  selectedNode: FrameworkNode;
  frameworkLevels: FrameworkLevel[];
  isSubmitting: boolean;
  errorMessage?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  if (!modal) return null;

  const isLevelModal = modal === "create-level" || modal === "edit-level";
  const isNodeModal = ["add-root", "add-child", "edit-node", "delete"].includes(modal);
  const currentLevel = frameworkLevels.find((level) => level.level_code === selectedNode.level_code);
  const childLevelOptions =
    modal === "add-child" && currentLevel
      ? frameworkLevels.filter((level) => level.level_number > currentLevel.level_number)
      : frameworkLevels;
  const nextLevel = frameworkLevels.find((level) => level.level_number === (currentLevel?.level_number ?? 0) + 1);
  const defaultLevelCode =
    modal === "add-root"
      ? frameworkLevels[0]?.level_code
      : modal === "add-child"
        ? nextLevel?.level_code ?? selectedNode.level_code
        : selectedNode.level_code;
  const levelDisplay = (levelCode?: string) => {
    const level = frameworkLevels.find((item) => item.level_code === levelCode);
    return level ? `${level.level_number}. ${level.name} (${level.level_code})` : levelCode ?? "-";
  };
  const titleMap: Record<Exclude<FrameworkModal, null>, string> = {
    "create-edition": "Create framework edition",
    "edit-edition": "Edit framework edition",
    "delete-edition": "Deactivate framework edition",
    "restore-edition": "Restore framework edition",
    "create-level": "Create hierarchy level",
    "edit-level": "Edit hierarchy level",
    "add-root": "Create parent/root node",
    "add-child": "Add child node",
    "edit-node": "Edit node",
    delete: "Deactivate node",
    "bulk-upload": "Bulk upload hierarchy",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="framework-modal-title">
      <form onSubmit={onSubmit} className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="framework-modal-title" className="text-xl font-bold">
              {titleMap[modal]}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete the required fields and submit the change for governed save.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-5">
          {modal === "delete" ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              Confirm deactivate for <strong>{selectedNode.node_code}</strong>. Dependency checks include child nodes, indicator mappings, templates, requests, and audit history.
              <input type="hidden" name="node_code" value={selectedNode.node_code} />
              <input type="hidden" name="level_code" value={selectedNode.level_code} />
              <input type="hidden" name="node_number" value={selectedNode.node_number} />
              <input type="hidden" name="name" value={selectedNode.name} />
              <input type="hidden" name="color_value" value={selectedNode.color_value} />
            </div>
          ) : modal === "delete-edition" || modal === "restore-edition" ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Confirm {modal === "restore-edition" ? "restore" : "deactivate"} for{" "}
              <strong>{selectedEdition.framework_code} / {selectedEdition.edition_code}</strong>.
              <input type="hidden" name="framework_code" value={selectedEdition.framework_code} />
              <input type="hidden" name="edition_code" value={selectedEdition.edition_code} />
            </div>
          ) : modal === "bulk-upload" ? (
            <div className="grid gap-4">
              <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
                Upload columns: framework_code, edition_code, level_code, node_code, node_number, parent_node_code, name_en, status.
              </div>
              <label className="grid gap-1 text-sm font-semibold">
                Upload file
                <Input type="file" />
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-md border border-border p-3">
                Example 1: root node with parent blank
                </div>
                <div className="rounded-md border border-border p-3">
                  Example 2: child node with parent_node_code
                </div>
              </div>
            </div>
          ) : isLevelModal ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="grid gap-1 text-xs font-semibold">
                  Level code
                  <Input name="level_code" defaultValue={isLevelModal && modal === "edit-level" ? selectedNode.level_code : ""} placeholder="LEVEL_03" required />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Level number
                  <Input name="level_number" defaultValue={String(frameworkLevels.length + 1)} required />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Allows indicator mapping
                  <select name="allows_indicator_mapping" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue="NO">
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1 text-xs font-semibold">
                Level name en-IN
                <Input name="name" placeholder="Level display name" required />
              </label>
              <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Levels define the allowed hierarchy depth. Nodes are created under levels after this step.
              </div>
            </div>
          ) : isNodeModal ? (
            <div className="grid gap-4">
              {modal === "add-child" ? (
                <div className="grid grid-cols-3 gap-3 rounded-md bg-muted/60 p-3 text-xs max-md:grid-cols-1">
                  <div>
                    <p className="font-semibold text-muted-foreground">Parent node</p>
                    <p className="mt-1 font-mono font-bold">{selectedNode.node_code}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Parent level</p>
                    <p className="mt-1 font-bold">{levelDisplay(selectedNode.level_code)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Next child level</p>
                    <p className="mt-1 font-bold">{levelDisplay(defaultLevelCode)}</p>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-3">
                <label className="grid gap-1 text-xs font-semibold">
                  Node code
                  <Input name="node_code" defaultValue={modal === "add-child" || modal === "add-root" ? "" : selectedNode.node_code} placeholder="NODE_CODE" required />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  {modal === "add-child" ? "Child level" : "Level"}
                  <select name="level_code" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={defaultLevelCode} required>
                    {childLevelOptions.map((level) => (
                      <option key={level.level_code} value={level.level_code}>{levelDisplay(level.level_code)}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Parent node
                  <Input
                    name="parent_node_code"
                    disabled={modal === "add-child" || modal === "add-root"}
                    className={modal === "add-child" || modal === "add-root" ? "bg-muted/60" : undefined}
                    defaultValue={modal === "add-child" ? selectedNode.node_code : modal === "add-root" ? "" : selectedNode.parent_node_code ?? ""}
                    placeholder={modal === "add-root" ? "Root node has no parent" : modal === "add-child" ? "Parent is selected node" : "Optional for root"}
                  />
                </label>
              </div>
              {modal === "add-child" && childLevelOptions.length === 0 ? (
                <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-900">
                  No child level exists below this selected node level. Create the next hierarchy level first.
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-3">
                <label className="grid gap-1 text-xs font-semibold">
                  Node number
                  <Input name="node_number" defaultValue={modal === "add-child" || modal === "add-root" ? "" : selectedNode.node_number} placeholder="1.2" />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Color
                  <Input name="color_value" defaultValue={selectedNode.color_value} />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Status
                  <select name="status" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue="ACTIVE">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1 text-xs font-semibold">
                Name en-IN
                <Input name="name" defaultValue={modal === "add-child" || modal === "add-root" ? "" : selectedNode.name} placeholder="Node display name" required />
              </label>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <label className={modalFieldLabelClass}>
                  Framework code
                  <Input
                    name="framework_code"
                    defaultValue={modal === "create-edition" ? "" : selectedEdition.framework_code}
                    required
                    className={modalInputClass}
                  />
                </label>
                <label className={modalFieldLabelClass}>
                  Edition code
                  <Input
                    name="edition_code"
                    defaultValue={modal === "create-edition" ? "" : selectedEdition.edition_code}
                    required
                    className={modalInputClass}
                  />
                </label>
                <label className={modalFieldLabelClass}>
                  Status
                  <select name="status" className={modalSelectClass} defaultValue={modal === "create-edition" ? "DRAFT" : selectedEdition.status}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <label className={modalFieldLabelClass}>
                  Version label
                  <Input
                    name="version_label"
                    defaultValue={modal === "create-edition" ? "" : selectedEdition.version_label}
                    placeholder="2025"
                    className={modalInputClass}
                  />
                </label>
                <label className={modalFieldLabelClass}>
                  Effective from
                  <Input
                    name="effective_from"
                    type="date"
                    defaultValue={modal === "create-edition" || selectedEdition.effective_from === "-" ? "" : selectedEdition.effective_from}
                    className={modalInputClass}
                  />
                </label>
              </div>
              <label className={modalFieldLabelClass}>
                Name en-IN
                <Input
                  name="name"
                  defaultValue={modal === "create-edition" ? "" : selectedEdition.name}
                  required
                  className={modalInputClass}
                />
              </label>
              <label className={modalFieldLabelClass}>
                Description
                <Textarea
                  name="description"
                  defaultValue={modal === "create-edition" ? "" : selectedEdition.description}
                  className={modalTextareaClass}
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-4">
          <span className={errorMessage ? "text-xs font-semibold text-red-700" : "text-xs text-muted-foreground"}>
            {errorMessage ?? "Dependency checks run before changes are published."}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant={modal === "delete" || modal === "delete-edition" ? "destructive" : "default"} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : modal === "delete" || modal === "delete-edition" ? "Deactivate" : modal === "restore-edition" ? "Restore" : "Save/Submit"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function FrameworkEditionSetupPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const selectedUnitCode = searchParams.get("unit_code") ?? "";
  const [selectedEditionCode, setSelectedEditionCode] = useState(sampleFrameworkEditions[0].edition_code);
  const [selectedNodeCode, setSelectedNodeCode] = useState("");
  // const [coverageNodeCode, setCoverageNodeCode] = useState<string | null>(null);
  // const [indicatorSearch, setIndicatorSearch] = useState("");
  const [editionSearch, setEditionSearch] = useState("");
  // const [indicatorDetail, setIndicatorDetail] = useState<IndicatorMapping | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [treeSearch, setTreeSearch] = useState("");
  const [modal, setModal] = useState<FrameworkModal>(null);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const frameworksQuery = useQuery({
    queryKey: ["masters", "frameworks", language, selectedUnitCode],
    queryFn: () => mastersService.listFrameworks({ locale: language, unitCode: selectedUnitCode }),
    placeholderData: {
      data: sampleFrameworkEditions,
      locale: language,
      count: sampleFrameworkEditions.length,
    },
  });

  const frameworkEditions = useMemo(
    () => (frameworksQuery.data?.data ?? sampleFrameworkEditions).map((item) => toFrameworkEdition(item)),
    [frameworksQuery.data],
  );

  const selectedEdition = useMemo(
    () => frameworkEditions.find((edition) => edition.edition_code === selectedEditionCode) ?? frameworkEditions[0] ?? sampleFrameworkEditions[0],
    [frameworkEditions, selectedEditionCode],
  );

  const hierarchyQuery = useQuery({
    queryKey: ["masters", "framework-hierarchy", selectedEdition.framework_code, language],
    queryFn: () =>
      mastersService.getFrameworkHierarchy({
        frameworkCode: selectedEdition.framework_code,
        locale: language,
      }),
    enabled: Boolean(selectedEdition.framework_code),
    placeholderData: undefined,
  });

  const hierarchy = hierarchyQuery.data?.data;
  const frameworkNodes = useMemo(() => toFrameworkNodes(hierarchy), [hierarchy]);
  const frameworkLevels = useMemo(
    () => toFrameworkLevels(hierarchy, frameworkNodes),
    [frameworkNodes, hierarchy],
  );

  const indicatorsQuery = useQuery({
    queryKey: ["masters", "indicators", language, selectedUnitCode],
    queryFn: () => mastersService.listIndicators({ locale: language, unitCode: selectedUnitCode }),
    placeholderData: {
      data: [],
      locale: language,
      count: 0,
    },
  });

  const sourceAssignmentsQuery = useQuery({
    queryKey: ["masters", "source-assignments", language, selectedUnitCode],
    queryFn: () => mastersService.listSourceAssignments({ locale: language, unitCode: selectedUnitCode }),
    placeholderData: {
      data: [],
      locale: language,
      count: 0,
    },
  });

  const invalidateFrameworkQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["masters", "frameworks"] }),
      queryClient.invalidateQueries({ queryKey: ["masters", "framework-hierarchy"] }),
      queryClient.invalidateQueries({ queryKey: ["masters", "indicators"] }),
      queryClient.invalidateQueries({ queryKey: ["masters", "source-assignments"] }),
    ]);
  };

  const frameworkMutation = useMutation({
    mutationFn: async ({
      currentModal,
      formData,
    }: {
      currentModal: FrameworkModal;
      formData: FormData;
    }) => {
      if (!currentModal) {
        return;
      }

      const frameworkCode = readString(formData, "framework_code") || selectedEdition.framework_code;
      const editionCode = readString(formData, "edition_code") || selectedEdition.edition_code;

      if (currentModal === "create-edition" || currentModal === "edit-edition") {
        const body = {
          framework_code: frameworkCode,
          edition_code: editionCode,
          name: readString(formData, "name"),
          description: readOptionalString(formData, "description"),
          version_label: readOptionalString(formData, "version_label"),
          effective_from: readOptionalString(formData, "effective_from"),
          status: readString(formData, "status") || "DRAFT",
          is_active: readString(formData, "status") !== "ARCHIVED",
        };

        if (currentModal === "create-edition") {
          await mastersService.createFrameworkEdition({ locale: language, body });
          setSelectedEditionCode(editionCode);
          return;
        }

        await mastersService.updateFrameworkEdition({
          frameworkCode: selectedEdition.framework_code,
          editionCode: selectedEdition.edition_code,
          locale: language,
          body,
        });
        setSelectedEditionCode(editionCode);
        return;
      }

      if (currentModal === "delete-edition" || currentModal === "restore-edition") {
        await mastersService.setFrameworkEditionActive({
          frameworkCode,
          editionCode,
          locale: language,
          active: currentModal === "restore-edition",
        });
        return;
      }

      if (currentModal === "create-level") {
        await mastersService.createFrameworkLevel({
          frameworkCode: selectedEdition.framework_code,
          editionCode: selectedEdition.edition_code,
          locale: language,
          body: {
            level_code: readString(formData, "level_code"),
            level_number: readPositiveInteger(formData, "level_number", frameworkLevels.length + 1),
            name: readString(formData, "name"),
            allows_indicator_mapping: readBoolean(formData, "allows_indicator_mapping"),
            is_active: true,
          },
        });
        return;
      }

      if (currentModal === "add-root" || currentModal === "add-child" || currentModal === "edit-node" || currentModal === "delete") {
        const existingNode = selectedNode ?? modalSelectedNode;
        const nodeCode = readString(formData, "node_code") || existingNode.node_code;
        const body = {
          level_code: readString(formData, "level_code") || existingNode.level_code,
          node_code: nodeCode,
          name: readString(formData, "name") || existingNode.name,
          node_number: readOptionalString(formData, "node_number"),
          color_value: readOptionalString(formData, "color_value"),
          color_method: "HEX",
          status: currentModal === "delete" ? "ARCHIVED" : readString(formData, "status") || "ACTIVE",
          is_active: currentModal !== "delete",
        };

        if (currentModal === "edit-node" || currentModal === "delete") {
          await mastersService.updateFrameworkNode({
            frameworkCode: selectedEdition.framework_code,
            editionCode: selectedEdition.edition_code,
            nodeCode: existingNode.node_code,
            locale: language,
            body,
          });
          setSelectedNodeCode(nodeCode);
          return;
        }

        await mastersService.createFrameworkNode({
          frameworkCode: selectedEdition.framework_code,
          editionCode: selectedEdition.edition_code,
          locale: language,
          body,
        });

        const parentNodeCode = readString(formData, "parent_node_code");

        if (currentModal === "add-child" && parentNodeCode) {
          await mastersService.createFrameworkNodeRelationship({
            frameworkCode: selectedEdition.framework_code,
            editionCode: selectedEdition.edition_code,
            locale: language,
            body: {
              parent_node_code: parentNodeCode,
              child_node_code: nodeCode,
              relationship_type: "PARENT_CHILD",
              is_active: true,
            },
          });
        }

        setSelectedNodeCode(nodeCode);
      }
    },
    onSuccess: async (_, variables) => {
      await invalidateFrameworkQueries();
      setMutationError(null);
      setMutationMessage("Framework setup saved. Latest data is being refreshed.");
      setModal(null);

      if (variables.currentModal !== "delete-edition") {
        window.setTimeout(() => setMutationMessage(null), 5000);
      }
    },
    onError: (error) => {
      setMutationMessage(null);
      setMutationError(getSafeApiMessage(error));
    },
  });

  const handleModalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!modal || modal === "bulk-upload") {
      setModal(null);
      return;
    }

    setMutationError(null);
    frameworkMutation.mutate({
      currentModal: modal,
      formData: new FormData(event.currentTarget),
    });
  };

  const openModal = (nextModal: FrameworkModal) => {
    if ((nextModal === "add-child" || nextModal === "edit-node" || nextModal === "delete") && !selectedNode) {
      setMutationError("Select a hierarchy node first.");
      setMutationMessage(null);
      return;
    }

    setMutationError(null);
    setMutationMessage(null);
    setModal(nextModal);
  };

  const indicatorMappings = useMemo(
    () => {
      const selectedUnitSources = (sourceAssignmentsQuery.data?.data ?? []).filter((source) =>
        !selectedUnitCode || source.source_organization_code === selectedUnitCode,
      );
      const sourceIndicatorCodes = new Set(
        selectedUnitSources.map((source) => source.national_indicator_code),
      );
      const selectedUnitIndicators = (indicatorsQuery.data?.data ?? []).filter((indicator) => {
        if (indicator.framework_code && indicator.framework_code !== selectedEdition.framework_code) {
          return false;
        }

        if (!selectedUnitCode) {
          return true;
        }

        return indicator.owning_unit_code === selectedUnitCode || sourceIndicatorCodes.has(indicator.national_indicator_code);
      });
      const liveMappings = toIndicatorMappings(
        selectedUnitIndicators,
        selectedUnitSources,
        selectedEdition.framework_code,
      );
      const hasLiveIndicatorData = (indicatorsQuery.data?.data ?? []).length > 0;

      return hasLiveIndicatorData ? liveMappings : getFallbackIndicatorMappings(selectedUnitCode);
    },
    [indicatorsQuery.data, selectedEdition.framework_code, selectedUnitCode, sourceAssignmentsQuery.data],
  );

  const selectedNode = frameworkNodes.find((node) => node.node_code === selectedNodeCode);
  const modalSelectedNode = selectedNode ?? frameworkNodes[0] ?? sampleFrameworkNodes[0];

  const childNodes = selectedNode ? frameworkNodes.filter((node) => node.parent_node_code === selectedNode.node_code) : [];
  const selectedLevel = selectedNode ? frameworkLevels.find((level) => level.level_code === selectedNode.level_code) : undefined;
  const needsActionCount = indicatorMappings.filter((item) => item.readiness_status !== "READY").length;
  const treeQuery = treeSearch.trim().toLowerCase();
  const nodeMatchesSearch = (node: FrameworkNode) =>
    `${node.node_code} ${node.node_number} ${node.name} ${node.level_code}`.toLowerCase().includes(treeQuery);
  const nodeChildren = (nodeCode: string, nodes = frameworkNodes) => nodes.filter((node) => node.parent_node_code === nodeCode);
  const hasMatchingDescendant = (node: FrameworkNode): boolean =>
    nodeChildren(node.node_code).some((child) => nodeMatchesSearch(child) || hasMatchingDescendant(child));
  const hasMatchingAncestor = (node: FrameworkNode): boolean => {
    const parent = frameworkNodes.find((candidate) => candidate.node_code === node.parent_node_code);
    return parent ? nodeMatchesSearch(parent) || hasMatchingAncestor(parent) : false;
  };
  const searchableNodes = treeQuery
    ? frameworkNodes.filter((node) => nodeMatchesSearch(node) || hasMatchingDescendant(node) || hasMatchingAncestor(node))
    : frameworkNodes;
  const rootNodes = searchableNodes.filter((node) => !node.parent_node_code);
  // const allRootNodes = frameworkNodes.filter((node) => !node.parent_node_code);
  const getNodeDepth = (node: FrameworkNode): number => {
    const parent = frameworkNodes.find((candidate) => candidate.node_code === node.parent_node_code);
    return parent ? getNodeDepth(parent) + 1 : 1;
  };
  // const descendantsOf = (nodeCode: string): string[] =>
  //   nodeChildren(nodeCode).flatMap((child) => [child.node_code, ...descendantsOf(child.node_code)]);
  // const indicatorsForNode = (nodeCode: string) => {
  //   const nodeCodes = new Set([nodeCode, ...descendantsOf(nodeCode)]);
  //   return indicatorMappings.filter((mapping) => nodeCodes.has(mapping.mapped_node_code));
  // };
  // const coverageNode = coverageNodeCode ? frameworkNodes.find((node) => node.node_code === coverageNodeCode) : undefined;
  // const coverageBaseNodes = coverageNode ? nodeChildren(coverageNode.node_code) : allRootNodes;
  // const coverageNodes = coverageBaseNodes.length > 0 ? coverageBaseNodes : coverageNode ? [coverageNode] : allRootNodes;
  // const coverageChartOption = {
  //   tooltip: { trigger: "item" },
  //   series: [
  //     {
  //       type: "pie",
  //       radius: ["48%", "72%"],
  //       label: { formatter: "{b}: {c}", fontSize: 10 },
  //       data: coverageNodes.map((node) => ({
  //         name: `${node.node_number} ${node.name}`,
  //         value: Math.max(indicatorsForNode(node.node_code).length, 1),
  //         itemStyle: { color: node.color_value },
  //       })),
  //     },
  //   ],
  // };
  // const filteredIndicatorMappings = indicatorMappings.filter((mapping) =>
  //   `${mapping.national_indicator_code} ${mapping.indicator_number} ${mapping.indicator_name} ${mapping.mapped_node_path} ${mapping.readiness_status}`
  //     .toLowerCase()
  //     .includes(indicatorSearch.toLowerCase()),
  // );
  const latestActiveEdition = frameworkEditions
    .filter((edition) => edition.status === "ACTIVE")
    .toSorted((left, right) => editionTimestamp(right) - editionTimestamp(left))[0];
  const displayFrameworkEditions = frameworkEditions.filter((edition) =>
    edition.status === "DRAFT" || edition.edition_code === latestActiveEdition?.edition_code,
  );
  const filteredFrameworkEditions = displayFrameworkEditions.filter((edition) =>
    `${edition.framework_code} ${edition.edition_code} ${edition.version_label} ${edition.name} ${edition.status}`
      .toLowerCase()
      .includes(editionSearch.toLowerCase()),
  );
  const liveDataError = frameworksQuery.error ?? hierarchyQuery.error ?? indicatorsQuery.error ?? sourceAssignmentsQuery.error;
  const isLiveDataLoading =
    frameworksQuery.isPending ||
    hierarchyQuery.isPending ||
    indicatorsQuery.isPending ||
    sourceAssignmentsQuery.isPending;
  const liveIndicatorCount = indicatorsQuery.data?.data.filter((indicator) =>
    (!indicator.framework_code || indicator.framework_code === selectedEdition.framework_code) &&
    (!selectedUnitCode || indicator.owning_unit_code === selectedUnitCode),
  ).length ?? 0;
  const indicatorSummaryCount = liveIndicatorCount || indicatorMappings.length;

  const renderTreeNode = (node: FrameworkNode, depth = 0) => {
    const children = searchableNodes.filter((candidate) => candidate.parent_node_code === node.node_code);
    const searchShouldOpen = Boolean(treeQuery && (nodeMatchesSearch(node) || hasMatchingDescendant(node)));
    const isExpanded = expandedNodes[node.node_code] ?? (treeQuery ? searchShouldOpen : true);
    const isSelected = selectedNodeCode === node.node_code;
    const nodeLevel = frameworkLevels.find((level) => level.level_code === node.level_code);

    return (
      <div key={node.node_code}>
        <div
          className={[
            "grid grid-cols-[24px_1fr_auto] items-center gap-2 px-2 py-1.5 text-xs hover:bg-accent",
            isSelected ? "bg-accent text-accent-foreground" : "",
          ].join(" ")}
          style={{ paddingLeft: `${8 + depth * 18}px` }}
        >
          <button
            type="button"
            className="grid size-5 place-items-center rounded-sm hover:bg-background"
            onClick={() => setExpandedNodes((current) => ({ ...current, [node.node_code]: !isExpanded }))}
            aria-label={isExpanded ? "Collapse node" : "Expand node"}
          >
            {children.length > 0 ? (
              isExpanded ? <ChevronDown aria-hidden="true" className="size-4" /> : <ChevronRight aria-hidden="true" className="size-4" />
            ) : null}
          </button>
          <button type="button" className="min-w-0 text-left" onClick={() => setSelectedNodeCode(node.node_code)}>
            <span className="block truncate font-semibold">{node.node_number}. {node.name}</span>
            <span className="block truncate font-mono text-[11px] text-muted-foreground">Depth {getNodeDepth(node)} / {node.level_code} / {node.node_code}</span>
          </button>
          <Badge variant={nodeLevel?.allows_indicator_mapping ? "secondary" : "outline"}>
            {node.mapped_indicator_count}
          </Badge>
        </div>
        {isExpanded ? children.map((child) => renderTreeNode(child, depth + 1)) : null}
      </div>
    );
  };

  return (
    <AppShell persona="Super Admin" activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="framework-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="framework-title" className="text-2xl font-bold text-foreground">Framework Edition Setup</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage framework editions, dynamic levels, nodes, relationships, and indicator mappings.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => openModal("bulk-upload")} title="Bulk upload parsing is still UI-only until a file upload API is approved.">
              <Upload aria-hidden="true" className="size-4" />
              Bulk upload
            </Button>
            <Button variant="outline" disabled title="Download format API not available yet">
              <Download aria-hidden="true" className="size-4" />
              Download format
            </Button>
            <Button onClick={() => openModal("create-edition")}>
              <Plus aria-hidden="true" className="size-4" />
              New edition
            </Button>
          </div>
        </div>

        {isLiveDataLoading ? (
          <Loader variant="section" label="Loading Masters framework data" />
        ) : null}

        {liveDataError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {getSafeApiMessage(liveDataError)} Showing available fallback data where possible.
          </div>
        ) : null}

        {mutationMessage ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900" role="status">
            {mutationMessage}
          </div>
        ) : null}

        <div className="rounded-md border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Active unit:</span>{" "}
          <span className="font-mono">{selectedUnitCode || "ALL"}</span>
        </div>

        <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-md:grid-cols-2">
          {[
            ["Editions", frameworkEditions.length, "Live frameworks"],
            ["Levels", frameworkLevels.length, "Configured"],
            ["Nodes", frameworkNodes.length, "Hierarchy"],
            ["Indicators", indicatorSummaryCount, "Available"],
            ["Needs action", needsActionCount, "Source/mapping"],
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-md border border-border bg-card p-3">
              <p className="text-xs font-semibold text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{helper}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[minmax(0,1.35fr)_360px] gap-4 max-xl:grid-cols-1">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Framework editions</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex w-72 items-center gap-2 rounded-md border border-border px-2">
                    <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                    <span className="sr-only">Search framework editions</span>
                    <Input
                      className="border-0 bg-transparent"
                      placeholder="Search edition"
                      value={editionSearch}
                      onChange={(event) => setEditionSearch(event.target.value)}
                    />
                  </label>
                  <label className="flex min-w-64 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                    <span className="sr-only">Select framework edition</span>
                    <select
                      className="w-full bg-transparent text-sm font-semibold outline-none"
                      value={selectedEditionCode}
                      onChange={(event) => setSelectedEditionCode(event.target.value)}
                    >
                      {frameworkEditions.map((edition) => (
                        <option key={`${edition.framework_code}-${edition.edition_code}`} value={edition.edition_code}>
                          {edition.framework_code} / {edition.version_label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Framework</TableHead>
                    <TableHead>Edition</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Effective</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFrameworkEditions.map((edition) => (
                    <TableRow key={edition.edition_code} className={selectedEditionCode === edition.edition_code ? "bg-accent/60" : ""}>
                      <TableCell>
                        <button type="button" onClick={() => setSelectedEditionCode(edition.edition_code)} className="text-left">
                          <span className="block font-mono text-[11px]">{edition.framework_code}</span>
                          <span className="font-semibold">{edition.name}</span>
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{edition.edition_code}</TableCell>
                      <TableCell>{edition.version_label}</TableCell>
                      <TableCell>{edition.effective_from}</TableCell>
                      <TableCell><Badge variant={statusVariant(edition.status)}>{edition.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="xs" variant="outline" onClick={() => { setSelectedEditionCode(edition.edition_code); openModal("edit-edition"); }}>
                            <Edit3 aria-hidden="true" className="size-3" />
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            variant={edition.is_active ? "destructive" : "outline"}
                            onClick={() => {
                              setSelectedEditionCode(edition.edition_code);
                              openModal(edition.is_active ? "delete-edition" : "restore-edition");
                            }}
                          >
                            <Trash2 aria-hidden="true" className="size-3" />
                            {edition.is_active ? "Deactivate" : "Restore"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active edition</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Edition code</dt>
                  <dd className="mt-1 font-mono font-bold">{selectedEdition.edition_code}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="mt-1 font-bold">{selectedEdition.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="mt-1 leading-5">{selectedEdition.description}</dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => openModal("add-root")}>Create Level</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-[400px_minmax(0,1fr)] gap-4 max-xl:grid-cols-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hierarchy tree</CardTitle>
                <div className="flex gap-2">
                  {/* <Button size="sm" variant="outline" onClick={() => openModal("create-level")}>
                    <Plus aria-hidden="true" className="size-4" />
                    Create level
                  </Button> */}
                  <Button size="sm" variant="outline" onClick={() => openModal("add-root")}>
                    <Plus aria-hidden="true" className="size-4" />
                    New parent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <label className="mb-3 flex items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search hierarchy tree</span>
                <Input className="border-0 bg-transparent" placeholder="Search level, node code, or node name" value={treeSearch} onChange={(event) => setTreeSearch(event.target.value)} />
              </label>
              <div className="max-h-[430px] overflow-y-auto rounded-md bg-muted/30 py-2">
                {rootNodes.map((node) => renderTreeNode(node))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Selected node</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={!selectedNode} onClick={() => openModal("edit-node")}>Edit</Button>
                  <Button size="sm" variant="outline" disabled={!selectedNode} onClick={() => openModal("add-child")}>Add child</Button>
                  <Button size="sm" variant="destructive" disabled={!selectedNode} onClick={() => openModal("delete")}>Deactivate</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <>
                  <div className="grid grid-cols-4 gap-3 text-xs max-lg:grid-cols-2">
                    {[
                      ["Node code", selectedNode.node_code],
                      ["Depth", `Level ${getNodeDepth(selectedNode)}`],
                      ["Level", selectedNode.level_code],
                      ["Number", selectedNode.node_number],
                      ["Parent", selectedNode.parent_node_code ?? "ROOT"],
                      ["Mapped indicators", String(selectedNode.mapped_indicator_count)],
                      ["Children", String(childNodes.length)],
                      ["Color", selectedNode.color_value],
                      ["Allows mapping", selectedLevel?.allows_indicator_mapping ? "YES" : "NO"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border border-border bg-muted/40 p-3">
                        <p className="text-muted-foreground">{label}</p>
                        <p className="mt-1 font-bold">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-md border border-border p-3">
                    <p className="text-sm font-bold">{selectedNode.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add/edit/delete opens modal forms with dependency checks.
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  Select a node from the hierarchy tree to view its details.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Indicator mappings for selected framework</CardTitle>
              <label className="flex w-72 items-center gap-2 rounded-md border border-border px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search mappings</span>
                <Input
                  className="border-0 bg-transparent"
                  placeholder="Search indicator or source"
                  value={indicatorSearch}
                  onChange={(event) => setIndicatorSearch(event.target.value)}
                />
              </label>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-4 max-lg:grid-cols-1">
              <div className="rounded-md bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">Mapping coverage drilldown</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {coverageNode ? `${coverageNode.level_code} / ${coverageNode.node_number}` : "Root level coverage"}
                    </p>
                  </div>
                  {coverageNode ? (
                    <Button size="xs" variant="outline" onClick={() => setCoverageNodeCode(null)}>Back</Button>
                  ) : null}
                </div>
                <EChart title="Framework indicator mapping coverage" option={coverageChartOption} className="mt-2 h-48" />
                <div className="mt-2 grid gap-1">
                  {coverageNodes.map((node) => (
                    <button
                      key={node.node_code}
                      type="button"
                      className="grid grid-cols-[10px_1fr_auto] items-center gap-2 rounded-sm px-2 py-1 text-left text-xs hover:bg-background"
                      onClick={() => {
                        setCoverageNodeCode(node.node_code);
                        setSelectedNodeCode(node.node_code);
                      }}
                    >
                      <span className="size-2 rounded-full" style={{ backgroundColor: node.color_value }} />
                      <span className="truncate">{node.node_number} {node.name}</span>
                      <Badge variant="outline">{indicatorsForNode(node.node_code).length}</Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md bg-muted/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">All mapped indicators</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Search opens matching indicators with full parent path context.</p>
                  </div>
                  <label className="flex w-64 items-center gap-2 rounded-md bg-background px-2">
                    <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                    <span className="sr-only">Search all mapped indicators</span>
                    <Input className="border-0 bg-transparent" placeholder="Search indicators" value={indicatorSearch} onChange={(event) => setIndicatorSearch(event.target.value)} />
                  </label>
                </div>
                <div className="mt-3 max-h-52 overflow-y-auto">
                  {filteredIndicatorMappings.map((mapping) => (
                    <details key={mapping.national_indicator_code} className="border-b border-border/60 py-2">
                      <summary className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-2 text-xs font-semibold">
                        <span>{mapping.indicator_number} {mapping.indicator_name}</span>
                        <Badge variant={statusVariant(mapping.readiness_status)}>{mapping.readiness_status}</Badge>
                      </summary>
                      <div className="mt-2 grid gap-2 text-[11px] text-muted-foreground">
                        <span>{mapping.mapped_node_path}</span>
                        <span className="font-mono">Global: {mapping.global_indicator_code} / Source: {mapping.source_organization_code}</span>
                        <Button size="xs" variant="outline" className="w-fit" onClick={() => setIndicatorDetail(mapping)}>
                          Open detail
                        </Button>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead>Mapped path</TableHead>
                  <TableHead>Global</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicatorMappings.map((mapping) => (
                  <TableRow key={mapping.national_indicator_code}>
                    <TableCell>
                      <span className="block font-mono text-[11px]">{mapping.national_indicator_code}</span>
                      <span className="text-xs font-semibold">{mapping.indicator_name}</span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="block font-mono text-[11px]">{mapping.mapped_node_code}</span>
                      <span className="text-muted-foreground">{mapping.mapped_node_path}</span>
                    </TableCell>
                    <TableCell><Badge variant={statusVariant(mapping.global_indicator_code)}>{mapping.global_indicator_code}</Badge></TableCell>
                    <TableCell className="font-mono text-[11px]">{mapping.source_organization_code}</TableCell>
                    <TableCell className="font-mono text-[11px]">{mapping.officer_code}</TableCell>
                    <TableCell><Badge variant={statusVariant(mapping.readiness_status)}>{mapping.readiness_status}</Badge></TableCell>
                    <TableCell><Button size="xs" variant="outline" onClick={() => setIndicatorDetail(mapping)}>Detail</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card> */}
      </section>

      <FormModal
        modal={modal}
        selectedEdition={selectedEdition}
        selectedNode={modalSelectedNode}
        frameworkLevels={frameworkLevels}
        isSubmitting={frameworkMutation.isPending}
        errorMessage={mutationError}
        onSubmit={handleModalSubmit}
        onClose={() => setModal(null)}
      />
      {/* {indicatorDetail ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="framework-indicator-detail-title">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
            <div className="flex items-start justify-between border-b border-border/70 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Indicator mapping detail</p>
                <h2 id="framework-indicator-detail-title" className="text-xl font-bold">{indicatorDetail.indicator_number} {indicatorDetail.indicator_name}</h2>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIndicatorDetail(null)} aria-label="Close indicator detail">
                <X aria-hidden="true" className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto p-5 text-xs max-md:grid-cols-1">
              {[
                ["National indicator", indicatorDetail.national_indicator_code],
                ["Mapped node", indicatorDetail.mapped_node_code],
                ["Mapped path", indicatorDetail.mapped_node_path],
                ["Global indicator", indicatorDetail.global_indicator_code],
                ["Source organization", indicatorDetail.source_organization_code],
                ["Officer", indicatorDetail.officer_code],
                ["Periodicity", indicatorDetail.periodicity_code],
                ["Readiness", indicatorDetail.readiness_status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-muted/50 p-3">
                  <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words font-mono text-[11px] font-bold">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-border/70 bg-muted/40 px-5 py-4">
              <Button type="button" onClick={() => setIndicatorDetail(null)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null} */}
    </AppShell>
  );
}
