import React from 'react';
import { X, ShoppingCart, Calendar, MapPin, User, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useCart } from '../../context/CartContext';

interface CartSidebarProps {
  onChooseVendor?: (item: any) => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ onChooseVendor }) => {
  const navigate = useNavigate();
  const { state, removeItem, closeCart } = useCart();

  const formatPrice = (amount: number | null | undefined) => {
    if (amount === undefined || amount === null || amount === 0) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  const calculateItemTotal = (item: any) => {
    const packagePrice = item.package.price / 100;
    const premium = item.vendor && item.vendor.premium_amount && item.vendor.premium_amount > 0 ? item.vendor.premium_amount / 100 : 0;
    const travel = item.vendor && item.vendor.travel_fee && item.vendor.travel_fee > 0 ? item.vendor.travel_fee / 100 : 0;
    return packagePrice + premium + travel;
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
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeCart}
      />
      
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
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {state.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h4>
              <p className="text-gray-600 mb-6">
                Add wedding packages to get started with your perfect day
              </p>
              <Button
                variant="primary"
                onClick={handleContinueShopping}
              >
                Browse Services
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => {
                const premiumPrice = item.vendor ? formatPrice(item.vendor.premium_amount) : null;
                const travelFee = item.vendor ? formatPrice(item.vendor.travel_fee) : null;
                const itemTotal = calculateItemTotal(item);

                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {getServiceIcon(item.package.service_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {item.package.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.package.service_type}
                        </p>
                        
                        {/* Event Details */}
                        {(item.eventDate || item.venue) && (
                          <div className="space-y-1 mb-3">
                            {item.eventDate && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>
                                  {(() => {
                                    const [year, month, day] = item.eventDate.split('-').map(Number);
                                    return new Date(year, month - 1, day).toLocaleDateString();
                                  })()}
                                  {item.eventTime && (
                                    <>
                                      {' at '}
                                      {new Date(`2000-01-01T${item.eventTime}`).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                      {item.endTime && (
                                        <>
                                          {' - '}
                                          {new Date(`2000-01-01T${item.endTime}`).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                          })}
                                        </>
                                      )}
                                    </>
                                  )}
                                </span>
                              </div>
                            )}
                            {item.venue && (
                              <div className="flex items-center text-xs text-gray-500">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span>{item.venue.name}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vendor */}
                        {item.vendor ? (
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-xs text-green-700 font-medium">
                              Vendor: {item.vendor.name}
                            </span>
                          </div>
                        ) : (
                          <div className="mb-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs py-1 px-2 h-6"
                              onClick={() => {
                                onChooseVendor?.(item);
                              }}
                            >
                              Choose Vendor
                            </Button>
                          </div>
                        )}

                        {/* Pricing Breakdown */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-gray-900">
                              Total: {formatPrice(itemTotal * 100)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Package: {formatPrice(item.package.price)}
                            </div>
                            {item.vendor && (
                              <>
                                {premiumPrice && item.vendor.premium_amount !== null && item.vendor.premium_amount > 0 && (
                                  <div className="text-sm text-gray-500">
                                    Premium: {premiumPrice}
                                  </div>
                                )}
                                <div className="text-sm text-gray-500">
                                  Travel: {travelFee || 'Local ($0.00)'}
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
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
            <div className="space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatPrice(state.totalAmount)}</span>
              </div>
              
              {/* Actions */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  icon={ArrowRight}
                >
                  Review Cart
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleContinueShopping}
                >
                  Continue Shopping
                </Button>
              </div>
              
              <div className="text-center text-xs text-gray-500">
                Direct messaging with your vendor
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};