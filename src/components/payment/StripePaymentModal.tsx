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
  const [plan, setPlan] = useState<StoragePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardName: '',
    agreedToTerms: false
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      handleInputChange('cardNumber', formatted);
    }
  };

  const handleExpiryChange = (field: 'expiryMonth' | 'expiryYear', value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (field === 'expiryMonth') {
      if (numericValue.length <= 2 && (numericValue === '' || (parseInt(numericValue) >= 1 && parseInt(numericValue) <= 12))) {
        handleInputChange(field, numericValue);
      }
    } else if (field === 'expiryYear') {
      if (numericValue.length <= 2) {
        handleInputChange(field, numericValue);
      }
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 4) {
      handleInputChange('cvc', numericValue);
    }
  };

  const validateForm = () => {
    if (!formData.email) return 'Email is required';
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) return 'Valid card number is required';
    if (!formData.expiryMonth || !formData.expiryYear) return 'Expiry date is required';
    if (!formData.cvc || formData.cvc.length < 3) return 'CVC is required';
    if (!formData.cardName) return 'Cardholder name is required';
    if (!formData.agreedToTerms) return 'Please agree to the terms';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !plan) {
      setError('User authentication or plan information missing');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create customer using edge function
      const customerResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.cardName
        })
      });

      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(customerData.error || 'Failed to create customer');
      }

      // Step 2: Create subscription using edge function
      const subscriptionResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-couple-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.plan_id,
          customerId: customerData.customerId,
          priceId: plan.stripe_price_id,
          paymentMethod: {
            card: {
              number: formData.cardNumber.replace(/\s/g, ''),
              exp_month: parseInt(formData.expiryMonth),
              exp_year: parseInt(`20${formData.expiryYear}`),
              cvc: formData.cvc
            },
            billing_details: {
              name: formData.cardName,
              email: formData.email
            }
          }
        })
      });

      const subscriptionData = await subscriptionResponse.json();
      if (!subscriptionResponse.ok) {
        throw new Error(subscriptionData.error || 'Payment failed. Please check your card information.');
      }

      // Step 3: Update subscription in database
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

  if (!isOpen || !plan) return null;

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

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                icon={Mail}
                required
              />

              {/* Card Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Information
                </label>
                
                {/* Card Number */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                    maxLength={19}
                    required
                  />
                </div>
                
                {/* Expiry and CVC */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="MM"
                    value={formData.expiryMonth}
                    onChange={(e) => handleExpiryChange('expiryMonth', e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base text-center"
                    maxLength={2}
                    required
                  />
                  <input
                    type="text"
                    placeholder="YY"
                    value={formData.expiryYear}
                    onChange={(e) => handleExpiryChange('expiryYear', e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base text-center"
                    maxLength={2}
                    required
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    value={formData.cvc}
                    onChange={handleCvcChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base text-center"
                    maxLength={4}
                    required
                  />
                </div>
                
                {/* Cardholder Name */}
                <input
                  type="text"
                  placeholder="Name on card"
                  value={formData.cardName}
                  onChange={(e) => handleInputChange('cardName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
                  required
                />
              </div>

              {/* Terms */}
              <div className="border-t pt-4">
                <label className="flex items-start space-x-3">
                  <input 
                    type="checkbox" 
                    checked={formData.agreedToTerms}
                    onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
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
                disabled={!formData.email || !formData.cardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.cvc || !formData.cardName || !formData.agreedToTerms}
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
        </Card>
      </div>
    </div>
  );
};