/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Admin action audit.
 *
 * WHY THIS EXISTS
 *   Deleting a user, deactivating one, changing a role, changing limits or
 *   replacing SMTP settings left no record of who did it. `AuditTrailEntry` was
 *   only ever written for nisab-year-record changes, so an operator reviewing an
 *   incident had nothing to read.
 *
 * WHAT IT WRITES
 *   The existing table, with the acting admin as `userId` and the target plus the
 *   before/after values in the encrypted `changesSummary`. No new model.
 *
 * FAILURE POLICY
 *   A failed audit write is logged and swallowed. It must never roll back or fail
 *   the admin action that already happened — but it is logged at error level
 *   because a silently missing trail is the thing this module exists to prevent.
 */

import { prisma } from '../utils/prisma';
import { EncryptionService } from './EncryptionService';
import { getEncryptionKey } from '../config/security';
import { Logger } from '../utils/logger';

const logger = new Logger('AdminAudit');

export type AdminAuditEvent =
    | 'ADMIN_USER_DELETED'
    | 'ADMIN_ROLE_CHANGED'
    | 'ADMIN_STATUS_CHANGED'
    | 'ADMIN_LIMITS_CHANGED'
    | 'ADMIN_SETTINGS_CHANGED';

export const recordAdminEvent = async (params: {
    actorId: string;
    eventType: AdminAuditEvent;
    targetId?: string | null;
    summary: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
}): Promise<void> => {
    try {
        const changesSummary = await EncryptionService.encryptObject(
            { targetId: params.targetId ?? null, ...params.summary },
            getEncryptionKey()
        );

        await prisma.auditTrailEntry.create({
            data: {
                userId: params.actorId,
                eventType: params.eventType,
                changesSummary,
                ipAddress: params.ipAddress ?? null,
                userAgent: params.userAgent ?? null
            }
        });
    } catch (error) {
        logger.error(`Failed to record ${params.eventType} by ${params.actorId}`, error);
    }
};
