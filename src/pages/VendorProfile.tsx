import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Award, Camera, Video, Music, Users, Calendar, Check, Eye, MessageCircle, Shield, Play, Phone, Mail, Clock, Heart, Share2, ChevronRight, DollarSign, Info } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useVendorReviews } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { Vendor } from '../types/booking';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { VendorSelectionModal } from '../components/cart/VendorSelectionModal';

// Update Vendor interface to include premium data and service areas with travel fees
interface VendorWithPremium extends Vendor {
  premium_amount?: number | null;
  service_areas_with_fees?: { region: string; travel_fee?: number | null }[];
}

export const VendorProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, openCart, updateItem } = useCart();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<VendorWithPremium | null>(location.state?.vendor || null);
  const [loading, setLoading] = useState(!vendor);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews'>('portfolio');
  const [vendorStats, setVendorStats] = useState<{ eventsCompleted: number }>({ eventsCompleted: 0 });
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [tempCartItem, setTempCartItem] = useState<any>(null);
  const [isVendorBooked, setIsVendorBooked] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const { reviews: vendorReviews, loading: reviewsLoading, averageRating } = useVendorReviews(vendor?.id || '');

  // Get return navigation info
  const returnTo = location.state?.returnTo || '/search';
  const returnState = location.state?.returnState;
  const selectedPackage = location.state?.package;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch vendor data if not provided in location state or missing service areas
  useEffect(() => {
    if (!slug) {
      setError('No vendor slug provided in URL');
      setLoading(false);
      return;
    }
    if (!vendor || !vendor.service_areas_with_fees || vendor.premium_amount === undefined || vendor.premium_amount === null || vendor.premium_amount === 0) {
      setLoading(true);
      fetchVendor();
    }
  }, [slug, vendor]);

  // Fetch vendor stats
  useEffect(() => {
    if (vendor?.id) {
      fetchVendorStats();
    }
  }, [vendor]);

  // Check if the vendor is booked by the current couple
  useEffect(() => {
    if (!vendor?.id || !user?.id || !supabase) {
      setIsVendorBooked(false);
      return;
    }

    const checkBookingStatus = async () => {
      try {
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (coupleError || !coupleData) {
          console.error('Error fetching couple data:', coupleError);
          setIsVendorBooked(false);
          return;
        }

        const coupleId = coupleData.id;

        const { data, error } = await supabase
          .from('bookings')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('couple_id', coupleId)
          .in('status', ['confirmed', 'completed'])
          .limit(1);

        if (error) throw error;
        setIsVendorBooked(!!data?.length);
      } catch (err) {
        console.error('Error checking booking status:', err);
        setIsVendorBooked(false);
      }
    };

    checkBookingStatus();
  }, [vendor?.id, user?.id]);

  const fetchVendor = async () => {
    if (!slug) {
      console.error('No vendor slug provided');
      setError('No vendor slug provided');
      return;
    }

    const vendorSlug = slug;
    console.log('Fetching vendor with slug:', vendorSlug); // Debug log

    if (!supabase) {
      console.error('Supabase client is not initialized');
      setError('Database connection not initialized');
      return;
    }

    try {
      // Fetch vendor data by slug
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('slug', vendorSlug)
        .single();

      if (vendorError) {
        console.error('Vendor query error:', vendorError);
        throw vendorError;
      }

      console.log('Raw vendor data from Supabase:', vendorData); // Debug log

      // Fetch vendor_premiums using vendor_id
      const { data: premiumData, error: premiumError } = await supabase
        .from('vendor_premiums')
        .select('amount')
        .eq('vendor_id', vendorData.id)
        .maybeSingle();

      console.log('Raw vendor_premiums data for vendor_id:', vendorData.id, premiumData, 'Error:', premiumError); // Debug log
      if (premiumError) {
        console.error('Error fetching vendor_premiums:', premiumError);
      }

      // Fetch vendor_service_areas using vendor_id
      const { data: serviceAreasData, error: serviceAreasError } = await supabase
        .from('vendor_service_areas')
        .select('region, travel_fee')
        .eq('vendor_id', vendorData.id)
        .order('region');

      console.log('Raw vendor_service_areas data for vendor_id:', vendorData.id, serviceAreasData); // Debug log
      if (serviceAreasError) {
        console.error('Error fetching vendor_service_areas:', serviceAreasError);
        throw serviceAreasError;
      }
      if (!serviceAreasData || serviceAreasData.length === 0) {
        console.warn('No service areas found for vendor_id:', vendorData.id);
      }

      // Verify regions with travel_fee > 0
      const { data: verifyServiceAreas, error: verifyError } = await supabase
        .from('vendor_service_areas')
        .select('region, travel_fee')
        .eq('vendor_id', vendorData.id)
        .gt('travel_fee', 0)
        .order('region');

      console.log('Verification query for travel_fee > 0:', verifyServiceAreas, 'Error:', verifyError); // Debug log
      if (verifyError) {
        console.error('Error verifying vendor_service_areas:', verifyError);
      }

      // Process vendor data
      const processedVendor: VendorWithPremium = {
        ...vendorData,
        premium_amount: premiumData?.amount ?? null,
        service_areas_with_fees: serviceAreasData?.map((area: { region: string; travel_fee?: number }) => {
          console.log(`Processing service area: region=${area.region}, travel_fee=${area.travel_fee}, type=${typeof area.travel_fee}`); // Debug log
          return {
            region: area.region,
            travel_fee: typeof area.travel_fee === 'number' ? area.travel_fee : null
          };
        }) || []
      };

      console.log('Processed vendor data:', processedVendor); // Debug log
      console.log('Service areas with fees:', processedVendor.service_areas_with_fees); // Debug log
      setVendor(processedVendor);
    } catch (err) {
      console.error('Error fetching vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vendor');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorStats = async () => {
    if (!vendor?.id || !supabase) return;

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

  const getPriceRange = (amount?: number | null) => {
    console.log('getPriceRange called with amount:', amount); // Debug log
    if (amount === undefined || amount === null || amount === 0) return null;
    if (amount > 0 && amount <= 60000) return 'Luxury'; // Up to $600
    return 'Premium'; // Above $600
  };

  const getPriceRangeClass = (amount?: number | null) => {
    if (amount === undefined || amount === null || amount === 0) return '';
    if (amount > 0 && amount <= 60000) return 'bg-blue-100 text-blue-800';
    return 'bg-purple-100 text-purple-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (amount?: number | null) => {
    if (amount === undefined || amount === null || amount === 0) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold text-gray-900">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const handleBookWithVendor = () => {
    if (selectedPackage) {
      const tempItem = {
        id: `temp-${Date.now()}`,
        package: {
          ...selectedPackage,
          premium_amount: vendor?.premium_amount
        },
        addedAt: new Date().toISOString()
      };
      setTempCartItem(tempItem);
      setShowVendorModal(true);
    }
  };

  const handleVendorSelected = (selectedVendor: any, eventDetails: any) => {
    if (tempCartItem && selectedPackage) {
      addItem({
        package: {
          ...selectedPackage,
          premium_amount: vendor?.premium_amount
        },
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

  const handleMessageClick = () => {
    navigate('/profile?tab=messages', {
      state: { selectedConversationId: vendor?.id }
    });
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

  console.log('Rendering vendor:', vendor); // Debug log
  console.log('Service areas with fees before render:', vendor.service_areas_with_fees); // Debug log

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
                    <div className="flex items-center space-x-3">
                      <h1 className="text-3xl font-bold text-gray-900">{vendor.name}</h1>
                      {getPriceRange(vendor.premium_amount) && (
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriceRangeClass(vendor.premium_amount)}`}>
                          <DollarSign className="w-5 h-5 mr-1" />
                          <span>{getPriceRange(vendor.premium_amount)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" icon={Heart} size="sm">
                      </Button>
                      <Button variant="ghost" icon={Share2} size="sm">
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-gray-600 mb-4">
                    {averageRating !== null && (
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-lg">({averageRating.toFixed(1)})</span>
                      </div>
                    )}
                    <span>•</span>
                    <span>{vendor.years_experience} years experience</span>
                  </div>

                  <p className="text-gray-600 leading-relaxed mb-6">
                    {vendor.profile || `Professional wedding specialist with ${vendor.years_experience} years of experience creating beautiful memories for couples.`}
                  </p>

                  {/* Pricing Information */}
                  {vendor.premium_amount && vendor.premium_amount > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Vendor Premium</span>
                            <div 
                              className="relative"
                              onMouseEnter={() => setIsTooltipVisible(true)}
                              onMouseLeave={() => setIsTooltipVisible(false)}
                              onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                            >
                              <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
                              {isTooltipVisible && (
                                <div className="absolute z-10 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg -top-20 left-6 text-sm text-gray-600">
                                  This vendor is a premium vendor who has selected to add a premium to all packages due to their experience and ratings. Our premiums go directly to our vendors.
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-medium">
                            {formatPrice(vendor.premium_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {averageRating !== null ? averageRating.toFixed(1) : 'N/A'}
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

                    {/* Destinations (Travel Fee > 0) */}
                    {vendor.service_areas_with_fees && vendor.service_areas_with_fees.length > 0 && vendor.service_areas_with_fees.some(area => area.travel_fee && area.travel_fee > 0) && (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Destinations</h3>
                          <span className="text-sm text-gray-500">*These locations require an additional fee with this vendor</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {vendor.service_areas_with_fees
                            .filter(area => area.travel_fee && area.travel_fee > 0)
                            .map((area, index) => {
                              console.log(`Rendering destination: region=${area.region}, travel_fee=${area.travel_fee}`); // Debug log
                              return (
                                <span key={index} className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm">
                                  {area.region} ({formatPrice(area.travel_fee)})
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Service Areas */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Areas</h3>
                      {vendor.service_areas_with_fees ? (
                        vendor.service_areas_with_fees.length > 0 ? (
                          <div className="space-y-2">
                            {vendor.service_areas_with_fees
                              .filter(area => !area.travel_fee || area.travel_fee === 0)
                              .map((area, index) => {
                                console.log(`Rendering service area: region=${area.region}, travel_fee=${area.travel_fee}`); // Debug log
                                return (
                                  <div key={index} className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                                      {area.region}
                                    </span>
                                    <span className="text-gray-600 text-sm">
                                      {formatPrice(area.travel_fee)}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="text-gray-600">No service areas found for this vendor.</p>
                        )
                      ) : (
                        <p className="text-gray-600">Service areas data is not available. Please try again later.</p>
                      )}
                    </div>

                    {/* Languages */}
                    {vendor.languages && vendor.languages.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                          {vendor.languages.map((language, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
                      {averageRating !== null && (
                        <div className="flex items-center space-x-2">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
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
                {averageRating !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average rating:</span>
                    <span className="font-medium">{averageRating.toFixed(1)}/5</span>
                  </div>
                )}
                {getPriceRange(vendor.premium_amount) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price range:</span>
                    <span className="font-medium">{getPriceRange(vendor.premium_amount)}</span>
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
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format((selectedPackage.price + (vendor.premium_amount || 0)) / 100)}
                    </div>
                    {(vendor.premium_amount && vendor.premium_amount > 0) && (
                      <div className="mt-2 text-sm text-gray-600">
                        {vendor.premium_amount && vendor.premium_amount > 0 && (
                          <div>Includes ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(vendor.premium_amount / 100)} premium</div>
                        )}
                      </div>
                    )}
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
            {isVendorBooked && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact {vendor.name}</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    icon={MessageCircle}
                    className="w-full"
                    onClick={handleMessageClick}
                  >
                    Send Message
                  </Button>
                  <div className="text-center text-sm text-gray-500">
                    Typically responds within 2 hours
                  </div>
                </div>
              </Card>
            )}

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
    </div>
  );
};