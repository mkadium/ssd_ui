# UI CONTRACTS

## Module

Masters / Metadata UI

## Status

UNIT_SCOPED_FRAMEWORK_OWNERSHIP_GOVERNED_PENDING_API

## Framework Management Contract

The Framework Management screen must support unit-scoped framework editions after WP-2026-011 is implemented.

Required screens/areas:

- Framework Editions
- Hierarchy Levels
- Framework Nodes
- Parent/Child Relationships
- Super Admin selected-unit context
- Unit Admin derived-unit context

## Unit Context Behavior

| Scenario | Expected UI Behavior |
|---|---|
| Super Admin login | Show Unit dropdown in top bar |
| Super Admin changes unit | Reload unit-scoped framework edition and hierarchy data |
| Unit Admin login | Hide Unit dropdown |
| Unit Admin data load | Use mapped user unit from auth/session context |
| Missing unit context | Show safe production message and block unit-scoped Framework actions |

## Framework Edition Form

Fields:

- Unit, required for Super Admin
- Framework code
- Edition code
- Edition name
- Version label
- Description
- Effective from
- Effective to
- Status
- Active flag

Validation:

- Unit is required for Super Admin create/update.
- Framework code and edition code must use stable-code format.
- Only one active framework edition is allowed per unit and framework.
- If a user attempts to activate another edition for the same unit/framework, show: `Deactivate the current active edition for this unit and framework before activating another.`

## Display Rules

- Framework list must show the owning unit code/name where space allows.
- Framework hierarchy tabs must show data only for the selected or derived unit.
- Changing unit context must clear prior selected framework state and reload.
- UI must use localized labels from API where available and stable codes as fallback.

