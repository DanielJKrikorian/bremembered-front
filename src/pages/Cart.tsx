// src/pages/Cart.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ShoppingCart, Calendar, MapPin, ArrowRight, Trash2,
  Clock, Check, Camera, Video, Music, Users, Shield, Heart, Package, Flower, 
  Cake, Home, Scissors, Gem, Church, Car, Palette, Lightbulb, 
  Sparkles, Wine, Gift, Shirt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { trackPageView } from '../utils/analytics';
import { AuthModal } from '../components/auth/AuthModal';
import { DateVenueModal } from '../components/cart/DateVenueModal';
import { supabase } from '../lib/supabase'; // ← NEW

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { state, removeItem, updateItem, clearCart } = useCart();
  const { isAuthenticated, user, loading } = useAuth();
  const [showDateVenueModal, setShowDateVenueModal] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const analyticsTracked = useRef(false);

  // LOOKUP: vendorId → photo URL
  const [vendorPhotos, setVendorPhotos] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!loading && !analyticsTracked.current) {
      trackPageView('cart', 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [loading, user?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // LOOKUP: Get photo from Supabase Storage using vendor.id
  useEffect(() => {
    const vendorIds = [...new Set(state.items.map(i => i.vendor?.id).filter(Boolean))];
    if (vendorIds.length === 0) return;

    const fetchPhotos = async () => {
      const photos: Record<string, string | null> = {};

      for (const id of vendorIds) {
        try {
          const { data, error } = await supabase.storage
            .from('vendor_media')
            .list(`${id}/photo`, {
              limit: 1,
              offset: 0,
              sortBy: { column: 'name', order: 'asc' }
            });

          if (error) throw error;

          if (data && data.length > 0) {
            const file = data[0];
            const { data: urlData } = supabase.storage
              .from('vendor_media')
              .getPublicUrl(`${id}/photo/${file.name}`);
            photos[id] = urlData.publicUrl;
          } else {
            photos[id] = null;
          }
        } catch (err) {
          console.error('Photo lookup failed for vendor:', id, err);
          photos[id] = null;
        }
      }

      setVendorPhotos(photos);
    };

    fetchPhotos();
  }, [state.items]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const getServiceIcon = (serviceType: string) => {
    const iconClass = "w-10 h-10";
    const type = serviceType.toLowerCase();

    switch (true) {
      case type.includes('photo'): return <Camera className={iconClass} />;
      case type.includes('video'): return <Video className={iconClass} />;
      case type.includes('dj'): return <Music className={iconClass} />;
      case type.includes('musician') || type.includes('band'): return <Guitar className={iconClass} />;
      case type.includes('coordination'): return <Users className={iconClass} />;
      case type.includes('planning'): return <Calendar className={iconClass} />;
      case type.includes('florist'): return <Flower className={iconClass} />;
      case type.includes('catering'): return <ChefHat className={iconClass} />;
      case type.includes('cake'): return <Cake className={iconClass} />;
      case type.includes('venue'): return <Home className={iconClass} />;
      case type.includes('hair') || type.includes('makeup'): return <Scissors className={iconClass} />;
      case type.includes('jewelry'): return <Gem className={iconClass} />;
      case type.includes('officiant'): return <Church className={iconClass} />;
      case type.includes('transport'): return <Car className={iconClass} />;
      case type.includes('decor'): return <Palette className={iconClass} />;
      case type.includes('lighting'): return <Lightbulb className={iconClass} />;
      case type.includes('entertainment'): return <Sparkles className={iconClass} />;
      case type.includes('bar'): return <Wine className={iconClass} />;
      case type.includes('rental'): return <Package className={iconClass} />;
      case type.includes('gift'): return <Gift className={iconClass} />;
      case type.includes('dress') || type.includes('suit'): return <Shirt className={iconClass} />;
      default: return <Package className={iconClass} />;
    }
  };

  const handleOpenDateVenue = (item: any) => {
    setSelectedCartItem(item);
    setShowDateVenueModal(true);
  };

  const handleSaveDateVenue = (details: any) => {
    updateItem(selectedCartItem.id, details);
    setShowDateVenueModal(false);
    setSelectedCartItem(null);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (state.items.some(i => !i.eventDate || !i.venue)) {
      alert('Please set date and venue for all items');
      return;
    }

    const totalAmount = state.items.reduce((sum, i) => sum + (i.package.price || 0), 0);

    navigate('/checkout', { 
      state: { cartItems: state.items, totalAmount } 
    });
  };

  const handleContinueShopping = () => navigate('/search');
  const subtotal = state.items.reduce((sum, i) => sum + (i.package.price || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add wedding packages to get started</p>
            <Button variant="primary" onClick={handleContinueShopping}>
              Browse Wedding Services
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {state.items.map((item) => {
                const vendorId = item.vendor?.id;
                const photoUrl = vendorId ? vendorPhotos[vendorId] : null;

                return (
                  <Card key={item.id} className="p-6">
                    <div className="flex items-start space-x-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getServiceIcon(item.package.service_type)}
                      </div>

                      <div className="flex-1">
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
                            <div className="text-lg font-bold text-gray-900">{formatPrice(item.package.price)}</div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors mt-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* LOOKUP PHOTO BY vendor.id */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={item.vendor.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = 40; canvas.height = 40;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.fillStyle = '#f43f5e'; ctx.fillRect(0, 0, 40, 40);
                                      ctx.font = 'bold 16px system-ui'; ctx.fillStyle = '#ffffff';
                                      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                                      const initials = item.vendor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                                      ctx.fillText(initials, 20, 20);
                                      e.currentTarget.src = canvas.toDataURL();
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-rose-500">
                                  <span className="text-white font-bold text-sm">
                                    {item.vendor?.name ? item.vendor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'V'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-blue-900">Vendor</h4>
                              <p className="text-blue-700 text-sm">{item.vendor?.name || 'Unknown Vendor'}</p>
                            </div>
                          </div>
                        </div>

                        {/* DATE & VENUE */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-green-900">Event Details</h4>
                            <Button variant="outline" size="sm" onClick={() => handleOpenDateVenue(item)}>
                              Change Details
                            </Button>
                          </div>
                          {item.eventDate ? (
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center text-green-700">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>
                                  {new Date(item.eventDate).toLocaleDateString()}
                                  {item.eventTime && (
                                    <> at {new Date(`2000-01-01T${item.eventTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</>
                                  )}
                                </span>
                              </div>
                              {item.venue && (
                                <div className="flex items-center text-green-700">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{item.venue.name}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleOpenDateVenue(item)}>
                              Set Date & Venue
                            </Button>
                          )}
                        </div>

                        {/* FEATURES */}
                        {item.package.features?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">What's Included</h4>
                            <div className="flex flex-wrap gap-2">
                              {item.package.features.slice(0, 4).map((f: string, i: number) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  <Check className="w-3 h-3 mr-1" />
                                  {f}
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
                      </div>
                    </div>
                  </Card>
                );
              })}

              <div className="text-center">
                <Button variant="outline" onClick={clearCart} className="text-red-600 border-red-200 hover:bg-red-50">
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div>
              <Card className="p-6 sticky top-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
                <div className="space-y-6 mb-6">
                  {state.items.map((item) => (
                    <div key={item.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start space-x-3 mb-2">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getServiceIcon(item.package.service_type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{item.package.name}</h4>
                          <p className="text-xs text-gray-600">{item.vendor?.name || 'Unknown Vendor'}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatPrice(item.package.price)}</div>
                        </div>
                      </div>
                      {item.eventDate && (
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>
                              {new Date(item.eventDate).toLocaleDateString()}
                              {item.eventTime && (
                                <> at {new Date(`2000-01-01T${item.eventTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</>
                              )}
                            </span>
                          </div>
                          {item.venue && (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span>{item.venue.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                    icon={ArrowRight}
                    disabled={state.items.some(i => !i.eventDate || !i.venue)}
                  >
                    {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleContinueShopping}>
                    Continue Shopping
                  </Button>
                </div>

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

        {state.items.length > 0 && (
          <Card className="p-8 mt-12 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Complete Your Perfect Day</h3>
              <p className="text-gray-600 mb-6">Add more services to make your wedding unforgettable</p>
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

      {showDateVenueModal && selectedCartItem && (
        <DateVenueModal
          isOpen={showDateVenueModal}
          onClose={() => { setShowDateVenueModal(false); setSelectedCartItem(null); }}
          cartItem={selectedCartItem}
          onSave={handleSaveDateVenue}
        />
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode="signup" />
    </div>
  );
};

export default Cart;