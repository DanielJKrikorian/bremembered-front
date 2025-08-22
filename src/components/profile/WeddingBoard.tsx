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
          <p className="text-gray-            )
            }
600 mb-6">
            Start browsing wedding services and save your favorites by clicking the heart icon
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/search')}
            icon={Heart}
          >
            Browse Wedding Services
          </Button>
    
  )
}    </Card>
      ) : (
        <div className="space-y-8">
          {/* Blog Posts Section */}
          {favorites.filter(fav => fav.item_type === 'blog_post' && fav.blog_posts).length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Saved Articles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favorites
                  .filter(fav => fav.item_type === 'blog_post' && fav.blog_posts)
                  .map((favorite) => {
                    const post = favorite.blog_posts!;
                    
                    return (
                      <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="flex">
                          <div className="w-32 h-24 flex-shrink-0">
                            <img
                              src={post.featured_image || 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400'}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm">{post.title}</h4>
                              <button
                                onClick={() => handleRemoveFavorite(favorite.id)}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-3">{post.excerpt}</p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span>{post.read_time} min</span>
                                </div>
                                <div className="flex items-center">
                                  <Eye className="w-3 h-3 mr-1" />
                                  <span>{formatNumber(post.view_count)}</span>
                                </div>
                              </div>
                              <span>{new Date(favorite.created_at).toLocaleDateString()}</span>
                            </div>

                            {/* Notes Section for Blog Posts */}
                            {editingNotes === favorite.id ? (
                              <div className="space-y-2 mb-3">
                                <Input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  placeholder="Add notes about this article..."
                                  className="text-xs"
                                />
                                <div className="flex space-x-1">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon={Save}
                                    onClick={() => saveNotes(favorite.id)}
                                    className="text-xs px-2 py-1"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    icon={X}
                                    onClick={cancelEditNotes}
                                    className="text-xs px-2 py-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-3">
                                {favorite.notes ? (
                                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-2">
                                    <div className="flex items-center justify-between">
                                      <span className="line-clamp-2">{favorite.notes}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Edit2}
                                        onClick={() => startEditingNotes(favorite)}
                                        className="text-gray-400 hover:text-gray-600 ml-1"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditingNotes(favorite)}
                                    className="text-xs text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded w-full text-left"
                                  >
                                    Add notes...
                                  </button>
                                )}
                              </div>
                            )}

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/inspiration/${post.slug}`)}
                              className="w-full text-xs"
                            >
                              Read Article
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Service Packages Section */}
          {favorites.filter(fav => fav.item_type === 'package' && fav.service_packages).length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Saved Packages</h4>
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

                  {/* Package Details */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    {pkg.hour_amount && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{pkg.hour_amount}h</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {pkg.features && pkg.features.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {pkg.features.slice(0, 2).map((feature, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {feature}
                          </span>
                        ))}
                        {pkg.features.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            +{pkg.features.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes Section */}
                  <div className="mb-4">
                    {editingNotes === favorite.id ? (
                      <div className="space-y-3">
                        <Input
                          label="Your Notes"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="Add notes about this package..."
                        />
                        <div className="flex space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Save}
                            onClick={() => saveNotes(favorite.id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={X}
                            onClick={cancelEditNotes}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-700">Your Notes</h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit2}
                            onClick={() => startEditingNotes(favorite)}
                            className="text-gray-400 hover:text-gray-600"
                          />
                        </div>
                        {favorite.notes ? (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {favorite.notes}
                          </p>
                        ) : (
                          <button
                            onClick={() => startEditingNotes(favorite)}
                            className="text-sm text-gray-400 hover:text-gray-600 bg-gray-50 p-3 rounded-lg w-full text-left"
                          >
                            Click to add notes...
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xl font-bold text-gray-900">
                      {formatPrice(pkg.price)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Added {new Date(favorite.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleAddToCart(pkg)}
                      icon={ShoppingCart}
                    >
                      Add to Cart
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/package/${pkg.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
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