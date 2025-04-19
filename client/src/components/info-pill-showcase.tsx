import React from "react";
import { InfoRect } from "@/components/ui/info-rect";
import { Info, Lightbulb, Zap } from "lucide-react";

export function InfoPillShowcase() {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold mb-4">InfoRect Component Showcase</h2>
      
      {/* Basic Example */}
      <InfoRect title="How the AI Works">
        <ol className="list-decimal pl-5 space-y-2">
          <li>Input your sport type, colors, and preferences</li>
          <li>Our AI crafts custom designs based on your input</li>
          <li>View multiple design options in seconds</li>
          <li>Fine-tune and customize with our editor</li>
        </ol>
      </InfoRect>
      
      {/* With Icon */}
      <InfoRect title="Design Tips" icon={<Lightbulb className="text-yellow-500" />}>
        <p className="mb-2">
          For the best results, consider these professional design tips:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Choose contrasting colors for better visibility</li>
          <li>Keep text elements minimal and readable</li>
          <li>Consider your team's identity and values</li>
        </ul>
      </InfoRect>
      
      {/* Dark Variant */}
      <InfoRect title="Pro Features" variant="dark" icon={<Zap className="text-yellow-400" />}>
        <div className="space-y-2">
          <p>Upgrade to Pro to unlock these premium features:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
            <div className="flex items-start">
              <span className="inline-block mr-2">✓</span>
              <span>Unlimited design exports</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block mr-2">✓</span>
              <span>Priority AI processing</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block mr-2">✓</span>
              <span>Team collaboration tools</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block mr-2">✓</span>
              <span>Bulk order discounts</span>
            </div>
          </div>
        </div>
      </InfoRect>
      
      {/* Information Alert */}
      <InfoRect 
        title="Important Information" 
        icon={<Info className="text-blue-500" />}
        className="border border-blue-100 bg-blue-50"
        titleClassName="text-blue-700"
      >
        <p>
          Orders placed before 2pm EST will be processed the same day.
          Please allow 2-3 business days for shipping within the continental US.
        </p>
      </InfoRect>
    </div>
  );
}