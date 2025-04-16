import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, RotateCcw, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DesignResultsProps {
  urls: { front: string; back: string };
  designId: number;
}

export default function DesignResults({ urls, designId }: DesignResultsProps) {
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  
  const handleToggleView = () => {
    setActiveView(activeView === 'front' ? 'back' : 'front');
  };
  
  const handleGenerateNew = () => {
    // This will trigger a new design generation
    document.getElementById('generateButton')?.click();
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative h-[450px] bg-gray-50 flex items-center justify-center">
          <img 
            src={activeView === 'front' ? urls.front : urls.back} 
            alt={`${activeView} view of generated jersey`} 
            className="object-contain h-full max-w-full" 
          />
          
          {/* View toggle controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 text-white rounded-full px-3 py-1.5 text-sm">
            <button 
              onClick={handleToggleView}
              className="flex items-center text-xs font-medium"
            >
              {activeView === 'front' ? 'View Back' : 'View Front'}
              {activeView === 'front' ? <ArrowRight className="h-3 w-3 ml-1" /> : <ArrowLeft className="h-3 w-3 ml-1" />}
            </button>
          </div>
          
          {/* Top-right indicators */}
          <div className="absolute top-3 right-3 flex gap-2">
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-md">
              Design #{designId}
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Custom Kit Design</h3>
              <p className="text-sm text-gray-500">{activeView.charAt(0).toUpperCase() + activeView.slice(1)} View</p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleView}
            >
              {activeView === 'front' ? 'Show Back' : 'Show Front'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
