import React from "react";
import { cn } from "@/lib/utils";

export interface InfoPillProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Title of the info pill
   */
  title: string;
  
  /**
   * Optional icon to display next to the title
   */
  icon?: React.ReactNode;
  
  /**
   * Visual variant of the pill
   */
  variant?: "light" | "dark";
  
  /**
   * Custom class name for the info pill wrapper
   */
  className?: string;
  
  /**
   * Custom class name for the title
   */
  titleClassName?: string;
  
  /**
   * Custom class name for the content
   */
  contentClassName?: string;
}

/**
 * InfoPill component - A pill-shaped informational container
 * 
 * @example
 * ```tsx
 * <InfoPill title="How the AI Works">
 *   <ol className="list-decimal pl-5 space-y-2">
 *     <li>Input your sport type, colors, and preferences</li>
 *     <li>Our AI crafts custom designs based on your input</li>
 *     <li>View multiple design options in seconds</li>
 *     <li>Fine-tune and customize with our editor</li>
 *   </ol>
 * </InfoPill>
 * ```
 */
export function InfoPill({
  title,
  icon,
  variant = "light",
  className,
  titleClassName,
  contentClassName,
  children,
  ...props
}: InfoPillProps) {
  // Determine background color based on variant
  const bgColor = variant === "light" ? "bg-gray-50" : "bg-slate-800";
  const textColor = variant === "light" ? "text-gray-700" : "text-gray-100";
  const headerColor = variant === "light" ? "text-gray-900" : "text-white";

  return (
    <section
      className={cn(
        "rounded-xl px-6 py-4 md:px-10 md:py-6",
        bgColor,
        "shadow-sm",
        "max-w-2xl mx-auto",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className={cn("font-medium text-lg", headerColor, titleClassName)}>
          {title}
        </h3>
      </div>
      <div className={cn("text-sm md:text-base", textColor, contentClassName)}>
        {children}
      </div>
    </section>
  );
}