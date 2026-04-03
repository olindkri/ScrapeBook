export interface ScrapeBookImage {
  id: string;
  src: string;
  x: number;       // mm from left
  y: number;       // mm from top
  width: number;   // mm
  height: number;  // mm
  naturalWidth: number;  // original px
  naturalHeight: number; // original px
}

export interface Page {
  id: string;
  images: ScrapeBookImage[];
}
