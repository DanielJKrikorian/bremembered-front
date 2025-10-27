// src/components/checkout/OrderSummary.tsx
import React, { useState } from 'react';
import { 
  Check, X, 
  Camera, Film, Music, Mic, Calendar, Heart, 
  Palette, Scissors, Building2, Car, ChefHat, 
  Sparkles, Flower, Cake, Users, MapPin, Gift 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface OrderSummaryProps {
  cartItems: any[];
  totalAmount: number;
  onDiscountApplied: (discount: number, coupon: any) => void;
  onDiscountRemoved: () => void;
  appliedDiscount: number;
  appliedCoupon: any;
  isInitializingPayment: boolean;
  isFinalPayment?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  totalAmount,
  onDiscountApplied,
  onDiscountRemoved,
  appliedDiscount,
  appliedCoupon,
  isInitializingPayment,
  isFinalPayment = false,
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const formatPrice = (amount: number | null | undefined) => {
    const safeAmount = amount ?? 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount / 100);
  };

  const calculateItemTotal = (item: any) => {
    const packagePrice = (item.package.price ?? 0) / 100;
    return packagePrice;
  };

  // ALL WEDDING & EVENT SERVICES — LUCIDE ICONS
  const getServiceIcon = (serviceType: string) => {
    const iconProps = { className: "w-6 h-6" };

    switch (serviceType.toLowerCase()) {
      // Photography & Video
      case 'photography':
        return <Camera {...iconProps} />;
      case 'videography':
        return <Film {...iconProps} />;

      // Music & Entertainment
      case 'dj services':
        return <Music {...iconProps} />;
      case 'live musician':
      case 'band':
        return <Mic {...iconProps} />;

      // Beauty & Styling
      case 'makeup artist':
      case 'makeup':
        return <Palette {...iconProps} />;
      case 'hairstylist':
      case 'hair':
        return <Scissors {...iconProps} />;

      // Venue & Location
      case 'venue':
        return <Building2 {...iconProps} />;
      case 'transportation':
      case 'limo':
        return <Car {...iconProps} />;

      // Food & Beverage
      case 'catering':
      case 'chef':
        return <ChefHat {...iconProps} />;

      // Decor & Design
      case 'florist':
      case 'flowers':
        return <Flower {...iconProps} />;
      case 'decorator':
      case 'event design':
        return <Sparkles {...iconProps} />;

      // Sweets & Desserts
      case 'cake':
      case 'dessert':
        return <Cake {...iconProps} />;

      // Planning & Coordination
      case 'planning':
      case 'wedding planner':
        return <Calendar {...iconProps} />;
      case 'coordination':
      case 'day-of coordinator':
        return <Heart {...iconProps} />;

      // Guests & Rentals
      case 'rentals':
        return <Gift {...iconProps} />;
      case 'guest services':
        return <Users {...iconProps} />;

      // Other
      case 'officiant':
        return <MapPin {...iconProps} />;
      default:
        return <Heart {...iconProps} />;
    }
  };

  const validateDiscountCode = async (code: string) => {
    if (!code.trim()) {
      setDiscountError(null);
      onDiscountRemoved();
      return;
    }
    setValidatingDiscount(true);
    setDiscountError(null);
    if (!supabase || !isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (code.toLowerCase() === 'save10') {
        const discount = Math.round(totalAmount * 0.1);
        onDiscountApplied(discount, { code: 'SAVE10', discount_percent: 10 });
      } else {
        setDiscountError('Invalid discount code');
      }
      setValidatingDiscount(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_valid', true)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (!data) {
        setDiscountError('Invalid or expired discount code');
        setValidatingDiscount(false);
        return;
      }
      if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
        setDiscountError('This discount code has expired');
        setValidatingDiscount(false);
        return;
      }
      let discount = 0;
      if (data.discount_percent > 0) {
        discount = Math.round(totalAmount * (data.discount_percent / 100));
      } else if (data.discount_amount > 0) {
        discount = data.discount_amount;
      }
      onDiscountApplied(discount, data);
      setDiscountError(null);
    } catch (err) {
      console.error('Error validating discount code:', err);
      setDiscountError('Error validating discount code');
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateDiscountCode(discountCode);
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscountError(null);
    onDiscountRemoved();
  };

  const totalServiceFee = cartItems.length > 0 ? 5000 : 0;
  const discountedTotal = Math.max(0, totalAmount - appliedDiscount);
  const depositAmount = Math.round(discountedTotal * 0.5);
  const grandTotal = isFinalPayment ? totalServiceFee : depositAmount + totalServiceFee;

  const totalPackages = totalAmount;

  return (
    <Card className="p-6 sticky top-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
      {isInitializingPayment ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading pricing details...</p>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {cartItems.map((item: any) => {
              const itemTotal = calculateItemTotal(item);

              return (
                <div key={item.id} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    {getServiceIcon(item.package.service_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 line-clamp-2">{item.package.name}</h4>
                    <p className="text-sm text-gray-600">{item.package.service_type}</p>
                    {item.vendor && <p className="text-xs text-green-600">Vendor: {item.vendor.name}</p>}
                    {item.eventDate && (
                      <p className="text-xs text-gray-500">
                        {(() => {
                          const [year, month, day] = item.eventDate.split('-').map(Number);
                          return new Date(year, month - 1, day).toLocaleDateString();
                        })()}
                      </p>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      <div className="font-medium">Total: {formatPrice(itemTotal * 100)}</div>
                      <div>Package: {formatPrice(item.package.price)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FINAL PAYMENT: Only show Service Fee */}
          {isFinalPayment ? (
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Service Fee</span>
                <span>{formatPrice(totalServiceFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-3">
                <span>Total Due Today</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Discount Code Section */}
              <div className="border-t pt-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Discount Code</label>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {appliedCoupon ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-900">{appliedCoupon.code} Applied</span>
                      <span className="text-sm font-medium text-green-900">-{formatPrice(appliedDiscount)}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleDiscountSubmit} className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Enter discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      loading={validatingDiscount}
                      disabled={!discountCode.trim() || validatingDiscount}
                    >
                      Apply
                    </Button>
                  </form>
                )}
                {discountError && <p className="text-xs text-red-600 mt-1">{discountError}</p>}
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Packages</span>
                  <span className="font-medium">{formatPrice(totalPackages)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount Applied</span>
                    <span>-{formatPrice(appliedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit (50%)</span>
                  <span className="font-medium">{formatPrice(depositAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium">{formatPrice(totalServiceFee)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Remaining Balance</span>
                  <span>{formatPrice(discountedTotal - depositAmount)} (due later)</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Total Due Today</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </>
          )}

          {/* Trust Indicators */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Secure checkout with Stripe</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Direct messaging with your vendor</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">24/7 customer support</span>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default OrderSummary;