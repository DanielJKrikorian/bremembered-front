import React, { useState } from 'react';
import { ArrowRight, Star, Heart, Calendar, Camera, Video, Music, Users, Package, Check, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SearchBar } from '../components/common/SearchBar';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-amber-500/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Your Perfect Wedding
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
              Starts Here
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            Discover and book amazing wedding vendors in one place. From photography to coordination, 
            we'll help you create the perfect day with trusted professionals.
          </p>
          
          <div className="max-w-2xl mx-auto mb-12">
            <SearchBar />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-500 mb-2">500+</div>
              <div className="text-gray-600">Verified Vendors</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-rose-500 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Couples</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-rose-500 mb-2">4.9</div>
              <div className="text-gray-600">Average Rating</div>
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