import React from 'react';

interface JerseyScrollGalleryProps {
  jerseyUrls: string[];
  altText?: string;
}

const JerseyScrollGallery: React.FC<JerseyScrollGalleryProps> = ({
  jerseyUrls,
  altText = "Jersey design"
}) => {
  // Don't render if no images
  if (!jerseyUrls || jerseyUrls.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-screen">
      <div className="px-4 md:px-8">
        <div 
          className="flex overflow-x-auto whitespace-nowrap snap-x gap-4 md:gap-6 pb-4 no-scrollbar"
        >
          {jerseyUrls.map((url, index) => (
            <div 
              key={index} 
              className="snap-start flex-shrink-0 w-[180px] md:w-[240px]"
            >
              <img 
                src={url} 
                alt={`${altText} ${index + 1}`}
                className="w-full h-auto object-cover rounded-xl shadow-sm"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JerseyScrollGallery;