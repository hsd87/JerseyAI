import React from 'react';
import strikerJersey from "@assets/a-photograph-of-a-folded-soccer-jersey-r_0AV8gD9kSqm-clh7767Ugw_jOnJhKB4QJSgxjghY_ffmw.png";
import wildcatsJersey from "@assets/a-photograph-of-a-pristine-basketball-je_kvEtDjqaTo-9k79mDc78tw_ihZ2S4PmQwaRA-ySNHbtEA.png";
import hurricanesJersey from "@assets/a-photograph-of-a-pristine-cricket-jerse_pk3z3oeyQPefT1snkaEZvQ_GYFy7kXwRnW2vAWCM8Sh_w.png";
import unitedJersey from "@assets/a-photograph-of-a-soccer-jersey-artfully_6b4hrCVJT3mUFCzCtClxog_jOnJhKB4QJSgxjghY_ffmw.png";

interface JerseyScrollGalleryProps {
  jerseyUrls: string[];
  altText?: string;
}

const JerseyScrollGallery: React.FC<JerseyScrollGalleryProps> = ({
  jerseyUrls,
  altText = "Jersey design"
}) => {
  // Use the high-quality jersey images
  const highQualityJerseys = [
    { 
      src: strikerJersey, 
      alt: "Strikers soccer jersey in green and black stripes" 
    },
    { 
      src: wildcatsJersey, 
      alt: "Wildcats #7 blue basketball jersey" 
    },
    { 
      src: hurricanesJersey, 
      alt: "The Hurricanes orange cricket jersey" 
    },
    { 
      src: unitedJersey, 
      alt: "United red soccer jersey" 
    }
  ];

  return (
    <div className="w-full max-w-screen py-8">
      <div className="px-4 md:px-8">
        <div 
          className="flex overflow-x-auto whitespace-nowrap snap-x gap-6 md:gap-8 pb-6 no-scrollbar"
        >
          {highQualityJerseys.map((jersey, index) => (
            <div 
              key={index} 
              className="snap-start flex-shrink-0 w-[280px] md:w-[360px]"
            >
              <img 
                src={jersey.src} 
                alt={jersey.alt}
                className="w-full h-auto object-contain rounded-xl shadow-md transition-transform hover:scale-[1.02]"
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