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

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { ExportController } from '../controllers/ExportController';

const router = Router();
const exportController = new ExportController();

// All export routes require authentication
router.use(authMiddleware);

// Export routes
router.post('/full', exportController.full.bind(exportController));
router.post('/assets', exportController.assets.bind(exportController));
router.post('/zakat-history', exportController.zakatHistory.bind(exportController));
router.post('/payments', exportController.payments.bind(exportController));
router.get('/templates', exportController.templates.bind(exportController));
router.post('/custom', exportController.custom.bind(exportController));
router.get('/status/:exportId', exportController.status.bind(exportController));
router.get('/download/:exportId', exportController.download.bind(exportController));
router.delete('/:exportId', exportController.delete.bind(exportController));

export default router;