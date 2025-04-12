import { useEffect } from 'react';
import JerseyEditor from '@/components/jersey-editor';
import { useEditorStoreBase } from '@/components/jersey-editor/editor-store';

export default function JerseyEditorPage() {
  // Get the setter from the store
  const setImages = useEditorStoreBase((state) => state.setImages);
  
  // Set some example images when the component mounts
  useEffect(() => {
    // Example jersey images - replace with your actual front/back images
    const frontImageUrl = '/placeholder-front.jpg';
    const backImageUrl = '/placeholder-back.jpg';
    
    setImages(frontImageUrl, backImageUrl);
  }, [setImages]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Jersey Customizer</h1>
        <p className="text-gray-600">
          Customize your jersey by adding text, numbers, and logos
        </p>
      </div>
      
      <JerseyEditor />
    </div>
  );
}