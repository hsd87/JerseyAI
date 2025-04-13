import { useState, useRef, useEffect } from "react";
import { useDesignStore } from "@/hooks/use-design-store";
import { useReplicate } from "@/hooks/use-replicate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomizationData } from "@shared/schema";
import { X, Save, ShoppingCart, Undo, Download, Image, Type, Hash, Move } from "lucide-react";
import { useLocation } from "wouter";

type TextElement = {
  id: string;
  content: string;
  position: { x: number; y: number };
  color: string;
  size: string;
  font: string;
};

export default function DesignEditor() {
  const { 
    isGenerating, 
    hasGenerated, 
    frontImage, 
    backImage,
    customizations,
    updateCustomizations,
    formData
  } = useDesignStore();
  const { saveCustomizations, isSaving } = useReplicate();
  const [_, navigate] = useLocation();
  
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [currentColor, setCurrentColor] = useState("#FFFFFF");
  const [currentSize, setCurrentSize] = useState("medium");
  const [currentFont, setCurrentFont] = useState("Arial");
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Determine aspect ratio based on sport
  let aspectRatio = "1/1";
  if (formData.sport === "soccer" || formData.sport === "basketball") {
    aspectRatio = "3/4"; // Taller jerseys
  } else if (formData.sport === "esports") {
    aspectRatio = "4/3"; // Wider jerseys
  }

  const handleAddText = () => {
    if (!currentText.trim()) return;
    
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      content: currentText,
      position: { x: 50, y: 50 }, // Center of the canvas
      color: currentColor,
      size: currentSize,
      font: currentFont
    };
    
    setTextElements([...textElements, newElement]);
    setCurrentText("");
    
    // Update customizations store
    const updatedCustomizations: CustomizationData = {
      ...customizations,
      text: [...(customizations.text || []), {
        content: newElement.content,
        position: newElement.position,
        color: newElement.color,
        size: newElement.size,
        font: newElement.font
      }]
    };
    
    updateCustomizations(updatedCustomizations);
  };

  const handleSaveDesign = async () => {
    try {
      await saveCustomizations(customizations);
    } catch (error) {
      console.error("Error saving customizations:", error);
    }
  };

  const handleGenerateNew = () => {
    // This will trigger a new design generation
    document.getElementById('generateButton')?.click();
  };

  const handleProceedToOrder = () => {
    navigate('/checkout');
  };

  const handleDragStart = (e: React.MouseEvent, elementId: string) => {
    setActiveElement(elementId);
    
    // Store initial position for drag calculation
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = ((moveEvent.clientX - canvasRect.left) / canvasRect.width) * 100;
      const y = ((moveEvent.clientY - canvasRect.top) / canvasRect.height) * 100;
      
      // Update position of the dragged element
      setTextElements(prev => prev.map(el => {
        if (el.id === elementId) {
          return { ...el, position: { x, y } };
        }
        return el;
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setActiveElement(null);
      
      // Update customizations store with new positions
      const updatedText = textElements.map(el => ({
        content: el.content,
        position: el.position,
        color: el.color,
        size: el.size,
        font: el.font
      }));
      
      updateCustomizations({
        ...customizations,
        text: updatedText
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Loading or initial state
  if (isGenerating) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-5 sm:p-8 border border-gray-200 text-center">
          <div className="flex flex-col items-center space-y-5">
            <div className="rounded-xl bg-gray-100 h-48 sm:h-64 w-full animate-pulse"></div>
            
            <div className="flex justify-center mt-2">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                <span className="text-sm font-medium text-gray-700">Generating your design</span>
              </div>
            </div>
            
            <div className="text-base sm:text-lg font-sora text-gray-800">
              Your kit design is being generated...
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              Our AI is creating a unique design based on your preferences. This typically takes 20-30 seconds.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 w-full mt-2">
              <div className="h-2 bg-gray-200 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-2 bg-gray-200 rounded-full w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No generation yet
  if (!hasGenerated) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <div className="text-center">
          <img 
            src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop" 
            alt="Soccer Jersey Design" 
            className="mx-auto rounded-lg w-full max-w-lg h-auto object-cover mb-6" 
          />
          
          <h2 className="text-2xl font-sora font-semibold mb-2">Ready to create your dream kit?</h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-8">
            Fill out the design form and let our AI generate a custom jersey based on your preferences. Then customize with your logo, name, and number.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <i className="fas fa-tshirt mr-1"></i> 5 Sports
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <i className="fas fa-palette mr-1"></i> Custom Colors
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <i className="fas fa-bolt mr-1"></i> AI-Generated
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <i className="fas fa-users mr-1"></i> Team Orders
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Design generated - show combined editor
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Editor Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3">
        <h2 className="text-base sm:text-lg font-sora font-medium text-gray-800">
          {formData.sport.charAt(0).toUpperCase() + formData.sport.slice(1)} Jersey Designer
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSaveDesign}
            className="text-xs h-8 rounded-full"
            disabled={isSaving}
          >
            <Save className="h-3 w-3 mr-1" /> Save Design
          </Button>
        </div>
      </div>
      
      {/* Editor Body */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Canvas Area - Combined View */}
        <div className="p-3 sm:p-4 flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-2xl">
            <div 
              ref={canvasRef}
              className="editor-container w-full relative rounded-lg overflow-hidden bg-white shadow-sm border border-gray-300"
              style={{ 
                aspectRatio: aspectRatio,
                maxHeight: '600px' 
              }}
            >
              {/* Combined Jersey Image */}
              {frontImage && backImage && (
                <div className="relative w-full h-full">
                  <img 
                    src={frontImage} 
                    alt={`${formData.sport} jersey combined view`}
                    className="absolute top-0 left-0 w-full h-full object-contain"
                  />
                  <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    Front View
                  </div>
                  <div className="absolute text-center w-full bottom-2">
                    <span className="inline-flex items-center gap-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      <Move className="h-3 w-3" /> Drag elements to position
                    </span>
                  </div>
                </div>
              )}
              
              {/* Draggable Elements */}
              {textElements.map((element) => (
                <div 
                  key={element.id}
                  className={`absolute cursor-grab ${activeElement === element.id ? 'cursor-grabbing z-30' : 'z-20'}`}
                  style={{
                    top: `${element.position.y}%`,
                    left: `${element.position.x}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '0.25rem 0.5rem',
                    border: activeElement === element.id ? '2px dashed #39FF14' : '2px dashed transparent',
                    borderRadius: '0.25rem',
                    color: element.color,
                    fontSize: element.size === 'small' ? '1rem' : element.size === 'medium' ? '1.5rem' : '2rem',
                    fontFamily: element.font
                  }}
                  onMouseDown={(e) => handleDragStart(e, element.id)}
                >
                  {element.content}
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap justify-between gap-2 mt-4">
              <div className="text-xs text-gray-500">
                Sport: {formData.sport.charAt(0).toUpperCase() + formData.sport.slice(1)}
                {formData.patternStyle && ` • Pattern: ${formData.patternStyle}`}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-8 rounded-full"
                >
                  <Download className="h-3 w-3 mr-1" /> Export
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tools Panel - Now below the image as requested */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <div className="max-w-2xl mx-auto">
            {/* Add Elements Section */}
            <div className="mb-5">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Add Elements</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  className="text-xs flex items-center rounded-full h-8"
                >
                  <Type className="h-3 w-3 mr-1" /> Text
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="text-xs flex items-center rounded-full h-8"
                >
                  <Hash className="h-3 w-3 mr-1" /> Number
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="text-xs flex items-center rounded-full h-8"
                >
                  <Image className="h-3 w-3 mr-1" /> Logo
                </Button>
              </div>
            </div>
            
            {/* Text Tool Settings */}
            <div className="mb-5">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Text Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Text Content</label>
                  <Input 
                    type="text" 
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary" 
                    placeholder="Enter text" 
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Font</label>
                  <Select value={currentFont} onValueChange={setCurrentFont}>
                    <SelectTrigger className="w-full text-xs h-9">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Impact">Impact</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Color</label>
                    <Input 
                      type="color" 
                      className="w-full h-9 px-1 border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary" 
                      value={currentColor}
                      onChange={(e) => setCurrentColor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Size</label>
                    <Select value={currentSize} onValueChange={setCurrentSize}>
                      <SelectTrigger className="w-full text-xs h-9">
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  size="sm"
                  className="w-full bg-primary text-white px-4 py-2 rounded-full text-sm h-9"
                  onClick={handleAddText}
                >
                  Add Text to Jersey
                </Button>
              </div>
            </div>
            
            {/* Help Section */}
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Click and drag elements to position them • Use pinch gestures to zoom on mobile
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Editor Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 flex justify-between sm:justify-end">
        <Button 
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-medium"
          onClick={handleProceedToOrder}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Proceed to Order
        </Button>
      </div>
    </div>
  );
}