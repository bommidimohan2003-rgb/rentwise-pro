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
