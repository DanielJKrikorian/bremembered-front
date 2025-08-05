import React, { useState } from 'react';
import { ArrowRight, Star, Heart, Calendar, Camera, Video, Music, Users, Package, Check, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SearchBar } from '../components/common/SearchBar';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Perfect Wedding
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
                  Starts Here
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Discover and book amazing wedding vendors in one place. From photography to coordination, 
                we'll help you create the perfect day with trusted professionals.
              </p>
              
              <div className="mb-8">
                <SearchBar />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  variant="primary" 
                  size="lg" 
                  icon={ArrowRight}
                  onClick={() => navigate('/booking/services')}
                  className="px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  Start Your Booking Journey
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/how-it-works')}
                  className="px-8 py-4 text-lg"
                >
                  How It Works
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-500 mb-1">500+</div>
                  <div className="text-gray-600 text-sm">Verified Vendors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-500 mb-1">10,000+</div>
                  <div className="text-gray-600 text-sm">Happy Couples</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-500 mb-1">4.9</div>
                  <div className="text-gray-600 text-sm">Average Rating</div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Beautiful wedding couple"
                  className="w-full h-[600px] object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-6 -left-6 bg-white rounded-xl shadow-lg p-4 z-20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <Camera className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Photography</div>
                    <div className="text-sm text-gray-600">Starting at $2,250</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 z-20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Video className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Videography</div>
                    <div className="text-sm text-gray-600">Starting at $1,800</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Wedding Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for your perfect day, all in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Camera,
                title: 'Photography',
                description: 'Capture every precious moment',
                color: 'from-rose-500 to-pink-500'
              },
              {
                icon: Video,
                title: 'Videography',
                description: 'Cinematic wedding films',
                color: 'from-amber-500 to-orange-500'
              },
              {
                icon: Music,
                title: 'DJ Services',
                description: 'Keep the party going',
                color: 'from-emerald-500 to-teal-500'
              },
              {
                icon: Users,
                title: 'Coordination',
                description: 'Stress-free planning',
                color: 'from-purple-500 to-indigo-500'
              }
            ].map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-xl transition-all group cursor-pointer" onClick={() => navigate('/search')}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${service.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your perfect wedding in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Search', description: 'Browse verified vendors', icon: Search },
              { step: '02', title: 'Compare', description: 'Read reviews & compare', icon: Star },
              { step: '03', title: 'Book', description: 'Secure your date', icon: Calendar },
              { step: '04', title: 'Celebrate', description: 'Enjoy your perfect day', icon: Heart }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-rose-600" />
                  </div>
                  <div className="text-sm font-bold text-rose-500 mb-2">{item.step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-500 to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Plan Your Dream Wedding?
          </h2>
          <p className="text-xl text-white mb-8 opacity-90">
            Join thousands of couples who found their perfect wedding team through B. Remembered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white text-rose-600 hover:bg-gray-50"
              onClick={() => navigate('/booking/services')}
            >
              Start Planning Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-rose-600"
              onClick={() => navigate('/how-it-works')}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};