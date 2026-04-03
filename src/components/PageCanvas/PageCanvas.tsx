import { useStore } from '../../store/useStore';
import { A4_WIDTH_MM, A4_HEIGHT_MM } from '../../lib/constants';
import { ImageItem } from '../ImageItem/ImageItem';
import type { Page } from '../../lib/types';
import styles from './PageCanvas.module.css';

interface Props {
  page: Page;
  pageIndex: number;
}

export function PageCanvas({ page, pageIndex }: Props) {
  const scale = useStore((s) => s.scaleFactor);
  const removePage = useStore((s) => s.removePage);
  const autoPackPage = useStore((s) => s.autoPackPage);
  const addImages = useStore((s) => s.addImages);
  const selectImage = useStore((s) => s.selectImage);
  const pages = useStore((s) => s.pages);

  const screenWidth = A4_WIDTH_MM * scale;
  const screenHeight = A4_HEIGHT_MM * scale;

  const handleFileAdd = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = () => {
      if (input.files) {
        addImages(page.id, Array.from(input.files));
      }
    };
    input.click();
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <span className={styles.pageLabel}>Page {pageIndex + 1}</span>
        <div className={styles.pageActions}>
          <button onClick={handleFileAdd} className={styles.actionBtn} title="Add images to this page">
            + Images
          </button>
          <button
            onClick={() => autoPackPage(page.id)}
            className={styles.actionBtn}
            title="Auto-arrange images"
            disabled={page.images.length === 0}
          >
            Auto Pack
          </button>
          {pages.length > 1 && (
            <button
              onClick={() => removePage(page.id)}
              className={`${styles.actionBtn} ${styles.dangerBtn}`}
              title="Remove this page"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div
        className={styles.canvas}
        style={{ width: screenWidth, height: screenHeight }}
        onClick={() => selectImage(null)}
      >
        {/* Print layer: uses mm units directly */}
        <div className={styles.printLayer}>
          {page.images.map((img) => (
            <img
              key={img.id}
              src={img.src}
              alt=""
              className={styles.printImage}
              style={{
                left: `${img.x}mm`,
                top: `${img.y}mm`,
                width: `${img.width}mm`,
                height: `${img.height}mm`,
              }}
            />
          ))}
        </div>

        {/* Interactive layer: uses scaled pixels */}
        <div className={styles.interactiveLayer}>
          {page.images.map((img) => (
            <ImageItem key={img.id} image={img} pageId={page.id} scale={scale} />
          ))}
        </div>
      </div>
    </div>
  );
}
