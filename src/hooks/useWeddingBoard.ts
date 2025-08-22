import React, { useState } from 'react';
import { Heart, Star, Clock, Camera, Video, Music, Users, Calendar, Package, Edit2, Trash2, Save, X, Plus, MessageCircle, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useWeddingBoard } from '../../hooks/useWeddingBoard';
import { useCart } from '../../context/CartContext';

export const WeddingBoard: React.FC = () => {
  const navigate = useNavigate();
  const { favorites, loading, error, removeFromFavorites, updateFavoriteNotes } = useWeddingBoard();
  const { addItem, openCart } = useCart();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return Camera;
      case 'Videography': return Video;
      case 'DJ Services': return Music;
      case 'Live Musician': return Music;
      case 'Coordination': return Users;
      case 'Planning': return Calendar;
      default: return Package;
    }
  };

  const getServicePhoto = (serviceType: string, packageId: string) => {
    const hash = packageId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const photoIndex = Math.abs(hash) % getServicePhotos(serviceType).length;
    return getServicePhotos(serviceType)[photoIndex];
  };

  const getServicePhotos = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': 
        return [
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      case 'Videography': 
        return [
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      case 'DJ Services': 
        return [
          'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
      default: 
        return [
          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
        ];
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const getPackageCoverage = (coverage: Record<string, any>) => {
    if (!coverage || typeof coverage !== 'object') return [];
    
    const events = [];
    if (coverage.events && Array.isArray(coverage.events)) {
      events.push(...coverage.events);
    }
    
    Object.keys(coverage).forEach(key => {
      if (key !== 'events' && coverage[key] === true) {
        events.push(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    });
    
    return events;
  };

  const startEditingNotes = (favorite: any) => {
    setEditingNotes(favorite.id);
    setEditText(favorite.notes || '');
  };

  const saveNotes = async (favoriteId: string) => {
    try {
      await updateFavoriteNotes(favoriteId, editText);
      setEditingNotes(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const cancelEditNotes = () => {
    setEditingNotes(null);
    setEditText('');
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await removeFromFavorites(favoriteId);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleAddToCart = (pkg: ServicePackage) => {
    addItem({ package: pkg });
    openCart();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wedding board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">Error loading wedding board: {error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wedding Board</h3>
            <p className="text-gray-600">
              Your saved wedding packages and inspiration
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-rose-500">{favorites.length}</div>
              <div className="text-sm text-gray-600">Saved Items</div>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/search')}
              icon={Plus}
            >
              Browse More
            </Button>
          </div>
        </div>
      </Card>

      {/* Favorites Grid */}
      {favorites.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-600 mb-6">
            Start browsing wedding services and save your favorites by clicking the heart icon
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/search')}
            icon={Heart}
          >
            Browse Wedding Services
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Service Package Favorites */}
          {favorites.filter(fav => fav.item_type === 'package' && fav.service_packages).length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Saved Wedding Services</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites
                  .filter(fav => fav.item_type === 'package' && fav.service_packages)
                  .map((favorite) => {
                    const pkg = favorite.service_packages!;
                    const ServiceIcon = getServiceIcon(pkg.service_type);
                    const packageCoverage = getPackageCoverage(pkg.coverage || {});
                    
                    return (
                      <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video overflow-hidden relative">
                          <img
                            src={pkg.primary_image || getServicePhoto(pkg.service_type, pkg.id)}
                            alt={pkg.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                            <button
                              onClick={() => handleRemoveFavorite(favorite.id)}
                              className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                            >
                              <Heart className="w-4 h-4 text-white fill-current" />
                            </button>
                          </div>
                          <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-900">
                              <ServiceIcon className="w-3 h-3 mr-1" />
                              {pkg.service_type}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{pkg.name}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">{pkg.description}</p>

                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              onClick={() => handleAddToCart(pkg)}
                              icon={ShoppingCart}
                            >
                              Add to Cart
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleRemoveFavorite(favorite.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Building Your Dream Wedding?
          </h3>
          <p className="text-gray-600 mb-4">
            Browse more services to complete your perfect day
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => navigate('/search')}
            >
              Browse All Services
            </Button>
            {favorites.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  // Add all favorites to cart
                  favorites.forEach(fav => {
                    if (fav.service_packages) {
                      addItem({ package: fav.service_packages });
                    }
                  });
                  openCart();
                }}
              >
                Add All to Cart
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};