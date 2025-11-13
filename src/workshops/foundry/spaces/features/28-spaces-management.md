# Feature 28: Spaces List & Management

**Persona:** Cross-Persona (All Users)
**Priority:** Critical
**Effort:** Medium
**Status:** Sprint 1

## Overview
**Note:** This is Feature 03 - Space Management. See `/opt/captify-apps/core/src/components/spaces/design/features/03-space-management.md` for full specification.

## Summary
Central hub for viewing, creating, and managing spaces (projects/programs). Includes:
- List all accessible spaces
- Create new spaces with templates
- Configure space settings (members, visibility, goals)
- Archive/restore spaces
- Space health metrics

## Key Components
- SpaceList (filterable grid/list view)
- SpaceCard (summary card with metrics)
- SpaceWizard (create/configure wizard)
- SpaceSettings (configuration dialog)

## Primary Actions
- List spaces (with role-based filtering)
- Create space
- Update space settings
- Archive space

## Integration Points
- Used by: Feature 14 (Portfolio Dashboard), Feature 04 (Workstream Management)
- Uses: User permissions from core-user

## Status
**Sprint:** Sprint 1
**Status:** Already Defined (See Feature 03)
