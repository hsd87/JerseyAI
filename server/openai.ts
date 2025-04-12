import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

  const systemPrompt = `You are an expert sports kit designer. Create a detailed prompt for an AI image generator to create a realistic ${sport} jersey design.
  Follow these guidelines:
  - Focus on making the design look like a real, professional sports kit
  - Describe the jersey from a front view for the first image
  - Describe the jersey from a back view for the second image
  - Include specific details about color placement, patterns, and design elements
  - Use ${primaryColor} as the primary color and ${secondaryColor} as the secondary color
  - ${sleeveStyle ? `The sleeves should be ${sleeveStyle} style` : ''}
  - ${collarType ? `The collar should be ${collarType} style` : ''}
  - ${patternStyle ? `Incorporate a ${patternStyle} pattern into the design` : ''}
  - ${designNotes ? `Consider these additional design notes: ${designNotes}` : ''}
  
  Return your response as a JSON object with two properties:
  1. "frontPrompt": The prompt for the front view of the jersey
  2. "backPrompt": The prompt for the back view of the jersey`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to generate kit design prompt");
    }

    return content;
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
  
  // Step 1: Create the prediction with Replicate API
  try {
    const modelUrl = "https://api.replicate.com/v1/predictions";
    const response = await fetch(modelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`
      },
      body: JSON.stringify({
        version: "hsd87/pfai01:a55a5b66a5bdee91c0ad3af6a013c81741aad48dfaf4291f2d9a28a35e0a79c3", // Using the provided jersey model
        input: {
          prompt: prompt,
          aspect_ratio: "1:1",
          prompt_strength: 0.8,
          model: "dev",
          num_outputs: 1,
          num_inference_steps: 28,
          guidance_scale: 3,
          output_format: "png",
          disable_safety_checker: false
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Replicate API error:", errorData);
      throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();
    console.log("Prediction created:", prediction.id);
    
    // Step 2: Poll for the prediction result
    const maxAttempts = 30;  // 5 minutes (30 attempts x 10 seconds)
    let attempts = 0;
    let result;
    
    // Create a timeout promise
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    while (attempts < maxAttempts) {
      attempts++;
      
      const getResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`
        }
      });
      
      if (!getResponse.ok) {
        console.error(`Error checking prediction status: ${getResponse.status} ${getResponse.statusText}`);
        await sleep(10000);  // Wait 10 seconds before trying again
        continue;
      }
      
      result = await getResponse.json();
      
      if (result.status === "succeeded") {
        break;
      } else if (result.status === "failed") {
        throw new Error(`Image generation failed: ${result.error || "Unknown error"}`);
      }
      
      // Wait 10 seconds before checking again
      await sleep(10000);
    }
    
    if (!result || result.status !== "succeeded") {
      throw new Error("Image generation timed out or failed");
    }
    
    // Step 3: Download the generated image
    const imageUrl = result.output[0]; // First image in output array
    
    if (!imageUrl) {
      throw new Error("No image was generated");
    }
    
    const imageResponse = await fetch(imageUrl);
    
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