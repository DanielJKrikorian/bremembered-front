export interface ServiceBundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  location: string;
  images: string[];
  services: Service[];
  vendor: Vendor;
  availability: Date[];
  duration: number;
  category: ServiceCategory;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: ServiceCategory;
  included: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  experience: number;
}

export interface Booking {
  id: string;
  bundleId: string;
  bundle: ServiceBundle;
  eventDate: Date;
  eventLocation: string;
  coupleInfo: {
    bride: string;
    groom: string;
    email: string;
    phone: string;
  };
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
  paymentStatus: 'pending' | 'paid' | 'failed';
}

export type ServiceCategory = 'photography' | 'videography' | 'dj' | 'coordination' | 'bundle';

export interface SearchFilters {
  location: string;
  date: Date | null;
  serviceType: ServiceCategory | '';
  budget: {
    min: number;
    max: number;
  };
  rating: number;
}