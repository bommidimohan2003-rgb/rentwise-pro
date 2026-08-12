import type { Category, Product, Review } from "@/types";
import { STORAGE_KEYS, storage } from "./storage";

import cameraImg from "@/assets/images/camera.png";
import laptopImg from "@/assets/images/laptop.png";
import droneImg from "@/assets/images/drone.png";
import bikeImg from "@/assets/images/bike.png";
import toolImg from "@/assets/images/tool.png";
import powerbankImg from "@/assets/images/powerbank.png";

// Specific flagship product angle images (1 item per category)
import sonyA7FrontImg from "@/assets/images/sony_a7_front.png";
import sonyA7TopImg from "@/assets/images/sony_a7_top.png";
import sonyA7BackImg from "@/assets/images/sony_a7_back.png";
import sonyA7SideImg from "@/assets/images/sony_a7_side.png";

import macbookProImg from "@/assets/images/macbook_pro.png";
import macbookFrontImg from "@/assets/images/macbook_front.png";
import macbookTopImg from "@/assets/images/macbook_top.png";
import macbookKeyboardImg from "@/assets/images/macbook_keyboard.png";
import macbookSideImg from "@/assets/images/macbook_side.png";

import droneFrontImg from "@/assets/images/drone_front.png";
import droneTopImg from "@/assets/images/drone_top.png";
import droneRemoteImg from "@/assets/images/drone_remote.png";
import droneSideImg from "@/assets/images/drone_side.png";

import ankerPowerCoreImg from "@/assets/images/anker_powercore.png";
import reClassic350Img from "@/assets/images/re_classic350.png";

const stockImg = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;

export const categories: Category[] = [
  {
    id: "cameras",
    name: "Cameras",
    icon: "Camera",
    count: 1,
    color: "bg-secondary text-foreground",
    image: cameraImg,
  },
  {
    id: "laptops",
    name: "Laptops",
    icon: "Laptop",
    count: 1,
    color: "bg-secondary text-foreground",
    image: laptopImg,
  },
  {
    id: "drones",
    name: "Drones",
    icon: "Plane",
    count: 1,
    color: "bg-secondary text-foreground",
    image: droneImg,
  },
  {
    id: "bikes",
    name: "Bikes & Rides",
    icon: "Bike",
    count: 1,
    color: "bg-secondary text-foreground",
    image: reClassic350Img,
  },
  {
    id: "tools",
    name: "Electronic Drilling Tools",
    icon: "Hammer",
    count: 1,
    color: "bg-secondary text-foreground",
    image: toolImg,
  },
  {
    id: "powerbanks",
    name: "Power Banks",
    icon: "Zap",
    count: 1,
    color: "bg-secondary text-foreground",
    image: powerbankImg,
  },
];

export const sonyA7Frames: string[] = [
  sonyA7FrontImg,
  sonyA7TopImg,
  sonyA7BackImg,
  sonyA7SideImg,
];

export const macbookProFrames: string[] = [
  macbookFrontImg,
  macbookTopImg,
  macbookKeyboardImg,
  macbookSideImg,
];

export const djiMavicFrames: string[] = [
  droneFrontImg,
  droneTopImg,
  droneRemoteImg,
  droneSideImg,
];

export const powerbankFrames: string[] = [
  ankerPowerCoreImg,
  "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
];

export const bikeFrames: string[] = [
  reClassic350Img,
  "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
];

export const toolFrames: string[] = [
  toolImg,
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
];

const initialProducts: Product[] = [];

// Load custom products from localStorage dynamically on module load
const getCustomProducts = (): Product[] => {
  if (typeof window === "undefined") return [];
  return storage.get<Product[]>(STORAGE_KEYS.customProducts, []);
};

export const products: Product[] = [
  ...getCustomProducts(),
  ...initialProducts,
].map((p) => {
  let defaultAngles = sonyA7Frames;
  if (p.category === "laptops") defaultAngles = macbookProFrames;
  else if (p.category === "drones") defaultAngles = djiMavicFrames;
  else if (p.category === "powerbanks") defaultAngles = powerbankFrames;
  else if (p.category === "bikes") defaultAngles = bikeFrames;
  else if (p.category === "tools") defaultAngles = toolFrames;

  const rawImages = p.images && p.images.length >= 2 ? p.images : defaultAngles;
  const defaultLabels = ["Front", "Side", "Back", "3/4 View"];
  const angleImages = rawImages.slice(0, 4).map((img, idx) => ({
    label: defaultLabels[idx] || `Angle ${idx + 1}`,
    image: img,
  }));

  return {
    ...p,
    images: rawImages,
    angleImages:
      p.angleImages && p.angleImages.length >= 2 ? p.angleImages : angleImages,
    rotationFrames:
      p.rotationFrames && p.rotationFrames.length >= 2
        ? p.rotationFrames
        : defaultAngles,
  };
});

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
    quote:
      "Payent saved my shoot when my camera failed. Booked and delivered in hours.",
  },
  {
    name: "Marcus Lee",
    role: "Startup Founder",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    cover: stockImg("1498050108023-c5249f4df085"),
    quote:
      "Renting a MacBook for my remote hire was seamless. Insurance made me comfortable.",
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
    image: stockImg("1522071820081-009f0129c71c"),
  },
  {
    label: "Cities Covered",
    value: "120+",
    image: stockImg("1477959858617-67f30ac4ce71"),
  },
];
