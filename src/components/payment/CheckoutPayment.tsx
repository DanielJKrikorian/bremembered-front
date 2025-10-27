// src/components/checkout/CheckoutPayment.tsx
import React from 'react';
import { CreditCard, Lock, DollarSign, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useCheckout } from './CheckoutContext';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { supabase } from '../../lib/supabase';

export const CheckoutPayment: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  const elements = useElements();
  const stripe = useStripe();

  const {
    paymentMethod,
    setPaymentMethod,
    paymentDetailsComplete,
    setPaymentDetailsComplete,
    formData,
    updateFormData,
    error,
    setError,
    grandTotal,
    totalAmount,
    setCurrentStep,
    cartItems,
    signatures,
    appliedDiscount,
    appliedReferral,
  } = useCheckout();

  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthToken(session?.access_token || null);
    };
    getToken();
  }, []);

  const handleCardChange = (event: any) => {
    setPaymentDetailsComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  const formatAmount = (amount: number) => {
    const value = Number(amount);
    if (isNaN(value) || value <= 0) return '$0.00';
    return `$${(value / 100).toFixed(2)}`;
  };

  const depositAmount = formatAmount(grandTotal);

  // POLL SUPABASE UNTIL BOOKINGS ARE CONFIRMED
  const waitForBookingConfirmation = async (paymentIntentId: string): Promise<boolean> => {
    const maxAttempts = 30;
    const delay = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .in('status', ['confirmed']);

      if (error) {
        console.error('Polling error:', error);
      } else if (data && data.length === cartItems.length) {
        console.log('All bookings confirmed:', data);
        return true;
      }

      await new Promise((r) => setTimeout(r, delay));
    }

    return false;
  };

  const handlePay = async () => {
    if (!stripe || !elements || !authToken || isProcessing) {
      setError('Please log in and complete payment details.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    let paymentMethodId: string | undefined;

    try {
      // CREATE PAYMENT METHOD
      if (paymentMethod === 'card') {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error('Card input missing');

        const { paymentMethod, error } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (error) throw error;
        paymentMethodId = paymentMethod.id;
      }

      // VALIDATE DATA
      if (!cartItems?.length) throw new Error('Cart is empty');
      if (!formData.coupleId) throw new Error('Missing couple ID');
      if (!grandTotal || grandTotal <= 5000) throw new Error('Invalid total');

      // BUILD PAYLOAD
      const payload = {
        cartItems,
        totalAmount,
        discountAmount: Number(appliedDiscount) || 0,
        referralDiscount: Number(appliedReferral?.discount) || 0,
        customerInfo: {
          partner1Name: formData.partner1Name,
          partner2Name: formData.partner2Name || '',
          email: formData.email,
          phone: formData.phone,
          billingAddress: formData.billingAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          coupleId: formData.coupleId,
          eventDate: cartItems[0]?.eventDate || '',
          eventTime: cartItems[0]?.eventTime || '',
          endTime: cartItems[0]?.endTime || '',
        },
        paymentMethodId,
        signatures,
        platformFee: 5000,
        grandTotal,
        paymentType: 'deposit',
      };

      console.log('Sending payload to Edge Function:', JSON.stringify(payload, null, 2));

      // CALL EDGE FUNCTION
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/new-process-booking-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Edge function error:', data);
        throw new Error(data.error || 'Payment failed');
      }

      // HANDLE 3D SECURE
      if (data.requiresAction) {
        const { error: confirmError } = await stripe.confirmPayment({
          clientSecret: data.clientSecret,
          confirmParams: { return_url: `${window.location.origin}/checkout/success` },
        });
        if (confirmError) throw confirmError;
        // If 3D Secure succeeds, Stripe redirects — we stop here
        return;
      }

      // NO 3D SECURE — WAIT FOR WEBHOOK CONFIRMATION
      const confirmed = await waitForBookingConfirmation(data.paymentIntentId);
      if (!confirmed) {
        throw new Error('Booking not confirmed. Please contact support.');
      }

      // ALL GOOD — GO TO CONFIRMATION
      onSubmit();

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* PAYMENT METHOD CARD */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Payment Method</h3>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('card');
              setPaymentDetailsComplete(false);
            }}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'card'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">Credit Card</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Visa, Mastercard, Amex</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('affirm');
              setPaymentDetailsComplete(false);
            }}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              paymentMethod === 'affirm'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span className="font-medium">Affirm</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Pay over time</p>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {paymentMethod === 'card' ? 'Card Information' : 'Payment Information'}
            </label>
            <div className="p-4 border border-gray-300 rounded-lg bg-white">
              {paymentMethod === 'card' ? (
                <CardElement
                  onChange={handleCardChange}
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#1f2937',
                        fontFamily: 'system-ui, sans-serif',
                        fontWeight: '400',
                        iconColor: '#6b7280',
                        '::placeholder': { color: '#9ca3af' },
                      },
                      invalid: { color: '#dc2626' },
                    },
                    hidePostalCode: true,
                  }}
                />
              ) : (
                <div className="text-center text-gray-500">Affirm integration coming soon</div>
              )}
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.acceptStripe}
                onChange={(e) => updateFormData('acceptStripe', e.target.checked)}
                className="mt-1 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-sm text-gray-600">
                I accept that Stripe is being used to securely process my payment.
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Lock className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              Your payment is secured by 256-bit SSL encryption
            </span>
          </div>
        </div>
      </Card>

      {/* SECURE BADGE */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg border border-green-200">
          <Lock className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Secure Payment with Stripe</p>
            <p className="text-xs text-green-700">
              Choose between credit card or Affirm payment options
            </p>
          </div>
        </div>
      </Card>

      {/* ERROR */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* BUTTONS */}
      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={handleBack}
          className="min-w-[180px] border-red-500 text-red-500 bg-white hover:bg-red-50 hover:border-red-600 hover:text-red-600 px-6 py-3 text-base font-medium"
        >
          Back to Contracts
        </Button>

        <Button
          variant="primary"
          onClick={handlePay}
          disabled={
            isProcessing ||
            !paymentDetailsComplete ||
            (paymentMethod === 'card' && !formData.acceptStripe) ||
            !authToken
          }
          className={`min-w-[180px] px-6 py-3 text-base font-medium flex items-center justify-center ${
            isProcessing ||
            !paymentDetailsComplete ||
            (paymentMethod === 'card' && !formData.acceptStripe) ||
            !authToken
              ? 'opacity-50 cursor-not-allowed bg-gray-400'
              : 'bg-rose-500 hover:bg-rose-600 text-white'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay {depositAmount} Deposit</>
          )}
        </Button>
      </div>
    </div>
  );
};