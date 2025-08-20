import React, { useState } from 'react';
import { ArrowRight, Star, Users, Shield, DollarSign, Clock, Award, CheckCircle, Heart, Camera, Music, Calendar, TrendingUp, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const VendorOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const handleBecomeVendor = () => {
    setShowQuestionnaire(true);
    // Scroll to questionnaire section
    setTimeout(() => {
      const questionnaireSection = document.getElementById('questionnaire-section');
      if (questionnaireSection) {
        questionnaireSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (showQuestionnaire) {
    return (
      <div id="questionnaire-section" className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8 text-center">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-rose-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Vendor Application Questionnaire
            </h2>
            <p className="text-gray-600 mb-8">
              This is where the vendor application form will be implemented.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowQuestionnaire(false)}
              >
                Back to Information
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/vendor-application')}
              >
                Continue to Application
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Join the B. Remembered Family
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Partner with us to grow your wedding business and help couples create unforgettable memories
          </p>
          <Button 
            variant="secondary" 
            size="lg" 
            className="bg-white text-rose-600 hover:bg-gray-50 shadow-xl"
            onClick={handleBecomeVendor}
            icon={ArrowRight}
          >
            Become a Vendor
          </Button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* What is B. Remembered */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What is B. Remembered?
            </h2>
          </div>

          <Card className="p-8 md:p-12 mb-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                B. Remembered is a nationwide wedding services platform connecting couples with trusted, pre-vetted vendors across photography, videography, DJ, and coordination. Our vision is to make wedding planning simple, transparent, and stress-free — while helping vendors grow their businesses with reliable bookings and the support they deserve.
              </p>
              
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                We started in 2020 as a local wedding company, and within two years were serving more than 1,200 weddings annually. Along the way, we listened to couples and vendors who wanted more choice, clarity, and fairness in the industry. That's why B. Remembered has transformed into a platform where:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-rose-50 p-6 rounded-xl border border-rose-200">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">For Couples</h3>
                  <p className="text-gray-700">
                    Couples choose their vendors directly, with real reviews and transparent pricing.
                  </p>
                </div>
                
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">For Vendors</h3>
                  <p className="text-gray-700">
                    Vendors gain access to a steady stream of bookings, automation tools, and full customer support from our team.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-rose-500 mb-2">1,200+</div>
              <div className="text-gray-600">Weddings Annually</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-amber-500 mb-2">500+</div>
              <div className="text-gray-600">Trusted Vendors</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-emerald-500 mb-2">4.9</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-blue-500 mb-2">50+</div>
              <div className="text-gray-600">Cities Served</div>
            </div>
          </div>
        </section>

        {/* What We Expect */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Expect From Our Vendors
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We hold our vendors to high standards because our couples trust us to deliver excellence. To join our platform, you must commit to:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Professionalism</h3>
              <p className="text-gray-600 leading-relaxed">
                Timely communication, reliability, and respect for every client.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality of Service</h3>
              <p className="text-gray-600 leading-relaxed">
                Maintaining at least a 3.5-star rating to remain listed.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Transparency</h3>
              <p className="text-gray-600 leading-relaxed">
                Honest pricing and clear service descriptions.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Partnership</h3>
              <p className="text-gray-600 leading-relaxed">
                Working with our team to ensure couples enjoy a seamless experience.
              </p>
            </Card>
          </div>

          <Card className="p-8 mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Grow Within Our Network
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Vendors who consistently meet these expectations gain more visibility, more opportunities, and the chance to grow within our network.
              </p>
            </div>
          </Card>
        </section>

        {/* Payment Breakdown */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Payment Breakdown
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in fairness and shared success. That's why we operate on a 50/50 payment split:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 text-center bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">50%</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">To You</h3>
              <p className="text-gray-700 leading-relaxed">
                Goes to the vendor directly for providing the service.
              </p>
            </Card>

            <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">50%</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">To B. Remembered</h3>
              <p className="text-gray-700 leading-relaxed">
                For platform access, client acquisition, automation tools, customer support, and ongoing marketing.
              </p>
            </Card>
          </div>

          <Card className="p-8 mt-12 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Shared Success Structure
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                This structure allows us to keep investing in growth, while ensuring you're rewarded for your talent and hard work.
              </p>
            </div>
          </Card>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-rose-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Apply</h3>
              <p className="text-gray-600">
                Fill out the form with your business information and service details.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Review</h3>
              <p className="text-gray-600">
                Our team evaluates your submission within 1–2 hours.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Onboarding</h3>
              <p className="text-gray-600">
                If approved, you'll receive a notification to set up your account and begin receiving leads.
              </p>
            </div>
          </div>
        </section>

        {/* Services We Support */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Services We Support
            </h2>
            <p className="text-xl text-gray-600">
              Join our network of professional wedding vendors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Camera, 
                title: 'Photography', 
                description: 'Wedding photographers capturing precious moments',
                color: 'from-rose-500 to-pink-500'
              },
              { 
                icon: Camera, 
                title: 'Videography', 
                description: 'Cinematic wedding films and highlight reels',
                color: 'from-amber-500 to-orange-500'
              },
              { 
                icon: Music, 
                title: 'DJ Services', 
                description: 'Professional DJs and entertainment services',
                color: 'from-emerald-500 to-teal-500'
              },
              { 
                icon: Calendar, 
                title: 'Coordination', 
                description: 'Wedding planners and day-of coordinators',
                color: 'from-purple-500 to-indigo-500'
              }
            ].map((service, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Vision */}
        <section className="mb-20">
          <Card className="p-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Vision</h2>
            <p className="text-xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              B. Remembered is building the future of wedding planning — one that empowers couples to make confident choices and empowers vendors to thrive. Together, we're creating unforgettable celebrations, backed by technology, transparency, and trust.
            </p>
          </Card>
        </section>

        {/* Benefits for Vendors */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Vendors Choose B. Remembered
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Steady Bookings</h3>
              <p className="text-gray-600">
                Access to a consistent stream of qualified leads and bookings throughout the year.
              </p>
            </Card>

            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Automation Tools</h3>
              <p className="text-gray-600">
                Streamline your workflow with our booking management and communication tools.
              </p>
            </Card>

            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Full Support</h3>
              <p className="text-gray-600">
                Dedicated customer support team to help you and your clients every step of the way.
              </p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <Card className="p-12 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join Our Family?
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Start your journey with B. Remembered today and help couples create the wedding of their dreams while growing your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="bg-white text-rose-600 hover:bg-gray-50 shadow-xl"
                onClick={handleBecomeVendor}
                icon={ArrowRight}
              >
                Become a Vendor
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-rose-600"
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