import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Types for configuration data
export interface KitOptionValue {
  value: string;
  label: string;
}

export interface KitSchema {
  formOptions: string[];
  skus: string[];
  sleeveLength: string[];
  collarStyle: string[];
  fabric: string[];
  fitType: string[];
  style: string[];
  basePrice: number;
  commonOptions: {
    gender: string[];
    colors: string[];
    patternStyles: string[];
    designInspiration: string[];
  };
}

export interface PricingConfig {
  skus: Record<string, number>;
  addons: Record<string, number>;
  quantityDiscounts: {
    threshold: number;
    discountPercentage: number;
  }[];
}

export interface ConfigData {
  sports: string[];
  kitTypes: Record<string, string[]>;
  schemas: Record<string, Record<string, KitSchema>>;
  pricing: Record<string, Record<string, PricingConfig>>;
}

// Parse CSV file content
export function parseCSV(content: string) {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

// Read CSV file and parse
export function readCSVFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return parseCSV(content);
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error);
    return [];
  }
}

// Process AI designer form config
export function processAIDesignerConfig(data: any[]) {
  const sports: string[] = [];
  const kitTypes: Record<string, string[]> = {};

  data.forEach(row => {
    const sport = row.sport.toLowerCase();
    const kitType = row.kitType;
    
    if (sport && !sports.includes(sport)) {
      sports.push(sport);
    }
    
    if (sport && kitType) {
      if (!kitTypes[sport]) {
        kitTypes[sport] = [];
      }
      
      if (!kitTypes[sport].includes(kitType)) {
        kitTypes[sport].push(kitType);
      }
    }
  });

  return { sports, kitTypes };
}

// Process order form config
export function processOrderFormConfig(data: any[]) {
  const schemas: Record<string, Record<string, KitSchema>> = {};

  data.forEach(row => {
    const sport = row.sport.toLowerCase();
    const kitType = row.kitType;
    
    if (!sport || !kitType) return;
    
    if (!schemas[sport]) {
      schemas[sport] = {};
    }
    
    if (!schemas[sport][kitType]) {
      schemas[sport][kitType] = {
        formOptions: [],
        skus: [],
        sleeveLength: [],
        collarStyle: [],
        fabric: [],
        fitType: [],
        style: [],
        basePrice: parseFloat(row.basePrice) || 29.99,
        commonOptions: {
          gender: [],
          colors: [],
          patternStyles: [],
          designInspiration: []
        }
      };
    }
    
    // Parse form options
    const schema = schemas[sport][kitType];
    const formOptions = row.formOptions?.split(',').map((option: string) => option.trim()) || [];
    schema.formOptions = Array.from(new Set([...schema.formOptions, ...formOptions])).filter(Boolean);
    
    // Process specific options
    if (row.sleeveLength && !schema.sleeveLength.includes(row.sleeveLength)) {
      schema.sleeveLength.push(row.sleeveLength);
    }
    
    if (row.collarStyle && !schema.collarStyle.includes(row.collarStyle)) {
      schema.collarStyle.push(row.collarStyle);
    }
    
    if (row.fabric && !schema.fabric.includes(row.fabric)) {
      schema.fabric.push(row.fabric);
    }
    
    if (row.fitType && !schema.fitType.includes(row.fitType)) {
      schema.fitType.push(row.fitType);
    }
    
    if (row.style && !schema.style.includes(row.style)) {
      schema.style.push(row.style);
    }
    
    if (row.sku && !schema.skus.includes(row.sku)) {
      schema.skus.push(row.sku);
    }
    
    // Process common options
    if (row.gender && !schema.commonOptions.gender.includes(row.gender)) {
      schema.commonOptions.gender.push(row.gender);
    }
    
    if (row.patternStyle && !schema.commonOptions.patternStyles.includes(row.patternStyle)) {
      schema.commonOptions.patternStyles.push(row.patternStyle);
    }
    
    const colors = row.colors?.split(',').map((color: string) => color.trim()) || [];
    schema.commonOptions.colors = Array.from(new Set([...schema.commonOptions.colors, ...colors])).filter(Boolean);
    
    const designInspirations = row.designInspiration?.split(',').map((insp: string) => insp.trim()) || [];
    schema.commonOptions.designInspiration = Array.from(new Set([...schema.commonOptions.designInspiration, ...designInspirations])).filter(Boolean);
  });

  return schemas;
}

// Process price config
export function processPriceConfig(data: any[]) {
  const pricing: Record<string, Record<string, PricingConfig>> = {};
  const quantityDiscounts = [
    { threshold: 10, discountPercentage: 5 },
    { threshold: 20, discountPercentage: 10 },
    { threshold: 50, discountPercentage: 15 }
  ];

  data.forEach(row => {
    const sport = row.sport?.toLowerCase();
    const kitType = row.kitType;
    const sku = row.sku;
    
    if (!sport || !kitType || !sku) return;
    
    if (!pricing[sport]) {
      pricing[sport] = {};
    }
    
    if (!pricing[sport][kitType]) {
      pricing[sport][kitType] = {
        skus: {},
        addons: {},
        quantityDiscounts
      };
    }
    
    const price = parseFloat(row.price);
    if (!isNaN(price)) {
      pricing[sport][kitType].skus[sku] = price;
    }
    
    // Process addons
    const addons = row.addons?.split(',') || [];
    addons.forEach((addon: string) => {
      const [addonName, addonPrice] = addon.split(':').map((part: string) => part.trim());
      if (addonName && addonPrice) {
        const parsedPrice = parseFloat(addonPrice);
        if (!isNaN(parsedPrice)) {
          pricing[sport][kitType].addons[addonName] = parsedPrice;
        }
      }
    });
  });

  return pricing;
}

// Generate full configuration
export function generateFullConfig(aiDesignerPath: string, orderFormPath: string, pricingPath: string): ConfigData {
  const aiDesignerData = readCSVFile(aiDesignerPath);
  const orderFormData = readCSVFile(orderFormPath);
  const pricingData = readCSVFile(pricingPath);
  
  const { sports, kitTypes } = processAIDesignerConfig(aiDesignerData);
  const schemas = processOrderFormConfig(orderFormData);
  const pricing = processPriceConfig(pricingData);
  
  return { sports, kitTypes, schemas, pricing };
}

// Calculate pricing for a kit configuration
export function calculatePricing(
  config: ConfigData,
  kitConfig: {
    sport: string;
    kitType: string;
    quantity: number;
    options: Record<string, any>;
    selectedAddons?: string[];
  }
): {
  matchedSkus: string[];
  itemPrices: Record<string, number>;
  addonPrices: Record<string, number>;
  quantityDiscount: number;
  discountedPercentage: number;
  totalPrice: number;
  currency: string;
} {
  const { sport, kitType, quantity, options, selectedAddons = [] } = kitConfig;
  
  // Default response
  const defaultResponse = {
    matchedSkus: [],
    itemPrices: {},
    addonPrices: {},
    quantityDiscount: 0,
    discountedPercentage: 0,
    totalPrice: 0,
    currency: 'USD'
  };
  
  // Validate sport and kitType
  if (!sport || !kitType || !pricing[sport] || !pricing[sport][kitType]) {
    return defaultResponse;
  }
  
  const pricingConfig = pricing[sport][kitType];
  const schema = schemas[sport][kitType];
  
  // Find matching SKUs based on options
  const matchedSkus: string[] = [];
  let basePrice = schema.basePrice;
  
  // Simple SKU matching logic (in reality would be more complex)
  for (const sku of schema.skus) {
    // For demo purposes, match any SKU
    matchedSkus.push(sku);
    // In a real system, we'd have more complex matching rules
    break;
  }
  
  // Calculate item prices
  const itemPrices: Record<string, number> = {};
  matchedSkus.forEach(sku => {
    const price = pricingConfig.skus[sku] || basePrice;
    itemPrices[sku] = price;
  });
  
  // Calculate addon prices
  const addonPrices: Record<string, number> = {};
  selectedAddons.forEach(addon => {
    if (pricingConfig.addons[addon]) {
      addonPrices[addon] = pricingConfig.addons[addon];
    }
  });
  
  // Calculate subtotal
  const itemSubtotal = Object.values(itemPrices).reduce((sum, price) => sum + price, 0);
  const addonSubtotal = Object.values(addonPrices).reduce((sum, price) => sum + price, 0);
  const subtotal = (itemSubtotal + addonSubtotal) * quantity;
  
  // Apply quantity discount
  let discountPercentage = 0;
  for (const discount of pricingConfig.quantityDiscounts) {
    if (quantity >= discount.threshold) {
      discountPercentage = discount.discountPercentage;
    }
  }
  
  const quantityDiscount = subtotal * (discountPercentage / 100);
  const totalPrice = subtotal - quantityDiscount;
  
  return {
    matchedSkus,
    itemPrices,
    addonPrices,
    quantityDiscount,
    discountedPercentage: discountPercentage,
    totalPrice,
    currency: 'USD'
  };
}

// Global configuration data
export let sports: string[] = [];
export let kitTypes: Record<string, string[]> = {};
export let schemas: Record<string, Record<string, KitSchema>> = {};
export let pricing: Record<string, Record<string, PricingConfig>> = {};