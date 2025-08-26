import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, Check, ArrowLeft, User, AlertCircle, FileText, Edit, ArrowRight, DollarSign } from 'lucide-react';
import { useStripe, useElements, CardElement, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';

interface CheckoutFormData {
  partner1Name: string;
  partner2Name: string;
  email: string;
  phone: string;
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestCount: string;
  specialRequests: string;
  savePaymentMethod: boolean;
  agreedToTerms: boolean;
}

interface ContractTemplate {
  id: string;
  service_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CheckoutFormProps {
  cartItems: any[];
  totalAmount: number;
  discountAmount: number;
  referralDiscount: number;
  clientSecret: string | null;
  paymentIntentId: string | null;
  onSuccess: () => void;
  onReferralApplied: (discount: number, referral: any) => void;
  onReferralRemoved: () => void;
  onInitializePayment: (customerInfo: any, referralCode: string) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  cartItems,
  totalAmount,
  discountAmount,
  referralDiscount,
  clientSecret,
  paymentIntentId,
  onSuccess,
  onReferralApplied,
  onReferralRemoved,
  onInitializePayment,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user, isAuthenticated } = useAuth();
  const { couple } = useCouple();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [tempSignatures, setTempSignatures] = useState<Record<string, string>>({});
  const [contractsLoading, setContractsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'affirm'>('card');

  // Debug Stripe initialization
  useEffect(() => {
    console.log('=== STRIPE INITIALIZATION DEBUG ===');
    console.log('Stripe instance:', !!stripe);
    console.log('Elements instance:', !!elements);
    console.log('Current step:', currentStep);
    console.log('Client secret:', !!clientSecret);
  }, [stripe, elements, currentStep, clientSecret]);

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
    agreedToTerms: false,
  });

  // Initialize payment intent when we reach step 3
  useEffect(() => {
    if (currentStep === 3 && !clientSecret) {
      onInitializePayment(formData, referralCode);
    }
  }, [currentStep, clientSecret, onInitializePayment, formData, referralCode]);

  const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT', 'NY', 'NJ', 'PA', 'CA', 'FL', 'TX'];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price / 100);
  };

  // Calculate totals
  const subtotal = totalAmount;
  const totalDiscount = discountAmount + referralDiscount;
  const discountedTotal = Math.max(0, subtotal - totalDiscount);
  const depositAmount = Math.round(discountedTotal * 0.5);
  const totalServiceFee = cartItems.length * 150;
  const grandTotal = depositAmount + totalServiceFee * 100;

  // Fetch contract templates
  useEffect(() => {
    const fetchContractTemplates = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        const mockTemplates: ContractTemplate[] = cartItems.map((item) => ({
          id: `template-${item.package.service_type}`,
          service_type: item.package.service_type,
          content: `${item.package.service_type.toUpperCase()} SERVICE AGREEMENT

This agreement is between ${formData.partner1Name || '[Partner 1 Name]'}${
            formData.partner2Name ? ` & ${formData.partner2Name}` : ''
          } (Client) and the selected vendor (Service Provider) for ${item.package.service_type.toLowerCase()} services.

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
          updated_at: new Date().toISOString(),
        }));
        setContractTemplates(mockTemplates);
        return;
      }

      setContractsLoading(true);
      try {
        const serviceTypes = [...new Set(cartItems.map((item) => item.package.service_type))];
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

  // Pre-fill form with user data
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        partner1Name: couple?.partner1_name || user.user_metadata?.name || '',
        partner2Name: couple?.partner2_name || '',
        email: user.email || couple?.email || '',
        phone: couple?.phone || '',
        eventDate: couple?.wedding_date || '',
        eventLocation: couple?.venue_name || '',
        guestCount: couple?.guest_count?.toString() || '',
      }));
    }
  }, [isAuthenticated, user, couple]);

  // Pre-fill from cart items
  useEffect(() => {
    if (cartItems.length > 0) {
      const firstItemWithDetails = cartItems.find((item) => item.eventDate || item.venue);
      if (firstItemWithDetails) {
        setFormData((prev) => ({
          ...prev,
          eventDate: firstItemWithDetails.eventDate || prev.eventDate,
          eventTime: firstItemWithDetails.eventTime || prev.eventTime,
          eventLocation: firstItemWithDetails.venue?.name || prev.eventLocation,
        }));
      }
    }
  }, [cartItems]);

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralError(null);
      setAppliedReferral(null);
      onReferralRemoved();
      return;
    }

    setReferralLoading(true);
    setReferralError(null);

    if (!supabase || !isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (code.toLowerCase().startsWith('ref') || code.toLowerCase().includes('dani')) {
        const referral = {
          code: code.toUpperCase(),
          vendor_name: 'Demo Vendor',
          discount: 5000,
        };
        setAppliedReferral(referral);
        onReferralApplied(5000, referral);
      } else {
        setReferralError('Invalid referral code');
      }
      setReferralLoading(false);
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
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        setReferralError('Invalid referral code');
        setAppliedReferral(null);
        onReferralRemoved();
      } else {
        const referral = {
          ...data,
          vendor_name: data.vendors.name,
          discount: 5000,
        };
        setAppliedReferral(referral);
        onReferralApplied(5000, referral);
        setReferralError(null);
      }
    } catch (err) {
      console.error('Error validating referral code:', err);
      setReferralError('Error validating referral code');
      setAppliedReferral(null);
      onReferralRemoved();
    } finally {
      setReferralLoading(false);
    }
  };

  const handleReferralSubmit = () => {
    validateReferralCode(referralCode);
  };

  const removeReferral = () => {
    setReferralCode('');
    setAppliedReferral(null);
    setReferralError(null);
    onReferralRemoved();
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    const required = ['partner1Name', 'email', 'phone'];
    if (currentStep === 3) {
      required.push('billingAddress', 'city', 'state', 'zipCode');
    }

    for (const field of required) {
      if (!formData[field as keyof CheckoutFormData]) {
        const fieldName = field === 'partner1Name' ? 'partner 1 name' : field.replace(/([A-Z])/g, ' $1').toLowerCase();
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
      const allSigned = contractTemplates.every(
        (template) => signatures[template.service_type] && signatures[template.service_type].trim() !== ''
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
    setTempSignatures((prev) => ({ ...prev, [serviceType]: signature }));
  };

  const confirmSignature = (serviceType: string) => {
    const signature = tempSignatures[serviceType];
    if (signature && signature.trim()) {
      setSignatures((prev) => ({ ...prev, [serviceType]: signature.trim() }));
    }
  };

  const handleStripePayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready');
      return false;
    }

    try {
      let result;
      
      if (paymentMethod === 'card') {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setError('Card information not found');
          return false;
        }

        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${formData.partner1Name}${formData.partner2Name ? ` & ${formData.partner2Name}` : ''}`,
              email: formData.email,
              phone: formData.phone,
              address: {
                line1: formData.billingAddress,
                city: formData.city,
                state: formData.state,
                postal_code: formData.zipCode,
                country: 'US',
              },
            },
          },
        });
      } else {
        // Use PaymentElement for Affirm and other payment methods
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/checkout/success`,
            payment_method_data: {
              billing_details: {
                name: `${formData.partner1Name}${formData.partner2Name ? ` & ${formData.partner2Name}` : ''}`,
                email: formData.email,
                phone: formData.phone,
                address: {
                  line1: formData.billingAddress,
                  city: formData.city,
                  state: formData.state,
                  postal_code: formData.zipCode,
                  country: 'US',
                },
              },
            },
          },
          redirect: 'if_required',
        });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent?.status === 'succeeded') {
        return true;
      } else if (result.paymentIntent?.status === 'requires_action') {
        // Handle 3D Secure or other authentication
        return false;
      }

      return false;
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep !== 3) {
      handleNextStep();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentSuccess = await handleStripePayment();
      
      if (paymentSuccess) {
        // Save booking data to database
        if (supabase && isSupabaseConfigured()) {
          // Save contracts with signatures
          for (const template of contractTemplates) {
            const signature = signatures[template.service_type];
            if (signature) {
              await supabase.from('contracts').insert({
                content: template.content,
                signature: signature,
                signed_at: new Date().toISOString(),
                status: 'signed'
              });
            }
          }
        }

        onSuccess();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

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
          { step: 3, label: 'Payment', icon: CreditCard },
        ].map(({ step, label, icon: Icon }) => (
          <div key={step} className="flex items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                ${currentStep >= step ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}
              `}
            >
              {currentStep > step ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${currentStep >= step ? 'text-rose-600' : 'text-gray-500'}`}
            >
              {label}
            </span>
            {step < 3 && (
              <div
                className={`w-16 h-1 mx-4 rounded-full transition-all ${
                  currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
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
                helperText="We'll send booking confirmations here"
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                helperText="For urgent updates about your booking"
                required
              />
            </div>

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
                  I agree to the <a href="#" className="text-rose-600 hover:text-rose-700">Terms of Service</a> and{' '}
                  <a href="#" className="text-rose-600 hover:text-rose-700">Privacy Policy</a>. I understand that this
                  booking is subject to the vendor's cancellation policy.
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
                        <div
                          className={`p-4 ${
                            isSigned ? 'bg-green-50 border-b border-green-200' : 'bg-gray-50 border-b border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{template.service_type} Service Agreement</h4>
                            <div
                              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                                isSigned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
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
                              <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature</label>
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
                                  disabled={
                                    !tempSignatures[template.service_type] ||
                                    !tempSignatures[template.service_type].trim()
                                  }
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
          </div>
        )}

        {/* Step 3: Payment Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Payment Intent Status */}
            {!clientSecret && (
              <Card className="p-4 bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-blue-800">Initializing secure payment...</span>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
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
                        <option key={state} value={state}>
                          {state}
                        </option>
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

            {/* Payment Method Selection */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Payment Method</h3>
              </div>

              {/* Payment Method Tabs */}
              <div className="flex space-x-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
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
                  onClick={() => setPaymentMethod('affirm')}
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
                {!clientSecret ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-blue-800 text-sm">
                      Initializing secure payment...
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {paymentMethod === 'card' ? 'Card Information' : 'Payment Information'}
                    </label>
                    <div className="p-4 border border-gray-300 rounded-lg bg-white">
                      {paymentMethod === 'card' ? (
                        <CardElement
                          options={{
                            style: {
                              base: {
                                fontSize: '16px',
                                color: '#1f2937',
                                fontFamily: 'system-ui, sans-serif',
                                fontWeight: '400',
                                lineHeight: '24px',
                                iconColor: '#6b7280',
                                '::placeholder': {
                                  color: '#9ca3af',
                                },
                              },
                              focus: {
                                color: '#1f2937',
                                iconColor: '#f43f5e',
                                '::placeholder': {
                                  color: '#6b7280',
                                },
                              },
                              invalid: {
                                color: '#dc2626',
                                iconColor: '#dc2626',
                              },
                              complete: {
                                color: '#059669',
                                iconColor: '#059669',
                              },
                            },
                            hidePostalCode: true,
                          }}
                        />
                      ) : (
                        <PaymentElement
                          options={{
                            paymentMethodTypes: ['affirm'],
                            layout: 'tabs',
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Your payment is secured by 256-bit SSL encryption
                  </span>
                </div>
              </div>
            </Card>

            {/* Referral Code Section */}
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Referral Code (Optional)</h4>
              <p className="text-gray-600 text-sm mb-4">
                Have a referral code from one of our vendors? Enter it here for a special discount.
              </p>

              {appliedReferral ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-blue-900">
                        Referred by {appliedReferral.vendor_name}
                      </span>
                      <p className="text-xs text-blue-700">$50 discount applied</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeReferral}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Enter referral code (e.g., DANI1234)"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReferralSubmit}
                    disabled={referralLoading || !referralCode.trim()}
                    loading={referralLoading}
                  >
                    Apply
                  </Button>
                </div>
              )}
              {referralError && <p className="text-sm text-red-600 mt-2">{referralError}</p>}
            </Card>

            {/* Secure Payment Notice */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Lock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Secure Payment with Stripe</p>
                  <p className="text-xs text-green-700">
                    Choose between credit card or Affirm payment options
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handlePrevStep} icon={ArrowLeft}>
              Back
            </Button>
          )}
          <div className={currentStep === 1 ? 'ml-auto' : ''}>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || (currentStep === 3 && !clientSecret)}
              loading={loading}
              icon={currentStep === 3 ? CreditCard : ArrowRight}
            >
              {currentStep === 1
                ? 'Continue to Contracts'
                : currentStep === 2
                ? 'Continue to Payment'
                : loading
                ? 'Processing Payment...'
                : `Pay ${formatPrice(grandTotal)} Deposit`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};