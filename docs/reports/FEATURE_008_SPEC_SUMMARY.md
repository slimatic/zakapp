# Feature 008: Nisab Year Record Workflow Fix - Specification Summary

## Overview

**Branch**: `008-nisab-year-record`  
**Status**: Specification in Progress  
**Created**: 2025-10-27

### Purpose

Fix critical workflow issues in the Nisab Year Record feature (formerly "Yearly Snapshot") to properly align with Islamic Zakat accounting principles including Hawl (lunar year) tracking, Nisab threshold monitoring, and live wealth aggregation.

## Problem Analysis

### Issues Identified

1. **Terminology Mismatch**: "Yearly Snapshot" doesn't reflect Islamic accounting (Nisab/Hawl)
2. **"Failed to update snapshot" error**: Broken CRUD operations  
3. **Missing auto-inclusion**: Assets not automatically included when creating records
4. **No Hawl tracking**: System doesn't track lunar year completion
5. **Missing Nisab calculation**: No gold/silver price integration  
6. **Unclear draft behavior**: Users don't understand live tracking
7. **Broken finalization workflow**: No unlock/edit capability with audit trails

### Islamic Accounting Requirements

- **Nisab**: Minimum wealth threshold (87.48g gold OR 612.36g silver)
- **Hawl**: Lunar year (~354 days) tracking from Nisab achievement
- **Zakat Rate**: 2.5% of entire zakatable wealth (not just excess)
- **Aggregate Approach**: Sum ALL zakatable assets to check Nisab
- **Deductible Liabilities**: User discretion with scholarly guidance

## Key Requirements (63 Functional Requirements)

### FR-001-003: Terminology & Data Model
- Rename "Yearly Snapshot" → "Nisab Year Record" throughout
- Add Hawl dates, Nisab threshold, status fields
- Maintain separate audit trail entity

### FR-004-012: Nisab Threshold Calculation
- Integrate precious metals price API
- Calculate gold (87.48g) and silver (612.36g) based thresholds
- Allow user to choose standard once in settings
- Lock threshold at Hawl start (no retroactive changes)
- Provide educational content on why threshold is locked

### FR-013-022: Hawl Tracking
- Monitor aggregate zakatable wealth continuously
- Auto-detect when Nisab is reached (Hawl start)
- Record Hijri and Gregorian dates
- Calculate ~354 day completion date
- Create DRAFT record automatically  
- Handle Hawl interruption (wealth below Nisab)
- Support multiple sequential Hawl cycles

### FR-023-026: Auto-Inclusion of Assets
- Include ALL assets automatically (no manual selection)
- Snapshot values at creation time
- Include all zakatable categories
- Exclude non-zakatable assets

### FR-027-032: Live Tracking for Drafts
- Display real-time aggregate wealth in drafts
- Immediately recalculate when assets change
- Show: wealth, Zakat amount, growth, Nisab comparison
- Do NOT persist until finalization
- Visual indicator ("Live" badge)

### FR-033-038: Finalization Workflow
- Allow finalization ONLY after Hawl completion
- Present summary review screen (editable liabilities)
- Require explicit confirmation
- Lock record, persist values, record timestamp
- Display "Finalized on [date]" badge

### FR-039-047: Unlock and Edit Workflow
- Display "Unlock for Editing" option on finalized records
- Prompt for unlock reason (required, min 10 chars)
- Create audit trail entry before unlocking
- Change status to UNLOCKED, make fields editable
- Display warning banner on unlocked records
- Allow re-finalization with new audit entry
- Show complete audit history in record details

### FR-048-053: CRUD Operations Fix
- Provide functional UPDATE endpoint
- Validate status transitions (see state machine)
- Return descriptive error messages
- Allow DELETE only for DRAFT records
- Confirm deletion with warning
- Support filtering by status

### FR-054-058: Dashboard & Notifications
- Display Hawl status and countdown
- Show notification when Hawl completes
- Display aggregate wealth vs Nisab comparison
- Visual progress indicator
- List all records with status badges

### FR-059-063: Educational Guidance
- Explain Nisab concept (in-context help)
- Explain Hawl concept when tracking starts  
- Guidance on choosing gold vs silver standard
- Tooltips on deductible liabilities
- Link to comprehensive Zakat guide

## Key Entities

1. **Nisab Year Record**: Complete Hawl record with dates, threshold, wealth, liabilities, Zakat amount, status
2. **Hawl Tracker**: Active lunar year tracking with start/end dates, interruption handling  
3. **Nisab Calculator**: Service for calculating thresholds from gold/silver prices
4. **Audit Trail Entry**: Event history (unlock, edit, relock) with reasons and timestamps
5. **Precious Metal Price Cache**: Stored prices with TTL for consistent calculations

## Acceptance Scenarios

1. **First-Time Nisab Achievement**: Detect threshold, record Hawl start, create draft, notify user
2. **Live Tracking During Hawl**: Update draft instantly when assets change
3. **Hawl Completion**: Notify user, allow finalization, lock record
4. **Correcting Finalized Record**: Unlock with reason, edit, re-finalize with audit trail
5. **Multiple Hawl Cycles**: Auto-start new Hawl after previous completes
6. **Wealth Falls Below Nisab**: Mark Hawl interrupted, archive draft, wait for re-achievement

## Edge Cases Handled

1. Changing Nisab standard mid-Hawl (invalidates current Hawl)
2. Asset deletion during Hawl (recalculate, check interruption)
3. Price volatility (threshold locked at Hawl start)
4. Concurrent drafts (only one active draft allowed)
5. Premature finalization (prevent with error)
6. Offline Nisab detection (retroactive detection when back online)
7. Multiple unlocks/re-finalizations (complete audit trail)

## Success Criteria

1. ✅ Zero occurrences of "snapshot" in relevant code
2. ✅ Automated Hawl detection and tracking working
3. ✅ Nisab calculation from API prices accurate
4. ✅ All assets auto-included in new records
5. ✅ Live tracking updates instantly  
6. ✅ Finalization creates immutable records
7. ✅ Unlock/edit with full audit trail
8. ✅ UPDATE endpoint handles all status transitions
9. ✅ Dashboard shows Hawl status and countdown
10. ✅ Educational content explains all Islamic concepts

## Implementation Priority

**Phase 1 (Critical)**:
- FR-001: Database migration (Snapshot → Nisab Year Record)
- FR-048-053: Fix CRUD operations
- FR-023-026: Auto-include all assets

**Phase 2 (Core)**:
- FR-004-012: Nisab calculation service
- FR-013-022: Hawl tracking engine
- FR-027-032: Live tracking for drafts

**Phase 3 (Workflows)**:
- FR-033-038: Finalization workflow
- FR-039-047: Unlock/edit with audit trails
- FR-054-058: Dashboard enhancements

**Phase 4 (Polish)**:
- FR-059-063: Educational content
- Edge case handling
- E2E testing and validation

## Status Transition State Machine

```
[No Record] 
    ↓ (Nisab achieved)
[DRAFT] ←→ (asset changes trigger recalculation)
    ↓ (Hawl complete + finalize action)
[FINALIZED]
    ↓ (unlock with reason)
[UNLOCKED]
    ↓ (edit + re-finalize)
[FINALIZED]

Invalid transitions:
- DRAFT → UNLOCKED (not allowed)
- FINALIZED → DRAFT (not allowed)
- Any status → DELETED (only DRAFT can be deleted)
```

## Clarification Sessions Referenced

- **Session 1 (Morning 2025-10-27)**: Auto-include assets, live tracking, unlock workflow
- **Session 2 (Afternoon 2025-10-27)**: Islamic accounting alignment, Nisab Year Record terminology, Hawl/Nisab principles

## Next Steps

1. ✅ Create feature branch: `008-nisab-year-record`  
2. ⏳ Complete full specification document (in progress)
3. ⏳ Execute `/plan` to create implementation plan
4. ⏳ Begin Phase 1 implementation (database migration)

---

**Note**: Full specification document (`spec.md`) being created with all 63 requirements, 7 edge cases, 6 acceptance scenarios, and Islamic compliance verification. This summary captures the essence for quick reference.
