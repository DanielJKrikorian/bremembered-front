import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, AlertCircle, Shield, Phone } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CheckoutForm } from '../components/payment/CheckoutForm';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { BookingConfirmation } from '../components/checkout/BookingConfirmation';
import { AuthModal } from '../components/auth/AuthModal';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';

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
              <CheckoutForm
                cartItems={cartItems}
                totalAmount={totalAmount}
                discountAmount={appliedDiscount}
                referralDiscount={referralDiscount}
                onSuccess={handlePaymentSuccess}
                onReferralApplied={handleReferralApplied}
                onReferralRemoved={handleReferralRemoved}
              />
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
          <Elements stripe={stripePromise}>
            <BookingConfirmation
              cartItems={cartItems}
              totalAmount={totalAmount}
              depositAmount={Math.round((totalAmount - appliedDiscount - referralDiscount) * 0.5) + cartItems.length * 150 * 100}
              onCreateAccount={handleCreateAccount}
            />
          </Elements>
        )}
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} />
    </div>
  );
};