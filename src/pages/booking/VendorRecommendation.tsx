import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Star, MapPin, Award, Camera, Video, Music, Users, Calendar, Check, Eye, MessageCircle, Heart, Share2, Play } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useRecommendedVendors, useVendorReviews } from '../../hooks/useSupabase';

export const VendorRecommendation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews'>('overview');

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

  const recommendedVendor = vendors[0]; // Top recommended vendor

  // Get reviews for the recommended vendor
  const { reviews, loading: reviewsLoading } = useVendorReviews(recommendedVendor?.id || '');

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

  const handleSelectVendor = (vendor: any) => {
    setSelectedVendor(vendor);
  };

  const handleContinue = () => {
    if (selectedVendor) {
      if (nextService) {
        // Go to next service
        navigate('/booking/congratulations', {
          state: {
            selectedServices,
            currentServiceIndex: currentServiceIndex + 1,
            selectedVendor,
            selectedPackage
          }
        });
      } else {
        // All services completed, go to final booking
        navigate('/booking/final-booking', {
          state: {
            selectedVendor,
            selectedPackage,
            eventDetails: { eventDate, venue, region }
          }
        });
      }
    }
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {vendors.length === 0 ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Vendor Card */}
            <div className="lg:col-span-2">
              {recommendedVendor && (
                <Card className="overflow-hidden relative">
                  {/* Recommended Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-4 py-2 rounded-full shadow-lg">
                      <Star className="w-4 h-4" />
                      <span className="font-semibold text-sm">Perfect Match</span>
                    </div>
                  </div>

                  {/* Vendor Header */}
                  <div className="relative">
                    {recommendedVendor.portfolio_photos && recommendedVendor.portfolio_photos[0] ? (
                      <div className="h-64 bg-gradient-to-r from-rose-500 to-amber-500 relative">
                        <img
                          src={recommendedVendor.portfolio_photos[0]}
                          alt="Portfolio"
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </div>
                    ) : (
                      <div className="h-64 bg-gradient-to-r from-rose-500 to-amber-500"></div>
                    )}
                    
                    <div className="absolute bottom-6 left-6 flex items-end space-x-4">
                      <img
                        src={recommendedVendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={recommendedVendor.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div className="text-white">
                        <h2 className="text-2xl font-bold mb-1">{recommendedVendor.name}</h2>
                        <div className="flex items-center space-x-4">
                          {recommendedVendor.rating && (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-medium">{recommendedVendor.rating}</span>
                            </div>
                          )}
                          <span>{recommendedVendor.years_experience} years experience</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vendor Details */}
                  <div className="p-8">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="-mb-px flex space-x-8">
                        {[
                          { key: 'overview', label: 'Overview' },
                          { key: 'portfolio', label: 'Portfolio' },
                          { key: 'reviews', label: 'Reviews' }
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                              activeTab === tab.key
                                ? 'border-rose-500 text-rose-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-3">About</h3>
                          <p className="text-gray-600 leading-relaxed">
                            {recommendedVendor.profile || `Professional ${currentService.toLowerCase()} specialist with ${recommendedVendor.years_experience} years of experience creating beautiful memories for couples.`}
                          </p>
                        </div>

                        {recommendedVendor.specialties && recommendedVendor.specialties.length > 0 && (
                          <div>
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

                        {recommendedVendor.awards && recommendedVendor.awards.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Awards & Recognition</h4>
                            <div className="space-y-2">
                              {recommendedVendor.awards.map((award: string, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Award className="w-4 h-4 text-amber-500" />
                                  <span className="text-gray-700">{award}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'portfolio' && (
                      <div className="space-y-6">
                        {recommendedVendor.portfolio_photos && recommendedVendor.portfolio_photos.length > 0 && (
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Photo Portfolio</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {recommendedVendor.portfolio_photos.slice(0, 6).map((photo: string, index: number) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Portfolio ${index + 1}`}
                                  className="aspect-square object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {recommendedVendor.portfolio_videos && recommendedVendor.portfolio_videos.length > 0 && (
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Video Portfolio</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {recommendedVendor.portfolio_videos.slice(0, 4).map((video: string, index: number) => (
                                <div key={index} className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                                  <img
                                    src={video}
                                    alt={`Video ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                      <Play className="w-6 h-6 text-gray-900 ml-1" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {recommendedVendor.intro_video && (
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Introduction Video</h3>
                            <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden max-w-md">
                              <img
                                src={recommendedVendor.intro_video}
                                alt="Introduction"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'reviews' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-gray-900">Customer Reviews</h3>
                          {recommendedVendor.rating && (
                            <div className="flex items-center space-x-2">
                              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                              <span className="text-lg font-semibold">{recommendedVendor.rating}</span>
                              <span className="text-gray-600">({reviews.length} reviews)</span>
                            </div>
                          )}
                        </div>

                        {reviewsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-gray-600">Loading reviews...</p>
                          </div>
                        ) : reviews.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No reviews yet for this vendor.</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Rating Breakdown */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                  {(reviews.reduce((sum, r) => sum + (r.communication_rating || 0), 0) / reviews.length).toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Communication</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                  {(reviews.reduce((sum, r) => sum + (r.experience_rating || 0), 0) / reviews.length).toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Experience</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                  {(reviews.reduce((sum, r) => sum + (r.quality_rating || 0), 0) / reviews.length).toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Quality</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                  {(reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length).toFixed(1)}
                                </div>
                                <div className="text-sm text-gray-600">Overall</div>
                              </div>
                            </div>

                            {/* Individual Reviews */}
                            <div className="space-y-6">
                              {reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-200 pb-6">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-700">
                                          {review.couples?.name ? review.couples.name.charAt(0).toUpperCase() : 'A'}
                                        </span>
                                      </div>
                                      <div>
                                        <h5 className="font-medium text-gray-900">
                                          {review.couples?.name || 'Anonymous'} 
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 ml-2">
                                            <Check className="w-3 h-3 mr-1" />
                                            Verified Couple
                                          </span>
                                        </h5>
                                        <p className="text-sm text-gray-500">
                                          {review.couples?.wedding_date 
                                            ? `Wedding: ${new Date(review.couples.wedding_date).toLocaleDateString()}`
                                            : new Date(review.created_at).toLocaleDateString()
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      {review.overall_rating && [...Array(review.overall_rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Rating Details */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                                    <div className="flex items-center space-x-1">
                                      <span className="text-gray-500">Communication:</span>
                                      <span className="font-medium">{review.communication_rating}/5</span>
                                    </div>
                                    {review.experience_rating && (
                                      <div className="flex items-center space-x-1">
                                        <span className="text-gray-500">Experience:</span>
                                        <span className="font-medium">{review.experience_rating}/5</span>
                                      </div>
                                    )}
                                    {review.quality_rating && (
                                      <div className="flex items-center space-x-1">
                                        <span className="text-gray-500">Quality:</span>
                                        <span className="font-medium">{review.quality_rating}/5</span>
                                      </div>
                                    )}
                                    {review.overall_rating && (
                                      <div className="flex items-center space-x-1">
                                        <span className="text-gray-500">Overall:</span>
                                        <span className="font-medium">{review.overall_rating}/5</span>
                                      </div>
                                    )}
                                  </div>

                                  {review.feedback && (
                                    <p className="text-gray-600 mb-3">{review.feedback}</p>
                                  )}
                                  
                                  {review.vendor_response && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                      <h6 className="font-medium text-blue-900 mb-2">Vendor Response:</h6>
                                      <p className="text-blue-800 text-sm">{review.vendor_response}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Other Vendor Options */}
              {vendors.length > 1 && (
                <Card className="p-6 mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Other Great Options</h3>
                  <div className="space-y-4">
                    {vendors.slice(1, 4).map((vendor) => (
                      <div
                        key={vendor.id}
                        onClick={() => handleSelectVendor(vendor)}
                        className={`
                          p-4 border-2 rounded-lg cursor-pointer transition-all
                          ${selectedVendor?.id === vendor.id
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                            alt={vendor.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {vendor.rating && (
                                <div className="flex items-center">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                                  <span>{vendor.rating}</span>
                                </div>
                              )}
                              <span>{vendor.years_experience} years exp.</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {vendor.profile || `Professional ${currentService.toLowerCase()} specialist`}
                            </p>
                          </div>
                          <Button
                            variant={selectedVendor?.id === vendor.id ? "primary" : "outline"}
                            size="sm"
                          >
                            {selectedVendor?.id === vendor.id ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Booking Sidebar */}
            <div className="space-y-6">
              {/* Quick Select Recommended */}
              <Card className="p-6 bg-gradient-to-br from-rose-500 to-amber-500 text-white">
                <h3 className="text-xl font-semibold mb-4">Recommended Choice</h3>
                {recommendedVendor && (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">{recommendedVendor.name}</h4>
                      <p className="text-rose-100 text-sm mb-3">
                        Perfect match for your {currentService.toLowerCase()} needs
                      </p>
                      <div className="text-2xl font-bold mb-2">
                        {formatPrice(selectedPackage?.price || 0)}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full bg-white text-gray-900 hover:bg-gray-50"
                      onClick={() => {
                        setSelectedVendor(recommendedVendor);
                        handleContinue();
                      }}
                    >
                      Select {recommendedVendor.name}
                    </Button>
                  </>
                )}
              </Card>

              {/* Package Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Summary</h3>
                {selectedPackage && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{currentService}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Package:</span>
                      <span className="font-medium">{selectedPackage.name}</span>
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

              {/* Event Details */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {eventDate ? new Date(eventDate).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venue:</span>
                    <span className="font-medium">{venue?.name || region || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{location.state?.eventType || 'Wedding'}</span>
                  </div>
                </div>
              </Card>

              {/* Contact Vendor */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions?</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Want to discuss your vision before booking?
                </p>
                <Button variant="outline" icon={MessageCircle} className="w-full mb-3">
                  Message Vendor
                </Button>
                <div className="text-center text-xs text-gray-500">
                  Typically responds within 2 hours
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {selectedVendor && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {currentService} vendor selected
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedVendor.name} - {formatPrice(selectedPackage?.price || 0)}
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                onClick={handleContinue}
              >
                {nextService ? `Continue to ${nextService}` : 'Complete Booking'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};