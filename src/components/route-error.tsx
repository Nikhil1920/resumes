import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type RouteErrorProps = {
  error: unknown
  reset: () => void
  /** Optional app-specific destination. Kept as a callback so this stays router-agnostic. */
  onBack?: () => void
  backLabel?: string
}

type ErrorWithStatus = { status?: number; message?: string }

function getErrorDetails(error: unknown): ErrorWithStatus {
  if (typeof error === "object" && error !== null) {
    const candidate = error as ErrorWithStatus
    return {
      status: typeof candidate.status === "number" ? candidate.status : undefined,
      message: typeof candidate.message === "string" ? candidate.message : undefined,
    }
  }
  return {}
}

/** Friendly, privacy-conscious fallback for route loaders and render failures. */
export function RouteError({ error, reset, onBack, backLabel = "Back to resumes" }: RouteErrorProps) {
  const { status, message } = getErrorDetails(error)
  const title = status === 404 ? "Page not found" : "Something went wrong"
  const description =
    status === 404
      ? "The resume page you requested is no longer available."
      : message || "Your resume is safe locally. Try again, or return to your resumes."

  return (
    <div className="flex min-h-[50svh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <TriangleAlert aria-hidden="true" className="size-8 text-destructive" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center gap-2">
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
          {onBack ? (
            <Button variant="ghost" onClick={onBack}>
              {backLabel}
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
}
