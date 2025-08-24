import React, { useState } from 'react';
import { X, Star, Send, MessageCircle, User, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';

interface VendorReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: {
    id: string;
    name: string;
    profile_photo?: string;
    service_type?: string;
  };
  booking?: {
    id: string;
    service_packages?: {
      name: string;
    };
  };
  onReviewSubmitted?: () => void;
}

export const VendorReviewModal: React.FC<VendorReviewModalProps> = ({
  isOpen,
  onClose,
  vendor,
  booking,
  onReviewSubmitted
}) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    communication_rating: 0,
    experience_rating: 0,
    quality_rating: 0,
    overall_rating: 0,
    feedback: ''
  });

  const ratingCategories = [
    {
      key: 'communication_rating',
      label: 'Communication',
      description: 'How well did they communicate with you?'
    },
    {
      key: 'experience_rating',
      label: 'Experience',
      description: 'How was your overall experience working with them?'
    },
    {
      key: 'quality_rating',
      label: 'Quality',
      description: 'How would you rate the quality of their work?'
    },
    {
      key: 'overall_rating',
      label: 'Overall',
      description: 'Your overall rating for this vendor'
    }
  ];

  const handleRatingChange = (category: string, rating: number) => {
    setFormData(prev => ({ ...prev, [category]: rating }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !couple) {
      setError('Authentication required');
      return;
    }

    // Validation
    if (formData.communication_rating === 0) {
      setError('Please provide a communication rating');
      return;
    }

    if (formData.overall_rating === 0) {
      setError('Please provide an overall rating');
      return;
    }

    if (!formData.feedback.trim()) {
      setError('Please provide feedback about your experience');
      return;
    }

    setLoading(true);
    setError(null);

    if (!supabase || !isSupabaseConfigured()) {
      // Mock success for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => {
        onReviewSubmitted?.();
        onClose();
        resetForm();
      }, 2000);
      setLoading(false);
      return;
    }

    try {
      const reviewData = {
        vendor_id: vendor.id,
        couple_id: couple.id,
        communication_rating: formData.communication_rating,
        experience_rating: formData.experience_rating || null,
        quality_rating: formData.quality_rating || null,
        overall_rating: formData.overall_rating,
        feedback: formData.feedback.trim()
      };

      const { error: insertError } = await supabase
        .from('vendor_reviews')
        .insert([reviewData]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('You have already reviewed this vendor');
        } else {
          throw insertError;
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onReviewSubmitted?.();
        onClose();
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      communication_rating: 0,
      experience_rating: 0,
      quality_rating: 0,
      overall_rating: 0,
      feedback: ''
    });
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Review Vendor</h3>
              <p className="text-sm text-gray-600">Share your experience with {vendor.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {success ? (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Thank you for your feedback. Your review helps other couples make informed decisions.
            </p>
            <p className="text-sm text-gray-500">
              The vendor will be notified and may respond to your review.
            </p>
          </div>
        ) : (
          /* Review Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Vendor Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              {vendor.profile_photo ? (
                <img
                  src={vendor.profile_photo}
                  alt={vendor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{vendor.name}</h4>
                {vendor.service_type && (
                  <p className="text-sm text-gray-600">{vendor.service_type}</p>
                )}
                {booking?.service_packages?.name && (
                  <p className="text-sm text-gray-600">Service: {booking.service_packages.name}</p>
                )}
              </div>
            </div>

            {/* Rating Categories */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Rate Your Experience</h4>
              
              {ratingCategories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{category.label}</h5>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingChange(category.key, rating)}
                        className={`w-8 h-8 transition-colors ${
                          formData[category.key as keyof typeof formData] >= rating
                            ? 'text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        <Star className="w-full h-full fill-current" />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {formData[category.key as keyof typeof formData] > 0 
                        ? `${formData[category.key as keyof typeof formData]} star${formData[category.key as keyof typeof formData] !== 1 ? 's' : ''}`
                        : 'Not rated'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Written Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Written Feedback *
              </label>
              <textarea
                value={formData.feedback}
                onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                placeholder="Share details about your experience working with this vendor. What did they do well? What could be improved?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                required
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {formData.feedback.length}/500 characters
                </p>
                <p className="text-xs text-gray-500">
                  Minimum 10 characters
                </p>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Review Guidelines</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be honest and constructive in your feedback</li>
                <li>• Focus on your experience with the vendor's service</li>
                <li>• Avoid personal attacks or inappropriate language</li>
                <li>• Your review will be public and help other couples</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || formData.communication_rating === 0 || formData.overall_rating === 0 || formData.feedback.length < 10}
                loading={loading}
                icon={Send}
                className="flex-1"
              >
                Submit Review
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};