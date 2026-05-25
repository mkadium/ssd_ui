# UI Workflow

## Standard UI Flow

1. Read `ssd_ui/.init/`.
2. Read the active work packet.
3. Read target UI module context files.
4. Read approved API contracts and API usage rules.
5. Check existing page flows and component map.
6. Implement within UI boundaries.
7. Put implementation changes only under the direct module implementation folder, for example `ssd_ui/ui/<module>/`.
8. Run relevant UI checks or document why not run.
9. Check CI/CD impact if UI build, artifact, deployment, or environment behavior changes.
10. Update UI context files under `ssd_ui/modules/<module>/`.
11. Update the active work packet when status, blockers, dependencies, API usage, accessibility readiness, CI/CD impact, or handoff readiness changes.
12. Escalate governance-impacting changes.
