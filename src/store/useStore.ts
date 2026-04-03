import { create } from 'zustand';
import type { Page, ScrapeBookImage } from '../lib/types';
import { DEFAULT_IMAGE_SIZE_MM, DEFAULT_SCALE } from '../lib/constants';
import { autoPackImages } from '../lib/packing';

interface AppState {
  pages: Page[];
  scaleFactor: number;
  selectedImageId: string | null;

  addPage: () => void;
  removePage: (pageId: string) => void;
  addImages: (pageId: string, files: File[]) => void;
  updateImage: (pageId: string, imageId: string, updates: Partial<ScrapeBookImage>) => void;
  removeImage: (pageId: string, imageId: string) => void;
  selectImage: (imageId: string | null) => void;
  autoPackPage: (pageId: string) => void;
}

function createPage(): Page {
  return {
    id: crypto.randomUUID(),
    images: [],
  };
}

export const useStore = create<AppState>((set, get) => ({
  pages: [createPage()],
  scaleFactor: DEFAULT_SCALE,
  selectedImageId: null,

  addPage: () => {
    set((state) => ({
      pages: [...state.pages, createPage()],
    }));
  },

  removePage: (pageId) => {
    set((state) => {
      const filtered = state.pages.filter((p) => p.id !== pageId);
      // Always keep at least one page
      return { pages: filtered.length > 0 ? filtered : [createPage()] };
    });
  },

  addImages: (pageId, files) => {
    for (const file of files) {
      const src = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const width = DEFAULT_IMAGE_SIZE_MM;
        const height = width / aspectRatio;

        const newImage: ScrapeBookImage = {
          id: crypto.randomUUID(),
          src,
          x: 10,
          y: 10,
          width,
          height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        };

        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === pageId ? { ...p, images: [...p.images, newImage] } : p
          ),
        }));
      };
      img.src = src;
    }
  },

  updateImage: (pageId, imageId, updates) => {
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              images: p.images.map((img) =>
                img.id === imageId ? { ...img, ...updates } : img
              ),
            }
          : p
      ),
    }));
  },

  removeImage: (pageId, imageId) => {
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, images: p.images.filter((img) => img.id !== imageId) }
          : p
      ),
      selectedImageId:
        state.selectedImageId === imageId ? null : state.selectedImageId,
    }));
  },

  selectImage: (imageId) => {
    set({ selectedImageId: imageId });
  },

  autoPackPage: (pageId) => {
    const state = get();
    const page = state.pages.find((p) => p.id === pageId);
    if (!page) return;

    const { packed, overflow } = autoPackImages(page.images);

    set((s) => {
      let pages = s.pages.map((p) =>
        p.id === pageId ? { ...p, images: packed } : p
      );

      // Create new page(s) for overflow images
      if (overflow.length > 0) {
        const newPage = createPage();
        newPage.images = overflow;
        pages = [...pages, newPage];
      }

      return { pages };
    });
  },
}));
