import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const getStripeConfig = async () => {
  try {
    // In a real app, you might fetch this from your backend
    // For now, we'll use environment variables
    return {
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      isConfigured: !!(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    };
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return {
      publishableKey: '',
      isConfigured: false
    };
  }
};