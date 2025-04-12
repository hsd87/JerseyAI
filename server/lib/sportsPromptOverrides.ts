// Sports Prompt Overrides
// This file contains sport-specific default values and prompt overrides for jersey generation

export interface PromptOverrides {
  sleeveStyle: string;
  collarType: string;
  patternStyle?: string;
  shortsRequired: boolean;
  structureNote?: string;
  designMood?: string;
  visualElements?: string[];
}

export const sportPromptOverrides: Record<string, Partial<PromptOverrides>> = {
  basketball: {
    sleeveStyle: "sleeveless",
    collarType: "round crew neck",
    patternStyle: "vertical wave stripes",
    shortsRequired: false,
    structureNote: "sleeveless loose-fit jersey with wide armholes, enhanced for vertical motion",
    designMood: "The jersey is built for agility and on-court visibility — sleek, minimal, and optimized for fast breaks.",
    visualElements: ["extended armhole cuts", "moisture-wicking mesh side panels", "numbered shoulder yoke"]
  },
  soccer: {
    sleeveStyle: "short-sleeved",
    collarType: "hybrid mandarin V-collar",
    patternStyle: "circuit crest",
    shortsRequired: true,
    structureNote: "streamlined fit for performance, short sleeves, angular seams for agility",
    designMood: "The jersey embodies pitch-to-street versatility with performance engineering and heritage aesthetics.",
    visualElements: ["contrasting sleeve cuffs", "ventilated side mesh", "ribbed collar"]
  },
  rugby: {
    sleeveStyle: "short-sleeved with reinforced shoulders",
    collarType: "rugged reinforced V-neck",
    patternStyle: "bold chest bands",
    shortsRequired: true,
    structureNote: "rugged construction with short reinforced sleeves and secure button collar",
    designMood: "Built to endure physical play while maintaining team pride through traditional rugby aesthetics.",
    visualElements: ["reinforced shoulder panels", "taped seams", "durable loop buttonhole"]
  },
  esports: {
    sleeveStyle: "long-sleeved",
    collarType: "crew collar",
    patternStyle: "cyberpunk hexgrid",
    shortsRequired: false,
    structureNote: "stylized digital-wear with futuristic trim, ideal for media and team branding",
    designMood: "Futuristic and bold — this esports jersey brings digital edge to competitive identity.",
    visualElements: ["neon accent piping", "digital gradient infill", "tech-inspired pattern mesh"]
  },
  cricket: {
    sleeveStyle: "long-sleeved",
    collarType: "button mandarin",
    patternStyle: "minimal pinstripe or shoulder gradient",
    shortsRequired: false,
    structureNote: "lightweight long-wear design with cooling mesh underarm zones",
    designMood: "Elegant and traditional with contemporary performance attributes for extended match play.",
    visualElements: ["buttoned quarter placket", "extended back hem", "cricket bat motif"]
  },
  baseball: {
    sleeveStyle: "3/4 length raglan",
    collarType: "buttoned crew neck",
    patternStyle: "team panel blocks",
    shortsRequired: false,
    structureNote: "structured cut for arm rotation with emphasized back yoke",
    designMood: "Authentic diamond heritage meets modern performance fabrics for a classic baseball silhouette.",
    visualElements: ["contrast raglan sleeves", "piped front placket", "button-through front"]
  },
  american_football: {
    sleeveStyle: "cap sleeve",
    collarType: "high crewneck",
    patternStyle: "shoulder block panels",
    shortsRequired: false,
    structureNote: "compression fit with stretch panels for gear accommodation",
    designMood: "Impact-ready design balancing team identity with functional form for gridiron intensity.",
    visualElements: ["extended shoulder coverage", "reinforced stitching", "stretch side panels"]
  },
  hockey: {
    sleeveStyle: "long-sleeved",
    collarType: "v-neck with lacing",
    patternStyle: "horizontal chest stripes",
    shortsRequired: false,
    structureNote: "loose-fit with extended hem and reinforced sleeves",
    designMood: "Ice-ready performance with traditional hockey styling and contemporary material technology.",
    visualElements: ["contrasting shoulder yoke", "lace-up collar detail", "extended back hem"]
  }
};

// Default fallback options if sport is not found in override map
export const defaultPromptOptions: PromptOverrides = {
  sleeveStyle: "short-sleeved",
  collarType: "crew neck",
  patternStyle: "team crest",
  shortsRequired: false,
  structureNote: "performance-focused cut with strategic ventilation zones",
  designMood: "A balance of performance engineering and team identity, built for competitive play.",
  visualElements: ["contrast trim", "mesh side panels"]
};