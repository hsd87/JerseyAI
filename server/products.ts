import { Express } from 'express';
import { defaultProducts, kitTypeToProductMapping, ProductType } from '@shared/products';

/**
 * Register product-related routes
 */
export function registerProductRoutes(app: Express) {
  // Get all products
  app.get('/api/products', (req, res) => {
    return res.json(defaultProducts);
  });

  // Get product by SKU
  app.get('/api/products/:skuId', (req, res) => {
    const { skuId } = req.params;
    const product = defaultProducts.find(p => p.skuId === skuId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    return res.json(product);
  });
  
  // Get products compatible with a specific kit type
  app.get('/api/kit-products/:kitType', (req, res) => {
    const { kitType } = req.params;
    
    // Get product types for this kit type
    const productTypes = kitTypeToProductMapping[kitType];
    
    if (!productTypes || productTypes.length === 0) {
      return res.json([]);
    }
    
    // Find all products that match these product types
    const matchingProducts = defaultProducts.filter(product => 
      productTypes.includes(product.productType as ProductType)
    );
    
    return res.json(matchingProducts);
  });
  
  // Get add-on products (products not allowed in AI designer)
  app.get('/api/addon-products', (req, res) => {
    const addonProducts = defaultProducts.filter(product => 
      !product.allowedInAiDesigner && product.addOnsAllowed
    );
    
    return res.json(addonProducts);
  });
  
  // Calculate price for a product with quantity and subscription discounts
  app.post('/api/calculate-price', (req, res) => {
    const { items, isSubscriber } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid items array' });
    }
    
    try {
      const { calculatePrice } = require('./utils/pricing');
      
      // Convert items to CartItem format
      const cartItems = items.map((item: any) => ({
        productId: item.skuId,
        productType: item.productType,
        basePrice: item.price * 100, // Convert to cents
        quantity: item.quantity
      }));
      
      const priceResult = calculatePrice(cartItems, isSubscriber);
      return res.json(priceResult);
    } catch (error: any) {
      console.error('Error calculating price:', error);
      return res.status(500).json({ message: error.message });
    }
  });
}