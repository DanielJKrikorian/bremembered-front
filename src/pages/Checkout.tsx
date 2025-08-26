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
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey && publishableKey !== 'your_stripe_publishable_key_here'
  ? loadStripe(publishableKey)
  : null;

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);

  const cartItems = location.state?.cartItems || cartState.items;
  const totalAmount = location.state?.totalAmount || cartState.totalAmount;

  useEffect(() => {
    console.log('Checkout: Stripe Publishable Key:', publishableKey);
    console.log('Checkout: Stripe Promise:', !!stripePromise);
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems.length, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePaymentSuccess = () => {
    setStep(2);
    clearCart();
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
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
              {stripePromise ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#f43f5e',
                        colorBackground: '#ffffff',
                        colorText: '#1f2937',
                        colorDanger: '#dc2626',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                      },
                    },
                  }}
                >
                  <CheckoutForm
                    cartItems={cartItems}
                    totalAmount={totalAmount}
                    discountAmount={discountAmount}
                    referralDiscount={referralDiscount}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              ) : (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment System Unavailable</h3>
                  <p className="text-gray-600 mb-6">
                    The payment system is not configured. Please contact our support team to complete your booking.
                  </p>
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      onClick={() => (window.location.href = 'mailto:hello@bremembered.io')}
                    >
                      Contact Support
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/cart')}>
                      Back to Cart
                    </Button>
                  </div>
                </Card>
              )}
            </div>
            <OrderSummary
              cartItems={cartItems}
              totalAmount={totalAmount}
              discountAmount={discountAmount}
              referralDiscount={referralDiscount}
              discountCode={discountCode}
              setDiscountCode={setDiscountCode}
              discountError={discountError}
              setDiscountError={setDiscountError}
              isValidatingDiscount={isValidatingDiscount}
              setIsValidatingDiscount={setIsValidatingDiscount}
              appliedDiscount={appliedDiscount}
              setAppliedDiscount={setAppliedDiscount}
            />
          </div>
        ) : (
          <BookingConfirmation
            cartItems={cartItems}
            totalAmount={totalAmount}
            discountAmount={discountAmount}
            referralDiscount={referralDiscount}
            onViewBookings={() => navigate('/my-bookings')}
            onContinueShopping={() => navigate('/')}
          />
        )}
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} />
    </div>
  );
};