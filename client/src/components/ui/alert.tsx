import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Nike uses minimal, clean alerts with less rounded corners and subtle borders
const alertVariants = cva(
  "relative w-full border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-[var(--nike-gray-light)] text-[var(--nike-black)] border-transparent",
        destructive:
          "border-transparent bg-[#FEECEB] text-[var(--nike-red)] [&>svg]:text-[var(--nike-red)]",
        success:
          "border-transparent bg-[#EDFCF2] text-[#006837] [&>svg]:text-[#006837]",
        warning:
          "border-transparent bg-[#FFF8E7] text-[#995C00] [&>svg]:text-[#995C00]",
        info:
          "border-transparent bg-[#E6F3FF] text-[#0066E0] [&>svg]:text-[#0066E0]",
        accent:
          "border-transparent bg-[#F5413D10] text-[var(--nike-accent)] [&>svg]:text-[var(--nike-accent)]",
      },
      shape: {
        default: "",
        square: "rounded-none",
        rounded: "rounded-lg", 
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "square",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, shape, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant, shape }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1.5 font-medium leading-none tracking-nike-tight text-current", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-normal font-nike", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
