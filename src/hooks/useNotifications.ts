import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  type: 'new_message' | 'photo_upload' | 'payment_due' | 'review_response' | 'booking_update' | 'system';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export const useNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated || !user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Mock notifications for demo
        const mockNotifications: Notification[] = [
          {
            id: 'mock-notif-1',
            user_id: user.id,
            type: 'new_message',
            title: 'New message from Elegant Moments Photography',
            message: 'Hi! I\'m excited to work with you on your wedding photography...',
            data: {
              conversation_id: 'mock-conv-1',
              sender_name: 'Elegant Moments Photography'
            },
            read: false,
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            action_url: '/profile?tab=messages',
            priority: 'normal'
          },
          {
            id: 'mock-notif-2',
            user_id: user.id,
            type: 'photo_upload',
            title: 'New photos uploaded',
            message: 'Your photographer has uploaded 25 new photos to your gallery',
            data: {
              vendor_name: 'Elegant Moments Photography',
              file_count: 25
            },
            read: false,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            action_url: '/profile?tab=gallery',
            priority: 'normal'
          },
          {
            id: 'mock-notif-3',
            user_id: user.id,
            type: 'payment_due',
            title: 'Payment due in 7 days',
            message: 'Your remaining balance of $1,250 is due in 7 days',
            data: {
              amount_due: 125000,
              vendor_name: 'Elegant Moments Photography',
              event_date: '2024-08-15'
            },
            read: true,
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            action_url: '/profile?tab=payments',
            priority: 'high'
          }
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount((data || []).filter(n => !n.read).length);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    if (supabase && isSupabaseConfigured() && user) {
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
            if (updatedNotification.read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, isAuthenticated]);

  const markAsRead = async (notificationId: string) => {
    // Update local state immediately
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Revert local state on error
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    // Update local state immediately
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);
        
      if (error) throw error;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Could revert state here if needed
    }
  };

  const deleteNotification = async (notificationId: string) => {
    // Update local state immediately
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notificationToDelete && !notificationToDelete.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting notification:', err);
      // Revert local state on error
      if (notificationToDelete) {
        setNotifications(prev => [...prev, notificationToDelete].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        if (!notificationToDelete.read) {
          setUnreadCount(prev => prev + 1);
        }
      }
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};