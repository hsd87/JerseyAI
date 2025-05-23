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
  // Use the high-quality jersey images with titles
  const highQualityJerseys = [
    { 
      src: strikerJersey, 
      alt: "Strikers soccer jersey in green and black stripes",
      title: "STRIKERS FC",
      type: "SOCCER"
    },
    { 
      src: wildcatsJersey, 
      alt: "Wildcats #7 blue basketball jersey",
      title: "WILDCATS",
      type: "BASKETBALL"
    },
    { 
      src: hurricanesJersey, 
      alt: "The Hurricanes orange cricket jersey",
      title: "HURRICANES",
      type: "CRICKET" 
    },
    { 
      src: unitedJersey, 
      alt: "United red soccer jersey",
      title: "UNITED",
      type: "SOCCER"
    },
    { 
      src: neonRaidersJersey, 
      alt: "Neon Raiders esports jersey in black and pink",
      title: "NEON RAIDERS",
      type: "ESPORTS"
    },
    { 
      src: esportJersey, 
      alt: "Esports jersey with pink number 13",
      title: "TEAM THIRTEEN",
      type: "ESPORTS"
    }
  ];

  return (
    <div className="w-full max-w-screen py-2">
      <div className="px-0">
        <div 
          className="flex overflow-x-auto whitespace-nowrap snap-x gap-0.5 pb-1 no-scrollbar"
        >
          {highQualityJerseys.map((jersey, index) => (
            <div 
              key={index} 
              className="snap-start flex-shrink-0 w-[210px] md:w-[250px] relative"
            >
              <img 
                src={jersey.src} 
                alt={jersey.alt}
                className="w-full h-auto object-contain rounded-none shadow-none"
                loading="lazy"
              />
              <div className="absolute bottom-10 left-0 p-3 w-full">
                <div className="bg-[var(--nike-primary)] bg-opacity-80 p-2 text-left">
                  <h3 className="text-white font-bold text-lg uppercase tracking-wide">{jersey.title}</h3>
                  <p className="text-[#D9D9D9] text-xs uppercase tracking-wider">{jersey.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JerseyScrollGallery;