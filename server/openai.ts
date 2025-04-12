import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Replicate from "replicate";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GenerateKitPromptOptions {
  sport: string;
  kitType: string;
  primaryColor: string;
  secondaryColor: string;
  sleeveStyle?: string;
  collarType?: string;
  patternStyle?: string;
  designNotes?: string;
}

export async function generateKitPrompt(options: GenerateKitPromptOptions): Promise<string> {
  const { 
    sport, 
    kitType, 
    primaryColor, 
    secondaryColor, 
    sleeveStyle, 
    collarType, 
    patternStyle, 
    designNotes 
  } = options;

  // Create a color descriptive name
  const getColorName = (hexColor: string) => {
    // This is a simple implementation - in production you might want a more robust color naming library
    const colorMap: Record<string, string> = {
      "#FF0000": "red",
      "#00FF00": "green",
      "#0000FF": "blue",
      "#FFFF00": "yellow",
      "#FF00FF": "magenta",
      "#00FFFF": "cyan",
      "#000000": "black",
      "#FFFFFF": "white",
      "#FFA500": "orange",
      "#800080": "purple",
      "#A52A2A": "brown",
      "#808080": "gray",
      "#C0C0C0": "silver",
      "#FFD700": "gold",
    };
    
    return colorMap[hexColor.toUpperCase()] || hexColor;
  };

  const primaryColorName = getColorName(primaryColor);
  const secondaryColorName = getColorName(secondaryColor);

  // Using the provided template structure
  const promptTemplate = `⸻

Prompt:

A pf${sport}kit, displayed in two cleanly aligned angles: front view (left) and back view (right), against a crisp white studio background. The ${sport} jersey and shorts are presented in a floating, mannequin-free layout, suitable for high-end product catalog visuals. Both views are perfectly centered, evenly spaced, and fully visible. No cleats, socks, or models — just the uniform, front and back.

⸻

🧍‍♂️ Garment Structure

The kit consists of a ${sleeveStyle || 'short-sleeved'} ${sport} jersey and tapered mid-thigh athletic shorts. The jersey features a ${collarType || 'hybrid mandarin V-collar'}, angular shoulder seams, and a form-fitting streamlined cut through the torso. The shorts include sculpted side panels, a reinforced waistband, and slit hems for dynamic movement.

⸻

🧵 Fabric & Texture

Constructed from a dual-zone poly-elastane blend, the jersey incorporates diamond-knit mesh on the torso and smooth matte spandex sleeves. Side panels are embedded with vented hex-weave textures. The material has a low-luster finish, designed to reflect controlled lighting and rich color. Seams are bonded and flatlocked, with detail piping following panel boundaries.

⸻

🎨 Color Scheme
        • Primary Color: ${primaryColorName}
        • Secondary Color: ${secondaryColorName}
        • Accent: Ice white trim and dark contours

⸻

🎨 Design Language

The front of the jersey features an elegant yet modern ${patternStyle || 'circuit crest'} pattern, radiating outward from the chest center in ${secondaryColorName}, resembling a digital emblem. Thin contour lines wrap along the ribs and upper chest in a tech-geometry. A sharp white slash element cuts diagonally across the midsection, forming a bold angle that intersects the main motif. Sleeve cuffs are trimmed in ${secondaryColorName} with subtle dotted patterns near the hem.

The back of the jersey includes a ${secondaryColorName} vertical spine pattern, composed of interlocking bands. The player name is positioned just below the collar in clean uppercase text, with the number centered mid-back in large ${secondaryColorName} numerals outlined in white. A deep ${primaryColorName} halo gradient behind the number adds tonal contrast.

⸻

🩳 Shorts Design

Shorts are ${primaryColorName} with angular ${secondaryColorName} side panels, shaped like descending wedges that taper toward the knee. A thin white trim outlines the bottom hem and side slits. Rear panel shaping follows the glute contour with internal stitching and a slight back yoke drop. The left thigh displays a ${secondaryColorName} team crest; the right thigh features an optional player number or minimal icon.

⸻

🧩 Panel & Trim Breakdown
        • Collar: ${collarType || 'Mandarin-style V-notch'} in ${primaryColorName} with ${secondaryColorName} edge taping
        • Sleeves: Matte ${primaryColorName} with dotted ${secondaryColorName} cuff details
        • Front Body: ${patternStyle || 'Crest'}-centered ${secondaryColorName} burst, angled white slash
        • Back Body: Vertical ${secondaryColorName} tech spine with clean typography block
        • Shorts: Sculpted fit with angular ${secondaryColorName} inserts and hem detailing

⸻

🏷️ Logo & Branding Placement (Sublimated or Heat-Pressed)
        • Jersey front left chest: Team crest
        • Jersey front right chest: Sponsor logo
        • Upper back (below collar): Player name
        • Back center: Large number
        • Shorts left thigh: Team crest
        • Shorts right thigh: Player number or secondary crest

⸻

🌐 Design Mood & Cohesion

${designNotes || `The Circuit kit is bold, distinctive, and meticulously engineered — merging the power of tradition with the precision of modern performancewear. The ${secondaryColorName}-on-${primaryColorName} palette evokes prestige, while the ${patternStyle || 'circuit'} patterning adds a tech-forward identity. This kit is ideal for trophy-season campaigns, limited-edition drops, or teams with a legacy-driven brand story.`}
`;

  try {
    // Set up OpenAI to generate an enhanced prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are an expert sports kit designer. Take the following jersey design template and enhance it into a compelling prompt for an AI image generator. Keep the overall structure and format similar but add unique details and descriptions that will result in a high-quality, realistic jersey image. Return your response as a JSON object with a "prompt" field that contains the enhanced prompt.` 
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
      throw new Error("Failed to generate kit design prompt");
    }

    // Parse the content to get the prompt
    const jsonContent = JSON.parse(content);
    const enhancedPrompt = jsonContent.prompt || content;
    
    return enhancedPrompt;
  } catch (error) {
    console.error("Error generating kit design prompt:", error);
    throw error;
  }
}

export async function generateKitImageWithReplicate(prompt: string): Promise<string> {
  console.log("Generating image with Replicate API using prompt:", prompt);
  
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not set");
  }
  
  // Step 1: Create the prediction with Replicate API using the client library
  try {
    // Initialize the Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    
    // Define the model ID and input
    const modelVersion = "hsd87/pfai01:a55a5b66a5bdee91c0ad3af6a013c81741aad48dfaf4291f2d9a28a35e0a79c3";
    const input = {
      prompt: prompt,
      aspect_ratio: "1:1",
      prompt_strength: 0.8,
      model: "dev",
      num_outputs: 1,
      num_inference_steps: 28,
      guidance_scale: 3,
      output_format: "png",
      disable_safety_checker: false
    };
    
    console.log("Running prediction with model:", modelVersion);
    console.log("Input parameters:", JSON.stringify(input, null, 2));
    
    // Run the model prediction
    const output = await replicate.run(modelVersion, { input });
    
    console.log("Prediction result:", output);
    
    // Get the image URL from the output (output is usually an array of URLs)
    const imageUrl = Array.isArray(output) ? output[0] : output;
    
    if (!imageUrl) {
      throw new Error("No image was generated");
    }
    
    // Download the generated image
    const imageResponse = await fetch(imageUrl.toString());
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download generated image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    // Create a unique filename
    const imageId = uuidv4();
    const isBackView = !prompt.includes("front");
    const filename = isBackView ? `back_${imageId}.png` : `front_${imageId}.png`;
    const outputPath = path.join(process.cwd(), 'output', filename);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(path.join(process.cwd(), 'output'))) {
      fs.mkdirSync(path.join(process.cwd(), 'output'), { recursive: true });
    }
    
    // Save the image
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, buffer);
    
    // Return the local URL
    return `/output/${filename}`;
  } catch (error) {
    console.error("Error generating image with Replicate:", error);
    
    // Return fallback image if generation fails
    const fallbackImage = prompt.includes("front") 
      ? "/output/fallback_front.png"
      : "/output/fallback_back.png";
      
    // Return the fallback image or throw the error
    if (fs.existsSync(path.join(process.cwd(), fallbackImage.substring(1)))) {
      console.log("Using fallback image:", fallbackImage);
      return fallbackImage;
    }
    
    // If no fallback, rethrow the error
    throw error;
  }
}