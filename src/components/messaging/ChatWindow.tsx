import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, User, Clock, Check, CheckCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useMessages, Conversation, Message } from '../../hooks/useMessaging';
import { useAuth } from '../../context/AuthContext';

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onBack
}) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, markAsRead } = useMessages(conversation.id);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Send initial message if provided
  useEffect(() => {
    if ((conversation as any).initialMessage && messages.length === 0) {
      const initialMsg = (conversation as any).initialMessage;
      sendMessage(initialMsg);
    }
  }, [conversation, messages.length, sendMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage('');
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
            {conversation.other_participant?.role === 'vendor' && (
              <p className="text-sm text-gray-600">Wedding Vendor</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Online</span>
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
                {/* Sender Name */}
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs text-gray-500 px-2">
                    {senderName}
                  </span>
                </div>
                
                {/* Message Bubble */}
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isOwnMessage
                      ? 'bg-rose-500 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.message_text}</p>
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
          <Button
            type="submit"
            variant="primary"
            icon={Send}
            disabled={!newMessage.trim() || sending}
            loading={sending}
            className="rounded-full px-4 flex-shrink-0"
          >
          </Button>
        </div>
      </form>
    </div>
  );
};