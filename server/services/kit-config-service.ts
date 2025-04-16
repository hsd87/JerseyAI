import fs from 'fs';
import path from 'path';

// Define types for our configuration
interface ProductSchema {
  [sport: string]: {
    kitTypes: {
      [kitType: string]: {
        formOptions: string[];
        skus: string[];
        sleeveLength: string[];
        collarStyle: string[];
        fabric: string[];
        fitType: string[];
        style: string[];
        basePrice: number;
      };
    };
    commonOptions: {
      gender: string[];
      colors: string[];
      patternStyles: string[];
      designInspiration: string[];
    };
  };
}

interface KitMappings {
  [kitType: string]: string[];
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

interface ConfigRequest {
  sport: string;
  kitType: string;
  quantity: number;
  selectedAddons?: string[];
  options?: {
    sleeve?: string;
    collar?: string;
    pattern?: string;
    fabric?: string;
    fit?: string;
    gender?: string;
    colors?: string[];
  };
}

interface ConfigResponse {
  matchedSkus: string[];
  itemPrices: { [sku: string]: number };
  addonPrices: { [addon: string]: number };
  quantityDiscount: number;
  discountedPercentage: number;
  totalPrice: number;
  currency: string;
}

// Cache for configuration data
let productSchemaCache: ProductSchema | null = null;
let kitMappingsCache: KitMappings | null = null;
let skuPricesCache: SkuPrice[] | null = null;

// Load configuration data
function loadConfigData() {
  if (!productSchemaCache) {
    try {
      const schemaPath = path.resolve('data/config/product-schema.json');
      const mappingsPath = path.resolve('data/config/kit-mappings.json');
      const pricesPath = path.resolve('data/config/sku-prices.json');
      
      if (fs.existsSync(schemaPath)) {
        productSchemaCache = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      }
      
      if (fs.existsSync(mappingsPath)) {
        kitMappingsCache = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
      }
      
      if (fs.existsSync(pricesPath)) {
        skuPricesCache = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading configuration data:', error);
      throw new Error('Failed to load configuration data');
    }
  }
  
  return {
    productSchema: productSchemaCache,
    kitMappings: kitMappingsCache,
    skuPrices: skuPricesCache
  };
}

// Get the schema for a specific sport and kit type
export function getKitSchema(sport: string, kitType: string) {
  const { productSchema } = loadConfigData();
  
  if (!productSchema) {
    throw new Error('Product schema not found');
  }
  
  if (!productSchema[sport]) {
    throw new Error(`Sport "${sport}" not found in schema`);
  }
  
  if (!productSchema[sport].kitTypes[kitType]) {
    throw new Error(`Kit type "${kitType}" not found for sport "${sport}"`);
  }
  
  return {
    ...productSchema[sport].kitTypes[kitType],
    commonOptions: productSchema[sport].commonOptions
  };
}

// Get all available sports
export function getSports() {
  const { productSchema } = loadConfigData();
  
  if (!productSchema) {
    throw new Error('Product schema not found');
  }
  
  return Object.keys(productSchema);
}

// Get all kit types for a specific sport
export function getKitTypes(sport: string) {
  const { productSchema } = loadConfigData();
  
  if (!productSchema) {
    throw new Error('Product schema not found');
  }
  
  if (!productSchema[sport]) {
    throw new Error(`Sport "${sport}" not found in schema`);
  }
  
  return Object.keys(productSchema[sport].kitTypes);
}

// Calculate tiered quantity discount
function calculateQuantityDiscount(quantity: number): {
  discountPercentage: number; 
  discountApplied: number;
} {
  let discountPercentage = 0;
  
  if (quantity >= 50) {
    discountPercentage = 15;
  } else if (quantity >= 20) {
    discountPercentage = 10;
  } else if (quantity >= 10) {
    discountPercentage = 5;
  }
  
  const discountApplied = discountPercentage / 100;
  
  return { discountPercentage, discountApplied };
}

// Configure a kit and calculate pricing
export function configureKit(request: ConfigRequest): ConfigResponse {
  const { productSchema, kitMappings, skuPrices } = loadConfigData();
  
  if (!productSchema || !kitMappings || !skuPrices) {
    throw new Error('Configuration data not found');
  }
  
  // Get the schema for the selected sport and kit type
  const kitSchema = getKitSchema(request.sport, request.kitType);
  
  // Get the SKUs for the selected kit type
  let matchedSkus: string[] = [];
  if (kitMappings && kitMappings[request.kitType.toLowerCase()]) {
    matchedSkus = kitMappings[request.kitType.toLowerCase()];
  } else if (kitSchema.skus) {
    matchedSkus = kitSchema.skus;
  }
  
  if (matchedSkus.length === 0) {
    throw new Error(`No SKUs found for kit type "${request.kitType}"`);
  }
  
  // Calculate base prices
  const itemPrices: { [sku: string]: number } = {};
  for (const sku of matchedSkus) {
    const skuPrice = skuPrices.find(price => price.skuId === sku);
    if (skuPrice) {
      itemPrices[sku] = skuPrice.basePrice;
    }
  }
  
  // Calculate addon prices
  const addonPrices: { [addon: string]: number } = {};
  if (request.selectedAddons && request.selectedAddons.length > 0) {
    for (const addon of request.selectedAddons) {
      const addonSku = skuPrices.find(price => 
        price.productName.toLowerCase().includes(addon.toLowerCase())
      );
      
      if (addonSku) {
        addonPrices[addon] = addonSku.basePrice;
      }
    }
  }
  
  // Calculate quantity discount
  const { discountPercentage, discountApplied } = calculateQuantityDiscount(request.quantity);
  
  // Calculate total price
  let subtotal = Object.values(itemPrices).reduce((sum, price) => sum + price, 0) * request.quantity;
  subtotal += Object.values(addonPrices).reduce((sum, price) => sum + price, 0) * request.quantity;
  
  const discountAmount = subtotal * discountApplied;
  const totalPrice = subtotal - discountAmount;
  
  return {
    matchedSkus,
    itemPrices,
    addonPrices,
    quantityDiscount: discountAmount,
    discountedPercentage: discountPercentage,
    totalPrice,
    currency: 'USD'
  };
}

// Get recommended related products
export function getRecommendedProducts(sport: string, kitType: string) {
  const { productSchema, kitMappings, skuPrices } = loadConfigData();
  
  if (!productSchema || !kitMappings || !skuPrices) {
    throw new Error('Configuration data not found');
  }
  
  // Get all kit types for the sport
  const allKitTypes = getKitTypes(sport);
  
  // Filter out the current kit type
  const otherKitTypes = allKitTypes.filter(type => type !== kitType);
  
  // Get SKUs for other kit types
  const recommendations: Array<{
    kitType: string;
    skus: string[];
    basePrice: number;
  }> = [];
  
  for (const type of otherKitTypes) {
    const kitSchema = productSchema[sport].kitTypes[type];
    const skus = kitSchema.skus;
    
    if (skus && skus.length > 0) {
      const basePrice = kitSchema.basePrice || 0;
      recommendations.push({
        kitType: type,
        skus,
        basePrice
      });
    }
  }
  
  return recommendations;
}