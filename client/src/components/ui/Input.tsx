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
import { cn } from "../../lib/utils"
import { EncryptedBadge } from "./EncryptedBadge"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  dataTestId?: string
  isEncrypted?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, dataTestId, isEncrypted, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center">
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
            >
              {label}
            </label>
          )}
          {isEncrypted && <EncryptedBadge />}
        </div>
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm hover:border-primary-200",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          data-testid={dataTestId}
          onWheel={(e) => {
            if (type === 'number') {
              e.currentTarget.blur();
            }
          }}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-red-500 animate-slide-up">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }