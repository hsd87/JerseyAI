import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-black text-white",
        secondary:
          "border-transparent bg-gray-100 text-black",
        destructive:
          "border-transparent bg-red-100 text-red-800",
        outline: "border-[#E5E7EB] bg-white text-[#0A0A0A]",
        brand: "border-transparent bg-[#E34234] text-white",
        success: "border-transparent bg-green-100 text-green-800",
        info: "border-transparent bg-blue-100 text-blue-800",
        warning: "border-transparent bg-yellow-100 text-yellow-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
