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
  accentColor1?: string;
  accentColor2?: string;
  sleeveStyle?: string;
  collarType?: string;
  patternStyle?: string;
  designNotes?: string;
}

export async function generateKitPrompt(options: GenerateKitPromptOptions): Promise<string> {
  console.log("generateKitPrompt received options:", JSON.stringify(options, null, 2));
  
  // Extract all form inputs
  const { 
    sport, 
    kitType, 
    primaryColor, 
    secondaryColor,
    accentColor1,
    accentColor2,
    sleeveStyle,
    collarType,
    patternStyle,
    designNotes 
  } = options;
  
  // Convert hex colors to RGB format
  function hexToRgb(hex: string) {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Convert colors to RGB format
  const formattedPrimaryColor = primaryColor.startsWith('#') ? hexToRgb(primaryColor) : primaryColor;
  const formattedSecondaryColor = secondaryColor.startsWith('#') ? hexToRgb(secondaryColor) : secondaryColor;
  const formattedAccentColor1 = accentColor1 && accentColor1.startsWith('#') ? hexToRgb(accentColor1) : accentColor1;
  const formattedAccentColor2 = accentColor2 && accentColor2.startsWith('#') ? hexToRgb(accentColor2) : accentColor2;
  
  console.log(`Processing design for ${sport} with colors: ${formattedPrimaryColor}, ${formattedSecondaryColor}${formattedAccentColor1 ? ', ' + formattedAccentColor1 : ''}${formattedAccentColor2 ? ', ' + formattedAccentColor2 : ''}`);
  
  // Comprehensive instructions for OpenAI
  const promptGenerationInstruction = `
Primary Objective

You are a prompt-generation assistant designed to create professional-grade garment prompts for image generation using FLUX.1 or similar high-end AI models. Your output must describe sportswear apparel in dual-angle format (front and back), using accurate garment construction terms, visual flow logic, and style-driven language.

The generated prompt must reflect real-world apparel structure, include fabric textures, panel transitions, color logic, and design intent, and be structured cleanly.
Must INCLUDE TOKEN: "PFSOCCERKIT"

⸻

📦 Core Prompt Structure

Each prompt must contain the following sections in this exact order:
        1.      Intro Line
        2.      🧍‍♂️ Garment Structure
        3.      🧵 Fabric & Construction
        4.      🎨 Color Scheme
        5.      🎯 Front Design Description
        6.      🎯 Back Design Description
        7.      🧩 Panel & Seam Flow
        8.      🏷️ Logo & Customization Zones
        9.      🌐 Design Intent & Audience

⸻

🧠 Formatting Instructions
        •       Use emoji headers for each section (as shown above)
        •       Do not include bullet points unless explaining multiple fabric zones, seam paths, or logo zones
        •       Always use descriptive formatting (paragraph-style explanations with apparel-specific vocabulary)
        •       Maintain a clean, confident, and technical tone, as if writing for a premium kit manufacturer

⸻

✍️ Prompt Content Rules

1. Intro Line
        •       Must start with:
TOKEN:"pfsoccerkit", displayed in two views: front view (left) and back view (right), aligned side-by-side against a clean white studio background.
        •       Describe it as:
floating, mannequin-free layout, ideal for product catalog, mockups, or ecommerce visualizations. Only the jersey is visible—no shorts or accessories.

⸻

2. 🧍‍♂️ Garment Structure
        •       Describe cut (athletic fit / relaxed / pro-cut), collar type (V-neck, hybrid, crew), sleeve construction (set-in or raglan), hem type (drop-tail, split vent), and silhouette.
        •       Use garment industry terminology.

⸻

3. 🧵 Fabric & Construction
        •       Mention texture zones (smooth knit, mesh side panels, ribbed cuffs).
        •       Describe stitching types (double-needle, flatlock), reinforcement points (cuffs, collar, underarms).
        •       Clarify front vs side vs back fabric treatments.

⸻

4. 🎨 Color Scheme
        •       List:
        •       Primary color: ${formattedPrimaryColor}
        •       Secondary color: ${formattedSecondaryColor}
        ${formattedAccentColor1 ? `•       Accent color 1: ${formattedAccentColor1}` : ''}
        ${formattedAccentColor2 ? `•       Accent color 2: ${formattedAccentColor2}` : ''}
        •       Highlight/trim colors
        •       Use rich, descriptive names (e.g., obsidian black, pulse red, glitch white)

⸻

5. 🎯 Front Design Description
        •       Be specific:
        •       Where does the design start (e.g., lower left hem)?
        •       What is the shape or style? (e.g., "angular shards", "burst pattern", "gradient mist")
        •       What colors are used in which zones?
        •       Mention overlays (e.g., echo lines, glitch trails, embossed texture)
        •       Describe if chest zone is left clean for number/logo placement

⸻

6. 🎯 Back Design Description
        •       Must mirror or complement the front design logically
        •       Front and back design must be cohesive in terms of sleeves, trims, elements, design, and construction
        •       Describe:
        •       Shoulder yoke
        •       Back panel texture
        •       Name/number zone placement
        •       Back fade patterns or continuity from front
        •       Keep seams matched for realism

⸻

7. 🧩 Panel & Seam Flow
        •       Emphasize cohesiveness between front and back design in terms of sleeves, trims, elements and construction
        •       Describe panel transitions between:
        •       Sleeves ↔ chest
        •       Side panels ↔ front/back
        •       Neck ↔ shoulder
        •       Mention seam matching front ↔ back
        •       Include details like underarm gussets, hem reinforcements, or stitch logic

⸻

8. 🏷️ Logo & Customization Zones

List these (even if the image will not include actual text or logos):
        •       Front left chest: Crest or emblem zone
        •       Front right chest: Brand or sponsor
        •       Back top: Player name
        •       Back mid-panel: Jersey number zone
        •       Left sleeve: Badge or federation patch (optional)
        •       Right sleeve: Secondary sponsor or design motif

⸻

9. 🌐 Design Intent & Audience
        •       Conclude with a short paragraph that explains:
        •       The aesthetic vibe (e.g., streetwear, elite match, esports crossover)
        •       The design energy (e.g., velocity, balance, chaos, minimalism)
        •       Ideal use case (e.g., high-level competition, fanwear drops, identity expression)

⸻

🧮 Word Count Target
        •       Minimum: 500 words
        •       Ideal Range: 600–700 words
        •       Maximum: 750 words

⸻

❌ What To Avoid
        •       No vague terms like "cool design" or "modern style"
        •       Do not repeat colors in multiple zones unless justified
        •       Do not mirror the front design on the back unless stated — always describe how the back complements or extends the front
        •       Avoid designs that lack cohesiveness between front and back in terms of sleeves, trims, elements, and construction
        •       No mention of cleats, players, or backgrounds
        •       ONLY include shorts if the kit component specifically includes them (jersey+shorts, full kit, or complete kit)

⸻

🧠 Examples of Language Style
        •       ✅ "A pulse red energy streak arcs from the lower right waist toward the upper left chest, trailing spectral blue echoes and pixel-split white overlays."
        •       ✅ "Back yoke panel in matte graphite frames the name zone, intersected by a ghosted vertical stitch emboss that runs through the spine."
        •       ✅ "Contrast-stitched underarm panels flow into the hemline, creating a layered dynamic silhouette."

⸻

SPECIFIC REQUIREMENTS FOR THIS JERSEY:
- Sport: ${sport} jersey
- Kit components: ${kitType === "jersey" || kitType === "jerseyOnly" ? "Jersey only" : 
                 kitType === "jerseyShorts" || kitType === "jerseyTrousers" ? "Jersey and shorts" : 
                 kitType === "fullKit" ? "Full kit with socks" : 
                 kitType === "completeKit" ? "Complete kit with headwear" : 
                 kitType === "esportsjacket" ? "Esports jacket" : "Jersey"}
${sleeveStyle ? `- Sleeve style: ${sleeveStyle}` : ''}
${collarType ? `- Collar type: ${collarType}` : ''}
${patternStyle ? `- Pattern style: ${patternStyle}` : ''}
${designNotes ? `- Design notes: ${designNotes}` : ''}
- Sport-specific features (basketball = sleeveless, soccer = short sleeves)
- If kit includes shorts, ensure both jersey and shorts are visible in the final image

Return ONLY a JSON object: { "prompt": "your detailed jersey description" }
`;

  try {
    // Skip API call if key is missing
    if (!process.env.OPENAI_API_KEY) {
      console.error("ERROR: OPENAI_API_KEY environment variable is not set!");
      return generateBasicPrompt(options);
    }
    
    // Call OpenAI to generate a prompt using the 4.5-preview model
    const response = await openai.chat.completions.create({
      model: "gpt-4-0125-preview", // Using GPT-4.5 Preview
      messages: [
        { role: "system", content: promptGenerationInstruction },
        { role: "user", content: "Generate prompt" }
      ],
      response_format: { type: "json_object" },
    });
    
    // Extract content from response
    const content = response.choices[0].message.content;
    if (!content) return generateBasicPrompt(options);
    
    // Parse JSON response
    const jsonContent = JSON.parse(content);
    const enhancedPrompt = jsonContent.prompt;
    
    // Log the prompt (truncated for readability)
    console.log("Generated prompt (first 100 chars):", enhancedPrompt.substring(0, 100) + "...");
    
    return enhancedPrompt;
  } catch (error) {
    console.error("Error generating prompt with OpenAI:", error);
    return generateBasicPrompt(options);
  }
}

// Fallback prompt generation if OpenAI call fails
async function generateBasicPrompt(options: GenerateKitPromptOptions): Promise<string> {
  const { sport, primaryColor, secondaryColor, accentColor1, accentColor2, kitType } = options;
  
  // Convert hex colors to RGB format
  function hexToRgb(hex: string) {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Convert colors to RGB format
  const formattedPrimaryColor = primaryColor.startsWith('#') ? hexToRgb(primaryColor) : primaryColor;
  const formattedSecondaryColor = secondaryColor.startsWith('#') ? hexToRgb(secondaryColor) : secondaryColor;
  const formattedAccentColor1 = accentColor1 && accentColor1.startsWith('#') ? hexToRgb(accentColor1) : accentColor1;
  const formattedAccentColor2 = accentColor2 && accentColor2.startsWith('#') ? hexToRgb(accentColor2) : accentColor2;
  
  // Create a simple prompt format
  const kitDescription = kitType === "jersey" || kitType === "jerseyOnly" ? "jersey only" :
                       kitType === "jerseyShorts" || kitType === "jerseyTrousers" ? "jersey and shorts" :
                       kitType === "fullKit" ? "full kit with socks" :
                       kitType === "completeKit" ? "complete kit with headwear" : 
                       kitType === "esportsjacket" ? "esports jacket" : "jersey";
  
  return `A pfsoccerkit for ${sport} (${kitDescription}), displayed in two cleanly aligned angles: front view (left) and back view (right), against a clean white studio background. The ${sport} ${kitDescription} is presented in a floating, mannequin-free layout, suitable for high-end product catalog visuals.

🎨 Color Scheme:
• Primary Color: ${formattedPrimaryColor}
• Secondary Color: ${formattedSecondaryColor}
${formattedAccentColor1 ? `• Accent Color 1: ${formattedAccentColor1}` : ''}
${formattedAccentColor2 ? `• Accent Color 2: ${formattedAccentColor2}` : ''}
• Trim: White trim and dark contours

The jersey features a modern, sport-authentic design with the ${formattedPrimaryColor} as the base and ${formattedSecondaryColor} accents placed according to ${sport} traditions. 
${formattedAccentColor1 ? `Details and trim are highlighted with ${formattedAccentColor1} for contrast.` : ''}
${formattedAccentColor2 ? `Additional accents in ${formattedAccentColor2} for depth and visual appeal.` : ''}
Front body has sport-appropriate design in ${formattedPrimaryColor} with ${formattedSecondaryColor} detailing. Back body has clean player name and number placement with ${formattedSecondaryColor} numerals.

Front and back designs are cohesive in terms of sleeves, trims, elements, design, and construction, ensuring a unified and professional look from all angles.

${kitType?.includes("Shorts") || kitType?.includes("Trousers") || kitType?.includes("Kit") ? 
`• ${kitType?.includes("Trousers") ? "Trousers" : "Shorts"} details: Matching ${sport} ${kitType?.includes("Trousers") ? "trousers" : "shorts"} in ${formattedPrimaryColor} with ${formattedSecondaryColor} accents${formattedAccentColor1 ? ` and ${formattedAccentColor1} trim` : ''}${formattedAccentColor2 ? `, plus ${formattedAccentColor2} details` : ''}, designed to complement the jersey style and maintain design cohesiveness.` : ''}`;
}

// Define a type for the image generation result
export interface ImageGenerationResult {
  imageUrl: string;
  imageData: string;
}

export async function generateJerseyImageWithReplicate(prompt: string, kitType?: string): Promise<ImageGenerationResult> {
  // Check for API token
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not set. Please add this secret to continue.");
  }
  
  // Initialize the Replicate client
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
  
  // Set aspect ratio based on kit type - 1:1 for jerseyShorts/jerseyTrousers, 3:2 for others
  const aspectRatio = kitType === "jerseyShorts" || kitType === "jerseyTrousers" ? "1:1" : "3:2";
  console.log(`Using aspect ratio ${aspectRatio} for kit type: ${kitType || "default"}`);
  
  // Define model and parameters
  const modelVersion = "hsd87/pfai01:a55a5b66a5bdee91c0ad3af6a013c81741aad48dfaf4291f2d9a28a35e0a79c3";
  
  // Create input parameters with proper types
  const input = {
    prompt: prompt,
    aspect_ratio: aspectRatio,
    prompt_strength: 0.8,
    model: "dev",
    num_outputs: 1,
    num_inference_steps: 28,
    guidance_scale: 2.9,
    output_format: "jpg",
    disable_safety_checker: false,
    lora_scale: 0.8,
    extra_lora: "",  // String type
    extra_lora_scale: 0.69  // Number type
  };
  
  // Remove retry logic - we want to handle retries in the frontend
  // This prevents duplicate API calls and gives more control to the user
  try {
    console.log(`Replicate API call with parameters:`, JSON.stringify(input, null, 2));
    
    const startTime = Date.now();
    const output = await replicate.run(modelVersion, { input });
    const generationTime = Date.now() - startTime;
    
    console.log(`Image generated in ${generationTime}ms`);
    
    if (!output) {
      throw new Error("No output received from Replicate API");
    }
    
    // Get the image URL or data from the output
    let imageUrl = Array.isArray(output) ? output[0] : output;
    
    if (!imageUrl) {
      console.error("No image URL or data in API response:", output);
      throw new Error("No image was generated by Replicate API");
    }
    
    // STEP 2: Handle the response based on its type
    
    // Case 1: Handle ReadableStream response
    if (typeof imageUrl === 'object' && 'locked' in imageUrl) {
      console.log("Detected ReadableStream response, processing stream data");
      
      // Create a unique filename
      const imageId = uuidv4();
      const filename = `jersey_${imageId}.png`;
      const outputDir = path.join(process.cwd(), 'output');
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, filename);
      
      // Read from the stream and save to file
      const reader = imageUrl.getReader();
      const chunks = [];
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(Buffer.from(value));
        }
        
        if (chunks.length === 0) {
          throw new Error("No data received from Replicate stream");
        }
        
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(outputPath, buffer);
        console.log(`Successfully saved image from ReadableStream to ${outputPath}`);
        
        // Convert buffer to base64 for database storage
        const base64Data = buffer.toString('base64');
        
        // Return both the file path and the base64 data
        return {
          imageUrl: `/output/${filename}`,
          imageData: base64Data
        };
      } catch (streamError) {
        console.error("Error processing ReadableStream:", streamError);
        throw new Error(`Failed to process image stream: ${streamError instanceof Error ? streamError.message : String(streamError)}`);
      }
    }
    
    // Case 2: Handle URL response
    console.log("Processing image from URL:", typeof imageUrl === 'string' ? imageUrl : 'Non-string URL');
    
    // Simple image download without retries, matching our no-retry strategy
    let imageResponse = null;
    try {
      console.log(`Downloading image from URL`);
      imageResponse = await fetch(imageUrl.toString());
      
      if (!imageResponse.ok) {
        throw new Error(`Download failed with status: ${imageResponse.status}`);
      }
    } catch (error) {
      console.error(`Image download error:`, error);
      throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    if (!imageResponse) {
      throw new Error("Failed to download image: No response");
    }
    
    // Save the downloaded image
    const imageId = uuidv4();
    const filename = `jersey_${imageId}.png`;
    const outputDir = path.join(process.cwd(), 'output');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, filename);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, buffer);
    
    // Convert buffer to base64 for database storage
    const base64Data = buffer.toString('base64');
    
    console.log(`Successfully saved image from URL to ${outputPath}`);
    return {
      imageUrl: `/output/${filename}`,
      imageData: base64Data
    };
    
  } catch (error) {
    console.error("Error generating or processing image:", error);
    
    // Use fallback image if available
    const fallbackImage = "/output/fallback_jersey.png";
    if (fs.existsSync(path.join(process.cwd(), fallbackImage.substring(1)))) {
      console.log("Using fallback image:", fallbackImage);
      
      try {
        // Read the fallback image and convert to base64
        const fallbackPath = path.join(process.cwd(), fallbackImage.substring(1));
        const imageBuffer = fs.readFileSync(fallbackPath);
        const base64Data = imageBuffer.toString('base64');
        
        return {
          imageUrl: fallbackImage,
          imageData: base64Data
        };
      } catch (readError) {
        console.error("Error reading fallback image:", readError);
        // If we can't read the fallback image, just return the URL
        return {
          imageUrl: fallbackImage,
          imageData: ""
        };
      }
    }
    
    // Otherwise throw error
    throw error instanceof Error 
      ? error 
      : new Error(String(error));
  }
}