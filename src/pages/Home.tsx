import React from 'react';
import { Heart, Star, Camera, Video, Music, Users, ArrowRight, Shield, Clock, Award, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SearchBar } from '../components/common/SearchBar';
import { ServiceCard } from '../components/booking/ServiceCard';
import { mockBundles } from '../lib/mockData';
import { useBooking } from '../context/BookingContext';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedServices, setEventType } = useBooking();

  const handleSearch = (filters: any) => {
    console.log('Search filters:', filters);
    
    // Set the booking context with search data
    if (filters.selectedServices && filters.selectedServices.length > 0) {
      setSelectedServices(filters.selectedServices);
    }
    if (filters.eventType) {
      setEventType(filters.eventType);
    }
    
    // Always go to booking flow when services are selected
    if (filters.selectedServices && filters.selectedServices.length > 0) {
      navigate('/booking/questionnaire', { 
        state: { 
          selectedServices: filters.selectedServices,
          eventType: filters.eventType,
        } 
      });
    } else {
      navigate('/search', { state: { filters } });
    }
  };

  const featuredBundles = mockBundles.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your Perfect
              <span className="text-rose-500"> Wedding Dream Team</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Connect with amazing vendors who will make your wedding day absolutely magical ✨
            </p>
          </div>

          {/* Exciting Pre-Search Content */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="p-6 text-center bg-gradient-to-br from-rose-100 to-pink-100 border-rose-200">
                <div className="text-4xl mb-3">💕</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fall in Love</h3>
                <p className="text-gray-600 text-sm">with vendors who truly understand your vision</p>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-amber-100 to-yellow-100 border-amber-200">
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Magic</h3>
                <p className="text-gray-600 text-sm">with award-winning professionals</p>
              </Card>
              <Card className="p-6 text-center bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-200">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Celebrate</h3>
                <p className="text-gray-600 text-sm">knowing every detail is perfectly handled</p>
              </Card>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Ready to find your dream team? 💍
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Tell us what you need and we'll find the perfect vendors who will make your day unforgettable!
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Exciting Call-to-Action */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-3 rounded-full shadow-lg">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Over 500 couples found their perfect team this month!</span>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mt-16">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-rose-600" />
              </div>
              <div className="text-3xl font-bold text-rose-500 mb-2">100%</div>
              <div className="text-gray-600">Verified Vendors</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-rose-500 mb-2">24/7</div>
              <div className="text-gray-600">Support Team</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-rose-500 mb-2">4.9</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything You Need for Your Perfect Day
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From capturing precious moments to coordinating every detail, our curated vendors bring your vision to life.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Camera, 
                title: 'Photography', 
                description: 'Capture every precious moment with artistic flair', 
                color: 'bg-rose-100 text-rose-600',
                features: ['Engagement shoots', 'Wedding day coverage', 'Digital galleries']
              },
              { 
                icon: Video, 
                title: 'Videography', 
                description: 'Cinematic wedding films that tell your story', 
                color: 'bg-amber-100 text-amber-600',
                features: ['Highlight reels', 'Full ceremony', 'Drone footage']
              },
              { 
                icon: Music, 
                title: 'DJ Services', 
                description: 'Keep the celebration alive with perfect music', 
                color: 'bg-emerald-100 text-emerald-600',
                features: ['Sound systems', 'Lighting', 'MC services']
              },
              { 
                icon: Users, 
                title: 'Coordination', 
                description: 'Stress-free planning from start to finish', 
                color: 'bg-purple-100 text-purple-600',
                features: ['Timeline planning', 'Vendor management', 'Day-of coordination']
              }
            ].map((service, index) => (
              <Card key={index} hover className="text-center p-6 group">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="text-sm text-gray-500 mb-6 space-y-1">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/booking/services')}
                >
                  Browse <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Bundles */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Wedding Packages
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Curated bundles from our top-rated vendors, designed to make your special day unforgettable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBundles.map((bundle) => (
              <ServiceCard
                key={bundle.id}
                bundle={bundle}
                onClick={() => navigate(`/bundle/${bundle.id}`)}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/booking/services')}
            >
              View All Packages
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How B. Remembered Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to your perfect wedding day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search & Discover',
                description: 'Browse our curated selection of wedding vendors and packages tailored to your location and style.',
                icon: '🔍'
              },
              {
                step: '02',
                title: 'Compare & Book',
                description: 'Compare packages, read reviews, and book your perfect wedding team with secure payment processing.',
                icon: '💝'
              },
              {
                step: '03',
                title: 'Celebrate & Remember',
                description: 'Work with your vendors to create unforgettable moments that will be remembered for a lifetime.',
                icon: '🎉'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-rose-600">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Love Stories from Real Couples
            </h2>
            <p className="text-xl text-gray-600">
              See what couples are saying about their B. Remembered experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah & Michael',
                location: 'Los Angeles, CA',
                review: 'B. Remembered made our wedding planning so much easier. We found our perfect photographer and DJ in one place, and the booking process was seamless.',
                rating: 5,
                image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400'
              },
              {
                name: 'Emily & James',
                location: 'San Francisco, CA',
                review: 'The quality of vendors on this platform is incredible. Our videographer captured our day perfectly, and the coordination service was flawless.',
                rating: 5,
                image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400'
              },
              {
                name: 'Jessica & David',
                location: 'San Diego, CA',
                review: 'From booking to our wedding day, everything was perfect. The vendors were professional, and the platform made everything so organized.',
                rating: 5,
                image: 'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=400'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.review}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Couples</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">500+</div>
              <div className="text-gray-600">Verified Vendors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">50+</div>
              <div className="text-gray-600">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-rose-500 mb-2">99%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-500 to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Planning Your Dream Wedding?
          </h2>
          <p className="text-xl text-white mb-8 opacity-90">
            Join thousands of couples who found their perfect wedding team through B. Remembered
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white border-white text-rose-600 hover:bg-gray-50 hover:text-rose-700"
              onClick={() => navigate('/booking/services')}
            >
              Browse Services
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-rose-600"
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};