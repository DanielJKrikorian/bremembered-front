import React from 'react';
import { ArrowRight, Check, Clock, Star, Shield, Camera, Video, Music, Users, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { ServicePackage } from '../../types/booking';

interface PackageSummaryStepProps {
  selectedPackages: ServicePackage[];
  selectedServices: string[];
  selectedEventType: string;
  onContinueToVendors: () => void;
  onAddMoreServices: () => void;
  formatPrice: (price: number) => string;
}

export const PackageSummaryStep: React.FC<PackageSummaryStepProps> = ({
  selectedPackages,
  selectedServices,
  selectedEventType,
  onContinueToVendors,
  onAddMoreServices,
  formatPrice
}) => {
  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return Camera;
      case 'Videography': return Video;
      case 'DJ Services': return Music;
      case 'Live Musician': return Music;
      case 'Coordination': return Users;
      case 'Planning': return Calendar;
      default: return Star;
    }
  };

  const totalCost = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Perfect! Your packages are selected
        </h2>
        <p className="text-gray-600 text-lg">
          Here's what you've chosen for your {selectedEventType.toLowerCase()}
        </p>
      </div>

      {/* Selected Packages */}
      <div className="space-y-4">
        {selectedPackages.map((pkg, index) => {
          const ServiceIcon = getServiceIcon(pkg.service_type);
          return (
            <div key={pkg.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-green-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ServiceIcon className="w-6 h-6 text-green-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Selected
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{pkg.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 text-sm">Key Features</h4>
                      <div className="space-y-1">
                        {pkg.features?.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                        {(pkg.features?.length || 0) > 3 && (
                          <div className="text-sm text-gray-500">
                            +{(pkg.features?.length || 0) - 3} more features
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 text-sm">Package Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service:</span>
                          <span className="font-medium">{pkg.service_type}</span>
                        </div>
                        {pkg.hour_amount && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{pkg.hour_amount} hours</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-medium text-lg">{formatPrice(pkg.price)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Cost */}
      <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-xl p-6 text-white text-center">
        <h3 className="text-lg font-semibold mb-2">Total Package Cost</h3>
        <div className="text-4xl font-bold mb-2">{formatPrice(totalCost)}</div>
        <p className="text-rose-100">For {selectedPackages.length} service{selectedPackages.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold text-blue-900 mb-3">
          Next: Choose Your Perfect Vendors
        </h3>
        <p className="text-blue-700 mb-6">
          Now we'll help you find the ideal vendors for each service who can bring your vision to life
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            onClick={onContinueToVendors}
            className="px-8"
          >
            Find My Vendors
          </Button>
          <Button
            variant="outline"
            onClick={onAddMoreServices}
          >
            Add More Services
          </Button>
        </div>
      </div>
    </div>
  );
};