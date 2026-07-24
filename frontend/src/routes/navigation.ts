import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Database,
  FileCheck,
  FileText,
  Gauge,
  GitBranch,
  Globe2,
  Inbox,
  KeyRound,
  Languages,
  Layers3,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Mail,
  Newspaper,
  Send,
  Settings,
  ShieldCheck,
  TableProperties,
  UploadCloud,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export type NavModule = {
  label: string;
  basePath: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const navigationModules: NavModule[] = [
  {
    label: "Dashboard",
    basePath: "/dashboard",
    icon: LayoutDashboard,
    items: [
      { label: "Overview", path: "/", icon: LayoutDashboard },
      { label: "Unit Dashboard", path: "/dashboard/unit", icon: Gauge },
    ],
  },
  {
    label: "Authentication",
    basePath: "/authentication",
    icon: ShieldCheck,
    items: [
      { label: "Access Catalog", path: "/authentication/access-catalog", icon: KeyRound },
      { label: "Permission Matrix", path: "/authentication/permission-matrix", icon: ShieldCheck },
      { label: "Users", path: "/authentication/users", icon: Users },
      { label: "Units", path: "/authentication/units", icon: Building2 },
      { label: "Review Workflow", path: "/authentication/review-workflow", icon: ClipboardCheck },
      { label: "Audit & Sessions", path: "/authentication/audit-sessions", icon: TableProperties },
    ],
  },
  {
    label: "Framework",
    basePath: "/framework",
    icon: GitBranch,
    items: [{ label: "Framework", path: "/framework", icon: GitBranch }],
  },
  {
    label: "Masters",
    basePath: "/masters",
    icon: Database,
    items: [
      { label: "Locales", path: "/masters/locales", icon: Languages },
      { label: "Periodicities", path: "/masters/periodicities", icon: ListChecks },
      { label: "Unit of Measurement (UOM)", path: "/masters/uom", icon: TableProperties },
      { label: "Sources / Ministries", path: "/masters/units", icon: Building2 },
      { label: "Officers", path: "/masters/officers", icon: Users },
    ],
  },
  {
    label: "Indicator Management",
    basePath: "/indicators",
    icon: ListChecks,
    items: [
      { label: "Indicator Library", path: "/indicators/library", icon: ListChecks },
      { label: "Global Indicators", path: "/indicators/global", icon: Globe2 },
    ],
  },
  {
    label: "Dimensions",
    basePath: "/dimensions",
    icon: Layers3,
    items: [
      { label: "Dimension Library", path: "/dimensions/library", icon: Layers3 },
      { label: "Geography", path: "/dimensions/geography", icon: Globe2 },
      { label: "Time Periods", path: "/dimensions/time-periods", icon: CalendarDays },
    ],
  },
  {
    label: "Data Fields",
    basePath: "/data-fields",
    icon: TableProperties,
    items: [{ label: "Data Field Library", path: "/data-fields/library", icon: TableProperties }],
  },
  {
    label: "Template",
    basePath: "/template",
    icon: FileText,
    items: [
      { label: "Template Library", path: "/template/library", icon: FileText },
      { label: "Template Mappings", path: "/template/mappings", icon: GitBranch },
    ],
  },
  {
    label: "Requests",
    basePath: "/requests",
    icon: Send,
    items: [
      { label: "Dispatch Settings", path: "/requests/dispatch-settings", icon: Settings },
      { label: "Email Templates", path: "/requests/email-templates", icon: Mail },
      { label: "Notification Rules", path: "/requests/notification-rules", icon: Settings },
      { label: "Template Dispatch", path: "/requests/dispatch-plans", icon: CalendarDays },
      { label: "Dispatch Batches", path: "/requests/dispatch-batches", icon: Send },
      { label: "Collections", path: "/requests/collections", icon: Send },
      { label: "Dispatch Preview", path: "/requests/dispatch-preview", icon: FileText },
      { label: "Request Monitor", path: "/requests/monitor", icon: Gauge },
    ],
  },
  {
    label: "Data Entry",
    basePath: "/data-entry",
    icon: Inbox,
    items: [
      { label: "Assignments", path: "/data-entry/assignments", icon: ClipboardCheck },
      { label: "My Assignments", path: "/data-entry/my-assignments", icon: Inbox },
      { label: "Request Forms", path: "/data-entry/request-forms", icon: FileText },
      { label: "Form Access", path: "/data-entry/form-access", icon: KeyRound },
    ],
  },
  {
    label: "Ingestion",
    basePath: "/ingestion",
    icon: UploadCloud,
    items: [
      { label: "Ingestion Monitoring", path: "/ingestion/monitoring", icon: Gauge },
      { label: "Submissions", path: "/ingestion/submissions", icon: Inbox },
      { label: "Runs", path: "/ingestion/runs", icon: UploadCloud },
      { label: "Staged Records", path: "/ingestion/staged-records", icon: TableProperties },
      { label: "Submission History", path: "/ingestion/submission-history", icon: BookOpen },
    ],
  },
  {
    label: "Review",
    basePath: "/review",
    icon: FileCheck,
    items: [
      { label: "Review Monitor", path: "/review/monitor", icon: Gauge },
      { label: "Review Queue", path: "/review/queue", icon: Inbox },
      { label: "Review Detail", path: "/review/detail", icon: FileCheck },
    ],
  },
  {
    label: "Published Facts",
    basePath: "/published-facts",
    icon: BookOpen,
    items: [
      { label: "Observations", path: "/published-facts/observations", icon: BookOpen },
      { label: "Approved Data", path: "/published-facts/approved-data", icon: FileCheck },
      { label: "Computed Facts", path: "/published-facts/computed-facts", icon: TableProperties },
    ],
  },
  {
    label: "Publication Management",
    basePath: "/publication-management",
    icon: Newspaper,
    items: [
      { label: "Publication Studio", path: "/publication-management/studio", icon: Newspaper },
      { label: "Publications", path: "/publication-management/publications", icon: BookOpen },
    ],
  },
  {
    label: "Analytics",
    basePath: "/analytics",
    icon: BarChart3,
    items: [
      { label: "User Analytics", path: "/analytics/users", icon: Users },
      { label: "Site Analytics", path: "/analytics/site", icon: LineChart },
    ],
  },
  {
    label: "Portal",
    basePath: "/portal",
    icon: Globe2,
    items: [
      { label: "Public Dashboard", path: "/portal/public-dashboard", icon: LayoutDashboard },
      { label: "CMS", path: "/portal/cms", icon: FileText },
      { label: "DMS", path: "/portal/dms", icon: Database },
      { label: "Announcements", path: "/portal/announcements", icon: Mail },
      { label: "Documents", path: "/portal/documents", icon: BookOpen },
    ],
  },
];

export const bottomNavigation: NavItem[] = [
  { label: "Settings", path: "/settings", icon: Settings },
];

export const flatNavigation = navigationModules.flatMap((module) => module.items).concat(bottomNavigation);
