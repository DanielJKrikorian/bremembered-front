import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Check, AlertCircle, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useServicePackages } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';

interface PackageUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onUpgradeSuccess: (updatedBooking: any) => void;
}

export const PackageUpgradeModal: React.FC<PackageUpgradeModalProps> = ({
  isOpen,
  onClose,
  booking,
  onUpgradeSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [upgradeAmount, setUpgradeAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Get available packages for the same service type
  const { packages, loading: packagesLoading } = useServicePackages(
    booking?.service_type,
    booking?.service_packages?.event_type
  );

  // Filter packages that are more expensive than current package
  const upgradePackages = packages.filter(
    (pkg) =>
      pkg.id !== booking?.service_packages?.id &&
      pkg.price > (booking?.service_packages?.price || booking?.amount)
  );

  // Calculate upgrade amount
  useEffect(() => {
    if (selectedPackage && booking?.service_packages) {
      const priceDifference = selectedPackage.price - booking.service_packages.price;
      setUpgradeAmount(priceDifference);
    }
  }, [selectedPackage, booking]);

  // Real-time subscription for booking updates
  useEffect(() => {
    const subscription = supabase
      .channel('bookings-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${booking.id}` },
        (payload) => {
          console.log('Booking updated:', payload);
          supabase
            .from('bookings')
            .select(`
              *,
              events(start_time, end_time),
              service_packages(*),
              vendors(name, profile_photo),
              payments!payments_booking_id_fkey(id, amount, payment_type, created_at, tip, status)
            `)
            .eq('id', booking.id)
            .single()
            .then(({ data, error }) => {
              if (!error) onUpgradeSuccess(data);
            });
        }
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [booking.id, onUpgradeSuccess]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price / 100);
  };

  const formatDuration = (hours: number) => {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'TBD';
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York',
      });
    } catch {
      return 'TBD';
    }
  };

  const getPackageCoverage = (coverage: Record<string, any>) => {
    if (!coverage || typeof coverage !== 'object') return [];
    const events = [];
    if (coverage.events && Array.isArray(coverage.events)) {
      events.push(...coverage.events);
    }
    Object.keys(coverage).forEach((key) => {
      if (key !== 'events' && coverage[key] === true) {
        events.push(key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()));
      }
    });
    return events;
  };

  const handlePackageSelect = (pkg: any) => {
    setSelectedPackage(pkg);
    setCurrentStep(2);
    setAgreedToTerms(false);
  };

  const handleConfirmUpgrade = async () => {
    if (!agreedToTerms) {
      setError('Please agree to the upgrade terms');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Validate inputs
      if (!booking?.id || !selectedPackage?.id || !booking?.service_packages?.id) {
        throw new Error('Missing required booking or package data');
      }

      // Calculate price difference and share updates
      const oldPackagePrice = booking.service_packages?.price || booking.amount;
      const priceDifference = selectedPackage.price - oldPackagePrice;
      if (priceDifference <= 0) {
        throw new Error('Selected package is not an upgrade');
      }
      const shareIncrease = Math.round(priceDifference / 2);
      const newVendorFinalShare = (booking.vendor_final_share || 0) + shareIncrease;
      const newPlatformFinalShare = (booking.platform_final_share || 0) + shareIncrease;
      const newFinalPayment = (booking.final_payment || 0) + priceDifference;

      // Calculate new end_time
      const startTime = new Date(booking.events.start_time);
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid event start time');
      }
      const newEndTime = new Date(startTime.getTime() + selectedPackage.hour_amount * 60 * 60 * 1000);

      // Fetch user_id for couple and vendor
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('user_id')
        .eq('id', booking.couple_id)
        .single();
      if (coupleError || !coupleData) {
        throw new Error(`Failed to fetch couple user_id: ${coupleError?.message || 'No couple found'}`);
      }

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('user_id')
        .eq('id', booking.vendor_id)
        .single();
      if (vendorError || !vendorData) {
        throw new Error(`Failed to fetch vendor user_id: ${vendorError?.message || 'No vendor found'}`);
      }

      // Update bookings table
      const { data: updatedBookingData, error: bookingError } = await supabase
        .from('bookings')
        .update({
          package_id: selectedPackage.id,
          amount: selectedPackage.price,
          final_payment: newFinalPayment,
          vendor_final_share: newVendorFinalShare,
          platform_final_share: newPlatformFinalShare,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .select()
        .single();
      if (bookingError || !updatedBookingData) {
        throw new Error(`Failed to update booking: ${bookingError?.message || 'Unknown error'}`);
      }
      console.log('Booking updated:', updatedBookingData);

      // Update events table
      const { error: eventError } = await supabase
        .from('events')
        .update({
          end_time: newEndTime.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.events.id);
      if (eventError) throw new Error(`Failed to update event time: ${eventError.message}`);

      // Fetch updated booking data
      const { data: updatedBooking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          events(start_time, end_time),
          service_packages(*),
          vendors(name, profile_photo),
          payments!payments_booking_id_fkey(id, amount, payment_type, created_at, tip, status)
        `)
        .eq('id', booking.id)
        .single();
      if (fetchError) throw new Error(`Failed to fetch updated booking: ${fetchError.message}`);

      // Notify couple
      const { error: coupleNotificationError } = await supabase.from('notifications').insert({
        user_id: coupleData.user_id,
        type: 'booking_update',
        title: 'Package Upgraded',
        message: `Your ${selectedPackage.service_type} package has been upgraded to "${
          selectedPackage.name
        }". The duration has been updated to ${formatDuration(
          selectedPackage.hour_amount
        )} (until ${formatTime(newEndTime.toISOString())}). The updated total of ${formatPrice(
          selectedPackage.price
        )} (including ${formatPrice(priceDifference)} upgrade) will be due with your final payment.`,
        data: {
          booking_id: booking.id,
          old_package_id: booking.service_packages?.id,
          new_package_id: selectedPackage.id,
          upgrade_amount: priceDifference,
        },
        priority: 'normal',
      });
      if (coupleNotificationError) {
        console.warn('Failed to create couple notification:', coupleNotificationError);
      }

      // Notify vendor
      const { error: vendorNotificationError } = await supabase.from('notifications').insert({
        user_id: vendorData.user_id,
        type: 'booking_update',
        title: 'Package Upgraded',
        message: `Booking ${booking.id} has been upgraded to package "${
          selectedPackage.name
        }" with a duration of ${formatDuration(
          selectedPackage.hour_amount
        )} (until ${formatTime(newEndTime.toISOString())}). The updated payout of ${formatPrice(
          newVendorFinalShare
        )} will be processed with the final payment.`,
        data: {
          booking_id: booking.id,
          new_package_id: selectedPackage.id,
          vendor_final_share: newVendorFinalShare,
        },
        priority: 'normal',
      });
      if (vendorNotificationError) {
        console.warn('Failed to create vendor notification:', vendorNotificationError);
      }

      onUpgradeSuccess(updatedBooking);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error upgrading package:', error);
      setError(error instanceof Error ? error.message : 'Failed to upgrade package');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setSelectedPackage(null);
    setUpgradeAmount(0);
    setError(null);
    setAgreedToTerms(false);
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
                {currentStep === 1
                  ? 'Choose a better package'
                  : currentStep === 2
                  ? 'Confirm your upgrade'
                  : 'Upgrade confirmed'}
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
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {/* Current Package */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Your Current Package</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-lg font-medium text-gray-900">
                      {booking.service_packages?.name || 'Current Package'}
                    </h5>
                    <p className="text-gray-600 text-sm">{booking.service_packages?.description || 'N/A'}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                      {booking.service_packages?.hour_amount && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{formatDuration(booking.service_packages.hour_amount)}</span>
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
                      const priceDifference =
                        pkg.price - (booking.service_packages?.price || booking.amount);
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
                                      {pkg.features.slice(0, 4).map((feature: string, index: number) => (
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
                                      {packageCoverage
                                        .slice(0, 4)
                                        .map((coverage: string, index: number) => (
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
                                    <span>{formatDuration(pkg.hour_amount)}</span>
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
                                disabled={loading}
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

          {/* Step 2: Confirmation with Terms */}
          {currentStep === 2 && selectedPackage && (
            <div className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h4 className="font-semibold text-purple-900 mb-4">Confirm Upgrade</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Current Package:</span>
                    <span className="font-medium">{booking.service_packages?.name || 'Current Package'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Upgraded to:</span>
                    <span className="font-medium">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Previous Price:</span>
                    <span className="font-medium">
                      {formatPrice(booking.service_packages?.price || booking.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">New Price:</span>
                    <span className="font-medium">{formatPrice(selectedPackage.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">New Duration:</span>
                    <span className="font-medium">{formatDuration(selectedPackage.hour_amount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-3">
                    <span className="text-purple-900">Upgrade Cost:</span>
                    <span className="text-purple-900">{formatPrice(upgradeAmount)}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-4">
                    The updated total of {formatPrice(selectedPackage.price)} will be due with your final
                    payment. The booking duration will be updated to{' '}
                    {formatDuration(selectedPackage.hour_amount)}.
                  </div>
                </div>
              </div>
              {/* Upgrade Terms */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-3">Package Upgrade Terms</h4>
                <div className="text-sm text-amber-800 space-y-2">
                  <p>• Package upgrades are final and cannot be reversed</p>
                  <p>• The updated package amount will be included in your final payment</p>
                  <p>• The vendor will be notified of the upgrade and any service changes</p>
                  <p>• Your booking duration will be updated based on the new package</p>
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
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmUpgrade}
                  className="flex-1"
                  icon={Check}
                  disabled={loading || !agreedToTerms}
                  loading={loading}
                >
                  Confirm Upgrade
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {currentStep === 3 && selectedPackage && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-4">Upgrade Confirmed</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Previous Package:</span>
                    <span className="font-medium">{booking.service_packages?.name || 'Previous Package'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">New Package:</span>
                    <span className="font-medium">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">New Price:</span>
                    <span className="font-medium">{formatPrice(selectedPackage.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">New Duration:</span>
                    <span className="font-medium">{formatDuration(selectedPackage.hour_amount)}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-4">
                    Your package has been upgraded successfully. The updated total of{' '}
                    {formatPrice(selectedPackage.price)} will be due with your final payment.
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="primary" onClick={handleClose} className="flex-1" icon={Check}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};