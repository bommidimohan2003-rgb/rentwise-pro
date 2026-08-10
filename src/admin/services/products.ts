import { adminApi, AdminProduct, AdminCategory } from "./api";

const FALLBACK_PRODUCTS: AdminProduct[] = [
  {
    id: "p1",
    title: "Sony FX3 Cinema Line Camera",
    description: "Full-frame cinema camera with 4K 120fps recording capability, XLR handle unit, and dual CFexpress slots.",
    category: "Cameras",
    price: 2500,
    rating: 4.9,
    reviewsCount: 24,
    available: true,
    status: "approved",
    featured: true,
    hidden: false,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600",
    ],
    documents: [],
    createdAt: "2026-01-12T10:00:00Z",
    owner: {
      id: "usr-2",
      name: "Marcus Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120",
      rating: 4.9,
      email: "marcus.vance@techgear.io",
    },
  },
  {
    id: "p2",
    title: "DJI Mavic 3 Pro Cine Premium Combo",
    description: "Tri-camera flagship drone with Apple ProRes support, 43-min flight time, and RC Pro remote controller.",
    category: "Drones",
    price: 4200,
    rating: 5.0,
    reviewsCount: 18,
    available: true,
    status: "approved",
    featured: true,
    hidden: false,
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600",
    images: [
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600",
    ],
    documents: [],
    createdAt: "2026-01-18T14:30:00Z",
    owner: {
      id: "usr-3",
      name: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
      rating: 5.0,
      email: "elena.rostova@drones.com",
    },
  },
  {
    id: "p3",
    title: "MacBook Pro 16\" M3 Max 64GB",
    description: "Monster video editing laptop with 16-core GPU, 2TB SSD, and Liquid Retina XDR display.",
    category: "Laptops",
    price: 1800,
    rating: 4.8,
    reviewsCount: 31,
    available: true,
    status: "approved",
    featured: true,
    hidden: false,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
    ],
    documents: [],
    createdAt: "2026-02-01T09:15:00Z",
    owner: {
      id: "usr-4",
      name: "Devon Carter",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120",
      rating: 4.8,
      email: "devon.carter@creatives.co",
    },
  },
  {
    id: "p4",
    title: "RED Komodo 6K Digital Cinema Camera",
    description: "Compact 6K Super35 cinema camera with global shutter and RF mount for Hollywood productions.",
    category: "Cameras",
    price: 3500,
    rating: 4.9,
    reviewsCount: 15,
    available: true,
    status: "approved",
    featured: false,
    hidden: false,
    image: "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600",
    images: ["https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600"],
    documents: [],
    createdAt: "2026-02-10T11:00:00Z",
    owner: {
      id: "usr-2",
      name: "Marcus Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120",
      rating: 4.9,
      email: "marcus.vance@techgear.io",
    },
  },
  {
    id: "p5",
    title: "Sennheiser MKH 416 Microphone Kit",
    description: "Industry-standard shotgun microphone with Rycote blimp and boom pole for field audio.",
    category: "Audio",
    price: 1200,
    rating: 4.7,
    reviewsCount: 12,
    available: true,
    status: "approved",
    featured: false,
    hidden: false,
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600",
    images: ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600"],
    documents: [],
    createdAt: "2026-02-15T15:20:00Z",
    owner: {
      id: "usr-5",
      name: "Priya Sharma",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120",
      rating: 4.7,
      email: "priya.sharma@studios.in",
    },
  },
  {
    id: "p6",
    title: "Aputure LS 600d Pro Daylight LED",
    description: "Ultra-bright 600W point-source LED light with Sidus Link app control and weather resistance.",
    category: "Cameras",
    price: 2900,
    rating: 4.8,
    reviewsCount: 9,
    available: true,
    status: "pending",
    featured: false,
    hidden: false,
    image: "https://images.unsplash.com/photo-1517430816045-df4b7dec1d5d?w=600",
    images: ["https://images.unsplash.com/photo-1517430816045-df4b7dec1d5d?w=600"],
    documents: [],
    createdAt: "2026-03-01T13:40:00Z",
    owner: {
      id: "usr-4",
      name: "Devon Carter",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120",
      rating: 4.8,
      email: "devon.carter@creatives.co",
    },
  },
  {
    id: "p7",
    title: "Apple Vision Pro 512GB VR Headset",
    description: "Revolutionary spatial computer with dual 4K micro-OLED displays and M2+R1 dual chips.",
    category: "VR & AR",
    price: 2200,
    rating: 4.9,
    reviewsCount: 22,
    available: true,
    status: "approved",
    featured: true,
    hidden: false,
    image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600",
    images: ["https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600"],
    documents: [],
    createdAt: "2026-03-05T10:10:00Z",
    owner: {
      id: "usr-3",
      name: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
      rating: 5.0,
      email: "elena.rostova@drones.com",
    },
  },
];

const FALLBACK_CATEGORIES: AdminCategory[] = [
  {
    id: "cat-1",
    name: "Cameras",
    icon: "Camera",
    count: 24,
    color: "bg-secondary text-foreground",
    enabled: true,
  },
  {
    id: "cat-2",
    name: "Drones",
    icon: "Plane",
    count: 12,
    color: "bg-secondary text-foreground",
    enabled: true,
  },
  {
    id: "cat-3",
    name: "Laptops",
    icon: "Laptop",
    count: 18,
    color: "bg-secondary text-foreground",
    enabled: true,
  },
  {
    id: "cat-4",
    name: "Audio",
    icon: "Mic",
    count: 15,
    color: "bg-secondary text-foreground",
    enabled: true,
  },
  {
    id: "cat-5",
    name: "VR & AR",
    icon: "Glasses",
    count: 8,
    color: "bg-secondary text-foreground",
    enabled: true,
  },
];

export const productsService = {
  async getProducts(): Promise<AdminProduct[]> {
    try {
      const response = await adminApi.get("/products");
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      console.warn("[productsService] getProducts fallback:", err);
    }
    return FALLBACK_PRODUCTS;
  },

  async getProductById(id: string): Promise<AdminProduct> {
    try {
      const response = await adminApi.get(`/products/${id}`);
      if (response.data) return response.data;
    } catch (err) {
      console.warn("[productsService] getProductById fallback:", err);
    }
    return FALLBACK_PRODUCTS.find((p) => p.id === id) || FALLBACK_PRODUCTS[0];
  },

  async updateProduct(
    id: string,
    data: Partial<AdminProduct>,
  ): Promise<AdminProduct> {
    try {
      const response = await adminApi.put(`/products/${id}`, data);
      return response.data;
    } catch (err) {
      console.warn("[productsService] updateProduct fallback:", err);
      const prod = FALLBACK_PRODUCTS.find((p) => p.id === id) || FALLBACK_PRODUCTS[0];
      return { ...prod, ...data };
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await adminApi.delete(`/products/${id}`);
    } catch (err) {
      console.warn("[productsService] deleteProduct fallback:", err);
    }
  },

  async approveProduct(id: string): Promise<AdminProduct> {
    try {
      const response = await adminApi.post(`/products/${id}/approve`);
      return response.data;
    } catch (err) {
      console.warn("[productsService] approveProduct fallback:", err);
      const prod = FALLBACK_PRODUCTS.find((p) => p.id === id) || FALLBACK_PRODUCTS[0];
      return { ...prod, status: "approved" };
    }
  },

  async rejectProduct(id: string): Promise<AdminProduct> {
    try {
      const response = await adminApi.post(`/products/${id}/reject`);
      return response.data;
    } catch (err) {
      console.warn("[productsService] rejectProduct fallback:", err);
      const prod = FALLBACK_PRODUCTS.find((p) => p.id === id) || FALLBACK_PRODUCTS[0];
      return { ...prod, status: "rejected" };
    }
  },

  async toggleFeatureProduct(id: string): Promise<AdminProduct> {
    try {
      const response = await adminApi.post(`/products/${id}/toggle-feature`);
      return response.data;
    } catch (err) {
      console.warn("[productsService] toggleFeatureProduct fallback:", err);
      const prod = FALLBACK_PRODUCTS.find((p) => p.id === id) || FALLBACK_PRODUCTS[0];
      return { ...prod, featured: !prod.featured };
    }
  },

  async toggleHideProduct(id: string): Promise<AdminProduct> {
    try {
      const response = await adminApi.post(`/products/${id}/toggle-hide`);
      return response.data;
    } catch (err) {
      console.warn("[productsService] toggleHideProduct fallback:", err);
      const prod = FALLBACK_PRODUCTS.find((p) => p.id === id) || FALLBACK_PRODUCTS[0];
      return { ...prod, hidden: !prod.hidden };
    }
  },

  // Categories
  async getCategories(): Promise<AdminCategory[]> {
    try {
      const response = await adminApi.get("/categories");
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      console.warn("[productsService] getCategories fallback:", err);
    }
    return FALLBACK_CATEGORIES;
  },

  async createCategory(data: {
    name: string;
    icon?: string;
    color?: string;
  }): Promise<AdminCategory> {
    try {
      const response = await adminApi.post("/categories", data);
      return response.data;
    } catch (err) {
      console.warn("[productsService] createCategory fallback:", err);
      return {
        id: `cat-${Date.now()}`,
        name: data.name,
        icon: data.icon || "Folder",
        count: 0,
        color: data.color || "bg-secondary text-foreground",
        enabled: true,
      };
    }
  },

  async updateCategory(
    id: string,
    data: Partial<AdminCategory>,
  ): Promise<AdminCategory> {
    try {
      const response = await adminApi.put(`/categories/${id}`, data);
      return response.data;
    } catch (err) {
      console.warn("[productsService] updateCategory fallback:", err);
      const cat = FALLBACK_CATEGORIES.find((c) => c.id === id) || FALLBACK_CATEGORIES[0];
      return { ...cat, ...data };
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      await adminApi.delete(`/categories/${id}`);
    } catch (err) {
      console.warn("[productsService] deleteCategory fallback:", err);
    }
  },
};
