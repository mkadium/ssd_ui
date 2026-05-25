# UI MCPs

Purpose:

Defines recommended MCP/tool integrations for UI work.

## MCPs

| MCP | Purpose | Boundary |
|---|---|---|
| filesystem | Read/write UI workspace files | `ssd_ui` only |
| terminal | Run local UI checks/tests | No destructive commands |
| browser | Validate UI behavior and accessibility | Local/dev/test environments only |
| github | PR and review workflow when connected | PR metadata unless approved |
| jira | Work packet and ticket alignment | Ticket metadata only unless approved |

## Security Boundary

UI tools must not expose secrets, production tokens, citizen/user data, or confidential MoSPI data.

