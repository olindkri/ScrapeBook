import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './config';
import type { Page, Project } from '../lib/types';

function projectsCol(userId: string) {
  return collection(db, 'users', userId, 'projects');
}

function projectDoc(userId: string, projectId: string) {
  return doc(db, 'users', userId, 'projects', projectId);
}

function imagesCol(userId: string, projectId: string) {
  return collection(db, 'users', userId, 'projects', projectId, 'images');
}

export async function listProjects(userId: string): Promise<Project[]> {
  const q = query(projectsCol(userId), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      status: data.status,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
    };
  });
}

export async function createProject(
  userId: string,
  name: string
): Promise<string> {
  const ref = doc(projectsCol(userId));
  await setDoc(ref, {
    name,
    status: 'ongoing',
    pages: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function loadProject(
  userId: string,
  projectId: string
): Promise<{ name: string; status: string; pages: Page[] }> {
  // Load project metadata
  const snap = await getDoc(projectDoc(userId, projectId));
  if (!snap.exists()) throw new Error('Project not found');
  const data = snap.data();

  // Load all image data from subcollection
  const imgSnap = await getDocs(imagesCol(userId, projectId));
  const imageDataMap = new Map<string, string>();
  imgSnap.docs.forEach((d) => {
    imageDataMap.set(d.id, d.data().base64);
  });

  return {
    name: data.name,
    status: data.status,
    pages: (data.pages ?? []).map((p: Record<string, unknown>, i: number) => ({
      id: (p.id as string) || crypto.randomUUID(),
      images: Array.isArray(p.images)
        ? (p.images as Record<string, unknown>[]).map((img) => ({
            id: img.id as string,
            src: imageDataMap.get(img.id as string) || '',
            persisted: true,
            x: img.x as number,
            y: img.y as number,
            width: img.width as number,
            height: img.height as number,
            naturalWidth: img.naturalWidth as number,
            naturalHeight: img.naturalHeight as number,
          }))
        : [],
      order: (p.order as number) ?? i,
    })),
  };
}

export async function saveProject(
  userId: string,
  projectId: string,
  name: string,
  status: string,
  pages: Page[],
  imagesToSave: { id: string; base64: string }[]
): Promise<void> {
  // Save image data to subcollection (each image = its own doc, stays under 1MB)
  // Use batched writes (max 500 per batch)
  for (let i = 0; i < imagesToSave.length; i += 400) {
    const batch = writeBatch(db);
    const chunk = imagesToSave.slice(i, i + 400);
    for (const img of chunk) {
      const ref = doc(imagesCol(userId, projectId), img.id);
      batch.set(ref, { base64: img.base64 });
    }
    await batch.commit();
  }

  // Save project metadata (page layout, image positions — no image data here)
  await setDoc(
    projectDoc(userId, projectId),
    {
      name,
      status,
      updatedAt: serverTimestamp(),
      pages: pages.map((p, i) => ({
        id: p.id,
        order: i,
        images: p.images.map((img) => ({
          id: img.id,
          x: img.x,
          y: img.y,
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        })),
      })),
    },
    { merge: true }
  );
}

export async function deleteProject(
  userId: string,
  projectId: string
): Promise<void> {
  // Delete all image docs in subcollection
  const imgSnap = await getDocs(imagesCol(userId, projectId));
  if (imgSnap.size > 0) {
    for (let i = 0; i < imgSnap.docs.length; i += 400) {
      const batch = writeBatch(db);
      imgSnap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  // Delete the project doc
  await deleteDoc(projectDoc(userId, projectId));
}
