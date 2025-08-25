import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, Check, ArrowLeft, Calendar, MapPin, Users, Mail, Phone, User, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCouple } from '../hooks/useCouple';
import { AuthModal } from '../components/auth/AuthModal';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price / 100);
};

interface CheckoutFormData {
  // Personal Information
  partner1Name: string;
  partner2Name: string;
  email: string;
  phone: string;
  // Billing Address
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  // Event Details
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestCount: string;
  specialRequests: string;
  // Payment
  savePaymentMethod: boolean;
  agreedToTerms: boolean;
}

const CheckoutForm: React.FC<{
  cartItems: any[];
  totalAmount: number;
  onSuccess: () => void;
}> = ({ cartItems, totalAmount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user, isAuthenticated } = useAuth();
  const { couple } = useCouple();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  
  // Calculate totals within component scope
  const totalServiceFee = cartItems.length * 150; // $150 per service
  const grandTotal = totalAmount + totalServiceFee * 100; // Convert to cents
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    partner1Name: '',
    partner2Name: '',
    email: '',
    phone: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    guestCount: '',
    specialRequests: '',
    savePaymentMethod: false,
    agreedToTerms: false
  });

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      
      setFormData(prev => ({
        ...prev,
        partner1Name: couple?.partner1_name || user.user_metadata?.name || '',
        partner2Name: couple?.partner2_name || '',
        email: user.email || couple?.email || '',
        phone: couple?.phone || '',
        eventDate: couple?.wedding_date || '',
        eventLocation: couple?.venue_name || '',
        guestCount: couple?.guest_count?.toString() || ''
      }));
    }
  }, [isAuthenticated, user, couple]);

  // Pre-fill from cart items if they have event details
  useEffect(() => {
    if (cartItems.length > 0) {
      const firstItemWithDetails = cartItems.find(item => item.eventDate || item.venue);
      if (firstItemWithDetails) {
        setFormData(prev => ({
          ...prev,
          eventDate: firstItemWithDetails.eventDate || prev.eventDate,
          eventTime: firstItemWithDetails.eventTime || prev.eventTime,
          eventLocation: firstItemWithDetails.venue?.name || prev.eventLocation
        }));
      }
    }
  }, [cartItems]);

  useEffect(() => {
    if (stripe && elements) {
      const cardElement = elements.getElement(CardElement);
      if (cardElement) {
        cardElement.on('ready', () => setCardReady(true));
        cardElement.on('change', (event) => {
          setError(event.error ? event.error.message : null);
        });
      }
    }
  }, [stripe, elements]);

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    const required = [
      'partner1Name', 'email', 'phone',
      'billingAddress', 'city', 'state', 'zipCode',
      'eventDate', 'eventTime', 'eventLocation'
    ];
    
    for (const field of required) {
      if (!formData[field as keyof CheckoutFormData]) {
        const fieldName = field === 'partner1Name' ? 'partner 1 name' : 
                         field === 'partner2Name' ? 'partner 2 name' :
                         field.replace(/([A-Z])/g, ' $1').toLowerCase();
        setError(`Please fill in ${fieldName}`);
        return false;
      }
    }

    if (!formData.agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!stripe || !elements) {
      setError('Payment system not ready');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card information not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: totalAmount + 15000, // Add service fee
            currency: 'usd',
            metadata: {
              type: 'wedding_booking',
              items: cartItems.map(item => ({
                package_id: item.package.id,
                package_name: item.package.name,
                service_type: item.package.service_type,
                price: item.package.price
              }))
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const { client_secret } = data;

      // Confirm payment
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.partner2Name 
              ? `${formData.partner1Name} & ${formData.partner2Name}`
              : formData.partner1Name,
            email: formData.email,
            phone: formData.phone,
            address: {
              line1: formData.billingAddress,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zipCode,
              country: 'US'
            }
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT', 'NY', 'NJ', 'PA', 'CA', 'FL', 'TX'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Partner 1 Name"
            value={formData.partner1Name}
            onChange={(e) => handleInputChange('partner1Name', e.target.value)}
            placeholder="Your name"
            icon={User}
            required
          />
          <Input
            label="Partner 2 Name (Optional)"
            value={formData.partner2Name}
            onChange={(e) => handleInputChange('partner2Name', e.target.value)}
            placeholder="Partner's name"
            icon={User}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="john.smith@example.com"
            icon={Mail}
            helperText="We'll send booking confirmations here"
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            icon={Phone}
            helperText="For urgent updates about your booking"
            required
          />
        </div>
      </Card>

      {/* Event Details */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Event Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Event Date"
            type="date"
            value={formData.eventDate}
            onChange={(e) => handleInputChange('eventDate', e.target.value)}
            icon={Calendar}
            required
          />
          <Input
            label="Event Time"
            type="time"
            value={formData.eventTime}
            onChange={(e) => handleInputChange('eventTime', e.target.value)}
            required
          />
          <div className="md:col-span-2">
            <Input
              label="Event Location"
              placeholder="Venue name and address"
              value={formData.eventLocation}
              onChange={(e) => handleInputChange('eventLocation', e.target.value)}
              icon={MapPin}
              required
            />
          </div>
          <Input
            label="Expected Guest Count"
            type="number"
            placeholder="Number of guests"
            value={formData.guestCount}
            onChange={(e) => handleInputChange('guestCount', e.target.value)}
            icon={Users}
            required
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests or Notes
            </label>
            <textarea
              placeholder="Any special requirements, themes, or important details..."
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Billing Address */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Billing Address</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Street Address"
            placeholder="123 Main Street"
            value={formData.billingAddress}
            onChange={(e) => handleInputChange('billingAddress', e.target.value)}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              placeholder="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <Input
              label="ZIP Code"
              placeholder="12345"
              value={formData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              required
            />
          </div>
        </div>
      </Card>

      {/* Payment Information */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Payment Information</h3>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <Lock className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Secure Payment</p>
              <p className="text-xs text-green-700">Your payment information is encrypted and secure</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="p-4 border border-gray-300 rounded-lg bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#1f2937',
                      '::placeholder': {
                        color: '#6b7280',
                      },
                    },
                    invalid: {
                      color: '#dc2626',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="save-payment"
                checked={formData.savePaymentMethod}
                onChange={(e) => handleInputChange('savePaymentMethod', e.target.checked)}
                className="text-rose-500 focus:ring-rose-500 rounded"
              />
              <label htmlFor="save-payment" className="text-sm text-gray-700">
                Save payment method for future bookings
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="flex items-start space-x-3">
              <input 
                type="checkbox" 
                checked={formData.agreedToTerms}
                onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                className="mt-1 text-rose-500 focus:ring-rose-500" 
                required 
              />
              <span className="text-sm text-gray-600">
                I agree to the <a href="#" className="text-rose-600 hover:text-rose-700">Terms of Service</a> and <a href="#" className="text-rose-600 hover:text-rose-700">Privacy Policy</a>. I understand that this booking is subject to the vendor's cancellation policy.
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="text-center">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full max-w-md"
          loading={loading}
          disabled={!stripe || !elements || !cardReady || loading}
          icon={CreditCard}
        >
          {loading ? 'Processing Payment...' : `Complete Booking - ${formatPrice(totalAmount + 15000)}`}
        </Button>
        <p className="text-sm text-gray-500 mt-3">
          You will be charged {formatPrice(grandTotal)} today
        </p>
      </div>
    </form>
  );
};

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  // Get cart data from either location state or cart context
  const cartItems = location.state?.cartItems || cartState.items;
  const totalAmount = location.state?.totalAmount || cartState.totalAmount;

  // Redirect if no items
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems.length, navigate]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return '📸';
      case 'Videography': return '🎥';
      case 'DJ Services': return '🎵';
      case 'Live Musician': return '🎼';
      case 'Coordination': return '👰';
      case 'Planning': return '📅';
      default: return '💍';
    }
  };

  const handlePaymentSuccess = () => {
    setStep(2); // Show confirmation
    clearCart(); // Clear cart after successful payment
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Continue with checkout process
  };

  const handleProceedWithoutAuth = () => {
    // Force authentication before final payment
    setShowAuthModal(true);
    setAuthMode('signup');
  };

  const totalServiceFee = cartItems.length * 150; // $150 per service
  const grandTotal = totalAmount + totalServiceFee * 100; // Convert to cents

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Items to Checkout</h2>
            disabled={!stripe || !elements || !cardReady || loading || !formData.partner1Name}
          <Button variant="primary" onClick={() => navigate('/search')}>
            {loading ? 'Processing Payment...' : `Complete Booking - ${formatPrice(grandTotal)}`}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => navigate('/cart')}
            >
              Back to Cart
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
              <p className="text-gray-600 mt-1">
                {step === 1 ? 'Enter your details and payment information' : 'Booking Confirmation'}
              </p>
            </div>
          </div>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
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

              <Elements stripe={stripePromise}>
                <CheckoutForm
                  cartItems={cartItems}
                  totalAmount={totalAmount}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </div>

            {/* Order Summary */}
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
                        <h4 className="font-medium text-gray-900 line-clamp-2">
                          {item.package.name}
                        </h4>
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
                        <div className="font-medium text-gray-900">
                          {formatPrice(item.package.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(totalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fees ({cartItems.length} × $150)</span>
                    <span className="font-medium">${totalServiceFee}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-semibold border-t pt-3">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Trust Indicators */}
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
          /* Confirmation Step */
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
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-medium">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => navigate('/my-bookings')}
              >
                View My Bookings
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Continue Shopping
              </Button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll receive a confirmation email within 5 minutes</li>
                <li>• Your vendors will contact you within 24 hours</li>
                <li>• {!isAuthenticated ? 'Create an account to message vendors and track progress' : 'Use your dashboard to track progress and message vendors'}</li>
              </ul>
            </div>

            {!isAuthenticated && (
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="w-full"
                >
                  Create Account to Message Vendors
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
};