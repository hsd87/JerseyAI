import { useState, useRef } from "react";
import { useDesignStore } from "@/hooks/use-design-store";
import { useReplicate } from "@/hooks/use-replicate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomizationData } from "@shared/schema";
import { X, Save, ShoppingCart } from "lucide-react";

type TextElement = {
  id: string;
  content: string;
  position: { x: number; y: number };
  color: string;
  size: string;
  font: string;
};

export default function KitEditor() {
  const { 
    isEditorOpen, 
    toggleEditor, 
    frontImage, 
    backImage,
    currentView,
    setCurrentView,
    customizations,
    updateCustomizations
  } = useDesignStore();
  const { saveCustomizations, isSaving } = useReplicate();
  
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [currentColor, setCurrentColor] = useState("#FFFFFF");
  const [currentSize, setCurrentSize] = useState("medium");
  const [currentFont, setCurrentFont] = useState("Arial");
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    toggleEditor(false);
  };

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
      toggleEditor(false);
    } catch (error) {
      console.error("Error saving customizations:", error);
    }
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

  // Only render if editor is open
  if (!isEditorOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 w-full max-w-6xl">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Editor Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-sora font-medium">Customize Your Kit</h2>
            <button 
              type="button" 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Editor Body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Tools Panel */}
            <div className="p-6 border-r border-gray-200">
              <div className="mb-6">
                <h3 className="font-medium mb-3">Tools</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    className="bg-[#39FF14] text-black px-3 py-2 hover:bg-opacity-80"
                  >
                    <i className="fas fa-font mr-2"></i> Add Text
                  </Button>
                  <Button variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                    <i className="fas fa-image mr-2"></i> Add Logo
                  </Button>
                  <Button variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                    <i className="fas fa-hashtag mr-2"></i> Add Number
                  </Button>
                </div>
              </div>
              
              {/* Text Tool Settings */}
              <div className="mb-6 border-t border-gray-200 pt-4">
                <h3 className="font-medium mb-3">Text Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Name/Text</label>
                    <Input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                      placeholder="Enter text" 
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Font</label>
                    <Select value={currentFont} onValueChange={setCurrentFont}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Impact">Impact</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Color</label>
                      <Input 
                        type="color" 
                        className="w-full h-10 px-3 border border-gray-300 rounded-md" 
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Size</label>
                      <Select value={currentSize} onValueChange={setCurrentSize}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-black text-white px-3 py-2 rounded-md text-sm"
                    onClick={handleAddText}
                  >
                    Apply Text
                  </Button>
                </div>
              </div>
              
              {/* View Controls */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium mb-3">View</h3>
                <div className="flex gap-2">
                  <Button 
                    className={`px-4 py-2 rounded-md text-sm flex-1 ${currentView === 'front' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    onClick={() => setCurrentView('front')}
                  >
                    Front
                  </Button>
                  <Button 
                    className={`px-4 py-2 rounded-md text-sm flex-1 ${currentView === 'back' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    onClick={() => setCurrentView('back')}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Canvas Area */}
            <div className="lg:col-span-2 p-4 flex items-center justify-center bg-gray-50">
              <div 
                ref={canvasRef}
                className="editor-container w-full h-[600px] relative rounded-lg overflow-hidden"
              >
                {/* Jersey Background */}
                <img 
                  src={currentView === 'front' ? frontImage : backImage} 
                  alt={`Editable jersey ${currentView} view`}
                  className="w-full h-full object-contain"
                />
                
                {/* Draggable Elements */}
                {textElements.map((element) => (
                  <div 
                    key={element.id}
                    className={`absolute cursor-grab ${activeElement === element.id ? 'cursor-grabbing' : ''}`}
                    style={{
                      top: `${element.position.y}%`,
                      left: `${element.position.x}%`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      padding: '0.5rem 1rem',
                      border: '2px dashed #ccc',
                      color: element.color,
                      fontSize: element.size === 'small' ? '1rem' : element.size === 'medium' ? '1.5rem' : '2rem',
                      fontFamily: element.font
                    }}
                    onMouseDown={(e) => handleDragStart(e, element.id)}
                  >
                    {element.content}
                  </div>
                ))}
                
                {/* Canvas Controls */}
                <div className="absolute bottom-4 right-4 bg-white rounded-md shadow-md p-2 flex space-x-2">
                  <button className="p-2 text-gray-600 hover:text-gray-900">
                    <i className="fas fa-search-plus"></i>
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-900">
                    <i className="fas fa-search-minus"></i>
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-900">
                    <i className="fas fa-undo"></i>
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-900">
                    <i className="fas fa-redo"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Editor Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            <Button 
              variant="outline"
              onClick={handleClose}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={handleSaveDesign}
                disabled={isSaving}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Save className="mr-2 h-4 w-4" /> Save Design
              </Button>
              <Button 
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800"
              >
                <ShoppingCart className="mr-2 h-4 w-4" /> Continue to Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
