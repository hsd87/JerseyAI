import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Group, Image, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import EditorSidebar from './editor-sidebar';
import EditorControls from './editor-controls';
import { Button } from '@/components/ui/button';
import { EditorProvider, useEditorStore } from './editor-store';

// Types for selectable items
export type ItemConfig = {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  rotation: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  // Image properties
  src?: string;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
};

// Predefined zones for the jersey
export type JerseyZone = {
  id: string;
  name: string;
  x: number;
  y: number;
  side: 'front' | 'back';
};

const JerseyEditor = () => {
  return (
    <EditorProvider>
      <JerseyEditorContent />
    </EditorProvider>
  );
};

const JerseyEditorContent = () => {
  const {
    items,
    selectedItemId,
    currentView,
    setCurrentView,
    selectItem,
    updateItem,
    frontImage,
    backImage
  } = useEditorStore();
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  
  // Size settings
  const canvasWidth = 480;
  const canvasHeight = 480;

  // Load front and back jersey images
  const [frontImageObj] = useImage(frontImage || '');
  const [backImageObj] = useImage(backImage || '');
  
  // Predefined zones on the jersey
  const jerseyZones: JerseyZone[] = [
    { id: 'chest-left', name: 'Left Chest', x: canvasWidth * 0.3, y: canvasHeight * 0.3, side: 'front' },
    { id: 'chest-right', name: 'Right Chest', x: canvasWidth * 0.7, y: canvasHeight * 0.3, side: 'front' },
    { id: 'center-front', name: 'Center Front', x: canvasWidth * 0.5, y: canvasHeight * 0.4, side: 'front' },
    { id: 'back-name', name: 'Back Name', x: canvasWidth * 0.5, y: canvasHeight * 0.25, side: 'back' },
    { id: 'back-number', name: 'Back Number', x: canvasWidth * 0.5, y: canvasHeight * 0.5, side: 'back' },
  ];
  
  // When clicking on the canvas, deselect if clicking empty space
  const handleCanvasClick = (e: any) => {
    if (e.target === e.currentTarget) {
      selectItem(null);
    }
  };
  
  // Update the transformer when selection changes
  useEffect(() => {
    if (!selectedItemId || !transformerRef.current) return;
    
    const selectedNode = stageRef.current?.findOne('#' + selectedItemId);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer().batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedItemId]);

  // Toggle between front and back views
  const toggleView = () => {
    setCurrentView(currentView === 'front' ? 'back' : 'front');
  };
  
  // Export canvas as an image
  const exportImage = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ 
        pixelRatio: 2, // Higher quality
      });
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `jersey-${currentView}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full gap-4 p-4">
      {/* Left sidebar with controls */}
      <div className="w-full md:w-1/4">
        <EditorSidebar 
          onExport={exportImage} 
          currentView={currentView}
          onToggleView={toggleView}
        />
      </div>
      
      {/* Main canvas */}
      <div className="w-full md:w-2/4 flex justify-center">
        <div className="border border-gray-300 rounded-lg shadow-sm bg-white">
          <div className="p-2 bg-gray-50 rounded-t-lg border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium">Jersey Editor - {currentView === 'front' ? 'Front View' : 'Back View'}</h3>
            <Button 
              variant="outline"
              size="sm"
              onClick={toggleView}
            >
              Switch to {currentView === 'front' ? 'Back' : 'Front'}
            </Button>
          </div>
          
          <div className="p-4">
            <Stage 
              width={canvasWidth} 
              height={canvasHeight} 
              ref={stageRef}
              onClick={handleCanvasClick}
              onTap={handleCanvasClick}
            >
              <Layer>
                {/* Background jersey image */}
                <Image 
                  image={currentView === 'front' ? frontImageObj : backImageObj} 
                  width={canvasWidth}
                  height={canvasHeight}
                  x={0}
                  y={0}
                />
                
                {/* Render all items (text and images) */}
                {items
                  .filter(item => 
                    (item.type === 'text' && ((currentView === 'front' && !item.text?.includes('BACK')) || 
                                             (currentView === 'back' && item.text?.includes('BACK')))) ||
                    item.type === 'image'
                  )
                  .map(item => (
                    <SelectableItem 
                      key={item.id} 
                      item={item} 
                      isSelected={item.id === selectedItemId}
                      onChange={(newAttrs: any) => {
                        updateItem(item.id, newAttrs);
                      }}
                      onSelect={() => selectItem(item.id)}
                    />
                  ))
                }
                
                {/* Transformer for selected items */}
                <Transformer 
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize to stage dimensions
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
      
      {/* Right sidebar with item properties */}
      <div className="w-full md:w-1/4">
        <EditorControls 
          selectedItemId={selectedItemId}
          jerseyZones={jerseyZones.filter(zone => zone.side === currentView)}
        />
      </div>
    </div>
  );
};

// Component for selectable and editable items (text or images)
const SelectableItem = ({ item, isSelected, onChange, onSelect }: { 
  item: ItemConfig, 
  isSelected: boolean,
  onChange: (newAttrs: any) => void,
  onSelect: () => void
}) => {
  // If it's a text item
  if (item.type === 'text') {
    return (
      <Text
        id={item.id}
        x={item.x}
        y={item.y}
        text={item.text || ''}
        fontSize={item.fontSize || 20}
        fontFamily={item.fontFamily || 'Arial'}
        fill={item.fill || '#000000'}
        draggable
        rotation={item.rotation || 0}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            // Update font size proportionally
            fontSize: item.fontSize * node.scaleX(),
          });
        }}
      />
    );
  }
  
  // If it's an image item
  if (item.type === 'image') {
    const [image] = useImage(item.src || '');
    return (
      <Group
        id={item.id}
        x={item.x}
        y={item.y}
        draggable
        rotation={item.rotation || 0}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX,
            scaleY,
          });
        }}
      >
        <Image
          image={image}
          width={item.width || 100}
          height={item.height || 100}
          scaleX={item.scaleX || 1}
          scaleY={item.scaleY || 1}
        />
      </Group>
    );
  }
  
  return null;
};

export default JerseyEditor;