import React, { useState } from 'react';
import { CreditCard, Lock, Check, ArrowLeft, Calendar, MapPin, Users, Mail, Phone, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { mockBundles } from '../lib/mockData';

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Event Details
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    guestCount: '',
    specialRequests: '',
    // Couple Info
    brideName: '',
    groomName: '',
    email: '',
    phone: '',
    // Payment
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Get bundle from navigation state or default
  const bundle = location.state?.bundle || mockBundles[0];
  const selectedDate = location.state?.selectedDate;
  const totalPrice = location.state?.totalPrice || bundle.price;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setStep(4); // Show confirmation
  };

  const stepTitles = {
    1: 'Event Details',
    2: 'Personal Information',
    3: 'Payment Information',
    4: 'Confirmation'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => step === 1 ? navigate(-1) : handleBack()}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
              <p className="text-gray-600 mt-1">{stepTitles[step as keyof typeof stepTitles]}</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${step >= num 
                    ? 'bg-rose-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step > num ? <Check className="w-5 h-5" /> : num}
                </div>
                {num < 3 && (
                  <div className={`w-20 h-1 mx-2 rounded-full transition-all ${
                    step > num ? 'bg-rose-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-rose-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Event Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Event Date"
                    type="date"
                    value={formData.eventDate || (selectedDate ? selectedDate.toISOString().split('T')[0] : '')}
                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    icon={Calendar}
                    required
                  />
                  <Input
                    label="Event Time"
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => handleInputChange('eventTime', e.target.value)}
                    required
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Event Location"
                      placeholder="Enter venue name and address"
                      value={formData.eventLocation}
                      onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                      icon={MapPin}
                      required
                    />
                  </div>
                  <Input
                    label="Expected Guest Count"
                    type="number"
                    placeholder="Number of guests"
                    value={formData.guestCount}
                    onChange={(e) => handleInputChange('guestCount', e.target.value)}
                    icon={Users}
                    required
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests or Notes
                    </label>
                    <textarea
                      placeholder="Any special requirements, themes, or important details..."
                      value={formData.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button 
                    variant="primary" 
                    onClick={handleNext} 
                    size="lg"
                    className="w-full"
                    disabled={!formData.eventDate || !formData.eventTime || !formData.eventLocation || !formData.guestCount}
                  >
                    Continue to Personal Information
                  </Button>
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Personal Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Bride's Full Name"
                    placeholder="First and last name"
                    value={formData.brideName}
                    onChange={(e) => handleInputChange('brideName', e.target.value)}
                    icon={User}
                    required
                  />
                  <Input
                    label="Groom's Full Name"
                    placeholder="First and last name"
                    value={formData.groomName}
                    onChange={(e) => handleInputChange('groomName', e.target.value)}
                    icon={User}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    icon={Mail}
                    helperText="We'll send booking confirmations and updates here"
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    icon={Phone}
                    helperText="For urgent updates about your booking"
                    required
                  />
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Communication Preferences</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2 text-rose-500 focus:ring-rose-500" defaultChecked />
                      <span className="text-sm text-blue-800">Email updates about my booking</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2 text-rose-500 focus:ring-rose-500" defaultChecked />
                      <span className="text-sm text-blue-800">SMS notifications for important updates</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2 text-rose-500 focus:ring-rose-500" />
                      <span className="text-sm text-blue-800">Marketing emails about wedding tips and offers</span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button 
                    variant="primary" 
                    onClick={handleNext} 
                    size="lg"
                    className="w-full"
                    disabled={!formData.brideName || !formData.groomName || !formData.email || !formData.phone}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Payment Information</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <Lock className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Secure Payment</p>
                      <p className="text-xs text-green-700">Your payment information is encrypted and secure</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <Input
                      label="Card Number"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      icon={CreditCard}
                      required
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="Expiry Date"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        required
                      />
                      <Input
                        label="CVV"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                        required
                      />
                      <div></div>
                    </div>
                    
                    <Input
                      label="Cardholder Name"
                      placeholder="Name as it appears on card"
                      value={formData.cardName}
                      onChange={(e) => handleInputChange('cardName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        label="Street Address"
                        placeholder="123 Main Street"
                        value={formData.billingAddress}
                        onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="City"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required
                        />
                        <Input
                          label="State"
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="ZIP Code"
                          placeholder="12345"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          required
                        />
                        <div></div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <label className="flex items-start space-x-3">
                      <input 
                        type="checkbox" 
                        className="mt-1 text-rose-500 focus:ring-rose-500" 
                        required 
                      />
                      <span className="text-sm text-gray-600">
                        I agree to the <a href="#" className="text-rose-600 hover:text-rose-700">Terms of Service</a> and <a href="#" className="text-rose-600 hover:text-rose-700">Privacy Policy</a>. I understand that this booking is subject to the vendor's cancellation policy.
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    size="lg"
                    className="w-full"
                    loading={loading}
                    disabled={!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardName}
                  >
                    {loading ? 'Processing Payment...' : `Complete Booking - $${(totalPrice + 150).toLocaleString()}`}
                  </Button>
                </div>
              </Card>
            )}

            {step === 4 && (
              <Card className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">Booking Confirmed!</h2>
                <p className="text-xl text-gray-600 mb-6">
                  Thank you for choosing B. Remembered! Your wedding booking has been successfully confirmed.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-semibold text-gray-900 mb-4">Booking Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-medium">#BR-{Date.now().toString().slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event Date:</span>
                      <span className="font-medium">{formData.eventDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vendor:</span>
                      <span className="font-medium">{bundle.vendor.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Paid:</span>
                      <span className="font-medium">${(totalPrice + 150).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={() => navigate('/my-bookings')}
                  >
                    View My Bookings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/')}
                  >
                    Continue Shopping
                  </Button>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• You'll receive a confirmation email within 5 minutes</li>
                    <li>• Your vendor will contact you within 24 hours</li>
                    <li>• Complete your wedding vision form for better service</li>
                  </ul>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <img
                    src={bundle.images[0]}
                    alt={bundle.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 line-clamp-2">{bundle.name}</h4>
                    <p className="text-sm text-gray-600">{bundle.vendor.name}</p>
                    <p className="text-sm text-gray-600">📍 {bundle.location}</p>
                    {formData.eventDate && (
                      <p className="text-sm text-gray-600">📅 {new Date(formData.eventDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Package Price</span>
                    <span className="font-medium">${bundle.price.toLocaleString()}</span>
                  </div>
                  
                  {bundle.originalPrice && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Package Savings</span>
                      <span className="font-medium">-${(bundle.originalPrice - bundle.price).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="font-medium">$150</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-lg font-semibold border-t pt-3">
                    <span>Total</span>
                    <span>${(totalPrice + 150).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-4 space-y-1">
                  <p>✓ All prices include applicable taxes</p>
                  <p>✓ Payment processed securely</p>
                  <p>✓ 24/7 customer support</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};