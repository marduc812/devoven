import { SavedPipeline, PipelineState } from './types';
import { validatePipeline } from './serialization';

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

// The pipeline being built is kept as a draft so a reload, or a return to
// /blocks later, does not lose it. A `?p=` link in the address bar wins.
const DRAFT_KEY = 'devoven_blocks_draft';

export function loadDraft(): PipelineState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return validatePipeline(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveDraft(pipeline: PipelineState): void {
  try {
    if (pipeline.blocks.length === 0 && pipeline.input === '') localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify(pipeline));
  } catch {
    // silently ignore storage errors
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // silently ignore storage errors
  }
}

/** The pipeline as a JSON document a person can keep, share or check in. */
export function exportPipelineJson(pipeline: PipelineState, name?: string): string {
  return JSON.stringify({ v: 1, ...(name ? { name } : {}), pipeline }, null, 2);
}

/**
 * Reads a JSON document back: the export shape, a `?p=` payload's shape, or a
 * bare pipeline. Anything that does not validate as a pipeline is rejected.
 */
export function importPipelineJson(text: string): PipelineState | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const wrapped = (parsed as Record<string, unknown>).pipeline;
    return validatePipeline(wrapped !== undefined ? wrapped : parsed);
  } catch {
    return null;
  }
}
