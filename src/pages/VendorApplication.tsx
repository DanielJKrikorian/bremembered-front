import React, { useState } from 'react';
import { ArrowLeft, Upload, X, Check, AlertCircle, User, Mail, Phone, MapPin, Globe, FileText, Camera, Video, Building, Award, GraduationCap, Shield, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { FileUploadModal } from '../components/vendor/FileUploadModal';
import { useServiceAreas } from '../hooks/useSupabase';

interface FormData {
  // Basic Information
  email: string;
  business_name: string;
  contact_name: string;
  phone: string;
  website: string;
  
  // Business Address
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  
  // Service Information
  service_types: string[];
  years_experience: number;
  specialties: string[];
  business_description: string;
  
  // Portfolio
  portfolio_links: string[];
  
  // Social Media
  instagram: string;
  facebook: string;
  twitter: string;
  other_social: string;
  
  // Equipment (will be populated based on service types)
  equipment: Record<string, any>;
  
  // Legal
  insurance_verified: boolean;
  background_check_consent: boolean;
  work_ownership_declared: boolean;
  terms_accepted: boolean;
}

export const VendorApplication: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    business_name: '',
    contact_name: '',
    phone: '',
    website: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    service_types: [],
    years_experience: 0,
    specialties: [],
    business_description: '',
    portfolio_links: [],
    instagram: '',
    facebook: '',
    twitter: '',
    other_social: '',
    equipment: {},
    insurance_verified: false,
    background_check_consent: false,
    work_ownership_declared: false,
    terms_accepted: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadType, setUploadType] = useState<'profile' | 'license' | 'work'>('work');
  const [workSampleFiles, setWorkSampleFiles] = useState<File[]>([]);
  const [insuranceFiles, setInsuranceFiles] = useState<File[]>([]);
  const [idVerificationFile, setIdVerificationFile] = useState<File | null>(null);
  const [businessDocumentFiles, setBusinessDocumentFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const { serviceAreas, loading: serviceAreasLoading } = useServiceAreas();

  const serviceOptions = [
    'Photography',
    'Videography',
    'DJ Services',
    'Live Musician',
    'Coordination',
    'Planning'
  ];

  const stateOptions = [
    'MA', 'RI', 'NH', 'CT', 'ME', 'VT'
  ];

  const specialtyOptions = {
    Photography: ['Wedding Photography', 'Engagement Sessions', 'Bridal Portraits', 'Destination Weddings', 'Elopements', 'Fine Art Photography', 'Photojournalistic Style', 'Traditional Photography'],
    Videography: ['Wedding Films', 'Highlight Reels', 'Ceremony Coverage', 'Reception Coverage', 'Drone Footage', 'Same-Day Edits', 'Documentary Style', 'Cinematic Style'],
    'DJ Services': ['Wedding Reception DJ', 'Ceremony Music', 'Cocktail Hour Music', 'MC Services', 'Sound System Setup', 'Lighting Services', 'Special Effects', 'Karaoke'],
    'Live Musician': ['Ceremony Music', 'Cocktail Hour Performance', 'Reception Entertainment', 'Acoustic Guitar', 'Piano', 'String Quartet', 'Jazz Band', 'Solo Vocalist'],
    Coordination: ['Day-of Coordination', 'Month-of Coordination', 'Timeline Management', 'Vendor Coordination', 'Emergency Management', 'Setup Coordination', 'Breakdown Management'],
    Planning: ['Full Wedding Planning', 'Partial Planning', 'Venue Selection', 'Vendor Selection', 'Budget Management', 'Design Consultation', 'Timeline Creation', 'Guest Management']
  };

  const equipmentChecklists = {
    Photography: [
      'Professional DSLR/Mirrorless cameras (2+ bodies)',
      'Professional lenses (24-70mm, 70-200mm, 85mm)',
      'External flash units and diffusers',
      'Backup memory cards and batteries',
      'Tripods and monopods',
      'Reflectors and lighting equipment'
    ],
    Videography: [
      'Professional video cameras (2+ bodies)',
      'Professional lenses and stabilizers',
      'Audio recording equipment (wireless mics)',
      'Backup storage and batteries',
      'Tripods and gimbals',
      'Lighting equipment for video'
    ],
    'DJ Services': [
      'Professional DJ controller/mixer',
      'High-quality speakers and subwoofers',
      'Wireless microphones (2+ systems)',
      'Backup equipment (controller, laptop)',
      'Professional lighting system',
      'Cable management and power distribution'
    ],
    'Live Musician': [
      'Professional instruments',
      'Amplification system',
      'Microphones and audio equipment',
      'Music stands and accessories',
      'Backup instruments/equipment',
      'Power and cable management'
    ],
    Coordination: [
      'Professional planning software/tools',
      'Communication devices (radios/phones)',
      'Emergency kit and supplies',
      'Timeline and vendor contact lists',
      'Backup plans and contingencies',
      'Professional attire and identification'
    ],
    Planning: [
      'Professional planning software',
      'Design and mood board tools',
      'Vendor database and contacts',
      'Budget tracking systems',
      'Timeline management tools',
      'Client communication platforms'
    ]
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleServiceTypeToggle = (serviceType: string) => {
    const newServiceTypes = formData.service_types.includes(serviceType)
      ? formData.service_types.filter(s => s !== serviceType)
      : [...formData.service_types, serviceType];
    
    handleInputChange('service_types', newServiceTypes);
    
    // Update equipment checklist
    const newEquipment = { ...formData.equipment };
    if (newServiceTypes.includes(serviceType) && !newEquipment[serviceType]) {
      newEquipment[serviceType] = {};
    } else if (!newServiceTypes.includes(serviceType)) {
      delete newEquipment[serviceType];
    }
    handleInputChange('equipment', newEquipment);
  };

  const handleSpecialtyToggle = (specialty: string) => {
    const newSpecialties = formData.specialties.includes(specialty)
      ? formData.specialties.filter(s => s !== specialty)
      : [...formData.specialties, specialty];
    
    handleInputChange('specialties', newSpecialties);
  };

  const handleEquipmentToggle = (serviceType: string, equipment: string) => {
    const newEquipment = { ...formData.equipment };
    if (!newEquipment[serviceType]) {
      newEquipment[serviceType] = {};
    }
    
    newEquipment[serviceType][equipment] = !newEquipment[serviceType][equipment];
    handleInputChange('equipment', newEquipment);
  };

  const handleStateToggle = (state: string) => {
    const newStates = selectedStates.includes(state)
      ? selectedStates.filter(s => s !== state)
      : [...selectedStates, state];
    
    setSelectedStates(newStates);
    
    // Remove regions from deselected states
    if (!newStates.includes(state)) {
      const stateRegions = serviceAreas
        .filter(area => area.state === state)
        .map(area => area.region);
      
      setSelectedRegions(prev => prev.filter(region => !stateRegions.includes(region)));
    }
  };

  const handleRegionToggle = (region: string) => {
    const newRegions = selectedRegions.includes(region)
      ? selectedRegions.filter(r => r !== region)
      : [...selectedRegions, region];
    
    setSelectedRegions(newRegions);
  };

  const addPortfolioLink = () => {
    handleInputChange('portfolio_links', [...formData.portfolio_links, '']);
  };

  const updatePortfolioLink = (index: number, value: string) => {
    const newLinks = [...formData.portfolio_links];
    newLinks[index] = value;
    handleInputChange('portfolio_links', newLinks);
  };

  const removePortfolioLink = (index: number) => {
    const newLinks = formData.portfolio_links.filter((_, i) => i !== index);
    handleInputChange('portfolio_links', newLinks);
  };

  const handleFileUpload = (files: File[]) => {
    switch (uploadType) {
      case 'work':
        setWorkSampleFiles(prev => [...prev, ...files]);
        break;
      case 'license':
        setInsuranceFiles(prev => [...prev, ...files]);
        break;
      case 'profile':
        if (files[0]) {
          setIdVerificationFile(files[0]);
        }
        break;
    }
  };

  const removeWorkSample = (index: number) => {
    setWorkSampleFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeInsuranceFile = (index: number) => {
    setInsuranceFiles(prev => prev.filter((_, i) => i !== index));
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
        if (!formData.street_address) newErrors.street_address = 'Street address is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.zip_code) newErrors.zip_code = 'ZIP code is required';
        break;
      case 3:
        if (formData.service_types.length === 0) newErrors.service_types = 'At least one service type is required';
        if (formData.years_experience < 1) newErrors.years_experience = 'Years of experience is required';
        if (!formData.business_description) newErrors.business_description = 'Business description is required';
        break;
      case 4:
        if (selectedStates.length === 0) newErrors.service_areas = 'At least one state is required';
        if (selectedRegions.length === 0) newErrors.service_regions = 'At least one region is required';
        break;
      case 5:
        if (workSampleFiles.length === 0 && formData.portfolio_links.length === 0) {
          newErrors.portfolio = 'At least one work sample or portfolio link is required';
        }
        break;
      case 6:
        // Equipment validation
        for (const serviceType of formData.service_types) {
          const serviceEquipment = formData.equipment[serviceType] || {};
          const checkedItems = Object.values(serviceEquipment).filter(Boolean).length;
          if (checkedItems < 3) {
            newErrors[`equipment_${serviceType}`] = `Please select at least 3 equipment items for ${serviceType}`;
          }
        }
        break;
      case 7:
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
      setCurrentStep(prev => Math.min(prev + 1, 7));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setUploading(true);

    try {
      // Simulate file upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Success - redirect to confirmation
      navigate('/vendor-application-success');
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return Camera;
    } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension || '')) {
      return Video;
    }
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stepTitles = {
    1: 'Basic Information',
    2: 'Business Address',
    3: 'Service Information',
    4: 'Service Areas',
    5: 'Portfolio & Work Samples',
    6: 'Equipment & Resources',
    7: 'Legal & Verification'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => navigate('/vendor-onboarding')}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Application</h1>
              <p className="text-gray-600 mt-1">{stepTitles[currentStep as keyof typeof stepTitles]}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-2 mb-8 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${currentStep >= step 
                    ? 'bg-rose-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 7 && (
                  <div className={`w-8 h-1 mx-1 rounded-full transition-all ${
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
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Tell us about your business
                </h2>
                <p className="text-gray-600">
                  Let's start with some basic information about you and your business
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
                  placeholder="Your Photography Studio"
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
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Business Address
                </h2>
                <p className="text-gray-600">
                  Where is your business located?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Street Address"
                    value={formData.street_address}
                    onChange={(e) => handleInputChange('street_address', e.target.value)}
                    placeholder="123 Main Street"
                    icon={MapPin}
                    error={errors.street_address}
                    required
                  />
                </div>
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Boston"
                  error={errors.city}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select State</option>
                    {stateOptions.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state}</p>}
                </div>
                <Input
                  label="ZIP Code"
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  placeholder="02101"
                  error={errors.zip_code}
                  required
                />
                <Input
                  label="Country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="United States"
                  disabled
                />
              </div>
            </div>
          )}

          {/* Step 3: Service Information */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Service Information
                </h2>
                <p className="text-gray-600">
                  What services do you provide?
                </p>
              </div>

              {/* Service Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Service Types <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceOptions.map((service) => (
                    <div
                      key={service}
                      onClick={() => handleServiceTypeToggle(service)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${formData.service_types.includes(service)
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      {formData.service_types.includes(service) && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <h3 className="font-medium text-gray-900">{service}</h3>
                    </div>
                  ))}
                </div>
                {errors.service_types && <p className="text-sm text-red-600 mt-2">{errors.service_types}</p>}
              </div>

              {/* Years of Experience */}
              <Input
                label="Years of Experience"
                type="number"
                value={formData.years_experience.toString()}
                onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                placeholder="5"
                min="0"
                icon={Clock}
                error={errors.years_experience}
                required
              />

              {/* Specialties */}
              {formData.service_types.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Specialties (Optional)
                  </label>
                  <div className="space-y-4">
                    {formData.service_types.map((serviceType) => (
                      <div key={serviceType}>
                        <h4 className="font-medium text-gray-900 mb-3">{serviceType}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(specialtyOptions[serviceType as keyof typeof specialtyOptions] || []).map((specialty) => (
                            <div
                              key={specialty}
                              onClick={() => handleSpecialtyToggle(specialty)}
                              className={`
                                relative p-3 rounded-lg border cursor-pointer transition-all text-sm
                                ${formData.specialties.includes(specialty)
                                  ? 'border-purple-500 bg-purple-50 text-purple-800' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                                }
                              `}
                            >
                              {formData.specialties.includes(specialty) && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                  <Check className="w-2 h-2 text-white" />
                                </div>
                              )}
                              {specialty}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.business_description}
                  onChange={(e) => handleInputChange('business_description', e.target.value)}
                  placeholder="Tell us about your business, your approach, and what makes you unique..."
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    errors.business_description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.business_description && <p className="text-sm text-red-600 mt-1">{errors.business_description}</p>}
              </div>

              {/* Social Media */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Social Media (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    placeholder="@yourbusiness"
                  />
                  <Input
                    label="Facebook"
                    value={formData.facebook}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    placeholder="facebook.com/yourbusiness"
                  />
                  <Input
                    label="Twitter"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    placeholder="@yourbusiness"
                  />
                  <Input
                    label="Other"
                    value={formData.other_social}
                    onChange={(e) => handleInputChange('other_social', e.target.value)}
                    placeholder="Other social media links"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Service Areas */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Service Areas
                </h2>
                <p className="text-gray-600">
                  Which states and regions do you serve?
                </p>
              </div>

              {/* State Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  States You Serve <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stateOptions.map((state) => (
                    <div
                      key={state}
                      onClick={() => handleStateToggle(state)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                        ${selectedStates.includes(state)
                          ? 'border-amber-500 bg-amber-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      {selectedStates.includes(state) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <h3 className="font-medium text-gray-900">{state}</h3>
                    </div>
                  ))}
                </div>
                {errors.service_areas && <p className="text-sm text-red-600 mt-2">{errors.service_areas}</p>}
              </div>

              {/* Region Selection */}
              {selectedStates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Regions You Serve <span className="text-red-500">*</span>
                  </label>
                  {serviceAreasLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading regions...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedStates.map((state) => {
                        const stateRegions = serviceAreas.filter(area => area.state === state);
                        if (stateRegions.length === 0) return null;
                        
                        return (
                          <div key={state}>
                            <h4 className="font-medium text-gray-900 mb-3">{state} Regions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {stateRegions.map((area) => (
                                <div
                                  key={area.id}
                                  onClick={() => handleRegionToggle(area.region)}
                                  className={`
                                    relative p-3 rounded-lg border-2 cursor-pointer transition-all text-center
                                    ${selectedRegions.includes(area.region)
                                      ? 'border-emerald-500 bg-emerald-50' 
                                      : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }
                                  `}
                                >
                                  {selectedRegions.includes(area.region) && (
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                      <Check className="w-2 h-2 text-white" />
                                    </div>
                                  )}
                                  <h5 className="font-medium text-gray-900 text-sm">{area.region}</h5>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {errors.service_regions && <p className="text-sm text-red-600 mt-2">{errors.service_regions}</p>}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Portfolio & Work Samples */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Portfolio & Work Samples
                </h2>
                <p className="text-gray-600">
                  Show us your best work
                </p>
              </div>

              {/* Work Sample Files */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Upload Work Samples <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your best photos and videos. Photos up to 25MB, videos up to 500MB. Maximum 10 files.
                </p>
                
                {workSampleFiles.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Selected Files ({workSampleFiles.length}/10)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                      {workSampleFiles.map((file, index) => {
                        const FileIcon = getFileIcon(file.name);
                        return (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                              onClick={() => removeWorkSample(index)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadType('work');
                      setShowFileUpload(true);
                    }}
                    disabled={workSampleFiles.length >= 10}
                    className="flex-1"
                  >
                    {workSampleFiles.length === 0 ? 'Upload Work Samples' : 'Add More Files'}
                  </Button>
                  {workSampleFiles.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setWorkSampleFiles([])}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Clear All Files
                    </Button>
                  )}
                </div>
                {errors.portfolio && <p className="text-sm text-red-600 mt-2">{errors.portfolio}</p>}
              </div>

              {/* Portfolio Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Portfolio Links (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Add links to your online portfolio, website galleries, or social media
                </p>
                
                <div className="space-y-3">
                  {formData.portfolio_links.map((link, index) => (
                    <div key={index} className="flex space-x-3">
                      <Input
                        placeholder="https://yourportfolio.com"
                        value={link}
                        onChange={(e) => updatePortfolioLink(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => removePortfolioLink(index)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addPortfolioLink}
                    disabled={formData.portfolio_links.length >= 5}
                  >
                    Add Portfolio Link
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Equipment & Resources */}
          {currentStep === 6 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Equipment & Resources
                </h2>
                <p className="text-gray-600">
                  Tell us about your professional equipment
                </p>
              </div>

              {formData.service_types.map((serviceType) => (
                <div key={serviceType}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {serviceType} Equipment
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select all equipment you own and use professionally (minimum 3 required)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(equipmentChecklists[serviceType as keyof typeof equipmentChecklists] || []).map((equipment) => (
                      <div
                        key={equipment}
                        onClick={() => handleEquipmentToggle(serviceType, equipment)}
                        className={`
                          relative p-3 rounded-lg border cursor-pointer transition-all text-sm
                          ${formData.equipment[serviceType]?.[equipment]
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800' 
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }
                        `}
                      >
                        {formData.equipment[serviceType]?.[equipment] && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {equipment}
                      </div>
                    ))}
                  </div>
                  
                  {errors[`equipment_${serviceType}`] && (
                    <p className="text-sm text-red-600 mt-2">{errors[`equipment_${serviceType}`]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 7: Legal & Verification */}
          {currentStep === 7 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Legal & Verification
                </h2>
                <p className="text-gray-600">
                  Final steps to complete your application
                </p>
              </div>

              {/* Insurance Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Insurance Documentation (Optional but Recommended)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Upload your business insurance, liability insurance, or equipment insurance documents
                </p>
                
                {insuranceFiles.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Insurance Files</h4>
                    <div className="space-y-2">
                      {insuranceFiles.map((file, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            onClick={() => removeInsuranceFile(index)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadType('license');
                    setShowFileUpload(true);
                  }}
                >
                  Upload Insurance Documents
                </Button>
              </div>

              {/* ID Verification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  ID Verification (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a government-issued ID for identity verification
                </p>
                
                {idVerificationFile && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{idVerificationFile.name}</p>
                        <p className="text-sm text-gray-600">{formatFileSize(idVerificationFile.size)}</p>
                      </div>
                      <button
                        onClick={() => setIdVerificationFile(null)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadType('profile');
                    setShowFileUpload(true);
                  }}
                >
                  Upload ID Document
                </Button>
              </div>

              {/* Legal Agreements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Legal Agreements</h3>
                
                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.background_check_consent}
                      onChange={(e) => handleInputChange('background_check_consent', e.target.checked)}
                      className="mt-1 text-rose-500 focus:ring-rose-500"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I consent to a background check as part of the vendor verification process. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.background_check_consent && <p className="text-sm text-red-600">{errors.background_check_consent}</p>}

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.work_ownership_declared}
                      onChange={(e) => handleInputChange('work_ownership_declared', e.target.checked)}
                      className="mt-1 text-rose-500 focus:ring-rose-500"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I declare that all work samples and portfolio items are my own original work or I have proper rights to use them. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.work_ownership_declared && <p className="text-sm text-red-600">{errors.work_ownership_declared}</p>}

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.terms_accepted}
                      onChange={(e) => handleInputChange('terms_accepted', e.target.checked)}
                      className="mt-1 text-rose-500 focus:ring-rose-500"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the <a href="#" className="text-rose-600 hover:text-rose-700">Terms of Service</a> and <a href="#" className="text-rose-600 hover:text-rose-700">Vendor Agreement</a>. <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.terms_accepted && <p className="text-sm text-red-600">{errors.terms_accepted}</p>}
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                    <h4 className="font-medium text-blue-900 mb-2">Uploading Files...</h4>
                    <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-blue-800">{uploadProgress}% complete</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting || uploading}
                  loading={isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                </Button>
                {errors.submit && <p className="text-sm text-red-600 mt-2">{errors.submit}</p>}
              </div>
            </div>
          )}

          {/* Navigation */}
          {currentStep < 7 && (
            <div className="flex justify-between pt-8 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
              >
                Continue
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onFileSelect={handleFileUpload}
        title={
          uploadType === 'work' ? 'Upload Work Samples' :
          uploadType === 'license' ? 'Upload Insurance Documents' :
          'Upload ID Verification'
        }
        description={
          uploadType === 'work' ? 'Upload your best photos and videos to showcase your work' :
          uploadType === 'license' ? 'Upload insurance or business license documents' :
          'Upload a government-issued ID for verification'
        }
        acceptedTypes={
          uploadType === 'work' ? 'image/*,video/*' :
          uploadType === 'license' ? '.pdf,.doc,.docx,image/*' :
          'image/*,.pdf'
        }
        maxSize={
          uploadType === 'work' ? 500 : // 500MB for work samples (videos)
          uploadType === 'license' ? 10 :
          5
        }
        currentFiles={
          uploadType === 'work' ? workSampleFiles :
          uploadType === 'license' ? insuranceFiles :
          idVerificationFile ? [idVerificationFile] : []
        }
        uploadType={uploadType}
        multiple={uploadType !== 'profile'}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />
    </div>
  );
};