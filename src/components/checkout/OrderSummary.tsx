import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
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
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  totalAmount,
  onDiscountApplied,
  onDiscountRemoved,
  appliedDiscount,
  appliedCoupon,
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price / 100);
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

  const totalServiceFee = cartItems.length > 0 ? 50 : 0;
  const discountedTotal = Math.max(0, totalAmount - appliedDiscount);
  const depositAmount = Math.round(discountedTotal * 0.5);
  const grandTotal = depositAmount + totalServiceFee * 100;

  return (
    <Card className="p-6 sticky top-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cartItems.map((item: any) => (
          <div key={item.id} className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
              {getServiceIcon(item.package.service_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 line-clamp-2">{item.package.name}</h4>
              <p className="text-sm text-gray-600">{item.package.service_type}</p>
              {item.vendor && <p className="text-xs text-green-600">Vendor: {item.vendor.name}</p>}
              {item.eventDate && (
                <p className="text-xs text-gray-500">{new Date(item.eventDate).toLocaleDateString()}</p>
              )}
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">{formatPrice(item.package.price)}</div>
            </div>
          </div>
        ))}
      </div>
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
          <span className="text-gray-600">Package Total</span>
          <span className="font-medium">{formatPrice(totalAmount)}</span>
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
          <span className="font-medium">${totalServiceFee}</span>
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
    </Card>
  );
};