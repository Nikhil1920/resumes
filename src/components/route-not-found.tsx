import { Link } from "@tanstack/react-router"
import { Compass } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/** Friendly fallback for unmatched routes. */
export function RouteNotFound() {
  return (
    <div className="flex min-h-[50svh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Compass aria-hidden="true" className="size-8 text-muted-foreground" />
          <CardTitle>Page not found</CardTitle>
          <CardDescription>
            We couldn't find the page you were looking for. Your resumes are safe
            on this device.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link to="/" className={buttonVariants({ variant: "outline" })}>
            Back to resumes
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
