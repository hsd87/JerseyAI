export interface Product {
  skuId: string;
  name: string;
  productType: ProductType;
  sports: string[];
  basePrice: number;
  allowedInAiDesigner: boolean;
  addOnsAllowed: boolean;
  sizesAvailable: SizeAvailability;
  gender: GenderAvailability;
  currency: string;
}

export type ProductType = 
  | 'JERSEY'
  | 'SHORTS'
  | 'JACKET'
  | 'TROUSER'
  | 'KITBAG'
  | 'BAGPACK'
  | 'SOCKS'
  | 'BEANIE'
  | 'CAPS';

export type SizeAvailability = 'all' | 'STANDARD';
export type GenderAvailability = 'all' | 'male' | 'female';

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type Gender = 'male' | 'female';

export const defaultProducts: Product[] = [
  {
    skuId: 'PFJS01',
    name: 'Jersey',
    productType: 'JERSEY',
    sports: ['ALL'],
    basePrice: 40,
    allowedInAiDesigner: true,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    currency: 'USD'
  },
  {
    skuId: 'PFSS02',
    name: 'Shorts',
    productType: 'SHORTS',
    sports: ['ALL'],
    basePrice: 15,
    allowedInAiDesigner: true,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    currency: 'USD'
  },
  {
    skuId: 'PFJKT03',
    name: 'Training Jacket',
    productType: 'JACKET',
    sports: ['ALL'],
    basePrice: 50,
    allowedInAiDesigner: true,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    currency: 'USD'
  },
  {
    skuId: 'PFTR04',
    name: 'Training Trouser',
    productType: 'TROUSER',
    sports: ['ALL'],
    basePrice: 20,
    allowedInAiDesigner: true,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    currency: 'USD'
  },
  {
    skuId: 'PFKB05',
    name: 'Kitbag',
    productType: 'KITBAG',
    sports: ['ALL'],
    basePrice: 35,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'STANDARD',
    gender: 'all',
    currency: 'USD'
  },
  {
    skuId: 'PFBP06',
    name: 'Bagpack',
    productType: 'BAGPACK',
    sports: ['ALL'],
    basePrice: 30,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'STANDARD',
    gender: 'all',
    currency: 'USD'
  },
  {
    skuId: 'PFSK07',
    name: 'Socks',
    productType: 'SOCKS',
    sports: ['ALL'],
    basePrice: 10,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    currency: 'USD'
  },
  {
    skuId: 'PFBN08',
    name: 'Beanie',
    productType: 'BEANIE',
    sports: ['ALL'],
    basePrice: 10,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    currency: 'USD'
  },
  {
    skuId: 'PFSC09',
    name: 'Sports Cap',
    productType: 'CAPS',
    sports: ['ALL'],
    basePrice: 10,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    currency: 'USD'
  }
];

// Pricing Tiers
export const quantityDiscountTiers = [
  { minQuantity: 50, discountPercentage: 15 },
  { minQuantity: 20, discountPercentage: 10 },
  { minQuantity: 10, discountPercentage: 5 }
];

export const subscriberDiscountPercentage = 10;

// Map design form kit types to product types
export const kitTypeToProductMapping: Record<string, ProductType[]> = {
  'jerseyOnly': ['JERSEY'],
  'jerseyShorts': ['JERSEY', 'SHORTS'],
  'jerseyTrousers': ['JERSEY', 'TROUSER'],
  'tracksuit': ['JACKET', 'TROUSER'],
  'fullKit': ['JERSEY', 'SHORTS', 'JACKET', 'TROUSER'],
  'jerseyShortsJacket': ['JERSEY', 'SHORTS', 'JACKET'],
  'esportsjacket': ['JACKET'],
  'esportsTrouser': ['TROUSER']
};

// Get list of sizes based on availability type
export function getAvailableSizes(sizesAvailable: SizeAvailability): Size[] {
  if (sizesAvailable === 'all') {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }
  return ['M']; // For STANDARD
}

// Helper to get product price with discount based on quantity and subscription status
export function calculateProductPrice(
  product: Product, 
  quantity: number, 
  isSubscriber: boolean = false
): number {
  let price = product.basePrice;
  
  // Apply quantity discount
  for (const tier of quantityDiscountTiers) {
    if (quantity >= tier.minQuantity) {
      price = price * (1 - tier.discountPercentage / 100);
      break;
    }
  }
  
  // Apply subscriber discount if applicable
  if (isSubscriber) {
    price = price * (1 - subscriberDiscountPercentage / 100);
  }
  
  return Math.round(price * 100) / 100; // Round to 2 decimal places
}

// Helper to calculate order total
export function calculateOrderTotal(orderItems: OrderItem[]): number {
  return orderItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

// Order data structures
export interface OrderItem {
  skuId: string;
  name: string;
  size: Size;
  gender: Gender;
  quantity: number;
  price: number;
  playerName?: string;
  playerNumber?: string;
}

export interface Order {
  id?: number;
  userId: number;
  designId: number;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date;
}

export type OrderStatus = 'draft' | 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';