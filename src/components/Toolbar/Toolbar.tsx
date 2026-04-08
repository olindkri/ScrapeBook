import { useStore } from '../../store/useStore';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const addPage = useStore((s) => s.addPage);
  const pages = useStore((s) => s.pages);
  const addImages = useStore((s) => s.addImages);
  const closeProject = useStore((s) => s.closeProject);
  const saveProject = useStore((s) => s.saveProject);
  const isDirty = useStore((s) => s.isDirty);
  const isSaving = useStore((s) => s.isSaving);
  const projectName = useStore((s) => s.currentProjectName);

  const handleAddImages = () => {
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

  const handleBack = async () => {
    if (isDirty) {
      await saveProject();
    }
    closeProject();
  };

  return (
    <header className={styles.toolbar}>
      <div className={styles.left}>
        <button onClick={handleBack} className={styles.backBtn} title="Back to projects">
          &larr;
        </button>
        <h1 className={styles.title}>{projectName || 'Untitled'}</h1>
      </div>
      <div className={styles.actions}>
        <button onClick={handleAddImages} className={styles.btn}>
          Add Images
        </button>
        <button onClick={addPage} className={styles.btn}>
          Add Page
        </button>
        <button
          onClick={saveProject}
          disabled={isSaving || !isDirty}
          className={`${styles.btn} ${isDirty ? styles.dirtyBtn : ''}`}
        >
          {isSaving ? 'Saving...' : isDirty ? 'Save' : 'Saved'}
        </button>
        <button onClick={() => window.print()} className={styles.printBtn}>
          Print
        </button>
      </div>
    </header>
  );
}
