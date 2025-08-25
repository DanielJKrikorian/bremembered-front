import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, Check, ArrowLeft, Calendar, MapPin, Users, Mail, Phone, User, Shield, AlertCircle, Eye, EyeOff, FileText, Edit, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useCart } from '../context/CartContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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

interface DiscountState {
  couponCode: string;
  referralCode: string;
  couponDiscount: number;
  referralDiscount: number;
  couponError: string | null;
  referralError: string | null;
  couponLoading: boolean;
  referralLoading: boolean;
  appliedCoupon: any | null;
  appliedReferral: any | null;
}
interface ContractTemplate {
  id: string;
  service_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Contract {
  id: string;
  booking_intent_id?: string;
  content: string;
  signature?: string;
  signed_at?: string;
  status?: string;
  created_at: string;
  updated_at: string;
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
  const [discountState, setDiscountState] = useState({
    couponCode: '',
    referralCode: '',
    appliedCoupon: null as any,
    appliedReferral: null as any,
    validatingCoupon: false,
    validatingReferral: false,
    couponError: null as string | null,
    referralError: null as string | null
  });
  const [cardReady, setCardReady] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Contract, 3: Payment
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [tempSignatures, setTempSignatures] = useState<Record<string, string>>({});
  const [contractsLoading, setContractsLoading] = useState(false);
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

  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setDiscountState(prev => ({ 
        ...prev, 
        couponError: null, 
        couponDiscount: 0, 
        appliedCoupon: null 
      }));
      return;
    }

    setDiscountState(prev => ({ ...prev, couponLoading: true, couponError: null }));

    if (!supabase || !isSupabaseConfigured()) {
      // Mock coupon validation for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      if (code.toLowerCase() === 'save10') {
        const discount = Math.round(subtotal * 0.1); // 10% discount
        setDiscountState(prev => ({
          ...prev,
          couponDiscount: discount,
          couponLoading: false,
          appliedCoupon: { code: 'SAVE10', discount_percent: 10 }
        }));
      } else {
        setDiscountState(prev => ({
          ...prev,
          couponError: 'Invalid coupon code',
          couponLoading: false,
          couponDiscount: 0,
          appliedCoupon: null
        }));
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_valid', true)
        .single();

      if (error || !data) {
        setDiscountState(prev => ({
          ...prev,
          couponError: 'Invalid or expired coupon code',
          couponLoading: false,
          couponDiscount: 0,
          appliedCoupon: null
        }));
        return;
      }

      // Check expiration
      if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
        setDiscountState(prev => ({
          ...prev,
          couponError: 'This coupon has expired',
          couponLoading: false,
          couponDiscount: 0,
          appliedCoupon: null
        }));
        return;
      }

      // Calculate discount
      let discount = 0;
      if (data.discount_percent > 0) {
        discount = Math.round(subtotal * (data.discount_percent / 100));
      } else if (data.discount_amount > 0) {
        discount = data.discount_amount;
      }

      setDiscountState(prev => ({
        ...prev,
        couponDiscount: discount,
        couponLoading: false,
        appliedCoupon: data
      }));
    } catch (err) {
      console.error('Error validating coupon:', err);
      setDiscountState(prev => ({
        ...prev,
        couponError: 'Error validating coupon',
        couponLoading: false,
        couponDiscount: 0,
        appliedCoupon: null
      }));
    }
  };

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setDiscountState(prev => ({ 
        ...prev, 
        referralError: null, 
        referralDiscount: 0, 
        appliedReferral: null 
      }));
      return;
    }

    setDiscountState(prev => ({ ...prev, referralLoading: true, referralError: null }));

    if (!supabase || !isSupabaseConfigured()) {
      // Mock referral validation for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      if (code.toLowerCase().startsWith('ref')) {
        const discount = 5000; // $50 discount
        setDiscountState(prev => ({
          ...prev,
          referralDiscount: discount,
          referralLoading: false,
          appliedReferral: { code: code.toUpperCase(), vendor_name: 'Demo Vendor' }
        }));
      } else {
        setDiscountState(prev => ({
          ...prev,
          referralError: 'Invalid referral code',
          referralLoading: false,
          referralDiscount: 0,
          appliedReferral: null
        }));
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vendor_referral_codes')
        .select(`
          *,
          vendors!inner(
            id,
            name
          )
        `)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setDiscountState(prev => ({
          ...prev,
          referralError: 'Invalid referral code',
          referralLoading: false,
          referralDiscount: 0,
          appliedReferral: null
        }));
        return;
      }

      // Apply referral discount (e.g., $50 off)
      const discount = 5000; // $50 in cents
      setDiscountState(prev => ({
        ...prev,
        referralDiscount: discount,
        referralLoading: false,
        appliedReferral: { ...data, vendor_name: data.vendors.name }
      }));
    } catch (err) {
      console.error('Error validating referral code:', err);
      setDiscountState(prev => ({
        ...prev,
        referralError: 'Error validating referral code',
        referralLoading: false,
        referralDiscount: 0,
        appliedReferral: null
      }));
    }
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCoupon(discountState.couponCode);
  };

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateReferralCode(discountState.referralCode);
  };

  const removeCoupon = () => {
    setDiscountState(prev => ({
      ...prev,
      couponCode: '',
      couponDiscount: 0,
      couponError: null,
      appliedCoupon: null
    }));
  };

  const removeReferral = () => {
    setDiscountState(prev => ({
      ...prev,
      referralCode: '',
      referralDiscount: 0,
      referralError: null,
      appliedReferral: null
    }));
  };
  // Fetch contract templates when component mounts
  useEffect(() => {
    const fetchContractTemplates = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock contract templates for demo
        const mockTemplates: ContractTemplate[] = cartItems.map(item => ({
          id: `template-${item.package.service_type}`,
          service_type: item.package.service_type,
          content: `${item.package.service_type.toUpperCase()} SERVICE AGREEMENT

This agreement is between ${formData.partner1Name || '[Partner 1 Name]'}${formData.partner2Name ? ` & ${formData.partner2Name}` : ''} (Client) and the selected vendor (Service Provider) for ${item.package.service_type.toLowerCase()} services.

EVENT DETAILS:
- Date: ${formData.eventDate || '[Event Date]'}
- Location: ${formData.eventLocation || '[Event Location]'}
- Service: ${item.package.name}

SERVICES PROVIDED:
${item.package.features?.map((feature: string) => `- ${feature}`).join('\n') || `- Professional ${item.package.service_type.toLowerCase()} services`}

PAYMENT TERMS:
- Total Amount: ${formatPrice(item.package.price)}
- Deposit (50%): ${formatPrice(Math.round(item.package.price * 0.5))}
- Balance Due: ${formatPrice(Math.round(item.package.price * 0.5))}
- Service Fee: $150

TERMS AND CONDITIONS:
1. The Service Provider agrees to provide professional ${item.package.service_type.toLowerCase()} services for the specified event.
2. The Client agrees to pay the total amount as outlined in the payment schedule.
3. Cancellation policy: 30 days notice required for partial refund of deposit.
4. The Service Provider retains copyright to all work but grants usage rights to the Client.
5. Weather contingency plans will be discussed prior to the event.
6. Any changes to services must be agreed upon in writing by both parties.

By signing below, both parties agree to the terms outlined in this contract.`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setContractTemplates(mockTemplates);
        return;
      }

      setContractsLoading(true);
      try {
        const serviceTypes = [...new Set(cartItems.map(item => item.package.service_type))];
        const { data, error } = await supabase
          .from('contract_templates')
          .select('*')
          .in('service_type', serviceTypes);

        if (error) throw error;
        setContractTemplates(data || []);
      } catch (err) {
        console.error('Error fetching contract templates:', err);
        setError('Failed to load contract templates');
      } finally {
        setContractsLoading(false);
      }
    };

    if (cartItems.length > 0) {
      fetchContractTemplates();
    }
  }, [cartItems, formData.partner1Name, formData.partner2Name, formData.eventDate, formData.eventLocation]);

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
      'partner1Name', 'email', 'phone'
    ];
    
    // Add billing address requirements for payment step
    if (currentStep === 3) {
      required.push('billingAddress', 'city', 'state', 'zipCode');
    }
    
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

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateForm()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Check if all contracts are signed
      const allSigned = contractTemplates.every(template => 
        signatures[template.service_type] && signatures[template.service_type].trim() !== ''
      );
      if (!allSigned) {
        setError('Please sign all contracts before proceeding');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSignatureChange = (serviceType: string, signature: string) => {
    setTempSignatures(prev => ({ ...prev, [serviceType]: signature }));
  };

  const confirmSignature = (serviceType: string) => {
    const signature = tempSignatures[serviceType];
    if (signature && signature.trim()) {
      setSignatures(prev => ({ ...prev, [serviceType]: signature.trim() }));
      setTempSignatures(prev => ({ ...prev, [serviceType]: '' }));
      if (error) setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== 3) {
      handleNextStep();
      return;
    }

    // Final validation before payment
    if (!validateForm()) return;

    // Check contracts are signed
    const allSigned = contractTemplates.every(template => 
      signatures[template.service_type] && signatures[template.service_type].trim() !== ''
    );
    if (!allSigned) {
      setError('Please sign all contracts before completing payment');
      return;
    }

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
            amount: grandTotal, // Deposit + service fees
            currency: 'usd',
            metadata: {
              type: 'wedding_booking',
              deposit_percentage: 50,
              items: cartItems.map(item => ({
                package_id: item.package.id,
                package_name: item.package.name,
                service_type: item.package.service_type,
                price: item.package.price,
                deposit_amount: Math.round(item.package.price * 0.5)
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
        // Save contracts to database if Supabase is configured
        if (supabase && isSupabaseConfigured()) {
          try {
            const contractsToSave = contractTemplates.map(template => ({
              content: template.content,
              signature: signatures[template.service_type],
              signed_at: new Date().toISOString(),
              status: 'signed'
            }));

            const { error: contractError } = await supabase
              .from('contracts')
              .insert(contractsToSave);

            if (contractError) {
              console.error('Error saving contracts:', contractError);
            }
          } catch (contractErr) {
            console.error('Error saving contracts:', contractErr);
          }
        }

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
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Step Progress */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[
          { step: 1, label: 'Details', icon: User },
          { step: 2, label: 'Contracts', icon: FileText },
          { step: 3, label: 'Payment', icon: CreditCard }
        ].map(({ step, label, icon: Icon }) => (
          <div key={step} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
              ${currentStep >= step 
                ? 'bg-rose-500 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {currentStep > step ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= step ? 'text-rose-600' : 'text-gray-500'
            }`}>
              {label}
            </span>
            {step < 3 && (
              <div className={`w-16 h-1 mx-4 rounded-full transition-all ${
                currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information & Event Details */}
        {currentStep === 1 && (
          <Card className="p-6 mb-8">
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
            
            {/* Terms Agreement for Step 1 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
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
          </Card>
        )}

        {/* Step 2: Contract Signing */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Service Contracts</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Please review and sign the contracts for each service before proceeding to payment.
              </p>

              {contractsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading contracts...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {contractTemplates.map((template) => {
                    const isSigned = signatures[template.service_type] && signatures[template.service_type].trim() !== '';
                    
                    return (
                      <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className={`p-4 ${isSigned ? 'bg-green-50 border-b border-green-200' : 'bg-gray-50 border-b border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">
                              {template.service_type} Service Agreement
                            </h4>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                              isSigned 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isSigned ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Signed</span>
                                </>
                              ) : (
                                <>
                                  <Edit className="w-4 h-4" />
                                  <span>Signature Required</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                              {template.content}
                            </div>
                          </div>
                          
                          {!isSigned ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Digital Signature
                              </label>
                              <input
                                type="text"
                                placeholder="Type your full legal name to sign"
                               value={tempSignatures[template.service_type] || ''}
                                onChange={(e) => handleSignatureChange(template.service_type, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                required
                              />
                              <p className="text-sm text-gray-500 mt-1">
                                By typing your name, you agree to be legally bound by this contract
                              </p>
                              <div className="mt-3">
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => confirmSignature(template.service_type)}
                                  disabled={!tempSignatures[template.service_type] || !tempSignatures[template.service_type].trim()}
                                >
                                  Confirm Signature
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center space-x-2 text-green-800">
                                <Check className="w-4 h-4" />
                                <span className="font-medium">Signed by: {signatures[template.service_type]}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
           
           {/* Add spacing before navigation buttons */}
           <div className="mt-8"></div>
          </div>
        )}

        {/* Step 3: Payment Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
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
              
              {/* Deposit Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Deposit Payment</h4>
                <p className="text-blue-800 text-sm">
                  You're paying a 50% deposit today ({formatPrice(depositAmount)}). The remaining balance will be due 7 days before your event.
                </p>
              </div>
              
              <div className="space-y-6 mb-8">
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
              </div>
            </Card>

            {/* Add extra spacing before navigation buttons */}
            <div className="mt-12"></div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              icon={ArrowLeft}
            >
              Back
            </Button>
          )}
          
          <div className={currentStep === 1 ? 'ml-auto' : ''}>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || (currentStep === 3 && (!stripe || !elements || !cardReady))}
              loading={loading}
              icon={currentStep === 3 ? CreditCard : ArrowRight}
            >
              {currentStep === 1 ? 'Continue to Contracts' :
               currentStep === 2 ? 'Continue to Payment' :
               loading ? 'Processing...' : `Pay ${formatPrice(grandTotal)}`}
            </Button>
          </div>
        </div>
      </form>
    </div>
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
  const depositAmount = Math.round(totalAmount * 0.5); // 50% deposit
  const grandTotal = depositAmount + totalServiceFee * 100; // Convert to cents

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
                {step === 1 ? 'Enter your details, sign contracts, and pay your deposit' : 'Booking Confirmation'}
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
                    <span className="text-gray-600">Package Total</span>
                    <span className="font-medium">{formatPrice(totalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit (50%)</span>
                    <span className="font-medium">{formatPrice(depositAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fees ({cartItems.length} × $150)</span>
                    <span className="font-medium">${totalServiceFee}</span>
                  </div>
                  
                  {/* Discount Section */}
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    {/* Coupon Code */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Discount Code</label>
                        {discountState.appliedCoupon && (
                          <button
                            type="button"
                            onClick={removeCoupon}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {discountState.appliedCoupon ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-900">
                              {discountState.appliedCoupon.code} Applied
                            </span>
                            <span className="text-sm font-medium text-green-900">
                              -{formatPrice(discountState.couponDiscount)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleCouponSubmit} className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Enter discount code"
                            value={discountState.couponCode}
                            onChange={(e) => setDiscountState(prev => ({ ...prev, couponCode: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            loading={discountState.couponLoading}
                            disabled={!discountState.couponCode.trim() || discountState.couponLoading}
                          >
                            Apply
                          </Button>
                        </form>
                      )}
                      {discountState.couponError && (
                        <p className="text-xs text-red-600 mt-1">{discountState.couponError}</p>
                      )}
                    </div>

                    {/* Referral Code */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Referral Code</label>
                        {discountState.appliedReferral && (
                          <button
                            type="button"
                            onClick={removeReferral}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {discountState.appliedReferral ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                              Referred by {discountState.appliedReferral.vendor_name}
                            </span>
                            <span className="text-sm font-medium text-blue-900">
                              -{formatPrice(discountState.referralDiscount)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleReferralSubmit} className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Enter referral code"
                            value={discountState.referralCode}
                            onChange={(e) => setDiscountState(prev => ({ ...prev, referralCode: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            loading={discountState.referralLoading}
                            disabled={!discountState.referralCode.trim() || discountState.referralLoading}
                          >
                            Apply
                          </Button>
                        </form>
                      )}
                      {discountState.referralError && (
                        <p className="text-xs text-red-600 mt-1">{discountState.referralError}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Remaining Balance</span>
                    <span>{formatPrice(totalAmount - depositAmount)} (due later)</span>
                  </div>
                  
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total Savings</span>
                      <span>-{formatPrice(totalDiscount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-semibold border-t pt-3">
                    <span>Total Due Today</span>
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
                  <span className="text-gray-600">Deposit Paid:</span>
                  <span className="font-medium">{formatPrice(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="font-medium">{formatPrice(totalAmount - depositAmount)}</span>
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
                <li>• The remaining balance will be due 7 days before your event</li>
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