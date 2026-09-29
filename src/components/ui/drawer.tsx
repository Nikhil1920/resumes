import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Swipe-to-dismiss sheet built on Base UI's Drawer. Bottom sheets are the
 * mobile pattern for pickers and previews; right-side drawers serve tablets.
 * Both respect the device safe areas so they clear notches and home bars.
 */
function Drawer({ swipeDirection = "down", ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" swipeDirection={swipeDirection} {...props} />
}

function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

type DrawerSide = "bottom" | "right"

const popupSide: Record<DrawerSide, string> = {
  bottom:
    "w-full max-h-[calc(100dvh-env(safe-area-inset-top,0px)-1.5rem)] rounded-t-2xl border-t [transform:translateY(var(--drawer-swipe-movement-y))] data-starting-style:[transform:translateY(calc(100%+2px))] data-ending-style:[transform:translateY(calc(100%+2px))]",
  right:
    "h-full w-[min(26rem,calc(100vw-2rem))] border-l [transform:translateX(var(--drawer-swipe-movement-x))] data-starting-style:[transform:translateX(calc(100%+2px))] data-ending-style:[transform:translateX(calc(100%+2px))]",
}

function DrawerContent({
  side = "bottom",
  className,
  children,
  showHandle = side === "bottom",
  ...props
}: DrawerPrimitive.Popup.Props & { side?: DrawerSide; showHandle?: boolean }) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        data-slot="drawer-backdrop"
        className="fixed inset-0 z-50 min-h-dvh bg-foreground/25 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*350ms)] supports-backdrop-filter:backdrop-blur-[2px] dark:bg-black/60"
      />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className={cn("fixed inset-0 z-50 flex", side === "bottom" ? "items-end justify-center" : "items-stretch justify-end")}
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          data-side={side}
          className={cn(
            "relative flex min-h-0 flex-col overflow-hidden border-border bg-background text-foreground shadow-lift outline-none transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:duration-[calc(var(--drawer-swipe-strength)*350ms)]",
            popupSide[side],
            className,
          )}
          {...props}
        >
          {showHandle && (
            <div className="flex shrink-0 justify-center pt-2.5 pb-1" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>
          )}
          {children}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

function DrawerHeader({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<"div"> & { showClose?: boolean }) {
  return (
    <div data-slot="drawer-header" className={cn("flex shrink-0 items-start gap-3 px-4 pt-2 pb-3 sm:px-5", className)} {...props}>
      <div className="min-w-0 flex-1">{children}</div>
      {showClose && (
        <DrawerPrimitive.Close
          render={<Button variant="ghost" size="icon" className="-mt-1 -mr-1.5 text-muted-foreground" aria-label="Close" />}
        >
          <XIcon />
        </DrawerPrimitive.Close>
      )}
    </div>
  )
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return <DrawerPrimitive.Title data-slot="drawer-title" className={cn("font-heading text-base font-semibold tracking-tight", className)} {...props} />
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return <DrawerPrimitive.Description data-slot="drawer-description" className={cn("mt-0.5 text-sm text-muted-foreground", className)} {...props} />
}

/** Scrollable body. `data-base-ui-swipe-ignore` keeps horizontal scrollers usable. */
function DrawerBody({ className, ...props }: DrawerPrimitive.Content.Props) {
  return (
    <DrawerPrimitive.Content
      data-slot="drawer-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-5", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("flex shrink-0 gap-2 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-5", className)}
      {...props}
    />
  )
}

export { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger }
