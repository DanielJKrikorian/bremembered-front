import React, { useState } from 'react';
import { ArrowRight, DollarSign, Calendar, Star, Camera, Music, MessageCircle, Clock, MapPin, Users, CheckCircle, Heart, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const VendorOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const handleJoinNow = () => {
    window.location.href = 'https://app.bremembered.io';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Skyrocket Your Wedding Business with B. Remembered
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
            Join our platform for <span className="font-semibold">FREE</span> and access a powerful suite of tools to manage payments, bookings, and couple communications—all backed by 24/7 support. Get 60+ bookings per year and make this your most stress-free wedding season yet!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-indigo-600 shadow-xl"
              onClick={handleJoinNow}
              icon={ArrowRight}
            >
              Join Now for Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-indigo-600"
              onClick={() => navigate('/support')}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Why Join B. Remembered */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Partner with B. Remembered?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your wedding business with our free, all-in-one platform designed to maximize bookings and simplify your workflow.
            </p>
          </div>

          <Card className="p-8 md:p-12 mb-12 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                B. Remembered is your ultimate partner in growing your wedding business. Our platform connects you with thousands of couples planning their dream weddings, offering a <span className="font-semibold">completely free</span> suite of tools to streamline your operations and boost your bookings.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Since 2020, we've powered over 1,200 weddings annually, and now we're inviting you to join our network of 500+ trusted vendors. With our tools, you can achieve 60+ bookings per year, set your own pricing, and enjoy a stress-free wedding season—all supported by our 24/7 expert team.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Maximize Your Bookings</h3>
                  <p className="text-gray-700">
                    Tap into our vast network of couples and secure 60+ bookings per year with targeted leads and high visibility.
                  </p>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Free Tools, Zero Cost</h3>
                  <p className="text-gray-700">
                    Access our full suite of tools—payment automation, booking management, and more—completely free, with no hidden fees.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-indigo-500 mb-2">60+</div>
              <div className="text-gray-600">Bookings Per Year</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-purple-500 mb-2">100%</div>
              <div className="text-gray-600">Free Platform</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-emerald-500 mb-2">4.9</div>
              <div className="text-gray-600">Average Vendor Rating</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-blue-500 mb-2">24/7</div>
              <div className="text-gray-600">Support Availability</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Tools to Grow Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our free suite of tools is designed to save you time, reduce stress, and help you deliver exceptional service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: 'Payment Management & Automation',
                description: 'Secure, automated payment processing and invoicing to streamline your finances.',
              },
              {
                icon: MessageCircle,
                title: 'Direct Messaging with Couples',
                description: 'Communicate seamlessly with couples through our integrated messaging system.',
              },
              {
                icon: Calendar,
                title: 'Booking & Calendar Integration',
                description: 'Manage bookings effortlessly with real-time calendar sync and scheduling.',
              },
              {
                icon: MapPin,
                title: 'Travel Fee Integration',
                description: 'Set and manage travel fees for transparent pricing and higher earnings.',
              },
              {
                icon: Users,
                title: 'Couple Timeline Tools',
                description: 'Collaborate with couples to create and share detailed wedding timelines.',
              },
              {
                icon: Clock,
                title: '24/7 Expert Support',
                description: 'Our team is available around the clock to support you and your clients.',
              },
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Easy Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our platform in minutes and start booking more weddings with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: '1',
                title: 'Sign Up for Free',
                description: 'Create your vendor profile in minutes with our simple onboarding process.',
                color: 'from-indigo-500 to-purple-500',
                icon: CheckCircle,
              },
              {
                number: '2',
                title: 'Set Up Your Profile',
                description: 'Customize your services, set your pricing, and configure our automation tools.',
                color: 'from-purple-500 to-pink-500',
                icon: Zap,
              },
              {
                number: '3',
                title: 'Start Booking',
                description: 'Get discovered by thousands of couples and secure 60+ bookings per year.',
                color: 'from-pink-500 to-amber-500',
                icon: TrendingUp,
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center mx-auto`}
                  >
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <step.icon className="w-5 h-5 text-indigo-500" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services We Support */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Services We Support
            </h2>
            <p className="text-xl text-gray-600">
              Join our network of top wedding professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Camera,
                title: 'Photography',
                description: 'Capture every moment with professional wedding photography.',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                icon: Camera,
                title: 'Videography',
                description: 'Create cinematic wedding films and highlight reels.',
                color: 'from-purple-500 to-pink-500',
              },
              {
                icon: Music,
                title: 'DJ Services',
                description: 'Keep the party alive with professional DJs and entertainment.',
                color: 'from-pink-500 to-amber-500',
              },
              {
                icon: Calendar,
                title: 'Coordination',
                description: 'Ensure flawless execution with expert day-of coordinators.',
                color: 'from-amber-500 to-orange-500',
              },
              {
                icon: Calendar,
                title: 'Planning',
                description: 'Offer full-service wedding planning from start to finish.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Music,
                title: 'Live Musicians',
                description: 'Enchant guests with live music for ceremonies and receptions.',
                color: 'from-emerald-500 to-teal-500',
              },
            ].map((service, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-xl transition-shadow">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-3 rounded-full">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">More services coming soon!</span>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Our Vision */}
        <section className="mb-20">
          <Card className="p-12 bg-gradient-to-br from-indigo-900 to-purple-800 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Vision</h2>
            <p className="text-xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              At B. Remembered, we're revolutionizing wedding planning by empowering vendors with free, cutting-edge tools and connecting them with couples ready to book. Together, we create unforgettable celebrations backed by technology, transparency, and 24/7 support.
            </p>
          </Card>
        </section>

        {/* CTA Section */}
        <section>
          <Card className="p-12 bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Wedding Business?
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Sign up today for free, access our powerful tools, and start booking 60+ weddings per year with ease. Let B. Remembered handle the heavy lifting so you can focus on creating unforgettable moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-indigo-600 shadow-xl"
                onClick={handleJoinNow}
                icon={ArrowRight}
              >
                Join Now for Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-indigo-600"
                onClick={() => navigate('/support')}
              >
                Have Questions?
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};