import { ServiceBundle, Booking } from '../types';

export const mockBundles: ServiceBundle[] = [
  {
    id: '1',
    name: 'Complete Wedding Package',
    description: 'Everything you need for your perfect day - photography, videography, DJ, and coordination all in one beautiful package.',
    price: 4500,
    originalPrice: 5200,
    rating: 4.9,
    reviewCount: 127,
    location: 'Los Angeles, CA',
    images: [
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    services: [
      {
        id: '1',
        name: 'Photography (8 hours)',
        description: 'Professional wedding photography with edited gallery',
        price: 2000,
        duration: 8,
        category: 'photography',
        included: true
      },
      {
        id: '2',
        name: 'Videography (6 hours)',
        description: 'Cinematic wedding video with highlight reel',
        price: 1500,
        duration: 6,
        category: 'videography',
        included: true
      },
      {
        id: '3',
        name: 'DJ Services',
        description: 'Professional DJ with sound system and lighting',
        price: 800,
        duration: 8,
        category: 'dj',
        included: true
      },
      {
        id: '4',
        name: 'Day-of Coordination',
        description: 'Professional coordinator to manage your wedding day',
        price: 600,
        duration: 10,
        category: 'coordination',
        included: true
      }
    ],
    vendor: {
      id: '1',
      name: 'Elegant Moments',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Award-winning wedding professionals with over 10 years of experience creating unforgettable moments.',
      rating: 4.9,
      reviewCount: 127,
      specialties: ['Outdoor Weddings', 'Intimate Ceremonies', 'Luxury Events'],
      experience: 10
    },
    availability: [
      new Date('2024-06-15'),
      new Date('2024-06-22'),
      new Date('2024-07-13'),
      new Date('2024-07-20'),
      new Date('2024-08-10')
    ],
    duration: 10,
    category: 'bundle'
  },
  {
    id: '2',
    name: 'Photography + Video Duo',
    description: 'Capture every moment with our professional photography and videography team.',
    price: 3200,
    originalPrice: 3800,
    rating: 4.8,
    reviewCount: 89,
    location: 'San Francisco, CA',
    images: [
      'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    services: [
      {
        id: '5',
        name: 'Photography (10 hours)',
        description: 'Extended photography coverage with engagement session',
        price: 2200,
        duration: 10,
        category: 'photography',
        included: true
      },
      {
        id: '6',
        name: 'Videography (8 hours)',
        description: 'Full ceremony and reception videography',
        price: 1800,
        duration: 8,
        category: 'videography',
        included: true
      }
    ],
    vendor: {
      id: '2',
      name: 'Timeless Studios',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Creative storytellers specializing in romantic and artistic wedding documentation.',
      rating: 4.8,
      reviewCount: 89,
      specialties: ['Fine Art Photography', 'Cinematic Video', 'Destination Weddings'],
      experience: 8
    },
    availability: [
      new Date('2024-05-25'),
      new Date('2024-06-08'),
      new Date('2024-06-29'),
      new Date('2024-07-06')
    ],
    duration: 10,
    category: 'bundle'
  },
  {
    id: '3',
    name: 'DJ + Coordination Package',
    description: 'Keep your party going with professional DJ services and seamless coordination.',
    price: 1800,
    rating: 4.7,
    reviewCount: 156,
    location: 'San Diego, CA',
    images: [
      'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    services: [
      {
        id: '7',
        name: 'DJ Services (8 hours)',
        description: 'Professional DJ with premium sound system',
        price: 1000,
        duration: 8,
        category: 'dj',
        included: true
      },
      {
        id: '8',
        name: 'Full Wedding Coordination',
        description: 'Complete planning and day-of coordination',
        price: 1200,
        duration: 12,
        category: 'coordination',
        included: true
      }
    ],
    vendor: {
      id: '3',
      name: 'Perfect Harmony',
      avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
      bio: 'Experienced coordinators and entertainment professionals dedicated to your perfect day.',
      rating: 4.7,
      reviewCount: 156,
      specialties: ['Event Coordination', 'Entertainment', 'Timeline Management'],
      experience: 12
    },
    availability: [
      new Date('2024-05-18'),
      new Date('2024-06-01'),
      new Date('2024-06-15'),
      new Date('2024-07-13')
    ],
    duration: 12,
    category: 'bundle'
  }
];

export const mockBookings: Booking[] = [
  {
    id: '1',
    bundleId: '1',
    bundle: mockBundles[0],
    eventDate: new Date('2024-08-15'),
    eventLocation: 'Malibu Creek State Park',
    coupleInfo: {
      bride: 'Sarah Johnson',
      groom: 'Michael Davis',
      email: 'sarah.johnson@email.com',
      phone: '(555) 123-4567'
    },
    totalPrice: 4500,
    status: 'confirmed',
    createdAt: new Date('2024-01-15'),
    paymentStatus: 'paid'
  }
];