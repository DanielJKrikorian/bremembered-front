import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Calendar, User, Edit2, Trash2, AlertCircle, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';

interface VendorReview {
  id: string;
  vendor_id: string;
  couple_id: string;
  communication_rating: number;
  experience_rating?: number;
  quality_rating?: number;
  overall_rating?: number;
  feedback?: string;
  vendor_response?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  vendors?: {
    id: string;
    name: string;
    profile_photo?: string;
  };
  service_packages?: {
    name: string;
    service_type: string;
  };
}

export const ReviewsSection: React.FC = () => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (couple?.id) {
      fetchReviews();
    }
  }, [couple]);

  const fetchReviews = async () => {
    if (!couple?.id) {
      setLoading(false);
      return;
    }

    if (!supabase || !isSupabaseConfigured()) {
      // Mock reviews for demo
      const mockReviews: VendorReview[] = [
        {
          id: 'mock-review-1',
          vendor_id: 'mock-vendor-1',
          couple_id: couple.id,
          communication_rating: 5,
          experience_rating: 5,
          quality_rating: 5,
          overall_rating: 5,
          feedback: 'Absolutely amazing photographer! They captured every special moment perfectly and were so professional throughout the entire process. The photos exceeded our expectations and we couldn\'t be happier with the results.',
          vendor_response: 'Thank you so much for the wonderful review! It was truly an honor to be part of your special day. Your love and joy made my job easy, and I\'m thrilled you love the photos as much as I enjoyed taking them.',
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-01-20T10:00:00Z',
          vendors: {
            id: 'mock-vendor-1',
            name: 'Elegant Moments Photography',
            profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
          },
          service_packages: {
            name: 'Premium Wedding Photography',
            service_type: 'Photography'
          }
        },
        {
          id: 'mock-review-2',
          vendor_id: 'mock-vendor-2',
          couple_id: couple.id,
          communication_rating: 4,
          experience_rating: 5,
          quality_rating: 4,
          overall_rating: 4,
          feedback: 'Great coordination service! They kept everything on schedule and handled all the logistics perfectly. Very professional and organized throughout the planning process.',
          vendor_response: null,
          created_at: '2024-01-18T14:00:00Z',
          updated_at: '2024-01-18T14:00:00Z',
          vendors: {
            id: 'mock-vendor-2',
            name: 'Perfect Harmony Events',
            profile_photo: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400'
          },
          service_packages: {
            name: 'Day-of Coordination',
            service_type: 'Coordination'
          }
        }
      ];
      setReviews(mockReviews);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .select(`
          *,
          vendors!inner(
            id,
            name,
            profile_photo
          )
        `)
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Reviews</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="primary" onClick={fetchReviews}>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Vendor Reviews</h3>
            <p className="text-gray-600">
              Reviews you've written for your wedding vendors
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-rose-500">{reviews.length}</div>
            <div className="text-sm text-gray-600">Reviews Written</div>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600 mb-6">
            Once you complete services with vendors, you can leave reviews to help other couples
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/my-bookings'}
          >
            View My Bookings
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              {/* Review Header */}
              <div className="flex items-start space-x-4 mb-6">
                {review.vendors?.profile_photo ? (
                  <img
                    src={review.vendors.profile_photo}
                    alt={review.vendors.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {review.vendors?.name || 'Vendor'}
                  </h4>
                  {review.service_packages && (
                    <p className="text-sm text-gray-600 mb-2">
                      {review.service_packages.name} • {review.service_packages.service_type}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Reviewed on {formatDate(review.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {review.overall_rating || review.communication_rating}/5
                  </div>
                  <div className="text-sm text-gray-600">Overall Rating</div>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Communication</h5>
                  {renderStars(review.communication_rating)}
                </div>
                {review.experience_rating && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Experience</h5>
                    {renderStars(review.experience_rating)}
                  </div>
                )}
                {review.quality_rating && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Quality</h5>
                    {renderStars(review.quality_rating)}
                  </div>
                )}
                {review.overall_rating && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Overall</h5>
                    {renderStars(review.overall_rating)}
                  </div>
                )}
              </div>

              {/* Written Feedback */}
              {review.feedback && (
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-2">Your Review</h5>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{review.feedback}</p>
                  </div>
                </div>
              )}

              {/* Vendor Response */}
              {review.vendor_response ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <h5 className="font-medium text-blue-900">Vendor Response</h5>
                  </div>
                  <p className="text-blue-800 leading-relaxed">{review.vendor_response}</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    The vendor hasn't responded to your review yet
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};