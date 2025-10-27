import React, { useState, useEffect, useMemo, useRef, Component } from 'react';
import { ArrowLeft, Star, Award, Camera, Video, Music, Users, Calendar, Clock, Check, Eye, MessageCircle, Shield, Heart, Share2, ChevronRight, X, Globe, Mail, Phone, Facebook, Youtube, Instagram, Linkedin } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useVendorReviews } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { Vendor } from '../types/booking';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { DateSelectionModal } from '../components/cart/DateSelectionModal';
import InquiryModal from '../components/InquiryModal';
import { trackPageView } from '../utils/analytics';

interface VendorWithPremium extends Vendor {
  service_areas_with_fees: { region: string; travel_fee: number }[];
  website?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface ServicePackage {
  id: string;
  service_type: string;
  name: string;
  description: string | null;
  price: number;
  features: string[] | null;
  coverage: any;
  primary_image: string | null;
  gallery_images: string[] | null;
}

interface TeamMember {
  id: string;
  vendor_id: string;
  full_name: string;
  role: string | null;
  bio: string | null;
  profile_photo: string | null;
  photo_gallery: string[] | null;
  video_gallery: string[] | null;
}

interface AdditionalVendor {
  id: string;
  slug: string;
  name: string;
  profile_photo: string | null;
  service_types: string[];
}

// Error Boundary Component
class VendorProfileErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something Went Wrong</h2>
            <p className="text-gray-600 mb-6">An error occurred while loading the vendor profile. Please try again.</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

const VendorProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, openCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<VendorWithPremium | null>(location.state?.vendor || null);
  const [loading, setLoading] = useState(!vendor);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews' | 'team' | 'packages'>('overview');
  const [vendorStats, setVendorStats] = useState<{ eventsCompleted: number }>({ eventsCompleted: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [tempCartItem, setTempCartItem] = useState<any>(null);
  const [isVendorBookedOrInquired, setIsVendorBookedOrInquired] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [additionalVendors, setAdditionalVendors] = useState<AdditionalVendor[]>([]);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState<ServicePackage | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
  const analyticsTracked = useRef(false);

  const vendorId = useMemo(() => {
    console.log('Computed vendorId:', vendor?.id || '');
    return vendor?.id || '';
  }, [vendor?.id]);
  const { reviews: rawVendorReviews, loading: reviewsLoading, averageRating } = useVendorReviews(vendorId);
  const vendorReviews = rawVendorReviews || [];

  const returnTo = location.state?.returnTo || '/search';
  const returnState = location.state?.returnState;
  const selectedPackage = location.state?.package;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!authLoading && slug && !analyticsTracked.current) {
      console.log(`Tracking analytics for vendor/${slug}:`, new Date().toISOString());
      trackPageView(`vendor/${slug}`, 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [authLoading, user?.id, slug]);

  useEffect(() => {
    if (!slug) {
      setError('No vendor slug provided in URL');
      setLoading(false);
      return;
    }
    if (!vendor || !vendor.service_areas_with_fees) {
      setLoading(true);
      fetchVendor();
    } else {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (vendor?.id) {
      console.log('Fetching data for vendor_id:', vendor.id);
      console.log('Vendor social media and contact:', {
        website: vendor.website,
        facebook: vendor.facebook,
        youtube: vendor.youtube,
        instagram: vendor.instagram,
        linkedin: vendor.linkedin,
        email: vendor.email,
        phone: vendor.phone,
      });
      fetchVendorStats();
      fetchServicePackages();
      fetchTeamMembers();
      fetchAdditionalVendors();
    }
  }, [vendor?.id]);

  useEffect(() => {
    if (!vendor?.id || !user?.id) {
      setIsVendorBookedOrInquired(false);
      return;
    }

    const checkBookingOrInquiryStatus = async () => {
      try {
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (coupleError || !coupleData) {
          console.error('Error fetching couple data:', coupleError);
          setIsVendorBookedOrInquired(false);
          return;
        }

        const coupleId = coupleData.id;

        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('couple_id', coupleId)
          .in('status', ['confirmed', 'completed'])
          .limit(1);

        if (bookingError) throw bookingError;

        if (bookingData?.length) {
          setIsVendorBookedOrInquired(true);
          return;
        }

        const { data: leadData, error: leadError } = await supabase
          .from('vendor_leads')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('couple_id', coupleId)
          .limit(1);

        if (leadError) throw leadError;

        setIsVendorBookedOrInquired(!!leadData?.length);
      } catch (err) {
        console.error('Error checking booking or inquiry status:', err);
        setIsVendorBookedOrInquired(false);
      }
    };

    checkBookingOrInquiryStatus();
  }, [vendor?.id, user?.id]);

  const fetchVendor = async () => {
    if (!slug || !supabase) {
      console.error('Missing slug or Supabase client');
      setError('Invalid request or database connection');
      setLoading(false);
      return;
    }

    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*, website, facebook, youtube, instagram, linkedin, email, phone')
        .eq('slug', slug)
        .single();

      if (vendorError) {
        console.error('Vendor query error:', vendorError);
        throw vendorError;
      }

      console.log('Raw vendor data:', vendorData);

      const { data: serviceAreasData, error: serviceAreasError } = await supabase
        .from('vendor_service_areas')
        .select('region, travel_fee')
        .eq('vendor_id', vendorData.id)
        .order('region');

      console.log('Raw vendor_service_areas data:', serviceAreasData);
      if (serviceAreasError) {
        console.error('Error fetching vendor_service_areas:', serviceAreasError);
        throw serviceAreasError;
      }

      const processedVendor: VendorWithPremium = {
        ...vendorData,
        service_areas_with_fees: serviceAreasData?.map((area: { region: string; travel_fee?: number }) => ({
          region: area.region,
          travel_fee: typeof area.travel_fee === 'number' ? area.travel_fee : 0,
        })) || [],
      };

      console.log('Processed vendor data:', processedVendor);
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
    setStatsLoading(true);
    try {
      console.log('Fetching events for vendor_id:', vendor.id);
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('vendor_id', vendor.id)
        .in('status', ['confirmed', 'completed']);

      if (error) throw error;
      console.log('Fetched bookings:', data);
      setVendorStats({ eventsCompleted: data?.length || 0 });
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      setVendorStats({ eventsCompleted: 0 });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchServicePackages = async () => {
    if (!vendor?.id || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('id, service_type, name, description, price, features, coverage, primary_image, gallery_images')
        .eq('vendor_id', vendor.id)
        .eq('is_displayed', true)
        .eq('status', 'approved');

      if (error) throw error;
      setServicePackages(data || []);
      console.log('Fetched service packages:', data);
    } catch (error) {
      console.error('Error fetching service packages:', error);
      setServicePackages([]);
    }
  };

  const fetchTeamMembers = async () => {
    if (!vendor?.id || !supabase) {
      console.error('No vendor_id available for fetching team members');
      return;
    }
    try {
      console.log('Fetching team members for vendor_id:', vendor.id);
      const { data, error } = await supabase
        .from('public_team_members')
        .select('id, vendor_id, full_name, role, bio, profile_photo, photo_gallery, video_gallery')
        .eq('vendor_id', vendor.id);

      if (error) throw error;
      setTeamMembers(data || []);
      console.log('Fetched team members:', data);
      if (!data || data.length === 0) {
        console.warn('No team members found for vendor_id:', vendor.id);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const fetchAdditionalVendors = async () => {
    if (!vendor?.id || !supabase) return;
    try {
      console.log('Fetching additional vendors for vendor_id:', vendor.id);
      const { data: currentVendorAreas, error: areaError } = await supabase
        .from('vendor_service_areas')
        .select('service_area_id')
        .eq('vendor_id', vendor.id);

      if (areaError) throw areaError;

      const serviceAreaIds = currentVendorAreas?.map(area => area.service_area_id) || [];
      if (serviceAreaIds.length === 0) {
        console.warn('No service areas found for vendor_id:', vendor.id);
        setAdditionalVendors([]);
        return;
      }

      const { data, error } = await supabase
        .from('vendors')
        .select('id, slug, name, profile_photo, service_types')
        .neq('id', vendor.id)
        .in('id', (
          await supabase
            .from('vendor_service_areas')
            .select('vendor_id')
            .in('service_area_id', serviceAreaIds)
        ).data?.map(item => item.vendor_id) || [])
        .limit(3);

      if (error) throw error;
      console.log('Fetched additional vendors:', data);
      setAdditionalVendors(data || []);
    } catch (error) {
      console.error('Error fetching additional vendors:', error);
      setAdditionalVendors([]);
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
      day: 'numeric',
    });
  };

  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
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
        package: selectedPackage,
        addedAt: new Date().toISOString(),
      };
      setTempCartItem(tempItem);
      setShowVendorModal(true);
    }
  };

  const handleVendorSelected = (selectedVendor: any, eventDetails: any) => {
    if (tempCartItem && selectedPackage) {
      addItem({
        package: selectedPackage,
        vendor: selectedVendor,
        eventDate: eventDetails.eventDate,
        eventTime: eventDetails.eventTime,
        endTime: eventDetails.endTime,
        venue: eventDetails.venue,
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
      state: { selectedConversationId: vendor?.id },
    });
  };

  const handleInquirySubmit = ({ coupleId, partner1Name }: { coupleId: string; partner1Name: string }) => {
    navigate('/profile', { state: { returnTo: location.pathname, returnState: location.state } });
  };

  const handleViewPackageDetails = (pkg: ServicePackage) => {
    setSelectedPackageDetails(pkg);
  };

  const handleViewTeamMemberDetails = (member: TeamMember) => {
    setSelectedTeamMember(member);
  };

  const handleViewVendorProfile = (vendorSlug: string) => {
    console.log('Opening vendor profile in new tab:', `/vendor/${vendorSlug}`);
    try {
      window.open(`/vendor/${vendorSlug}`, '_blank', 'noopener,noreferrer');
      console.log('Successfully opened new tab for:', `/vendor/${vendorSlug}`);
    } catch (err) {
      console.error('Error opening new tab:', err);
    }
  };

  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const normalizedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    try {
      new URL(normalizedUrl);
      return true;
    } catch {
      console.warn(`Invalid URL: ${url}`);
      return false;
    }
  };

  const getValidUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const normalizedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    return normalizedUrl;
  };

  const isValidEmail = (email: string | null | undefined): boolean => {
    if (!email) return false;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) console.warn(`Invalid email: ${email}`);
    return isValid;
  };

  const isValidPhone = (phone: string | null | undefined): boolean => {
    if (!phone) return false;
    const isValid = /^\+?\d[\d\s-]{8,}$/.test(phone);
    if (!isValid) console.warn(`Invalid phone: ${phone}`);
    return isValid;
  };

  const closePackageModal = () => {
    setSelectedPackageDetails(null);
  };

  const closeTeamMemberModal = () => {
    setSelectedTeamMember(null);
  };

  // Define navigation tabs dynamically
  const navTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'portfolio', label: 'Portfolio' },
    ...(teamMembers.length > 0 ? [{ key: 'team', label: 'Team' }] : []),
    { key: 'packages', label: 'Packages' },
    { key: 'reviews', label: `Reviews (${vendorReviews.length})` },
  ];

  if (loading) {
    return (
      <VendorProfileErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vendor profile...</p>
          </div>
        </div>
      </VendorProfileErrorBoundary>
    );
  }

  if (error || !vendor) {
    return (
      <VendorProfileErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vendor Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "The vendor you're looking for doesn't exist."}</p>
            <Button variant="primary" onClick={() => navigate(returnTo, { state: returnState })}>
              Go Back
            </Button>
          </Card>
        </div>
      </VendorProfileErrorBoundary>
    );
  }

  return (
    <VendorProfileErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <button onClick={() => navigate('/')} className="hover:text-rose-600 transition-colors">
                Home
              </button>
              <ChevronRight className="w-4 h-4" />
              <button onClick={() => navigate('/search')} className="hover:text-rose-600 transition-colors">
                Browse Services
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">{vendor.name}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(returnTo, { state: returnState })}>
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
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
                        <div className="flex items-center space-x-2">
                          {vendor.website && isValidUrl(vendor.website) && (
                            <a
                              href={getValidUrl(vendor.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-rose-600"
                              title="Visit Website"
                            >
                              <Globe className="w-5 h-5" />
                            </a>
                          )}
                          {vendor.facebook && isValidUrl(vendor.facebook) && (
                            <a
                              href={getValidUrl(vendor.facebook)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-rose-600"
                              title="Visit Facebook"
                            >
                              <Facebook className="w-5 h-5" />
                            </a>
                          )}
                          {vendor.youtube && isValidUrl(vendor.youtube) && (
                            <a
                              href={getValidUrl(vendor.youtube)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-rose-600"
                              title="Visit YouTube"
                            >
                              <Youtube className="w-5 h-5" />
                            </a>
                          )}
                          {vendor.instagram && isValidUrl(vendor.instagram) && (
                            <a
                              href={getValidUrl(vendor.instagram)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-rose-600"
                              title="Visit Instagram"
                            >
                              <Instagram className="w-5 h-5" />
                            </a>
                          )}
                          {vendor.linkedin && isValidUrl(vendor.linkedin) && (
                            <a
                              href={getValidUrl(vendor.linkedin)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-rose-600"
                              title="Visit LinkedIn"
                            >
                              <Linkedin className="w-5 h-5" />
                            </a>
                          )}
                          {vendor.email && isValidEmail(vendor.email) ? (
                            <div className="relative group">
                              <a
                                href={`mailto:${vendor.email}`}
                                className="text-gray-600 hover:text-rose-600"
                                title={`Email: ${vendor.email}`}
                                onClick={() => console.log('Email clicked:', vendor.email)}
                              >
                                <Mail className="w-5 h-5" />
                              </a>
                              <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 mt-2">
                                {vendor.email}
                              </div>
                            </div>
                          ) : vendor.email ? (
                            <span className="text-gray-600" title="Invalid email format">
                              {vendor.email}
                            </span>
                          ) : null}
                          {vendor.phone && isValidPhone(vendor.phone) && (
                            <a
                              href={`tel:${vendor.phone}`}
                              className="text-gray-600 hover:text-rose-600"
                              title={`Call: ${vendor.phone}`}
                            >
                              <Phone className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" icon={Heart} size="sm" />
                        <Button variant="ghost" icon={Share2} size="sm" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-gray-600 mb-4">
                      {averageRating !== null && (
                        <div className="flex items-center">
                          <div className="flex items-center mr-2">{renderStars(averageRating)}</div>
                        </div>
                      )}
                      <span>•</span>
                      <span>{vendor.years_experience} years experience</span>
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-6">
                      {vendor.profile || `Professional wedding specialist with ${vendor.years_experience} years of experience creating beautiful memories for couples.`}
                    </p>

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

              {vendorId && !reviewsLoading && !statsLoading && teamMembers !== null ? (
                <Card className="overflow-hidden">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                      {navTabs.map((tab) => (
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-6 bg-gray-50 rounded-lg">
                            {reviewsLoading ? (
                              <div className="animate-pulse h-8 w-16 mx-auto mb-2 bg-gray-200 rounded"></div>
                            ) : (
                              <div className="text-3xl font-bold text-gray-900 mb-2">
                                {averageRating !== null ? averageRating.toFixed(1) : 'N/A'}
                              </div>
                            )}
                            <div className="text-sm text-gray-600">Average Rating</div>
                          </div>
                          <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <div className="text-3xl font-bold text-gray-900 mb-2">{vendor.years_experience}</div>
                            <div className="text-sm text-gray-600">Years Experience</div>
                          </div>
                          <div className="text-center p-6 bg-gray-50 rounded-lg">
                            {statsLoading ? (
                              <div className="animate-pulse h-8 w-16 mx-auto mb-2 bg-gray-200 rounded"></div>
                            ) : (
                              <div className="text-3xl font-bold text-gray-900 mb-2">{vendorStats.eventsCompleted}+</div>
                            )}
                            <div className="text-sm text-gray-600">Events Completed</div>
                          </div>
                        </div>

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

                        {teamMembers.length > 0 && (
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Meet Our Team</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {teamMembers.slice(0, 3).map((member) => (
                                <div
                                  key={member.id}
                                  className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleViewTeamMemberDetails(member)}
                                >
                                  <div className="flex items-center space-x-4">
                                    <img
                                      src={member.profile_photo || 'https://via.placeholder.com/150'}
                                      alt={member.full_name}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-900">{member.full_name}</h4>
                                      <p className="text-xs text-gray-600">{member.role || 'Team Member'}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {teamMembers.length > 3 && (
                              <div className="text-center mt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setActiveTab('team')}
                                >
                                  View All Team Members
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {servicePackages.length > 0 && (
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Packages</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {servicePackages.slice(0, 3).map((pkg) => (
                                <div
                                  key={pkg.id}
                                  className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                                  onClick={() => handleViewPackageDetails(pkg)}
                                >
                                  {pkg.primary_image && (
                                    <img
                                      src={pkg.primary_image}
                                      alt={pkg.name}
                                      className="w-full h-24 object-cover rounded-lg mb-2"
                                    />
                                  )}
                                  <h4 className="text-sm font-semibold text-gray-900">{pkg.name}</h4>
                                  <p className="text-xs text-gray-600">{pkg.service_type}</p>
                                  <p className="text-sm font-bold text-gray-900 mt-2">{formatPrice(pkg.price)}</p>
                                </div>
                              ))}
                            </div>
                            {servicePackages.length > 3 && (
                              <div className="text-center mt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setActiveTab('packages')}
                                >
                                  View All Packages
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {vendor.service_areas_with_fees.length > 0 && (
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Areas</h3>
                            <div className="flex flex-wrap gap-2">
                              {vendor.service_areas_with_fees.map((area, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                                >
                                  {area.region}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

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
                      </div>
                    )}

                    {activeTab === 'portfolio' && (
                      <div className="space-y-6">
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

                    {activeTab === 'team' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Team</h3>
                        {teamMembers.length === 0 ? (
                          <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h4>
                            <p className="text-gray-600">This vendor hasn't added any team members.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {teamMembers.map((member) => (
                              <div
                                key={member.id}
                                className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                                onClick={() => handleViewTeamMemberDetails(member)}
                              >
                                <div className="flex items-start space-x-4">
                                  <img
                                    src={member.profile_photo || 'https://via.placeholder.com/150'}
                                    alt={member.full_name}
                                    className="w-16 h-16 rounded-full object-cover"
                                  />
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-900">{member.full_name}</h4>
                                    <p className="text-sm text-gray-600">{member.role || 'Team Member'}</p>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{member.bio || 'No bio available.'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'packages' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Packages</h3>
                        {servicePackages.length === 0 ? (
                          <div className="text-center py-12">
                            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">No packages available</h4>
                            <p className="text-gray-600">This vendor hasn't added any packages yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {servicePackages.map((pkg) => (
                              <div
                                key={pkg.id}
                                className="p-4 bg-gray-50 rounded-lg flex items-start space-x-4 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleViewPackageDetails(pkg)}
                              >
                                {pkg.primary_image && (
                                  <img
                                    src={pkg.primary_image}
                                    alt={pkg.name}
                                    className="w-24 h-24 object-cover rounded-lg"
                                  />
                                )}
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900">{pkg.name}</h4>
                                  <p className="text-sm text-gray-600">{pkg.service_type}</p>
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{pkg.description || 'No description available.'}</p>
                                  <p className="text-lg font-bold text-gray-900 mt-2">{formatPrice(pkg.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'reviews' && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900">Customer Reviews</h3>
                        {averageRating !== null && (
                          <div className="flex items-center space-x-2">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
                            <span className="text-gray-600">({vendorReviews.length} reviews)</span>
                          </div>
                        )}

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
                                        <p className="text-sm text-gray-500">{formatDate(review.couples.wedding_date)}</p>
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
              ) : (
                <Card className="p-6 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading vendor data...</p>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                {statsLoading || reviewsLoading ? (
                  <div className="space-y-3">
                    <div className="animate-pulse h-5 w-full bg-gray-200 rounded"></div>
                    <div className="animate-pulse h-5 w-full bg-gray-200 rounded"></div>
                    <div className="animate-pulse h-5 w-full bg-gray-200 rounded"></div>
                  </div>
                ) : (
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
                  </div>
                )}
              </Card>

              {selectedPackage && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Book with {vendor.name}</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">{selectedPackage.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{selectedPackage.service_type}</p>
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(selectedPackage.price)}
                      </div>
                    </div>
                    <Button variant="primary" size="lg" className="w-full" onClick={handleBookWithVendor}>
                      Add to Cart
                    </Button>
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact {vendor.name}</h3>
                <div className="space-y-3">
                  {user && isVendorBookedOrInquired ? (
                    <>
                      <Button variant="outline" icon={MessageCircle} className="w-full" onClick={handleMessageClick}>
                        Send Message
                      </Button>
                      <div className="text-center text-sm text-gray-500">Typically responds within 2 hours</div>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setShowInquiryModal(true)}
                    >
                      Inquire
                    </Button>
                  )}
                </div>
              </Card>

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

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Explore Similar Vendors</h3>
                {additionalVendors.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No similar vendors found in the same service areas.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {additionalVendors.map((vendor) => (
                      <div key={vendor.id} className="flex items-center space-x-4">
                        <img
                          src={vendor.profile_photo || 'https://via.placeholder.com/150'}
                          alt={vendor.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{vendor.name}</h4>
                          <p className="text-xs text-gray-600">{vendor.service_types.join(', ')}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewVendorProfile(vendor.slug)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {tempCartItem && (
            <VendorSelectionModal
              isOpen={showVendorModal}
              onClose={handleModalClose}
              cartItem={tempCartItem}
              onVendorSelected={handleVendorSelected}
            />
          )}

          {showInquiryModal && (
            <InquiryModal
              isOpen={showInquiryModal}
              onClose={() => setShowInquiryModal(false)}
              vendor={{ id: vendor.id, name: vendor.name }}
              servicePackages={servicePackages}
              onSubmit={handleInquirySubmit}
            />
          )}

          {selectedPackageDetails && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={closePackageModal}
                  className="absolute top-4 right-4 text-gray-600 hover:text-rose-600"
                >
                  <X className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{selectedPackageDetails.name}</h3>
                {selectedPackageDetails.primary_image && (
                  <img
                    src={selectedPackageDetails.primary_image}
                    alt={selectedPackageDetails.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <p className="text-sm text-gray-600 mb-2">{selectedPackageDetails.service_type}</p>
                <p className="text-lg font-bold text-gray-900 mb-4">{formatPrice(selectedPackageDetails.price)}</p>
                <p className="text-sm text-gray-600 mb-4">{selectedPackageDetails.description || 'No description available.'}</p>
                {selectedPackageDetails.features && selectedPackageDetails.features.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Features</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {selectedPackageDetails.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedPackageDetails.coverage && Object.keys(selectedPackageDetails.coverage).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Coverage</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {Object.entries(selectedPackageDetails.coverage).map(([event, included], index) => (
                        included && <li key={index}>{event}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedPackageDetails.gallery_images && selectedPackageDetails.gallery_images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Gallery</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedPackageDetails.gallery_images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${selectedPackageDetails.name} gallery ${index + 1}`}
                          className="aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="primary" className="w-full" onClick={closePackageModal}>
                  Close
                </Button>
              </Card>
            </div>
          )}

          {selectedTeamMember && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={closeTeamMemberModal}
                  className="absolute top-4 right-4 text-gray-600 hover:text-rose-600"
                >
                  <X className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{selectedTeamMember.full_name}</h3>
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={selectedTeamMember.profile_photo || 'https://via.placeholder.com/150'}
                    alt={selectedTeamMember.full_name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{selectedTeamMember.role || 'Team Member'}</p>
                    <p className="text-sm text-gray-600">{selectedTeamMember.bio || 'No bio available.'}</p>
                  </div>
                </div>
                {(selectedTeamMember.photo_gallery?.length || selectedTeamMember.video_gallery?.length) && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{selectedTeamMember.full_name}'s Work</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedTeamMember.photo_gallery?.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${selectedTeamMember.full_name}'s work ${index + 1}`}
                          className="aspect-square object-cover rounded-lg"
                        />
                      ))}
                      {selectedTeamMember.video_gallery?.map((video, index) => (
                        <div key={index} className="relative aspect-square">
                          <video
                            src={video}
                            className="w-full h-full object-cover rounded-lg"
                            controls
                            preload="metadata"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="primary" className="w-full" onClick={closeTeamMemberModal}>
                  Close
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </VendorProfileErrorBoundary>
  );
};

export default React.memo(VendorProfile);