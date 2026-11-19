# API Documentation: Calendar

## Overview

The Calendar API provides Islamic (Hijri) and Gregorian calendar conversion utilities and date calculations for Zakat purposes. This API supports accurate date conversions and Zakat timing calculations.

**Base URL**: Integrated into other endpoints  
**Authentication**: Required (JWT Bearer token)  
**Content-Type**: `application/json`

---

## Calendar Integration

Calendar functionality is integrated into several ZakApp endpoints rather than being standalone. Here's how calendar features are accessed:

### Zakat Calculation Endpoints

Calendar conversion is automatically handled during Zakat calculations when using different methodologies.

---

## Date Conversion Utilities

### Supported Calendars

1. **Gregorian Calendar** (`gregorian`)
   - Standard Western calendar
   - Used for most international dates
   - Default for new users

2. **Hijri Calendar** (`hijri`)
   - Islamic lunar calendar
   - Traditional for Islamic obligations
   - Approximately 11 days shorter than solar year

### Automatic Conversions

The system automatically handles calendar conversions in the following scenarios:

#### Yearly Snapshots (POST /api/tracking/snapshots)

When creating yearly snapshots, both calendar dates are calculated:

**Request Fields:**
```json
{
  "calculationDate": "2024-12-14T10:30:00Z",
  "gregorianYear": 2024,
  "gregorianMonth": 12,
  "gregorianDay": 14,
  "hijriYear": 1446,
  "hijriMonth": 6,
  "hijriDay": 13
}
```

#### Zakat Due Date Calculations

The system calculates next Zakat due dates based on:
- Last payment date
- Preferred calendar system (user setting)
- Islamic year length adjustments

**Response Example:**
```json
{
  "nextZakatDue": {
    "gregorian": "2025-12-14T00:00:00Z",
    "hijri": {
      "year": 1447,
      "month": 6,
      "day": 13,
      "formatted": "13 Jumada al-Thani 1447 AH"
    },
    "daysRemaining": 365,
    "isAnnualDue": true
  }
}
```

---

## Calendar Features

### 1. Date Format Support

#### Gregorian Date Formats
- **ISO 8601**: `2024-12-14T10:30:00Z`
- **Date Only**: `2024-12-14`
- **Localized**: Based on user locale settings

#### Hijri Date Formats
- **Numeric**: `1446-06-13`
- **Named**: `13 Jumada al-Thani 1446 AH`
- **Short**: `13/6/1446`

### 2. Zakat Year Calculations

The system handles different Zakat year interpretations:

#### Lunar Year (Traditional)
- 354-355 days per year
- Follows Hijri calendar exactly
- Used by traditional methodologies

#### Solar Year (Contemporary)
- 365 days per year
- Follows Gregorian calendar
- Used by some modern interpretations

#### Adjustment Calculations
The system calculates adjustment factors for mixed calendar usage:

```json
{
  "adjustmentFactor": 0.9699,
  "explanation": "Lunar year is approximately 3% shorter than solar year",
  "recommendedAdjustment": {
    "applyToWealth": false,
    "applyToRate": true,
    "adjustedRate": 2.425
  }
}
```

---

## User Calendar Preferences

### Setting Calendar Preference

Calendar preferences are managed through user settings:

**Endpoint**: `PATCH /api/users/settings`

```json
{
  "preferredCalendar": "hijri",
  "preferredMethodology": "hanafi",
  "lastZakatDate": "2024-01-15T00:00:00Z"
}
```

### Supported Preferences

| Setting | Values | Description |
|---------|--------|-------------|
| `preferredCalendar` | `gregorian`, `hijri` | Default calendar for date displays |
| `dateFormat` | `iso`, `localized`, `traditional` | Date format preference |
| `showBothCalendars` | `true`, `false` | Display both calendars simultaneously |

---

## Calendar Validation

### Date Validation Rules

1. **Hijri Dates**:
   - Years: 1-9999 AH (After Hijra)
   - Months: 1-12 (Islamic month names)
   - Days: 1-30 (varies by month and year)

2. **Gregorian Dates**:
   - Standard Gregorian calendar rules
   - Leap year considerations
   - Time zone handling (UTC default)

3. **Future Date Limits**:
   - Calculations limited to reasonable future dates
   - Projections up to 10 years forward
   - Historical dates back to 1 AH (622 CE)

### Error Handling

**Invalid Date Format**
```json
{
  "success": false,
  "error": "INVALID_DATE",
  "message": "Invalid date format provided",
  "details": {
    "provided": "1446-13-35",
    "issue": "Invalid Hijri month (13) and day (35)",
    "validRange": "Months: 1-12, Days: 1-30"
  }
}
```

**Date Conversion Error**
```json
{
  "success": false,
  "error": "CONVERSION_ERROR", 
  "message": "Unable to convert between calendar systems",
  "details": {
    "reason": "Date outside supported range",
    "supportedRange": "1 AH - 9999 AH"
  }
}
```

---

## Implementation Details

### Calendar Service Integration

The calendar functionality is provided by the `CalendarConversionService`:

**Key Methods:**
- `gregorianToHijri(date)` - Convert Gregorian to Hijri
- `hijriToGregorian(year, month, day)` - Convert Hijri to Gregorian  
- `calculateNextZakatDate(calendarType, lastDate)` - Calculate next due date
- `formatHijriDate(year, month, day)` - Format Hijri date display
- `getCurrentHijriDate()` - Get current Hijri date

### External Library

Calendar conversions use the `hijri-converter` library:
- **Accuracy**: ±1 day for historical dates
- **Range**: 1-9999 AH (622 CE - ~10,000 CE)
- **Algorithm**: Based on Umm al-Qura calendar

---

## Usage Examples

### Creating Calculation with Hijri Date

```bash
curl -X POST /api/calculations \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "methodology": "hanafi",
    "calendarType": "hijri",
    "totalWealth": 15000.00,
    "nisabThreshold": 2860.00,
    "zakatDue": 375.00,
    "metadata": {
      "hijriDate": "13 Jumada al-Thani 1446 AH",
      "gregorianDate": "2024-12-14"
    }
  }'
```

### Yearly Snapshot with Both Calendars

```bash
curl -X POST /api/tracking/snapshots \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "calculationDate": "2024-12-14T10:30:00Z",
    "gregorianYear": 2024,
    "gregorianMonth": 12,
    "gregorianDay": 14,
    "hijriYear": 1446,
    "hijriMonth": 6,
    "hijriDay": 13,
    "totalWealth": 15000.00,
    "totalLiabilities": 2000.00,
    "zakatAmount": 325.00
  }'
```

---

## Best Practices

### Date Handling Recommendations

1. **Store UTC Timestamps**: Always store dates in UTC format
2. **Display Local Dates**: Convert to user's preferred calendar for display
3. **Validate Input**: Check both calendar formats when accepting dates
4. **Handle Ambiguity**: Some dates may not have exact conversions
5. **User Education**: Explain calendar differences in UI

### Methodology-Specific Guidelines

| Methodology | Recommended Calendar | Notes |
|-------------|---------------------|-------|
| **Standard** | Gregorian | International standard |
| **Hanafi** | Hijri | Traditional preference |
| **Shafi'i** | Flexible | User choice |
| **Custom** | User defined | Based on configuration |

### Performance Considerations

- Calendar conversions are cached for frequently used dates
- Bulk operations minimize conversion overhead
- Pre-calculated common date ranges available
- Asynchronous processing for large date sets

---

## Islamic Calendar Information

### Month Names (Arabic/English)

1. **Muharram** (المحرم) - Sacred month
2. **Safar** (صفر) 
3. **Rabi' al-Awwal** (ربيع الأول) - First spring
4. **Rabi' al-Thani** (ربيع الثاني) - Second spring
5. **Jumada al-Awwal** (جمادى الأولى) - First dry
6. **Jumada al-Thani** (جمادى الثانية) - Second dry
7. **Rajab** (رجب) - Sacred month
8. **Sha'ban** (شعبان)
9. **Ramadan** (رمضان) - Fasting month
10. **Shawwal** (شوال)
11. **Dhu al-Qi'dah** (ذو القعدة) - Sacred month
12. **Dhu al-Hijjah** (ذو الحجة) - Pilgrimage month

### Special Considerations

- **Leap Years**: Hijri calendar has 11 leap years per 30-year cycle
- **Month Length**: Alternates between 29 and 30 days
- **Year Length**: 354 days (normal) or 355 days (leap)
- **Start Date**: 1 Muharram 1 AH = July 16, 622 CE