import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const formatPrice = (amount: number): string => {
  return `$${(amount / 100).toFixed(2)}`;
};

interface OrderItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: { name: string };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: any;
  email?: string;
  order_items: OrderItem[];
  tracking_number?: string | null;
  shipping_provider?: string | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: string }> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600">{this.state.error || 'Something went wrong. Please try again.'}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const StoreSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('StoreSuccess: Rendering component');
    console.log('StoreSuccess: Current location', location.pathname, location.search);
    const urlParams = new URLSearchParams(location.search);
    const orderData = urlParams.get('orderData');
    if (orderData) {
      try {
        const parsedOrder = JSON.parse(decodeURIComponent(orderData)) as Order;
        if (!parsedOrder.id || !parsedOrder.total_amount || !parsedOrder.order_items) {
          throw new Error('Invalid order data');
        }
        console.log('StoreSuccess: Parsed orderDetails', parsedOrder);
        setOrderDetails(parsedOrder);
      } catch (err: any) {
        console.error('StoreSuccess: Error parsing order data:', err);
        setError('Failed to load order details. Please check your order ID or contact support.');
      }
    } else {
      console.error('StoreSuccess: No orderData provided in URL');
      setError('No order data provided. Please check your order ID or contact support.');
    }
  }, [location.search]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
          {orderDetails && (
            <Card className="p-8 text-center bg-gradient-to-b from-white to-rose-50 shadow-lg">
              <Package className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Thank you for your purchase! We’ve sent a confirmation email with all the details. Your order will be shipped soon.
              </p>
              <p className="text-gray-600 mb-6 text-base">
                Track your order using your email (<strong>{orderDetails.email}</strong>) or order ID (<strong>{orderDetails.id}</strong>) on the order tracking page.
              </p>
              <div className="text-left max-w-2xl mx-auto space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 text-xl mb-3">Order Details</h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800">Order #{orderDetails.id}</h4>
                    <ul className="text-gray-600 space-y-2 mt-2">
                      <li><span className="font-medium">Status:</span> {orderDetails.status || 'Pending'}</li>
                      <li><span className="font-medium">Total:</span> {formatPrice(orderDetails.total_amount)}</li>
                      {orderDetails.email && (
                        <li><span className="font-medium">Email:</span> {orderDetails.email}</li>
                      )}
                      {orderDetails.shipping_address && (
                        <li>
                          <span className="font-medium">Shipping Address:</span>{' '}
                          {`${orderDetails.shipping_address.line1}, ${orderDetails.shipping_address.city}, ${orderDetails.shipping_address.state} ${orderDetails.shipping_address.postal_code}, ${orderDetails.shipping_address.country}`}
                        </li>
                      )}
                      {orderDetails.tracking_number && (
                        <li><span className="font-medium">Tracking Number:</span> {orderDetails.tracking_number}</li>
                      )}
                      {orderDetails.shipping_provider && (
                        <li><span className="font-medium">Shipping Provider:</span> {orderDetails.shipping_provider}</li>
                      )}
                    </ul>
                    <h4 className="font-medium text-gray-800 mt-4">Items</h4>
                    {orderDetails.order_items.map((item, index) => (
                      <div key={item.id || `item-${index}`} className="mt-2">
                        <p>{item.product.name} x {item.quantity}</p>
                        <p>{formatPrice(item.unit_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-center space-x-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    console.log('StoreSuccess: Navigating to order tracking', `/orders?email=${encodeURIComponent(orderDetails.email || '')}`);
                    navigate(`/orders?email=${encodeURIComponent(orderDetails.email || '')}`);
                  }}
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  Track My Orders
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/store')}
                  className="border-rose-500 text-rose-500 hover:bg-rose-50"
                >
                  Continue Shopping
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default StoreSuccess;