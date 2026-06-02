import { useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export type SoundType = 'move' | 'capture' | 'check' | 'end';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(type: SoundType): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  switch (type) {
    case 'move':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
      break;
    case 'capture':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
      break;
    case 'check': {
      // Two-pulse alert
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.13);
      gain2.gain.setValueAtTime(0.3, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      osc2.start(now + 0.13);
      osc2.stop(now + 0.23);
      break;
    }
    case 'end': {
      // Descending chord
      const freqs = [523, 392, 330];
      freqs.forEach((freq, i) => {
        const o = ctx!.createOscillator();
        const g = ctx!.createGain();
        o.connect(g);
        g.connect(ctx!.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.08);
        g.gain.setValueAtTime(0.2, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
        o.start(now + i * 0.08);
        o.stop(now + i * 0.08 + 0.5);
      });
      break;
    }
  }
}

export function useSounds() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);

  const play = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return;
      try {
        playTone(type);
      } catch {}
    },
    [soundEnabled]
  );

  return { play };
}
