// src/components/checkout/CheckoutContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
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
  coupleId?: string;
}

interface CheckoutContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  formData: CheckoutFormData;
  updateFormData: (field: keyof CheckoutFormData, value: any) => void;
  signatures: Record<string, string>;
  setSignature: (serviceType: string, signature: string) => void;
  tempSignatures: Record<string, string>;
  setTempSignature: (serviceType: string, signature: string) => void;
  confirmSignature: (serviceType: string) => void;
  referralCode: string;
  setReferralCode: (code: string) => void;
  appliedReferral: any;
  setAppliedReferral: (ref: any) => void;
  referralError: string | null;
  setReferralError: (err: string | null) => void;
  paymentMethod: 'card' | 'affirm';
  setPaymentMethod: (method: 'card' | 'affirm') => void;
  paymentDetailsComplete: boolean;
  setPaymentDetailsComplete: (complete: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  coupleId: string | null;
  setCoupleId: (id: string | null) => void;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  grandTotal: number;
  totalAmount: number; // ← ADDED
  cartItems: any[];
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const CheckoutProvider: React.FC<{
  children: React.ReactNode;
  cartItems: any[];
  totalAmount: number;
}> = ({ children, cartItems, totalAmount }) => {
  const { user, isAuthenticated } = useAuth();
  const { couple } = useCouple();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CheckoutFormData>({
    partner1Name: '',
    partner2Name: '',
    email: '',
    phone: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    guestCount: '',
    specialRequests: '',
    savePaymentMethod: false,
    agreedToTerms: true,
    password: '',
    acceptStripe: false,
  });

  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [tempSignatures, setTempSignatures] = useState<Record<string, string>>({});
  const [referralCode, setReferralCode] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'affirm'>('card');
  const [paymentDetailsComplete, setPaymentDetailsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // SET COUPLE ID
  useEffect(() => {
    if (couple?.id) {
      setCoupleId(couple.id);
      setFormData(prev => ({ ...prev, coupleId: couple.id }));
    }
  }, [couple]);

  // PRE-FILL COUPLE DATA
  useEffect(() => {
    if (couple) {
      setFormData(prev => ({
        ...prev,
        partner1Name: prev.partner1Name || couple.partner1_name || '',
        partner2Name: prev.partner2Name || couple.partner2_name || '',
        email: prev.email || couple.email || '',
        phone: prev.phone || couple.phone || '',
        guestCount: prev.guestCount || couple.guest_count?.toString() || '',
      }));
    }
    if (user) {
      setFormData(prev => ({
        ...prev,
        partner1Name: prev.partner1Name || user.user_metadata?.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [couple, user]);

  const updateFormData = useCallback((field: keyof CheckoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [error]);

  const setSignature = useCallback((serviceType: string, signature: string) => {
    setSignatures(prev => ({ ...prev, [serviceType]: signature }));
  }, []);

  const setTempSignature = useCallback((serviceType: string, signature: string) => {
    setTempSignatures(prev => ({ ...prev, [serviceType]: signature }));
  }, []);

  const confirmSignature = useCallback((serviceType: string) => {
    const sig = tempSignatures[serviceType];
    if (sig?.trim()) {
      setSignature(serviceType, sig.trim());
    }
  }, [tempSignatures, setSignature]);

  // CALCULATE grandTotal
  const platformFee = cartItems.length > 0 ? 5000 : 0;
  const depositAmount = Math.round(totalAmount * 0.5);
  const grandTotal = depositAmount + platformFee;

  const value = useMemo(() => ({
    currentStep,
    setCurrentStep,
    formData,
    updateFormData,
    signatures,
    setSignature,
    tempSignatures,
    setTempSignature,
    confirmSignature,
    referralCode,
    setReferralCode,
    appliedReferral,
    setAppliedReferral,
    referralError,
    setReferralError,
    paymentMethod,
    setPaymentMethod,
    paymentDetailsComplete,
    setPaymentDetailsComplete,
    error,
    setError,
    loading,
    setLoading,
    coupleId,
    setCoupleId,
    authToken,
    setAuthToken,
    grandTotal,
    totalAmount,     // ← ADDED TO CONTEXT
    cartItems,
  }), [
    currentStep, formData, updateFormData, signatures, setSignature,
    tempSignatures, setTempSignature, confirmSignature, referralCode,
    appliedReferral, referralError, paymentMethod, paymentDetailsComplete,
    error, loading, coupleId, authToken, grandTotal, totalAmount, cartItems
  ]);

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error('useCheckout must be used within CheckoutProvider');
  return context;
};