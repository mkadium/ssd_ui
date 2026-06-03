import {
  CheckCircle2,
  Code2,
  Edit3,
  Eye,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Redo2,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react";

import { ApiError } from "@/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { dimensionMembers } from "@/data/dimensionsManagement.sample";
import { nationalIndicatorOptions, unitOptions } from "@/data/mastersManagement.sample";
import {
  templateAxes,
  templateDefinitions,
  templateMeasures,
  templateValidationRules,
  templateVersions,
  type TemplateDefinitionSample,
  type TemplateStatus,
} from "@/data/templatesManagement.sample";
import { useLanguage } from "@/providers/language-context";
import { templatesService } from "@/services/templatesService";
import type { TemplateDefinitionListItem } from "@/types/templates";

type TemplateTab = "list" | "designer" | "contract";
type TemplateModal = "create-template" | "view-values" | "template-detail" | "delete-template" | "data-entry-preview" | "json-structure" | null;
type HeaderType = "Indicator" | "Dimension" | "Measure";
type AxisAlignment = "row" | "column";
type DesignerStage = "basics" | "typing" | "options" | "binding" | "generated" | "saved" | "published";
type BindingObjectCode = "NIF_1_2_1" | "GEOGRAPHY" | "TIME_PERIOD" | "AREA_TYPE" | "GENDER" | "INDICATOR_VALUE";
type CellRole = "EMPTY" | "INDICATOR" | "HEADER" | "DIMENSION_MEMBER" | "INPUT" | "MEASURE";
type HorizontalAlign = "left" | "center" | "right";
type VerticalAlign = "top" | "middle" | "bottom";
type RollupEntryMode = "MANUAL" | "DERIVED" | "MANUAL_WITH_VALIDATION";
type AggregationMethod = "SUM" | "AVG" | "WEIGHTED_AVG" | "MIN" | "MAX" | "NO_ROLLUP";
type MeasureCode = "INDICATOR_VALUE" | "PERSON_COUNT" | "POVERTY_RATE";
type GeographyScope =
  | "NATIONAL_ONLY"
  | "STATE_ONLY"
  | "NATIONAL_STATE"
  | "NATIONAL_STATE_DISTRICT"
  | "HIERARCHY_NATIONAL"
  | "HIERARCHY_NATIONAL_STATE"
  | "HIERARCHY_NATIONAL_STATE_DISTRICT";

type CanvasCell = {
  value?: string;
  role?: CellRole;
  boundCode?: string;
  editable?: boolean;
  required?: boolean;
  align?: HorizontalAlign;
  valign?: VerticalAlign;
  datatype?: "NUMERIC" | "INTEGER" | "TEXT" | "DATE";
  validationRule?: string;
  merge?: { rowSpan: number; colSpan: number };
  mergeOwner?: string;
  frozen?: boolean;
  groupId?: string;
  groupLabel?: string;
  groupAnchor?: string;
  groupFocus?: string;
  groupBindingCode?: BindingObjectCode;
  groupAlignment?: AxisAlignment | "context";
};

type BoundObject = {
  code: BindingObjectCode;
  label: string;
  type: HeaderType;
  alignment: AxisAlignment | "context";
  range: string;
  memberCount: number;
};

type CanvasOperation = {
  id: string;
  label: string;
  detail: string;
};

type CanvasSnapshot = {
  cells: Record<string, CanvasCell>;
  columnWidths: Record<string, number>;
  rowHeights: Record<number, number>;
  boundObjects: BoundObject[];
  boundMeasureCodes: MeasureCode[];
  rowAxes: BindingObjectCode[];
  columnAxes: BindingObjectCode[];
  visibleColumnCount: number;
  visibleRowCount: number;
  combineMeasureBelowDimension: boolean;
};

type GridContextMenu = {
  type: "column" | "row";
  target: string | number;
  x: number;
  y: number;
} | null;

type NavigationDirection = "up" | "down" | "left" | "right";

type DimensionMemberSample = (typeof dimensionMembers)[number];

type GeographyHierarchyRow = {
  country?: DimensionMemberSample;
  state?: DimensionMemberSample;
  district?: DimensionMemberSample;
};

type StructuredRowCell = {
  axisCode: BindingObjectCode;
  value: string;
  memberCode?: string;
  columnLabel: string;
};

type StrictMeasureOwner = {
  address: string;
  cell: CanvasCell;
  row: number;
  col: number;
  endCol: number;
};

const canvasColumns = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
const canvasRows = Array.from({ length: 40 }, (_, index) => index + 1);
const initialVisibleColumnCount = 13;
const initialVisibleRowCount = 16;
const rowHeaderWidth = 36;
const defaultColumnWidths = Object.fromEntries(canvasColumns.map((column) => [column, 112])) as Record<string, number>;
const defaultRowHeights = Object.fromEntries(canvasRows.map((row) => [row, row === 1 ? 42 : 38])) as Record<number, number>;
const templatesUnitCode = "SDG";

const measureBindingOptions: Array<{
  code: MeasureCode;
  label: string;
  valueType: "NUMERIC" | "INTEGER" | "TEXT" | "DATE";
  unitCode: string;
  decimalPlaces: number;
  validationRule: string;
}> = [
  {
    code: "INDICATOR_VALUE",
    label: "Indicator value",
    valueType: "NUMERIC",
    unitCode: "PERCENT",
    decimalPlaces: 2,
    validationRule: "NUMERIC_NON_NEGATIVE",
  },
  {
    code: "PERSON_COUNT",
    label: "Person count",
    valueType: "INTEGER",
    unitCode: "NUMBER",
    decimalPlaces: 0,
    validationRule: "NUMERIC_NON_NEGATIVE",
  },
  {
    code: "POVERTY_RATE",
    label: "Poverty rate",
    valueType: "NUMERIC",
    unitCode: "PERCENT",
    decimalPlaces: 2,
    validationRule: "NUMERIC_NON_NEGATIVE",
  },
];
const bindingOptions: Array<{
  code: BindingObjectCode;
  type: HeaderType;
  label: string;
  searchText: string;
  defaultAlignment: AxisAlignment | "context";
  memberCount: number;
  note: string;
}> = [
  {
    code: "NIF_1_2_1",
    type: "Indicator",
    label: "NIF 1.2.1 - Population below poverty line",
    searchText: "indicator nif poverty population",
    defaultAlignment: "context",
    memberCount: 1,
    note: "Template context and title row",
  },
  {
    code: "GEOGRAPHY",
    type: "Dimension",
    label: "Geography",
    searchText: "geography location state district india",
    defaultAlignment: "row",
    memberCount: dimensionMembers.filter((member) => member.dimension_code === "GEOGRAPHY" && member.parent_member_code === "IND").length,
    note: "Row axis: request-scoped states",
  },
  {
    code: "TIME_PERIOD",
    type: "Dimension",
    label: "Time period",
    searchText: "time year financial period 2011 2012",
    defaultAlignment: "column",
    memberCount: 2,
    note: "Top merged column header",
  },
  {
    code: "AREA_TYPE",
    type: "Dimension",
    label: "Area type",
    searchText: "area type total rural urban",
    defaultAlignment: "column",
    memberCount: dimensionMembers.filter((member) => member.dimension_code === "AREA_TYPE").length,
    note: "Nested column header under time",
  },
  {
    code: "GENDER",
    type: "Dimension",
    label: "Gender",
    searchText: "gender female male",
    defaultAlignment: "column",
    memberCount: dimensionMembers.filter((member) => member.dimension_code === "GENDER" && member.member_code !== "GENDER_TOTAL").length,
    note: "Lowest column subgroup",
  },
  {
    code: "INDICATOR_VALUE",
    type: "Measure",
    label: "Indicator value",
    searchText: "measure indicator value percent numeric",
    defaultAlignment: "context",
    memberCount: 1,
    note: "Editable numeric measure",
  },
];

const statusVariant = (status?: string) => {
  if (["ACTIVE", "YES", "PASS", "READY"].includes(status ?? "")) return "secondary";
  if (["DRAFT", "WARNING", "PENDING"].includes(status ?? "")) return "outline";
  if (["RETIRED", "NO", "BLOCKER", "MISSING"].includes(status ?? "")) return "destructive";
  return "ghost";
};

const templateTypeFor = (value?: string | null): TemplateDefinitionSample["template_type"] => {
  if (value === "REVIEW" || value === "REPORTING") return value;
  return "DATA_ENTRY";
};

const templateStatusFor = (value?: string | null): TemplateStatus => {
  if (value === "ACTIVE" || value === "RETIRED") return value;
  return "DRAFT";
};

const booleanFor = (value: boolean | string | null | undefined, fallback: boolean) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["ACTIVE", "TRUE", "YES", "1"].includes(value.toUpperCase());
  }
  return fallback;
};

function templateListItemToDefinition(item: TemplateDefinitionListItem): TemplateDefinitionSample {
  const status = templateStatusFor(item.status);

  return {
    template_code: item.template_code,
    template_type: templateTypeFor(item.template_type),
    owning_unit_code: item.owning_unit_code ?? templatesUnitCode,
    status,
    is_active: booleanFor(item.is_active, status === "ACTIVE"),
    current_version_code: item.current_version_code ?? "",
    name: item.name,
    description: item.description ?? "",
    mapped_indicator_code: "-",
    mapped_indicator_number: "-",
    mapped_indicator_name: "Not returned by template list API",
    mapped_global_indicator_code: "-",
    source_unit_code: item.owning_unit_code ?? templatesUnitCode,
    version_count: item.current_version_code ? 1 : 0,
    axis_count: 0,
    cell_count: 0,
    validation_rule_count: 0,
    updated_at: "From Templates API",
  };
}

function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "You are not authorized to view templates. Please sign in again or check your access.";
    }
    if (error.status === 0) {
      return "Unable to reach the Templates API.";
    }
    return `Templates API returned ${error.status}.`;
  }
  return "Unable to load templates.";
}

const optionFor = (code: BindingObjectCode) => bindingOptions.find((option) => option.code === code) ?? bindingOptions[0];

function addressToCoord(address: string) {
  const columnLetter = address.match(/[A-Z]+/)?.[0] ?? "A";
  const row = Number(address.match(/\d+/)?.[0] ?? "1");
  const col = canvasColumns.indexOf(columnLetter) + 1;
  return { row, col: Math.max(col, 1) };
}

function coordToAddress(row: number, col: number) {
  return `${canvasColumns[col - 1] ?? "A"}${row}`;
}

const focusTemplateCell = (address: string) => {
  window.setTimeout(() => {
    document.querySelector<HTMLElement>(`[data-template-cell="${address}"]`)?.focus();
  }, 0);
};

function normalizeRange(anchor: string, focus: string) {
  const a = addressToCoord(anchor);
  const b = addressToCoord(focus);
  const start = { row: Math.min(a.row, b.row), col: Math.min(a.col, b.col) };
  const end = { row: Math.max(a.row, b.row), col: Math.max(a.col, b.col) };
  return { start, end };
}

function rangeLabel(anchor: string, focus: string) {
  const { start, end } = normalizeRange(anchor, focus);
  const first = coordToAddress(start.row, start.col);
  const last = coordToAddress(end.row, end.col);
  return first === last ? first : `${first}:${last}`;
}

function rangeAddresses(anchor: string, focus: string) {
  const { start, end } = normalizeRange(anchor, focus);
  const addresses: string[] = [];
  for (let row = start.row; row <= end.row; row += 1) {
    for (let col = start.col; col <= end.col; col += 1) {
      addresses.push(coordToAddress(row, col));
    }
  }
  return addresses;
}

function shiftAddressRight(address: string | undefined, afterCol: number, delta: number) {
  if (!address || delta <= 0) return address;
  const coord = addressToCoord(address);
  if (coord.col <= afterCol) return address;
  const nextCol = coord.col + delta;
  if (nextCol > canvasColumns.length) return undefined;
  return coordToAddress(coord.row, nextCol);
}

function shiftCellReferencesRight(cell: CanvasCell, afterCol: number, delta: number): CanvasCell {
  if (delta <= 0) return cell;
  return {
    ...cell,
    mergeOwner: shiftAddressRight(cell.mergeOwner, afterCol, delta),
    groupAnchor: shiftAddressRight(cell.groupAnchor, afterCol, delta),
    groupFocus: shiftAddressRight(cell.groupFocus, afterCol, delta),
  };
}

function shiftCellsRightFromColumn(
  current: Record<string, CanvasCell>,
  afterCol: number,
  delta: number,
  fromRow: number,
) {
  if (delta <= 0) return current;

  const shifted: Record<string, CanvasCell> = {};
  Object.entries(current).forEach(([address, cell]) => {
    const coord = addressToCoord(address);
    if (coord.row >= fromRow && coord.col > afterCol) {
      const nextCol = coord.col + delta;
      if (nextCol <= canvasColumns.length) {
        shifted[coordToAddress(coord.row, nextCol)] = shiftCellReferencesRight(cell, afterCol, delta);
      }
      return;
    }
    shifted[address] = cell;
  });

  return shifted;
}

function shiftAddressLeftAfterColumnRemoval(address: string | undefined, startCol: number, endCol: number, delta: number) {
  if (!address || delta <= 0) return address;
  const coord = addressToCoord(address);
  if (coord.col >= startCol && coord.col <= endCol) return undefined;
  if (coord.col <= endCol) return address;
  return coordToAddress(coord.row, Math.max(1, coord.col - delta));
}

function shiftCellReferencesLeftAfterColumnRemoval(cell: CanvasCell, startCol: number, endCol: number, delta: number): CanvasCell {
  if (delta <= 0) return cell;
  return {
    ...cell,
    mergeOwner: shiftAddressLeftAfterColumnRemoval(cell.mergeOwner, startCol, endCol, delta),
    groupAnchor: shiftAddressLeftAfterColumnRemoval(cell.groupAnchor, startCol, endCol, delta),
    groupFocus: shiftAddressLeftAfterColumnRemoval(cell.groupFocus, startCol, endCol, delta),
  };
}

function removeColumnRangeFromRows(
  current: Record<string, CanvasCell>,
  startCol: number,
  endCol: number,
  fromRow: number,
) {
  const delta = Math.max(0, endCol - startCol + 1);
  if (delta <= 0) return current;

  const shifted: Record<string, CanvasCell> = {};
  Object.entries(current).forEach(([address, cell]) => {
    const coord = addressToCoord(address);
    if (coord.row < fromRow) {
      shifted[address] = cell;
      return;
    }

    if (coord.col >= startCol && coord.col <= endCol) {
      return;
    }

    if (coord.col > endCol) {
      shifted[coordToAddress(coord.row, coord.col - delta)] = shiftCellReferencesLeftAfterColumnRemoval(cell, startCol, endCol, delta);
      return;
    }

    shifted[address] = cell;
  });

  return shifted;
}

function isInRange(address: string, anchor: string, focus: string) {
  return rangeAddresses(anchor, focus).includes(address);
}

function isHierarchyGeographyScope(scope: GeographyScope) {
  return scope === "HIERARCHY_NATIONAL" || scope === "HIERARCHY_NATIONAL_STATE" || scope === "HIERARCHY_NATIONAL_STATE_DISTRICT";
}

function getGeographyParts() {
  const country = dimensionMembers.filter((member) => member.dimension_code === "GEOGRAPHY" && !member.parent_member_code);
  const states = dimensionMembers.filter((member) => member.dimension_code === "GEOGRAPHY" && member.parent_member_code === "IND");
  const districts = dimensionMembers.filter((member) => member.dimension_code === "GEOGRAPHY" && member.parent_member_code && member.parent_member_code !== "IND");

  return { country, states, districts };
}

function getGeographyMembers(scope: GeographyScope) {
  const { country, states, districts } = getGeographyParts();

  if (scope === "NATIONAL_ONLY" || scope === "HIERARCHY_NATIONAL") return country.slice(0, 1);
  if (scope === "NATIONAL_STATE") return [...country, ...states].slice(0, 5);
  if (scope === "NATIONAL_STATE_DISTRICT") return [...country, ...states, ...districts].slice(0, 7);
  if (scope === "HIERARCHY_NATIONAL_STATE") return states.slice(0, 4);
  if (scope === "HIERARCHY_NATIONAL_STATE_DISTRICT") return [...states, ...districts].slice(0, 6);
  return states.slice(0, 4);
}

function getGeographyHierarchyRows(scope: GeographyScope): GeographyHierarchyRow[] {
  const { country, states, districts } = getGeographyParts();
  const national = country[0];

  if (!national || scope === "HIERARCHY_NATIONAL") {
    return national ? [{ country: national }] : [];
  }

  if (scope === "HIERARCHY_NATIONAL_STATE") {
    return states.slice(0, 4).map((state) => ({ country: national, state }));
  }

  return states.slice(0, 4).flatMap((state) => {
    const stateDistricts = districts.filter((district) => district.parent_member_code === state.member_code);
    if (!stateDistricts.length) return [{ country: national, state }];
    return stateDistricts.map((district) => ({ country: national, state, district }));
  });
}

function getGeographyHierarchyColumns(scope: GeographyScope, headerLabel: string) {
  if (scope === "HIERARCHY_NATIONAL") return [headerLabel || "Location"];
  if (scope === "HIERARCHY_NATIONAL_STATE") return [headerLabel || "Location", "State"];
  return [headerLabel || "Location", "State", "District"];
}

function getInlineCompletion(value: string, suggestion?: (typeof bindingOptions)[number]) {
  const typed = value.trim();
  if (!typed || !suggestion) return "";

  const candidates = [suggestion.label, suggestion.code, ...suggestion.searchText.split(" ")].filter(Boolean);
  const match = candidates.find((candidate) => candidate.toLowerCase().startsWith(typed.toLowerCase()) && candidate.length > typed.length);
  return match ? match.slice(typed.length) : "";
}

function getMembersForObject(code: BindingObjectCode, geographyScope: GeographyScope = "STATE_ONLY") {
  if (code === "GEOGRAPHY") {
    return getGeographyMembers(geographyScope);
  }
  if (code === "TIME_PERIOD") {
    return dimensionMembers.filter((member) => member.dimension_code === "TIME_PERIOD").slice(0, 2);
  }
  if (code === "AREA_TYPE") {
    return dimensionMembers.filter((member) => member.dimension_code === "AREA_TYPE");
  }
  if (code === "GENDER") {
    return dimensionMembers.filter((member) => member.dimension_code === "GENDER" && member.member_code !== "GENDER_TOTAL");
  }
  if (code === "INDICATOR_VALUE") {
    const measureMembers: DimensionMemberSample[] = measureBindingOptions.map((measure, index) => ({
      id: `measure-${measure.code}`,
      dimension_code: "MEASURE",
      member_code: measure.code,
      parent_member_code: undefined,
      external_code: measure.code,
      name: `${measure.label} (${measure.unitCode})`,
      short_name: measure.label,
      sort_order: (index + 1) * 10,
      status: "ACTIVE" as const,
      valid_from: "2025-04-01",
    }));
    return measureMembers;
  }
  return [];
}

function cartesianProduct<T>(sets: T[][]): T[][] {
  if (!sets.length) return [[]];
  return sets.reduce<T[][]>(
    (accumulator, set) => accumulator.flatMap((prefix) => set.map((item) => [...prefix, item])),
    [[]],
  );
}

function buildHeaderCells(template: TemplateDefinitionSample = templateDefinitions[0]) {
  const headerCells: Record<string, CanvasCell> = {};
  const owner = "A1";
  const value = [
    `Indicator Code: ${template.mapped_indicator_code}`,
    `Name: ${template.mapped_indicator_name}`,
    "Measure: Percent",
    `Source: ${template.source_unit_code}`,
    "Unit: PERCENT",
    "Periodicity: ANNUAL",
  ].join(" | ");

  headerCells[owner] = {
    value,
    role: "INDICATOR",
    boundCode: template.mapped_indicator_code,
    frozen: true,
    align: "left",
    merge: { rowSpan: 1, colSpan: canvasColumns.length },
    groupId: "indicator-context-row",
    groupLabel: "Indicator context",
    groupAnchor: "A1",
    groupFocus: "M1",
    groupBindingCode: "NIF_1_2_1",
    groupAlignment: "context",
  };

  for (let col = 2; col <= canvasColumns.length; col += 1) {
    const address = coordToAddress(1, col);
    headerCells[address] = {
      value: "",
      role: "INDICATOR",
      boundCode: template.mapped_indicator_code,
      frozen: true,
      mergeOwner: owner,
      groupId: "indicator-context-row",
      groupLabel: "Indicator context",
      groupAnchor: "A1",
      groupFocus: "M1",
      groupBindingCode: "NIF_1_2_1",
      groupAlignment: "context",
    };
  }

  return headerCells;
}

function getCellClasses(cell: CanvasCell | undefined, selected: boolean) {
  const role = cell?.role ?? "EMPTY";
  const roleClass = {
    EMPTY: "bg-card",
    INDICATOR: "bg-blue-50 text-blue-900 font-bold",
    HEADER: "bg-amber-50 text-amber-900 font-bold text-center",
    DIMENSION_MEMBER: "bg-emerald-50 text-emerald-950 font-semibold",
    INPUT: "bg-white font-mono",
    MEASURE: "bg-purple-50 text-purple-900 font-bold",
  }[role];
  const align = cell?.align === "center" ? "justify-center text-center" : cell?.align === "right" ? "justify-end text-right" : "justify-start text-left";
  const valign = cell?.valign === "top" ? "items-start" : cell?.valign === "bottom" ? "items-end" : "items-center";
  const wrapping = cell?.value?.includes("\n") ? "whitespace-pre-line leading-tight" : "whitespace-nowrap";
  const frozen = cell?.frozen ? "shadow-[inset_0_0_0_2px_rgba(37,99,235,0.28)]" : "";
  const editable = cell?.editable ? "outline outline-1 outline-offset-[-2px] outline-emerald-500" : "";
  const selectedClass = selected ? "ring-2 ring-primary/70" : "";
  return `flex h-full w-full overflow-hidden text-ellipsis px-2 ${roleClass} ${align} ${valign} ${wrapping} ${frozen} ${editable} ${selectedClass}`;
}

function Field({ label, value, readOnly = false }: { label: string; value?: string | number; readOnly?: boolean }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <Input defaultValue={value ?? ""} readOnly={readOnly} className={readOnly ? "bg-muted/60" : undefined} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <select
        className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TemplateModalView({
  modal,
  selectedTemplate,
  bindingObject,
  geographyScope,
  generatedColumnCount,
  generatedRowCount,
  cells,
  templateJson,
  onCreateDraft,
  onDeleteDraft,
  onBind,
  onClose,
}: {
  modal: TemplateModal;
  selectedTemplate: TemplateDefinitionSample;
  bindingObject: BindingObjectCode;
  geographyScope: GeographyScope;
  generatedColumnCount: number;
  generatedRowCount: number;
  cells: Record<string, CanvasCell>;
  templateJson: string;
  onCreateDraft: () => void;
  onDeleteDraft: () => void;
  onBind: () => void;
  onClose: () => void;
}) {
  if (!modal) return null;

  const isDelete = modal === "delete-template";
  const selectedMembers = getMembersForObject(bindingObject, geographyScope);
  const titleMap: Record<Exclude<TemplateModal, null>, string> = {
    "create-template": "Create template draft",
    "view-values": "Dimension values preview",
    "template-detail": "Template detail",
    "delete-template": "Delete template draft",
    "data-entry-preview": "Data-entry preview",
    "json-structure": "Dynamic template JSON structure",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="template-modal-title">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Templates</p>
            <h2 id="template-modal-title" className="text-xl font-bold">{titleMap[modal]}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-5">
          {modal === "create-template" ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
                <Field label="template_code" value="TPL_NIF_1_2_1_NEW_DRAFT" />
                <SelectField
                  label="owning_unit_code"
                  value="SDG"
                  options={unitOptions.map((unit) => ({
                    value: unit.unit_code ?? unit.id,
                    label: unit.unit_code ?? unit.name ?? unit.id,
                  }))}
                />
                <SelectField
                  label="national_indicator"
                  value="NIF_1_2_1"
                  options={nationalIndicatorOptions.map((indicator) => ({
                    value: indicator.national_indicator_code ?? indicator.id,
                    label: `${indicator.national_indicator_code ?? indicator.id} - ${indicator.name ?? ""}`,
                  }))}
                />
              </div>
              <Field label="template name en-IN" value="NIF 1.2.1 area, gender, and time data entry template" />
              <label className="grid gap-1 text-xs font-semibold">
                Description
                <Textarea defaultValue="Draft starts inactive. User designs a grid, binds dimensions/measures, validates, then publishes." />
              </label>
              <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                New templates start as DRAFT. They become available for collection requests only after template validation and publish.
              </div>
            </div>
          ) : null}

          {modal === "view-values" ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{bindingObject}</p>
                  <p className="text-xs text-muted-foreground">Preview members before writing them into the selected canvas range.</p>
                </div>
                <Button type="button" onClick={onBind}>Bind these values</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMembers.map((member) => (
                    <TableRow key={member.member_code}>
                      <TableCell className="font-mono text-[11px]">{member.member_code}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell className="font-mono text-[11px]">{member.parent_member_code ?? "NONE"}</TableCell>
                      <TableCell><Badge variant={statusVariant(member.status)}>{member.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {modal === "template-detail" ? (
            <dl className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
              {Object.entries(selectedTemplate).map(([key, value]) => (
                <div key={key} className="rounded-md bg-muted/50 p-3">
                  <dt className="text-[11px] font-semibold text-muted-foreground">{key}</dt>
                  <dd className="mt-1 break-words font-mono text-[11px] font-bold">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {modal === "data-entry-preview" ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-4 gap-3 text-xs max-lg:grid-cols-2 max-sm:grid-cols-1">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="font-semibold text-muted-foreground">Indicator</p>
                  <p className="mt-1 font-bold">NIF 1.2.1</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="font-semibold text-muted-foreground">Generated columns</p>
                  <p className="mt-1 font-bold">{generatedColumnCount}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="font-semibold text-muted-foreground">Preview rows</p>
                  <p className="mt-1 font-bold">{generatedRowCount}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="font-semibold text-muted-foreground">Submit target</p>
                  <p className="mt-1 font-bold">Ingestion submission version</p>
                </div>
              </div>
              <CanvasTable
                cells={cells}
                selectedAnchor="B5"
                selectedFocus="B5"
                editingCell={null}
                cellText=""
                optionsOpen={false}
                suggestions={[]}
                columnWidths={defaultColumnWidths}
                rowHeights={defaultRowHeights}
                columns={canvasColumns.slice(0, initialVisibleColumnCount)}
                rows={canvasRows.slice(0, initialVisibleRowCount)}
                onCellClick={() => undefined}
                onSelectAddress={() => undefined}
                onCellDoubleClick={() => undefined}
                onCellTextChange={() => undefined}
                onStartEdit={() => undefined}
                onStopEdit={() => undefined}
                onNavigateCell={() => undefined}
                onSuggestionClick={() => undefined}
                onResizeColumn={() => undefined}
                onResizeRow={() => undefined}
                onHeaderContextMenu={() => undefined}
                readOnly
              />
              <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-950">
                Data-entry users see this rendered template only. They do not edit structure; they fill editable data cells and submit to ingestion.
              </div>
            </div>
          ) : null}

          {modal === "json-structure" ? (
            <div className="grid gap-3">
              <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-950">
                This is the live UI object model generated from the current canvas. Data Entry should follow this structure: rows, column axes, editable measure cells, and value bindings all remain keyed by stable codes.
              </div>
              <pre className="max-h-[62vh] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs text-slate-50">
                {templateJson}
              </pre>
            </div>
          ) : null}

          {isDelete ? (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-900">
              Delete is a visual state only. Before real deletion, dependency checks must include requests, ingestion submissions, validation runs, review tasks, and dashboard snapshots.
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border/70 bg-muted/40 px-5 py-4">
          <span className="text-xs text-muted-foreground">Sample UI only. No template mutation is sent to API or database.</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            {modal === "create-template" ? (
              <Button type="button" onClick={onCreateDraft}>Create draft and open designer</Button>
            ) : null}
            {modal === "delete-template" ? (
              <Button type="button" variant="destructive" onClick={onDeleteDraft}>Delete draft</Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function CanvasTable({
  cells,
  selectedAnchor,
  selectedFocus,
  editingCell,
  cellText,
  optionsOpen,
  suggestions,
  columnWidths,
  rowHeights,
  columns,
  rows,
  onCellClick,
  onSelectAddress,
  onCellDoubleClick,
  onCellTextChange,
  onStartEdit,
  onStopEdit,
  onNavigateCell,
  onSuggestionClick,
  onResizeColumn,
  onResizeRow,
  onHeaderContextMenu,
  readOnly = false,
}: {
  cells: Record<string, CanvasCell>;
  selectedAnchor: string;
  selectedFocus: string;
  editingCell: string | null;
  cellText: string;
  optionsOpen: boolean;
  suggestions: typeof bindingOptions;
  columnWidths: Record<string, number>;
  rowHeights: Record<number, number>;
  columns: string[];
  rows: number[];
  onCellClick: (address: string, event: MouseEvent<HTMLButtonElement | HTMLTableCellElement | HTMLInputElement>) => void;
  onSelectAddress: (address: string) => void;
  onCellDoubleClick: (address: string) => void;
  onCellTextChange: (value: string) => void;
  onStartEdit: (address: string) => void;
  onStopEdit: () => void;
  onNavigateCell: (address: string, direction: NavigationDirection) => void;
  onSuggestionClick: (option: (typeof bindingOptions)[number]) => void;
  onResizeColumn: (column: string, width: number) => void;
  onResizeRow: (row: number, height: number) => void;
  onHeaderContextMenu: (type: "column" | "row", target: string | number, event: MouseEvent<HTMLElement>) => void;
  readOnly?: boolean;
}) {
  const selectedRangeText = rangeLabel(selectedAnchor, selectedFocus);
  const tableWidth = rowHeaderWidth + columns.reduce((total, column) => total + (columnWidths[column] ?? 112), 0);
  const startColumnResize = (column: string, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = columnWidths[column] ?? 112;
    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      onResizeColumn(column, startWidth + moveEvent.clientX - startX);
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const startRowResize = (row: number, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startHeight = rowHeights[row] ?? 36;
    const handleMove = (moveEvent: globalThis.MouseEvent) => {
      onResizeRow(row, startHeight + moveEvent.clientY - startY);
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  return (
    <div className="relative overflow-auto rounded-md border border-border bg-card">
      <table className="border-collapse text-xs" style={{ width: tableWidth, minWidth: tableWidth }}>
        <thead>
          <tr className="bg-muted/70">
            <th className="sticky left-0 z-30 h-8 border border-border bg-muted/80" style={{ width: rowHeaderWidth, minWidth: 35 }} />
            {columns.map((column) => (
              <th
                key={column}
                className="relative h-8 border border-border text-center font-bold"
                style={{ width: columnWidths[column], minWidth: columnWidths[column] }}
                onContextMenu={(event) => !readOnly && onHeaderContextMenu("column", column, event)}
              >
                <div className="flex items-center justify-center">
                  <span>{column}</span>
                  {!readOnly ? (
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-primary/40"
                      aria-label={`Drag to resize column ${column}`}
                      onMouseDown={(event) => startColumnResize(column, event)}
                    />
                  ) : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th
                className="sticky left-0 z-20 border border-border bg-muted/80 text-center font-bold shadow-[2px_0_0_rgba(148,163,184,0.35)]"
                style={{ width: rowHeaderWidth, minWidth: 35, height: rowHeights[row] }}
                onContextMenu={(event) => !readOnly && onHeaderContextMenu("row", row, event)}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{row}</span>
                  {!readOnly ? (
                    <button
                      type="button"
                      className="absolute bottom-0 left-0 h-1.5 w-full cursor-row-resize bg-transparent hover:bg-primary/40"
                      aria-label={`Drag to resize row ${row}`}
                      onMouseDown={(event) => startRowResize(row, event)}
                    />
                  ) : null}
                </div>
              </th>
              {columns.map((column) => {
                const address = `${column}${row}`;
                const cell = cells[address];
                if (cell?.mergeOwner) return null;

                const selected = isInRange(address, selectedAnchor, selectedFocus);
                const isActiveInput = !readOnly && selected && editingCell === address;
                const inlineCompletion = isActiveInput ? getInlineCompletion(cellText, suggestions[0]) : "";
                const rowSpan = cell?.merge?.rowSpan ?? 1;
                const colSpan = cell?.merge?.colSpan ?? 1;
                const spannedColumns = canvasColumns.slice(canvasColumns.indexOf(column), canvasColumns.indexOf(column) + colSpan);
                const spannedRows = canvasRows.slice(row - 1, row - 1 + rowSpan);
                const cellStyle: CSSProperties = {
                  width: spannedColumns.reduce((total, col) => total + (columnWidths[col] ?? 112), 0),
                  minWidth: spannedColumns.reduce((total, col) => total + (columnWidths[col] ?? 112), 0),
                  height: spannedRows.reduce((total, rowNumber) => total + (rowHeights[rowNumber] ?? 36), 0),
                  minHeight: spannedRows.reduce((total, rowNumber) => total + (rowHeights[rowNumber] ?? 36), 0),
                };

                return (
                  <td
                    key={address}
                    rowSpan={rowSpan}
                    colSpan={colSpan}
                    className="border border-border p-0"
                    style={cellStyle}
                    onDoubleClick={() => !readOnly && onCellDoubleClick(address)}
                  >
                    {isActiveInput ? (
                      <div className="relative h-full w-full">
                        {inlineCompletion ? (
                          <div
                            className={`${getCellClasses(cell, selected)} pointer-events-none absolute inset-0 text-foreground`}
                            aria-hidden="true"
                          >
                            <span className="text-transparent">{cellText}</span>
                            <span className="text-muted-foreground/45">{inlineCompletion}</span>
                          </div>
                        ) : null}
                        <input
                          data-template-cell={address}
                          className={`${getCellClasses(cell, selected)} relative z-10 outline-none`}
                          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
                          value={cellText}
                          onChange={(event) => onCellTextChange(event.target.value)}
                          onClick={(event) => onCellClick(address, event)}
                          onKeyDown={(event) => {
                            if (event.key === "ArrowUp") {
                              event.preventDefault();
                              onNavigateCell(address, "up");
                              return;
                            }
                            if (event.key === "ArrowDown") {
                              event.preventDefault();
                              onNavigateCell(address, "down");
                              return;
                            }
                            if (event.key === "ArrowLeft") {
                              event.preventDefault();
                              onNavigateCell(address, "left");
                              return;
                            }
                            if (event.key === "ArrowRight") {
                              event.preventDefault();
                              onNavigateCell(address, "right");
                              return;
                            }
                            if ((event.key === "Tab" || event.key === "Enter") && cellText.trim() && suggestions[0]) {
                              event.preventDefault();
                              onSuggestionClick(suggestions[0]);
                              onStopEdit();
                              return;
                            }
                            if (event.key === "Enter") {
                              event.preventDefault();
                              onStopEdit();
                            }
                            if (event.key === "Escape") {
                              event.preventDefault();
                              onStopEdit();
                            }
                          }}
                          aria-label={`Edit ${address}`}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-template-cell={address}
                        onClick={(event) => !readOnly && onCellClick(address, event)}
                        onDoubleClick={() => !readOnly && onCellDoubleClick(address)}
                        onKeyDown={(event) => {
                          if (readOnly) return;
                          if (event.key === "Enter") {
                            event.preventDefault();
                            onStartEdit(address);
                          }
                          if (event.key === " ") {
                            event.preventDefault();
                            onSelectAddress(address);
                          }
                          if (event.key === "ArrowUp") {
                            event.preventDefault();
                            onNavigateCell(address, "up");
                          }
                          if (event.key === "ArrowDown") {
                            event.preventDefault();
                            onNavigateCell(address, "down");
                          }
                          if (event.key === "ArrowLeft") {
                            event.preventDefault();
                            onNavigateCell(address, "left");
                          }
                          if (event.key === "ArrowRight") {
                            event.preventDefault();
                            onNavigateCell(address, "right");
                          }
                        }}
                        className={getCellClasses(cell, selected)}
                        style={{ width: "100%", height: "100%" }}
                        aria-label={`Select ${address}`}
                      >
                        {cell?.value ?? ""}
                      </button>
                    )}
                </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {!readOnly && cellText.trim() && suggestions.length && !optionsOpen ? (
        <div className="absolute left-20 top-20 z-20 w-[420px] rounded-md border border-border bg-card p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold">Suggestions for {selectedFocus}</p>
            <Badge variant="outline">{selectedRangeText}</Badge>
          </div>
          <div className="grid gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.code}
                type="button"
                className="grid grid-cols-[86px_1fr_auto] items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-left text-xs hover:bg-muted"
                onClick={() => onSuggestionClick(suggestion)}
              >
                <Badge variant="outline">{suggestion.type}</Badge>
                <span>
                  <span className="block font-bold">{suggestion.label}</span>
                  <span className="text-muted-foreground">{suggestion.note}</span>
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">{suggestion.code}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BindingPanel({
  selectedCell,
  selectedRange,
  cellText,
  headerType,
  bindingObject,
  axisAlignment,
  geographyScope,
  showHeader,
  headerLabel,
  datatype,
  required,
  decimalPlaces,
  validationRule,
  selectedMeasureCode,
  rollupEntryMode,
  aggregationMethod,
  horizontalAlign,
  verticalAlign,
  suggestions,
  boundObjects,
  boundMeasureCodes,
  operations,
  onCellTextChange,
  onHeaderTypeChange,
  onBindingObjectChange,
  onAxisAlignmentChange,
  onGeographyScopeChange,
  onShowHeaderChange,
  onHeaderLabelChange,
  onDatatypeChange,
  onRequiredChange,
  onDecimalPlacesChange,
  onValidationRuleChange,
  onSelectedMeasureCodeChange,
  onRollupEntryModeChange,
  onAggregationMethodChange,
  onHorizontalAlignChange,
  onVerticalAlignChange,
  onViewValues,
  onBind,
  onMerge,
  onUnmerge,
  onFreeze,
  onMarkEditable,
  onCombineMeasureBelowDimension,
  onUnbindGroup,
  onClose,
}: {
  selectedCell: string;
  selectedRange: string;
  cellText: string;
  headerType: HeaderType;
  bindingObject: BindingObjectCode;
  axisAlignment: AxisAlignment;
  geographyScope: GeographyScope;
  showHeader: boolean;
  headerLabel: string;
  datatype: "NUMERIC" | "INTEGER" | "TEXT" | "DATE";
  required: boolean;
  decimalPlaces: number;
  validationRule: string;
  selectedMeasureCode: MeasureCode;
  rollupEntryMode: RollupEntryMode;
  aggregationMethod: AggregationMethod;
  horizontalAlign: HorizontalAlign;
  verticalAlign: VerticalAlign;
  suggestions: typeof bindingOptions;
  boundObjects: BoundObject[];
  boundMeasureCodes: MeasureCode[];
  operations: CanvasOperation[];
  onCellTextChange: (value: string) => void;
  onHeaderTypeChange: (value: HeaderType) => void;
  onBindingObjectChange: (value: BindingObjectCode) => void;
  onAxisAlignmentChange: (value: AxisAlignment) => void;
  onGeographyScopeChange: (value: GeographyScope) => void;
  onShowHeaderChange: (value: boolean) => void;
  onHeaderLabelChange: (value: string) => void;
  onDatatypeChange: (value: "NUMERIC" | "INTEGER" | "TEXT" | "DATE") => void;
  onRequiredChange: (value: boolean) => void;
  onDecimalPlacesChange: (value: number) => void;
  onValidationRuleChange: (value: string) => void;
  onSelectedMeasureCodeChange: (value: MeasureCode) => void;
  onRollupEntryModeChange: (value: RollupEntryMode) => void;
  onAggregationMethodChange: (value: AggregationMethod) => void;
  onHorizontalAlignChange: (value: HorizontalAlign) => void;
  onVerticalAlignChange: (value: VerticalAlign) => void;
  onViewValues: () => void;
  onBind: () => void;
  onMerge: () => void;
  onUnmerge: () => void;
  onFreeze: () => void;
  onMarkEditable: () => void;
  onCombineMeasureBelowDimension: () => void;
  onUnbindGroup: () => void;
  onClose: () => void;
}) {
  const availableMeasureOptions = measureBindingOptions.filter((measure) => !boundMeasureCodes.includes(measure.code));
  const selectableMeasureCode = availableMeasureOptions.some((measure) => measure.code === selectedMeasureCode)
    ? selectedMeasureCode
    : availableMeasureOptions[0]?.code;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Options</CardTitle>
          <Button type="button" size="icon-sm" variant="ghost" onClick={onClose} aria-label="Close options">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[760px] overflow-y-auto">
        <div className="grid gap-3">
          <Field label="Selected cell" value={selectedCell} readOnly />
          <Field label="Selected range" value={selectedRange} readOnly />
          <label className="grid gap-1 text-xs font-semibold">
            Cell text / object search
            <Input value={cellText} onChange={(event) => onCellTextChange(event.target.value)} placeholder="Type area, time, gender, measure..." />
          </label>

          {cellText ? (
            <div className="grid gap-1 rounded-md bg-muted/50 p-2">
              <p className="text-xs font-bold">Full-text matches</p>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.code}
                  type="button"
                  className="grid grid-cols-[80px_1fr] gap-2 rounded-md bg-card px-2 py-2 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    onHeaderTypeChange(suggestion.type);
                    if (suggestion.type !== "Measure") {
                      onBindingObjectChange(suggestion.code);
                    }
                  }}
                >
                  <Badge variant="outline">{suggestion.type}</Badge>
                  <span>
                    <span className="block font-bold">{suggestion.label}</span>
                    <span className="text-muted-foreground">{suggestion.note}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <SelectField
            label="Header type"
            value={headerType}
            onChange={(value) => onHeaderTypeChange(value as HeaderType)}
            options={[
              { value: "Indicator", label: "Indicator" },
              { value: "Dimension", label: "Dimension" },
              { value: "Measure", label: "Measure" },
            ]}
          />
          {headerType !== "Measure" ? (
            <SelectField
              label="Object"
              value={bindingObject}
              onChange={(value) => onBindingObjectChange(value as BindingObjectCode)}
              options={bindingOptions
                .filter((option) => option.type === headerType)
                .map((option) => ({ value: option.code, label: `${option.label} (${option.memberCount})` }))}
            />
          ) : null}
          {headerType === "Measure" ? (
            <div className="grid gap-2 rounded-md bg-muted/40 p-3">
              <p className="text-xs font-bold">Measure header</p>
              {availableMeasureOptions.length ? (
                <SelectField
                  label="Measure"
                  value={selectableMeasureCode}
                  onChange={(value) => onSelectedMeasureCodeChange(value as MeasureCode)}
                  options={availableMeasureOptions.map((measure) => ({
                    value: measure.code,
                    label: `${measure.code} / ${measure.unitCode}`,
                  }))}
                />
              ) : (
                <div className="rounded-md bg-card p-2 text-[11px] font-semibold text-muted-foreground">
                  All configured measures are already bound. Unbind a measure header to make it available again.
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Bind adds one selected measure as a column header at the selected cell. Already-bound measures are hidden from this list until unbound.
              </p>
            </div>
          ) : null}
          {headerType === "Dimension" && bindingObject === "GEOGRAPHY" ? (
            <SelectField
              label="Geography scope"
              value={geographyScope}
              onChange={(value) => onGeographyScopeChange(value as GeographyScope)}
              options={[
                { value: "NATIONAL_ONLY", label: "National only" },
                { value: "STATE_ONLY", label: "State rows only" },
                { value: "NATIONAL_STATE", label: "National + state rows" },
                { value: "NATIONAL_STATE_DISTRICT", label: "National + state + district rows" },
                { value: "HIERARCHY_NATIONAL", label: "Hierarchy columns: national only" },
                { value: "HIERARCHY_NATIONAL_STATE", label: "Hierarchy columns: national + state" },
                { value: "HIERARCHY_NATIONAL_STATE_DISTRICT", label: "Hierarchy columns: national + state + district" },
              ]}
            />
          ) : null}
          {bindingObject === "AREA_TYPE" ? (
            <div className="grid gap-2 rounded-md bg-amber-50 p-3 text-amber-950">
              <p className="text-xs font-bold">Hierarchy / rollup behavior</p>
              <p className="text-[11px]">
                Parent member Total can be entered manually, derived from Rural + Urban, or manually entered with validation.
              </p>
              <SelectField
                label="Entry mode"
                value={rollupEntryMode}
                onChange={(value) => onRollupEntryModeChange(value as RollupEntryMode)}
                options={[
                  { value: "MANUAL", label: "Manual parent value" },
                  { value: "DERIVED", label: "Derived from children" },
                  { value: "MANUAL_WITH_VALIDATION", label: "Manual with child-sum validation" },
                ]}
              />
              <SelectField
                label="Aggregation method"
                value={aggregationMethod}
                onChange={(value) => onAggregationMethodChange(value as AggregationMethod)}
                options={[
                  { value: "SUM", label: "SUM" },
                  { value: "AVG", label: "AVG" },
                  { value: "WEIGHTED_AVG", label: "WEIGHTED_AVG" },
                  { value: "MIN", label: "MIN" },
                  { value: "MAX", label: "MAX" },
                  { value: "NO_ROLLUP", label: "NO_ROLLUP" },
                ]}
              />
              <div className="rounded-md bg-card/80 p-2 text-[11px]">
                <span className="font-bold">Rule:</span> TOTAL {"->"} RURAL + URBAN for the selected measure.
              </div>
            </div>
          ) : null}
          <label className="grid gap-1 text-xs font-semibold">
            Header label
            <Input value={headerLabel} onChange={(event) => onHeaderLabelChange(event.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={onViewValues}>View values</Button>
            <Button type="button" onClick={onBind}>Bind values</Button>
          </div>
          <SelectField
            label="Show header"
            value={String(showHeader)}
            onChange={(value) => onShowHeaderChange(value === "true")}
            options={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
          />
          <SelectField
            label="Axis alignment"
            value={axisAlignment}
            onChange={(value) => onAxisAlignmentChange(value as AxisAlignment)}
            options={headerType === "Measure"
              ? [{ value: "column", label: "Column align" }]
              : [
                  { value: "row", label: "Row align" },
                  { value: "column", label: "Column align" },
                ]}
          />
          <SelectField
            label="Column datatype"
            value={datatype}
            onChange={(value) => onDatatypeChange(value as "NUMERIC" | "INTEGER" | "TEXT" | "DATE")}
            options={[
              { value: "NUMERIC", label: "NUMERIC" },
              { value: "INTEGER", label: "INTEGER" },
              { value: "TEXT", label: "TEXT" },
              { value: "DATE", label: "DATE" },
            ]}
          />
          <SelectField
            label="Required"
            value={String(required)}
            onChange={(value) => onRequiredChange(value === "true")}
            options={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
          />
          <label className="grid gap-1 text-xs font-semibold">
            Decimal places
            <Input value={decimalPlaces} onChange={(event) => onDecimalPlacesChange(Number(event.target.value) || 0)} />
          </label>
          <SelectField
            label="Validation rules"
            value={validationRule}
            onChange={onValidationRuleChange}
            options={[
              { value: "NUMERIC_NON_NEGATIVE", label: "Non-negative" },
              { value: "REQUIRED_WHEN_REQUESTED", label: "Required when requested" },
              { value: "DECIMAL_PLACES_2", label: "Two decimals" },
            ]}
          />
          <SelectField
            label="Horizontal align"
            value={horizontalAlign}
            onChange={(value) => onHorizontalAlignChange(value as HorizontalAlign)}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Middle" },
              { value: "right", label: "Right" },
            ]}
          />
          <SelectField
            label="Vertical align"
            value={verticalAlign}
            onChange={(value) => onVerticalAlignChange(value as VerticalAlign)}
            options={[
              { value: "top", label: "Top" },
              { value: "middle", label: "Middle" },
              { value: "bottom", label: "Bottom" },
            ]}
          />
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" onClick={onMerge} title="Merge the selected canvas cells into one visual header or label area.">Merge</Button>
            <Button type="button" variant="outline" onClick={onUnmerge} title="Split a merged visual range back into individual cells.">Unmerge</Button>
            <Button type="button" variant="outline" onClick={onFreeze} title="Toggle freeze metadata for selected header/range. Frozen groups stay visible in rendered template panes.">Freeze</Button>
            <Button type="button" variant="outline" onClick={onMarkEditable} title="Toggle whether selected cells become department data-entry fields.">Editable cells</Button>
            <Button type="button" variant="outline" onClick={onCombineMeasureBelowDimension} title="Toggle stacked headers where the selected dimension label is shown above the measure/unit label.">Combine measure</Button>
            <Button type="button" variant="destructive" onClick={onUnbindGroup} className="col-span-2" title="Remove the selected bound axis/measure group from the generated template canvas.">Unbind selected group</Button>
          </div>

          <div className="grid gap-2 border-t border-border pt-3">
            <p className="text-xs font-bold">Bound objects</p>
            {boundObjects.length ? (
              boundObjects.map((binding) => (
                <div key={binding.code} className="rounded-md bg-muted/40 p-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{binding.label}</span>
                    <Badge variant="outline">{binding.alignment}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{binding.type} / {binding.range} / {binding.memberCount} member(s)</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No objects bound yet.</p>
            )}
          </div>

          <div className="grid gap-2 border-t border-border pt-3">
            <p className="text-xs font-bold">Recent canvas actions</p>
            {operations.slice(-4).map((operation) => (
              <div key={operation.id} className="rounded-md bg-muted/40 p-2 text-xs">
                <p className="font-bold">{operation.label}</p>
                <p className="text-muted-foreground">{operation.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateManagementPage() {
  const { language } = useLanguage();
  const [localTemplates, setTemplates] = useState<TemplateDefinitionSample[]>(templateDefinitions);
  const [activeTab, setActiveTab] = useState<TemplateTab>("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | "ALL">("ALL");
  const [selectedTemplateCode, setSelectedTemplateCode] = useState("TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT");
  const [modal, setModal] = useState<TemplateModal>(null);
  const [designerStage, setDesignerStage] = useState<DesignerStage>("basics");
  const [selectedAnchor, setSelectedAnchor] = useState("B2");
  const [selectedFocus, setSelectedFocus] = useState("B2");
  const [editingCell, setEditingCell] = useState<string | null>("B2");
  const [cellText, setCellText] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [headerType, setHeaderType] = useState<HeaderType>("Dimension");
  const [bindingObject, setBindingObject] = useState<BindingObjectCode>("GEOGRAPHY");
  const [axisAlignment, setAxisAlignment] = useState<AxisAlignment>("row");
  const [geographyScope, setGeographyScope] = useState<GeographyScope>("STATE_ONLY");
  const [showHeader, setShowHeader] = useState(true);
  const [headerLabel, setHeaderLabel] = useState("Location");
  const [datatype, setDatatype] = useState<"NUMERIC" | "INTEGER" | "TEXT" | "DATE">("NUMERIC");
  const [required, setRequired] = useState(true);
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [validationRule, setValidationRule] = useState("NUMERIC_NON_NEGATIVE");
  const [selectedMeasureCode, setSelectedMeasureCode] = useState<MeasureCode>("INDICATOR_VALUE");
  const [rollupEntryMode, setRollupEntryMode] = useState<RollupEntryMode>("MANUAL_WITH_VALIDATION");
  const [aggregationMethod, setAggregationMethod] = useState<AggregationMethod>("SUM");
  const [horizontalAlign, setHorizontalAlign] = useState<HorizontalAlign>("center");
  const [verticalAlign, setVerticalAlign] = useState<VerticalAlign>("top");
  const [cells, setCells] = useState<Record<string, CanvasCell>>(buildHeaderCells());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultColumnWidths);
  const [rowHeights, setRowHeights] = useState<Record<number, number>>(defaultRowHeights);
  const [visibleColumnCount, setVisibleColumnCount] = useState(initialVisibleColumnCount);
  const [visibleRowCount, setVisibleRowCount] = useState(initialVisibleRowCount);
  const [rowAxes, setRowAxes] = useState<BindingObjectCode[]>([]);
  const [columnAxes, setColumnAxes] = useState<BindingObjectCode[]>([]);
  const [combineMeasureBelowDimension, setCombineMeasureBelowDimension] = useState(false);
  const [undoStack, setUndoStack] = useState<CanvasSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasSnapshot[]>([]);
  const [gridContextMenu, setGridContextMenu] = useState<GridContextMenu>(null);
  const [isDesignerFullPage, setIsDesignerFullPage] = useState(false);
  const [boundObjects, setBoundObjects] = useState<BoundObject[]>([]);
  const [boundMeasureCodes, setBoundMeasureCodes] = useState<MeasureCode[]>([]);
  const [operations, setOperations] = useState<CanvasOperation[]>([
    { id: "start", label: "Designer opened", detail: "Blank governed template canvas is ready." },
  ]);
  const [activityMessage, setActivityMessage] = useState("Click a cell to type. Suggestions appear while typing. Double-click any cell to open options.");

  const templatesQuery = useQuery({
    queryKey: ["templates", "list", templatesUnitCode, language],
    queryFn: () => templatesService.listTemplates({ locale: language, unitCode: templatesUnitCode }),
  });

  const apiTemplates = useMemo(
    () => templatesQuery.data?.data.map(templateListItemToDefinition),
    [templatesQuery.data],
  );
  const templates = apiTemplates ?? localTemplates;

  const selectedTemplate = templates.find((template) => template.template_code === selectedTemplateCode) ?? templates[0] ?? templateDefinitions[0];
  const selectedVersion = templateVersions.find((version) => version.version_code === selectedTemplate.current_version_code) ?? templateVersions[0];
  const axesForVersion = templateAxes.filter((axis) => axis.version_code === selectedVersion.version_code);
  const measuresForVersion = templateMeasures.filter((measure) => measure.version_code === selectedVersion.version_code);
  const rulesForVersion = templateValidationRules.filter((rule) => rule.version_code === selectedVersion.version_code);
  const selectedMeasure = measureBindingOptions.find((measure) => measure.code === selectedMeasureCode) ?? measureBindingOptions[0];
  const generatedRows = getMembersForObject("GEOGRAPHY", geographyScope).length;
  const generatedColumns = getMembersForObject("TIME_PERIOD").length * getMembersForObject("AREA_TYPE").length * getMembersForObject("GENDER").length;
  const selectedRange = rangeLabel(selectedAnchor, selectedFocus);
  const visibleColumns = canvasColumns.slice(0, visibleColumnCount);
  const visibleRows = canvasRows.slice(0, visibleRowCount);

  const suggestions = useMemo(() => {
    const normalized = cellText.trim().toLowerCase();
    if (!normalized) return bindingOptions.slice(0, 3);
    return bindingOptions.filter((option) => `${option.searchText} ${option.label} ${option.code}`.toLowerCase().includes(normalized));
  }, [cellText]);

  const filteredTemplates = useMemo(() => {
    const normalized = query.toLowerCase();
    return templates.filter((template) => {
      const matchesStatus = statusFilter === "ALL" || template.status === statusFilter;
      const matchesQuery = Object.values(template).join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, templates]);

  const statCards = [
    { label: "Templates", value: templates.length, helper: `${templates.filter((item) => item.status === "ACTIVE").length} active`, detail: "Definitions by selected unit" },
    { label: "Drafts", value: templates.filter((item) => item.status === "DRAFT").length, helper: "Inactive until publish", detail: "Safe working copies" },
    { label: "Generated cells", value: generatedRows * generatedColumns, helper: `${generatedRows} rows x ${generatedColumns} columns`, detail: "From dimension bindings" },
    { label: "Bound objects", value: boundObjects.length, helper: `${rulesForVersion.length} rules available`, detail: "Axes, measure, indicator" },
  ];

  const templateJson = useMemo(() => {
    const measureForCode = (code?: string) => measureBindingOptions.find((measure) => measure.code === code) ?? selectedMeasure;
    const measureAxisIndex = columnAxes.indexOf("INDICATOR_VALUE");
    const combinedDimensionAxis =
      combineMeasureBelowDimension && measureAxisIndex > 0 ? columnAxes[measureAxisIndex - 1] : null;
    const editableCells = Object.entries(cells)
      .filter(([, cell]) => cell.role === "INPUT" || cell.editable)
      .slice(0, 80)
      .map(([address, cell]) => {
        const cellMeasure = measureForCode(cell.boundCode);
        return {
          address,
          measure_code: cellMeasure.code,
          value_type: cell.datatype ?? cellMeasure.valueType,
          unit_code: cellMeasure.unitCode,
          required: cell.required ?? required,
          validation_rule: cell.validationRule ?? cellMeasure.validationRule,
          align: cell.align ?? horizontalAlign,
          vertical_align: cell.valign ?? verticalAlign,
        };
      });

    const axisMembers = (code: BindingObjectCode) =>
      getMembersForObject(code, geographyScope).map((member) => ({
        member_code: member.member_code,
        label: member.name,
        parent_member_code: member.parent_member_code ?? null,
      }));

    return JSON.stringify(
      {
        template_code: selectedTemplate.template_code,
        template_version_code: selectedTemplate.current_version_code,
        indicator: {
          national_indicator_code: selectedTemplate.mapped_indicator_code,
          global_indicator_code: selectedTemplate.mapped_global_indicator_code,
          name: selectedTemplate.mapped_indicator_name,
          source_unit_code: selectedTemplate.source_unit_code,
        },
        geography_scope: geographyScope,
        row_axes: rowAxes.map((code) => ({
          axis_code: code,
          axis_role: "ROW",
          members: axisMembers(code),
        })),
        column_axes: columnAxes.map((code) => ({
          axis_code: code,
          axis_role: "COLUMN",
          members: axisMembers(code),
        })),
        binding_groups: [
          ...rowAxes.map((code, index) => ({
            binding_group_code: `BIND_${code}_ROWS`,
            binding_group_type: "AXIS",
            axis_code: code,
            axis_role: "ROW",
            header_label: code === "GEOGRAPHY" ? "Location" : optionFor(code).label,
            show_header: showHeader,
            axis_alignment: "ROW",
            freeze_group: code === "GEOGRAPHY",
            is_editable: false,
            is_required: true,
            display_order: (index + 1) * 10,
            nesting_order: index + 1,
          })),
          ...columnAxes.map((code, index) => ({
            binding_group_code: `BIND_${code}_COLUMNS`,
            binding_group_type: "AXIS",
            axis_code: code,
            axis_role: "COLUMN",
            header_label: optionFor(code).label,
            show_header: showHeader,
            axis_alignment: "COLUMN",
            freeze_group: code === "TIME_PERIOD",
            is_editable: code === "TIME_PERIOD",
            is_required: true,
            display_order: (index + 1) * 10,
            nesting_order: index + 1,
            render_options: code === "AREA_TYPE"
              ? {
                  rollup_rule_code: "ROLLUP_AREA_TYPE_TOTAL",
                  entry_mode: rollupEntryMode,
                  aggregation_method: aggregationMethod,
                  parent_member_code: "TOTAL",
                  child_member_codes: ["RURAL", "URBAN"],
                }
              : undefined,
            header_combine: combinedDimensionAxis === code
              ? {
                  combined_with: "INDICATOR_VALUE",
                  display_mode: "DIMENSION_LABEL_OVER_MEASURE_UNIT",
                }
              : undefined,
          })),
          {
            binding_group_code: `BIND_${selectedMeasure.code}`,
            binding_group_type: "MEASURE",
            measure_code: selectedMeasure.code,
            header_label: selectedMeasure.label,
            show_header: false,
            axis_alignment: "CONTEXT",
            freeze_group: false,
            is_editable: true,
            is_required: required,
            display_order: 90,
            nesting_order: 1,
          },
        ],
        measure: {
          measure_code: selectedMeasure.code,
          label: selectedMeasure.label,
          value_type: selectedMeasure.valueType,
          unit_code: selectedMeasure.unitCode,
          required,
          decimal_places: selectedMeasure.decimalPlaces,
          validation_rule: selectedMeasure.validationRule,
        },
        measures: measureBindingOptions.map((measure) => ({
          measure_code: measure.code,
          label: measure.label,
          value_type: measure.valueType,
          unit_code: measure.unitCode,
          decimal_places: measure.decimalPlaces,
          validation_rule: measure.validationRule,
        })),
        header_combine_rules: combinedDimensionAxis
          ? [
              {
                rule_code: "COMBINE_DIMENSION_MEASURE_STACKED",
                dimension_axis_code: combinedDimensionAxis,
                measure_axis_code: "INDICATOR_VALUE",
                display_mode: "DIMENSION_LABEL_OVER_MEASURE_UNIT",
                visual_example: "Total\\nPerson count [NUMBER]",
              },
            ]
          : [],
        rollup_rules: columnAxes.includes("AREA_TYPE")
          ? [
              {
                dimension_code: "AREA_TYPE",
                parent_member_code: "TOTAL",
                child_member_codes: ["RURAL", "URBAN"],
                entry_mode: rollupEntryMode,
                aggregation_method: aggregationMethod,
                measure_code: selectedMeasure.code,
                validation_rule_code: "TOTAL_EQUALS_CHILD_SUM",
              },
            ]
          : [],
        editable_cells: editableCells,
        data_entry_binding_shape: {
          rows_from: rowAxes,
          columns_from: columnAxes,
          value_object: {
            cell_code: "generated from row/column axis members",
            value_numeric: "entered by department user",
            measure_code: "resolved from cell binding",
            unit_code: "resolved from measure_code",
            dimensions: ["geography", "time_period", "area_type", "gender"].filter((item) =>
              [...rowAxes, ...columnAxes].join(" ").toLowerCase().includes(item.split("_")[0]),
            ),
          },
        },
      },
      null,
      2,
    );
  }, [aggregationMethod, cells, columnAxes, combineMeasureBelowDimension, datatype, geographyScope, horizontalAlign, required, rollupEntryMode, rowAxes, selectedMeasure, selectedTemplate, showHeader, validationRule, verticalAlign]);

  const addOperation = (label: string, detail: string) => {
    setOperations((current) => [...current, { id: `${Date.now()}-${label}`, label, detail }]);
  };

  const snapshot = useCallback((): CanvasSnapshot => ({
    cells,
    columnWidths,
    rowHeights,
    boundObjects,
    boundMeasureCodes,
    rowAxes,
    columnAxes,
    visibleColumnCount,
    visibleRowCount,
    combineMeasureBelowDimension,
  }), [boundMeasureCodes, boundObjects, cells, columnAxes, columnWidths, combineMeasureBelowDimension, rowAxes, rowHeights, visibleColumnCount, visibleRowCount]);

  const pushUndo = () => {
    setUndoStack((current) => [...current, snapshot()].slice(-30));
    setRedoStack([]);
  };

  const restoreSnapshot = useCallback((next: CanvasSnapshot) => {
    setCells(next.cells);
    setColumnWidths(next.columnWidths);
    setRowHeights(next.rowHeights);
    setBoundObjects(next.boundObjects);
    setBoundMeasureCodes(next.boundMeasureCodes);
    setRowAxes(next.rowAxes);
    setColumnAxes(next.columnAxes);
    setVisibleColumnCount(next.visibleColumnCount);
    setVisibleRowCount(next.visibleRowCount);
    setCombineMeasureBelowDimension(next.combineMeasureBelowDimension);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((current) => {
      const previous = current.at(-1);
      if (!previous) return current;
      setRedoStack((redo) => [...redo, snapshot()].slice(-30));
      restoreSnapshot(previous);
      return current.slice(0, -1);
    });
  }, [restoreSnapshot, snapshot]);

  const handleRedo = useCallback(() => {
    setRedoStack((current) => {
      const next = current.at(-1);
      if (!next) return current;
      setUndoStack((undo) => [...undo, snapshot()].slice(-30));
      restoreSnapshot(next);
      return current.slice(0, -1);
    });
  }, [restoreSnapshot, snapshot]);

  const setCell = (next: Record<string, CanvasCell>, address: string, update: CanvasCell) => {
    next[address] = { ...(next[address] ?? {}), ...update };
  };

  const getCurrentAxisHeaderLabel = (code: BindingObjectCode) => {
    const fallback = code === "GEOGRAPHY" ? "Location" : optionFor(code).label;
    if (headerType === "Dimension" && bindingObject === code) {
      return headerLabel || fallback;
    }

    const existingHeader = Object.values(cells).find(
      (cell) =>
        cell.role === "HEADER" &&
        cell.groupBindingCode === code &&
        cell.groupAlignment === "row" &&
        !cell.mergeOwner &&
        Boolean(cell.value),
    );

    return existingHeader?.value || fallback;
  };

  const addAxisAtSelection = (
    currentAxes: BindingObjectCode[],
    code: BindingObjectCode,
    alignment: AxisAlignment,
  ) => {
    const axesWithoutCurrent = currentAxes.filter((axisCode) => axisCode !== code);
    const { start } = normalizeRange(selectedAnchor, selectedFocus);
    const preferredIndex = alignment === "column" ? start.row - 2 : start.col - 1;
    const insertIndex = Math.min(Math.max(preferredIndex, 0), axesWithoutCurrent.length);

    return [
      ...axesWithoutCurrent.slice(0, insertIndex),
      code,
      ...axesWithoutCurrent.slice(insertIndex),
    ];
  };

  const buildStructuredGrid = (
    nextRowAxes: BindingObjectCode[],
    nextColumnAxes: BindingObjectCode[],
    includeMeasureCells = boundObjects.some((item) => item.code === "INDICATOR_VALUE") && boundMeasureCodes.length === 0,
    scopeOverride = geographyScope,
    combineOverride = combineMeasureBelowDimension,
  ) => {
    const next: Record<string, CanvasCell> = buildHeaderCells(selectedTemplate);
    const activeGeographyScope = scopeOverride;
    const usesGeographyHierarchy = nextRowAxes.includes("GEOGRAPHY") && isHierarchyGeographyScope(activeGeographyScope);
    const regularRowAxes = nextRowAxes.filter((code) => !(code === "GEOGRAPHY" && usesGeographyHierarchy));
    const regularRowAxisMembers = regularRowAxes.map((code) => ({
      code,
      members: getMembersForObject(code, activeGeographyScope),
    }));
    const regularRowCombinations = cartesianProduct(regularRowAxisMembers.map((axis) => axis.members));
    const geographyHeaderLabel = getCurrentAxisHeaderLabel("GEOGRAPHY");
    const geographyHierarchyLabels = usesGeographyHierarchy ? getGeographyHierarchyColumns(activeGeographyScope, geographyHeaderLabel) : [];
    const rowAxisColumns: Array<{ code: BindingObjectCode; label: string }> = [
      ...geographyHierarchyLabels.map((label) => ({ code: "GEOGRAPHY" as BindingObjectCode, label })),
      ...regularRowAxes.map((code) => ({ code, label: code === "GEOGRAPHY" ? geographyHeaderLabel : getCurrentAxisHeaderLabel(code) })),
    ];
    const geographyRows = usesGeographyHierarchy ? getGeographyHierarchyRows(activeGeographyScope) : [];
    const hierarchyValues = (row: GeographyHierarchyRow): StructuredRowCell[] => {
      const values = [row.country, row.state, row.district].slice(0, geographyHierarchyLabels.length);
      return values.map((member, index) => ({
        axisCode: "GEOGRAPHY",
        value: member?.name ?? "",
        memberCode: member?.member_code,
        columnLabel: geographyHierarchyLabels[index] ?? geographyHeaderLabel,
      }));
    };
    const rowRecords: StructuredRowCell[][] = usesGeographyHierarchy
      ? geographyRows.flatMap((geographyRow) =>
          regularRowCombinations.map((combination) => [
            ...hierarchyValues(geographyRow),
            ...combination.map((member, index) => {
              const code = regularRowAxisMembers[index]?.code ?? "GEOGRAPHY";
              return {
                axisCode: code,
                value: member.name,
                memberCode: member.member_code,
                columnLabel: optionFor(code).label,
              };
            }),
          ]),
        )
      : regularRowCombinations.map((combination) =>
          combination.map((member, index) => {
            const code = regularRowAxisMembers[index]?.code ?? "GEOGRAPHY";
            return {
              axisCode: code,
              value: member.name,
              memberCode: member.member_code,
                columnLabel: code === "GEOGRAPHY" ? geographyHeaderLabel : optionFor(code).label,
            };
          }),
        );
    const strictMeasureHeaderEndRow = boundMeasureCodes.length
      ? Object.values(cells).reduce((lastRow, cell) => {
          if (!isStrictMeasureHeaderCell(cell)) return lastRow;
          const endAddress = cell.groupFocus ?? cell.groupAnchor;
          if (!endAddress) return lastRow;
          return Math.max(lastRow, addressToCoord(endAddress).row);
        }, 1)
      : 1;
    const rowAxisColumnCount = rowAxisColumns.length;
    const columnsStart = rowAxisColumnCount + 1;
    const headerStartRow = Math.max(2, strictMeasureHeaderEndRow + 1);
    const axisMembers = nextColumnAxes.map((code) => ({
      code,
      members: getMembersForObject(code, activeGeographyScope),
    }));
    const columnCombinations = axisMembers.length ? cartesianProduct(axisMembers.map((axis) => axis.members)) : [[]];
    const measureAxisIndex = axisMembers.findIndex((axis) => axis.code === "INDICATOR_VALUE");
    const canCombineMeasureHeaders = combineOverride && measureAxisIndex > 0;
    const combinedDimensionIndex = canCombineMeasureHeaders ? measureAxisIndex - 1 : -1;
    const headerRowCount = Math.max(axisMembers.length - (canCombineMeasureHeaders ? 1 : 0), 1);
    const dataStartRow = headerStartRow + headerRowCount;
    const leafColumnCount = Math.max(1, axisMembers.reduce((total, axis) => total * Math.max(axis.members.length, 1), 1));
    const lastDataColumn = Math.min(canvasColumns.length, columnsStart + leafColumnCount - 1);
    const requiredVisibleColumns = Math.min(canvasColumns.length, Math.max(initialVisibleColumnCount, lastDataColumn + 1));
    const requiredVisibleRows = Math.min(canvasRows.length, Math.max(initialVisibleRowCount, dataStartRow + Math.max(rowRecords.length, 6)));

    const set = (address: string, update: CanvasCell) => setCell(next, address, update);
    const productAfter = (axisIndex: number) =>
      axisMembers.slice(axisIndex + 1).reduce((total, axis) => total * Math.max(axis.members.length, 1), 1);

    rowAxisColumns.forEach((axis, axisIndex) => {
      const col = axisIndex + 1;
      const owner = coordToAddress(headerStartRow, col);
      const groupAnchor = axis.code === "GEOGRAPHY" && usesGeographyHierarchy ? coordToAddress(headerStartRow, 1) : owner;
      const groupFocus =
        axis.code === "GEOGRAPHY" && usesGeographyHierarchy
          ? coordToAddress(dataStartRow + Math.max(rowRecords.length - 1, 0), geographyHierarchyLabels.length)
          : coordToAddress(dataStartRow + Math.max(rowRecords.length - 1, 0), col);
      set(owner, {
        value: axis.label,
        role: "HEADER",
        boundCode: axis.code,
        align: "center",
        valign: "middle",
        frozen: true,
        merge: { rowSpan: headerRowCount, colSpan: 1 },
        groupId: `axis-${axis.code}-row`,
        groupLabel: `${optionFor(axis.code).label} rows`,
        groupAnchor,
        groupFocus,
        groupBindingCode: axis.code,
        groupAlignment: "row",
      });
      for (let row = headerStartRow + 1; row < dataStartRow; row += 1) {
        set(coordToAddress(row, col), {
          mergeOwner: owner,
          groupId: `axis-${axis.code}-row`,
          groupLabel: `${optionFor(axis.code).label} rows`,
          groupAnchor,
          groupFocus,
          groupBindingCode: axis.code,
          groupAlignment: "row",
        });
      }
    });

    rowRecords.forEach((record, rowIndex) => {
      record.forEach((member, axisIndex) => {
        const code = member.axisCode;
        const col = axisIndex + 1;
        const groupAnchor = code === "GEOGRAPHY" && usesGeographyHierarchy ? coordToAddress(headerStartRow, 1) : coordToAddress(headerStartRow, col);
        const groupFocus =
          code === "GEOGRAPHY" && usesGeographyHierarchy
            ? coordToAddress(dataStartRow + Math.max(rowRecords.length - 1, 0), geographyHierarchyLabels.length)
            : coordToAddress(dataStartRow + Math.max(rowRecords.length - 1, 0), col);
        set(coordToAddress(dataStartRow + rowIndex, col), {
          value: member.value,
          role: "DIMENSION_MEMBER",
          boundCode: member.memberCode,
          align: "left",
          groupId: `axis-${code}-row`,
          groupLabel: `${optionFor(code).label} rows`,
          groupAnchor,
          groupFocus,
          groupBindingCode: code,
          groupAlignment: "row",
        });
      });
    });

    axisMembers.forEach((axis, axisIndex) => {
      if (canCombineMeasureHeaders && axisIndex === measureAxisIndex) return;

      const row = headerStartRow + axisIndex - (canCombineMeasureHeaders && axisIndex > measureAxisIndex ? 1 : 0);
      if (canCombineMeasureHeaders && axisIndex === combinedDimensionIndex) {
        const groupAnchor = coordToAddress(row, columnsStart);
        const groupFocus = coordToAddress(row, lastDataColumn);
        for (let col = columnsStart; col <= lastDataColumn; col += 1) {
          const combination = columnCombinations[col - columnsStart] ?? [];
          const dimensionMember = combination[combinedDimensionIndex];
          const measureMember = combination[measureAxisIndex];
          const measure = measureBindingOptions.find((item) => item.code === measureMember?.member_code) ?? selectedMeasure;
          set(coordToAddress(row, col), {
            value: `${dimensionMember?.name ?? optionFor(axis.code).label}\n${measure.label} [${measure.unitCode}]`,
            role: "HEADER",
            boundCode: dimensionMember?.member_code,
            align: "center",
            valign: "middle",
            frozen: true,
            groupId: `axis-${axis.code}-measure-combined`,
            groupLabel: `${optionFor(axis.code).label} + measure columns`,
            groupAnchor,
            groupFocus,
            groupBindingCode: axis.code,
            groupAlignment: "column",
          });
        }
        return;
      }

      const span = productAfter(axisIndex);
      const cycle = span * Math.max(axis.members.length, 1);
      const groupAnchor = coordToAddress(row, columnsStart);
      const groupFocus = coordToAddress(row, lastDataColumn);
      for (let col = columnsStart; col <= lastDataColumn; col += cycle) {
        axis.members.forEach((member, memberIndex) => {
          const ownerCol = col + memberIndex * span;
          if (ownerCol > lastDataColumn) return;
          const owner = coordToAddress(row, ownerCol);
          const effectiveSpan = Math.min(span, lastDataColumn - ownerCol + 1);
          set(owner, {
            value: member.name,
            role: "HEADER",
            boundCode: member.member_code,
            align: "center",
            valign: "middle",
            frozen: true,
            merge: effectiveSpan > 1 ? { rowSpan: 1, colSpan: effectiveSpan } : undefined,
            groupId: `axis-${axis.code}`,
            groupLabel: `${optionFor(axis.code).label} columns`,
            groupAnchor,
            groupFocus,
            groupBindingCode: axis.code,
            groupAlignment: "column",
          });
          for (let hiddenCol = ownerCol + 1; hiddenCol < ownerCol + effectiveSpan; hiddenCol += 1) {
            set(coordToAddress(row, hiddenCol), {
              mergeOwner: owner,
              groupId: `axis-${axis.code}`,
              groupLabel: `${optionFor(axis.code).label} columns`,
              groupAnchor,
              groupFocus,
              groupBindingCode: axis.code,
              groupAlignment: "column",
            });
          }
        });
      }
    });

    if (includeMeasureCells && rowRecords.length) {
      rowRecords.forEach((_, rowIndex) => {
        for (let col = columnsStart; col <= lastDataColumn; col += 1) {
          const columnCombination = columnCombinations[col - columnsStart] ?? [];
          const measureMember = measureAxisIndex >= 0 ? columnCombination[measureAxisIndex] : undefined;
          const measureForCell = measureBindingOptions.find((measure) => measure.code === measureMember?.member_code) ?? selectedMeasure;
          set(coordToAddress(dataStartRow + rowIndex, col), {
            value: "",
            role: "INPUT",
            boundCode: measureForCell.code,
            editable: true,
            required,
            datatype: measureForCell.valueType,
            validationRule: measureForCell.validationRule,
            align: horizontalAlign,
            valign: verticalAlign,
            groupId: "measure-input-cells",
            groupLabel: measureAxisIndex >= 0 ? "Measure column cells" : "Indicator value cells",
            groupAnchor: coordToAddress(dataStartRow, columnsStart),
            groupFocus: coordToAddress(dataStartRow + rowRecords.length - 1, lastDataColumn),
            groupBindingCode: "INDICATOR_VALUE",
            groupAlignment: "context",
          });
        }
      });
    }

    setVisibleColumnCount(requiredVisibleColumns);
    setVisibleRowCount(requiredVisibleRows);
    return next;
  };

  const isStrictMeasureHeaderCell = (cell?: CanvasCell) =>
    cell?.groupBindingCode === "INDICATOR_VALUE" &&
    typeof cell.groupId === "string" &&
    cell.groupId.startsWith("measure-");

  const preserveStrictMeasureHeaders = (
    nextCells: Record<string, CanvasCell>,
    previousCells = cells,
  ) => {
    if (!boundMeasureCodes.length) return nextCells;

    const merged = { ...nextCells };
    Object.entries(previousCells).forEach(([address, cell]) => {
      if (isStrictMeasureHeaderCell(cell)) {
        merged[address] = { ...cell };
      }
    });
    return merged;
  };

  const withStrictMeasureBoundObject = (
    nextBoundObjects: BoundObject[],
    measureCodes = boundMeasureCodes,
  ) => {
    if (!measureCodes.length) return nextBoundObjects;

    const measureBinding: BoundObject = {
      code: "INDICATOR_VALUE",
      label: "Measures",
      type: "Measure",
      alignment: "column",
      range: measureCodes.join(", "),
      memberCount: measureCodes.length,
    };

    return [
      ...nextBoundObjects.filter((item) => item.code !== "INDICATOR_VALUE"),
      measureBinding,
    ];
  };

  const clearMergeInRange = (next: Record<string, CanvasCell>, anchor: string, focus: string) => {
    const addresses = rangeAddresses(anchor, focus);
    addresses.forEach((address) => {
      next[address] = { ...(next[address] ?? {}), merge: undefined, mergeOwner: undefined };
    });
  };

  const clearCellsInRange = (next: Record<string, CanvasCell>, anchor: string, focus: string) => {
    rangeAddresses(anchor, focus).forEach((address) => {
      delete next[address];
    });
  };

  const mergeRangeInState = (anchor: string, focus: string) => {
    const { start, end } = normalizeRange(anchor, focus);
    const owner = coordToAddress(start.row, start.col);
    const addresses = rangeAddresses(anchor, focus);
    const rowSpan = end.row - start.row + 1;
    const colSpan = end.col - start.col + 1;

    if (rowSpan === 1 && colSpan === 1) return;

    setCells((current) => {
      const next = { ...current };
      clearMergeInRange(next, anchor, focus);
      addresses.forEach((address) => {
        if (address === owner) {
          next[address] = { ...(next[address] ?? {}), merge: { rowSpan, colSpan }, mergeOwner: undefined };
        } else {
          next[address] = { ...(next[address] ?? {}), merge: undefined, mergeOwner: owner };
        }
      });
      return next;
    });
  };

  const applyToSelectedRange = (update: CanvasCell) => {
    setCells((current) => {
      const next = { ...current };
      rangeAddresses(selectedAnchor, selectedFocus).forEach((address) => setCell(next, address, update));
      return next;
    });
  };

  const getSelectableRangeForAddress = (address: string) => {
    const cell = cells[address];
    const ownerAddress = cell?.mergeOwner ?? address;
    const ownerCell = cells[ownerAddress] ?? cell;

    if (ownerCell?.groupAnchor && ownerCell.groupFocus) {
      return {
        anchor: ownerCell.groupAnchor,
        focus: ownerCell.groupFocus,
        label: ownerCell.groupLabel,
        value: ownerCell.value ?? "",
        bindingCode: ownerCell.groupBindingCode,
        alignment: ownerCell.groupAlignment,
        role: ownerCell.role,
        boundCode: ownerCell.boundCode,
        isBlank: false,
      };
    }

    if (ownerCell?.merge) {
      const ownerCoord = addressToCoord(ownerAddress);
      return {
        anchor: ownerAddress,
        focus: coordToAddress(ownerCoord.row + ownerCell.merge.rowSpan - 1, ownerCoord.col + ownerCell.merge.colSpan - 1),
        label: ownerCell.value,
        value: ownerCell.value ?? "",
        bindingCode: ownerCell.groupBindingCode,
        alignment: ownerCell.groupAlignment,
        role: ownerCell.role,
        boundCode: ownerCell.boundCode,
        isBlank: false,
      };
    }

    const hasCellContext = Boolean(ownerCell?.role || ownerCell?.boundCode || ownerCell?.groupBindingCode || ownerCell?.value);
    return {
      anchor: address,
      focus: address,
      label: undefined,
      value: ownerCell?.value ?? "",
      bindingCode: ownerCell?.groupBindingCode,
      alignment: ownerCell?.groupAlignment,
      role: ownerCell?.role,
      boundCode: ownerCell?.boundCode,
      isBlank: !hasCellContext,
    };
  };

  const syncBindingControlsForSelection = (selection: ReturnType<typeof getSelectableRangeForAddress>, address: string) => {
    if (selection.bindingCode) {
      handleBindingObjectChange(selection.bindingCode);
      if (selection.alignment === "row" || selection.alignment === "column") setAxisAlignment(selection.alignment);
      if (selection.bindingCode === "INDICATOR_VALUE" && measureBindingOptions.some((measure) => measure.code === selection.boundCode)) {
        const measure = measureBindingOptions.find((item) => item.code === selection.boundCode) ?? selectedMeasure;
        setSelectedMeasureCode(measure.code);
        setDatatype(measure.valueType);
        setDecimalPlaces(measure.decimalPlaces);
        setValidationRule(measure.validationRule);
      }
      return;
    }

    if (selection.role === "INPUT" || measureBindingOptions.some((measure) => measure.code === selection.boundCode)) {
      const measure = measureBindingOptions.find((item) => item.code === selection.boundCode) ?? selectedMeasure;
      setHeaderType("Measure");
      setBindingObject("INDICATOR_VALUE");
      setSelectedMeasureCode(measure.code);
      setDatatype(measure.valueType);
      setDecimalPlaces(measure.decimalPlaces);
      setValidationRule(measure.validationRule);
      setHeaderLabel(measure.label);
      return;
    }

    setHeaderType("Dimension");
    setBindingObject("GEOGRAPHY");
    setAxisAlignment("row");
    setHeaderLabel("");

    if (selection.isBlank) {
      setActivityMessage(`${address} is blank. Type to search, or double-click to choose a binding without carrying the previous group options.`);
    }
  };

  const handleSelectCell = (address: string, event: MouseEvent<HTMLButtonElement | HTMLTableCellElement | HTMLInputElement>) => {
    if (event.shiftKey) {
      setSelectedFocus(address);
      setEditingCell(null);
      setDesignerStage("options");
      focusTemplateCell(address);
      return;
    }

    const nextSelection = getSelectableRangeForAddress(address);
    setSelectedAnchor(nextSelection.anchor);
    setSelectedFocus(nextSelection.focus);
    setCellText(nextSelection.value);
    setEditingCell(address);
    syncBindingControlsForSelection(nextSelection, address);
    setDesignerStage("typing");
    if (nextSelection.label) {
      setActivityMessage(`${nextSelection.label} selected as a group. Changes apply to ${rangeLabel(nextSelection.anchor, nextSelection.focus)}.`);
    }
    focusTemplateCell(address);
  };

  const handleSelectAddress = (address: string) => {
    const nextSelection = getSelectableRangeForAddress(address);
    setSelectedAnchor(nextSelection.anchor);
    setSelectedFocus(nextSelection.focus);
    setCellText(nextSelection.value);
    setEditingCell(null);
    syncBindingControlsForSelection(nextSelection, address);
    focusTemplateCell(address);
  };

  const handleDoubleClick = (address: string) => {
    const nextSelection = getSelectableRangeForAddress(address);
    setSelectedAnchor(nextSelection.anchor);
    setSelectedFocus(nextSelection.focus);
    setCellText(nextSelection.value);
    syncBindingControlsForSelection(nextSelection, address);
    setEditingCell(null);
    setOptionsOpen(true);
    setDesignerStage("options");
  };

  const handleStartEdit = (address: string) => {
    const nextSelection = getSelectableRangeForAddress(address);
    setSelectedAnchor(nextSelection.anchor);
    setSelectedFocus(nextSelection.focus);
    setCellText(nextSelection.value);
    syncBindingControlsForSelection(nextSelection, address);
    setEditingCell(address);
    setDesignerStage("typing");
    focusTemplateCell(address);
  };

  const handleStopEdit = () => {
    setEditingCell(null);
    setDesignerStage(optionsOpen ? "options" : "binding");
    focusTemplateCell(selectedFocus);
  };

  const handleNavigateCell = (address: string, direction: NavigationDirection) => {
    const current = addressToCoord(address);
    const next = {
      up: coordToAddress(Math.max(1, current.row - 1), current.col),
      down: coordToAddress(Math.min(canvasRows.length, current.row + 1), current.col),
      left: coordToAddress(current.row, Math.max(1, current.col - 1)),
      right: coordToAddress(current.row, Math.min(canvasColumns.length, current.col + 1)),
    }[direction];
    const nextSelection = getSelectableRangeForAddress(next);
    setSelectedAnchor(nextSelection.anchor);
    setSelectedFocus(nextSelection.focus);
    setCellText(nextSelection.value);
    setEditingCell(null);
    syncBindingControlsForSelection(nextSelection, next);
    focusTemplateCell(next);
  };

  const handleCellTextChange = (value: string) => {
    setCellText(value);
    setCells((current) => {
      const editAddress = editingCell ?? selectedAnchor;
      const selection = getSelectableRangeForAddress(editAddress);
      const targetAddress = current[selection.anchor]?.mergeOwner ?? selection.anchor;
      return {
        ...current,
        [targetAddress]: {
          ...(current[targetAddress] ?? {}),
          value,
        },
      };
    });
    setDesignerStage(value ? "typing" : "basics");
  };

  const handleSuggestionClick = (suggestion: (typeof bindingOptions)[number]) => {
    handleHeaderTypeChange(suggestion.type);
    if (suggestion.type !== "Measure") {
      setBindingObject(suggestion.code);
      setHeaderLabel(suggestion.code === "GEOGRAPHY" ? "Location" : suggestion.label);
    }
    if (suggestion.defaultAlignment !== "context") setAxisAlignment(suggestion.defaultAlignment);
    setOptionsOpen(true);
    setDesignerStage("options");
    setActivityMessage(`${suggestion.label} selected. Choose options, then click Bind values.`);
  };

  const handleHeaderTypeChange = (value: HeaderType) => {
    setHeaderType(value);

    if (value === "Indicator") {
      handleBindingObjectChange("NIF_1_2_1");
      setAxisAlignment("column");
      return;
    }

    if (value === "Measure") {
      const nextMeasure = measureBindingOptions.find((measure) => !boundMeasureCodes.includes(measure.code)) ?? selectedMeasure;
      setBindingObject("INDICATOR_VALUE");
      setSelectedMeasureCode(nextMeasure.code);
      setDatatype(nextMeasure.valueType);
      setDecimalPlaces(nextMeasure.decimalPlaces);
      setValidationRule(nextMeasure.validationRule);
      setHeaderLabel(nextMeasure.label);
      setAxisAlignment("column");
      return;
    }

    handleBindingObjectChange("GEOGRAPHY");
    setAxisAlignment("row");
    setHeaderLabel("Location");
  };

  const handleBindingObjectChange = (code: BindingObjectCode) => {
    const option = optionFor(code);
    setBindingObject(code);
    setHeaderType(option.type);
    setHeaderLabel(code === "GEOGRAPHY" ? "Location" : option.label);
    if (option.type === "Measure") {
      setAxisAlignment("column");
      return;
    }
    if (option.defaultAlignment !== "context") setAxisAlignment(option.defaultAlignment);
  };

  const handleHeaderLabelChange = (value: string) => {
    setHeaderLabel(value);
    setCells((current) => {
      const next = { ...current };
      const selection = getSelectableRangeForAddress(selectedFocus);
      const ownerAddress = next[selection.anchor]?.mergeOwner ?? selection.anchor;
      const ownerCell = next[ownerAddress];

      if (ownerCell?.role === "HEADER" && ownerCell.groupBindingCode === bindingObject) {
        next[ownerAddress] = { ...ownerCell, value };
        return next;
      }

      if (bindingObject === "GEOGRAPHY") {
        const geographyHeader = Object.entries(next).find(([, cell]) =>
          cell.role === "HEADER" &&
          cell.groupBindingCode === "GEOGRAPHY" &&
          cell.groupAlignment === "row" &&
          !cell.mergeOwner,
        );
        if (geographyHeader) {
          const [address, cell] = geographyHeader;
          next[address] = { ...cell, value: value || "Location" };
        }
      }

      return next;
    });
  };

  const recordBinding = (code: BindingObjectCode, range: string, alignment: AxisAlignment | "context") => {
    const option = optionFor(code);
    const binding: BoundObject = {
      code,
      label: option.label,
      type: option.type,
      alignment,
      range,
      memberCount: option.memberCount,
    };
    setBoundObjects((current) => {
      const next = current.filter((item) => item.code !== code);
      return [...next, binding];
    });
  };

  const objectsFromAxes = (
    nextRowAxes: BindingObjectCode[],
    nextColumnAxes: BindingObjectCode[],
    includeMeasure = boundObjects.some((item) => item.code === "INDICATOR_VALUE") && boundMeasureCodes.length === 0,
    scopeOverride = geographyScope,
  ) => {
    const next: BoundObject[] = [];
    nextRowAxes.forEach((code, index) => {
      next.push({
        code,
        label: optionFor(code).label,
        type: optionFor(code).type,
        alignment: "row",
        range: `${coordToAddress(2, index + 1)}`,
        memberCount: getMembersForObject(code, scopeOverride).length,
      });
    });
    nextColumnAxes.forEach((code) => {
      next.push({
        code,
        label: optionFor(code).label,
        type: optionFor(code).type,
        alignment: "column",
        range: code === "TIME_PERIOD" ? "B2" : code === "AREA_TYPE" ? "B3" : code === "INDICATOR_VALUE" ? "Measure columns" : "B4",
        memberCount: getMembersForObject(code, scopeOverride).length,
      });
    });
    if (includeMeasure && !nextRowAxes.includes("INDICATOR_VALUE") && !nextColumnAxes.includes("INDICATOR_VALUE")) {
      next.push({
        code: "INDICATOR_VALUE",
        label: optionFor("INDICATOR_VALUE").label,
        type: "Measure",
        alignment: "context",
        range: "Data cells",
        memberCount: 1,
      });
    }
    return next;
  };

  const rebuildDimensionAxis = (
    code: BindingObjectCode,
    alignment: AxisAlignment,
    includeUndo = true,
  ) => {
    const effectiveAlignment =
      code === "GEOGRAPHY" && isHierarchyGeographyScope(geographyScope)
        ? "row"
        : alignment;
    const includeMeasure = boundObjects.some((item) => item.code === "INDICATOR_VALUE") && boundMeasureCodes.length === 0;
    let nextRowAxes = rowAxes.filter((axisCode) => axisCode !== code);
    let nextColumnAxes = columnAxes.filter((axisCode) => axisCode !== code);

    if (effectiveAlignment === "row") {
      nextRowAxes = addAxisAtSelection(nextRowAxes, code, "row");
    } else {
      nextColumnAxes = addAxisAtSelection(nextColumnAxes, code, "column");
    }

    if (includeUndo) {
      pushUndo();
    }

    const nextCells = preserveStrictMeasureHeaders(buildStructuredGrid(nextRowAxes, nextColumnAxes, includeMeasure));
    setRowAxes(nextRowAxes);
    setColumnAxes(nextColumnAxes);
    setCells(nextCells);
    setBoundObjects(withStrictMeasureBoundObject(objectsFromAxes(nextRowAxes, nextColumnAxes, includeMeasure)));
    setDesignerStage("binding");
    setActivityMessage(`${optionFor(code).label} aligned as ${effectiveAlignment}. Canvas regenerated without duplicate axes.`);
    addOperation("Align axis", `${optionFor(code).label} moved to ${effectiveAlignment} alignment.`);
  };

  const bindRowDimension = (next: Record<string, CanvasCell>, code: BindingObjectCode) => {
    const { start } = normalizeRange(selectedAnchor, selectedFocus);
    const members = getMembersForObject(code, geographyScope);
    const startRow = start.row + (showHeader ? 1 : 0);
    const groupId = `${code}-${Date.now()}`;
    const groupLabel = `${optionFor(code).label} rows`;
    clearCellsInRange(next, selectedAnchor, selectedFocus);

    if (code === "GEOGRAPHY" && isHierarchyGeographyScope(geographyScope)) {
      const rows = [
        { country: "India", state: "Karnataka", district: "Bengaluru Urban" },
        { country: "India", state: "Karnataka", district: "Mysuru" },
        { country: "India", state: "Tamil Nadu", district: "" },
        { country: "India", state: "Maharashtra", district: "" },
        { country: "India", state: "Kerala", district: "" },
      ];
      const headerRow = showHeader ? start.row : undefined;
      const dataStartRow = start.row + (showHeader ? 1 : 0);
      const groupAnchor = coordToAddress(start.row, start.col);
      const groupFocus = coordToAddress(dataStartRow + rows.length - 1, start.col + 2);

      if (headerRow) {
        ["Country", "State", "District"].forEach((label, index) => {
          setCell(next, coordToAddress(headerRow, start.col + index), {
            value: index === 0 ? headerLabel || label : label,
            role: "HEADER",
            boundCode: code,
            align: "center",
            frozen: true,
            groupId,
            groupLabel,
            groupAnchor,
            groupFocus,
            groupBindingCode: code,
            groupAlignment: "row",
          });
        });
      }

      rows.forEach((row, rowIndex) => {
        [row.country, row.state, row.district].forEach((value, colIndex) => {
          setCell(next, coordToAddress(dataStartRow + rowIndex, start.col + colIndex), {
            value,
            role: "DIMENSION_MEMBER",
            boundCode: code,
            align: "left",
            groupId,
            groupLabel,
            groupAnchor,
            groupFocus,
            groupBindingCode: code,
            groupAlignment: "row",
          });
        });
      });
      return;
    }

    const groupAnchor = coordToAddress(start.row, start.col);
    const groupFocus = coordToAddress(startRow + members.length - 1, start.col);
    if (showHeader) {
      setCell(next, coordToAddress(start.row, start.col), {
        value: headerLabel,
        role: "HEADER",
        boundCode: code,
        align: horizontalAlign,
        valign: verticalAlign,
        frozen: true,
        groupId,
        groupLabel,
        groupAnchor,
        groupFocus,
        groupBindingCode: code,
        groupAlignment: "row",
      });
    }
    members.forEach((member, index) => {
      setCell(next, coordToAddress(startRow + index, start.col), {
        value: member.name,
        role: "DIMENSION_MEMBER",
        boundCode: member.member_code,
        align: "left",
        groupId,
        groupLabel,
        groupAnchor,
        groupFocus,
        groupBindingCode: code,
        groupAlignment: "row",
      });
    });
  };

  const bindColumnDimension = (next: Record<string, CanvasCell>, code: BindingObjectCode) => {
    const { start, end } = normalizeRange(selectedAnchor, selectedFocus);
    const width = end.col - start.col + 1;
    const members = getMembersForObject(code, geographyScope);
    const groupId = `${code}-${Date.now()}`;
    const groupLabel = `${optionFor(code).label} columns`;
    const groupAnchor = coordToAddress(start.row, start.col);
    const groupFocus = coordToAddress(end.row, Math.max(end.col, start.col + members.length - 1));
    const groupFields = {
      groupId,
      groupLabel,
      groupAnchor,
      groupFocus,
      groupBindingCode: code,
      groupAlignment: "column" as const,
    };
    clearCellsInRange(next, selectedAnchor, selectedFocus);
    clearMergeInRange(next, selectedAnchor, selectedFocus);

    if (code === "GEOGRAPHY") {
      const valueRow = start.row + (showHeader ? 1 : 0);
      clearCellsInRange(next, coordToAddress(start.row, start.col), coordToAddress(valueRow, start.col + Math.max(members.length - 1, 0)));
      const geoGroupFields = {
        ...groupFields,
        groupFocus: coordToAddress(valueRow, start.col + Math.max(members.length - 1, 0)),
      };
      if (showHeader) {
        const headerOwner = coordToAddress(start.row, start.col);
        const headerSpan = Math.max(members.length, 1);
        setCell(next, headerOwner, {
          value: headerLabel || "Location",
          role: "HEADER",
          boundCode: code,
          align: "center",
          frozen: true,
          merge: { rowSpan: 1, colSpan: headerSpan },
          ...geoGroupFields,
        });
        for (let hiddenCol = start.col + 1; hiddenCol < start.col + headerSpan; hiddenCol += 1) {
          setCell(next, coordToAddress(start.row, hiddenCol), { mergeOwner: headerOwner, merge: undefined, ...geoGroupFields });
        }
      }
      members.forEach((member, index) => {
        setCell(next, coordToAddress(valueRow, start.col + index), {
          value: member.name,
          role: "DIMENSION_MEMBER",
          boundCode: member.member_code,
          align: "center",
          ...geoGroupFields,
        });
      });
      return;
    }

    if (code === "TIME_PERIOD") {
      const span = Math.max(1, Math.floor(width / Math.max(members.length, 1)));
      members.forEach((member, index) => {
        const col = start.col + index * span;
        const owner = coordToAddress(start.row, col);
        const lastCol = index === members.length - 1 ? end.col : col + span - 1;
        setCell(next, owner, {
          value: member.name,
          role: "HEADER",
          boundCode: member.member_code,
          align: "center",
          frozen: true,
          ...groupFields,
          merge: { rowSpan: 1, colSpan: lastCol - col + 1 },
          mergeOwner: undefined,
        });
        for (let hiddenCol = col + 1; hiddenCol <= lastCol; hiddenCol += 1) {
          setCell(next, coordToAddress(start.row, hiddenCol), { mergeOwner: owner, merge: undefined, ...groupFields });
        }
      });
      return;
    }

    if (code === "AREA_TYPE") {
      const timeMembers = getMembersForObject("TIME_PERIOD").slice(0, 2);
      const areaMembers = members;
      const requiredWidth = timeMembers.length * areaMembers.length;
      const timeRow = Math.max(2, start.row - 1);
      const areaRow = start.row;
      const locationColumn = Math.max(1, start.col - 1);
      const areaGroupFields = {
        ...groupFields,
        groupFocus: coordToAddress(areaRow, start.col + requiredWidth - 1),
      };
      clearCellsInRange(next, coordToAddress(timeRow, locationColumn), coordToAddress(areaRow, start.col + requiredWidth - 1));
      clearMergeInRange(next, coordToAddress(timeRow, start.col), coordToAddress(areaRow, start.col + requiredWidth - 1));
      timeMembers.forEach((timeMember, timeIndex) => {
        const timeCol = start.col + timeIndex * areaMembers.length;
        const timeOwner = coordToAddress(timeRow, timeCol);
        setCell(next, timeOwner, {
          value: timeMember.name,
          role: "HEADER",
          boundCode: timeMember.member_code,
          align: "center",
          frozen: true,
          merge: { rowSpan: 1, colSpan: areaMembers.length },
          ...areaGroupFields,
        });
        for (let hiddenCol = timeCol + 1; hiddenCol < timeCol + areaMembers.length; hiddenCol += 1) {
          setCell(next, coordToAddress(timeRow, hiddenCol), { mergeOwner: timeOwner, merge: undefined, ...areaGroupFields });
        }
        members.forEach((member) => {
          const col = timeCol + areaMembers.indexOf(member);
          setCell(next, coordToAddress(areaRow, col), {
            value: member.name,
            role: "HEADER",
            boundCode: member.member_code,
            align: "center",
            frozen: true,
            ...areaGroupFields,
            mergeOwner: undefined,
          });
        });
      });
      if (showHeader) {
        const locationOwner = coordToAddress(timeRow, locationColumn);
        setCell(next, locationOwner, {
          value: "Location",
          role: "HEADER",
          boundCode: "GEOGRAPHY",
          align: "center",
          frozen: true,
          merge: { rowSpan: 2, colSpan: 1 },
          groupId: "location-header",
          groupLabel: "Location header",
          groupAnchor: locationOwner,
          groupFocus: coordToAddress(areaRow, locationColumn),
          groupBindingCode: "GEOGRAPHY",
          groupAlignment: "row",
        });
        setCell(next, coordToAddress(areaRow, locationColumn), {
          mergeOwner: locationOwner,
          merge: undefined,
          groupId: "location-header",
          groupLabel: "Location header",
          groupAnchor: locationOwner,
          groupFocus: coordToAddress(areaRow, locationColumn),
          groupBindingCode: "GEOGRAPHY",
          groupAlignment: "row",
        });
      }
      return;
    }

    const values = code === "GENDER" ? members : members.slice(0, width);
    for (let col = start.col; col <= end.col; col += 1) {
      const member = values[(col - start.col) % values.length];
      setCell(next, coordToAddress(start.row, col), {
        value: member?.name ?? "",
        role: "HEADER",
        boundCode: member?.member_code,
        align: "center",
        frozen: true,
        ...groupFields,
      });
    }
  };

  const findStrictMeasureOwnerForSelection = () => {
    const { start } = normalizeRange(selectedAnchor, selectedFocus);
    let selectedOwner: StrictMeasureOwner | undefined;

    Object.entries(cells).forEach(([address, cell]) => {
      if (!isStrictMeasureHeaderCell(cell) || cell.mergeOwner) return;
      const coord = addressToCoord(address);
      const endCol = coord.col + Math.max(cell.merge?.colSpan ?? 1, 1) - 1;
      if (coord.row > start.row || start.col < coord.col || start.col > endCol) return;
      if (!selectedOwner || coord.row >= selectedOwner.row) {
        selectedOwner = { address, cell, row: coord.row, col: coord.col, endCol };
      }
    });

    return selectedOwner;
  };

  const getLocalMeasureColumnAxes = (
    owner: { row: number; col: number; endCol: number },
    newCode: BindingObjectCode,
  ) => {
    const existingAxes: BindingObjectCode[] = [];
    const { start } = normalizeRange(selectedAnchor, selectedFocus);
    for (let row = owner.row + 1; row < start.row; row += 1) {
      const axisCode = Object.values(cells).find((cell) => {
        if (!cell.groupBindingCode || cell.groupAlignment !== "column") return false;
        if (cell.groupBindingCode === "INDICATOR_VALUE" || cell.groupBindingCode === "NIF_1_2_1") return false;
        if (!cell.groupAnchor || !cell.groupFocus) return false;
        const anchor = addressToCoord(cell.groupAnchor);
        const focus = addressToCoord(cell.groupFocus);
        return anchor.row === row && anchor.col <= owner.endCol && focus.col >= owner.col;
      })?.groupBindingCode;

      if (axisCode && !existingAxes.includes(axisCode)) {
        existingAxes.push(axisCode);
      }
    }

    return [...existingAxes.filter((axisCode) => axisCode !== newCode), newCode];
  };

  const getAllLocalMeasureColumnAxes = (
    owner: StrictMeasureOwner,
    sourceCells: Record<string, CanvasCell> = cells,
  ) => {
    const rowsByAxis = new Map<BindingObjectCode, number>();

    Object.entries(sourceCells).forEach(([address, cell]) => {
      if (!cell.groupId?.startsWith("measure-local-") || cell.mergeOwner) return;
      if (!cell.groupBindingCode || cell.groupBindingCode === "INDICATOR_VALUE" || cell.groupBindingCode === "NIF_1_2_1") return;
      if (!cell.groupAnchor || !cell.groupFocus) return;
      const anchor = addressToCoord(cell.groupAnchor);
      const focus = addressToCoord(cell.groupFocus);
      if (focus.col < owner.col || anchor.col > owner.endCol) return;
      rowsByAxis.set(cell.groupBindingCode, addressToCoord(address).row);
    });

    return [...rowsByAxis.entries()]
      .sort(([, firstRow], [, secondRow]) => firstRow - secondRow)
      .map(([axisCode]) => axisCode);
  };

  const getMaxLocalMeasureDepth = (
    selectedOwner: StrictMeasureOwner,
    selectedAxes: BindingObjectCode[],
  ) => {
    const ownerDepths = Object.entries(cells)
      .filter(([, cell]) => isStrictMeasureHeaderCell(cell) && !cell.mergeOwner)
      .map(([address, cell]) => {
        if (address === selectedOwner.address) return selectedAxes.length;
        const coord = addressToCoord(address);
        const owner: StrictMeasureOwner = {
          address,
          cell,
          row: coord.row,
          col: coord.col,
          endCol: coord.col + Math.max(cell.merge?.colSpan ?? 1, 1) - 1,
        };
        return getAllLocalMeasureColumnAxes(owner).length;
      });

    return Math.max(selectedAxes.length, ...ownerDepths, 0);
  };

  const applyStrictMeasureLocalAxes = (owner: StrictMeasureOwner, axes: BindingObjectCode[]) => {
    const oldAxisDepth = getAllLocalMeasureColumnAxes(owner).length;
    const headerDepth = getMaxLocalMeasureDepth(owner, axes);
    const axisMembers = axes.map((axisCode) => ({
      code: axisCode,
      members: getMembersForObject(axisCode, geographyScope),
    }));
    const leafColumnCount = Math.max(1, axisMembers.reduce((total, axis) => total * Math.max(axis.members.length, 1), 1));
    const lastCol = Math.min(canvasColumns.length, owner.col + leafColumnCount - 1);
    const localGroupFocus = coordToAddress(owner.row + Math.max(axes.length, 1), lastCol);
    const measureSpan = Math.max(1, lastCol - owner.col + 1);
    const expansionDelta = Math.max(0, lastCol - owner.endCol);
    const shrinkDelta = Math.max(0, owner.endCol - lastCol);

    setCells((current) => {
      let next =
        expansionDelta > 0
          ? shiftCellsRightFromColumn({ ...current }, owner.endCol, expansionDelta, owner.row)
          : { ...current };
      if (shrinkDelta > 0) {
        next = removeColumnRangeFromRows(next, lastCol + 1, owner.endCol, owner.row);
      }
      if (lastCol > owner.col) {
        clearCellsInRange(next, coordToAddress(owner.row, owner.col + 1), coordToAddress(owner.row, lastCol));
      }
      clearCellsInRange(next, coordToAddress(owner.row + 1, owner.col), coordToAddress(owner.row + Math.max(oldAxisDepth, axes.length, 1), lastCol));
      clearMergeInRange(next, coordToAddress(owner.row, owner.col), coordToAddress(owner.row + Math.max(oldAxisDepth, axes.length, 1), lastCol));

      setCell(next, owner.address, {
        ...owner.cell,
        merge: measureSpan > 1 ? { rowSpan: 1, colSpan: measureSpan } : undefined,
        mergeOwner: undefined,
        groupFocus: coordToAddress(owner.row, lastCol),
      });
      for (let col = owner.col + 1; col <= lastCol; col += 1) {
        setCell(next, coordToAddress(owner.row, col), {
          mergeOwner: owner.address,
          groupId: owner.cell.groupId,
          groupLabel: owner.cell.groupLabel,
          groupAnchor: owner.address,
          groupFocus: coordToAddress(owner.row, lastCol),
          groupBindingCode: "INDICATOR_VALUE",
          groupAlignment: "column",
        });
      }

      const productAfter = (axisIndex: number) =>
        axisMembers.slice(axisIndex + 1).reduce((total, axis) => total * Math.max(axis.members.length, 1), 1);

      axisMembers.forEach((axis, axisIndex) => {
        const row = owner.row + axisIndex + 1;
        const span = productAfter(axisIndex);
        const cycle = span * Math.max(axis.members.length, 1);
        const groupAnchor = coordToAddress(row, owner.col);
        const groupFocus = coordToAddress(row, lastCol);
        for (let col = owner.col; col <= lastCol; col += cycle) {
          axis.members.forEach((member, memberIndex) => {
            const ownerCol = col + memberIndex * span;
            if (ownerCol > lastCol) return;
            const cellOwner = coordToAddress(row, ownerCol);
            const effectiveSpan = Math.min(span, lastCol - ownerCol + 1);
            setCell(next, cellOwner, {
              value: member.name,
              role: "HEADER",
              boundCode: member.member_code,
              align: "center",
              valign: "middle",
              frozen: true,
              merge: effectiveSpan > 1 ? { rowSpan: 1, colSpan: effectiveSpan } : undefined,
              groupId: `measure-local-${axis.code}-${owner.address}`,
              groupLabel: `${optionFor(axis.code).label} under ${owner.cell.value ?? "measure"}`,
              groupAnchor,
              groupFocus,
              groupBindingCode: axis.code,
              groupAlignment: "column",
            });
            for (let hiddenCol = ownerCol + 1; hiddenCol < ownerCol + effectiveSpan; hiddenCol += 1) {
              setCell(next, coordToAddress(row, hiddenCol), {
                mergeOwner: cellOwner,
                groupId: `measure-local-${axis.code}-${owner.address}`,
                groupLabel: `${optionFor(axis.code).label} under ${owner.cell.value ?? "measure"}`,
                groupAnchor,
                groupFocus,
                groupBindingCode: axis.code,
                groupAlignment: "column",
              });
            }
          });
        }
      });

      if (rowAxes.length) {
        const dataStartRow = owner.row + headerDepth + 1;
        const headerRowSpan = headerDepth + 1;
        const rowAxisMembers = rowAxes.map((axisCode) => ({
          code: axisCode,
          members: getMembersForObject(axisCode, geographyScope),
        }));
        const rowCombinations = cartesianProduct(rowAxisMembers.map((axis) => axis.members));
        const lastRowAxisRow = dataStartRow + Math.max(rowCombinations.length - 1, 0);

        clearCellsInRange(next, coordToAddress(owner.row, 1), coordToAddress(lastRowAxisRow, rowAxes.length));
        clearMergeInRange(next, coordToAddress(owner.row, 1), coordToAddress(lastRowAxisRow, rowAxes.length));

        rowAxes.forEach((axisCode, axisIndex) => {
          const col = axisIndex + 1;
          const axisHeader = coordToAddress(owner.row, col);
          const groupFocus = coordToAddress(lastRowAxisRow, col);
          setCell(next, axisHeader, {
            value: axisCode === "GEOGRAPHY" ? getCurrentAxisHeaderLabel("GEOGRAPHY") : optionFor(axisCode).label,
            role: "HEADER",
            boundCode: axisCode,
            align: "center",
            valign: "middle",
            frozen: true,
            merge: { rowSpan: headerRowSpan, colSpan: 1 },
            groupId: `axis-${axisCode}-row`,
            groupLabel: `${optionFor(axisCode).label} rows`,
            groupAnchor: axisHeader,
            groupFocus,
            groupBindingCode: axisCode,
            groupAlignment: "row",
          });
          for (let row = owner.row + 1; row < dataStartRow; row += 1) {
            setCell(next, coordToAddress(row, col), {
              mergeOwner: axisHeader,
              groupId: `axis-${axisCode}-row`,
              groupLabel: `${optionFor(axisCode).label} rows`,
              groupAnchor: axisHeader,
              groupFocus,
              groupBindingCode: axisCode,
              groupAlignment: "row",
            });
          }
        });

        rowCombinations.forEach((combination, rowIndex) => {
          combination.forEach((member, axisIndex) => {
            const axisCode = rowAxisMembers[axisIndex]?.code ?? "GEOGRAPHY";
            const address = coordToAddress(dataStartRow + rowIndex, axisIndex + 1);
            setCell(next, address, {
              value: member.name,
              role: "DIMENSION_MEMBER",
              boundCode: member.member_code,
              align: "left",
              valign: "middle",
              groupId: `axis-${axisCode}-row`,
              groupLabel: `${optionFor(axisCode).label} rows`,
              groupAnchor: coordToAddress(owner.row, axisIndex + 1),
              groupFocus: coordToAddress(lastRowAxisRow, axisIndex + 1),
              groupBindingCode: axisCode,
              groupAlignment: "row",
            });
          });
        });
      }

      return next;
    });

    setVisibleColumnCount((current) => Math.min(canvasColumns.length, Math.max(initialVisibleColumnCount, current + expansionDelta - shrinkDelta, lastCol + 1)));
    setVisibleRowCount((current) => {
      const generatedRows = rowAxes.length
        ? cartesianProduct(rowAxes.map((axisCode) => getMembersForObject(axisCode, geographyScope))).length
        : 0;
      return Math.min(canvasRows.length, Math.max(current, owner.row + headerDepth + Math.max(generatedRows, 8) + 1));
    });

    return { lastCol, localGroupFocus, measureSpan };
  };

  const bindColumnDimensionInsideStrictMeasure = (code: BindingObjectCode) => {
    const owner = findStrictMeasureOwnerForSelection();
    if (!owner) return false;

    const axes = getLocalMeasureColumnAxes(owner, code);
    const { localGroupFocus, measureSpan } = applyStrictMeasureLocalAxes(owner, axes);
    recordBinding(code, `${coordToAddress(owner.row + 1, owner.col)}:${localGroupFocus}`, "column");
    setDesignerStage("binding");
    setActivityMessage(`${optionFor(code).label} bound under ${owner.cell.value ?? "the selected measure"}. The measure header now spans ${measureSpan} generated column(s).`);
    addOperation("Bind local axis", `${optionFor(code).label} generated under measure at ${owner.address}.`);
    return true;
  };

  const bindSelectedObject = (alignmentOverride: AxisAlignment = axisAlignment) => {
    const option = optionFor(bindingObject);
    const effectiveAlignment =
      headerType === "Dimension" && bindingObject === "GEOGRAPHY" && isHierarchyGeographyScope(geographyScope)
        ? "row"
        : alignmentOverride;
    const range = selectedRange;
    pushUndo();

    if (headerType === "Dimension" && effectiveAlignment === "column" && boundMeasureCodes.length) {
      if (bindColumnDimensionInsideStrictMeasure(bindingObject)) {
        return;
      }
    }

    if (headerType === "Dimension") {
      rebuildDimensionAxis(bindingObject, effectiveAlignment, false);
      setActivityMessage(`${option.label} bound as ${effectiveAlignment} axis. Existing headers were regenerated to match the template structure.`);
      addOperation("Bind axis", `${option.label} generated as ${effectiveAlignment} axis.`);
      return;
    }

    if (headerType === "Measure") {
      if (boundMeasureCodes.includes(selectedMeasure.code)) {
        setActivityMessage(`${selectedMeasure.code} is already bound. Unbind that measure before adding it again.`);
        return;
      }

      const { start, end } = normalizeRange(selectedAnchor, selectedFocus);
      const owner = coordToAddress(start.row, start.col);
      const rowSpan = end.row - start.row + 1;
      const colSpan = end.col - start.col + 1;
      const groupId = `measure-${selectedMeasure.code}-${Date.now()}`;
      const groupFocus = coordToAddress(end.row, end.col);

      setCells((current) => {
        const next = { ...current };
        clearMergeInRange(next, selectedAnchor, selectedFocus);
        rangeAddresses(selectedAnchor, selectedFocus).forEach((address) => {
          if (address !== owner) {
            setCell(next, address, {
              mergeOwner: owner,
              groupId,
              groupLabel: `${selectedMeasure.label} measure header`,
              groupAnchor: owner,
              groupFocus,
              groupBindingCode: "INDICATOR_VALUE",
              groupAlignment: "column",
            });
          }
        });
        setCell(next, owner, {
          value: `${headerLabel || selectedMeasure.label}\n[${selectedMeasure.unitCode}]`,
          role: "MEASURE",
          boundCode: selectedMeasure.code,
          align: "center",
          valign: "middle",
          frozen: true,
          merge: rowSpan > 1 || colSpan > 1 ? { rowSpan, colSpan } : undefined,
          groupId,
          groupLabel: `${selectedMeasure.label} measure header`,
          groupAnchor: owner,
          groupFocus,
          groupBindingCode: "INDICATOR_VALUE",
          groupAlignment: "column",
        });
        return next;
      });

      const nextBoundMeasures = [...boundMeasureCodes, selectedMeasure.code];
      setBoundMeasureCodes(nextBoundMeasures);
      setBoundObjects((current) => {
        const measureBinding: BoundObject = {
          code: "INDICATOR_VALUE",
          label: "Measures",
          type: "Measure",
          alignment: "column",
          range: nextBoundMeasures.join(", "),
          memberCount: nextBoundMeasures.length,
        };
        return [...current.filter((item) => item.code !== "INDICATOR_VALUE"), measureBinding];
      });

      const nextAvailable = measureBindingOptions.find((measure) => !nextBoundMeasures.includes(measure.code));
      if (nextAvailable) {
        setSelectedMeasureCode(nextAvailable.code);
        setHeaderLabel(nextAvailable.label);
        setDatatype(nextAvailable.valueType);
        setDecimalPlaces(nextAvailable.decimalPlaces);
        setValidationRule(nextAvailable.validationRule);
      }

      setDesignerStage("binding");
      setActivityMessage(`${selectedMeasure.label} bound as a measure header. It is hidden from the measure dropdown until unbound.`);
      addOperation("Bind measure", `${selectedMeasure.code} added at ${range}.`);
      return;
    }

    if (bindingObject === "INDICATOR_VALUE" && (rowAxes.length || columnAxes.length)) {
      const nextCells = buildStructuredGrid(rowAxes, columnAxes, true);
      setCells(nextCells);
      setBoundObjects(objectsFromAxes(rowAxes, columnAxes, true));
      setDesignerStage("binding");
      setActivityMessage("Editable measure cells generated across the current row and column axes.");
      addOperation("Bind measure", "Indicator value cells generated across the current template grid.");
      return;
    }

    setCells((current) => {
      const next = { ...current };

      if (bindingObject === "NIF_1_2_1") {
        const { start, end } = normalizeRange(selectedAnchor, selectedFocus);
        const owner = coordToAddress(start.row, start.col);
        const rowSpan = end.row - start.row + 1;
        const colSpan = end.col - start.col + 1;
        const groupId = `indicator-${Date.now()}`;
        clearMergeInRange(next, selectedAnchor, selectedFocus);
        setCell(next, coordToAddress(start.row, start.col), {
          value: "Indicator Code: NIF_1_2_1 | Name: Population below poverty line | Measure: Percent | Source: SSD_DEMO_SOURCE | Unit: PERCENT | Periodicity: ANNUAL",
          role: "INDICATOR",
          boundCode: "NIF_1_2_1",
          frozen: true,
          align: "left",
          merge: rowSpan > 1 || colSpan > 1 ? { rowSpan, colSpan } : undefined,
          groupId,
          groupLabel: "Indicator context",
          groupAnchor: owner,
          groupFocus: coordToAddress(end.row, end.col),
          groupBindingCode: "NIF_1_2_1",
          groupAlignment: "context",
        });
        rangeAddresses(selectedAnchor, selectedFocus).forEach((address) => {
          if (address !== owner) {
            setCell(next, address, {
              mergeOwner: owner,
              groupId,
              groupLabel: "Indicator context",
              groupAnchor: owner,
              groupFocus: coordToAddress(end.row, end.col),
              groupBindingCode: "NIF_1_2_1",
              groupAlignment: "context",
            });
          }
        });
      } else if (bindingObject === "INDICATOR_VALUE") {
        rangeAddresses(selectedAnchor, selectedFocus).forEach((address) => {
          setCell(next, address, {
            value: "",
            role: "INPUT",
            boundCode: "INDICATOR_VALUE",
            editable: true,
            required,
            datatype,
            validationRule,
            align: horizontalAlign,
            valign: verticalAlign,
            groupBindingCode: "INDICATOR_VALUE",
            groupAlignment: "context",
          });
        });
      } else if (effectiveAlignment === "row") {
        bindRowDimension(next, bindingObject);
      } else {
        bindColumnDimension(next, bindingObject);
      }

      return next;
    });

    const alignment = option.defaultAlignment === "context" ? "context" : effectiveAlignment;
    recordBinding(bindingObject, range, alignment);
    setDesignerStage("binding");
    setActivityMessage(`${option.label} bound into ${range}. Continue selecting ranges to build the exact template you want.`);
    addOperation("Bind values", `${option.label} written into canvas range ${range}.`);
  };

  const handleBind = () => bindSelectedObject();

  const handleGeographyScopeChange = (value: GeographyScope) => {
    setGeographyScope(value);
    if (isHierarchyGeographyScope(value)) {
      setAxisAlignment("row");
    }
    if (!rowAxes.includes("GEOGRAPHY") && !columnAxes.includes("GEOGRAPHY")) {
      return;
    }

    pushUndo();
    const includeMeasure = boundObjects.some((item) => item.code === "INDICATOR_VALUE") && boundMeasureCodes.length === 0;
    const nextCells = preserveStrictMeasureHeaders(buildStructuredGrid(rowAxes, columnAxes, includeMeasure, value));
    setCells(nextCells);
    setBoundObjects(withStrictMeasureBoundObject(objectsFromAxes(rowAxes, columnAxes, includeMeasure, value)));
    setDesignerStage("binding");
    setActivityMessage("Geography scope changed and the canvas was regenerated with the selected national/state/district layout.");
    addOperation("Geography scope", "Rebuilt geography rows/columns for the selected scope.");
  };

  const handleAxisAlignmentChange = (value: AxisAlignment) => {
    setAxisAlignment(value);
    if (optionsOpen && headerType === "Dimension" && (rowAxes.includes(bindingObject) || columnAxes.includes(bindingObject))) {
      rebuildDimensionAxis(bindingObject, value);
      return;
    }
    if (optionsOpen && headerType === "Dimension") {
      setActivityMessage(`${optionFor(bindingObject).label} alignment set to ${value}. Click Bind values to place it on the canvas.`);
    }
  };

  const handleSelectedMeasureCodeChange = (value: MeasureCode) => {
    const measure = measureBindingOptions.find((item) => item.code === value) ?? measureBindingOptions[0];
    setSelectedMeasureCode(value);
    setHeaderLabel(measure.label);
    setDatatype(measure.valueType);
    setDecimalPlaces(measure.decimalPlaces);
    setValidationRule(measure.validationRule);
    setActivityMessage(`${measure.label} selected. Click Bind values to place it as a measure header.`);
  };

  const handleMerge = () => {
    pushUndo();
    mergeRangeInState(selectedAnchor, selectedFocus);
    addOperation("Merge", `${selectedRange} merged visually.`);
  };

  const handleUnmerge = () => {
    pushUndo();
    setCells((current) => {
      const next = { ...current };
      const addresses = rangeAddresses(selectedAnchor, selectedFocus);
      addresses.forEach((address) => {
        const owner = next[address]?.mergeOwner ?? address;
        const ownerCell = next[owner];
        if (ownerCell?.merge) {
          const ownerCoord = addressToCoord(owner);
          for (let row = ownerCoord.row; row < ownerCoord.row + ownerCell.merge.rowSpan; row += 1) {
            for (let col = ownerCoord.col; col < ownerCoord.col + ownerCell.merge.colSpan; col += 1) {
              const mergeAddress = coordToAddress(row, col);
              next[mergeAddress] = { ...(next[mergeAddress] ?? {}), merge: undefined, mergeOwner: undefined };
            }
          }
        }
        next[address] = { ...(next[address] ?? {}), merge: undefined, mergeOwner: undefined };
      });
      return next;
    });
    addOperation("Unmerge", `${selectedRange} unmerged visually.`);
  };

  const handleFreeze = () => {
    const addresses = rangeAddresses(selectedAnchor, selectedFocus);
    const shouldFreeze = !addresses.every((address) => cells[address]?.frozen);
    pushUndo();
    applyToSelectedRange({ frozen: shouldFreeze });
    addOperation("Freeze", `${selectedRange} ${shouldFreeze ? "marked as" : "removed from"} frozen visual area.`);
    setActivityMessage(
      shouldFreeze
        ? `${selectedRange} will stay visible in the rendered template when that region is used as a row/column header.`
        : `${selectedRange} freeze marker removed.`,
    );
  };

  const handleMarkEditable = () => {
    const addresses = rangeAddresses(selectedAnchor, selectedFocus);
    const shouldEnableEditable = !addresses.every((address) => cells[address]?.editable);
    pushUndo();
    if (shouldEnableEditable) {
      applyToSelectedRange({
        role: "INPUT",
        editable: true,
        required,
        datatype,
        validationRule,
        align: horizontalAlign,
        valign: verticalAlign,
      });
      addOperation("Editable cells", `${selectedRange} marked editable with ${datatype} datatype.`);
      setActivityMessage(`${selectedRange} is now a data-entry range. Department users can enter values here.`);
      return;
    }

    applyToSelectedRange({ editable: false });
    addOperation("Editable cells", `${selectedRange} removed from editable data-entry range.`);
    setActivityMessage(`${selectedRange} is now read-only in the rendered template.`);
  };

  const handleCombineMeasureBelowDimension = () => {
    if (boundMeasureCodes.length && !columnAxes.includes("INDICATOR_VALUE")) {
      const selectedOwner =
        findStrictMeasureOwnerForSelection() ??
        Object.entries(cells).reduce<ReturnType<typeof findStrictMeasureOwnerForSelection>>((firstOwner, [address, cell]) => {
          if (firstOwner || !isStrictMeasureHeaderCell(cell) || cell.mergeOwner) return firstOwner;
          const coord = addressToCoord(address);
          return {
            address,
            cell,
            row: coord.row,
            col: coord.col,
            endCol: coord.col + Math.max(cell.merge?.colSpan ?? 1, 1) - 1,
          };
        }, undefined);

      if (!selectedOwner) {
        setActivityMessage("Bind a measure header first, then bind a dimension below it before combining.");
        return;
      }

      pushUndo();
      const nextCombine = !combineMeasureBelowDimension;
      setCombineMeasureBelowDimension(nextCombine);
      const measureText = (selectedOwner.cell.value ?? "Measure").replace(/\n/g, " ");
      setCells((current) => {
        const next = { ...current };
        const localHeaderRows = Object.entries(current)
          .filter(([, cell]) => cell.groupId?.startsWith("measure-local-") && !cell.mergeOwner)
          .map(([address]) => addressToCoord(address))
          .filter((coord) => coord.row > selectedOwner.row && coord.col >= selectedOwner.col && coord.col <= selectedOwner.endCol)
          .map((coord) => coord.row);
        const deepestHeaderRow = Math.max(...localHeaderRows, selectedOwner.row + 1);
        Object.entries(current).forEach(([address, cell]) => {
          if (!cell.groupId?.startsWith("measure-local-") || cell.mergeOwner) return;
          const coord = addressToCoord(address);
          if (coord.row <= selectedOwner.row || coord.col < selectedOwner.col || coord.col > selectedOwner.endCol) return;
          if (coord.row !== deepestHeaderRow) return;
          const baseValue = (cell.value ?? "").split("\nMeasure:")[0];
          setCell(next, address, {
            ...cell,
            value: nextCombine ? `${baseValue}\nMeasure: ${measureText}` : baseValue,
            valign: "middle",
          });
        });
        return next;
      });
      addOperation(
        "Combine headers",
        nextCombine
          ? `Measure text stacked below local dimension headers for ${measureText}.`
          : `Measure text removed from local dimension headers for ${measureText}.`,
      );
      setActivityMessage(
        nextCombine
          ? "Combined view enabled for the selected strict measure group. Dimension headers show the measure/unit below them."
          : "Combined view disabled for the selected strict measure group.",
      );
      return;
    }

    if (!columnAxes.includes("INDICATOR_VALUE") || columnAxes.indexOf("INDICATOR_VALUE") === 0) {
      setActivityMessage("Bind at least one column dimension first, then bind Measure as a column before combining.");
      return;
    }

    pushUndo();
    const nextCombine = !combineMeasureBelowDimension;
    setCombineMeasureBelowDimension(nextCombine);
    const nextCells = preserveStrictMeasureHeaders(buildStructuredGrid(
      rowAxes,
      columnAxes,
      boundObjects.some((item) => item.code === "INDICATOR_VALUE") && boundMeasureCodes.length === 0,
      geographyScope,
      nextCombine,
    ));
    setCells(nextCells);
    addOperation(
      "Combine headers",
      nextCombine
        ? "Measure labels are stacked below the nearest dimension header."
        : "Measure labels returned to a separate header row.",
    );
    setActivityMessage(
      nextCombine
        ? "Combined view enabled: dimension label appears above measure/unit, while JSON keeps dimension and measure codes separate."
        : "Combined view disabled: measure returns to its own header row.",
    );
  };

  const handleUnbindGroup = () => {
    if (bindingObject === "NIF_1_2_1") {
      setActivityMessage("Indicator context row is required for this template and cannot be unbound.");
      return;
    }

    const selectedSelection = getSelectableRangeForAddress(selectedAnchor);
    const selectedOwnerAddress = cells[selectedSelection.anchor]?.mergeOwner ?? selectedSelection.anchor;
    const selectedOwnerCell = cells[selectedOwnerAddress] ?? cells[selectedSelection.anchor];
    const strictMeasureOwner = findStrictMeasureOwnerForSelection();
    const isLocalMeasureDimension =
      selectedOwnerCell?.groupId?.startsWith("measure-local-") &&
      bindingObject !== "INDICATOR_VALUE";

    pushUndo();

    if (isLocalMeasureDimension && strictMeasureOwner) {
      const existingAxes = getAllLocalMeasureColumnAxes(strictMeasureOwner);
      const nextAxes = existingAxes.filter((axisCode) => axisCode !== bindingObject);
      const { measureSpan } = applyStrictMeasureLocalAxes(strictMeasureOwner, nextAxes);
      addOperation(
        "Unbind local axis",
        `${optionFor(bindingObject).label} removed from ${strictMeasureOwner.cell.value ?? "selected measure"} only.`,
      );
      setActivityMessage(
        `${optionFor(bindingObject).label} unbound only from the selected measure group. Other measure groups were preserved; the selected measure now spans ${measureSpan} column(s).`,
      );
      return;
    }

    if (bindingObject === "INDICATOR_VALUE" && !rowAxes.includes("INDICATOR_VALUE") && !columnAxes.includes("INDICATOR_VALUE")) {
      const selectedCellMeasureCode = measureBindingOptions.find((measure) => measure.code === selectedOwnerCell?.boundCode)?.code;
      const measureCodeToUnbind = selectedCellMeasureCode ?? selectedMeasureCode;
      const ownerForMeasure =
        strictMeasureOwner ??
        Object.entries(cells).reduce<StrictMeasureOwner | undefined>((foundOwner, [address, cell]) => {
          if (foundOwner || !isStrictMeasureHeaderCell(cell) || cell.mergeOwner || cell.boundCode !== measureCodeToUnbind) return foundOwner;
          const coord = addressToCoord(address);
          return {
            address,
            cell,
            row: coord.row,
            col: coord.col,
            endCol: coord.col + Math.max(cell.merge?.colSpan ?? 1, 1) - 1,
          };
        }, undefined);

      if (boundMeasureCodes.includes(measureCodeToUnbind) && ownerForMeasure) {
        const selectedMeasureToUnbind = measureBindingOptions.find((measure) => measure.code === measureCodeToUnbind) ?? selectedMeasure;
        const nextBoundMeasures = boundMeasureCodes.filter((measureCode) => measureCode !== measureCodeToUnbind);
        const removedWidth = ownerForMeasure.endCol - ownerForMeasure.col + 1;

        setCells((current) => {
          return removeColumnRangeFromRows(current, ownerForMeasure.col, ownerForMeasure.endCol, ownerForMeasure.row);
        });
        setVisibleColumnCount((current) => Math.max(initialVisibleColumnCount, current - removedWidth));
        setBoundMeasureCodes(nextBoundMeasures);
        setBoundObjects((current) => {
          const withoutMeasure = current.filter((item) => item.code !== "INDICATOR_VALUE");
          if (!nextBoundMeasures.length) return withoutMeasure;
          return [
            ...withoutMeasure,
            {
              code: "INDICATOR_VALUE",
              label: "Measures",
              type: "Measure",
              alignment: "column",
              range: nextBoundMeasures.join(", "),
              memberCount: nextBoundMeasures.length,
            },
          ];
        });
        setSelectedMeasureCode(selectedMeasureToUnbind.code);
        setHeaderLabel(selectedMeasureToUnbind.label);
        setDatatype(selectedMeasureToUnbind.valueType);
        setDecimalPlaces(selectedMeasureToUnbind.decimalPlaces);
        setValidationRule(selectedMeasureToUnbind.validationRule);
        setSelectedAnchor(coordToAddress(ownerForMeasure.row, Math.max(1, ownerForMeasure.col - 1)));
        setSelectedFocus(coordToAddress(ownerForMeasure.row, Math.max(1, ownerForMeasure.col - 1)));
        addOperation("Unbind measure", `${selectedMeasureToUnbind.code} and its local dimensions removed from ${selectedRange}.`);
        setActivityMessage(`${selectedMeasureToUnbind.label} unbound with its local Time/Area/Gender headers and returned to the measure dropdown.`);
        return;
      }

      const nextCells = buildStructuredGrid(rowAxes, columnAxes, false);
      setCells(nextCells);
      setBoundObjects(objectsFromAxes(rowAxes, columnAxes, false));
      addOperation("Unbind group", "Removed editable measure cells from the current grid.");
      setActivityMessage("Measure cells unbound. Axes remain in place.");
      return;
    }

    const nextRowAxes = rowAxes.filter((code) => code !== bindingObject);
    const nextColumnAxes = columnAxes.filter((code) => code !== bindingObject);
    const hasMeasure = boundObjects.some((item) => item.code === "INDICATOR_VALUE") && boundMeasureCodes.length === 0;
    const nextCells = preserveStrictMeasureHeaders(buildStructuredGrid(nextRowAxes, nextColumnAxes, hasMeasure));
    setRowAxes(nextRowAxes);
    setColumnAxes(nextColumnAxes);
    setCells(nextCells);
    setBoundObjects(withStrictMeasureBoundObject(objectsFromAxes(nextRowAxes, nextColumnAxes, hasMeasure)));
    if (!nextColumnAxes.includes("INDICATOR_VALUE")) setCombineMeasureBelowDimension(false);
    setSelectedAnchor("B2");
    setSelectedFocus("B2");
    setEditingCell(null);
    setCellText("");
    addOperation("Unbind group", `${optionFor(bindingObject).label} removed from row/column axes.`);
    setActivityMessage(`${optionFor(bindingObject).label} unbound from the template grid.`);
  };

  const handleResizeColumn = (column: string, width: number) => {
    setColumnWidths((current) => ({
      ...current,
      [column]: Math.min(260, Math.max(72, width)),
    }));
  };

  const handleResizeRow = (row: number, height: number) => {
    setRowHeights((current) => ({
      ...current,
      [row]: Math.min(96, Math.max(30, height)),
    }));
  };

  const handleHorizontalAlignChange = (value: HorizontalAlign) => {
    pushUndo();
    setHorizontalAlign(value);
    applyToSelectedRange({ align: value });
    addOperation("Horizontal align", `${selectedRange} aligned ${value}.`);
  };

  const handleVerticalAlignChange = (value: VerticalAlign) => {
    pushUndo();
    setVerticalAlign(value);
    applyToSelectedRange({ valign: value });
    addOperation("Vertical align", `${selectedRange} aligned ${value}.`);
  };

  const handleHeaderContextMenu = (type: "column" | "row", target: string | number, event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setGridContextMenu({ type, target, x: event.clientX, y: event.clientY });
  };

  const handleInsertColumnAfter = (column: string) => {
    pushUndo();
    const insertAfter = addressToCoord(`${column}1`).col;
    setCells((current) => {
      const next: Record<string, CanvasCell> = {};
      Object.entries(current).forEach(([address, cell]) => {
        const coord = addressToCoord(address);
        const nextAddress = coord.col > insertAfter ? coordToAddress(coord.row, coord.col + 1) : address;
        next[nextAddress] = cell;
      });
      return next;
    });
    setVisibleColumnCount((current) => Math.min(canvasColumns.length, current + 1));
    setGridContextMenu(null);
    addOperation("Insert column", `Inserted a column after ${column}.`);
  };

  const handleInsertRowBelow = (row: number) => {
    pushUndo();
    setCells((current) => {
      const next: Record<string, CanvasCell> = {};
      Object.entries(current).forEach(([address, cell]) => {
        const coord = addressToCoord(address);
        const nextAddress = coord.row > row ? coordToAddress(coord.row + 1, coord.col) : address;
        next[nextAddress] = cell;
      });
      return next;
    });
    setVisibleRowCount((current) => Math.min(canvasRows.length, current + 1));
    setGridContextMenu(null);
    addOperation("Insert row", `Inserted a row below ${row}.`);
  };

  const handleAutoBuild = () => {
    pushUndo();
    const next: Record<string, CanvasCell> = buildHeaderCells(selectedTemplate);
    const set = (address: string, update: CanvasCell) => setCell(next, address, update);
    const locationGroup = { groupId: "autobuild-location", groupLabel: "Geography rows", groupAnchor: "A2", groupFocus: "A8", groupBindingCode: "GEOGRAPHY" as BindingObjectCode, groupAlignment: "row" as const };
    const timeGroup = { groupId: "autobuild-time", groupLabel: "Time period columns", groupAnchor: "B2", groupFocus: "M2", groupBindingCode: "TIME_PERIOD" as BindingObjectCode, groupAlignment: "column" as const };
    const areaGroup = { groupId: "autobuild-area", groupLabel: "Area type columns", groupAnchor: "B3", groupFocus: "M3", groupBindingCode: "AREA_TYPE" as BindingObjectCode, groupAlignment: "column" as const };
    const genderGroup = { groupId: "autobuild-gender", groupLabel: "Gender columns", groupAnchor: "B4", groupFocus: "M4", groupBindingCode: "GENDER" as BindingObjectCode, groupAlignment: "column" as const };
    const measureGroup = { groupId: "autobuild-measure", groupLabel: "Indicator value cells", groupAnchor: "B5", groupFocus: "M8", groupBindingCode: "INDICATOR_VALUE" as BindingObjectCode, groupAlignment: "context" as const };

    set("A2", {
      value: "Location",
      role: "HEADER",
      boundCode: "GEOGRAPHY",
      merge: { rowSpan: 3, colSpan: 1 },
      align: "center",
      ...locationGroup,
    });
    set("A3", { mergeOwner: "A2", merge: undefined, ...locationGroup });
    set("A4", { mergeOwner: "A2", merge: undefined, ...locationGroup });

    set("B2", { value: "2011-12", role: "HEADER", boundCode: "TIME_2011_12", merge: { rowSpan: 1, colSpan: 6 }, align: "center", ...timeGroup });
    for (let col = 3; col <= 7; col += 1) set(coordToAddress(2, col), { mergeOwner: "B2", merge: undefined, ...timeGroup });
    set("H2", { value: "2012-13", role: "HEADER", boundCode: "TIME_2012_13", merge: { rowSpan: 1, colSpan: 6 }, align: "center", ...timeGroup });
    for (let col = 9; col <= 13; col += 1) set(coordToAddress(2, col), { mergeOwner: "H2", merge: undefined, ...timeGroup });

    const areaLabels = ["Total", "Rural", "Urban", "Total", "Rural", "Urban"];
    [2, 4, 6, 8, 10, 12].forEach((col, index) => {
      const owner = coordToAddress(3, col);
      set(owner, { value: areaLabels[index], role: "HEADER", boundCode: areaLabels[index].toUpperCase(), merge: { rowSpan: 1, colSpan: 2 }, align: "center", ...areaGroup });
      set(coordToAddress(3, col + 1), { mergeOwner: owner, merge: undefined, ...areaGroup });
    });

    const genderLabels = ["Female", "Male"];
    for (let col = 2; col <= 13; col += 1) {
      set(coordToAddress(4, col), {
        value: genderLabels[(col - 2) % 2],
        role: "HEADER",
        boundCode: genderLabels[(col - 2) % 2].toUpperCase(),
        align: "center",
        ...genderGroup,
      });
    }

    getMembersForObject("GEOGRAPHY").forEach((member, index) => {
      const row = index + 5;
      set(coordToAddress(row, 1), { value: member.name, role: "DIMENSION_MEMBER", boundCode: member.member_code, align: "left", ...locationGroup });
      for (let col = 2; col <= 13; col += 1) {
        set(coordToAddress(row, col), {
          value: "",
          role: "INPUT",
          boundCode: "INDICATOR_VALUE",
          editable: true,
          required: true,
          datatype: "NUMERIC",
          validationRule: "NUMERIC_NON_NEGATIVE",
          align: "center",
          ...measureGroup,
        });
      }
    });

    setCells(next);
    setRowAxes(["GEOGRAPHY"]);
    setColumnAxes(["TIME_PERIOD", "AREA_TYPE", "GENDER"]);
    setBoundMeasureCodes([]);
    setVisibleColumnCount(initialVisibleColumnCount);
    setVisibleRowCount(initialVisibleRowCount);
    setBoundObjects([
      { code: "NIF_1_2_1", label: optionFor("NIF_1_2_1").label, type: "Indicator", alignment: "context", range: "A1:M1", memberCount: 1 },
      { code: "GEOGRAPHY", label: optionFor("GEOGRAPHY").label, type: "Dimension", alignment: "row", range: "A2:A8", memberCount: generatedRows },
      { code: "TIME_PERIOD", label: optionFor("TIME_PERIOD").label, type: "Dimension", alignment: "column", range: "B2:M2", memberCount: 2 },
      { code: "AREA_TYPE", label: optionFor("AREA_TYPE").label, type: "Dimension", alignment: "column", range: "B3:M3", memberCount: 3 },
      { code: "GENDER", label: optionFor("GENDER").label, type: "Dimension", alignment: "column", range: "B4:M4", memberCount: 2 },
      { code: "INDICATOR_VALUE", label: optionFor("INDICATOR_VALUE").label, type: "Measure", alignment: "context", range: "B5:M8", memberCount: 1 },
    ]);
    setSelectedAnchor("B5");
    setSelectedFocus("M8");
    setEditingCell(null);
    setCellText("");
    setOptionsOpen(false);
    setDesignerStage("generated");
    setActivityMessage("Auto-built the reference template. You can still select ranges, merge/unmerge, and rebind values manually.");
    addOperation("Auto-build", "Generated Geography x Time x Area Type x Gender template using sample dimensions.");
  };

  const handleResetCanvas = () => {
    pushUndo();
    setCells(buildHeaderCells(selectedTemplate));
    setBoundObjects([]);
    setBoundMeasureCodes([]);
    setRowAxes([]);
    setColumnAxes([]);
    setCombineMeasureBelowDimension(false);
    setVisibleColumnCount(initialVisibleColumnCount);
    setVisibleRowCount(initialVisibleRowCount);
    setSelectedAnchor("B2");
    setSelectedFocus("B2");
    setEditingCell("B2");
    setCellText("");
    setDesignerStage("basics");
    setActivityMessage("Canvas reset. Indicator context row is frozen; continue binding rows, columns, and measure cells.");
    addOperation("Canvas reset", "Removed local bindings and kept frozen indicator context row.");
  };

  const handleCreateDraft = () => {
    const demoTemplate: TemplateDefinitionSample = {
      template_code: "TPL_NIF_1_2_1_LIVE_DEMO_DRAFT",
      template_type: "DATA_ENTRY",
      owning_unit_code: "SDG",
      status: "DRAFT",
      is_active: false,
      current_version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1",
      name: "Live demo NIF 1.2.1 template draft",
      description: "UI-only draft created from the modal to demonstrate the governed template design flow.",
      mapped_indicator_code: "NIF_1_2_1",
      mapped_indicator_number: "1.2.1",
      mapped_indicator_name: "Population below poverty line",
      mapped_global_indicator_code: "GIND_1_2_1",
      source_unit_code: "SSD_DEMO_SOURCE",
      version_count: 1,
      axis_count: 0,
      cell_count: 0,
      validation_rule_count: 3,
      updated_at: "UI demo session",
    };

    setTemplates((current) => {
      if (current.some((template) => template.template_code === demoTemplate.template_code)) return current;
      return [demoTemplate, ...current];
    });
    setSelectedTemplateCode(demoTemplate.template_code);
    setCells(buildHeaderCells(demoTemplate));
    setBoundObjects([]);
    setBoundMeasureCodes([]);
    setRowAxes([]);
    setColumnAxes([]);
    setCombineMeasureBelowDimension(false);
    setVisibleColumnCount(initialVisibleColumnCount);
    setVisibleRowCount(initialVisibleRowCount);
    setSelectedAnchor("B2");
    setSelectedFocus("B2");
    setEditingCell("B2");
    setCellText("");
    setActiveTab("designer");
    setActivityMessage("Draft created. The canvas is blank until you bind indicator, dimensions, and measure.");
    addOperation("Draft created", "Template basics selected: unit SDG, indicator NIF_1_2_1.");
    setModal(null);
  };

  const handleDeleteDraft = () => {
    if (selectedTemplate.status !== "DRAFT") {
      setActivityMessage("Only draft templates can be deleted in this UI demo.");
      setModal(null);
      return;
    }

    const fallback = templates.find((template) => template.template_code !== selectedTemplate.template_code) ?? templateDefinitions[0];
    setTemplates((current) => current.filter((template) => template.template_code !== selectedTemplate.template_code));
    setSelectedTemplateCode(fallback.template_code);
    setActivityMessage("Draft removed locally. No API or database mutation was executed.");
    addOperation("Draft deleted", `${selectedTemplate.template_code} removed from local UI state.`);
    setModal(null);
  };

  const handleSaveDesigner = () => {
    setDesignerStage("saved");
    setTemplates((current) =>
      current.map((template) =>
        template.template_code === selectedTemplate.template_code
          ? {
              ...template,
              axis_count: Math.max(template.axis_count, boundObjects.filter((item) => item.type === "Dimension").length),
              cell_count: Math.max(template.cell_count, generatedRows * generatedColumns),
              updated_at: "Saved in UI demo",
            }
          : template,
      ),
    );
    setActivityMessage("Template draft saved locally. Contract preview shows axes, measures, cells, render elements, and validation refs.");
    addOperation("Save draft", "Local UI state saved. No API call executed.");
  };

  const handlePublishTemplate = () => {
    setDesignerStage("published");
    setTemplates((current) =>
      current.map((template) =>
        template.template_code === selectedTemplate.template_code
          ? {
              ...template,
              status: "ACTIVE",
              is_active: true,
              axis_count: Math.max(template.axis_count, boundObjects.filter((item) => item.type === "Dimension").length),
              cell_count: Math.max(template.cell_count, generatedRows * generatedColumns),
              updated_at: "Published in UI demo",
            }
          : template,
      ),
    );
    setActivityMessage("Template marked ACTIVE locally. It is now ready to be assigned from Collection Request UI.");
    addOperation("Publish active", "Template status changed to ACTIVE in local UI state.");
  };

  const workflowSteps = [
    { code: "basics", label: "1 Basics", active: ["basics", "typing", "options", "binding", "generated", "saved", "published"].includes(designerStage) },
    { code: "type", label: "2 Type/search", active: ["typing", "options", "binding", "generated", "saved", "published"].includes(designerStage) },
    { code: "options", label: "3 Options", active: ["options", "binding", "generated", "saved", "published"].includes(designerStage) },
    { code: "bind", label: "4 Bind values", active: ["binding", "generated", "saved", "published"].includes(designerStage) },
    { code: "save", label: "5 Save/validate", active: ["saved", "published"].includes(designerStage) },
    { code: "publish", label: "6 Publish", active: designerStage === "published" },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        handleUndo();
      }
      if (key === "y") {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <AppShell persona="Unit Template Admin" activeDashboard="/dashboard/unit-admin">
      <section className="mx-auto flex max-w-[1280px] flex-col gap-4" aria-labelledby="templates-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="templates-title" className="text-2xl font-bold">Template List + Designer</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create a draft, edit the canvas, bind dimensions/measures, preview data entry, then publish.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setModal("data-entry-preview")}><Eye aria-hidden="true" className="size-4" /> Preview data entry</Button>
            <Button variant="outline" onClick={() => setActiveTab("contract")}><FileSpreadsheet aria-hidden="true" className="size-4" /> Contract</Button>
            <Button onClick={() => setModal("create-template")}><Plus aria-hidden="true" className="size-4" /> New template draft</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {statCards.map((card) => (
            <button key={card.label} type="button" className="min-h-[104px] rounded-md bg-card p-3 text-left shadow-sm ring-1 ring-border/60 hover:bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs font-semibold">{card.helper}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{card.detail}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Template workspace tabs">
            {[
              ["list", "Template list"],
              ["designer", "Designer in action"],
              ["contract", "Contract"],
            ].map(([code, label]) => (
              <button
                key={code}
                type="button"
                role="tab"
                aria-selected={activeTab === code}
                onClick={() => setActiveTab(code as TemplateTab)}
                className={[
                  "border-b-2 px-3 py-2 text-xs font-semibold",
                  activeTab === code ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <Badge variant={statusVariant(selectedTemplate.status)}>{selectedTemplate.status}</Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-950">
          <span className="font-semibold">{activityMessage}</span>
          <div className="flex flex-wrap gap-1">
            {workflowSteps.map((step) => (
              <Badge key={step.code} variant={step.active ? "default" : "outline"}>{step.label}</Badge>
            ))}
          </div>
        </div>

        {activeTab === "list" ? (
          <Card>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
                  <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="sr-only">Search templates</span>
                  <Input className="border-0 bg-transparent" placeholder="Search template, indicator, source" value={query} onChange={(event) => setQuery(event.target.value)} />
                </label>
                <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs font-semibold" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TemplateStatus | "ALL")}>
                  <option value="ALL">status: all</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>

              {templatesQuery.isFetching ? (
                <Loader variant="inline" label="Loading templates from API" className="text-xs text-muted-foreground" />
              ) : null}

              {templatesQuery.error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                  {apiErrorMessage(templatesQuery.error)}
                </div>
              ) : null}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Mapped indicator</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Cells</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.length ? filteredTemplates.map((template) => (
                    <TableRow key={template.template_code}>
                      <TableCell className="max-w-80 whitespace-normal">
                        <span className="block font-mono text-[11px]">{template.template_code}</span>
                        <span className="text-xs font-semibold">{template.name}</span>
                      </TableCell>
                      <TableCell className="max-w-72 whitespace-normal">
                        <span className="block font-mono text-[11px]">{template.mapped_indicator_code} / {template.mapped_global_indicator_code}</span>
                        <span className="text-xs">{template.mapped_indicator_name}</span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{template.current_version_code}</TableCell>
                      <TableCell>{template.cell_count}</TableCell>
                      <TableCell><Badge variant={statusVariant(template.status)}>{template.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon-xs" variant="outline" aria-label="View template" onClick={() => { setSelectedTemplateCode(template.template_code); setModal("template-detail"); }}><Eye aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Open designer" onClick={() => { setSelectedTemplateCode(template.template_code); setActiveTab("designer"); }}><Edit3 aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="destructive" aria-label="Delete draft" onClick={() => { setSelectedTemplateCode(template.template_code); setModal("delete-template"); }}><Trash2 aria-hidden="true" className="size-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No templates found for unit {templatesUnitCode}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "designer" ? (
          <div className={isDesignerFullPage ? "fixed inset-0 z-50 overflow-auto bg-background p-4" : ""}>
            {isDesignerFullPage ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Full page designer</p>
                  <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                </div>
                <Button type="button" variant="outline" onClick={() => setIsDesignerFullPage(false)}>
                  <Minimize2 aria-hidden="true" className="size-4" /> Exit full page
                </Button>
              </div>
            ) : null}
          <div className={optionsOpen ? "grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1" : "grid grid-cols-1 gap-4"}>
            <div className="grid gap-4">
              <Card>
                <CardContent className="grid gap-3">
                  <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
                    <Field label="Working unit" value={selectedTemplate.owning_unit_code} readOnly />
                    <Field label="Template code" value={selectedTemplate.template_code} readOnly />
                    <Field label="Indicator" value={`${selectedTemplate.mapped_indicator_code} / ${selectedTemplate.mapped_global_indicator_code}`} readOnly />
                    <Field label="Measure" value="INDICATOR_VALUE / PERCENT / NUMERIC" readOnly />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
                    <span className="font-semibold">
                      Click to edit a cell. Type to see suggestions. Click suggestion or double-click a cell to open options. Shift-click another cell to select a range.
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setOptionsOpen(true)}>Open options</Button>
                      <Button size="sm" variant="outline" onClick={handleResetCanvas}><RotateCcw aria-hidden="true" className="size-4" /> Reset to header</Button>
                      <Button size="sm" onClick={handleAutoBuild}><Wand2 aria-hidden="true" className="size-4" /> Auto-build reference</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>Excel-like template canvas</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">Selected range: {selectedRange}. Bind actions write directly into this canvas.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="icon-sm" variant="outline" onClick={handleUndo} disabled={!undoStack.length} aria-label="Undo">
                        <Undo2 aria-hidden="true" className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="outline" onClick={handleRedo} disabled={!redoStack.length} aria-label="Redo">
                        <Redo2 aria-hidden="true" className="size-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsDesignerFullPage((current) => !current)}>
                        {isDesignerFullPage ? <Minimize2 aria-hidden="true" className="size-4" /> : <Maximize2 aria-hidden="true" className="size-4" />}
                        {isDesignerFullPage ? "Exit full page" : "Full page"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setModal("json-structure")}>
                        <Code2 aria-hidden="true" className="size-4" /> JSON
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleSaveDesigner}><Save aria-hidden="true" className="size-4" /> Save draft</Button>
                      <Button size="sm" variant="outline" onClick={() => setModal("data-entry-preview")}><Eye aria-hidden="true" className="size-4" /> Preview</Button>
                      <Button size="sm" onClick={handlePublishTemplate}><CheckCircle2 aria-hidden="true" className="size-4" /> Publish active</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <CanvasTable
                    cells={cells}
                    selectedAnchor={selectedAnchor}
                    selectedFocus={selectedFocus}
                    editingCell={editingCell}
                    cellText={cellText}
                    optionsOpen={optionsOpen}
                    suggestions={suggestions}
                    columnWidths={columnWidths}
                    rowHeights={rowHeights}
                    columns={visibleColumns}
                    rows={visibleRows}
                    onCellClick={handleSelectCell}
                    onSelectAddress={handleSelectAddress}
                    onCellDoubleClick={handleDoubleClick}
                    onCellTextChange={handleCellTextChange}
                    onStartEdit={handleStartEdit}
                    onStopEdit={handleStopEdit}
                    onNavigateCell={handleNavigateCell}
                    onSuggestionClick={handleSuggestionClick}
                    onResizeColumn={handleResizeColumn}
                    onResizeRow={handleResizeRow}
                    onHeaderContextMenu={handleHeaderContextMenu}
                  />
                  <div className="grid grid-cols-3 gap-3 text-xs max-lg:grid-cols-1">
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="font-bold">Manual path</p>
                      <p className="mt-1 text-muted-foreground">Type/select object, choose options, bind values. Repeat for your own layout.</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="font-bold">Generated cells</p>
                      <p className="mt-1 text-muted-foreground">{generatedRows} geography rows x {generatedColumns} generated columns = {generatedRows * generatedColumns} editable measure cells.</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="font-bold">Saved contract</p>
                      <p className="mt-1 text-muted-foreground">The UI saves axes, axis members, measures, cells, cell-axis bindings, render elements, and validation refs.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {optionsOpen ? (
              <BindingPanel
                selectedCell={selectedFocus}
                selectedRange={selectedRange}
                cellText={cellText}
                headerType={headerType}
                bindingObject={bindingObject}
                axisAlignment={axisAlignment}
                geographyScope={geographyScope}
                showHeader={showHeader}
                headerLabel={headerLabel}
                datatype={datatype}
                required={required}
                decimalPlaces={decimalPlaces}
                validationRule={validationRule}
                selectedMeasureCode={selectedMeasureCode}
                rollupEntryMode={rollupEntryMode}
                aggregationMethod={aggregationMethod}
                horizontalAlign={horizontalAlign}
                verticalAlign={verticalAlign}
                suggestions={suggestions}
                boundObjects={boundObjects}
                boundMeasureCodes={boundMeasureCodes}
                operations={operations}
                onCellTextChange={handleCellTextChange}
                onHeaderTypeChange={handleHeaderTypeChange}
                onBindingObjectChange={handleBindingObjectChange}
                onAxisAlignmentChange={handleAxisAlignmentChange}
                onGeographyScopeChange={handleGeographyScopeChange}
                onShowHeaderChange={setShowHeader}
                onHeaderLabelChange={handleHeaderLabelChange}
                onDatatypeChange={setDatatype}
                onRequiredChange={setRequired}
                onDecimalPlacesChange={setDecimalPlaces}
                onValidationRuleChange={setValidationRule}
                onSelectedMeasureCodeChange={handleSelectedMeasureCodeChange}
                onRollupEntryModeChange={setRollupEntryMode}
                onAggregationMethodChange={setAggregationMethod}
                onHorizontalAlignChange={handleHorizontalAlignChange}
                onVerticalAlignChange={handleVerticalAlignChange}
                onViewValues={() => setModal("view-values")}
                onBind={handleBind}
                onMerge={handleMerge}
                onUnmerge={handleUnmerge}
                onFreeze={handleFreeze}
                onMarkEditable={handleMarkEditable}
                onCombineMeasureBelowDimension={handleCombineMeasureBelowDimension}
                onUnbindGroup={handleUnbindGroup}
                onClose={() => setOptionsOpen(false)}
              />
            ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "contract" ? (
          <Card>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-sm font-bold">Version</p>
                  <p className="mt-1 font-mono text-[11px]">{selectedVersion.version_code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedVersion.title}</p>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-sm font-bold">Mapped indicator</p>
                  <p className="mt-1 font-mono text-[11px]">{selectedTemplate.mapped_indicator_code} / {selectedTemplate.mapped_global_indicator_code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedTemplate.mapped_indicator_name}</p>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-sm font-bold">Live generated contract</p>
                  <p className="mt-1 text-xs text-muted-foreground">{boundObjects.length} bound objects / {generatedRows * generatedColumns} generated cells.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Axis/Object</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Range</TableHead>
                      <TableHead>Members</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(boundObjects.length ? boundObjects : axesForVersion.map((axis) => ({
                      code: axis.axis_code as BindingObjectCode,
                      label: axis.axis_code,
                      type: "Dimension" as HeaderType,
                      alignment: axis.axis_role === "ROW" ? "row" as const : "column" as const,
                      range: axis.axis_role,
                      memberCount: axis.axis_depth,
                    }))).map((axis) => (
                      <TableRow key={axis.code}>
                        <TableCell className="font-mono text-[11px]">{axis.label}</TableCell>
                        <TableCell>{axis.alignment}</TableCell>
                        <TableCell>{axis.range}</TableCell>
                        <TableCell>{axis.memberCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Measure/Cell</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {measuresForVersion.map((measure) => (
                      <TableRow key={measure.measure_code}>
                        <TableCell className="font-mono text-[11px]">{measure.measure_code}</TableCell>
                        <TableCell>{measure.value_type}</TableCell>
                        <TableCell>{measure.unit_code}</TableCell>
                        <TableCell>{measure.is_required ? "YES" : "NO"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-mono text-[11px]">GENERATED_INPUT_CELLS</TableCell>
                      <TableCell>NUMERIC</TableCell>
                      <TableCell>PERCENT</TableCell>
                      <TableCell>{generatedRows * generatedColumns}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract table</TableHead>
                    <TableHead>What this designer creates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["templates.template_axes", "GEOGRAPHY row axis; TIME_PERIOD, AREA_TYPE, GENDER column axes; indicator context axis."],
                    ["templates.template_axis_members", "Selected geography states, time periods, area type members, and gender members."],
                    ["templates.template_measures", "INDICATOR_VALUE numeric percent measure."],
                    ["templates.template_cells", `${generatedRows * generatedColumns} editable required cells for NIF_1_2_1_V1.`],
                    ["templates.template_cell_axis_members", "Each generated cell is linked to geography, time, area type, and gender members."],
                    ["templates.template_render_elements", "Merged title, time headers, area headers, gender headers, row labels, and input cells."],
                    ["templates.template_validation_rule_refs", "Required, non-negative numeric, and two-decimal validation references."],
                  ].map(([table, purpose]) => (
                    <TableRow key={table}>
                      <TableCell className="font-mono text-[11px]">{table}</TableCell>
                      <TableCell>{purpose}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}
      </section>

      {gridContextMenu ? (
        <div
          className="fixed z-50 w-48 rounded-md border border-border bg-card p-1 text-xs shadow-xl"
          style={{ left: gridContextMenu.x, top: gridContextMenu.y }}
          role="menu"
        >
          {gridContextMenu.type === "column" ? (
            <button
              type="button"
              className="w-full rounded px-3 py-2 text-left font-semibold hover:bg-muted"
              onClick={() => handleInsertColumnAfter(String(gridContextMenu.target))}
            >
              Insert column after {String(gridContextMenu.target)}
            </button>
          ) : (
            <button
              type="button"
              className="w-full rounded px-3 py-2 text-left font-semibold hover:bg-muted"
              onClick={() => handleInsertRowBelow(Number(gridContextMenu.target))}
            >
              Insert row below {String(gridContextMenu.target)}
            </button>
          )}
          <button
            type="button"
            className="w-full rounded px-3 py-2 text-left text-muted-foreground hover:bg-muted"
            onClick={() => setGridContextMenu(null)}
          >
            Close
          </button>
        </div>
      ) : null}

      <TemplateModalView
        modal={modal}
        selectedTemplate={selectedTemplate}
        bindingObject={bindingObject}
        geographyScope={geographyScope}
        generatedColumnCount={generatedColumns}
        generatedRowCount={generatedRows}
        cells={cells}
        templateJson={templateJson}
        onCreateDraft={handleCreateDraft}
        onDeleteDraft={handleDeleteDraft}
        onBind={handleBind}
        onClose={() => setModal(null)}
      />
    </AppShell>
  );
}
