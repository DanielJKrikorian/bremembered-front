// src/components/checkout/CheckoutDetails.tsx
import React from 'react';
import { User, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCheckout } from './CheckoutContext';

export const CheckoutDetails: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { formData, updateFormData, error, setError } = useCheckout();

  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

  const requiredFields = ['partner1Name', 'email', 'phone', 'billingAddress', 'city', 'state', 'zipCode'];
  const isValid = requiredFields.every(field => formData[field as keyof typeof formData]?.trim());

  const handleNext = () => {
    if (isValid) {
      setError(null);
      onNext(); // Go to Contracts
    } else {
      setError('Please fill in all required fields');
    }
  };

  return (
    <div className="space-y-8">
      {/* WHITE BOX WITH HEADER */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Personal and Billing Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Partner 1 Name" value={formData.partner1Name} onChange={e => updateFormData('partner1Name', e.target.value)} icon={User} required />
          <Input label="Partner 2 Name (Optional)" value={formData.partner2Name} onChange={e => updateFormData('partner2Name', e.target.value)} icon={User} />
          <Input label="Email Address" type="email" value={formData.email} onChange={e => updateFormData('email', e.target.value)} helperText="We'll send booking confirmations here" required />
          <Input label="Phone Number" type="tel" value={formData.phone} onChange={e => updateFormData('phone', e.target.value)} helperText="For urgent updates about your booking" required />
          <Input label="Street Address" placeholder="123 Main Street" value={formData.billingAddress} onChange={e => updateFormData('billingAddress', e.target.value)} required />
          <Input label="City" placeholder="City" value={formData.city} onChange={e => updateFormData('city', e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
              value={formData.state}
              onChange={e => updateFormData('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              required
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input label="ZIP Code" placeholder="12345" value={formData.zipCode} onChange={e => updateFormData('zipCode', e.target.value)} required />
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <label className="flex items-start space-x-3">
            <input type="checkbox" checked={formData.agreedToTerms} onChange={e => updateFormData('agreedToTerms', e.target.checked)} className="mt-1 text-rose-500" required />
            <span className="text-sm text-gray-600">
              I agree to the <a href="/terms" className="text-rose-600">Terms of Service</a> and <a href="/privacy" className="text-rose-600">Privacy Policy</a>.
            </span>
          </label>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* BUTTON — GREYED OUT UNTIL VALID */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleNext}
          icon={ArrowRight}
          disabled={!isValid || !formData.agreedToTerms}
          className={!isValid || !formData.agreedToTerms ? 'opacity-50 cursor-not-allowed' : ''}
        >
          Continue to Contracts
        </Button>
      </div>
    </div>
  );
};