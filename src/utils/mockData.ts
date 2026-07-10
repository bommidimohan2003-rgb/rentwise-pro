import type { Category, Product, Review } from "@/types";

export const categories: Category[] = [
  { id: "cameras", name: "Cameras", icon: "Camera", count: 128, color: "from-rose-500 to-pink-500" },
  { id: "laptops", name: "Laptops", icon: "Laptop", count: 96, color: "from-blue-500 to-indigo-500" },
  { id: "drones", name: "Drones", icon: "Plane", count: 54, color: "from-emerald-500 to-teal-500" },
  { id: "audio", name: "Audio Gear", icon: "Headphones", count: 74, color: "from-purple-500 to-fuchsia-500" },
  { id: "gaming", name: "Gaming", icon: "Gamepad2", count: 112, color: "from-orange-500 to-red-500" },
  { id: "vr", name: "VR / AR", icon: "Glasses", count: 33, color: "from-cyan-500 to-blue-500" },
  { id: "phones", name: "Phones", icon: "Smartphone", count: 89, color: "from-amber-500 to-orange-500" },
  { id: "tablets", name: "Tablets", icon: "Tablet", count: 41, color: "from-lime-500 to-green-500" },
];

const stockImg = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;

export const products: Product[] = [
  {
    id: "p1",
    title: "Sony A7 IV Mirrorless Camera",
    description:
      "Full-frame 33MP hybrid camera. Perfect for cinema-quality video and stills. Includes 28-70mm lens, batteries, and hard case.",
    price: 65,
    image: stockImg("1502920917128-1aa500764cbd"),
    category: "cameras",
    rating: 4.9,
    reviews: 128,
    available: true,
    owner: { name: "Alex Morgan", avatar: "https://i.pravatar.cc/100?img=12", rating: 4.9 },
  },
  {
    id: "p2",
    title: "MacBook Pro 16\" M3 Max",
    description: "Top-spec MacBook Pro with 64GB RAM and 2TB SSD. Ideal for editing and dev work.",
    price: 55,
    image: stockImg("1517336714731-489689fd1ca8"),
    category: "laptops",
    rating: 4.8,
    reviews: 92,
    available: true,
    owner: { name: "Priya Shah", avatar: "https://i.pravatar.cc/100?img=32", rating: 4.8 },
  },
  {
    id: "p3",
    title: "DJI Mavic 3 Pro Drone",
    description: "Hasselblad triple-camera drone with 43-min flight time. Includes 3 batteries and ND filters.",
    price: 89,
    image: stockImg("1508614589041-895b88991e3e"),
    category: "drones",
    rating: 5.0,
    reviews: 67,
    available: true,
    owner: { name: "Leo Chen", avatar: "https://i.pravatar.cc/100?img=45", rating: 5.0 },
  },
  {
    id: "p4",
    title: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise cancellation. Perfect for studio and travel.",
    price: 12,
    image: stockImg("1505740420928-5e560c06d30e"),
    category: "audio",
    rating: 4.7,
    reviews: 210,
    available: true,
    owner: { name: "Maya Patel", avatar: "https://i.pravatar.cc/100?img=47", rating: 4.7 },
  },
  {
    id: "p5",
    title: "PlayStation 5 Pro Bundle",
    description: "PS5 Pro with 2 DualSense controllers and 5 top-rated games.",
    price: 22,
    image: stockImg("1606813907291-d86efa9b94db"),
    category: "gaming",
    rating: 4.8,
    reviews: 156,
    available: false,
    owner: { name: "James Ford", avatar: "https://i.pravatar.cc/100?img=52", rating: 4.6 },
  },
  {
    id: "p6",
    title: "Meta Quest 3 VR Headset",
    description: "Mixed reality VR headset with two Touch Plus controllers.",
    price: 18,
    image: stockImg("1592478411213-6153e4ebc07d"),
    category: "vr",
    rating: 4.6,
    reviews: 88,
    available: true,
    owner: { name: "Sofia Ruiz", avatar: "https://i.pravatar.cc/100?img=48", rating: 4.9 },
  },
  {
    id: "p7",
    title: "iPhone 16 Pro Max",
    description: "Latest iPhone with A18 Pro chip. Includes MagSafe charger and case.",
    price: 25,
    image: stockImg("1592286927505-1def25115a94"),
    category: "phones",
    rating: 4.9,
    reviews: 301,
    available: true,
    owner: { name: "Noah Kim", avatar: "https://i.pravatar.cc/100?img=15", rating: 4.8 },
  },
  {
    id: "p8",
    title: "iPad Pro 13\" M4",
    description: "iPad Pro with Apple Pencil Pro and Magic Keyboard.",
    price: 20,
    image: stockImg("1585790050230-5dd28404ccb9"),
    category: "tablets",
    rating: 4.7,
    reviews: 74,
    available: true,
    owner: { name: "Isla Brown", avatar: "https://i.pravatar.cc/100?img=25", rating: 4.9 },
  },
];

export const reviews: Review[] = [
  { id: "r1", user: "Ethan Wright", avatar: "https://i.pravatar.cc/100?img=11", rating: 5, comment: "Immaculate condition, delivery on time. Would rent again.", date: "2 weeks ago" },
  { id: "r2", user: "Ava Johnson", avatar: "https://i.pravatar.cc/100?img=20", rating: 5, comment: "Owner was super helpful and answered all my questions.", date: "1 month ago" },
  { id: "r3", user: "Liam Davis", avatar: "https://i.pravatar.cc/100?img=33", rating: 4, comment: "Great gear, minor scuff but performance was flawless.", date: "1 month ago" },
];

export const testimonials = [
  { name: "Nadia Ali", role: "Content Creator", avatar: "https://i.pravatar.cc/100?img=5", quote: "TechRent saved my shoot when my camera failed. Booked and delivered in hours." },
  { name: "Marcus Lee", role: "Startup Founder", avatar: "https://i.pravatar.cc/100?img=7", quote: "Renting a MacBook for my remote hire was seamless. Insurance made me comfortable." },
  { name: "Chloe Bennet", role: "Filmmaker", avatar: "https://i.pravatar.cc/100?img=9", quote: "The quality of gear on TechRent rivals any pro rental house." },
];

export const stats = [
  { label: "Active Listings", value: "12k+" },
  { label: "Happy Renters", value: "48k" },
  { label: "Cities Covered", value: "120" },
  { label: "Avg. Rating", value: "4.9★" },
];
