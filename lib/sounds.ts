// lib/sounds.ts
//
// Sonidos y vibración de los juegos, los mismos de la app (appinventorcresi,
// www/sonidos.js). Se generan con la Web Audio API: no hay archivos de audio,
// no suman peso, no tienen licencias de terceros y funcionan sin conexión.
// Uso: playSound('correcto'). El botón de sonido (components/SoundToggle.tsx)
// silencia todo y la preferencia se recuerda en este navegador.

export type SoundName =
  | 'correcto'
  | 'incorrecto'
  | 'puntos'
  | 'vida'
  | 'logro'
  | 'victoria'
  | 'sinVidas'
  | 'tic'
  | 'tap';

const STORAGE_KEY = 'cresiSonido';
const CHANGE_EVENT = 'cresi:sound-change';

let ctx: AudioContext | null = null;

export function isSoundOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface NoteOptions {
  type?: OscillatorType;
  volume?: number;
  /** Frecuencia final (barrido). */
  to?: number;
}

// Una nota con envolvente suave (ataque corto y caída exponencial) para que
// no haga "clic" al empezar ni al terminar.
function note(frequency: number, start: number, duration: number, { type = 'triangle', volume = 0.22, to }: NoteOptions = {}) {
  const c = context();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

const SOUNDS: Record<SoundName, () => void> = {
  // Dos notas ascendentes, alegre y breve
  correcto() {
    note(659, 0, 0.12);
    note(880, 0.09, 0.22);
  },
  // Dos notas graves descendentes, suaves: avisa sin sonar a castigo
  incorrecto() {
    note(330, 0, 0.16, { volume: 0.18 });
    note(247, 0.13, 0.28, { volume: 0.16 });
  },
  // "Clink" de moneda al ganar puntos
  puntos() {
    note(988, 0, 0.07, { type: 'square', volume: 0.08 });
    note(1319, 0.06, 0.25, { type: 'square', volume: 0.08 });
  },
  // Vida recuperada: barrido ascendente
  vida() {
    note(440, 0, 0.3, { to: 880, volume: 0.18 });
    note(1320, 0.22, 0.25, { type: 'sine', volume: 0.12 });
  },
  // Logro tranquilo (lección, cuento o test terminados)
  logro() {
    [523, 659, 784].forEach((f, i) => note(f, i * 0.11, 0.35, { type: 'sine', volume: 0.18 }));
  },
  // Fanfarria corta al completar un juego
  victoria() {
    [523, 659, 784].forEach((f, i) => note(f, i * 0.1, 0.16));
    note(1047, 0.3, 0.6, { volume: 0.24 });
    note(523, 0.3, 0.6, { type: 'sine', volume: 0.12 });
  },
  // Sin vidas: tono que cae
  sinVidas() {
    note(440, 0, 0.55, { to: 165, volume: 0.16 });
    note(220, 0.35, 0.5, { type: 'sine', volume: 0.12 });
  },
  // Tic de la ruleta / confirmación del botón de sonido
  tic() {
    note(1500, 0, 0.03, { type: 'square', volume: 0.05 });
  },
  // Toque de botones: "pop" corto y suave
  tap() {
    note(620, 0, 0.07, { type: 'sine', volume: 0.14, to: 880 });
  },
};

// Vibración en los celulares cuyo navegador la soporta; nada en computadoras.
const VIBRATION: Partial<Record<SoundName, number | number[]>> = {
  tap: 10,
  correcto: 25,
  puntos: 15,
  vida: [20, 40, 20],
  logro: [20, 40, 20],
  victoria: [30, 50, 30, 50, 60],
  incorrecto: [60, 50, 60],
  sinVidas: [120, 60, 120],
};

function vibrate(name: SoundName) {
  const pattern = VIBRATION[name];
  if (pattern === undefined) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Algunos navegadores lo bloquean sin interacción previa: no importa.
  }
}

export function playSound(name: SoundName): void {
  if (typeof window === 'undefined' || !isSoundOn()) return;
  try {
    SOUNDS[name]();
  } catch {
    // Nunca debe romper un juego.
  }
  vibrate(name);
}

/**
 * Tic-tac sincronizado con el giro de la ruleta. La animación es
 * cubic-bezier(x1, 0, x2, 1) (por defecto "ease-out" = (0, 0, 0.58, 1)): para
 * cada sector que pasa por el indicador se busca en qué momento la curva llega
 * a ese ángulo, así los tics se van espaciando a medida que la rueda frena.
 */
export function playWheelTicks(durationMs: number, totalDegrees: number, degreesPerSector: number, x1 = 0, x2 = 0.58): void {
  if (typeof window === 'undefined' || !isSoundOn() || !context()) return;
  const bez = (s: number, p1: number, p2: number) => 3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s;
  const timeFor = (progress: number) => {
    let a = 0;
    let b = 1;
    for (let i = 0; i < 30; i++) {
      const m = (a + b) / 2;
      if (bez(m, 0, 1) < progress) a = m;
      else b = m;
    }
    return (bez((a + b) / 2, x1, x2) * durationMs) / 1000;
  };
  let last = -1;
  for (let g = degreesPerSector; g <= totalDegrees; g += degreesPerSector) {
    const t = timeFor(g / totalDegrees);
    if (t - last < 0.045) continue; // al principio gira muy rápido: no saturar
    last = t;
    note(1500, t, 0.03, { type: 'square', volume: 0.05 });
  }
}

export function setSoundOn(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Sin almacenamiento: vale solo para esta visita.
  }
  if (on) playSound('tic');
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Para que los botones de sonido se mantengan sincronizados entre sí. */
export function onSoundChange(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
