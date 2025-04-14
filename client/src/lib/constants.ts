/**
 * Pricing constants for different package types
 */
export const PACKAGE_PRICES: Record<string, number> = {
  jerseyOnly: 59.99,
  jerseyShorts: 89.99,
  fullKit: 119.99,
};

/**
 * Available add-on options
 */
export const ADDON_OPTIONS = [
  { id: 'socks', name: 'Matching Socks', price: 12.99, image: '/images/addon-socks.png' },
  { id: 'headwear', name: 'Beanie/Headband', price: 14.99, image: '/images/addon-headwear.png' },
  { id: 'tracksuit', name: 'Matching Tracksuit', price: 79.99, image: '/images/addon-tracksuit.png' },
  { id: 'kitbag', name: 'Kit Bag / Backpack', price: 24.99, image: '/images/addon-bag.png' },
];