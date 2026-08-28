'use client';

export const SOUND_STORAGE_KEY = 'devoven-timer-sound';

export function loadSoundPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveSoundPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Storage unavailable (private mode, blocked cookies) — sound still works
    // for this session, it just will not be remembered.
  }
}

/**
 * Plays a short two-tone chime via the Web Audio API, so no audio file needs
 * hosting. Always triggered by a running timer the user started, which keeps
 * it clear of autoplay restrictions.
 */
export function playBeep(): void {
  if (typeof window === 'undefined') return;

  const AudioCtx = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [880, 1174.66].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + index * 0.18;
      const end = start + 0.16;

      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
    });

    window.setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // Audio unavailable — the visual "Time's up" state still fires.
  }
}
