# UI AI Agents

Purpose:

Defines AI agents allowed inside the `ssd_ui` workspace.

## Agents

| Agent | Purpose | Boundary |
|---|---|---|
| UI Architecture Agent | Reviews page structure, routes, layouts, component boundaries, and state flow | UI workspace only |
| API Usage Agent | Validates UI consumption of approved API contracts | API usage documentation only |
| Accessibility Agent | Reviews GIGW/STQC/accessibility implications | UI accessibility only |
| Responsive Design Agent | Reviews desktop/tablet/mobile behavior | UI responsive behavior only |
| Bilingual Content Agent | Reviews English/Hindi localization readiness | UI content only |
| UI Context Sync Agent | Ensures UI context files are updated after changes | Context files only |

## Escalation

Escalate to Governance Owner for accessibility risk, public portal behavior changes, API contract mismatch, security-sensitive UI flows, or release-impacting UI gaps.

