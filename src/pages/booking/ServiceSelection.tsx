import React, { useState } from 'react';
import { Camera, Video, Music, Users, Calendar, Package, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useBooking } from '../../context/BookingContext';

export const ServiceSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedServices } = useBooking();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMultiServices, setSelectedMultiServices] = useState<string[]>([]);

  const serviceCategories = [
    {
      id: 'Photography',
      name: 'Photography',
      description: 'Capture every precious moment with professional wedding photography',
      icon: Camera,
      color: 'from-rose-500 to-pink-500',
      features: ['Engagement shoots', 'Wedding day coverage', 'Digital galleries', 'Print packages']
    },
    {
      id: 'Videography',
      name: 'Videography',
      description: 'Cinematic wedding films that tell your unique love story',
      icon: Video,
      color: 'from-amber-500 to-orange-500',
      features: ['Highlight reels', 'Full ceremony', 'Drone footage', 'Same-day edits']
    },
    {
      id: 'DJ Services',
      name: 'DJ Services',
      description: 'Professional DJs and entertainment to keep your celebration alive',
      icon: Music,
      color: 'from-emerald-500 to-teal-500',
      features: ['Sound systems', 'Lighting', 'MC services', 'Custom playlists']
    },
    {
      id: 'Coordination',
      name: 'Coordination',
      description: 'Expert coordinators to handle every detail of your special day',
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      features: ['Timeline planning', 'Vendor management', 'Day-of coordination', 'Emergency support']
    },
    {
      id: 'Planning',
      name: 'Planning',
      description: 'Full-service wedding planning from engagement to "I do"',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      features: ['Venue selection', 'Vendor sourcing', 'Budget management', 'Design consultation']
    },
    {
      id: 'Package Options',
      name: 'Package Options',
      description: 'Curated bundles combining multiple services for better value',
      icon: Package,
      color: 'from-gray-700 to-gray-900',
      features: ['Cost savings', 'Coordinated teams', 'Simplified planning', 'One-stop booking']
    }
  ];

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId === 'Package Options') {
      setSelectedCategory('Package Options');
    } else {
      setSelectedServices([serviceId]);
      navigate('/booking/packages');
    }
  };

  const handleMultiServiceToggle = (serviceId: string) => {
    setSelectedMultiServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinueWithMultiServices = () => {
    if (selectedMultiServices.length > 0) {
      setSelectedServices(selectedMultiServices);
      navigate('/booking/packages');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Services Do You Need?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the wedding services you're looking for. You can book individual services or create a custom package.
          </p>
        </div>

        {selectedCategory !== 'Package Options' ? (
          /* Individual Service Selection */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceCategories.map((service) => {
              const Icon = service.icon;
              return (
                <Card 
                  key={service.id} 
                  hover 
                  className="overflow-hidden group cursor-pointer"
                  onClick={() => handleServiceSelect(service.id)}
                >
                  <div className={`h-32 bg-gradient-to-br ${service.color} relative overflow-hidden`}>
                    <Icon className="absolute top-4 right-4 w-12 h-12 text-white/30" />
                    <div className="absolute bottom-4 left-4">
                      <Icon className="w-8 h-8 text-white mb-2" />
                      <h3 className="text-xl font-bold text-white">{service.name}</h3>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                    
                    <div className="space-y-2 mb-6">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-3"></div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Button 
                      variant="primary" 
                      className="w-full group-hover:shadow-lg transition-shadow"
                      icon={ArrowRight}
                    >
                      Browse {service.name}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Multi-Service Package Selection */
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Create Your Custom Package
                </h2>
                <p className="text-gray-600 text-lg">
                  Select multiple services to see bundled packages and save money
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {serviceCategories.filter(s => s.id !== 'Package Options').map((service) => {
                  const Icon = service.icon;
                  const isSelected = selectedMultiServices.includes(service.id);
                  
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleMultiServiceToggle(service.id)}
                      className={`
                        relative p-6 rounded-xl border-2 cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {service.features.slice(0, 2).map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <p className="text-gray-600 mb-2">
                    {selectedMultiServices.length === 0 
                      ? 'Select at least 2 services to see package options'
                      : `${selectedMultiServices.length} service${selectedMultiServices.length !== 1 ? 's' : ''} selected`
                    }
                  </p>
                  {selectedMultiServices.length >= 2 && (
                    <p className="text-green-600 font-medium">
                      💰 Save up to 25% with bundled packages!
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCategory('')}
                  >
                    Back to Individual Services
                  </Button>
                  <Button
                    variant="primary"
                    disabled={selectedMultiServices.length < 2}
                    onClick={handleContinueWithMultiServices}
                    icon={ArrowRight}
                  >
                    View Package Options
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mt-16">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-500 mb-2">500+</div>
            <div className="text-gray-600">Verified Vendors</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-rose-500 mb-2">25%</div>
            <div className="text-gray-600">Average Savings</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-rose-500 mb-2">10,000+</div>
            <div className="text-gray-600">Happy Couples</div>
          </div>
        </div>
      </div>
    </div>
  );
};