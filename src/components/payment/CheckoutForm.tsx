import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  guestCount: string;
  specialRequests: string;
  savePaymentMethod: boolean;
  agreedToTerms: boolean;
  password: string;
  acceptStripe: boolean;
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
  onSuccess: (bookingIds: string[]) => void;
  onReferralApplied: (discount: number, referral: any) => void;
  onReferralRemoved: () => void;
  isInitializingPayment: boolean;
  pollTimeout: number;
  pollInterval: number;
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
  isInitializingPayment,
  pollTimeout,
  pollInterval,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user, isAuthenticated } = useAuth();
  const { couple } = useCouple();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [tempSignatures, setTempSignatures] = useState<Record<string, string>>({});
  const [contractsLoading, setContractsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'affirm'>('card');
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [processedPaymentIntents, setProcessedPaymentIntents] = useState<string[]>([]);
  const [paymentDetailsComplete, setPaymentDetailsComplete] = useState(false);

  // Initialize formData with values from user and couple
  const [formData, setFormData] = useState<CheckoutFormData>({
    partner1Name: user?.user_metadata?.name || couple?.partner1_name || '',
    partner2Name: couple?.partner2_name || '',
    email: user?.email || couple?.email || '',
    phone: couple?.phone || '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    guestCount: couple?.guest_count?.toString() || '',
    specialRequests: '',
    savePaymentMethod: false,
    agreedToTerms: true,
    password: '',
    acceptStripe: false,
  });

  // Memoize formData to reduce re-renders
  const memoizedFormData = useMemo(
    () => ({
      email: formData.email,
      partner1Name: formData.partner1Name,
      billingAddress: formData.billingAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      phone: formData.phone,
      partner2Name: formData.partner2Name,
      guestCount: formData.guestCount,
      specialRequests: formData.specialRequests,
      savePaymentMethod: formData.savePaymentMethod,
      agreedToTerms: formData.agreedToTerms,
      acceptStripe: formData.acceptStripe,
    }),
    [
      formData.email,
      formData.partner1Name,
      formData.billingAddress,
      formData.city,
      formData.state,
      formData.zipCode,
      formData.phone,
      formData.partner2Name,
      formData.guestCount,
      formData.specialRequests,
      formData.savePaymentMethod,
      formData.agreedToTerms,
      formData.acceptStripe,
    ]
  );

  // Debug initialization
  useEffect(() => {
    console.log('=== CHECKOUT FORM INITIALIZATION ===', new Date().toISOString());
    console.log('Stripe instance:', !!stripe);
    console.log('Elements instance:', !!elements);
    console.log('Current step:', currentStep);
    console.log('Client secret:', !!clientSecret);
    console.log('Payment intent ID:', paymentIntentId);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Auth token:', !!authToken);
    console.log('Couple ID:', coupleId);
    console.log('Processed payment intents:', processedPaymentIntents);
    console.log('User:', user ? { id: user.id, email: user.email, metadata: user.user_metadata } : 'No user');
    console.log('Couple:', couple ? { id: couple.id, email: couple.email } : 'No couple');
    console.log('Form data:', memoizedFormData);
    console.log('Payment details complete:', paymentDetailsComplete);
  }, [stripe, elements, currentStep, clientSecret, paymentIntentId, isAuthenticated, authToken, coupleId, processedPaymentIntents, user, couple, memoizedFormData, paymentDetailsComplete]);

  // Fetch and validate session token, and get or create couple ID
  useEffect(() => {
    const fetchSessionAndCouple = async () => {
      console.log('=== FETCH SESSION AND COUPLE ===', new Date().toISOString());
      if (!isAuthenticated || !user || !user.id) {
        console.log('User not authenticated or user ID missing, showing auth modal with signup mode');
        setShowAuthModal(true);
        setAuthMode('signup');
        setAuthToken(null);
        setCoupleId(null);
        setError('Please sign up or log in to continue with checkout.');
        return;
      }
      console.log('User authenticated, user_id:', user.id, 'email:', user.email);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session fetch error:', sessionError?.message);
        setError('Authentication session expired. Please log in again.');
        setShowAuthModal(true);
        setAuthMode('login');
        setAuthToken(null);
        setCoupleId(null);
        return;
      }
      console.log('Session fetched, access_token:', !!session.access_token);
      setAuthToken(session.access_token);
      console.log('Fetching couple data for user_id:', user.id);
      let { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id, email, partner1_name, partner2_name, phone, guest_count')
        .eq('user_id', user.id)
        .single();
      if (coupleError || !coupleData) {
        console.warn('No couple record found, creating one for user_id:', user.id);
        const { data: newCouple, error: insertError } = await supabase
          .from('couples')
          .insert({
            user_id: user.id,
            partner1_name: memoizedFormData.partner1Name || user.user_metadata?.name || 'Unknown',
            email: memoizedFormData.email || user.email || 'unknown@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id, email, partner1_name, partner2_name, phone, guest_count')
          .single();
        if (insertError || !newCouple) {
          console.error('Couple creation error:', insertError?.message);
          setError('Failed to create couple profile. Please check your account settings or contact support.');
          setShowAuthModal(true);
          setAuthMode('login');
          setCoupleId(null);
          return;
        }
        console.log('New couple created:', { id: newCouple.id, email: newCouple.email });
        coupleData = newCouple;
      }
      console.log('Couple fetched:', { id: coupleData.id, email: coupleData.email, partner1_name: coupleData.partner1_name });
      setCoupleId(coupleData.id);
      setFormData((prev) => ({
        ...prev,
        email: prev.email || coupleData.email || user.email || 'unknown@example.com',
        partner1Name: prev.partner1Name || coupleData.partner1_name || user.user_metadata?.name || 'Unknown',
        partner2Name: prev.partner2Name || coupleData.partner2_name || '',
        phone: prev.phone || coupleData.phone || '',
        guestCount: prev.guestCount || coupleData.guest_count?.toString() || '',
      }));
    };
    fetchSessionAndCouple();
  }, [isAuthenticated, user]);

  // Fetch contract templates
  useEffect(() => {
    const fetchContractTemplates = async () => {
      console.log('=== FETCH CONTRACT TEMPLATES ===', new Date().toISOString());
      console.log('Cart items:', cartItems.map(item => ({
        id: item.id,
        service_type: item.package?.service_type,
        package_name: item.package?.name,
      })));
      if (!cartItems.length) {
        console.log('No cart items, skipping contract fetch');
        setContractTemplates([]);
        setContractsLoading(false);
        return;
      }
      const serviceTypes = [...new Set(cartItems.map((item) => item.package?.service_type).filter(Boolean))];
      console.log('Service types:', serviceTypes);
      if (!serviceTypes.length) {
        console.warn('No valid service types found in cart items');
        setError('No valid services found in cart. Please add services to proceed.');
        setContractTemplates([]);
        setContractsLoading(false);
        return;
      }
      if (!supabase || !isSupabaseConfigured()) {
        console.log('Supabase not configured, generating mock contract templates');
        const platformFee = Number(cartItems.length > 0 ? 50 * 100 : 0);
        const mockTemplates: ContractTemplate[] = cartItems.map((item) => ({
          id: `template-${item.package.service_type || 'unknown'}`,
          service_type: item.package.service_type || 'unknown',
          content: `${(item.package.service_type || 'Service').toUpperCase()} SERVICE AGREEMENT
This agreement is between ${memoizedFormData.partner1Name || 'Client'}${
            memoizedFormData.partner2Name ? ` & ${memoizedFormData.partner2Name}` : ''
          } (Client) and the selected vendor (Service Provider) for ${(item.package.service_type || 'service').toLowerCase()} services.
EVENT DETAILS:
- Date: ${item.eventDate || 'N/A'}
- Time: ${item.eventTime || 'N/A'} to ${item.endTime || 'N/A'}
- Location: ${item.venue?.name || 'N/A'}
- Service: ${item.package.name || 'N/A'}
- Event Type: ${item.package.event_type || 'Wedding'}
SERVICES PROVIDED:
${item.package.features?.map((feature: string) => `- ${feature}`).join('\n') || `- Professional ${(item.package.service_type || 'service').toLowerCase()} services`}
PAYMENT TERMS:
- Total Amount: $${(item.package.price / 100).toFixed(0) || '0'}
- Deposit (50%): $${(Math.round((item.package.price || 0) * 0.5) / 100).toFixed(0)}
- Platform Fee (Per Order): $${(platformFee / 100).toFixed(0)}
- Balance Due: $${(Math.round((item.package.price || 0) * 0.5) / 100).toFixed(0)}
TERMS AND CONDITIONS:
1. The Service Provider agrees to provide professional ${(item.package.service_type || 'service').toLowerCase()} services for the specified event.
2. The Client agrees to pay the total amount as outlined in the payment schedule.
3. Cancellation policy: 30 days notice required for partial refund of deposit.
4. The Service Provider retains copyright to all work but grants usage rights to the Client.
5. Weather contingency plans will be discussed prior to the event.
6. Any changes to services must be agreed upon in writing by both parties.
By signing below, both parties agree to the terms outlined in this contract.`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        console.log('Mock templates generated:', mockTemplates);
        setContractTemplates(mockTemplates);
        setContractsLoading(false);
        return;
      }
      setContractsLoading(true);
      try {
        console.log('Fetching contract templates for service types:', serviceTypes);
        const { data, error } = await supabase
          .from('contract_templates')
          .select('*')
          .in('service_type', serviceTypes);
        if (error) {
          console.error('Contract templates fetch error:', error);
          throw error;
        }
        console.log('Contract templates fetched:', data || []);
        setContractTemplates(data || []);
      } catch (err) {
        console.error('Error fetching contract templates:', err);
        setError('Failed to load contract templates. Please try again.');
      } finally {
        setContractsLoading(false);
      }
    };
    fetchContractTemplates();
  }, [cartItems, memoizedFormData.partner1Name, memoizedFormData.partner2Name]);

  // Attach CardElement change listener
  useEffect(() => {
    if (elements) {
      const cardElement = elements.getElement(CardElement);
      if (cardElement) {
        console.log('=== CARD ELEMENT INITIALIZED ===', new Date().toISOString());
        console.log('CardElement setup:', {
          elementType: 'CardElement',
          stripeVersion: stripe ? 'loaded' : 'not loaded',
          elementsVersion: elements ? 'loaded' : 'not loaded',
        });
        const handleChange = (event: any) => {
          console.log('=== CARD ELEMENT CHANGE ===', new Date().toISOString());
          console.log('Change event:', {
            complete: event.complete,
            error: event.error,
            value: event.value,
            elementType: event.elementType,
            empty: event.empty,
            brand: event.brand,
          });
          setPaymentDetailsComplete(event.complete);
          if (event.error) {
            setError(event.error.message);
          } else {
            setError(null);
          }
        };
        cardElement.on('change', handleChange);
        cardElement.on('focus', () => console.log('=== CARD ELEMENT FOCUS ===', new Date().toISOString()));
        cardElement.on('blur', async () => {
          console.log('=== CARD ELEMENT BLUR ===', new Date().toISOString());
          if (!paymentDetailsComplete && stripe) {
            console.log('=== BLUR VALIDATION CHECK ===', new Date().toISOString());
            const { error, paymentMethod } = await stripe.createPaymentMethod({
              type: 'card',
              card: cardElement,
            });
            console.log('Blur validation result:', { error, paymentMethod: paymentMethod ? { id: paymentMethod.id, card: paymentMethod.card } : null });
            if (!error && paymentMethod) {
              setPaymentDetailsComplete(true);
              setError(null);
            } else {
              setError(error?.message || 'Card information incomplete');
            }
          }
        });
        cardElement.on('ready', () => console.log('=== CARD ELEMENT READY ===', new Date().toISOString()));
        return () => {
          console.log('=== CARD ELEMENT CLEANUP ===', new Date().toISOString());
          cardElement.off('change', handleChange);
          cardElement.off('focus');
          cardElement.off('blur');
          cardElement.off('ready');
        };
      } else {
        console.warn('CardElement not found');
      }
    } else {
      console.warn('Elements instance not initialized');
    }
  }, [elements, stripe, paymentDetailsComplete]);

  const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT', 'NY', 'NJ', 'PA', 'CA', 'FL', 'TX'];

  // Calculate totals
  const subtotal = totalAmount;
  const totalDiscount = discountAmount + referralDiscount;
  const discountedTotal = Math.max(0, subtotal - totalDiscount);
  const platformFee = Number(cartItems.length > 0 ? 50 * 100 : 0);
  const depositAmount = Math.round(discountedTotal * 0.5);
  const grandTotal = depositAmount + platformFee;

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

  const handleReferralSubmit = useCallback(() => {
    validateReferralCode(referralCode);
  }, [referralCode]);

  const removeReferral = useCallback(() => {
    setReferralCode('');
    setAppliedReferral(null);
    setReferralError(null);
    onReferralRemoved();
  }, [onReferralRemoved]);

  const handleInputChange = useCallback((field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [error]);

  const validateForm = useCallback(() => {
    console.log('=== VALIDATE FORM ===', new Date().toISOString());
    console.log('Current step:', currentStep);
    console.log('Form data:', memoizedFormData);
    console.log('Cart items:', cartItems);
    console.log('Couple ID:', coupleId);
    console.log('Total amount:', totalAmount);
    const requiredFields = ['partner1Name', 'email', 'phone', 'billingAddress', 'city', 'state', 'zipCode'];
    for (const field of requiredFields) {
      if (!memoizedFormData[field as keyof typeof memoizedFormData]) {
        const fieldName = field === 'partner1Name' ? 'partner 1 name' : field.replace(/([A-Z])/g, ' $1').toLowerCase();
        console.log(`Validation failed: ${fieldName} is empty`);
        setError(`Please fill in ${fieldName}`);
        return false;
      }
    }
    if (!memoizedFormData.agreedToTerms) {
      console.log('Validation failed: agreedToTerms is false');
      setError('Please agree to the terms and conditions');
      return false;
    }
    if (!memoizedFormData.acceptStripe && currentStep === 3 && paymentMethod === 'card') {
      console.log('Validation failed: acceptStripe is false');
      setError('Please accept the use of Stripe for payment processing');
      return false;
    }
    if (cartItems.length === 0) {
      console.log('Validation failed: Cart is empty');
      setError('Cart is empty. Please add items to proceed.');
      return false;
    }
    if (!cartItems[0]?.eventDate || !cartItems[0]?.eventTime || !cartItems[0]?.endTime || !cartItems[0]?.venue?.name) {
      console.log('Validation failed: Missing event details');
      setError('Cart items are missing required event details (date, start time, end time, or location).');
      return false;
    }
    const validEventTypes = ['wedding', 'engagement', 'proposal'];
    const eventType = cartItems[0]?.package.event_type?.toLowerCase();
    if (!eventType || !validEventTypes.includes(eventType)) {
      console.log('Validation failed: Invalid event type', eventType);
      setError('Invalid event type. Must be one of: wedding, engagement, proposal.');
      return false;
    }
    if (!coupleId) {
      console.log('Validation failed: No coupleId');
      setError('Couple profile not found. Please sign up or log in again.');
      setShowAuthModal(true);
      setAuthMode('login');
      return false;
    }
    if (totalAmount <= 0) {
      console.log('Validation failed: Total amount <= 0');
      setError('Total amount must be greater than zero.');
      return false;
    }
    console.log('Validation passed');
    return true;
  }, [currentStep, memoizedFormData, cartItems, coupleId, totalAmount, paymentMethod]);

  const handleLogin = useCallback(async () => {
    if (!memoizedFormData.email || !memoizedFormData.password) {
      setError('Please provide both email and password.');
      return;
    }
    try {
      console.log('Attempting login with email:', memoizedFormData.email);
      const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
        email: memoizedFormData.email,
        password: memoizedFormData.password,
      });
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session returned after login');
      console.log('Login successful, access_token:', !!session.access_token);
      setAuthToken(session.access_token);
      console.log('Fetching couple data for user_id:', authUser.id);
      let { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('id, email, partner1_name, partner2_name, phone, guest_count')
        .eq('user_id', authUser.id)
        .single();
      if (coupleError || !couple) {
        console.warn('No couple record found, creating one for user_id:', authUser.id);
        const { data: newCouple, error: insertError } = await supabase.from('couples').insert({
          user_id: authUser.id,
          email: memoizedFormData.email || authUser.email || 'unknown@example.com',
          partner1_name: memoizedFormData.partner1Name || authUser.user_metadata?.name || 'Unknown',
          partner2_name: memoizedFormData.partner2Name || null,
          phone: memoizedFormData.phone || null,
          guest_count: memoizedFormData.guestCount ? parseInt(memoizedFormData.guestCount) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).select('id, email, partner1_name, partner2_name, phone, guest_count').single();
        if (insertError) throw new Error(`Failed to create couple record: ${insertError.message}`);
        console.log('New couple created:', { id: newCouple.id, email: newCouple.email });
        couple = newCouple;
      }
      console.log('Couple fetched:', { id: couple.id, email: couple.email });
      setCoupleId(couple.id);
      setFormData((prev) => ({
        ...prev,
        email: prev.email || couple.email || authUser.email || 'unknown@example.com',
        partner1Name: prev.partner1Name || couple.partner1_name || authUser.user_metadata?.name || 'Unknown',
        partner2Name: prev.partner2Name || couple.partner2_name || '',
        phone: prev.phone || couple.phone || '',
        guestCount: prev.guestCount || couple.guest_count?.toString() || '',
      }));
      setShowAuthModal(false);
      setError(null);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? `Login failed: ${err.message}` : 'Login failed. Please check your credentials and try again.');
    }
  }, [memoizedFormData]);

  const handleSignUp = useCallback(async () => {
    if (!memoizedFormData.email || !memoizedFormData.password || !memoizedFormData.partner1Name) {
      setError('Please provide email, password, and partner 1 name.');
      return;
    }
    try {
      console.log('Attempting signup with email:', memoizedFormData.email);
      const { data, error } = await supabase.auth.signUp({
        email: memoizedFormData.email,
        password: memoizedFormData.password,
        options: {
          data: {
            name: memoizedFormData.partner1Name,
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('No user returned after signup');
      console.log('Signup successful, user_id:', data.user.id);
      const { data: couple, error: coupleError } = await supabase.from('couples').insert({
        user_id: data.user.id,
        partner1_name: memoizedFormData.partner1Name || data.user.user_metadata?.name || 'Unknown',
        partner2_name: memoizedFormData.partner2Name || null,
        email: memoizedFormData.email || data.user.email || 'unknown@example.com',
        phone: memoizedFormData.phone || null,
        guest_count: memoizedFormData.guestCount ? parseInt(memoizedFormData.guestCount) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select('id, email, partner1_name, partner2_name, phone, guest_count').single();
      if (coupleError) throw new Error(`Failed to create couple record: ${coupleError.message}`);
      console.log('New couple created:', { id: couple.id, email: couple.email });
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Session fetched after signup, access_token:', !!session.access_token);
        setAuthToken(session.access_token);
      }
      setCoupleId(couple.id);
      setFormData((prev) => ({
        ...prev,
        email: couple.email || memoizedFormData.email || data.user.email || 'unknown@example.com',
        partner1Name: couple.partner1_name || memoizedFormData.partner1Name || data.user.user_metadata?.name || 'Unknown',
        partner2Name: couple.partner2_name || memoizedFormData.partner2Name || '',
        phone: couple.phone || memoizedFormData.phone || '',
        guestCount: couple.guest_count?.toString() || memoizedFormData.guestCount || '',
      }));
      setShowAuthModal(false);
      setError(null);
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err instanceof Error ? `Sign-up failed: ${err.message}` : 'Sign-up failed. Please try again.');
    }
  }, [memoizedFormData]);

  const handleNextStep = useCallback(async () => {
    console.log('=== HANDLE NEXT STEP ===', new Date().toISOString());
    console.log('Current step:', currentStep);
    if (!validateForm()) {
      console.log('Form validation failed, staying on current step');
      return;
    }
    if (currentStep === 1) {
      if (!isAuthenticated || !authToken || !coupleId) {
        console.log('Authentication check failed:', { isAuthenticated, authToken: !!authToken, coupleId });
        setShowAuthModal(true);
        setAuthMode(isAuthenticated ? 'login' : 'signup');
        return;
      }
      console.log('Advancing to step 2');
      setCurrentStep(2);
      setLoading(false);
      setError(null);
    } else if (currentStep === 2) {
      const allSigned = contractTemplates.every(
        (template) => signatures[template.service_type] && signatures[template.service_type].trim() !== ''
      );
      console.log('Checking if all contracts are signed:', allSigned);
      console.log('Signatures:', signatures);
      if (!allSigned) {
        console.log('Validation failed: Not all contracts are signed');
        setError('Please sign all contracts before proceeding');
        return;
      }
      console.log('Advancing to step 3');
      setCurrentStep(3);
      setLoading(false);
      setError(null);
    }
  }, [currentStep, validateForm, isAuthenticated, authToken, coupleId, contractTemplates, signatures]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      console.log('=== HANDLE PREV STEP ===', new Date().toISOString());
      console.log('Reverting from step:', currentStep);
      setCurrentStep(currentStep - 1);
      setError(null);
      setLoading(false);
      setPaymentDetailsComplete(false);
    }
  }, [currentStep]);

  const handleSignatureChange = useCallback((serviceType: string, signature: string) => {
    setTempSignatures((prev) => ({ ...prev, [serviceType]: signature }));
  }, []);

  const confirmSignature = useCallback((serviceType: string) => {
    console.log('=== CONFIRM SIGNATURE ===', new Date().toISOString());
    console.log('Service type:', serviceType);
    const signature = tempSignatures[serviceType];
    if (signature && signature.trim()) {
      console.log('Confirming signature for', serviceType, ':', signature);
      setSignatures((prev) => ({ ...prev, [serviceType]: signature.trim() }));
      // Check if all contracts are signed
      const allSigned = contractTemplates.every(
        (template) =>
          (template.service_type === serviceType ? signature.trim() : signatures[template.service_type]) &&
          (template.service_type === serviceType
            ? signature.trim()
            : signatures[template.service_type]?.trim()) !== ''
      );
      console.log('All contracts signed after confirmation:', allSigned);
      if (allSigned && currentStep === 2) {
        console.log('All contracts signed, advancing to step 3');
        setCurrentStep(3);
        setLoading(false);
        setError(null);
      }
    } else {
      console.log('Signature invalid or empty for', serviceType);
      setError('Please provide a valid signature');
    }
  }, [currentStep, contractTemplates, signatures, tempSignatures]);

  const handleStripePayment = useCallback(async () => {
    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      return { paymentIntentId: null, pendingBookingId: null };
    }
    try {
      if (paymentMethod === 'card') {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setError('Card information not found. Please try again.');
          return { paymentIntentId: null, pendingBookingId: null };
        }
        // Create Payment Method
        console.log('Creating Payment Method for card payment');
        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${memoizedFormData.partner1Name}${memoizedFormData.partner2Name ? ` & ${memoizedFormData.partner2Name}` : ''}`,
            email: memoizedFormData.email,
            phone: memoizedFormData.phone,
            address: {
              line1: memoizedFormData.billingAddress,
              city: memoizedFormData.city,
              state: memoizedFormData.state,
              postal_code: memoizedFormData.zipCode,
              country: 'US',
            },
          },
        });
        if (paymentMethodError) {
          throw new Error(paymentMethodError.message || 'Failed to create payment method');
        }
        console.log('Payment Method created:', paymentMethod.id);
        // Send Payment Method to server for Payment Intent creation and booking storage
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-booking-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id,
            customerInfo: {
              coupleId,
              email: memoizedFormData.email,
              partner1Name: memoizedFormData.partner1Name || 'Unknown',
              partner2Name: memoizedFormData.partner2Name || '',
              phone: memoizedFormData.phone || '',
              billingAddress: memoizedFormData.billingAddress || '',
              city: memoizedFormData.city || '',
              state: memoizedFormData.state || '',
              zipCode: memoizedFormData.zipCode || '',
              eventDate: cartItems[0]?.eventDate || '',
              eventTime: cartItems[0]?.eventTime || '',
              endTime: cartItems[0]?.endTime || '',
              eventLocation: cartItems[0]?.venue?.name || '',
              eventType: cartItems[0]?.package.event_type?.toLowerCase() || 'wedding',
              guestCount: memoizedFormData.guestCount || '',
              specialRequests: memoizedFormData.specialRequests || '',
              savePaymentMethod: memoizedFormData.savePaymentMethod || false,
              agreedToTerms: memoizedFormData.agreedToTerms || false,
            },
            cartItems: cartItems.map(item => ({
              id: item.id,
              package: {
                id: item.package.id,
                name: item.package.name,
                price: item.package.price,
                service_type: item.package.service_type,
                event_type: item.package.event_type?.toLowerCase(),
              },
              vendor: {
                id: item.vendor?.id,
                name: item.vendor?.name,
                stripe_account_id: item.vendor?.stripe_account_id,
              },
              eventDate: item.eventDate,
              eventTime: item.eventTime,
              endTime: item.endTime,
              venue: item.venue ? {
                id: item.venue.id,
                name: item.venue.name,
              } : null,
            })),
            signatures,
            totalAmount,
            discountAmount,
            referralDiscount,
            platformFee: Number(platformFee),
            grandTotal,
            paymentType: 'deposit',
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          if (errorData.requiresAction && errorData.paymentIntentId && errorData.clientSecret) {
            // Handle 3D Secure authentication
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(errorData.clientSecret);
            if (confirmError) {
              throw new Error(confirmError.message || 'Payment authentication failed');
            }
            console.log('Payment confirmed after 3D Secure:', { paymentIntentId: paymentIntent.id, status: paymentIntent.status });
            return { paymentIntentId: paymentIntent.id, pendingBookingId: errorData.pendingBookingId };
          }
          throw new Error(errorData.error || 'Failed to process payment');
        }
        const { paymentIntentId, pendingBookingId } = await response.json();
        console.log('Payment Intent processed:', { paymentIntentId, pendingBookingId });
        return { paymentIntentId, pendingBookingId };
      } else {
        // Affirm payment
        const paymentElement = elements.getElement(PaymentElement);
        if (!paymentElement) {
          setError('Payment information not found. Please try again.');
          return { paymentIntentId: null, pendingBookingId: null };
        }
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/checkout/success`,
            payment_method_data: {
              billing_details: {
                name: `${memoizedFormData.partner1Name}${memoizedFormData.partner2Name ? ` & ${memoizedFormData.partner2Name}` : ''}`,
                email: memoizedFormData.email,
                phone: memoizedFormData.phone,
                address: {
                  line1: memoizedFormData.billingAddress,
                  city: memoizedFormData.city,
                  state: memoizedFormData.state,
                  postal_code: memoizedFormData.zipCode,
                  country: 'US',
                },
              },
            },
          },
          redirect: 'if_required',
        });
        if (error) {
          throw new Error(error.message || 'Payment confirmation failed');
        }
        console.log('Affirm payment confirmed:', { paymentIntentId: paymentIntent.id, status: paymentIntent.status });
        // Store booking for Affirm payment
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-booking-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            customerInfo: {
              coupleId,
              email: memoizedFormData.email,
              partner1Name: memoizedFormData.partner1Name || 'Unknown',
              partner2Name: memoizedFormData.partner2Name || '',
              phone: memoizedFormData.phone || '',
              billingAddress: memoizedFormData.billingAddress || '',
              city: memoizedFormData.city || '',
              state: memoizedFormData.state || '',
              zipCode: memoizedFormData.zipCode || '',
              eventDate: cartItems[0]?.eventDate || '',
              eventTime: cartItems[0]?.eventTime || '',
              endTime: cartItems[0]?.endTime || '',
              eventLocation: cartItems[0]?.venue?.name || '',
              eventType: cartItems[0]?.package.event_type?.toLowerCase() || 'wedding',
              guestCount: memoizedFormData.guestCount || '',
              specialRequests: memoizedFormData.specialRequests || '',
              savePaymentMethod: memoizedFormData.savePaymentMethod || false,
              agreedToTerms: memoizedFormData.agreedToTerms || false,
            },
            cartItems: cartItems.map(item => ({
              id: item.id,
              package: {
                id: item.package.id,
                name: item.package.name,
                price: item.package.price,
                service_type: item.package.service_type,
                event_type: item.package.event_type?.toLowerCase(),
              },
              vendor: {
                id: item.vendor?.id,
                name: item.vendor?.name,
                stripe_account_id: item.vendor?.stripe_account_id,
              },
              eventDate: item.eventDate,
              eventTime: item.eventTime,
              endTime: item.endTime,
              venue: item.venue ? {
                id: item.venue.id,
                name: item.venue.name,
              } : null,
            })),
            signatures,
            totalAmount,
            discountAmount,
            referralDiscount,
            platformFee: Number(platformFee),
            grandTotal,
            paymentType: 'deposit',
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          throw new Error(errorData.error || 'Failed to store booking for Affirm payment');
        }
        const { paymentIntentId, pendingBookingId } = await response.json();
        console.log('Affirm booking processed:', { paymentIntentId, pendingBookingId });
        return { paymentIntentId, pendingBookingId };
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      return { paymentIntentId: null, pendingBookingId: null };
    }
  }, [stripe, elements, paymentMethod, memoizedFormData, authToken, coupleId, cartItems, signatures, totalAmount, platformFee, discountAmount, referralDiscount, grandTotal]);

  const pollForBookings = useCallback(async (paymentIntentId: string) => {
    if (processedPaymentIntents.includes(paymentIntentId)) {
      console.log('Payment intent already processed:', paymentIntentId);
      return [];
    }
    const maxAttempts = Math.ceil(pollTimeout / pollInterval);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Polling attempt ${attempt}/${maxAttempts} for bookings with paymentIntentId: ${paymentIntentId}`, new Date().toISOString());
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId);
      if (error) {
        console.error('Polling error:', error);
        continue;
      }
      if (bookings && bookings.length > 0) {
        console.log('Bookings found:', bookings);
        setProcessedPaymentIntents((prev) => [...prev, paymentIntentId]);
        return bookings.map(b => b.id);
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    throw new Error('Booking confirmation timed out');
  }, [processedPaymentIntents, pollTimeout, pollInterval]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== HANDLE SUBMIT ===', new Date().toISOString());
    console.log('Current step:', currentStep);
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    if (currentStep !== 3) {
      console.log('Calling handleNextStep from step:', currentStep);
      await handleNextStep();
      return;
    }
    if (!isAuthenticated || !authToken || !coupleId) {
      setShowAuthModal(true);
      setAuthMode(isAuthenticated ? 'login' : 'signup');
      return;
    }
    if (loading || submitting) {
      console.log('Submit blocked: Already processing payment');
      return;
    }
    setLoading(true);
    setSubmitting(true);
    setError(null);
    try {
      if (paymentMethod === 'card' && (!paymentDetailsComplete || !memoizedFormData.acceptStripe)) {
        setError('Please complete card information and accept Stripe payment processing before proceeding.');
        return;
      }
      const { paymentIntentId, pendingBookingId } = await handleStripePayment();
      if (paymentIntentId && pendingBookingId) {
        const bookingIds = await pollForBookings(paymentIntentId);
        if (bookingIds.length > 0) {
          onSuccess(bookingIds);
        } else {
          setError('No bookings created. Please try again.');
        }
      } else {
        console.warn('No payment intent ID or pending booking ID returned');
        setError('Failed to process payment. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? `Checkout failed: ${err.message}` : 'Checkout failed. Please try again.');
      setCurrentStep(3); // Stay on step 3 to allow retry
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }, [validateForm, currentStep, isAuthenticated, authToken, coupleId, loading, submitting, handleStripePayment, pollForBookings, onSuccess, paymentMethod, paymentDetailsComplete]);

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}
      {showAuthModal && (
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {authMode === 'login' ? 'Please Log In' : 'Create an Account'}
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Email Address"
              type="email"
              value={memoizedFormData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john.smith@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={memoizedFormData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={authMode === 'login' ? 'Enter your password' : 'Create a password'}
              helperText={authMode === 'signup' ? 'Minimum 6 characters' : undefined}
              required
            />
            {authMode === 'signup' && (
              <Input
                label="Partner 1 Name"
                value={memoizedFormData.partner1Name}
                onChange={(e) => handleInputChange('partner1Name', e.target.value)}
                placeholder="Your name"
                required
              />
            )}
          </div>
          <div className="flex space-x-4 mt-6">
            <Button
              type="button"
              variant="primary"
              onClick={authMode === 'login' ? handleLogin : handleSignUp}
              disabled={loading || !memoizedFormData.email || !memoizedFormData.password || (authMode === 'signup' && !memoizedFormData.partner1Name)}
              loading={loading}
            >
              {authMode === 'login' ? 'Log In' : 'Create Account'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
              }}
            >
              {authMode === 'login' ? 'Sign Up' : 'Back to Login'}
            </Button>
          </div>
        </Card>
      )}
      {!showAuthModal && (
        <div className="space-y-8">
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
            {/* Step 1: Personal and Billing Information */}
            {currentStep === 1 && (
              <Card className="p-6 mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Personal and Billing Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Partner 1 Name"
                    value={memoizedFormData.partner1Name}
                    onChange={(e) => handleInputChange('partner1Name', e.target.value)}
                    placeholder="Your name"
                    icon={User}
                    required
                  />
                  <Input
                    label="Partner 2 Name (Optional)"
                    value={memoizedFormData.partner2Name}
                    onChange={(e) => handleInputChange('partner2Name', e.target.value)}
                    placeholder="Partner's name"
                    icon={User}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={memoizedFormData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john.smith@example.com"
                    helperText="We'll send booking confirmations here"
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={memoizedFormData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    helperText="For urgent updates about your booking"
                    required
                  />
                  <Input
                    label="Street Address"
                    placeholder="123 Main Street"
                    value={memoizedFormData.billingAddress}
                    onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                    required
                  />
                  <Input
                    label="City"
                    placeholder="City"
                    value={memoizedFormData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <select
                      value={memoizedFormData.state}
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
                    value={memoizedFormData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    required
                  />
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={memoizedFormData.agreedToTerms}
                      onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                      className="mt-1 text-rose-500 focus:ring-rose-500"
                      required
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the <a href="/terms" className="text-rose-600 hover:text-rose-700">Terms of Service</a> and{' '}
                      <a href="/privacy" className="text-rose-600 hover:text-rose-700">Privacy Policy</a>. I understand that this
                      booking is subject to the vendor's <a href="/cancellation" className="text-rose-600 hover:text-rose-700">cancellation policy</a>.
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
                  ) : contractTemplates.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                      <p className="text-red-600">No contracts available for the selected services.</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="mt-4"
                      >
                        Back to Details
                      </Button>
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
            {/* Step 3: Payment Method */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Payment Method</h3>
                  </div>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {paymentMethod === 'card' ? 'Card Information' : 'Payment Information'}
                      </label>
                      <div className="p-4 border border-gray-300 rounded-lg bg-white" key={`${currentStep}-${paymentMethod}`}>
                        {paymentMethod === 'card' ? (
                          <CardElement
                            options={{
                              style: {
                                base: {
                                  fontSize: '16px',
                                  color: '#1f2937',
                                  fontFamily: 'system-ui, sans-serif',
                                  fontWeight: '400',
                                  iconColor: '#6b7280',
                                  '::placeholder': {
                                    color: '#9ca3af',
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
                            onReady={() => console.log('=== CARD ELEMENT READY ===', new Date().toISOString())}
                            onFocus={() => console.log('=== CARD ELEMENT FOCUS ===', new Date().toISOString())}
                            onBlur={async () => {
                              console.log('=== CARD ELEMENT BLUR ===', new Date().toISOString());
                              if (!paymentDetailsComplete && stripe) {
                                console.log('=== BLUR VALIDATION CHECK ===', new Date().toISOString());
                                const cardElement = elements!.getElement(CardElement);
                                if (cardElement) {
                                  const { error, paymentMethod } = await stripe.createPaymentMethod({
                                    type: 'card',
                                    card: cardElement,
                                  });
                                  console.log('Blur validation result:', { error, paymentMethod: paymentMethod ? { id: paymentMethod.id, card: paymentMethod.card } : null });
                                  if (!error && paymentMethod) {
                                    setPaymentDetailsComplete(true);
                                    setError(null);
                                  } else {
                                    setError(error?.message || 'Card information incomplete');
                                  }
                                }
                              }
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
                    {paymentMethod === 'card' && (
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={memoizedFormData.acceptStripe}
                          onChange={(e) => handleInputChange('acceptStripe', e.target.checked)}
                          className="mt-1 text-rose-500 focus:ring-rose-500"
                        />
                        <span className="text-sm text-gray-600">
                          I accept that Stripe is being used to securely process my payment.
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Lock className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        Your payment is secured by 256-bit SSL encryption
                      </span>
                    </div>
                  </div>
                </Card>
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
                        disabled={loading || !referralCode.trim()}
                        loading={referralLoading}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  {referralError && <p className="text-sm text-red-600 mt-2">{referralError}</p>}
                </Card>
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
            {currentStep !== 0 && (
              <div className="flex justify-between mt-8 px-6">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handlePrevStep} icon={ArrowLeft}>
                    Back
                  </Button>
                )}
                <div className={currentStep === 1 ? 'ml-auto' : ''}>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || submitting || (currentStep === 3 && paymentMethod === 'card' && (!paymentDetailsComplete || !memoizedFormData.acceptStripe))}
                    className={currentStep === 3 && paymentMethod === 'card' && (!paymentDetailsComplete || !memoizedFormData.acceptStripe) ? 'opacity-50 cursor-not-allowed' : ''}
                    loading={loading}
                    icon={currentStep === 3 ? CreditCard : ArrowRight}
                  >
                    {currentStep === 1
                      ? 'Continue to Contracts'
                      : currentStep === 2
                      ? 'Continue to Payment'
                      : loading
                      ? 'Processing Payment...'
                      : `Pay $${(grandTotal / 100).toFixed(0)} Deposit`}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
};