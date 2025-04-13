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

// Sample prompt template that serves as a structural guide
const samplePrompt = `⸻

Prompt:

A pfsoccerkit for soccer, displayed in two cleanly aligned angles: front view (left) and back view (right), against a crisp white studio background. The soccer jersey and shorts are presented in a floating, mannequin-free layout, suitable for high-end product catalog visuals. Both views are perfectly centered, evenly spaced, and fully visible. No cleats, socks, or models — just the uniform, front and back.

⸻

🧍‍♂️ Garment Structure

The uniform consists of a short-sleeved soccer jersey and tapered mid-thigh athletic shorts. The jersey features a hybrid mandarin V-collar, angular shoulder seams, and a form-fitting streamlined cut through the torso. The shorts include sculpted side panels, a reinforced waistband, and slit hems for dynamic movement.

⸻

🧵 Fabric & Texture

Constructed from a dual-zone poly-elastane blend, the jersey incorporates diamond-knit mesh on the torso and smooth matte spandex sleeves. Side panels are embedded with vented hex-weave textures. The material has a low-luster finish, designed to reflect controlled lighting and rich color. Seams are bonded and flatlocked, with detail piping following panel boundaries.

⸻

🎨 Color Scheme
        • Primary Color: deep royal blue
        • Secondary Color: vibrant scarlet red
        • Accent: Ice white trim and dark contours

⸻

🎨 Design Language

The front of the jersey features an elegant yet modern circuit crest pattern, radiating outward from the chest center in vibrant scarlet red, resembling a digital emblem. Thin contour lines wrap along the ribs and upper chest in a tech-geometry. A sharp white slash element cuts diagonally across the midsection, forming a bold angle that intersects the main motif. Sleeve cuffs are trimmed in vibrant scarlet red with subtle dotted patterns near the hem.

The back of the jersey includes a vibrant scarlet red vertical spine pattern, composed of interlocking bands. The player name is positioned just below the collar in clean uppercase text, with the number centered mid-back in large vibrant scarlet red numerals outlined in white. A deep deep royal blue halo gradient behind the number adds tonal contrast.

⸻

🩳 Shorts Design

Shorts are deep royal blue with angular vibrant scarlet red side panels, shaped like descending wedges that taper toward the knee. A thin white trim outlines the bottom hem and side slits. Rear panel shaping follows the glute contour with internal stitching and a slight back yoke drop. The left thigh displays a vibrant scarlet red team crest; the right thigh features an optional player number or minimal icon.

⸻

🧩 Panel & Trim Breakdown
        • Collar: hybrid mandarin V-collar in deep royal blue with vibrant scarlet red edge taping
        • Sleeves: Matte deep royal blue with dotted vibrant scarlet red cuff details
        • Front Body: Circuit crest-centered vibrant scarlet red burst, angled white slash
        • Back Body: Vertical vibrant scarlet red tech spine with clean typography block
        • Shorts: Sculpted fit with angular vibrant scarlet red inserts and hem detailing

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

The design is bold, distinctive, and meticulously engineered — merging the power of tradition with the precision of modern performancewear. The vibrant scarlet red-on-deep royal blue palette evokes prestige, while the circuit patterning adds a tech-forward identity. This uniform is ideal for trophy-season campaigns, limited-edition drops, or teams with a legacy-driven brand story.
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
You are a highly skilled AI assistant specializing in generating production-ready prompts for image generation models based on user form inputs.

Your job is to take a given "sample prompt" as a template, and then recreate it in detail using the "form inputs" provided.

🧾 Instructions:
- Use the **sample prompt as your structural guide**.
- Adapt and rewrite the content using the **provided form input** values.
- The **prompt must always include the token "pfsoccerkit"**, even if the sport changes.
- Make **contextual changes** based on the sport (e.g. basketball jerseys must be sleeveless).
- Be extremely detailed in the garment construction, materials, and design elements.
- Add intelligent detail for:
  • front and back design
  • sleeve variations (front, back, cuffs)
  • fabric textures and technical structure
  • placement of logos, numbers, patterns
  • design motifs and color blends
- Do **not paraphrase blindly** — understand the sport's kit format and **adjust intelligently**.
- Maintain the same format and section dividers (⸻, 🎨, 🧍‍♂️, 🧵, etc.) from the sample.

👩‍🎨 Sample Prompt (Template):
${samplePrompt}

📋 Form Inputs (from user):
${JSON.stringify(formInputs)}

🎯 Now generate an enhanced AI image prompt with all changes applied, and return as:
{ "prompt": "..." }
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