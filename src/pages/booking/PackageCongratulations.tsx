import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Clock, Star, Sparkles, Camera, Video, Music, Users, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useBooking } from '../../context/BookingContext';

export const PackageCongratulations: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useBooking();
  const [showConfetti, setShowConfetti] = useState(true);

  // Get package data from navigation state
  const selectedPackage = location.state?.selectedPackage;
  const selectedServices = location.state?.selectedServices || state.selectedServices || [];
  const currentServiceIndex = location.state?.currentServiceIndex || 0;
  const currentService = selectedServices[currentServiceIndex];
  const nextService = selectedServices[currentServiceIndex + 1];

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return Camera;
      case 'Videography': return Video;
      case 'DJ Services': return Music;
      case 'Coordination': return Users;
      case 'Planning': return Calendar;
      default: return Sparkles;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const handleContinue = () => {
    if (nextService) {
      // Go to next service selection
      navigate('/booking/vendors', {
        state: {
          selectedServices,
          currentServiceIndex: currentServiceIndex + 1,
          currentService: nextService
        }
      });
    } else {
      // All services selected, go to final booking
      navigate('/booking/event-details');
    }
  };

  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No package selected</p>
          <Button variant="primary" onClick={() => navigate('/booking/questionnaire')}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const ServiceIcon = getServiceIcon(currentService);
  const NextServiceIcon = nextService ? getServiceIcon(nextService) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div className={`w-2 h-2 rounded-full ${
                ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-blue-500'][Math.floor(Math.random() * 5)]
              }`}></div>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Congratulations Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🎉 Congratulations!
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
            You chose your wedding package!
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Great choice! You've selected the perfect {currentService.toLowerCase()} package for your special day.
          </p>
        </div>

        {/* Package Summary */}
        <Card className="p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-amber-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ServiceIcon className="w-8 h-8 text-rose-600" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="text-2xl font-bold text-gray-900">{selectedPackage.name}</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Selected
                </span>
              </div>
              
              <p className="text-gray-600 text-lg mb-4">{selectedPackage.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Package Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Type:</span>
                      <span className="font-medium">{selectedPackage.service_type}</span>
                    </div>
                    {selectedPackage.hour_amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coverage:</span>
                        <span className="font-medium">{selectedPackage.hour_amount} hours</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-lg">{formatPrice(selectedPackage.price)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                  <div className="space-y-2">
                    {selectedPackage.features?.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {(selectedPackage.features?.length || 0) > 4 && (
                      <div className="text-sm text-gray-500">
                        +{(selectedPackage.features?.length || 0) - 4} more features
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="text-center">
            {nextService ? (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {NextServiceIcon && <NextServiceIcon className="w-8 h-8 text-blue-600" />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Now it's time to choose your perfect {nextService.toLowerCase()} team!
                </h3>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Let's find the ideal {nextService.toLowerCase()} vendors who can bring your vision to life and work seamlessly with your other wedding professionals.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  onClick={handleContinue}
                  className="px-8"
                >
                  Choose {nextService} Vendors
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Perfect! Now let's finalize your event details
                </h3>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  You've selected all your wedding services. Let's add your event details and find the perfect vendors for each service.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  onClick={() => navigate('/booking/event-details', {
                    state: {
                      selectedPackage,
                      selectedServices,
                      currentServiceIndex
                    }
                  })}
                  className="px-8"
                >
                  Add Event Details
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Progress Indicator */}
        <div className="mt-12">
          <Card className="p-6">
            <h4 className="font-semibold text-gray-900 mb-4 text-center">Your Wedding Planning Progress</h4>
            <div className="flex items-center justify-center space-x-4">
              {selectedServices.map((service, index) => {
                const Icon = getServiceIcon(service);
                const isCompleted = index <= currentServiceIndex;
                const isCurrent = index === currentServiceIndex;
                
                return (
                  <div key={service} className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isCompleted ? 'text-green-600' : isCurrent ? 'text-rose-600' : 'text-gray-500'
                    }`}>
                      {service}
                    </span>
                    {index < selectedServices.length - 1 && (
                      <div className={`w-8 h-1 mx-4 rounded-full ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};