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
