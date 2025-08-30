import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Check, AlertCircle, DollarSign, Clock, Star, CreditCard, ArrowRight } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useServicePackages } from '../../hooks/useSupabase';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PackageUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onUpgradeSuccess: () => void;
}

const UpgradePaymentForm: React.FC<{
  upgradeAmount: number;
  selectedPackage: any;
  currentPackage: any;
  onSuccess: () => void;
  onCancel: () => void;
  booking: any;
}> = ({ upgradeAmount, selectedPackage, currentPackage, onSuccess, onCancel, booking }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !agreedToTerms) {
      setError('Please complete all required fields');
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
      // Create payment intent for upgrade
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-upgrade-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          upgradeAmount,
          newPackageId: selectedPackage.id,
          currentPackageId: currentPackage.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: booking.couples?.name || 'Wedding Customer',
            email: booking.couples?.email || ''
          }
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (err) {
      console.error('Upgrade payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upgrade Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h4 className="font-semibold text-purple-900 mb-4">Upgrade Summary</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-purple-700">Current Package:</span>
            <span className="font-medium">{currentPackage.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">Upgrading to:</span>
            <span className="font-medium">{selectedPackage.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">Current Price:</span>
            <span className="font-medium">{formatPrice(currentPackage.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">New Price:</span>
            <span className="font-medium">{formatPrice(selectedPackage.price)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-3">
            <span className="text-purple-900">Upgrade Cost:</span>
            <span className="text-purple-900">{formatPrice(upgradeAmount)}</span>
          </div>
        </div>
      </div>

      {/* Card Payment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Information
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

      {/* Upgrade Terms */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-3">Package Upgrade Terms</h4>
        <div className="text-sm text-amber-800 space-y-2">
          <p>• Package upgrades are final and cannot be reversed</p>
          <p>• The upgrade amount will be split between vendor and platform according to our current payment model</p>
          <p>• Your remaining balance will be recalculated based on the new package price</p>
          <p>• All upgrade payments are non-refundable</p>
          <p>• The vendor will be notified of the upgrade and any service changes</p>
        </div>
        
        <label className="flex items-start space-x-3 mt-4">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 text-purple-500 focus:ring-purple-500"
            required
          />
          <span className="text-sm text-amber-800">
            I understand and agree to the package upgrade terms listed above
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !stripe || !elements || !agreedToTerms}
          loading={loading}
          className="flex-1"
          icon={CreditCard}
        >
          {loading ? 'Processing...' : `Pay ${formatPrice(upgradeAmount)}`}
        </Button>
      </div>
    </form>
  );
};

export const PackageUpgradeModal: React.FC<PackageUpgradeModalProps> = ({
  isOpen,
  onClose,
  booking,
  onUpgradeSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [upgradeAmount, setUpgradeAmount] = useState(0);

  // Get available packages for the same service type
  const { packages, loading: packagesLoading } = useServicePackages(
    booking?.service_type,
    booking?.service_packages?.event_type
  );

  // Filter packages that are more expensive than current package
  const upgradePackages = packages.filter(pkg => 
    pkg.id !== booking?.service_packages?.id && 
    pkg.price > (booking?.service_packages?.price || booking?.amount)
  );

  useEffect(() => {
    if (selectedPackage && booking?.service_packages) {
      const priceDifference = selectedPackage.price - booking.service_packages.price;
      setUpgradeAmount(priceDifference);
    }
  }, [selectedPackage, booking]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const getPackageCoverage = (coverage: Record<string, any>) => {
    if (!coverage || typeof coverage !== 'object') return [];
    
    const events = [];
    if (coverage.events && Array.isArray(coverage.events)) {
      events.push(...coverage.events);
    }
    
    Object.keys(coverage).forEach(key => {
      if (key !== 'events' && coverage[key] === true) {
        events.push(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    });
    
    return events;
  };

  const handlePackageSelect = (pkg: any) => {
    setSelectedPackage(pkg);
    setCurrentStep(2);
  };

  const handleUpgradeSuccess = () => {
    onUpgradeSuccess();
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setCurrentStep(1);
    setSelectedPackage(null);
    setUpgradeAmount(0);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Upgrade Package</h3>
              <p className="text-sm text-gray-600">
                {currentStep === 1 ? 'Choose a better package' : 'Complete your upgrade'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Package Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Current Package */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Your Current Package</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-lg font-medium text-gray-900">{booking.service_packages?.name}</h5>
                    <p className="text-gray-600 text-sm">{booking.service_packages?.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                      {booking.service_packages?.hour_amount && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{booking.service_packages.hour_amount} hours</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {formatPrice(booking.service_packages?.price || booking.amount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Upgrades */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Available Upgrades</h4>
                
                {packagesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading upgrade options...</p>
                  </div>
                ) : upgradePackages.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">No upgrades available</h5>
                    <p className="text-gray-600">
                      You already have the highest tier package for {booking.service_type}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upgradePackages.map((pkg) => {
                      const priceDifference = pkg.price - (booking.service_packages?.price || booking.amount);
                      const packageCoverage = getPackageCoverage(pkg.coverage || {});
                      
                      return (
                        <div
                          key={pkg.id}
                          className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer"
                          onClick={() => handlePackageSelect(pkg)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h5 className="text-lg font-semibold text-gray-900">{pkg.name}</h5>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Upgrade
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Features */}
                                {pkg.features && pkg.features.length > 0 && (
                                  <div>
                                    <h6 className="font-medium text-gray-900 mb-2">Features</h6>
                                    <div className="space-y-1">
                                      {pkg.features.slice(0, 4).map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                          <Check className="w-3 h-3 text-green-600" />
                                          <span className="text-sm text-gray-700">{feature}</span>
                                        </div>
                                      ))}
                                      {pkg.features.length > 4 && (
                                        <div className="text-sm text-gray-500">
                                          +{pkg.features.length - 4} more features
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Coverage */}
                                {packageCoverage.length > 0 && (
                                  <div>
                                    <h6 className="font-medium text-gray-900 mb-2">Coverage</h6>
                                    <div className="space-y-1">
                                      {packageCoverage.slice(0, 4).map((coverage, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                          <Check className="w-3 h-3 text-blue-600" />
                                          <span className="text-sm text-gray-700">{coverage}</span>
                                        </div>
                                      ))}
                                      {packageCoverage.length > 4 && (
                                        <div className="text-sm text-gray-500">
                                          +{packageCoverage.length - 4} more events
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-4">
                                {pkg.hour_amount && (
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>{pkg.hour_amount} hours</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right ml-6">
                              <div className="text-xl font-bold text-gray-900 mb-1">
                                {formatPrice(pkg.price)}
                              </div>
                              <div className="text-sm text-green-600 font-medium">
                                +{formatPrice(priceDifference)} upgrade
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                className="mt-3"
                                icon={ArrowRight}
                              >
                                Select Upgrade
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {currentStep === 2 && selectedPackage && (
            <Elements stripe={stripePromise}>
              <UpgradePaymentForm
                upgradeAmount={upgradeAmount}
                selectedPackage={selectedPackage}
                currentPackage={booking.service_packages}
                onSuccess={handleUpgradeSuccess}
                onCancel={() => setCurrentStep(1)}
                booking={booking}
              />
            </Elements>
          )}
        </div>
      </Card>
    </div>
  );
};