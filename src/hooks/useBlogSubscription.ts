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
      setSuccess("Thank you for subscribing! You'll receive our weekly newsletter.");
      setLoading(false);
      return true;
    }

    try {
      const { error } = await supabase.from('blog_subscriptions').insert([
        {
          email: email.toLowerCase().trim(),
          name: name?.trim() || null,
          subscription_source: source,
          status: 'active',
          subscribed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Supabase subscription error:', error);
        if (error.code === '23505') {
          setError('This email is already subscribed to our newsletter.');
        } else if (error.code === '42883') {
          setError('Database trigger error: Please contact support to resolve the issue.');
        } else {
          setError(`Failed to subscribe: ${error.message}`);
        }
        return false;
      }

      setSuccess("Thank you for subscribing! You'll receive a welcome email soon.");
      return true;
    } catch (error: any) {
      console.error('Unexpected error during subscription:', error);
      setError(`Unexpected error: ${error.message || 'Please try again later.'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, error, success };
};