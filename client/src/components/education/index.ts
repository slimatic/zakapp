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