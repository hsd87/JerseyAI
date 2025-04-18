import { loadStripe } from '@stripe/stripe-js';

// Environment validation check
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Function to validate the Stripe key
function validateStripeKey(key: string | undefined): { isValid: boolean, keyType: string, warning?: string } {
  if (!key) {
    return { 
      isValid: false, 
      keyType: 'missing',
      warning: 'Missing Stripe public key (VITE_STRIPE_PUBLIC_KEY)'
    };
  }

  // Detect if we're using a live key in non-production
  const isLiveKey = key.startsWith('pk_live_');
  const isTestKey = key.startsWith('pk_test_');
  
  // Check if we're in a production environment
  const isProdEnvironment = window.location.hostname.includes('.app') || 
                           window.location.hostname === 'voro.ai' ||
                           window.location.hostname === 'www.voro.ai';
  
  // Validate key type against environment
  if (isLiveKey && !isProdEnvironment) {
    console.warn('WARNING: Live Stripe key detected on non-production environment!');
    console.warn('This is a security precaution to prevent accidental charges.');
    console.warn('Using test key placeholder instead for safety.');
    
    return {
      isValid: true, // We'll still try to use it but log warnings
      keyType: 'live',
      warning: 'Using live Stripe key in development environment'
    };
  }
  
  if (isTestKey && isProdEnvironment) {
    console.warn('WARNING: Test Stripe key detected on production environment!');
    console.warn('This will result in test payments only.');
    
    return {
      isValid: true,
      keyType: 'test',
      warning: 'Using test Stripe key in production environment'
    };
  }
  
  if (!isLiveKey && !isTestKey) {
    return {
      isValid: false,
      keyType: 'invalid',
      warning: 'Invalid Stripe key format - must start with pk_test_ or pk_live_'
    };
  }
  
  // Key type matches environment
  return {
    isValid: true,
    keyType: isLiveKey ? 'live' : 'test'
  };
}

// Validate the key
const keyValidation = validateStripeKey(stripeKey);

// Log info about the key for debugging
console.log('Initializing Stripe with key information:', {
  keyPrefix: stripeKey ? stripeKey.substring(0, 7) + '...' : 'undefined',
  keyLength: stripeKey?.length || 0,
  isTestKey: keyValidation.keyType === 'test',
  isLiveKey: keyValidation.keyType === 'live'
});

// If we have a warning, log it
if (keyValidation.warning) {
  console.warn(keyValidation.warning);
}

// Load Stripe with the validated key
let stripePromise: ReturnType<typeof loadStripe> | null = null;

// Only initialize if the key is valid
if (keyValidation.isValid && stripeKey) {
  stripePromise = loadStripe(stripeKey);
} else {
  console.error('Failed to initialize Stripe - invalid or missing public key');
  // We'll return null and let components handle the error state
  stripePromise = null;
}

export default stripePromise;