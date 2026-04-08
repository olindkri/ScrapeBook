import { startTransition, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logOut } from '../../firebase/auth';
import {
  listProjects,
  createProject,
  deleteProject as deleteProjectFb,
} from '../../firebase/firestore';
import { useStore } from '../../store/useStore';
import type { Project } from '../../lib/types';
import styles from './ProjectList.module.css';

export function ProjectList() {
  const { user } = useAuth();
  const openProject = useStore((s) => s.openProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const list = await listProjects(user.uid);
    setProjects(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    startTransition(() => {
      void fetchProjects();
    });
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const id = await createProject(user.uid, newName.trim());
    setNewName('');
    setCreating(false);
    openProject(id, newName.trim());
  };

  const handleDelete = async (project: Project) => {
    if (!user) return;
    if (!confirm(`Delete "${project.name}"?`)) return;
    await deleteProjectFb(user.uid, project.id);
    fetchProjects();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>ScrapeBook</h1>
        <div className={styles.headerRight}>
          <span className={styles.email}>{user?.email}</span>
          <button onClick={logOut} className={styles.logoutBtn}>
            Log out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.createRow}>
          <input
            type="text"
            placeholder="New project name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className={styles.input}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className={styles.createBtn}
          >
            {creating ? '...' : 'Create'}
          </button>
        </div>

        {loading ? (
          <p className={styles.empty}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className={styles.empty}>
            No projects yet. Create one to get started.
          </p>
        ) : (
          <div className={styles.list}>
            {projects.map((p) => (
              <div key={p.id} className={styles.projectCard}>
                <div
                  className={styles.projectInfo}
                  onClick={() => openProject(p.id, p.name)}
                >
                  <span className={styles.projectName}>{p.name}</span>
                  <span className={styles.projectMeta}>
                    {p.status === 'finished' ? 'Finished' : 'Ongoing'} &middot;{' '}
                    {p.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(p)}
                  title="Delete project"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
