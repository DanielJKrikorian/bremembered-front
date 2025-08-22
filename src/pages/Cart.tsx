import React, { useState } from 'react';
import { ShoppingCart, Calendar, MapPin, User, ArrowRight, Trash2, Edit, Plus, Check, Clock, Star, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useCart } from '../context/CartContext';
import { useRecommendedVendors } from '../hooks/useSupabase';
import { Vendor } from '../types/booking';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, removeItem, updateItem, clearCart } = useCart();
  const [selectingVendorForItem, setSelectingVendorForItem] = useState<string | null>(
    location.state?.selectVendorForItem || null
  );
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedItemForVendor, setSelectedItemForVendor] = useState<string | null>(null);

  // Get vendors for the item we're selecting a vendor for
  const itemForVendorSelection = state.items.find(item => item.id === selectingVendorForItem);
  const { vendors: availableVendors, loading: vendorsLoading } = useRecommendedVendors({
    servicePackageId: itemForVendorSelection?.package.id || '',
    eventDate: itemForVendorSelection?.eventDate || '',
    region: itemForVendorSelection?.venue?.city || '',
    languages: [],
    styles: [],
    vibes: []
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return '📸';
      case 'Videography': return '🎥';
      case 'DJ Services': return '🎵';
      case 'Live Musician': return '🎼';
      case 'Coordination': return '👰';
      case 'Planning': return '📅';
      default: return '💍';
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    if (selectingVendorForItem) {
      updateItem(selectingVendorForItem, { vendor });
      setSelectingVendorForItem(null);
      setShowVendorModal(false);
    }
  };

  const handleChooseVendor = (itemId: string) => {
    setSelectedItemForVendor(itemId);
    setSelectingVendorForItem(itemId);
    setShowVendorModal(true);
  };

  const handlePickForMe = (itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    // Navigate to vendor recommendation flow
    navigate('/booking/vendor-recommendation', {
      state: {
        selectedPackage: item.package,
        selectedServices: [item.package.service_type],
        currentServiceIndex: 0,
        eventDate: item.eventDate,
        venue: item.venue,
        returnToCart: true
      }
    });
  };

  const handleProceedToCheckout = () => {
    // Check if all items have vendors selected
    const itemsWithoutVendors = state.items.filter(item => !item.vendor);
    
    if (itemsWithoutVendors.length > 0) {
      // Focus on first item without vendor
      setSelectingVendorForItem(itemsWithoutVendors[0].id);
      setShowVendorModal(true);
      return;
    }

    // All items have vendors, proceed to checkout
    navigate('/checkout', {
      state: {
        cartItems: state.items,
        totalAmount: state.totalAmount
      }
    });
  };

  const incompleteItems = state.items.filter(item => !item.vendor);
  const completeItems = state.items.filter(item => item.vendor);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Wedding Cart</h1>
              <p className="text-gray-600">
                Review your selected packages and choose your vendors
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/search')}
              >
                Continue Shopping
              </Button>
              {state.items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear Cart
                </Button>
              )}
            </div>
          </div>
        </div>

        {state.items.length === 0 ? (
          /* Empty Cart */
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">
              Start browsing our amazing wedding services to build your perfect day
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/search')}
            >
              Browse Services
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items Needing Vendors */}
              {incompleteItems.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Choose Your Vendors ({incompleteItems.length})
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {incompleteItems.map((item) => (
                      <Card key={item.id} className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                            {getServiceIcon(item.package.service_type)}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {item.package.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {item.package.description}
                            </p>
                            
                            {/* Package Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className="font-medium">Service:</span>
                                  <span className="ml-2">{item.package.service_type}</span>
                                </div>
                                {item.package.hour_amount && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>{item.package.hour_amount} hours</span>
                                  </div>
                                )}
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className="font-medium">Price:</span>
                                  <span className="ml-2 text-lg font-bold text-gray-900">
                                    {formatPrice(item.package.price)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {item.eventDate && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>{new Date(item.eventDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {item.venue && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span>{item.venue.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Vendor Selection */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-amber-900 mb-3">Choose Your Vendor</h4>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleChooseVendor(item.id)}
                                  className="flex-1"
                                >
                                  Browse Vendors
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePickForMe(item.id)}
                                  className="flex-1"
                                >
                                  Pick For Me
                                </Button>
                              </div>
                            </div>

                            {/* Features */}
                            {item.package.features && item.package.features.length > 0 && (
                              <div className="mb-4">
                                <h5 className="font-medium text-gray-900 mb-2">Package Features:</h5>
                                <div className="flex flex-wrap gap-1">
                                  {item.package.features.slice(0, 3).map((feature, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                      <Check className="w-3 h-3 mr-1" />
                                      {feature}
                                    </span>
                                  ))}
                                  {item.package.features.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                      +{item.package.features.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Items */}
              {completeItems.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Ready to Book ({completeItems.length})
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {completeItems.map((item) => (
                      <Card key={item.id} className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                            {getServiceIcon(item.package.service_type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {item.package.name}
                              </h3>
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600" />
                              </div>
                            </div>
                            
                            {/* Vendor Info */}
                            {item.vendor && (
                              <div className="flex items-center space-x-3 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <img
                                  src={item.vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                                  alt={item.vendor.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium text-green-900">{item.vendor.name}</h4>
                                  <div className="flex items-center text-sm text-green-700">
                                    {item.vendor.rating && (
                                      <>
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                                        <span>{item.vendor.rating}</span>
                                        <span className="mx-2">•</span>
                                      </>
                                    )}
                                    <span>{item.vendor.years_experience} years experience</span>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleChooseVendor(item.id)}
                                >
                                  Change
                                </Button>
                              </div>
                            )}

                            {/* Event Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                {item.eventDate && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>
                                      {new Date(item.eventDate).toLocaleDateString()}
                                      {item.eventTime && ` at ${item.eventTime}`}
                                    </span>
                                  </div>
                                )}
                                {item.venue && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span>{item.venue.name}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatPrice(item.package.price)}
                                </div>
                                {item.package.hour_amount && (
                                  <div className="text-sm text-gray-500">
                                    {item.package.hour_amount} hours
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Features */}
                            {item.package.features && item.package.features.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-1">
                                  {item.package.features.slice(0, 3).map((feature, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                      <Check className="w-3 h-3 mr-1" />
                                      {feature}
                                    </span>
                                  ))}
                                  {item.package.features.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                      +{item.package.features.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Add More Services */}
              <Card className="p-6 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Need More Services?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add more wedding services to create your complete package
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/search')}
                  >
                    Browse More Services
                  </Button>
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {item.package.name}
                        </h4>
                        <p className="text-xs text-gray-600">{item.package.service_type}</p>
                        {item.vendor && (
                          <p className="text-xs text-green-600">✓ Vendor selected</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatPrice(item.package.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice(state.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">Service Fee:</span>
                    <span className="font-medium">$150</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold border-t pt-3">
                    <span>Total:</span>
                    <span>{formatPrice(state.totalAmount + 15000)}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-6">
                  {incompleteItems.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                        <span className="font-medium text-amber-900">Action Required</span>
                      </div>
                      <p className="text-sm text-amber-800">
                        Choose vendors for {incompleteItems.length} service{incompleteItems.length !== 1 ? 's' : ''} to proceed
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">Ready to Book</span>
                      </div>
                      <p className="text-sm text-green-800">
                        All services have vendors selected
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleProceedToCheckout}
                    disabled={state.items.length === 0}
                  >
                    {incompleteItems.length > 0 
                      ? `Choose ${incompleteItems.length} Vendor${incompleteItems.length !== 1 ? 's' : ''}`
                      : 'Proceed to Checkout'
                    }
                  </Button>
                  
                  <div className="text-center text-xs text-gray-500">
                    Free cancellation up to 30 days before your event
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Vendor Selection Modal */}
        {showVendorModal && itemForVendorSelection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Choose {itemForVendorSelection.package.service_type} Vendor
                  </h3>
                  <p className="text-gray-600 mt-1">
                    For {itemForVendorSelection.package.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowVendorModal(false);
                    setSelectingVendorForItem(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {vendorsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading available vendors...</p>
                  </div>
                ) : availableVendors.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No vendors available</h4>
                    <p className="text-gray-600 mb-6">
                      No vendors are currently available for this package and date.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => handlePickForMe(itemForVendorSelection.id)}
                    >
                      Let Us Find Options
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableVendors.map((vendor) => (
                      <Card key={vendor.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start space-x-4 mb-4">
                          <img
                            src={vendor.profile_photo || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
                            alt={vendor.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
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
                              {vendor.profile || `Professional ${itemForVendorSelection.package.service_type.toLowerCase()} specialist`}
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
                            onClick={() => handleVendorSelect(vendor)}
                          >
                            Select Vendor
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
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};