import { create } from 'zustand';
import type { Page, ScrapeBookImage } from '../lib/types';
import { DEFAULT_IMAGE_SIZE_MM } from '../lib/constants';
import { autoPackImages } from '../lib/packing';
import { compressImageToBase64 } from '../lib/imageUtils';
import {
  loadProject as loadProjectFb,
  saveProject as saveProjectFb,
} from '../firebase/firestore';
import { auth } from '../firebase/config';

interface AppState {
  currentProjectId: string | null;
  currentProjectName: string | null;
  isDirty: boolean;
  isSaving: boolean;

  pages: Page[];
  selectedImageId: string | null;

  openProject: (projectId: string, name: string) => void;
  loadProjectData: (projectId: string) => Promise<void>;
  saveProject: () => Promise<void>;
  closeProject: () => void;
  setProjectName: (name: string) => void;
  markDirty: () => void;

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
  currentProjectId: null,
  currentProjectName: null,
  isDirty: false,
  isSaving: false,
  pages: [createPage()],
  selectedImageId: null,

  openProject: (projectId, name) => {
    set({
      currentProjectId: projectId,
      currentProjectName: name,
      pages: [createPage()],
      isDirty: false,
      selectedImageId: null,
    });
    get().loadProjectData(projectId);
  },

  loadProjectData: async (projectId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      const data = await loadProjectFb(userId, projectId);
      const pages = data.pages.length > 0 ? data.pages : [createPage()];
      set({
        pages,
        currentProjectName: data.name,
        isDirty: false,
      });
    } catch {
      // New project with no data yet
    }
  },

  saveProject: async () => {
    const { currentProjectId, currentProjectName, pages } = get();
    const userId = auth.currentUser?.uid;
    if (!userId || !currentProjectId) return;

    set({ isSaving: true });
    try {
      // Collect images that need to be persisted (no base64 yet)
      const imagesToSave: { id: string; base64: string }[] = [];
      const updatedPages = pages.map((page) => ({
        ...page,
        images: page.images.map((img) => {
          if (!img.persisted && img.base64) {
            imagesToSave.push({ id: img.id, base64: img.base64 });
            return { ...img, persisted: true };
          }
          return img;
        }),
      }));

      set({ pages: updatedPages });

      await saveProjectFb(
        userId,
        currentProjectId,
        currentProjectName || 'Untitled',
        'ongoing',
        updatedPages,
        imagesToSave
      );

      set({ isDirty: false });
    } finally {
      set({ isSaving: false });
    }
  },

  closeProject: () => {
    set({
      currentProjectId: null,
      currentProjectName: null,
      pages: [createPage()],
      isDirty: false,
      selectedImageId: null,
    });
  },

  setProjectName: (name) => {
    set({ currentProjectName: name, isDirty: true });
  },

  markDirty: () => {
    set({ isDirty: true });
  },

  addPage: () => {
    set((state) => ({
      pages: [...state.pages, createPage()],
      isDirty: true,
    }));
  },

  removePage: (pageId) => {
    set((state) => {
      const filtered = state.pages.filter((p) => p.id !== pageId);
      return {
        pages: filtered.length > 0 ? filtered : [createPage()],
        isDirty: true,
      };
    });
  },

  addImages: (pageId, files) => {
    for (const file of files) {
      const blobUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const width = DEFAULT_IMAGE_SIZE_MM;
        const height = width / aspectRatio;

        const newImage: ScrapeBookImage = {
          id: crypto.randomUUID(),
          src: blobUrl,
          x: 10,
          y: 10,
          width,
          height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        };

        // Compress to base64 in background for persistence
        compressImageToBase64(file).then((base64) => {
          set((state) => ({
            pages: state.pages.map((p) =>
              p.id === pageId
                ? {
                    ...p,
                    images: p.images.map((im) =>
                      im.id === newImage.id
                        ? { ...im, base64, src: base64 }
                        : im
                    ),
                  }
                : p
            ),
          }));
        });

        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === pageId ? { ...p, images: [...p.images, newImage] } : p
          ),
          isDirty: true,
        }));
      };
      img.src = blobUrl;
    }
  },

  updateImage: (pageId, imageId, updates) => {
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? {
              ...p,
              images: p.images.map((im) =>
                im.id === imageId ? { ...im, ...updates } : im
              ),
            }
          : p
      ),
      isDirty: true,
    }));
  },

  removeImage: (pageId, imageId) => {
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, images: p.images.filter((im) => im.id !== imageId) }
          : p
      ),
      selectedImageId:
        state.selectedImageId === imageId ? null : state.selectedImageId,
      isDirty: true,
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

      if (overflow.length > 0) {
        const newPage = createPage();
        newPage.images = overflow;
        pages = [...pages, newPage];
      }

      return { pages, isDirty: true };
    });
  },
}));
