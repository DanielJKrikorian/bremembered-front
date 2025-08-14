import React, { useState, useEffect } from 'react';
import { X, Lock, Check, Loader, Mail } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planId?: string;
  planName?: string;
  amount?: number;
}

interface StoragePlan {
  id: string;
  plan_id: string;
  name: string;
  description?: string;
  stripe_price_id: string;
  amount: number;
  currency: string;
  billing_interval: string;
  storage_limit: number;
  plan_type: string;
}

// Debug Stripe configuration
const getStripeConfig = () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  console.log('=== STRIPE CONFIG DEBUG ===');
  console.log('Publishable Key exists:', !!publishableKey);
  console.log('Key length:', publishableKey?.length || 0);
  console.log('Key starts with pk_:', publishableKey?.startsWith('pk_'));
  console.log('Environment variables:', {
    VITE_STRIPE_PUBLISHABLE_KEY: publishableKey ? 'SET' : 'NOT SET',
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET'
  });
  
  if (!publishableKey || publishableKey === 'your_stripe_publishable_key_here' || !publishableKey.startsWith('pk_')) {
    console.error('❌ Stripe publishable key not properly configured');
    return null;
  }
  
  console.log('✅ Stripe key properly configured');
  return publishableKey;
};

// Payment Form Component (inside Elements provider)
const PaymentForm: React.FC<{
  plan: StoragePlan;
  email: string;
  onEmailChange: (email: string) => void;
  onSuccess: () => void;
  onClose: () => void;
}> = ({ plan, email, onEmailChange, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Debug Stripe Elements
  useEffect(() => {
    console.log('=== STRIPE ELEMENTS DEBUG ===');
    console.log('Stripe instance:', !!stripe);
    console.log('Elements instance:', !!elements);
    console.log('User authenticated:', !!user);
    
    if (elements) {
      const cardElement = elements.getElement(CardElement);
      console.log('CardElement found:', !!cardElement);
      
      if (cardElement) {
        console.log('Setting up CardElement event listeners...');
        
        // Check if element is already ready
        console.log('Checking CardElement initial state...');
        
        // Add event listeners to debug CardElement
        cardElement.on('ready', () => {
          console.log('✅ CardElement is ready for input');
          setCardReady(true);
        });
        
        cardElement.on('change', (event) => {
          console.log('CardElement change event:', event.complete, event.error);
          if (event.error) {
            setCardError(event.error.message);
          } else {
            setCardError(null);
          }
        });
        
        cardElement.on('focus', () => {
          console.log('CardElement focused');
        });
        
        cardElement.on('blur', () => {
          console.log('CardElement blurred');
        });
        
        // Force ready state after a delay if not triggered
        setTimeout(() => {
          console.log('Attempting to focus CardElement...');
          try {
            cardElement.focus();
            // If focus works but ready event didn't fire, manually set ready
            setTimeout(() => {
              if (!cardReady) {
                console.log('⚠️ CardElement ready event not fired, setting manually');
                setCardReady(true);
              }
            }, 1000);
          } catch (error) {
            console.error('Error focusing CardElement:', error);
            // Set ready anyway since element exists
            setCardReady(true);
          }
        }, 1000);
      }
    }
  }, [stripe, elements, user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== PAYMENT SUBMISSION DEBUG ===');
    console.log('Form submitted');
    console.log('Stripe ready:', !!stripe);
    console.log('Elements ready:', !!elements);
    console.log('User:', !!user);
    console.log('Email:', email);
    console.log('Terms agreed:', agreedToTerms);
    
    if (!stripe || !elements || !user) {
      setError('Payment system not ready or user not authenticated');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card information not found');
      return;
    }

    if (!email || !agreedToTerms) {
      setError('Please fill in all required fields and agree to terms');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating customer...');
      // Step 1: Create customer using edge function
      const customerResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          name: user.user_metadata?.name || 'Wedding Customer'
        })
      });

      const customerData = await customerResponse.json();
      console.log('Customer response:', customerData);
      if (!customerResponse.ok) {
        throw new Error(customerData.error || 'Failed to create customer');
      }

      console.log('Creating payment intent...');
      // Step 2: Create payment intent using edge function
      const paymentIntentResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.amount,
          currency: plan.currency,
          customerId: customerData.customerId,
          planId: plan.plan_id
        })
      });

      const paymentIntentData = await paymentIntentResponse.json();
      console.log('Payment intent response:', paymentIntentData);
      if (!paymentIntentResponse.ok) {
        throw new Error(paymentIntentData.error || 'Failed to create payment intent');
      }

      console.log('Confirming card payment...');
      // Step 3: Confirm payment with Stripe Elements
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: email,
              name: user.user_metadata?.name || 'Wedding Customer'
            }
          }
        }
      );

      if (confirmError) {
        console.error('Payment confirmation error:', confirmError);
        throw new Error(confirmError.message || 'Payment failed');
      }

      console.log('Payment intent status:', paymentIntent?.status);
      if (paymentIntent?.status === 'succeeded') {
        // Step 4: Confirm subscription using edge function
        const { data: coupleData } = await supabase
          ?.from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single() || { data: null };

        if (coupleData) {
          console.log('Confirming subscription...');
          const confirmResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-subscription`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              customerId: customerData.customerId,
              planId: plan.plan_id,
              coupleId: coupleData.id
            })
          });

          const confirmData = await confirmResponse.json();
          console.log('Subscription confirmation response:', confirmData);
          if (!confirmResponse.ok) {
            console.warn('Subscription confirmation failed:', confirmData.error);
          }
        }

        console.log('✅ Payment successful!');
        onSuccess();
        onClose();
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <Lock className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-xs font-medium text-green-800">Secure Payment - Encrypted & Protected</p>
        </div>
      </div>

      {/* Email */}
      <Input
        label="Email Address"
        type="email"
        placeholder="your.email@example.com"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        icon={Mail}
        required
      />

      {/* Stripe Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div 
          className="p-4 border border-gray-300 rounded-lg bg-white" 
          style={{ minHeight: '44px' }}
        >
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: '14px',
                  color: '#32325d',
                  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                  fontSmoothing: 'antialiased',
                  fontSize: '16px',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#fa755a',
                  iconColor: '#fa755a',
                },
                complete: {
                  color: '#424770',
                },
              }
            }}
          />
        </div>
        {!cardReady && (
          <p className="text-xs text-gray-500 mt-1">Loading card input...</p>
        )}
        {cardError && (
          <p className="text-sm text-red-600 mt-1">{cardError}</p>
        )}
        {cardReady && (
          <p className="text-xs text-green-600 mt-1">✓ Card input ready</p>
        )}
      </div>

      {/* Terms */}
      <div className="border-t pt-4">
        <label className="flex items-start space-x-3">
          <input 
            type="checkbox" 
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 text-rose-500 focus:ring-rose-500" 
            required 
          />
          <span className="text-xs text-gray-600">
            I agree to the <a href="#" className="text-rose-600 hover:text-rose-700">Terms</a> and <a href="#" className="text-rose-600 hover:text-rose-700">Privacy Policy</a>. Monthly subscription, cancel anytime.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={loading}
        disabled={!stripe || !email || !agreedToTerms}
      >
        {loading ? (
          <div className="flex items-center">
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </div>
        ) : (
          `Subscribe for $${(plan.amount / 100).toFixed(2)}/month`
        )}
      </Button>
    </form>
  );
};

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  planId = 'Couple_Capsule',
  planName = 'Wedding Gallery',
  amount = 499
}) => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<StoragePlan | null>(null);
  const [email, setEmail] = useState(user?.email || '');
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Initialize Stripe when modal opens
  useEffect(() => {
    const initializeStripe = async () => {
      if (!isOpen) return;
      
      const publishableKey = getStripeConfig();
      if (!publishableKey) {
        setStripeError('Stripe is not configured. Please contact support.');
        return;
      }
      
      try {
        console.log('Loading Stripe with key:', publishableKey.substring(0, 10) + '...');
        const stripeInstance = loadStripe(publishableKey);
        setStripePromise(stripeInstance);
        setStripeError(null);
        
        // Test if Stripe loads properly
        const stripe = await stripeInstance;
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        console.log('✅ Stripe loaded successfully');
      } catch (error) {
        console.error('❌ Stripe loading error:', error);
        setStripeError('Failed to load payment system. Please refresh and try again.');
      }
    };

    initializeStripe();
  }, [isOpen]);

  // Fetch the storage plan details
  useEffect(() => {
    const fetchPlan = async () => {
      if (!isSupabaseConfigured() || !supabase || !planId) {
        // Use default plan data if Supabase not configured
        setPlan({
          id: 'default-plan',
          plan_id: planId,
          name: planName,
          description: 'Secure your wedding memories forever with unlimited photo and video storage',
          stripe_price_id: 'price_default',
          amount: amount,
          currency: 'usd',
          billing_interval: 'month',
          storage_limit: 1000000000, // 1GB
          plan_type: 'couple'
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('storage_plans')
          .select('*')
          .eq('plan_id', planId)
          .single();

        if (error) throw error;
        setPlan(data);
      } catch (err) {
        console.error('Error fetching plan:', err);
        // Fallback to default plan
        setPlan({
          id: 'default-plan',
          plan_id: planId,
          name: planName,
          description: 'Secure your wedding memories forever with unlimited photo and video storage',
          stripe_price_id: 'price_default',
          amount: amount,
          currency: 'usd',
          billing_interval: 'month',
          storage_limit: 1000000000, // 1GB
          plan_type: 'couple'
        });
      }
    };

    if (isOpen) {
      fetchPlan();
    }
  }, [isOpen, planId]);

  if (!isOpen || !plan) return null;

  // Show error if Stripe failed to load
  if (stripeError) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md mx-auto my-8">
          <Card className="w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment System Error</h3>
            <p className="text-gray-600 mb-6">{stripeError}</p>
            <div className="space-y-3">
              <Button variant="primary" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading if Stripe isn't ready
  if (!stripePromise) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md mx-auto my-8">
          <Card className="w-full p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading secure payment system...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md mx-auto my-8">
        <Card className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Wedding Gallery</h3>
              <p className="text-xs text-gray-600 mt-1">Secure your memories</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Plan Summary */}
          <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border-b border-gray-200">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h4>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                ${(plan.amount / 100).toFixed(2)}<span className="text-sm font-normal text-gray-600">/month</span>
              </div>
              <div className="flex justify-center space-x-4 text-xs text-gray-600">
                <span>✓ Unlimited storage</span>
                <span>✓ HD streaming</span>
                <span>✓ Download anytime</span>
              </div>
            </div>
          </div>

          {/* Payment Form with Stripe Elements */}
          <div className="p-6">
            <Elements 
              stripe={stripePromise}
              options={{
                fonts: [
                  {
                    cssSrc: 'https://fonts.googleapis.com/css?family=Open+Sans',
                  },
                ],
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#f43f5e',
                  }
                }
              }}
            >
              <PaymentForm
                plan={plan}
                email={email}
                onEmailChange={setEmail}
                onSuccess={onSuccess}
                onClose={onClose}
              />
            </Elements>

            {/* Security Footer */}
            <div className="mt-3 text-center">
              <div className="flex items-center justify-center space-x-3 text-xs text-gray-500">
                <div className="flex items-center">
                  <Lock className="w-3 h-3 mr-1" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  <span>PCI Compliant</span>
                </div>
                <div className="flex items-center">
                  <span>Powered by Stripe</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cancel anytime. No hidden fees.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};