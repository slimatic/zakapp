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

import * as React from "react"
import { Lock } from "lucide-react"
import { cn } from "../../lib/utils"

interface EncryptedBadgeProps {
    className?: string
}

export function EncryptedBadge({ className }: EncryptedBadgeProps) {
    return (
        <div
            className={cn("flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-100", className)}
            title="Data is encrypted on your device using AES-256 before saving."
        >
            <Lock className="w-3 h-3" />
            <span>Encrypted on Device</span>
        </div>
    )
}
