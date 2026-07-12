import type { Category, Product, Review } from "@/types";
import { STORAGE_KEYS, storage } from "./storage";

import cameraImg from "@/assets/images/camera.png";
import laptopImg from "@/assets/images/laptop.png";
import droneImg from "@/assets/images/drone.png";
import bikeImg from "@/assets/images/bike.png";
import toolImg from "@/assets/images/tool.png";
import powerbankImg from "@/assets/images/powerbank.png";

// Specific product images
import sonyA7Img from "@/assets/images/sony_a7.png";
import macbookProImg from "@/assets/images/macbook_pro.png";
import djiMavicImg from "@/assets/images/dji_mavic.png";
import ankerPowerCoreImg from "@/assets/images/anker_powercore.png";
import ambranePowerLitImg from "@/assets/images/ambrane_powerlit.png";
import xiaomiMiBoostImg from "@/assets/images/xiaomi_mi_boost.png";
import urbnPowerbankProdImg from "@/assets/images/urbn_powerbank_prod.png";
import reClassic350Img from "@/assets/images/re_classic350.png";
import trekMarlinImg from "@/assets/images/trek_marlin.png";
import ktmDukeImg from "@/assets/images/ktm_duke.png";
import hondaActivaImg from "@/assets/images/honda_activa.png";

const stockImg = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;

export const categories: Category[] = [
  {
    id: "cameras",
    name: "Cameras",
    icon: "Camera",
    count: 128,
    color: "from-rose-500 to-pink-500",
    image: cameraImg,
  },
  {
    id: "laptops",
    name: "Laptops",
    icon: "Laptop",
    count: 96,
    color: "from-blue-500 to-indigo-500",
    image: laptopImg,
  },
  {
    id: "drones",
    name: "Drones",
    icon: "Plane",
    count: 54,
    color: "from-emerald-500 to-teal-500",
    image: droneImg,
  },
  {
    id: "bikes",
    name: "Bikes & Rides",
    icon: "Bike",
    count: 62,
    color: "from-teal-500 to-cyan-500",
    image: bikeImg,
  },
  {
    id: "tools",
    name: "Electric Tools",
    icon: "Hammer",
    count: 48,
    color: "from-purple-500 to-indigo-500",
    image: toolImg,
  },
  {
    id: "powerbanks",
    name: "Power Banks",
    icon: "Zap",
    count: 28,
    color: "from-amber-500 to-yellow-500",
    image: powerbankImg,
  },
];

const initialProducts: Product[] = [
  {
    id: "p1",
    title: "Sony A7 IV Mirrorless Camera",
    description:
      "Full-frame 33MP hybrid camera. Perfect for cinema-quality video and stills. Includes 28-70mm lens, batteries, and hard case.",
    price: 4500,
    image: sonyA7Img,
    category: "cameras",
    rating: 4.9,
    reviews: 128,
    available: true,
    owner: { name: "Alex Morgan", avatar: "https://i.pravatar.cc/100?img=12", rating: 4.9 },
  },
  {
    id: "p2",
    title: 'MacBook Pro 16" M3 Max',
    description: "Top-spec MacBook Pro with 64GB RAM and 2TB SSD. Ideal for editing and dev work.",
    price: 3500,
    image: macbookProImg,
    category: "laptops",
    rating: 4.8,
    reviews: 92,
    available: true,
    owner: { name: "Priya Shah", avatar: "https://i.pravatar.cc/100?img=32", rating: 4.8 },
  },
  {
    id: "p2_dell",
    title: "Dell XPS 15 Touchscreen Laptop",
    description:
      'Premium Dell creator laptop featuring a stunning 15.6" OLED touchscreen display, Intel Core i9, 32GB RAM, and NVIDIA RTX 4060 graphics.',
    price: 2800,
    image: laptopImg,
    category: "laptops",
    rating: 4.7,
    reviews: 45,
    available: true,
    owner: { name: "Sarah Connor", avatar: "https://i.pravatar.cc/100?img=25", rating: 4.8 },
  },
  {
    id: "p2_lenovo",
    title: "Lenovo ThinkPad X1 Carbon Laptop",
    description:
      "Ultimate lightweight business companion. Features Intel Core i7, 16GB RAM, 1TB SSD, and legendary ThinkPad durability and keyboard comfort.",
    price: 2200,
    image: laptopImg,
    category: "laptops",
    rating: 4.9,
    reviews: 31,
    available: true,
    owner: { name: "David Miller", avatar: "https://i.pravatar.cc/100?img=18", rating: 4.9 },
  },
  {
    id: "p2_asus",
    title: "Asus ROG Zephyrus G14 Gaming Laptop",
    description:
      "High-performance ultraportable gaming beast. AMD Ryzen 9, NVIDIA RTX 4070, 16GB DDR5, and a blazing-fast 120Hz display.",
    price: 3000,
    image: macbookProImg,
    category: "laptops",
    rating: 4.8,
    reviews: 27,
    available: true,
    owner: { name: "John Doe", avatar: "https://i.pravatar.cc/100?img=8", rating: 4.7 },
  },
  {
    id: "p2_hp",
    title: "HP Spectre x360 Convertible Laptop",
    description:
      "Premium 2-in-1 touchscreen convertible laptop. Intel Core i7, 16GB RAM, 512GB SSD. Easily flips into tablet mode, stylus pen included.",
    price: 2400,
    image: laptopImg,
    category: "laptops",
    rating: 4.6,
    reviews: 19,
    available: true,
    owner: { name: "Lisa Ray", avatar: "https://i.pravatar.cc/100?img=35", rating: 4.6 },
  },
  {
    id: "p3",
    title: "DJI Mavic 3 Pro Drone",
    description:
      "Hasselblad triple-camera drone with 43-min flight time. Includes 3 batteries and ND filters.",
    price: 5000,
    image: djiMavicImg,
    category: "drones",
    rating: 5.0,
    reviews: 67,
    available: true,
    owner: { name: "Leo Chen", avatar: "https://i.pravatar.cc/100?img=45", rating: 5.0 },
  },
  {
    id: "p4",
    title: "Anker PowerCore 24K 140W Power Bank",
    description:
      "Ultra-high capacity power bank with 140W two-way fast charging. Features a smart digital display showing charge level and output specs.",
    price: 250,
    image: ankerPowerCoreImg,
    category: "powerbanks",
    rating: 4.9,
    reviews: 114,
    available: true,
    owner: { name: "Maya Patel", avatar: "https://i.pravatar.cc/100?img=47", rating: 4.7 },
  },
  {
    id: "p5",
    title: "Ambrane PowerLit 50000mAh Power Bank",
    description:
      "Massive 50000mAh battery backup. Supports 22.5W fast charging, triple outputs, and dual input modes. Rugged design with LED flashlight.",
    price: 350,
    image: ambranePowerLitImg,
    category: "powerbanks",
    rating: 4.8,
    reviews: 95,
    available: true,
    owner: { name: "James Ford", avatar: "https://i.pravatar.cc/100?img=52", rating: 4.6 },
  },
  {
    id: "p6",
    title: "Xiaomi Mi Boost Pro 30000mAh Power Bank",
    description:
      "High-capacity power bank with 18W fast charge capability. Triple port output, dual input, and high-quality metallic finish.",
    price: 200,
    image: xiaomiMiBoostImg,
    category: "powerbanks",
    rating: 4.7,
    reviews: 63,
    available: true,
    owner: { name: "Sofia Ruiz", avatar: "https://i.pravatar.cc/100?img=48", rating: 4.9 },
  },
  {
    id: "p7",
    title: "URBN 20000mAh Ultra Compact Power Bank",
    description:
      "Pocket-sized 20000mAh external battery with 22.5W super-fast charging. Dual ports and carbon fiber texture finish.",
    price: 150,
    image: urbnPowerbankProdImg,
    category: "powerbanks",
    rating: 4.6,
    reviews: 42,
    available: true,
    owner: { name: "Noah Kim", avatar: "https://i.pravatar.cc/100?img=15", rating: 4.8 },
  },
  {
    id: "p9",
    title: "Royal Enfield Classic 350",
    description:
      "Iconic cruiser bike. Perfect for road trips and local rides. Insured, well maintained, includes helmet.",
    price: 1200,
    image: reClassic350Img,
    category: "bikes",
    rating: 4.9,
    reviews: 43,
    available: true,
    owner: { name: "Rahul Sharma", avatar: "https://i.pravatar.cc/100?img=11", rating: 4.8 },
  },
  {
    id: "p10",
    title: "Trek Marlin 7 Mountain Bike",
    description:
      "High-performance mountain bike with front suspension, hydraulic disc brakes, and 1x10 drivetrain. Helmet included.",
    price: 500,
    image: trekMarlinImg,
    category: "bikes",
    rating: 4.7,
    reviews: 29,
    available: true,
    owner: { name: "Amit Patel", avatar: "https://i.pravatar.cc/100?img=33", rating: 4.7 },
  },
  {
    id: "p11",
    title: "Bosch Professional Hammer Drill",
    description:
      "Powerful 800W rotary hammer drill and drilling machine. Includes concrete/wood drill bits, side handle, and depth stop. Perfect for home improvement.",
    price: 350,
    image: toolImg,
    category: "tools",
    rating: 4.8,
    reviews: 35,
    available: true,
    owner: { name: "Vikram Singh", avatar: "https://i.pravatar.cc/100?img=47", rating: 4.9 },
  },
  {
    id: "p12",
    title: "DeWare 20V Max Cordless Drill",
    description:
      "Compact cordless drill/driver and drilling machine with 2 batteries and charger. High-speed transmission for fast drilling and fastening.",
    price: 450,
    image: toolImg,
    category: "tools",
    rating: 4.6,
    reviews: 18,
    available: true,
    owner: { name: "Suresh Kumar", avatar: "https://i.pravatar.cc/100?img=12", rating: 4.6 },
  },
  {
    id: "p13",
    title: "KTM Duke 390 Sports Bike",
    description:
      "High-performance sports motorcycle with 373cc liquid-cooled engine. Extreme agility, ABS, and standard riding gear included.",
    price: 1800,
    image: ktmDukeImg,
    category: "bikes",
    rating: 4.9,
    reviews: 57,
    available: true,
    owner: { name: "Aditya Verma", avatar: "https://i.pravatar.cc/100?img=15", rating: 4.9 },
  },
  {
    id: "p14",
    title: "Honda Activa 6G Scooter",
    description:
      "Comfortable, fuel-efficient city scooter. Easy automatic transmission. Comes with first-aid kit and helmet.",
    price: 400,
    image: hondaActivaImg,
    category: "bikes",
    rating: 4.6,
    reviews: 82,
    available: true,
    owner: { name: "Karan Johar", avatar: "https://i.pravatar.cc/100?img=20", rating: 4.5 },
  },
  {
    id: "p15",
    title: "Firefox Target 21-Speed Hybrid Cycle",
    description:
      "Premium alloy hybrid bicycle with Shimano 21-speed shifters and front suspension. Includes lock and helmet.",
    price: 250,
    image: bikeImg,
    category: "bikes",
    rating: 4.5,
    reviews: 14,
    available: true,
    owner: { name: "Vikram Seth", avatar: "https://i.pravatar.cc/100?img=32", rating: 4.6 },
  },
  {
    id: "p16",
    title: "Ather 450X Electric Scooter",
    description:
      "Flagship smart electric scooter with warp mode. Insured, GPS enabled, touch dashboard. Charger included.",
    price: 600,
    image: hondaActivaImg,
    category: "bikes",
    rating: 4.8,
    reviews: 31,
    available: true,
    owner: { name: "Rohan Das", avatar: "https://i.pravatar.cc/100?img=48", rating: 4.9 },
  },
  {
    id: "p17",
    title: "Makita 5-Inch Angle Grinder",
    description:
      "Heavy-duty electric grinder for metal cutting, grinding, and polishing. Safety guard and side handle included.",
    price: 300,
    image: toolImg,
    category: "tools",
    rating: 4.7,
    reviews: 22,
    available: true,
    owner: { name: "Deepak Gupta", avatar: "https://i.pravatar.cc/100?img=45", rating: 4.7 },
  },
  {
    id: "p18",
    title: "Stanley 7-Inch Electric Circular Saw",
    description:
      "High-precision circular saw for woodworking. Ergonomic design and powerful motor for clean, fast straight cuts.",
    price: 400,
    image: toolImg,
    category: "tools",
    rating: 4.8,
    reviews: 19,
    available: true,
    owner: { name: "Manish Sharma", avatar: "https://i.pravatar.cc/100?img=52", rating: 4.8 },
  },
  {
    id: "p19",
    title: "Dyson V11 Cordless Vacuum Cleaner",
    description:
      "Powerful intelligent cordless vacuum. Auto-adapts to different floor types. Complete set of accessories included.",
    price: 1000,
    image: toolImg,
    category: "tools",
    rating: 4.9,
    reviews: 44,
    available: true,
    owner: { name: "Anjali Rao", avatar: "https://i.pravatar.cc/100?img=5", rating: 4.9 },
  },
  {
    id: "p20",
    title: "Karcher K4 High-Pressure Washer",
    description:
      "Professional high-pressure washer for cleaning cars, patios, and walls. Water-cooled motor with adjustable nozzle spray.",
    price: 500,
    image: toolImg,
    category: "tools",
    rating: 4.7,
    reviews: 26,
    available: true,
    owner: { name: "Prakash Raj", avatar: "https://i.pravatar.cc/100?img=12", rating: 4.6 },
  },
];

// Load custom products from localStorage dynamically on module load
const getCustomProducts = (): Product[] => {
  if (typeof window === "undefined") return [];
  return storage.get<Product[]>(STORAGE_KEYS.customProducts, []);
};

export const products: Product[] = [...getCustomProducts(), ...initialProducts];

export const reviews: Review[] = [
  {
    id: "r1",
    user: "Ethan Wright",
    avatar: "https://i.pravatar.cc/100?img=11",
    rating: 5,
    comment: "Immaculate condition, delivery on time. Would rent again.",
    date: "2 weeks ago",
  },
  {
    id: "r2",
    user: "Ava Johnson",
    avatar: "https://i.pravatar.cc/100?img=20",
    rating: 5,
    comment: "Owner was super helpful and answered all my questions.",
    date: "1 month ago",
  },
  {
    id: "r3",
    user: "Liam Davis",
    avatar: "https://i.pravatar.cc/100?img=33",
    rating: 4,
    comment: "Great gear, minor scuff but performance was flawless.",
    date: "1 month ago",
  },
];

export const testimonials = [
  {
    name: "Nadia Ali",
    role: "Content Creator",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    cover: stockImg("1616469829581-73993eb86b02"),
    quote: "Payent saved my shoot when my camera failed. Booked and delivered in hours.",
  },
  {
    name: "Marcus Lee",
    role: "Startup Founder",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    cover: stockImg("1498050108023-c5249f4df085"),
    quote: "Renting a MacBook for my remote hire was seamless. Insurance made me comfortable.",
  },
  {
    name: "Chloe Bennet",
    role: "Filmmaker",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80",
    cover: stockImg("1492691527719-9d1e07e534b4"),
    quote: "The quality of gear on Payent rivals any pro rental house.",
  },
];

export const stats = [
  {
    label: "Active Listings",
    value: "12k+",
    image: stockImg("1498050108023-c5249f4df085"),
  },
  {
    label: "Happy Renters",
    value: "48k",
    image: stockImg("1494790108377-be9c29b29330"),
  },
  {
    label: "Cities Covered",
    value: "120",
    image: stockImg("1595658658481-d53d3f999875"),
  },
  {
    label: "Avg. Rating",
    value: "4.9★",
    image: stockImg("1516035069371-29a1b244cc32"),
  },
];
