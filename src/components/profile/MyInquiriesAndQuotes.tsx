import React, { useState, useEffect } from 'react';
import { MessageCircle, ShoppingCart, Plus, Package, Camera, Video, Music, Users, Calendar, Edit2, Save, X, Eye, Clock, MapPin, Users as UsersIcon, Tag, FileText, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getPublicImageUrl } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Inquiry {
  id: string;
  vendor_id: string;
  couple_id: string;
  service_type: string;
  hours_needed: number | null;
  coverage_events: string[] | null;
  inquiry_message: string;
  referral: string;
  referral_couple_name: string | null;
  created_at: string;
  guest_count: number | null;
  venue_id: string | null;
  venue_name?: string | null;
  vendor_name: string;
  vendor_slug: string;
  vendor_profile_photo: string | null;
}

interface CustomPackage {
  id: string;
  vendor_id: string;
  couple_id: string;
  service_type: string;
  name: string;
  price: number;
  coverage: Record<string, any>;
  description: string;
  created_at: string;
  notes: string | null;
  vendor_name: string;
  vendor_slug: string;
  primary_image: string | null;
  vendor_profile_photo: string | null;
  features?: string | string[];
  hour_amount?: number;
  event_type?: string;
  contract_template_id?: string;
  contract_template_content?: string;
  gallery_images?: string[];
}

export const MyInquiriesAndQuotes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, openCart } = useCart();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [customPackages, setCustomPackages] = useState<CustomPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CustomPackage | null>(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Photography': return Camera;
      case 'Videography': return Video;
      case 'DJ Services': return Music;
      case 'Live Musician': return Music;
      case 'Coordination': return Users;
      case 'Planning': return Calendar;
      default: return Package;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price / 100);
  };

  const getPackageCoverage = (coverage: Record<string, any>) => {
    if (!coverage || typeof coverage !== 'object') return [];
    const events = [];
    if (coverage.events && Array.isArray(coverage.events)) {
      events.push(...coverage.events);
    }
    Object.keys(coverage).forEach(key => {
      if (key !== 'events' && coverage[key] === true) {
        events.push(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    });
    return events;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setError('Please log in to view inquiries and packages.');
        setLoading(false);
        return;
      }

      try {
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (coupleError || !coupleData) {
          throw new Error('Couple not found.');
        }

        // Fetch inquiries
        const { data: inquiriesData, error: inquiriesError } = await supabase
          .from('vendor_leads')
          .select(`
            id,
            vendor_id,
            couple_id,
            service_type,
            hours_needed,
            coverage_events,
            inquiry_message,
            referral,
            referral_couple_name,
            created_at,
            guest_count,
            venue_id,
            vendors!inner(name, slug, profile_photo),
            venues!venue_id(name)
          `)
          .eq('couple_id', coupleData.id)
          .order('created_at', { ascending: false });
        if (inquiriesError) throw inquiriesError;

        setInquiries(inquiriesData.map((inquiry: any) => ({
          id: inquiry.id,
          vendor_id: inquiry.vendor_id,
          couple_id: inquiry.couple_id,
          service_type: inquiry.service_type,
          hours_needed: inquiry.hours_needed,
          coverage_events: inquiry.coverage_events || null,
          inquiry_message: inquiry.inquiry_message,
          referral: inquiry.referral,
          referral_couple_name: inquiry.referral_couple_name,
          created_at: inquiry.created_at,
          guest_count: inquiry.guest_count,
          venue_id: inquiry.venue_id,
          venue_name: inquiry.venues?.name || null,
          vendor_name: inquiry.vendors.name,
          vendor_slug: inquiry.vendors.slug,
          vendor_profile_photo: inquiry.vendors.profile_photo || null,
        })));

        // Fetch custom packages with contract template content
        const { data: packagesData, error: packagesError } = await supabase
          .from('service_packages')
          .select(`
            id,
            vendor_id,
            couple_id,
            service_type,
            name,
            price,
            coverage,
            description,
            created_at,
            notes,
            primary_image,
            features,
            hour_amount,
            event_type,
            contract_template_id,
            gallery_images,
            vendors!inner(name, slug, profile_photo),
            contract_templates!contract_template_id(content)
          `)
          .eq('couple_id', coupleData.id)
          .eq('is_custom', true)
          .order('created_at', { ascending: false });
        if (packagesError) throw packagesError;

        setCustomPackages(packagesData.map((pkg: any) => ({
          id: pkg.id,
          vendor_id: pkg.vendor_id,
          couple_id: pkg.couple_id,
          service_type: pkg.service_type,
          name: pkg.name,
          price: pkg.price,
          coverage: pkg.coverage || {},
          description: pkg.description,
          created_at: pkg.created_at,
          notes: pkg.notes,
          vendor_name: pkg.vendors.name,
          vendor_slug: pkg.vendors.slug,
          primary_image: pkg.primary_image,
          vendor_profile_photo: pkg.vendors.profile_photo || null,
          features: pkg.features
            ? (Array.isArray(pkg.features)
                ? pkg.features
                : pkg.features.split(',').map((f: string) => f.trim()).filter(Boolean))
            : [],
          hour_amount: pkg.hour_amount,
          event_type: pkg.event_type,
          contract_template_id: pkg.contract_template_id,
          contract_template_content: pkg.contract_templates?.content || null,
          gallery_images: pkg.gallery_images || [],
        })));

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching inquiries or packages:', err.message);
        setError('Failed to load inquiries and packages.');
        setLoading(false);
        toast.error('Failed to load inquiries and packages.');
      }
    };
    fetchData();
  }, [user]);

  const startEditingNotes = (pkg: CustomPackage) => {
    setEditingNotes(pkg.id);
    setEditText(pkg.notes || '');
  };

  const saveNotes = async (pkgId: string) => {
    try {
      const { error } = await supabase
        .from('service_packages')
        .update({ notes: editText })
        .eq('id', pkgId);
      if (error) throw error;

      setCustomPackages(prev =>
        prev.map(pkg =>
          pkg.id === pkgId ? { ...pkg, notes: editText } : pkg
        )
      );

      setEditingNotes(null);
      setEditText('');
      toast.success('Notes saved successfully.');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to save notes.');
    }
  };

  const cancelEditNotes = () => {
    setEditingNotes(null);
    setEditText('');
  };

  // PUSH VENDOR_ID TO CART
  const handleAddToCart = (pkg: CustomPackage) => {
    addItem({
      package: {
        id: pkg.id,
        service_type: pkg.service_type,
        name: pkg.name,
        price: pkg.price,
        coverage: pkg.coverage,
        description: pkg.description,
        hour_amount: pkg.hour_amount,
        primary_image: getPublicImageUrl(pkg.primary_image),
      },
      vendor: {
        id: pkg.vendor_id,
        name: pkg.vendor_name,
        slug: pkg.vendor_slug,
        profile_photo: getPublicImageUrl(pkg.vendor_profile_photo),
      },
    });
    openCart();
    toast.success('Added to cart.');
  };

  const handleMessageVendor = (vendorId: string) => {
    navigate('/couple-dashboard/messages', { state: { recipientId: vendorId } });
  };

  const openInquiryModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsInquiryModalOpen(true);
  };

  const openPackageModal = (pkg: CustomPackage) => {
    setSelectedPackage(pkg);
    setIsPackageModalOpen(true);
  };

  const closeModal = () => {
    setIsInquiryModalOpen(false);
    setIsPackageModalOpen(false);
    setSelectedInquiry(null);
    setSelectedPackage(null);
  };

  const toggleContract = (pkgId: string) => {
    setExpandedContract(expandedContract === pkgId ? null : pkgId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your inquiries and custom packages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">My Inquiries and Custom Packages</h3>
            <p className="text-gray-600">
              View vendors you've inquired about and custom packages they've created for you
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-rose-500">{inquiries.length + customPackages.length}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/search')}
              icon={Plus}
            >
              Browse Vendors
            </Button>
          </div>
        </div>
      </Card>

      {/* SIDE-BY-SIDE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: My Inquiries */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            My Inquiries
            {inquiries.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                {inquiries.length}
              </span>
            )}
          </h4>

          {inquiries.length > 0 ? (
            <div className="space-y-4">
              {inquiries.map((inquiry) => {
                const ServiceIcon = getServiceIcon(inquiry.service_type);
                return (
                  <Card key={inquiry.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex">
                      {/* CIRCULAR PHOTO — MOVED DOWN */}
                      <div className="w-20 h-20 flex-shrink-0 mt-2">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-md">
                          <img
                            src={inquiry.vendor_profile_photo || "https://via.placeholder.com/80"}
                            alt={inquiry.vendor_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm">{inquiry.vendor_name}</h4>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600 mb-3">
                          <ServiceIcon className="w-3 h-3" />
                          <span>{inquiry.service_type}</span>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                          {inquiry.inquiry_message}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>Sent {new Date(inquiry.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/vendor/${inquiry.vendor_slug}`)}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/v/${inquiry.vendor_slug}`)}
                          >
                            View Website
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Eye}
                            onClick={() => openInquiryModal(inquiry)}
                            className="col-span-2"
                          >
                            View Full Inquiry
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center bg-gray-50">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No inquiries yet</p>
              <p className="text-sm text-gray-500 mt-1">Send inquiries to vendors to get started</p>
            </Card>
          )}
        </div>

        {/* RIGHT: Custom Packages */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            Custom Packages
            {customPackages.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                {customPackages.length}
              </span>
            )}
          </h4>

          {customPackages.length > 0 ? (
            <div className="space-y-4">
              {customPackages.map((pkg) => {
                const ServiceIcon = getServiceIcon(pkg.service_type);
                const packageCoverage = getPackageCoverage(pkg.coverage);
                const isContractExpanded = expandedContract === pkg.id;
                return (
                  <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video overflow-hidden relative">
                      <img
                        src={pkg.primary_image || pkg.vendor_profile_photo || "https://via.placeholder.com/400x200"}
                        alt={pkg.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-900">
                          <ServiceIcon className="w-3 h-3 mr-1" />
                          {pkg.service_type}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{pkg.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{pkg.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xl font-bold text-gray-900">{formatPrice(pkg.price)}</div>
                        <div className="text-sm text-gray-500">From {pkg.vendor_name}</div>
                      </div>

                      {/* CONTRACT BUTTON */}
                      {pkg.contract_template_content && (
                        <div className="mb-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleContract(pkg.id);
                            }}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">View Contract</span>
                            </div>
                            {isContractExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            )}
                          </button>

                          {isContractExpanded && (
                            <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                              {pkg.contract_template_content}
                            </div>
                          )}
                        </div>
                      )}

                      {/* COVERAGE */}
                      {packageCoverage.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Coverage</h5>
                          <div className="flex flex-wrap gap-1">
                            {packageCoverage.slice(0, 2).map((event, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {event}
                              </span>
                            ))}
                            {packageCoverage.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                +{packageCoverage.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* NOTES */}
                      <div className="mb-4">
                        {editingNotes === pkg.id ? (
                          <div className="space-y-3">
                            <Input
                              label="Your Notes"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              placeholder="Add notes about this package..."
                            />
                            <div className="flex space-x-2">
                              <Button
                                variant="primary"
                                size="sm"
                                icon={Save}
                                onClick={() => saveNotes(pkg.id)}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={X}
                                onClick={cancelEditNotes}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-gray-700">Your Notes</h5>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Edit2}
                                onClick={() => startEditingNotes(pkg)}
                                className="text-gray-400 hover:text-gray-600"
                              />
                            </div>
                            {pkg.notes ? (
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                {pkg.notes}
                              </p>
                            ) : (
                              <button
                                onClick={() => startEditingNotes(pkg)}
                                className="text-sm text-gray-400 hover:text-gray-600 bg-gray-50 p-3 rounded-lg w-full text-left"
                              >
                                Click to add notes...
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="space-y-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => openPackageModal(pkg)}
                          icon={Eye}
                        >
                          View Package
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => handleAddToCart(pkg)}
                          icon={ShoppingCart}
                        >
                          Add to Cart
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/vendor/${pkg.vendor_slug}`)}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/v/${pkg.vendor_slug}`)}
                          >
                            View Website
                          </Button>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          icon={MessageCircle}
                          onClick={() => handleMessageVendor(pkg.vendor_id)}
                        >
                          Message Vendor
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center bg-gray-50">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No custom packages yet</p>
              <p className="text-sm text-gray-500 mt-1">Vendors will send you quotes after you inquire</p>
            </Card>
          )}
        </div>
      </div>

      {/* INQUIRY MODAL */}
      {isInquiryModalOpen && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Your Full Inquiry
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={selectedInquiry.vendor_profile_photo || "https://via.placeholder.com/64"}
                    alt={selectedInquiry.vendor_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedInquiry.vendor_name}</h4>
                  <p className="text-sm text-gray-600">{selectedInquiry.service_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedInquiry.hours_needed && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{selectedInquiry.hours_needed} hours</span>
                  </div>
                )}
                {selectedInquiry.guest_count && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <UsersIcon className="w-4 h-4" />
                    <span>{selectedInquiry.guest_count} guests</span>
                  </div>
                )}
                {selectedInquiry.venue_name && (
                  <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedInquiry.venue_name}</span>
                  </div>
                )}
              </div>

              {selectedInquiry.coverage_events && selectedInquiry.coverage_events.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Coverage Events
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedInquiry.coverage_events.map((event, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Referral Source</h5>
                <p className="text-sm text-gray-600">
                  {selectedInquiry.referral}
                  {selectedInquiry.referral_couple_name && ` (${selectedInquiry.referral_couple_name})`}
                </p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Your Message</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedInquiry.inquiry_message}
                </p>
              </div>

              <div className="text-xs text-gray-500">
                Sent on {new Date(selectedInquiry.created_at).toLocaleDateString()} at {new Date(selectedInquiry.created_at).toLocaleTimeString()}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    closeModal();
                    navigate(`/vendor/${selectedInquiry.vendor_slug}`);
                  }}
                >
                  View Profile
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={MessageCircle}
                  onClick={() => {
                    closeModal();
                    handleMessageVendor(selectedInquiry.vendor_id);
                  }}
                >
                  Message Vendor
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PACKAGE MODAL */}
      {isPackageModalOpen && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Package Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {selectedPackage.primary_image && (
                <div className="aspect-video overflow-hidden rounded-lg shadow-sm">
                  <img
                    src={selectedPackage.primary_image}
                    alt={selectedPackage.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={selectedPackage.vendor_profile_photo || "https://via.placeholder.com/64"}
                    alt={selectedPackage.vendor_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedPackage.vendor_name}</h4>
                  <p className="text-sm text-gray-600">{selectedPackage.service_type}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedPackage.name}</h3>
                <p className="text-2xl font-bold text-rose-600 mt-1">{formatPrice(selectedPackage.price)}</p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedPackage.description}
                </p>
              </div>

              {Array.isArray(selectedPackage.features) && selectedPackage.features.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Features
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.features.map((f, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {getPackageCoverage(selectedPackage.coverage).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Coverage Events</h5>
                  <div className="flex flex-wrap gap-1">
                    {getPackageCoverage(selectedPackage.coverage).map((event, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedPackage.hour_amount && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{selectedPackage.hour_amount} hours</span>
                  </div>
                )}
                {selectedPackage.event_type && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedPackage.event_type}</span>
                  </div>
                )}
              </div>

              {selectedPackage.contract_template_content && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>Contract Included</span>
                </div>
              )}

              {selectedPackage.gallery_images && selectedPackage.gallery_images.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Gallery
                  </h5>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedPackage.gallery_images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Gallery ${i + 1}`}
                        className="w-full h-24 object-cover rounded-lg shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Created on {new Date(selectedPackage.created_at).toLocaleDateString()}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    closeModal();
                    handleAddToCart(selectedPackage);
                  }}
                  icon={ShoppingCart}
                >
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    closeModal();
                    navigate(`/vendor/${selectedPackage.vendor_slug}`);
                  }}
                >
                  View Profile
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={MessageCircle}
                  onClick={() => {
                    closeModal();
                    handleMessageVendor(selectedPackage.vendor_id);
                  }}
                >
                  Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {inquiries.length === 0 && customPackages.length === 0 && (
        <Card className="p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No inquiries or custom packages yet</h3>
          <p className="text-gray-600 mb-6">
            Start browsing vendors and send inquiries to receive custom packages
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/search')}
            icon={Plus}
          >
            Browse Vendors
          </Button>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Looking for More Vendors?
          </h3>
          <p className="text-gray-600 mb-4">
            Browse our vendor directory or check your cart for packages
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => navigate('/search')}
            >
              Browse Vendors
            </Button>
            {customPackages.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  customPackages.forEach(pkg => {
                    handleAddToCart(pkg);
                  });
                }}
              >
                Add All to Cart
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};