import { useStore } from '../../store/useStore';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const addPage = useStore((s) => s.addPage);
  const pages = useStore((s) => s.pages);
  const addImages = useStore((s) => s.addImages);

  const handleAddImages = () => {
    // Add to the first page by default; users can also add per-page
    const targetPage = pages[0];
    if (!targetPage) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = () => {
      if (input.files) {
        addImages(targetPage.id, Array.from(input.files));
      }
    };
    input.click();
  };

  return (
    <header className={styles.toolbar}>
      <h1 className={styles.title}>ScrapeBook</h1>
      <div className={styles.actions}>
        <button onClick={handleAddImages} className={styles.btn}>
          Add Images
        </button>
        <button onClick={addPage} className={styles.btn}>
          Add Page
        </button>
        <button onClick={() => window.print()} className={styles.printBtn}>
          Print
        </button>
      </div>
    </header>
  );
}
