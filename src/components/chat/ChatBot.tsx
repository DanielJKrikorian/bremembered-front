import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Mail, Phone, Calendar, Heart, Check, Bot, Star, Camera, Video, Music, Users as UsersIcon, Package, ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';

interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'admin';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface ChatLead {
  id?: string;
  session_id: string;
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

interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  price: number;
  description?: string;
  hour_amount?: number;
  features?: string[];
}

export const ChatBot: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { couple } = useCouple();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState('greeting');
  const [chatMode, setChatMode] = useState<'lead_capture' | 'customer_support' | 'recommendations'>('lead_capture');
  const [leadData, setLeadData] = useState<ChatLead>({
    session_id: '',
    ip_address: '',
    status: 'active'
  });
  const [isTyping, setIsTyping] = useState(false);
  const [userIpAddress, setUserIpAddress] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [recommendedPackages, setRecommendedPackages] = useState<ServicePackage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate session ID
  const generateSessionId = () => {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get user's IP address and initialize session
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data.ip || `session_${Date.now()}`;
        const newSessionId = generateSessionId();
        
        setUserIpAddress(ip);
        setSessionId(newSessionId);
        setLeadData(prev => ({ 
          ...prev, 
          ip_address: ip,
          session_id: newSessionId
        }));
      } catch (error) {
        console.error('Error getting IP address:', error);
        const fallbackId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newSessionId = generateSessionId();
        
        setUserIpAddress(fallbackId);
        setSessionId(newSessionId);
        setLeadData(prev => ({ 
          ...prev, 
          ip_address: fallbackId,
          session_id: newSessionId
        }));
      }
    };

    initializeChat();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing messages when chat opens
  useEffect(() => {
    if (isOpen && sessionId && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen, sessionId]);

  // Determine chat mode based on user authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      setChatMode('customer_support');
    } else {
      setChatMode('lead_capture');
    }
  }, [isAuthenticated, user]);

  const loadChatHistory = async () => {
    if (!supabase || !isSupabaseConfigured() || !sessionId) {
      // Start conversation based on user type
      setTimeout(() => {
        if (isAuthenticated && user) {
          addBotMessage(`Hi ${user.user_metadata?.name || couple?.name || 'there'}! 👋 I'm Ava Luna, your personal wedding assistant. How can I help you today?`);
          setCurrentStep('customer_support');
        } else {
          addBotMessage("Hi there! 👋 I'm Ava Luna, your personal wedding assistant! What's your name?");
          setCurrentStep('greeting');
        }
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Load existing conversation
        const chatMessages = data.map(msg => ({
          id: msg.id,
          type: msg.sender_type as 'bot' | 'user' | 'admin',
          content: msg.message,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata
        }));
        setMessages(chatMessages);
        
        // Determine current step based on last message
        const lastBotMessage = data.filter(msg => msg.sender_type === 'bot').pop();
        if (isAuthenticated) {
          setCurrentStep('customer_support');
        } else if (lastBotMessage?.message.includes('phone number')) {
          setCurrentStep('phone');
        } else if (lastBotMessage?.message.includes('wedding date')) {
          setCurrentStep('wedding_date');
        } else if (lastBotMessage?.message.includes('budget')) {
          setCurrentStep('budget');
        } else if (lastBotMessage?.message.includes('services')) {
          setCurrentStep('services');
        } else if (lastBotMessage?.message.includes('email')) {
          setCurrentStep('email');
        } else {
          setCurrentStep('greeting');
        }
      } else {
        // Start fresh conversation
        setTimeout(() => {
          if (isAuthenticated && user) {
            addBotMessage(`Hi ${user.user_metadata?.name || couple?.name || 'there'}! 👋 I'm Ava Luna, your personal wedding assistant. How can I help you today?`);
            setCurrentStep('customer_support');
          } else {
            addBotMessage("Hi there! 👋 I'm Ava Luna, your personal wedding assistant! What's your name?");
            setCurrentStep('greeting');
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Start fresh conversation on error
      setTimeout(() => {
        if (isAuthenticated && user) {
          addBotMessage(`Hi ${user.user_metadata?.name || couple?.name || 'there'}! 👋 I'm Ava Luna, your personal wedding assistant. How can I help you today?`);
          setCurrentStep('customer_support');
        } else {
          addBotMessage("Hi there! 👋 I'm Ava Luna, your personal wedding assistant! What's your name?");
          setCurrentStep('greeting');
        }
      }, 500);
    }
  };

  const saveMessageToDatabase = async (message: string, senderType: 'user' | 'bot' | 'admin', metadata?: any) => {
    if (!supabase || !isSupabaseConfigured() || !sessionId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: sessionId,
          sender_type: senderType,
          message: message,
          lead_id: leadData.id || null,
          ip_address: userIpAddress,
          metadata: metadata || {}
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const addBotMessage = (content: string, metadata?: any) => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage = {
        id: Date.now().toString(),
        type: 'bot' as const,
        content,
        timestamp: new Date(),
        metadata
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      
      // Save to database
      saveMessageToDatabase(content, 'bot', metadata);
    }, 1000);
  };

  const addUserMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Save to database
    saveMessageToDatabase(content, 'user');
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
        setLeadData(prev => ({ ...prev, id: existingLead.id }));
      } else {
        // Create new lead
        const { data, error } = await supabase
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
          }])
          .select('id')
          .single();

        if (error) throw error;
        setLeadData(prev => ({ ...prev, id: data.id }));
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const fetchPackageRecommendations = async (serviceType: string, budget: string) => {
    if (!supabase || !isSupabaseConfigured()) {
      // Mock recommendations for demo
      const mockPackages = [
        {
          id: 'mock-1',
          name: 'Premium Wedding Photography',
          service_type: 'Photography',
          price: 250000,
          description: 'Complete wedding day photography with 8 hours of coverage',
          hour_amount: 8,
          features: ['8 hours coverage', '500+ edited photos', 'Online gallery', 'Print release']
        }
      ];
      setRecommendedPackages(mockPackages);
      return mockPackages;
    }

    try {
      // Parse budget range
      let minPrice = 0;
      let maxPrice = 1000000;
      
      if (budget.includes('-')) {
        const [min, max] = budget.split('-').map(p => parseInt(p.replace(/[^0-9]/g, '')) * 100);
        minPrice = min || 0;
        maxPrice = max || 1000000;
      } else if (budget.toLowerCase().includes('under')) {
        maxPrice = parseInt(budget.replace(/[^0-9]/g, '')) * 100;
      } else if (budget.includes('+')) {
        minPrice = parseInt(budget.replace(/[^0-9]/g, '')) * 100;
      }

      const { data, error } = await supabase
        .from('service_packages')
        .select('id, name, service_type, price, description, hour_amount, features')
        .eq('service_type', serviceType)
        .eq('status', 'approved')
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .order('price', { ascending: true })
        .limit(3);

      if (error) throw error;
      
      setRecommendedPackages(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return;

    const userMessage = currentInput.trim();
    addUserMessage(userMessage);
    setCurrentInput('');

    // Handle different chat modes
    if (chatMode === 'customer_support') {
      await handleCustomerSupportMessage(userMessage);
    } else {
      await handleLeadCaptureMessage(userMessage);
    }
  };

  const handleCustomerSupportMessage = async (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for specific intents
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('package')) {
      setCurrentStep('recommendations');
      addBotMessage("I'd love to help you find the perfect wedding services! What type of service are you looking for? (Photography, Videography, DJ, Coordination, etc.)");
    } else if (lowerMessage.includes('booking') || lowerMessage.includes('my booking')) {
      addBotMessage("I can help you with your bookings! You can view and manage all your bookings by going to your profile. Would you like me to take you there?", {
        action: 'navigate',
        url: '/my-bookings'
      });
    } else if (lowerMessage.includes('gallery') || lowerMessage.includes('photos') || lowerMessage.includes('videos')) {
      addBotMessage("Your wedding gallery is available in your profile! You can view, download, and share all your photos and videos there. Would you like me to take you to your gallery?", {
        action: 'navigate',
        url: '/profile?tab=gallery'
      });
    } else if (lowerMessage.includes('timeline') || lowerMessage.includes('schedule')) {
      addBotMessage("You can create and manage your wedding timeline in your profile! It's a great way to organize your special day. Would you like me to show you?", {
        action: 'navigate',
        url: '/profile?tab=timeline'
      });
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      addBotMessage("I'm here to help! You can also visit our comprehensive support center for detailed guides and FAQs. Would you like me to take you there?", {
        action: 'navigate',
        url: '/support'
      });
    } else if (lowerMessage.includes('vendor') || lowerMessage.includes('contact')) {
      addBotMessage("You can message your vendors directly through your bookings page, or I can help you find new vendors. What would you like to do?");
    } else {
      // General customer support
      addBotMessage("Thanks for reaching out! I've noted your message and our support team will get back to you soon. In the meantime, I can help you with:\n\n• Finding new wedding services\n• Managing your bookings\n• Accessing your wedding gallery\n• Planning your timeline\n\nWhat would you like help with?");
      
      // Save as a support ticket
      if (supabase && isSupabaseConfigured() && user) {
        try {
          await supabase
            .from('chat_messages')
            .insert([{
              session_id: sessionId,
              sender_type: 'user',
              message: `SUPPORT REQUEST: ${userMessage}`,
              ip_address: userIpAddress,
              metadata: { 
                type: 'support_request',
                user_id: user.id,
                couple_id: couple?.id 
              }
            }]);
        } catch (error) {
          console.error('Error saving support request:', error);
        }
      }
    }
  };

  const handleLeadCaptureMessage = async (userMessage: string) => {
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
        
        // Fetch recommendations based on service and budget
        const serviceType = leadData.services_interested?.[0];
        if (serviceType) {
          const packages = await fetchPackageRecommendations(serviceType, userMessage);
          if (packages.length > 0) {
            setTimeout(() => {
              addBotMessage("I found some great packages that match your preferences! I'll show them to you after we finish collecting your info. 🎉");
            }, 2000);
          }
        }
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
        setCurrentStep('show_recommendations');
        addBotMessage("Perfect! 🎉 Let me show you some packages that match your preferences:");
        
        // Show recommendations
        setTimeout(() => {
          showPackageRecommendations();
        }, 1500);
        break;

      case 'recommendations':
        // Handle service type for recommendations
        const packages = await fetchPackageRecommendations(userMessage, leadData.budget_range || '$1,000-$3,000');
        if (packages.length > 0) {
          addBotMessage(`Great! I found ${packages.length} ${userMessage.toLowerCase()} packages that might be perfect for you:`);
          setTimeout(() => {
            showPackageRecommendations();
          }, 1000);
        } else {
          addBotMessage("I don't have any packages available for that service right now, but our team can help you find custom options! They'll reach out soon.");
        }
        break;

      case 'completed':
      case 'show_recommendations':
        addBotMessage("Thanks for your message! Our team will be in touch soon with more personalized recommendations. Feel free to browse our website for more inspiration! 💝");
        break;

      default:
        addBotMessage("I'm here to help you plan your perfect wedding! Let me know what you need assistance with.");
    }
  };

  const showPackageRecommendations = () => {
    if (recommendedPackages.length === 0) {
      addBotMessage("Our team will reach out with personalized recommendations based on your preferences! In the meantime, feel free to browse our services.");
      return;
    }

    recommendedPackages.forEach((pkg, index) => {
      setTimeout(() => {
        const packageMessage = `📦 **${pkg.name}**\n💰 ${formatPrice(pkg.price)}\n⏰ ${pkg.hour_amount ? `${pkg.hour_amount} hours` : 'Custom duration'}\n\n${pkg.description}`;
        
        addBotMessage(packageMessage, {
          type: 'package_recommendation',
          package_id: pkg.id,
          package_name: pkg.name,
          package_price: pkg.price
        });
      }, index * 1500);
    });

    setTimeout(() => {
      addBotMessage("Would you like to view any of these packages in detail? I can also help you find more options! 🌟", {
        type: 'recommendation_followup'
      });
    }, recommendedPackages.length * 1500 + 1000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickReplies = {
    customer_support: [
      'Find new services',
      'View my bookings', 
      'Access my gallery',
      'Plan my timeline',
      'Contact support'
    ],
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

  const handleNavigationAction = (url: string) => {
    navigate(url);
    setIsOpen(false);
  };

  const handlePackageView = (packageId: string) => {
    navigate(`/package/${packageId}`);
    setIsOpen(false);
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
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Ava Luna"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold">Ava Luna</h3>
                <p className="text-xs text-rose-100">Wedding Assistant • Online</p>
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
                <div className="flex items-end space-x-2 max-w-[80%]">
                  {message.type === 'bot' && (
                    <img
                      src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400"
                      alt="Ava Luna"
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div
                    className={`p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-rose-500 text-white rounded-br-sm'
                        : message.type === 'admin'
                        ? 'bg-blue-500 text-white rounded-bl-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    
                    {/* Action buttons for navigation */}
                    {message.metadata?.action === 'navigate' && (
                      <button
                        onClick={() => handleNavigationAction(message.metadata.url)}
                        className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs transition-colors"
                      >
                        Take me there →
                      </button>
                    )}
                    
                    {/* Package recommendation buttons */}
                    {message.metadata?.type === 'package_recommendation' && (
                      <div className="mt-2 space-y-2">
                        <button
                          onClick={() => handlePackageView(message.metadata.package_id)}
                          className="block w-full px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span>View Package Details</span>
                            <Eye className="w-3 h-3" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-2">
                  <img
                    src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400"
                    alt="Ava Luna"
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-2xl rounded-bl-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies */}
            {chatMode === 'customer_support' && currentStep === 'customer_support' && quickReplies.customer_support && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Quick options:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.customer_support.map((reply) => (
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
          {currentStep !== 'completed' && currentStep !== 'show_recommendations' && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    chatMode === 'customer_support' 
                      ? "Ask me anything about your wedding..." 
                      : "Type your message..."
                  }
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
          {(currentStep === 'completed' || currentStep === 'show_recommendations') && (
            <div className="p-4 border-t border-gray-200 bg-green-50">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-green-800 font-medium">
                  {chatMode === 'customer_support' 
                    ? "I'm here whenever you need help!"
                    : "Thanks for chatting! We'll be in touch soon."
                  }
                </p>
                {chatMode === 'lead_capture' && (
                  <button
                    onClick={() => navigate('/search')}
                    className="mt-2 text-xs text-green-700 hover:text-green-800 underline"
                  >
                    Browse services while you wait →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};