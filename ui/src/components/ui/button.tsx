import * as React from "react"

import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline: "border-border hover:bg-input/50 hover:text-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-muted hover:text-foreground",
  destructive:
    "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
  link: "text-primary underline-offset-4 hover:underline",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-7 gap-1 px-2 text-xs",
  xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem]",
  sm: "h-6 gap-1 px-2 text-xs",
  lg: "h-8 gap-1 px-2.5 text-xs",
  icon: "size-7",
  "icon-xs": "size-5 rounded-sm",
  "icon-sm": "size-6",
  "icon-lg": "size-8",
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> &
  {
    variant?: ButtonVariant
    size?: ButtonSize
  }) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-transparent font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

export { Button }
