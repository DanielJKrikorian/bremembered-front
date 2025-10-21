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
  image_url?: string | null;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name?: string;
  participant_ids: string[];
  created_at: string;
  updated_at: string;
  last_message?: Message;
  unread_count?: number;
  other_participant?: {
    id: string;
    user_id?: string;
    name: string;
    profile_photo?: string;
    role: 'vendor' | 'couple';
    phone?: string;
    email?: string;
    service_type?: string;
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
              read_by: ['mock-vendor-1'],
              image_url: null
            },
            unread_count: 1,
            other_participant: {
              id: 'mock-vendor-1',
              name: 'Elegant Moments Photography',
              profile_photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
              role: 'vendor',
              phone: '(555) 123-4567',
              email: 'contact@elegantmoments.com',
              service_type: 'Photography'
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
              read_by: [user.id, 'mock-vendor-2'],
              image_url: null
            },
            unread_count: 0,
            other_participant: {
              id: 'mock-vendor-2',
              name: 'Perfect Harmony Events',
              profile_photo: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
              role: 'vendor',
              phone: '(555) 987-6543',
              email: 'hello@perfectharmony.com',
              service_type: 'Coordination'
            }
          }
        ];
        setConversations(mockConversations);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .contains('participant_ids', [user.id])
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const processedConversations = await Promise.all(
          (data || []).map(async (conv) => {
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select('id, sender_id, message_text, timestamp, read_by, image_url')
              .eq('conversation_id', conv.id)
              .order('timestamp', { ascending: false })
              .limit(1)
              .maybeSingle();

            const otherParticipantId = conv.participant_ids.find((id: string) => id !== user.id);
            let otherParticipant = null;

            if (otherParticipantId) {
              const { data: vendorData } = await supabase
                .from('vendors')
                .select('id, name, profile_photo, phone')
                .eq('user_id', otherParticipantId)
                .maybeSingle();

              if (vendorData) {
                const { data: bookingData } = await supabase
                  .from('bookings')
                  .select('service_type')
                  .eq('vendor_id', vendorData.id)
                  .limit(1)
                  .maybeSingle();

                otherParticipant = {
                  id: vendorData.id,
                  name: vendorData.name,
                  profile_photo: vendorData.profile_photo,
                  role: 'vendor' as const,
                  phone: vendorData.phone,
                  email: undefined,
                  service_type: bookingData?.service_type
                };
              } else {
                const { data: coupleData } = await supabase
                  .from('couples')
                  .select('id, name, profile_photo')
                  .eq('user_id', otherParticipantId)
                  .maybeSingle();

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

    // Subscribe to conversation changes
    if (supabase && isSupabaseConfigured()) {
      const conversationSubscription = supabase
        .channel('public:conversations')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'conversations' },
          () => fetchConversations()
        )
        .subscribe();

      const participantSubscription = supabase
        .channel('public:conversation_participants')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'conversation_participants' },
          () => fetchConversations()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(conversationSubscription);
        supabase.removeChannel(participantSubscription);
      };
    }
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
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (coupleError) throw coupleError;

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
    if (!user || !vendorUserId) {
      console.error('Invalid input:', { user: !!user, vendorUserId });
      setError('Missing user or vendor ID');
      return null;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id) || !uuidRegex.test(vendorUserId)) {
      console.error('Invalid UUID:', { userId: user.id, vendorUserId });
      setError('Invalid user or vendor ID format');
      return null;
    }

    setLoading(true);
    setError(null);

    if (!supabase || !isSupabaseConfigured()) {
      // Mock conversation
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
      console.log('Creating conversation with participants:', { userId: user.id, vendorUserId });

      // Use vendor-style RPC for atomic creation
      const participantIds = [user.id, vendorUserId].sort();
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('create_conversation_with_participants', {
          p_is_group: false,
          p_name: null,
          p_participant_ids: participantIds,
        });

      let conversationId: string;
      if (rpcError) {
        console.warn('RPC failed, falling back to direct insert:', rpcError);
        // Fallback: Create conversation and participants manually
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert([{
            is_group: false,
            participant_ids: participantIds,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (convError) throw convError;
        if (!convData?.id) throw new Error('No conversation ID returned');
        conversationId = convData.id;

        // Insert into conversation_participants to satisfy RLS Policy 2
        const { error: participantError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: conversationId, user_id: user.id, joined_at: new Date().toISOString() },
            { conversation_id: conversationId, user_id: vendorUserId, joined_at: new Date().toISOString() }
          ]);

        if (participantError) {
          console.warn('Participant insert warning (non-fatal if Policy 1 works):', participantError);
        }
      } else {
        conversationId = rpcData?.[0]?.conversation_id;
        if (!conversationId) throw new Error('No conversation ID from RPC');
      }

      // Fetch full conversation data
      const { data: fullConv, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;

      console.log('Conversation created:', conversationId);
      setLoading(false);
      return fullConv;
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

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(conversationId)) {
        console.error('Invalid conversationId:', conversationId);
        setError('Invalid conversation ID');
        setLoading(false);
        return;
      }

      if (!supabase || !isSupabaseConfigured()) {
        // Mock messages
        const mockMessages: Message[] = [
          {
            id: 'mock-msg-1',
            sender_id: 'mock-vendor-1',
            message_text: 'Hi! I\'m excited to work with you on your wedding photography. When would be a good time to discuss your vision?',
            timestamp: '2024-01-15T14:30:00Z',
            conversation_id: conversationId,
            read_by: ['mock-vendor-1'],
            image_url: null
          },
          {
            id: 'mock-msg-2',
            sender_id: user.id,
            message_text: 'Hi! We\'re so excited to work with you too! We\'re available this weekend to chat if that works for you.',
            timestamp: '2024-01-15T15:15:00Z',
            conversation_id: conversationId,
            read_by: [user.id, 'mock-vendor-1'],
            image_url: null
          }
        ];
        setMessages(mockMessages);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching messages for:', conversationId);
        const { data, error } = await supabase
          .from('messages')
          .select('id, sender_id, message_text, timestamp, conversation_id, read_by, image_url')
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

    // Real-time subscriptions
    if (supabase && isSupabaseConfigured()) {
      const messageSubscription = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      const participantSubscription = supabase
        .channel(`participants:${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'conversation_participants', filter: `conversation_id=eq.${conversationId}` },
          () => fetchMessages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageSubscription);
        supabase.removeChannel(participantSubscription);
      };
    }
  }, [conversationId, user, isAuthenticated]);

  const sendMessage = async (messageText: string, imageFile?: File | null) => {
    if (!user || !conversationId || (!messageText.trim() && !imageFile)) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      const err = new Error('Invalid conversation ID');
      console.error(err.message);
      setError(err.message);
      throw err;
    }

    if (!supabase || !isSupabaseConfigured()) {
      // Mock
      const newMessage: Message = {
        id: `mock-msg-${Date.now()}`,
        sender_id: user.id,
        message_text: messageText,
        timestamp: new Date().toISOString(),
        conversation_id: conversationId,
        read_by: [user.id],
        image_url: imageFile ? `mock-image-${Date.now()}.jpg` : null
      };
      setMessages((prev) => [...prev, newMessage]);
      return;
    }

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('message-images')
          .upload(fileName, imageFile);

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from('message-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      console.log('Sending message:', { conversation_id: conversationId, sender_id: user.id, image_url: imageUrl });
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          message_text: messageText.trim() || null,
          conversation_id: conversationId,
          read_by: [user.id],
          image_url: imageUrl
        })
        .select('id, sender_id, message_text, timestamp, conversation_id, read_by, image_url')
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Message sent:', data.id);
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  const markAsRead = async () => {
    if (!user) return;

    try {
      const unreadMessages = messages.filter((msg) => !msg.read_by?.includes(user.id));
      if (unreadMessages.length === 0) return;

      const updates = unreadMessages.map((msg) =>
        supabase
          .from('messages')
          .update({ read_by: [...(msg.read_by || []), user.id] })
          .eq('id', msg.id)
      );
      await Promise.all(updates);
      setMessages((prev) =>
        prev.map((msg) =>
          unreadMessages.some((um) => um.id === msg.id)
            ? { ...msg, read_by: [...(msg.read_by || []), user.id] }
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      setError(error instanceof Error ? error.message : 'Failed to mark messages as read');
    }
  };

  return { messages, loading, error, sendMessage, markAsRead };
};