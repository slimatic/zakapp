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


import express from 'express';
import encryptionRoutes from './encryption';
import usersRoutes from './users';
import statsRoutes from './stats';
import settingsRoutes from './settings';
import systemRoutes from './system';

const router = express.Router();

router.use('/encryption', encryptionRoutes);
router.use('/users', usersRoutes);
router.use('/stats', statsRoutes);
router.use('/settings', settingsRoutes);
router.use('/system', systemRoutes);

export default router;
