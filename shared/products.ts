/**
 * Product and order types for the e-commerce system
 */

// Product type enum
export enum ProductType {
  Jersey = 'jersey',
  Shorts = 'shorts',
  Tracksuit = 'tracksuit',
  TrainingJacket = 'trainingJacket',
  TrainingTrouser = 'trainingTrouser',
  Kitbag = 'kitbag',
  Backpack = 'backpack',
  Socks = 'socks',
  Beanie = 'beanie',
  Cap = 'cap'
}

// Gender enum
export type Gender = 'male' | 'female';

// Size enum
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

// Base product interface
export interface Product {
  skuId: string;
  name: string;
  description: string;
  productType: string;
  basePrice: number;
  sport?: string;
  allowedInAiDesigner: boolean;
  addOnsAllowed: boolean;
  imageUrl?: string;
}

// Cart/Order item interface
export interface OrderItem {
  skuId: string;
  name: string;
  size: Size;
  gender: Gender;
  quantity: number;
  price: number;
  customization?: {
    name?: string;
    number?: string;
  };
}

// Kit type to product type mapping
export const kitTypeToProductMapping: Record<string, string[]> = {
  'jerseyOnly': [ProductType.Jersey],
  'jerseyShorts': [ProductType.Jersey, ProductType.Shorts],
  'fullKit': [ProductType.Jersey, ProductType.Shorts, ProductType.Socks],
  'trainingKit': [ProductType.TrainingJacket, ProductType.TrainingTrouser],
  'jerseyTracksuit': [ProductType.Jersey, ProductType.TrainingJacket, ProductType.TrainingTrouser],
  'jerseyShortsTracksuit': [ProductType.Jersey, ProductType.Shorts, ProductType.TrainingJacket, ProductType.TrainingTrouser],
  'basketball-jersey': [ProductType.Jersey],
  'basketball-jerseyShorts': [ProductType.Jersey, ProductType.Shorts],
  'esportsJersey': [ProductType.Jersey],
  'esportsHoodie': [ProductType.TrainingJacket]
};

// Default product catalog
export const defaultProducts: Product[] = [
  // Main products - these can be designed with AI
  {
    skuId: 'PFJS01',
    name: 'Custom Jersey',
    description: 'High-quality custom jersey with your team design',
    productType: ProductType.Jersey,
    basePrice: 40,
    allowedInAiDesigner: true,
    addOnsAllowed: false
  },
  {
    skuId: 'PFSS02',
    name: 'Matching Shorts',
    description: 'Team shorts that match your custom jersey',
    productType: ProductType.Shorts,
    basePrice: 15,
    allowedInAiDesigner: true,
    addOnsAllowed: false
  },
  {
    skuId: 'PFJKT03',
    name: 'Training Jacket',
    description: 'Premium team training jacket',
    productType: ProductType.TrainingJacket,
    basePrice: 50,
    allowedInAiDesigner: true,
    addOnsAllowed: false
  },
  {
    skuId: 'PFTR04',
    name: 'Training Trousers',
    description: 'Premium team training trousers',
    productType: ProductType.TrainingTrouser,
    basePrice: 20,
    allowedInAiDesigner: true,
    addOnsAllowed: false
  },
  
  // Add-on products - these cannot be designed with AI but can be added to order
  {
    skuId: 'PFKB05',
    name: 'Team Kitbag',
    description: 'Large kitbag with your team colors',
    productType: ProductType.Kitbag,
    basePrice: 35,
    allowedInAiDesigner: false,
    addOnsAllowed: true
  },
  {
    skuId: 'PFBP06',
    name: 'Team Backpack',
    description: 'Durable backpack with your team logo',
    productType: ProductType.Backpack,
    basePrice: 30,
    allowedInAiDesigner: false,
    addOnsAllowed: true
  },
  {
    skuId: 'PFSK07',
    name: 'Team Socks',
    description: 'Matching team socks',
    productType: ProductType.Socks,
    basePrice: 10,
    allowedInAiDesigner: false,
    addOnsAllowed: true
  },
  {
    skuId: 'PFBN08',
    name: 'Team Beanie',
    description: 'Team-colored beanie hat',
    productType: ProductType.Beanie,
    basePrice: 10,
    allowedInAiDesigner: false,
    addOnsAllowed: true
  },
  {
    skuId: 'PFSC09',
    name: 'Sports Cap',
    description: 'Team-colored sports cap',
    productType: ProductType.Cap,
    basePrice: 10,
    allowedInAiDesigner: false,
    addOnsAllowed: true
  }
];