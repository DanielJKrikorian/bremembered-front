import React, { useState, useEffect } from 'react';
import { Heart, Star, Camera, Video, Music, Users, ArrowRight, Shield, Clock, Award, Calendar, Sparkles, Check, MessageCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CustomPackageModal } from '../components/common/CustomPackageModal';
import { BookingModal } from '../components/common/BookingModal';
import { AuthModal } from '../components/auth/AuthModal';
import { useLatestReviews, useServicePackages } from '../hooks/useSupabase';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [claimedDeals, setClaimedDeals] = useState<Record<string, { code: string; expiresAt: string }>>({});
  const { addItem, openCart } = useCart();
  const { reviews, loading: reviewsLoading } = useLatestReviews(3);
  const { packages, loading: packagesLoading } = useServicePackages();

  // Track page view for analytics
  useEffect(() => {
    const trackPageView = async () => {
      if (!supabase) return;
      try {
        await supabase.from('analytics_events').insert({
          site: window.location.hostname,
          event_type: 'page_view',
          session_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          screen_name: 'home',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error tracking page view:', err);
      }
    };
    trackPageView();
  }, []);

  const handleClaimDeal = async (pkg: any) => {
    try {
      console.log('Claiming deal for package:', pkg);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey || 
          supabaseUrl === 'https://placeholder.supabase.co' ||
          supabaseAnonKey === 'placeholder-key') {
        console.log('Supabase not configured - using demo mode');
        const servicePrefix = pkg.service_type.substring(0, 3).toUpperCase();
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `${servicePrefix}${randomSuffix}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        setClaimedDeals(prev => ({
          ...prev,
          [pkg.id]: { code, expiresAt }
        }));
        return;
      }

      console.log('Making request to edge function...');
      const response = await fetch(`${supabaseUrl}/functions/v1/claim-deal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.name,
          serviceType: pkg.service_type
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Edge function response:', data);
      
      if (data.success && data.coupon) {
        setClaimedDeals(prev => ({
          ...prev,
          [pkg.id]: { 
            code: data.coupon.code, 
            expiresAt: data.coupon.expiration_date 
          }
        }));
      } else {
        throw new Error(data.error || 'Failed to claim deal');
      }
    } catch (error) {
      console.error('Error claiming deal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Sorry, there was an error claiming this deal: ${errorMessage}`);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getDealOfTheWeek = () => {
    if (packages.length === 0) return [];
    
    const weekOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24 * 7));
    
    const packagesByServiceType = packages.reduce((acc, pkg) => {
      if (!acc[pkg.service_type]) {
        acc[pkg.service_type] = [];
      }
      acc[pkg.service_type].push(pkg);
      return acc;
    }, {} as Record<string, typeof packages>);
    
    const serviceTypes = Object.keys(packagesByServiceType);
    if (serviceTypes.length === 0) return [];
    
    const startIndex = weekOfYear % serviceTypes.length;
    const selectedServiceTypes = [];
    
    for (let i = 0; i < 3 && i < serviceTypes.length; i++) {
      const serviceTypeIndex = (startIndex + i) % serviceTypes.length;
      selectedServiceTypes.push(serviceTypes[serviceTypeIndex]);
    }
    
    const dealsOfTheDay = selectedServiceTypes.map(serviceType => {
      const servicePackages = packagesByServiceType[serviceType];
      const packageIndex = weekOfYear % servicePackages.length;
      return servicePackages[packageIndex];
    });
    
    return dealsOfTheDay;
  };

  const dealsOfTheWeek = getDealOfTheWeek();

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

  const getServicePhoto = (serviceType: string, packageId: string) => {
    const hash = packageId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const photoIndex = Math.abs(hash) % getServicePhotos(serviceType).length;
    return getServicePhotos(serviceType)[photoIndex];
  };

  const getServicePhotos = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': 
        return [
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      case 'Videography': 
        return [
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      case 'DJ Services': 
        return [
          'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      default: 
        return [
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
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

  const getDiscountedPrice = (price: number) => {
    return Math.round(price * 0.9);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      <section 
        className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex items-center justify-center text-center bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `url("https://eecbrvehrhrvdzuutliq.supabase.co/storage/v1/object/public/public-1/60ae67d4-5482-4dc6-8a0f-a557848139c3/DSC06549.jpg")`
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight">
            Plan Your Perfect Wedding
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
            The ultimate all-in-one platform with more tools than any other site to make your dream wedding a reality.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center text-white/90">
              <Check className="w-6 h-6 text-rose-400 mr-3" />
              <span className="text-sm sm:text-base">Guest Management & RSVPs</span>
            </div>
            <div className="flex items-center text-white/90">
              <Check className="w-6 h-6 text-rose-400 mr-3" />
              <span className="text-sm sm:text-base">Custom Wedding Websites</span>
            </div>
            <div className="flex items-center text-white/90">
              <Check className="w-6 h-6 text-rose-400 mr-3" />
              <span className="text-sm sm:text-base">Table Layouts & Timelines</span>
            </div>
            <div className="flex items-center text-white/90">
              <Check className="w-6 h-6 text-rose-400 mr-3" />
              <span className="text-sm sm:text-base">Budget Tools & Payments</span>
            </div>
            <div className="flex items-center text-white/90">
              <Check className="w-6 h-6 text-rose-400 mr-3" />
              <span className="text-sm sm:text-base">Manage Bookings</span>
            </div>
            <div className="flex items-center text-white/90">
              <Check className="w-6 h-6 text-rose-400 mr-3" />
              <span className="text-sm sm:text-base">Message Vendors</span>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
            className="px-10 py-5 text-lg font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-full"
          >
            Get Started Free <Sparkles className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm sm:text-base text-white/80">
            Join thousands of couples—start planning today!
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-rose-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
            <div className="text-base text-gray-600">Book Vendors</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
            <div className="text-base text-gray-600">Support Team</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">5.0</div>
            <div className="text-base text-gray-600">Rated Vendors</div>
          </div>
        </div>
      </div>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything You Need for Your Perfect Day
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From capturing precious moments to coordinating every detail, our curated vendors bring your vision to life.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
            {[
              { 
                icon: Camera, 
                title: 'Photography', 
                description: 'Capture every precious moment with artistic flair', 
                color: 'bg-rose-100 text-rose-600',
                features: ['Engagement shoots', 'Wedding day coverage', 'Digital galleries']
              },
              { 
                icon: Video, 
                title: 'Videography', 
                description: 'Cinematic wedding films that tell your story', 
                color: 'bg-amber-100 text-amber-600',
                features: ['Highlight reels', 'Full ceremony', 'Drone footage']
              },
              { 
                icon: Music, 
                title: 'DJ Services', 
                description: 'Keep the celebration alive with perfect music', 
                color: 'bg-emerald-100 text-emerald-600',
                features: ['Sound systems', 'Lighting', 'MC services']
              },
              { 
                icon: Users, 
                title: 'Coordination', 
                description: 'Stress-free planning from start to finish', 
                color: 'bg-purple-100 text-purple-600',
                features: ['Timeline planning', 'Vendor management', 'Day-of coordination']
              },
              { 
                icon: Calendar, 
                title: 'Planning', 
                description: 'Full-service wedding planning from engagement to "I do"', 
                color: 'bg-blue-100 text-blue-600',
                features: ['Venue selection', 'Vendor sourcing', 'Budget management']
              },
              { 
                icon: Music, 
                title: 'Live Musician', 
                description: 'Beautiful live music for ceremonies and receptions', 
                color: 'bg-indigo-100 text-indigo-600',
                features: ['Ceremony music', 'Cocktail hour', 'Special performances']
              }
            ].map((service, index) => (
              <Card key={index} hover className="text-center p-6 group">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="text-sm text-gray-500 mb-6 space-y-1">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/search', {
                    state: {
                      filters: {
                        serviceTypes: [service.title]
                      }
                    }
                  })}
                >
                  Browse <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="font-bold">This Week's Special Deals</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Deals of the Week - 10% Off!
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Limited time offers on premium wedding packages. These deals rotate weekly, so book now!
            </p>
          </div>

          {packagesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading this week's deals...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dealsOfTheWeek.map((pkg) => {
                const ServiceIcon = getServiceIcon(pkg.service_type);
                const originalPrice = pkg.price;
                const discountedPrice = getDiscountedPrice(originalPrice);
                const savings = originalPrice - discountedPrice;
                
                return (
                  <Card key={pkg.id} hover className="overflow-hidden cursor-pointer relative" onClick={() => navigate(`/package/${pkg.id}`)}>
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        10% OFF THIS WEEK
                      </div>
                    </div>
                    
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={pkg.primary_image || getServicePhoto(pkg.service_type, pkg.id)}
                        alt={pkg.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                          <ServiceIcon className="w-4 h-4 text-rose-600" />
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          {pkg.service_type}
                        </span>
                        {pkg.event_type && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {pkg.event_type}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{pkg.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{pkg.description}</p>

                      {pkg.features && pkg.features.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {pkg.features.slice(0, 2).map((feature, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <Check className="w-3 h-3 mr-1" />
                                {feature}
                              </span>
                            ))}
                            {pkg.features.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                +{pkg.features.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg text-gray-500 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                          <span className="text-2xl font-bold text-rose-600">
                            {formatPrice(discountedPrice)}
                          </span>
                        </div>
                        {pkg.hour_amount && (
                          <div className="text-xs text-gray-500">
                            {pkg.hour_amount} hours
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      {claimedDeals[pkg.id] ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-800">Deal Claimed!</span>
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex items-center justify-between bg-white rounded border p-2 mb-2">
                            <code className="text-sm font-mono text-gray-900">{claimedDeals[pkg.id].code}</code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(claimedDeals[pkg.id].code);
                              }}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-green-700">
                            Expires: {new Date(claimedDeals[pkg.id].expiresAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                          <div className="mt-3">
                            <Button 
                              size="sm" 
                              variant="primary" 
                              className="w-full"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                addItem({ package: pkg });
                                openCart();
                              }}
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="primary" 
                          className="w-full"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleClaimDeal(pkg);
                          }}
                        >
                          Claim This Deal
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="text-center mt-12">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/search')}
            >
              Browse All Wedding Packages
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How B. Remembered Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to your perfect wedding day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search & Discover',
                description: 'Browse our curated selection of wedding vendors and packages tailored to your location and style.',
                icon: '🔍'
              },
              {
                step: '02',
                title: 'Compare & Book',
                description: 'Compare packages, read reviews, and book your perfect wedding team with secure payment processing.',
                icon: '💝'
              },
              {
                step: '03',
                title: 'Celebrate & Remember',
                description: 'Work with your vendors to create unforgettable moments that will be remembered for a lifetime.',
                icon: '🎉'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-rose-600">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Love Stories from Real Couples
            </h2>
            <p className="text-xl text-gray-600">
              See what couples are saying about their B. Remembered experience
            </p>
          </div>

          {reviewsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading real couple reviews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((review, index) => {
                const fallbackImages = [
                  'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
                  'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400',
                  'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=400',
                  'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=400',
                  'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400'
                ];
                const imageIndex = index % fallbackImages.length;
                const coupleImage = review.couple?.profile_photo || fallbackImages[imageIndex];
                
                return (
                  <Card key={review.id} className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(review.overall_rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {review.vendor?.name || 'B. Remembered'} {review.service_type && <span className="text-gray-500 font-normal">({review.service_type})</span>}
                      </h4>
                    </div>
                    <p className="text-gray-600 mb-4 italic">"{review.feedback}"</p>
                    <div className="flex items-center">
                      <img
                        src={coupleImage}
                        alt={review.couple?.name || 'Happy Couple'}
                        className="w-12 h-12 rounded-full object-cover mr-3"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.couple?.name || 'Happy Couple'}</h4>
                        {review.couple?.wedding_date && (
                          <p className="text-xs text-gray-400">
                            {new Date(review.couple.wedding_date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Couples</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">500+</div>
              <div className="text-gray-600">Book Vendors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">50+</div>
              <div className="text-gray-600">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">99%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-500 to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Planning Your Dream Wedding?
          </h2>
          <p className="text-xl text-white mb-8 opacity-90">
            Join thousands of couples who found their perfect wedding team through B. Remembered
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-rose-600"
              onClick={() => navigate('/booking/services')}
            >
              Browse Services
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-rose-600"
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
};