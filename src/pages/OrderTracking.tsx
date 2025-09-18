import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const formatPrice = (amount: number | null): string => {
  return amount !== null && !isNaN(amount) ? `$${(amount / 100).toFixed(2)}` : '$0.00';
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
  total_amount: number | null;
  status: string;
  created_at: string;
  shipping_address: any;
  email?: string | null;
  store_order_items: OrderItem[];
  tracking_number?: string | null;
  shipping_provider?: string | null;
  tax_amount?: number | null;
  coupon_code?: string | null;
  shipping_fee?: number | null;
  shipping_method?: string | null;
  coupon_discount?: number | null;
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

export const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('OrderTracking: Mounting component', { orderId, path: location.pathname });
    const urlParams = new URLSearchParams(location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
      if (orderId) {
        fetchSingleOrder(decodeURIComponent(emailParam), orderId);
      } else {
        fetchOrdersByEmail(decodeURIComponent(emailParam));
      }
    } else {
      console.log('OrderTracking: No email provided in query');
    }
  }, [location.search, orderId]);

  const fetchSingleOrder = async (emailToUse: string, orderIdToUse: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select(`
          id, total_amount, status, created_at, shipping_address, tracking_number, shipping_provider, email,
          tax_amount, coupon_code, shipping_fee, shipping_method, coupon_discount,
          store_order_items (
            id, product_id, quantity, unit_price,
            product:store_products (id, name, description, price, images)
          )
        `)
        .eq('id', orderIdToUse)
        .eq('email', emailToUse)
        .single();
      
      if (error) throw error;
      console.log('OrderTracking: Fetched single order:', data);
      setOrders([data]);
    } catch (err: any) {
      setError('Failed to load order details. Please verify your email and order ID or contact support.');
      console.error('OrderTracking: Error fetching single order:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersByEmail = async (emailToUse: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select(`
          id, total_amount, status, created_at, shipping_address, tracking_number, shipping_provider, email,
          tax_amount, coupon_code, shipping_fee, shipping_method, coupon_discount,
          store_order_items (
            id, product_id, quantity, unit_price,
            product:store_products (id, name, description, price, images)
          )
        `)
        .eq('email', emailToUse)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('OrderTracking: Fetched orders by email:', data);
      setOrders(data || []);
      if (data.length === 0) {
        setError('No orders found for this email. Please verify your email or contact support.');
      }
    } catch (err: any) {
      setError('Failed to load orders. Please verify your email or contact support.');
      console.error('OrderTracking: Error fetching orders by email:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Valid email is required.');
      return;
    }
    setEmailError(null);
    if (orderId) {
      await fetchSingleOrder(email, orderId);
    } else {
      await fetchOrdersByEmail(email);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/store')}>
                Back to Store
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
                <p className="text-gray-600 mt-1">Track your order status and details</p>
              </div>
            </div>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter Email Used for Purchase</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                className={`w-full p-3 pl-10 border rounded-lg ${emailError ? 'border-red-500' : 'border-gray-300'}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            <Button
              variant="primary"
              onClick={handleEmailSubmit}
              className="mt-4 bg-rose-500 hover:bg-rose-600"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Track Orders'}
            </Button>
          </div>
          {orders.length > 0 && (
            <div className="space-y-8">
              {orders.map((order) => (
                <Card key={order.id} className="p-8 bg-gradient-to-b from-white to-rose-50 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Order #{order.id}
                    <Button
                      variant="link"
                      onClick={() => navigate(`/orders/${order.id}?email=${encodeURIComponent(email)}`)}
                      className="ml-4 text-rose-500 hover:text-rose-600"
                    >
                      View Details
                    </Button>
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-xl mb-3">Order Details</h3>
                      <ul className="text-gray-600 space-y-2">
                        <li><span className="font-medium">Status:</span> {order.status || 'Pending'}</li>
                        <li><span className="font-medium">Total:</span> {formatPrice(order.total_amount)}</li>
                        {order.email && (
                          <li><span className="font-medium">Email:</span> {order.email}</li>
                        )}
                        <li><span className="font-medium">Order Date:</span> {new Date(order.created_at).toLocaleDateString()}</li>
                        {order.shipping_address && (
                          <li>
                            <span className="font-medium">Shipping Address:</span>{' '}
                            {`${order.shipping_address.line1}, ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}, ${order.shipping_address.country}`}
                          </li>
                        )}
                        {order.tracking_number && (
                          <li><span className="font-medium">Tracking Number:</span> {order.tracking_number}</li>
                        )}
                        {order.shipping_provider && (
                          <li><span className="font-medium">Shipping Provider:</span> {order.shipping_provider}</li>
                        )}
                        {order.tax_amount !== null && (
                          <li><span className="font-medium">Tax Amount:</span> {formatPrice(order.tax_amount)}</li>
                        )}
                        {order.coupon_code && (
                          <li><span className="font-medium">Coupon Code:</span> {order.coupon_code}</li>
                        )}
                        {order.shipping_fee !== null && (
                          <li><span className="font-medium">Shipping Fee:</span> {formatPrice(order.shipping_fee)}</li>
                        )}
                        {order.shipping_method && (
                          <li><span className="font-medium">Shipping Method:</span> {order.shipping_method}</li>
                        )}
                        {order.coupon_discount !== null && (
                          <li><span className="font-medium">Coupon Discount:</span> {formatPrice(order.coupon_discount)}</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-xl mb-3">Items</h3>
                      {order.store_order_items.map((item, index) => (
                        <div key={item.id || `item-${index}`} className="bg-white p-4 rounded-lg border border-gray-200 mb-2">
                          <p className="font-medium">{item.product.name} x {item.quantity}</p>
                          <p>{formatPrice(item.unit_price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default OrderTracking;