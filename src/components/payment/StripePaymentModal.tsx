import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, Check, Loader, Mail } from 'lucide-react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { stripePromise } from '../../lib/stripe';
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

const PaymentForm: React.FC<{
  plan: StoragePlan;
  onSuccess: () => void;
  onClose: () => void;
}> = ({ plan, onSuccess, onClose }) => {
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.email || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !user) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card information not found. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create customer first
      const customerResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: user.user_metadata?.name || email.split('@')[0]
        })
      });

      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(customerData.error || 'Failed to create customer');
      }

      // Create subscription
      const subscriptionResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-couple-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.plan_id,
          customerId: customerData.customerId,
          priceId: plan.stripe_price_id
        })
      });

      const subscriptionData = await subscriptionResponse.json();
      if (!subscriptionResponse.ok) {
        throw new Error(subscriptionData.error || 'Failed to create subscription');
      }

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(
        subscriptionData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email,
              name: user.user_metadata?.name || email.split('@')[0]
            }
          }
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Update subscription in database
      if (isSupabaseConfigured() && supabase) {
        const { data: coupleData } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (coupleData) {
          await supabase
            .from('couple_subscriptions')
            .upsert({
              couple_id: coupleData.id,
              plan_id: plan.plan_id,
              payment_status: 'active',
              subscription_id: subscriptionData.subscriptionId,
              customer_id: customerData.customerId,
              updated_at: new Date().toISOString()
            });
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
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
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          required
        />

        {/* Card Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-transparent">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {/* Terms */}
        <div className="border-t pt-4">
          <label className="flex items-start space-x-3">
            <input 
              type="checkbox" 
              className="mt-1 text-rose-500 focus:ring-rose-500" 
              required 
            />
            <span className="text-xs text-gray-600">
              I agree to the <a href="#" className="text-rose-600 hover:text-rose-700">Terms</a> and <a href="#" className="text-rose-600 hover:text-rose-700">Privacy Policy</a>. Monthly subscription, cancel anytime.
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!stripe || !email}
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
      </div>

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
            <CreditCard className="w-3 h-3 mr-1" />
            <span>Powered by Stripe</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Cancel anytime. No hidden fees.
        </p>
      </div>
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
  const [plan, setPlan] = useState<StoragePlan | null>(null);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
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
          <Elements stripe={stripePromise}>
            <PaymentForm 
              plan={plan}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        </Card>
      </div>
    </div>
  );
};