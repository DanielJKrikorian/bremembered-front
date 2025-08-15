import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Mail, Phone, Calendar, Heart, Check, Bot } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface ChatLead {
  id?: string;
  ip_address: string;
  name?: string;
  email?: string;
  phone?: string;
  wedding_date?: string;
  services_interested?: string[];
  budget_range?: string;
  message?: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at?: string;
  updated_at?: string;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState('greeting');
  const [leadData, setLeadData] = useState<ChatLead>({
    ip_address: '',
    status: 'active'
  });
  const [isTyping, setIsTyping] = useState(false);
  const [userIpAddress, setUserIpAddress] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user's IP address
  useEffect(() => {
    const getIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data.ip || `session_${Date.now()}`;
        setUserIpAddress(ip);
        setLeadData(prev => ({ ...prev, ip_address: ip }));
      } catch (error) {
        console.error('Error getting IP address:', error);
        const fallbackId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setUserIpAddress(fallbackId);
        setLeadData(prev => ({ ...prev, ip_address: fallbackId }));
      }
    };

    getIpAddress();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addBotMessage("Hi there! 👋 I'm here to help you plan your perfect wedding! What's your name?");
      }, 500);
    }
  }, [isOpen]);

  const addBotMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1000);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  const saveLead = async (updates: Partial<ChatLead>) => {
    const updatedLead = { ...leadData, ...updates, updated_at: new Date().toISOString() };
    setLeadData(updatedLead);

    if (!supabase || !isSupabaseConfigured()) {
      console.log('Lead data (demo mode):', updatedLead);
      return;
    }

    try {
      // Check if lead already exists
      const { data: existingLead, error: fetchError } = await supabase
        .from('leads')
        .select('id')
        .eq('email', updatedLead.email || '')
        .maybeSingle();

      if (existingLead) {
        // Update existing lead
        const { error } = await supabase
          .from('leads')
          .update({
            name: updatedLead.name,
            phone: updatedLead.phone,
            wedding_date: updatedLead.wedding_date,
            services_requested: updatedLead.services_interested,
            budget_range: updatedLead.budget_range,
            form_notes: updatedLead.message,
            lead_source: 'Chatbot',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLead.id);

        if (error) throw error;
      } else {
        // Create new lead
        const { error } = await supabase
          .from('leads')
          .insert([{
            name: updatedLead.name || 'Chat User',
            email: updatedLead.email || '',
            phone: updatedLead.phone,
            wedding_date: updatedLead.wedding_date,
            services_requested: updatedLead.services_interested,
            budget_range: updatedLead.budget_range,
            form_notes: updatedLead.message,
            lead_source: 'Chatbot',
            source: userIpAddress,
            status: 'Pending'
          }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;

    const userMessage = currentInput.trim();
    addUserMessage(userMessage);
    setCurrentInput('');

    // Process the message based on current step
    switch (currentStep) {
      case 'greeting':
        await saveLead({ name: userMessage });
        setCurrentStep('email');
        addBotMessage(`Nice to meet you, ${userMessage}! 💕 What's your email address so I can send you personalized recommendations?`);
        break;

      case 'email':
        if (userMessage.includes('@')) {
          await saveLead({ email: userMessage });
          setCurrentStep('services');
          addBotMessage("Perfect! What wedding services are you looking for? (Photography, Videography, DJ, Coordination, Planning, or something else?)");
        } else {
          addBotMessage("That doesn't look like a valid email address. Could you please provide your email? 📧");
        }
        break;

      case 'services':
        await saveLead({ services_interested: [userMessage] });
        setCurrentStep('budget');
        addBotMessage("Great choice! What's your budget range for this service? (e.g., $1,000-$3,000, Under $1,500, etc.)");
        break;

      case 'budget':
        await saveLead({ budget_range: userMessage });
        setCurrentStep('wedding_date');
        addBotMessage("Thanks! When is your wedding date? (You can say 'not sure yet' if you haven't decided) 📅");
        break;

      case 'wedding_date':
        await saveLead({ wedding_date: userMessage !== 'not sure yet' ? userMessage : undefined });
        setCurrentStep('phone');
        addBotMessage("Almost done! What's your phone number so our team can reach out with personalized recommendations? 📞");
        break;

      case 'phone':
        await saveLead({ 
          phone: userMessage,
          status: 'completed',
          message: `Chat conversation completed. Services: ${leadData.services_interested?.join(', ')}, Budget: ${leadData.budget_range}, Wedding Date: ${leadData.wedding_date || 'TBD'}`
        });
        setCurrentStep('completed');
        addBotMessage("Perfect! 🎉 Thank you for chatting with me! Our team will reach out within 24 hours with personalized vendor recommendations. In the meantime, feel free to browse our services!");
        
        // Auto-close after completion
        setTimeout(() => {
          setIsOpen(false);
        }, 5000);
        break;

      case 'completed':
        addBotMessage("Thanks again! Our team will be in touch soon. Feel free to browse our website for more inspiration! 💝");
        break;

      default:
        addBotMessage("I'm here to help you plan your perfect wedding! Let me know what you need assistance with.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickReplies = {
    services: [
      'Photography',
      'Videography', 
      'DJ Services',
      'Coordination',
      'Planning',
      'Multiple Services'
    ],
    budget: [
      'Under $1,000',
      '$1,000 - $2,500',
      '$2,500 - $5,000',
      '$5,000+',
      'Not sure yet'
    ]
  };

  const handleQuickReply = (reply: string) => {
    setCurrentInput(reply);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center group"
        >
          <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Wedding Assistant</h3>
                <p className="text-xs text-rose-100">Here to help plan your perfect day</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies */}
            {currentStep === 'services' && quickReplies.services && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Quick replies:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.services.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs hover:bg-rose-200 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'budget' && quickReplies.budget && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Quick replies:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.budget.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs hover:bg-rose-200 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {currentStep !== 'completed' && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim() || isTyping}
                  className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Completion Message */}
          {currentStep === 'completed' && (
            <div className="p-4 border-t border-gray-200 bg-green-50">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-green-800 font-medium">
                  Thanks for chatting! We'll be in touch soon.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};