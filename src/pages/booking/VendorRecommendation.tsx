import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Star, MapPin, Award, Camera, Video, Music, Users, Calendar, Check, Eye, MessageCircle, Heart, Share2, Play } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useRecommendedVendors, useVendorReviews } from '../../hooks/useSupabase';

export const VendorRecommendation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get data from previous steps
  const {
    selectedPackage,
    selectedServices,
    currentServiceIndex,
    currentService,
    eventDate,
    venue,
    region,
    languages,
    styles,
    vibes
  } = location.state || {};

  const nextService = selectedServices[currentServiceIndex + 1];

  // Get recommended vendors
  const { vendors, loading, error } = useRecommendedVendors({
    servicePackageId: selectedPackage?.id || '',
    eventDate: eventDate || '',
    region: venue?.region || region,
    languages,
    styles,
    vibes
  });

  // Get the top recommended vendor (remove duplicates)
  const uniqueVendors = vendors.filter((vendor, index, self) => 
    index === self.findIndex(v => v.id === vendor.id)
  );
  const recommendedVendor = uniqueVendors[0];

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return Camera;
      case 'Videography': return Video;
      case 'DJ Services': return Music;
      case 'Coordination': return Users;
      case 'Planning': return Calendar;
      default: return Camera;
    }
  };

  const handleBookNow = () => {
    if (recommendedVendor) {
      if (nextService) {
        // Go to next service
        navigate('/booking/congratulations', {
          state: {
            selectedServices,
            currentServiceIndex: currentServiceIndex + 1,
            selectedVendor: recommendedVendor,
            selectedPackage
          }
        });
      } else {
        // All services completed, go to final booking
        navigate('/booking/final-booking', {
          state: {
            selectedVendor: recommendedVendor,
            selectedPackage,
            eventDetails: { eventDate, venue, region }
          }
        });
      }
    }
  };

  const handleViewProfile = () => {
    // Navigate to a detailed vendor profile page
    navigate(`/vendor/${recommendedVendor.id}`, {
      state: {
        vendor: recommendedVendor,
        selectedPackage,
        returnTo: '/booking/vendor-recommendation',
        returnState: location.state
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Finding your perfect {currentService} vendor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">Error finding vendors: {error}</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const ServiceIcon = getServiceIcon(currentService);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Your Perfect {currentService} Match
              </h1>
              <p className="text-gray-600 mt-1">
                Based on your preferences, here's our top recommendation
              </p>
            </div>
          </div>
        </div>

        {uniqueVendors.length === 0 ? (
          <div className="text-center">
            <Card className="p-12 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ServiceIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Unfortunately, We Don't Have Anyone Available
              </h2>
              <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
                We don't have any {currentService.toLowerCase()} vendors available for your selected date and preferences. Please check back later as our vendor availability changes frequently.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
                <h4 className="font-semibold text-blue-900 mb-2">What you can do:</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Try a different date if possible</li>
                  <li>• Adjust your location preferences</li>
                  <li>• Check back in a few days</li>
                  <li>• Contact our support team for assistance</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  size="lg"
                >
                  Change Preferences
                </Button>
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/support')}
                >
                  Contact Support
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* You've Matched Card */}
            <Card className="p-8 text-center bg-gradient-to-br from-rose-500 to-amber-500 text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                🎉 You've Matched with {recommendedVendor.name}!
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Based on your preferences, we found the perfect {currentService.toLowerCase()} vendor for your special day.
              </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Vendor Info Card */}
              <div className="lg:col-span-2">
                <Card className="p-8">
                  <div className="flex items-start space-x-6 mb-6">
                    <img
                      src={recommendedVendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={recommendedVendor.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-rose-100"
                    />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{recommendedVendor.name}</h3>
                      <div className="flex items-center space-x-4 text-gray-600 mb-4">
                        {recommendedVendor.rating && (
                          <div className="flex items-center">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="font-medium text-lg">{recommendedVendor.rating}</span>
                          </div>
                        )}
                        <span>•</span>
                        <span>{recommendedVendor.years_experience} years experience</span>
                        {recommendedVendor.service_areas && recommendedVendor.service_areas.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{recommendedVendor.service_areas[0]}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {recommendedVendor.profile || `Professional ${currentService.toLowerCase()} specialist with ${recommendedVendor.years_experience} years of experience creating beautiful memories for couples.`}
                      </p>
                    </div>
                  </div>

                  {/* Specialties */}
                  {recommendedVendor.specialties && recommendedVendor.specialties.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {recommendedVendor.specialties.map((specialty: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio Preview */}
                  {recommendedVendor.portfolio_photos && recommendedVendor.portfolio_photos.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Recent Work</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {recommendedVendor.portfolio_photos.slice(0, 3).map((photo: string, index: number) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Portfolio ${index + 1}`}
                            className="aspect-square object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Package Summary Sidebar */}
              <div className="space-y-6">
                {/* Package Summary */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Package Summary</h3>
                  {selectedPackage && (
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600">Package:</span>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">The Basic</div>
                          <div className="font-medium text-gray-900">Photography Package</div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span className="font-medium">{currentService}</span>
                      </div>
                      {selectedPackage.hour_amount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{selectedPackage.hour_amount} hours</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-semibold border-t pt-3">
                        <span>Price:</span>
                        <span>{formatPrice(selectedPackage.price)}</span>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Other Suggested Vendors */}
                {uniqueVendors.length > 1 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Great Options</h3>
                    <div className="space-y-4">
                      {uniqueVendors.slice(1, 4).map((vendor) => (
                        <div key={vendor.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <img
                            src={vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                            alt={vendor.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                            <div className="flex items-center text-sm text-gray-600">
                              {vendor.rating && (
                                <>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                                  <span>{vendor.rating}</span>
                                  <span className="mx-2">•</span>
                                </>
                              )}
                              <span>{vendor.years_experience} years</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/vendor/${vendor.id}`, {
                              state: {
                                vendor,
                                selectedPackage,
                                returnTo: '/booking/vendor-recommendation',
                                returnState: location.state
                              }
                            })}
                          >
                            View Profile
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleBookNow}
                    >
                      Book {recommendedVendor.name}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={handleViewProfile}
                    >
                      View Full Profile
                    </Button>
                  </div>
                </Card>

                {/* Contact */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions?</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    Want to discuss your vision before booking?
                  </p>
                  <Button variant="outline" icon={MessageCircle} className="w-full mb-3">
                    Message {recommendedVendor.name}
                  </Button>
                  <div className="text-center text-xs text-gray-500">
                    Typically responds within 2 hours
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};