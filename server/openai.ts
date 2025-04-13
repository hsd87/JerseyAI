import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Replicate from "replicate";

// Initialize OpenAI client - using the newest model
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Export the prompt generation options interface for external use
export interface GenerateKitPromptOptions {
  sport: string;
  kitType: string;
  primaryColor: string;
  secondaryColor: string;
  sleeveStyle?: string;
  collarType?: string;
  patternStyle?: string;
  designNotes?: string;
}

// Detailed jersey design prompt template
const basePrompt = `A pfsoccerkit soccer jersey, shown in two aligned views — front (left) and back (right) — against a clean white studio background in a floating, mannequin-free layout, optimized for elite sportswear catalog presentation. The jersey is the sole focus, with no shorts, socks, or accessories.

⸻

🧵 Construction & Form

The jersey is built with an athletic cut-and-sew panel system, tailored for high-mobility match play and visual layering. It includes:
        •       Modern hybrid V-neck collar with angular contour
        •       Set-in short sleeves with segmented print zones
        •       Slight drop-tail hem and tapered waist
        •       Full garment optimized for sublimated graphics and contrast motion visuals

⸻

🧪 Material & Texture Zones
        •       Front body: Dual-fiber polyknit with a low-gloss tech-mesh surface
        •       Side panels: Matte performance lycra, built to contrast the central gloss texture
        •       Sleeves: Textured tri-blend poly with ribbed visual stretch zones
        •       Stitching: Reinforced flatlock seams with contrast topstitching
        •       Hemline: Double-needle finish with tonal trim

⸻

🎨 Color Scheme
        •       Primary: Storm graphite black
        •       Secondary: Pulse red
        •       Accent Layers: Glitch white, spectral cyan, matte silver

⸻

🎯 Front Design – Motion Graphic

The front body explodes with a multi-layered motion burst graphic, engineered to create a sense of controlled chaos and speed.
        •       A diagonal vector blast erupts from the lower left hem, extending upward to the right shoulder in layered angular shards
        •       The core of the burst is pulse red, surrounded by flickering cyan echo lines and jagged glitch-white overlays
        •       Matte silver vapor trails stretch behind the shards, giving a sense of layered depth and motion
        •       A central breathable zone runs down the chest in storm graphite, framed by asymmetrical edges
        •       Sleeves include streaking accents that mirror the core burst, wrapping slightly toward the triceps

⸻

🎯 Back Design – Extended Echo Pattern

The back view mirrors the burst logic in a subtler, more spacious layout, built for number clarity:
        •       A clean graphite field dominates the upper back to host player name and number
        •       The echoed motion pattern emerges from the lower right hem, sweeping up toward the left shoulder blade
        •       Light digital glitches and split-pulse arcs fade upward along the spine
        •       Underarm panel lines continue seamlessly from the front, providing design wraparound

⸻

🧩 Trim & Panel Detailing
        •       Neckline: Angular hybrid V in pulse red with a silver inner binding strip
        •       Sleeve cuffs: Dual-layer rib in glitch white with cyan piping
        •       Side panels: Full contrast lycra in matte graphite with sublimated pattern bleed
        •       Seams: All front-to-back transitions are matched and continuous

⸻

🏷️ Brand/Print Zones (Clean or Placeholder)
        •       Front left chest: Emblem or club crest zone
        •       Front right chest: Brand or sponsor logo
        •       Back top: Player name block
        •       Back center: Sublimated number space
        •       Left sleeve: Optional badge zone
        •       Right sleeve: Secondary graphic or tech icon

⸻

🌐 Design Intent & Feel

This jersey is built to evoke energy, speed, and visual disruption. The dynamic layout uses directional shards, motion echoes, and techno-glitch accents to create a kit that feels alive on the field. It's perfect for elite matchday gear, esports collabs, or urban street kit drops — high-performance in motion and in mindset.
`;

export async function generateKitPrompt(options: GenerateKitPromptOptions): Promise<string> {
  // Extract all form inputs
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
  
  // Log the inputs we're sending to OpenAI
  console.log(`Generating prompt for ${sport} jersey with inputs:`, JSON.stringify({
    sport,
    kitType,
    primaryColor,
    secondaryColor,
    sleeveStyle: sleeveStyle || "[default]",
    collarType: collarType || "[default]",
    patternStyle: patternStyle || "[default]",
    designNotes: designNotes ? "Provided" : "None" 
  }, null, 2));
  
  // Prepare form inputs as JSON string for OpenAI
  const formInputs = {
    sport,
    kitType,
    primaryColor,
    secondaryColor,
    ...(sleeveStyle ? { sleeveStyle } : {}),
    ...(collarType ? { collarType } : {}),
    ...(patternStyle ? { patternStyle } : {}),
    ...(designNotes ? { designNotes } : {})
  };
  
  // The instruction for OpenAI to generate a proper prompt
  const promptGenerationInstruction = `
You are a sports jersey design expert who creates detailed prompts for AI image generation.

🧾 TASKS:
1. Take the BASE PROMPT provided and adapt it to the user's FORM INPUTS
2. Keep the exact same structure and section dividers from the BASE PROMPT
3. ALWAYS include the token "pfsoccerkit" even when changing the sport
4. Make sport-specific adaptations (basketball jerseys must be sleeveless, soccer has short sleeves, etc.)
5. Adjust color scheme to use the user's PRIMARY and SECONDARY colors
6. Adapt design elements to match the user's chosen sport while keeping the detailed description style
7. Return ONLY a JSON object with a single "prompt" key containing your adapted text

IMPORTANT SPORT-SPECIFIC NOTES:
- Basketball: Always sleeveless design, wide armholes, focus on motion graphics for dynamic play
- Soccer: Short sleeves, focus on team identity and technical performance elements
- Rugby: Reinforced collar and shoulders, durable materials
- American Football: Structured fit for pad accommodation, reinforced seams
- Esports: Modern styling with neon accents, digital patterns, focus on branding zones
- Baseball: Distinctive button front, contrast sleeves
- Hockey: Performance cut for over-padding, reinforced hem

BASE PROMPT:
${basePrompt}

FORM INPUTS:
${JSON.stringify(formInputs)}

Respond only with:
{ "prompt": "your adapted prompt goes here" }
`;

  try {
    console.log("Calling OpenAI to generate enhanced prompt...");
    
    // Call OpenAI to generate an enhanced prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the newest model
      messages: [
        { role: "system", content: promptGenerationInstruction },
        { role: "user", content: "Please generate the prompt based on the instructions and inputs above." }
      ],
      response_format: { type: "json_object" },
    });

    // Extract and log the generated prompt
    const content = response.choices[0].message.content;
    if (!content) {
      console.warn("OpenAI returned empty content. Falling back to direct prompt.");
      return generateBasicPrompt(options);
    }

    try {
      // Parse the content to get the prompt
      const jsonContent = JSON.parse(content);
      const enhancedPrompt = jsonContent.prompt;
      
      // Log generated prompt (truncated for log readability)
      console.log("Generated prompt (first 100 chars):", enhancedPrompt.substring(0, 100) + "...");
      
      // Create logs directory if it doesn't exist
      const promptLogsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(promptLogsDir)) {
        fs.mkdirSync(promptLogsDir, { recursive: true });
      }
      
      // Log successful prompts for future analysis
      try {
        const promptLogFile = path.join(promptLogsDir, 'successful_prompts.json');
        let existingLogs: any[] = [];
        
        if (fs.existsSync(promptLogFile)) {
          const logsContent = fs.readFileSync(promptLogFile, 'utf8');
          existingLogs = JSON.parse(logsContent);
        }
        
        // Add this prompt to logs
        existingLogs.push({
          timestamp: new Date().toISOString(),
          sport,
          primaryColor,
          secondaryColor,
          kitType,
          prompt: enhancedPrompt
        });
        
        fs.writeFileSync(promptLogFile, JSON.stringify(existingLogs, null, 2), 'utf8');
      } catch (logError) {
        console.warn("Failed to log prompt:", logError);
      }
      
      return enhancedPrompt;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      console.warn("Falling back to basic prompt.");
      return generateBasicPrompt(options);
    }
  } catch (error) {
    console.error("Error generating enhanced prompt with OpenAI:", error);
    console.warn("Falling back to basic prompt.");
    return generateBasicPrompt(options);
  }
}

// Fallback prompt generation if OpenAI call fails
async function generateBasicPrompt(options: GenerateKitPromptOptions): Promise<string> {
  const { 
    sport, 
    kitType, 
    primaryColor, 
    secondaryColor 
  } = options;
  
  // Create a simple prompt format that doesn't rely on OpenAI
  return `⸻

Prompt:

A pfsoccerkit for ${sport}, displayed in two cleanly aligned angles: front view (left) and back view (right), against a crisp white studio background. The ${sport} jersey is presented in a floating, mannequin-free layout, suitable for high-end product catalog visuals. Both views are perfectly centered, evenly spaced, and fully visible. No cleats, socks, or models — just the jersey, front and back.

⸻

🧍‍♂️ Garment Structure

The jersey is a ${sport}-specific design with appropriate structure and fit for the sport.

⸻

🧵 Fabric & Texture

Constructed from a high-performance poly-elastane blend with appropriate ventilation and structure for ${sport}.

⸻

🎨 Color Scheme
        • Primary Color: ${primaryColor}
        • Secondary Color: ${secondaryColor}
        • Accent: White trim and dark contours

⸻

🎨 Design Language

The jersey features a modern, sport-authentic design with the ${primaryColor} as the base and ${secondaryColor} accents placed according to ${sport} traditions.

⸻

🧩 Panel & Trim Breakdown
        • Front Body: Sport-appropriate design in ${primaryColor} with ${secondaryColor} detailing
        • Back Body: Clean player name and number placement with ${secondaryColor} numerals

⸻

🏷️ Logo & Branding Placement (Sublimated or Heat-Pressed)
        • Jersey front left chest: Team crest
        • Jersey front right chest: Sponsor logo
        • Upper back (below collar): Player name
        • Back center: Large number

⸻

🌐 Design Mood & Cohesion

A professional, competition-ready ${sport} jersey design with modern styling, optimized for display and visualization.
`;
}

export async function generateJerseyImageWithReplicate(prompt: string, kitType?: string): Promise<string> {
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
    
    // Set aspect ratio to 3:2 for all jerseys as requested
    const aspectRatio = "3:2";
    console.log(`Using consistent aspect ratio ${aspectRatio} for all jersey designs`);
    
    // Define the model ID and input with updated settings
    const modelVersion = "hsd87/pfai01:a55a5b66a5bdee91c0ad3af6a013c81741aad48dfaf4291f2d9a28a35e0a79c3";
    
    // Create the input configuration object with all requested parameters
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
    };
    
    // Add extra_lora_scale as a number parameter (explicitly adding it here to the typed object)
    (input as any).extra_lora_scale = 0.69;  // Using casting to add the property as a number
    (input as any).extra_lora = "";  // Set extra_lora to empty string as requested
    
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