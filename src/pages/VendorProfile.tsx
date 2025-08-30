import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Award, Camera, Video, Music, Users, Calendar, Check, Eye, MessageCircle, Shield, Play, Phone, Mail, Clock, Heart, Share2, ChevronRight } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useVendorReviews } from '../hooks/useSupabase';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Vendor } from '../types/booking';
import { useCart } from '../context/CartContext';
import { VendorSelectionModal } from '../components/cart/VendorSelectionModal';

export const VendorProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, openCart, updateItem } = useCart();
  const [vendor, setVendor] = useState<Vendor | null>(location.state?.vendor || null);
  const [loading, setLoading] = useState(!vendor);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews'>('overview');
  const [vendorStats, setVendorStats] = useState<{ eventsCompleted: number }>({ eventsCompleted: 0 });
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [tempCartItem, setTempCartItem] = useState<any>(null);

  const { reviews: vendorReviews, loading: reviewsLoading } = useVendorReviews(vendor?.id || '');

  // Get return navigation info
  const returnTo = location.state?.returnTo || '/search';
  const returnState = location.state?.returnState;
  const selectedPackage = location.state?.package;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!vendor && id) {
      fetchVendor();
    }
  }, [id, vendor]);

  useEffect(() => {
    if (vendor?.id) {
      fetchVendorStats();
    }
  }, [vendor]);

  const fetchVendor = async () => {
    if (!id) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Mock vendor for demo
      const mockVendor: Vendor = {
        id: id,
        user_id: 'mock-user-1',
        name: 'Elegant Moments Photography',
        profile: 'Professional wedding photographer with over 10 years of experience capturing beautiful moments. Specializing in romantic, candid photography that tells your unique love story.',
        rating: 4.9,
        profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
        years_experience: 10,
        phone: '(555) 123-4567',
        portfolio_photos: [
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        portfolio_videos: [
          'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
        ],
        specialties: ['Outdoor Weddings', 'Intimate Ceremonies', 'Fine Art Photography', 'Destination Weddings'],
        languages: ['English', 'Spanish'],
        service_areas: ['Greater Boston', 'Cape Cod', 'Western Massachusetts'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      setVendor(mockVendor);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVendor(data);
    } catch (err) {
      console.error('Error fetching vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vendor');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorStats = async () => {
    if (!vendor?.id) return;

    if (!supabase || !isSupabaseConfigured()) {
      setVendorStats({ eventsCompleted: Math.floor(Math.random() * 300) + 50 });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('vendor_id', vendor.id)
        .in('status', ['confirmed', 'completed']);

      if (error) throw error;
      setVendorStats({ eventsCompleted: data?.length || 0 });
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      setVendorStats({ eventsCompleted: 0 });
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold text-gray-900">({rating})</span>
      </div>
    );
  };

  const handleBookWithVendor = () => {
    if (selectedPackage) {
      // Create a temporary cart item to pass to the vendor selection modal
      const tempItem = {
        id: `temp-${Date.now()}`,
        package: selectedPackage,
        addedAt: new Date().toISOString()
      };
      setTempCartItem(tempItem);
      setShowVendorModal(true);
    }
  };

  const handleVendorSelected = (selectedVendor: any, eventDetails: any) => {
    if (tempCartItem && selectedPackage) {
      // Add the item to cart with all the details including the pre-selected vendor
      addItem({
        package: selectedPackage,
        vendor: selectedVendor,
        eventDate: eventDetails.eventDate,
        eventTime: eventDetails.eventTime,
        endTime: eventDetails.endTime,
        venue: eventDetails.venue
      });
      setShowVendorModal(false);
      setTempCartItem(null);
      openCart();
    }
  };

  const handleModalClose = () => {
    setShowVendorModal(false);
    setTempCartItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vendor Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The vendor you're looking for doesn't exist."}</p>
          <Button variant="primary" onClick={() => navigate(returnTo, { state: returnState })}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button 
              onClick={() => navigate('/')}
              className="hover:text-rose-600 transition-colors"
            >
              Home
            </button>
            <ChevronRight className="w-4 h-4" />
            <button 
              onClick={() => navigate('/search')}
              className="hover:text-rose-600 transition-colors"
            >
              Browse Services
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{vendor.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            icon={ArrowLeft} 
            onClick={() => navigate(returnTo, { state: returnState })}
          >
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vendor Header */}
            <Card className="p-8">
              <div className="flex items-start space-x-6 mb-6">
                <img
                  src={vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={vendor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-rose-100"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{vendor.name}</h1>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" icon={Heart} size="sm">
                      </Button>
                      <Button variant="ghost" icon={Share2} size="sm">
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-gray-600 mb-4">
                    {vendor.rating && (
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= vendor.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-lg">({vendor.rating})</span>
                      </div>
                    )}
                    <span>•</span>
                    <span>{vendor.years_experience} years experience</span>
                    {vendor.service_areas && vendor.service_areas.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{vendor.service_areas[0]}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-gray-600 leading-relaxed mb-6">
                    {vendor.profile || `Professional wedding specialist with ${vendor.years_experience} years of experience creating beautiful memories for couples.`}
                  </p>

                  {/* Trust Badges */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <Shield className="w-4 h-4" />
                      <span>Verified</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Quick Response</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      <Award className="w-4 h-4" />
                      <span>Top Rated</span>
                    </div>
                  </div>
                </div>
              </div>

            </Card>

            {/* Tabs */}
            <Card className="overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'portfolio', label: 'Portfolio' },
                    { key: 'reviews', label: `Reviews (${vendorReviews.length})` }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Specialties */}
                    {vendor.specialties && vendor.specialties.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Specialties</h3>
                        <div className="flex flex-wrap gap-2">
                          {vendor.specialties.map((specialty, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service Areas */}
                    {vendor.service_areas && vendor.service_areas.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {vendor.service_areas.map((area, index) => (
                            <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {vendor.languages && vendor.languages.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                          {vendor.languages.map((language, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {vendor.rating || '4.9'}
                        </div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {vendor.years_experience}
                        </div>
                        <div className="text-sm text-gray-600">Years Experience</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {vendorStats.eventsCompleted}+
                        </div>
                        <div className="text-sm text-gray-600">Events Completed</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'portfolio' && (
                  <div className="space-y-6">
                    {/* Featured Image */}
                    {vendor.portfolio_photos && vendor.portfolio_photos.length > 0 && (
                      <div>
                        <div className="relative mb-6">
                          <img
                            src={vendor.portfolio_photos[selectedImage]}
                            alt="Portfolio"
                            className="w-full h-96 object-cover rounded-lg"
                          />
                          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                            {selectedImage + 1} / {vendor.portfolio_photos.length}
                          </div>
                        </div>

                        {/* Thumbnail Grid */}
                        <div className="grid grid-cols-6 gap-4">
                          {vendor.portfolio_photos.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Portfolio ${index + 1}`}
                              className={`aspect-square object-cover rounded-lg cursor-pointer transition-all ${
                                selectedImage === index ? 'ring-2 ring-rose-500 scale-105' : 'hover:scale-105'
                              }`}
                              onClick={() => setSelectedImage(index)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {vendor.portfolio_videos && vendor.portfolio_videos.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Video Portfolio</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {vendor.portfolio_videos.map((video, index) => (
                            <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                              <video
                                src={video}
                                className="w-full h-full object-cover cursor-pointer"
                                controls
                                preload="metadata"
                                poster={vendor.portfolio_photos?.[index] || undefined}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Intro Video */}
                    {vendor.intro_video && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Introduction Video</h4>
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <video
                            src={vendor.intro_video}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            poster={vendor.portfolio_photos?.[0] || undefined}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">Customer Reviews</h3>
                      {vendor.rating && (
                        <div className="flex items-center space-x-2">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-lg font-semibold">{vendor.rating}</span>
                          <span className="text-gray-600">({vendorReviews.length} reviews)</span>
                        </div>
                      )}
                    </div>

                    {reviewsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading reviews...</p>
                      </div>
                    ) : vendorReviews.length === 0 ? (
                      <div className="text-center py-12">
                        <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h4>
                        <p className="text-gray-600">This vendor hasn't received any reviews yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {vendorReviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-200 pb-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {review.couples?.name?.[0] || 'A'}
                                  </span>
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {review.couples?.name || 'Anonymous Couple'}
                                  </h5>
                                  {review.couples?.wedding_date && (
                                    <p className="text-sm text-gray-500">
                                      {formatDate(review.couples.wedding_date)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= (review.overall_rating || review.communication_rating) 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 mb-3 leading-relaxed">{review.feedback}</p>
                            {review.vendor_response && (
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <MessageCircle className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium text-blue-900">Vendor Response</span>
                                </div>
                                <p className="text-blue-800 text-sm">{review.vendor_response}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response time:</span>
                  <span className="font-medium">Within 2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Events completed:</span>
                  <span className="font-medium">{vendorStats.eventsCompleted}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Years active:</span>
                  <span className="font-medium">{vendor.years_experience} years</span>
                </div>
                {vendor.rating && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average rating:</span>
                    <span className="font-medium">{vendor.rating}/5</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Book with Vendor */}
            {selectedPackage && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Book with {vendor.name}</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">{selectedPackage.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{selectedPackage.service_type}</p>
                    <div className="text-xl font-bold text-gray-900">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(selectedPackage.price / 100)}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleBookWithVendor}
                  >
                    Add to Cart
                  </Button>
                </div>
              </Card>
            )}

            {/* Contact */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact {vendor.name}</h3>
              <div className="space-y-3">
                <Button variant="outline" icon={MessageCircle} className="w-full">
                  Send Message
                </Button>
                <div className="text-center text-sm text-gray-500">
                  Typically responds within 2 hours
                </div>
              </div>
            </Card>

            {/* Trust & Safety */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust & Safety</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Verified vendor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Background checked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Insured & licensed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">24/7 support</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Vendor Selection Modal for availability checking */}
      {tempCartItem && (
        <VendorSelectionModal
          isOpen={showVendorModal}
          onClose={handleModalClose}
          cartItem={tempCartItem}
          onVendorSelected={handleVendorSelected}
        />
      )}
    </div>
  );
};