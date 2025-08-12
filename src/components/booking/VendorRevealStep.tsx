import React from 'react';
import { Heart, Star, MapPin, Award, Camera, Video, Music, Users, Calendar, Check, Eye, MessageCircle, ArrowRight, Clock, Shield, Sparkles } from 'lucide-react';
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

  const selectedPackage = selectedPackages[0];
  const currentService = selectedServices[0];

  const handleViewProfile = () => {
    // Handle view profile logic
  };

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
    <div className="space-y-8">
      {/* Main Vendor Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Vendor Photo */}
            <div className="lg:w-1/3">
              <div className="relative">
                <img
                  src={recommendedVendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={recommendedVendor.name}
                  className="w-full aspect-square object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Middle Column - Vendor Info */}
            <div className="lg:w-1/3 space-y-6">
              {/* Vendor Name & Basic Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{recommendedVendor.name}</h3>
                <div className="space-y-2">
                  {recommendedVendor.rating && (
                    <div className="flex items-center bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-2" />
                      <span className="font-semibold text-yellow-800">{recommendedVendor.rating} Rating</span>
                    </div>
                  )}
                  <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <Award className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="font-semibold text-blue-800">{recommendedVendor.years_experience} Years Experience</span>
                  </div>
                  {recommendedVendor.service_areas && recommendedVendor.service_areas.length > 0 && (
                    <div className="flex items-center bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                      <MapPin className="w-4 h-4 text-emerald-600 mr-2" />
                      <span className="font-semibold text-emerald-800">{recommendedVendor.service_areas[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-gray-700 leading-relaxed">
                  {recommendedVendor.profile || `Professional ${currentService?.toLowerCase()} specialist with ${recommendedVendor.years_experience} years of experience creating beautiful memories for couples.`}
                </p>
              </div>

              {/* Specialties */}
              {recommendedVendor.specialties && recommendedVendor.specialties.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendedVendor.specialties.map((specialty, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Package Summary */}
            <div className="lg:w-1/3">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl p-6 text-white shadow-xl h-full">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Your Package</h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-100 mb-1">{selectedPackage?.service_type}</div>
                    <div className="text-lg font-bold text-white mb-1">{selectedPackage?.name}</div>
                    {selectedPackage?.hour_amount && (
                      <div className="text-purple-200 text-sm">{selectedPackage.hour_amount} hours coverage</div>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-white/20 pt-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {formatPrice(selectedPackage?.price || 0)}
                    </div>
                    <div className="text-purple-200 text-sm">Total Package Price</div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-2 border-white text-white hover:bg-white hover:text-purple-600 font-semibold py-3"
                    onClick={onContinueToBooking}
                  >
                    Book This Vendor
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full text-white hover:bg-white/10 font-medium py-2"
                    onClick={handleViewProfile}
                  >
                    View Full Profile
                  </Button>
                </div>
                
                <div className="pt-4 border-t border-white/20">
                  <div className="text-center text-purple-100 text-xs space-y-1">
                    <p className="flex items-center justify-center">
                      <Check className="w-3 h-3 mr-1" />
                      Free cancellation up to 30 days
                    </p>
                    <p className="flex items-center justify-center">
                      <Shield className="w-3 h-3 mr-1" />
                      Secure payment processing
                    </p>
                    <p className="flex items-center justify-center">
                      <Clock className="w-3 h-3 mr-1" />
                      24/7 customer support
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Section - Full Width Below */}
        {recommendedVendor.portfolio_photos && recommendedVendor.portfolio_photos.length > 0 && (
          <div className="px-6 pb-6">
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">Recent Work</h4>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  View Full Portfolio
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {recommendedVendor.portfolio_photos.slice(0, 3).map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Portfolio ${index + 1}`}
                    className="aspect-square object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trust Indicators - Full Width Below */}
        <div className="px-6 pb-6">
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h5 className="font-semibold text-green-900 text-sm mb-1">Verified</h5>
                <p className="text-xs text-green-700">Background checked</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h5 className="font-semibold text-blue-900 text-sm mb-1">Top Rated</h5>
                <p className="text-xs text-blue-700">Excellent reviews</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h5 className="font-semibold text-purple-900 text-sm mb-1">Quick Response</h5>
                <p className="text-xs text-purple-700">Within 2 hours</p>
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
                          <span className="mr-3">{vendor.rating}</span>
                        </>
                      )}
                      <span>{vendor.years_experience} years experience</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};