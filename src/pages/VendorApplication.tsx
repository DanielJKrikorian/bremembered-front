import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, X, Plus, Minus, User, Phone, Mail, MapPin, Camera, FileText, Link, Award, Check, AlertCircle, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useServiceAreas } from '../hooks/useSupabase';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FileUploadModal } from '../components/vendor/FileUploadModal';

interface GearItem {
  gear_type: string;
  brand: string;
  model: string;
  year: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

interface ApplicationData {
  name: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  service_locations: string[];
  services_applying_for: string[];
  gear: GearItem[];
  profile_photo: File | null;
  drivers_license_front: File | null;
  drivers_license_back: File | null;
  description: string;
  work_links: string[];
  work_samples: File[];
}

export const VendorApplication = () => {
  const navigate = useNavigate();
  const { serviceAreas, loading: serviceAreasLoading } = useServiceAreas();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalConfig, setUploadModalConfig] = useState({
    title: '',
    description: '',
    acceptedTypes: '',
    uploadType: 'work' as 'profile' | 'license' | 'work',
    multiple: false
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [licenseFiles, setLicenseFiles] = useState<{ front: File | null; back: File | null }>({
    front: null,
    back: null
  });
  const [workSampleFiles, setWorkSampleFiles] = useState<File[]>([]);
  const [uploadingWorkSamples, setUploadingWorkSamples] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalConfig2, setUploadModalConfig2] = useState<{
    title: string;
    description: string;
    acceptedTypes: string;
    uploadType: 'profile' | 'license' | 'work';
    multiple?: boolean;
    maxSize?: number;
    onUpload?: (files: File[]) => void;
  }>({
    title: '',
    description: '',
    acceptedTypes: '',
    uploadType: 'work'
  });

  const openUploadModal = (field: string, title: string, description: string, acceptedTypes: string, uploadType: 'profile' | 'license' | 'work', config?: any) => {
    setUploadModalConfig2({
      title,
      description,
      acceptedTypes,
      uploadType,
      multiple: false,
      onUpload: (files: File[]) => {}
    });
    setIsUploadModalOpen(true);
  };

  const [formData, setFormData] = useState<ApplicationData>({
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    service_locations: [],
    services_applying_for: [],
    gear: [],
    profile_photo: null,
    drivers_license_front: null,
    drivers_license_back: null,
    description: '',
    work_links: [''],
    work_samples: []
  });

  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<any[]>([]);

  // Update available regions when states change
  useEffect(() => {
    if (selectedStates.length > 0) {
      const regions = serviceAreas.filter(area => selectedStates.includes(area.state));
      setAvailableRegions(regions);
      
      // Remove any selected regions that are no longer available
      setFormData(prev => ({
        ...prev,
        service_locations: prev.service_locations.filter(regionId => 
          regions.some(region => region.id === regionId)
        )
      }));
    } else {
      setAvailableRegions([]);
      setFormData(prev => ({ ...prev, service_locations: [] }));
    }
  }, [selectedStates, serviceAreas]);

  const handleStateToggle = (state: string) => {
    setSelectedStates(prev => 
      prev.includes(state)
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const serviceOptions = [
    'Photography',
    'Videography', 
    'DJ Services',
    'Live Musician',
    'Coordination',
    'Planning'
  ];

  const gearTypes = [
    'Camera Body',
    'Camera Lens',
    'Lighting Equipment',
    'Audio Equipment',
    'Video Equipment',
    'DJ Equipment',
    'Other'
  ];

  const conditionOptions: GearItem['condition'][] = ['Excellent', 'Good', 'Fair', 'Poor'];

  const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT'];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
    
    // Convert files to file paths for form data
    const filePaths = files.map(file => file.name);
    
    // Update form data based on upload type
    switch (uploadModalConfig.uploadType) {
      case 'profile':
        setFormData(prev => ({
          ...prev,
          id_verification_document: filePaths[0] || ''
        }));
        break;
      case 'license':
        setFormData(prev => ({
          ...prev,
          business_documents: [...prev.business_documents, ...filePaths]
        }));
        break;
      case 'work':
        setFormData(prev => ({
          ...prev,
          work_samples: [...prev.work_samples, ...filePaths]
        }));
        break;
    }
    
    // Close modal after file selection
    setIsUploadModalOpen(false);
    setSelectedFiles([]);
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleServiceLocationToggle = (locationId: string) => {
    setFormData(prev => ({
      ...prev,
      service_locations: prev.service_locations.includes(locationId)
        ? prev.service_locations.filter(id => id !== locationId)
        : [...prev.service_locations, locationId]
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services_applying_for: prev.services_applying_for.includes(service)
        ? prev.services_applying_for.filter(s => s !== service)
        : [...prev.services_applying_for, service]
    }));
  };

  const handleGearChange = (index: number, field: keyof GearItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      gear: prev.gear.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addGearItem = () => {
    setFormData(prev => ({
      ...prev,
      gear: [...prev.gear, {
        gear_type: '',
        brand: '',
        model: '',
        year: '',
        condition: 'Good'
      }]
    }));
  };

  const removeGearItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gear: prev.gear.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    if (field === 'work_samples' && file) {
      setFormData(prev => ({
        ...prev,
        work_samples: [...prev.work_samples, file]
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const removeWorkSample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      work_samples: prev.work_samples.filter((_, i) => i !== index)
    }));
  };

  const handleWorkLinkChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      work_links: prev.work_links.map((link, i) => i === index ? value : link)
    }));
  };

  const addWorkLink = () => {
    setFormData(prev => ({
      ...prev,
      work_links: [...prev.work_links, '']
    }));
  };

  const removeWorkLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      work_links: prev.work_links.filter((_, i) => i !== index)
    }));
  };

  const handleProfileUpload = () => {
    setShowUploadModal(true);
    setUploadModalConfig2({
      title: 'Upload Profile Photo',
      description: 'Upload a professional headshot or business photo',
      acceptedTypes: 'image/*',
      maxSize: 10,
      uploadType: 'profile',
      multiple: false,
      onUpload: (files) => setSelectedFile(files[0])
    });
  };

  const handleLicenseUpload = (side: 'front' | 'back') => {
    setShowUploadModal(true);
    setUploadModalConfig2({
      title: `Upload Driver's License (${side})`,
      description: `Upload a clear photo of the ${side} of your driver's license`,
      acceptedTypes: 'image/*',
      maxSize: 10,
      uploadType: 'license',
      multiple: false,
      onUpload: (files) => setLicenseFiles(prev => ({ ...prev, [side]: files[0] }))
    });
  };

  const handleWorkSampleUpload = () => {
    setShowUploadModal(true);
    setUploadModalConfig2({
      title: 'Upload Work Samples',
      description: 'Upload multiple photos and videos showcasing your best work (up to 10 files)',
      acceptedTypes: 'image/*,video/*',
      maxSize: 500,
      uploadType: 'work',
      multiple: true,
      onUpload: handleWorkSampleFilesSelect
    });
  };

  const handleWorkSampleFilesSelect = async (files: File[]) => {
    if (files.length === 0) return;
    
    // Validate total file count
    const totalFiles = workSampleFiles.length + files.length;
    if (totalFiles > 10) {
      setError('You can upload a maximum of 10 work sample files');
      return;
    }

    setUploadingWorkSamples(true);
    setUploadProgress(0);
    
    try {
      const uploadedFiles: File[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate individual file size based on type
        const maxSize = file.type.startsWith('video/') ? 500 : 25; // 500MB for videos, 25MB for photos
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`${file.name} is too large. ${file.type.startsWith('video/') ? 'Videos' : 'Photos'} must be under ${maxSize}MB`);
        }
        
        uploadedFiles.push(file);
        
        // Update progress
        const progress = Math.round(((i + 1) / files.length) * 100);
        setUploadProgress(progress);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setWorkSampleFiles(prev => [...prev, ...uploadedFiles]);
      setShowUploadModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingWorkSamples(false);
      setUploadProgress(0);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!supabase || !isSupabaseConfigured()) {
      // Mock upload for demo
      return `mock-uploads/${path}`;
    }

    const { data, error } = await supabase.storage
      .from('vendor-applications')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please upload a profile photo');
      return;
    }

    if (!licenseFiles.front || !licenseFiles.back) {
      setError('Please upload both sides of your driver\'s license');
      return;
    }

    // Validate work samples
    if (workSampleFiles.length === 0) {
      setError('Please upload at least one work sample');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload files first
      const uploadPromises: Promise<string>[] = [];
      const filePaths: Record<string, string> = {};

      if (formData.profile_photo) {
        const path = `${Date.now()}-profile-${formData.profile_photo.name}`;
        uploadPromises.push(uploadFile(formData.profile_photo, path).then(p => filePaths.profile_photo = p));
      }

      if (formData.drivers_license_front) {
        const path = `${Date.now()}-license-front-${formData.drivers_license_front.name}`;
        uploadPromises.push(uploadFile(formData.drivers_license_front, path).then(p => filePaths.drivers_license_front = p));
      }

      if (formData.drivers_license_back) {
        const path = `${Date.now()}-license-back-${formData.drivers_license_back.name}`;
        uploadPromises.push(uploadFile(formData.drivers_license_back, path).then(p => filePaths.drivers_license_back = p));
      }

      // Upload work samples
      const workSamplePaths: string[] = [];
      for (let i = 0; i < formData.work_samples.length; i++) {
        const file = formData.work_samples[i];
        const path = `${Date.now()}-work-${i}-${file.name}`;
        uploadPromises.push(uploadFile(file, path).then(p => workSamplePaths.push(p)));
      }

      await Promise.all(uploadPromises);

      // Prepare application data
      const applicationData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        service_locations: formData.service_locations,
        services_applying_for: formData.services_applying_for,
        gear: formData.gear,
        profile_photo: filePaths.profile_photo || null,
        drivers_license_front: filePaths.drivers_license_front || null,
        drivers_license_back: filePaths.drivers_license_back || null,
        description: formData.description,
        work_links: formData.work_links.filter(link => link.trim() !== ''),
        work_samples: workSamplePaths,
        status: 'pending'
      };

      if (!supabase || !isSupabaseConfigured()) {
        // Mock submission for demo
        console.log('Mock application submitted:', applicationData);
        setSuccess(true);
        return;
      }

      // Submit to database
      const { error: submitError } = await supabase
        .from('vendor_applications')
        .insert([applicationData]);

      if (submitError) throw submitError;

      setSuccess(true);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.phone && formData.email && 
               formData.address.street && formData.address.city && 
               formData.address.state && formData.address.zip;
      case 2:
        return selectedStates.length > 0 && formData.service_locations.length > 0;
      case 3:
        return formData.services_applying_for.length > 0;
      case 4:
        return formData.gear.length > 0 && formData.gear.every(item => 
          item.gear_type && item.brand && item.model && item.year && item.condition
        );
      case 5:
        return formData.profile_photo && formData.drivers_license_front && formData.drivers_license_back;
      case 6:
        return formData.description.length >= 50;
      case 7:
        return formData.work_links.some(link => link.trim() !== '') || formData.work_samples.length > 0;
      case 8:
        const needsPhotos = formData.services_applying_for.includes('Photography');
        const needsVideos = formData.services_applying_for.includes('Videography');
        
        if (needsPhotos && formData.work_samples.length < 10) return false;
        if (needsVideos && formData.work_samples.length < 5) return false;
        if (!needsPhotos && !needsVideos) return true;
        
        return formData.work_samples.length > 0;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Personal Information';
      case 2: return 'Service Locations';
      case 3: return 'Services You Offer';
      case 4: return 'Equipment & Gear';
      case 5: return 'Photo & ID Upload';
      case 6: return 'About You';
      case 7: return 'Portfolio Links';
      case 8: return 'Work Samples';
      case 9: return 'Review & Submit';
      default: return '';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-12 text-center max-w-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for applying to join the B. Remembered vendor network. We'll review your application and get back to you within 1-2 hours.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Our team will review your application within 1-2 hours</li>
              <li>• We'll verify your credentials and portfolio</li>
              <li>• If approved, you'll receive setup instructions via email</li>
              <li>• You'll gain access to our vendor dashboard and start receiving leads</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
            <Button variant="outline" onClick={() => navigate('/vendor-onboarding')}>
              Learn More About B. Remembered
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={() => currentStep === 1 ? navigate('/vendor-onboarding') : setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Application</h1>
              <p className="text-gray-600 mt-1">{getStepTitle()}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-2 mb-8 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all flex-shrink-0
                  ${currentStep >= step 
                    ? 'bg-rose-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 9 && (
                  <div className={`w-8 h-1 mx-1 rounded-full transition-all ${
                    currentStep > step ? 'bg-rose-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Personal Information</h2>
              <p className="text-gray-600">Let's start with your basic contact information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Smith"
                icon={User}
                required
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                icon={Phone}
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com"
                  icon={Mail}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Street Address"
                  value={formData.address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="123 Main Street"
                  icon={MapPin}
                  required
                />
              </div>
              <Input
                label="City"
                value={formData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="Boston"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                value={formData.address.zip}
                onChange={(e) => handleAddressChange('zip', e.target.value)}
                placeholder="02101"
                required
              />
            </div>
          </Card>
        )}

        {/* Step 2: Service Locations */}
        {currentStep === 2 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Service Locations</h2>
              <p className="text-gray-600">First select the states you serve, then choose specific regions within those states</p>
            </div>

            <div className="space-y-8">
              {/* Step 1: Select States */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select States You Serve</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {states.map((state) => {
                    const isSelected = selectedStates.includes(state);
                    return (
                      <div
                        key={state}
                        onClick={() => handleStateToggle(state)}
                        className={`
                          relative p-3 rounded-lg border-2 cursor-pointer transition-all text-center
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                        <h4 className="font-medium text-gray-900 text-sm">{state}</h4>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Regions within Selected States */}
              {selectedStates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Step 2: Select Regions in {selectedStates.join(', ')}
                  </h3>
                  {serviceAreasLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading regions...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedStates.map((state) => {
                        const stateAreas = serviceAreas.filter(area => area.state === state);
                        if (stateAreas.length === 0) return null;
                        
                        return (
                          <div key={state}>
                            <h4 className="font-medium text-gray-800 mb-3">{state} Regions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {stateAreas.map((area) => {
                                const isSelected = formData.service_locations.includes(area.id);
                                return (
                                  <div
                                    key={area.id}
                                    onClick={() => handleServiceLocationToggle(area.id)}
                                    className={`
                                      relative p-3 rounded-lg border-2 cursor-pointer transition-all text-center
                                      ${isSelected 
                                        ? 'border-emerald-500 bg-emerald-50' 
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                      }
                                    `}
                                  >
                                    {isSelected && (
                                      <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <Check className="w-2 h-2 text-white" />
                                      </div>
                                    )}
                                    <h5 className="font-medium text-gray-900 text-sm">{area.region}</h5>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Step 3: Services */}
        {currentStep === 3 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Services You Offer</h2>
              <p className="text-gray-600">Select all the wedding services you want to provide</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceOptions.map((service) => {
                const isSelected = formData.services_applying_for.includes(service);
                return (
                  <div
                    key={service}
                    onClick={() => handleServiceToggle(service)}
                    className={`
                      relative p-6 rounded-lg border-2 cursor-pointer transition-all text-center
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <h4 className="font-medium text-gray-900">{service}</h4>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Step 4: Equipment & Gear */}
        {currentStep === 4 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Equipment & Gear</h2>
              <p className="text-gray-600">List your professional equipment and gear</p>
            </div>

            <div className="space-y-6">
              {formData.gear.map((item, index) => (
                <div key={index} className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Equipment #{index + 1}</h4>
                    <Button
                      variant="ghost"
                      icon={X}
                      size="sm"
                      onClick={() => removeGearItem(index)}
                      className="text-red-500 hover:text-red-700"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={item.gear_type}
                        onChange={(e) => handleGearChange(index, 'gear_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      >
                        <option value="">Select Type</option>
                        {gearTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Brand"
                      value={item.brand}
                      onChange={(e) => handleGearChange(index, 'brand', e.target.value)}
                      placeholder="Canon"
                      required
                    />
                    <Input
                      label="Model"
                      value={item.model}
                      onChange={(e) => handleGearChange(index, 'model', e.target.value)}
                      placeholder="EOS R5"
                      required
                    />
                    <Input
                      label="Year"
                      value={item.year}
                      onChange={(e) => handleGearChange(index, 'year', e.target.value)}
                      placeholder="2023"
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                      <select
                        value={item.condition}
                        onChange={(e) => handleGearChange(index, 'condition', e.target.value as GearItem['condition'])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      >
                        {conditionOptions.map((condition) => (
                          <option key={condition} value={condition}>{condition}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div className="text-center">
                <Button
                  variant="outline"
                  icon={Plus}
                  onClick={addGearItem}
                >
                  Add Equipment
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 5: Photo & ID Upload */}
        {currentStep === 5 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-rose-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Photo & ID Upload</h2>
              <p className="text-gray-600">Upload your profile photo and driver's license for verification</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {formData.profile_photo ? (
                    <div className="space-y-3">
                      <img
                        src={URL.createObjectURL(formData.profile_photo)}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover mx-auto"
                      />
                      <p className="text-sm text-gray-600">{formData.profile_photo.name}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload('profile_photo', null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-4">Upload a professional headshot</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            openUploadModal('profile_photo', 'Upload Profile Photo', 'Choose a professional headshot', 'image/*', 'profile');
                            handleFileUpload('profile_photo', file);
                          }
                        }}
                        className="hidden"
                        id="profile-photo"
                      />
                      <label htmlFor="profile-photo">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            openUploadModal('profile_photo', 'Upload Profile Photo', 'Choose a professional headshot', 'image/*', 'profile');
                          }}
                        >
                          Choose File
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver's License Front */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Driver's License (Front)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {formData.drivers_license_front ? (
                    <div className="space-y-3">
                      <FileText className="w-12 h-12 text-green-600 mx-auto" />
                      <p className="text-sm text-gray-600">{formData.drivers_license_front.name}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload('drivers_license_front', null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-4">Upload front of license</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            openUploadModal('drivers_license_front', 'Upload Driver\'s License (Front)', 'Upload the front side of your driver\'s license', 'image/*', 'license');
                            handleFileUpload('drivers_license_front', file);
                          }
                        }}
                        className="hidden"
                        id="license-front"
                      />
                      <label htmlFor="license-front">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            openUploadModal('drivers_license_front', 'Upload Driver\'s License (Front)', 'Upload the front side of your driver\'s license', 'image/*', 'license');
                          }}
                        >
                          Choose File
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver's License Back */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Driver's License (Back)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {formData.drivers_license_back ? (
                    <div className="space-y-3">
                      <FileText className="w-12 h-12 text-green-600 mx-auto" />
                      <p className="text-sm text-gray-600">{formData.drivers_license_back.name}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload('drivers_license_back', null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-4">Upload back of license</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            openUploadModal('drivers_license_back', 'Upload Driver\'s License (Back)', 'Upload the back side of your driver\'s license', 'image/*', 'license');
                            handleFileUpload('drivers_license_back', file);
                          }
                        }}
                        className="hidden"
                        id="license-back"
                      />
                      <label htmlFor="license-back">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            openUploadModal('drivers_license_back', 'Upload Driver\'s License (Back)', 'Upload the back side of your driver\'s license', 'image/*', 'license');
                          }}
                        >
                          Choose File
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 6: About You */}
        {currentStep === 6 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">About You</h2>
              <p className="text-gray-600">Tell us about yourself and your experience</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (minimum 50 characters)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell us about your experience, style, and what makes you unique as a wedding vendor..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
              <div className="flex justify-between mt-2">
                <p className="text-sm text-gray-500">
                  {formData.description.length}/50 minimum characters
                </p>
                <p className="text-sm text-gray-500">
                  {formData.description.length}/1000 characters
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Step 7: Portfolio Links */}
        {currentStep === 7 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link className="w-8 h-8 text-cyan-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Portfolio Links</h2>
              <p className="text-gray-600">Share links to your online portfolio, website, or social media</p>
            </div>

            <div className="space-y-4">
              {formData.work_links.map((link, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Input
                      placeholder="https://yourwebsite.com or https://instagram.com/yourhandle"
                      value={link}
                      onChange={(e) => handleWorkLinkChange(index, e.target.value)}
                      icon={Link}
                    />
                  </div>
                  {formData.work_links.length > 1 && (
                    <Button
                      variant="ghost"
                      icon={X}
                      size="sm"
                      onClick={() => removeWorkLink(index)}
                      className="text-red-500 hover:text-red-700"
                    />
                  )}
                </div>
              ))}
              
              <div className="text-center">
                <Button
                  variant="outline"
                  icon={Plus}
                  onClick={addWorkLink}
                >
                  Add Another Link
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 8: Work Samples */}
        {currentStep === 8 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Work Samples</h2>
              <div className="text-gray-600">
                Upload photos (up to 25MB) and videos (up to 500MB) showcasing your best work (maximum 10 files)
              </div>
            </div>

            <div className="space-y-6">
              {workSampleFiles.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Files ({workSampleFiles.length}/10)</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {workSampleFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            file.type.startsWith('video/') ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            {file.type.startsWith('video/') ? (
                              <Video className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Camera className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWorkSample(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWorkSampleUpload}
                  disabled={workSampleFiles.length >= 10 || uploadingWorkSamples}
                  className="flex-1"
                >
                  {workSampleFiles.length === 0 ? 'Upload Work Samples' : 'Add More Files'}
                </Button>
                {workSampleFiles.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWorkSampleFiles([])}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              {workSampleFiles.length >= 10 && (
                <p className="text-sm text-amber-600 mt-2">
                  Maximum of 10 files reached. Remove files to add different ones.
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Step 9: Review & Submit */}
        {currentStep === 9 && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Review & Submit</h2>
              <p className="text-gray-600">Please review your application before submitting</p>
            </div>

            <div className="space-y-6">
              {/* Personal Info */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{formData.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{formData.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <span className="ml-2 font-medium">
                      {formData.address.street}, {formData.address.city}, {formData.address.state} {formData.address.zip}
                    </span>
                  </div>
                </div>
              </div>

              {/* Services & Locations */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Services & Locations</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">Services:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.services_applying_for.map((service) => (
                        <span key={service} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Service Locations:</span>
                    <span className="ml-2 font-medium">{formData.service_locations.length} areas selected</span>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Equipment ({formData.gear.length} items)</h3>
                <div className="space-y-2">
                  {formData.gear.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{item.brand} {item.model}</span>
                      <span className="text-gray-600 ml-2">({item.year}, {item.condition})</span>
                    </div>
                  ))}
                  {formData.gear.length > 3 && (
                    <p className="text-sm text-gray-500">+{formData.gear.length - 3} more items</p>
                  )}
                </div>
              </div>

              {/* Files */}
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Uploaded Files</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Profile Photo:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formData.profile_photo ? '✓ Uploaded' : '✗ Missing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">License Front:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formData.drivers_license_front ? '✓ Uploaded' : '✗ Missing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">License Back:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formData.drivers_license_back ? '✓ Uploaded' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-gray-600">Work Samples:</span>
                    <span className="ml-2 font-medium">{formData.work_samples.length} files uploaded</span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-gray-600">Portfolio Links:</span>
                    <span className="ml-2 font-medium">
                      {formData.work_links.filter(link => link.trim() !== '').length} links provided
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!canProceedStep()}
                  className="px-12"
                >
                  Submit Application
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  By submitting, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation */}
        {currentStep < 9 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => currentStep === 1 ? navigate('/vendor-onboarding') : setCurrentStep(currentStep - 1)}
            >
              {currentStep === 1 ? 'Back to Info' : 'Previous'}
            </Button>
            <Button
              variant="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedStep()}
              icon={ArrowRight}
            >
              {currentStep === 8 ? 'Review Application' : 'Continue'}
            </Button>
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      {uploadModalConfig2 && (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onFileSelect={handleFileSelect}
          title={uploadModalConfig2.title}
          description={uploadModalConfig2.description}
          acceptedTypes={uploadModalConfig2.acceptedTypes}
          maxSize={uploadModalConfig2.maxSize || 50}
          currentFiles={
            uploadModalConfig2.uploadType === 'profile' ? (selectedFile ? [selectedFile] : []) :
            uploadModalConfig2.uploadType === 'work' ? workSampleFiles :
            []
          }
          uploadType={uploadModalConfig2.uploadType}
          multiple={uploadModalConfig2.multiple}
          uploading={uploadingWorkSamples}
          uploadProgress={uploadProgress}
          currentFiles={selectedFiles}
        />
      )}
    </div>
  );
};