import { list, put } from '@vercel/blob';
import type { Project } from '@/lib/projects';

const PROJECTS_DATA_PATH = 'projects/data.json';

/** Load all projects from Blob storage. Used by api/projects, api/distribute, api/fund. */
export async function loadProjectsFromStorage(): Promise<Project[]> {
  try {
    const { blobs } = await list({ prefix: 'projects/', limit: 10 });
    const dataBlob = blobs.find((b) => b.pathname === PROJECTS_DATA_PATH);
    if (!dataBlob?.url) return [];
    const res = await fetch(dataBlob.url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.projects) ? data.projects : [];
  } catch {
    return [];
  }
}

/** Persist projects to Blob storage. */
export async function saveProjectsToStorage(projects: Project[]): Promise<void> {
  await put(PROJECTS_DATA_PATH, JSON.stringify({ projects }), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}
