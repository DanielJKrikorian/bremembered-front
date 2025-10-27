// src/pages/Checkout.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, AlertCircle, PartyPopper } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { trackPageView } from '../utils/analytics';
import { supabase } from '../lib/supabase';
import { CheckoutForm } from '../components/payment/CheckoutForm';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { AuthModal } from '../components/auth/AuthModal';
import { CheckoutProvider } from '../components/payment/CheckoutContext';
import { BookingConfirmation } from '../components/checkout/BookingConfirmation';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY || '');

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
  const { isAuthenticated, user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [referralDiscount, setReferralDiscount] = useState<number>(0);
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [bookingIds, setBookingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingFees, setIsFetchingFees] = useState(false);
  const analyticsTracked = useRef(false);

  const rawCartItems = useMemo(() => {
    const items = location.state?.cartItems || cartState.items;
    return items.map((item) => ({
      ...item,
      package: {
        ...item.package,
        price: Number(item.package?.price) || 0,
        service_type: item.package?.service_type || 'unknown',
        event_type: item.package?.event_type || 'wedding',
        id: item.package?.id || '',
        name: item.package?.name || 'Unknown Package',
      },
      vendor: {
        id: item.vendor?.id || '',
        name: item.vendor?.name || 'Unknown Vendor',
        stripe_account_id: item.vendor?.stripe_account_id || null,
      },
      venue: item.venue ? { id: item.venue.id, name: item.venue.name } : null,
      eventDate: item.eventDate || '',
      eventTime: item.eventTime || '',
      endTime: item.endTime || '',
      id: item.id || '',
      discount: Number(item.discount) || 0,
    }));
  }, [location.state, cartState.items]);

  useEffect(() => {
    setIsFetchingFees(false);
  }, [rawCartItems]);

  const cartItems = rawCartItems;

  const totalAmount = useMemo(() => {
    const passedTotal = location.state?.totalAmount;
    if (passedTotal && passedTotal > 0) return passedTotal;
    return cartItems.reduce((sum, item) => sum + (item.package.price || 0), 0);
  }, [cartItems, location.state]);

  // Auth
  useEffect(() => {
    const fetchSession = async () => {
      if (isAuthenticated) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setAuthToken(session.access_token);
      } else {
        setShowAuthModal(true);
        setAuthMode('signup');
      }
    };
    fetchSession();
  }, [isAuthenticated]);

  // Analytics
  useEffect(() => {
    if (!loading && !analyticsTracked.current) {
      trackPageView('checkout', 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [loading, user?.id]);

  const handlePaymentSuccess = async (bookingIds: string[]) => {
    setBookingIds(bookingIds);
    setStep(2);
    clearCart();
  };

  const handleDiscountApplied = (discount: number, coupon: any) => {
    setAppliedDiscount(discount);
    setAppliedCoupon(coupon);
    setClientSecret(null);
  };

  const handleDiscountRemoved = () => {
    setAppliedDiscount(0);
    setAppliedCoupon(null);
    setClientSecret(null);
  };

  const handleReferralApplied = (discount: number, referral: any) => {
    setReferralDiscount(discount);
    setAppliedReferral(referral);
    setClientSecret(null);
  };

  const handleReferralRemoved = () => {
    setReferralDiscount(0);
    setAppliedReferral(null);
    setClientSecret(null);
  };

  const handleCreateAccount = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const stripeOptions: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#f43f5e',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        fontFamily: 'system-ui, sans-serif',
      },
    },
  };

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cart is empty</h1>
          <button
            onClick={() => navigate('/cart')}
            className="text-rose-600 hover:text-rose-700"
          >
            Go back to cart
          </button>
        </div>
      </div>
    );
  }

  // CALCULATE DEPOSIT
  const depositAmount = Math.round(totalAmount * 0.5) + 5000;

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {isFetchingFees && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full" />
        </div>
      )}

      {step === 2 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-rose-500 to-yellow-500 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 10}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <style>
        {`
          @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti { animation: confetti linear forwards; }
        `}
      </style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/cart')}>
              Back to Cart
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {step === 1 ? 'Complete Your Booking' : 'Your Big Day is Booked!'}
              </h1>
              <p className="text-gray-600 mt-1">
                {step === 1
                  ? 'Enter your details, sign contracts, and pay your deposit'
                  : 'Congratulations! Your booking is confirmed!'}
              </p>
            </div>
          </div>
        </div>

        {error && step === 1 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {step === 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CheckoutProvider cartItems={cartItems} totalAmount={totalAmount}>
                <Elements stripe={stripePromise} options={stripeOptions}>
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
                    isInitializingPayment={false}
                    pollTimeout={60000}
                    pollInterval={5000}
                  />
                </Elements>
              </CheckoutProvider>

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
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCreateAccount}
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
              isInitializingPayment={false}
            />
          </div>
        ) : (
          <BookingConfirmation
            cartItems={cartItems}
            totalAmount={totalAmount}
            depositAmount={depositAmount}
            onCreateAccount={handleCreateAccount}
          />
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
          onAuthSuccess={() => {
            setShowAuthModal(false);
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) setAuthToken(session.access_token);
            });
          }}
        />
      </div>
    </div>
  );
};

export default Checkout;