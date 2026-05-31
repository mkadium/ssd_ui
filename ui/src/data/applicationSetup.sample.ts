export type BrandingAssetType = "LOGO" | "BANNER" | "FAVICON" | "PUBLIC_DASHBOARD_IMAGE";
export type BrandingAssetStatus = "PLACEHOLDER" | "CONFIGURED" | "MISSING";
export type ThemeTokenStatus = "ACTIVE" | "DRAFT";

export type BrandingAssetSample = {
  asset_code: string;
  asset_type: BrandingAssetType;
  label: string;
  local_path: string;
  status: BrandingAssetStatus;
  recommended_size: string;
  alt_text: string;
};

export type ThemeTokenSample = {
  token_code: string;
  label: string;
  value: string;
  status: ThemeTokenStatus;
  usage: string;
};

export type UnitBrandingSample = {
  unit_code: string;
  unit_name: string;
  title_override: string;
  logo_asset_code: string;
  public_dashboard_enabled: boolean;
  default_language: "en-IN" | "hi-IN";
  status: "ACTIVE" | "DRAFT";
};

export const portalBranding = {
  portal_title: "SSD-SDG Portal",
  portal_subtitle: "Sustainable Development Goals data collection, validation, review, and dashboard platform",
  support_email: "support@example.gov.in",
  default_language: "en-IN" as const,
  public_dashboard_enabled: true,
  local_asset_root: "files/ui/branding/",
  last_published_at: "2026-05-31 11:30",
};

export const brandingAssets: BrandingAssetSample[] = [
  {
    asset_code: "ASSET_PORTAL_LOGO",
    asset_type: "LOGO",
    label: "Portal logo",
    local_path: "",
    status: "PLACEHOLDER",
    recommended_size: "240 x 80 px",
    alt_text: "SSD-SDG portal logo",
  },
  {
    asset_code: "ASSET_LOGIN_BANNER",
    asset_type: "BANNER",
    label: "Login banner",
    local_path: "",
    status: "PLACEHOLDER",
    recommended_size: "1366 x 360 px",
    alt_text: "SSD-SDG login banner",
  },
  {
    asset_code: "ASSET_FAVICON",
    asset_type: "FAVICON",
    label: "Browser favicon",
    local_path: "",
    status: "MISSING",
    recommended_size: "64 x 64 px",
    alt_text: "Portal favicon",
  },
  {
    asset_code: "ASSET_PUBLIC_DASHBOARD",
    asset_type: "PUBLIC_DASHBOARD_IMAGE",
    label: "Public dashboard image",
    local_path: "",
    status: "PLACEHOLDER",
    recommended_size: "1280 x 420 px",
    alt_text: "Public dashboard header image",
  },
];

export const themeTokens: ThemeTokenSample[] = [
  { token_code: "PRIMARY", label: "Primary", value: "#1D5FD1", status: "ACTIVE", usage: "Buttons, active navigation, links" },
  { token_code: "SIDEBAR", label: "Sidebar", value: "#0C2F55", status: "ACTIVE", usage: "Navigation shell" },
  { token_code: "SUCCESS", label: "Success", value: "#0E8F70", status: "ACTIVE", usage: "Positive status chips" },
  { token_code: "WARNING", label: "Warning", value: "#D97706", status: "ACTIVE", usage: "Pending and warning states" },
  { token_code: "DANGER", label: "Danger", value: "#B42318", status: "ACTIVE", usage: "Errors and destructive actions" },
  { token_code: "BACKGROUND", label: "Background", value: "#F4F7FB", status: "ACTIVE", usage: "Page background" },
];

export const unitBranding: UnitBrandingSample[] = [
  {
    unit_code: "SDG",
    unit_name: "SDG Coordination Unit",
    title_override: "SSD-SDG Portal",
    logo_asset_code: "ASSET_PORTAL_LOGO",
    public_dashboard_enabled: true,
    default_language: "en-IN",
    status: "ACTIVE",
  },
  {
    unit_code: "HEALTH",
    unit_name: "Health Statistics Unit",
    title_override: "Health SDG Reporting",
    logo_asset_code: "ASSET_PORTAL_LOGO",
    public_dashboard_enabled: false,
    default_language: "en-IN",
    status: "DRAFT",
  },
  {
    unit_code: "STATE_UNIT",
    unit_name: "State Planning Unit",
    title_override: "State SDG Data Workspace",
    logo_asset_code: "ASSET_PORTAL_LOGO",
    public_dashboard_enabled: true,
    default_language: "hi-IN",
    status: "ACTIVE",
  },
];
