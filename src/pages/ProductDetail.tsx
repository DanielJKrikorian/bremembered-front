import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

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

const getImageUrl = (imagePath: string): string => {
  const { data, error } = supabase.storage.from('store-images').getPublicUrl(imagePath);
  console.log('ProductDetail: Image Path:', imagePath, 'Public URL:', data.publicUrl, 'Error:', error);
  if (error) {
    console.error('ProductDetail: Supabase storage error:', error.message);
    return '/placeholder.jpg';
  }
  return data.publicUrl;
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

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ProductDetail: Mounting component');
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('store_products')
          .select('id, name, description, price, images, stock_quantity, audience')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setProduct(data || null);
      } catch (err: any) {
        setError('Failed to load product details: ' + (err.message || 'Unknown error'));
        console.error('ProductDetail: Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        });
        console.log('ProductDetail: Added to cart:', { id: product.id, name: product.name, price: product.price, quantity: 1 });
        navigate('/store');
      } catch (err: any) {
        setCartError('Failed to add item to cart: ' + (err.message || 'Unknown error'));
        console.error('ProductDetail: Error adding to cart:', err);
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/store')}>
              Back to Store
            </Button>
          </div>
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
            <p>Loading product details...</p>
          ) : product ? (
            <Card className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <img
                    src={product.images?.[0] ? getImageUrl(product.images[0]) : '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-96 object-cover rounded-lg"
                    onError={(e) => {
                      console.error('ProductDetail: Image failed to load:', product.images?.[0], 'URL:', getImageUrl(product.images?.[0] || ''));
                      e.currentTarget.src = '/placeholder.jpg';
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                  <p className="text-rose-600 font-medium text-2xl mb-4">{formatPrice(product.price)}</p>
                  <p className="text-gray-600 mb-6">{product.description}</p>
                  <p className="text-gray-600 mb-4">
                    <span className="font-medium">Availability:</span>{' '}
                    {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0}
                    className="w-full"
                  >
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <p>Product not found.</p>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductDetail;