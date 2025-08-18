import React, { useState } from 'react';
import { X, MessageCircle, User, Send, Clock, Calendar, Camera, Music, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useBookedVendors, useCreateConversation } from '../../hooks/useMessaging';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: any) => void;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated
}) => {
  const { vendors: bookedVendors, loading: vendorsLoading } = useBookedVendors();
  const { createConversation, loading: creatingConversation } = useCreateConversation();
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const messageTemplates = [
    {
      id: 'intro',
      title: 'Introduction & Timeline',
      message: "Hi! We're so excited to work with you for our wedding. Could we schedule a time to discuss our timeline and vision?"
    },
    {
      id: 'timeline',
      title: 'Timeline Discussion',
      message: "Hi! We'd love to go over the wedding day timeline with you. When would be a good time to chat about the schedule?"
    },
    {
      id: 'vision',
      title: 'Share Wedding Vision',
      message: "Hi! We'd like to share our wedding vision and style preferences with you. Could we set up a call to discuss what we're hoping for?"
    },
    {
      id: 'logistics',
      title: 'Logistics & Details',
      message: "Hi! We have some questions about logistics for our wedding day. When would be convenient for you to discuss the details?"
    },
    {
      id: 'changes',
      title: 'Changes or Updates',
      message: "Hi! We have some updates to share about our wedding plans. Could we schedule a time to go over the changes?"
    },
    {
      id: 'questions',
      title: 'General Questions',
      message: "Hi! We have a few questions about our wedding services. When would be a good time to chat?"
    }
  ];

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return Camera;
      case 'Videography': return Camera;
      case 'DJ Services': return Music;
      case 'Live Musician': return Music;
      case 'Coordination': return Users;
      case 'Planning': return Calendar;
      default: return MessageCircle;
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
    setCustomMessage(template.message);
  };

  const handleSendMessage = async () => {
    if (!selectedVendor || !customMessage.trim()) return;

    try {
      const conversation = await createConversation(selectedVendor.user_id);
      if (conversation) {
        // Send the initial message
        if (customMessage.trim()) {
          // We'll send the message after the conversation is created
          // For now, just create the conversation and let the parent handle it
          onConversationCreated({
            ...conversation,
            initialMessage: customMessage,
            vendor: selectedVendor
          });
        } else {
          onConversationCreated(conversation);
        }
        onClose();
        resetModal();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const resetModal = () => {
    setSelectedVendor(null);
    setCustomMessage('');
    setSelectedTemplate('');
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">New Message</h3>
              <p className="text-sm text-gray-600">Start a conversation with your vendor</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Select Vendor */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Select Vendor</h4>
            {vendorsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600">Loading your vendors...</p>
              </div>
            ) : bookedVendors.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No booked vendors found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {bookedVendors.map((vendor) => {
                  const ServiceIcon = getServiceIcon(vendor.service_type);
                  const isSelected = selectedVendor?.id === vendor.id;
                  
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => setSelectedVendor(vendor)}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-4">
                        {vendor.profile_photo ? (
                          <img
                            src={vendor.profile_photo}
                            alt={vendor.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{vendor.name}</h5>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <ServiceIcon className="w-4 h-4" />
                            <span>{vendor.service_type}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Choose Message Template or Write Custom */}
          {selectedVendor && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Choose a Message Template</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {messageTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`
                      p-3 rounded-lg border-2 text-left transition-all
                      ${selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <h5 className="font-medium text-gray-900 text-sm mb-1">{template.title}</h5>
                    <p className="text-xs text-gray-600 line-clamp-2">{template.message}</p>
                  </button>
                ))}
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {customMessage.length}/500 characters
                  </p>
                  {selectedTemplate && (
                    <button
                      onClick={() => {
                        setSelectedTemplate('');
                        setCustomMessage('');
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700"
                    >
                      Clear template
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!selectedVendor || !customMessage.trim() || creatingConversation}
              loading={creatingConversation}
              icon={Send}
            >
              Start Conversation
            </Button>
          </div>

          {/* Preview */}
          {selectedVendor && customMessage && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-3">Message Preview</h5>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">To: {selectedVendor.name}</span>
                  <span className="text-xs text-gray-500">({selectedVendor.service_type})</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{customMessage}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};