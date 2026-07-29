import re

mock_data_path = r"c:\Users\bommi\payent_project\rentwise-pro\src\utils\mockData.ts"

new_mock_data = '''import type { Category, Product, Review } from "@/types";
import { STORAGE_KEYS, storage } from "./storage";

import cameraImg from "@/assets/images/camera.png";
import laptopImg from "@/assets/images/laptop.png";
import droneImg from "@/assets/images/drone.png";
import bikeImg from "@/assets/images/bike.png";
import toolImg from "@/assets/images/tool.png";
import powerbankImg from "@/assets/images/powerbank.png";

// Specific product images
import sonyA7Img from "@/assets/images/sony_a7.png";
import sonyA7FrontImg from "@/assets/images/sony_a7_front.png";
import sonyA7TopImg from "@/assets/images/sony_a7_top.png";
import sonyA7BackImg from "@/assets/images/sony_a7_back.png";
import sonyA7SideImg from "@/assets/images/sony_a7_side.png";

import macbookProImg from "@/assets/images/macbook_pro.png";
import macbookFrontImg from "@/assets/images/macbook_front.png";
import macbookTopImg from "@/assets/images/macbook_top.png";
import macbookKeyboardImg from "@/assets/images/macbook_keyboard.png";
import macbookSideImg from "@/assets/images/macbook_side.png";
import dellXpsFrontImg from "@/assets/images/dell_xps_front.png";

import djiMavicImg from "@/assets/images/dji_mavic.png";
import droneFrontImg from "@/assets/images/drone_front.png";
import droneTopImg from "@/assets/images/drone_top.png";
import droneRemoteImg from "@/assets/images/drone_remote.png";
import droneSideImg from "@/assets/images/drone_side.png";

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
    count: 10,
    color: "from-rose-500 to-pink-500",
    image: cameraImg,
  },
  {
    id: "laptops",
    name: "Laptops",
    icon: "Laptop",
    count: 10,
    color: "from-blue-500 to-indigo-500",
    image: laptopImg,
  },
  {
    id: "drones",
    name: "Drones",
    icon: "Plane",
    count: 8,
    color: "from-emerald-500 to-teal-500",
    image: droneImg,
  },
  {
    id: "bikes",
    name: "Bikes & Rides",
    icon: "Bike",
    count: 11,
    color: "from-teal-500 to-cyan-500",
    image: bikeImg,
  },
  {
    id: "tools",
    name: "Electric Tools",
    icon: "Hammer",
    count: 10,
    color: "from-purple-500 to-indigo-500",
    image: toolImg,
  },
  {
    id: "powerbanks",
    name: "Power Banks",
    icon: "Zap",
    count: 10,
    color: "from-amber-500 to-yellow-500",
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
  "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80",
];

export const bikeFrames: string[] = [
  "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
];

export const toolFrames: string[] = [
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1000&q=80",
];

const initialProducts: Product[] = [
  // --- 1. CAMERAS CATEGORY (10 Real Products) ---
  {
    id: "p1",
    title: "Sony A7 IV Mirrorless Camera",
    description: "Full-frame 33MP hybrid camera. Perfect for cinema-quality video and stills. Includes 28-70mm lens, batteries, and hard case.",
    price: 4500,
    image: sonyA7FrontImg,
    images: [sonyA7FrontImg, sonyA7TopImg, sonyA7BackImg, sonyA7SideImg],
    angleImages: [
      { label: "Front", image: sonyA7FrontImg },
      { label: "Top", image: sonyA7TopImg },
      { label: "Back", image: sonyA7BackImg },
      { label: "Side", image: sonyA7SideImg }
    ],
    category: "cameras",
    rating: 4.9,
    reviews: 128,
    available: true,
    owner: { name: "Alex Morgan", avatar: "https://i.pravatar.cc/100?img=12", rating: 4.9 },
  },
  {
    id: "p1_fx3",
    title: "Sony FX3 Cinema Line Camera",
    description: "Full-frame 12.1MP cinema camera with active cooling fan, S-Cinetone, 4K 120p, and detachable XLR top handle.",
    price: 5500,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80"
    ],
    angleImages: [
      { label: "Front Rig", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80" },
      { label: "Top Handle", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80" },
      { label: "Back LCD", image: "https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&w=1000&q=80" },
      { label: "Side Ports", image: "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80" }
    ],
    category: "cameras",
    rating: 5.0,
    reviews: 84,
    available: true,
    owner: { name: "Aarav Sharma", avatar: "https://i.pravatar.cc/100?img=11", rating: 5.0 },
  },
  {
    id: "p1_a7r5",
    title: "Sony Alpha A7R V Mirrorless Camera",
    description: "61MP ultra-high resolution full-frame sensor with AI-powered Real-Time Recognition AF and 8K video capture.",
    price: 6000,
    image: "https://images.unsplash.com/photo-1516035069371-29a6b244cc54?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a6b244cc54?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "cameras",
    rating: 4.9,
    reviews: 62,
    available: true,
    owner: { name: "Karan Patel", avatar: "https://i.pravatar.cc/100?img=3", rating: 4.9 },
  },
  {
    id: "p1_r6m2",
    title: "Canon EOS R6 Mark II Mirrorless Camera",
    description: "24.2MP full-frame hybrid camera with 40 fps electronic shutter, 4K 60p uncropped video, and Dual Pixel CMOS AF II.",
    price: 4200,
    image: "https://images.unsplash.com/photo-1519638399535-1b036603ac77?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1519638399535-1b036603ac77?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "cameras",
    rating: 4.8,
    reviews: 79,
    available: true,
    owner: { name: "Neha Sen", avatar: "https://i.pravatar.cc/100?img=9", rating: 4.8 },
  },
  {
    id: "p1_r5",
    title: "Canon EOS R5 8K Mirrorless Camera",
    description: "45MP full-frame flagship camera capable of 8K 30p RAW video, 20 fps burst shooting, and 8 stops of in-body image stabilization.",
    price: 5800,
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519638399535-1b036603ac77?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "cameras",
    rating: 4.9,
    reviews: 95,
    available: true,
    owner: { name: "Rohan Das", avatar: "https://i.pravatar.cc/100?img=15", rating: 4.9 },
  },
  {
    id: "p1_z6m2",
    title: "Nikon Z6 II Hybrid Mirrorless Camera",
    description: "24.5MP FX-format sensor with Dual EXPEED 6 engines, 4K 60p, dual card slots, and robust weather-sealed magnesium body.",
    price: 3800,
    image: "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519638399535-1b036603ac77?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "cameras",
    rating: 4.7,
    reviews: 53,
    available: true,
    owner: { name: "Siddharth Roy", avatar: "https://i.pravatar.cc/100?img=21", rating: 4.7 },
  },
  {
    id: "p1_z8",
    title: "Nikon Z8 Flagship Mirrorless Camera",
    description: "45.7MP stacked CMOS sensor, 8.3K 60p N-RAW internal recording, zero-blackout viewfinder, and compact magnesium alloy frame.",
    price: 6500,
    image: "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519638399535-1b036603ac77?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "cameras",
    rating: 5.0,
    reviews: 41,
    available: true,
    owner: { name: "Vikram Malhotra", avatar: "https://i.pravatar.cc/100?img=28", rating: 5.0 },
  },
  {
    id: "p1_xt5",
    title: "Fujifilm X-T5 Mirrorless Camera",
    description: "40.2MP X-Trans CMOS 5 HR BSI sensor, 6.2K 30p video, 7 stops IBIS, and tactile analog dial controls in a classic vintage body.",
    price: 3200,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1516035069371-29a6b244cc54?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "cameras",
    rating: 4.9,
    reviews: 88,
    available: true,
    owner: { name: "Tanya Kapoor", avatar: "https://i.pravatar.cc/100?img=31", rating: 4.9 },
  },
  {
    id: "p1_x100v",
    title: "Fujifilm X100V Premium Compact Camera",
    description: "26.1MP X-Trans sensor with fixed Fujinon 23mm f/2 II lens, Advanced Hybrid Viewfinder, 4K video, and Film Simulation modes.",
    price: 2800,
    image: "https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1516035069371-29a6b244cc54?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "cameras",
    rating: 4.8,
    reviews: 112,
    available: true,
    owner: { name: "Ananya Mehta", avatar: "https://i.pravatar.cc/100?img=36", rating: 4.8 },
  },
  {
    id: "p1_gh6",
    title: "Panasonic Lumix GH6 Cinema Camera",
    description: "25.2MP Micro Four Thirds sensor with internal ProRes 422 HQ, 5.7K 60p, active fan cooling, and unlimited recording duration.",
    price: 3500,
    image: "https://images.unsplash.com/photo-1516035069371-29a6b244cc54?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a6b244cc54?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512756290469-ec264b7fbf97?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "cameras",
    rating: 4.7,
    reviews: 47,
    available: true,
    owner: { name: "Kabir Nair", avatar: "https://i.pravatar.cc/100?img=42", rating: 4.7 },
  },

  // --- 2. LAPTOPS CATEGORY (10 Real Products) ---
  {
    id: "p2",
    title: "MacBook Pro 16\\" M3 Max",
    description: "Top-spec MacBook Pro with M3 Max 16-core CPU, 40-core GPU, 64GB RAM, and 2TB SSD. Ideal for 8K editing and 3D rendering.",
    price: 3500,
    image: macbookProImg,
    images: [macbookFrontImg, macbookTopImg, macbookKeyboardImg, macbookSideImg],
    rotationFrames: macbookProFrames,
    category: "laptops",
    rating: 4.8,
    reviews: 92,
    available: true,
    owner: { name: "Priya Shah", avatar: "https://i.pravatar.cc/100?img=32", rating: 4.8 },
  },
  {
    id: "p2_air",
    title: "Apple MacBook Air 15\\" M2",
    description: "15.3-inch Liquid Retina display, Apple M2 chip, 16GB Memory, 512GB SSD, fanless quiet design, up to 18 hours battery life.",
    price: 2200,
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "laptops",
    rating: 4.9,
    reviews: 104,
    available: true,
    owner: { name: "Arjun Khanna", avatar: "https://i.pravatar.cc/100?img=14", rating: 4.9 },
  },
  {
    id: "p2_dell",
    title: "Dell XPS 15 9530 Touchscreen Laptop",
    description: "Premium Dell creator laptop featuring a stunning 15.6\\" OLED touchscreen display, Intel Core i9-13900H, 32GB RAM, and RTX 4060 graphics.",
    price: 2800,
    image: dellXpsFrontImg,
    images: [
      dellXpsFrontImg,
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "laptops",
    rating: 4.7,
    reviews: 45,
    available: true,
    owner: { name: "Sarah Connor", avatar: "https://i.pravatar.cc/100?img=25", rating: 4.8 },
  },
  {
    id: "p2_precision",
    title: "Dell Precision 5680 Workstation Laptop",
    description: "Professional mobile workstation with Intel Core i9 vPro, 64GB LPDDR5, NVIDIA RTX 4000 Ada 12GB, and 16\\" UHD+ OLED Touch display.",
    price: 3800,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1000&q=80",
      dellXpsFrontImg
    ],
    category: "laptops",
    rating: 4.9,
    reviews: 28,
    available: true,
    owner: { name: "Manish Joshi", avatar: "https://i.pravatar.cc/100?img=17", rating: 4.9 },
  },
  {
    id: "p2_lenovo",
    title: "Lenovo ThinkPad X1 Carbon Gen 11",
    description: "Ultimate business companion. Features Intel Core i7-1365U, 16GB RAM, 1TB SSD, and legendary ThinkPad TrackPoint keyboard comfort.",
    price: 2200,
    image: "https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "laptops",
    rating: 4.9,
    reviews: 31,
    available: true,
    owner: { name: "David Miller", avatar: "https://i.pravatar.cc/100?img=18", rating: 4.9 },
  },
  {
    id: "p2_legion",
    title: "Lenovo Legion Pro 7i Gaming Laptop",
    description: "Intel Core i9-14900HX, 32GB DDR5, NVIDIA RTX 4080 12GB, Coldfront 5.0 vapor chamber cooling, 16\\" WQXGA 240Hz display.",
    price: 3200,
    image: "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "laptops",
    rating: 4.8,
    reviews: 52,
    available: true,
    owner: { name: "Gaurav Sen", avatar: "https://i.pravatar.cc/100?img=22", rating: 4.8 },
  },
  {
    id: "p2_asus",
    title: "ASUS ROG Zephyrus G14 Gaming Laptop",
    description: "High-performance ultraportable gaming beast. AMD Ryzen 9 8945HS, NVIDIA RTX 4070 8GB, 32GB LPDDR5X, 14\\" ROG Nebula OLED 120Hz.",
    price: 3000,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "laptops",
    rating: 4.8,
    reviews: 27,
    available: true,
    owner: { name: "John Doe", avatar: "https://i.pravatar.cc/100?img=8", rating: 4.7 },
  },
  {
    id: "p2_zenbook",
    title: "ASUS Zenbook Pro 14 Duo OLED",
    description: "Dual-screen creator laptop with ScreenPad Plus secondary touchscreen, Intel Core i9-13900H, 32GB RAM, RTX 4060, 14.5\\" 2.8K 120Hz OLED.",
    price: 3400,
    image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "laptops",
    rating: 4.9,
    reviews: 36,
    available: true,
    owner: { name: "Nikhil Verma", avatar: "https://i.pravatar.cc/100?img=26", rating: 4.9 },
  },
  {
    id: "p2_hp",
    title: "HP Spectre x360 14 Convertible Laptop",
    description: "Premium 2-in-1 touchscreen convertible with Intel Core Ultra 7 155H, 16GB LPDDR5x, 1TB SSD, 14\\" 2.8K OLED, 360-degree hinge & Tilt Pen.",
    price: 2400,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "laptops",
    rating: 4.6,
    reviews: 19,
    available: true,
    owner: { name: "Lisa Ray", avatar: "https://i.pravatar.cc/100?img=35", rating: 4.6 },
  },
  {
    id: "p2_envy",
    title: "HP Envy 16 Creator Laptop",
    description: "Intel Core i7-13700H, 32GB DDR5, 1TB SSD, NVIDIA RTX 4060 8GB, 16\\" WQXGA 120Hz display, dual Thunderbolt 4 ports.",
    price: 2600,
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1544731612-de7f96afe55f?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "laptops",
    rating: 4.7,
    reviews: 41,
    available: true,
    owner: { name: "Suresh Pillai", avatar: "https://i.pravatar.cc/100?img=30", rating: 4.7 },
  },

  // --- 3. DRONES CATEGORY (8 Real Products) ---
  {
    id: "p3",
    title: "DJI Mavic 3 Pro Cine Drone",
    description: "Hasselblad 4/3 CMOS primary camera + dual tele cameras, Apple ProRes 422 HQ, 43-min flight time, omnidirectional sensing.",
    price: 5000,
    image: droneFrontImg,
    images: [droneFrontImg, droneTopImg, droneRemoteImg, droneSideImg],
    rotationFrames: djiMavicFrames,
    category: "drones",
    rating: 5.0,
    reviews: 67,
    available: true,
    owner: { name: "Leo Chen", avatar: "https://i.pravatar.cc/100?img=45", rating: 5.0 },
  },
  {
    id: "p3_mini4",
    title: "DJI Mini 4 Pro Fly More Combo",
    description: "Under 249g ultra-light folding drone, 4K 60p HDR video, 48MP RAW stills, Omnidirectional obstacle sensing, 34-min flight time.",
    price: 2500,
    image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f10c?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f10c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "drones",
    rating: 4.9,
    reviews: 95,
    available: true,
    owner: { name: "Rahul Saxena", avatar: "https://i.pravatar.cc/100?img=33", rating: 4.9 },
  },
  {
    id: "p3_air3",
    title: "DJI Air 3 Dual-Camera Drone",
    description: "Dual 1/1.3-inch CMOS primary & 3x tele camera, 4K 60p HDR, 46-min flight time, O4 HD video transmission up to 20km.",
    price: 3800,
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f10c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "drones",
    rating: 4.9,
    reviews: 73,
    available: true,
    owner: { name: "Deepak Sharma", avatar: "https://i.pravatar.cc/100?img=37", rating: 4.9 },
  },
  {
    id: "p3_inspire3",
    title: "DJI Inspire 3 Cinema Drone",
    description: "Full-frame Zenmuse X9-8K Air gimbal camera, 8K 75p ProRes RAW / CinemaDNG, Centimeter-level RTK positioning, dual operator control.",
    price: 12000,
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f10c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "drones",
    rating: 5.0,
    reviews: 24,
    available: true,
    owner: { name: "Vikram Studio", avatar: "https://i.pravatar.cc/100?img=41", rating: 5.0 },
  },
  {
    id: "p3_avata2",
    title: "DJI Avata 2 FPV Drone Combo",
    description: "4K 60p 155-degree FOV ultra-wide camera, Goggles 3 & Motion 3 controller, built-in propeller guard for indoor/outdoor FPV acro flight.",
    price: 3200,
    image: "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f10c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "drones",
    rating: 4.8,
    reviews: 61,
    available: true,
    owner: { name: "Samir Sen", avatar: "https://i.pravatar.cc/100?img=48", rating: 4.8 },
  },
  {
    id: "p3_autel_lite",
    title: "Autel Robotics EVO Lite+ Drone",
    description: "1-inch CMOS sensor, 6K 30p video, f/2.8-f/11 adjustable aperture, Moonlight algorithm for low-light aerial shooting, 40-min flight time.",
    price: 3200,
    image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f10c?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f10c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "drones",
    rating: 4.7,
    reviews: 38,
    available: true,
    owner: { name: "Prateek Roy", avatar: "https://i.pravatar.cc/100?img=50", rating: 4.7 },
  },
  {
    id: "p3_autel_evo2",
    title: "Autel Robotics EVO II Pro V3",
    description: "1-inch Sony CMOS sensor, 6K 30p 12-bit RAW video, SkyConnect 15km transmission, 360-degree obstacle avoidance, 42-min flight time.",
    price: 4500,
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f10c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "drones",
    rating: 4.8,
    reviews: 29,
    available: true,
    owner: { name: "Alok Kumar", avatar: "https://i.pravatar.cc/100?img=53", rating: 4.8 },
  },
  {
    id: "p3_skydio",
    title: "Skydio 2+ Autonomous Cinema Drone",
    description: "4K 60p HDR main camera with 6 360-degree navigation cameras for 360 autonomous obstacle tracking, Skydio Beacon wand controller.",
    price: 3600,
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f10c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "drones",
    rating: 4.6,
    reviews: 43,
    available: true,
    owner: { name: "Yash Vardhan", avatar: "https://i.pravatar.cc/100?img=55", rating: 4.6 },
  },

  // --- 4. POWER BANKS CATEGORY (10 Real Products) ---
  {
    id: "p4",
    title: "Anker PowerCore 24K 140W Power Bank",
    description: "Ultra-high capacity 24,000mAh power bank with 140W two-way fast charging. Features a smart digital display showing charge level and output specs.",
    price: 250,
    image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80"
    ],
    angleImages: [
      { label: "Front Display", image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80" },
      { label: "140W Ports", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80" },
      { label: "Metal Casing", image: "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80" },
      { label: "Fast Charging", image: "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80" }
    ],
    category: "powerbanks",
    rating: 4.9,
    reviews: 114,
    available: true,
    owner: { name: "Maya Patel", avatar: "https://i.pravatar.cc/100?img=47", rating: 4.7 },
  },
  {
    id: "p4_anker537",
    title: "Anker 537 Power Bank 24,000mAh (65W)",
    description: "24,000mAh capacity with 65W Max USB-C Power Delivery charging for laptops & phones, dual USB-C + USB-A ports.",
    price: 180,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "powerbanks",
    rating: 4.8,
    reviews: 82,
    available: true,
    owner: { name: "Aditi Rao", avatar: "https://i.pravatar.cc/100?img=49", rating: 4.8 },
  },
  {
    id: "p5",
    title: "Ambrane PowerLit 50000mAh Power Bank",
    description: "Massive 50000mAh battery backup. Supports 22.5W fast charging, triple outputs, and dual input modes. Rugged design with LED flashlight.",
    price: 350,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "powerbanks",
    rating: 4.8,
    reviews: 95,
    available: true,
    owner: { name: "James Ford", avatar: "https://i.pravatar.cc/100?img=52", rating: 4.6 },
  },
  {
    id: "p5_ambrane20",
    title: "Ambrane Stylo 20000mAh Fast Power Bank",
    description: "20,000mAh capacity, 20W Power Delivery & Quick Charge 3.0, dual USB-A and Type-C input/output ports, multi-layer protection.",
    price: 120,
    image: "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "powerbanks",
    rating: 4.7,
    reviews: 64,
    available: true,
    owner: { name: "Sunil Verma", avatar: "https://i.pravatar.cc/100?img=54", rating: 4.7 },
  },
  {
    id: "p6",
    title: "Xiaomi Mi Boost Pro 30000mAh Power Bank",
    description: "High-capacity power bank with 18W fast charge capability. Triple port output, dual input, and high-quality metallic finish.",
    price: 200,
    image: "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "powerbanks",
    rating: 4.7,
    reviews: 63,
    available: true,
    owner: { name: "Sofia Ruiz", avatar: "https://i.pravatar.cc/100?img=48", rating: 4.9 },
  },
  {
    id: "p6_xiaomi10",
    title: "Xiaomi Pocket Power Bank Pro 10000mAh",
    description: "10,000mAh ultra-compact pocket size, 22.5W two-way fast charging, Type-C built-in cable, 9-layer circuit safety protection.",
    price: 100,
    image: "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "powerbanks",
    rating: 4.8,
    reviews: 77,
    available: true,
    owner: { name: "Divya Shah", avatar: "https://i.pravatar.cc/100?img=56", rating: 4.8 },
  },
  {
    id: "p7",
    title: "URBN 20000mAh Ultra Compact Power Bank",
    description: "Pocket-sized 20000mAh external battery with 22.5W super-fast charging. Dual ports and carbon fiber texture finish.",
    price: 150,
    image: "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "powerbanks",
    rating: 4.6,
    reviews: 42,
    available: true,
    owner: { name: "Noah Kim", avatar: "https://i.pravatar.cc/100?img=15", rating: 4.8 },
  },
  {
    id: "p7_urbn10",
    title: "URBN 10000mAh MagSafe Wireless Power Bank",
    description: "10,000mAh capacity, 15W MagSafe magnetic wireless charging for iPhone & Android, 20W Type-C PD wired output.",
    price: 140,
    image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "powerbanks",
    rating: 4.7,
    reviews: 58,
    available: true,
    owner: { name: "Tarun Gill", avatar: "https://i.pravatar.cc/100?img=58", rating: 4.7 },
  },
  {
    id: "p4_boat10",
    title: "boAt EnergyShroom PB300 10000mAh Power Bank",
    description: "10,000mAh capacity, 22.5W fast charging, pass-through charging support, aluminum alloy body, dual USB-A ports.",
    price: 110,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "powerbanks",
    rating: 4.6,
    reviews: 49,
    available: true,
    owner: { name: "Meera Nair", avatar: "https://i.pravatar.cc/100?img=60", rating: 4.6 },
  },
  {
    id: "p4_boat20",
    title: "boAt EnergyShroom PB400 20000mAh Power Bank",
    description: "20,000mAh capacity, 22.5W fast charge, Smart IC protection against short-circuit & overvoltage, Type-C two-way PD.",
    price: 160,
    image: "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1541877944-ac82a091518a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1622445268465-843d635870b9?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "powerbanks",
    rating: 4.7,
    reviews: 67,
    available: true,
    owner: { name: "Vikram Roy", avatar: "https://i.pravatar.cc/100?img=62", rating: 4.7 },
  },

  // --- 5. BIKES & RIDES CATEGORY (11 Real Products) ---
  {
    id: "p9",
    title: "Royal Enfield Classic 350 Motorcycle",
    description: "Iconic cruiser bike with 349cc J-series engine, dual-channel ABS, teardrop tank, and classic riding posture. Includes helmet & insurance.",
    price: 1200,
    image: reClassic350Img,
    images: [
      reClassic350Img,
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "bikes",
    rating: 4.9,
    reviews: 43,
    available: true,
    owner: { name: "Rahul Sharma", avatar: "https://i.pravatar.cc/100?img=11", rating: 4.8 },
  },
  {
    id: "p9_himalayan",
    title: "Royal Enfield Himalayan 452 Adventure Bike",
    description: "452cc liquid-cooled Sherpa engine, 40 PS, 6-speed gearbox, long-travel USD fork suspension, Tripper TFT display, built for off-road tours.",
    price: 1600,
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
      reClassic350Img
    ],
    category: "bikes",
    rating: 5.0,
    reviews: 62,
    available: true,
    owner: { name: "Manish Sharma", avatar: "https://i.pravatar.cc/100?img=64", rating: 5.0 },
  },
  {
    id: "p13",
    title: "KTM Duke 390 Sports Motorcycle",
    description: "399cc liquid-cooled LC4c engine, 46 PS, orange steel trellis frame, WP APEX adjustable suspension, TFT dashboard with smartphone connectivity.",
    price: 1800,
    image: ktmDukeImg,
    images: [
      ktmDukeImg,
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "bikes",
    rating: 4.9,
    reviews: 57,
    available: true,
    owner: { name: "Aditya Verma", avatar: "https://i.pravatar.cc/100?img=15", rating: 4.9 },
  },
  {
    id: "p14",
    title: "Honda Activa 6G Scooter",
    description: "109.51cc PGM-Fi engine, silent start with ACG, telescopic front suspension, external fuel lid, 50 kmpl mileage. Includes helmet.",
    price: 400,
    image: hondaActivaImg,
    images: [
      hondaActivaImg,
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "bikes",
    rating: 4.6,
    reviews: 82,
    available: true,
    owner: { name: "Karan Johar", avatar: "https://i.pravatar.cc/100?img=20", rating: 4.5 },
  },
  {
    id: "p13_yamaha",
    title: "Yamaha YZF-R3 Twin-Cylinder Sports Bike",
    description: "321cc liquid-cooled DOHC parallel-twin engine, 42 PS, inverted front forks, dual-channel ABS, LCD instrument cluster.",
    price: 2000,
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
      ktmDukeImg
    ],
    category: "bikes",
    rating: 4.9,
    reviews: 44,
    available: true,
    owner: { name: "Suresh Menon", avatar: "https://i.pravatar.cc/100?img=66", rating: 4.9 },
  },
  {
    id: "p9_bajaj",
    title: "Bajaj Pulsar NS200 Streetfighter Motorcycle",
    description: "199.5cc liquid-cooled triple-spark DTS-i engine, 24.5 PS, USD front forks, perimeter frame, dual-channel ABS.",
    price: 900,
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
      reClassic350Img
    ],
    category: "bikes",
    rating: 4.7,
    reviews: 58,
    available: true,
    owner: { name: "Anand Rangan", avatar: "https://i.pravatar.cc/100?img=68", rating: 4.7 },
  },
  {
    id: "p16",
    title: "Ather 450X Smart Electric Scooter",
    description: "6.4 kW PMSM electric motor, 150 km certified range, Warp Mode 0-40 km/h in 3.3s, 7\\" capacitive touchscreen dashboard with Google Maps.",
    price: 600,
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
      hondaActivaImg
    ],
    category: "bikes",
    rating: 4.9,
    reviews: 73,
    available: true,
    owner: { name: "Kunal Shah", avatar: "https://i.pravatar.cc/100?img=70", rating: 4.9 },
  },
  {
    id: "p10",
    title: "Trek Marlin 7 Mountain Bike",
    description: "Alpha Silver Aluminum frame, RockShox Judy suspension fork with lockout, Shimano Deore 1x10 drivetrain, hydraulic disc brakes. Helmet included.",
    price: 500,
    image: trekMarlinImg,
    images: [
      trekMarlinImg,
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "bikes",
    rating: 4.7,
    reviews: 29,
    available: true,
    owner: { name: "Amit Patel", avatar: "https://i.pravatar.cc/100?img=33", rating: 4.7 },
  },
  {
    id: "p10_specialized",
    title: "Specialized Rockhopper Expert Mountain Bike",
    description: "A1 Premium Butted Alloy frame, SR Suntour XCR Air suspension fork, Shimano Deore 1x11 drivetrain, hydraulic disc brakes.",
    price: 600,
    image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1000&q=80",
      trekMarlinImg
    ],
    category: "bikes",
    rating: 4.8,
    reviews: 35,
    available: true,
    owner: { name: "Girish V", avatar: "https://i.pravatar.cc/100?img=72", rating: 4.8 },
  },
  {
    id: "p10_giant",
    title: "Giant Escape 3 Disc City Hybrid Bike",
    description: "ALUXX-Grade Aluminum frame, Tektro mechanical disc brakes, Shimano 3x7 drivetrain, puncture-resistant 700x38c tires.",
    price: 400,
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1000&q=80",
      trekMarlinImg
    ],
    category: "bikes",
    rating: 4.6,
    reviews: 41,
    available: true,
    owner: { name: "Nitin Rao", avatar: "https://i.pravatar.cc/100?img=74", rating: 4.6 },
  },
  {
    id: "p10_cannondale",
    title: "Cannondale Quick 4 Fitness Bike",
    description: "SmartForm C3 Alloy frame, SAVE micro-suspension, microSHIFT 1x9 drivetrain, Tektro hydraulic disc brakes, integrated wheel sensor.",
    price: 450,
    image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1000&q=80",
      trekMarlinImg
    ],
    category: "bikes",
    rating: 4.7,
    reviews: 32,
    available: true,
    owner: { name: "Varun Bajaj", avatar: "https://i.pravatar.cc/100?img=76", rating: 4.7 },
  },

  // --- 6. ELECTRIC TOOLS CATEGORY (10 Real Products) ---
  {
    id: "p11",
    title: "Bosch GBH 2-28 Professional Rotary Hammer Drill",
    description: "880W motor, 3.2 Joules impact energy, SDS-plus tool holder, KickBack Control safety sensor. Includes drill bits, side handle, and case.",
    price: 350,
    image: toolImg,
    images: [
      toolImg,
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "tools",
    rating: 4.8,
    reviews: 35,
    available: true,
    owner: { name: "Vikram Singh", avatar: "https://i.pravatar.cc/100?img=47", rating: 4.9 },
  },
  {
    id: "p11_bosch_gsb",
    title: "Bosch GSB 18V-55 Cordless Combi Drill",
    description: "Brushless motor, 55 Nm torque, 13mm metal chuck, 2-speed gearbox, 18V 4.0Ah ProCORE battery pack & charger included.",
    price: 300,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
      toolImg
    ],
    category: "tools",
    rating: 4.8,
    reviews: 46,
    available: true,
    owner: { name: "Suresh Pillai", avatar: "https://i.pravatar.cc/100?img=78", rating: 4.8 },
  },
  {
    id: "p12",
    title: "DeWalt DCD791B 20V MAX XR Cordless Drill",
    description: "High-efficiency brushless motor delivering 460 UWO, 1/2\\" metal ratcheting chuck, 3-mode LED light, 20V MAX XR 5.0Ah battery included.",
    price: 450,
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
      toolImg
    ],
    category: "tools",
    rating: 4.6,
    reviews: 18,
    available: true,
    owner: { name: "Suresh Kumar", avatar: "https://i.pravatar.cc/100?img=12", rating: 4.6 },
  },
  {
    id: "p12_dewalt_saw",
    title: "DeWalt DCS391B 20V MAX 6-1/2\\" Circular Saw",
    description: "5150 RPM motor, 6-1/2\\" carbide-tipped blade, 0-50 degree bevel capacity, lightweight magnesium shoe for jobsite durability.",
    price: 500,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      toolImg
    ],
    category: "tools",
    rating: 4.9,
    reviews: 58,
    available: true,
    owner: { name: "Ramesh Sen", avatar: "https://i.pravatar.cc/100?img=80", rating: 4.9 },
  },
  {
    id: "p11_makita_drill",
    title: "Makita XPH14Z 18V LXT Brushless Hammer Drill",
    description: "Makita brushless motor delivering 1,250 in.lbs. max torque, 2-speed transmission (0-550 & 0-2,100 RPM), all-metal 1/2\\" chuck.",
    price: 420,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
      toolImg
    ],
    category: "tools",
    rating: 4.8,
    reviews: 39,
    available: true,
    owner: { name: "Dinesh Patel", avatar: "https://i.pravatar.cc/100?img=82", rating: 4.8 },
  },
  {
    id: "p11_makita_saw",
    title: "Makita XSS02Z 18V LXT 6-1/2\\" Circular Saw",
    description: "3,700 RPM motor, 6-1/2\\" blade with 2-1/4\\" cutting depth at 90 degrees, heavy-gauge precision machined base for smooth cuts.",
    price: 480,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      toolImg
    ],
    category: "tools",
    rating: 4.7,
    reviews: 31,
    available: true,
    owner: { name: "Mahesh Kumar", avatar: "https://i.pravatar.cc/100?img=84", rating: 4.7 },
  },
  {
    id: "p12_milwaukee_wrench",
    title: "Milwaukee M18 FUEL 1/2\\" High Torque Impact Wrench",
    description: "1,400 ft-lbs nut-busting torque, 1,000 ft-lbs fastening torque, 4-mode DRIVE CONTROL, M18 REDLITHIUM XC5.0 battery.",
    price: 550,
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
      toolImg
    ],
    category: "tools",
    rating: 5.0,
    reviews: 67,
    available: true,
    owner: { name: "Balraj Gill", avatar: "https://i.pravatar.cc/100?img=86", rating: 5.0 },
  },
  {
    id: "p12_milwaukee_multi",
    title: "Milwaukee M12 FUEL Oscillating Multi-Tool",
    description: "POWERSTATE brushless motor, 10,000-20,000 OPM, 3.9-degree oscillation angle, tool-free blade change.",
    price: 380,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
      toolImg
    ],
    category: "tools",
    rating: 4.8,
    reviews: 42,
    available: true,
    owner: { name: "Harpreet Singh", avatar: "https://i.pravatar.cc/100?img=88", rating: 4.8 },
  },
  {
    id: "p20",
    title: "Karcher K4 High-Pressure Washer",
    description: "1800W water-cooled induction motor, 130 bar pressure, Vario Power spray lance, Plug 'n' Clean detergent system.",
    price: 500,
    image: toolImg,
    images: [
      toolImg,
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "tools",
    rating: 4.7,
    reviews: 26,
    available: true,
    owner: { name: "Prakash Raj", avatar: "https://i.pravatar.cc/100?img=12", rating: 4.6 },
  },
  {
    id: "p19",
    title: "Dyson V15 Detect Cordless Vacuum Cleaner",
    description: "Hyperdymium motor 240 AW suction, Fluffy Optic cleaner head revealing invisible dust, piezo sensor counting dust particles.",
    price: 1000,
    image: toolImg,
    images: [
      toolImg,
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "tools",
    rating: 4.9,
    reviews: 44,
    available: true,
    owner: { name: "Anjali Rao", avatar: "https://i.pravatar.cc/100?img=5", rating: 4.9 },
  },
];

// Load custom products from localStorage dynamically on module load
const getCustomProducts = (): Product[] => {
  if (typeof window === "undefined") return [];
  return storage.get<Product[]>(STORAGE_KEYS.customProducts, []);
};

export const products: Product[] = [...getCustomProducts(), ...initialProducts].map((p) => {
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
    angleImages: p.angleImages && p.angleImages.length >= 2 ? p.angleImages : angleImages,
    rotationFrames: p.rotationFrames && p.rotationFrames.length >= 2 ? p.rotationFrames : defaultAngles,
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
    image: stockImg("1522071820081-009f0129c71c"),
  },
  {
    label: "Cities Covered",
    value: "120+",
    image: stockImg("1477959858617-67f30ac4ce71"),
  },
];
'''

with open(mock_data_path, "w", encoding="utf-8") as f:
    f.write(new_mock_data)

print("Updated mockData.ts successfully!")
