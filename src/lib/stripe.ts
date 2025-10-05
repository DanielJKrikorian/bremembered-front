import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with fallback
const getStripeKey = () => {
  const key = import.meta.env._VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key || key === 'your_stripe_publishable_key_here') {
    console.warn('Stripe publishable key not configured');
    return null;
  }
  return key;
};

export const stripePromise = getStripeKey() ? loadStripe(getStripeKey()!) : null;

export const getStripeConfig = async () => {
  try {
    const publishableKey = getStripeKey();
    return {
      publishableKey: publishableKey || '',
      isConfigured: !!publishableKey
    };
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return {
      publishableKey: '',
      isConfigured: false
    };
  }
};