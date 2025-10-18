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

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const formatPrice = (amount: number): string => {
  return `$${(amount / 100).toFixed(2)}`;
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  });
};

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
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any[]>([]);
  const [isFetchingFees, setIsFetchingFees] = useState(false);
  const [correctedCartItems, setCorrectedCartItems] = useState<any[]>([]);
  const [savedCartItems, setSavedCartItems] = useState<any[]>([]);
  const analyticsTracked = useRef(false);

  const rawCartItems = useMemo(() => {
    const items = location.state?.cartItems || cartState.items;
    console.log('Raw cartItems:', JSON.stringify(items, null, 2));
    return items.map((item) => {
      return {
        ...item,
        package: {
          ...item.package,
          price: Number(item.package?.price) || 0,
          premium_amount: Number(item.package?.premium_amount) || 0,
          travel_fee: Number(item.package?.travel_fee) || 0, // Default to 0
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
      };
    });
  }, [location.state, cartState.items]);

  // Fetch premium_amount and travel_fee from database
  useEffect(() => {
    const fetchFees = async () => {
      if (!rawCartItems.length || isFetchingFees) return;
      setIsFetchingFees(true);
      console.log('=== FETCH FEES ===', new Date().toISOString());
      try {
        const correctedItems = await Promise.all(
          rawCartItems.map(async (item) => {
            // Validate required fields
            if (!item.vendor?.id || !item.venue?.id) {
              console.warn(`Skipping fee fetch for item ${item.id}: missing vendor or venue`);
              return item;
            }

            // Fetch premium_amount from vendor_premiums
            const { data: premiumData, error: premiumError } = await supabase
              .from('vendor_premiums')
              .select('amount')
              .eq('vendor_id', item.vendor.id)
              .single();
            let premiumAmount = item.package.premium_amount || 0; // Use existing or 0
            if (premiumError) {
              console.error(`Error fetching premium for vendor ${item.vendor.id}:`, premiumError);
            } else if (premiumData?.amount) {
              premiumAmount = premiumData.amount;
              console.log(`Fetched premium_amount for vendor ${item.vendor.id}: ${premiumAmount}`);
            }

            // Fetch service_area_id from venues
            const { data: venueData, error: venueError } = await supabase
              .from('venues')
              .select('service_area_id')
              .eq('id', item.venue?.id)
              .single();
            let travelFee = 0; // Default to $0.00 if no travel fee defined
            if (venueError || !venueData) {
              console.error(`Error fetching service_area_id for venue ${item.venue?.id}:`, venueError);
            } else {
              // Fetch travel_fee from vendor_service_areas
              const serviceAreaId = venueData?.service_area_id;
              if (serviceAreaId) {
                const { data: travelData, error: travelError } = await supabase
                  .from('vendor_service_areas')
                  .select('travel_fee')
                  .eq('vendor_id', item.vendor.id)
                  .eq('service_area_id', serviceAreaId)
                  .single();
                if (travelError) {
                  console.error(`Error fetching travel_fee for vendor ${item.vendor.id}, service_area ${serviceAreaId}:`, travelError);
                } else if (travelData?.travel_fee != null) {
                  travelFee = travelData.travel_fee;
                  console.log(`Fetched travel_fee for vendor ${item.vendor.id}, service_area ${serviceAreaId}: ${travelFee}`);
                } else {
                  console.log(`No travel_fee defined for vendor ${item.vendor.id}, service_area ${serviceAreaId}, using $0.00`);
                }
              }
            }

            const correctedItem = {
              ...item,
              package: {
                ...item.package,
                premium_amount: premiumAmount,
                travel_fee: travelFee,
              },
            };
            console.log(`Corrected item ${item.id}:`, {
              price: correctedItem.package.price,
              premium_amount: correctedItem.package.premium_amount,
              travel_fee: correctedItem.package.travel_fee,
            });
            return correctedItem;
          }),
        );
        setCorrectedCartItems(correctedItems);
        setSavedCartItems(correctedItems); // Save for booking details page
        console.log('Corrected cartItems:', JSON.stringify(correctedItems, null, 2));
        setError(null); // Clear any previous errors after successful fetch
      } catch (err) {
        console.error('Error fetching fees:', err);
        setError('Failed to load pricing details. Please refresh and try again.');
      } finally {
        setIsFetchingFees(false);
      }
    };
    fetchFees();
  }, [rawCartItems]);

  const cartItems = useMemo(() => {
    if (step === 2 && savedCartItems.length > 0) {
      console.log('Using savedCartItems for step 2');
      return savedCartItems;
    }
    return correctedCartItems.length > 0 ? correctedCartItems : rawCartItems;
  }, [correctedCartItems, rawCartItems, step, savedCartItems]);

  const totalAmount = useMemo(() => {
    if (step === 2) {
      console.log('Returning totalAmount for step 2:', location.state?.totalAmount || 0);
      return location.state?.totalAmount || 0; // Use passed totalAmount for confirmation page
    }
    if (isFetchingFees || correctedCartItems.length === 0) {
      console.log('Skipping totalAmount calculation while fetching fees or no corrected items');
      return 0; // Prevent validation until fees are fetched
    }
    const calculatedTotal = cartItems.reduce(
      (sum, item) => {
        const packagePrice = item.package.price || 0;
        const premium = item.package.premium_amount || 0;
        const travel = item.package.travel_fee || 0;
        return sum + packagePrice + premium + travel;
      },
      0,
    );
    console.log('Calculated totalAmount:', calculatedTotal, 'Cart items:', cartItems.map((item) => ({
      id: item.id,
      price: item.package.price,
      premium_amount: item.package.premium_amount,
      travel_fee: item.package.travel_fee,
      discount: item.discount,
    })));

    // Validate cart items
    const invalidItems = cartItems.filter((item) => !item.vendor?.id || !item.venue?.id || !item.package?.price);
    if (invalidItems.length > 0) {
      console.error('Invalid cart items:', invalidItems.map((item) => ({
        id: item.id,
        vendor: item.vendor?.id,
        venue: item.venue?.id,
        price: item.package?.price,
      })));
      setError('Invalid cart items. Please return to cart and verify your selections.');
      return calculatedTotal;
    }

    // Use passed totalAmount if available and valid
    const passedTotal = location.state?.totalAmount;
    if (passedTotal && passedTotal > 0) {
      console.log('Using passed totalAmount:', passedTotal);
      if (passedTotal !== calculatedTotal) {
        console.warn('Total amount mismatch between passed and calculated:', {
          passed: passedTotal,
          calculated: calculatedTotal,
        });
      }
      setError(null);
      return passedTotal;
    }

    setError(null);
    return calculatedTotal;
  }, [cartItems, step, isFetchingFees, correctedCartItems, location.state]);

  useEffect(() => {
    if (!isFetchingFees && error) {
      console.log('Clearing error state after fees fetched');
      setError(null);
    }
  }, [isFetchingFees, error]);

  useEffect(() => {
    if (!loading && !analyticsTracked.current) {
      console.log('Tracking analytics for checkout:', new Date().toISOString());
      trackPageView('checkout', 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [loading, user?.id]);

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

  useEffect(() => {
    if (step === 1 && cartItems.length === 0 && !isFetchingFees) {
      console.log('Cart is empty, redirecting to /cart');
      navigate('/cart');
    }
  }, [cartItems, navigate, step, isFetchingFees, appliedDiscount, referralDiscount]);

  useEffect(() => {
    console.log('Scrolling to top on mount');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
        setError(null); // Clear error before state updates
        setBookingIds(bookingIds);
        setRemainingBalance(totalRemainingBalance);
        setStep(2);
        setClientSecret(null);
        setPaymentIntentId(null);
        clearCart();
        console.log('Payment success completed, transitioned to step 2');
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
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  const handleDiscountRemoved = () => {
    console.log('Discount removed');
    setAppliedDiscount(0);
    setAppliedCoupon(null);
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  const handleReferralApplied = (discount: number, referral: any) => {
    console.log('Referral applied:', discount, 'Referral:', referral);
    setReferralDiscount(discount);
    setAppliedReferral(referral);
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  const handleReferralRemoved = () => {
    console.log('Referral removed');
    setReferralDiscount(0);
    setAppliedReferral(null);
    setClientSecret(null);
    setPaymentIntentId(null);
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
      {isFetchingFees && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
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

        {error && step === 1 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {step === 1 ? (
          isFetchingFees ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading checkout details...</p>
            </div>
          ) : (
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
                    isInitializingPayment={isFetchingFees}
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
                isInitializingPayment={isFetchingFees}
              />
            </div>
          )
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
                            <span className="font-medium">Date:</span> {new Date(booking.events?.start_time).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' })}
                          </li>
                          <li>
                            <span className="font-medium">Time:</span> {formatTime(new Date(booking.events?.start_time))} - {formatTime(new Date(booking.events?.end_time))} EDT
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