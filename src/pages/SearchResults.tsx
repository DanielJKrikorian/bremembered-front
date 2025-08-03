import React, { useState, useEffect } from 'react';
import { Filter, Grid, List, SlidersHorizontal, MapPin, Star, Clock, Users, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ServiceCard } from '../components/booking/ServiceCard';
import { mockBundles } from '../lib/mockData';

export const SearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [filters, setFilters] = useState({
    location: '',
    priceRange: [0, 10000],
    rating: 0,
    serviceType: '',
    availability: ''
  });

  // Initialize filters from navigation state
  useEffect(() => {
    if (location.state?.filters) {
      setFilters(prev => ({ ...prev, ...location.state.filters }));
    }
  }, [location.state]);

  const filteredBundles = mockBundles.filter(bundle => {
    if (filters.serviceType && !bundle.category.includes(filters.serviceType)) return false;
    if (filters.location && !bundle.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (bundle.price < filters.priceRange[0] || bundle.price > filters.priceRange[1]) return false;
    if (filters.rating && bundle.rating < filters.rating) return false;
    return true;
  });

  const sortedBundles = [...filteredBundles].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'reviews': return b.reviewCount - a.reviewCount;
      default: return 0; // recommended
    }
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      priceRange: [0, 10000],
      rating: 0,
      serviceType: '',
      availability: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wedding Services</h1>
              <p className="text-gray-600 mt-1">
                {sortedBundles.length} results found
                {filters.location && ` in ${filters.location}`}
                {filters.serviceType && ` for ${filters.serviceType}`}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <Button
                variant="outline"
                icon={SlidersHorizontal}
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                Filters
              </Button>
              
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  icon={Grid}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                />
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  icon={List}
                  size="sm"
                  onClick={() => setViewMode('list')}
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.location || filters.serviceType || filters.rating > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.location && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-rose-100 text-rose-800">
                  📍 {filters.location}
                  <button
                    onClick={() => handleFilterChange('location', '')}
                    className="ml-2 text-rose-600 hover:text-rose-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.serviceType && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                  🎯 {filters.serviceType}
                  <button
                    onClick={() => handleFilterChange('serviceType', '')}
                    className="ml-2 text-amber-600 hover:text-amber-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.rating > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                  ⭐ {filters.rating}+ stars
                  <button
                    onClick={() => handleFilterChange('rating', 0)}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-rose-600 hover:text-rose-700"
                >
                  Clear all
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter city or region"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    value={filters.serviceType}
                    onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                  >
                    <option value="">All Services</option>
                    <option value="photography">Photography</option>
                    <option value="videography">Videography</option>
                    <option value="dj">DJ Services</option>
                    <option value="coordination">Coordination</option>
                    <option value="bundle">Complete Packages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={filters.priceRange[1]}
                      onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>$0</span>
                      <span className="font-medium">${filters.priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <div className="space-y-2">
                    {[4.8, 4.5, 4.0, 0].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input
                          type="radio"
                          name="rating"
                          value={rating}
                          checked={filters.rating === rating}
                          onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                          className="mr-2 text-rose-500 focus:ring-rose-500"
                        />
                        <div className="flex items-center">
                          {rating > 0 ? (
                            <>
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span>{rating}+ stars</span>
                            </>
                          ) : (
                            <span>Any rating</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <input
                    type="date"
                    value={filters.availability}
                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            {sortedBundles.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search criteria to find more options.
                </p>
                <Button variant="primary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedBundles.map((bundle) => (
                      <ServiceCard
                        key={bundle.id}
                        bundle={bundle}
                        onClick={() => navigate(`/bundle/${bundle.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedBundles.map((bundle) => (
                      <Card key={bundle.id} hover className="p-6 cursor-pointer" onClick={() => navigate(`/bundle/${bundle.id}`)}>
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="md:w-1/3">
                            <img
                              src={bundle.images[0]}
                              alt={bundle.name}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                          <div className="md:w-2/3">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{bundle.name}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                    <span>{bundle.rating} ({bundle.reviewCount} reviews)</span>
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span>{bundle.location}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>{bundle.duration}h</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    <span>{bundle.services.length} services</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  ${bundle.price.toLocaleString()}
                                </div>
                                {bundle.originalPrice && (
                                  <div className="text-sm text-gray-500 line-through">
                                    ${bundle.originalPrice.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2">{bundle.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={bundle.vendor.avatar}
                                  alt={bundle.vendor.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <span className="text-sm text-gray-600">{bundle.vendor.name}</span>
                              </div>
                              <Button variant="primary">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Load More */}
                {sortedBundles.length >= 9 && (
                  <div className="text-center mt-12">
                    <Button variant="outline" size="lg">
                      Load More Results
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};