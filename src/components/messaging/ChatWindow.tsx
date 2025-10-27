import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, User, Clock, Check, CheckCheck, MessageCircle, Image } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useMessages, Conversation, Message } from '../../hooks/useMessaging';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      console.error('ChatWindow error:', this.state.error);
      return (
        <div className="text-center py-8 text-red-500">
          Error loading chat: {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }
    return this.props.children;
  }
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onBack
}) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, markAsRead } = useMessages(conversation.id);
  const [newMessage, setNewMessage] = useState('');
  const [newMessageImage, setNewMessageImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [vendorSlug, setVendorSlug] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  useEffect(() => {
    if ((conversation as any).initialMessage && messages.length === 0) {
      const initialMsg = (conversation as any).initialMessage;
      sendMessage(initialMsg);
    }
  }, [conversation, messages.length, sendMessage]);

  useEffect(() => {
    const fetchVendorSlug = async () => {
      if (!conversation.other_participant?.id) {
        console.warn("No participant ID provided for vendor slug fetch");
        setVendorSlug(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("slug")
          .eq("id", conversation.other_participant.id)
          .single();
        if (error) {
          console.error("Error fetching vendor slug by id:", error);
          // Fallback to user_id if id query fails
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("vendors")
            .select("slug")
            .eq("user_id", conversation.other_participant.id)
            .single();
          if (fallbackError) {
            console.error("Error fetching vendor slug by user_id:", fallbackError);
            setVendorSlug(null);
            return;
          }
          setVendorSlug(fallbackData.slug || null);
        } else {
          setVendorSlug(data.slug || null);
        }
      } catch (error) {
        console.error("Error fetching vendor slug:", error);
        setVendorSlug(null);
      }
    };
    fetchVendorSlug();
  }, [conversation.other_participant?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !newMessageImage || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage, newMessageImage);
      setNewMessage('');
      setNewMessageImage(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const isMessageRead = (message: Message) => {
    return message.read_by && message.read_by.length > 1;
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="flex items-center space-x-4 p-4 border-b border-gray-200 bg-white rounded-t-xl">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={onBack}
            size="sm"
          />
          <div className="flex items-center space-x-3 flex-1">
            {conversation.other_participant?.profile_photo ? (
              <img
                src={conversation.other_participant.profile_photo}
                alt={conversation.other_participant.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {conversation.other_participant?.name || 'Unknown Contact'}
              </h3>
              <div className="space-y-1">
                {conversation.other_participant?.role === 'vendor' && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">
                      {conversation.other_participant.service_type || 'Wedding'} Vendor
                    </p>
                    <div className="flex flex-col space-y-1 text-xs">
                      {conversation.other_participant.phone && (
                        <span>📞 {conversation.other_participant.phone}</span>
                      )}
                      {conversation.other_participant.email && (
                        <span>✉️ {conversation.other_participant.email}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Online</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => vendorSlug ? window.open(`https://bremembered.io/vendor/${vendorSlug}`, '_blank') : null}
              className={`text-rose-500 border-rose-500 hover:bg-rose-50 ${!vendorSlug ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!vendorSlug}
            >
              Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => vendorSlug ? window.open(`https://bremembered.io/v/${vendorSlug}`, '_blank') : null}
              className={`text-rose-500 border-rose-500 hover:bg-rose-50 ${!vendorSlug ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!vendorSlug}
            >
              Website
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              const senderName = isOwnMessage 
                ? 'You' 
                : conversation.other_participant?.name || 'Unknown';
              
              return (
                <div key={message.id} className="space-y-1">
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-gray-500 px-2">
                      {senderName}
                    </span>
                  </div>
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-rose-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {message.message_text && (
                        <p className="text-sm leading-relaxed">{message.message_text}</p>
                      )}
                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="Message attachment"
                          className="mt-2 max-w-[200px] rounded-md"
                        />
                      )}
                      <div className={`flex items-center justify-end space-x-1 mt-1 ${
                        isOwnMessage
                          ? 'text-rose-100' 
                          : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {isOwnMessage && (
                          isMessageRead(message) ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              disabled={sending}
            />
            <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              <Image className="w-5 h-5 mr-2" />
              <span>Attach Image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif"
                onChange={(e) => setNewMessageImage(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              disabled={(!newMessage.trim() && !newMessageImage) || sending}
              loading={sending}
              className="rounded-full px-4 flex-shrink-0"
            >
            </Button>
          </div>
          {newMessageImage && (
            <div className="mt-2 text-sm text-gray-600">
              Selected: {newMessageImage.name}
              <button
                onClick={() => setNewMessageImage(null)}
                className="ml-2 text-rose-500 hover:text-rose-600"
              >
                Remove
              </button>
            </div>
          )}
        </form>
      </div>
    </ErrorBoundary>
  );
};