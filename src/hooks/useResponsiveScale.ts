import { useState, useEffect } from 'react';
import { A4_WIDTH_MM, DEFAULT_SCALE } from '../lib/constants';

const DESKTOP_BREAKPOINT = 768;
const MOBILE_PADDING = 16;

function computeScale(width: number): number {
  if (width >= DESKTOP_BREAKPOINT) return DEFAULT_SCALE;
  return (width - MOBILE_PADDING * 2) / A4_WIDTH_MM;
}

export function useResponsiveScale(): number {
  const [scale, setScale] = useState(() => computeScale(window.innerWidth));

  useEffect(() => {
    const handleResize = () => setScale(computeScale(window.innerWidth));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return scale;
}
