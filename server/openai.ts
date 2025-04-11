import OpenAI from "openai";

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
  // In a real implementation, we would call the Replicate API here with the prompt
  // For now, return a mock image URL
  console.log("Generated prompt for Replicate:", prompt);
  
  // This would be replaced with actual Replicate API call
  // Example:
  // const response = await fetch("https://api.replicate.com/v1/predictions", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Authorization": `Token ${process.env.REPLICATE_API_KEY}`
  //   },
  //   body: JSON.stringify({
  //     version: "replicate-model-version",
  //     input: { prompt: prompt }
  //   })
  // });
  
  // For demo purposes, return placeholder sports jersey image
  if (prompt.includes("front")) {
    return "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2000&auto=format&fit=crop";
  } else {
    return "https://images.unsplash.com/photo-1580087433295-ab2600c1030e?q=80&w=2000&auto=format&fit=crop";
  }
}