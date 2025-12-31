# Research: ZakApp Tracking & Analytics

**Feature**: 003-tracking-analytics  
**Date**: 2025-10-04  
**Status**: Complete  

## Research Questions & Findings

### 1. Analytics Visualization Library Selection

**Question**: Which React charting library best fits ZakApp's needs for tracking visualizations?

**Candidates Evaluated**:
- Recharts
- Chart.js with react-chartjs-2
- Victory
- D3.js direct integration

**Decision**: **Recharts**

**Rationale**:
- **Composable Architecture**: Built on React components, follows React patterns
- **TypeScript Support**: First-class TypeScript definitions included
- **Islamic-Friendly Styling**: Easy to customize colors and theming to match Islamic design principles
- **Responsive**: Built-in responsive container for mobile/desktop
- **Bundle Size**: Reasonable ~400KB minified (tree-shakeable)
- **Documentation**: Excellent examples and API documentation
- **Maintenance**: Active development, regular updates
- **Animation**: Smooth animations out of the box

**Alternatives Considered**:
- Chart.js: More imperative API, less React-native feel
- Victory: More complex API, larger bundle size (~700KB)
- D3.js: Too low-level, requires extensive custom code

**Implementation Notes**:
- Use `<ResponsiveContainer>` for all charts
- Implement custom Islamic-themed color palette
- Use `<LineChart>`, `<BarChart>`, and `<PieChart>` components
- Implement custom tooltips for Islamic terminology

---

### 2. Islamic Calendar Integration

**Question**: How should ZakApp handle both Gregorian and Hijri calendar dates for tracking?

**Candidates Evaluated**:
- date-fns-jalali
- moment-hijri
- @formkit/tempo
- hijri-converter

**Decision**: **date-fns-jalali + hijri-converter**

**Rationale**:
- **date-fns-jalali**: Extends date-fns with Jalali/Persian calendar (similar to Hijri)
- **hijri-converter**: Accurate Gregorian ↔ Hijri conversion library
- **Lightweight**: Combined ~50KB, tree-shakeable
- **Accuracy**: Based on astronomical calculations, tested accuracy
- **Integration**: Works with existing date-fns usage in codebase
- **No Dependencies**: Doesn't require moment.js

**Alternatives Considered**:
- moment-hijri: Requires moment.js (deprecated library)
- @formkit/tempo: Hijri support incomplete/experimental

**Implementation Notes**:
- Store both Gregorian and Hijri dates in database
- Display user's preferred calendar in UI
- Use hijri-converter for conversion logic
- Add settings option for calendar preference
- Validate Hijri year calculations for Zakat anniversary

---

### 3. PDF Generation Strategy

**Question**: What's the best approach for generating professional PDF reports?

**Candidates Evaluated**:
- jsPDF + jspdf-autotable
- PDFKit
- Puppeteer
- react-pdf/renderer
- Server-side HTML to PDF

**Decision**: **jsPDF + jspdf-autotable**

**Rationale**:
- **Client-Side**: No server processing required, reduces server load
- **Table Support**: jspdf-autotable handles complex tables well
- **Arabic Support**: Can embed Arabic fonts for Islamic terminology
- **Styling**: Good control over layout and styling
- **Bundle Size**: ~300KB minified, acceptable for feature
- **No External Dependencies**: Pure JavaScript, no headless browser needed

**Alternatives Considered**:
- PDFKit: Server-side only, increases backend complexity
- Puppeteer: Heavy (~170MB), requires headless Chrome
- react-pdf: Complex setup, limited styling control
- Server HTML to PDF: Requires additional server dependencies

**Implementation Notes**:
- Create reusable PDF template functions
- Support Arabic/English text in reports
- Include ZakApp branding and Islamic symbols
- Format numbers according to user locale
- Add metadata (title, author, creation date)

---

### 4. CSV Export Format Standards

**Question**: What format should CSV exports follow for maximum compatibility?

**Standards Evaluated**:
- RFC 4180 (standard CSV)
- Excel-compatible CSV
- Custom delimiter formats

**Decision**: **RFC 4180 compliant with UTF-8 BOM**

**Rationale**:
- **Compatibility**: RFC 4180 is universally supported
- **Unicode Support**: UTF-8 with BOM ensures Excel compatibility
- **Proper Escaping**: Handles commas, quotes, newlines correctly
- **Standardized**: Clear specification, fewer edge cases
- **Tooling**: Libraries like papaparse implement RFC 4180

**Library**: **papaparse**

**Rationale**:
- RFC 4180 compliant
- Handles edge cases automatically
- Supports both generation and parsing (for import)
- TypeScript definitions available
- Small bundle size (~45KB)

**Implementation Notes**:
- Add UTF-8 BOM for Excel compatibility
- Use ISO date format (YYYY-MM-DD) for dates
- Quote all string fields
- Include header row with descriptive names
- Provide data dictionary in README

---

### 5. Historical Data Query Optimization

**Question**: How to maintain performance as users accumulate years of historical data?

**Strategies Evaluated**:
- Database indexing
- Pagination
- Data denormalization
- In-memory caching
- Pre-calculated aggregates

**Decision**: **Database indexes + Pagination + Short-term caching**

**Rationale**:
- **Indexes**: userId + date indexes enable fast queries
- **Pagination**: Load data in chunks (default 20 records)
- **Caching**: Cache recent analytics (5-minute TTL) to reduce recalculation
- **Simplicity**: Avoids complex denormalization maintenance
- **Scalability**: Handles 50+ years per user efficiently

**Index Strategy**:
```sql
-- YearlySnapshots
CREATE INDEX idx_snapshots_user_date ON YearlySnapshots(userId, calculationDate DESC);
CREATE INDEX idx_snapshots_user_year ON YearlySnapshots(userId, gregorianYear);

-- PaymentRecords
CREATE INDEX idx_payments_user_date ON PaymentRecords(userId, paymentDate DESC);
CREATE INDEX idx_payments_snapshot ON PaymentRecords(snapshotId);

-- AnalyticsMetrics (for cache lookup)
CREATE INDEX idx_analytics_user_type_expires ON AnalyticsMetrics(userId, metricType, expiresAt);
```

**Alternatives Considered**:
- Denormalization: Maintenance burden, potential consistency issues
- In-memory caching: Memory-intensive, lost on restart
- Pre-aggregates: Inflexible, difficult to modify metrics

**Implementation Notes**:
- Default pagination: 20 items per page
- Analytics cache TTL: 5 minutes
- Use cursor-based pagination for consistency
- Add query performance logging
- Monitor slow queries and optimize indexes

---

### 6. Analytics Calculation Strategy

**Question**: Should analytics be pre-calculated or computed on-demand?

**Approaches Evaluated**:
- Real-time calculation on each request
- Pre-calculated with background jobs
- Materialized views
- Hybrid: cache + on-demand

**Decision**: **On-demand calculation with short-term caching**

**Rationale**:
- **Data Volume**: Per-user data is manageable (typically <100 records)
- **Flexibility**: Easy to add new metrics without migration
- **Simplicity**: No background job management needed
- **Freshness**: Always reflects current data
- **Caching**: 5-minute cache prevents repeated calculations

**Caching Strategy**:
- Store calculated metrics in AnalyticsMetric table
- Set 5-minute expiration timestamp
- Check cache before calculating
- Invalidate on relevant data changes

**Alternatives Considered**:
- Pre-calculated: Inflexible, background job complexity
- Materialized views: SQLite has limited support
- No caching: Unnecessary recalculation burden

**Implementation Notes**:
- Calculate metrics in service layer
- Cache results with expiration
- Invalidate cache on data updates
- Implement graceful fallback if cache fails
- Monitor calculation performance

---

### 7. Data Import Validation

**Question**: How should imported historical data be validated?

**Validation Requirements**:
- Data format correctness
- Islamic compliance (positive Zakat amounts, valid dates)
- Relationship integrity
- Encryption compatibility

**Decision**: **Multi-stage validation with rollback**

**Validation Stages**:
1. **Format Validation**: CSV structure, required fields present
2. **Type Validation**: Numeric fields are numbers, dates are valid
3. **Business Rule Validation**: Amounts positive, dates reasonable
4. **Islamic Compliance**: Zakat amounts match calculation rules
5. **Relationship Validation**: Referenced entities exist
6. **Encryption**: Data encrypted before storage

**Approach**:
- Parse CSV with papaparse
- Validate each row, collect all errors
- Show preview with validation results
- User confirms before final import
- Use database transaction for atomicity
- Rollback on any failure

**Implementation Notes**:
- Validate Islamic calendar dates using hijri-converter
- Check Zakat calculation accuracy (within 0.1% tolerance)
- Verify asset breakdown sums to total wealth
- Encrypt sensitive fields before insertion
- Log import operations for audit

---

## Technology Stack Summary

### New Dependencies
```json
{
  "dependencies": {
    "recharts": "^2.10.0",              // Analytics visualizations
    "hijri-converter": "^2.0.4",        // Gregorian ↔ Hijri conversion
    "date-fns-jalali": "^3.0.0",        // Jalali/Persian calendar (Hijri-like)
    "jspdf": "^2.5.1",                  // PDF generation
    "jspdf-autotable": "^3.8.0",        // PDF tables
    "papaparse": "^5.4.1"               // CSV parsing/generation
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"       // TypeScript definitions
  }
}
```

### Database Requirements
- Add indexes for userId + date combinations
- Add AnalyticsMetric table for caching
- Ensure sufficient storage for historical encrypted data

### Performance Targets
- Dashboard load: <2 seconds
- Historical query: <500ms
- PDF generation: <3 seconds
- CSV export: <2 seconds for 50 years of data
- Analytics calculation: <1 second per metric

---

## Implementation Priorities

1. **Phase 1**: Core tracking (snapshots, basic queries)
2. **Phase 2**: Payment recording and tracking
3. **Phase 3**: Analytics calculations and dashboard
4. **Phase 4**: Visualization components
5. **Phase 5**: Export functionality (CSV, PDF, JSON)
6. **Phase 6**: Import functionality with validation

## Risk Assessment

### Low Risk
- ✅ Analytics visualization (proven libraries)
- ✅ CSV export (standard format)
- ✅ Database queries (indexed, tested patterns)

### Medium Risk
- ⚠️ PDF generation with Arabic text (requires testing)
- ⚠️ Islamic calendar accuracy (requires validation)
- ⚠️ Import validation complexity (needs thorough testing)

### Mitigation Strategies
- Test PDF with Arabic text early
- Validate Hijri conversions against known dates
- Comprehensive import validation test suite
- User preview before final import
- Clear error messages for validation failures

---

**Status**: ✅ All research complete  
**Next**: Proceed to Phase 1 (Design & Contracts)
