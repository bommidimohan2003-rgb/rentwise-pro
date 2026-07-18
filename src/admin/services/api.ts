import axios from "axios";

// ----------------------------------------------------------------------
// 1. Interfaces & Types
// ----------------------------------------------------------------------

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "admin" | "agent" | "user";
  status: "active" | "suspended";
  verified: boolean;
  avatar: string;
  createdAt: string;
}

export interface AdminAgent {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  productsCount: number;
  bookingsCount: number;
  revenue: number;
  rating: number;
  status: "active" | "suspended";
  createdAt: string;
}

export interface AdminProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviewsCount: number;
  available: boolean;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  hidden: boolean;
  image: string;
  images: string[];
  documents: string[];
  createdAt: string;
  owner: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    email: string;
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  count: number;
  color: string; // Tailwind class color or hex
  enabled: boolean;
}

export interface AdminBooking {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  customerId: string;
  customerName: string;
  ownerId: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: "pending" | "active" | "completed" | "cancelled";
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: "successful" | "refunded" | "failed";
  method: "Credit Card" | "PayPal" | "Apple Pay" | "Bank Transfer";
  invoiceUrl: string;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  productId: string;
  productTitle: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  hidden: boolean;
  createdAt: string;
}

export interface AdminReport {
  id: string;
  reason: string;
  evidence: string;
  productId: string;
  productTitle: string;
  reporterName: string;
  ownerName: string;
  ownerId: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export interface AdminSupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  userName: string;
  userEmail: string;
  messages: {
    id: string;
    sender: "user" | "admin";
    message: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface AdminSettings {
  websiteName: string;
  logoUrl: string;
  theme: "light" | "dark" | "system";
  contactEmail: string;
  contactPhone: string;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  seoTitle: string;
  seoDescription: string;
  homepageBannerText: string;
  footerText: string;
}

export interface AdminActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  module: string;
  ipAddress: string;
}

// ----------------------------------------------------------------------
// 2. Initial Mock Data
// ----------------------------------------------------------------------

const INITIAL_USERS: AdminUser[] = [
  {
    id: "u-1",
    fullName: "Sarah Connor",
    email: "sarah@payent.com",
    phone: "+1 (555) 234-5678",
    role: "admin",
    status: "active",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    createdAt: "2025-01-10T12:00:00Z",
  },
  {
    id: "u-2",
    fullName: "Alex Mercer",
    email: "alex@example.com",
    phone: "+1 (555) 345-6789",
    role: "agent",
    status: "active",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    createdAt: "2025-02-15T09:30:00Z",
  },
  {
    id: "u-3",
    fullName: "Emily Davis",
    email: "emily@example.com",
    phone: "+1 (555) 456-7890",
    role: "agent",
    status: "active",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    createdAt: "2025-03-01T14:45:00Z",
  },
  {
    id: "u-4",
    fullName: "Michael Chang",
    email: "michael@example.com",
    phone: "+1 (555) 567-8901",
    role: "user",
    status: "active",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    createdAt: "2025-04-18T10:15:00Z",
  },
  {
    id: "u-5",
    fullName: "Jessica Ross",
    email: "jessica@example.com",
    phone: "+1 (555) 678-9012",
    role: "user",
    status: "suspended",
    verified: false,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    createdAt: "2025-05-22T16:20:00Z",
  },
];

const INITIAL_AGENTS: AdminAgent[] = [
  {
    id: "u-2",
    fullName: "Alex Mercer",
    email: "alex@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    productsCount: 6,
    bookingsCount: 42,
    revenue: 8400,
    rating: 4.8,
    status: "active",
    createdAt: "2025-02-15T09:30:00Z",
  },
  {
    id: "u-3",
    fullName: "Emily Davis",
    email: "emily@example.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    productsCount: 4,
    bookingsCount: 28,
    revenue: 4300,
    rating: 4.5,
    status: "active",
    createdAt: "2025-03-01T14:45:00Z",
  },
];

const INITIAL_PRODUCTS: AdminProduct[] = [
  {
    id: "p-1",
    title: "Sony FX3 Cinema Camera",
    description:
      "Compact cinema camera with full-frame sensor, outstanding low-light capabilities, and high frame rate recording.",
    category: "Cameras",
    price: 120,
    rating: 4.9,
    reviewsCount: 15,
    available: true,
    status: "approved",
    featured: true,
    hidden: false,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500",
      "https://images.unsplash.com/photo-1619597455322-4fbbd820250a?w=500",
    ],
    documents: ["sony_fx3_insurance_validation.pdf", "purchase_receipt.jpg"],
    createdAt: "2025-05-01T08:00:00Z",
    owner: {
      id: "u-2",
      name: "Alex Mercer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      rating: 4.8,
      email: "alex@example.com",
    },
  },
  {
    id: "p-2",
    title: "DJI Inspire 3 Drone",
    description:
      "Professional cinema drone with 8K sensor, full-frame capability, and advanced obstacle sensing.",
    category: "Drones",
    price: 350,
    rating: 4.8,
    reviewsCount: 9,
    available: true,
    status: "approved",
    featured: true,
    hidden: false,
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500",
    images: ["https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500"],
    documents: ["dji_drone_fcc_id.pdf"],
    createdAt: "2025-05-05T10:30:00Z",
    owner: {
      id: "u-2",
      name: "Alex Mercer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      rating: 4.8,
      email: "alex@example.com",
    },
  },
  {
    id: "p-3",
    title: 'MacBook Pro 16" M3 Max',
    description:
      "16-inch MacBook Pro with Apple M3 Max chip, 64GB RAM, 2TB SSD, ideal for heavy 3D rendering and video editing.",
    category: "Laptops",
    price: 95,
    rating: 5.0,
    reviewsCount: 4,
    available: true,
    status: "approved",
    featured: false,
    hidden: false,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500"],
    documents: ["serial_number_verification.png"],
    createdAt: "2025-05-10T12:00:00Z",
    owner: {
      id: "u-3",
      name: "Emily Davis",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      rating: 4.5,
      email: "emily@example.com",
    },
  },
  {
    id: "p-4",
    title: "RED Komodo-X Starter Kit",
    description:
      "Cinematic digital camera kit with 6K Global Shutter, RF Mount, and comprehensive rig components.",
    category: "Cameras",
    price: 450,
    rating: 0,
    reviewsCount: 0,
    available: false,
    status: "pending",
    featured: false,
    hidden: false,
    image: "https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=500",
    images: ["https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=500"],
    documents: ["red_ownership_card.jpg", "commercial_lease_doc.pdf"],
    createdAt: "2026-07-17T15:20:00Z",
    owner: {
      id: "u-2",
      name: "Alex Mercer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      rating: 4.8,
      email: "alex@example.com",
    },
  },
  {
    id: "p-5",
    title: "Apple Vision Pro 512GB",
    description:
      "Spatial computer merging digital content with your physical space, experience revolutionary AR/VR.",
    category: "VR & AR",
    price: 150,
    rating: 4.5,
    reviewsCount: 2,
    available: true,
    status: "approved",
    featured: true,
    hidden: false,
    image: "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=500",
    images: ["https://images.unsplash.com/photo-1608248597481-496100c8c836?w=500"],
    documents: ["apple_care_plus_receipt.pdf"],
    createdAt: "2025-06-15T11:00:00Z",
    owner: {
      id: "u-3",
      name: "Emily Davis",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      rating: 4.5,
      email: "emily@example.com",
    },
  },
];

const INITIAL_CATEGORIES: AdminCategory[] = [
  {
    id: "cat-1",
    name: "Cameras",
    icon: "Camera",
    count: 24,
    color: "bg-blue-500/10 text-blue-500",
    enabled: true,
  },
  {
    id: "cat-2",
    name: "Drones",
    icon: "Plane",
    count: 12,
    color: "bg-green-500/10 text-green-500",
    enabled: true,
  },
  {
    id: "cat-3",
    name: "Laptops",
    icon: "Laptop",
    count: 18,
    color: "bg-purple-500/10 text-purple-500",
    enabled: true,
  },
  {
    id: "cat-4",
    name: "Audio",
    icon: "Mic",
    count: 15,
    color: "bg-orange-500/10 text-orange-500",
    enabled: true,
  },
  {
    id: "cat-5",
    name: "VR & AR",
    icon: "Glasses",
    count: 8,
    color: "bg-pink-500/10 text-pink-500",
    enabled: true,
  },
];

const INITIAL_BOOKINGS: AdminBooking[] = [
  {
    id: "b-1",
    productId: "p-1",
    productTitle: "Sony FX3 Cinema Camera",
    productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500",
    customerId: "u-4",
    customerName: "Michael Chang",
    ownerId: "u-2",
    ownerName: "Alex Mercer",
    startDate: "2026-07-15",
    endDate: "2026-07-18",
    amount: 360,
    status: "active",
    createdAt: "2026-07-10T09:00:00Z",
  },
  {
    id: "b-2",
    productId: "p-3",
    productTitle: 'MacBook Pro 16" M3 Max',
    productImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
    customerId: "u-5",
    customerName: "Jessica Ross",
    ownerId: "u-3",
    ownerName: "Emily Davis",
    startDate: "2026-07-20",
    endDate: "2026-07-25",
    amount: 475,
    status: "pending",
    createdAt: "2026-07-17T11:30:00Z",
  },
  {
    id: "b-3",
    productId: "p-2",
    productTitle: "DJI Inspire 3 Drone",
    productImage: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500",
    customerId: "u-4",
    customerName: "Michael Chang",
    ownerId: "u-2",
    ownerName: "Alex Mercer",
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    amount: 1400,
    status: "completed",
    createdAt: "2026-05-25T14:00:00Z",
  },
];

const INITIAL_PAYMENTS: AdminPayment[] = [
  {
    id: "tx-1",
    bookingId: "b-1",
    customerId: "u-4",
    customerName: "Michael Chang",
    amount: 360,
    status: "successful",
    method: "Credit Card",
    invoiceUrl: "#",
    createdAt: "2026-07-10T09:05:00Z",
  },
  {
    id: "tx-2",
    bookingId: "b-2",
    customerId: "u-5",
    customerName: "Jessica Ross",
    amount: 475,
    status: "successful",
    method: "PayPal",
    invoiceUrl: "#",
    createdAt: "2026-07-17T11:35:00Z",
  },
  {
    id: "tx-3",
    bookingId: "b-3",
    customerId: "u-4",
    customerName: "Michael Chang",
    amount: 1400,
    status: "successful",
    method: "Credit Card",
    invoiceUrl: "#",
    createdAt: "2026-05-25T14:10:00Z",
  },
];

const INITIAL_REVIEWS: AdminReview[] = [
  {
    id: "r-1",
    productId: "p-1",
    productTitle: "Sony FX3 Cinema Camera",
    userName: "Michael Chang",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    rating: 5,
    comment:
      "Excellent camera package! Alex was extremely helpful and everything was set up perfectly. Highly recommended.",
    hidden: false,
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: "r-2",
    productId: "p-5",
    productTitle: "Apple Vision Pro 512GB",
    userName: "Jessica Ross",
    userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    rating: 4,
    comment:
      "Incredible tech, but quite heavy for long usage. The device itself was clean and in perfect condition.",
    hidden: false,
    createdAt: "2026-07-02T15:30:00Z",
  },
];

const INITIAL_REPORTS: AdminReport[] = [
  {
    id: "rep-1",
    reason: "Damaged battery package on delivery.",
    evidence: "The lens filter is cracked and the battery is bloated.",
    productId: "p-2",
    productTitle: "DJI Inspire 3 Drone",
    reporterName: "Michael Chang",
    ownerId: "u-2",
    ownerName: "Alex Mercer",
    status: "open",
    createdAt: "2026-07-16T18:00:00Z",
  },
];

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "n-1",
    title: "New listing request",
    message: "Alex Mercer requested approval for RED Komodo-X Starter Kit.",
    type: "warning",
    read: false,
    createdAt: "2026-07-17T15:20:00Z",
  },
  {
    id: "n-2",
    title: "Product Reported",
    message: "Michael Chang reported a damaged battery on DJI Inspire 3 Drone.",
    type: "error",
    read: false,
    createdAt: "2026-07-16T18:00:00Z",
  },
  {
    id: "n-3",
    title: "New registration",
    message: "Jessica Ross registered as a new customer.",
    type: "success",
    read: true,
    createdAt: "2026-07-15T12:00:00Z",
  },
];

const INITIAL_TICKETS: AdminSupportTicket[] = [
  {
    id: "t-1",
    subject: "Payout Delay Issues",
    category: "Payouts",
    status: "open",
    priority: "high",
    userName: "Alex Mercer",
    userEmail: "alex@example.com",
    messages: [
      {
        id: "tm-1",
        sender: "user",
        message:
          "Hi support, my payout for the camera rental has been delayed for 3 days now. Can you please check?",
        createdAt: "2026-07-17T09:00:00Z",
      },
    ],
    createdAt: "2026-07-17T09:00:00Z",
  },
  {
    id: "t-2",
    subject: "Insurance Coverage Question",
    category: "Insurance",
    status: "resolved",
    priority: "medium",
    userName: "Emily Davis",
    userEmail: "emily@example.com",
    messages: [
      {
        id: "tm-2",
        sender: "user",
        message: "What does the liability cover if my laptop gets water damage?",
        createdAt: "2026-07-16T14:00:00Z",
      },
      {
        id: "tm-3",
        sender: "admin",
        message:
          "Hello Emily! The Payent protection plan covers accidental water damage up to 90% of the replacement value minus a small deductible.",
        createdAt: "2026-07-16T15:30:00Z",
      },
    ],
    createdAt: "2026-07-16T14:00:00Z",
  },
];

const INITIAL_SETTINGS: AdminSettings = {
  websiteName: "Payent",
  logoUrl: "/favicon.svg",
  theme: "dark",
  contactEmail: "admin@payent.com",
  contactPhone: "+1 (800) 555-GEAR",
  socialFacebook: "https://facebook.com/payent",
  socialTwitter: "https://twitter.com/payent",
  socialInstagram: "https://instagram.com/payent",
  seoTitle: "Payent — Premium Tech Gear Rental Marketplace",
  seoDescription:
    "Rent professional video gear, cameras, laptops, drones, and consoles. Safe, secure, and fully insured.",
  homepageBannerText: "Unlock premium gear at a fraction of the cost.",
  footerText: "© 2026 Payent Inc. All rights reserved.",
};

const INITIAL_LOGS: AdminActivityLog[] = [
  {
    id: "l-1",
    timestamp: "2026-07-18T08:00:00Z",
    userName: "Sarah Connor",
    action: "User Login",
    module: "Auth",
    ipAddress: "192.168.1.1",
  },
  {
    id: "l-2",
    timestamp: "2026-07-17T15:25:00Z",
    userName: "Sarah Connor",
    action: "Review Reported Listing",
    module: "Reports",
    ipAddress: "192.168.1.1",
  },
  {
    id: "l-3",
    timestamp: "2026-07-16T10:12:00Z",
    userName: "Alex Mercer",
    action: "Upload Product (RED Komodo)",
    module: "Inventory",
    ipAddress: "192.168.1.55",
  },
];

// ----------------------------------------------------------------------
// 3. Database State Persistence (localStorage wrapper)
// ----------------------------------------------------------------------

const getDB = <T>(key: string, initial: T): T => {
  if (typeof window === "undefined") return initial;
  const data = localStorage.getItem(`payent:admin:${key}`);
  if (data) return JSON.parse(data);

  localStorage.setItem(`payent:admin:${key}`, JSON.stringify(initial));
  return initial;
};

const setDB = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`payent:admin:${key}`, JSON.stringify(value));
};

const writeDb = (key: string, value: unknown) => {
  localStorage.setItem(`payent:admin:${key}`, JSON.stringify(value));
};

const readDb = (key: string) => {
  const data = localStorage.getItem(`payent:admin:${key}`);
  return data ? JSON.parse(data) : null;
};

// Initialize DBs
const initDB = () => {
  getDB("users", INITIAL_USERS);
  getDB("agents", INITIAL_AGENTS);
  getDB("products", INITIAL_PRODUCTS);
  getDB("categories", INITIAL_CATEGORIES);
  getDB("bookings", INITIAL_BOOKINGS);
  getDB("payments", INITIAL_PAYMENTS);
  getDB("reviews", INITIAL_REVIEWS);
  getDB("reports", INITIAL_REPORTS);
  getDB("notifications", INITIAL_NOTIFICATIONS);
  getDB("tickets", INITIAL_TICKETS);
  getDB("settings", INITIAL_SETTINGS);
  getDB("logs", INITIAL_LOGS);
};

initDB();

// ----------------------------------------------------------------------
// 4. Axios Client & Interceptors
// ----------------------------------------------------------------------

export const adminApi = axios.create({
  baseURL: "/api/admin",
  timeout: 10000,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("payent:admin:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock Interceptor logic
adminApi.interceptors.response.use(
  async (response) => {
    // We simulate a network delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    return response;
  },
  async (error) => {
    const config = error.config;
    if (!config || !config.url) {
      return Promise.reject(error);
    }

    // Strip out baseURL
    const url = config.url.replace("/api/admin", "").split("?")[0];
    const method = config.method?.toUpperCase();

    await new Promise((resolve) => setTimeout(resolve, 450));

    try {
      // AUTH ENDPOINTS
      if (url === "/auth/login" && method === "POST") {
        const { email, password } = JSON.parse(config.data || "{}");
        if (email === "admin@payent.com" && (password === "admin123" || password === "admin@123")) {
          localStorage.setItem("payent:admin:token", "mock-admin-token");
          const users = getDB<AdminUser[]>("users", INITIAL_USERS);
          const adminProfile = users.find((u) => u.email === "admin@payent.com") || users[0];
          localStorage.setItem("payent:admin:current_user", JSON.stringify(adminProfile));

          // Log activity
          const logs = getDB<AdminActivityLog[]>("logs", INITIAL_LOGS);
          logs.unshift({
            id: `l-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userName: adminProfile.fullName,
            action: "Admin Login Success",
            module: "Auth",
            ipAddress: "127.0.0.1",
          });
          setDB("logs", logs);

          return {
            status: 200,
            data: { success: true, token: "mock-admin-token", user: adminProfile },
            headers: {},
            config,
          };
        } else {
          return Promise.reject({
            response: {
              status: 401,
              data: { message: "Invalid email or password. Use admin@payent.com / admin123 or admin@123" },
            },
          });
        }
      }

      if (url === "/auth/logout" && method === "POST") {
        localStorage.removeItem("payent:admin:token");
        localStorage.removeItem("payent:admin:current_user");
        return { status: 200, data: { success: true }, headers: {}, config };
      }

      if (url === "/auth/me" && method === "GET") {
        const rawUser = localStorage.getItem("payent:admin:current_user");
        if (rawUser) {
          return { status: 200, data: JSON.parse(rawUser), headers: {}, config };
        }
        return Promise.reject({ response: { status: 401, data: { message: "Unauthorized" } } });
      }

      // DASHBOARD METRICS
      if (url === "/dashboard/stats" && method === "GET") {
        const users = getDB<AdminUser[]>("users", INITIAL_USERS);
        const agents = getDB<AdminAgent[]>("agents", INITIAL_AGENTS);
        const products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
        const categories = getDB<AdminCategory[]>("categories", INITIAL_CATEGORIES);
        const bookings = getDB<AdminBooking[]>("bookings", INITIAL_BOOKINGS);
        const reports = getDB<AdminReport[]>("reports", INITIAL_REPORTS);
        const notifications = getDB<AdminNotification[]>("notifications", INITIAL_NOTIFICATIONS);

        const pendingProducts = products.filter((p) => p.status === "pending").length;
        const approvedProducts = products.filter((p) => p.status === "approved").length;
        const rejectedProducts = products.filter((p) => p.status === "rejected").length;

        const bookingsToday = bookings.filter(
          (b) => b.createdAt.startsWith("2026-07-18") || b.createdAt.startsWith("2026-07-17"),
        ).length;
        const monthlyBookings = bookings.length;

        const revenueToday = bookings
          .filter(
            (b) => b.createdAt.startsWith("2026-07-18") || b.createdAt.startsWith("2026-07-17"),
          )
          .reduce((sum, b) => sum + b.amount, 0);
        const monthlyRevenue = bookings.reduce((sum, b) => sum + b.amount, 0);

        const pendingReports = reports.filter((r) => r.status === "open").length;
        const unreadNotifications = notifications.filter((n) => !n.read).length;

        return {
          status: 200,
          data: {
            totalUsers: users.length,
            totalAgents: agents.length,
            totalProducts: products.length,
            pendingProducts,
            approvedProducts,
            rejectedProducts,
            totalCategories: categories.length,
            bookingsToday,
            monthlyBookings,
            revenueToday,
            monthlyRevenue,
            pendingReports,
            unreadNotifications,
            websiteVisitors: 15420,
          },
          headers: {},
          config,
        };
      }

      if (url === "/dashboard/charts" && method === "GET") {
        // Mock chart structures
        const revenueChart = [
          { name: "Jan", revenue: 4200 },
          { name: "Feb", revenue: 5800 },
          { name: "Mar", revenue: 6100 },
          { name: "Apr", revenue: 8400 },
          { name: "May", revenue: 9900 },
          { name: "Jun", revenue: 12500 },
          { name: "Jul", revenue: 14750 },
        ];

        const bookingChart = [
          { name: "Jan", bookings: 18 },
          { name: "Feb", bookings: 25 },
          { name: "Mar", bookings: 29 },
          { name: "Apr", bookings: 42 },
          { name: "May", bookings: 51 },
          { name: "Jun", bookings: 68 },
          { name: "Jul", bookings: 75 },
        ];

        const userGrowth = [
          { name: "Jan", users: 120 },
          { name: "Feb", users: 160 },
          { name: "Mar", users: 210 },
          { name: "Apr", users: 320 },
          { name: "May", users: 440 },
          { name: "Jun", users: 510 },
          { name: "Jul", users: 650 },
        ];

        const productGrowth = [
          { name: "Jan", products: 45 },
          { name: "Feb", products: 60 },
          { name: "Mar", products: 80 },
          { name: "Apr", products: 120 },
          { name: "May", products: 170 },
          { name: "Jun", products: 220 },
          { name: "Jul", products: 280 },
        ];

        const categoryDistribution = [
          { name: "Cameras", value: 40 },
          { name: "Drones", value: 25 },
          { name: "Laptops", value: 15 },
          { name: "Audio", value: 12 },
          { name: "VR & AR", value: 8 },
        ];

        const topProducts = [
          { name: "Sony FX3 Camera", rentals: 28, revenue: 3360 },
          { name: "DJI Inspire 3 Drone", rentals: 14, revenue: 4900 },
          { name: "MacBook Pro M3 Max", rentals: 18, revenue: 1710 },
          { name: "Apple Vision Pro", rentals: 9, revenue: 1350 },
        ];

        return {
          status: 200,
          data: {
            revenueChart,
            bookingChart,
            userGrowth,
            productGrowth,
            categoryDistribution,
            topProducts,
          },
          headers: {},
          config,
        };
      }

      if (url === "/dashboard/activities" && method === "GET") {
        return {
          status: 200,
          data: [
            {
              id: "a-1",
              type: "user_registered",
              title: "New User Registered",
              detail: "Emily Davis joined Payent",
              time: "5 mins ago",
              icon: "UserPlus",
            },
            {
              id: "a-2",
              type: "product_uploaded",
              title: "Camera Uploaded",
              detail: "RED Komodo-X submitted by Alex Mercer",
              time: "25 mins ago",
              icon: "Camera",
            },
            {
              id: "a-3",
              type: "product_approved",
              title: "Product Approved",
              detail: "Sony FX3 Camera listing approved",
              time: "1 hour ago",
              icon: "CheckCircle",
            },
            {
              id: "a-4",
              type: "booking_created",
              title: "Booking Created",
              detail: "Sony FX3 booked by Michael Chang",
              time: "2 hours ago",
              icon: "Calendar",
            },
            {
              id: "a-5",
              type: "payment_success",
              title: "Payment Successful",
              detail: "$360 transaction for Booking #b-1",
              time: "2 hours ago",
              icon: "CreditCard",
            },
            {
              id: "a-6",
              type: "review_submitted",
              title: "Review Submitted",
              detail: "Michael Chang gave Sony FX3 5 Stars",
              time: "3 hours ago",
              icon: "Star",
            },
            {
              id: "a-7",
              type: "product_reported",
              title: "Product Reported",
              detail: "DJI Inspire 3 reported by Michael",
              time: "1 day ago",
              icon: "Flag",
            },
          ],
          headers: {},
          config,
        };
      }

      // USERS ENDPOINTS
      if (url === "/users" && method === "GET") {
        const users = getDB<AdminUser[]>("users", INITIAL_USERS);
        return { status: 200, data: users, headers: {}, config };
      }

      if (url.startsWith("/users/") && method === "DELETE") {
        const id = url.split("/")[2];
        let users = getDB<AdminUser[]>("users", INITIAL_USERS);
        users = users.filter((u) => u.id !== id);
        setDB("users", users);
        return { status: 200, data: { success: true }, headers: {}, config };
      }

      if (url === "/profile" && method === "POST") {
        const rawUser = localStorage.getItem("payent:admin:current_user");
        const body = JSON.parse(config.data || "{}");
        const users = readDb("users") as AdminUser[];
        const idx = users.findIndex((u) => u.id === (rawUser ? JSON.parse(rawUser).id : ""));
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...body };
          writeDb("users", users);
          localStorage.setItem("payent:admin:current_user", JSON.stringify(users[idx]));
          return { status: 200, data: users[idx], headers: {}, config };
        }
      }

      if (url.startsWith("/users/") && method === "PUT") {
        const id = url.split("/")[2];
        const patch = JSON.parse(config.data || "{}");
        const users = getDB<AdminUser[]>("users", INITIAL_USERS);
        const idx = users.findIndex((u) => u.id === id);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...patch };
          setDB("users", users);
          return { status: 200, data: users[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "User not found" } } });
      }

      if (url.startsWith("/users/") && url.endsWith("/suspend") && method === "POST") {
        const id = url.split("/")[2];
        const users = getDB<AdminUser[]>("users", INITIAL_USERS);
        const idx = users.findIndex((u) => u.id === id);
        if (idx !== -1) {
          users[idx].status = "suspended";
          setDB("users", users);
          return { status: 200, data: users[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "User not found" } } });
      }

      if (url.startsWith("/users/") && url.endsWith("/activate") && method === "POST") {
        const id = url.split("/")[2];
        const users = getDB<AdminUser[]>("users", INITIAL_USERS);
        const idx = users.findIndex((u) => u.id === id);
        if (idx !== -1) {
          users[idx].status = "active";
          setDB("users", users);
          return { status: 200, data: users[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "User not found" } } });
      }

      // AGENTS ENDPOINTS
      if (url === "/agents" && method === "GET") {
        const agents = getDB<AdminAgent[]>("agents", INITIAL_AGENTS);
        return { status: 200, data: agents, headers: {}, config };
      }

      if (url.startsWith("/agents/") && method === "DELETE") {
        const id = url.split("/")[2];
        let agents = getDB<AdminAgent[]>("agents", INITIAL_AGENTS);
        agents = agents.filter((a) => a.id !== id);
        setDB("agents", agents);
        return { status: 200, data: { success: true }, headers: {}, config };
      }

      if (url.startsWith("/agents/") && url.endsWith("/suspend") && method === "POST") {
        const id = url.split("/")[2];
        const agents = getDB<AdminAgent[]>("agents", INITIAL_AGENTS);
        const idx = agents.findIndex((a) => a.id === id);
        if (idx !== -1) {
          agents[idx].status = "suspended";
          setDB("agents", agents);
          return { status: 200, data: agents[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "Agent not found" } } });
      }

      // PRODUCTS ENDPOINTS
      if (url === "/products" && method === "GET") {
        const products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
        return { status: 200, data: products, headers: {}, config };
      }

      if (url.startsWith("/products/") && method === "GET") {
        const id = url.split("/")[2];
        const products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
        const product = products.find((p) => p.id === id);
        if (product) {
          return { status: 200, data: product, headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Product not found" } },
        });
      }

      if (url.startsWith("/products/") && method === "PUT") {
        const id = url.split("/")[2];
        const patch = JSON.parse(config.data || "{}");
        const products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
        const idx = products.findIndex((p) => p.id === id);
        if (idx !== -1) {
          products[idx] = { ...products[idx], ...patch };
          setDB("products", products);
          return { status: 200, data: products[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Product not found" } },
        });
      }

      if (url.startsWith("/products/") && method === "DELETE") {
        const id = url.split("/")[2];
        let products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
        products = products.filter((p) => p.id !== id);
        setDB("products", products);
        return { status: 200, data: { success: true }, headers: {}, config };
      }

      if (url.startsWith("/products/") && url.endsWith("/approve") && method === "POST") {
        const id = url.split("/")[2];
        const products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
        const idx = products.findIndex((p) => p.id === id);
        if (idx !== -1) {
          products[idx].status = "approved";
          products[idx].available = true;
          setDB("products", products);
          return { status: 200, data: products[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Product not found" } },
        });
      }

      if (url.startsWith("/products/") && url.endsWith("/reject") && method === "POST") {
        const id = url.split("/")[2];
        const products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
        const idx = products.findIndex((p) => p.id === id);
        if (idx !== -1) {
          products[idx].status = "rejected";
          products[idx].available = false;
          setDB("products", products);
          return { status: 200, data: products[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Product not found" } },
        });
      }

      if (url.startsWith("/products/") && url.endsWith("/toggle-feature") && method === "POST") {
        const id = url.split("/")[2];
        const products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
        const idx = products.findIndex((p) => p.id === id);
        if (idx !== -1) {
          products[idx].featured = !products[idx].featured;
          setDB("products", products);
          return { status: 200, data: products[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Product not found" } },
        });
      }

      if (url.startsWith("/products/") && url.endsWith("/toggle-hide") && method === "POST") {
        const id = url.split("/")[2];
        const products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
        const idx = products.findIndex((p) => p.id === id);
        if (idx !== -1) {
          products[idx].hidden = !products[idx].hidden;
          setDB("products", products);
          return { status: 200, data: products[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Product not found" } },
        });
      }

      // CATEGORIES ENDPOINTS
      if (url === "/categories" && method === "GET") {
        const categories = getDB<AdminCategory[]>("categories", INITIAL_CATEGORIES);
        return { status: 200, data: categories, headers: {}, config };
      }

      if (url === "/categories" && method === "POST") {
        const categoryData = JSON.parse(config.data || "{}");
        const categories = getDB<AdminCategory[]>("categories", INITIAL_CATEGORIES);
        const newCat: AdminCategory = {
          id: `cat-${Date.now()}`,
          name: categoryData.name,
          icon: categoryData.icon || "Laptop",
          count: 0,
          color: categoryData.color || "bg-gray-500/10 text-gray-500",
          enabled: true,
        };
        categories.push(newCat);
        setDB("categories", categories);
        return { status: 201, data: newCat, headers: {}, config };
      }

      if (url.startsWith("/categories/") && method === "PUT") {
        const id = url.split("/")[2];
        const patch = JSON.parse(config.data || "{}");
        const categories = getDB<AdminCategory[]>("categories", INITIAL_CATEGORIES);
        const idx = categories.findIndex((c) => c.id === id);
        if (idx !== -1) {
          categories[idx] = { ...categories[idx], ...patch };
          setDB("categories", categories);
          return { status: 200, data: categories[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Category not found" } },
        });
      }

      if (url.startsWith("/categories/") && method === "DELETE") {
        const id = url.split("/")[2];
        let categories = getDB<AdminCategory[]>("categories", INITIAL_CATEGORIES);
        categories = categories.filter((c) => c.id !== id);
        setDB("categories", categories);
        return { status: 200, data: { success: true }, headers: {}, config };
      }

      // BOOKINGS ENDPOINTS
      if (url === "/bookings" && method === "GET") {
        const bookings = getDB<AdminBooking[]>("bookings", INITIAL_BOOKINGS);
        return { status: 200, data: bookings, headers: {}, config };
      }

      if (url.startsWith("/bookings/") && url.endsWith("/cancel") && method === "POST") {
        const id = url.split("/")[2];
        const bookings = getDB<AdminBooking[]>("bookings", INITIAL_BOOKINGS);
        const idx = bookings.findIndex((b) => b.id === id);
        if (idx !== -1) {
          bookings[idx].status = "cancelled";
          setDB("bookings", bookings);
          return { status: 200, data: bookings[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Booking not found" } },
        });
      }

      if (url.startsWith("/bookings/") && url.endsWith("/complete") && method === "POST") {
        const id = url.split("/")[2];
        const bookings = getDB<AdminBooking[]>("bookings", INITIAL_BOOKINGS);
        const idx = bookings.findIndex((b) => b.id === id);
        if (idx !== -1) {
          bookings[idx].status = "completed";
          setDB("bookings", bookings);
          return { status: 200, data: bookings[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Booking not found" } },
        });
      }

      if (url.startsWith("/bookings/") && url.endsWith("/refund") && method === "POST") {
        const id = url.split("/")[2];
        const bookings = getDB<AdminBooking[]>("bookings", INITIAL_BOOKINGS);
        const idx = bookings.findIndex((b) => b.id === id);
        if (idx !== -1) {
          bookings[idx].status = "cancelled";
          setDB("bookings", bookings);

          // Update related payment to refunded
          const payments = getDB<AdminPayment[]>("payments", INITIAL_PAYMENTS);
          const payIdx = payments.findIndex((p) => p.bookingId === id);
          if (payIdx !== -1) {
            payments[payIdx].status = "refunded";
            setDB("payments", payments);
          }

          return { status: 200, data: bookings[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Booking not found" } },
        });
      }

      // PAYMENTS ENDPOINTS
      if (url === "/payments" && method === "GET") {
        const payments = getDB<AdminPayment[]>("payments", INITIAL_PAYMENTS);
        return { status: 200, data: payments, headers: {}, config };
      }

      if (url.startsWith("/payments/") && url.endsWith("/refund") && method === "POST") {
        const id = url.split("/")[2];
        const payments = getDB<AdminPayment[]>("payments", INITIAL_PAYMENTS);
        const idx = payments.findIndex((p) => p.id === id);
        if (idx !== -1) {
          payments[idx].status = "refunded";
          setDB("payments", payments);

          // Update booking to cancelled
          const bookings = getDB<AdminBooking[]>("bookings", INITIAL_BOOKINGS);
          const bookIdx = bookings.findIndex((b) => b.id === payments[idx].bookingId);
          if (bookIdx !== -1) {
            bookings[bookIdx].status = "cancelled";
            setDB("bookings", bookings);
          }

          return { status: 200, data: payments[idx], headers: {}, config };
        }
        return Promise.reject({
          response: { status: 404, data: { message: "Payment transaction not found" } },
        });
      }

      // REVIEWS ENDPOINTS
      if (url === "/reviews" && method === "GET") {
        const reviews = getDB<AdminReview[]>("reviews", INITIAL_REVIEWS);
        return { status: 200, data: reviews, headers: {}, config };
      }

      if (url.startsWith("/reviews/") && method === "DELETE") {
        const id = url.split("/")[2];
        let reviews = getDB<AdminReview[]>("reviews", INITIAL_REVIEWS);
        reviews = reviews.filter((r) => r.id !== id);
        setDB("reviews", reviews);
        return { status: 200, data: { success: true }, headers: {}, config };
      }

      if (url.startsWith("/reviews/") && url.endsWith("/toggle-hide") && method === "POST") {
        const id = url.split("/")[2];
        const reviews = getDB<AdminReview[]>("reviews", INITIAL_REVIEWS);
        const idx = reviews.findIndex((r) => r.id === id);
        if (idx !== -1) {
          reviews[idx].hidden = !reviews[idx].hidden;
          setDB("reviews", reviews);
          return { status: 200, data: reviews[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "Review not found" } } });
      }

      // REPORTS ENDPOINTS
      if (url === "/reports" && method === "GET") {
        const reports = getDB<AdminReport[]>("reports", INITIAL_REPORTS);
        return { status: 200, data: reports, headers: {}, config };
      }

      if (url.startsWith("/reports/") && url.endsWith("/resolve") && method === "POST") {
        const id = url.split("/")[2];
        const reports = getDB<AdminReport[]>("reports", INITIAL_REPORTS);
        const idx = reports.findIndex((r) => r.id === id);
        if (idx !== -1) {
          reports[idx].status = "resolved";
          setDB("reports", reports);
          return { status: 200, data: reports[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "Report not found" } } });
      }

      if (url.startsWith("/reports/") && url.endsWith("/dismiss") && method === "POST") {
        const id = url.split("/")[2];
        const reports = getDB<AdminReport[]>("reports", INITIAL_REPORTS);
        const idx = reports.findIndex((r) => r.id === id);
        if (idx !== -1) {
          reports[idx].status = "dismissed";
          setDB("reports", reports);
          return { status: 200, data: reports[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "Report not found" } } });
      }

      if (url.startsWith("/reports/") && url.endsWith("/suspend-product") && method === "POST") {
        const id = url.split("/")[2];
        const reports = getDB<AdminReport[]>("reports", INITIAL_REPORTS);
        const idx = reports.findIndex((r) => r.id === id);
        if (idx !== -1) {
          reports[idx].status = "resolved";
          setDB("reports", reports);

          // Suspend product
          const products = getDB<AdminProduct[]>("products", INITIAL_PRODUCTS);
          const pIdx = products.findIndex((p) => p.id === reports[idx].productId);
          if (pIdx !== -1) {
            products[pIdx].status = "rejected";
            products[pIdx].available = false;
            setDB("products", products);
          }

          return { status: 200, data: reports[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "Report not found" } } });
      }

      if (url.startsWith("/reports/") && url.endsWith("/ban-user") && method === "POST") {
        const id = url.split("/")[2];
        const reports = getDB<AdminReport[]>("reports", INITIAL_REPORTS);
        const idx = reports.findIndex((r) => r.id === id);
        if (idx !== -1) {
          reports[idx].status = "resolved";
          setDB("reports", reports);

          // Suspend user (Owner of the product)
          const users = getDB<AdminUser[]>("users", INITIAL_USERS);
          const uIdx = users.findIndex((u) => u.id === reports[idx].ownerId);
          if (uIdx !== -1) {
            users[uIdx].status = "suspended";
            setDB("users", users);
          }

          // Suspend agents table if they are there
          const agents = getDB<AdminAgent[]>("agents", INITIAL_AGENTS);
          const aIdx = agents.findIndex((a) => a.id === reports[idx].ownerId);
          if (aIdx !== -1) {
            agents[aIdx].status = "suspended";
            setDB("agents", agents);
          }

          return { status: 200, data: reports[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "Report not found" } } });
      }

      // NOTIFICATIONS ENDPOINTS
      if (url === "/notifications" && method === "GET") {
        const notifications = getDB<AdminNotification[]>("notifications", INITIAL_NOTIFICATIONS);
        return { status: 200, data: notifications, headers: {}, config };
      }

      if (url === "/notifications/mark-read" && method === "POST") {
        const notifications = getDB<AdminNotification[]>("notifications", INITIAL_NOTIFICATIONS);
        notifications.forEach((n) => {
          n.read = true;
        });
        setDB("notifications", notifications);
        return { status: 200, data: { success: true }, headers: {}, config };
      }

      if (url.startsWith("/notifications/") && method === "DELETE") {
        const id = url.split("/")[2];
        let notifications = getDB<AdminNotification[]>("notifications", INITIAL_NOTIFICATIONS);
        notifications = notifications.filter((n) => n.id !== id);
        setDB("notifications", notifications);
        return { status: 200, data: { success: true }, headers: {}, config };
      }

      // SUPPORT ENDPOINTS
      if (url === "/support" && method === "GET") {
        const tickets = getDB<AdminSupportTicket[]>("tickets", INITIAL_TICKETS);
        return { status: 200, data: tickets, headers: {}, config };
      }

      if (url.startsWith("/support/") && url.endsWith("/reply") && method === "POST") {
        const id = url.split("/")[2];
        const { message } = JSON.parse(config.data || "{}");
        const tickets = getDB<AdminSupportTicket[]>("tickets", INITIAL_TICKETS);
        const idx = tickets.findIndex((t) => t.id === id);
        if (idx !== -1) {
          tickets[idx].messages.push({
            id: `tm-${Date.now()}`,
            sender: "admin",
            message,
            createdAt: new Date().toISOString(),
          });
          tickets[idx].status = "pending"; // Waiting on user response now
          setDB("tickets", tickets);
          return { status: 200, data: tickets[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "Ticket not found" } } });
      }

      if (url.startsWith("/support/") && url.endsWith("/status") && method === "POST") {
        const id = url.split("/")[2];
        const { status } = JSON.parse(config.data || "{}");
        const tickets = getDB<AdminSupportTicket[]>("tickets", INITIAL_TICKETS);
        const idx = tickets.findIndex((t) => t.id === id);
        if (idx !== -1) {
          tickets[idx].status = status;
          setDB("tickets", tickets);
          return { status: 200, data: tickets[idx], headers: {}, config };
        }
        return Promise.reject({ response: { status: 404, data: { message: "Ticket not found" } } });
      }

      // SETTINGS ENDPOINTS
      if (url === "/settings" && method === "GET") {
        const settings = getDB<AdminSettings>("settings", INITIAL_SETTINGS);
        return { status: 200, data: settings, headers: {}, config };
      }

      if (url === "/settings" && method === "POST") {
        const settingsData = JSON.parse(config.data || "{}");
        const settings = getDB<AdminSettings>("settings", INITIAL_SETTINGS);
        const updated = { ...settings, ...settingsData };
        setDB("settings", updated);

        return { status: 200, data: updated, headers: {}, config };
      }

      // PROFILE ENDPOINTS
      if (url === "/profile" && method === "GET") {
        const rawUser = localStorage.getItem("payent:admin:current_user");
        if (rawUser) {
          return { status: 200, data: JSON.parse(rawUser), headers: {}, config };
        }
        return Promise.reject({ response: { status: 401, data: { message: "Unauthorized" } } });
      }

      if (url === "/profile" && method === "POST") {
        const patch = JSON.parse(config.data || "{}");
        const rawUser = localStorage.getItem("payent:admin:current_user");
        if (rawUser) {
          const activeUser = JSON.parse(rawUser);
          const users = getDB<AdminUser[]>("users", INITIAL_USERS);
          const idx = users.findIndex((u) => u.id === activeUser.id);
          if (idx !== -1) {
            users[idx] = { ...users[idx], ...patch };
            setDB("users", users);
            localStorage.setItem("payent:admin:current_user", JSON.stringify(users[idx]));
            return { status: 200, data: users[idx], headers: {}, config };
          }
        }
        return Promise.reject({
          response: { status: 404, data: { message: "User profile not found" } },
        });
      }

      if (url === "/profile/password" && method === "POST") {
        return {
          status: 200,
          data: { success: true, message: "Password updated successfully" },
          headers: {},
          config,
        };
      }

      // ACTIVITY LOGS ENDPOINTS
      if (url === "/activity-logs" && method === "GET") {
        const logs = getDB<AdminActivityLog[]>("logs", INITIAL_LOGS);
        return { status: 200, data: logs, headers: {}, config };
      }

      // Fallback
      return Promise.reject({
        response: {
          status: 404,
          data: { message: `Mock API route not found: ${method} ${url}` },
        },
      });
    } catch (e: unknown) {
      return Promise.reject({
        response: {
          status: 500,
          data: { message: e instanceof Error ? e.message : "Internal Mock Server Error" },
        },
      });
    }
  },
);
