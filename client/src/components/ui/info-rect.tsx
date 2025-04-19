import React from "react";
import { cn } from "@/lib/utils";

export interface InfoRectProps extends React.HTMLAttributes<HTMLDivElement> {
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
 * InfoRect component - A minimally rounded rectangular information container
 * 
 * @example
 * ```tsx
 * <InfoRect title="How the AI Works">
 *   <ol className="list-decimal pl-5 space-y-2">
 *     <li>Input your sport type, colors, and preferences</li>
 *     <li>Our AI crafts custom designs based on your input</li>
 *     <li>View multiple design options in seconds</li>
 *     <li>Fine-tune and customize with our editor</li>
 *   </ol>
 * </InfoRect>
 * ```
 */
export function InfoRect({
  title,
  icon,
  variant = "light",
  className,
  titleClassName,
  contentClassName,
  children,
  ...props
}: InfoRectProps) {
  // Determine background color based on variant
  const bgColor = variant === "light" ? "bg-[#F9F9F9]" : "bg-[#0A0A0A]";
  const textColor = variant === "light" ? "text-[#4B5563]" : "text-[#F9F9F9]";
  const headerColor = variant === "light" ? "text-[#0A0A0A]" : "text-white";
  const borderColor = variant === "light" ? "border-[#E5E7EB]" : "border-gray-700";

  return (
    <section
      className={cn(
        "rounded-3xl px-5 py-4 md:px-6 md:py-5",
        bgColor,
        `shadow-sm border ${borderColor}`,
        "max-w-2xl mx-auto",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon && <span className="text-base">{icon}</span>}
        <h3 className={cn("font-semibold tracking-tight", headerColor, titleClassName)}>
          {title}
        </h3>
      </div>
      <div className={cn("text-sm md:text-base leading-relaxed", textColor, contentClassName)}>
        {children}
      </div>
    </section>
  );
}