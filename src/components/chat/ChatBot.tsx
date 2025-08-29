import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Search, Calendar, Camera, Music, Users, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
  options?: Array<{
    label: string;
    action: string;
    icon?: any;
  }>;
}

export const ChatBot: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for chat bot open events
  useEffect(() => {
    const handleOpenChatBot = () => {
      setIsOpen(true);
      if (messages.length === 0) {
        addBotMessage(
          "Hi! I'm here to help you plan your perfect wedding. What can I assist you with today?",
          [
            { label: 'Find Wedding Services', action: 'find_services', icon: Search },
            { label: 'Browse Photography', action: 'browse_photography', icon: Camera },
            { label: 'Browse DJ Services', action: 'browse_dj', icon: Music },
            { label: 'Browse Coordination', action: 'browse_coordination', icon: Users },
            { label: 'Get Planning Help', action: 'planning_help', icon: Calendar }
          ]
        );
      }
    };

    window.addEventListener('openChatBot', handleOpenChatBot);
    return () => window.removeEventListener('openChatBot', handleOpenChatBot);
  }, [messages.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const addBotMessage = (message: string, options?: Array<{ label: string; action: string; icon?: any }>) => {
    const botMessage: ChatMessage = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: 'bot',
      message,
      timestamp: new Date(),
      options
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const addUserMessage = (message: string) => {
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: 'user',
      message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const handleOptionClick = (action: string) => {
    switch (action) {
      case 'find_services':
        addUserMessage('I want to find wedding services');
        setTimeout(() => {
          addBotMessage(
            "Perfect! I can help you find the ideal wedding services. What type of services are you looking for?",
            [
              { label: 'Photography', action: 'browse_photography', icon: Camera },
              { label: 'Videography', action: 'browse_videography', icon: Camera },
              { label: 'DJ Services', action: 'browse_dj', icon: Music },
              { label: 'Coordination', action: 'browse_coordination', icon: Users },
              { label: 'All Services', action: 'browse_all', icon: Search }
            ]
          );
        }, 1000);
        break;

      case 'browse_photography':
        addUserMessage('I want to browse photography services');
        setTimeout(() => {
          addBotMessage(
            "Great choice! Photography is one of the most important investments for your wedding day. Let me take you to our photography packages where you can see portfolios, compare prices, and read reviews from real couples.",
            [
              { label: 'View Photography Packages', action: 'navigate_photography', icon: ArrowRight },
              { label: 'Learn About Photography Styles', action: 'photography_styles', icon: Camera },
              { label: 'See Photography Tips', action: 'photography_tips', icon: Search }
            ]
          );
        }, 1000);
        break;

      case 'browse_videography':
        addUserMessage('I want to browse videography services');
        setTimeout(() => {
          addBotMessage(
            "Excellent! Videography captures the emotions and moments of your day in motion. Our videographers create beautiful cinematic films that tell your love story.",
            [
              { label: 'View Videography Packages', action: 'navigate_videography', icon: ArrowRight },
              { label: 'See Sample Wedding Films', action: 'videography_samples', icon: Camera }
            ]
          );
        }, 1000);
        break;

      case 'browse_dj':
        addUserMessage('I want to browse DJ services');
        setTimeout(() => {
          addBotMessage(
            "Perfect! A great DJ keeps your celebration alive and ensures your guests have an amazing time. Our DJs provide professional sound systems, lighting, and entertainment.",
            [
              { label: 'View DJ Packages', action: 'navigate_dj', icon: ArrowRight },
              { label: 'Learn About DJ Services', action: 'dj_info', icon: Music }
            ]
          );
        }, 1000);
        break;

      case 'browse_coordination':
        addUserMessage('I want to browse coordination services');
        setTimeout(() => {
          addBotMessage(
            "Smart choice! Wedding coordinators ensure your day runs smoothly so you can focus on celebrating. They handle all the logistics and timeline management.",
            [
              { label: 'View Coordination Packages', action: 'navigate_coordination', icon: ArrowRight },
              { label: 'Learn About Coordination', action: 'coordination_info', icon: Users }
            ]
          );
        }, 1000);
        break;

      case 'browse_all':
        addUserMessage('I want to see all wedding services');
        setTimeout(() => {
          addBotMessage(
            "Wonderful! I'll take you to our complete catalog where you can browse all wedding services, compare packages, and find your perfect vendors.",
            [
              { label: 'Browse All Services', action: 'navigate_all', icon: ArrowRight }
            ]
          );
        }, 1000);
        break;

      case 'navigate_photography':
        setIsOpen(false);
        navigate('/search', {
          state: {
            filters: {
              serviceTypes: ['Photography']
            }
          }
        });
        break;

      case 'navigate_videography':
        setIsOpen(false);
        navigate('/search', {
          state: {
            filters: {
              serviceTypes: ['Videography']
            }
          }
        });
        break;

      case 'navigate_dj':
        setIsOpen(false);
        navigate('/search', {
          state: {
            filters: {
              serviceTypes: ['DJ Services']
            }
          }
        });
        break;

      case 'navigate_coordination':
        setIsOpen(false);
        navigate('/search', {
          state: {
            filters: {
              serviceTypes: ['Coordination']
            }
          }
        });
        break;

      case 'navigate_all':
        setIsOpen(false);
        navigate('/search');
        break;

      case 'planning_help':
        addUserMessage('I need help with wedding planning');
        setTimeout(() => {
          addBotMessage(
            "I'd love to help you plan your perfect day! Here are some resources and tools to get you started:",
            [
              { label: 'Wedding Timeline Template', action: 'timeline_help', icon: Calendar },
              { label: 'Budget Planning Guide', action: 'budget_help', icon: Search },
              { label: 'Vendor Selection Tips', action: 'vendor_tips', icon: Users },
              { label: 'Browse Inspiration', action: 'browse_inspiration', icon: Search }
            ]
          );
        }, 1000);
        break;

      case 'timeline_help':
        addUserMessage('I need help with my wedding timeline');
        setTimeout(() => {
          addBotMessage(
            "A well-planned timeline is key to a stress-free wedding day! I can help you create a detailed timeline and share it with your vendors.",
            [
              { label: 'Create Wedding Timeline', action: 'navigate_timeline', icon: ArrowRight },
              { label: 'See Timeline Examples', action: 'timeline_examples', icon: Calendar }
            ]
          );
        }, 1000);
        break;

      case 'navigate_timeline':
        setIsOpen(false);
        navigate('/profile?tab=timeline');
        break;

      case 'browse_inspiration':
        setIsOpen(false);
        navigate('/inspiration');
        break;

      case 'photography_styles':
        addUserMessage('Tell me about photography styles');
        setTimeout(() => {
          addBotMessage(
            "There are several beautiful photography styles to choose from:\n\n• **Classic/Traditional** - Timeless posed portraits\n• **Photojournalistic** - Candid, natural moments\n• **Fine Art** - Artistic, creative compositions\n• **Editorial** - Fashion-inspired dramatic shots\n\nEach photographer has their own unique style. Browse our photography packages to see different portfolios!",
            [
              { label: 'View Photography Packages', action: 'navigate_photography', icon: ArrowRight }
            ]
          );
        }, 1500);
        break;

      case 'photography_tips':
        addUserMessage('Give me photography tips');
        setTimeout(() => {
          addBotMessage(
            "Here are some key tips for choosing your wedding photographer:\n\n• **View full galleries**, not just highlight reels\n• **Meet them in person** or via video call\n• **Check their backup plans** for equipment and weather\n• **Understand what's included** in each package\n• **Read recent reviews** from other couples\n\nWould you like to see our photography packages?",
            [
              { label: 'View Photography Packages', action: 'navigate_photography', icon: ArrowRight },
              { label: 'Read Photography Guide', action: 'browse_inspiration', icon: Search }
            ]
          );
        }, 1500);
        break;

      case 'dj_info':
        addUserMessage('Tell me about DJ services');
        setTimeout(() => {
          addBotMessage(
            "Our DJ services include:\n\n• **Professional Sound Systems** - Crystal clear audio for your ceremony and reception\n• **Lighting Packages** - Create the perfect ambiance\n• **MC Services** - Professional announcements and coordination\n• **Custom Playlists** - Music tailored to your taste\n• **Backup Equipment** - We're always prepared\n\nReady to find your perfect DJ?",
            [
              { label: 'View DJ Packages', action: 'navigate_dj', icon: ArrowRight }
            ]
          );
        }, 1500);
        break;

      case 'coordination_info':
        addUserMessage('Tell me about coordination services');
        setTimeout(() => {
          addBotMessage(
            "Wedding coordination services include:\n\n• **Timeline Planning** - Detailed schedule for your day\n• **Vendor Management** - Coordinate with all your vendors\n• **Day-of Coordination** - On-site management during your wedding\n• **Emergency Support** - Handle any unexpected issues\n• **Setup Oversight** - Ensure everything is perfect\n\nLet me show you our coordination packages!",
            [
              { label: 'View Coordination Packages', action: 'navigate_coordination', icon: ArrowRight }
            ]
          );
        }, 1500);
        break;

      case 'budget_help':
        addUserMessage('I need help with budgeting');
        setTimeout(() => {
          addBotMessage(
            "Here's a typical wedding budget breakdown:\n\n• **Photography**: 10-15% of total budget\n• **Videography**: 8-12% of total budget\n• **DJ/Entertainment**: 8-10% of total budget\n• **Coordination**: 5-8% of total budget\n\nOur packages are designed to give you the best value for each service. Would you like to see packages in a specific price range?",
            [
              { label: 'Browse Budget-Friendly Options', action: 'browse_budget', icon: Search },
              { label: 'View All Packages', action: 'navigate_all', icon: ArrowRight }
            ]
          );
        }, 1500);
        break;

      case 'browse_budget':
        setIsOpen(false);
        navigate('/search', {
          state: {
            filters: {
              minPrice: 0,
              maxPrice: 200000 // Under $2000
            }
          }
        });
        break;

      case 'vendor_tips':
        addUserMessage('Give me vendor selection tips');
        setTimeout(() => {
          addBotMessage(
            "Here are key tips for choosing wedding vendors:\n\n• **Read Reviews** - Look for recent, detailed reviews\n• **View Portfolios** - See their actual work, not just highlights\n• **Meet in Person** - Video calls work too!\n• **Check Availability** - Confirm they're free on your date\n• **Understand Contracts** - Know what's included\n• **Ask About Backup Plans** - Equipment, weather, illness\n\nReady to start browsing vendors?",
            [
              { label: 'Browse All Services', action: 'navigate_all', icon: ArrowRight },
              { label: 'Get More Planning Help', action: 'planning_help', icon: Calendar }
            ]
          );
        }, 1500);
        break;

      case 'contact_support':
        setIsOpen(false);
        navigate('/support');
        break;

      default:
        // Handle unknown actions
        addBotMessage(
          "I'm not sure how to help with that specific request, but I can help you with finding wedding services, planning your timeline, or answering questions about our platform.",
          [
            { label: 'Find Wedding Services', action: 'find_services', icon: Search },
            { label: 'Get Planning Help', action: 'planning_help', icon: Calendar }
          ]
        );
        break;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addUserMessage(userMessage);
    setInputMessage('');
    setIsTyping(true);

    // Save message to database if configured
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('chat_messages').insert({
          session_id: sessionId,
          sender_type: 'user',
          message: userMessage,
          ip_address: 'web_app'
        });
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // Simple keyword-based responses
    setTimeout(async () => {
      setIsTyping(false);
      
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('photography') || lowerMessage.includes('photographer') || lowerMessage.includes('photos')) {
        addBotMessage(
          "I can help you find amazing wedding photographers! Our photography packages include engagement shoots, full wedding day coverage, and beautiful digital galleries.",
          [
            { label: 'Browse Photography', action: 'navigate_photography', icon: Camera },
            { label: 'Photography Tips', action: 'photography_tips', icon: Search }
          ]
        );
      } else if (lowerMessage.includes('video') || lowerMessage.includes('film') || lowerMessage.includes('cinemat')) {
        addBotMessage(
          "Videography is a beautiful way to capture your wedding day! Our videographers create cinematic films with highlight reels, full ceremony coverage, and more.",
          [
            { label: 'Browse Videography', action: 'navigate_videography', icon: Camera },
            { label: 'See Video Samples', action: 'videography_samples', icon: ArrowRight }
          ]
        );
      } else if (lowerMessage.includes('dj') || lowerMessage.includes('music') || lowerMessage.includes('entertainment')) {
        addBotMessage(
          "Great choice! Our DJs provide professional sound systems, lighting, MC services, and keep your celebration going all night long.",
          [
            { label: 'Browse DJ Services', action: 'navigate_dj', icon: Music },
            { label: 'Learn About DJ Services', action: 'dj_info', icon: ArrowRight }
          ]
        );
      } else if (lowerMessage.includes('coordinat') || lowerMessage.includes('plann') || lowerMessage.includes('organiz')) {
        addBotMessage(
          "Wedding coordination is essential for a stress-free day! Our coordinators handle timeline management, vendor coordination, and day-of logistics.",
          [
            { label: 'Browse Coordination', action: 'navigate_coordination', icon: Users },
            { label: 'Planning Resources', action: 'planning_help', icon: Calendar }
          ]
        );
      } else if (lowerMessage.includes('service') || lowerMessage.includes('vendor') || lowerMessage.includes('find') || lowerMessage.includes('search')) {
        addBotMessage(
          "I can help you find the perfect wedding services! What type of vendors are you looking for?",
          [
            { label: 'Photography', action: 'browse_photography', icon: Camera },
            { label: 'Videography', action: 'browse_videography', icon: Camera },
            { label: 'DJ Services', action: 'browse_dj', icon: Music },
            { label: 'Coordination', action: 'browse_coordination', icon: Users },
            { label: 'All Services', action: 'browse_all', icon: Search }
          ]
        );
      } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
        addBotMessage(
          "Wedding service pricing varies based on your needs. Here's what you can expect:\n\n• **Photography**: $1,500 - $5,000+\n• **Videography**: $1,000 - $4,000+\n• **DJ Services**: $800 - $2,500+\n• **Coordination**: $600 - $2,000+\n\nWould you like to see packages in a specific price range?",
          [
            { label: 'Browse All Packages', action: 'browse_all', icon: Search },
            { label: 'Budget Planning Tips', action: 'budget_help', icon: Calendar }
          ]
        );
      } else if (lowerMessage.includes('timeline') || lowerMessage.includes('schedule')) {
        addBotMessage(
          "A wedding timeline helps ensure your day runs smoothly! I can help you create a detailed schedule and share it with your vendors.",
          [
            { label: 'Create Timeline', action: 'navigate_timeline', icon: Calendar },
            { label: 'Timeline Examples', action: 'timeline_examples', icon: ArrowRight }
          ]
        );
      } else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('question')) {
        addBotMessage(
          "I'm here to help! Here are some things I can assist you with:",
          [
            { label: 'Find Wedding Services', action: 'find_services', icon: Search },
            { label: 'Planning Resources', action: 'planning_help', icon: Calendar },
            { label: 'Contact Support', action: 'contact_support', icon: ArrowRight }
          ]
        );
      } else {
        // Generic response with helpful options
        addBotMessage(
          "I'd be happy to help you with your wedding planning! Here are some popular things I can assist with:",
          [
            { label: 'Find Wedding Services', action: 'find_services', icon: Search },
            { label: 'Browse Photography', action: 'browse_photography', icon: Camera },
            { label: 'Browse DJ Services', action: 'browse_dj', icon: Music },
            { label: 'Get Planning Help', action: 'planning_help', icon: Calendar }
          ]
        );
      }

      // Save bot response to database if configured
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            sender_type: 'bot',
            message: messages[messages.length - 1]?.message || 'Bot response',
            ip_address: 'web_app'
          });
        } catch (error) {
          console.error('Error saving bot message:', error);
        }
      }
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 hover:scale-110"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Wedding Assistant</h3>
            <p className="text-xs text-white/80">Here to help plan your perfect day</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-xs">
              <div className={`p-3 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                <p className="text-sm whitespace-pre-line">{message.message}</p>
              </div>
              
              {/* Options */}
              {message.options && message.options.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.options.map((option, index) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(option.action)}
                        className="w-full flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        {Icon && <Icon className="w-4 h-4 text-gray-600" />}
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              <div className="mt-1">
                <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about wedding planning..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};