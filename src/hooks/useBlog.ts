import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  author_id?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  read_time: number;
  view_count: number;
  like_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    id: string;
    name: string;
    email: string;
  };
  category_info?: BlogCategory;
  is_liked?: boolean;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  post_count: number;
  created_at: string;
}

export interface BlogFilters {
  category?: string;
  tags?: string[];
  featured?: boolean;
  search?: string;
}

export const useBlogPosts = (filters?: BlogFilters, limit?: number) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock blog posts for demo
        const mockPosts: BlogPost[] = [
          {
            id: 'mock-post-1',
            title: 'How to Choose the Perfect Wedding Photographer',
            slug: 'how-to-choose-perfect-wedding-photographer',
            excerpt: 'Your wedding photographer will capture the most important moments of your life. Here\'s how to find the perfect one for your style and budget.',
            content: 'Full content here...',
            featured_image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
            category: 'photography',
            tags: ['photography', 'wedding planning', 'tips', 'guide'],
            status: 'published',
            featured: true,
            read_time: 8,
            view_count: 1247,
            like_count: 89,
            published_at: '2024-01-15T10:00:00Z',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            author: {
              id: 'author-1',
              name: 'Wedding Expert',
              email: 'expert@bremembered.io'
            },
            category_info: {
              id: 'cat-1',
              name: 'Photography',
              slug: 'photography',
              description: 'Wedding photography tips and inspiration',
              color: '#8b5cf6',
              post_count: 12,
              created_at: '2024-01-01T00:00:00Z'
            }
          },
          {
            id: 'mock-post-2',
            title: 'Creating Your Perfect Wedding Timeline',
            slug: 'creating-perfect-wedding-timeline',
            excerpt: 'A well-planned timeline is the key to a stress-free wedding day. Learn how to create a schedule that works for everyone.',
            content: 'Full content here...',
            featured_image: 'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
            category: 'wedding-planning',
            tags: ['timeline', 'planning', 'coordination', 'schedule'],
            status: 'published',
            featured: true,
            read_time: 10,
            view_count: 892,
            like_count: 67,
            published_at: '2024-01-12T14:00:00Z',
            created_at: '2024-01-12T14:00:00Z',
            updated_at: '2024-01-12T14:00:00Z',
            author: {
              id: 'author-2',
              name: 'Planning Pro',
              email: 'planner@bremembered.io'
            },
            category_info: {
              id: 'cat-2',
              name: 'Wedding Planning',
              slug: 'wedding-planning',
              description: 'Tips and guides for planning your perfect wedding',
              color: '#f43f5e',
              post_count: 18,
              created_at: '2024-01-01T00:00:00Z'
            }
          },
          {
            id: 'mock-post-3',
            title: 'Sarah & Michael\'s Rustic Barn Wedding',
            slug: 'sarah-michael-rustic-barn-wedding',
            excerpt: 'A beautiful outdoor celebration in Napa Valley with string lights, vineyard views, and unforgettable moments.',
            content: 'Full content here...',
            featured_image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
            category: 'real-weddings',
            tags: ['real wedding', 'rustic', 'barn wedding', 'napa valley', 'outdoor'],
            status: 'published',
            featured: true,
            read_time: 12,
            view_count: 1456,
            like_count: 123,
            published_at: '2024-01-08T16:00:00Z',
            created_at: '2024-01-08T16:00:00Z',
            updated_at: '2024-01-08T16:00:00Z',
            author: {
              id: 'author-3',
              name: 'Real Wedding Stories',
              email: 'stories@bremembered.io'
            },
            category_info: {
              id: 'cat-3',
              name: 'Real Weddings',
              slug: 'real-weddings',
              description: 'Real wedding stories and inspiration from our couples',
              color: '#ec4899',
              post_count: 25,
              created_at: '2024-01-01T00:00:00Z'
            }
          }
        ];

        // Apply filters to mock data
        let filteredPosts = mockPosts;
        
        if (filters?.category) {
          filteredPosts = filteredPosts.filter(post => post.category === filters.category);
        }
        
        if (filters?.featured !== undefined) {
          filteredPosts = filteredPosts.filter(post => post.featured === filters.featured);
        }
        
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(searchLower) ||
            post.excerpt.toLowerCase().includes(searchLower) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }
        
        if (filters?.tags && filters.tags.length > 0) {
          filteredPosts = filteredPosts.filter(post => 
            filters.tags!.some(tag => post.tags.includes(tag))
          );
        }

        if (limit) {
          filteredPosts = filteredPosts.slice(0, limit);
        }

        setPosts(filteredPosts);
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (filters?.category) {
          query = query.eq('category', filters.category);
        }

        if (filters?.featured !== undefined) {
          query = query.eq('featured', filters.featured);
        }

        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
        }

        if (filters?.tags && filters.tags.length > 0) {
          query = query.overlaps('tags', filters.tags);
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        // Fetch categories separately
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('blog_categories')
          .select('*');

        if (categoriesError) throw categoriesError;

        const categoriesMap = new Map(
          (categoriesData || []).map(cat => [cat.slug, cat])
        );

        // Transform data to manually include category info
        const transformedPosts: BlogPost[] = (data || []).map(post => ({
          ...post,
          tags: post.tags || [],
          category_info: categoriesMap.get(post.category)
        }));

        setPosts(transformedPosts);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [filters?.category, filters?.featured, filters?.search, JSON.stringify(filters?.tags), limit]);

  return { posts, loading, error };
};

export const useBlogPost = (slug: string) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Mock single post for demo
        const mockPost: BlogPost = {
          id: 'mock-post-1',
          title: 'How to Choose the Perfect Wedding Photographer',
          slug: 'how-to-choose-perfect-wedding-photographer',
          excerpt: 'Your wedding photographer will capture the most important moments of your life. Here\'s how to find the perfect one for your style and budget.',
          content: `Your wedding day is one of the most important days of your life, and choosing the right photographer to capture those precious moments is crucial. With so many talented photographers available, it can be overwhelming to make the right choice. Here's a comprehensive guide to help you find your perfect wedding photographer.

## Understanding Your Photography Style

Before you start your search, it's important to understand what style of photography speaks to you. Wedding photography styles range from traditional posed portraits to candid photojournalistic shots, and everything in between.

### Popular Photography Styles:

**Traditional/Classic**: Formal, posed shots with classic compositions. Perfect for couples who want timeless, elegant photos.

**Photojournalistic/Documentary**: Candid, unposed moments that tell the story of your day naturally. Great for couples who want authentic emotions captured.

**Fine Art**: Artistic, creative compositions with attention to lighting, color, and artistic elements. Ideal for couples who appreciate artistic vision.

**Editorial**: Fashion-inspired photography with dramatic lighting and poses. Perfect for couples who want magazine-quality images.

## Questions to Ask Potential Photographers

When interviewing photographers, here are essential questions to ask:

1. **Can we see a full wedding gallery?** Don't just look at highlight reels - see how they capture an entire day.

2. **What's included in your packages?** Understand exactly what you're getting for your investment.

3. **How many photos will we receive?** Get a clear number of edited images you can expect.

4. **What's your backup plan?** Ensure they have backup equipment and a second photographer if needed.

5. **When will we receive our photos?** Understand the timeline for receiving your final gallery.

## Budget Considerations

Wedding photography is an investment in preserving your memories forever. While it's important to stay within budget, remember that these photos will be treasured for generations.

### Typical Photography Package Ranges:
- **Budget-friendly**: $1,500 - $3,000
- **Mid-range**: $3,000 - $6,000  
- **Luxury**: $6,000 - $15,000+

Remember that the cheapest option isn't always the best value. Consider the photographer's experience, style, and what's included in their packages.`,
          featured_image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'photography',
          tags: ['photography', 'wedding planning', 'tips', 'guide'],
          status: 'published',
          featured: true,
          read_time: 8,
          view_count: 1247,
          like_count: 89,
          published_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          author: {
            id: 'author-1',
            name: 'Wedding Expert',
            email: 'expert@bremembered.io'
          },
          category_info: {
            id: 'cat-1',
            name: 'Photography',
            slug: 'photography',
            description: 'Wedding photography tips and inspiration',
            color: '#8b5cf6',
            post_count: 12,
            created_at: '2024-01-01T00:00:00Z'
          }
        };
        setPost(mockPost);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error) throw error;

        // Fetch category separately
        const { data: categoryData, error: categoryError } = await supabase
          .from('blog_categories')
          .select('*')
          .eq('slug', data.category)
          .single();

        if (categoryError) {
          console.warn('Could not fetch category:', categoryError);
        }

        // Transform data to manually include category info
        const transformedPost = {
          ...data,
          tags: data.tags || [],
          category_info: categoryData
        };

        setPost(transformedPost);

        // Record view (anonymous)
        if (data.id) {
          await supabase
            .from('blog_post_views')
            .insert({
              post_id: data.id,
              ip_address: 'anonymous'
            });
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch blog post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  return { post, loading, error };
};

export const useBlogCategories = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock categories for demo
        const mockCategories: BlogCategory[] = [
          {
            id: 'cat-1',
            name: 'Wedding Planning',
            slug: 'wedding-planning',
            description: 'Tips and guides for planning your perfect wedding',
            color: '#f43f5e',
            post_count: 18,
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'cat-2',
            name: 'Photography',
            slug: 'photography',
            description: 'Wedding photography tips, trends, and inspiration',
            color: '#8b5cf6',
            post_count: 12,
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'cat-3',
            name: 'Real Weddings',
            slug: 'real-weddings',
            description: 'Real wedding stories and inspiration from our couples',
            color: '#ec4899',
            post_count: 25,
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'cat-4',
            name: 'Venues',
            slug: 'venues',
            description: 'Beautiful wedding venues and location ideas',
            color: '#10b981',
            post_count: 8,
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'cat-5',
            name: 'Music & Entertainment',
            slug: 'music-entertainment',
            description: 'DJ services, live music, and wedding entertainment',
            color: '#f59e0b',
            post_count: 6,
            created_at: '2024-01-01T00:00:00Z'
          }
        ];
        setCategories(mockCategories);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('blog_categories')
          .select('*')
          .order('post_count', { ascending: false });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching blog categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

export const useBlogPostLike = (postId: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const toggleLike = async () => {
    if (!supabase || !isSupabaseConfigured()) {
      // Mock like toggle for demo
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      return;
    }

    setLoading(true);
    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('blog_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) throw error;
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Add like
        const { error } = await supabase
          .from('blog_post_likes')
          .insert({
            post_id: postId,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, likeCount, toggleLike, loading };
};

export const useRelatedPosts = (currentPostId: string, category: string, limit: number = 3) => {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        // Mock related posts
        const mockRelatedPosts: BlogPost[] = [
          {
            id: 'related-1',
            title: 'Wedding Photography Styles Explained',
            slug: 'wedding-photography-styles-explained',
            excerpt: 'Understanding different photography styles to help you choose the perfect photographer.',
            content: '',
            featured_image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400',
            category: 'photography',
            tags: ['photography', 'styles'],
            status: 'published',
            featured: false,
            read_time: 6,
            view_count: 543,
            like_count: 34,
            published_at: '2024-01-10T10:00:00Z',
            created_at: '2024-01-10T10:00:00Z',
            updated_at: '2024-01-10T10:00:00Z'
          }
        ];
        setRelatedPosts(mockRelatedPosts);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, featured_image, category, read_time, view_count, published_at')
          .eq('status', 'published')
          .eq('category', category)
          .neq('id', currentPostId)
          .order('published_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setRelatedPosts(data || []);
      } catch (err) {
        console.error('Error fetching related posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch related posts');
      } finally {
        setLoading(false);
      }
    };

    if (currentPostId && category) {
      fetchRelatedPosts();
    }
  }, [currentPostId, category, limit]);

  return { relatedPosts, loading, error };
};