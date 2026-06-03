import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type LoaderVariant = "page" | "section" | "inline";

type LoaderProps = {
  label?: string;
  variant?: LoaderVariant;
  className?: string;
};

const variantClasses: Record<LoaderVariant, string> = {
  page: "grid h-dvh place-items-center bg-background",
  section: "grid min-h-48 place-items-center rounded-md border border-border bg-card",
  inline: "inline-flex items-center gap-2",
};

const iconClasses: Record<LoaderVariant, string> = {
  page: "size-7",
  section: "size-6",
  inline: "size-4",
};

function Loader({
  label = "Loading",
  variant = "section",
  className,
}: LoaderProps) {
  const isInline = variant === "inline";

  return (
    <div
      className={cn(
        variantClasses[variant],
        isInline ? "text-current" : "text-muted-foreground",
        className,
      )}
      role="status"
      aria-live={isInline ? "polite" : "assertive"}
    >
      <span className={cn("flex items-center gap-2", isInline ? "" : "text-sm font-semibold")}>
        <LoaderCircle aria-hidden="true" className={cn("animate-spin", iconClasses[variant])} />
        <span>{label}</span>
      </span>
    </div>
  );
}

export { Loader };
