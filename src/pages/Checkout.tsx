import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, PartyPopper } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { trackPageView } from '../utils/analytics'; // Import trackPageView
import { supabase } from '../lib/supabase';
import { CheckoutForm } from '../components/payment/CheckoutForm';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { AuthModal } from '../components/auth/AuthModal';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Local formatPrice function
const formatPrice = (amount: number): string => {
  return `$${(amount / 100).toFixed(2)}`;
};

// Helper function to format time to 12-hour format
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const adjustedHours = hours % 12 || 12;
  return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
  const { isAuthenticated, user, loading } = useAuth(); // Add loading
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
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any[]>([]);
  const analyticsTracked = useRef(false); // Add ref to prevent duplicate calls

  // Track analytics only once on mount
  useEffect(() => {
    if (!loading && !analyticsTracked.current) {
      console.log('Tracking analytics for checkout:', new Date().toISOString());
      trackPageView('checkout', 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [loading, user?.id]);

  // Memoize cartItems and totalAmount to prevent unnecessary re-renders
  const cartItems = useMemo(() => location.state?.cartItems || cartState.items, [location.state, cartState.items]);
  const totalAmount = useMemo(() => location.state?.totalAmount || cartState.totalAmount, [location.state, cartState.totalAmount]);

  // Debug render
  useEffect(() => {
    console.log('=== CHECKOUT RENDER ===', new Date().toISOString());
    console.log('Step:', step);
    console.log('Cart items:', cartItems);
    console.log('Total amount:', totalAmount);
    console.log('Client secret:', clientSecret);
    console.log('Payment intent ID:', paymentIntentId);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Auth token:', !!authToken);
    console.log('Booking IDs:', bookingIds);
    console.log('Booking Details:', bookingDetails);
  }, [step, cartItems, totalAmount, clientSecret, paymentIntentId, isAuthenticated, authToken, bookingIds, bookingDetails]);

  // Fetch session token
  useEffect(() => {
    const fetchSession = async () => {
      console.log('=== FETCH SESSION ===', new Date().toISOString());
      if (isAuthenticated) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          console.error('Session fetch error:', error?.message);
          setShowAuthModal(true);
          setAuthMode('login');
          setAuthToken(null);
        } else {
          console.log('Session fetched, access_token:', !!session.access_token);
          setAuthToken(session.access_token);
        }
      } else {
        console.log('User not authenticated, showing auth modal');
        setShowAuthModal(true);
        setAuthMode('signup');
      }
    };
    fetchSession();
  }, [isAuthenticated]);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0) {
      console.log('Cart is empty, redirecting to /cart');
      navigate('/cart');
    }
  }, [cartItems.length, navigate]);

  // Scroll to top on mount
  useEffect(() => {
    console.log('Scrolling to top on mount');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch booking details when bookingIds are set
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (bookingIds.length === 0) return;
      console.log('=== FETCH BOOKING DETAILS ===', new Date().toISOString());
      console.log('Fetching details for booking IDs:', bookingIds);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            service_type,
            amount,
            paid_amount,
            platform_fee,
            final_payment,
            event_id,
            vendor_id,
            package_id,
            venue_id,
            events!inner(start_time, end_time, location),
            vendors!inner(name),
            service_packages!inner(name),
            venues!inner(name)
          `)
          .in('id', bookingIds);
        if (error) {
          console.error('Error fetching booking details:', error);
          setError(`Failed to load booking details: ${error.message}`);
          return;
        }
        console.log('Booking details fetched:', data);
        setBookingDetails(data || []);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details. Please try again.');
      }
    };
    fetchBookingDetails();
  }, [bookingIds]);

  const handlePaymentSuccess = async (bookingIds: string[], retries = 3, interval = 5000) => {
    console.log('=== HANDLE PAYMENT SUCCESS ===', new Date().toISOString());
    console.log('Booking IDs:', bookingIds);
    console.log('Retry attempt:', 4 - retries);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('id, final_payment')
          .in('id', bookingIds);
        
        if (error) {
          console.error('Error fetching bookings:', error);
          throw new Error(`Failed to load booking details: ${error.message}`);
        }

        if (bookings.length === 0 && attempt < retries) {
          console.log(`No bookings found on attempt ${attempt}, retrying in ${interval}ms`);
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }

        console.log('Fetched bookings:', bookings);
        const totalRemainingBalance = bookings.reduce((sum, booking) => sum + (booking.final_payment || 0), 0);
        console.log('Total remaining balance:', totalRemainingBalance);
        setBookingIds(bookingIds);
        setRemainingBalance(totalRemainingBalance);
        setStep(2);
        clearCart();
        return;
      } catch (err) {
        console.error('Error on success attempt', attempt, ':', err);
        if (attempt === retries) {
          setError(err instanceof Error ? err.message : 'Failed to confirm booking');
        } else {
          console.log(`Retrying handlePaymentSuccess in ${interval}ms`);
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }
    }
  };

  const handleAuthSuccess = () => {
    console.log('=== HANDLE AUTH SUCCESS ===', new Date().toISOString());
    setShowAuthModal(false);
    // Refresh session after auth success
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        console.error('Session fetch error post-auth:', error?.message);
        setShowAuthModal(true);
        setAuthMode('login');
      } else {
        console.log('Session refreshed, access_token:', !!session.access_token);
        setAuthToken(session.access_token);
      }
    });
  };

  const handleDiscountApplied = (discount: number, coupon: any) => {
    console.log('Discount applied:', discount, 'Coupon:', coupon);
    setAppliedDiscount(discount);
    setAppliedCoupon(coupon);
  };

  const handleDiscountRemoved = () => {
    console.log('Discount removed');
    setAppliedDiscount(0);
    setAppliedCoupon(null);
  };

  const handleReferralApplied = (discount: number, referral: any) => {
    console.log('Referral applied:', discount, 'Referral:', referral);
    setReferralDiscount(discount);
    setAppliedReferral(referral);
  };

  const handleReferralRemoved = () => {
    console.log('Referral removed');
    setReferralDiscount(0);
    setAppliedReferral(null);
  };

  const handleCreateAccount = () => {
    console.log('Opening create account modal');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* Confetti Animation */}
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
          .animate-confetti {
            animation: confetti linear forwards;
          }
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
                {step === 1 ? 'Complete Your Booking' : 'Your Big Day is Booked! 🎉'}
              </h1>
              <p className="text-gray-600 mt-1">
                {step === 1
                  ? 'Enter your details, sign contracts, and pay your deposit'
                  : 'Congratulations! Your booking is confirmed, and we’re thrilled to be part of your special day!'}
              </p>
            </div>
          </div>
        </div>

        {error && (
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
              <Elements stripe={stripePromise} options={stripeOptions} key={clientSecret || 'no-client-secret'}>
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
                        onClick={handleCreateAccount}
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
          <Card className="p-8 text-center bg-gradient-to-b from-white to-rose-50 shadow-lg">
            <PartyPopper className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Congratulations! Your Booking is Confirmed!</h2>
            <p className="text-gray-600 mb-6 text-lg">
              Woohoo! You’re one step closer to your dream event! We’ve sent a confirmation email to your inbox with all the details. Get ready for an unforgettable day!
            </p>
            <div className="text-left max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 text-xl mb-3">Booking Details</h3>
                {bookingDetails.length === 0 ? (
                  <p className="text-gray-600">Loading booking details...</p>
                ) : (
                  <div className="space-y-4">
                    {bookingDetails.map((booking, index) => (
                      <div key={booking.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800">Booking #{index + 1}</h4>
                        <ul className="text-gray-600 space-y-2 mt-2">
                          <li>
                            <span className="font-medium">Service:</span> {booking.service_packages?.name || booking.service_type}
                          </li>
                          <li>
                            <span className="font-medium">Vendor:</span> {booking.vendors?.name || 'N/A'}
                          </li>
                          <li>
                            <span className="font-medium">Date:</span> {new Date(booking.events?.start_time).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                          </li>
                          <li>
                            <span className="font-medium">Time:</span> {formatTime(new Date(booking.events?.start_time).toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }).slice(0, 5))} - {formatTime(new Date(booking.events?.end_time).toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }).slice(0, 5))} EDT
                          </li>
                          <li>
                            <span className="font-medium">Venue:</span> {booking.venues?.name || booking.events?.location || 'N/A'}
                          </li>
                          <li>
                            <span className="font-medium">Total Amount:</span> {formatPrice(booking.amount)}
                          </li>
                          <li>
                            <span className="font-medium">Deposit Paid:</span> {formatPrice(booking.paid_amount)}
                          </li>
                          <li>
                            <span className="font-medium">Platform Fee:</span> {formatPrice(booking.platform_fee)}
                          </li>
                          <li>
                            <span className="font-medium">Remaining Balance:</span> {formatPrice(booking.final_payment)}
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-xl mb-3">What’s Next?</h3>
                <p className="text-gray-600">
                  Your vendor will reach out soon to finalize details. You can manage your bookings, message vendors, or update your profile in your dashboard. Check your email for updates or contact us at{' '}
                  <a href="mailto:hello@bremembered.io" className="text-rose-600 hover:text-rose-700">hello@bremembered.io</a> if you have any questions!
                </p>
              </div>
            </div>
            <div className="mt-8 flex justify-center space-x-4">
              <Button
                variant="primary"
                onClick={() => navigate('/my-bookings')}
                className="bg-rose-500 hover:bg-rose-600"
              >
                View My Bookings
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="border-rose-500 text-rose-500 hover:bg-rose-50"
              >
                Go to Profile
              </Button>
            </div>
          </Card>
        )}
      
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} onAuthSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
};

export default Checkout;