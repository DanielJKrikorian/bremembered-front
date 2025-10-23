import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, ShoppingCart, Calendar, MapPin, User, ArrowRight, Trash2, Edit, Plus, Check, CreditCard, Clock, Shield, Heart, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { trackPageView } from '../utils/analytics';
import { VendorSelectionModal } from '../components/cart/VendorSelectionModal';
import { AuthModal } from '../components/auth/AuthModal';
import { supabase } from '../lib/supabase';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { state, removeItem, updateItem, clearCart } = useCart();
  const { isAuthenticated, user, loading } = useAuth();
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFetchingFees, setIsFetchingFees] = useState(false);
  const [error, setError] = useState<string | null>(null); // For user-facing errors
  const analyticsTracked = useRef(false);
  const fetchedItems = useRef(new Set<string>()); // Track fetched item IDs

  // Track analytics only once on mount
  useEffect(() => {
    if (!loading && !analyticsTracked.current) {
      console.log('Tracking analytics for cart:', new Date().toISOString());
      trackPageView('cart', 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [loading, user?.id]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Memoize cart items to stabilize dependencies
  const cartItems = useMemo(() => state.items, [state.items]);

  // Fetch premium_amount for cart items
  useEffect(() => {
    const fetchFees = async () => {
      if (!cartItems.length || isFetchingFees) return;
      setIsFetchingFees(true);
      console.log('=== FETCH FEES ===', new Date().toISOString());
      try {
        let hasError = false;
        for (const item of cartItems) {
          // Skip if already fetched or no vendor
          if (fetchedItems.current.has(item.id) || !item.vendor?.id) {
            console.log(`Skipping fee fetch for item ${item.id}: ${fetchedItems.current.has(item.id) ? 'already fetched' : 'missing vendor'}`);
            if (!item.vendor?.id) {
              setError(`Invalid vendor for item ${item.package.name}. Please select a valid vendor.`);
              hasError = true;
            }
            continue;
          }

          // Fetch premium_amount from vendor_premiums
          const { data: premiumData, error: premiumError } = await supabase
            .from('vendor_premiums')
            .select('amount')
            .eq('vendor_id', item.vendor.id)
            .single();
          let premiumAmount = 0; // Default to $0.00 if no premium defined
          if (premiumError) {
            console.error(`Error fetching premium_amount for vendor ${item.vendor.id}:`, premiumError);
            console.log(`No premium_amount defined for vendor ${item.vendor.id}, using $0.00`);
          } else if (premiumData?.amount != null) {
            premiumAmount = premiumData.amount;
            console.log(`Fetched premium_amount for vendor ${item.vendor.id}: ${premiumAmount}`);
          } else {
            console.log(`No premium_amount defined for vendor ${item.vendor.id}, using $0.00`);
          }

          // Set travel_fee to 0 (no fetch needed in Cart.tsx)
          const travelFee = 0;

          // Update cart item only if fees differ
          if (item.package.premium_amount !== premiumAmount || item.package.travel_fee !== travelFee) {
            console.log(`Updating item ${item.id} with premium_amount: ${premiumAmount}, travel_fee: ${travelFee}`);
            updateItem(item.id, {
              ...item,
              package: {
                ...item.package,
                premium_amount: premiumAmount,
                travel_fee: travelFee,
              },
            });
          }

          // Mark item as fetched
          fetchedItems.current.add(item.id);
        }
        if (!hasError) {
          setError(null); // Clear error if no issues
        }
      } catch (err) {
        console.error('Error fetching fees:', err);
        setError('Failed to load cart pricing details. Please try again.');
      } finally {
        setIsFetchingFees(false);
      }
    };
    fetchFees();
  }, [cartItems, isFetchingFees]);

  const formatPrice = (amount: number | null | undefined) => {
    if (amount === undefined || amount === null || amount === 0) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  const calculateItemTotal = (item: any) => {
    const packagePrice = item.package.price / 100;
    const premium = item.package.premium_amount && item.package.premium_amount > 0 ? item.package.premium_amount / 100 : 0;
    const travel = item.package.travel_fee && item.package.travel_fee > 0 ? item.package.travel_fee / 100 : 0;
    const total = packagePrice + premium + travel;
    console.log(`Cart item ${item.id}: Package=${packagePrice}, Premium=${premium}, Travel=${travel}, Total=${total}`);
    return total;
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography':
        return '📸';
      case 'Videography':
        return '🎥';
      case 'DJ Services':
        return '🎵';
      case 'Live Musician':
        return '🎼';
      case 'Coordination':
        return '👰';
      case 'Planning':
        return '📅';
      default:
        return '💍';
    }
  };

  const handleChooseVendor = (item: any) => {
    setSelectedCartItem(item);
    setShowVendorModal(true);
  };

  const handleVendorSelected = (vendor: any, eventDetails: any) => {
    if (selectedCartItem) {
      // Clear fetched status for this item to refetch fees
      fetchedItems.current.delete(selectedCartItem.id);
      console.log(`Vendor selected for item ${selectedCartItem.id}:`, { vendor, eventDetails, initialPremium: selectedCartItem.package.premium_amount });
      updateItem(selectedCartItem.id, {
        vendor,
        eventDate: eventDetails.eventDate,
        eventTime: eventDetails.eventTime,
        endTime: eventDetails.endTime,
        venue: eventDetails.venue,
      });
    }
    setShowVendorModal(false);
    setSelectedCartItem(null);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Check if all items have vendors
    const itemsWithoutVendors = state.items.filter((item) => !item.vendor?.id);
    if (itemsWithoutVendors.length > 0) {
      alert('Please select vendors for all items before checkout');
      return;
    }

    // Calculate total amount excluding service fee to match Checkout.tsx
    const totalAmount = state.items.reduce((sum, item) => {
      const packagePrice = item.package.price || 0;
      const premium = item.package.premium_amount && item.package.premium_amount > 0 ? item.package.premium_amount : 0;
      const travel = item.package.travel_fee && item.package.travel_fee > 0 ? item.package.travel_fee : 0;
      return sum + packagePrice + premium + travel;
    }, 0);

    console.log(`Navigating to checkout with totalAmount: ${totalAmount} cents (${formatPrice(totalAmount)})`);

    // Navigate to checkout with cart data
    navigate('/checkout', {
      state: {
        cartItems: state.items,
        totalAmount,
      },
    });
  };

  const handleContinueShopping = () => {
    navigate('//search');
  };

  const totalServiceFee = state.items.length > 0 ? 50 : 0; // $50 per booking
  const subtotal = state.items.reduce((sum, item) => {
    const packagePrice = item.package.price || 0;
    const premium = item.package.premium_amount && item.package.premium_amount > 0 ? item.package.premium_amount : 0;
    const travel = item.package.travel_fee && item.package.travel_fee > 0 ? item.package.travel_fee : 0;
    return sum + packagePrice + premium + travel;
  }, 0);
  const grandTotal = subtotal + totalServiceFee * 100; // Include service fee for display only

  // Log totals for debugging
  console.log(`Rendering Cart with subtotal: ${subtotal} cents (${formatPrice(subtotal)}), Service Fee: ${totalServiceFee} dollars, grandTotal: ${grandTotal} cents (${formatPrice(grandTotal)})`);

  return (
    <div className="min-h-screen bg-gray-50">
      {isFetchingFees && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>
              Continue Shopping
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
              <p className="text-gray-600 mt-1">
                {state.items.length} item{state.items.length !== 1 ? 's' : ''} in your cart
              </p>
            </div>
          </div>
        </div>

        {state.items.length === 0 ? (
          /* Empty Cart */
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add wedding packages to get started with your perfect day</p>
            <Button variant="primary" onClick={handleContinueShopping}>
              Browse Wedding Services
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {state.items.map((item) => {
                const premiumPrice = item.package.premium_amount ? formatPrice(item.package.premium_amount) : null;
                const travelFee = item.package.travel_fee ? formatPrice(item.package.travel_fee) : null;
                const itemTotal = calculateItemTotal(item);

                return (
                  <Card key={item.id} className="p-6">
                    <div className="flex items-start space-x-6">
                      {/* Service Icon */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                        {getServiceIcon(item.package.service_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Package Info */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.package.name}</h3>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                {item.package.service_type}
                              </span>
                              {item.package.hour_amount && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.package.hour_amount}h
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.package.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-gray-900">{formatPrice(itemTotal * 100)}</div>
                            <div className="text-sm text-gray-500">Package: {formatPrice(item.package.price)}</div>
                            {premiumPrice && item.package.premium_amount > 0 && (
                              <div className="text-sm text-gray-500">Premium: {premiumPrice}</div>
                            )}
                            <div className="text-sm text-gray-500">
                              Travel: {travelFee || 'Local ($0.00)'}
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors mt-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Event Details */}
                        {(item.eventDate || item.venue) && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-green-900 mb-2">Event Details</h4>
                            <div className="space-y-1 text-sm">
                              {item.eventDate && (
                                <div className="flex items-center text-green-700">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span>
                                    {(() => {
                                      const [year, month, day] = item.eventDate.split('-').map(Number);
                                      return new Date(year, month - 1, day).toLocaleDateString('en-US', {
                                        timeZone: 'UTC',
                                      });
                                    })()}
                                    {item.eventTime && (
                                      <>
                                        {' at '}
                                        {new Date(`2000-01-01T${item.eventTime}`)
                                          .toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                            timeZone: 'UTC',
                                          })}
                                        {item.endTime && (
                                          <>
                                            {' - '}
                                            {new Date(`2000-01-01T${item.endTime}`)
                                              .toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true,
                                                timeZone: 'UTC',
                                              })}
                                          </>
                                        )}
                                      </>
                                    )}
                                  </span>
                                </div>
                              )}
                              {item.venue && (
                                <div className="flex items-center text-green-700">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{item.venue.name}</span>
                                  {item.venue.city && item.venue.state && (
                                    <span className="ml-1">
                                      ({item.venue.city}, {item.venue.state})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Vendor Selection */}
                        {item.vendor ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-900">Selected Vendor</h4>
                                  <p className="text-blue-700 text-sm">{item.vendor.name}</p>
                                  {item.vendor.rating && (
                                    <div className="flex items-center text-blue-700 text-sm">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                                      <span>{item.vendor.rating} rating</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleChooseVendor(item)}>
                                Change
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-amber-900">Vendor Selection Required</h4>
                                <p className="text-amber-700 text-sm">Choose your preferred vendor for this service</p>
                              </div>
                              <Button variant="primary" size="sm" onClick={() => handleChooseVendor(item)}>
                                Choose Vendor
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Package Features */}
                        {item.package.features && item.package.features.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">What's Included</h4>
                            <div className="flex flex-wrap gap-2">
                              {item.package.features.slice(0, 4).map((feature, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  {feature}
                                </span>
                              ))}
                              {item.package.features.length > 4 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                  +{item.package.features.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <h5 className="font-medium text-gray-900 text-sm mb-1">Notes</h5>
                            <p className="text-gray-700 text-sm">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Clear Cart */}
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>

                <div className="space-y-4 mb-6">
                  {state.items.map((item) => {
                    const itemTotal = calculateItemTotal(item);
                    return (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.package.name}</h4>
                          <p className="text-xs text-gray-600">{item.package.service_type}</p>
                          {item.vendor && (
                            <>
                              <p className="text-xs text-gray-600">Vendor: {item.vendor.name}</p>
                              {item.package.premium_amount && item.package.premium_amount > 0 && (
                                <div className="text-sm text-gray-500">Premium: {formatPrice(item.package.premium_amount)}</div>
                              )}
                              <p className="text-xs text-gray-600">
                                Travel: {item.package.travel_fee && item.package.travel_fee > 0 ? formatPrice(item.package.travel_fee) : 'Local ($0.00)'}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <div className="font-medium text-gray-900">{formatPrice(itemTotal * 100)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="font-medium">${totalServiceFee}</span>
                  </div>

                  <div className="flex justify-between text-lg font-semibold border-t pt-3">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                    icon={ArrowRight}
                    disabled={state.items.length === 0 || isFetchingFees || !!error}
                  >
                    {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
                  </Button>

                  <Button variant="outline" className="w-full" onClick={handleContinueShopping}>
                    Continue Shopping
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Secure checkout</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Direct messaging with your vendor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">24/7 customer support</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Recommended Add-ons */}
        {state.items.length > 0 && (
          <Card className="p-8 mt-12 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Complete Your Perfect Day</h3>
              <p className="text-gray-600 mb-6">
                Based on your selections, here are some services that would complement your wedding beautifully
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" onClick={() => navigate('/search')}>
                  Browse More Services
                </Button>
                <Button variant="outline" onClick={() => navigate('/inspiration')}>
                  Get Inspiration
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Vendor Selection Modal */}
      {selectedCartItem && (
        <VendorSelectionModal
          isOpen={showVendorModal}
          onClose={() => {
            setShowVendorModal(false);
            setSelectedCartItem(null);
          }}
          cartItem={selectedCartItem}
          onVendorSelected={handleVendorSelected}
        />
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode="signup" />
    </div>
  );
};

export default Cart;