import { MaxRectsPacker } from 'maxrects-packer';
import { A4_WIDTH_MM, A4_HEIGHT_MM } from './constants';
import type { ScrapeBookImage } from './types';

// Use integer units (0.1mm precision) to avoid float issues
const PRECISION_SCALE = 10;

export interface PackResult {
  /** Images that fit on the current page, with updated positions */
  packed: ScrapeBookImage[];
  /** Images that overflowed and need a new page */
  overflow: ScrapeBookImage[];
}

export function autoPackImages(images: ScrapeBookImage[]): PackResult {
  if (images.length === 0) {
    return { packed: [], overflow: [] };
  }

  const packer = new MaxRectsPacker(
    A4_WIDTH_MM * PRECISION_SCALE,
    A4_HEIGHT_MM * PRECISION_SCALE,
    0, // zero padding — images will be cut out
    {
      smart: true,
      pot: false,
      square: false,
      allowRotation: false,
    }
  );

  for (const img of images) {
    packer.add(
      Math.round(img.width * PRECISION_SCALE),
      Math.round(img.height * PRECISION_SCALE),
      img
    );
  }

  const packed: ScrapeBookImage[] = [];
  const overflow: ScrapeBookImage[] = [];

  if (packer.bins.length > 0) {
    // First bin = what fits on this page
    for (const rect of packer.bins[0].rects) {
      packed.push({
        ...rect.data!,
        x: rect.x / PRECISION_SCALE,
        y: rect.y / PRECISION_SCALE,
      });
    }

    // Additional bins = overflow
    for (let i = 1; i < packer.bins.length; i++) {
      for (const rect of packer.bins[i].rects) {
        overflow.push({
          ...rect.data!,
          x: rect.x / PRECISION_SCALE,
          y: rect.y / PRECISION_SCALE,
        });
      }
    }
  }

  return { packed, overflow };
}
