import React, { useState } from 'react';
import { Star, MapPin, Clock, Users, Calendar, Check, Heart, Share2, MessageCircle, Shield, Award, Camera, ArrowLeft, Plus, ChevronRight, Play, Download, Eye } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useServicePackages, useVendorsByPackage } from '../hooks/useSupabase';
import { useCart } from '../context/CartContext';
import { useWeddingBoard } from '../hooks/useWeddingBoard';
import { useAuth } from '../context/AuthContext';

export const PackageDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors'>('overview');
  const { addItem, openCart, state: cartState } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorited } = useWeddingBoard();
  const { isAuthenticated } = useAuth();
  
  // Scroll to top when component mounts or id changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Get the specific package
  const { packages, loading: packageLoading } = useServicePackages();
  const packageData = packages.find(p => p.id === id);
  
  // Get vendors who offer this package
  const { vendors, loading: vendorsLoading } = useVendorsByPackage(id || '');

  const isPackageFavorited = packageData ? isFavorited(packageData.id) : false;

  const handleToggleFavorite = async () => {
    if (!packageData) return;
    
    if (!isAuthenticated) {
      alert('Please sign in to save favorites');
      return;
    }

    try {
      if (isPackageFavorited) {
        const { favorites } = useWeddingBoard();
        const favorite = favorites.find(fav => fav.package_id === packageData.id);
        if (favorite) {
          await removeFromFavorites(favorite.id);
        }
      } else {
        await addToFavorites(packageData.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return Camera;
      case 'Videography': return Play;
      case 'DJ Services': return Users;
      case 'Live Musician': return Users;
      case 'Coordination': return Calendar;
      case 'Planning': return Calendar;
      default: return Star;
    }
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

  const getPackageCoverage = (coverage: Record<string, any>) => {
    if (!coverage || typeof coverage !== 'object') return [];
    
    const events = [];
    if (coverage.events && Array.isArray(coverage.events)) {
      events.push(...coverage.events);
    }
    
    Object.keys(coverage).forEach(key => {
      if (key !== 'events' && coverage[key] === true) {
        events.push(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    });
    
    return events;
  };

  const handleBookPackage = () => {
    if (packageData) {
      // Add to cart instead of going directly to checkout
      addItem({
        package: packageData
      });
      openCart();
    }
  };

  const handleAddToCart = () => {
    if (packageData) {
      addItem({
        package: packageData
      });
      openCart();
    }
  };

  if (packageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Package Not Found</h2>
          <p className="text-gray-600 mb-6">The package you're looking for doesn't exist or has been removed.</p>
          <Button variant="primary" onClick={() => navigate('/search')}>
            Browse All Packages
          </Button>
        </Card>
      </div>
    );
  }

  const ServiceIcon = getServiceIcon(packageData.service_type);
  const packageImages = packageData.primary_image 
    ? [packageData.primary_image, ...getServicePhotos(packageData.service_type).slice(1)]
    : getServicePhotos(packageData.service_type);
  const packageCoverage = getPackageCoverage(packageData.coverage || {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
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
          <span className="text-gray-900 font-medium">{packageData.name}</span>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            icon={ArrowLeft} 
            onClick={() => navigate('/search')}
          >
            Back to Search
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={packageImages[selectedImage]}
                  alt={packageData.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-full transition-colors shadow-lg ${
                      isPackageFavorited 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-white/80 hover:bg-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${
                      isPackageFavorited 
                        ? 'text-white fill-current' 
                        : 'text-gray-600'
                    }`} />
                  </button>
                  <Button variant="ghost" icon={Share2} size="sm" className="bg-white/80 hover:bg-white">
                  </Button>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                  {selectedImage + 1} / {packageImages.length}
                </div>
              </div>
              <div className="p-4">
                <div className="flex space-x-4 overflow-x-auto">
                  {packageImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${packageData.name} ${index + 1}`}
                      className={`w-20 h-20 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all ${
                        selectedImage === index ? 'ring-2 ring-rose-500 scale-105' : 'hover:scale-105'
                      }`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Package Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                      {packageData.service_type}
                    </span>
                    {packageData.event_type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {packageData.event_type}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{packageData.name}</h1>
                  <div className="flex items-center space-x-6 text-gray-600">
                    {packageData.hour_amount && (
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-1" />
                        <span>{packageData.hour_amount} hours</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-1" />
                      <span>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(packageData.price)}
                  </div>
                  <div className="text-sm text-gray-500">Starting price</div>
                </div>
              </div>

              <p className="text-gray-600 text-lg leading-relaxed">{packageData.description}</p>
            </Card>

            {/* Tabs */}
            <Card className="overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'vendors', label: `Available Vendors (${vendors.length})` }
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
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4">What's Included</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Package Features</h4>
                          <div className="space-y-3">
                            {packageData.features?.map((feature, index) => (
                              <div key={index} className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 text-green-600" />
                                </div>
                                <span className="text-gray-700">{feature}</span>
                              </div>
                            )) || (
                              <p className="text-gray-500 italic">No specific features listed</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Coverage Details</h4>
                          <div className="space-y-3">
                            {packageCoverage.length > 0 ? (
                              packageCoverage.map((coverage, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <span className="text-gray-700">{coverage}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 italic">Coverage details vary by vendor</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-6">Package Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ServiceIcon className="w-6 h-6 text-rose-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Service Type</h4>
                          <p className="text-sm text-gray-600">{packageData.service_type}</p>
                        </div>
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-6 h-6 text-amber-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Duration</h4>
                          <p className="text-sm text-gray-600">
                            {packageData.hour_amount ? `${packageData.hour_amount} hours` : 'Varies by vendor'}
                          </p>
                        </div>
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-6 h-6 text-emerald-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Quality Guarantee</h4>
                          <p className="text-sm text-gray-600">Verified professionals only</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'vendors' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold text-gray-900">Available Vendors</h3>
                      <p className="text-gray-600">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} offer this package</p>
                    </div>

                    {vendorsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading vendors...</p>
                      </div>
                    ) : vendors.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No vendors available</h4>
                        <p className="text-gray-600">This package is currently not offered by any vendors.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {vendors.filter((vendor, index, self) => 
                          index === self.findIndex(v => v.id === vendor.id)
                        ).map((vendor) => (
                          <Card key={vendor.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start space-x-4 mb-4">
                              {vendor.profile_photo ? (
                                <img
                                  src={vendor.profile_photo}
                                  alt={vendor.name}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Users className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{vendor.name}</h4>
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                  {vendor.rating && (
                                    <>
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                      <span className="mr-2">{vendor.rating}</span>
                                    </>
                                  )}
                                  <span>{vendor.years_experience} years experience</span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {vendor.profile || `Professional ${packageData.service_type.toLowerCase()} specialist`}
                                </p>
                              </div>
                            </div>

                            {vendor.specialties && vendor.specialties.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-1">
                                  {vendor.specialties.slice(0, 3).map((specialty, index) => (
                                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                      {specialty}
                                    </span>
                                  ))}
                                  {vendor.specialties.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                      +{vendor.specialties.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <Button 
                                variant="primary" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => navigate(`/vendor/${vendor.id}`, {
                                  state: { vendor, package: packageData }
                                })}
                              >
                                View Profile
                              </Button>
                              <Button 
                                variant="outline" 
                                icon={MessageCircle} 
                                size="sm"
                              >
                                Message
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            {/* Quick Book */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Book This Package</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Package Price</span>
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(packageData.price)}</span>
                </div>
                {packageData.hour_amount && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{packageData.hour_amount} hours</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium">$150</span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold border-t pt-3">
                  <span>Total</span>
                  <span>{formatPrice(packageData.price + 15000)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={openCart}
                >
                  View Cart ({cartState.items.length})
                </Button>
              </div>
            </Card>

            {/* Package Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Type:</span>
                  <span className="font-medium">{packageData.service_type}</span>
                </div>
                {packageData.event_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Type:</span>
                    <span className="font-medium">{packageData.event_type}</span>
                  </div>
                )}
                {packageData.hour_amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{packageData.hour_amount} hours</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Vendors:</span>
                  <span className="font-medium">{vendors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Status:</span>
                  <span className="font-medium text-green-600">Available</span>
                </div>
              </div>
            </Card>

            {/* Trust & Safety */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust & Safety</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">All vendors verified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Secure payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Quality guarantee</span>
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
    </div>
  );
};