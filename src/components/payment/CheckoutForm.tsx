// src/components/payment/CheckoutForm.tsx
import React from 'react';
import { CheckoutProvider, useCheckout } from './CheckoutContext';
import { CheckoutDetails } from './CheckoutDetails';
import { CheckoutContracts } from './CheckoutContracts';
import { CheckoutPayment } from './CheckoutPayment';
import { User, FileText, CreditCard, Check, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

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

const StepsBar: React.FC = () => {
  const { currentStep } = useCheckout();

  const steps = [
    { step: 1, label: 'Details', icon: User },
    { step: 2, label: 'Contracts', icon: FileText },
    { step: 3, label: 'Payment', icon: CreditCard },
  ];

  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map(({ step, label, icon: Icon }) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              currentStep >= step ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
            }`}
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
  );
};

const CheckoutSteps: React.FC<CheckoutFormProps> = (props) => {
  const { currentStep, setCurrentStep } = useCheckout();

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepsBar />
      {currentStep === 1 && <CheckoutDetails onNext={() => setCurrentStep(2)} />}
      {currentStep === 2 && (
        <CheckoutContracts
          cartItems={props.cartItems}
          onNext={() => setCurrentStep(3)}
        />
      )}
      {currentStep === 3 && <CheckoutPayment onSubmit={props.onSuccess} />}
    </div>
  );
};

export const CheckoutForm: React.FC<CheckoutFormProps> = (props) => {
  return (
    <CheckoutProvider cartItems={props.cartItems} totalAmount={props.totalAmount}>
      <CheckoutSteps {...props} />
    </CheckoutProvider>
  );
};

export default CheckoutForm;