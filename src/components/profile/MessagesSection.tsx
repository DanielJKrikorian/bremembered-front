import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useConversations } from '../hooks/useMessaging';
import { Card } from '../components/ui/Card';
import { ConversationList } from '../components/messaging/ConversationList';
import { ChatWindow } from '../components/messaging/ChatWindow';
import { Conversation } from '../hooks/useMessaging';

export const MessagesSection: React.FC = () => {
  const { conversations, loading: conversationsLoading } = useConversations();
  const location = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!conversationsLoading && location.state?.selectedConversationId && !selectedConversation) {
      const targetConversationId = location.state.selectedConversationId;
      const conversation = conversations.find(c => c.id === targetConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [conversationsLoading, conversations, location.state?.selectedConversationId, selectedConversation]);

  return (
    <>
      {selectedConversation ? (
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden">
            <ChatWindow
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
            />
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Messages</h3>
                <p className="text-gray-600 mt-1">
                  Chat with your wedding vendors
                </p>
              </div>
            </div>
            <ConversationList
              conversations={conversations}
              loading={conversationsLoading}
              onConversationSelect={(conversation) => setSelectedConversation(conversation)}
            />
          </Card>
        </div>
      )}
    </>
  );
};