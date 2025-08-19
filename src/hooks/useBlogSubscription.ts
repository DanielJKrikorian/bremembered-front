import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface BlogSubscription {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed';
  subscribed_at: string;
  unsubscribed_at?: string;
  subscription_source: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useBlogSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const subscribe = async (email: string, name?: string, source: string = 'website') => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!supabase || !isSupabaseConfigured()) {
      // Mock success for demo
      setSuccess('Thank you for subscribing! You\'ll receive our weekly newsletter.');
      setLoading(false);
      return true;
    }

    try {
      const { error } = await supabase
        .from('blog_subscriptions')
        .insert([{
          email: email.toLowerCase().trim(),
          name: name?.trim() || null,
          subscription_source: source,
          status: 'active'
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setError('This email is already subscribed to our newsletter.');
        } else {
          throw error;
        }
        return false;
      }

      setSuccess('Thank you for subscribing! You\'ll receive our weekly newsletter with wedding tips and inspiration.');
      return true;
    } catch (err) {
      console.error('Error subscribing to blog:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (email: string) => {
    if (!email) {
      setError('Email is required');
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!supabase || !isSupabaseConfigured()) {
      // Mock success for demo
      setSuccess('You have been unsubscribed from our newsletter.');
      setLoading(false);
      return true;
    }

    try {
      const { error } = await supabase
        .from('blog_subscriptions')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase().trim());

      if (error) throw error;

      setSuccess('You have been successfully unsubscribed from our newsletter.');
      return true;
    } catch (err) {
      console.error('Error unsubscribing from blog:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async (email: string): Promise<BlogSubscription | null> => {
    if (!email || !supabase || !isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('blog_subscriptions')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (err) {
      console.error('Error checking subscription:', err);
      return null;
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    subscribe,
    unsubscribe,
    checkSubscription,
    loading,
    error,
    success,
    clearMessages
  };
};