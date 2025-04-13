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
  
  // Format colors with hex: prefix if they are hex values
  const formattedPrimaryColor = primaryColor.startsWith('#') ? `hex:${primaryColor}` : primaryColor;
  const formattedSecondaryColor = secondaryColor.startsWith('#') ? `hex:${secondaryColor}` : secondaryColor;
  
  // Simple instruction for OpenAI
  const promptGenerationInstruction = `
Generate a detailed prompt for a ${sport} jersey. Include:
- Always use "pfsoccerkit" token
- Front view (left) and back view (right) against white background
- Primary color: ${formattedPrimaryColor}
- Secondary color: ${formattedSecondaryColor}
${sleeveStyle ? `- Sleeve style: ${sleeveStyle}` : ''}
${collarType ? `- Collar type: ${collarType}` : ''}
${patternStyle ? `- Pattern style: ${patternStyle}` : ''}
${designNotes ? `- Design notes: ${designNotes}` : ''}
- Sport-specific features (basketball = sleeveless, soccer = short sleeves)

Return ONLY a JSON object: { "prompt": "your detailed jersey description" }
`;

  try {
    // Skip API call if key is missing
    if (!process.env.OPENAI_API_KEY) {
      console.error("ERROR: OPENAI_API_KEY environment variable is not set!");
      return generateBasicPrompt(options);
    }
    
    // Call OpenAI to generate a prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
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
  const { sport, primaryColor, secondaryColor } = options;
  
  // Format colors with hex: prefix if they are hex values
  const formattedPrimaryColor = primaryColor.startsWith('#') ? `hex:${primaryColor}` : primaryColor;
  const formattedSecondaryColor = secondaryColor.startsWith('#') ? `hex:${secondaryColor}` : secondaryColor;
  
  // Create a simple prompt format
  return `A pfsoccerkit for ${sport}, displayed in two cleanly aligned angles: front view (left) and back view (right), against a clean white studio background. The ${sport} jersey is presented in a floating, mannequin-free layout, suitable for high-end product catalog visuals.

🎨 Color Scheme:
• Primary Color: ${formattedPrimaryColor}
• Secondary Color: ${formattedSecondaryColor}
• Accent: White trim and dark contours

The jersey features a modern, sport-authentic design with the ${formattedPrimaryColor} as the base and ${formattedSecondaryColor} accents placed according to ${sport} traditions. Front body has sport-appropriate design in ${formattedPrimaryColor} with ${formattedSecondaryColor} detailing. Back body has clean player name and number placement with ${formattedSecondaryColor} numerals.`;
}

export async function generateJerseyImageWithReplicate(prompt: string, kitType?: string): Promise<string> {
  // Check for API token
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not set. Please add this secret to continue.");
  }
  
  try {
    // Initialize the Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    
    // Set aspect ratio to 3:2 for all jerseys
    const aspectRatio = "3:2";
    
    // Define model and parameters
    const modelVersion = "hsd87/pfai01:a55a5b66a5bdee91c0ad3af6a013c81741aad48dfaf4291f2d9a28a35e0a79c3";
    
    // Create input parameters
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
      lora_scale: 1.05,
    };
    
    // Add extra parameters
    (input as any).extra_lora_scale = 0.69;
    (input as any).extra_lora = "";
    
    // Run the model prediction
    const startTime = Date.now();
    const output = await replicate.run(modelVersion, { input });
    const generationTime = Date.now() - startTime;
    
    console.log(`Image generated in ${generationTime}ms`);
    
    // Get the image URL from the output
    const imageUrl = Array.isArray(output) ? output[0] : output;
    if (!imageUrl) throw new Error("No image was generated");
    
    // Download the generated image
    const imageResponse = await fetch(imageUrl.toString());
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    // Create a unique filename and save the image
    const imageId = uuidv4();
    const filename = `jersey_${imageId}.png`;
    const outputDir = path.join(process.cwd(), 'output');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save the image
    const outputPath = path.join(outputDir, filename);
    const arrayBuffer = await imageResponse.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    
    // Return the local URL
    return `/output/${filename}`;
  } catch (error) {
    console.error("Error generating image:", error);
    
    // Use fallback image if available
    const fallbackImage = "/output/fallback_jersey.png";
    if (fs.existsSync(path.join(process.cwd(), fallbackImage.substring(1)))) {
      return fallbackImage;
    }
    
    // Otherwise throw error
    throw error instanceof Error 
      ? error 
      : new Error(String(error));
  }
}