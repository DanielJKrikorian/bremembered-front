import React, { useState } from 'react';
import { Star, MapPin, Clock, Users, Calendar, Check, Plus, Minus, Heart, Share2, MessageCircle, Shield, Award, Camera } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { mockBundles } from '../lib/mockData';

export const ServiceBundle: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'reviews' | 'vendor'>('overview');
  
  // Mock data - in a real app, this would come from API
  const bundle = mockBundles.find(b => b.id === id) || mockBundles[0];
  const [currentPrice, setCurrentPrice] = useState(bundle.price);

  const handleServiceToggle = (serviceId: string, price: number) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
      setCurrentPrice(currentPrice - price);
    } else {
      setSelectedServices([...selectedServices, serviceId]);
      setCurrentPrice(currentPrice + price);
    }
  };

  const handleBookNow = () => {
    navigate('/checkout', { 
      state: { 
        bundle, 
        selectedDate, 
        selectedServices,
        totalPrice: currentPrice 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={bundle.images[selectedImage]}
                  alt={bundle.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button variant="ghost" icon={Heart} size="sm" className="bg-white/80 hover:bg-white">
                  </Button>
                  <Button variant="ghost" icon={Share2} size="sm" className="bg-white/80 hover:bg-white">
                  </Button>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                  {selectedImage + 1} / {bundle.images.length}
                </div>
              </div>
              <div className="p-4">
                <div className="flex space-x-4 overflow-x-auto">
                  {bundle.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${bundle.name} ${index + 1}`}
                      className={`w-20 h-20 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all ${
                        selectedImage === index ? 'ring-2 ring-rose-500 scale-105' : 'hover:scale-105'
                      }`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Bundle Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                      {bundle.category}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{bundle.name}</h1>
                  <div className="flex items-center space-x-6 text-gray-600">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium text-lg">{bundle.rating}</span>
                      <span className="ml-1">({bundle.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-1" />
                      <span>{bundle.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-1" />
                      <span>{bundle.duration} hours</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-1" />
                      <span>{bundle.services.length} services</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    ${currentPrice.toLocaleString()}
                  </div>
                  {bundle.originalPrice && (
                    <div className="text-lg text-gray-500 line-through">
                      ${bundle.originalPrice.toLocaleString()}
                    </div>
                  )}
                  <div className="text-sm text-green-600 font-medium">
                    Save ${((bundle.originalPrice || 0) - currentPrice).toLocaleString()}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-lg leading-relaxed">{bundle.description}</p>
            </Card>

            {/* Tabs */}
            <Card className="overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'services', label: 'Services Included' },
                    { key: 'reviews', label: 'Reviews' },
                    { key: 'vendor', label: 'About Vendor' }
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
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Included</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bundle.services.map((service) => (
                          <div key={service.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{service.name}</h4>
                              <p className="text-sm text-gray-600">{service.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>${service.price.toLocaleString()}</span>
                                <span>{service.duration}h duration</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Why Choose This Package</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Award className="w-6 h-6 text-rose-600" />
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">Award-Winning Quality</h4>
                          <p className="text-sm text-gray-600">Recognized for excellence in wedding services</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Shield className="w-6 h-6 text-amber-600" />
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">Fully Insured</h4>
                          <p className="text-sm text-gray-600">Complete protection for your special day</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="w-6 h-6 text-emerald-600" />
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">On-Time Guarantee</h4>
                          <p className="text-sm text-gray-600">Punctual and professional service</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="space-y-4">
                    {bundle.services.map((service) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{service.name}</h4>
                            <p className="text-gray-600">{service.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">${service.price.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">{service.duration} hours</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Camera className="w-4 h-4 mr-1" />
                            {service.category}
                          </span>
                          <span className="flex items-center">
                            <Check className="w-4 h-4 mr-1 text-green-500" />
                            Included in package
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">Customer Reviews</h3>
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-semibold">{bundle.rating}</span>
                        <span className="text-gray-600">({bundle.reviewCount} reviews)</span>
                      </div>
                    </div>

                    {/* Review Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Rating Breakdown</h4>
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div key={stars} className="flex items-center space-x-3 mb-2">
                            <span className="text-sm text-gray-600 w-8">{stars}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full" 
                                style={{ width: `${stars === 5 ? 80 : stars === 4 ? 15 : 5}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">{stars === 5 ? 80 : stars === 4 ? 15 : 5}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Individual Reviews */}
                    <div className="space-y-6">
                      {[
                        {
                          name: 'Sarah M.',
                          date: '2 weeks ago',
                          rating: 5,
                          review: 'Absolutely amazing experience! The team was professional, creative, and captured our day perfectly. The photos exceeded our expectations and we couldn\'t be happier.',
                          helpful: 12
                        },
                        {
                          name: 'Michael R.',
                          date: '1 month ago',
                          rating: 5,
                          review: 'Outstanding service from start to finish. Great communication, arrived on time, and the final deliverables were incredible. Highly recommend!',
                          helpful: 8
                        },
                        {
                          name: 'Emily K.',
                          date: '2 months ago',
                          rating: 4,
                          review: 'Very professional team with great attention to detail. The only minor issue was a slight delay in delivery, but the quality made up for it.',
                          helpful: 5
                        }
                      ].map((review, index) => (
                        <div key={index} className="border-b border-gray-200 pb-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">{review.name[0]}</span>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900">{review.name}</h5>
                                <p className="text-sm text-gray-500">{review.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{review.review}</p>
                          <button className="text-sm text-gray-500 hover:text-gray-700">
                            Helpful ({review.helpful})
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'vendor' && (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-6">
                      <img
                        src={bundle.vendor.avatar}
                        alt={bundle.vendor.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{bundle.vendor.name}</h3>
                        <div className="flex items-center space-x-4 text-gray-600 mb-4">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span>{bundle.vendor.rating} ({bundle.vendor.reviewCount} reviews)</span>
                          </div>
                          <span>•</span>
                          <span>{bundle.vendor.experience} years experience</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{bundle.vendor.bio}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {bundle.vendor.specialties.map((specialty, index) => (
                          <span key={index} className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Quick Stats</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Response time:</span>
                            <span className="font-medium">Within 2 hours</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Weddings completed:</span>
                            <span className="font-medium">200+</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Repeat clients:</span>
                            <span className="font-medium">85%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Contact</h4>
                        <Button variant="outline" icon={MessageCircle} className="w-full">
                          Message Vendor
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
            {/* Individual Service Details */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Included Services</h3>
              <div className="space-y-4">
                {bundle.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{service.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>${service.price.toLocaleString()}</span>
                        <span>{service.duration}h duration</span>
                        <span className="capitalize">{service.category}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/bundle/${bundle.id}/service/${service.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="p-6 sticky top-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Book This Package</h3>
              
              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>

              {/* Available Dates */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Next Available Dates</h4>
                <div className="space-y-2">
                  {bundle.availability.slice(0, 3).map((date, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium">{date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedDate(date)}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
                <button className="text-sm text-rose-600 hover:text-rose-700 mt-2">
                  View all available dates
                </button>
              </div>

              {/* Price Summary */}
              <div className="border-t pt-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package Price</span>
                    <span className="font-medium">${bundle.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Add-ons</span>
                    <span className="font-medium">${(currentPrice - bundle.price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="font-medium">$150</span>
                  </div>
                  {bundle.originalPrice && (
                    <div className="flex justify-between text-green-600">
                      <span>Savings</span>
                      <span className="font-medium">-${(bundle.originalPrice - currentPrice).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-lg font-semibold border-t pt-3 mt-3">
                  <span>Total</span>
                  <span>${(currentPrice + 150).toLocaleString()}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mb-3"
                disabled={!selectedDate}
                onClick={handleBookNow}
              >
                Book Now
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  Free cancellation up to 30 days before your event
                </p>
                <Button variant="outline" className="w-full">
                  Request Custom Quote
                </Button>
              </div>
            </Card>

            {/* Contact Vendor */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions?</h3>
              <p className="text-gray-600 mb-4">
                Get in touch with {bundle.vendor.name} to discuss your specific needs and vision.
              </p>
              <div className="space-y-3">
                <Button variant="outline" icon={MessageCircle} className="w-full">
                  Message Vendor
                </Button>
                <div className="text-center text-sm text-gray-500">
                  Typically responds within 2 hours
                </div>
              </div>
            </Card>

            {/* Trust & Safety */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust & Safety</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Verified vendor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Secure payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Quality guarantee</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};