/**
 * Validation Middleware Exports
 * Wraps ValidationMiddleware.ts for cleaner imports
 */

import { handleValidationErrors } from './ValidationMiddleware';

export { handleValidationErrors };
export const validationMiddleware = { handleValidationErrors };
