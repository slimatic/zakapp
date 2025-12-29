/**
 * Copyright (c) 2024 ZakApp Contributors
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

/**
 * Education Components Index
 * 
 * Exports all educational components for Islamic Zakat learning.
 * 
 * Constitutional Compliance:
 * - Islamic Compliance: All components based on authentic Islamic sources
 * - User-Centric Design: Comprehensive educational resources
 * - Transparency & Trust: Clear, scholarly-backed content
 * - Lovable UI/UX: Engaging and interactive learning experience
 */

// Main educational components
export { default as MethodologyEducation } from './MethodologyEducation';
export { default as ZakatGuide } from './ZakatGuide';
export { default as NisabThresholdEducation } from './NisabThresholdEducation';

// Export types for better TypeScript support
export type { 
  MethodologyEducationContent,
  MethodologyInfo 
} from './MethodologyEducation';

// Re-export common component dependencies
export { LoadingSpinner } from '../common/LoadingSpinner';
export { ErrorMessage } from '../common/ErrorMessage';