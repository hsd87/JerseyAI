import { SportType, KitType, FormOptionConfig } from './schema';

/**
 * This configuration file implements the form structure based on the CSV configuration
 * It defines which fields should be shown for each sport and kit component combination
 * and what values are valid for each field based on the CSV data.
 */

// Define the form configuration for each sport+kit combination
export const formConfig: Record<string, FormOptionConfig> = {
  // Soccer configurations
  'soccer-jerseyOnly': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['short', 'long'],
    collarStyle: ['V-neck', 'crew neck', 'mandarin', 'polo collar', 'polo collar without button'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  'soccer-jerseyShorts': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['short', 'long'],
    collarStyle: ['V-neck', 'crew neck', 'mandarin', 'polo collar', 'polo collar without button'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  'soccer-tracksuit': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['long', 'sleeveless'],
    collarStyle: ['full zip', 'hooded', 'half zip'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  'soccer-trackjacket': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['long', 'sleeveless'],
    collarStyle: ['full zip', 'hooded', 'half zip'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  'soccer-trackTrouser': {
    showFields: ['gender', 'colors', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  
  // Basketball configurations
  'basketball-jerseyOnly': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['sleeveless'],
    collarStyle: ['V-neck', 'crew neck', 'scoop neck', 'deep neck'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  'basketball-jerseyShorts': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['sleeveless'],
    collarStyle: ['V-neck', 'crew neck', 'scoop neck', 'deep neck'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  
  // Field Hockey configurations
  'feild hockey-jerseyOnly': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['sleeveless', 'short', 'long'],
    collarStyle: ['V-neck', 'crew neck', 'mandarin', 'polo collar', 'polo collar without button'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  
  // Volleyball configurations
  'volleyball-jerseyOnly': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['sleeveless', 'short', 'long'],
    collarStyle: ['V-neck', 'crew neck', 'mandarin', 'polo collar', 'polo collar without button'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  
  // Handball configurations  
  'handball-jerseyOnly': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['sleeveless', 'short', 'long'],
    collarStyle: ['V-neck', 'crew neck', 'mandarin', 'polo collar', 'polo collar without button'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  
  // Esports configurations
  'esports-jersey': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['short', 'long'],
    collarStyle: ['V-neck', 'crew neck', 'mandarin', 'polo collar', 'polo collar without button'],
    patternStyle: ['Gradient', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  'esports-esportsjacket': {
    showFields: ['gender', 'colors', 'sleeveLength', 'collarType', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    sleeveLength: ['long', 'sleeveless'],
    collarStyle: ['full zip', 'hooded', 'half zip'],
    patternStyle: ['Gradient', 'Digital', 'Minimal', 'electric', 'tech', 'geometric', 'front heavy']
  },
  'esports-esportsTrouser': {
    showFields: ['gender', 'colors', 'patternStyle', 'designInspiration'],
    gender: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent1', 'accent2'],
    patternStyle: ['Gradient', 'Digital', 'Minimal', 'electric', 'geometric', 'tech']
  }

  // Additional sport/kit combinations can be added here as needed
};

/**
 * Helper function to get form configuration for a sport and kit combination
 */
export function getFormConfig(sport: SportType, kitType: KitType): FormOptionConfig {
  const key = `${sport}-${kitType}`;
  
  // Try to get the specific configuration
  if (formConfig[key]) {
    return formConfig[key];
  }
  
  // If not found, look for a similar configuration for the same sport
  const fallbackConfigs = Object.keys(formConfig).filter(k => k.startsWith(`${sport}-`));
  if (fallbackConfigs.length > 0) {
    console.warn(`No specific form configuration found for ${key}. Using ${fallbackConfigs[0]} as fallback.`);
    return formConfig[fallbackConfigs[0]];
  }
  
  // Ultimate fallback is soccer jersey
  console.warn(`No form configuration found for ${sport}. Using soccer-jerseyOnly as fallback.`);
  return formConfig['soccer-jerseyOnly'];
}