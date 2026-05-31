import * as React from "react"

import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border-border bg-input/20 text-foreground",
  ghost: "text-muted-foreground",
  link: "text-primary underline-offset-4",
}

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: BadgeVariant
}) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-medium whitespace-nowrap",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
