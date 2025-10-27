# Feature Specification: Nisab Year Record Workflow Fix

**Feature Branch**: `008-nisab-year-record`  
**Created**: 2025-10-27  
**Status**: Draft  
**Input**: User description: "Nisab Year Record Workflow Fix - Implement proper Islamic Zakat accounting with Hawl tracking, Nisab threshold monitoring, and live wealth aggregation"

## Execution Flow (main)
```
1. Parse user description from Input
   → Fix Nisab Year Record workflow to properly align with Islamic accounting principles
2. Extract key concepts from description
   → Actors: ZakApp users, system (automated Hawl tracking)
   → Actions: Track Hawl, calculate Nisab, aggregate wealth, create records, finalize, unlock
   → Data: Nisab Year Records, Hawl dates, Nisab thresholds, aggregate wealth, audit trails
   → Constraints: Islamic compliance (Hawl tracking, Nisab threshold), privacy-first design
3. For each unclear aspect:
   → All aspects clarified through two clarification sessions (2025-10-27)
4. Fill User Scenarios & Testing section
   → Complete workflows for Islamic accounting lifecycle
5. Generate Functional Requirements
   → Each requirement focused on Islamic compliance and workflow fixes
6. Identify Key Entities
   → Nisab Year Record, Hawl Tracker, Nisab Calculator, Audit Trail
7. Run Review Checklist
   → All requirements testable and aligned with Islamic principles
8. Return: SUCCESS (spec ready for planning)
```

---

## Problem Statement

### Current Issues

1. **Terminology Mismatch**: The system uses "Yearly Snapshot" which is generic accounting jargon and doesn't reflect Islamic Zakat principles. Islamic accounting requires recognition of **Nisab** (minimum wealth threshold) and **Hawl** (lunar year completion).

2. **Failed Update Error**: Users encounter "Failed to update snapshot" error when attempting to edit records, indicating broken CRUD operations.

3. **Missing Auto-Inclusion**: When creating a new record, existing assets are not automatically included, requiring manual asset selection contrary to Islamic wealth aggregation principles.

4. **No Hawl Tracking**: The system doesn't track when aggregate wealth first reaches Nisab threshold (Hawl start date) or when the lunar year completes (Hawl completion date ~354 days later).

5. **Missing Nisab Calculation**: No mechanism to calculate Nisab threshold based on current gold (87.48g) or silver (612.36g) market prices.

6. **Unclear Draft Behavior**: Users don't understand how draft records should update as their wealth changes during the Hawl period.

7. **Finalization/Unlock Workflow**: No clear process for finalizing records when Hawl completes or unlocking them for corrections with proper audit trails.

**Status**: ✅ Ready for planning phase  
**Next Step**: Execute `/plan` command to create implementation plan with technical specifications

**Notes**: 
- This feature fixes critical workflow issues discovered during Milestone 6 completion
- Implementation should prioritize database migration (FR-001) and CRUD fixes (FR-048-FR-053) first
- Islamic compliance must be validated at every step
- Consider creating a separate epic for precious metals API integration if timeline is tight
