export interface ServicePackage {
  id: string;
  service_type: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  coverage: Record<string, any>;
  status: 'approved' | 'pending' | 'rejected';
  vendor_id?: string;
  hour_amount?: number;
  event_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  profile?: string;
  rating?: number;
  profile_photo?: string;
  years_experience: number;
  phone?: string;
  portfolio_photos?: string[];
  portfolio_videos?: string[];
  specialties?: string[];
  languages?: string[];
  service_areas?: string[];
  created_at: string;
  updated_at: string;
}

export interface VendorService {
  id: string;
  vendor_id: string;
  service_type: string;
  is_active: boolean;
  package_status: string;
  created_at: string;
  updated_at: string;
}

export interface BookingIntent {
  id: string;
  couple_id: string;
  vendor_id: string;
  package_id: string;
  venue_id: string;
  event_date: string;
  event_time: string;
  service_type: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'bookingInitiated' | 'bookingInitiatedWithPayment' | 'bookingConfirmed';
  vibe?: string;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  region?: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingFlow {
  selectedServices: string[];
  selectedPackages: ServicePackage[];
  eventDate?: string;
  eventTime?: string;
  venue?: Venue;
  selectedVendors: Record<string, Vendor>;
  addOns: Record<string, any[]>;
  totalCost: number;
  depositAmount: number;
  discountCode?: string;
  eventInsurance: boolean;
}

export interface StyleTag {
  id: number;
  label: string;
  description?: string;
}

export interface VibeTag {
  id: number;
  label: string;
  description?: string;
}

export interface VendorReview {
  id: string;
  vendor_id: string;
  couple_id?: string;
  communication_rating: number;
  experience_rating?: number;
  quality_rating?: number;
  overall_rating?: number;
  feedback?: string;
  vendor_response?: string;
  created_at: string;
  updated_at: string;
}