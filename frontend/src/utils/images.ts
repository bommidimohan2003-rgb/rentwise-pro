/**
 * Payent Image Optimization Utilities
 * Handles dynamic image resizing, responsive srcSet generation, and WebP/AVIF format optimization
 */

export type ImageSizeTier = 'thumb' | 'card' | 'detail' | 'hero' | 'banner';

const SIZE_TIER_WIDTHS: Record<ImageSizeTier, { width: number; quality: number }> = {
  thumb: { width: 160, quality: 70 },
  card: { width: 440, quality: 75 },
  detail: { width: 800, quality: 80 },
  hero: { width: 1200, quality: 80 },
  banner: { width: 1600, quality: 80 },
};

/**
 * Optimizes an image URL (e.g. Unsplash) for the requested tier or explicit pixel width.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  tierOrWidth: ImageSizeTier | number = 'card',
  overrideQuality?: number
): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // If it's a data URL or blob, return as is
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const { width, quality } =
    typeof tierOrWidth === 'number'
      ? { width: tierOrWidth, quality: overrideQuality ?? 75 }
      : {
          width: SIZE_TIER_WIDTHS[tierOrWidth]?.width || 440,
          quality: overrideQuality ?? (SIZE_TIER_WIDTHS[tierOrWidth]?.quality || 75),
        };

  // Unsplash Optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('w', width.toString());
      parsed.searchParams.set('q', quality.toString());
      parsed.searchParams.set('auto', 'format');
      if (!parsed.searchParams.has('fit')) {
        parsed.searchParams.set('fit', 'crop');
      }
      return parsed.toString();
    } catch {
      // Fallback if URL parsing fails
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}w=${width}&q=${quality}&auto=format&fit=crop`;
    }
  }

  // Cloudinary Optimization
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/image/upload/', `/image/upload/w_${width},q_${quality},f_auto/`);
  }

  return url;
}

/**
 * Generates standard responsive srcSet string for Unsplash or supported image CDNs.
 */
export function getResponsiveImageSrcSet(
  url: string | undefined | null,
  widths: number[] = [320, 480, 768, 1024, 1440]
): string {
  if (!url || !url.includes('images.unsplash.com')) {
    return '';
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(url, w)} ${w}w`)
    .join(', ');
}
