import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, CheckCircle, Search, Plus, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../context/AuthContext';

interface ServicePackage {
  id: string;
  service_type: string;
  name: string;
}

interface Venue {
  id: string;
  name: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  region?: string;
}

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: { id: string; name: string };
  servicePackages: ServicePackage[];
  onSubmit: (data: { coupleId: string; partner1Name: string }) => void;
}

const referralOptions = ["Website", "Google", "Phone", "WeddingWire", "B Remembered", "The Knot", "Zola", "Couple", "Other"];
const coverageOptions = [
  "Rehearsal Dinner",
  "Getting Ready",
  "First Look",
  "Ceremony",
  "Cocktail Hour",
  "Introductions",
  "First Dance",
  "Dinner",
  "Parent Dances",
  "Bouquet Toss",
  "Dancing",
  "After Party",
  "Brunch",
];

const states = ['MA', 'RI', 'NH', 'CT', 'ME', 'VT'];

const InquiryModal: React.FC<InquiryModalProps> = ({ isOpen, onClose, vendor, servicePackages, onSubmit }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [newVenue, setNewVenue] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    zip: '',
    region: '',
    contact_name: '',
    phone: '',
    email: ''
  });
  const [inquiryForm, setInquiryForm] = useState({
    partner1Name: '',
    partner2Name: '',
    email: '',
    phone: '',
    serviceType: '',
    packageId: '',
    message: '',
    weddingDate: '',
    termsAccepted: false,
    hoursNeeded: 8,
    coverageEvents: [] as string[],
    referral: 'Website',
    referralCoupleName: '',
    venueId: '',
    guestCount: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [inquiryResult, setInquiryResult] = useState<'existing' | 'new' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('InquiryModal opened, fetching venues');
      fetchVenues();
      if (user) {
        fetchCoupleData();
      }
    }
  }, [isOpen, user]);

  const fetchCoupleData = async () => {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select('partner1_name, partner2_name, email, wedding_date, venue_id, guest_count')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;

      setInquiryForm(prev => ({
        ...prev,
        partner1Name: data.partner1_name || '',
        partner2Name: data.partner2_name || '',
        email: data.email || '',
        weddingDate: data.wedding_date ? new Date(data.wedding_date).toISOString().split('T')[0] : '',
        venueId: data.venue_id || '',
        guestCount: data.guest_count ? data.guest_count.toString() : ''
      }));
      console.log('Auto-filled couple data:', data);
    } catch (error) {
      console.error('Error fetching couple data:', error);
      setFormError('Failed to fetch your account details. Please fill in manually.');
    }
  };

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, street_address, city, state, zip, region')
        .ilike('name', `%${venueSearch}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      setVenues(data || []);
      console.log('Fetched venues:', data);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setVenues([]);
    }
  };

  const handleCreateVenue = async () => {
    try {
      const venueData = {
        name: newVenue.name,
        street_address: newVenue.street_address || null,
        city: newVenue.city || null,
        state: newVenue.state || null,
        zip: newVenue.zip || null,
        region: newVenue.region,
        contact_name: newVenue.contact_name || null,
        phone: newVenue.phone || null,
        email: newVenue.email || null
      };

      const { data, error } = await supabase
        .from('venues')
        .insert([venueData])
        .select()
        .single();

      if (error) throw error;

      setVenues(prev => [...prev, data]);
      setInquiryForm(prev => ({ ...prev, venueId: data.id }));
      setShowVenueForm(false);
      setNewVenue({
        name: '',
        street_address: '',
        city: '',
        state: '',
        zip: '',
        region: '',
        contact_name: '',
        phone: '',
        email: ''
      });
      console.log('Created new venue:', data);
    } catch (error) {
      console.error('Error creating venue:', error);
      setFormError('Failed to create venue. Please try again.');
    }
  };

  const validateWeddingDate = (date: string) => {
    if (!date) {
      return 'Wedding date is required';
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Invalid wedding date format';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return 'Wedding date cannot be in the past';
    }
    return null;
  };

  const handleCoverageChange = (event: string, checked: boolean) => {
    setInquiryForm(prev => ({
      ...prev,
      coverageEvents: checked
        ? [...prev.coverageEvents, event]
        : prev.coverageEvents.filter(c => c !== event),
    }));
  };

  const createConversationAndMessage = async (coupleId: string, senderId: string, messageText: string) => {
    try {
      // Fetch vendor's user_id
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('user_id')
        .eq('id', vendor.id)
        .single();

      if (vendorError) throw new Error('Error fetching vendor user_id: ' + vendorError.message);

      const vendorUserId = vendorData.user_id;

      // Create conversation
      const participantIds = [senderId, vendorUserId].sort();
      const { data: convData, error: convError } = await supabase
        .rpc('create_conversation_with_participants', {
          p_is_group: false,
          p_name: null,
          p_participant_ids: participantIds,
        });

      if (convError) throw new Error('Error creating conversation: ' + convError.message);

      const conversationId = convData?.[0]?.conversation_id;
      if (!conversationId) throw new Error('No conversation ID returned');

      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          conversation_id: conversationId,
          message_text: messageText || 'No message provided.',
          image_url: null,
        })
        .select('id, sender_id, conversation_id, message_text, timestamp')
        .single();

      if (messageError) throw new Error('Error sending message: ' + messageError.message);

      console.log('Created conversation and message:', { conversationId, messageData });
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation and message:', error);
      throw error;
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setInquiryResult(null);

    if (currentStep === 1) {
      if (!inquiryForm.partner1Name || !inquiryForm.partner2Name || !inquiryForm.email || !inquiryForm.weddingDate) {
        setFormError('Please fill in all required fields in Step 1.');
        return;
      }
      const dateError = validateWeddingDate(inquiryForm.weddingDate);
      if (dateError) {
        setFormError(dateError);
        return;
      }
      console.log('Advancing from Step 1 to Step 2');
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      console.log('Advancing from Step 2 to Step 3');
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!inquiryForm.serviceType || !inquiryForm.hoursNeeded || !inquiryForm.referral || (inquiryForm.referral === 'Couple' && !inquiryForm.referralCoupleName) || !inquiryForm.termsAccepted) {
        setFormError('Please fill in all required fields and accept the Terms of Service.');
        return;
      }

      try {
        let coupleId: string;
        let partner1Name: string;
        let senderId: string;

        if (user) {
          const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('id, partner1_name, user_id')
            .eq('user_id', user.id)
            .single();

          if (coupleError) throw new Error('Error fetching couple data: ' + coupleError.message);

          coupleId = coupleData.id;
          partner1Name = coupleData.partner1_name;
          senderId = coupleData.user_id;

          await supabase.from('vendor_leads').insert({
            vendor_id: vendor.id,
            couple_id: coupleId,
            service_type: inquiryForm.serviceType,
            hours_needed: inquiryForm.hoursNeeded,
            coverage_events: inquiryForm.coverageEvents,
            inquiry_message: inquiryForm.message || 'No message provided.',
            referral: inquiryForm.referral,
            referral_couple_name: inquiryForm.referral === 'Couple' ? inquiryForm.referralCoupleName : null,
            venue_id: inquiryForm.venueId || null,
            guest_count: inquiryForm.guestCount ? parseInt(inquiryForm.guestCount) : null,
          });

          await supabase.from('vendor_contacts').insert({
            vendor_id: vendor.id,
            couple_id: coupleId,
          });

          if (inquiryForm.message) {
            await createConversationAndMessage(coupleId, senderId, inquiryForm.message);
          }

          setInquiryResult('existing');
          setFormSuccess(`Thank you ${partner1Name} for inquiring, you can message this vendor and continue the conversation in your profile.`);
          setTimeout(() => {
            setInquiryForm({
              partner1Name: '',
              partner2Name: '',
              email: '',
              phone: '',
              serviceType: '',
              packageId: '',
              message: '',
              weddingDate: '',
              termsAccepted: false,
              hoursNeeded: 8,
              coverageEvents: [],
              referral: 'Website',
              referralCoupleName: '',
              venueId: '',
              guestCount: ''
            });
            setCurrentStep(1);
            onClose();
            onSubmit({ coupleId, partner1Name });
          }, 3000);
        } else {
          const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('id, partner1_name')
            .eq('email', inquiryForm.email)
            .single();

          if (coupleError && coupleError.code !== 'PGRST116') {
            throw new Error('Error checking couple data: ' + coupleError.message);
          }

          if (coupleData) {
            coupleId = coupleData.id;
            partner1Name = coupleData.partner1_name;

            await supabase.from('vendor_leads').insert({
              vendor_id: vendor.id,
              couple_id: coupleId,
              service_type: inquiryForm.serviceType,
              hours_needed: inquiryForm.hoursNeeded,
              coverage_events: inquiryForm.coverageEvents,
              inquiry_message: inquiryForm.message || 'No message provided.',
              referral: inquiryForm.referral,
              referral_couple_name: inquiryForm.referral === 'Couple' ? inquiryForm.referralCoupleName : null,
              venue_id: inquiryForm.venueId || null,
              guest_count: inquiryForm.guestCount ? parseInt(inquiryForm.guestCount) : null,
            });

            await supabase.from('vendor_contacts').insert({
              vendor_id: vendor.id,
              couple_id: coupleId,
            });

            // Fetch user_id for the couple
            const { data: userData, error: userError } = await supabase
              .from('couples')
              .select('user_id')
              .eq('id', coupleId)
              .single();

            if (userError) throw new Error('Error fetching user_id: ' + userError.message);

            senderId = userData.user_id;

            if (inquiryForm.message) {
              await createConversationAndMessage(coupleId, senderId, inquiryForm.message);
            }

            setInquiryResult('existing');
            setFormSuccess(`Thank you ${partner1Name} for inquiring, you can login and message this vendor and continue the conversation in your profile.`);
            setTimeout(() => {
              setInquiryForm({
                partner1Name: '',
                partner2Name: '',
                email: '',
                phone: '',
                serviceType: '',
                packageId: '',
                message: '',
                weddingDate: '',
                termsAccepted: false,
                hoursNeeded: 8,
                coverageEvents: [],
                referral: 'Website',
                referralCoupleName: '',
                venueId: '',
                guestCount: ''
              });
              setCurrentStep(1);
              onClose();
              onSubmit({ coupleId, partner1Name });
            }, 3000);
          } else {
            setShowAuthModal(true);
          }
        }
      } catch (err) {
        console.error('Error submitting inquiry:', err);
        setFormError(err instanceof Error ? err.message : 'Failed to submit inquiry.');
      }
    }
  };

  const handleAuthSubmit = async () => {
    try {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id, user_id')
        .eq('email', inquiryForm.email)
        .single();

      if (coupleError || !coupleData) {
        throw new Error('Could not find couple data after signup.');
      }

      await supabase.from('vendor_leads').insert({
        vendor_id: vendor.id,
        couple_id: coupleData.id,
        service_type: inquiryForm.serviceType,
        hours_needed: inquiryForm.hoursNeeded,
        coverage_events: inquiryForm.coverageEvents,
        inquiry_message: inquiryForm.message || 'No message provided.',
        referral: inquiryForm.referral,
        referral_couple_name: inquiryForm.referral === 'Couple' ? inquiryForm.referralCoupleName : null,
        venue_id: inquiryForm.venueId || null,
        guest_count: inquiryForm.guestCount ? parseInt(inquiryForm.guestCount) : null,
      });

      await supabase.from('vendor_contacts').insert({
        vendor_id: vendor.id,
        couple_id: coupleData.id,
      });

      if (inquiryForm.message) {
        await createConversationAndMessage(coupleData.id, coupleData.user_id, inquiryForm.message);
      }

      setInquiryResult('new');
      setFormSuccess('Welcome to B. Remembered! You can login to manage all of your inquiries, use our wedding tools and message your vendors.');
      setTimeout(() => {
        setShowAuthModal(false);
        setInquiryForm({
          partner1Name: '',
          partner2Name: '',
          email: '',
          phone: '',
          serviceType: '',
          packageId: '',
          message: '',
          weddingDate: '',
          termsAccepted: false,
          hoursNeeded: 8,
          coverageEvents: [],
          referral: 'Website',
          referralCoupleName: '',
          venueId: '',
          guestCount: ''
        });
        setCurrentStep(1);
        onClose();
        navigate('/profile');
      }, 3000);
    } catch (err) {
      console.error('Error completing inquiry after signup:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to complete inquiry.');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      console.log(`Navigating back from Step ${currentStep} to Step ${currentStep - 1}`);
      setCurrentStep(currentStep - 1);
      setFormError(null);
      setShowVenueForm(false); // Ensure venue form is closed when going back
    }
  };

  const uniqueServiceTypes = useMemo(() => {
    const types = new Set(servicePackages.map((pkg) => pkg.service_type));
    return Array.from(types).sort();
  }, [servicePackages]);

  const filteredPackages = useMemo(() => {
    return servicePackages.filter((pkg) => pkg.service_type === inquiryForm.serviceType);
  }, [inquiryForm.serviceType, servicePackages]);

  const filteredVenues = useMemo(() => {
    return venues.filter(venue =>
      venue.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
      (venue.street_address && venue.street_address.toLowerCase().includes(venueSearch.toLowerCase())) ||
      (venue.city && venue.city.toLowerCase().includes(venueSearch.toLowerCase()))
    );
  }, [venues, venueSearch]);

  const selectedVenue = useMemo(() => {
    return venues.find(venue => venue.id === inquiryForm.venueId);
  }, [inquiryForm.venueId, venues]);

  const canProceedStep = () => {
    switch (currentStep) {
      case 1:
        return inquiryForm.partner1Name && inquiryForm.partner2Name && inquiryForm.email && inquiryForm.weddingDate && !validateWeddingDate(inquiryForm.weddingDate);
      case 2:
        return true; // Venue and guest count are optional
      case 3:
        return inquiryForm.serviceType && inquiryForm.hoursNeeded && inquiryForm.referral && (inquiryForm.referral !== 'Couple' || inquiryForm.referralCoupleName) && inquiryForm.termsAccepted;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => {
            console.log('Closing InquiryModal, resetting to Step 1');
            setCurrentStep(1);
            setShowVenueForm(false);
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Inquire with {vendor.name}</h3>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step 
                  ? 'bg-rose-500 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {currentStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 rounded-full ${currentStep > step ? 'bg-rose-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mb-4">
          <span className="text-sm text-gray-600">
            {currentStep === 1 && 'Personal Information'}
            {currentStep === 2 && 'Venue & Guest Count'}
            {currentStep === 3 && 'Service Details'}
          </span>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center mb-4">
            <AlertCircle className="h-5 w-5 text-rose-600 mr-2" />
            <p className="text-sm text-rose-700 font-medium">{formError}</p>
          </div>
        )}
        {formSuccess && inquiryResult === 'existing' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center mb-4">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div className="text-sm text-green-700 font-medium">
              {formSuccess}
              <Button
                variant="primary"
                className="mt-2 w-full"
                onClick={() => navigate('/profile')}
              >
                Go to Profile
              </Button>
            </div>
          </div>
        )}
        {formSuccess && inquiryResult === 'new' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center mb-4">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div className="text-sm text-green-700 font-medium">
              {formSuccess}
              <Button
                variant="primary"
                className="mt-2 w-full"
                onClick={() => navigate('/profile')}
              >
                Go to Profile
              </Button>
            </div>
          </div>
        )}
        {!formSuccess && (
          <>
            {showVenueForm ? (
              <Card className="p-6 bg-blue-50 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Add New Venue</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
                    <input
                      type="text"
                      value={newVenue.name}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Enter venue name"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={newVenue.street_address}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, street_address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={newVenue.city}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select
                      value={newVenue.state}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={newVenue.zip}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, zip: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                    <input
                      type="text"
                      value={newVenue.region}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, region: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Enter region"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={newVenue.contact_name}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, contact_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Venue coordinator name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newVenue.phone}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newVenue.email}
                      onChange={(e) => setNewVenue(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="venue@example.com"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowVenueForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateVenue}
                    disabled={!newVenue.name || !newVenue.state || !newVenue.region}
                  >
                    Add Venue
                  </Button>
                </div>
              </Card>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                {currentStep === 1 && (
                  <div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Partner 1 Name *</label>
                      <input
                        type="text"
                        value={inquiryForm.partner1Name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, partner1Name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Your name"
                        required
                        disabled={user && inquiryForm.partner1Name !== ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Partner 2 Name *</label>
                      <input
                        type="text"
                        value={inquiryForm.partner2Name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, partner2Name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Your partner's name"
                        required
                        disabled={user && inquiryForm.partner2Name !== ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Your email"
                        required
                        disabled={user && inquiryForm.email !== ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Wedding Date *</label>
                      <input
                        type="date"
                        value={inquiryForm.weddingDate}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, weddingDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                        disabled={user && inquiryForm.weddingDate !== ''}
                      />
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div>
                    {selectedVenue ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-900">{selectedVenue.name}</h4>
                            <p className="text-sm text-green-700">
                              {selectedVenue.street_address}, {selectedVenue.city}, {selectedVenue.state} {selectedVenue.zip}
                            </p>
                            {selectedVenue.region && (
                              <p className="text-sm text-green-700">Region: {selectedVenue.region}</p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInquiryForm(prev => ({ ...prev, venueId: '' }))}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={venueSearch}
                            onChange={(e) => setVenueSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="Search venues by name or location..."
                            disabled={user && inquiryForm.venueId !== ''}
                          />
                        </div>
                        {venueSearch && (
                          <div className="max-h-64 overflow-y-auto mb-2">
                            {filteredVenues.length > 0 ? (
                              filteredVenues.map((venue) => (
                                <div
                                  key={venue.id}
                                  onClick={() => {
                                    setInquiryForm(prev => ({ ...prev, venueId: venue.id }));
                                    console.log('Selected venue:', venue.id);
                                  }}
                                  className="p-3 border border-gray-200 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                                >
                                  <h4 className="text-sm font-medium text-gray-900">{venue.name}</h4>
                                  <p className="text-xs text-gray-600">
                                    {venue.street_address}, {venue.city}, {venue.state} {venue.zip}
                                  </p>
                                  {venue.region && (
                                    <p className="text-xs text-gray-500">Region: {venue.region}</p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-2">No venues found.</p>
                            )}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          icon={Plus}
                          onClick={() => {
                            setShowVenueForm(true);
                            console.log('Opening venue form');
                          }}
                          className="w-full"
                          disabled={user && inquiryForm.venueId !== ''}
                        >
                          Add New Venue
                        </Button>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Guest Count</label>
                      <input
                        type="number"
                        value={inquiryForm.guestCount}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, guestCount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        placeholder="Estimated guest count"
                        min="1"
                        disabled={user && inquiryForm.guestCount !== ''}
                      />
                    </div>
                  </div>
                )}
                {currentStep === 3 && (
                  <div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Type *</label>
                      <select
                        value={inquiryForm.serviceType}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, serviceType: e.target.value, packageId: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      >
                        <option value="">Select a service type</option>
                        {uniqueServiceTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    {inquiryForm.serviceType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Package</label>
                        <select
                          value={inquiryForm.packageId}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, packageId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          <option value="">Select a package (optional)</option>
                          {filteredPackages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hours Needed *</label>
                      <input
                        type="number"
                        value={inquiryForm.hoursNeeded}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, hoursNeeded: parseInt(e.target.value) || 8 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        min="1"
                        max="24"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Events</label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {coverageOptions.map((event) => (
                          <label key={event} className="flex items-center">
                            <input
                              type="checkbox"
                              value={event}
                              checked={inquiryForm.coverageEvents.includes(event)}
                              onChange={(e) => handleCoverageChange(event, e.target.checked)}
                              className="mr-2 h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{event}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Referral Source *</label>
                      <select
                        value={inquiryForm.referral}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, referral: e.target.value, referralCoupleName: e.target.value !== 'Couple' ? '' : inquiryForm.referralCoupleName })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      >
                        {referralOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    {inquiryForm.referral === 'Couple' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Referring Couple Name *</label>
                        <input
                          type="text"
                          value={inquiryForm.referralCoupleName}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, referralCoupleName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="Enter referring couple's name"
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Message</label>
                      <textarea
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        rows={4}
                        placeholder="Your message to the vendor..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inquiryForm.termsAccepted}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, termsAccepted: e.target.checked })}
                        className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                        required
                      />
                      <label className="ml-2 text-sm text-gray-600">
                        I agree to the <a href="/terms" className="text-rose-600 hover:text-rose-700" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                      </label>
                    </div>
                  </div>
                )}
                <div className="flex space-x-3 mt-6">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      type="button"
                    >
                      Back
                    </Button>
                  )}
                  {currentStep < 3 && (
                    <Button
                      variant="primary"
                      onClick={handleInquirySubmit}
                      disabled={!canProceedStep()}
                      type="button"
                    >
                      Next
                    </Button>
                  )}
                  {currentStep === 3 && (
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!canProceedStep()}
                    >
                      Submit Inquiry
                    </Button>
                  )}
                </div>
              </form>
            )}
          </>
        )}
      </Card>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setInquiryForm({
              partner1Name: '',
              partner2Name: '',
              email: '',
              phone: '',
              serviceType: '',
              packageId: '',
              message: '',
              weddingDate: '',
              termsAccepted: false,
              hoursNeeded: 8,
              coverageEvents: [],
              referral: 'Website',
              referralCoupleName: '',
              venueId: '',
              guestCount: ''
            });
            setCurrentStep(1);
            onClose();
          }}
          initialMode="signup"
          initialData={{
            email: inquiryForm.email,
            name: `${inquiryForm.partner1Name} & ${inquiryForm.partner2Name}`,
            partner1_name: inquiryForm.partner1Name,
            partner2_name: inquiryForm.partner2Name,
            wedding_date: inquiryForm.weddingDate
          }}
          onSuccessfulSignup={handleAuthSubmit}
        />
      )}
    </div>
  );
};

export default InquiryModal;