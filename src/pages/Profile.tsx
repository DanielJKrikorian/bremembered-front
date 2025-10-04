import React, { Component, ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Calendar, Heart, Camera, Settings, Shield, Download, Share2, MessageCircle, CreditCard, Star, FileText, Eye, CheckCircle, AlertCircle, X, Check, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCouple } from '../hooks/useCouple';
import { useWeddingGallery } from '../hooks/useWeddingGallery';
import { useCouplePreferences, useStyleTags, useVibeTags, useLanguages } from '../hooks/useCouple';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useConversations } from '../hooks/useMessaging';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { StripePaymentModal } from '../components/payment/StripePaymentModal';
import { WeddingTimeline } from '../components/profile/WeddingTimeline';
import { GuestManagement } from '../components/profile/GuestManagement'; // Added import
import { ConversationList } from '../components/messaging/ConversationList';
import { ChatWindow } from '../components/messaging/ChatWindow';
import { Conversation } from '../hooks/useMessaging';
import { OverviewDashboard } from '../components/profile/OverviewDashboard';
import { PaymentsSection } from '../components/profile/PaymentsSection';
import { WeddingBoard } from '../components/profile/WeddingBoard';
import { ReviewsSection } from '../components/profile/ReviewsSection';
import { jsPDF } from 'jspdf';
import { parse, format, isValid } from 'date-fns';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h3 className="text-xl font-semibold text-red-600">Something went wrong</h3>
          <p className="text-gray-600 mt-2">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <p className="text-gray-600 mt-2">
            Please try refreshing the page or contact support.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Utility function to safely parse and format dates
const safeFormatDate = (dateString: string | null | undefined, formatString: string = 'PPPP'): string => {
  if (!dateString) return 'Not set';
  try {
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }
    return format(parsedDate, formatString);
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid date';
  }
};

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
  onDownload: (contract: any) => void;
}

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, contract, onDownload }) => {
  if (!isOpen || !contract) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {contract.bookings?.service_packages?.name || contract.bookings?.service_type}
        </h3>
        <p className="text-gray-600 mb-4">Contract with {contract.bookings?.vendors?.name}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <span className="text-gray-600">Contract ID:</span>
            <div className="font-medium">{contract.id.substring(0, 8).toUpperCase()}</div>
          </div>
          <div>
            <span className="text-gray-600">Service Type:</span>
            <div className="font-medium">{contract.bookings?.service_type}</div>
          </div>
          <div>
            <span className="text-gray-600">Created:</span>
            <div className="font-medium">{safeFormatDate(contract.created_at)}</div>
          </div>
          {contract.signed_at && (
            <>
              <div>
                <span className="text-gray-600">Signed By:</span>
                <div className="font-medium">{contract.signature}</div>
              </div>
              <div>
                <span className="text-gray-600">Signed On:</span>
                <div className="font-medium">{safeFormatDate(contract.signed_at)}</div>
              </div>
            </>
          )}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Contract Content</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {contract.content}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          {contract.signature && (
            <Button
              variant="primary"
              icon={Download}
              onClick={() => onDownload(contract)}
            >
              Download PDF
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { couple, loading: coupleLoading, updateCouple, refetchCouple } = useCouple();
  const {
    files,
    folders,
    currentFolder,
    setCurrentFolder,
    currentFolderFiles,
    photoFiles,
    videoFiles,
    currentFolderPhotoFiles,
    currentFolderVideoFiles,
    subscription,
    hasSubscription,
    loading: galleryLoading,
    downloadFile,
    downloadAllFiles,
    downloadingAll,
    getDaysUntilExpiry,
    formatFileSize
  } = useWeddingGallery();
  const {
    updateStylePreferences,
    updateVibePreferences,
    updateLanguagePreferences,
    loading: preferencesLoading
  } = useCouplePreferences();
  const { styleTags } = useStyleTags();
  const { vibeTags } = useVibeTags();
  const { languages } = useLanguages();
  const { conversations, loading: conversationsLoading } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { uploadPhoto, uploading: photoUploading } = usePhotoUpload();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'timeline' | 'guests' | 'gallery' | 'messages' | 'payments' | 'contracts' | 'preferences' | 'settings' | 'wedding-board' | 'reviews'>('overview');
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    partner1_name: '',
    partner2_name: '',
    email: '',
    phone: '',
    wedding_date: '',
    venue_name: '',
    guest_count: '',
    ceremony_time: '',
    reception_time: '',
    notes: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'Weak' | 'Moderate' | 'Strong' | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  // Initialize edit form when couple data loads
  React.useEffect(() => {
    if (couple && !isEditing) {
      setEditForm({
        name: couple.name || '',
        partner1_name: couple.partner1_name || '',
        partner2_name: couple.partner2_name || '',
        email: couple.email || '',
        phone: couple.phone || '',
        wedding_date: couple.wedding_date || '',
        venue_name: couple.venue_name || '',
        guest_count: couple.guest_count?.toString() || '',
        ceremony_time: couple.ceremony_time || '',
        reception_time: couple.reception_time || '',
        notes: couple.notes || ''
      });
    }
  }, [couple, isEditing]);

  // Get active tab from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'profile', 'timeline', 'guests', 'gallery', 'messages', 'payments', 'contracts', 'preferences', 'settings', 'wedding-board', 'reviews'].includes(tab)) {
      setActiveTab(tab as any);
    } else {
      setActiveTab('overview');
    }
    // Check if we should auto-select a conversation
    if (tab === 'messages' && location.state?.selectedConversationId) {
      const targetConversationId = location.state.selectedConversationId;
      const findAndSelectConversation = () => {
        const conversation = conversations.find(c => c.id === targetConversationId);
        if (conversation) {
          setSelectedConversation(conversation);
        }
      };
      if (!conversationsLoading && conversations.length > 0) {
        findAndSelectConversation();
      }
    }
  }, [location, conversations, conversationsLoading]);

  // Auto-select conversation when conversations load
  React.useEffect(() => {
    if (!conversationsLoading && location.state?.selectedConversationId && !selectedConversation) {
      const targetConversationId = location.state.selectedConversationId;
      const conversation = conversations.find(c => c.id === targetConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [conversationsLoading, conversations, location.state?.selectedConversationId, selectedConversation]);

  // Fetch contracts
  React.useEffect(() => {
    const fetchContracts = async () => {
      if (!couple?.id) {
        setContractsLoading(false);
        return;
      }
      if (!supabase || !isSupabaseConfigured()) {
        setContracts([]);
        setContractsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select(`
            *,
            bookings!inner(
              id,
              service_type,
              vendors!inner(
                name
              ),
              service_packages(
                name
              )
            )
          `)
          .eq('bookings.couple_id', couple.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setContracts(data || []);
      } catch (err) {
        console.error('Error fetching contracts:', err);
        setContracts([]);
      } finally {
        setContractsLoading(false);
      }
    };
    if (couple?.id) {
      fetchContracts();
    }
  }, [couple]);

  // Evaluate password strength and match
  useEffect(() => {
    const { newPassword, confirmPassword } = passwordForm;
    // Password strength evaluation
    if (newPassword.length === 0) {
      setPasswordStrength(null);
    } else {
      let score = 0;
      if (newPassword.length >= 6) score += 1;
      if (newPassword.length >= 8) score += 1;
      if (/[A-Z]/.test(newPassword)) score += 1;
      if (/[0-9]/.test(newPassword)) score += 1;
      if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
      if (score <= 2) setPasswordStrength('Weak');
      else if (score <= 3) setPasswordStrength('Moderate');
      else setPasswordStrength('Strong');
    }
    // Password match evaluation
    if (newPassword.length > 0 && confirmPassword.length > 0) {
      setPasswordsMatch(newPassword === confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [passwordForm]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadContract = (contract: any) => {
    if (!contract || !contract.bookings) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      // Add logo with 1:1 aspect ratio
      const logoUrl = 'https://eecbrvehrhrvdzuutliq.supabase.co/storage/v1/object/public/public-1/B_Logo.png';
      const logoSize = 30; // Width and height in mm for 1:1 ratio
      doc.addImage(logoUrl, 'PNG', 90, 10, logoSize, logoSize, undefined, 'FAST');
      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SERVICE CONTRACT', 105, 50, { align: 'center' });
      // Contract info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('B. Remembered', 105, 60, { align: 'center' });
      doc.text('The Smarter Way to Book Your Big Day!', 105, 67, { align: 'center' });
      // Contract details
      let yPos = 80;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CONTRACT DETAILS', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Contract ID: ${contract.id.substring(0, 8).toUpperCase()}`, 20, yPos);
      yPos += 7;
      doc.text(`Service: ${contract.bookings.service_packages?.name || contract.bookings.service_type}`, 20, yPos);
      yPos += 7;
      doc.text(`Vendor: ${contract.bookings.vendors.name}`, 20, yPos);
      yPos += 7;
      doc.text(`Created: ${safeFormatDate(contract.created_at)}`, 20, yPos);
      yPos += 7;
      if (contract.signed_at) {
        doc.text(`Signed: ${safeFormatDate(contract.signed_at)}`, 20, yPos);
        yPos += 7;
      }
      yPos += 10;
      // Contract content
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CONTRACT TERMS', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = contract.content.split('\n');
      lines.forEach((line: string) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        if (line.trim() === '') {
          yPos += 4;
          return;
        }
        if (line.includes(':') && line.length < 50) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        const wrappedLines = doc.splitTextToSize(line, 170);
        doc.text(wrappedLines, 20, yPos);
        yPos += 5 * wrappedLines.length;
      });
      // Signature section
      if (contract.signature) {
        yPos += 20;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('DIGITAL SIGNATURE', 20, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Signed by: ${contract.signature}`, 20, yPos);
        yPos += 6;
        doc.text(`Date: ${safeFormatDate(contract.signed_at)}`, 20, yPos);
      }
      // Footer
      yPos = Math.max(yPos + 20, 260);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Thank you for choosing B. Remembered for your special day!', 105, yPos, { align: 'center' });
      doc.text('For questions about this contract, contact hello@bremembered.io', 105, yPos + 7, { align: 'center' });
      // Save the PDF
      const fileName = `Contract_${contract.bookings.vendors.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating contract PDF:', error);
    }
  };

  // Updated formatDate to use safeFormatDate
  const formatDate = (dateString: string | null) => safeFormatDate(dateString);

  // formatTime: Unchanged, handles HH:MM as local
  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not set';
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      if (couple) {
        setEditForm({
          name: couple.name || '',
          partner1_name: couple.partner1_name || '',
          partner2_name: couple.partner2_name || '',
          email: couple.email || '',
          phone: couple.phone || '',
          wedding_date: couple.wedding_date || '',
          venue_name: couple.venue_name || '',
          guest_count: couple.guest_count?.toString() || '',
          ceremony_time: couple.ceremony_time || '',
          reception_time: couple.reception_time || '',
          notes: couple.notes || ''
        });
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateCouple({
        name: editForm.name,
        partner1_name: editForm.partner1_name,
        partner2_name: editForm.partner2_name,
        email: editForm.email,
        phone: editForm.phone,
        wedding_date: editForm.wedding_date || null,
        venue_name: editForm.venue_name || null,
        guest_count: editForm.guest_count ? parseInt(editForm.guest_count) : null,
        ceremony_time: editForm.ceremony_time || null,
        reception_time: editForm.reception_time || null,
        notes: editForm.notes || null
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleStyleToggle = async (styleLabel: string) => {
    if (!couple) return;
    const styleTag = styleTags.find(tag => tag.label === styleLabel);
    if (!styleTag) return;
    const currentStyleIds = couple.style_preferences?.map(pref => pref.id) || [];
    const isSelected = currentStyleIds.includes(styleTag.id);
    const newStyleIds = isSelected
      ? currentStyleIds.filter(id => id !== styleTag.id)
      : [...currentStyleIds, styleTag.id];
    try {
      await updateStylePreferences(newStyleIds);
      refetchCouple();
    } catch (error) {
      console.error('Error updating style preferences:', error);
    }
  };

  const handleVibeToggle = async (vibeLabel: string) => {
    if (!couple) return;
    const vibeTag = vibeTags.find(tag => tag.label === vibeLabel);
    if (!vibeTag) return;
    const currentVibeIds = couple.vibe_preferences?.map(pref => pref.id) || [];
    const isSelected = currentVibeIds.includes(vibeTag.id);
    const newVibeIds = isSelected
      ? currentVibeIds.filter(id => id !== vibeTag.id)
      : [...currentVibeIds, vibeTag.id];
    try {
      await updateVibePreferences(newVibeIds);
      refetchCouple();
    } catch (error) {
      console.error('Error updating vibe preferences:', error);
    }
  };

  const handleLanguageToggle = async (languageName: string) => {
    if (!couple) return;
    const language = languages.find(lang => lang.language === languageName);
    if (!language) return;
    const currentLanguageIds = couple.language_preferences?.map(pref => pref.id) || [];
    const isSelected = currentLanguageIds.includes(language.id);
    const newLanguageIds = isSelected
      ? currentLanguageIds.filter(id => id !== language.id)
      : [...currentLanguageIds, language.id];
    try {
      await updateLanguagePreferences(newLanguageIds);
      refetchCouple();
    } catch (error) {
      console.error('Error updating language preferences:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    try {
      const photoUrl = await uploadPhoto(file, user.id);
      await updateCouple({ profile_photo: photoUrl });
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordLoading(true);
    const { newPassword, confirmPassword } = passwordForm;
    // Validation
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setPasswordLoading(false);
      return;
    }
    if (passwordStrength === 'Weak') {
      setPasswordError('Password is too weak. Please use a stronger password.');
      setPasswordLoading(false);
      return;
    }
    try {
      if (!supabase || !isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw error;
      }
      setPasswordSuccess('Password updated successfully');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setPasswordStrength(null);
      setPasswordsMatch(null);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your profile.</p>
        </Card>
      </div>
    );
  }

  if (coupleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Calendar },
    { key: 'wedding-board', label: 'Wedding Board', icon: Heart },
    { key: 'timeline', label: 'Wedding Timeline', icon: Calendar },
    { key: 'guests', label: 'Guest Management', icon: Users }, // Added Guest Management tab
    { key: 'gallery', label: 'Wedding Gallery', icon: Camera },
    { key: 'messages', label: 'Messages', icon: MessageCircle },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'contracts', label: 'Contracts', icon: FileText },
    { key: 'reviews', label: 'My Reviews', icon: Star },
    { key: 'preferences', label: 'Preferences', icon: Heart },
    { key: 'profile', label: 'Profile Information', icon: User },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {couple?.profile_photo ? (
                <img
                  src={couple.profile_photo}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-rose-600 transition-colors shadow-lg">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={photoUploading}
                />
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {couple?.name || 'Your Profile'}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your wedding information and preferences
              </p>
              {couple?.wedding_date && (
                <p className="text-rose-600 font-medium mt-1">
                  Wedding: {formatDate(couple.wedding_date)}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
                <p className="text-sm text-gray-600">Manage your wedding planning</p>
              </div>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all
                        ${activeTab === tab.key
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <OverviewDashboard />
            )}
            {activeTab === 'profile' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
                  <Button
                    variant={isEditing ? 'outline' : 'primary'}
                    onClick={handleEditToggle}
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Your Name"
                        value={editForm.partner1_name}
                        onChange={(e) => handleInputChange('partner1_name', e.target.value)}
                        icon={User}
                        required
                      />
                      <Input
                        label="Partner's Name"
                        value={editForm.partner2_name}
                        onChange={(e) => handleInputChange('partner2_name', e.target.value)}
                        icon={Heart}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        icon={User}
                        required
                      />
                      <Input
                        label="Phone"
                        value={editForm.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        icon={User}
                      />
                      <Input
                        label="Wedding Date"
                        type="date"
                        value={editForm.wedding_date}
                        onChange={(e) => handleInputChange('wedding_date', e.target.value)}
                        icon={Calendar}
                      />
                      <Input
                        label="Guest Count"
                        type="number"
                        value={editForm.guest_count}
                        onChange={(e) => handleInputChange('guest_count', e.target.value)}
                        icon={User}
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="Venue Name"
                          value={editForm.venue_name}
                          onChange={(e) => handleInputChange('venue_name', e.target.value)}
                          icon={User}
                        />
                      </div>
                      <Input
                        label="Ceremony Time"
                        type="time"
                        value={editForm.ceremony_time}
                        onChange={(e) => handleInputChange('ceremony_time', e.target.value)}
                        icon={Calendar}
                      />
                      <Input
                        label="Reception Time"
                        type="time"
                        value={editForm.reception_time}
                        onChange={(e) => handleInputChange('reception_time', e.target.value)}
                        icon={Calendar}
                      />
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Any special notes about your wedding..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEditToggle}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={false}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                        <p className="text-gray-900">{couple?.partner1_name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner's Name</label>
                        <p className="text-gray-900">{couple?.partner2_name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{couple?.email || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <p className="text-gray-900">{couple?.phone || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Wedding Date</label>
                        <p className="text-gray-900">{formatDate(couple?.wedding_date)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                        <p className="text-gray-900">{couple?.guest_count || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                        <p className="text-gray-900">{couple?.venue_name || 'Not set'}</p>
                      </div>
                      {couple?.ceremony_time && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ceremony Time</label>
                          <p className="text-gray-900">{formatTime(couple.ceremony_time)}</p>
                        </div>
                      )}
                      {couple?.reception_time && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reception Time</label>
                          <p className="text-gray-900">{formatTime(couple.reception_time)}</p>
                        </div>
                      )}
                      {couple?.notes && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <p className="text-gray-900">{couple.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
            {activeTab === 'timeline' && (
              <WeddingTimeline />
            )}
            {activeTab === 'guests' && (
              <GuestManagement />
            )}
            {activeTab === 'wedding-board' && (
              <WeddingBoard />
            )}
            {activeTab === 'gallery' && (
              <ErrorBoundary>
                <div className="space-y-6">
                  {/* Gallery Header */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Wedding Gallery</h3>
                        <p className="text-gray-600 mt-1">
                          Your photos and videos from vendors
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          icon={Download}
                          onClick={() => {
                            if (!hasSubscription) {
                              setShowPaymentModal(true);
                              return;
                            }
                            downloadAllFiles();
                          }}
                          disabled={files.length === 0 || downloadingAll}
                          loading={downloadingAll}
                        >
                          {currentFolder ? `Download All (${currentFolderFiles.length})` : 'Download All'}
                        </Button>
                        <Button
                          variant="outline"
                          icon={Share2}
                        >
                          Share Gallery
                        </Button>
                      </div>
                    </div>
                    {/* Storage Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{files.length}</div>
                        <div className="text-blue-800 text-sm">Total Files</div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                        <div className="text-2xl font-bold text-emerald-600">{photoFiles.length}</div>
                        <div className="text-emerald-800 text-sm">Photos</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600">{videoFiles.length}</div>
                        <div className="text-purple-800 text-sm">Videos</div>
                      </div>
                    </div>
                    {/* Access Status */}
                    {!hasSubscription ? (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-red-900">Gallery Access Expired</h4>
                            <p className="text-red-700 text-sm">
                              Subscribe to continue accessing your wedding photos and videos
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            onClick={() => setShowPaymentModal(true)}
                          >
                            Subscribe Now
                          </Button>
                        </div>
                      </div>
                    ) : subscription && getDaysUntilExpiry() <= 7 && (
                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-amber-900">Free Access Ending Soon</h4>
                            <p className="text-amber-700 text-sm">
                              {getDaysUntilExpiry()} days left to access your gallery
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            onClick={() => setShowPaymentModal(true)}
                          >
                            Secure Access
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                  {/* Back to Folders Button */}
                  {currentFolder && (
                    <div className="mb-6">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentFolder(null)}
                        className="flex items-center space-x-2"
                      >
                        <span>← Back to Folders</span>
                      </Button>
                    </div>
                  )}
                  {/* Gallery Content */}
                  {galleryLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading your gallery...</p>
                    </div>
                  ) : !currentFolder && folders.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No files yet</h3>
                      <p className="text-gray-600 mb-6">
                        Your vendors will upload photos and videos here after your events
                      </p>
                    </Card>
                  ) : !currentFolder ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900">Browse by Folder</h4>
                        <p className="text-gray-600">{folders.length} folder{folders.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {folders.map((folder) => (
                          <div
                            key={folder.path}
                            onClick={() => {
                              if (!hasSubscription) {
                                setShowPaymentModal(true);
                                return;
                              }
                              setCurrentFolder(folder.path);
                            }}
                            className="cursor-pointer"
                          >
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                {folder.previewImage ? (
                                  <img
                                    src={folder.previewImage}
                                    alt={folder.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-center">
                                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Folder</p>
                                  </div>
                                )}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                  {folder.fileCount} files
                                </div>
                              </div>
                              <div className="p-4">
                                <h4 className="font-medium text-gray-900 truncate mb-2">{folder.name}</h4>
                                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                                  <span>{formatFileSize(folder.totalSize)}</span>
                                  <span>{safeFormatDate(folder.lastModified)}</span>
                                </div>
                                {folder.vendor && (
                                  <div className="flex items-center space-x-2">
                                    {folder.vendor.profile_photo ? (
                                      <img
                                        src={folder.vendor.profile_photo}
                                        alt={folder.vendor.name}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Camera className="w-3 h-3 text-gray-400" />
                                      </div>
                                    )}
                                    <p className="text-xs text-gray-500 truncate">
                                      By {folder.vendor.name}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : currentFolderFiles.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No files in this folder</h3>
                      <p className="text-gray-600 mb-6">
                        This folder appears to be empty or files are still being uploaded.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentFolder(null)}
                      >
                        Back to Folders
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentFolderFiles.map((file) => (
                        <Card key={file.id} className="overflow-hidden">
                          <div className="aspect-video bg-gray-100 flex items-center justify-center">
                            {file.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img
                                src={file.public_url}
                                alt={file.file_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center">
                                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Video File</p>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 truncate">{file.file_name}</h4>
                            <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>{safeFormatDate(file.upload_date)}</span>
                            </div>
                            {file.vendors && (
                              <p className="text-xs text-gray-500 mt-1">
                                By {file.vendors.name}
                              </p>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3"
                              onClick={() => downloadFile(file)}
                              icon={Download}
                            >
                              Download
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ErrorBoundary>
            )}
            {activeTab === 'messages' && (
              <>
                {selectedConversation ? (
                  <div className="space-y-6">
                    <Card className="p-0 overflow-hidden">
                      <ChatWindow
                        conversation={selectedConversation}
                        onBack={() => setSelectedConversation(null)}
                      />
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Messages</h3>
                          <p className="text-gray-600 mt-1">
                            Chat with your wedding vendors
                          </p>
                        </div>
                      </div>
                      <ConversationList
                        conversations={conversations}
                        loading={conversationsLoading}
                        onConversationSelect={(conversation) => setSelectedConversation(conversation)}
                      />
                    </Card>
                  </div>
                )}
              </>
            )}
            {activeTab === 'payments' && (
              <PaymentsSection />
            )}
            {activeTab === 'reviews' && (
              <ReviewsSection />
            )}
            {activeTab === 'contracts' && (
              <div className="space-y-6">
                {/* Contracts Header */}
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Contracts</h3>
                      <p className="text-gray-600">
                        View and download your signed service contracts
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-rose-500">{contracts.length}</div>
                      <div className="text-sm text-gray-600">Total Contracts</div>
                    </div>
                  </div>
                </Card>
                {/* Contracts List */}
                {contractsLoading ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading your contracts...</p>
                    </div>
                  </div>
                ) : contracts.length === 0 ? (
                  <Card className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No contracts yet</h3>
                    <p className="text-gray-600 mb-6">
                      Contracts will appear here once you complete bookings with vendors
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => navigate('/search')}
                    >
                      Browse Services
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <Card key={contract.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {contract.bookings?.service_packages?.name || contract.bookings?.service_type}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                contract.signature
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                                {contract.signature ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Signed
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Pending Signature
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">
                              Contract with {contract.bookings?.vendors?.name}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Service Type:</span>
                                <div className="font-medium">{contract.bookings?.service_type}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Created:</span>
                                <div className="font-medium">{safeFormatDate(contract.created_at)}</div>
                              </div>
                              {contract.signed_at && (
                                <>
                                  <div>
                                    <span className="text-gray-600">Signed By:</span>
                                    <div className="font-medium">{contract.signature}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Signed On:</span>
                                    <div className="font-medium">{safeFormatDate(contract.signed_at)}</div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Contract Preview */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Contract Preview</h5>
                          <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                            {contract.content.split('\n').slice(0, 6).map((line: string, index: number) => (
                              <p key={index} className="mb-1">{line}</p>
                            ))}
                            {contract.content.split('\n').length > 6 && (
                              <p className="text-gray-500 italic">... (view full contract)</p>
                            )}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Eye}
                            onClick={() => setSelectedContract(contract)}
                          >
                            View Full Contract
                          </Button>
                          {contract.signature && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Download}
                              onClick={() => handleDownloadContract(contract)}
                            >
                              Download PDF
                            </Button>
                          )}
                          {!contract.signature && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/booking/${contract.booking_id}?tab=contract`)}
                              className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            >
                              Sign Contract
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                <ContractModal
                  isOpen={!!selectedContract}
                  onClose={() => setSelectedContract(null)}
                  contract={selectedContract}
                  onDownload={handleDownloadContract}
                />
              </div>
            )}
            {activeTab === 'preferences' && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Wedding Preferences</h3>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Style Preferences</h4>
                    <p className="text-gray-600 mb-4">
                      Select the photography and videography styles you love
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {styleTags.map((style) => {
                        const isSelected = couple?.style_preferences?.some(pref => pref.label === style.label);
                        return (
                          <button
                            key={style.label}
                            onClick={() => handleStyleToggle(style.label)}
                            disabled={preferencesLoading}
                            className={`
                              group relative px-6 py-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 min-w-[160px]
                              ${isSelected
                                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-100 text-indigo-800 shadow-xl'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-100 hover:text-indigo-700 hover:shadow-lg cursor-pointer'
                              }
                              ${preferencesLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            {isSelected && (
                              <div className="absolute -top-3 -right-3 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-sm">📸</span>
                              </div>
                            )}
                            <div className="text-center">
                              <div className="font-bold text-lg mb-2">{style.label}</div>
                              <div className="text-xs opacity-90 leading-tight font-medium">📸 {style.description || 'Photography style'}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Vibe Preferences</h4>
                    <p className="text-gray-600 mb-4">
                      Choose the vibes that match your wedding vision
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {vibeTags.map((vibe) => {
                        const vibeDescriptions: Record<string, string> = {
                          'Romantic': '💕 Soft, dreamy, and intimate',
                          'Fun': '🎉 Energetic and playful celebration',
                          'Elegant': '✨ Sophisticated and refined',
                          'Rustic': '🌾 Natural and countryside charm',
                          'Boho': '🌸 Free-spirited and artistic',
                          'Modern': '🏙️ Clean lines and contemporary',
                          'Traditional': '👑 Classic and formal ceremony',
                          'Intimate': '🤍 Small and meaningful gathering'
                        };
                        const isSelected = couple?.vibe_preferences?.some(pref => pref.label === vibe.label);
                        return (
                          <button
                            key={vibe.label}
                            onClick={() => handleVibeToggle(vibe.label)}
                            disabled={preferencesLoading}
                            className={`
                              group relative px-6 py-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-500/20 min-w-[160px]
                              ${isSelected
                                ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-rose-100 text-pink-800 shadow-xl'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-100 hover:text-pink-700 hover:shadow-lg cursor-pointer'
                              }
                              ${preferencesLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            {isSelected && (
                              <div className="absolute -top-3 -right-3 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-sm">💖</span>
                              </div>
                            )}
                            <div className="text-center">
                              <div className="font-bold text-lg mb-2">{vibe.label}</div>
                              <div className="text-xs opacity-90 leading-tight font-medium">{vibeDescriptions[vibe.label] || vibe.description || 'Wedding vibe'}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Language Preferences</h4>
                    <p className="text-gray-600 mb-4">
                      Select languages you'd like your vendors to speak
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {languages.map((language) => {
                        const isSelected = couple?.language_preferences?.some(pref => pref.id === language.id);
                        return (
                          <button
                            key={language.id}
                            onClick={() => handleLanguageToggle(language.language)}
                            disabled={preferencesLoading}
                            className={`
                              relative px-5 py-3 rounded-full border-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 min-w-[100px]
                              ${isSelected
                                ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 shadow-xl'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-gradient-to-br hover:from-emerald-50 to-emerald-100 hover:text-emerald-700 hover:shadow-lg cursor-pointer'
                              }
                              ${preferencesLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                            <span className="font-bold">{language.language}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            )}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Receive updates about your bookings and timeline</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-600">Get text updates for urgent matters</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Reminder Notifications</h4>
                        <p className="text-sm text-gray-600">Get reminders about upcoming events and deadlines</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                        <p className="text-sm text-gray-600">Allow vendors to see your profile information</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Marketing Communications</h4>
                        <p className="text-sm text-gray-600">Receive wedding tips and special offers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h3>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <Input
                        label="New Password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        icon={Shield}
                        required
                      />
                      {passwordStrength && (
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-200">
                            <div
                              className={`h-full transition-all duration-300 ${
                                passwordStrength === 'Weak'
                                  ? 'w-1/3 bg-red-500'
                                  : passwordStrength === 'Moderate'
                                  ? 'w-2/3 bg-yellow-500'
                                  : 'w-full bg-green-500'
                              }`}
                            ></div>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              passwordStrength === 'Weak'
                                ? 'text-red-600'
                                : passwordStrength === 'Moderate'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          >
                            {passwordStrength}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Input
                        label="Confirm New Password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        icon={Shield}
                        required
                      />
                      {passwordsMatch !== null && (
                        <div className="mt-2 flex items-center space-x-2">
                          {passwordsMatch ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-600">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-red-600">Passwords do not match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {passwordError && (
                      <p className="text-red-600 text-sm">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-green-600 text-sm">{passwordSuccess}</p>
                    )}
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPasswordForm({ newPassword: '', confirmPassword: '' });
                          setPasswordStrength(null);
                          setPasswordsMatch(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={passwordLoading}
                        disabled={passwordLoading || passwordStrength === 'Weak' || passwordsMatch === false}
                      >
                        Save New Password
                      </Button>
                    </div>
                  </form>
                </Card>
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h3>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Download My Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                      <Shield className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Payment Modal */}
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          window.location.reload();
        }}
        planId="Couple_Capsule"
        planName="Wedding Gallery"
        amount={499}
      />
    </div>
  );
};