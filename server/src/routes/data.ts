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

import express from 'express';
import { DataController } from '../controllers/DataController';

const router = express.Router();
const dataController = new DataController();

// Data management routes
router.post('/export', dataController.exportData.bind(dataController));
router.post('/import', dataController.importData.bind(dataController));
router.post('/backup', dataController.createBackup.bind(dataController));
router.get('/backups', dataController.listBackups.bind(dataController));
router.post('/restore/:id', dataController.restoreBackup.bind(dataController));

export default router;