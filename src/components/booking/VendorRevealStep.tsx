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
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Perfect Match Found!
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Based on your preferences, we found the ideal {currentService?.toLowerCase()} vendor for your {selectedEventType.toLowerCase()}
        </p>
      </div>

      {/* Main Vendor Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Heart className="w-5 h-5" />
            <span className="text-lg font-semibold">Your Perfect Vendor Match</span>
            <Heart className="w-5 h-5" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Vendor Photo - 3 columns */}
            <div className="lg:col-span-3">
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

            {/* Vendor Information - 6 columns */}
            <div className="lg:col-span-6 space-y-6">
              {/* Name and Basic Info */}
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{recommendedVendor.name}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {recommendedVendor.rating && (
                    <div className="flex items-center justify-center bg-yellow-50 px-4 py-3 rounded-xl border border-yellow-200">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-2" />
                      <span className="font-bold text-yellow-800">{recommendedVendor.rating}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center bg-blue-50 px-4 py-3 rounded-xl border border-blue-200">
                    <Award className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-bold text-blue-800">{recommendedVendor.years_experience} Years</span>
                  </div>
                  {recommendedVendor.service_areas && recommendedVendor.service_areas.length > 0 && (
                    <div className="flex items-center justify-center bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200">
                      <MapPin className="w-5 h-5 text-emerald-600 mr-2" />
                      <span className="font-bold text-emerald-800">{recommendedVendor.service_areas[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio Section - Full Width */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">About {recommendedVendor.name}</h4>
                <p className="text-gray-700 leading-relaxed text-base">
                  {recommendedVendor.profile || `Welcome! My name is ${recommendedVendor.name} and I am a professional ${currentService?.toLowerCase()} specialist based out of ${recommendedVendor.service_areas?.[0] || 'your area'}. As a storyteller, being able to capture not only the "main events", but the moments in-between, is what I strive for. I am here to make your wedding dreams a reality and to capture the magic of your special day!`}
                </p>
              </div>

              {/* Specialties */}
              {recommendedVendor.specialties && recommendedVendor.specialties.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendedVendor.specialties.map((specialty, index) => (
                      <span key={index} className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Package Summary - 3 columns */}
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl h-full">
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
                    Book This
                    <br />
                    Vendor
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full text-white hover:bg-white/10 font-medium py-2"
                    onClick={handleViewProfile}
                  >
                    View Full
                    <br />
                    Profile
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

        {/* Portfolio Section - Full Width */}
        {recommendedVendor.portfolio_photos && recommendedVendor.portfolio_photos.length > 0 && (
          <div className="px-8 pb-6">
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900">Recent Work</h4>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  View Full Portfolio
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {recommendedVendor.portfolio_photos.slice(0, 3).map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Portfolio ${index + 1}`}
                      className="aspect-square object-cover rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trust Indicators - Full Width */}
        <div className="px-8 pb-8">
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h5 className="font-bold text-green-900 mb-1">Verified</h5>
                <p className="text-sm text-green-700">Background checked & insured</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h5 className="font-bold text-blue-900 mb-1">Top Rated</h5>
                <p className="text-sm text-blue-700">Excellent customer reviews</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h5 className="font-bold text-purple-900 mb-1">Quick Response</h5>
                <p className="text-sm text-purple-700">Responds within 2 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Great Vendors */}
      {otherVendors.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-full shadow-lg">
              <h3 className="text-xl font-semibold">Other Great Options</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherVendors.map((vendor) => (
              <div key={vendor.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all group">
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={vendor.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{vendor.name}</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      {vendor.rating && (
                        <>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="mr-2">{vendor.rating}</span>
                        </>
                      )}
                      <span>{vendor.years_experience} years experience</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {vendor.profile || `Professional ${currentService?.toLowerCase()} specialist with ${vendor.years_experience} years of experience.`}
                </p>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleViewProfile}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={onContinueToBooking}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            onClick={onContinueToBooking}
            className="px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Book {recommendedVendor.name}
          </Button>
          <Button
            variant="outline"
            size="lg"
            icon={Eye}
            onClick={onViewAllVendors}
            className="px-8 py-4 text-lg"
          >
            Browse All Vendors
          </Button>
        </div>
        
        <p className="text-sm text-gray-500">
          Need to discuss your vision first? <button className="text-purple-600 hover:text-purple-700 underline">Message the vendor</button>
        </p>
      </div>
    </div>
  );
};