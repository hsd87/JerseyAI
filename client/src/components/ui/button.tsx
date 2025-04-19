import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-nike-black text-white hover:bg-[#333]",
        destructive:
          "bg-nike-red text-white hover:opacity-90",
        outline:
          "border border-nike-grayMedium bg-white text-nike-black hover:bg-[rgba(0,0,0,0.04)]",
        secondary:
          "bg-nike-grayLight text-nike-black hover:bg-[#E5E5E5]",
        ghost: "hover:bg-[rgba(0,0,0,0.04)] text-nike-black",
        link: "text-nike-black underline-offset-4 hover:underline p-0 h-auto",
        accent: "bg-nike-accent text-white hover:opacity-90",
      },
      size: {
        default: "h-10 px-6 py-0",
        sm: "h-8 px-4 py-0 text-xs",
        lg: "h-12 px-8 py-0 text-base",
        xl: "h-14 px-10 py-0 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
