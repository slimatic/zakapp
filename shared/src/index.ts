/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Re-export core shared modules
// Note: avoid re-exporting the entire `types` barrel to prevent directory-style imports
// Export types and other modules explicitly (use .js suffix to guide emitted ESM imports)
// NOTE: avoid re-exporting the entire `types` directory to prevent directory-style imports
// which Node ESM rejects at runtime. Re-export specific type barrels instead below.
export * from './constants.js';
export * from './validation.js';
// Re-export specific typed barrels so consumers can import named types
export * from './types/tracking.js';

// Re-export commonly consumed tracking types explicitly so consumers can import them
export type {
	AnalyticsMetric,
	AnalyticsMetricType,
	VisualizationType,
	YearlySnapshot,
	CreateYearlySnapshotDto,
	UpdateYearlySnapshotDto,
	SnapshotStatus,
	NisabType,
	YearlySnapshotMethodology,
	PaymentRecord,
	CreatePaymentRecordDto,
	PaymentStatus,
	PaymentMethod,
	RecipientCategory,
	RecipientType,
	ReminderEvent,
	ReminderEventType,
	ReminderPriority,
	ReminderStatus,
	AnnualSummary,
	RecipientSummary,
	ComparativeAnalysis,
	PaginationParams,
	PaginationResult,
	SnapshotComparisonRequest,
	SnapshotComparisonResult,
} from './types/tracking.js';

// Re-export frequently consumed types from the primary `types` barrel as type-only exports
// Type-only exports are elided at runtime and avoid generating directory-style imports
export type {
	Asset,
	AssetCalculation,
	AssetCategoryType,
	ZakatCalculation,
	ZakatCalculationRequest,
	ZakatCalculationResult,
	MethodologyInfo,
	MethodologyConfig,
	CreateMethodologyConfig,
	CalculationSnapshot,
	CalculationSnapshotDetail,
	CreateCalculationSnapshotRequest,
	NisabInfo,
} from './coreTypes.js';

// Nisab year record related types
export type {
	RecordStatus,
	NisabBasis,
	NisabYearRecord,
	NisabYearRecordWithLiveTracking,
	CreateNisabYearRecordDto,
	UpdateNisabYearRecordDto,
	FinalizeRecordDto,
	UnlockRecordDto,
	LiveTrackingData,
} from './types/nisabYearRecord';

// Audit and Hawl types
export type { AuditTrailEntry, AuditEventType, CreateAuditTrailEntryDto } from './types/auditTrail';
export type { HawlTrackingState, HawlStatus, LiveHawlData, HawlInterruptionEvent } from './types/hawl';

// Misc calculation and methodology types from the main types barrel
export type {
	ZakatMethodology,
	UpdateMethodologyConfig,
	// Export SnapshotComparison alias expected by some consumers
	SnapshotComparison,
	SnapshotAssetValue,
	MethodologyComparisonRequest,
	MethodologyComparison,
	CalendarCalculation,
	CalculationBreakdown,
	AlternativeCalculation,
} from './coreTypes.js';
// Import-export utilities added in improve-import-export
export * from './schemas.js';
export * from './utils/stableId.js';
export * from './utils/deterministicJson.js';
export * from './utils/checksum.js';
