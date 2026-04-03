import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Toolbar } from './components/Toolbar/Toolbar';
import { PageCanvas } from './components/PageCanvas/PageCanvas';
import styles from './App.module.css';

export default function App() {
  const pages = useStore((s) => s.pages);
  const selectedImageId = useStore((s) => s.selectedImageId);
  const selectImage = useStore((s) => s.selectImage);
  const removeImage = useStore((s) => s.removeImage);

  // Keyboard shortcut: Delete/Backspace to remove selected image
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
