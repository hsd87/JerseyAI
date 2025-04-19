import React from 'react';
import strikerJersey from "@assets/a-photograph-of-a-folded-soccer-jersey-r_0AV8gD9kSqm-clh7767Ugw_jOnJhKB4QJSgxjghY_ffmw.png";
import wildcatsJersey from "@assets/a-photograph-of-a-pristine-basketball-je_kvEtDjqaTo-9k79mDc78tw_ihZ2S4PmQwaRA-ySNHbtEA.png";
import hurricanesJersey from "@assets/a-photograph-of-a-pristine-cricket-jerse_pk3z3oeyQPefT1snkaEZvQ_GYFy7kXwRnW2vAWCM8Sh_w.png";
import unitedJersey from "@assets/a-photograph-of-a-soccer-jersey-artfully_6b4hrCVJT3mUFCzCtClxog_jOnJhKB4QJSgxjghY_ffmw.png";
import neonRaidersJersey from "@assets/a-photograph-of-a-sleek-esports-jersey-p_nhwFplkoQiOKywaTaeSe_Q_fOurUL7_Reqq5gzDlOUftw.png";
import esportJersey from "@assets/a-photograph-of-a-sleek-esports-jersey-p_hJOH-iR6QQ6rjqhYFZw0wg_fOurUL7_Reqq5gzDlOUftw.png";

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
    },
    { 
      src: neonRaidersJersey, 
      alt: "Neon Raiders esports jersey in black and pink" 
    },
    { 
      src: esportJersey, 
      alt: "Esports jersey with pink number 13" 
    }
  ];

  return (
    <div className="w-full max-w-screen py-2">
      <div className="px-1">
        <div 
          className="flex overflow-x-auto whitespace-nowrap snap-x gap-1 pb-2 no-scrollbar"
        >
          {highQualityJerseys.map((jersey, index) => (
            <div 
              key={index} 
              className="snap-start flex-shrink-0 w-[220px] md:w-[260px]"
            >
              <img 
                src={jersey.src} 
                alt={jersey.alt}
                className="w-full h-auto object-contain rounded-none shadow-none"
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