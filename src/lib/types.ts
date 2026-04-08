export interface ScrapeBookImage {
  id: string;
  src: string;           // display: blob URL or base64 data URL
  base64?: string;       // compressed base64 for Firestore persistence
  persisted?: boolean;   // true if already saved to Firestore
  x: number;             // mm from left
  y: number;             // mm from top
  width: number;         // mm
  height: number;        // mm
  naturalWidth: number;  // original px
  naturalHeight: number; // original px
}

export interface Page {
  id: string;
  images: ScrapeBookImage[];
}

export interface Project {
  id: string;
  name: string;
  status: 'ongoing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}
