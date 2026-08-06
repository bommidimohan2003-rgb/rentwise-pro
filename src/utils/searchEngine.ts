import type { Product } from "@/types";

// Synonym dictionary for intelligent keyword expansion
const SYNONYM_MAP: Record<string, string[]> = {
  // Cameras
  camera: [
    "cam",
    "dslr",
    "mirrorless",
    "cinema",
    "lens",
    "photo",
    "vlog",
    "video",
    "4k",
    "8k",
    "shooting",
    "shutter",
  ],
  cam: ["camera", "dslr", "mirrorless"],
  dslr: ["camera", "mirrorless", "canon", "nikon", "sony"],
  mirrorless: ["camera", "sony", "canon", "nikon", "fujifilm", "panasonic"],
  sony: ["a7", "fx3", "a7r", "alpha"],
  canon: ["eos", "r6", "r5"],
  nikon: ["z6", "z8", "fx"],
  fujifilm: ["fuji", "x-t5", "x100v"],

  // Laptops
  laptop: [
    "macbook",
    "notebook",
    "computer",
    "pc",
    "workstation",
    "gaming laptop",
    "touchscreen",
    "oled",
  ],
  mac: ["macbook", "apple", "m3", "m2", "air", "pro"],
  macbook: ["mac", "apple", "m3", "m2", "air", "pro"],
  apple: ["macbook", "mac", "air", "pro"],
  dell: ["xps", "precision", "workstation"],
  lenovo: ["thinkpad", "legion", "trackpoint"],
  hp: ["spectre", "envy", "x360"],
  asus: ["rog", "zephyrus", "zenbook"],

  // Drones
  drone: [
    "dji",
    "quadcopter",
    "fpv",
    "gimbal",
    "aerial",
    "mavic",
    "fly",
    "flight",
    "autel",
    "skydio",
  ],
  dji: ["mavic", "mini", "air", "inspire", "avata", "drone"],
  fpv: ["avata", "drone", "goggles"],

  // Bikes & Rides
  bike: [
    "bicycle",
    "cycle",
    "motorcycle",
    "scooter",
    "ride",
    "mtb",
    "cruiser",
    "sports bike",
    "ev",
    "electric scooter",
  ],
  motorcycle: [
    "bike",
    "classic",
    "duke",
    "pulsar",
    "royal enfield",
    "ktm",
    "yamaha",
    "honda",
    "bajaj",
  ],
  scooter: ["activa", "ather", "ev", "honda", "ride"],
  trek: ["marlin", "mtb", "mountain bike"],
  royal: ["enfield", "classic", "himalayan"],
  ktm: ["duke", "sports bike"],

  // Power Banks
  powerbank: [
    "charger",
    "battery",
    "power bank",
    "powercore",
    "magsafe",
    "fast charge",
    "pd",
    "140w",
    "65w",
    "mah",
  ],
  charger: ["powerbank", "fast charge", "anker", "ambrane", "xiaomi", "urbn"],
  anker: ["powercore", "737", "537", "powerbank"],

  // Tools
  tool: [
    "drill",
    "saw",
    "hammer",
    "wrench",
    "cordless",
    "impact",
    "washer",
    "vacuum",
    "bosch",
    "dewalt",
    "makita",
    "milwaukee",
  ],
  drill: ["hammer drill", "combi drill", "cordless", "bosch", "dewalt", "makita"],
  saw: ["circular saw", "blade", "dewalt", "makita"],
};

// Levenshtein Distance for fuzzy typo tolerance
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Check fuzzy match for typos (e.g. "somny" -> "sony", "macbok" -> "macbook")
function isFuzzyMatch(word: string, targetToken: string): boolean {
  if (word.length < 4 || targetToken.length < 4) return false;
  if (Math.abs(word.length - targetToken.length) > 2) return false;

  const dist = levenshteinDistance(word, targetToken);
  return dist <= 2;
}

export interface SearchResult {
  product: Product;
  score: number;
}

/**
 * Advanced Multi-token, Fuzzy, Synonym-aware & Ranked Search Engine
 */
export function advancedSearch(productsList: Product[], query: string): Product[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return productsList;

  const queryTokens = trimmed.split(/\s+/).filter((t) => t.length > 0);

  const scoredResults: SearchResult[] = [];

  for (const product of productsList) {
    const titleLower = product.title.toLowerCase();
    const descLower = product.description.toLowerCase();
    const catLower = product.category.toLowerCase();
    const ownerLower = product.owner?.name?.toLowerCase() || "";

    let totalScore = 0;
    let matchedAllTokens = true;

    for (const token of queryTokens) {
      let tokenMatched = false;
      let tokenScore = 0;

      // 1. Direct exact phrase match in Title (Highest Priority: +15)
      if (titleLower.includes(trimmed)) {
        tokenScore += 15;
        tokenMatched = true;
      }
      // 2. Token match in Title (+10)
      else if (titleLower.includes(token)) {
        tokenScore += 10;
        tokenMatched = true;
      }

      // 3. Category match (+8)
      if (catLower.includes(token)) {
        tokenScore += 8;
        tokenMatched = true;
      }

      // 4. Owner match (+5)
      if (ownerLower.includes(token)) {
        tokenScore += 5;
        tokenMatched = true;
      }

      // 5. Description / Specs match (+3)
      if (descLower.includes(token)) {
        tokenScore += 3;
        tokenMatched = true;
      }

      // 6. Synonym expansion check (+4)
      if (!tokenMatched) {
        const synonyms = SYNONYM_MAP[token] || [];
        for (const syn of synonyms) {
          if (titleLower.includes(syn) || catLower.includes(syn) || descLower.includes(syn)) {
            tokenScore += 4;
            tokenMatched = true;
            break;
          }
        }
      }

      // 7. Fuzzy Typo tolerance check (+3)
      if (!tokenMatched) {
        const productWords = (titleLower + " " + catLower).split(/\s+/);
        for (const pWord of productWords) {
          if (isFuzzyMatch(token, pWord)) {
            tokenScore += 3;
            tokenMatched = true;
            break;
          }
        }
      }

      if (!tokenMatched) {
        matchedAllTokens = false;
        break;
      }

      totalScore += tokenScore;
    }

    if (matchedAllTokens && totalScore > 0) {
      scoredResults.push({ product, score: totalScore });
    }
  }

  // Sort by highest relevance score
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.map((r) => r.product);
}
