/**
 * next/image loader for Cloudinary-hosted media.
 *
 * Serves images straight from Cloudinary's global CDN (no Next.js image-optimizer
 * hop) at exactly the size the layout needs, with automatic format (AVIF/WebP)
 * and quality. `c_limit` never upscales, so chaining this in front of a URL that
 * already has a baked-in transform is safe.
 */
interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderArgs): string {
  if (!src.includes('res.cloudinary.com')) return src;

  const marker = '/upload/';
  const idx = src.indexOf(marker);
  if (idx === -1) return src;

  const transform = [
    'f_auto',
    `q_${quality ?? 'auto'}`,
    `w_${width}`,
    'c_limit',
    'dpr_auto',
  ].join(',');

  return (
    src.slice(0, idx + marker.length) +
    transform +
    '/' +
    src.slice(idx + marker.length)
  );
}

/** A tiny, heavily-blurred version for use as a `blurDataURL` placeholder. */
export function cloudinaryBlurUrl(src: string): string | undefined {
  if (!src.includes('res.cloudinary.com')) return undefined;
  const marker = '/upload/';
  const idx = src.indexOf(marker);
  if (idx === -1) return undefined;
  return (
    src.slice(0, idx + marker.length) +
    'w_24,e_blur:1200,q_10,f_auto/' +
    src.slice(idx + marker.length)
  );
}

