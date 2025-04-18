import { loadStripe } from '@stripe/stripe-js';
import { validateStripeKey, logStripeKeyInfo } from './stripe-key-validator';

// Environment validation check
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Log detailed information about the key for debugging
logStripeKeyInfo();

// Validate the key (uses our improved validator)
const keyValidation = validateStripeKey(stripeKey);

// Log whether the key is valid
console.log('Stripe key validation result:', {
  isValid: keyValidation.isValid,
  keyType: keyValidation.keyType,
  environment: keyValidation.environment,
  hasWarning: !!keyValidation.warning
});

// If we have a warning, log it
if (keyValidation.warning) {
  console.warn('Stripe key warning:', keyValidation.warning);
}

// Load Stripe with the validated key
let stripePromise: ReturnType<typeof loadStripe> | null = null;

// Only initialize if the key is valid
if (keyValidation.isValid && stripeKey) {
  try {
    // Attempt to load Stripe with the key
    stripePromise = loadStripe(stripeKey);
    
    // Add error handling to the promise
    stripePromise?.catch(err => {
      console.error('Error initializing Stripe:', err);
      // We'll still return the promise, and components can handle the rejection
    });
  } catch (err) {
    console.error('Failed to initialize Stripe:', err);
    stripePromise = null;
  }
} else {
  console.error('Failed to initialize Stripe - invalid or missing public key');
  // We'll return null and let components handle the error state
  stripePromise = null;
}

export default stripePromise;