import * as React from "react"
import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { RemoveConfirmation } from "./RemoveConfirmation"

export type EntryCardProps = {
  title: React.ReactNode
  index?: number
  children: React.ReactNode
  onRemove?: () => void
  removeLabel?: string
  removeDescription?: React.ReactNode
  confirmRemove?: boolean
  className?: string
  headerAction?: React.ReactNode
}

export function EntryCard({
  title,
  index,
  children,
  onRemove,
  removeLabel = "Remove entry",
  removeDescription,
  confirmRemove = true,
  className,
  headerAction,
}: EntryCardProps) {
  const [removeOpen, setRemoveOpen] = React.useState(false)
  const remove = () => (confirmRemove ? setRemoveOpen(true) : onRemove?.())

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="border-b">
        <CardTitle>{index === undefined ? title : <span className="flex items-center gap-2"><span className="text-muted-foreground">{index + 1}.</span>{title}</span>}</CardTitle>
        <CardAction className="flex items-center gap-1">
          {headerAction}
          {onRemove && <Button type="button" variant="ghost" size="icon-sm" aria-label={removeLabel} title={removeLabel} onClick={remove}><Trash2Icon className="text-destructive" /></Button>}
        </CardAction>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
      {onRemove && <RemoveConfirmation open={removeOpen} onOpenChange={setRemoveOpen} onConfirm={() => { setRemoveOpen(false); onRemove() }} title={<>Remove {title}?</>} description={removeDescription ?? "This entry will be removed from your resume."} />}
    </Card>
  )
}
