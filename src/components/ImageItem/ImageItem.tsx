import { Rnd } from 'react-rnd';
import type { ScrapeBookImage } from '../../lib/types';
import { useStore } from '../../store/useStore';
import styles from './ImageItem.module.css';

interface Props {
  image: ScrapeBookImage;
  pageId: string;
  scale: number;
}

export function ImageItem({ image, pageId, scale }: Props) {
  const updateImage = useStore((s) => s.updateImage);
  const removeImage = useStore((s) => s.removeImage);
  const selectImage = useStore((s) => s.selectImage);
  const selectedImageId = useStore((s) => s.selectedImageId);
  const isSelected = selectedImageId === image.id;

  return (
    <Rnd
      className={`${styles.rnd} ${isSelected ? styles.selected : ''}`}
      position={{ x: image.x * scale, y: image.y * scale }}
      size={{ width: image.width * scale, height: image.height * scale }}
      bounds="parent"
      lockAspectRatio
      onDragStart={() => selectImage(image.id)}
      onDragStop={(_e, d) => {
        updateImage(pageId, image.id, {
          x: d.x / scale,
          y: d.y / scale,
        });
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        updateImage(pageId, image.id, {
          width: parseFloat(ref.style.width) / scale,
          height: parseFloat(ref.style.height) / scale,
          x: position.x / scale,
          y: position.y / scale,
        });
      }}
    >
      <div
        className={styles.wrapper}
        onClick={(e) => {
          e.stopPropagation();
          selectImage(image.id);
        }}
      >
        <img
          src={image.src}
          alt=""
          className={styles.image}
          draggable={false}
        />
        {isSelected && (
          <button
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              removeImage(pageId, image.id);
            }}
            title="Remove image"
          >
            ×
          </button>
        )}
      </div>
    </Rnd>
  );
}
