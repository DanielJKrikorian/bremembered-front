import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Star, Check, Tag, Sparkles, Clock, Users, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useBooking } from '../../context/BookingContext';
import { useServicePackages } from '../../hooks/useSupabase';
import { ServicePackage } from '../../types/booking';

export const PackageSelection: React.FC = () => {
  const navigate = useNavigate();
  const { state, setServicePackage, setCurrentServiceIndex } = useBooking();
  const { packages, loading, error } = useServicePackages(state.selectedServices);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  
  // Get current service being processed
  const currentService = state.selectedServices[state.currentServiceIndex];
  const isLastService = state.currentServiceIndex === state.selectedServices.length - 1;

  const handlePackageSelect = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setServicePackage(currentService, pkg);
  };

  const handleContinue = () => {
    if (selectedPackage) {
      // Move to vendor selection for this service
      navigate('/booking/vendors');
    }
  };

  const getDiscountPercentage = (originalPrice: number, currentPrice: number) => {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  const groupedPackages = packages.reduce((acc, pkg) => {
    const serviceType = pkg.service_type;
    if (!acc[serviceType]) {
      acc[serviceType] = [];
    }
    acc[serviceType].push(pkg);
    return acc;
  }, {} as Record<string, ServicePackage[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">Error loading packages: {error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => navigate('/booking/event-details')}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Choose {currentService} Package
              </h1>
              <p className="text-gray-600 mt-1">
                Step {state.currentServiceIndex + 1} of {state.selectedServices.length}: {currentService}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Event Details</span>
            </div>
            <div className="w-16 h-1 bg-rose-500 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-rose-600">Package Selection</span>
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">Vendor Selection</span>
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <span className="ml-2 text-sm text-gray-500">Checkout</span>
            </div>
          </div>
        </div>

        {/* Package Grid */}
        <div>
          {/* Current Service Packages */}
          {groupedPackages[currentService] && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedPackages[currentService].map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const estimatedOriginalPrice = Math.round(pkg.price * 1.3);
                const discountPercentage = getDiscountPercentage(estimatedOriginalPrice, pkg.price);
                
                return (
                  <Card 
                    key={pkg.id} 
                    className={`
                      relative overflow-hidden cursor-pointer transition-all
                      ${isSelected 
                        ? 'ring-2 ring-rose-500 shadow-xl' 
                        : 'hover:shadow-lg'
                      }
                    `}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center z-10">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {discountPercentage > 0 && (
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Save {discountPercentage}%
                      </div>
                    )}

                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{pkg.description}</p>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-bold text-gray-900">
                            ${pkg.price.toLocaleString()}
                          </span>
                          {discountPercentage > 0 && (
                            <span className="text-lg text-gray-500 line-through">
                              ${estimatedOriginalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Deposit: ${Math.round(pkg.price * 0.5).toLocaleString()} (50%)
                        </div>
                        {pkg.hour_amount && (
                          <div className="text-sm text-gray-600">
                            {pkg.hour_amount} hours coverage
                          </div>
                        )}
                      </div>

                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">What's Included:</h4>
                        <div className="space-y-2">
                          {pkg.features?.slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                          {pkg.features && pkg.features.length > 4 && (
                            <div className="text-sm text-gray-500">
                              +{pkg.features.length - 4} more features
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{pkg.hour_amount || 8}h</span>
                          </div>
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            <span>Insured</span>
                          </div>
                        </div>
                        {pkg.event_type && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {pkg.event_type}
                          </span>
                        )}
                      </div>

                      <Button
                        variant={isSelected ? "primary" : "outline"}
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePackageSelect(pkg);
                        }}
                      >
                        {isSelected ? 'Selected' : 'Select Package'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* No packages found */}
          {!groupedPackages[currentService] && (
            <Card className="p-12 text-center">
              <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any {currentService.toLowerCase()} packages. Contact us for custom options.
              </p>
              <Button variant="primary" onClick={() => navigate('/booking/event-details')}>
                Go Back
              </Button>
            </Card>
          )}
        </div>

        {/* Continue Button */}
        {selectedPackage && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {currentService} package selected
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedPackage.name} - ${selectedPackage.price.toLocaleString()}
                </p>
              </div>
              <Button
                variant="primary"
      </div>
    </div>
  );
};