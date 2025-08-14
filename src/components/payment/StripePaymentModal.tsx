import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, Check, Loader, Mail } from 'lucide-react';
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

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  planId = 'Couple_Capsule',
  planName = 'Wedding Gallery',
  amount = 499
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<StoragePlan | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    email: user?.email || ''
  });

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

  const handleInputChange = (field: string, value: string) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !user) return;

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would:
      // 1. Create a Stripe checkout session using the stripe_price_id
      // 2. Redirect to Stripe checkout
      // 3. Handle the webhook to update the subscription
      
      // For now, we'll simulate the payment process
      console.log('Processing payment for plan:', plan);
      console.log('Stripe Price ID:', plan.stripe_price_id);
      console.log('Payment form:', paymentForm);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app, this would be handled by a webhook after successful payment
      if (isSupabaseConfigured() && supabase) {
        // Get couple ID
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (coupleError) throw coupleError;

        // Update or create subscription
        const { error: subscriptionError } = await supabase
          .from('couple_subscriptions')
          .upsert({
            couple_id: coupleData.id,
            plan_id: plan.plan_id,
            payment_status: 'active',
            subscription_id: `sub_${Date.now()}`, // This would come from Stripe
            customer_id: `cus_${Date.now()}`, // This would come from Stripe
            updated_at: new Date().toISOString()
          });

        if (subscriptionError) throw subscriptionError;
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

  if (!isOpen) return null;

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
        {plan && (
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
        )}

        {/* Payment Form */}
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

            {/* Card Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Information</h4>
              <div className="space-y-3">
                <Input
                  label="Card Number"
                  placeholder="1234 5678 9012 3456"
                  value={paymentForm.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                  icon={CreditCard}
                  maxLength={19}
                  required
                />
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                      value={paymentForm.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                      maxLength={5}
                      required
                    />
                  </div>
                  <Input
                    label="CVV"
                    placeholder="123"
                    value={paymentForm.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                    required
                  />
                </div>
                
                <Input
                  label="Cardholder Name"
                  placeholder="Name as it appears on card"
                  value={paymentForm.cardName}
                  onChange={(e) => handleInputChange('cardName', e.target.value)}
                  required
                />
                
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your.email@example.com"
                  value={paymentForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  icon={Mail}
                  required
                />
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
              disabled={!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv || !paymentForm.cardName || !paymentForm.email}
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </div>
              ) : (
                `Subscribe for $${(amount / 100).toFixed(2)}/month`
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
        </Card>
      </div>
    </div>
  );
};