/**
 * Utility for validating and safely accessing Stripe API keys
 * This helps prevent common errors with Stripe integration
 */

/**
 * Validates a Stripe API key format and returns information about it
 * 
 * @param key The Stripe API key to validate
 * @returns Object with validation results
 */
export function validateStripeKey(key: string | undefined): { 
  isValid: boolean;
  keyType: 'live' | 'test' | 'unknown';
  environment: 'production' | 'development' | 'unknown';
  warning?: string;
} {
  // Default return value for invalid keys
  const invalidResult = {
    isValid: false,
    keyType: 'unknown' as const,
    environment: 'unknown' as const,
    warning: 'Invalid or missing Stripe key'
  };
  
  if (!key) {
    return {
      ...invalidResult,
      warning: 'No Stripe key provided'
    };
  }
  
  // Check for proper format (very basic validation)
  if (!key.startsWith('pk_')) {
    return {
      ...invalidResult,
      warning: 'Not a valid publishable key format (should start with pk_)'
    };
  }
  
  // Determine key type
  const isLiveKey = key.startsWith('pk_live_');
  const isTestKey = key.startsWith('pk_test_');
  
  if (!isLiveKey && !isTestKey) {
    return {
      ...invalidResult,
      warning: 'Unrecognized key format (should be pk_live_ or pk_test_)'
    };
  }
  
  // Check for environment mismatch
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let warning: string | undefined;
  
  if (isProduction && isTestKey) {
    warning = 'Using test key in production environment';
  } else if (isDevelopment && isLiveKey) {
    warning = 'Using live key in development environment';
  }
  
  return {
    isValid: true,
    keyType: isLiveKey ? 'live' : 'test',
    environment: isProduction ? 'production' : 'development',
    warning
  };
}

/**
 * Gets the appropriate Stripe key for the current environment
 * Will attempt to detect and warn about mismatches
 */
export function getStripeKey(): string | null {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  const validation = validateStripeKey(stripeKey);
  
  if (!validation.isValid) {
    console.error('Stripe key validation failed:', validation.warning);
    return null;
  }
  
  if (validation.warning) {
    console.warn('Stripe key warning:', validation.warning);
  }
  
  return stripeKey as string;
}

/**
 * Logs Stripe key information for debugging (without exposing the full key)
 */
export function logStripeKeyInfo(): void {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  
  if (!stripeKey) {
    console.error('No Stripe public key found in environment');
    return;
  }
  
  const keyInfo = {
    prefix: stripeKey.substring(0, 7),
    length: stripeKey.length,
    isLiveKey: stripeKey.startsWith('pk_live_'),
    isTestKey: stripeKey.startsWith('pk_test_'),
    environment: process.env.NODE_ENV
  };
  
  console.log('Stripe key info:', keyInfo);
}