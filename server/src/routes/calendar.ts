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
