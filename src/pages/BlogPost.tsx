import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, Clock, Eye, Heart, User, Tag, Share2, MessageCircle, ChevronRight, BookOpen, TrendingUp } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useBlogPost, useRelatedPosts, useBlogPostLike } from '../hooks/useBlog';
import { NewsletterSignup } from '../components/blog/NewsletterSignup';
import { AuthModal } from '../components/auth/AuthModal';
import { useWeddingBoard } from '../hooks/useWeddingBoard';
import { useAuth } from '../context/AuthContext';
import { trackPageView } from '../utils/analytics'; // Import trackPageView

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isAuthenticated, loading } = useAuth(); // Add loading
  const analyticsTracked = useRef(false); // Add ref to prevent duplicate calls

  // Track analytics only once on mount
  useEffect(() => {
    if (!loading && slug && !analyticsTracked.current) {
      console.log(`Tracking analytics for blog/${slug}:`, new Date().toISOString());
      trackPageView(`blog/${slug}`, 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [slug, loading, user?.id]);

  const { post, loading: postLoading, error } = useBlogPost(slug || '');
  const { relatedPosts } = useRelatedPosts(post?.id || '', post?.category || '', 3);
  const { isLiked, likeCount, toggleLike, loading: likeLoading } = useBlogPostLike(post?.id || '');
  const { addToFavorites } = useWeddingBoard();

  // Scroll to top when component mounts or slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'pinterest':
        window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setShowShareMenu(false);
        break;
    }
  };

  const handleLikeClick = async () => {
    try {
      await toggleLike(() => setShowAuthModal(true));
      
      if (isAuthenticated && post && !isLiked) {
        try {
          await addToFavorites('blog_post', post.id, `Loved this article: ${post.title}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (!errorMessage.includes('already saved')) {
            console.error('Error adding blog post to wedding board:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const renderContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.startsWith('## ')) {
          return (
            <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              {paragraph.replace('## ', '')}
            </h2>
          );
        } else if (paragraph.startsWith('### ')) {
          return (
            <h3 key={index} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              {paragraph.replace('### ', '')}
            </h3>
          );
        } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
          return (
            <p key={index} className="text-gray-700 leading-relaxed mb-4">
              <strong>{paragraph.replace(/\*\*/g, '')}</strong>
            </p>
          );
        } else if (paragraph.startsWith('- ')) {
          const listItems = paragraph.split('\n').filter(item => item.startsWith('- '));
          return (
            <ul key={index} className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              {listItems.map((item, idx) => (
                <li key={idx}>{item.replace('- ', '')}</li>
              ))}
            </ul>
          );
        } else if (paragraph.includes('**') && paragraph.includes(':**')) {
          const parts = paragraph.split('\n').filter(Boolean);
          return (
            <div key={index} className="mb-4">
              {parts.map((part, idx) => {
                if (part.includes('**') && part.includes(':**')) {
                  const [label, ...descParts] = part.split(':**');
                  const description = descParts.join(':**');
                  return (
                    <p key={idx} className="text-gray-700 leading-relaxed mb-2">
                      <strong>{label.replace(/\*\*/g, '')}:</strong> {description}
                    </p>
                  );
                }
                return (
                  <p key={idx} className="text-gray-700 leading-relaxed mb-2">
                    {part}
                  </p>
                );
              })}
            </div>
          );
        } else {
          return (
            <p key={index} className="text-gray-700 leading-relaxed mb-4">
              {paragraph}
            </p>
          );
        }
      });
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "The article you're looking for doesn't exist or has been removed."}
          </p>
          <div className="space-y-3">
            <Button variant="primary" onClick={() => navigate('/blog')}>
              Browse All Articles
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button 
              onClick={() => navigate('/')}
              className="hover:text-rose-600 transition-colors"
            >
              Home
            </button>
            <ChevronRight className="w-4 h-4" />
            <button 
              onClick={() => navigate('/inspiration')}
              className="hover:text-rose-600 transition-colors"
            >
              Inspiration
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium truncate">{post.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            icon={ArrowLeft} 
            onClick={() => navigate('/inspiration')}
          >
            Back to Inspiration
          </Button>
        </div>

        <article className="space-y-8">
          <header className="text-center">
            <div className="flex items-center justify-center mb-6">
              <span 
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: post.category_info?.color || '#6366f1' }}
              >
                {post.category_info?.name || post.category}
              </span>
              {post.featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 ml-3">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-8">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                <span>By {post.author?.name || 'B. Remembered Team'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{post.read_time} min read</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                <span>{formatNumber(post.view_count)} views</span>
              </div>
            </div>

            {post.featured_image && (
              <div className="mb-8">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-lg"
                />
              </div>
            )}
          </header>

          <div className="prose prose-lg max-w-none">
            <Card className="p-8 md:p-12">
              <div className="text-lg leading-relaxed">
                {renderContent(post.content)}
              </div>
            </Card>
          </div>

          {post.tags && post.tags.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate('/inspiration', { state: { searchTerm: tag } })}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLikeClick}
                  disabled={likeLoading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                    isLiked 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{likeCount || post.like_count}</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Share</span>
                  </button>

                  {showShareMenu && (
                    <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[160px]">
                      <div className="py-2">
                        <button
                          onClick={() => handleShare('facebook')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Share on Facebook
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Share on Twitter
                        </button>
                        <button
                          onClick={() => handleShare('pinterest')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Save to Pinterest
                        </button>
                        <button
                          onClick={() => handleShare('copy')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  <span>{formatNumber(post.view_count)} views</span>
                </div>
              </div>
            </div>
          </Card>

          {post.author && (
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    About {post.author.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Wedding expert and content creator at B. Remembered, passionate about helping couples plan their perfect day.
                  </p>
                  <Button variant="outline" size="sm">
                    View All Articles
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </article>

        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Articles</h2>
              <p className="text-gray-600">More inspiration and tips for your wedding planning</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Card 
                  key={relatedPost.id} 
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/blog/${relatedPost.slug}`)}
                >
                  <div className="aspect-video">
                    <img
                      src={relatedPost.featured_image || 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-rose-600 transition-colors">
                      {relatedPost.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{relatedPost.read_time} min read</span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        <span>{formatNumber(relatedPost.view_count)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16">
          <NewsletterSignup 
            source="inspiration_post"
            title="Love This Article?"
            description="Get more wedding inspiration and expert tips delivered to your inbox every week."
          />
        </section>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />
    </div>
  );
};

export default BlogPost;