export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';

export interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  category: 'maintenance' | 'repairs' | 'diagnostics' | 'roadside' | 'performance';
  shortDescription: string;
  fullDescription: string;
  features: string[];
  commonProblems: string[];
  symptoms: string[];
  estimatedDurationMinutes: number;
  priceType: 'fixed' | 'from' | 'quote';
  priceAmount?: number;
  iconName: string;
  popular?: boolean;
}

export interface Booking {
  id: string;
  referenceNumber: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  email: string;
  phone: string;
  preferredContact: 'phone' | 'email' | 'whatsapp';
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleRegistration: string;
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  mileage?: string;
  transmission: 'manual' | 'automatic';
  problemDescription: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm
  durationMinutes: number;
  status: BookingStatus;
  internalNotes?: string;
  customerNotes?: string;
  createdAt: string;
}

export interface EstimateRequest {
  id: string;
  referenceNumber: string;
  name: string;
  email: string;
  phone: string;
  preferredContact: 'phone' | 'email' | 'whatsapp';
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  mileage?: string;
  serviceRequired: string;
  problemDescription: string;
  preferredDate?: string;
  fileUrls: string[];
  status: 'new' | 'in_review' | 'quoted' | 'closed';
  createdAt: string;
}

export interface CallbackRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredContactTime: string;
  vehicleRegistration?: string;
  serviceNeeded: string;
  message?: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface RoadsideRequest {
  id: string;
  referenceNumber: string;
  name: string;
  phone: string;
  currentLocation: string;
  vehicleRegistration: string;
  vehicleMakeModel: string;
  problemType: 'battery' | 'no_start' | 'breakdown' | 'mechanical' | 'towing' | 'other';
  vehicleCanMove: boolean;
  notes?: string;
  status: 'dispatched' | 'in_progress' | 'resolved';
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  specialties: string[];
  experienceYears?: number;
  photoUrl: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  platform: 'Google' | 'Verified Client' | 'Direct Feedback';
  serviceUsed?: string;
}

export interface BlockedDate {
  id: string;
  date: string; // YYYY-MM-DD
  reason: string;
}

export interface SiteSettings {
  garageName: string;
  address: string;
  addressLine2: string;
  eircode: string;
  phone: string;
  mobile: string;
  email: string;
  instagram: string;
  weekdayHours: string;
  saturdayHoursNote: string;
  sundayHours: string;
  autoConfirmBookings: boolean;
  bufferBetweenBookingsMinutes: number;
  maxDailyBookings: number;
  heroVideoUrl?: string;
  enableHeroVideo?: boolean;
  /** Bring-your-own-key: set via Staff Portal → Site Settings. Never exposed by the public settings endpoint. */
  geminiApiKey?: string;
  geminiModel?: string;
}
