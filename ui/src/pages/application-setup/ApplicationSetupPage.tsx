import {
  CheckCircle2,
  Eye,
  FileUp,
  Globe2,
  Image,
  Palette,
  RotateCcw,
  Save,
  Settings,
  Upload,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  brandingAssets,
  portalBranding,
  themeTokens,
  unitBranding,
  type BrandingAssetStatus,
  type ThemeTokenStatus,
} from "@/data/applicationSetup.sample";

const assetStatusVariant = (status: BrandingAssetStatus) => {
  if (status === "CONFIGURED") return "secondary";
  if (status === "PLACEHOLDER") return "outline";
  return "destructive";
};

const themeStatusVariant = (status: ThemeTokenStatus) => {
  if (status === "ACTIVE") return "secondary";
  return "outline";
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <Input defaultValue={value} />
    </label>
  );
}

export function ApplicationSetupPage() {
  const stats = [
    { label: "Assets", value: brandingAssets.length, note: `${brandingAssets.filter((asset) => asset.status === "PLACEHOLDER").length} placeholders` },
    { label: "Theme tokens", value: themeTokens.length, note: "Centralized palette" },
    { label: "Unit profiles", value: unitBranding.length, note: "Unit-level overrides" },
    { label: "Public dashboard", value: portalBranding.public_dashboard_enabled ? "On" : "Off", note: "Admin controlled" },
  ];

  return (
    <AppShell persona="Application Admin" activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="application-setup-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="application-setup-title" className="text-2xl font-bold">Application Setup / Branding</h1>
            <p className="mt-1 text-sm text-muted-foreground">Configure portal identity, local placeholder assets, theme tokens, language defaults, and public dashboard settings.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline"><RotateCcw aria-hidden="true" className="size-4" /> Reset</Button>
            <Button type="button" variant="outline"><Save aria-hidden="true" className="size-4" /> Save draft</Button>
            <Button type="button"><CheckCircle2 aria-hidden="true" className="size-4" /> Publish</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {stats.map((stat) => (
            <div key={stat.label} className="min-h-[92px] rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
              <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4 max-xl:grid-cols-1">
          <Card>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Settings aria-hidden="true" className="size-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold">Portal identity</h2>
                  <p className="text-xs text-muted-foreground">Visible title and language defaults for the portal shell and login surface.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
                <Field label="Portal title" value={portalBranding.portal_title} />
                <Field label="Support email" value={portalBranding.support_email} />
                <label className="grid gap-1 text-xs font-semibold">
                  Default language
                  <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={portalBranding.default_language}>
                    <option value="en-IN">English (en-IN)</option>
                    <option value="hi-IN">Hindi (hi-IN)</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Public dashboard
                  <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={portalBranding.public_dashboard_enabled ? "enabled" : "disabled"}>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1 text-xs font-semibold">
                Portal subtitle
                <textarea className="min-h-20 rounded-md border border-input bg-input/20 px-3 py-2 text-sm" defaultValue={portalBranding.portal_subtitle} />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Image aria-hidden="true" className="size-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold">Live preview</h2>
                  <p className="text-xs text-muted-foreground">Placeholder-only preview.</p>
                </div>
              </div>
              <div className="rounded-md bg-sidebar p-4 text-sidebar-foreground">
                <div className="grid size-14 place-items-center rounded-md bg-white text-center text-[10px] font-bold leading-tight text-[#0c2f55]">
                  Logo
                  <span>path:</span>
                </div>
                <p className="mt-4 text-xl font-bold">{portalBranding.portal_title}</p>
                <p className="mt-2 text-xs text-blue-100">{portalBranding.portal_subtitle}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3 text-xs">
                <p className="font-bold">Local file storage</p>
                <p className="mt-1 font-mono text-[11px]">{portalBranding.local_asset_root}</p>
                <p className="mt-2 text-muted-foreground">Uploads are placeholders only in this UI. Real files are not uploaded or stored.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileUp aria-hidden="true" className="size-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold">Placeholder assets</h2>
                  <p className="text-xs text-muted-foreground">Configure logo, banner, favicon, and public dashboard image paths later through governed upload/storage.</p>
                </div>
              </div>
              <Badge variant="outline">No real upload</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Local path</TableHead>
                  <TableHead>Recommended size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brandingAssets.map((asset) => (
                  <TableRow key={asset.asset_code}>
                    <TableCell>
                      <span className="block font-semibold">{asset.label}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{asset.asset_code}</span>
                    </TableCell>
                    <TableCell>{asset.asset_type}</TableCell>
                    <TableCell>
                      <Input defaultValue={asset.local_path} placeholder="Empty path placeholder" />
                    </TableCell>
                    <TableCell>{asset.recommended_size}</TableCell>
                    <TableCell><Badge variant={assetStatusVariant(asset.status)}>{asset.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon-xs" variant="outline" aria-label="Preview asset"><Eye aria-hidden="true" className="size-3" /></Button>
                        <Button size="icon-xs" variant="outline" aria-label="Upload placeholder"><Upload aria-hidden="true" className="size-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-4 max-xl:grid-cols-1">
          <Card>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Palette aria-hidden="true" className="size-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold">Centralized theme tokens</h2>
                  <p className="text-xs text-muted-foreground">Classic, accessible colors for portal-wide use.</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {themeTokens.map((token) => (
                    <TableRow key={token.token_code}>
                      <TableCell>
                        <span className="block font-semibold">{token.label}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{token.token_code}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="size-5 rounded-sm border border-border" style={{ backgroundColor: token.value }} />
                          <Input defaultValue={token.value} className="max-w-32 font-mono text-xs" />
                        </div>
                      </TableCell>
                      <TableCell>{token.usage}</TableCell>
                      <TableCell><Badge variant={themeStatusVariant(token.status)}>{token.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Globe2 aria-hidden="true" className="size-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold">Unit-level branding</h2>
                  <p className="text-xs text-muted-foreground">Overrides for unit workspace and public dashboard behavior.</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Public</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitBranding.map((unit) => (
                    <TableRow key={unit.unit_code}>
                      <TableCell>
                        <span className="block font-semibold">{unit.unit_name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{unit.unit_code}</span>
                      </TableCell>
                      <TableCell>{unit.default_language}</TableCell>
                      <TableCell>{unit.public_dashboard_enabled ? "Enabled" : "Disabled"}</TableCell>
                      <TableCell><Badge variant={unit.status === "ACTIVE" ? "secondary" : "outline"}>{unit.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Setup actions</p>
              <p className="mt-1 text-xs text-muted-foreground">Save, publish, and reset are visual states only until a governed Application Setup API exists.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline"><RotateCcw aria-hidden="true" className="size-4" /> Reset</Button>
              <Button type="button" variant="outline"><Save aria-hidden="true" className="size-4" /> Save draft</Button>
              <Button type="button"><CheckCircle2 aria-hidden="true" className="size-4" /> Publish</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
