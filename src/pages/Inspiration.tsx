import React, { useState } from 'react';
import { Search, Calendar, Clock, Eye, Heart, User, Tag, ArrowRight, BookOpen, TrendingUp, Star, Filter, Grid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useBlogPosts, useBlogCategories, BlogFilters } from '../hooks/useBlog';
import { NewsletterSignup } from '../components/blog/NewsletterSignup';

export const Inspiration: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Build filters object
  const filters: BlogFilters = {
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedTags.length > 0 && { tags: selectedTags }),
    ...(searchTerm && { search: searchTerm })
  };

  const { posts, loading, error } = useBlogPosts(filters);
  const { categories, loading: categoriesLoading } = useBlogCategories();
  const { posts: featuredPosts } = useBlogPosts({ featured: true }, 3);

  // Get all unique tags from posts
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)));

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedTags([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const activeFiltersCount = 
    (selectedCategory ? 1 : 0) + 
    selectedTags.length + 
    (searchTerm ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-rose-500 to-amber-500 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Wedding Inspiration & Advice
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Expert tips, real wedding stories, and inspiration to help you plan your perfect day
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles, tips, and inspiration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 focus:outline-none focus:ring-4 focus:ring-white/30 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Articles */}
        {!searchTerm && !selectedCategory && !selectedTags.length && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Featured Articles</h2>
              <div className="flex items-center space-x-2 text-rose-600">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Trending Now</span>
              </div>
            </div>
            
            {featuredPosts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Featured Article */}
                <div className="lg:col-span-2">
                  <Card 
                    className="overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-video relative">
                      <img
                        src={featuredPosts[0].featured_image}
                        alt={featuredPosts[0].title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-gray-900">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          Featured
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white mb-3"
                          style={{ backgroundColor: featuredPosts[0].category_info?.color || '#6366f1' }}
                        >
                          {featuredPosts[0].category_info?.name || featuredPosts[0].category}
                        </span>
                        <h3 className="text-2xl font-bold text-white mb-2">{featuredPosts[0].title}</h3>
                        <p className="text-white/90 text-sm line-clamp-2">{featuredPosts[0].excerpt}</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{featuredPosts[0].read_time} min read</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{formatNumber(featuredPosts[0].view_count)} views</span>
                          </div>
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            <span>{featuredPosts[0].like_count} likes</span>
                          </div>
                        </div>
                        <span>{formatDate(featuredPosts[0].published_at || featuredPosts[0].created_at)}</span>
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="primary"
                          onClick={() => navigate(`/inspiration/${featuredPosts[0].slug}`)}
                          className="w-full"
                        >
                          Read Article
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Side Featured Articles */}
                <div className="space-y-6">
                  {featuredPosts.slice(1, 3).map((post) => (
                    <Card 
                      key={post.id} 
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="flex">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-32 h-24 object-cover flex-shrink-0"
                        />
                        <div className="p-4 flex-1">
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white mb-2"
                            style={{ backgroundColor: post.category_info?.color || '#6366f1' }}
                          >
                            {post.category_info?.name || post.category}
                          </span>
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h4>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{post.read_time} min</span>
                            <span className="mx-2">•</span>
                            <Eye className="w-3 h-3 mr-1" />
                            <span>{formatNumber(post.view_count)}</span>
                          </div>
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/inspiration/${post.slug}`)}
                              className="w-full"
                            >
                              Read More
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Categories */}
        {!categoriesLoading && (
          <section className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Browse by Category</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full transition-all ${
                  !selectedCategory
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                All Articles
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`px-4 py-2 rounded-full transition-all ${
                    selectedCategory === category.slug
                      ? 'text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.slug ? category.color : undefined
                  }}
                >
                  {category.name} ({category.post_count})
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filters and View Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {selectedCategory 
                ? `${categories.find(c => c.slug === selectedCategory)?.name || 'Category'} Articles`
                : 'All Articles'
              }
            </h2>
            <span className="text-gray-600">({posts.length} articles)</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  icon={Tag}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </Button>
                
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10 p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Filter by Tags</h4>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1 rounded-full text-sm transition-all ${
                            selectedTags.includes(tag)
                              ? 'bg-rose-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    {selectedTags.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => setSelectedTags([])}
                          className="text-sm text-rose-600 hover:text-rose-700"
                        >
                          Clear tags
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters ({activeFiltersCount})
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading articles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Articles</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Card>
        )}

        {/* No Results */}
        {!loading && !error && posts.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-6">
              {activeFiltersCount > 0 
                ? 'Try adjusting your search or filters to find more articles.'
                : 'No articles are currently available.'
              }
            </p>
            {activeFiltersCount > 0 && (
              <Button variant="primary" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </Card>
        )}

        {/* Articles Grid/List */}
        {!loading && !error && posts.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}>
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className={`overflow-hidden hover:shadow-xl transition-shadow group ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                <div className={viewMode === 'list' ? 'w-64 flex-shrink-0' : 'aspect-video'}>
                  <img
                    src={post.featured_image || 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800'}
                    alt={post.title}
                    className={`object-cover hover:scale-105 transition-transform duration-300 ${
                      viewMode === 'list' ? 'w-full h-full' : 'w-full h-full'
                    }`}
                  />
                </div>
                
                <div className="p-6 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: post.category_info?.color || '#6366f1' }}
                    >
                      {post.category_info?.name || post.category}
                    </span>
                    {post.featured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <h3 className={`font-bold text-gray-900 mb-3 hover:text-rose-600 transition-colors ${
                    viewMode === 'list' ? 'text-xl' : 'text-lg'
                   } group-hover:text-rose-600`}>
                    {post.title}
                  </h3>
                  
                  <p className={`text-gray-600 mb-4 ${
                    viewMode === 'list' ? 'line-clamp-3' : 'line-clamp-2'
                  }`}>
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{post.read_time} min read</span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        <span>{formatNumber(post.view_count)}</span>
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        <span>{post.like_count}</span>
                      </div>
                    </div>
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                  
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/inspiration/${post.slug}`)}
                    className="w-full"
                  >
                    Read Article
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Newsletter Signup */}
        <section className="mt-20">
          <NewsletterSignup source="inspiration_main" />
        </section>
      </div>
    </div>
  );
};