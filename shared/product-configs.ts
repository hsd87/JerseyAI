// Product and SKU configurations based on provided CSV files

export type ProductFormField = {
  id: string;
  label: string;
  type: 'select' | 'input' | 'radio' | 'checkbox';
  options?: string[];
  required?: boolean;
  defaultValue?: string | number | boolean;
};

export type Product = {
  sku: string;
  name: string;
  productType: string;
  sports: string[];
  basePrice: number;
  allowedInAiDesigner: boolean;
  addOnsAllowed: boolean;
  sizesAvailable: 'all' | 'standard' | string[];
  gender: 'all' | string[];
  formFields: ProductFormField[];
  currency: string;
};

export type SportKitComponent = {
  id: string;
  sportName: string;
  kitComponent: string;
  formOptions: string[];
  genders: string[];
  colors: string[];
  sleeveLength?: string[];
  collarStyle?: string[];
  patternStyle: string[];
};

// Base product configuration from sku and price config CSV
export const PRODUCTS: Product[] = [
  {
    sku: 'PFJS01',
    name: 'Jersey',
    productType: 'JERSEY',
    sports: ['ALL'],
    basePrice: 40,
    allowedInAiDesigner: true,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    formFields: [
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'input',
        required: true,
        defaultValue: 1
      },
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        required: true,
        defaultValue: 'M'
      },
      {
        id: 'fabric',
        label: 'Fabric',
        type: 'select',
        options: ['POLYDRY', 'POLYDRY MESH'],
        required: true,
        defaultValue: 'POLYDRY'
      },
      {
        id: 'fitType',
        label: 'Fit Type',
        type: 'select',
        options: ['ATHLETIC FIT', 'COMFORT FIT'],
        required: true,
        defaultValue: 'ATHLETIC FIT'
      }
    ],
    currency: 'USD'
  },
  {
    sku: 'PFSS02',
    name: 'Shorts',
    productType: 'SHORTS',
    sports: ['ALL'],
    basePrice: 15,
    allowedInAiDesigner: true,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    formFields: [
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'input',
        required: true,
        defaultValue: 1
      },
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        required: true,
        defaultValue: 'M'
      },
      {
        id: 'fabric',
        label: 'Fabric',
        type: 'select',
        options: ['POLYDRY', 'POLYDRY MESH'],
        required: true,
        defaultValue: 'POLYDRY'
      },
      {
        id: 'fitType',
        label: 'Fit Type',
        type: 'select',
        options: ['ATHLETIC FIT', 'COMFORT FIT'],
        required: true,
        defaultValue: 'ATHLETIC FIT'
      }
    ],
    currency: 'USD'
  },
  {
    sku: 'PFJKT03',
    name: 'Training Jacket',
    productType: 'JACKET',
    sports: ['ALL'],
    basePrice: 50,
    allowedInAiDesigner: true,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    formFields: [
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'input',
        required: true,
        defaultValue: 1
      },
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        required: true,
        defaultValue: 'M'
      },
      {
        id: 'fabric',
        label: 'Fabric',
        type: 'select',
        options: ['POLYDRY ACTIVE', 'POLYDRY WARM'],
        required: true,
        defaultValue: 'POLYDRY ACTIVE'
      },
      {
        id: 'style',
        label: 'Style',
        type: 'select',
        options: ['FULL ZIP', 'HALF ZIP', 'HOODED'],
        required: true,
        defaultValue: 'FULL ZIP'
      },
      {
        id: 'fitType',
        label: 'Fit Type',
        type: 'select',
        options: ['ATHLETIC FIT', 'COMFORT FIT'],
        required: true,
        defaultValue: 'ATHLETIC FIT'
      }
    ],
    currency: 'USD'
  },
  {
    sku: 'PFTR04',
    name: 'Training Trouser',
    productType: 'TROUSER',
    sports: ['ALL'],
    basePrice: 20,
    allowedInAiDesigner: true,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    formFields: [
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'input',
        required: true,
        defaultValue: 1
      },
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        required: true,
        defaultValue: 'M'
      },
      {
        id: 'fabric',
        label: 'Fabric',
        type: 'select',
        options: ['POLYDRY ACTIVE', 'POLYDRY WARM'],
        required: true,
        defaultValue: 'POLYDRY ACTIVE'
      },
      {
        id: 'fitType',
        label: 'Fit Type',
        type: 'select',
        options: ['ATHLETIC FIT', 'COMFORT FIT'],
        required: true,
        defaultValue: 'ATHLETIC FIT'
      }
    ],
    currency: 'USD'
  },
  {
    sku: 'PFKB05',
    name: 'Kit Bag',
    productType: 'KITBAG',
    sports: ['ALL'],
    basePrice: 35,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'standard',
    gender: 'all',
    formFields: [
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'input',
        required: true,
        defaultValue: 1
      }
    ],
    currency: 'USD'
  },
  {
    sku: 'PFBP06',
    name: 'Backpack',
    productType: 'BAGPACK',
    sports: ['ALL'],
    basePrice: 30,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'standard',
    gender: 'all',
    formFields: [
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'input',
        required: true,
        defaultValue: 1
      }
    ],
    currency: 'USD'
  },
  {
    sku: 'PFSK07',
    name: 'Socks',
    productType: 'SOCKS',
    sports: ['ALL'],
    basePrice: 10,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    formFields: [
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'input',
        required: true,
        defaultValue: 1
      },
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        options: ['S', 'M', 'L'],
        required: true,
        defaultValue: 'M'
      }
    ],
    currency: 'USD'
  },
  {
    sku: 'PFBN08',
    name: 'Beanie',
    productType: 'BEANIE',
    sports: ['ALL'],
    basePrice: 10,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    formFields: [
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'input',
        required: true,
        defaultValue: 1
      }
    ],
    currency: 'USD'
  },
  {
    sku: 'PFSC09',
    name: 'Sports Cap',
    productType: 'CAPS',
    sports: ['ALL'],
    basePrice: 10,
    allowedInAiDesigner: false,
    addOnsAllowed: true,
    sizesAvailable: 'all',
    gender: 'all',
    formFields: [
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'input',
        required: true,
        defaultValue: 1
      }
    ],
    currency: 'USD'
  }
];

// Sport-specific kit configurations from AI designer form config CSV
export const SPORT_KIT_CONFIGS: SportKitComponent[] = [
  // Soccer configurations
  {
    id: 'soccer_jersey',
    sportName: 'soccer',
    kitComponent: 'jersey only',
    formOptions: ['gender', 'colors', 'sleeves length', 'collar type', 'pattern style', 'design inspiration'],
    genders: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent 1', 'accent 2'],
    sleeveLength: ['short', 'long'],
    collarStyle: ['V-neck', 'crew neck', 'mandarin', 'polo collar', 'polo collar without button'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  {
    id: 'soccer_jersey_shorts',
    sportName: 'soccer',
    kitComponent: 'jersey + shorts',
    formOptions: ['gender', 'colors', 'sleeves length', 'collar type', 'pattern style', 'design inspiration'],
    genders: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent 1', 'accent 2'],
    sleeveLength: ['short', 'long'],
    collarStyle: ['V-neck', 'crew neck', 'mandarin', 'polo collar', 'polo collar without button'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  // Basketball configurations
  {
    id: 'basketball_jersey',
    sportName: 'basketball',
    kitComponent: 'jersey only',
    formOptions: ['gender', 'colors', 'sleeves length', 'collar type', 'pattern style', 'design inspiration'],
    genders: ['male', 'female', 'unisex'],
    colors: ['primary', 'secondary', 'accent 1', 'accent 2'],
    sleeveLength: ['sleeveless'],
    collarStyle: ['V-neck', 'crew neck', 'scoop neck', 'deep neck'],
    patternStyle: ['Gradient', 'Slash', 'Panel', 'Striped', 'Digital', 'Minimal', 'electric', 'multicolor', 'geometric', 'micro geometric', 'geometric plus gradient', 'front heavy', 'tech']
  },
  // Adding more configurations for other sports would follow the same pattern
];

// Map of package types to included products with default quantities
export const PACKAGE_ITEMS: Record<string, Array<{sku: string, defaultQty: number}>> = {
  jerseyOnly: [
    { sku: 'PFJS01', defaultQty: 1 }
  ],
  jerseyShorts: [
    { sku: 'PFJS01', defaultQty: 1 },
    { sku: 'PFSS02', defaultQty: 1 }
  ],
  fullKit: [
    { sku: 'PFJS01', defaultQty: 1 },
    { sku: 'PFSS02', defaultQty: 1 },
    { sku: 'PFSK07', defaultQty: 1 },
    { sku: 'PFKB05', defaultQty: 1 }
  ],
  trainingKit: [
    { sku: 'PFJKT03', defaultQty: 1 },
    { sku: 'PFTR04', defaultQty: 1 }
  ],
  // Custom package type - starts with no default items, user will add them individually
  custom: []
};

// Get product by SKU
export const getProductBySku = (sku: string): Product | undefined => {
  return PRODUCTS.find(product => product.sku === sku);
};

// Calculate base price for a package
export const calculatePackageBasePrice = (packageType: string): number => {
  // For custom package type, we use a base price of 0 since it will be calculated
  // based on the items added to the package
  if (packageType === 'custom') return 0;
  
  if (!PACKAGE_ITEMS[packageType]) return 0;
  
  return PACKAGE_ITEMS[packageType].reduce((total, item) => {
    const product = getProductBySku(item.sku);
    if (!product) return total;
    return total + (product.basePrice * item.defaultQty);
  }, 0);
};

// Calculate discount based on quantity tiers
export const calculateQuantityDiscount = (quantity: number): number => {
  if (quantity >= 50) return 0.25; // 25% off for 50+ items
  if (quantity >= 20) return 0.15; // 15% off for 20-49 items
  if (quantity >= 10) return 0.10; // 10% off for 10-19 items
  return 0; // No discount for fewer than 10 items
};

// Add-on items that can be added to any order
export const ADDON_OPTIONS = [
  { id: 'PFKB05', name: 'Team Kit Bag', price: 35 },
  { id: 'PFBP06', name: 'Backpack', price: 30 },
  { id: 'PFBN08', name: 'Team Beanie', price: 10 },
  { id: 'PFSC09', name: 'Team Cap', price: 10 }
];