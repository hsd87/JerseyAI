import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Define types for our configuration data
interface FormConfig {
  sport: string;
  kitComponent: string;
  formOptions: string[];
  gender: string[];
  colors: string[];
  sleeveLength: string[];
  collarStyle: string[];
  patternStyle: string[];
  designInspiration: string[];
}

interface SkuDetails {
  productName: string;
  sku: string;
  orderFormInputs: string[];
  quantity: string;
  size: string;
  fabric: string[];
  style: string[];
  fitType: string[];
  makingPreferences: string;
  addOns: string;
}

interface SkuPrice {
  skuId: string;
  productName: string;
  productType: string;
  sports: string;
  basePrice: number;
  allowedAiDesigner: boolean;
  addOnsAllowed: string;
  sizesAvailable: string;
  gender: string;
  quantityTiers: string;
  currency: string;
}

// Helper function to parse CSV files
function parseCsvFile(filePath: string): any[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    return records;
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error);
    return [];
  }
}

// Helper function to clean data and split comma-separated values
function cleanField(field: string): string[] {
  if (!field) return [];
  return field.split('/').map(item => item.trim()).filter(Boolean);
}

// Function to convert designer form config CSV to JSON
function parseDesignerFormConfig(filePath: string): FormConfig[] {
  const records = parseCsvFile(filePath);
  
  return records.map(record => ({
    sport: record.sports?.trim() || '',
    kitComponent: record['kit components']?.trim() || '',
    formOptions: cleanField(record['form options']),
    gender: cleanField(record.gender),
    colors: record.colors ? record.colors.split(',').map((c: string) => c.trim()) : [],
    sleeveLength: cleanField(record['sleeve lenght']),
    collarStyle: cleanField(record['collar style']),
    patternStyle: cleanField(record['pattern style']),
    designInspiration: cleanField(record['design inspiration'])
  }));
}

// Function to convert SKU details CSV to JSON
function parseSkuDetails(filePath: string): SkuDetails[] {
  const records = parseCsvFile(filePath);
  
  return records.map(record => ({
    productName: record['PRODUCT NAME']?.trim() || '',
    sku: record.SKU?.trim() || '',
    orderFormInputs: cleanField(record['ORDER FORM INPUTS']),
    quantity: record.QTY?.trim() || '',
    size: record.SIZE?.trim() || '',
    fabric: cleanField(record.FABRIC),
    style: cleanField(record.STYLE),
    fitType: cleanField(record['FIT TYPE']),
    makingPreferences: record['MAKING PREFRENCES']?.trim() || '',
    addOns: record['ADD ON']?.trim() || ''
  }));
}

// Function to convert SKU price config CSV to JSON
function parseSkuPrices(filePath: string): SkuPrice[] {
  const records = parseCsvFile(filePath);
  
  return records.map(record => ({
    skuId: record['sku id']?.trim() || '',
    productName: record['Product name']?.trim() || '',
    productType: record['product type']?.trim() || '',
    sports: record.sports?.trim() || '',
    basePrice: Number(record['Base Price']) || 0,
    allowedAiDesigner: record['allowed  ai designer']?.trim().toLowerCase() === 'yes',
    addOnsAllowed: record['Add-Ons Allowed']?.trim() || '',
    sizesAvailable: record['Sizes Available']?.trim() || '',
    gender: record.Gender?.trim() || '',
    quantityTiers: record['Quantity Tiers']?.trim() || '',
    currency: record.Currency?.trim() || 'USD'
  }));
}

// Main function to generate all config files
export async function generateConfigFiles() {
  try {
    // Path to the CSV files
    const designerFormConfigPath = path.resolve('attached_assets/ai designer form config - Sheet1.csv');
    const skuDetailsPath = path.resolve('attached_assets/order form config  - Sheet1.csv');
    const skuPricesPath = path.resolve('attached_assets/sku and price config  - Sheet1.csv');
    
    // Parse the CSV files
    const designerFormConfig = parseDesignerFormConfig(designerFormConfigPath);
    const skuDetails = parseSkuDetails(skuDetailsPath);
    const skuPrices = parseSkuPrices(skuPricesPath);
    
    // Create the config directory if it doesn't exist
    const configDir = path.resolve('data/config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write the JSON files
    fs.writeFileSync(
      path.join(configDir, 'designer-form-config.json'),
      JSON.stringify(designerFormConfig, null, 2)
    );
    
    fs.writeFileSync(
      path.join(configDir, 'sku-details.json'),
      JSON.stringify(skuDetails, null, 2)
    );
    
    fs.writeFileSync(
      path.join(configDir, 'sku-prices.json'),
      JSON.stringify(skuPrices, null, 2)
    );
    
    // Generate a unified product schema
    const productSchema = generateProductSchema(designerFormConfig, skuDetails, skuPrices);
    fs.writeFileSync(
      path.join(configDir, 'product-schema.json'),
      JSON.stringify(productSchema, null, 2)
    );
    
    // Generate kit mappings
    const kitMappings = generateKitMappings(designerFormConfig, skuDetails);
    fs.writeFileSync(
      path.join(configDir, 'kit-mappings.json'),
      JSON.stringify(kitMappings, null, 2)
    );
    
    console.log('All configuration files generated successfully!');
    return true;
  } catch (error) {
    console.error('Error generating configuration files:', error);
    return false;
  }
}

// Function to generate unified product schema
function generateProductSchema(
  designerFormConfig: FormConfig[], 
  skuDetails: SkuDetails[], 
  skuPrices: SkuPrice[]
) {
  const schema: any = {};
  
  // Group by sport
  const sportGroups: Record<string, FormConfig[]> = {};
  designerFormConfig.forEach(config => {
    if (!sportGroups[config.sport]) {
      sportGroups[config.sport] = [];
    }
    sportGroups[config.sport].push(config);
  });
  
  // Generate schema for each sport
  Object.entries(sportGroups).forEach(([sport, configs]) => {
    if (!schema[sport]) {
      schema[sport] = {
        kitTypes: {},
        commonOptions: {
          gender: Array.from(new Set(configs.flatMap(c => c.gender))),
          colors: Array.from(new Set(configs.flatMap(c => c.colors))),
          patternStyles: Array.from(new Set(configs.flatMap(c => c.patternStyle))),
          designInspiration: Array.from(new Set(configs.flatMap(c => c.designInspiration)))
        }
      };
    }
    
    // Add kit types for this sport
    configs.forEach(config => {
      const kitType = config.kitComponent;
      if (!kitType) return;
      
      // Find matching SKUs
      const matchingSku = findMatchingSku(kitType, skuDetails, skuPrices);
      
      schema[sport].kitTypes[kitType] = {
        formOptions: config.formOptions,
        skus: matchingSku ? [matchingSku.sku] : [],
        sleeveLength: config.sleeveLength,
        collarStyle: config.collarStyle,
        fabric: matchingSku ? matchingSku.fabric : [],
        fitType: matchingSku ? matchingSku.fitType : [],
        style: matchingSku ? matchingSku.style : [],
        basePrice: matchingSku && getSkuPrice(matchingSku.sku, skuPrices) ? 
          getSkuPrice(matchingSku.sku, skuPrices)?.basePrice : 0
      };
    });
  });
  
  return schema;
}

// Helper function to find a matching SKU for a kit type
function findMatchingSku(
  kitType: string, 
  skuDetails: SkuDetails[], 
  skuPrices: SkuPrice[]
): SkuDetails | null {
  // Map kit types to product types
  const kitToProductMap: Record<string, string> = {
    'jersey only': 'Jersey',
    'jersey + shorts': 'Jersey',
    'training track suit': 'TRAINING JACKET',
    'training track jacket': 'TRAINING JACKET',
    'track trouser': 'TRAINING TROUSER',
    'jersey + trousers': 'Jersey',
    'epsorts jacket': 'TRAINING JACKET',
    'esports trouser': 'TRAINING TROUSER'
  };
  
  const productName = kitToProductMap[kitType.toLowerCase()];
  if (!productName) return null;
  
  return skuDetails.find(sku => 
    sku.productName.toLowerCase() === productName.toLowerCase()
  ) || null;
}

// Helper function to get the price for a SKU
function getSkuPrice(sku: string, skuPrices: SkuPrice[]): SkuPrice | null {
  return skuPrices.find(price => price.skuId === sku) || null;
}

// Function to generate kit mappings
function generateKitMappings(
  designerFormConfig: FormConfig[], 
  skuDetails: SkuDetails[]
) {
  const kitMappings: Record<string, string[]> = {};
  
  // Map kit names to SKUs
  const kitNameToSku: Record<string, string> = {};
  skuDetails.forEach(detail => {
    const productName = detail.productName.trim().toLowerCase();
    if (productName === 'jersey') {
      kitNameToSku['jersey'] = detail.sku;
    } else if (productName === 'shorts') {
      kitNameToSku['shorts'] = detail.sku;
    } else if (productName === 'training jacket') {
      kitNameToSku['jacket'] = detail.sku;
    } else if (productName === 'training trouser') {
      kitNameToSku['trouser'] = detail.sku;
    }
  });
  
  // Create mappings
  designerFormConfig.forEach(config => {
    const kitType = config.kitComponent.trim().toLowerCase();
    const skus: string[] = [];
    
    if (kitType === 'jersey only') {
      if (kitNameToSku['jersey']) skus.push(kitNameToSku['jersey']);
    } else if (kitType === 'jersey + shorts') {
      if (kitNameToSku['jersey']) skus.push(kitNameToSku['jersey']);
      if (kitNameToSku['shorts']) skus.push(kitNameToSku['shorts']);
    } else if (kitType === 'training track suit') {
      if (kitNameToSku['jacket']) skus.push(kitNameToSku['jacket']);
      if (kitNameToSku['trouser']) skus.push(kitNameToSku['trouser']);
    } else if (kitType === 'training track jacket') {
      if (kitNameToSku['jacket']) skus.push(kitNameToSku['jacket']);
    } else if (kitType === 'track trouser') {
      if (kitNameToSku['trouser']) skus.push(kitNameToSku['trouser']);
    }
    
    if (skus.length > 0) {
      kitMappings[kitType] = skus;
    }
  });
  
  return kitMappings;
}