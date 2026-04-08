import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store/useStore';
import { Toolbar } from './components/Toolbar/Toolbar';
import { PageCanvas } from './components/PageCanvas/PageCanvas';
import { ProjectList } from './components/ProjectList/ProjectList';
import styles from './App.module.css';

export default function App() {
  const currentProjectId = useStore((s) => s.currentProjectId);
  const pages = useStore((s) => s.pages);
  const selectedImageId = useStore((s) => s.selectedImageId);
  const selectImage = useStore((s) => s.selectImage);
  const removeImage = useStore((s) => s.removeImage);
  const isDirty = useStore((s) => s.isDirty);
  const saveProject = useStore((s) => s.saveProject);

  // Auto-save every 60s if dirty
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const doSave = useCallback(() => {
    if (isDirtyRef.current) {
      saveProject();
    }
  }, [saveProject]);

  useEffect(() => {
    if (!currentProjectId) return;
    autoSaveRef.current = setInterval(doSave, 60_000);
    return () => clearInterval(autoSaveRef.current);
  }, [currentProjectId, doSave]);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImageId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        e.preventDefault();
        for (const page of pages) {
          const img = page.images.find((i) => i.id === selectedImageId);
          if (img) {
            removeImage(page.id, img.id);
            break;
          }
        }
      }
      if (e.key === 'Escape') {
        selectImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageId, pages, removeImage, selectImage]);

  if (!currentProjectId) {
    return <ProjectList />;
  }

  return (
    <div className={styles.app}>
      <Toolbar />
      <main className={styles.main}>
        {pages.map((page, i) => (
          <PageCanvas key={page.id} page={page} pageIndex={i} />
        ))}
      </main>
    </div>
  );
}
