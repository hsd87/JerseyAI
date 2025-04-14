import { useEffect } from 'react';
import { useDesignStore } from '@/hooks/use-design-store';
import { useOrderStore } from '@/hooks/use-order-store';

const PACKAGE_PRICES: Record<string, number> = {
  jerseyOnly: 59.99,
  jerseyShorts: 89.99,
  fullKit: 119.99,
};

/**
 * This component watches the design store and initializes the order store
 * when a design is generated, ensuring the order summary is functional.
 */
export function OrderInitializer() {
  const { 
    hasGenerated, 
    frontImage, 
    backImage, 
    designId, 
    formData,
  } = useDesignStore();
  
  const { 
    items, 
    addItem, 
    setItems,
    setPackageType,
    setSport,
    setDesign,
  } = useOrderStore();

  // When a design is generated, initialize the order
  useEffect(() => {
    if (hasGenerated && frontImage && backImage && designId) {
      // Set package details
      const packageType = formData.kitType || 'jerseyOnly';
      setPackageType(packageType);
      setSport(formData.sport);
      
      // Set design details
      setDesign(designId, { front: frontImage, back: backImage });
      
      // If no items yet, add default item based on package type
      if (items.length === 0) {
        // Get price based on package type
        let price = PACKAGE_PRICES[packageType] || 59.99;
        
        // Add first item
        addItem({
          type: packageType,
          size: 'M',
          quantity: 1,
          gender: 'Male',
          price: price,
        });
      }
    }
  }, [hasGenerated, frontImage, backImage, designId, formData, items.length, addItem, setPackageType, setSport, setDesign]);

  return null; // This is a non-visual component
}