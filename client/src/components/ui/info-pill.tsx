import React from "react";
import { cn } from "@/lib/utils";

export interface InfoPillProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Title of the info box
   */
  title: string;
  
  /**
   * Optional icon to display next to the title
   */
  icon?: React.ReactNode;
  
  /**
   * Visual variant of the box
   */
  variant?: "light" | "dark";
  
  /**
   * Custom class name for the info box wrapper
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
 * InfoPill component - A minimally rounded rectangular information container
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
        "rounded-[1px] px-4 py-3 md:px-5 md:py-4",
        bgColor,
        "shadow-sm border border-gray-200",
        "max-w-2xl mx-auto",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-sm">{icon}</span>}
        <h3 className={cn("font-medium text-sm", headerColor, titleClassName)}>
          {title}
        </h3>
      </div>
      <div className={cn("text-xs md:text-sm", textColor, contentClassName)}>
        {children}
      </div>
    </section>
  );
}