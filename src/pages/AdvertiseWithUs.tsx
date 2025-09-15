import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, DollarSign, Image as ImageIcon, Link2, Check, User, Phone, Mail, X, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase'; // Assume Supabase client is set up

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Fixed pages and email types
const mainPages = ['Home', 'How it Works', 'Profile', 'Bookings', 'Payments', 'Blog'];
const emailTypes = [
  'Booking Confirmations',
  'Wedding Reminders',
  'Payment Notifications',
  'Welcome Emails',
  'Gallery Delivery Emails',
  'Message Notifications',
];

// Wedding photos for the new section
const weddingPhotos = [
  {
    src: 'https://images.pexels.com/photos/256737/pexels-photo-256737.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
    alt: 'Wedding couple',
    fallback: 'https://via.placeholder.com/800x600?text=Wedding+Couple',
  },
  {
    src: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
    alt: 'Wedding ceremony',
    fallback: 'https://via.placeholder.com/800x600?text=Wedding+Ceremony',
  },
  {
    src: 'https://images.pexels.com/photos/169196/pexels-photo-169196.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
    alt: 'Wedding reception',
    fallback: 'https://via.placeholder.com/800x600?text=Wedding+Reception',
  },
];

// Ad types with all price IDs, amounts, and dimension notes
const adTypes = [
  {
    name: 'Basic Ad',
    description: 'A 300×250px sidebar ad on your chosen pages.',
    dimensions: '300×250px',
    imageDimensionNote: 'Please upload an image of 300×250px.',
    monthlyPrice: 250,
    quarterlyPrice: 675,
    yearlyPrice: 2000,
    mainMonthlyPrice: 1000,
    mainQuarterlyPrice: 2700,
    mainYearlyPrice: 8000,
    serviceMonthlyPriceId: 'price_1S7IYQIEWpTafOlxFznXYHaA',
    serviceQuarterlyPriceId: 'price_1S7IZMIEWpTafOlxlGOZxf1B',
    serviceYearlyPriceId: 'price_1S7IZxIEWpTafOlxzL0PbCmW',
    mainMonthlyPriceId: 'price_1S7JTlIEWpTafOlxf7Ev5W5N',
    mainQuarterlyPriceId: 'price_1S7JUsIEWpTafOlxBSiijZ1q',
    mainYearlyPriceId: 'price_1S7JVnIEWpTafOlxZaggUNMV',
    availableOn: ['service', 'vendor', 'main'],
    requiresImage: true,
    requiresLogo: false,
    usesEmailSlots: false,
  },
  {
    name: 'Featured Ad',
    description: 'A 728×90px top banner ad + 1 email notification sponsorship.',
    dimensions: '728×90px',
    imageDimensionNote: 'Please upload an image of 728×90px.',
    monthlyPrice: 500,
    quarterlyPrice: 1350,
    yearlyPrice: 4000,
    mainMonthlyPrice: 1500,
    mainQuarterlyPrice: 4050,
    mainYearlyPrice: 12000,
    serviceMonthlyPriceId: 'price_1S7IbLIEWpTafOlxUVWD9opR',
    serviceQuarterlyPriceId: 'price_1S7Ic4IEWpTafOlx7Yk3XHbx',
    serviceYearlyPriceId: 'price_1S7IdCIEWpTafOlxao6Vxwzz',
    mainMonthlyPriceId: 'price_1S7JZVIEWpTafOlxGYKv2x8T',
    mainQuarterlyPriceId: 'price_1S7JaqIEWpTafOlxpY9rOji4',
    mainYearlyPriceId: 'price_1S7JbdIEWpTafOlxA5gQNeZw',
    availableOn: ['service', 'vendor', 'main'],
    requiresImage: true,
    requiresLogo: false,
    usesEmailSlots: true,
  },
  {
    name: 'Sponsored Ad',
    description: 'Both placements + custom email + social blast.',
    dimensions: '300×250px + 728×90px',
    imageDimensionNote: 'Please upload an image of 300×250px or 728×90px.',
    logoDimensionNote: 'Please upload a logo image (recommended 150×150px).',
    monthlyPrice: 1250,
    quarterlyPrice: 3375,
    yearlyPrice: 10000,
    mainMonthlyPrice: 2250,
    mainQuarterlyPrice: 6075,
    mainYearlyPrice: 18000,
    serviceMonthlyPriceId: 'price_1S7IeoIEWpTafOlxV163XuiU',
    serviceQuarterlyPriceId: 'price_1S7IidIEWpTafOlxxsqSTGql',
    serviceYearlyPriceId: 'price_1S7Ik9IEWpTafOlxWK89GtLB',
    mainMonthlyPriceId: 'price_1S7JcjIEWpTafOlxiuuKQ8Kq',
    mainQuarterlyPriceId: 'price_1S7JhtIEWpTafOlx4m5ht8J4',
    mainYearlyPriceId: 'price_1S7JihIEWpTafOlxW7kBQW6p',
    availableOn: ['service', 'vendor', 'main'],
    requiresImage: true,
    requiresLogo: true,
    usesEmailSlots: false,
  },
  {
    name: 'Photo Ad',
    description: '2×3 ratio photo ad on a service page (up to 5 per service).',
    dimensions: '400×600px (2×3)',
    imageDimensionNote: 'Please upload an image of 400×600px (2×3 ratio).',
    logoDimensionNote: 'Please upload a logo image (recommended 150×150px).',
    monthlyPrice: 150,
    quarterlyPrice: 405,
    yearlyPrice: 1200,
    serviceMonthlyPriceId: 'price_1S7Im8IEWpTafOlxxwT7mBne',
    serviceQuarterlyPriceId: 'price_1S7In5IEWpTafOlxL9sbidqd',
    serviceYearlyPriceId: 'price_1S7IoEIEWpTafOlxLmUPRIM8',
    availableOn: ['service'],
    requiresImage: true,
    requiresLogo: true,
    usesEmailSlots: false,
  },
  {
    name: 'Featured Photo Ad',
    description: 'Premium 2×3 ratio photo ad on a service page (1 per service).',
    dimensions: '400×600px (2×3)',
    imageDimensionNote: 'Please upload an image of 400×600px (2×3 ratio).',
    logoDimensionNote: 'Please upload a logo image (recommended 150×150px).',
    monthlyPrice: 500,
    quarterlyPrice: 1350,
    yearlyPrice: 4000,
    serviceMonthlyPriceId: 'price_1S7Ip3IEWpTafOlxdgdbPm2R',
    serviceQuarterlyPriceId: 'price_1S7JJNIEWpTafOlxve9yBlM2',
    serviceYearlyPriceId: 'price_1S7JK1IEWpTafOlxqS3fGWRw',
    availableOn: ['service'],
    requiresImage: true,
    requiresLogo: true,
    usesEmailSlots: false,
  },
  {
    name: 'Email Sponsorship',
    description: 'Sponsor specific email notifications (limited to 10 total slots).',
    dimensions: 'Custom',
    imageDimensionNote: '',
    monthlyPrice: 250,
    quarterlyPrice: 675,
    yearlyPrice: 2000,
    emailMonthlyPriceId: 'price_1S7Jm9IEWpTafOlxzSxXyemj',
    emailQuarterlyPriceId: 'price_1S7JmwIEWpTafOlxFCVwyCYy',
    emailYearlyPriceId: 'price_1S7JnfIEWpTafOlxTQT0ZtIb',
    availableOn: ['email'],
    requiresImage: false,
    requiresLogo: false,
    usesEmailSlots: true,
  },
];

interface Service {
  id: number;
  service_type: string;
  name: string;
}

interface Vendor {
  id: number;
  name: string;
}

const CheckoutForm: React.FC<{ formData: any, totalPrice: number, priceBreakdown: string[], onSuccess: () => void, onError: (error: string) => void }> = ({ formData, totalPrice, priceBreakdown, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found.');

      // Create payment method
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) throw new Error(pmError.message || 'Failed to create payment method.');

      // Create line items for subscription
      const ad = adTypes.find(a => a.name === formData.adType);
      if (!ad) throw new Error('Invalid ad type.');

      const billing = formData.billingCycle;
      const lineItems: { price: string; quantity: number }[] = [];

      if (formData.adType === 'Email Sponsorship') {
        const emailPriceId = getPriceId('email', billing, ad);
        lineItems.push({ price: emailPriceId, quantity: formData.selectedEmails.length });
      } else if (['Photo Ad', 'Featured Photo Ad'].includes(formData.adType)) {
        const photoPriceId = getPriceId('service', billing, ad);
        lineItems.push({ price: photoPriceId, quantity: formData.numPhotos });
      } else {
        const serviceCount = formData.selectedServices.length + formData.selectedVendors.length;
        if (serviceCount > 0) {
          const servicePriceId = getPriceId('service', billing, ad);
          lineItems.push({ price: servicePriceId, quantity: serviceCount });
        }
        const mainCount = formData.selectedMains.length;
        if (mainCount > 0) {
          const mainPriceId = getPriceId('main', billing, ad);
          lineItems.push({ price: mainPriceId, quantity: mainCount });
        }
      }

      // Call Supabase Edge Function to create subscription
      const response = await fetch('https://your-project-id.supabase.co/functions/v1/create-ad-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: paymentMethod!.id,
          lineItems,
          customerEmail: formData.email,
        }),
      });

      if (!response.ok) throw new Error('Failed to create subscription.');

      const { clientSecret, error: serverError } = await response.json();
      if (serverError) throw new Error(serverError);

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod!.id,
      });

      if (confirmError) throw new Error(confirmError.message || 'Payment confirmation failed.');

      // Prepare adData for success page
      const adData = {
        sponsor_name: formData.sponsorName,
        contact_name: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        page_type: formData.adType === 'Email Sponsorship' ? 'email' : ['Photo Ad', 'Featured Photo Ad'].includes(formData.adType) ? 'service' : 'mixed',
        placement_type: formData.adType,
        stripe_price_id: lineItems.map(li => li.price).join(','),
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + (billing === 'yearly' ? 12 : billing === 'quarterly' ? 3 : 1))).toISOString().split('T')[0],
        asset_url: '',
        logo_url: '',
        redirect_url: formData.redirectUrl,
        selected_pages: formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Redirect to success page
      onSuccess();
      window.location.href = `${window.location.origin}/advertise-success?adData=${encodeURIComponent(JSON.stringify(adData))}`;
    } catch (error) {
      onError((error as Error).message || 'Payment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-lg font-semibold text-gray-900 mb-2">Card Information</label>
        <div className="p-3 border border-gray-300 rounded-lg">
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } } } }} />
        </div>
        {cardError && <p className="text-red-500 text-sm mt-1">{cardError}</p>}
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="w-full bg-rose-500 text-white hover:bg-rose-600"
        disabled={isProcessing}
        icon={CreditCard}
      >
        {isProcessing ? 'Processing...' : `Pay Now - $${totalPrice.toFixed(2)}`}
      </Button>
    </form>
  );
};

export const AdvertiseWithUs: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sponsorName: '',
    contactName: '',
    phone: '',
    email: '',
    adType: '',
    billingCycle: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    redirectUrl: '',
    image: null as File | null,
    logo: null as File | null,
    selectedServices: [] as number[],
    selectedVendors: [] as number[],
    selectedMains: [] as string[],
    selectedEmails: [] as string[],
    selectedService: null as number | null,
    numPhotos: 1,
    agreedToTerms: false,
    pageType: 'service' as 'service' | 'vendor' | 'main',
  });
  const [services, setServices] = useState<Service[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    fetchData();
    calculateTotal();
  }, [formData.adType, formData.billingCycle, formData.selectedServices, formData.selectedVendors, formData.selectedMains, formData.selectedEmails, formData.selectedService, formData.numPhotos]);

  const fetchData = async () => {
    const { data: serviceData, error: serviceError } = await supabase.from('service_packages').select('id, service_type, name');
    if (serviceError) console.error('Error fetching services:', serviceError);
    else setServices(serviceData || []);

    const { data: vendorData, error: vendorError } = await supabase.from('vendors').select('id, name');
    if (vendorError) console.error('Error fetching vendors:', vendorError);
    else setVendors(vendorData || []);
  };

  const handleInputChange = (field: string, value: string | File | null | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'image' && value instanceof File) {
      setImagePreview(URL.createObjectURL(value));
    } else if (field === 'image' && !value) {
      setImagePreview(null);
    }
    if (field === 'logo' && value instanceof File) {
      setLogoPreview(URL.createObjectURL(value));
    } else if (field === 'logo' && !value) {
      setLogoPreview(null);
    }
  };

  const handleCheckboxChange = (field: 'selectedServices' | 'selectedVendors' | 'selectedMains' | 'selectedEmails', value: number | string) => {
    setFormData(prev => {
      const current = prev[field] as (number | string)[];
      const newSelected = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [field]: newSelected };
    });
    if (errors[field as keyof typeof errors] || errors.pages) setErrors(prev => ({ ...prev, [field]: '', pages: '' }));
  };

  const handleServiceRadioChange = (serviceId: number) => {
    setFormData(prev => ({ ...prev, selectedService: prev.selectedService === serviceId ? null : serviceId }));
    if (errors.selectedService) setErrors(prev => ({ ...prev, selectedService: '' }));
  };

  const calculateTotal = () => {
    const ad = adTypes.find(a => a.name === formData.adType);
    if (!ad) {
      setTotalPrice(0);
      setPriceBreakdown([]);
      return;
    }

    const billing = formData.billingCycle;
    let total = 0;
    const breakdown: string[] = [];
    let usedEmailSlots = 0;

    if (formData.adType === 'Email Sponsorship') {
      const emailCount = formData.selectedEmails.length;
      const emailPrice = billing === 'monthly' ? ad.monthlyPrice : billing === 'quarterly' ? ad.quarterlyPrice : ad.yearlyPrice;
      total = emailCount * emailPrice;
      breakdown.push(`${emailCount} Email Type${emailCount !== 1 ? 's' : ''} @ $${emailPrice} = $${total}`);
      usedEmailSlots = emailCount;
    } else if (['Photo Ad', 'Featured Photo Ad'].includes(formData.adType)) {
      if (formData.selectedService) {
        const num = formData.numPhotos;
        const photoPrice = billing === 'monthly' ? ad.monthlyPrice : billing === 'quarterly' ? ad.quarterlyPrice : ad.yearlyPrice;
        total = num * photoPrice;
        const service = services.find(s => s.id === formData.selectedService);
        if (service) {
          breakdown.push(`${num} Photo${num > 1 ? 's' : ''} on ${service.service_type} - ${service.name} @ $${photoPrice} = $${total}`);
        }
      }
      usedEmailSlots = 0;
    } else {
      const serviceCount = formData.selectedServices.length + formData.selectedVendors.length;
      const mainCount = formData.selectedMains.length;
      const servicePrice = billing === 'monthly' ? ad.monthlyPrice : billing === 'quarterly' ? ad.quarterlyPrice : ad.yearlyPrice;
      const mainPrice = billing === 'monthly' ? ad.mainMonthlyPrice : billing === 'quarterly' ? ad.mainQuarterlyPrice : ad.yearlyPrice;
      const serviceTotal = serviceCount * servicePrice;
      const mainTotal = mainCount * mainPrice;
      total = serviceTotal + mainTotal;
      if (serviceCount > 0) breakdown.push(`${serviceCount} Service/Vendor Page${serviceCount !== 1 ? 's' : ''} @ $${servicePrice} = $${serviceTotal}`);
      if (mainCount > 0) breakdown.push(`${mainCount} Main Page${mainCount !== 1 ? 's' : ''} @ $${mainPrice} = $${mainTotal}`);
      if (formData.adType === 'Featured Ad') usedEmailSlots = serviceCount + mainCount;
    }

    setTotalPrice(total);
    setPriceBreakdown(breakdown);
  };

  const getPriceId = (category: 'service' | 'main' | 'email', billing: string, ad: typeof adTypes[0]) => {
    const key = `${category}${billing.charAt(0).toUpperCase() + billing.slice(1)}PriceId` as keyof typeof ad;
    return ad[key] as string;
  };

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};
    if (step === 0) {
      if (!formData.sponsorName) newErrors.sponsorName = 'Company name is required.';
      if (!formData.contactName) newErrors.contactName = 'Contact name is required.';
      if (!formData.phone || !/^\+?\d{10,15}$/.test(formData.phone)) newErrors.phone = 'Valid phone number is required (e.g., +1234567890).';
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required.';
      if (!formData.redirectUrl || !/^(https?:\/\/)/i.test(formData.redirectUrl)) newErrors.redirectUrl = 'Valid redirect URL is required.';
    } else if (step === 1) {
      if (!formData.adType) newErrors.adType = 'Ad type is required.';
    } else if (step === 2) {
      if (!formData.billingCycle) newErrors.billingCycle = 'Billing cycle is required.';
    } else if (step === 3) {
      if (formData.adType === 'Email Sponsorship') {
        if (formData.selectedEmails.length === 0) newErrors.selectedEmails = 'Select at least one email type.';
      } else if (['Photo Ad', 'Featured Photo Ad'].includes(formData.adType)) {
        if (!formData.selectedService) newErrors.selectedService = 'Select a service.';
        const maxPhotos = formData.adType === 'Photo Ad' ? 5 : 1;
        if (formData.numPhotos > maxPhotos || formData.numPhotos < 1) newErrors.numPhotos = `Number of photos must be between 1 and ${maxPhotos}.`;
      } else {
        const totalPages = formData.selectedServices.length + formData.selectedVendors.length + formData.selectedMains.length;
        if (totalPages === 0) newErrors.pages = 'Select at least one page.';
      }
    } else if (step == 4) {
      const ad = adTypes.find(a => a.name === formData.adType);
      if (ad?.requiresImage && !formData.image) newErrors.image = 'Ad image is required.';
      if (ad?.requiresLogo && !formData.logo) newErrors.logo = 'Logo is required.';
    } else if (step === 5) {
      if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkAvailability = async () => {
    const ad = adTypes.find(a => a.name === formData.adType);
    if (!ad) return false;
    let usedEmailSlots = 0;
    if (formData.adType === 'Email Sponsorship') {
      usedEmailSlots = formData.selectedEmails.length;
    } else if (formData.adType === 'Featured Ad') {
      usedEmailSlots = formData.selectedServices.length + formData.selectedVendors.length + formData.selectedMains.length;
    }
    if (usedEmailSlots > 10) return false;
    if (['Photo Ad'].includes(formData.adType) && formData.numPhotos > 5) return false;
    if (formData.adType === 'Featured Photo Ad' && formData.numPhotos > 1) return false;
    // Mock DB check for slot availability
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      const ad = adTypes.find(a => a.name === formData.adType);
      if (currentStep === 3 && !ad?.requiresImage && !ad?.requiresLogo) {
        setCurrentStep(5); // Skip upload step if no image/logo required
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 6) {
      const ad = adTypes.find(a => a.name === formData.adType);
      if (!ad?.requiresImage && !ad?.requiresLogo) {
        setCurrentStep(3); // Skip upload step
      } else {
        setCurrentStep(prev => prev - 1);
      }
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallback: string) => {
    e.currentTarget.src = fallback;
  };

  const openFormModal = (adType: string) => {
    setFormData(prev => ({ ...prev, adType }));
    setIsModalOpen(true);
    setCurrentStep(0);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStep(0);
    setErrors({});
    setFormData(prev => ({ ...prev, agreedToTerms: false }));
  };

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
  };

  const handlePaymentError = (error: string) => {
    setErrors(prev => ({ ...prev, general: error }));
  };

  const isPhotoAd = ['Photo Ad', 'Featured Photo Ad'].includes(formData.adType);
  const isEmailAd = formData.adType === 'Email Sponsorship';
  const ad = adTypes.find(a => a.name === formData.adType);

  const steps = [
    'Company Information',
    'Ad Type',
    'Billing Cycle',
    'Page Selection',
    'Uploads',
    'Contract Agreement',
    'Review and Confirm',
  ];

  const contractText = `
**B. Remembered Advertising Agreement**

By advertising with B. Remembered, you agree to the following terms:

1. **Payment**: You agree to pay the advertised rates for the selected ad type and billing cycle. Payments are non-refundable once the ad is published.
2. **Content**: All provided images and logos must comply with our content guidelines. B. Remembered reserves the right to reject or remove ads that violate these guidelines.
3. **Placement**: Ad placements are subject to availability and may be adjusted based on platform requirements.
4. **Term**: The ad will run for the selected billing cycle (monthly, quarterly, or yearly) starting from the payment date.
5. **Liability**: B. Remembered is not liable for any losses or damages resulting from ad publication or platform downtime.

By checking the box below, you acknowledge that you have read, understood, and agree to these terms.
  `;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Star className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Advertise with B. Remembered
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Reach 600–800 couples yearly and 200–500 daily site visitors with targeted ads.
          </p>
          <Button
            onClick={() => document.getElementById('ad-types')?.scrollIntoView({ behavior: 'smooth' })}
            variant="secondary"
            size="lg"
            className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-gray-900 shadow-xl"
            icon={ArrowRight}
          >
            Explore Options
          </Button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Why Advertise */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Advertise with Us?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Targeted reach to wedding planners with growth to 1,000–5,000 couples in 2 years.</p>
          </div>
          <Card className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 text-center">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Star className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">High Visibility</h3>
                <p className="text-gray-700">200–500 daily views across pages.</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Flexible Plans</h3>
                <p className="text-gray-700">Monthly, quarterly (10% off), yearly (20% off).</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Star className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Trusted Platform</h3>
                <p className="text-gray-700">4.9 stars, 600–800 annual bookings.</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Wedding Photos Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Inspire Your Audience</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Connect with couples through the magic of weddings with our visually stunning ad placements.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weddingPhotos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-64 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
                  onError={(e) => handleImageError(e, photo.fallback)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Advertising Opportunities */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Advertising Opportunities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Discover how our vibrant ad placements can connect you directly with engaged couples and vendors.</p>
          </div>
          <Card className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                <span className="text-rose-600 font-semibold">Reach Couples Directly on Vendor Pages:</span> Advertise on individual vendor pages to target couples actively exploring specific wedding vendors. This placement puts your ad in front of users who are researching photographers, florists, caterers, and more, ensuring your message reaches a highly engaged audience ready to book complementary services.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                <span className="text-amber-600 font-semibold">Service Pages for Focused Exposure:</span> Place your ad on service-specific pages, such as Photography, Videography, or Catering, to connect with couples searching for particular wedding services. This targeted approach ensures your brand is visible at the exact moment couples are planning key aspects of their big day, maximizing your impact.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                <span className="text-emerald-600 font-semibold">Main Pages for Broad Reach:</span> Capture a wide audience by advertising on our high-traffic main pages, including Home, How it Works, Profile, Bookings, Payments, and Blog. These pages attract a diverse group of users, from couples starting their planning to those finalizing details, offering unmatched visibility for your brand.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                <span className="text-rose-600 font-semibold">Sponsor Notifications for Ongoing Engagement:</span> Sponsor our email notifications, such as Booking Confirmations, Wedding Reminders, Payment Notifications, Welcome Emails, Gallery Delivery Emails, and Message Notifications. With our Sponsored Ad option, you can also craft custom emails sent before, on, or after the couple’s wedding, creating personalized touchpoints that build lasting connections and drive engagement.
              </p>
            </div>
          </Card>
        </section>

        {/* Ad Types */}
        <section id="ad-types" className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ad Options</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Select an ad type to get started.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {adTypes.map((ad) => (
              <Card key={ad.name} className="bg-gradient-to-br from-rose-100 to-amber-100 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow space-y-4">
                <h3 className="text-2xl font-bold text-rose-600 mb-2">{ad.name}</h3>
                <p className="text-base font-medium text-gray-700">{ad.description}</p>
                <p className="text-base font-medium text-gray-700"><span className="text-emerald-600">Dimensions:</span> {ad.dimensions}</p>
                <div className="space-y-2">
                  <div className="flex justify-center space-x-2">
                    {['monthly', 'quarterly', 'yearly'].map((cycle) => (
                      <button
                        key={cycle}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${formData.billingCycle === cycle ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        onClick={() => handleInputChange('billingCycle', cycle)}
                      >
                        {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {ad.availableOn.includes('service') || ad.availableOn.includes('vendor') ? (
                      <>
                        <p><span className="text-amber-600">Service/Vendor:</span> ${formData.billingCycle === 'monthly' ? ad.monthlyPrice : formData.billingCycle === 'quarterly' ? ad.quarterlyPrice : ad.yearlyPrice}/{formData.billingCycle}</p>
                      </>
                    ) : null}
                    {ad.availableOn.includes('main') ? (
                      <>
                        <p><span className="text-amber-600">Main Pages:</span> ${formData.billingCycle === 'monthly' ? ad.mainMonthlyPrice : formData.billingCycle === 'quarterly' ? ad.mainQuarterlyPrice : ad.mainYearlyPrice}/{formData.billingCycle}</p>
                      </>
                    ) : null}
                    {ad.availableOn.includes('email') ? (
                      <>
                        <p><span className="text-amber-600">Email:</span> ${formData.billingCycle === 'monthly' ? ad.monthlyPrice : formData.billingCycle === 'quarterly' ? ad.quarterlyPrice : ad.yearlyPrice}/{formData.billingCycle}</p>
                      </>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="w-full bg-rose-500 text-white hover:bg-rose-600 mt-6"
                  onClick={() => openFormModal(ad.name)}
                >
                  Select {ad.name}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Wizard-Style Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg bg-white p-6 rounded-lg relative max-h-[80vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{steps[currentStep]}</h2>
            {errors.general && <p className="text-red-500 text-center mb-4">{errors.general}</p>}
            <div className="space-y-4">
              {currentStep === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      className={`w-full p-3 pl-10 border rounded-lg ${errors.sponsorName ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.sponsorName}
                      onChange={(e) => handleInputChange('sponsorName', e.target.value)}
                      placeholder="Encore Mortgage"
                    />
                  </div>
                  {errors.sponsorName && <p className="text-red-500 text-sm mt-1">{errors.sponsorName}</p>}

                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Contact Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      className={`w-full p-3 pl-10 border rounded-lg ${errors.contactName ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}

                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      className={`w-full p-3 pl-10 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}

                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      className={`w-full p-3 pl-10 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@company.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}

                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Redirect URL</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      className={`w-full p-3 pl-10 border rounded-lg ${errors.redirectUrl ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.redirectUrl}
                      onChange={(e) => handleInputChange('redirectUrl', e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  {errors.redirectUrl && <p className="text-red-500 text-sm mt-1">{errors.redirectUrl}</p>}
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">Ad Type</label>
                  <select
                    className={`w-full p-3 border rounded-lg ${errors.adType ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.adType}
                    onChange={(e) => handleInputChange('adType', e.target.value)}
                  >
                    <option value="">Select ad type</option>
                    {adTypes.map(ad => (
                      <option key={ad.name} value={ad.name}>{ad.name}</option>
                    ))}
                  </select>
                  {errors.adType && <p className="text-red-500 text-sm mt-1">{errors.adType}</p>}
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">Billing Cycle</label>
                  <select
                    className={`w-full p-3 border rounded-lg ${errors.billingCycle ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.billingCycle}
                    onChange={(e) => handleInputChange('billingCycle', e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly (Save 10%)</option>
                    <option value="yearly">Yearly (Save 20%)</option>
                  </select>
                  {errors.billingCycle && <p className="text-red-500 text-sm mt-1">{errors.billingCycle}</p>}
                  {ad && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h3 className="text-md font-semibold text-gray-900 mb-2">Pricing for {ad.name}</h3>
                      {ad.availableOn.includes('service') || ad.availableOn.includes('vendor') ? (
                        <div className="text-sm text-gray-700">
                          <p><strong>Service/Vendor Pages:</strong></p>
                          <p>Monthly: <span className="text-amber-600">${ad.monthlyPrice}</span></p>
                          <p>Quarterly: <span className="text-amber-600">${ad.quarterlyPrice}</span> <span className="text-rose-500">(Save 10%)</span></p>
                          <p>Yearly: <span className="text-amber-600">${ad.yearlyPrice}</span> <span className="text-rose-500">(Save 20%)</span></p>
                        </div>
                      ) : null}
                      {ad.availableOn.includes('main') ? (
                        <div className="text-sm text-gray-700 mt-2">
                          <p><strong>Main Pages:</strong></p>
                          <p>Monthly: <span className="text-amber-600">${ad.mainMonthlyPrice}</span></p>
                          <p>Quarterly: <span className="text-amber-600">${ad.mainQuarterlyPrice}</span> <span className="text-rose-500">(Save 10%)</span></p>
                          <p>Yearly: <span className="text-amber-600">${ad.mainYearlyPrice}</span> <span className="text-rose-500">(Save 20%)</span></p>
                        </div>
                      ) : null}
                      {ad.availableOn.includes('email') ? (
                        <div className="text-sm text-gray-700 mt-2">
                          <p><strong>Email Sponsorship:</strong></p>
                          <p>Monthly: <span className="text-amber-600">${ad.monthlyPrice}</span></p>
                          <p>Quarterly: <span className="text-amber-600">${ad.quarterlyPrice}</span> <span className="text-rose-500">(Save 10%)</span></p>
                          <p>Yearly: <span className="text-amber-600">${ad.yearlyPrice}</span> <span className="text-rose-500">(Save 20%)</span></p>
                        </div>
                      ) : null}
                      {(formData.adType === 'Email Sponsorship' && formData.selectedEmails.length > 0) ||
                      (['Photo Ad', 'Featured Photo Ad'].includes(formData.adType) && formData.selectedService && formData.numPhotos > 0) ||
                      (!['Email Sponsorship', 'Photo Ad', 'Featured Photo Ad'].includes(formData.adType) &&
                        (formData.selectedServices.length > 0 || formData.selectedVendors.length > 0 || formData.selectedMains.length > 0)) ? (
                        <div className="mt-2 text-sm text-gray-700">
                          <p><strong>Current Total ({formData.billingCycle}):</strong> <span className="text-amber-600">${totalPrice.toFixed(2)}</span></p>
                          {priceBreakdown.map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-700 italic">Total will be calculated after selecting pages or services.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  {isEmailAd && (
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-2">Email Types</label>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-4">
                        {emailTypes.map(e => (
                          <label key={e} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                            <input
                              type="checkbox"
                              value={e}
                              checked={formData.selectedEmails.includes(e)}
                              onChange={() => handleCheckboxChange('selectedEmails', e)}
                              className="rounded"
                            />
                            <span className="text-gray-700">{e}</span>
                          </label>
                        ))}
                      </div>
                      {errors.selectedEmails && <p className="text-red-500 text-sm mt-1">{errors.selectedEmails}</p>}
                    </div>
                  )}

                  {isPhotoAd && (
                    <>
                      <label className="block text-lg font-semibold text-gray-900 mb-2">Select Service</label>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-4">
                        {services.map(s => (
                          <label
                            key={s.id}
                            className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${formData.selectedService === s.id ? 'bg-rose-100 border-rose-500' : 'hover:bg-gray-100'}`}
                          >
                            <input
                              type="radio"
                              value={s.id}
                              checked={formData.selectedService === s.id}
                              onChange={() => handleServiceRadioChange(s.id)}
                              className="rounded"
                            />
                            <span className="text-gray-700">{s.service_type} - {s.name}</span>
                            {formData.selectedService === s.id && <Check className="w-5 h-5 text-rose-500" />}
                          </label>
                        ))}
                      </div>
                      {errors.selectedService && <p className="text-red-500 text-sm mt-1">{errors.selectedService}</p>}

                      <label className="block text-lg font-semibold text-gray-900 mb-2 mt-4">Number of Photos</label>
                      <input
                        type="number"
                        min="1"
                        max={formData.adType === 'Photo Ad' ? 5 : 1}
                        className={`w-full p-3 border rounded-lg ${errors.numPhotos ? 'border-red-500' : 'border-gray-300'}`}
                        value={formData.numPhotos}
                        onChange={(e) => handleInputChange('numPhotos', parseInt(e.target.value) || 1)}
                      />
                      {errors.numPhotos && <p className="text-red-500 text-sm mt-1">{errors.numPhotos}</p>}
                    </>
                  )}

                  {!isEmailAd && !isPhotoAd && (
                    <>
                      <label className="block text-lg font-semibold text-gray-900 mb-2">Select Page Type</label>
                      <select
                        className={`w-full p-3 border rounded-lg ${errors.pageType ? 'border-red-500' : 'border-gray-300'}`}
                        value={formData.pageType}
                        onChange={(e) => handleInputChange('pageType', e.target.value)}
                      >
                        <option value="service">Service Pages</option>
                        <option value="vendor">Vendor Pages</option>
                        <option value="main">Main Pages</option>
                      </select>
                      {errors.pageType && <p className="text-red-500 text-sm mt-1">{errors.pageType}</p>}

                      <div className="mt-4">
                        {formData.pageType === 'service' && (
                          <div>
                            <label className="block text-lg font-semibold text-gray-900 mb-2">Service Pages</label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-4">
                              {services.map(s => (
                                <label key={s.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                                  <input
                                    type="checkbox"
                                    value={s.id}
                                    checked={formData.selectedServices.includes(s.id)}
                                    onChange={() => handleCheckboxChange('selectedServices', s.id)}
                                    className="rounded"
                                  />
                                  <span className="text-gray-700">{s.service_type} - {s.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {formData.pageType === 'vendor' && (
                          <div>
                            <label className="block text-lg font-semibold text-gray-900 mb-2">Vendor Pages</label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-4">
                              {vendors.map(v => (
                                <label key={v.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                                  <input
                                    type="checkbox"
                                    value={v.id}
                                    checked={formData.selectedVendors.includes(v.id)}
                                    onChange={() => handleCheckboxChange('selectedVendors', v.id)}
                                    className="rounded"
                                  />
                                  <span className="text-gray-700">{v.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {formData.pageType === 'main' && (
                          <div>
                            <label className="block text-lg font-semibold text-gray-900 mb-2">Main Pages</label>
                            <div className="grid grid-cols-1 gap-2 border border-gray-300 rounded-lg p-4">
                              {mainPages.map(p => (
                                <label key={p} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100">
                                  <input
                                    type="checkbox"
                                    value={p}
                                    checked={formData.selectedMains.includes(p)}
                                    onChange={() => handleCheckboxChange('selectedMains', p)}
                                    className="rounded"
                                  />
                                  <span className="text-gray-700">{p}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {errors.pages && <p className="text-red-500 text-sm mt-1">{errors.pages}</p>}
                      </div>
                    </>
                  )}
                </div>
              )}

              {currentStep === 4 && (ad?.requiresImage || ad?.requiresLogo) && (
                <div>
                  {ad?.requiresImage && (
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-2">Ad Image</label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="file"
                          accept="image/*"
                          className={`w-full p-3 pl-10 border rounded-lg ${errors.image ? 'border-red-500' : 'border-gray-300'}`}
                          onChange={(e) => handleInputChange('image', e.target.files?.[0] || null)}
                        />
                      </div>
                      {ad.imageDimensionNote && <p className="text-gray-600 text-sm mt-1">{ad.imageDimensionNote}</p>}
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mt-4 w-32 h-auto rounded-lg"
                          onError={(e) => handleImageError(e, 'https://via.placeholder.com/300x250?text=Preview+Failed')}
                        />
                      )}
                      {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
                    </div>
                  )}

                  {ad?.requiresLogo && (
                    <div className="mt-4">
                      <label className="block text-lg font-semibold text-gray-900 mb-2">Logo</label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="file"
                          accept="image/*"
                          className={`w-full p-3 pl-10 border rounded-lg ${errors.logo ? 'border-red-500' : 'border-gray-300'}`}
                          onChange={(e) => handleInputChange('logo', e.target.files?.[0] || null)}
                        />
                      </div>
                      {ad.logoDimensionNote && <p className="text-gray-600 text-sm mt-1">{ad.logoDimensionNote}</p>}
                      {logoPreview && (
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="mt-4 w-32 h-auto rounded-lg"
                          onError={(e) => handleImageError(e, 'https://via.placeholder.com/150x150?text=Logo+Failed')}
                        />
                      )}
                      {errors.logo && <p className="text-red-500 text-sm mt-1">{errors.logo}</p>}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 5 && (
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">Contract Agreement</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{contractText}</p>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-gray-700">I agree to the terms and conditions</span>
                  </label>
                  {errors.agreedToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreedToTerms}</p>}
                </div>
              )}

              {currentStep === 6 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Summary</h3>
                  <Card className="p-4 bg-amber-50 border-amber-200 mb-4">
                    <p className="text-sm text-gray-700"><strong>Ad Type:</strong> {formData.adType}</p>
                    <p className="text-sm text-gray-700"><strong>Billing Cycle:</strong> {formData.billingCycle.charAt(0).toUpperCase() + formData.billingCycle.slice(1)}</p>
                    {isEmailAd && (
                      <p className="text-sm text-gray-700"><strong>Email Types:</strong> {formData.selectedEmails.join(', ') || 'None'}</p>
                    )}
                    {isPhotoAd && (
                      <>
                        <p className="text-sm text-gray-700"><strong>Service:</strong> {services.find(s => s.id === formData.selectedService)?.service_type} - {services.find(s => s.id === formData.selectedService)?.name}</p>
                        <p className="text-sm text-gray-700"><strong>Number of Photos:</strong> {formData.numPhotos}</p>
                      </>
                    )}
                    {!isEmailAd && !isPhotoAd && (
                      <>
                        <p className="text-sm text-gray-700"><strong>Service Pages:</strong> {formData.selectedServices.map(id => services.find(s => s.id === id)?.name).join(', ') || 'None'}</p>
                        <p className="text-sm text-gray-700"><strong>Vendor Pages:</strong> {formData.selectedVendors.map(id => vendors.find(v => v.id === id)?.name).join(', ') || 'None'}</p>
                        <p className="text-sm text-gray-700"><strong>Main Pages:</strong> {formData.selectedMains.join(', ') || 'None'}</p>
                      </>
                    )}
                    {priceBreakdown.map((line, i) => (
                      <p key={i} className="text-sm text-gray-700">{line}</p>
                    ))}
                    <p className="text-lg font-bold text-gray-900 mt-2">Total: ${totalPrice.toFixed(2)}</p>
                  </Card>
                  <Elements stripe={stripePromise}>
                    <CheckoutForm
                      formData={formData}
                      totalPrice={totalPrice}
                      priceBreakdown={priceBreakdown}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={handlePrevStep}
                  icon={ChevronLeft}
                >
                  Back
                </Button>
              )}
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                {currentStep < 6 && (
                  <Button
                    variant="secondary"
                    className="bg-rose-500 text-white hover:bg-rose-600"
                    onClick={handleNextStep}
                    icon={ChevronRight}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};