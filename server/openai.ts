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

  // More extensive color naming function
  const getColorName = (hexColor: string) => {
    // Expanded color map with more sports-appropriate descriptive names
    const colorMap: Record<string, string> = {
      // Basic colors
      "#FF0000": "crimson red",
      "#00FF00": "electric green",
      "#0000FF": "royal blue",
      "#FFFF00": "vibrant yellow", 
      "#FF00FF": "vivid magenta",
      "#00FFFF": "azure blue",
      "#000000": "deep black",
      "#FFFFFF": "pristine white",
      
      // Common sports colors with more descriptive names
      "#FFA500": "vibrant orange",
      "#800080": "regal purple",
      "#A52A2A": "rich brown",
      "#808080": "steel gray",
      "#C0C0C0": "metallic silver",
      "#FFD700": "metallic gold",
      "#8B0000": "dark crimson",
      "#006400": "forest green",
      "#00008B": "deep navy",
      "#4B0082": "imperial purple",
      "#800000": "maroon",
      "#008080": "teal",
      "#2E8B57": "sea green",
      "#4682B4": "steel blue",
      "#B22222": "firebrick red",
      "#D2691E": "chocolate brown",
      "#CD853F": "peru tan",
      "#DAA520": "goldenrod",
      "#FF4500": "orange red",
      "#32CD32": "lime green",
      "#1E90FF": "dodger blue",
      "#FF1493": "deep pink"
    };
    
    // If the color is found in our map, return the descriptive name
    // Otherwise, return a generic description with the hex code
    return colorMap[hexColor.toUpperCase()] || `custom ${hexColor} shade`;
  };

  const primaryColorName = getColorName(primaryColor);
  const secondaryColorName = getColorName(secondaryColor);

  // Using the provided template structure with standardized "pfsportskit" token
  const promptTemplate = `⸻

Prompt:

A pfsportskit for ${sport}, displayed in two cleanly aligned angles: front view (left) and back view (right), against a crisp white studio background. The ${sport} jersey and shorts are presented in a floating, mannequin-free layout, suitable for high-end product catalog visuals. Both views are perfectly centered, evenly spaced, and fully visible. No cleats, socks, or models — just the uniform, front and back.

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

  // Create a log file path for saving successful prompts
  const promptLogsDir = path.join(process.cwd(), 'logs');
  const promptLogFile = path.join(promptLogsDir, 'successful_prompts.json');
  
  // For fallback in case OpenAI fails
  const createDirectPrompt = () => {
    // Create a direct prompt without OpenAI enhancement
    return promptTemplate;
  };
  
  try {
    // Ensure logs directory exists
    if (!fs.existsSync(promptLogsDir)) {
      fs.mkdirSync(promptLogsDir, { recursive: true });
    }
    
    console.log(`Generating enhanced prompt for ${sport} kit with ${primaryColorName} and ${secondaryColorName} colors...`);
    
    // Set up OpenAI to generate an enhanced prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are an expert sports kit designer creating prompts for a jersey design AI. 

You MUST:
1. Follow the EXACT same format as the template with sections: Prompt, Garment Structure, Fabric & Texture, Color Scheme, Design Language, Shorts Design, Panel & Trim Breakdown, Logo & Branding Placement, and Design Mood & Cohesion.
2. KEEP all dividers (⸻) and emoji section markers (🧍‍♂️, 🧵, 🎨, 🩳, 🧩, 🏷️, 🌐) in the exact same positions.
3. Keep all bullet points in the same sections but enhance their descriptions.
4. Maintain the same jersey views arrangement - front view (left) and back view (right).
5. Always include the exact term "pfsportskit" in the first paragraph - this is REQUIRED and must not be changed.
6. Include all colors exactly as mentioned - primary, secondary, and accent.
7. Maintain all specifications about collar type, sleeve style, and pattern style.
8. Keep all structural elements of both the jersey and shorts as described.

ENHANCE the template with:
1. More vivid and specific material descriptions.
2. Richer color descriptors (while keeping the actual colors).
3. More technical sportswear terminology.
4. Better physical structure descriptions.
5. Additional design elements that would make the jersey more distinctive.

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
      
      // Log successful prompt for future analysis
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
          primaryColor: primaryColorName,
          secondaryColor: secondaryColorName,
          template: promptTemplate,
          enhanced: enhancedPrompt
        });
        
        fs.writeFileSync(promptLogFile, JSON.stringify(existingLogs, null, 2), 'utf8');
      } catch (logError) {
        console.warn("Failed to log prompt:", logError);
      }
      
      return enhancedPrompt;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      console.warn("Falling back to direct prompt.");
      return createDirectPrompt();
    }
  } catch (error) {
    console.error("Error generating kit design prompt:", error);
    console.warn("Falling back to direct prompt template due to OpenAI error.");
    return createDirectPrompt();
  }
}

export async function generateKitImageWithReplicate(prompt: string, kitType?: string): Promise<string> {
  console.log("Generating image with Replicate API using prompt:", prompt);
  
  // Create a logs directory for saving successful prompts
  const imageLogsDir = path.join(process.cwd(), 'logs', 'images');
  
  // Check for API token
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Error: REPLICATE_API_TOKEN is not set in environment variables");
    throw new Error("REPLICATE_API_TOKEN is not set. Please add this secret to continue.");
  }
  
  // Ensure logs directory exists
  try {
    if (!fs.existsSync(imageLogsDir)) {
      fs.mkdirSync(imageLogsDir, { recursive: true });
    }
  } catch (dirError) {
    console.warn("Failed to create image logs directory:", dirError);
  }
  
  try {
    // Initialize the Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    
    // Determine if it's jersey-only based on kitType or prompt content
    const isJerseyOnly = kitType === "jersey only" || 
                         prompt.toLowerCase().includes("jersey only") || 
                         !prompt.toLowerCase().includes("shorts");
    
    // Set aspect ratio based on jersey-only status
    const aspectRatio = isJerseyOnly ? "3:2" : "1:1";
    console.log(`Using aspect ratio ${aspectRatio} (jersey-only: ${isJerseyOnly})`);
    
    // Define the model ID and input with updated settings
    const modelVersion = "hsd87/pfai01:a55a5b66a5bdee91c0ad3af6a013c81741aad48dfaf4291f2d9a28a35e0a79c3";
    const input = {
      prompt: prompt,
      aspect_ratio: aspectRatio,
      prompt_strength: 0.8,
      model: "dev",
      num_outputs: 1,
      num_inference_steps: 28,
      guidance_scale: 2.9,  // Changed from 3 to 2.9 as requested
      output_format: "jpg", // Changed from png to jpg as requested
      disable_safety_checker: false,
      lora_scale: 1.05,     // Added lora_scale as requested
      extra_lora: 0.69      // Added extra_lora with value 0.69 as requested
    };
    
    console.log("Running prediction with model:", modelVersion);
    console.log("Input parameters:", JSON.stringify(input, null, 2));
    
    // Start tracking time for performance logging
    const startTime = Date.now();
    
    // Run the model prediction
    const output = await replicate.run(modelVersion, { input });
    
    // Calculate generation time
    const generationTime = Date.now() - startTime;
    console.log(`Image generated in ${generationTime}ms`);
    
    // Log output result
    console.log("Prediction result:", output);
    
    // Get the image URL from the output (output is usually an array of URLs)
    const imageUrl = Array.isArray(output) ? output[0] : output;
    
    if (!imageUrl) {
      throw new Error("No image was generated by Replicate");
    }
    
    console.log("Image URL received:", imageUrl);
    
    // Download the generated image
    console.log("Downloading generated image...");
    const imageResponse = await fetch(imageUrl.toString());
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download generated image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    // Create a unique filename
    const imageId = uuidv4();
    const isBackView = !prompt.includes("front view") && prompt.includes("back view");
    const filename = `jersey_${imageId}.png`;
    const outputPath = path.join(process.cwd(), 'output', filename);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(path.join(process.cwd(), 'output'))) {
      fs.mkdirSync(path.join(process.cwd(), 'output'), { recursive: true });
    }
    
    // Save the image
    console.log(`Saving image to ${outputPath}...`);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, buffer);
    
    // Log success information
    try {
      const logFilePath = path.join(imageLogsDir, 'successful_generations.json');
      let logs = [];
      
      if (fs.existsSync(logFilePath)) {
        const logsContent = fs.readFileSync(logFilePath, 'utf8');
        logs = JSON.parse(logsContent);
      }
      
      logs.push({
        timestamp: new Date().toISOString(),
        imageId,
        filename,
        generationTimeMs: generationTime,
        promptLength: prompt.length,
        modelVersion,
        parameters: input
      });
      
      fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
    } catch (logError) {
      console.warn("Failed to log image generation:", logError);
    }
    
    // Return the local URL
    return `/output/${filename}`;
  } catch (unknownError: unknown) {
    const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError));
    console.error("Error generating image with Replicate:", error);
    
    // Log failed attempts
    try {
      const errorLogPath = path.join(imageLogsDir, 'failed_generations.json');
      let errorLogs = [];
      
      if (fs.existsSync(errorLogPath)) {
        const logsContent = fs.readFileSync(errorLogPath, 'utf8');
        errorLogs = JSON.parse(logsContent);
      }
      
      errorLogs.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        prompt: prompt.substring(0, 200) + "..." // Log just the beginning to avoid massive logs
      });
      
      fs.writeFileSync(errorLogPath, JSON.stringify(errorLogs, null, 2), 'utf8');
    } catch (logError) {
      console.warn("Failed to log image generation error:", logError);
    }
    
    // Look for fallback image - if the front view or combined image fails
    const fallbackImage = "/output/fallback_jersey.png";
      
    // Return the fallback image or throw the error
    if (fs.existsSync(path.join(process.cwd(), fallbackImage.substring(1)))) {
      console.log("Using fallback image:", fallbackImage);
      return fallbackImage;
    }
    
    // If no fallback exists, throw an error with a detailed message
    throw new Error(`Failed to generate jersey image: ${error.message}. Please try again with different design parameters.`);
  }
}