# PAGE FLOWS

## Module

Masters / Metadata UI

## Framework Management Flow

```text
Login
  |
  +-- Super Admin?
  |     |
  |     +-- Yes -> Show Unit dropdown -> Select unit -> Load framework editions for unit
  |     |
  |     +-- No  -> Use mapped user unit -> Load framework editions for mapped unit
  |
  +-- Framework Management
        |
        +-- Editions tab
        |     |
        |     +-- Create/Edit edition
        |     +-- Validate unit + framework + edition
        |     +-- Enforce one active edition per unit/framework
        |
        +-- Levels tab
        |     |
        |     +-- Manage levels for selected unit-owned framework edition
        |
        +-- Nodes tab
        |     |
        |     +-- Manage nodes for selected unit-owned framework edition
        |
        +-- Relationships tab
              |
              +-- Manage parent/child relationships for selected unit-owned framework edition
```

## Unit Switch Flow

```text
Super Admin changes top-bar Unit dropdown
  |
  +-- Clear selected framework edition
  +-- Clear cached levels/nodes/relationships
  +-- Reload framework edition list for selected unit
  +-- Select active framework edition for unit if available
  +-- Load hierarchy for selected unit/framework/edition
```

## Error Flow

```text
API returns unit-scope error
  |
  +-- 400 invalid/missing unit -> show safe validation message
  +-- 404 unit/framework edition not found -> show not-found message
  +-- 409 active edition conflict -> show deactivate-current-active message
  +-- 422 contract validation failure -> show field-level validation where possible
```

