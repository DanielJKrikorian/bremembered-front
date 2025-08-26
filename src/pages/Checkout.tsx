import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ArrowLeft, Check, AlertCircle, Shield, Phone } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useCart } from '../../context/CartContext';
import { AuthModal } from '../auth/AuthModal';
import { CheckoutForm } from './CheckoutForm';

// Initialize Stripe
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey && publishableKey !== 'your_stripe_publishable_key_here'
  ? loadStripe(publishableKey)
  : null;

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price / 100);
};

const getServiceIcon = (serviceType: string) => {
  switch (serviceType) {
    case 'Photography':
      return '📸';
    case 'Videography':
      return '🎥';
    case 'DJ Services':
      return '🎵';
    case 'Live Musician':
      return '🎼';
    case 'Coordination':
      return '👰';
    case 'Planning':
      return '📅';
    default:
      return '💍';
  }
};

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
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

  const totalServiceFee = cartItems.length * 150;
  const finalAmount = totalAmount - discountAmount - referralDiscount;
  const depositAmount = Math.round(finalAmount * 0.5);
  const grandTotal = depositAmount + totalServiceFee * 100;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Items to Checkout</h2>
          <p className="text-gray-600 mb-6">Your cart is empty. Please add some services to continue.</p>
          <Button variant="primary" onClick={() => navigate('/search')}>
            Browse Services
          </Button>
        </Card>
      </div>
    );
  }

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
            <div>
              <Card className="p-6 sticky top-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {getServiceIcon(item.package.service_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 line-clamp-2">{item.package.name}</h4>
                        <p className="text-sm text-gray-600">{item.package.service_type}</p>
                        {item.vendor && (
                          <p className="text-xs text-green-600">Vendor: {item.vendor.name}</p>
                        )}
                        {item.eventDate && (
                          <p className="text-xs text-gray-500">
                            {new Date(item.eventDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{formatPrice(item.package.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package Total</span>
                    <span className="font-medium">{formatPrice(totalAmount)}</span>
                  </div>
                  {(discountAmount > 0 || referralDiscount > 0) && (
                    <div className="flex justify-between text-green-600">
                      <span>Total Discounts</span>
                      <span>-{formatPrice(discountAmount + referralDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(finalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit (50%)</span>
                    <span className="font-medium">{formatPrice(depositAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fees ({cartItems.length} × $150)</span>
                    <span className="font-medium">${totalServiceFee}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Remaining Balance</span>
                    <span>{formatPrice(finalAmount - depositAmount)} (due later)</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-3">
                    <span>Total Due Today</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Secure checkout with Stripe</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Direct messaging with your vendor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">24/7 customer support</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Booking Confirmed!</h2>
            <p className="text-xl text-gray-600 mb-6">
              Thank you for choosing B. Remembered! Your wedding booking has been successfully confirmed.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-medium">#BR-{Date.now().toString().slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Services:</span>
                  <span className="font-medium">{cartItems.length} service{cartItems.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit Paid:</span>
                  <span className="font-medium">{formatPrice(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="font-medium">{formatPrice(finalAmount - depositAmount)}</span>
                </div>
                {(discountAmount > 0 || referralDiscount > 0) && (
                  <div className="flex justify-between text-green-600">
                    <span>Total Savings:</span>
                    <span className="font-medium">{formatPrice(discountAmount + referralDiscount)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <Button variant="primary" className="w-full" onClick={() => navigate('/my-bookings')}>
                View My Bookings
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll receive a confirmation email within 5 minutes</li>
                <li>• Your vendors will contact you within 24 hours</li>
                <li>• The remaining balance will be due 7 days before your event</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} />
    </div>
  );
};