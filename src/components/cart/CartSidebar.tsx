// components/cart/CartSidebar.tsx
import React, { useState } from 'react';
import { X, ShoppingCart, Calendar, MapPin, User, ArrowRight, Trash2, Camera, Video, Music, Users, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useCart } from '../../context/CartContext';
import { DateVenueModal } from './DateVenueModal';

export const CartSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { state, removeItem, closeCart, updateItem } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const formatPrice = (amount: number | null | undefined) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return <Camera className="w-5 h-5" />;
      case 'Videography': return <Video className="w-5 h-5" />;
      case 'DJ Services': return <Music className="w-5 h-5" />;
      case 'Live Musician': return <Music className="w-5 h-5" />;
      case 'Coordination': return <User className="w-5 h-5" />;
      case 'Planning': return <Calendar className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const openDateVenueModal = (item: any) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleSaveDateVenue = (details: any) => {
    updateItem(selectedItem.id, details);
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleCheckout = () => {
    closeCart();
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    closeCart();
    navigate('/search');
  };

  if (!state.isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={closeCart} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Cart</h3>
              <p className="text-sm text-gray-600">
                {state.items.length} item{state.items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {state.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h4>
              <Button variant="primary" onClick={handleContinueShopping}>
                Browse Services
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => {
                const itemTotal = item.package.price / 100;

                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getServiceIcon(item.package.service_type)}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.package.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.package.service_type}</p>

                        {/* Vendor */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-xs text-green-700 font-medium">
                            {item.vendor.name}
                          </span>
                        </div>

                        {/* Date & Venue */}
                        <div className="mb-3">
                          {item.eventDate ? (
                            <div className="space-y-1 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>
                                  {new Date(item.eventDate).toLocaleDateString()}
                                  {item.eventTime && (
                                    <>
                                      {' at '}
                                      {new Date(`2000-01-01T${item.eventTime}`).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                      })}
                                    </>
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
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs py-1 px-2 h-6"
                              onClick={() => openDateVenueModal(item)}
                            >
                              Set Date & Venue
                            </Button>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-gray-900">
                              {formatPrice(item.package.price)}
                            </div>
                            {item.package.hour_amount && (
                              <div className="text-sm text-gray-500">
                                {item.package.hour_amount} hour{item.package.hour_amount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between text-lg font-semibold mb-4">
              <span>Total:</span>
              <span>{formatPrice(state.totalAmount)}</span>
            </div>
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleCheckout}
                icon={ArrowRight}
                disabled={state.items.some(i => !i.eventDate)}
              >
                {state.items.some(i => !i.eventDate) ? 'Complete Date & Venue' : 'Review Cart'}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleContinueShopping}>
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <DateVenueModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        cartItem={selectedItem}
        onSave={handleSaveDateVenue}
      />
    </>
  );
};