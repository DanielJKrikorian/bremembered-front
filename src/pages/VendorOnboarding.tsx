import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, X, Check, Camera, Video, Music, Users, Calendar, Shield, FileText, ExternalLink, AlertCircle, Star, Award, Globe, Instagram, Facebook, Twitter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface VendorFormData {
  // Basic Information
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Service Information
  serviceTypes: string[];
  yearsExperience: string;
  businessDescription: string;
  specialties: string[];
  serviceAreas: string[];
  
  // Portfolio & Work Samples
  websiteUrl: string;
  portfolioUrls: string[];
  socialMedia: {
    instagram: string;
    facebook: string;
    twitter: string;
    other: string;
  };
  workSamples: {
    photos: File[];
    videos: File[];
  };
  
  // Equipment & Capabilities
  equipment: string[];
  backupEquipment: boolean;
  insurance: boolean;
  insuranceAmount: string;
  businessLicense: boolean;
  
  // Legal & Verification
  agreedToTerms: boolean;
  agreedToBackground: boolean;
  agreedToOwnership: boolean;
  idVerification: File | null;
  businessDocuments: File[];
}

export const VendorOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessAddress: '',
    city: '',
    state: '',
    zipCode: '',
    serviceTypes: [],
    yearsExperience: '',
    businessDescription: '',
    specialties: [],
    serviceAreas: [],
    websiteUrl: '',
    portfolioUrls: [''],
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: '',
      other: ''
    },
    workSamples: {
      photos: [],
      videos: []
    },
    equipment: [''],
    backupEquipment: false,
    insurance: false,
    insuranceAmount: '',
    businessLicense: false,
    agreedToTerms: false,
    agreedToBackground: false,
    agreedToOwnership: false,
    idVerification: null,
    businessDocuments: []
  });

  const serviceTypeOptions = [
    { value: 'Photography', label: 'Photography', icon: Camera, description: 'Wedding and event photography' },
    { value: 'Videography', label: 'Videography', icon: Video, description: 'Wedding films and video production' },
    { value: 'DJ Services', label: 'DJ Services', icon: Music, description: 'Music and entertainment services' },
    { value: 'Live Musician', label: 'Live Musician', icon: Music, description: 'Live musical performances' },
    { value: 'Coordination', label: 'Day-of Coordination', icon: Users, description: 'Wedding day coordination and management' },
    { value: 'Planning', label: 'Wedding Planning', icon: Calendar, description: 'Full-service wedding planning' }
  ];

  const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT'];

  const specialtyOptions = {
    Photography: ['Portrait Photography', 'Candid Photography', 'Fine Art Photography', 'Documentary Style', 'Editorial Photography', 'Drone Photography', 'Film Photography', 'Digital Photography'],
    Videography: ['Cinematic Films', 'Documentary Style', 'Drone Videography', 'Same-Day Edits', 'Live Streaming', 'Multi-Camera Setup', 'Highlight Reels', 'Full Ceremony Coverage'],
    'DJ Services': ['Wedding Reception DJ', 'Ceremony Music', 'Cocktail Hour Music', 'MC Services', 'Sound System Setup', 'Lighting Design', 'Photo Booth', 'Karaoke'],
    'Live Musician': ['Solo Acoustic', 'String Quartet', 'Jazz Ensemble', 'Classical Music', 'Contemporary Covers', 'Original Music', 'Ceremony Music', 'Reception Entertainment'],
    Coordination: ['Day-of Coordination', 'Month-of Coordination', 'Timeline Management', 'Vendor Coordination', 'Emergency Management', 'Setup Coordination', 'Guest Management'],
    Planning: ['Full-Service Planning', 'Partial Planning', 'Destination Weddings', 'Intimate Weddings', 'Large Events', 'Budget Management', 'Vendor Sourcing', 'Design Consultation']
  };

  const equipmentOptions = {
    Photography: ['DSLR Cameras', 'Mirrorless Cameras', 'Professional Lenses', 'External Flash', 'Tripods', 'Reflectors', 'Backup Cameras', 'Memory Cards', 'Batteries'],
    Videography: ['4K Cameras', 'Stabilizers/Gimbals', 'Drones', 'Audio Equipment', 'Lighting Kit', 'Tripods', 'Memory Cards', 'Backup Equipment', 'Editing Software'],
    'DJ Services': ['Professional DJ Controller', 'Sound System', 'Microphones', 'Lighting Equipment', 'Backup Equipment', 'Music Library', 'Laptop/Computer', 'Cables & Adapters'],
    'Live Musician': ['Instruments', 'Amplification', 'Microphones', 'Music Stands', 'Sheet Music', 'Backup Instruments', 'Audio Interface', 'Cables'],
    Coordination: ['Planning Software', 'Communication Tools', 'Emergency Kit', 'Timeline Templates', 'Vendor Contact Lists', 'Day-of Timeline', 'Backup Plans'],
    Planning: ['Planning Software', 'Design Tools', 'Vendor Network', 'Budget Tracking Tools', 'Contract Templates', 'Timeline Software', 'Communication Platform']
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceTypeToggle = (serviceType: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceType)
        ? prev.serviceTypes.filter(s => s !== serviceType)
        : [...prev.serviceTypes, serviceType]
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleEquipmentToggle = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const handlePortfolioUrlChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      portfolioUrls: prev.portfolioUrls.map((url, i) => i === index ? value : url)
    }));
  };

  const addPortfolioUrl = () => {
    setFormData(prev => ({
      ...prev,
      portfolioUrls: [...prev.portfolioUrls, '']
    }));
  };

  const removePortfolioUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolioUrls: prev.portfolioUrls.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (type: 'photos' | 'videos' | 'id' | 'documents', files: FileList | null) => {
    if (!files) return;

    if (type === 'id') {
      setFormData(prev => ({ ...prev, idVerification: files[0] }));
    } else if (type === 'documents') {
      setFormData(prev => ({ 
        ...prev, 
        businessDocuments: [...prev.businessDocuments, ...Array.from(files)]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        workSamples: {
          ...prev.workSamples,
          [type]: [...prev.workSamples[type], ...Array.from(files)]
        }
      }));
    }
  };

  const removeFile = (type: 'photos' | 'videos', index: number) => {
    setFormData(prev => ({
      ...prev,
      workSamples: {
        ...prev.workSamples,
        [type]: prev.workSamples[type].filter((_, i) => i !== index)
      }
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      businessDocuments: prev.businessDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Here you would submit the form data to your backend
      console.log('Submitting vendor application:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to success page
      setCurrentStep(7);
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep = () => {
    switch (currentStep) {
      case 1:
        return formData.businessName && formData.contactName && formData.email && formData.phone;
      case 2:
        return formData.serviceTypes.length > 0 && formData.yearsExperience && formData.businessDescription;
      case 3:
        return formData.websiteUrl || formData.portfolioUrls.some(url => url.trim()) || formData.workSamples.photos.length > 0 || formData.workSamples.videos.length > 0;
      case 4:
        return formData.equipment.some(eq => eq.trim()) && formData.insurance;
      case 5:
        return formData.agreedToTerms && formData.agreedToBackground && formData.agreedToOwnership && formData.idVerification;
      default:
        return true;
    }
  };

  const getAvailableSpecialties = () => {
    const allSpecialties = formData.serviceTypes.flatMap(serviceType => 
      specialtyOptions[serviceType as keyof typeof specialtyOptions] || []
    );
    return [...new Set(allSpecialties)];
  };

  const getAvailableEquipment = () => {
    const allEquipment = formData.serviceTypes.flatMap(serviceType => 
      equipmentOptions[serviceType as keyof typeof equipmentOptions] || []
    );
    return [...new Set(allEquipment)];
  };

  const stepTitles = {
    1: 'Basic Information',
    2: 'Service Details',
    3: 'Portfolio & Samples',
    4: 'Equipment & Insurance',
    5: 'Verification & Legal',
    6: 'Review & Submit',
    7: 'Application Submitted'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={handleBack}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Join Our Vendor Team</h1>
              <p className="text-gray-600 mt-1">{stepTitles[currentStep as keyof typeof stepTitles]}</p>
            </div>
          </div>

          {/* Progress Steps */}
          {currentStep < 7 && (
            <div className="flex items-center justify-center space-x-4 mb-8">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${currentStep >= step 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {currentStep > step ? <Check className="w-5 h-5" /> : step}
                  </div>
                  {step < 6 && (
                    <div className={`w-16 h-1 mx-2 rounded-full transition-all ${
                      currentStep > step ? 'bg-blue-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Tell us about your business
              </h2>
              <p className="text-gray-600">
                Let's start with your basic business information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Business Name"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Your Business Name"
                required
              />
              <Input
                label="Contact Name"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                placeholder="Your Full Name"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Business Address"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <Input
                label="ZIP Code"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="12345"
                required
              />
            </div>

            <div className="text-center mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Service Details */}
        {currentStep === 2 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-rose-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                What services do you offer?
              </h2>
              <p className="text-gray-600">
                Select all the wedding services you provide
              </p>
            </div>

            <div className="space-y-8">
              {/* Service Types */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceTypeOptions.map((service) => {
                    const Icon = service.icon;
                    const isSelected = formData.serviceTypes.includes(service.value);
                    return (
                      <div
                        key={service.value}
                        onClick={() => handleServiceTypeToggle(service.value)}
                        className={`
                          relative p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{service.label}</h4>
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Years of Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <select
                    value={formData.yearsExperience}
                    onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Experience</option>
                    <option value="1-2">1-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="11-15">11-15 years</option>
                    <option value="16+">16+ years</option>
                  </select>
                </div>
              </div>

              {/* Business Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description
                </label>
                <textarea
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  placeholder="Tell us about your business, your approach, and what makes you unique..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Specialties */}
              {formData.serviceTypes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getAvailableSpecialties().map((specialty) => {
                      const isSelected = formData.specialties.includes(specialty);
                      return (
                        <button
                          key={specialty}
                          onClick={() => handleSpecialtyToggle(specialty)}
                          className={`
                            p-3 rounded-lg border text-sm transition-all
                            ${isSelected 
                              ? 'border-rose-500 bg-rose-50 text-rose-800' 
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                            }
                          `}
                        >
                          {specialty}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Portfolio & Samples */}
        {currentStep === 3 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Show us your work
              </h2>
              <p className="text-gray-600">
                Share your portfolio and work samples to showcase your talent
              </p>
            </div>

            <div className="space-y-8">
              {/* Website URL */}
              <Input
                label="Website URL"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                placeholder="https://yourwebsite.com"
                icon={Globe}
              />

              {/* Portfolio URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Portfolio Links
                </label>
                <div className="space-y-3">
                  {formData.portfolioUrls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Input
                        value={url}
                        onChange={(e) => handlePortfolioUrlChange(index, e.target.value)}
                        placeholder="https://portfolio-link.com"
                        className="flex-1"
                      />
                      {formData.portfolioUrls.length > 1 && (
                        <Button
                          variant="ghost"
                          icon={X}
                          size="sm"
                          onClick={() => removePortfolioUrl(index)}
                          className="text-red-500 hover:text-red-700"
                        />
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    icon={ArrowRight}
                    size="sm"
                    onClick={addPortfolioUrl}
                  >
                    Add Another Link
                  </Button>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Instagram"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => handleInputChange('socialMedia', { ...formData.socialMedia, instagram: e.target.value })}
                    placeholder="@yourusername"
                    icon={Instagram}
                  />
                  <Input
                    label="Facebook"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => handleInputChange('socialMedia', { ...formData.socialMedia, facebook: e.target.value })}
                    placeholder="facebook.com/yourpage"
                    icon={Facebook}
                  />
                  <Input
                    label="Twitter"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => handleInputChange('socialMedia', { ...formData.socialMedia, twitter: e.target.value })}
                    placeholder="@yourusername"
                    icon={Twitter}
                  />
                  <Input
                    label="Other Platform"
                    value={formData.socialMedia.other}
                    onChange={(e) => handleInputChange('socialMedia', { ...formData.socialMedia, other: e.target.value })}
                    placeholder="TikTok, YouTube, etc."
                    icon={ExternalLink}
                  />
                </div>
              </div>

              {/* Work Samples Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Samples</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Samples */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Photo Samples (up to 10)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload('photos', e.target.files)}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload photos</p>
                        <p className="text-xs text-gray-500">JPG, PNG up to 10MB each</p>
                      </label>
                    </div>
                    {formData.workSamples.photos.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.workSamples.photos.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <Button
                              variant="ghost"
                              icon={X}
                              size="sm"
                              onClick={() => removeFile('photos', index)}
                              className="text-red-500 hover:text-red-700"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video Samples */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Video Samples (up to 5)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="video/*"
                        onChange={(e) => handleFileUpload('videos', e.target.files)}
                        className="hidden"
                        id="video-upload"
                      />
                      <label htmlFor="video-upload" className="cursor-pointer">
                        <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload videos</p>
                        <p className="text-xs text-gray-500">MP4, MOV up to 100MB each</p>
                      </label>
                    </div>
                    {formData.workSamples.videos.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.workSamples.videos.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <Button
                              variant="ghost"
                              icon={X}
                              size="sm"
                              onClick={() => removeFile('videos', index)}
                              className="text-red-500 hover:text-red-700"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Equipment & Insurance */}
        {currentStep === 4 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Equipment & Insurance
              </h2>
              <p className="text-gray-600">
                Tell us about your professional equipment and insurance coverage
              </p>
            </div>

            <div className="space-y-8">
              {/* Equipment */}
              {formData.serviceTypes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Equipment</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getAvailableEquipment().map((equipment) => {
                      const isSelected = formData.equipment.includes(equipment);
                      return (
                        <button
                          key={equipment}
                          onClick={() => handleEquipmentToggle(equipment)}
                          className={`
                            p-3 rounded-lg border text-sm transition-all
                            ${isSelected 
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                            }
                          `}
                        >
                          {equipment}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Insurance & Business */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Backup Equipment</h4>
                      <p className="text-sm text-gray-600">Do you have backup equipment?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.backupEquipment}
                        onChange={(e) => handleInputChange('backupEquipment', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Professional Insurance</h4>
                      <p className="text-sm text-gray-600">Do you carry liability insurance?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.insurance}
                        onChange={(e) => handleInputChange('insurance', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {formData.insurance && (
                    <Input
                      label="Insurance Coverage Amount"
                      value={formData.insuranceAmount}
                      onChange={(e) => handleInputChange('insuranceAmount', e.target.value)}
                      placeholder="$1,000,000"
                    />
                  )}

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Business License</h4>
                      <p className="text-sm text-gray-600">Do you have a business license?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.businessLicense}
                        onChange={(e) => handleInputChange('businessLicense', e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Verification & Legal */}
        {currentStep === 5 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Verification & Legal
              </h2>
              <p className="text-gray-600">
                Complete verification and agree to our terms
              </p>
            </div>

            <div className="space-y-8">
              {/* ID Verification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ID Verification (Required)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('id', e.target.files)}
                    className="hidden"
                    id="id-upload"
                  />
                  <label htmlFor="id-upload" className="cursor-pointer">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload Driver's License or Government ID</p>
                    <p className="text-xs text-gray-500">JPG, PNG, or PDF up to 10MB</p>
                  </label>
                </div>
                {formData.idVerification && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">{formData.idVerification.name}</span>
                      <Button
                        variant="ghost"
                        icon={X}
                        size="sm"
                        onClick={() => handleInputChange('idVerification', null)}
                        className="text-red-500 hover:text-red-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Business Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Business Documents (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => handleFileUpload('documents', e.target.files)}
                    className="hidden"
                    id="documents-upload"
                  />
                  <label htmlFor="documents-upload" className="cursor-pointer">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload business license, insurance certificates, etc.</p>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB each</p>
                  </label>
                </div>
                {formData.businessDocuments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.businessDocuments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          icon={X}
                          size="sm"
                          onClick={() => removeDocument(index)}
                          className="text-red-500 hover:text-red-700"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legal Agreements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Legal Agreements</h3>
                
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                      className="mt-1 text-blue-500 focus:ring-blue-500"
                      required
                    />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 mb-1">Terms of Service & Vendor Agreement</p>
                      <p className="text-gray-600">
                        I agree to the <a href="#" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700 underline">Vendor Agreement</a>, including payment terms, cancellation policies, and platform guidelines.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.agreedToBackground}
                      onChange={(e) => handleInputChange('agreedToBackground', e.target.checked)}
                      className="mt-1 text-blue-500 focus:ring-blue-500"
                      required
                    />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 mb-1">Background Check Consent</p>
                      <p className="text-gray-600">
                        I consent to a background check and identity verification as part of the vendor approval process. This helps ensure the safety and trust of all couples using our platform.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-4 border border-red-200 rounded-lg bg-red-50">
                    <input
                      type="checkbox"
                      checked={formData.agreedToOwnership}
                      onChange={(e) => handleInputChange('agreedToOwnership', e.target.checked)}
                      className="mt-1 text-red-500 focus:ring-red-500"
                      required
                    />
                    <div className="text-sm">
                      <p className="font-medium text-red-900 mb-1">Work Ownership Declaration</p>
                      <p className="text-red-800">
                        <strong>I hereby declare that all work samples, portfolio items, and content I submit are my own original work and I own all rights to them.</strong> I understand that submitting work that is not mine or that I do not have rights to use is grounds for immediate rejection and potential legal action.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                disabled={!canProceedStep()}
                icon={ArrowRight}
              >
                Review Application
              </Button>
            </div>
          </Card>
        )}

        {/* Step 6: Review & Submit */}
        {currentStep === 6 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Review Your Application
              </h2>
              <p className="text-gray-600">
                Please review all information before submitting
              </p>
            </div>

            <div className="space-y-6">
              {/* Business Info Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Business Name:</span>
                    <span className="font-medium ml-2">{formData.businessName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium ml-2">{formData.contactName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium ml-2">{formData.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium ml-2">{formData.phone}</span>
                  </div>
                </div>
              </div>

              {/* Services Summary */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.serviceTypes.map((service) => (
                    <span key={service} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium ml-2">{formData.yearsExperience} years</span>
                </div>
              </div>

              {/* Portfolio Summary */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio & Samples</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Photo Samples:</span>
                    <span className="font-medium ml-2">{formData.workSamples.photos.length} files</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Video Samples:</span>
                    <span className="font-medium ml-2">{formData.workSamples.videos.length} files</span>
                  </div>
                  {formData.websiteUrl && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Website:</span>
                      <span className="font-medium ml-2">{formData.websiteUrl}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    <span>Terms & Conditions Agreed</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    <span>Background Check Consent</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    <span>Work Ownership Declaration</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    <span>ID Verification Uploaded</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={loading}
                icon={ArrowRight}
              >
                Submit Application
              </Button>
            </div>
          </Card>
        )}

        {/* Step 7: Success */}
        {currentStep === 7 && (
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Thank you for your interest in joining the B. Remembered vendor team. We'll review your application and get back to you within 3-5 business days.
            </p>

            <div className="bg-blue-50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
              <div className="space-y-2 text-sm text-blue-800 text-left">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <span>Application review (1-2 business days)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <span>Background check and verification (2-3 business days)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <span>Portfolio review and approval</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-xs font-bold">4</span>
                  </div>
                  <span>Account setup and onboarding</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
              <div className="text-sm text-gray-500">
                Questions? Contact us at <a href="mailto:vendors@bremembered.io" className="text-blue-600 hover:text-blue-700">vendors@bremembered.io</a>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};