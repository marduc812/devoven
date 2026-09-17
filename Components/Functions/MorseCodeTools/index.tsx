'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { textToMorse, morseToText, morseToTimeline, morseDuration } from './logic';
import { MorseArticle } from './article';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const buttonClass = 'border border-gray-900 bg-gray-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed transition-colors';

/**
 * Plays a Morse string as a keyed tone.
 *
 * The whole message is scheduled on the Web Audio clock up front rather than
 * driven by timers, because setTimeout drift is audible at 20 WPM where a dot
 * is 60ms. One oscillator runs for the length of the message and a gain node
 * gates it; the ramps are 4ms so each element has a soft edge instead of the
 * click a hard gate produces.
 */
function usePlayer() {
    const contextRef = useRef<AudioContext | null>(null);
    const stopRef = useRef<(() => void) | null>(null);
    const [playing, setPlaying] = useState(false);

    const stop = useCallback(() => {
        stopRef.current?.();
        stopRef.current = null;
        setPlaying(false);
    }, []);

    const play = useCallback((morse: string, wpm: number, hz: number) => {
        stop();

        const spans = morseToTimeline(morse, wpm);
        if (spans.length === 0) return;

        type AudioContextCtor = typeof AudioContext;
        const Ctor: AudioContextCtor | undefined =
            window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
        if (!Ctor) return;

        const context = contextRef.current ?? new Ctor();
        contextRef.current = context;
        void context.resume();

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(0, context.currentTime);
        oscillator.connect(gain).connect(context.destination);

        const ramp = 0.004;
        let at = context.currentTime + 0.05;
        for (const span of spans) {
            const seconds = span.ms / 1000;
            if (span.on) {
                gain.gain.setValueAtTime(0, at);
                gain.gain.linearRampToValueAtTime(0.25, at + ramp);
                gain.gain.setValueAtTime(0.25, at + seconds - ramp);
                gain.gain.linearRampToValueAtTime(0, at + seconds);
            }
            at += seconds;
        }

        oscillator.start();
        oscillator.stop(at + 0.05);
        setPlaying(true);

        oscillator.onended = () => setPlaying(false);
        stopRef.current = () => {
            oscillator.onended = null;
            try { oscillator.stop(); } catch { /* already stopped */ }
            oscillator.disconnect();
            gain.disconnect();
        };
    }, [stop]);

    useEffect(() => stop, [stop]);

    return { play, stop, playing };
}

export function MorseCodeConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [wpm, setWpm] = useState(20);
  const [hz, setHz] = useState(600);
  const { play, stop, playing } = usePlayer();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'decode') setMode('decode');
    const w = Number(params.get('wpm'));
    if (Number.isFinite(w) && w >= 5 && w <= 40) setWpm(w);
    const f = Number(params.get('hz'));
    if (Number.isFinite(f) && f >= 300 && f <= 1000) setHz(f);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode, wpm: String(wpm), hz: String(hz) })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(mode === 'encode' ? textToMorse(input) : morseToText(input));
    } catch {
      setOutput('');
    }
  }, [input, mode]);

  // Whichever side of the conversion holds the Morse is the side that plays.
  const morse = mode === 'encode' ? output : input;
  const seconds = morse.trim() ? morseDuration(morse, wpm) : 0;

  useEffect(() => { stop(); }, [morse, wpm, hz, stop]);

  return (
    <AdvancedConverter
      title="Morse Code Converter"
      description="Convert text to Morse code or decode Morse code back to text, then play it as a keyed tone at any speed. Words are separated by [1 / 2] in Morse output."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={mode === 'encode' ? 'Text' : 'Morse Code'}
      toTitle={mode === 'encode' ? 'Morse Code' : 'Text'}
      backColor="rose"
      article={MorseArticle}
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'encode' | 'decode')}
            className={selectClass}
            aria-label="Conversion direction"
          >
            <option value="encode">Text → Morse</option>
            <option value="decode">Morse → Text</option>
          </select>

          <div className="h-6 w-px bg-gray-300" />

          <button
            type="button"
            className={buttonClass}
            disabled={!morse.trim()}
            onClick={() => (playing ? stop() : play(morse, wpm, hz))}
          >
            {playing ? 'Stop' : 'Play'}
          </button>

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-bold uppercase tracking-widest text-[10px] text-gray-500">Speed</span>
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-24"
            />
            <span className="font-mono w-14">{wpm} wpm</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-bold uppercase tracking-widest text-[10px] text-gray-500">Pitch</span>
            <input
              type="range"
              min={300}
              max={1000}
              step={25}
              value={hz}
              onChange={(e) => setHz(Number(e.target.value))}
              className="w-24"
            />
            <span className="font-mono w-14">{hz} Hz</span>
          </label>

          {seconds > 0 && (
            <span className="text-xs text-gray-500 font-mono">{seconds.toFixed(1)}s</span>
          )}
        </div>
      }
    />
  );
}
