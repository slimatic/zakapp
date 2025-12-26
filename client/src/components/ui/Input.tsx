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