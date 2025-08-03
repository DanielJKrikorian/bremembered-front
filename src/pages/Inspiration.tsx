import React, { useState } from 'react';
import { Heart, BookOpen, Camera, Video, Music, Users, Sparkles, ArrowRight, Filter, Search, Eye, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Inspiration: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const inspirationPosts = [
    {
      id: '1',
      title: 'Rustic Barn Wedding in Napa Valley',
      category: 'venue',
      image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
      excerpt: 'Sarah and Michael\'s dreamy outdoor celebration with string lights and vineyard views.',
      readTime: '5 min read',
      tags: ['Outdoor', 'Rustic', 'California'],
      author: 'Wedding Team',
      date: '2024-01-15',
      likes: 234
    },
    {
      id: '2',
      title: 'Modern City Wedding Photography Tips',
      category: 'photography',
      image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
      excerpt: 'How to capture stunning urban wedding photos with dramatic lighting and architecture.',
      readTime: '7 min read',
      tags: ['Photography', 'Urban', 'Tips'],
      author: 'Photo Expert',
      date: '2024-01-12',
      likes: 189
    },
    {
      id: '3',
      title: 'Creating the Perfect Wedding Timeline',
      category: 'planning',
      image: 'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
      excerpt: 'A comprehensive guide to planning your wedding day schedule for maximum enjoyment.',
      readTime: '10 min read',
      tags: ['Planning', 'Timeline', 'Organization'],
      author: 'Wedding Planner',
      date: '2024-01-10',
      likes: 312
    },
    {
      id: '4',
      title: 'Cinematic Wedding Videography Trends',
      category: 'videography',
      image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
      excerpt: 'Latest trends in wedding videography that will make your love story unforgettable.',
      readTime: '6 min read',
      tags: ['Videography', 'Trends', 'Cinematic'],
      author: 'Video Pro',
      date: '2024-01-08',
      likes: 156
    },
    {
      id: '5',
      title: 'Choosing Your Wedding Music & DJ',
      category: 'music',
      image: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
      excerpt: 'How to select the perfect soundtrack for your special day and work with your DJ.',
      readTime: '8 min read',
      tags: ['Music', 'DJ', 'Entertainment'],
      author: 'Music Director',
      date: '2024-01-05',
      likes: 203
    },
    {
      id: '6',
      title: 'Intimate Wedding Ideas for Small Celebrations',
      category: 'planning',
      image: 'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800',
      excerpt: 'Beautiful ideas for creating meaningful moments with your closest family and friends.',
      readTime: '6 min read',
      tags: ['Intimate', 'Small Wedding', 'Ideas'],
      author: 'Event Designer',
      date: '2024-01-03',
      likes: 278
    }
  ];

  const categories = [
    { key: 'all', label: 'All', icon: Sparkles },
    { key: 'venue', label: 'Venues', icon: Heart },
    { key: 'photography', label: 'Photography', icon: Camera },
    { key: 'videography', label: 'Videography', icon: Video },
    { key: 'music', label: 'Music & DJ', icon: Music },
    { key: 'planning', label: 'Planning', icon: Users }
  ];

  const filteredPosts = inspirationPosts.filter(post => {
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = inspirationPosts[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-rose-500 to-amber-500 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Wedding Inspiration
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Discover beautiful ideas, expert tips, and real wedding stories to inspire your perfect day
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search inspiration, tips, and ideas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 focus:outline-none focus:ring-4 focus:ring-white/30 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Article */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Story</h2>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="relative">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-64 lg:h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-gray-900">
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-sm text-rose-600 font-medium uppercase tracking-wide">
                    {featuredPost.category}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{featuredPost.readTime}</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{featuredPost.title}</h3>
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">By {featuredPost.author}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{new Date(featuredPost.date).toLocaleDateString()}</span>
                  </div>
                  <Button variant="primary" icon={ArrowRight}>
                    Read More
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Category Filter */}
        <section className="mb-12">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all ${
                    activeCategory === category.key
                      ? 'bg-rose-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{category.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Articles Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {activeCategory === 'all' ? 'Latest Articles' : `${categories.find(c => c.key === activeCategory)?.label} Articles`}
            </h2>
            <div className="text-gray-600">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or category filter.</p>
              <Button variant="primary" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card key={post.id} hover className="overflow-hidden group cursor-pointer">
                  <div className="relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-900 capitalize">
                        {post.category}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-2">
                        <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                        <button className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                          <Share2 className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm text-gray-500">{post.readTime}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-rose-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{post.likes}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter Signup */}
        <section className="mt-20">
          <Card className="p-8 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Get Wedding Inspiration Weekly
              </h3>
              <p className="text-gray-600 mb-6">
                Join thousands of couples getting the latest wedding trends, tips, and real stories delivered to their inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <Button variant="primary" size="lg">
                  Subscribe
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                No spam, unsubscribe anytime. Privacy policy applies.
              </p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};