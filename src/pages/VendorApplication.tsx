import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, Check, AlertCircle, User, Mail, Phone, MapPin, Building, FileText, Camera, Award, Shield, Globe, Clock, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { FileUploadModal } from '../components/vendor/FileUploadModal';

interface GearItem {
  type: string;
  brand: string;
  model: string;
  year: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

interface FormData {
  // Basic Information
  email: string;
  business_name: string;
  contact_name: string;
  phone: string;
  website: string;
  
  // Business Address
  business_address: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  
  // Services and Experience
  service_types: string[];
  years_experience: number;
  specialties: string[];
  business_description: string;
  
  // Portfolio and Social Media
  portfolio_links: string[];
  social_media: {
    instagram: string;
    facebook: string;
    twitter: string;
    other: string;
  };
  
  // Work Samples and Documentation
  work_samples: string[];
  equipment: Record<string, any>;
  insurance_verified: boolean;
  insurance_documents: string[];
  id_verification_document: string;
  business_documents: string[];
  
  // Legal and Compliance
  background_check_consent: boolean;
  work_ownership_declared: boolean;
  terms_accepted: boolean;
  
  // Application Status
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'transferred';
  admin_notes: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Additional fields for gear tracking
  services_applying_for: string[];
  gear: GearItem[];
}

export const VendorApplication: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalConfig, setUploadModalConfig] = useState({
    title: '',
    description: '',
    acceptedTypes: '',
    uploadType: 'work' as 'profile' | 'license' | 'work',
    multiple: false
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    business_name: '',
    contact_name: '',
    phone: '',
    website: '',
    business_address: {
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'United States'
    },
    service_types: [],
    years_experience: 0,
    specialties: [],
    business_description: '',
    portfolio_links: [],
    social_media: {
      instagram: '',
      facebook: '',
      twitter: '',
      other: ''
    },
    work_samples: [],
    equipment: {},
    insurance_verified: false,
    insurance_documents: [],
    id_verification_document: '',
    business_documents: [],
    background_check_consent: false,
    work_ownership_declared: false,
    terms_accepted: false,
    status: 'pending',
    admin_notes: '',
    reviewed_at: null,
    reviewed_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    services_applying_for: [],
    gear: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceTypes = [
    'Photography',
    'Videography', 
    'DJ Services',
    'Live Musician',
    'Coordination',
    'Planning'
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof FormData] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayInputChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof FormData] as string[]).map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof FormData] as string[]), '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof FormData] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleServiceTypeToggle = (serviceType: string) => {
    setFormData(prev => ({
      ...prev,
      service_types: prev.service_types.includes(serviceType)
        ? prev.service_types.filter(s => s !== serviceType)
        : [...prev.service_types, serviceType]
    }));
  };

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
    
    // Process files based on upload type
    const fileNames = files.map(file => file.name);
    
    switch (uploadModalConfig.uploadType) {
      case 'work':
        setFormData(prev => ({
          ...prev,
          work_samples: [...prev.work_samples, ...fileNames]
        }));
        break;
      case 'license':
        setFormData(prev => ({
          ...prev,
          business_documents: [...prev.business_documents, ...fileNames]
        }));
        break;
      case 'profile':
        if (uploadModalConfig.title.includes('ID')) {
          setFormData(prev => ({
            ...prev,
            id_verification_document: fileNames[0] || ''
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            insurance_documents: [...prev.insurance_documents, ...fileNames]
          }));
        }
        break;
    }
    
    setIsUploadModalOpen(false);
  };

  const removeFile = (field: string, fileName: string) => {
    if (field === 'id_verification_document') {
      setFormData(prev => ({
        ...prev,
        [field]: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field as keyof FormData] as string[]).filter(name => name !== fileName)
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.business_name) newErrors.business_name = 'Business name is required';
        if (!formData.contact_name) newErrors.contact_name = 'Contact name is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        break;
      case 2:
        if (!formData.business_address.street_address) newErrors['business_address.street_address'] = 'Street address is required';
        if (!formData.business_address.city) newErrors['business_address.city'] = 'City is required';
        if (!formData.business_address.state) newErrors['business_address.state'] = 'State is required';
        if (!formData.business_address.zip_code) newErrors['business_address.zip_code'] = 'ZIP code is required';
        break;
      case 3:
        if (formData.service_types.length === 0) newErrors.service_types = 'At least one service type is required';
        if (formData.years_experience < 1) newErrors.years_experience = 'Years of experience is required';
        if (!formData.business_description) newErrors.business_description = 'Business description is required';
        break;
      case 4:
        if (formData.portfolio_links.filter(link => link.trim()).length === 0) {
          newErrors.portfolio_links = 'At least one portfolio link is required';
        }
        break;
      case 5:
        if (formData.work_samples.length === 0) newErrors.work_samples = 'Work samples are required';
        if (!formData.insurance_verified) newErrors.insurance_verified = 'Insurance verification is required';
        if (!formData.id_verification_document) newErrors.id_verification_document = 'ID verification is required';
        break;
      case 6:
        if (!formData.background_check_consent) newErrors.background_check_consent = 'Background check consent is required';
        if (!formData.work_ownership_declared) newErrors.work_ownership_declared = 'Work ownership declaration is required';
        if (!formData.terms_accepted) newErrors.terms_accepted = 'Terms acceptance is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to success page or show success message
      navigate('/vendor-application-success');
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = {
    1: 'Basic Information',
    2: 'Business Address',
    3: 'Services & Experience',
    4: 'Portfolio & Social Media',
    5: 'Documentation & Verification',
    6: 'Legal & Compliance'
  };

  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.email && formData.business_name && formData.contact_name && formData.phone);
      case 2:
        return !!(formData.business_address.street_address && 
                 formData.business_address.city && 
                 formData.business_address.state && 
                 formData.business_address.zip_code);
      case 3:
        return !!(formData.service_types.length > 0 && 
                 formData.years_experience >= 1 && 
                 formData.business_description);
      case 4:
        return formData.portfolio_links.filter(link => link.trim()).length > 0;
      case 5:
        return !!(formData.work_samples.length > 0 && 
                 formData.insurance_verified && 
                 formData.id_verification_document);
      case 6:
        return !!(formData.background_check_consent && 
                 formData.work_ownership_declared && 
                 formData.terms_accepted);
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => currentStep === 1 ? navigate('/vendor-onboarding') : handleBack()}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Application</h1>
              <p className="text-gray-600 mt-1">{stepTitles[currentStep as keyof typeof stepTitles]}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${currentStep >= step 
                    ? 'bg-rose-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 6 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Tell us about your business
                </h2>
                <p className="text-gray-600">
                  Let's start with some basic information about you and your wedding business
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  icon={Mail}
                  error={errors.email}
                  required
                />
                <Input
                  label="Business Name"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Your Wedding Business Name"
                  icon={Building}
                  error={errors.business_name}
                  required
                />
                <Input
                  label="Contact Name"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  placeholder="Your full name"
                  icon={User}
                  error={errors.contact_name}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  icon={Phone}
                  error={errors.phone}
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="Website (Optional)"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    icon={Globe}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Address */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Where is your business located?
                </h2>
                <p className="text-gray-600">
                  This helps us match you with couples in your service area
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Input
                  label="Street Address"
                  value={formData.business_address.street_address}
                  onChange={(e) => handleInputChange('business_address.street_address', e.target.value)}
                  placeholder="123 Main Street"
                  icon={MapPin}
                  error={errors['business_address.street_address']}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="City"
                    value={formData.business_address.city}
                    onChange={(e) => handleInputChange('business_address.city', e.target.value)}
                    placeholder="City"
                    error={errors['business_address.city']}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.business_address.state}
                      onChange={(e) => handleInputChange('business_address.state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors['business_address.state'] && (
                      <p className="text-sm text-red-600 mt-1">{errors['business_address.state']}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="ZIP Code"
                    value={formData.business_address.zip_code}
                    onChange={(e) => handleInputChange('business_address.zip_code', e.target.value)}
                    placeholder="12345"
                    error={errors['business_address.zip_code']}
                    required
                  />
                  <Input
                    label="Country"
                    value={formData.business_address.country}
                    onChange={(e) => handleInputChange('business_address.country', e.target.value)}
                    placeholder="United States"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Services & Experience */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  What services do you offer?
                </h2>
                <p className="text-gray-600">
                  Select all the wedding services you provide
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Service Types <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceTypes.map((serviceType) => (
                    <div
                      key={serviceType}
                      onClick={() => handleServiceTypeToggle(serviceType)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${formData.service_types.includes(serviceType)
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      {formData.service_types.includes(serviceType) && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <h3 className="font-medium text-gray-900">{serviceType}</h3>
                    </div>
                  ))}
                </div>
                {errors.service_types && (
                  <p className="text-sm text-red-600 mt-2">{errors.service_types}</p>
                )}
              </div>

              <Input
                label="Years of Experience"
                type="number"
                min="0"
                value={formData.years_experience.toString()}
                onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                placeholder="5"
                icon={Clock}
                error={errors.years_experience}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties (Optional)
                </label>
                <div className="space-y-3">
                  {formData.specialties.map((specialty, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Input
                        value={specialty}
                        onChange={(e) => handleArrayInputChange('specialties', index, e.target.value)}
                        placeholder="e.g., Outdoor weddings, Destination weddings"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        icon={X}
                        onClick={() => removeArrayItem('specialties', index)}
                        className="text-red-500 hover:text-red-700"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addArrayItem('specialties')}
                    className="w-full"
                  >
                    Add Specialty
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.business_description}
                  onChange={(e) => handleInputChange('business_description', e.target.value)}
                  placeholder="Tell us about your business, your approach to weddings, and what makes you unique..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
                {errors.business_description && (
                  <p className="text-sm text-red-600 mt-1">{errors.business_description}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Portfolio & Social Media */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Show us your work
                </h2>
                <p className="text-gray-600">
                  Share your portfolio and social media presence
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Portfolio Links <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {formData.portfolio_links.map((link, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Input
                        type="url"
                        value={link}
                        onChange={(e) => handleArrayInputChange('portfolio_links', index, e.target.value)}
                        placeholder="https://yourportfolio.com"
                        className="flex-1"
                        icon={Globe}
                      />
                      <Button
                        variant="ghost"
                        icon={X}
                        onClick={() => removeArrayItem('portfolio_links', index)}
                        className="text-red-500 hover:text-red-700"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addArrayItem('portfolio_links')}
                    className="w-full"
                  >
                    Add Portfolio Link
                  </Button>
                </div>
                {errors.portfolio_links && (
                  <p className="text-sm text-red-600 mt-2">{errors.portfolio_links}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Instagram Handle"
                  value={formData.social_media.instagram}
                  onChange={(e) => handleInputChange('social_media.instagram', e.target.value)}
                  placeholder="@yourbusiness"
                />
                <Input
                  label="Facebook Page"
                  value={formData.social_media.facebook}
                  onChange={(e) => handleInputChange('social_media.facebook', e.target.value)}
                  placeholder="facebook.com/yourbusiness"
                />
                <Input
                  label="Twitter Handle"
                  value={formData.social_media.twitter}
                  onChange={(e) => handleInputChange('social_media.twitter', e.target.value)}
                  placeholder="@yourbusiness"
                />
                <Input
                  label="Other Social Media"
                  value={formData.social_media.other}
                  onChange={(e) => handleInputChange('social_media.other', e.target.value)}
                  placeholder="TikTok, LinkedIn, etc."
                />
              </div>
            </div>
          )}

          {/* Step 5: Documentation & Verification */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Documentation & Verification
                </h2>
                <p className="text-gray-600">
                  Upload required documents to verify your business and work
                </p>
              </div>

              <div className="space-y-8">
                {/* Work Samples */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Work Samples <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload 3-10 examples of your best work (photos or videos)
                  </p>
                  <Button
                    variant="outline"
                    icon={Upload}
                    onClick={() => {
                      setUploadModalConfig({
                        title: 'Upload Work Samples',
                        description: 'Upload 3-10 examples of your best wedding work',
                        acceptedTypes: 'image/*,video/*',
                        uploadType: 'work',
                        multiple: true
                      });
                      setIsUploadModalOpen(true);
                    }}
                    className="w-full"
                  >
                    Choose Files
                  </Button>
                  {errors.work_samples && (
                    <p className="text-sm text-red-600 mt-2">{errors.work_samples}</p>
                  )}

                  {/* Display uploaded work samples */}
                  {formData.work_samples.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Uploaded Work Samples ({formData.work_samples.length})</h4>
                      <div className="space-y-2">
                        {formData.work_samples.map((fileName, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm text-gray-700">{fileName}</span>
                            <Button
                              variant="ghost"
                              icon={X}
                              size="sm"
                              onClick={() => removeFile('work_samples', fileName)}
                              className="text-red-500 hover:text-red-700"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Insurance Verification */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="insurance_verified"
                      checked={formData.insurance_verified}
                      onChange={(e) => handleInputChange('insurance_verified', e.target.checked)}
                      className="text-rose-500 focus:ring-rose-500 rounded"
                      required
                    />
                    <label htmlFor="insurance_verified" className="text-sm font-medium text-gray-700">
                      I have current business insurance <span className="text-red-500">*</span>
                    </label>
                  </div>
                  
                  <Button
                    variant="outline"
                    icon={Upload}
                    onClick={() => {
                      setUploadModalConfig({
                        title: 'Upload Insurance Documents',
                        description: 'Upload your current business insurance certificate',
                        acceptedTypes: 'image/*,.pdf',
                        uploadType: 'profile',
                        multiple: true
                      });
                      setIsUploadModalOpen(true);
                    }}
                    className="w-full"
                  >
                    Upload Insurance Documents
                  </Button>
                  {errors.insurance_verified && (
                    <p className="text-sm text-red-600 mt-2">{errors.insurance_verified}</p>
                  )}

                  {/* Display uploaded insurance documents */}
                  {formData.insurance_documents.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Uploaded Insurance Documents ({formData.insurance_documents.length})</h4>
                      <div className="space-y-2">
                        {formData.insurance_documents.map((fileName, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm text-gray-700">{fileName}</span>
                            <Button
                              variant="ghost"
                              icon={X}
                              size="sm"
                              onClick={() => removeFile('insurance_documents', fileName)}
                              className="text-red-500 hover:text-red-700"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ID Verification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    ID Verification <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a clear photo of your driver's license or government-issued ID
                  </p>
                  <Button
                    variant="outline"
                    icon={Upload}
                    onClick={() => {
                      setUploadModalConfig({
                        title: 'Upload ID Verification',
                        description: 'Upload a clear photo of your driver\'s license or government-issued ID',
                        acceptedTypes: 'image/*',
                        uploadType: 'profile',
                        multiple: false
                      });
                      setIsUploadModalOpen(true);
                    }}
                    className="w-full"
                  >
                    Choose File
                  </Button>
                  {errors.id_verification_document && (
                    <p className="text-sm text-red-600 mt-2">{errors.id_verification_document}</p>
                  )}

                  {/* Display uploaded ID verification */}
                  {formData.id_verification_document && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Uploaded ID Verification</h4>
                      <div className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="text-sm text-gray-700">{formData.id_verification_document}</span>
                        <Button
                          variant="ghost"
                          icon={X}
                          size="sm"
                          onClick={() => removeFile('id_verification_document', formData.id_verification_document)}
                          className="text-red-500 hover:text-red-700"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Business Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Business Documents (Optional)
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload business license, certifications, or other relevant documents
                  </p>
                  <Button
                    variant="outline"
                    icon={Upload}
                    onClick={() => {
                      setUploadModalConfig({
                        title: 'Upload Business Documents',
                        description: 'Upload business license, certifications, or other relevant documents',
                        acceptedTypes: 'image/*,.pdf',
                        uploadType: 'license',
                        multiple: true
                      });
                      setIsUploadModalOpen(true);
                    }}
                    className="w-full"
                  >
                    Choose Files
                  </Button>

                  {/* Display uploaded business documents */}
                  {formData.business_documents.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Uploaded Documents ({formData.business_documents.length})</h4>
                      <div className="space-y-2">
                        {formData.business_documents.map((fileName, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm text-gray-700">{fileName}</span>
                            <Button
                              variant="ghost"
                              icon={X}
                              size="sm"
                              onClick={() => removeFile('business_documents', fileName)}
                              className="text-red-500 hover:text-red-700"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Legal & Compliance */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Legal & Compliance
                </h2>
                <p className="text-gray-600">
                  Final step - please review and accept our terms
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-4">Required Agreements</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.background_check_consent}
                        onChange={(e) => handleInputChange('background_check_consent', e.target.checked)}
                        className="mt-1 text-rose-500 focus:ring-rose-500 rounded"
                        required
                      />
                      <span className="text-sm text-blue-800">
                        <strong>Background Check Consent:</strong> I consent to a background check as part of the verification process. <span className="text-red-500">*</span>
                      </span>
                    </label>
                    {errors.background_check_consent && (
                      <p className="text-sm text-red-600">{errors.background_check_consent}</p>
                    )}

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.work_ownership_declared}
                        onChange={(e) => handleInputChange('work_ownership_declared', e.target.checked)}
                        className="mt-1 text-rose-500 focus:ring-rose-500 rounded"
                        required
                      />
                      <span className="text-sm text-blue-800">
                        <strong>Work Ownership:</strong> I declare that all work samples submitted are my own original work or I have proper rights to use them. <span className="text-red-500">*</span>
                      </span>
                    </label>
                    {errors.work_ownership_declared && (
                      <p className="text-sm text-red-600">{errors.work_ownership_declared}</p>
                    )}

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.terms_accepted}
                        onChange={(e) => handleInputChange('terms_accepted', e.target.checked)}
                        className="mt-1 text-rose-500 focus:ring-rose-500 rounded"
                        required
                      />
                      <span className="text-sm text-blue-800">
                        <strong>Terms & Conditions:</strong> I have read and agree to the <a href="#" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700 underline">Vendor Agreement</a>. <span className="text-red-500">*</span>
                      </span>
                    </label>
                    {errors.terms_accepted && (
                      <p className="text-sm text-red-600">{errors.terms_accepted}</p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-4">What Happens Next?</h3>
                  <div className="space-y-3 text-sm text-green-800">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Our team will review your application within 1-2 business hours</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>You'll receive an email notification with the decision</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4" />
                      <span>If approved, you'll get access to set up your vendor profile</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Start receiving qualified leads within 24 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t border-gray-200">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Previous Step
              </Button>
            )}
            
            <div className="ml-auto">
              {currentStep < 6 ? (
                <Button 
                  variant="primary" 
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                  icon={ArrowRight}
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={!isCurrentStepValid()}
                  icon={Check}
                  size="lg"
                >
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Application Summary */}
        <Card className="p-6 mt-8 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Join 500+ Successful Wedding Vendors
            </h3>
            <p className="text-gray-600 mb-6">
              Our vendors average 25+ bookings per year and grow their business by 40% in their first year
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-500 mb-1">25+</div>
                <div className="text-sm text-gray-600">Avg Bookings/Year</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500 mb-1">40%</div>
                <div className="text-sm text-gray-600">Business Growth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500 mb-1">4.9</div>
                <div className="text-sm text-gray-600">Vendor Satisfaction</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileSelect={handleFileSelect}
        title={uploadModalConfig.title}
        description={uploadModalConfig.description}
        acceptedTypes={uploadModalConfig.acceptedTypes}
        uploadType={uploadModalConfig.uploadType}
        multiple={uploadModalConfig.multiple}
        currentFiles={selectedFiles}
      />
    </div>
  );
};