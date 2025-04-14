import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image, Group, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import { useEditorStore } from './editor-store';
import EditorSidebar from './editor-sidebar';
import EditorControls from './editor-controls';

// Types
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
  // Text outline properties
  stroke?: string;        // outline color
  strokeWidth?: number;   // outline thickness
  // Image properties
  src?: string;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
};

export type JerseyZone = {
  id: string;
  name: string;
  x: number;
  y: number;
  side: 'front' | 'back';
};

// Helper Components
const TextItem = ({ 
  item, 
  isSelected, 
  onSelect,
  onDragMove,
  onTransform
}: { 
  item: ItemConfig, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragMove: (id: string, x: number, y: number) => void,
  onTransform: (id: string, fontSize: number, rotation: number) => void
}) => {
  const textRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  
  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  
  return (
    <>
      <Text
        ref={textRef}
        text={item.text || ''}
        x={item.x}
        y={item.y}
        fontSize={item.fontSize}
        fontFamily={item.fontFamily}
        fill={item.fill}
        stroke={item.stroke}
        strokeWidth={item.strokeWidth}
        rotation={item.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          const node = e.target;
          const { x, y } = node.position();
          onDragMove(item.id, x, y);
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          // Scale back to 1 to avoid accumulating scaling
          node.scaleX(1);
          node.scaleY(1);
          
          const fontSize = Math.max(10, (item.fontSize || 24) * scaleX);
          const rotation = node.rotation();
          
          // Update item in store
          onTransform(item.id, fontSize, rotation);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

const ImageItem = ({ 
  item, 
  isSelected, 
  onSelect,
  onDragMove,
  onImageTransform
}: { 
  item: ItemConfig, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragMove: (id: string, x: number, y: number) => void,
  onImageTransform: (id: string, scaleX: number, scaleY: number, rotation: number) => void
}) => {
  const imageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [image] = useImage(item.src || '');
  
  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  
  if (!image) {
    return null;
  }
  
  return (
    <>
      <Image
        ref={imageRef}
        image={image}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        scaleX={item.scaleX || 1}
        scaleY={item.scaleY || 1}
        rotation={item.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          const node = e.target;
          const { x, y } = node.position();
          onDragMove(item.id, x, y);
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          
          // Get new scale values
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const rotation = node.rotation();
          
          // Update item in store
          onImageTransform(item.id, scaleX, scaleY, rotation);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

// The main editor component
const JerseyEditor = () => {
  const {
    items,
    selectedItemId,
    currentView,
    setCurrentView,
    selectItem,
    updateItem,
    frontImage,
    backImage,
    jerseyZones
  } = useEditorStore();
  
  const [stageWidth, setStageWidth] = useState(480);
  const [stageHeight, setStageHeight] = useState(480);
  const [frontImageObj] = useImage(frontImage || '');
  const [backImageObj] = useImage(backImage || '');
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle responsive canvas sizing
  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        const width = Math.min(480, containerRef.current.offsetWidth);
        setStageWidth(width);
        setStageHeight(width);
      }
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  
  // Handle click on empty canvas
  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectItem(null);
    }
  };
  
  // Handle item movement
  const handleDragMove = (id: string, x: number, y: number) => {
    updateItem(id, { x, y });
  };
  
  // Handle text transformation
  const handleTextTransform = (id: string, fontSize: number, rotation: number) => {
    updateItem(id, { fontSize, rotation });
  };
  
  // Handle image transformation
  const handleImageTransform = (id: string, scaleX: number, scaleY: number, rotation: number) => {
    updateItem(id, { scaleX, scaleY, rotation });
  };
  
  // Always use front view only - all views are shown in one generated image
  useEffect(() => {
    setCurrentView('front');
  }, [setCurrentView]);
  
  // Export canvas as image
  const handleExport = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `jersey-${currentView}-${new Date().getTime()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Get current items for the active view
  const currentZones = jerseyZones.filter(zone => zone.side === currentView);
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <EditorSidebar 
        onExport={handleExport} 
        currentView="front" 
        onToggleView={() => {}} 
      />
      
      <div className="flex-1 flex flex-col items-center">
        <div 
          ref={containerRef} 
          className="border-2 border-gray-200 rounded-lg mb-4 overflow-hidden"
        >
          <Stage
            ref={stageRef}
            width={stageWidth}
            height={stageHeight}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            <Layer>
              {/* Background Jersey Image - Front view only */}
              {frontImageObj && (
                <Image 
                  image={frontImageObj} 
                  width={stageWidth} 
                  height={stageHeight} 
                />
              )}
              
              {/* Items (text and images) */}
              {items.map((item) => (
                <Group key={item.id}>
                  {item.type === 'text' ? (
                    <TextItem
                      item={item}
                      isSelected={item.id === selectedItemId}
                      onSelect={() => selectItem(item.id)}
                      onDragMove={handleDragMove}
                      onTransform={handleTextTransform}
                    />
                  ) : (
                    <ImageItem
                      item={item}
                      isSelected={item.id === selectedItemId}
                      onSelect={() => selectItem(item.id)}
                      onDragMove={handleDragMove}
                      onImageTransform={handleImageTransform}
                    />
                  )}
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>
        
        <EditorControls 
          selectedItemId={selectedItemId} 
          jerseyZones={currentZones} 
        />
      </div>
    </div>
  );
};

// Simple wrapper for the JerseyEditor component
const JerseyEditorWrapper = () => {
  return <JerseyEditor />;
};

export default JerseyEditorWrapper;