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
          addBotMessage("Hi there! 👋 I'm Ava Luna, your personal wedding assistant! How can I help you today?\n\n• Service packages\n• Customer support\n• Custom recommendations\n• Other");
          setCurrentStep('initial_inquiry');
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
        } else if (lastBotMessage?.message.includes('How can I help you today')) {
          setCurrentStep('initial_inquiry');
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
            addBotMessage("Hi there! 👋 I'm Ava Luna, your personal wedding assistant! How can I help you today?\n\n• Service packages\n• Customer support\n• Custom recommendations\n• Other");
            setCurrentStep('initial_inquiry');
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
    const lowerMessage = userMessage.toLowerCase();
    
    // Process the message based on current step
    switch (currentStep) {
      case 'initial_inquiry':
        // Handle main category selection
        if (lowerMessage.includes('service') || lowerMessage.includes('package')) {
          addBotMessage("Perfect! What type of wedding service are you looking for?\n\n📸 Photography\n🎥 Videography\n🎵 DJ & Music\n👰 Coordination\n📅 Planning\n💝 Multiple Services");
          setCurrentStep('service_selection');
        } else if (lowerMessage.includes('support') || lowerMessage.includes('help')) {
          addBotMessage("I'm here to help! What do you need assistance with?\n\n• Questions about booking\n• Payment or billing issues\n• Vendor communication\n• Technical problems\n• General wedding planning advice\n\nOr just tell me what's on your mind!");
          setCurrentStep('customer_support_flow');
        } else if (lowerMessage.includes('custom') || lowerMessage.includes('recommendation')) {
          addBotMessage("I'd love to give you personalized recommendations! Let me ask a few quick questions to find your perfect match. What's your name?");
          setCurrentStep('greeting');
        } else if (lowerMessage.includes('other')) {
          addBotMessage("I'm here to help with anything wedding-related! What would you like to know about or discuss?");
          setCurrentStep('open_conversation');
        } else {
          // Try to match their input to a category
          if (lowerMessage.includes('photo')) {
            setCurrentStep('service_selection');
            await handleLeadCaptureMessage('Photography');
            return;
          } else if (lowerMessage.includes('video')) {
            setCurrentStep('service_selection');
            await handleLeadCaptureMessage('Videography');
            return;
          } else if (lowerMessage.includes('dj') || lowerMessage.includes('music')) {
            setCurrentStep('service_selection');
            await handleLeadCaptureMessage('DJ Services');
            return;
          } else {
            addBotMessage("I'd love to help! Please choose one of these options:\n\n• Service packages\n• Customer support\n• Custom recommendations\n• Other");
          }
        }
        break;

      case 'service_selection':
        // Handle specific service requests
        if (lowerMessage.includes('photo')) {
          const packages = await fetchPackageRecommendations('Photography', '$1,500-$3,000');
          if (packages.length > 0) {
            addBotMessage("Perfect! I found some amazing photography packages for you:");
            setTimeout(() => showPackageRecommendations(), 1000);
            setCurrentStep('show_recommendations');
          } else {
            addBotMessage("I'd love to help you find the perfect photography package! Let me get some quick details to give you the best recommendations. What's your name?");
            setCurrentStep('greeting');
          }
        } else if (lowerMessage.includes('video')) {
          const packages = await fetchPackageRecommendations('Videography', '$1,500-$3,000');
          if (packages.length > 0) {
            addBotMessage("Excellent choice! Here are some beautiful videography packages:");
            setTimeout(() => showPackageRecommendations(), 1000);
            setCurrentStep('show_recommendations');
          } else {
            addBotMessage("I'd love to help you find the perfect videography package! Let me get some quick details. What's your name?");
            setCurrentStep('greeting');
          }
        } else if (lowerMessage.includes('dj') || lowerMessage.includes('music')) {
          const packages = await fetchPackageRecommendations('DJ Services', '$800-$2,000');
          if (packages.length > 0) {
            addBotMessage("Great! Here are some fantastic DJ and music packages:");
            setTimeout(() => showPackageRecommendations(), 1000);
            setCurrentStep('show_recommendations');
          } else {
            addBotMessage("I'd love to help you find the perfect DJ services! Let me get some details. What's your name?");
            setCurrentStep('greeting');
          }
        } else if (lowerMessage.includes('coordination') || lowerMessage.includes('planning')) {
          const packages = await fetchPackageRecommendations('Coordination', '$600-$1,500');
          if (packages.length > 0) {
            addBotMessage("Perfect! Here are some excellent coordination packages:");
            setTimeout(() => showPackageRecommendations(), 1000);
            setCurrentStep('show_recommendations');
          } else {
            addBotMessage("I'd love to help you find the perfect coordination services! Let me get some details. What's your name?");
            setCurrentStep('greeting');
          }
        } else if (lowerMessage.includes('multiple') || lowerMessage.includes('several')) {
          addBotMessage("Wonderful! Multiple services often work better together and can save you money. To give you the best recommendations, let me ask a few quick questions. What's your name?");
          setCurrentStep('greeting');
        } else {
          addBotMessage("Please choose a specific service:\n\n📸 Photography\n🎥 Videography\n🎵 DJ & Music\n👰 Coordination\n📅 Planning\n💝 Multiple Services");
        }
        break;

      case 'customer_support_flow':
        // Handle customer support inquiries with intelligent responses
        if (lowerMessage.includes('booking') || lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
          addBotMessage("I can help with booking questions! Are you looking to:\n\n• Make a new booking\n• Modify an existing booking\n• Cancel a booking\n• Check booking status\n• Payment issues\n\nWhat specifically do you need help with?");
          setCurrentStep('booking_support');
        } else if (lowerMessage.includes('payment') || lowerMessage.includes('billing') || lowerMessage.includes('charge') || lowerMessage.includes('refund')) {
          addBotMessage("I can help with payment and billing questions! Common issues I can assist with:\n\n• Payment methods and processing\n• Refund requests\n• Billing questions\n• Payment plan options\n• Subscription management\n\nWhat's your specific payment question?");
          setCurrentStep('payment_support');
        } else if (lowerMessage.includes('vendor') || lowerMessage.includes('communicate') || lowerMessage.includes('contact')) {
          addBotMessage("I can help with vendor communication! Here's what I can assist with:\n\n• How to message vendors through the platform\n• Vendor response times\n• Changing vendor assignments\n• Vendor quality concerns\n• Contract questions\n\nWhat do you need help with regarding vendors?");
          setCurrentStep('vendor_support');
        } else if (lowerMessage.includes('technical') || lowerMessage.includes('website') || lowerMessage.includes('app') || lowerMessage.includes('login') || lowerMessage.includes('password')) {
          addBotMessage("I can help with technical issues! Common problems I can solve:\n\n• Login and password issues\n• Website navigation problems\n• Photo/video upload issues\n• Account settings\n• Browser compatibility\n\nWhat technical issue are you experiencing?");
          setCurrentStep('technical_support');
        } else if (lowerMessage.includes('planning') || lowerMessage.includes('timeline') || lowerMessage.includes('advice') || lowerMessage.includes('tips')) {
          addBotMessage("I'd love to help with wedding planning! I can provide guidance on:\n\n• Creating your wedding timeline\n• Budget planning tips\n• Vendor selection advice\n• Wedding day coordination\n• Planning checklists\n\nWhat aspect of planning do you need help with?");
          setCurrentStep('planning_support');
        } else {
          // For complex or unclear requests, escalate to team member
          addBotMessage("Let me get you connected with someone who can help with that specific question. Just a few moments, a team member will be right here to help! 👩‍💼\n\nFeel free to continue chatting - they'll join our conversation shortly.");
          setCurrentStep('team_escalation');
          
          // Save as a support ticket for admin follow-up
          if (supabase && isSupabaseConfigured()) {
            try {
              await supabase
                .from('chat_messages')
                .insert([{
                  session_id: sessionId,
                  sender_type: 'user',
                  message: `ESCALATED SUPPORT REQUEST: ${userMessage}`,
                  ip_address: userIpAddress,
                  metadata: { 
                    type: 'escalated_support',
                    category: 'complex_inquiry',
                    needs_human_response: true
                  }
                }]);
            } catch (error) {
              console.error('Error saving support request:', error);
            }
          }
        }
        break;

      case 'booking_support':
        if (lowerMessage.includes('new') || lowerMessage.includes('make')) {
          addBotMessage("Great! I can help you make a new booking. You can browse our services and packages right here on the website. Would you like me to show you some popular packages or help you find something specific?");
          setCurrentStep('service_selection');
        } else if (lowerMessage.includes('modify') || lowerMessage.includes('change') || lowerMessage.includes('reschedule')) {
          addBotMessage("For modifying existing bookings, you can usually make changes through your account dashboard. However, some changes may require vendor approval. Let me connect you with a team member who can help with your specific modification. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        } else if (lowerMessage.includes('cancel')) {
          addBotMessage("I understand you may need to cancel a booking. Cancellation policies vary by vendor and timing. Let me get a team member to help you with the cancellation process and any applicable refunds. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        } else if (lowerMessage.includes('status') || lowerMessage.includes('check')) {
          addBotMessage("You can check your booking status in your account dashboard under 'My Bookings'. If you're having trouble accessing it or need specific details, I can get a team member to help you. Would you like me to connect you with someone?");
          setCurrentStep('team_escalation_optional');
        } else {
          addBotMessage("Let me connect you with a team member who can help with your specific booking question. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        }
        break;

      case 'payment_support':
        if (lowerMessage.includes('method') || lowerMessage.includes('card') || lowerMessage.includes('process')) {
          addBotMessage("We accept all major credit cards through our secure Stripe payment system. Payments are processed immediately and you'll receive confirmation via email. Is there a specific payment method question I can help with?");
        } else if (lowerMessage.includes('refund')) {
          addBotMessage("Refund policies depend on the vendor and timing of your request. Most vendors offer full refunds for cancellations made 30+ days before your event. Let me connect you with a team member who can review your specific situation. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        } else {
          addBotMessage("For specific billing and payment questions, let me connect you with a team member who can access your account details. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        }
        break;

      case 'vendor_support':
        if (lowerMessage.includes('message') || lowerMessage.includes('contact')) {
          addBotMessage("You can message vendors directly through your booking dashboard! Go to 'My Bookings' and click the 'Message' button next to any vendor. They typically respond within 2-4 hours. Need help finding this feature?");
        } else if (lowerMessage.includes('response') || lowerMessage.includes('reply')) {
          addBotMessage("Vendors typically respond within 2-4 hours during business hours. If it's been longer than 24 hours, let me connect you with a team member who can follow up with them. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        } else {
          addBotMessage("For specific vendor issues, let me connect you with a team member who can help resolve this. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        }
        break;

      case 'technical_support':
        if (lowerMessage.includes('login') || lowerMessage.includes('password')) {
          addBotMessage("For login issues, try:\n\n1. Click 'Forgot Password' on the login page\n2. Check your email for the reset link\n3. Clear your browser cache\n4. Try a different browser\n\nIf these don't work, let me connect you with technical support. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        } else if (lowerMessage.includes('upload') || lowerMessage.includes('photo') || lowerMessage.includes('video')) {
          addBotMessage("For upload issues, please check:\n\n• File size under 10MB\n• Supported formats: JPG, PNG, MP4, MOV\n• Stable internet connection\n• Try refreshing the page\n\nStill having trouble? Let me get technical support to help. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        } else {
          addBotMessage("Let me connect you with our technical support team who can help resolve this issue. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        }
        break;

      case 'planning_support':
        if (lowerMessage.includes('timeline')) {
          addBotMessage("Creating a wedding timeline is so important! Here are some tips:\n\n• Start with your ceremony time and work backwards\n• Allow 30 minutes for photos between events\n• Build in buffer time for delays\n• Share timeline with all vendors\n\nWould you like me to show you our timeline planning tool?", {
            action: 'navigate',
            url: '/profile?tab=timeline'
          });
        } else if (lowerMessage.includes('budget')) {
          addBotMessage("Budget planning tips:\n\n• Allocate 40-50% for venue and catering\n• 10-15% for photography/videography\n• 8-10% for music and entertainment\n• Always add 10% contingency\n\nWould you like specific budget advice for your situation?");
          setCurrentStep('budget_advice');
        } else if (lowerMessage.includes('vendor') || lowerMessage.includes('selection')) {
          addBotMessage("Great question! Here's how to choose the best vendors:\n\n• Read reviews from real couples\n• Check their portfolio and style\n• Verify they're available on your date\n• Meet them in person or video call\n• Trust your instincts!\n\nWould you like me to show you some highly-rated vendors?");
          setCurrentStep('vendor_recommendations');
        } else {
          addBotMessage("I'd love to help with your planning question! Can you be more specific about what aspect of wedding planning you need guidance on?");
        }
        break;

      case 'team_escalation':
        addBotMessage("Thanks for the additional information! I've added that to your support request. A team member will be with you shortly to help resolve this. Feel free to share any other details while we wait! 💬");
        
        // Save additional context
        if (supabase && isSupabaseConfigured()) {
          try {
            await supabase
              .from('chat_messages')
              .insert([{
                session_id: sessionId,
                sender_type: 'user',
                message: `ADDITIONAL CONTEXT: ${userMessage}`,
                ip_address: userIpAddress,
                metadata: { 
                  type: 'escalated_support_context',
                  needs_human_response: true
                }
              }]);
          } catch (error) {
            console.error('Error saving additional context:', error);
          }
        }
        break;

      case 'team_escalation_optional':
        if (lowerMessage.includes('yes') || lowerMessage.includes('connect') || lowerMessage.includes('help')) {
          addBotMessage("Perfect! Let me connect you with a team member who can help. Just a few moments! 👩‍💼");
          setCurrentStep('team_escalation');
        } else {
          addBotMessage("No problem! Is there anything else I can help you with today? I'm here for any other questions about your wedding planning! 💕");
          setCurrentStep('completed');
        }
        break;
        break;

      case 'open_conversation':
        // Handle open-ended conversation
        if (lowerMessage.includes('photo') || lowerMessage.includes('video') || lowerMessage.includes('dj') || lowerMessage.includes('music') || lowerMessage.includes('coordination')) {
          addBotMessage("It sounds like you're interested in wedding services! Would you like me to show you some packages, or would you prefer custom recommendations based on your specific needs?");
          setCurrentStep('service_or_custom');
        } else {
          addBotMessage("Thanks for sharing! I've noted your message. Our team can provide more detailed assistance. Would you like me to connect you with someone, or can I help you find wedding services in the meantime?");
          setCurrentStep('completed');
        }
        break;

      case 'service_or_custom':
        if (lowerMessage.includes('package') || lowerMessage.includes('show')) {
          addBotMessage("Great! What type of service are you most interested in?\n\n📸 Photography\n🎥 Videography\n🎵 DJ & Music\n👰 Coordination\n📅 Planning");
          setCurrentStep('service_selection');
        } else if (lowerMessage.includes('custom') || lowerMessage.includes('recommend')) {
          addBotMessage("Perfect! I'd love to give you personalized recommendations. What's your name?");
          setCurrentStep('greeting');
        } else {
          addBotMessage("Would you like to see our service packages or get custom recommendations based on your specific needs?");
        }
        break;

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
        // Find and show package recommendations immediately
        const serviceType = leadData.services_interested?.[0];
        const budgetRange = leadData.budget_range;
        
        addBotMessage(`Perfect! Thank you ${leadData.name}! 🎉\n\nBased on your preferences, let me find the perfect ${serviceType?.toLowerCase()} packages for you...`);
        
        // Fetch recommendations
        const packages = await fetchPackageRecommendations(serviceType || '', budgetRange || '');
        
        if (packages.length > 0) {
          setTimeout(() => {
            addBotMessage(`Great news! I found some amazing ${serviceType?.toLowerCase()} packages that match your budget and needs:`);
            setTimeout(() => {
              showPackageRecommendations(packages);
              addBotMessage(`These packages are perfect for your ${leadData.wedding_date} wedding! Click any package above to view full details and book directly. 💕\n\nNeed help choosing? I'm here to answer any questions!`);
            }, 1000);
          }, 1000);
          setCurrentStep('show_recommendations');
        } else {
          setTimeout(() => {
            addBotMessage(`I'm having trouble finding packages in your exact budget range, but our team will email you personalized recommendations within 24 hours. In the meantime, you can browse all our ${serviceType?.toLowerCase()} packages on our website! 💕`);
          }, 1000);
          setCurrentStep('completed');
        }
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
        if (lowerMessage.includes('help') || lowerMessage.includes('question')) {
          addBotMessage("I'm happy to help! What do you need assistance with?");
          setCurrentStep('customer_support_flow');
        } else {
          addBotMessage("Thanks for your message! Our team will be in touch soon with more personalized recommendations. Feel free to browse our website for more inspiration! 💝");
        }
        break;

      default:
        addBotMessage("I'm here to help you plan your perfect wedding! Let me know what you need assistance with.");
    }
  };

  const showPackageRecommendations = (packages?: any[]) => {
    const packagesToShow = packages || recommendedPackages;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: '',
      isBot: true,
      timestamp: new Date(),
      packages: packagesToShow.slice(0, 3)
    }]);
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
    initial_inquiry: [
      'Service packages',
      'Customer support',
      'Custom recommendations',
      'Other'
    ],
    service_selection: [
      'Photography',
      'Videography',
      'DJ & Music',
      'Coordination',
      'Planning',
      'Multiple Services'
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

                    {/* Package recommendations display */}
                    {message.packages && message.packages.length > 0 && (
                      <div className="space-y-3 mt-3">
                        {message.packages.map((pkg: any) => (
                          <div key={pkg.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-3">
                              <img
                                src={pkg.primary_image || getServicePhoto(pkg.service_type, pkg)}
                                alt={pkg.name}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm mb-1">{pkg.name}</h4>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{pkg.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="text-lg font-bold text-rose-600">
                                    {formatPrice(pkg.price)}
                                  </div>
                                  <button 
                                    onClick={() => {
                                      window.open(`/package/${pkg.id}`, '_blank');
                                    }}
                                    className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs hover:bg-rose-600 transition-colors"
                                  >
                                    View Package
                                  </button>
                                </div>
                                {pkg.features && pkg.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {pkg.features.slice(0, 2).map((feature: string, index: number) => (
                                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                        {feature}
                                      </span>
                                    ))}
                                    {pkg.features.length > 2 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                        +{pkg.features.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="text-center mt-3">
                          <button 
                            onClick={() => {
                              window.open('/search', '_blank');
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700 underline"
                          >
                            View all {leadData.services_interested?.[0]?.toLowerCase() || 'wedding'} packages →
                          </button>
                        </div>
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

            {currentStep === 'initial_inquiry' && quickReplies.initial_inquiry && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">What are you looking for?</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.initial_inquiry.map((reply) => (
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

            {currentStep === 'service_selection' && quickReplies.service_selection && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">What service are you looking for?</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.service_selection.map((reply) => (
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