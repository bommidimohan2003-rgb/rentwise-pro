import type { Product } from "@/types";

/**
 * Formats a product owner's address cleanly.
 * Example output: "Hyderabad, Telangana" or "Vijayawada, Andhra Pradesh"
 * Fallback: "Location unavailable"
 */
export function formatOwnerAddress(product: Product | null | undefined): string {
  if (!product) return "Location unavailable";

  const owner = product.owner;
  const ownerCity = owner?.city?.trim();
  const ownerState = owner?.state?.trim();
  const ownerAddr = owner?.address?.trim();
  const ownerLoc = owner?.location?.trim();
  const prodLoc = product.location?.trim();

  // 1. Prefer City, State format
  if (ownerCity && ownerState) {
    return `${ownerCity}, ${ownerState}`;
  }

  // 2. City only
  if (ownerCity) {
    return ownerCity;
  }

  // 3. State only
  if (ownerState) {
    return ownerState;
  }

  // 4. Product top-level location if valid
  if (prodLoc && prodLoc !== "Location unavailable") {
    return prodLoc;
  }

  // 5. Owner location if valid
  if (ownerLoc && ownerLoc !== "Location unavailable") {
    return ownerLoc;
  }

  // 6. Owner street address
  if (ownerAddr) {
    return ownerAddr;
  }

  return "Location unavailable";
}

/**
 * Formats a date string into a user-friendly relative timestamp.
 * Example: "Just now", "2h ago", "Yesterday", "3d ago", "2mo ago"
 */
export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  } catch {
    return dateStr;
  }
}
