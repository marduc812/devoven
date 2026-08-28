import { SavedPipeline, PipelineState } from './types';

const STORAGE_KEY = 'devoven_saved_pipelines';

export function loadSavedPipelines(): SavedPipeline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPipeline[];
  } catch {
    return [];
  }
}

export function savePipeline(name: string, pipeline: PipelineState): void {
  try {
    const saved = loadSavedPipelines();
    const idx = saved.findIndex((s) => s.name === name);
    const entry: SavedPipeline = { name, savedAt: Date.now(), pipeline };
    if (idx >= 0) {
      saved[idx] = entry;
    } else {
      saved.push(entry);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // silently ignore storage errors
  }
}

export function deletePipeline(name: string): void {
  try {
    const saved = loadSavedPipelines().filter((s) => s.name !== name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // silently ignore storage errors
  }
}
