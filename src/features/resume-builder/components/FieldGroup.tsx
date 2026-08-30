import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type FieldGroupProps = React.ComponentProps<"div"> & {
  label?: React.ReactNode
  htmlFor?: string
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
}

export function FieldGroup({ label, htmlFor, hint, error, required, className, children, ...props }: FieldGroupProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {label && <Label htmlFor={htmlFor}>{label}{required && <span className="text-destructive" aria-hidden="true"> *</span>}</Label>}
      {children}
      {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export type FieldGridProps = React.ComponentProps<"div"> & {
  columns?: 1 | 2 | 3 | 4
}

export function FieldGrid({ columns = 2, className, ...props }: FieldGridProps) {
  const columnsClass = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" }[columns]
  return <div className={cn("grid gap-4", columnsClass, className)} {...props} />
}
