import { useState, useRef, useEffect } from "react";
import { useDesignStore } from "@/hooks/use-design-store";
import { useReplicate } from "@/hooks/use-replicate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomizationData } from "@shared/schema";
import { 
  X, Save, ShoppingCart, Undo, Download, Image, Type, Hash, Move, Plus, 
  RotateCcw, RotateCw, Maximize, Minimize, Circle, TextCursorInput
} from "lucide-react";
import { useLocation } from "wouter";

type TextElement = {
  id: string;
  content: string;
  position: { x: number; y: number };
  color: string;
  size: string;
  font: string;
  fontSize: number;
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;
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
  const [currentFontSize, setCurrentFontSize] = useState(24);
  const [currentOutline, setCurrentOutline] = useState(false);
  const [currentOutlineColor, setCurrentOutlineColor] = useState("#000000");
  const [currentOutlineWidth, setCurrentOutlineWidth] = useState(1);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoElements, setLogoElements] = useState<{id: string, url: string, position: {x: number, y: number}, size: {width: number, height: number}, rotation: number, maintainAspectRatio: boolean}[]>([]);
  
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
      font: currentFont,
      fontSize: currentFontSize,
      outline: currentOutline,
      outlineColor: currentOutlineColor,
      outlineWidth: currentOutlineWidth
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
        font: newElement.font,
        fontSize: newElement.fontSize,
        outline: newElement.outline,
        outlineColor: newElement.outlineColor,
        outlineWidth: newElement.outlineWidth
      }]
    };
    
    updateCustomizations(updatedCustomizations);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    // Read the file and convert to data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      
      const logoImageUrl = event.target.result as string;
      
      // Create a new logo element
      const newLogo = {
        id: `logo-${Date.now()}`,
        url: logoImageUrl,
        position: { x: 50, y: 50 }, // Center of the canvas
        size: { width: 100, height: 100 }, // Default size
        rotation: 0,
        maintainAspectRatio: true
      };
      
      setLogoElements([...logoElements, newLogo]);
      
      // Update customizations store
      const updatedCustomizations: CustomizationData = {
        ...customizations,
        logos: [...(customizations.logos || []), {
          url: newLogo.url,
          position: newLogo.position,
          size: newLogo.size,
          rotation: newLogo.rotation,
          maintainAspectRatio: newLogo.maintainAspectRatio
        }]
      };
      
      updateCustomizations(updatedCustomizations);
    };
    
    reader.readAsDataURL(file);
    
    // Reset the input so the same file can be uploaded again
    e.target.value = '';
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

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, elementId: string) => {
    // Don't preventDefault for mouse events as it prevents focus
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    
    setActiveElement(elementId);
    
    // Common handler for both mouse and touch moves
    const updateElementPosition = (clientX: number, clientY: number) => {
      if (!canvasRef.current) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = ((clientX - canvasRect.left) / canvasRect.width) * 100;
      const y = ((clientY - canvasRect.top) / canvasRect.height) * 100;
      
      // Clamp values to ensure elements stay within bounds (5-95%)
      const clampedX = Math.max(5, Math.min(95, x));
      const clampedY = Math.max(5, Math.min(95, y));
      
      // Check if the element is a text element
      if (elementId.startsWith('text-')) {
        // Update position of the dragged text element
        setTextElements(prev => prev.map(el => {
          if (el.id === elementId) {
            return { ...el, position: { x: clampedX, y: clampedY } };
          }
          return el;
        }));
      } 
      // Check if element is a logo
      else if (elementId.startsWith('logo-')) {
        // Update position of the dragged logo element
        setLogoElements(prev => prev.map(el => {
          if (el.id === elementId) {
            return { ...el, position: { x: clampedX, y: clampedY } };
          }
          return el;
        }));
      }
    };
    
    // Handler for saving positions
    const finishDrag = () => {
      setActiveElement(null);
      
      // Get the type of element being dragged
      const isLogoElement = elementId.startsWith('logo-');
      
      if (isLogoElement) {
        // Update logo positions in the customizations store
        const updatedLogos = logoElements.map(el => ({
          url: el.url,
          position: el.position,
          size: el.size,
          rotation: el.rotation || 0,
          maintainAspectRatio: el.maintainAspectRatio || true
        }));
        
        updateCustomizations({
          ...customizations,
          logos: updatedLogos
        });
      } else {
        // Update text positions in the customizations store
        const updatedText = textElements.map(el => ({
          content: el.content,
          position: el.position,
          color: el.color,
          size: el.size,
          font: el.font,
          fontSize: el.fontSize || 24,
          outline: el.outline || false,
          outlineColor: el.outlineColor || "#000000",
          outlineWidth: el.outlineWidth || 1
        }));
        
        updateCustomizations({
          ...customizations,
          text: updatedText
        });
      }
    };
    
    // Mouse event handlers
    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateElementPosition(moveEvent.clientX, moveEvent.clientY);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      finishDrag();
    };
    
    // Touch event handlers
    const handleTouchMove = (touchEvent: TouchEvent) => {
      touchEvent.preventDefault(); // Prevent scrolling while dragging
      const touch = touchEvent.touches[0];
      updateElementPosition(touch.clientX, touch.clientY);
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      finishDrag();
    };
    
    // Add the appropriate event listeners based on event type
    if (e.type === 'touchstart') {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    } else {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
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
      <div className="bg-white rounded-lg shadow-sm p-5 sm:p-8 border border-gray-200">
        <div className="text-center">
          <img 
            src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop" 
            alt="Soccer Jersey Design" 
            className="mx-auto rounded-lg w-full max-w-lg h-auto object-cover mb-4 sm:mb-6" 
          />
          
          <h2 className="text-xl sm:text-2xl font-sora font-semibold mb-2 text-gray-800">Ready to create your dream kit?</h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto mb-6 sm:mb-8">
            Fill out the design form and let our AI generate a custom jersey based on your preferences. Then customize with your logo, name, and number.
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <i className="fas fa-tshirt mr-1"></i> 5 Sports
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <i className="fas fa-palette mr-1"></i> Custom Colors
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <i className="fas fa-bolt mr-1"></i> AI-Generated
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
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
              {frontImage && (
                <div className="relative w-full h-full">
                  <img 
                    src={frontImage} 
                    alt={`${formData.sport} jersey front view`}
                    className="absolute top-0 left-0 w-full h-full object-contain"
                  />
                  <div className="absolute text-center w-full bottom-2">
                    <span className="inline-flex items-center gap-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      <Move className="h-3 w-3" /> Drag elements to position
                    </span>
                  </div>
                </div>
              )}
              
              {/* Draggable Text Elements */}
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
                    fontSize: element.fontSize ? `${element.fontSize}px` : (element.size === 'small' ? '1rem' : element.size === 'medium' ? '1.5rem' : '2rem'),
                    fontFamily: element.font,
                    textShadow: element.outline ? `
                      -${element.outlineWidth || 1}px -${element.outlineWidth || 1}px 0 ${element.outlineColor || '#000'}, 
                      ${element.outlineWidth || 1}px -${element.outlineWidth || 1}px 0 ${element.outlineColor || '#000'}, 
                      -${element.outlineWidth || 1}px ${element.outlineWidth || 1}px 0 ${element.outlineColor || '#000'}, 
                      ${element.outlineWidth || 1}px ${element.outlineWidth || 1}px 0 ${element.outlineColor || '#000'}
                    ` : 'none',
                    fontWeight: element.size === 'large' ? 'bold' : 'normal'
                  }}
                  onMouseDown={(e) => handleDragStart(e, element.id)}
                  onTouchStart={(e) => handleDragStart(e, element.id)}
                >
                  {element.content}
                </div>
              ))}
              
              {/* Draggable Logo Elements */}
              {logoElements.map((logo) => (
                <div
                  key={logo.id}
                  className={`absolute cursor-grab ${activeElement === logo.id ? 'cursor-grabbing z-30' : 'z-20'}`}
                  style={{
                    top: `${logo.position.y}%`,
                    left: `${logo.position.x}%`,
                    transform: `translate(-50%, -50%) rotate(${logo.rotation || 0}deg)`,
                    border: activeElement === logo.id ? '2px dashed #39FF14' : '2px dashed transparent',
                    width: `${logo.size.width}px`,
                    height: logo.maintainAspectRatio ? 'auto' : `${logo.size.height}px`,
                    borderRadius: '0.25rem'
                  }}
                  onMouseDown={(e) => handleDragStart(e, logo.id)}
                  onTouchStart={(e) => handleDragStart(e, logo.id)}
                >
                  <img 
                    src={logo.url} 
                    alt="Uploaded logo" 
                    className="w-full h-auto object-contain"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%'
                    }}
                  />
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
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  className="text-xs flex items-center justify-center rounded-md h-10"
                >
                  <Type className="h-4 w-4 mr-1" /> Text
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="text-xs flex items-center justify-center rounded-md h-10"
                >
                  <Hash className="h-4 w-4 mr-1" /> Number
                </Button>
                <label className="inline-block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div 
                    className="text-xs flex items-center justify-center rounded-md h-10 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium px-4 py-2"
                  >
                    <Image className="h-4 w-4 mr-1" /> Logo
                  </div>
                </label>
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
                    <SelectContent className="z-[100] max-h-[300px] overflow-y-auto">
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Impact">Impact</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                      <SelectItem value="Oswald">Oswald</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Raleway">Raleway</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Bebas Neue">Bebas Neue</SelectItem>
                      <SelectItem value="Teko">Teko</SelectItem>
                      <SelectItem value="Anton">Anton</SelectItem>
                      <SelectItem value="Barlow">Barlow</SelectItem>
                      <SelectItem value="Russo One">Russo One</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                      <SelectItem value="Jost">Jost</SelectItem>
                      <SelectItem value="Orbitron">Orbitron</SelectItem>
                      <SelectItem value="Staatliches">Staatliches</SelectItem>
                      <SelectItem value="Racing Sans One">Racing Sans One</SelectItem>
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
                
                {/* Font Size Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs text-gray-600">Font Size</label>
                    <span className="text-xs text-gray-500">{currentFontSize}px</span>
                  </div>
                  <Slider 
                    value={[currentFontSize]} 
                    min={12} 
                    max={72} 
                    step={1}
                    onValueChange={(value) => setCurrentFontSize(value[0])}
                    className="py-1"
                  />
                </div>
                
                {/* Text Outline Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600">Text Outline</label>
                    <Switch 
                      checked={currentOutline}
                      onCheckedChange={setCurrentOutline}
                    />
                  </div>
                  
                  {currentOutline && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Outline Color</label>
                        <Input 
                          type="color" 
                          className="w-full h-9 px-1 border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary" 
                          value={currentOutlineColor}
                          onChange={(e) => setCurrentOutlineColor(e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs text-gray-600">Outline Width</label>
                          <span className="text-xs text-gray-500">{currentOutlineWidth}px</span>
                        </div>
                        <Slider 
                          value={[currentOutlineWidth]} 
                          min={1} 
                          max={5} 
                          step={0.5}
                          onValueChange={(value) => setCurrentOutlineWidth(value[0])}
                          className="py-1"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <Button 
                  size="sm"
                  className="w-full bg-primary text-white px-4 py-2 rounded-full text-sm h-9 mt-3"
                  onClick={handleAddText}
                >
                  Add Text to Jersey
                </Button>
              </div>
            </div>
            
            {/* Logo Settings */}
            {logoElements.length > 0 && (
              <div className="mb-5">
                <h3 className="font-medium text-sm text-gray-700 mb-2">Logo Settings</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex flex-wrap gap-2">
                      {logoElements.map((logo) => (
                        <div 
                          key={logo.id}
                          className={`w-16 h-16 border rounded-md flex items-center justify-center overflow-hidden cursor-pointer ${
                            activeElement === logo.id ? 'border-primary border-2' : 'border-gray-200'
                          }`}
                          onClick={() => setActiveElement(logo.id)}
                        >
                          <img 
                            src={logo.url} 
                            alt="Logo thumbnail" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      ))}
                      <label className="w-16 h-16 border border-dashed border-gray-200 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <Plus className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-400 mt-1">Add New</span>
                      </label>
                    </div>
                    
                    {activeElement && activeElement.startsWith('logo-') && (
                      <div className="mt-2 space-y-3">
                        {/* Logo Size Controls */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs text-gray-600">Width</label>
                            <span className="text-xs text-gray-500">
                              {logoElements.find(logo => logo.id === activeElement)?.size.width}px
                            </span>
                          </div>
                          <Slider 
                            value={[logoElements.find(logo => logo.id === activeElement)?.size.width || 100]} 
                            min={20} 
                            max={300} 
                            step={5}
                            onValueChange={(value) => {
                              setLogoElements(prev => prev.map(logo => {
                                if (logo.id === activeElement) {
                                  const aspectRatio = logo.size.height / logo.size.width;
                                  const newWidth = value[0];
                                  const newHeight = logo.maintainAspectRatio ? Math.round(newWidth * aspectRatio) : logo.size.height;
                                  
                                  return {
                                    ...logo,
                                    size: {
                                      width: newWidth,
                                      height: newHeight
                                    }
                                  };
                                }
                                return logo;
                              }));
                            }}
                            className="py-1"
                          />
                        </div>
                        
                        {/* Height control (only visible if not maintaining aspect ratio) */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-gray-600">Maintain Aspect Ratio</label>
                            <Switch 
                              checked={logoElements.find(logo => logo.id === activeElement)?.maintainAspectRatio || true}
                              onCheckedChange={(checked) => {
                                setLogoElements(prev => prev.map(logo => {
                                  if (logo.id === activeElement) {
                                    return {
                                      ...logo,
                                      maintainAspectRatio: checked
                                    };
                                  }
                                  return logo;
                                }));
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Rotation Control */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs text-gray-600">Rotation</label>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setLogoElements(prev => prev.map(logo => {
                                    if (logo.id === activeElement) {
                                      return {
                                        ...logo,
                                        rotation: ((logo.rotation || 0) - 90) % 360
                                      };
                                    }
                                    return logo;
                                  }));
                                }}
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                              <span className="text-xs text-gray-500">
                                {logoElements.find(logo => logo.id === activeElement)?.rotation || 0}°
                              </span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setLogoElements(prev => prev.map(logo => {
                                    if (logo.id === activeElement) {
                                      return {
                                        ...logo,
                                        rotation: ((logo.rotation || 0) + 90) % 360
                                      };
                                    }
                                    return logo;
                                  }));
                                }}
                              >
                                <RotateCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <Slider 
                            value={[logoElements.find(logo => logo.id === activeElement)?.rotation || 0]} 
                            min={0} 
                            max={360} 
                            step={5}
                            onValueChange={(value) => {
                              setLogoElements(prev => prev.map(logo => {
                                if (logo.id === activeElement) {
                                  return {
                                    ...logo,
                                    rotation: value[0]
                                  };
                                }
                                return logo;
                              }));
                            }}
                            className="py-1"
                          />
                        </div>
                        
                        {/* Delete Button */}
                        <Button 
                          variant="destructive"
                          size="sm"
                          className="text-xs h-8 w-full mt-2"
                          onClick={() => {
                            const newLogoElements = logoElements.filter(logo => logo.id !== activeElement);
                            setLogoElements(newLogoElements);
                            setActiveElement(null);
                            
                            const updatedLogos = newLogoElements.map(el => ({
                              url: el.url,
                              position: el.position,
                              size: el.size,
                              rotation: el.rotation || 0,
                              maintainAspectRatio: el.maintainAspectRatio || true
                            }));
                            
                            updateCustomizations({
                              ...customizations,
                              logos: updatedLogos
                            });
                          }}
                        >
                          Remove Selected Logo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
          <ShoppingCart className="mr-2 h-4 w-4" /> Configure Order
        </Button>
      </div>
    </div>
  );
}