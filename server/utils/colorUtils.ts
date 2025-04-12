/**
 * Color utilities for jersey design prompt generation
 * Converts hex codes and color names to more descriptive terminology for AI prompts
 */

// Color mapping to convert hex codes or basic color names to descriptive sports terminology
export const colorMapping: Record<string, string> = {
  // Basic colors
  "red": "vibrant scarlet red",
  "blue": "deep royal blue",
  "green": "emerald green",
  "yellow": "brilliant gold",
  "orange": "rich sunset orange",
  "purple": "majestic purple",
  "black": "deep jet black",
  "white": "pristine white",
  "grey": "sleek silver grey",
  "gray": "sleek silver grey",
  "pink": "striking pink",
  "brown": "rustic brown",
  "navy": "traditional navy blue",
  "maroon": "classic maroon",
  "teal": "ocean teal",
  "olive": "traditional olive green",
  "cyan": "bright cyan blue",
  
  // Soccer team colors
  "barcelona blue": "Barcelona blue and garnet",
  "madrid white": "Real Madrid pristine white",
  "liverpool red": "Liverpool cardinal red",
  "chelsea blue": "Chelsea royal blue",
  "arsenal red": "Arsenal crimson red",
  
  // Basketball team colors
  "lakers purple": "Lakers royal purple and gold",
  "celtics green": "Celtics traditional green",
  "bulls red": "Chicago Bulls fiery red",
  "heat black": "Miami Heat sleek black and red",
  
  // Common hex codes
  "#ff0000": "vibrant scarlet red",
  "#00ff00": "bright lime green",
  "#0000ff": "deep royal blue",
  "#ffff00": "brilliant gold",
  "#ff8000": "rich sunset orange",
  "#800080": "majestic purple",
  "#000000": "deep jet black",
  "#ffffff": "pristine white",
  "#808080": "sleek silver grey",
  "#ffc0cb": "soft pink",
  "#800000": "classic maroon",
  "#008080": "ocean teal",
  "#808000": "traditional olive green",
};

/**
 * Convert color input (name or hex) to descriptive sports terminology
 * @param colorInput The color name or hex code
 * @returns Descriptive sports color terminology
 */
export function convertToDescriptiveColor(colorInput: string): string {
  if (!colorInput) return "";
  
  // If it's already in our mapping, return the mapped value
  if (colorInput.toLowerCase() in colorMapping) {
    return colorMapping[colorInput.toLowerCase()];
  }
  
  // Handle hex codes that aren't in our predefined mapping
  if (colorInput.startsWith('#')) {
    try {
      // Convert hex to RGB
      const r = parseInt(colorInput.slice(1, 3), 16);
      const g = parseInt(colorInput.slice(3, 5), 16);
      const b = parseInt(colorInput.slice(5, 7), 16);
      
      // For simplicity, we'll add a description based on RGB values
      const colors = [];
      if (r > 200) colors.push("red");
      if (g > 200) colors.push("green");
      if (b > 200) colors.push("blue");
      
      if (colors.length === 0) {
        if (r > g && r > b) colors.push("reddish");
        else if (g > r && g > b) colors.push("greenish");
        else if (b > r && b > g) colors.push("bluish");
        else colors.push("neutral");
      }
      
      if (r < 50 && g < 50 && b < 50) return "deep dark";
      if (r > 200 && g > 200 && b > 200) return "bright white";
      
      const brightness = (r + g + b) / 3;
      const brightnessDesc = brightness > 200 ? "bright" : brightness < 100 ? "dark" : "medium";
      
      return `${brightnessDesc} ${colors.join("-")}`;
    } catch (e) {
      console.warn(`Failed to parse hex color: ${colorInput}`, e);
      return colorInput; // Return original if parsing fails
    }
  }
  
  // If it's not a recognized color or hex code, use as is with a "tone" suffix
  return `${colorInput} tone`; // Add "tone" to make it sound more descriptive
}