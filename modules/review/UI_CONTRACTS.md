# UI CONTRACTS

## Review UI Contract
- Read-only review catalog, task, action, and approval views are allowed.
- `/review` must show a reviewer task queue before opening task detail.
- Task queue records must include task/request codes, indicator context, source/reviewer, review level, validation summary, due date, priority, and status.
- Clicking a task must open a full review workspace.
- Workspace must show request -> data entry -> ingestion -> validation -> review context trail.
- Workspace must show indicator context, goal/target path, submitted-by/to reviewer, validation summary, template/data preview, selected cell/result detail, previous actions, approval history, reviewer note, and visual actions.
- Approve/reject/send-back/request-clarification must remain visual-only until governed mutation APIs and permissions are approved.
- Review action mutations are not allowed until governed APIs and permissions exist.
- Do not expose internal IDs, metadata JSON, raw payloads, source hashes, tokens, token hashes, secrets, or sensitive full response bodies.
