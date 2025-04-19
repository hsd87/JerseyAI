import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Nike-style badges are minimal, often with no border-radius or just very slight rounding
const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2 py-0.5 text-xs font-medium uppercase tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--nike-black)] text-white",
        secondary:
          "border-transparent bg-[var(--nike-gray-light)] text-[var(--nike-black)]",
        destructive:
          "border-transparent bg-[var(--nike-red)] text-white",
        outline: 
          "border-[var(--nike-gray-medium)] bg-transparent text-[var(--nike-black)]",
        brand: 
          "border-transparent bg-[var(--nike-accent)] text-white",
        success: 
          "border-transparent bg-green-600 text-white",
        info: 
          "border-transparent bg-[var(--nike-black)] text-white",
        warning: 
          "border-transparent bg-amber-500 text-white",
        sale:
          "border-transparent bg-[var(--nike-red)] text-white",
        new:
          "border-transparent bg-[var(--nike-black)] text-white",
      },
      shape: {
        default: "",
        square: "rounded-none",
        pill: "rounded-full",
      },
      size: {
        default: "h-5 px-2 py-0.5 text-xs",
        sm: "h-4 px-1.5 py-0 text-[10px]",
        lg: "h-6 px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "square",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shape, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, shape, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
