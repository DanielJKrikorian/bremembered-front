import React, { useState, useEffect } from 'react';
import { X, Lock, Check, Mail } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

// Initialize stripePromise outside the component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planId?: string;
  planName?: string;
  amount?: number;
}

const PaymentForm: React.FC<{
  plan: StoragePlan;
  email: string;
  onEmailChange: (email: string) => void;
  onSuccess: () => void;
  onClose: () => void;
  coupleId: string;
}> = ({ plan, email, onEmailChange, onSuccess, onClose, coupleId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cardReady, setCardReady] = useState(false);

  useEffect(() => {
    console.log('=== STRIPE ELEMENTS DEBUG ===');
    console.log('Stripe instance:', !!stripe);
    console.log('Elements instance:', !!elements);
    console.log('User authenticated:', !!user);
    console.log('Couple ID:', coupleId);
  }, [stripe, elements, user, coupleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== PAYMENT SUBMISSION DEBUG ===');
    console.log('Form submitted');
    console.log('Stripe ready:', !!stripe);
    console.log('Elements ready:', !!elements);
    console.log('User:', !!user);
    console.log('Email:', email);
    console.log('Terms agreed:', agreedToTerms);
    console.log('Card ready:', cardReady);
    console.log('Couple ID:', coupleId);

    if (!stripe || !elements || !user) {
      setError('Payment system not ready or user not authenticated');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card information not found');
      return;
    }

    if (!email || !agreedToTerms || !cardReady) {
      setError('Please fill in all required fields, agree to terms, and ensure card details are valid');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating customer...');
      const customerResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            name: user.user_metadata?.name || 'Wedding Customer',
          }),
        }
      );

      const customerData = await customerResponse.json();
      console.log('Customer response:', customerData);

      if (!customerResponse.ok) {
        throw new Error(customerData.error || 'Failed to create customer');
      }

      console.log('Creating payment method...');
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: email,
          name: user.user_metadata?.name || 'Wedding Customer',
        },
      });

      if (paymentMethodError) {
        console.error('Payment method creation error:', paymentMethodError);
        throw new Error(paymentMethodError.message || 'Failed to create payment method');
      }

      console.log('Creating payment intent...');
      const paymentIntentResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/couple-gallery-payment-intent`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: plan.amount,
            currency: plan.currency,
            customerId: customerData.customerId,
            planId: plan.plan_id,
            coupleId,
            paymentMethodId: paymentMethod.id,
          }),
        }
      );

      const paymentIntentData = await paymentIntentResponse.json();
      console.log('Payment intent response:', paymentIntentData);

      if (!paymentIntentResponse.ok) {
        throw new Error(paymentIntentData.error || 'Failed to create payment intent');
      }

      if (paymentIntentData.error) {
        throw new Error(paymentIntentData.error);
      }

      console.log('✅ Payment successful!');
      onSuccess();
      onClose();
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
      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <Lock className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-xs font-medium text-green-800">Secure Payment - Encrypted & Protected</p>
        </div>
      </div>
      <Input
        label="Email Address"
        type="email"
        placeholder="your.email@example.com"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        icon={Mail}
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white min-h-[40px]">
          <CardElement
            onReady={() => {
              console.log('✅ CardElement is ready for input');
              setCardReady(true);
            }}
            onChange={(event) => {
              console.log('CardElement change event:', event);
              setError(event.error ? event.error.message : null);
            }}
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': {
                    color: '#6b7280',
                  },
                },
                invalid: {
                  color: '#dc2626',
                },
              },
            }}
          />
        </div>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        {cardReady && <p className="text-xs text-green-600 mt-1">✓ Card input ready</p>}
      </div>
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
            I agree to the <a href="/terms" className="text-rose-600 hover:text-rose-700">Terms</a> and{' '}
            <a href="/privacy" className="text-rose-600 hover:text-rose-700">Privacy Policy</a>. Monthly
            subscription, cancel anytime.
          </span>
        </label>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full bg-rose-600 hover:bg-rose-700 text-white"
        loading={loading}
        disabled={!stripe || !elements || !email || !agreedToTerms || !cardReady}
      >
        {loading ? 'Processing Payment...' : `Subscribe for $${(plan.amount / 100).toFixed(2)}/month`}
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
  amount = 499,
}) => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<StoragePlan | null>(null);
  const [email, setEmail] = useState(user?.email || '');
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  // Fetch couple ID
  useEffect(() => {
    const fetchCoupleId = async () => {
      if (!isSupabaseConfigured() || !supabase || !user) return;
      try {
        const { data, error } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (error) throw new Error(`Failed to fetch couple ID: ${error.message}`);
        setCoupleId(data.id);
      } catch (err) {
        console.error('Error fetching couple ID:', err);
        setStripeError('Failed to load user data. Please refresh and try again.');
      }
    };
    if (isOpen) fetchCoupleId();
  }, [isOpen, user]);

  // Handle stripePromise resolution
  useEffect(() => {
    if (!isOpen) return;

    stripePromise.then((stripe) => {
      if (!stripe) {
        console.error('❌ Stripe failed to load');
        setStripeError('Failed to load payment system. Please refresh and try again.');
      } else {
        console.log('✅ Stripe loaded successfully');
        setStripeLoaded(true);
        setStripeError(null);
      }
    }).catch((error) => {
      console.error('❌ Stripe loading error:', error);
      setStripeError('Failed to load payment system. Please refresh and try again.');
    });
  }, [isOpen]);

  // Fetch the storage plan details
  useEffect(() => {
    const fetchPlan = async () => {
      if (!isSupabaseConfigured() || !supabase || !planId) {
        setPlan({
          id: 'default-plan',
          plan_id: planId,
          name: planName,
          description: 'Secure your wedding memories forever with unlimited photo and video storage',
          stripe_price_id: 'price_default',
          amount: amount,
          currency: 'usd',
          billing_interval: 'month',
          storage_limit: 1000000000,
          plan_type: 'couple',
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
        setPlan({
          id: 'default-plan',
          plan_id: planId,
          name: planName,
          description: 'Secure your wedding memories forever with unlimited photo and video storage',
          stripe_price_id: 'price_default',
          amount: amount,
          currency: 'usd',
          billing_interval: 'month',
          storage_limit: 1000000000,
          plan_type: 'couple',
        });
      }
    };
    if (isOpen) {
      fetchPlan();
    }
  }, [isOpen, planId, planName, amount]);

  if (!isOpen || !plan || !coupleId) return null;

  if (stripeError || !stripeLoaded) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md mx-auto my-8">
          <Card className="w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment System Error</h3>
            <p className="text-gray-600 mb-6">{stripeError || 'Failed to load payment system'}</p>
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md mx-auto my-8">
        <Card className="w-full">
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
          <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border-b border-gray-200">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h4>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                ${(plan.amount / 100).toFixed(2)}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </div>
              <div className="flex justify-center space-x-4 text-xs text-gray-600">
                <span>✓ Unlimited storage</span>
                <span>✓ HD streaming</span>
                <span>✓ Download anytime</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <Elements
              stripe={stripePromise}
              options={{
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#f43f5e',
                  },
                },
              }}
            >
              <PaymentForm
                plan={plan}
                email={email}
                onEmailChange={setEmail}
                onSuccess={onSuccess}
                onClose={onClose}
                coupleId={coupleId}
              />
            </Elements>
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
              <p className="text-xs text-gray-500 mt-1">Cancel anytime. No hidden fees.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};