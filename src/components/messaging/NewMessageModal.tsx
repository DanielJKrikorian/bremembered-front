import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, User, Send, Camera, Music, Users, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { useBookedVendors } from '../../hooks/useMessaging';
import { supabase } from '../../lib/supabase'; // Vendor's supabase import
import { useAuth } from '../../context/AuthContext'; // Or useAuthStore if that's your auth
import { debounce } from 'lodash'; // If not installed, npm i lodash

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: any) => void;
  portalId?: string;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
  portalId = 'modal-portal'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuth(); // Or useAuthStore() if that's your store

  const { vendors: bookedVendors, loading: vendorsLoading } = useBookedVendors();
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => modalRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      case 'Photography': 
      case 'Videography': return Camera;
      case 'DJ Services': 
      case 'Live Musician': return Music;
      case 'Coordination': return Users;
      case 'Planning': return Calendar;
      default: return MessageCircle;
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
    setCustomMessage(template.message);
    setError(null);
    setSuccessMessage(null);
  };

  // Debounced handler mirroring vendor's debouncedStartNewConversation
  const debouncedStartNewConversation = useCallback(
    debounce(async () => {
      if (!user || !selectedVendor || !customMessage.trim()) return;
      setError(null);
      setSuccessMessage(null);
      setIsSending(true);

      try {
        // Prepare participant IDs: current user + vendor user_id (single, non-group)
        const participantIds = [user.id, selectedVendor.user_id].sort();
        const { data: convData, error: convError } = await supabase
          .rpc("create_conversation_with_participants", {
            p_is_group: false,  // Single vendor = non-group
            p_name: null,  // No group name for single
            p_participant_ids: participantIds,
          });

        if (convError) throw convError;

        const conversationId = convData?.[0]?.conversation_id;
        if (!conversationId) throw new Error("No conversation ID returned from RPC");

        // Insert initial message (mirroring vendor's insert)
        const { data: messageData, error: messageError } = await supabase
          .from("messages")
          .insert({
            sender_id: user.id,
            conversation_id: conversationId,
            message_text: customMessage.trim(),
          })
          .select(`
            id,
            sender_id,
            conversation_id,
            message_text,
            timestamp
          `)
          .single();

        if (messageError) throw messageError;

        setSuccessMessage("Conversation started successfully!");
        
        // Fetch updated conversations (mirroring vendor's fetchConversations)
        // Note: You'll need to import/use your fetchConversations logic or call a refresh prop
        // For now, just trigger onConversationCreated with the new ID
        onConversationCreated({ id: conversationId, other_participant: selectedVendor });

        // Auto-close after success
        setTimeout(() => {
          onClose();
          resetModal();
        }, 1500);

      } catch (error) {
        console.error("Error starting conversation:", error);
        setError(error instanceof Error ? error.message : "Failed to start conversation");
      } finally {
        setIsSending(false);
      }
    }, 1000),  // Debounce like vendor code
    [user, selectedVendor, customMessage, onConversationCreated, onClose]
  );

  const handleStartNewConversation = () => {
    debouncedStartNewConversation();
  };

  const resetModal = () => {
    setSelectedVendor(null);
    setCustomMessage('');
    setSelectedTemplate('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen]);

  if (!isOpen || !isClient) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-visible"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-white rounded-lg shadow-xl"
        style={{ zIndex: 51 }}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200" id="modal-title">
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
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error/Success Messages (Vendor-style) */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* Step 1: Select Vendor (Adapted from Vendor's Couple Selection) */}
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {bookedVendors.map((vendor) => {
                  const ServiceIcon = getServiceIcon(vendor.service_type || 'Unknown');
                  const isSelected = selectedVendor?.id === vendor.id;
                  
                  return (
                    <label
                      key={vendor.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedVendor(vendor)}
                        className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                      />
                      <div className="flex items-center space-x-4 ml-3">
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
                          <h5 className="font-semibold text-gray-900">{vendor.name || 'Unknown Vendor'}</h5>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <ServiceIcon className="w-4 h-4" />
                            <span>{vendor.service_type || 'Unknown Service'}</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Message Templates & Custom Message */}
          {selectedVendor && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Choose a Message Template</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {messageTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">{customMessage.length}/500 characters</p>
                  {selectedTemplate && (
                    <button
                      type="button"
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

          {/* Actions (Vendor-style with loading) */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStartNewConversation}
              disabled={!selectedVendor || !customMessage.trim() || isSending}
              loading={isSending}
              icon={Send}
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                'Start Conversation'
              )}
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
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById(portalId) || document.body);
};