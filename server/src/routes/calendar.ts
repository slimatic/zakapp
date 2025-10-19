/**
 * Calendar Routes - Hijri/Gregorian conversion and Zakat year calculations
 * 
 * Implements API contracts from specs/004-zakat-calculation-complete/contracts/calendar.yaml
 */

import express from 'express';
import { authenticate } from '../middleware/AuthMiddleware';
import {
  convertDate,
  calculateZakatYear,
  getCalendarPreference,
  updateCalendarPreference
} from '../controllers/calendarController';

const router = express.Router();

// All calendar routes require authentication
router.post('/convert', authenticate, convertDate);
router.post('/zakat-year', authenticate, calculateZakatYear);

// User calendar preference routes
router.get('/preference', authenticate, getCalendarPreference);
router.put('/preference', authenticate, updateCalendarPreference);

export default router;
