import { useState, useEffect } from 'react';
import { 
  Trash2, 
  MoveHorizontal, 
  RotateCw,
  Type,
  LucideImage
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { useEditorStore } from './editor-store';
import { JerseyZone } from './index';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditorControlsProps {
  selectedItemId: string | null;
  jerseyZones: JerseyZone[];
}

const EditorControls = ({ selectedItemId, jerseyZones }: EditorControlsProps) => {
  const { items, updateItem, deleteItem } = useEditorStore();
  const [rotation, setRotation] = useState(0);
  // Text properties
  const [fontSize, setFontSize] = useState(24);
  const [textValue, setTextValue] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [outlineWidth, setOutlineWidth] = useState(0);
  const [hasOutline, setHasOutline] = useState(false);
  // Image properties
  const [imageWidth, setImageWidth] = useState(100);
  const [imageHeight, setImageHeight] = useState(100);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  
  // Available font families (expanded to 20+ fonts)
  const fontFamilies = [
    'Arial', 
    'Verdana', 
    'Helvetica', 
    'Tahoma', 
    'Times New Roman', 
    'Georgia', 
    'Impact', 
    'Courier New',
    'Trebuchet MS',
    'Arial Black',
    'Comic Sans MS',
    'Lucida Sans',
    'Palatino Linotype',
    'Book Antiqua',
    'Garamond',
    'Lucida Console',
    'Franklin Gothic Medium',
    'Century Gothic',
    'Copperplate',
    'Optima',
    'Brush Script MT',
    'Futura',
    'Rockwell',
    'Segoe UI'
  ];
  
  // Find the selected item
  const selectedItem = items.find(item => item.id === selectedItemId);
  
  // Update local state when selected item changes
  useEffect(() => {
    if (selectedItem) {
      setRotation(selectedItem.rotation);
      
      if (selectedItem.type === 'text') {
        setFontSize(selectedItem.fontSize || 24);
        setTextValue(selectedItem.text || '');
        setTextColor(selectedItem.fill || '#000000');
        setFontFamily(selectedItem.fontFamily || 'Arial');
        
        // Update outline state
        setOutlineColor(selectedItem.stroke || '#000000');
        setOutlineWidth(selectedItem.strokeWidth || 0);
        setHasOutline(!!selectedItem.strokeWidth);
      } 
      else if (selectedItem.type === 'image') {
        // Update image state
        setImageWidth(selectedItem.width || 100);
        setImageHeight(selectedItem.height || 100);
        setScaleX(selectedItem.scaleX || 1);
        setScaleY(selectedItem.scaleY || 1);
        
        // If the scales match, maintain aspect ratio is likely enabled
        setMaintainAspectRatio(selectedItem.scaleX === selectedItem.scaleY);
      }
    }
  }, [selectedItem]);
  
  // No selected item, no controls
  if (!selectedItem) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
        Select an item to edit its properties
      </div>
    );
  }
  
  const handleRotationChange = (value: number[]) => {
    const newRotation = value[0];
    setRotation(newRotation);
    updateItem(selectedItem.id, { rotation: newRotation });
  };
  
  const handleFontSizeChange = (value: number[]) => {
    if (selectedItem.type !== 'text') return;
    const newSize = value[0];
    setFontSize(newSize);
    updateItem(selectedItem.id, { fontSize: newSize });
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedItem.type !== 'text') return;
    const newText = e.target.value;
    setTextValue(newText);
    updateItem(selectedItem.id, { text: newText });
  };
  
  const handleColorChange = (color: string) => {
    if (selectedItem.type !== 'text') return;
    setTextColor(color);
    updateItem(selectedItem.id, { fill: color });
  };
  
  const handleWidthChange = (value: number[]) => {
    if (selectedItem.type !== 'image') return;
    const newWidth = value[0];
    setImageWidth(newWidth);
    
    // If maintaining aspect ratio, adjust height proportionally
    if (maintainAspectRatio) {
      const aspectRatio = imageHeight / imageWidth;
      const newHeight = Math.round(newWidth * aspectRatio);
      setImageHeight(newHeight);
      updateItem(selectedItem.id, { width: newWidth, height: newHeight });
    } else {
      updateItem(selectedItem.id, { width: newWidth });
    }
  };
  
  const handleHeightChange = (value: number[]) => {
    if (selectedItem.type !== 'image') return;
    const newHeight = value[0];
    setImageHeight(newHeight);
    
    // If maintaining aspect ratio, adjust width proportionally
    if (maintainAspectRatio) {
      const aspectRatio = imageWidth / imageHeight;
      const newWidth = Math.round(newHeight * aspectRatio);
      setImageWidth(newWidth);
      updateItem(selectedItem.id, { width: newWidth, height: newHeight });
    } else {
      updateItem(selectedItem.id, { height: newHeight });
    }
  };
  
  const handleScaleChange = (axis: 'x' | 'y', value: number[]) => {
    if (selectedItem.type !== 'image') return;
    const newScale = value[0];
    
    if (axis === 'x') {
      setScaleX(newScale);
      
      if (maintainAspectRatio) {
        setScaleY(newScale);
        updateItem(selectedItem.id, { scaleX: newScale, scaleY: newScale });
      } else {
        updateItem(selectedItem.id, { scaleX: newScale });
      }
    } else {
      setScaleY(newScale);
      
      if (maintainAspectRatio) {
        setScaleX(newScale);
        updateItem(selectedItem.id, { scaleX: newScale, scaleY: newScale });
      } else {
        updateItem(selectedItem.id, { scaleY: newScale });
      }
    }
  };
  
  const handleDelete = () => {
    if (selectedItemId) {
      deleteItem(selectedItemId);
    }
  };
  
  const handleMoveToZone = (zone: JerseyZone) => {
    if (selectedItemId) {
      updateItem(selectedItemId, { x: zone.x, y: zone.y });
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          {selectedItem.type === 'text' ? (
            <span className="flex items-center gap-1">
              <Type className="h-4 w-4" /> Text
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <img src={selectedItem.src} alt="Selected" className="h-5 w-5 object-contain" /> Image
            </span>
          )}
        </h3>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          className="h-8"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </div>
      
      {selectedItem.type === 'text' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="text-control">Text</Label>
            <Input
              id="text-control"
              value={textValue}
              onChange={handleTextChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Style</Label>
            <Select 
              value={fontFamily} 
              onValueChange={(value) => {
                setFontFamily(value);
                updateItem(selectedItem.id, { fontFamily: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map(font => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="font-size-control">Font Size: {fontSize}px</Label>
            <Slider
              id="font-size-control"
              value={[fontSize]}
              max={72}
              min={10}
              step={1}
              onValueChange={handleFontSizeChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Text Color</Label>
            <ColorPicker color={textColor} onChange={handleColorChange} />
          </div>
          
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <Label htmlFor="has-outline">Text Outline</Label>
              <input
                type="checkbox"
                id="has-outline"
                checked={hasOutline}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHasOutline(checked);
                  if (checked) {
                    updateItem(selectedItem.id, { 
                      stroke: outlineColor, 
                      strokeWidth: outlineWidth || 1 
                    });
                  } else {
                    updateItem(selectedItem.id, { 
                      stroke: undefined, 
                      strokeWidth: 0 
                    });
                  }
                }}
                className="h-4 w-4"
              />
            </div>
            
            {hasOutline && (
              <>
                <div className="space-y-2 mt-2">
                  <Label>Outline Color</Label>
                  <ColorPicker 
                    color={outlineColor} 
                    onChange={(color) => {
                      setOutlineColor(color);
                      updateItem(selectedItem.id, { stroke: color });
                    }} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="outline-width">Outline Width: {outlineWidth}px</Label>
                  <Slider
                    id="outline-width"
                    value={[outlineWidth]}
                    max={5}
                    min={0}
                    step={0.5}
                    onValueChange={(value) => {
                      const width = value[0];
                      setOutlineWidth(width);
                      updateItem(selectedItem.id, { strokeWidth: width });
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}
      
      {selectedItem.type === 'image' && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maintain-aspect-ratio">Maintain Aspect Ratio</Label>
              <input
                type="checkbox"
                id="maintain-aspect-ratio"
                checked={maintainAspectRatio}
                onChange={(e) => {
                  setMaintainAspectRatio(e.target.checked);
                }}
                className="h-4 w-4"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image-width">Width: {imageWidth}px</Label>
            <Slider
              id="image-width"
              value={[imageWidth]}
              max={500}
              min={20}
              step={1}
              onValueChange={handleWidthChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image-height">Height: {imageHeight}px</Label>
            <Slider
              id="image-height"
              value={[imageHeight]}
              max={500}
              min={20}
              step={1}
              onValueChange={handleHeightChange}
            />
          </div>
          
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Label>Scale</Label>
            <div className="space-y-2">
              <Label htmlFor="scale-x">Horizontal Scale: {scaleX.toFixed(1)}x</Label>
              <Slider
                id="scale-x"
                value={[scaleX]}
                max={3}
                min={0.1}
                step={0.1}
                onValueChange={(value) => handleScaleChange('x', value)}
              />
            </div>
            
            {!maintainAspectRatio && (
              <div className="space-y-2">
                <Label htmlFor="scale-y">Vertical Scale: {scaleY.toFixed(1)}x</Label>
                <Slider
                  id="scale-y"
                  value={[scaleY]}
                  max={3}
                  min={0.1}
                  step={0.1}
                  onValueChange={(value) => handleScaleChange('y', value)}
                />
              </div>
            )}
          </div>
        </>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="rotation-control">Rotation: {rotation}°</Label>
        <Slider
          id="rotation-control"
          value={[rotation]}
          max={360}
          min={0}
          step={1}
          onValueChange={handleRotationChange}
        />
      </div>
      
      <div className="space-y-2 border-t border-gray-200 pt-4">
        <Label className="flex items-center gap-1">
          <MoveHorizontal className="h-4 w-4" /> Quick Position
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {jerseyZones.map(zone => (
            <Button
              key={zone.id}
              variant="outline"
              size="sm"
              onClick={() => handleMoveToZone(zone)}
              className="text-xs"
            >
              {zone.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorControls;