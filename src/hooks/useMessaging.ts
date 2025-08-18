import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Message {
  id: string;
  sender_id: string;
  message_text: string;
  timestamp: string;
  conversation_id: string;
  read_by: string[];
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name?: string;
  participant_ids: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  last_message?: Message;
  unread_count?: number;
  other_participant?: {
    id: string;
    name: string;
    profile_photo?: string;
    role: 'vendor' | 'couple';
  };
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export const useConversations = () => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated || !user) {
        setConversations([]);
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Mock conversations for demo
        const mockConversations: Conversation[] = [
          {
            id: 'mock-conv-1',
            is_group: false,
            name: null,
            participant_ids: [user.id, 'mock-vendor-1'],
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T14:30:00Z',
            last_message: {
              id: 'mock-msg-1',
              sender_id: 'mock-vendor-1',
              message_text: 'Hi! I\'m excited to work with you on your wedding photography. When would be a good time to discuss your vision?',
              timestamp: '2024-01-15T14:30:00Z',
              conversation_id: 'mock-conv-1',
              read_by: ['mock-vendor-1']
            },
            unread_count: 1,
            other_participant: {
              id: 'mock-vendor-1',
              name: 'Elegant Moments Photography',
              profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
              role: 'vendor'
            }
          },
          {
            id: 'mock-conv-2',
            is_group: false,
            name: null,
            participant_ids: [user.id, 'mock-vendor-2'],
            created_at: '2024-01-12T09:00:00Z',
            updated_at: '2024-01-12T16:45:00Z',
            last_message: {
              id: 'mock-msg-2',
              sender_id: user.id,
              message_text: 'Thank you for the timeline! Everything looks perfect.',
              timestamp: '2024-01-12T16:45:00Z',
              conversation_id: 'mock-conv-2',
              read_by: [user.id, 'mock-vendor-2']
            },
            unread_count: 0,
            other_participant: {
              id: 'mock-vendor-2',
              name: 'Perfect Harmony Events',
              profile_photo: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
              role: 'vendor'
            }
          }
        ];
        setConversations(mockConversations);
        setLoading(false);
        return;
      }

      try {
        // Get conversations where user is a participant
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            messages!inner(
              id,
              sender_id,
              message_text,
              timestamp,
              read_by
            )
          `)
          .contains('participant_ids', [user.id])
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Process conversations to get last message and unread count
        const processedConversations = await Promise.all(
          (data || []).map(async (conv) => {
            // Get last message
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('timestamp', { ascending: false })
              .limit(1)
              .single();

            // Get unread count
            // Disabled unread count for now
            const unreadCount = 0;

            // Get other participant info
            const otherParticipantId = conv.participant_ids.find((id: string) => id !== user.id);
            let otherParticipant = null;

            if (otherParticipantId) {
              // Try to get vendor info first
              const { data: vendorData } = await supabase
                .from('vendors')
                .select('id, name, profile_photo')
                .eq('user_id', otherParticipantId)
                .single();

              if (vendorData) {
                otherParticipant = {
                  id: vendorData.id,
                  name: vendorData.name,
                  profile_photo: vendorData.profile_photo,
                  role: 'vendor' as const
                };
              } else {
                // Try to get couple info
                const { data: coupleData } = await supabase
                  .from('couples')
                  .select('id, name, profile_photo')
                  .eq('user_id', otherParticipantId)
                  .single();

                if (coupleData) {
                  otherParticipant = {
                    id: coupleData.id,
                    name: coupleData.name,
                    profile_photo: coupleData.profile_photo,
                    role: 'couple' as const
                  };
                }
              }
            }

            return {
              ...conv,
              last_message: lastMessageData,
              unread_count: 0,
              other_participant: otherParticipant
            };
          })
        );

        setConversations(processedConversations);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, isAuthenticated]);

  return { conversations, loading, error };
};

export const useBookedVendors = () => {
  const { user, isAuthenticated } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookedVendors = async () => {
      if (!isAuthenticated || !user) {
        setVendors([]);
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Mock vendors for demo
        const mockVendors = [
          {
            id: 'mock-vendor-1',
            user_id: 'mock-vendor-user-1',
            name: 'Elegant Moments Photography',
            profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
            service_type: 'Photography'
          },
          {
            id: 'mock-vendor-2',
            user_id: 'mock-vendor-user-2',
            name: 'Perfect Harmony Events',
            profile_photo: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
            service_type: 'Coordination'
          }
        ];
        setVendors(mockVendors);
        setLoading(false);
        return;
      }

      try {
        // Get couple ID first
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (coupleError) throw coupleError;

        // Get vendors from bookings
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            vendors!inner(
              id,
              user_id,
              name,
              profile_photo
            ),
            service_type
          `)
          .eq('couple_id', coupleData.id)
          .eq('status', 'confirmed');

        if (error) throw error;

        // Extract unique vendors
        const uniqueVendors = Array.from(
          new Map(
            (data || []).map(booking => [
              booking.vendors.id,
              {
                ...booking.vendors,
                service_type: booking.service_type
              }
            ])
          ).values()
        );

        setVendors(uniqueVendors);
      } catch (err) {
        console.error('Error fetching booked vendors:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
      } finally {
        setLoading(false);
      }
    };

    fetchBookedVendors();
  }, [user, isAuthenticated]);

  return { vendors, loading, error };
};

export const useCreateConversation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConversation = async (vendorUserId: string): Promise<Conversation | null> => {
    if (!user || !vendorUserId) return null;

    setLoading(true);
    setError(null);

    if (!supabase || !isSupabaseConfigured()) {
      // Mock conversation creation
      const mockConversation: Conversation = {
        id: `mock-conv-${Date.now()}`,
        is_group: false,
        name: null,
        participant_ids: [user.id, vendorUserId],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: 0
      };
      setLoading(false);
      return mockConversation;
    }

    try {
      // Check if conversation already exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id])
        .contains('participant_ids', [vendorUserId])
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (existingConv) {
        setLoading(false);
        return existingConv;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          is_group: false,
          participant_ids: [user.id, vendorUserId]
        }])
        .select()
        .single();

      if (error) throw error;

      setLoading(false);
      return data;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      setLoading(false);
      return null;
    }
  };

  return { createConversation, loading, error };
};

export const useMessages = (conversationId: string) => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!isAuthenticated || !user || !conversationId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Mock messages for demo
        const mockMessages: Message[] = [
          {
            id: 'mock-msg-1',
            sender_id: 'mock-vendor-1',
            message_text: 'Hi! I\'m excited to work with you on your wedding photography. When would be a good time to discuss your vision?',
            timestamp: '2024-01-15T14:30:00Z',
            conversation_id: conversationId,
            read_by: ['mock-vendor-1']
          },
          {
            id: 'mock-msg-2',
            sender_id: user.id,
            message_text: 'Hi! We\'re so excited to work with you too! We\'re available this weekend to chat if that works for you.',
            timestamp: '2024-01-15T15:15:00Z',
            conversation_id: conversationId,
            read_by: [user.id, 'mock-vendor-1']
          }
        ];
        setMessages(mockMessages);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, user, isAuthenticated]);

  const sendMessage = async (messageText: string) => {
    if (!user || !conversationId || !messageText.trim()) return;

    if (!supabase || !isSupabaseConfigured()) {
      // Mock sending message
      const newMessage: Message = {
        id: `mock-msg-${Date.now()}`,
        sender_id: user.id,
        message_text: messageText,
        timestamp: new Date().toISOString(),
        conversation_id: conversationId,
        read_by: [user.id]
      };
      setMessages(prev => [...prev, newMessage]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          message_text: messageText,
          conversation_id: conversationId,
          read_by: [user.id]
        }])
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const markAsRead = async () => {
    // Disabled for now - will implement email notifications instead
    return;
  };

  return { messages, loading, error, sendMessage, markAsRead };
};