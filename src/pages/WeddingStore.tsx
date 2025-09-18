import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AlertCircle, Trash2, Plus, Minus, X, CreditCard, Mail, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY || '');

const formatPrice = (amount: number): string => {
  return `$${(amount / 100).toFixed(2)}`;
};

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[] | null;
  stock_quantity: number;
  audience: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface GuestCheckoutData {
  email: string;
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

const getImageUrl = (imagePath: string): string => {
  const { data, error } = supabase.storage.from('store-images').getPublicUrl(imagePath);
  console.log('WeddingStore: Image Path:', imagePath, 'Public URL:', data.publicUrl, 'Error:', error);
  if (error) {
    console.error('WeddingStore: Supabase storage error:', error.message);
    return '/placeholder.jpg';
  }
  return data.publicUrl;
};

const truncateDescription = (description: string | null, maxLength: number = 100): string => {
  if (!description) return '';
  return description.length > maxLength 
    ? `${description.substring(0, maxLength)}...` 
    : description;
};

interface CheckoutFormProps {
  cartItems: CartItem[];
  totalAmount: number;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ cartItems, totalAmount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [guestData, setGuestData] = useState<GuestCheckoutData>({
    email: '',
    shippingAddress: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: keyof GuestCheckoutData | keyof GuestCheckoutData['shippingAddress'], value: string) => {
    if (field in guestData.shippingAddress) {
      setGuestData(prev => ({
        ...prev,
        shippingAddress: { ...prev.shippingAddress, [field]: value },
      }));
    } else {
      setGuestData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateGuestData = () => {
    const newErrors: { [key: string]: string } = {};
    if (!guestData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestData.email)) {
      newErrors.email = 'Valid email is required.';
    }
    if (!guestData.shippingAddress.line1) newErrors.line1 = 'Street address is required.';
    if (!guestData.shippingAddress.city) newErrors.city = 'City is required.';
    if (!guestData.shippingAddress.state) newErrors.state = 'State is required.';
    if (!guestData.shippingAddress.postal_code || !/^\d{5}$/.test(guestData.shippingAddress.postal_code)) {
      newErrors.postal_code = 'Valid 5-digit postal code is required.';
    }
    if (!guestData.shippingAddress.country) newErrors.country = 'Country is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      onError('Stripe not initialized. Please try again.');
      return;
    }
    if (!validateGuestData()) {
      onError('Please fill in all required fields correctly.');
      return;
    }

    setIsProcessing(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found.');

      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) throw new Error(pmError.message || 'Failed to create payment method.');

      console.log('CheckoutForm: Calling Supabase edge function: https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/create-store-payment-intent');
      console.log('CheckoutForm: Request body:', JSON.stringify({
        cartItems,
        totalAmount,
        userId: null,
        email: guestData.email,
        shippingAddress: guestData.shippingAddress,
      }));

      const response = await fetch('https://eecbrvehrhrvdzuutliq.supabase.co/functions/v1/create-store-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          cartItems,
          totalAmount,
          userId: null,
          email: guestData.email,
          shippingAddress: guestData.shippingAddress,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('CheckoutForm: Fetch error response:', response.status, response.statusText, errorText);
        throw new Error(`Failed to create payment intent: ${response.status} ${response.statusText} - ${errorText || 'No response body'}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not valid JSON');
      }

      const { clientSecret, paymentIntentId, orderId, error: serverError } = await response.json();
      if (serverError) throw new Error(serverError);

      if (!clientSecret || !paymentIntentId || !orderId) {
        throw new Error('Invalid response: Missing clientSecret, paymentIntentId, or orderId');
      }

      console.log('CheckoutForm: Supabase edge function response:', { clientSecret, paymentIntentId, orderId });

      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod!.id,
      });

      if (confirmError) {
        if (confirmError.code === 'resource_missing' && confirmError.message?.includes('test mode key')) {
          throw new Error('Payment failed due to a configuration issue. Please contact support.');
        }
        throw new Error(confirmError.message || 'Payment confirmation failed.');
      }

      const orderData = {
        id: orderId,
        total_amount: totalAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
        shipping_address: guestData.shippingAddress,
        email: guestData.email,
        order_items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          product: { name: item.name },
        })),
      };

      onSuccess(orderId);
      window.location.href = `${window.location.origin}/store-success?orderData=${encodeURIComponent(JSON.stringify(orderData))}`;
    } catch (error: any) {
      setCardError(error.message || 'Payment failed. Please try again.');
      onError(error.message || 'Payment failed.');
      console.error('CheckoutForm: Checkout error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              className={`w-full p-3 pl-10 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              value={guestData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@example.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
          <div className="space-y-2">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className={`w-full p-3 pl-10 border rounded-lg ${errors.line1 ? 'border-red-500' : 'border-gray-300'}`}
                value={guestData.shippingAddress.line1}
                onChange={(e) => handleInputChange('line1', e.target.value)}
                placeholder="Street Address"
              />
            </div>
            {errors.line1 && <p className="text-red-500 text-sm mt-1">{errors.line1}</p>}
            <input
              type="text"
              className={`w-full p-3 border rounded-lg ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
              value={guestData.shippingAddress.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="City"
            />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            <input
              type="text"
              className={`w-full p-3 border rounded-lg ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
              value={guestData.shippingAddress.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="State"
            />
            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            <input
              type="text"
              className={`w-full p-3 border rounded-lg ${errors.postal_code ? 'border-red-500' : 'border-gray-300'}`}
              value={guestData.shippingAddress.postal_code}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
              placeholder="Postal Code"
            />
            {errors.postal_code && <p className="text-red-500 text-sm mt-1">{errors.postal_code}</p>}
            <input
              type="text"
              className={`w-full p-3 border rounded-lg ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
              value={guestData.shippingAddress.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="Country"
            />
            {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-lg font-semibold text-gray-900 mb-2">Card Information</label>
        <div className="p-3 border border-gray-300 rounded-lg">
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } } } }} />
        </div>
        {cardError && <p className="text-red-500 text-sm mt-1">{cardError}</p>}
      </div>
      <Button
        type="submit"
        variant="primary"
        className="w-full bg-rose-500 text-white hover:bg-rose-600"
        disabled={isProcessing}
        icon={CreditCard}
      >
        {isProcessing ? 'Processing...' : `Pay Now - ${formatPrice(totalAmount)}`}
      </Button>
    </form>
  );
};

const OrderSummary: React.FC<{ cartItems: CartItem[]; totalAmount: number }> = ({ cartItems, totalAmount }) => {
  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Summary</h3>
      {cartItems.map((item) => (
        <div key={item.id} className="flex justify-between py-2">
          <div>
            <p>{item.name}</p>
            <p>Quantity: {item.quantity}</p>
          </div>
          <p>{formatPrice(item.price * item.quantity)}</p>
        </div>
      ))}
      <div className="mt-4 border-t pt-2">
        <p className="text-xl font-bold text-gray-900">Total: {formatPrice(totalAmount)}</p>
      </div>
    </Card>
  );
};

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

export const WeddingStore: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('WeddingStore: Mounting component');
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('store_products')
          .select('id, name, description, price, images, stock_quantity, audience');
        
        if (error) throw error;
        setProducts(data || []);
      } catch (err: any) {
        setError('Failed to load products: ' + (err.message || 'Unknown error'));
        console.error('WeddingStore: Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      let newItems: CartItem[];
      if (existingItem) {
        newItems = prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        newItems = [...prev, item];
      }
      const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      setTotalAmount(total);
      return newItems;
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    setCartItems((prev) => {
      const newItems = prev.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      );
      const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      setTotalAmount(total);
      return newItems;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const newItems = prev.filter((i) => i.id !== itemId);
      const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      setTotalAmount(total);
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setTotalAmount(0);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
      console.log('WeddingStore: Added to cart:', { id: product.id, name: product.name, price: product.price, quantity: 1 });
      if (cartRef.current) {
        cartRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err: any) {
      setCartError('Failed to add item to cart: ' + (err.message || 'Unknown error'));
      console.error('WeddingStore: Error adding to cart:', err);
    }
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      try {
        const item = cartItems.find((i) => i.id === itemId);
        if (!item) return;
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) {
          removeFromCart(itemId);
          console.log('WeddingStore: Removed item via quantity update:', itemId);
          return;
        }
        const product = products.find((p) => p.id === itemId);
        if (product && newQuantity > product.stock_quantity) {
          setCartError(`Cannot add more than ${product.stock_quantity} of ${product.name} to cart.`);
          return;
        }
        updateCartQuantity(itemId, newQuantity);
      } catch (err: any) {
        setCartError('Failed to update cart quantity: ' + (err.message || 'Unknown error'));
        console.error('WeddingStore: Error updating quantity:', err);
      }
    }, 300);
  };

  const handleRemoveItem = (itemId: string) => {
    try {
      removeFromCart(itemId);
      console.log('WeddingStore: Removed item:', itemId);
    } catch (err: any) {
      setCartError('Failed to remove item from cart: ' + (err.message || 'Unknown error'));
      console.error('WeddingStore: Error removing item:', err);
    }
  };

  const handleProceedToCheckout = () => {
    if (!cartItems.length) {
      setError('Your cart is empty. Add items to proceed to checkout.');
      return;
    }
    setShowCheckoutModal(true);
  };

  const handlePaymentSuccess = (orderId: string) => {
    setShowCheckoutModal(false);
    clearCart();
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Wedding Store</h1>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
          {cartError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-600">{cartError}</p>
              </div>
            </div>
          )}
          {loading ? (
            <p>Loading products...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="p-4">
                    <img
                      src={product.images?.[0] ? getImageUrl(product.images[0]) : '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                      onError={(e) => {
                        console.error('WeddingStore: Image failed to load:', product.images?.[0], 'URL:', getImageUrl(product.images?.[0] || ''));
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-gray-600 mb-2">{truncateDescription(product.description)}</p>
                    <p className="text-rose-600 font-medium mb-4">{formatPrice(product.price)}</p>
                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_quantity === 0}
                        className="flex-1"
                      >
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/store/product/${product.id}`)}
                        className="flex-1"
                      >
                        View Product
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div ref={cartRef} className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart</h2>
                {cartItems.length === 0 ? (
                  <p className="text-gray-600">Your cart is empty.</p>
                ) : (
                  <Card className="p-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-4 border-b">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-gray-600">{formatPrice(item.price)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Minus}
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                          />
                          <span>{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Plus}
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="mt-4">
                      <p className="text-xl font-bold text-gray-900">
                        Total: {formatPrice(totalAmount)}
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleProceedToCheckout}
                        className="mt-4 w-full bg-rose-500 hover:bg-rose-600"
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  </Card>
                )}
              </div>

              {showCheckoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-lg bg-white p-6 rounded-lg relative max-h-[80vh] overflow-y-auto">
                    <button
                      onClick={() => setShowCheckoutModal(false)}
                      className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Payment</h2>
                    <OrderSummary cartItems={cartItems} totalAmount={totalAmount} />
                    <Elements stripe={stripePromise}>
                      <CheckoutForm
                        cartItems={cartItems}
                        totalAmount={totalAmount}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </Elements>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default WeddingStore;