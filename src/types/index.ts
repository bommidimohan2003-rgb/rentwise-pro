export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  password?: string;
  avatar?: string;
  role?: "user" | "admin";
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
  owner: {
    name: string;
    avatar: string;
    rating: number;
    email?: string;
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
