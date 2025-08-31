import React, { useState } from 'react';
import { Star, MapPin, Clock, Users, Calendar, Check, Heart, Share2, MessageCircle, Shield, Award, Camera, ArrowLeft, Plus, ChevronRight, Play, Download, Eye } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { mockBundles } from '../lib/mockData';

export const ServiceDetails: React.FC = () => {
  const { bundleId, serviceId } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'packages' | 'reviews'>('overview');
  
  // Find the bundle and service
  const bundle = mockBundles.find(b => b.id === bundleId) || mockBundles[0];
  const service = bundle.services.find(s => s.id === serviceId) || bundle.services[0];

  // Mock additional service data
  const serviceDetails = {
    ...service,
    fullDescription: `Our ${service.name.toLowerCase()} service is designed to capture the essence of your special day with unparalleled artistry and professionalism. We understand that your wedding is one of the most important days of your life, and we're committed to preserving every precious moment with stunning clarity and emotional depth.`,
    features: [
      'Professional equipment and backup systems',
      'Experienced team with 10+ years expertise',
      'High-resolution digital delivery',
      'Online gallery for easy sharing',
      'Quick turnaround time',
      'Unlimited revisions on final selections'
    ],
    portfolio: [
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1024992/pexels-photo-1024992.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    packages: [
      {
        name: 'Essential',
        price: service.price * 0.7,
        duration: service.duration * 0.6,
        features: ['Basic coverage', 'Digital gallery', '50 edited photos', 'Online delivery']
      },
      {
        name: 'Premium',
        price: service.price,
        duration: service.duration,
        features: ['Extended coverage', 'Digital gallery', '150 edited photos', 'Print release', 'USB drive'],
        popular: true
      },
      {
        name: 'Luxury',
        price: service.price * 1.4,
        duration: service.duration * 1.3,
        features: ['Full day coverage', 'Digital gallery', '300+ edited photos', 'Print release', 'USB drive', 'Engagement session', 'Same-day preview']
      }
    ],
    reviews: [
      {
        id: '1',
        name: 'Sarah M.',
        rating: 5,
        date: '2 weeks ago',
        review: 'Absolutely incredible work! The attention to detail and artistic vision exceeded all our expectations. Every photo tells a story.',
        helpful: 15,
        verified: true
      },
      {
        id: '2',
        name: 'Michael R.',
        rating: 5,
        date: '1 month ago',
        review: 'Professional, creative, and so easy to work with. They captured moments we didn\'t even know were happening. Highly recommend!',
        helpful: 12,
        verified: true
      },
      {
        id: '3',
        name: 'Emily K.',
        rating: 4,
        date: '2 months ago',
        review: 'Beautiful photography and great communication throughout the process. The final gallery was delivered ahead of schedule.',
        helpful: 8,
        verified: true
      }
    ]
  };

  const handleBookService = () => {
    navigate('/checkout', { 
      state: { 
        bundle: {
          ...bundle,
          services: [service],
          price: service.price,
          name: service.name
        },
        selectedServices: [service.id],
        totalPrice: service.price 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button 
            onClick={() => navigate('/')}
            className="hover:text-rose-600 transition-colors"
          >
            Home
          </button>
          <ChevronRight className="w-4 h-4" />
          <button 
            onClick={() => navigate('/search')}
            className="hover:text-rose-600 transition-colors"
          >
            Services
          </button>
          <ChevronRight className="w-4 h-4" />
          <button 
            onClick={() => navigate(`/bundle/${bundle.id}`)}
            className="hover:text-rose-600 transition-colors"
          >
            {bundle.name}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{service.name}</span>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            icon={ArrowLeft} 
            onClick={() => navigate(`/bundle/${bundle.id}`)}
          >
            Back to Package
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Service Header */}
            <Card className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-800 capitalize">
                      {service.category}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                    {service.included && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <Check className="w-3 h-3 mr-1" />
                        Included in Package
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{service.name}</h1>
                  <div className="flex items-center space-x-6 text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium text-lg">{bundle.rating}</span>
                      <span className="ml-1">({bundle.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-1" />
                      <span>{service.duration} hours</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-1" />
                      <span>{bundle.location}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed">{service.description}</p>
                </div>
                <div className="text-right ml-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    ${service.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Starting price</div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="ghost" icon={Heart} size="sm">
                    </Button>
                    <Button variant="ghost" icon={Share2} size="sm">
                    </Button>
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={bundle.vendor.avatar}
                  alt={bundle.vendor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{bundle.vendor.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{bundle.vendor.rating} rating</span>
                    <span className="mx-2">•</span>
                    <span>{bundle.vendor.experience} years experience</span>
                  </div>
                  <p className="text-sm text-gray-600">{bundle.vendor.bio}</p>
                </div>
                <Button variant="outline" icon={MessageCircle}>
                  Message Vendor
                </Button>
              </div>
            </Card>

            {/* Tabs */}
            <Card className="overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'portfolio', label: 'Portfolio' },
                    { key: 'packages', label: 'Packages' },
                    { key: 'reviews', label: 'Reviews' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.key
                          ? 'border-rose-500 text-rose-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4">About This Service</h3>
                      <p className="text-gray-600 text-lg leading-relaxed mb-6">{serviceDetails.fullDescription}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h4>
                          <div className="space-y-3">
                            {serviceDetails.features.map((feature, index) => (
                              <div key={index} className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 text-green-600" />
                                </div>
                                <span className="text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium">{service.duration} hours</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span className="font-medium capitalize">{service.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Delivery:</span>
                              <span className="font-medium">2-3 weeks</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Travel:</span>
                              <span className="font-medium">50 mile radius included</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Booking:</span>
                              <span className="font-medium">Available year-round</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-6">Why Choose This Service</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award className="w-6 h-6 text-rose-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Award-Winning</h4>
                          <p className="text-sm text-gray-600">Recognized for excellence in the industry</p>
                        </div>
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-6 h-6 text-amber-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Fully Insured</h4>
                          <p className="text-sm text-gray-600">Complete protection for your event</p>
                        </div>
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-6 h-6 text-emerald-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">On-Time Delivery</h4>
                          <p className="text-sm text-gray-600">Guaranteed timely completion</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'portfolio' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold text-gray-900">Portfolio Gallery</h3>
                      <Button variant="outline" icon={Eye}>
                        View Full Gallery
                      </Button>
                    </div>
                    
                    {/* Featured Image */}
                    <div className="relative">
                      <img
                        src={serviceDetails.portfolio[selectedImage]}
                        alt="Portfolio"
                        className="w-full h-96 object-cover rounded-lg"
                      />
                      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                        {selectedImage + 1} / {serviceDetails.portfolio.length}
                      </div>
                      <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                        <Play className="w-6 h-6 text-gray-900 ml-1" />
                      </button>
                    </div>

                    {/* Thumbnail Grid */}
                    <div className="grid grid-cols-6 gap-4">
                      {serviceDetails.portfolio.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Portfolio ${index + 1}`}
                          className={`aspect-square object-cover rounded-lg cursor-pointer transition-all ${
                            selectedImage === index ? 'ring-2 ring-rose-500 scale-105' : 'hover:scale-105'
                          }`}
                          onClick={() => setSelectedImage(index)}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Work</h4>
                        <div className="space-y-4">
                          {[
                            { title: 'Sarah & Michael\'s Garden Wedding', date: 'June 2024', images: 45 },
                            { title: 'Emily & James\' Beach Ceremony', date: 'May 2024', images: 62 },
                            { title: 'Jessica & David\'s Vineyard Celebration', date: 'April 2024', images: 38 }
                          ].map((work, index) => (
                            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                              <img
                                src={serviceDetails.portfolio[index]}
                                alt={work.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{work.title}</h5>
                                <p className="text-sm text-gray-600">{work.date} • {work.images} photos</p>
                              </div>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Style & Approach</h4>
                        <p className="text-gray-600 mb-4">
                          Our photography style blends photojournalistic storytelling with fine art aesthetics. We capture authentic emotions and candid moments while creating stunning portraits that you'll treasure forever.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['Photojournalistic', 'Fine Art', 'Romantic', 'Candid', 'Editorial'].map((style) => (
                            <span key={style} className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm">
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'packages' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Choose Your Package</h3>
                      <p className="text-gray-600 mb-8">Select the perfect package for your needs. All packages can be customized to fit your specific requirements.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {serviceDetails.packages.map((pkg, index) => (
                        <Card key={index} className={`p-6 relative ${pkg.popular ? 'ring-2 ring-rose-500' : ''}`}>
                          {pkg.popular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <span className="bg-rose-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                Most Popular
                              </span>
                            </div>
                          )}
                          
                          <div className="text-center mb-6">
                            <h4 className="text-xl font-semibold text-gray-900 mb-2">{pkg.name}</h4>
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                              ${pkg.price.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">{pkg.duration} hours coverage</div>
                          </div>

                          <div className="space-y-3 mb-8">
                            {pkg.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start space-x-3">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <Button 
                            variant={pkg.popular ? 'primary' : 'outline'} 
                            className="w-full"
                            onClick={() => handleBookService()}
                          >
                            Select {pkg.name}
                          </Button>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Need Something Custom?</h4>
                      <p className="text-blue-800 mb-4">
                        We can create a custom package tailored to your specific needs and budget. Contact us to discuss your requirements.
                      </p>
                      <Button variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-100">
                        Request Custom Quote
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold text-gray-900">Customer Reviews</h3>
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-semibold">{bundle.rating}</span>
                        <span className="text-gray-600">({serviceDetails.reviews.length} reviews for this service)</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {serviceDetails.reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">{review.name[0]}</span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium text-gray-900">{review.name}</h5>
                                  {review.verified && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                      <Check className="w-3 h-3 mr-1" />
                                      Verified
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{review.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3 leading-relaxed">{review.review}</p>
                          <button className="text-sm text-gray-500 hover:text-gray-700">
                            Helpful ({review.helpful})
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="text-center">
                      <Button variant="outline">
                        Load More Reviews
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            {/* Quick Book */}
            <Card className="p-6 sticky top-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Book This Service</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Starting Price</span>
                  <span className="text-2xl font-bold text-gray-900">${service.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{service.duration} hours</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium">$150</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleBookService}
                >
                  Book This Service
                </Button>
                <Button variant="outline" className="w-full">
                  Add to Package
                </Button>
                <Button variant="outline" className="w-full">
                  Request Quote
                </Button>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500">
                Free cancellation up to 30 days before your event
              </div>
            </Card>

            {/* Vendor Quick Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Vendor</h3>
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={bundle.vendor.avatar}
                  alt={bundle.vendor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{bundle.vendor.name}</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{bundle.vendor.rating}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium">{bundle.vendor.experience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response time:</span>
                  <span className="font-medium">Within 2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed events:</span>
                  <span className="font-medium">200+</span>
                </div>
              </div>
              <Button variant="outline" icon={MessageCircle} className="w-full">
                Message Vendor
              </Button>
            </Card>

            {/* Related Services */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Services</h3>
              <div className="space-y-3">
                {bundle.services.filter(s => s.id !== service.id).slice(0, 3).map((relatedService) => (
                  <div key={relatedService.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">{relatedService.name}</h5>
                      <p className="text-xs text-gray-600">${relatedService.price.toLocaleString()}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/bundle/${bundle.id}/service/${relatedService.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};