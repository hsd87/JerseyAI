// Smart Prompt Builder for ProJersey
// Generates enhanced sport-specific prompts for jersey design
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { sportPromptOverrides, defaultPromptOptions, type PromptOverrides } from './sportsPromptOverrides';
import { convertToDescriptiveColor } from '../utils/colorUtils';

// Initialize OpenAI client - using the newest model
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Interface for prompt generation inputs
export interface PromptInput {
  sport: string;
  kitType: string;
  primaryColor: string;
  secondaryColor: string;
  sleeveStyle?: string;
  collarType?: string;
  patternStyle?: string;
  designNotes?: string;
}

/**
 * Generate a smart enhanced prompt for jersey design based on sport-specific requirements
 * @param options Input options for prompt generation
 * @returns Enhanced prompt string
 */
export async function generateSmartPrompt(options: PromptInput): Promise<string> {
  const { 
    sport, 
    kitType, 
    primaryColor, 
    secondaryColor,
    sleeveStyle: userSleeveStyle,
    collarType: userCollarType,
    patternStyle: userPatternStyle,
    designNotes 
  } = options;

  // Apply sport-specific overrides from our catalog
  const sportLower = sport.toLowerCase();
  const sportOverrides = sportPromptOverrides[sportLower as keyof typeof sportPromptOverrides] || {};
  
  // Combine overrides with defaults for any missing properties
  const sportConfig: PromptOverrides = {
    ...defaultPromptOptions,
    ...sportOverrides
  };

  // Prioritize user input over sport defaults
  const sleeveStyle = userSleeveStyle || sportConfig.sleeveStyle;
  const collarType = userCollarType || sportConfig.collarType;
  const patternStyle = userPatternStyle || sportConfig.patternStyle || 'team crest';
  const structureNote = sportConfig.structureNote || '';
  const designMood = sportConfig.designMood || '';
  const visualElements = sportConfig.visualElements || [];
  
  console.log(`Applied sport-specific config for ${sport}:`, JSON.stringify({
    sleeveStyle,
    collarType, 
    patternStyle,
    structureNote,
    shortsRequired: sportConfig.shortsRequired
  }, null, 2));

  // Use enhanced color conversion for more descriptive colors
  const primaryColorName = convertToDescriptiveColor(primaryColor);
  const secondaryColorName = convertToDescriptiveColor(secondaryColor);
  
  console.log(`Color conversion: Primary "${primaryColor}" → "${primaryColorName}", Secondary "${secondaryColor}" → "${secondaryColorName}"`);

  // Determine if this should be jersey-only or include shorts based on both
  // kitType input and sport-specific defaults
  // If explicitly requested as jersey+shorts, override sport default
  let includeShorts = kitType.toLowerCase().includes('shorts') || sportConfig.shortsRequired;
  
  // Special override for basketball - always enforce sleeveless
  if (sportLower === 'basketball') {
    console.log("Basketball detected: Enforcing sleeveless style");
  }
                     
  // Build the base prompt template 
  const promptTemplate = `⸻

Prompt:

A pfsportskit for ${sport}, displayed in two cleanly aligned angles: front view (left) and back view (right), against a crisp white studio background. ${!includeShorts ? 
  `The ${sport} jersey is presented in a floating, mannequin-free layout, suitable for high-end product catalog visuals.` : 
  `The ${sport} jersey and shorts are presented in a floating, mannequin-free layout, suitable for high-end product catalog visuals.`} Both views are perfectly centered, evenly spaced, and fully visible. No cleats, socks, or models — just the ${!includeShorts ? 'jersey' : 'uniform'}, front and back.

⸻

🧍‍♂️ Garment Structure

${!includeShorts ? 
  `The jersey is a ${sleeveStyle} ${sport} design. It features a ${collarType}, angular shoulder seams, and a form-fitting streamlined cut through the torso. ${structureNote}` : 
  `The uniform consists of a ${sleeveStyle} ${sport} jersey and tapered mid-thigh athletic shorts. The jersey features a ${collarType}, angular shoulder seams, and a form-fitting streamlined cut through the torso. ${structureNote} The shorts include sculpted side panels, a reinforced waistband, and slit hems for dynamic movement.`}

⸻

🧵 Fabric & Texture

Constructed from a dual-zone poly-elastane blend, the jersey incorporates diamond-knit mesh on the torso and smooth matte spandex ${sportLower === 'basketball' ? 'shoulder trim' : 'sleeves'}. Side panels are embedded with vented hex-weave textures. The material has a low-luster finish, designed to reflect controlled lighting and rich color. Seams are bonded and flatlocked, with detail piping following panel boundaries.
${sportLower === 'esports' ? '\nThe fabric features subtle tech-inspired microtextures and light-reactive thread elements that enhance visibility during competitive gaming and streaming sessions.' : ''}
${sportLower === 'rugby' ? '\nThe material utilizes reinforced stitching at stress points and abrasion-resistant panels at shoulder and collar areas for durability during play.' : ''}

⸻

🎨 Color Scheme
        • Primary Color: ${primaryColorName}
        • Secondary Color: ${secondaryColorName}
        • Accent: Ice white trim and dark contours

⸻

🎨 Design Language

The front of the jersey features an elegant yet modern ${patternStyle} pattern, radiating outward from the chest center in ${secondaryColorName}, resembling a digital emblem. Thin contour lines wrap along the ribs and upper chest in a tech-geometry. A sharp white slash element cuts diagonally across the midsection, forming a bold angle that intersects the main motif. ${sportLower !== 'basketball' ? `Sleeve cuffs are trimmed in ${secondaryColorName} with subtle dotted patterns near the hem.` : `Arm openings feature ${secondaryColorName} trim with subtle dotted patterns along the edge.`}

The back of the jersey includes a ${secondaryColorName} vertical spine pattern, composed of interlocking bands. The player name is positioned just below the collar in clean uppercase text, with the number centered mid-back in large ${secondaryColorName} numerals outlined in white. A deep ${primaryColorName} halo gradient behind the number adds tonal contrast.
${visualElements.length > 0 ? `\nDistinctive elements include ${visualElements.join(', ')}.` : ''}

⸻

${includeShorts ? `🩳 Shorts Design

Shorts are ${primaryColorName} with angular ${secondaryColorName} side panels, shaped like descending wedges that taper toward the knee. A thin white trim outlines the bottom hem and side slits. Rear panel shaping follows the glute contour with internal stitching and a slight back yoke drop. The left thigh displays a ${secondaryColorName} team crest; the right thigh features an optional player number or minimal icon.

⸻` : ''}

🧩 Panel & Trim Breakdown
        • Collar: ${collarType} in ${primaryColorName} with ${secondaryColorName} edge taping
        • ${sportLower === 'basketball' ? `Armholes` : `Sleeves`}: Matte ${primaryColorName} with dotted ${secondaryColorName} ${sportLower === 'basketball' ? `edge` : `cuff`} details
        • Front Body: ${patternStyle}-centered ${secondaryColorName} burst, angled white slash
        • Back Body: Vertical ${secondaryColorName} tech spine with clean typography block
${includeShorts ? '        • Shorts: Sculpted fit with angular ' + secondaryColorName + ' inserts and hem detailing' : ''}

⸻

🏷️ Logo & Branding Placement (Sublimated or Heat-Pressed)
        • Jersey front left chest: Team crest
        • Jersey front right chest: Sponsor logo
        • Upper back (below collar): Player name
        • Back center: Large number
${includeShorts ? '        • Shorts left thigh: Team crest\n        • Shorts right thigh: Player number or secondary crest' : ''}

⸻

🌐 Design Mood & Cohesion

${designNotes || designMood || `The design is bold, distinctive, and meticulously engineered — merging the power of tradition with the precision of modern performancewear. The ${secondaryColorName}-on-${primaryColorName} palette evokes prestige, while the ${patternStyle} patterning adds a tech-forward identity. This ${!includeShorts ? 'jersey' : 'uniform'} is ideal for trophy-season campaigns, limited-edition drops, or teams with a legacy-driven brand story.`}
`;

  // Create a log file path for saving prompts
  const promptLogsDir = path.join(process.cwd(), 'logs');
  const promptLogFile = path.join(promptLogsDir, 'smart_prompts.json');
  
  // For fallback in case OpenAI fails
  const createDirectPrompt = () => {
    return promptTemplate;
  };
  
  try {
    // Ensure logs directory exists
    if (!fs.existsSync(promptLogsDir)) {
      fs.mkdirSync(promptLogsDir, { recursive: true });
    }
    
    console.log(`Generating enhanced prompt for ${sport} jersey with ${primaryColorName} and ${secondaryColorName} colors...`);
    
    // Set up OpenAI to generate an enhanced prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model
      messages: [
        { 
          role: "system", 
          content: `You are an expert sports jersey designer creating prompts for an AI jersey generation system. 

SPORT-SPECIFIC CONTEXT:
This is a ${sport} jersey design with the following characteristics:
- Sleeve Style: ${sleeveStyle}
- Collar Type: ${collarType}
- Pattern Style: ${patternStyle}
${structureNote ? `- Structure Note: ${structureNote}` : ''}
${sportLower === 'basketball' ? '- Basketball jerseys should emphasize wide armholes, loose fit, and remove cuff/hem logic' : ''}
${sportLower === 'rugby' ? '- Rugby jerseys should emphasize reinforced seam structures and durability' : ''}
${sportLower === 'esports' ? '- Esports jerseys should include visual neon motifs and stylized mesh trims' : ''}

You MUST:
1. Follow the EXACT same format as the template with all sections provided in the exact same order.
2. KEEP all dividers (⸻) and emoji section markers (🧍‍♂️, 🧵, 🎨, 🩳, 🧩, 🏷️, 🌐) in the exact same positions.
3. Keep all bullet points in the same sections but enhance their descriptions.
4. Maintain the same jersey views arrangement - front view (left) and back view (right).
5. Always include the exact term "pfsportskit" in the first paragraph - this is REQUIRED and must not be changed.
6. Include all colors exactly as mentioned - primary, secondary, and accent.
7. Maintain all specifications about collar type, sleeve style, and pattern style.
8. Never use the word "kit" except in the required "pfsportskit" token. Use "jersey" or "jersey and shorts" or "uniform" instead.
9. If the template doesn't include shorts sections, DO NOT add them. Only describe shorts if the template includes shorts sections.
10. Incorporate any design inspiration (if provided) as visual elements in the jersey design itself, not just in the mood section.

ENHANCE the template with:
1. More vivid and specific material descriptions appropriate for ${sport}.
2. Richer color descriptors (while keeping the actual colors).
3. More technical sportswear terminology specific to ${sport}.
4. Better physical structure descriptions aligned with ${sport} performance needs.
5. Additional design elements that would make the jersey more distinctive and authentic for ${sport}.

Return your response as a JSON object with a single "prompt" field containing the enhanced prompt.` 
        },
        { 
          role: "user", 
          content: `Please convert this template into an enhanced AI prompt and return as json: ${promptTemplate}` 
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.warn("OpenAI returned empty content. Falling back to direct prompt.");
      return createDirectPrompt();
    }

    try {
      // Parse the content to get the prompt
      const jsonContent = JSON.parse(content);
      const enhancedPrompt = jsonContent.prompt || content;
      
      // Log both the base and enhanced prompts
      try {
        let existingLogs: any[] = [];
        if (fs.existsSync(promptLogFile)) {
          const logsContent = fs.readFileSync(promptLogFile, 'utf8');
          existingLogs = JSON.parse(logsContent);
        }
        
        // Save the prompt with metadata
        existingLogs.push({
          timestamp: new Date().toISOString(),
          sport,
          kitType,
          primaryColor: primaryColorName,
          secondaryColor: secondaryColorName,
          sleeveStyle,
          collarType,
          basePrompt: promptTemplate,
          enhancedPrompt
        });
        
        fs.writeFileSync(promptLogFile, JSON.stringify(existingLogs, null, 2), 'utf8');
      } catch (logError) {
        console.warn("Failed to log smart prompt:", logError);
      }
      
      return enhancedPrompt;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      console.warn("Falling back to direct prompt.");
      return createDirectPrompt();
    }
  } catch (error) {
    console.error("Error generating smart jersey design prompt:", error);
    console.warn("Falling back to direct prompt template due to OpenAI error.");
    return createDirectPrompt();
  }
}