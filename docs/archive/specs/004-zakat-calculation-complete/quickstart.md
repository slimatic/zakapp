# Quickstart Guide: Zakat Calculation Complete

**Feature**: 004-zakat-calculation-complete  
**Branch**: 004-zakat-calculation-complete  
**Date**: 2025-10-13

---

## Overview

This quickstart guide provides step-by-step validation scenarios for the enhanced Zakat calculation feature. Follow these scenarios to verify complete implementation of multi-methodology calculations, calendar system integration, and calculation history tracking.

**Prerequisites**:

- Backend server running on `http://localhost:5000`
- Frontend client running on `http://localhost:3000`
- Valid user account with authentication token
- At least 2-3 assets created with values above nisab threshold

---

## Validation Scenarios

### Scenario 1: Calendar System Integration

**User Story**: US001 - As a user, I want to select my preferred calendar system

**Steps**:

1. **Get Current Calendar Preference**
   ```bash
   curl -X GET http://localhost:5000/api/user/calendar-preference \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "calendarType": "GREGORIAN"
   }
   ```

2. **Switch to Hijri Calendar**
   ```bash
   curl -X PUT http://localhost:5000/api/user/calendar-preference \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"calendarType": "HIJRI"}'
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "calendarType": "HIJRI",
     "message": "Calendar preference updated successfully"
   }
   ```

3. **Convert Today's Date to Hijri**
   ```bash
   curl -X POST http://localhost:5000/api/calendar/convert \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "date": "2025-10-13",
       "fromCalendar": "GREGORIAN",
       "toCalendar": "HIJRI"
     }'
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "convertedDate": {
       "year": 1447,
       "month": 4,
       "day": 10,
       "formatted": "1447-04-10"
     },
     "originalDate": {
       "year": 2025,
       "month": 10,
       "day": 13,
       "formatted": "2025-10-13"
     },
     "fromCalendar": "GREGORIAN",
     "toCalendar": "HIJRI"
   }
   ```

4. **Calculate Zakat Year Boundaries**
   ```bash
   curl -X POST http://localhost:5000/api/calendar/zakat-year \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "referenceDate": "2025-10-13",
       "calendarType": "HIJRI"
     }'
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "zakatYear": {
       "startDate": "2024-10-14T00:00:00.000Z",
       "endDate": "2025-10-13T23:59:59.999Z",
       "calendarType": "HIJRI",
       "daysInYear": 354,
       "hijriStart": {
         "year": 1446,
         "month": 4,
         "day": 11,
         "formatted": "1446-04-11"
       },
       "hijriEnd": {
         "year": 1447,
         "month": 4,
         "day": 10,
         "formatted": "1447-04-10"
       }
     }
   }
   ```

**Acceptance Criteria**:

- ✅ Calendar preference retrieved correctly
- ✅ Calendar preference updated successfully
- ✅ Date conversion accurate (Gregorian ↔ Hijri)
- ✅ Zakat year boundaries calculated (354 days for Hijri)
- ✅ Preference persists across API calls

---

### Scenario 2: Multi-Methodology Calculation

**User Story**: US002 - As a user, I want to calculate Zakat using different methodologies

**Steps**:

1. **Calculate Using Standard (AAOIFI) Methodology**
   ```bash
   curl -X POST http://localhost:5000/api/calculations/calculate \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "methodology": "STANDARD",
       "calendarType": "HIJRI"
     }'
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "calculation": {
       "id": "uuid-here",
       "methodology": "STANDARD",
       "totalWealth": 125000.00,
       "nisabThreshold": 7500.00,
       "zakatDue": 3125.00,
       "isAboveNisab": true,
       "zakatRate": 2.5,
       "calculationDate": "2025-10-13T14:30:00.000Z",
       "zakatYear": {
         "startDate": "2024-10-14T00:00:00.000Z",
         "endDate": "2025-10-13T23:59:59.999Z",
         "calendarType": "HIJRI",
         "daysInYear": 354
       },
       "assetBreakdown": [
         {
           "category": "CASH",
           "totalValue": 50000.00,
           "isZakatable": true,
           "count": 2
         },
         {
           "category": "GOLD",
           "totalValue": 75000.00,
           "isZakatable": true,
           "count": 1
         }
       ],
       "isLocked": true
     }
   }
   ```

2. **Calculate Using Hanafi Methodology**
   ```bash
   curl -X POST http://localhost:5000/api/calculations/calculate \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "methodology": "HANAFI",
       "calendarType": "HIJRI"
     }'
   ```
   
   **Expected**: Similar response with potentially different `nisabThreshold` (silver-based)

3. **Compare Multiple Methodologies**
   ```bash
   curl -X POST http://localhost:5000/api/calculations/compare \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "methodologies": ["STANDARD", "HANAFI", "SHAFII"]
     }'
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "comparison": [
       {
         "methodology": "STANDARD",
         "totalWealth": 125000.00,
         "nisabThreshold": 7500.00,
         "zakatDue": 3125.00,
         "isAboveNisab": true,
         "difference": {
           "absolute": 0,
           "percentage": 0
         }
       },
       {
         "methodology": "HANAFI",
         "totalWealth": 125000.00,
         "nisabThreshold": 4200.00,
         "zakatDue": 3125.00,
         "isAboveNisab": true,
         "difference": {
           "absolute": 0,
           "percentage": 0
         }
       },
       {
         "methodology": "SHAFII",
         "totalWealth": 125000.00,
         "nisabThreshold": 7500.00,
         "zakatDue": 3125.00,
         "isAboveNisab": true,
         "difference": {
           "absolute": 0,
           "percentage": 0
         }
       }
     ]
   }
   ```

**Acceptance Criteria**:

- ✅ Calculation snapshot created and locked immediately
- ✅ Different methodologies produce potentially different nisab thresholds
- ✅ Asset breakdown shows zakatable vs non-zakatable assets
- ✅ Comparison endpoint returns results for all methodologies
- ✅ No snapshots created by comparison endpoint

---

### Scenario 3: Calculation History & Snapshots

**User Story**: US003 - As a user, I want to view my calculation history

**Steps**:

1. **Retrieve Calculation History**
   ```bash
   curl -X GET "http://localhost:5000/api/calculations/history?page=1&limit=10" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "calculations": [
       {
         "id": "uuid-1",
         "methodology": "HANAFI",
         "totalWealth": 125000.00,
         "zakatDue": 3125.00,
         "nisabThreshold": 4200.00,
         "calculationDate": "2025-10-13T14:35:00.000Z",
         "isLocked": true,
         "unlockedAt": null,
         "unlockReason": null,
         "calendarType": "HIJRI",
         "zakatYearStart": "2024-10-14T00:00:00.000Z",
         "zakatYearEnd": "2025-10-13T23:59:59.999Z"
       },
       {
         "id": "uuid-2",
         "methodology": "STANDARD",
         "totalWealth": 125000.00,
         "zakatDue": 3125.00,
         "nisabThreshold": 7500.00,
         "calculationDate": "2025-10-13T14:30:00.000Z",
         "isLocked": true,
         "unlockedAt": null,
         "unlockReason": null,
         "calendarType": "HIJRI",
         "zakatYearStart": "2024-10-14T00:00:00.000Z",
         "zakatYearEnd": "2025-10-13T23:59:59.999Z"
       }
     ],
     "pagination": {
       "page": 1,
       "limit": 10,
       "total": 2,
       "pages": 1
     }
   }
   ```

2. **Get Detailed Calculation by ID**
   ```bash
   curl -X GET http://localhost:5000/api/calculations/uuid-1 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "calculation": {
       "id": "uuid-1",
       "methodology": "HANAFI",
       "totalWealth": 125000.00,
       "zakatDue": 3125.00,
       "nisabThreshold": 4200.00,
       "calculationDate": "2025-10-13T14:35:00.000Z",
       "isLocked": true,
       "calendarType": "HIJRI",
       "zakatYearStart": "2024-10-14T00:00:00.000Z",
       "zakatYearEnd": "2025-10-13T23:59:59.999Z",
       "assetValues": [
         {
           "id": "asset-value-1",
           "assetId": "asset-1",
           "assetName": "Savings Account",
           "assetCategory": "CASH",
           "capturedValue": 50000.00,
           "isZakatable": true,
           "capturedAt": "2025-10-13T14:35:00.000Z"
         },
         {
           "id": "asset-value-2",
           "assetId": "asset-2",
           "assetName": "Gold Jewelry",
           "assetCategory": "GOLD",
           "capturedValue": 75000.00,
           "isZakatable": true,
           "capturedAt": "2025-10-13T14:35:00.000Z"
         }
       ]
     }
   }
   ```

3. **Filter History by Methodology**
   ```bash
   curl -X GET "http://localhost:5000/api/calculations/history?methodology=HANAFI" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected**: Only HANAFI calculations returned

**Acceptance Criteria**:

- ✅ History paginated correctly
- ✅ Most recent calculations shown first
- ✅ Detailed view includes point-in-time asset values
- ✅ Asset values show denormalized names/categories (historical accuracy)
- ✅ Filtering by methodology works correctly

---

### Scenario 4: Unlock/Edit/Lock Workflow

**User Story**: US004 - As a user, I want to correct a calculation if needed

**Steps**:

1. **Attempt to Unlock Calculation**
   ```bash
   curl -X POST http://localhost:5000/api/calculations/uuid-1/unlock \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "reason": "Correction needed: Gold asset value was incorrectly entered"
     }'
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Calculation unlocked for editing",
     "calculation": {
       "id": "uuid-1",
       "methodology": "HANAFI",
       "totalWealth": 125000.00,
       "zakatDue": 3125.00,
       "isLocked": false,
       "unlockedAt": "2025-10-13T15:00:00.000Z",
       "unlockReason": "Correction needed: Gold asset value was incorrectly entered"
     }
   }
   ```

2. **Verify Audit Trail**
   ```bash
   curl -X GET http://localhost:5000/api/calculations/uuid-1 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected**: `unlockedAt`, `unlockedBy`, `unlockReason` populated

3. **Re-lock Calculation**
   ```bash
   curl -X POST http://localhost:5000/api/calculations/uuid-1/lock \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Calculation locked",
     "calculation": {
       "id": "uuid-1",
       "isLocked": true,
       "lockedAt": "2025-10-13T15:05:00.000Z"
     }
   }
   ```

4. **Verify Unlock Reason Validation**
   ```bash
   curl -X POST http://localhost:5000/api/calculations/uuid-1/unlock \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "reason": "Short"
     }'
   ```
   
   **Expected Response** (400 Error):
   ```json
   {
     "success": false,
     "error": "INVALID_REASON",
     "message": "Unlock reason must be at least 10 characters"
   }
   ```

**Acceptance Criteria**:

- ✅ Locked calculation can be unlocked with valid reason
- ✅ Unlock reason < 10 characters rejected
- ✅ Audit trail (unlockedAt, unlockedBy, unlockReason) recorded
- ✅ Calculation can be re-locked after edits
- ✅ Already unlocked calculation returns error if unlocked again

---

### Scenario 5: Custom Methodology Configuration

**User Story**: US005 - As a user, I want to create custom calculation rules

**Steps**:

1. **List Available Methodologies**
   ```bash
   curl -X GET http://localhost:5000/api/methodologies \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "fixed": [
       {
         "type": "STANDARD",
         "name": "Standard (AAOIFI)",
         "description": "Gold-based nisab following AAOIFI guidelines",
         "nisabBasis": "GOLD",
         "rate": 2.5,
         "nisabThresholds": {
           "gold": {
             "grams": 85,
             "description": "85 grams of gold"
           }
         }
       },
       {
         "type": "HANAFI",
         "name": "Hanafi Method",
         "description": "Silver-based nisab (more inclusive)",
         "nisabBasis": "SILVER",
         "rate": 2.5,
         "nisabThresholds": {
           "silver": {
             "grams": 595,
             "description": "595 grams of silver"
           }
         }
       },
       {
         "type": "SHAFII",
         "name": "Shafi'i Method",
         "description": "Gold-based with detailed categorization",
         "nisabBasis": "GOLD",
         "rate": 2.5
       }
     ],
     "custom": []
   }
   ```

2. **Create Custom Methodology**
   ```bash
   curl -X POST http://localhost:5000/api/methodologies/custom \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My Regional Method",
       "nisabBasis": "SILVER",
       "rate": 2.5,
       "assetRules": {
         "CASH": {
           "included": true
         },
         "GOLD": {
           "included": true,
           "adjustmentPercentage": 1.0
         },
         "CRYPTO": {
           "included": true
         },
         "REAL_ESTATE": {
           "included": false,
           "notes": "Personal residence exempt"
         }
       }
     }'
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Custom methodology created successfully",
     "methodology": {
       "id": "custom-uuid",
       "name": "My Regional Method",
       "nisabBasis": "SILVER",
       "customNisabValue": null,
       "rate": 2.5,
       "assetRules": {
         "CASH": { "included": true },
         "GOLD": { "included": true, "adjustmentPercentage": 1.0 },
         "CRYPTO": { "included": true },
         "REAL_ESTATE": { "included": false, "notes": "Personal residence exempt" }
       },
       "isActive": true,
       "createdAt": "2025-10-13T15:10:00.000Z",
       "updatedAt": "2025-10-13T15:10:00.000Z"
     }
   }
   ```

3. **Calculate Using Custom Methodology**
   ```bash
   curl -X POST http://localhost:5000/api/calculations/calculate \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "methodology": "CUSTOM",
       "methodologyConfigId": "custom-uuid"
     }'
   ```
   
   **Expected**: Calculation using custom rules

4. **Get Methodology Info (Educational Content)**
   ```bash
   curl -X GET http://localhost:5000/api/methodologies/STANDARD/info \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected Response**:
   ```json
   {
     "success": true,
     "info": {
       "type": "STANDARD",
       "name": "Standard (AAOIFI)",
       "description": "Gold-based nisab following AAOIFI guidelines",
       "nisabBasis": "GOLD",
       "rate": 2.5,
       "scholarlyBasis": {
         "source": "AAOIFI Shariah Standards",
         "summary": "Based on AAOIFI Shariah Standard No. 35 on Zakat",
         "references": [
           "AAOIFI Shariah Standard No. 35",
           "Contemporary Fatawa on Zakat"
         ]
       },
       "suitableFor": [
         "General use",
         "Global standard",
         "AAOIFI-compliant institutions"
       ],
       "considerations": [
         "Gold prices fluctuate - nisab threshold changes",
         "More strict than silver-based"
       ]
     }
   }
   ```

**Acceptance Criteria**:

- ✅ Fixed methodologies returned with educational info
- ✅ Custom methodology created successfully
- ✅ Custom config includes asset-specific rules
- ✅ Calculation works with custom methodology
- ✅ Methodology info provides scholarly basis

---

## Frontend Validation

### Calendar Selection UI

**Navigate to**: Settings → Calendar Preference

**Expected UI Elements**:

- ✅ Radio buttons: "Gregorian Calendar" and "Hijri Calendar"
- ✅ Current selection highlighted
- ✅ Tooltip explaining difference between calendars
- ✅ Save button that updates preference via API
- ✅ Success message after save

### Methodology Selection UI

**Navigate to**: Calculate Zakat → Select Methodology

**Expected UI Elements**:

- ✅ 4 methodology cards: Standard, Hanafi, Shafi'i, Custom
- ✅ Each card shows: Name, icon, description, "Learn More" button
- ✅ Clicking card selects it (visual indicator)
- ✅ "Learn More" opens modal with scholarly basis
- ✅ Custom card allows selecting user-created configurations
- ✅ "Compare Methodologies" button visible when >1 selected

### Enhanced Calculation Display

**Navigate to**: Calculate Zakat → View Results

**Expected UI Elements**:

- ✅ Methodology badge showing selected method
- ✅ Nisab indicator (visual gauge showing wealth vs nisab)
- ✅ Total wealth displayed prominently
- ✅ Zakat due amount highlighted
- ✅ Asset breakdown table with zakatable/non-zakatable columns
- ✅ Educational tooltips on hover (e.g., "What is nisab?")
- ✅ Calendar system displayed (Hijri/Gregorian)
- ✅ Zakat year dates shown

### Calculation History UI

**Navigate to**: My Calculations → History

**Expected UI Elements**:

- ✅ List of past calculations (most recent first)
- ✅ Each entry shows: Date, methodology, amount, lock status
- ✅ Click to expand and see asset breakdown
- ✅ "Unlock" button for locked calculations
- ✅ Pagination controls at bottom
- ✅ Filter dropdown: "All" | "Standard" | "Hanafi" | "Shafi'i" | "Custom"
- ✅ Date range picker for filtering

### Comparison View

**Navigate to**: Calculate Zakat → Compare Methodologies

**Expected UI Elements**:

- ✅ Side-by-side cards for each selected methodology
- ✅ Each card shows: Nisab threshold, Zakat due, difference %
- ✅ Visual indicators for differences (green/red)
- ✅ "Why the difference?" educational content
- ✅ Recommendation based on user context (optional)

---

## Error Handling Validation

### Test Invalid Inputs

1. **Invalid Date Format**
   ```bash
   curl -X POST http://localhost:5000/api/calendar/convert \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"date": "invalid", "fromCalendar": "GREGORIAN", "toCalendar": "HIJRI"}'
   ```
   
   **Expected**: 400 error with `INVALID_DATE_FORMAT`

2. **Missing Required Field**
   ```bash
   curl -X POST http://localhost:5000/api/calculations/calculate \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   
   **Expected**: 400 error with validation details

3. **Unauthorized Access**
   ```bash
   curl -X GET http://localhost:5000/api/calculations/history
   ```
   
   **Expected**: 401 error with `UNAUTHORIZED`

4. **Accessing Another User's Calculation**
   ```bash
   curl -X GET http://localhost:5000/api/calculations/another-user-uuid \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   **Expected**: 403 error with `FORBIDDEN`

---

## Performance Validation

### Response Time Targets

Test with at least 20 assets and 50 historical calculations:

- ✅ Calendar conversion: < 50ms
- ✅ Zakat year calculation: < 100ms
- ✅ Single methodology calculation: < 200ms
- ✅ Methodology comparison (3 methods): < 500ms
- ✅ Calculation history (page 1): < 500ms
- ✅ Detailed calculation retrieval: < 300ms

**Test Command**:

```bash
time curl -X POST http://localhost:5000/api/calculations/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"methodology": "STANDARD"}'
```

---

## Security Validation

### Encryption Verification

1. **Check Database Directly**:
   ```bash
   sqlite3 zakapp.db "SELECT total_wealth, zakat_due FROM calculation_snapshots LIMIT 1;"
   ```
   
   **Expected**: Base64-encoded encrypted strings (NOT plain numbers)

2. **Verify No Sensitive Data in Logs**:
   ```bash
   grep -r "totalWealth\|zakatDue\|capturedValue" server/logs/
   ```
   
   **Expected**: No matches (sensitive data should not be logged)

3. **Test JWT Expiration**:
   - Use expired token
   - **Expected**: 401 error with token expiration message

---

## Completion Checklist

### API Endpoints (13 total)

- ✅ POST `/api/calendar/convert` - Calendar conversion
- ✅ POST `/api/calendar/zakat-year` - Zakat year calculation
- ✅ GET `/api/user/calendar-preference` - Get calendar preference
- ✅ PUT `/api/user/calendar-preference` - Update calendar preference
- ✅ POST `/api/calculations/calculate` - Perform calculation
- ✅ GET `/api/calculations/history` - Get calculation history
- ✅ GET `/api/calculations/:id` - Get calculation details
- ✅ POST `/api/calculations/:id/unlock` - Unlock calculation
- ✅ POST `/api/calculations/:id/lock` - Lock calculation
- ✅ POST `/api/calculations/compare` - Compare methodologies
- ✅ GET `/api/methodologies` - List methodologies
- ✅ POST `/api/methodologies/custom` - Create custom methodology
- ✅ GET `/api/methodologies/:type/info` - Get methodology info

### UI Components (15 total)

- ✅ CalendarSelector - Calendar type selection
- ✅ MethodologySelector - Methodology chooser (4 cards)
- ✅ MethodologyCard - Individual methodology display
- ✅ MethodologyInfoModal - Educational content modal
- ✅ EnhancedZakatCalculator - Main calculation interface
- ✅ NisabIndicator - Visual gauge for nisab comparison
- ✅ CalculationBreakdown - Asset category breakdown
- ✅ EducationalTooltip - Contextual help tooltips
- ✅ CalculationHistory - Historical calculations list
- ✅ CalculationDetailView - Detailed calculation view
- ✅ UnlockDialog - Unlock reason input
- ✅ MethodologyComparison - Side-by-side comparison
- ✅ CustomMethodologyForm - Custom config creation
- ✅ AssetRulesEditor - Per-category rule configuration
- ✅ HistoryFilters - Date/methodology filtering

### Database Tables (4 total)

- ✅ users (extended with `calendar_type`)
- ✅ calculation_snapshots
- ✅ snapshot_asset_values
- ✅ methodology_configs

---

## Troubleshooting

### Issue: Calendar conversion returns wrong date

**Solution**: Verify hijri-converter library installed (`npm list hijri-converter`)

### Issue: Calculation history empty

**Solution**: Ensure at least one calculation performed via `/api/calculations/calculate`

### Issue: Unlock reason validation fails

**Solution**: Reason must be ≥10 characters

### Issue: Custom methodology rejected

**Solution**: If `nisabBasis = "CUSTOM_VALUE"`, `customNisabValue` is required

---

## Next Steps

After completing this quickstart:

1. Run automated contract tests: `npm run test:contract`
2. Run integration tests: `npm run test:integration`
3. Perform manual UI testing using scenarios above
4. Verify accessibility (WCAG 2.1 AA) using screen reader
5. Test with real user data (minimum 10 assets, 20 calculations)

---

**Feature Completion**: All scenarios passing = Feature 004 COMPLETE ✅
