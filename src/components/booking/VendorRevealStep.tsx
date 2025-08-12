import React from 'react';
import { Heart, Star, MapPin, Award, Camera, Video, Music, Users, Calendar, Check, Eye, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface Vendor {
  id: string;
  name: string;
  profile_photo?: string;
  rating?: number;
  years_experience: number;
  phone?: string;
  portfolio_photos?: string[];
  portfolio_videos?: string[];
  intro_video?: string;
  specialties?: string[];
  awards?: string[];
  service_areas?: string[];
  profile?: string;
}

interface ServicePackage {
  id: string;
  service_type: string;
  name: string;
  description: string;
  price: number;
  features?: string[];
  coverage?: Record<string, any>;
  hour_amount?: number;
}

interface VendorRevealStepProps {
  selectedPackages: ServicePackage[];
  selectedServices: string[];
  selectedEventType: string;
  vendors: Vendor[];
  onContinueToBooking: () => void;
  onViewAllVendors: () => void;
  formatPrice: (price: number) => string;
}

export const VendorRevealStep: React.FC<VendorRevealStepProps> = ({
  selectedPackages,
  selectedServices,
  selectedEventType,
  vendors,
  onContinueToBooking,
  onViewAllVendors,
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

  // Remove duplicates and get unique vendors
  const uniqueVendors = vendors.filter((vendor, index, self) => 
    index === self.findIndex(v => v.id === vendor.id)
  );
  
  const recommendedVendor = uniqueVendors[0];
  const otherVendors = uniqueVendors.slice(1, 4);

  if (!recommendedVendor) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          No Vendors Available
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't find vendors available for your selected date and preferences, but we have other great options.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Adjust Preferences
          </Button>
          <Button
            variant="primary"
            onClick={onViewAllVendors}
          >
            View All Vendors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Perfect! We Found Your Dream Team!
        </h2>
        <p className="text-gray-600 text-lg">
          Based on your preferences, here are the ideal vendors for your {selectedEventType.toLowerCase()}
        </p>
      </div>

      {/* Recommended Vendor Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-purple-200 overflow-hidden">
        {/* Recommended Badge */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Heart className="w-5 h-5" />
            <span className="font-semibold">Your Perfect Vendor Match</span>
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Vendor Header */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Vendor Photo */}
                    <div className="lg:col-span-1">
                      <div className="relative">
                        <img
                          src={recommendedVendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={recommendedVendor.name}
                          className="w-full aspect-square rounded-2xl object-cover border-4 border-rose-100 shadow-lg"
                        />
                        <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                          <Heart className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Vendor Info */}
                    <div className="lg:col-span-2">
                      <div className="mb-6">
                        <h3 className="text-3xl font-bold text-gray-900 mb-3">{recommendedVendor.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                          {recommendedVendor.rating && (
                            <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-medium">{recommendedVendor.rating}</span>
                            </div>
                          )}
                          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                            <span className="font-medium">{recommendedVendor.years_experience} years experience</span>
                          </div>
                          {recommendedVendor.service_areas && recommendedVendor.service_areas.length > 0 && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="font-medium">{recommendedVendor.service_areas[0]}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed">
                          {recommendedVendor.profile || `Professional ${selectedServices[0]?.toLowerCase()} specialist with ${recommendedVendor.years_experience} years of experience creating beautiful memories for couples.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  {recommendedVendor.specialties && recommendedVendor.specialties.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-xl font-semibold text-gray-900 mb-4">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {recommendedVendor.specialties.map((specialty, index) => (
                          <span key={index} className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio Preview */}
                  {recommendedVendor.portfolio_photos && recommendedVendor.portfolio_photos.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-semibold text-gray-900">Recent Work</h4>
                        <Button variant="outline" size="sm" icon={Eye}>
                          View Full Portfolio
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        {recommendedVendor.portfolio_photos.slice(0, 3).map((photo: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo}
                              alt={`Portfolio ${index + 1}`}
                              className="aspect-square object-cover rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
            </div>

            {/* Package Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-8 text-white sticky top-4">
                <h4 className="text-xl font-semibold mb-6">Your Package</h4>
                {selectedPackages.map((pkg, index) => (
                  <div key={pkg.id} className="mb-6 last:mb-0">
                    <div className="mb-3">
                      <div className="text-lg font-semibold">{pkg.service_type}</div>
                      <div className="text-2xl font-bold">{formatPrice(pkg.price)}</div>
                    </div>
                    <p className="text-purple-100">{pkg.name}</p>
                  </div>
                ))}
                
                <div className="border-t border-white/20 pt-6 mt-6">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>{formatPrice(selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0))}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-2 border-white text-white hover:bg-white hover:text-purple-600 font-semibold"
                    onClick={onContinueToBooking}
                  >
                    Book This Vendor
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Great Vendors */}
      {otherVendors.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full">
              <h3 className="text-xl font-semibold">Other Great Vendors</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {otherVendors.map((vendor) => (
              <div key={vendor.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 p-8 hover:border-purple-300 hover:shadow-lg transition-all group">
                <div className="flex items-center space-x-4 mb-6">
                  <img
                    src={vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={vendor.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-xl">{vendor.name}</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      {vendor.rating && (
                        <>
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-medium">{vendor.rating}</span>
                          <span className="mx-2">•</span>
                        </>
                      )}
                      <span className="font-medium">{vendor.years_experience} years</span>
                    </div>
                  </div>
                </div>
                
                {vendor.specialties && vendor.specialties.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-1">
                      {vendor.specialties.slice(0, 2).map((specialty, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600 group-hover:shadow-md transition-all font-semibold"
                  onClick={() => {
                    // Switch to this vendor as the recommended one
                    // This would update the recommended vendor state
                    const modal = document.querySelector('[data-modal-content]');
                    if (modal) {
                      modal.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  Select This Vendor
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};