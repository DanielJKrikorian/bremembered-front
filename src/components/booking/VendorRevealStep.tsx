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
  const otherVendors = uniqueVendors.slice(1, 3);

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
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Perfect Match Found!
        </h2>
        <p className="text-gray-600">
          We found the ideal {currentService?.toLowerCase()} vendor for your {selectedEventType.toLowerCase()}
        </p>
      </div>

      {/* Main Vendor Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Vendor Info Section */}
        <div className="p-6">
          <div className="flex items-start space-x-6">
            {/* Vendor Photo */}
            <div className="relative flex-shrink-0">
              <img
                src={recommendedVendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={recommendedVendor.name}
                className="w-24 h-24 rounded-2xl object-cover shadow-lg"
              />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Vendor Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{recommendedVendor.name}</h3>
              
              {/* Info Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {recommendedVendor.rating && (
                  <div className="flex items-center bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-bold text-yellow-800">{recommendedVendor.rating}</span>
                  </div>
                )}
                <div className="flex items-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  <Award className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="font-bold text-blue-800">{recommendedVendor.years_experience} Years</span>
                </div>
                {recommendedVendor.service_areas && recommendedVendor.service_areas.length > 0 && (
                  <div className="flex items-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <MapPin className="w-4 h-4 text-emerald-600 mr-1" />
                    <span className="font-bold text-emerald-800">{recommendedVendor.service_areas[0]}</span>
                  </div>
                )}
                <div className="flex items-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                  <Shield className="w-4 h-4 text-green-600 mr-1" />
                  <span className="font-bold text-green-800">Verified</span>
                </div>
                <div className="flex items-center bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                  <Clock className="w-4 h-4 text-purple-600 mr-1" />
                  <span className="font-bold text-purple-800">Quick Response</span>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">About {recommendedVendor.name}</h4>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {recommendedVendor.profile || `Welcome! My name is ${recommendedVendor.name} and I am a professional ${currentService?.toLowerCase()} specialist based out of ${recommendedVendor.service_areas?.[0] || 'your area'}. As a storyteller, being able to capture not only the "main events", but the moments in-between, is what I strive for. I am here to make your wedding dreams a reality and to capture the magic of your special day!`}
                </p>
              </div>

              {/* Specialties */}
              {recommendedVendor.specialties && recommendedVendor.specialties.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Specialties</h4>
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
          </div>
        </div>

        {/* Package Summary Bar */}
        {selectedPackage && (
          <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg">{selectedPackage.name}</h4>
                <p className="text-rose-100 text-sm">
                  {selectedPackage.service_type} • {selectedPackage.hour_amount ? `${selectedPackage.hour_amount} hours` : 'Custom duration'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatPrice(selectedPackage.price)}</div>
                <div className="text-rose-100 text-sm">Total Package Price</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={onContinueToBooking}
            >
              Book {recommendedVendor.name}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleViewProfile}
            >
              View Full Profile
            </Button>
            <Button
              variant="outline"
              icon={MessageCircle}
              onClick={() => {}}
            >
              Message
            </Button>
          </div>
          
          <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-gray-500">
            <div className="flex items-center">
              <Check className="w-3 h-3 mr-1" />
              <span>Free cancellation</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              <span>Secure payment</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Section */}
      {recommendedVendor.portfolio_photos && recommendedVendor.portfolio_photos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900">Recent Work</h4>
            <Button
              variant="outline"
              size="sm"
              icon={Eye}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {recommendedVendor.portfolio_photos.slice(0, 3).map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Portfolio ${index + 1}`}
                className="aspect-square object-cover rounded-lg hover:scale-105 transition-transform duration-200 cursor-pointer"
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Vendors */}
      {otherVendors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Other Great Options</h4>
          <div className="space-y-3">
            {otherVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src={vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={vendor.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{vendor.name}</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    {vendor.rating && (
                      <>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="mr-2">{vendor.rating}</span>
                      </>
                    )}
                    <span>{vendor.years_experience} years</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewProfile}
                  >
                    View
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
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
      <div className="text-center">
        <Button
          variant="outline"
          onClick={onViewAllVendors}
          icon={Eye}
        >
          Browse All {currentService} Vendors
        </Button>
      </div>
    </div>
  );
};