export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationUpdatedAt?: string;
  password?: string;
  avatar?: string;
  profilePhotoUrl?: string;
  profile_photo_url?: string;
  aadhaarNumber?: string;
  aadhaarMasked?: string;
  aadhaar_masked?: string;
  role?: "user" | "admin";
  status?: "pending" | "approved" | "rejected" | "suspended" | "active";
  createdAt?: string;
  bio?: string;
  occupation?: string;
  website?: string;
  upiId?: string;
  isVerified?: boolean;
  rating?: number;
  rentalsCount?: number;
  listingsCount?: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  angleImages?: { label: string; image: string }[];
  rotationFrames?: string[];
  category: string;
  rating: number;
  reviews: number;
  available: boolean;
  isReference?: boolean;
  status?: "approved" | "pending" | "rejected";
  location?: string;
  owner: {
    name: string;
    avatar: string;
    rating: number;
    email?: string;
    city?: string;
    state?: string;
    address?: string;
    pincode?: string;
    location?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
  image?: string;
}

export interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  startDate: string;
  endDate: string;
  total: number;
  status: "active" | "completed" | "cancelled" | "pending";
  createdAt: string;
  product_id?: string;
  product_title?: string;
  product_image?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  user_email?: string;
  userEmail?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  read: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  from: string;
  avatar: string;
  preview: string;
  time: string;
  unread: boolean;
}

export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem {
  id: string;
  user_email: string;
  product_id: string;
  title: string;
  price: number;
  daily_price: number;
  image: string;
  category: string;
  city: string;
  start_date: string;
  end_date: string;
  days: number;
  total_price: number;
  is_available: boolean;
  conflict_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CartResponse {
  items: CartItem[];
  count: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface ProductAvailabilityItem {
  status: "available" | "unavailable";
  is_available: boolean;
  reason: string | null;
}

export interface BatchAvailabilityResponse {
  start_date: string;
  end_date: string;
  availability: Record<string, ProductAvailabilityItem>;
}

