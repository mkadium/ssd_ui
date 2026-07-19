# API USAGE

## Module
Templates UI

| API | UI Usage | Status |
|---|---|---|
| `GET /templates/health` | DEV/UAT smoke check | DONE |
| `GET /templates` | Template list | DONE |
| `GET /templates/{template_code}` | Template detail and versions | DONE |
| `GET /templates/{template_code}/versions` | Version list | DONE |
| `GET /templates/versions/{version_code}` | Version detail | DONE |
| `GET /templates/versions/{version_code}/axes` | Axis metadata | DONE |
| `GET /templates/versions/{version_code}/measures` | Measure metadata | DONE |
| `GET /templates/versions/{version_code}/cells` | Cell contract | DONE |
| `GET /templates/versions/{version_code}/render-elements` | Layout/render hints | DONE |
| `GET /templates/versions/{version_code}/validation-rule-refs` | Validation references | DONE |
| `GET /templates/versions/{version_code}/render-contract` | Assembled template render contract | DONE |
| `POST /templates` | Create template definition from Template Library drawer | DONE |
| `PATCH /templates/{template_code}` | Update template definition | AVAILABLE_NOT_UI_COMPLETE |
| `POST /templates/{template_code}/versions` | Create template version from Template Library drawer | DONE |
| `PATCH /templates/{template_code}/versions/{version_code}` | Update template version | AVAILABLE_NOT_UI_COMPLETE |
| `POST /templates/versions/{version_code}/axes` | Add governed axis from Template Studio | DONE |
| `PATCH /templates/versions/{version_code}/axes/{axis_code}` | Update governed axis from Template Studio | DONE |
| `GET /dimensions/time-period-sets` | Select governed time-period set for template time axis | DONE |
| `GET /templates/versions/{version_code}/studio-draft` | Reload saved Template Studio builder state when Edit Studio opens | READY_FOR_LIVE_SMOKE |
| `PUT /templates/versions/{version_code}/studio-draft` | Save Template Studio builder zones, preview settings, cell map, validation UI state, and generated output refs | READY_FOR_LIVE_SMOKE |
| `GET /templates/versions/{version_code}/formula-outputs` | Reload compute/calculated/rollup output definitions | READY_FOR_LIVE_SMOKE |
| `POST /templates/versions/{version_code}/formula-outputs` | Persist compute/calculated/rollup output definitions from Settings | READY_FOR_LIVE_SMOKE |

## Rules
- Data endpoints require bearer auth.
- Use `TEMPLATES:list` and `TEMPLATES:view` behavior from API.
- Create/update endpoints require the matching governed template permissions.
- UI must include selected `unit_code` and `locale` where required.
- Template time-period axis uses `dimension_code = TIME_PERIOD`.
- `FROM_REQUEST` axes do not require `member_set_code`.
- `CONTRIBUTOR_SELECT` and `FIXED_SET` axes require a governed `member_set_code`.
- Template Studio must not edit time-period set membership.
- Validation references are saved through the validation/template rule APIs and persisted in DB as rule references. Full runtime validation execution is separate.
- Computed/calculated/rollup outputs are persisted for designer reload and publish handoff after API restart from latest code.
