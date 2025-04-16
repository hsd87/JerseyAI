import fs from 'fs';
import path from 'path';
import { 
  generateFullConfig, 
  sports, 
  kitTypes, 
  schemas, 
  pricing 
} from '../utils/config-parser';

// Paths to CSV files
const dataDir = path.join(process.cwd(), 'attached_assets');
const outputDir = path.join(process.cwd(), 'data');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

export function generateConfigs() {
  console.log('Generating configuration files...');
  
  // CSV file paths
  const aiDesignerPath = path.join(dataDir, 'ai designer form config - Sheet1.csv');
  const orderFormPath = path.join(dataDir, 'order form config  - Sheet1.csv');
  const pricingPath = path.join(dataDir, 'sku and price config  - Sheet1.csv');
  
  try {
    // Generate the full configuration
    const config = generateFullConfig(aiDesignerPath, orderFormPath, pricingPath);
    
    // Update global variables
    Object.assign(sports, config.sports);
    Object.assign(kitTypes, config.kitTypes);
    Object.assign(schemas, config.schemas);
    Object.assign(pricing, config.pricing);
    
    // Write configuration files
    fs.writeFileSync(
      path.join(outputDir, 'sports.json'),
      JSON.stringify(config.sports, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'kit-types.json'),
      JSON.stringify(config.kitTypes, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'schemas.json'),
      JSON.stringify(config.schemas, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputDir, 'pricing.json'),
      JSON.stringify(config.pricing, null, 2)
    );
    
    console.log('All configuration files generated successfully!');
    return true;
  } catch (error) {
    console.error('Error generating configuration files:', error);
    return false;
  }
}

// If script is run directly
if (require.main === module) {
  generateConfigs();
}