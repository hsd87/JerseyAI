import { useEffect } from 'react';
import JerseyEditor from '@/components/jersey-editor';
import { EditorProvider, useEditorStoreBase } from '@/components/jersey-editor/editor-store';

// Wrapper component that uses the base store
function JerseyEditorWrapper() {
  // Get the setter from the store
  const setImages = useEditorStoreBase((state) => state.setImages);
  
  // Set some example images when the component mounts
  useEffect(() => {
    // Use our SVG jersey templates
    const frontImageUrl = '/placeholder-front.svg';
    const backImageUrl = '/placeholder-back.svg';
    
    setImages(frontImageUrl, backImageUrl);
  }, [setImages]);

  return <JerseyEditor />;
}

export default function JerseyEditorPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Jersey Customizer</h1>
        <p className="text-gray-600">
          Customize your jersey by adding text, numbers, and logos
        </p>
      </div>
      
      <EditorProvider>
        <JerseyEditorWrapper />
      </EditorProvider>
    </div>
  );
}