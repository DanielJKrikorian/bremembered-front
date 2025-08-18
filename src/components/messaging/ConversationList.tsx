import React, { useState } from 'react';
import { MessageCircle, User, ChevronRight, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { NewMessageModal } from './NewMessageModal';
import { Conversation, useBookedVendors, useCreateConversation } from '../../hooks/useMessaging';
import { useAuth } from '../../context/AuthContext';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  onConversationSelect: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  onConversationSelect
}) => {
  const { user } = useAuth();
  const { vendors: bookedVendors } = useBookedVendors();
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const handleConversationCreated = (conversation: any) => {
    // If there's an initial message, we'll handle sending it in the chat window
    onConversationSelect(conversation);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900">Messages</h4>
          {bookedVendors.length > 0 && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowNewMessageModal(true)}
              size="sm"
            >
              New Message
            </Button>
          )}
        </div>
        
        <Card className="p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-600 mb-6">
            {bookedVendors.length > 0 
              ? 'Start a conversation with one of your booked vendors'
              : 'Once you book services, you\'ll be able to message your vendors directly here.'
            }
          </p>
          {bookedVendors.length > 0 ? (
            <Button 
              variant="primary"
              icon={Plus}
              onClick={() => setShowNewMessageModal(true)}
            >
              Start New Conversation
            </Button>
          ) : (
            <Button 
              variant="primary"
              onClick={() => window.location.href = '/search'}
            >
              Browse Services
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">Messages</h4>
        {bookedVendors.length > 0 && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowNewMessageModal(true)}
            size="sm"
          >
            New Message
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {conversations.map((conversation) => (
          <div
            key={conversation.id} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Clicking conversation:', conversation.id);
              onConversationSelect(conversation);
            }}
            className="cursor-pointer"
          >
            <Card className="p-4 hover:shadow-md transition-shadow hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="relative">
                  {conversation.other_participant?.profile_photo ? (
                    <img
                      src={conversation.other_participant.profile_photo}
                      alt={conversation.other_participant.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {conversation.other_participant?.name || 'Unknown Contact'}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {conversation.other_participant?.role === 'vendor' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                          Vendor
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {conversation.last_message && formatTimestamp(conversation.last_message.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  {conversation.last_message && (
                    <p className="text-sm truncate text-gray-600">
                      {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                      {truncateMessage(conversation.last_message.message_text)}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};