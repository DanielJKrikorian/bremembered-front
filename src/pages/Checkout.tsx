import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, AlertCircle, Shield, Phone } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CheckoutForm } from '../components/payment/CheckoutForm';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { BookingConfirmation } from '../components/checkout/BookingConfirmation';
import { AuthModal } from '../components/auth/AuthModal';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [referralDiscount, setReferralDiscount] = useState<number>(0);
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);

  const cartItems = location.state?.cartItems || cartState.items;
  const totalAmount = location.state?.totalAmount || cartState.totalAmount;

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems.length, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const initializePaymentIntent = async (customerInfo: any, referralCode: string) => {
    console.log('=== PAYMENT INIT DEBUG ===');
    console.log('Function called with:');
    console.log('- Cart items count:', cartItems.length);
    console.log('- Total amount:', totalAmount);
    console.log('- Customer info:', customerInfo);
    console.log('- Applied discount:', appliedDiscount);
    console.log('- Referral discount:', referralDiscount);
    console.log('- Current clientSecret:', clientSecret);
    console.log('- Is initializing:', isInitializingPayment);
    
    console.log('=== FRONTEND PAYMENT INIT DEBUG ===')
    console.log('Cart items:', cartItems.length)
    console.log('Total amount:', totalAmount)
    console.log('Customer info:', customerInfo)
    console.log('Applied discount:', appliedDiscount)
    console.log('Referral discount:', referralDiscount)
    
    setIsInitializingPayment(true);
    try {
      const requestBody = {
        cartItems,
        totalAmount,
        discountAmount: appliedDiscount,
        referralDiscount,
        customerInfo,
      }
      
      console.log('Sending request body:', JSON.stringify(requestBody, null, 2))
      
      console.log('Making fetch request to:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-down-payment-intent`);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-down-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response received:');
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        console.error('Payment intent creation failed:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      console.log('Payment intent response:', data)
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      console.log('Payment intent created:', data);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      // Set a fallback client secret to prevent infinite loading
      setClientSecret('failed');
    } finally {
      setIsInitializingPayment(false);
      console.log('=== PAYMENT INIT COMPLETE ===');
    }
  };

  const handlePaymentSuccess = () => {
    setStep(2);
    clearCart();
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleDiscountApplied = (discount: number, coupon: any) => {
    setAppliedDiscount(discount);
    setAppliedCoupon(coupon);
  };

  const handleDiscountRemoved = () => {
    setAppliedDiscount(0);
    setAppliedCoupon(null);
  };

  const handleReferralApplied = (discount: number, referral: any) => {
    setReferralDiscount(discount);
    setAppliedReferral(referral);
  };

  const handleReferralRemoved = () => {
    setReferralDiscount(0);
    setAppliedReferral(null);
  };

  const handleCreateAccount = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/cart')}>
              Back to Cart
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
              <p className="text-gray-600 mt-1">
                {step === 1 ? 'Enter your details, sign contracts, and pay your deposit' : 'Booking Confirmation'}
              </p>
            </div>
          </div>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {clientSecret ? (
                <Elements 
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#f43f5e',
                      },
                    },
                  }}
                >
                  <CheckoutForm
                    cartItems={cartItems}
                    totalAmount={totalAmount}
                    discountAmount={appliedDiscount}
                    referralDiscount={referralDiscount}
                    clientSecret={clientSecret}
                    paymentIntentId={paymentIntentId}
                    onSuccess={handlePaymentSuccess}
                    onReferralApplied={handleReferralApplied}
                    onReferralRemoved={handleReferralRemoved}
                    onInitializePayment={initializePaymentIntent}
                  />
                </Elements>
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing payment...</p>
                  </div>
                </div>
              )}
              
              {!isAuthenticated && (
                <Card className="p-6 mb-8 bg-amber-50 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-1">Sign up for the best experience</h3>
                      <p className="text-amber-800 text-sm">
                        Create an account to message vendors, track your bookings, and access your wedding gallery
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAuthMode('login');
                          setShowAuthModal(true);
                        }}
                        className="text-amber-700 border-amber-300 hover:bg-amber-100"
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setAuthMode('signup');
                          setShowAuthModal(true);
                        }}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
            <OrderSummary
              cartItems={cartItems}
              totalAmount={totalAmount}
              onDiscountApplied={handleDiscountApplied}
              onDiscountRemoved={handleDiscountRemoved}
              appliedDiscount={appliedDiscount}
              appliedCoupon={appliedCoupon}
            />
          </div>
        ) : (
          <BookingConfirmation
            cartItems={cartItems}
            totalAmount={totalAmount}
            depositAmount={Math.round((totalAmount - appliedDiscount - referralDiscount) * 0.5) + cartItems.length * 150 * 100}
            onCreateAccount={handleCreateAccount}
          />
        )}
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} />
    </div>
  );
};