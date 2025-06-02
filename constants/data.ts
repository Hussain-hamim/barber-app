export type Barber = {
  id: number;
  name: string;
  experience: string;
  image: string;
  about?: string;
  rating?: number;
  isFavorite?: boolean;
};

export type Service = {
  id: number;
  barberId: number;
  name: string;
  price: string;
  duration: string;
  description?: string;
};

export type Appointment = {
  id: string;
  barberId: number;
  serviceId: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
};

// Use real Pexels images for a more polished look
export const BARBERS: Barber[] = [
  {
    id: 1,
    name: 'Raj Singh',
    experience: '5 years',
    image: 'https://images.pexels.com/photos/1804342/pexels-photo-1804342.jpeg?auto=compress&cs=tinysrgb&w=600',
    about: 'Specializes in classic cuts and modern styles. Known for precision and attention to detail.',
    rating: 4.8,
    isFavorite: false
  },
  {
    id: 2,
    name: 'Amit Verma',
    experience: '3 years',
    image: 'https://images.pexels.com/photos/2076930/pexels-photo-2076930.jpeg?auto=compress&cs=tinysrgb&w=600',
    about: 'Expert in beard grooming and styling. Creates unique looks tailored to each client.',
    rating: 4.6,
    isFavorite: false
  },
  {
    id: 3,
    name: 'Sameer Patel',
    experience: '7 years',
    image: 'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=600',
    about: 'Master barber with skills in traditional and contemporary styles. Trained in London.',
    rating: 4.9,
    isFavorite: false
  },
  {
    id: 4,
    name: 'Karan Sharma',
    experience: '4 years',
    image: 'https://images.pexels.com/photos/1813346/pexels-photo-1813346.jpeg?auto=compress&cs=tinysrgb&w=600',
    about: 'Specializes in fade cuts and hair designs. Popular with younger clients looking for trendy styles.',
    rating: 4.7,
    isFavorite: false
  }
];

export const SERVICES: Service[] = [
  {
    id: 1,
    barberId: 1,
    name: 'Haircut',
    price: '$10',
    duration: '30 minutes',
    description: 'A classic haircut tailored to your face shape and style preferences.'
  },
  {
    id: 2,
    barberId: 1,
    name: 'Beard Trim',
    price: '$6',
    duration: '15 minutes',
    description: 'Precision beard trimming and shaping to enhance your facial features.'
  },
  {
    id: 3,
    barberId: 1,
    name: 'Haircut + Beard',
    price: '$14',
    duration: '45 minutes',
    description: 'Complete grooming package with a haircut and beard trim.'
  },
  {
    id: 4,
    barberId: 2,
    name: 'Haircut',
    price: '$12',
    duration: '30 minutes',
    description: 'Modern haircut with attention to detail and style.'
  },
  {
    id: 5,
    barberId: 2,
    name: 'Beard Trim',
    price: '$8',
    duration: '20 minutes',
    description: 'Expert beard grooming with hot towel treatment.'
  },
  {
    id: 6,
    barberId: 2,
    name: 'Haircut + Beard',
    price: '$18',
    duration: '50 minutes',
    description: 'Complete look transformation with haircut and beard styling.'
  },
  {
    id: 7,
    barberId: 3,
    name: 'Premium Haircut',
    price: '$15',
    duration: '35 minutes',
    description: 'Premium haircut with styling and hair care advice.'
  },
  {
    id: 8,
    barberId: 3,
    name: 'Luxury Shave',
    price: '$12',
    duration: '25 minutes',
    description: 'Traditional straight razor shave with premium products.'
  },
  {
    id: 9,
    barberId: 3,
    name: 'VIP Package',
    price: '$25',
    duration: '60 minutes',
    description: 'Complete grooming experience including haircut, beard styling, and facial treatment.'
  },
  {
    id: 10,
    barberId: 4,
    name: 'Trendy Haircut',
    price: '$14',
    duration: '30 minutes',
    description: 'Modern, trendy haircut with latest styling techniques.'
  },
  {
    id: 11,
    barberId: 4,
    name: 'Beard Design',
    price: '$10',
    duration: '20 minutes',
    description: 'Creative beard designing and styling for a unique look.'
  },
  {
    id: 12,
    barberId: 4,
    name: 'Hair Color',
    price: '$30',
    duration: '90 minutes',
    description: 'Professional hair coloring with quality products.'
  }
];

// Time slots for appointments
export const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'
];