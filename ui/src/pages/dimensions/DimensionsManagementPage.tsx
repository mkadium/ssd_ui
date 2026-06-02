import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  FileUp,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

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
import {
  dimensionDefinitions,
  dimensionMemberSets,
  dimensionMembers,
  dimensionRollupRules,
  dimensionUsage,
  geographies,
  geographyLevels,
  timeFrequencies,
  timePeriods,
  type DimensionMember,
} from "@/data/dimensionsManagement.sample";

type DimensionTab = "members" | "rollups" | "member-sets" | "geography" | "time";
type DimensionModal =
  | "view-member"
  | "create-root"
  | "add-child"
  | "edit-member"
  | "delete-member"
  | "create-dimension"
  | "bulk-upload"
  | null;

const statusVariant = (status?: string) => {
  if (["ACTIVE", "LOW"].includes(status ?? "")) return "secondary";
  if (["DRAFT", "CLOSED", "MEDIUM"].includes(status ?? "")) return "outline";
  if (["RETIRED", "HIGH"].includes(status ?? "")) return "destructive";
  return "ghost";
};

function Field({ label, value, readOnly = false }: { label: string; value?: string | number; readOnly?: boolean }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <Input defaultValue={value ?? ""} readOnly={readOnly} className={readOnly ? "bg-muted/60" : undefined} />
    </label>
  );
}

function DimensionModalView({
  modal,
  selectedDimensionCode,
  selectedDimensionName,
  selectedMember,
  onClose,
}: {
  modal: DimensionModal;
  selectedDimensionCode: string;
  selectedDimensionName: string;
  selectedMember?: DimensionMember;
  onClose: () => void;
}) {
  if (!modal) return null;

  const isDelete = modal === "delete-member";
  const isView = modal === "view-member";
  const titleMap: Record<Exclude<DimensionModal, null>, string> = {
    "view-member": "View member detail",
    "create-root": "Create root member",
    "add-child": "Add child member",
    "edit-member": "Edit member",
    "delete-member": "Delete member",
    "create-dimension": "Create dimension",
    "bulk-upload": "Bulk upload members",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="dimension-modal-title">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Dimension Management</p>
            <h2 id="dimension-modal-title" className="text-xl font-bold">{titleMap[modal]}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-5">
          {modal === "bulk-upload" ? (
            <div className="grid gap-4">
              <div className="rounded-md bg-muted/60 p-4 text-sm">
                Upload columns: dimension_code, member_code, parent_member_code, external_code, name_en, short_name, sort_order, status.
              </div>
              <label className="grid gap-1 text-sm font-semibold">
                Upload file
                <Input type="file" />
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs max-md:grid-cols-1">
                <div className="rounded-md bg-muted/40 p-3">
                  Example 1: root member with blank parent_member_code.
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                  Example 2: child member with parent_member_code set to an existing member.
                </div>
              </div>
            </div>
          ) : null}

          {modal === "create-dimension" ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                <Field label="dimension_code" value="" />
                <label className="grid gap-1 text-xs font-semibold">
                  dimension_type
                  <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue="GENERAL">
                    <option>GENERAL</option>
                    <option>GEOGRAPHY</option>
                    <option>TIME</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  value_type
                  <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue="TEXT">
                    <option>TEXT</option>
                    <option>NUMERIC</option>
                    <option>INTEGER</option>
                    <option>BOOLEAN</option>
                    <option>DATE</option>
                  </select>
                </label>
                <Field label="name en-IN" value="" />
                <Field label="short_name en-IN" value="" />
                <label className="grid gap-1 text-xs font-semibold">
                  is_hierarchical
                  <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue="YES">
                    <option>YES</option>
                    <option>NO</option>
                  </select>
                </label>
              </div>
              <Field label="description en-IN" value="" />
              <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                This creates the dimension definition first. Add root members after the dimension is available.
              </div>
            </div>
          ) : null}

          {isView && selectedMember ? (
            <dl className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
              {Object.entries(selectedMember).map(([key, value]) => (
                <div key={key} className="rounded-md bg-muted/50 p-3">
                  <dt className="text-[11px] font-semibold text-muted-foreground">{key}</dt>
                  <dd className="mt-1 break-words font-mono text-[11px] font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {isDelete && selectedMember ? (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-900">
              Confirm delete for <strong>{selectedMember.member_code}</strong>. Dependency checks must include member sets, template axes/cells, request scope members, ingestion staged records, validation, review, and dashboard usage.
            </div>
          ) : null}

          {["create-root", "add-child", "edit-member"].includes(modal) ? (
            <div className="grid gap-4">
              {modal === "add-child" && selectedMember ? (
                <div className="grid grid-cols-3 gap-3 rounded-md bg-muted/60 p-3 text-xs max-md:grid-cols-1">
                  <div>
                    <p className="font-semibold text-muted-foreground">Parent member</p>
                    <p className="mt-1 font-mono font-bold">{selectedMember.member_code}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Parent name</p>
                    <p className="mt-1 font-bold">{selectedMember.name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Dimension</p>
                    <p className="mt-1 font-mono font-bold">{selectedDimensionCode}</p>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                {modal === "create-root" ? (
                  <Field label="dimension_code" value={selectedDimensionCode} />
                ) : (
                  <Field label="dimension_code" value={selectedDimensionCode} readOnly />
                )}
                <Field label="member_code" value={modal === "add-child" ? "" : selectedMember?.member_code} />
                <Field
                  label="parent_member_code"
                  value={modal === "create-root" ? "ROOT" : modal === "add-child" ? selectedMember?.member_code : selectedMember?.parent_member_code ?? "ROOT"}
                  readOnly={modal !== "edit-member"}
                />
                <Field label="external_code" value={modal === "add-child" ? "" : selectedMember?.external_code} />
                <Field label="sort_order" value={modal === "add-child" ? "" : selectedMember?.sort_order} />
                <label className="grid gap-1 text-xs font-semibold">
                  status
                  <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={selectedMember?.status ?? "ACTIVE"}>
                    <option>ACTIVE</option>
                    <option>DRAFT</option>
                    <option>RETIRED</option>
                  </select>
                </label>
              </div>
              <Field label="name en-IN" value={modal === "add-child" ? "" : selectedMember?.name} />
              <Field label="short_name en-IN" value={modal === "add-child" ? "" : selectedMember?.short_name} />
              {modal === "create-root" ? (
                <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  Current dimension is {selectedDimensionName}. You can change `dimension_code` when creating the first root for a new dimension draft.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border/70 bg-muted/40 px-5 py-4">
          <span className="text-xs text-muted-foreground">Mutation actions are visual states until governed Dimensions mutation APIs exist.</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            {!isView ? (
              <Button type="button" variant={isDelete ? "destructive" : "default"} onClick={onClose}>
                {isDelete ? "Delete" : "Save/Submit"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DimensionsManagementPage() {
  const [selectedDimensionCode, setSelectedDimensionCode] = useState(dimensionDefinitions[0].dimension_code);
  const [selectedMemberCode, setSelectedMemberCode] = useState("IND");
  const [dimensionSearch, setDimensionSearch] = useState("");
  const [treeSearch, setTreeSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [activeTab, setActiveTab] = useState<DimensionTab>("members");
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<DimensionModal>(null);

  const selectedDimension = dimensionDefinitions.find((dimension) => dimension.dimension_code === selectedDimensionCode) ?? dimensionDefinitions[0];
  const filteredDimensions = dimensionDefinitions.filter((dimension) =>
    `${dimension.dimension_code} ${dimension.dimension_type} ${dimension.name} ${dimension.description} ${dimension.status} ${dimension.member_count} ${dimension.set_count} ${dimension.template_usage_count}`
      .toLowerCase()
      .includes(dimensionSearch.toLowerCase()),
  );
  const membersForDimension = dimensionMembers.filter((member) => member.dimension_code === selectedDimension.dimension_code);
  const selectedMember = membersForDimension.find((member) => member.member_code === selectedMemberCode) ?? membersForDimension[0];
  const usageRows = dimensionUsage.filter((usage) => usage.dimension_code === selectedDimension.dimension_code);
  const memberSetsForDimension = dimensionMemberSets.filter((set) => set.dimension_code === selectedDimension.dimension_code);
  const rollupRulesForDimension = dimensionRollupRules.filter((rule) => rule.dimension_code === selectedDimension.dimension_code);

  const memberChildren = (memberCode: string, members = membersForDimension) => members.filter((member) => member.parent_member_code === memberCode);
  const treeQuery = treeSearch.trim().toLowerCase();
  const memberMatchesSearch = (member: DimensionMember) =>
    `${member.member_code} ${member.external_code} ${member.name} ${member.short_name}`.toLowerCase().includes(treeQuery);
  const hasMatchingDescendant = (member: DimensionMember): boolean =>
    memberChildren(member.member_code).some((child) => memberMatchesSearch(child) || hasMatchingDescendant(child));
  const hasMatchingAncestor = (member: DimensionMember): boolean => {
    const parent = membersForDimension.find((candidate) => candidate.member_code === member.parent_member_code);
    return parent ? memberMatchesSearch(parent) || hasMatchingAncestor(parent) : false;
  };
  const searchableMembers = treeQuery
    ? membersForDimension.filter((member) => memberMatchesSearch(member) || hasMatchingDescendant(member) || hasMatchingAncestor(member))
    : membersForDimension;
  const rootMembers = searchableMembers.filter((member) => !member.parent_member_code);
  const getMemberDepth = (member: DimensionMember): number => {
    const parent = membersForDimension.find((candidate) => candidate.member_code === member.parent_member_code);
    return parent ? getMemberDepth(parent) + 1 : 1;
  };

  const filteredMembers = membersForDimension.filter((member) =>
    Object.values(member).join(" ").toLowerCase().includes(tableSearch.toLowerCase()),
  );

  const tabs: { code: DimensionTab; label: string }[] = [
    { code: "members", label: "Members" },
    { code: "rollups", label: "Rollups" },
    { code: "member-sets", label: "Member sets" },
    { code: "geography", label: "Geography" },
    { code: "time", label: "Time periods" },
  ];

  const rootMemberCount = membersForDimension.filter((member) => !member.parent_member_code).length;
  const childMemberCount = membersForDimension.length - rootMemberCount;
  const activeMemberCount = membersForDimension.filter((member) => member.status === "ACTIVE").length;
  const inactiveMemberCount = membersForDimension.length - activeMemberCount;
  const maxMemberDepth = membersForDimension.reduce((maxDepth, member) => Math.max(maxDepth, getMemberDepth(member)), 0);
  const templateSetCount = memberSetsForDimension.filter((set) => set.set_type === "TEMPLATE_SCOPE").length;
  const requestSetCount = memberSetsForDimension.filter((set) => set.set_type === "REQUEST_SCOPE").length;
  const reportSetCount = memberSetsForDimension.filter((set) => set.set_type === "REPORT_SCOPE").length;
  const dependencyRecordCount = usageRows.reduce((sum, usage) => sum + usage.record_count, 0);
  const highRiskCount = usageRows.filter((usage) => usage.risk === "HIGH").length;

  const statCards: {
    label: string;
    value: number | string;
    badge: string;
    helper: string;
    detail: string;
    footnote: string;
    targetTab: DimensionTab;
  }[] = [
    {
      label: "Members",
      value: membersForDimension.length,
      badge: `${activeMemberCount} active`,
      helper: `${rootMemberCount} root / ${childMemberCount} child`,
      detail: inactiveMemberCount ? `${inactiveMemberCount} inactive or draft` : "All listed members active",
      footnote: selectedDimension.is_hierarchical ? `Max depth ${maxMemberDepth}` : "Flat list, no parent chain",
      targetTab: "members",
    },
    {
      label: "Definition",
      value: selectedDimension.status,
      badge: selectedDimension.dimension_code,
      helper: `${selectedDimension.dimension_type} / ${selectedDimension.value_type}`,
      detail: selectedDimension.is_hierarchical ? "Hierarchy enabled" : "Flat dimension",
      footnote: "Code and localized labels drive templates",
      targetTab: "members",
    },
    {
      label: "Member sets",
      value: memberSetsForDimension.length,
      badge: "Scopes",
      helper: `${templateSetCount} template / ${requestSetCount} request`,
      detail: reportSetCount ? `${reportSetCount} report scope` : "No report scope in sample",
      footnote: "Used to constrain template and request axes",
      targetTab: "member-sets",
    },
    {
      label: "Usage",
      value: dependencyRecordCount,
      badge: highRiskCount ? `${highRiskCount} high` : "Checked",
      helper: `${usageRows.length} dependency areas`,
      detail: `${selectedDimension.template_usage_count} template bindings`,
      footnote: highRiskCount ? "Review before structural edits" : "No high-risk sample dependency",
      targetTab: "members",
    },
    {
      label: "Rollups",
      value: rollupRulesForDimension.length,
      badge: rollupRulesForDimension.some((rule) => rule.status === "ACTIVE") ? "Active" : "None",
      helper: rollupRulesForDimension.length ? rollupRulesForDimension[0].entry_mode : "No rollup rule",
      detail: rollupRulesForDimension.length ? `${rollupRulesForDimension[0].parent_label} -> ${rollupRulesForDimension[0].children.map((child) => child.label).join(" + ")}` : "Flat/manual members only",
      footnote: rollupRulesForDimension.length ? `${rollupRulesForDimension[0].aggregation_method} / ${rollupRulesForDimension[0].validation_rule_code}` : "Optional enterprise template behavior",
      targetTab: "rollups",
    },
  ];

  const renderTreeMember = (member: DimensionMember, depth = 0) => {
    const children = searchableMembers.filter((candidate) => candidate.parent_member_code === member.member_code);
    const searchShouldOpen = Boolean(treeQuery && (memberMatchesSearch(member) || hasMatchingDescendant(member)));
    const isExpanded = expandedMembers[member.member_code] ?? (treeQuery ? searchShouldOpen : true);
    const isSelected = selectedMember?.member_code === member.member_code;

    return (
      <div key={member.member_code}>
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
            onClick={() => setExpandedMembers((current) => ({ ...current, [member.member_code]: !isExpanded }))}
            aria-label={isExpanded ? "Collapse member" : "Expand member"}
          >
            {children.length > 0 ? (
              isExpanded ? <ChevronDown aria-hidden="true" className="size-4" /> : <ChevronRight aria-hidden="true" className="size-4" />
            ) : null}
          </button>
          <button type="button" className="min-w-0 text-left" onClick={() => setSelectedMemberCode(member.member_code)}>
            <span className="block truncate font-semibold">{member.name}</span>
            <span className="block truncate font-mono text-[11px] text-muted-foreground">Depth {getMemberDepth(member)} / {member.member_code}</span>
          </button>
          <Badge variant={statusVariant(member.status)}>{member.status}</Badge>
        </div>
        {isExpanded ? children.map((child) => renderTreeMember(child, depth + 1)) : null}
      </div>
    );
  };

  const openMemberModal = (nextModal: DimensionModal, member = selectedMember) => {
    setSelectedMemberCode(member?.member_code ?? selectedMemberCode);
    setModal(nextModal);
  };

  return (
    <AppShell persona="Unit Admin" activeDashboard="/dashboard/unit-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="dimensions-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="dimensions-title" className="text-2xl font-bold">Dimension Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage dimension definitions, hierarchy members, member sets, geography, and time references for the selected unit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setModal("bulk-upload")}><FileUp aria-hidden="true" className="size-4" /> Bulk upload</Button>
            <Button variant="outline"><Download aria-hidden="true" className="size-4" /> Download format</Button>
            <Button variant="outline" onClick={() => setModal("create-dimension")}><Plus aria-hidden="true" className="size-4" /> New dimension</Button>
            <Button variant="outline" onClick={() => openMemberModal("create-root")}><Plus aria-hidden="true" className="size-4" /> New root</Button>
            <Button onClick={() => openMemberModal("add-child")}><Plus aria-hidden="true" className="size-4" /> Add child</Button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {statCards.map((card) => (
            <button
              key={card.label}
              type="button"
              className="min-h-[132px] rounded-md bg-card p-3 text-left shadow-sm ring-1 ring-border/60 hover:bg-muted/30"
              onClick={() => setActiveTab(card.targetTab)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                <Badge variant="outline">{card.badge}</Badge>
              </div>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs font-semibold">{card.helper}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{card.detail}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{card.footnote}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Dimensions</CardTitle>
                <Badge variant="outline">{filteredDimensions.length}/{dimensionDefinitions.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              <label className="mb-1 flex items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search dimensions</span>
                <Input
                  className="border-0 bg-transparent"
                  placeholder="Search dimensions"
                  value={dimensionSearch}
                  onChange={(event) => setDimensionSearch(event.target.value)}
                />
              </label>
              {filteredDimensions.map((dimension) => (
                <button
                  key={dimension.dimension_code}
                  type="button"
                  onClick={() => {
                    setSelectedDimensionCode(dimension.dimension_code);
                    setSelectedMemberCode(dimensionMembers.find((member) => member.dimension_code === dimension.dimension_code)?.member_code ?? "");
                    setTreeSearch("");
                    setTableSearch("");
                  }}
                  className={[
                    "rounded-md px-3 py-2 text-left text-xs hover:bg-muted",
                    selectedDimensionCode === dimension.dimension_code ? "bg-accent text-accent-foreground" : "bg-muted/40",
                  ].join(" ")}
                >
                  <span className="block font-bold">{dimension.name}</span>
                  <span className="block font-mono text-[11px] text-muted-foreground">{dimension.dimension_code} / {dimension.dimension_type}</span>
                  <span className="mt-1 flex gap-1">
                    <Badge variant={statusVariant(dimension.status)}>{dimension.status}</Badge>
                    <Badge variant="outline">{dimension.member_count} members</Badge>
                  </span>
                </button>
              ))}
              {!filteredDimensions.length ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">No dimensions found.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Member hierarchy</CardTitle>
                <Button size="sm" variant="outline" onClick={() => openMemberModal("create-root")}>
                  <Plus aria-hidden="true" className="size-4" />
                  Root
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <label className="mb-3 flex items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search member hierarchy</span>
                <Input className="border-0 bg-transparent" placeholder="Search all hierarchy levels" value={treeSearch} onChange={(event) => setTreeSearch(event.target.value)} />
              </label>
              <div className="max-h-[440px] overflow-y-auto rounded-md bg-muted/30 py-2">
                {rootMembers.length ? rootMembers.map((member) => renderTreeMember(member)) : (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">No members found for this filter.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Selected member</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openMemberModal("view-member")}><Eye aria-hidden="true" className="size-4" /> View</Button>
                <Button size="sm" variant="outline" onClick={() => openMemberModal("edit-member")}><Edit3 aria-hidden="true" className="size-4" /> Edit</Button>
                <Button size="sm" variant="outline" onClick={() => openMemberModal("add-child")}><Plus aria-hidden="true" className="size-4" /> Add child</Button>
                <Button size="sm" variant="destructive" onClick={() => openMemberModal("delete-member")}><Trash2 aria-hidden="true" className="size-4" /> Delete</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-8 gap-3 text-xs max-xl:grid-cols-4 max-md:grid-cols-2">
              {[
                ["Dimension", selectedDimension.dimension_code],
                ["Type", selectedDimension.dimension_type],
                ["Member", selectedMember?.member_code],
                ["Parent", selectedMember?.parent_member_code ?? "ROOT"],
                ["Depth", selectedMember ? `Level ${getMemberDepth(selectedMember)}` : "-"],
                ["Children", selectedMember ? memberChildren(selectedMember.member_code).length : 0],
                ["Value type", selectedDimension.value_type],
                ["Status", selectedMember?.status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-muted/50 p-3">
                  <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words font-mono text-[11px] font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-4 max-lg:grid-cols-1">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-sm font-bold">{selectedDimension.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedDimension.description}</p>
                <p className="mt-3 text-sm font-bold">{selectedMember?.name ?? "No member selected"}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{selectedMember?.external_code ?? "-"}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-sm font-bold">Dependency / usage</p>
                <div className="mt-2 grid gap-2">
                  {(usageRows.length ? usageRows : [{ id: "none", usage_area: "None", dependency: "No dependency recorded in sample data", record_count: 0, risk: "LOW" as const }]).map((usage) => (
                    <div key={usage.id} className="grid grid-cols-[1fr_auto] gap-2 text-xs">
                      <span>
                        <span className="block font-semibold">{usage.usage_area}</span>
                        <span className="text-muted-foreground">{usage.dependency}</span>
                      </span>
                      <Badge variant={statusVariant(usage.risk)}>{usage.risk}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Dimension detail tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.code}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.code}
                    onClick={() => setActiveTab(tab.code)}
                    className={[
                      "shrink-0 border-b-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground",
                      activeTab === tab.code ? "border-primary text-primary" : "border-transparent",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search table</span>
                <Input className="border-0 bg-transparent" placeholder="Search records" value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} />
              </label>
            </div>

            {activeTab === "members" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>External</TableHead>
                    <TableHead>Sort</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <span className="block font-mono text-[11px]">{member.member_code}</span>
                        <span className="text-xs font-semibold">{member.name}</span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{member.parent_member_code ?? "ROOT"}</TableCell>
                      <TableCell className="font-mono text-[11px]">{member.external_code}</TableCell>
                      <TableCell>{member.sort_order}</TableCell>
                      <TableCell><Badge variant={statusVariant(member.status)}>{member.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon-xs" variant="outline" aria-label="View" onClick={() => openMemberModal("view-member", member)}><Eye aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Edit" onClick={() => openMemberModal("edit-member", member)}><Edit3 aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Add child" onClick={() => openMemberModal("add-child", member)}><Plus aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="destructive" aria-label="Delete" onClick={() => openMemberModal("delete-member", member)}><Trash2 aria-hidden="true" className="size-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {activeTab === "rollups" ? (
              <div className="grid gap-3">
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  Rollup rules define parent-member behavior for template/data-entry validation. They are not a full formula engine.
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Children</TableHead>
                      <TableHead>Entry mode</TableHead>
                      <TableHead>Aggregation</TableHead>
                      <TableHead>Measure</TableHead>
                      <TableHead>Validation</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rollupRulesForDimension.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono text-[11px]">{rule.rule_code}</TableCell>
                        <TableCell>
                          <span className="block font-semibold">{rule.parent_label}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{rule.parent_member_code}</span>
                        </TableCell>
                        <TableCell className="max-w-64 whitespace-normal">
                          {rule.children.map((child) => (
                            <Badge key={child.member_code} variant="outline" className="mr-1">{child.child_order}. {child.label}</Badge>
                          ))}
                        </TableCell>
                        <TableCell><Badge variant="outline">{rule.entry_mode}</Badge></TableCell>
                        <TableCell>{rule.aggregation_method}</TableCell>
                        <TableCell className="font-mono text-[11px]">{rule.measure_code}</TableCell>
                        <TableCell className="font-mono text-[11px]">{rule.validation_rule_code}</TableCell>
                        <TableCell><Badge variant={statusVariant(rule.status)}>{rule.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {!rollupRulesForDimension.length ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                          No rollup rules configured for this dimension.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {activeTab === "member-sets" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Set</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberSetsForDimension.map((set) => (
                    <TableRow key={set.id}>
                      <TableCell className="font-mono text-[11px]">{set.set_code}</TableCell>
                      <TableCell>{set.set_type}</TableCell>
                      <TableCell>{set.name}</TableCell>
                      <TableCell>{set.member_count}</TableCell>
                      <TableCell><Badge variant={statusVariant(set.status)}>{set.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {activeTab === "geography" ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {geographyLevels.map((level) => (
                    <Badge key={level.level_code} variant="outline">{level.level_number}. {level.name}</Badge>
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Geography</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>ISO</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geographies.filter((geo) => Object.values(geo).join(" ").toLowerCase().includes(tableSearch.toLowerCase())).map((geo) => (
                      <TableRow key={geo.geography_code}>
                        <TableCell>
                          <span className="block font-mono text-[11px]">{geo.geography_code}</span>
                          <span className="text-xs font-semibold">{geo.name}</span>
                        </TableCell>
                        <TableCell>{geo.level_code}</TableCell>
                        <TableCell className="font-mono text-[11px]">{geo.parent_geography_code ?? "ROOT"}</TableCell>
                        <TableCell className="font-mono text-[11px]">{geo.iso_alpha3_code ?? "-"}</TableCell>
                        <TableCell><Badge variant={statusVariant(geo.status)}>{geo.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {activeTab === "time" ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {timeFrequencies.map((frequency) => (
                    <Badge key={frequency.frequency_code} variant="outline">{frequency.name}: {frequency.months_interval} months</Badge>
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timePeriods.filter((period) => Object.values(period).join(" ").toLowerCase().includes(tableSearch.toLowerCase())).map((period) => (
                      <TableRow key={period.time_period_code}>
                        <TableCell>
                          <span className="block font-mono text-[11px]">{period.time_period_code}</span>
                          <span className="text-xs font-semibold">{period.name}</span>
                        </TableCell>
                        <TableCell>{period.frequency_code}</TableCell>
                        <TableCell>{period.period_year}</TableCell>
                        <TableCell>{period.start_date}</TableCell>
                        <TableCell>{period.end_date}</TableCell>
                        <TableCell><Badge variant={statusVariant(period.status)}>{period.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rows are sample-data previews shaped from Dimensions DB/API contracts.</span>
              <div className="flex gap-2">
                <Button size="xs" variant="outline">Previous</Button>
                <Button size="xs" variant="outline">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <DimensionModalView
        modal={modal}
        selectedDimensionCode={selectedDimension.dimension_code}
        selectedDimensionName={selectedDimension.name}
        selectedMember={selectedMember}
        onClose={() => setModal(null)}
      />
    </AppShell>
  );
}
