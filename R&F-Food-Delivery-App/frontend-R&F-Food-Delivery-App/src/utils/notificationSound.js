import { clientLogger } from './clientLogger';

// Singleton audio element instance
let audioEl = null;
let primed = false;
let lastPlayTs = 0;
let firstPlayLogged = false;
let sourceVerified = false;
let sourceOk = false;
let verifying = false;
const MIN_INTERVAL_MS = 1500; // throttle rapid plays
const AUDIO_SRC = '/notification.mp3';

// Web Audio fallback (simple beep)
function playFallbackBeep() {
  try {
    if (typeof window === 'undefined' || !window.AudioContext && !window.webkitAudioContext) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880; // A5 tone
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.42);
    clientLogger.debug('notificationSound: fallback beep played');
  } catch (err) {
    clientLogger.warn('notificationSound: fallback beep failed', { error: err?.message });
  }
}

function ensureAudio() {
  if (!audioEl) {
    audioEl = new Audio(AUDIO_SRC);
    audioEl.preload = 'auto';
    audioEl.addEventListener('error', () => {
      const err = audioEl.error;
      clientLogger.warn('notificationSound: audio element error', {
        code: err?.code,
        message: err?.message || decodeMediaError(err?.code),
        networkState: audioEl.networkState,
        readyState: audioEl.readyState,
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a'
      });
      if (err && (err.code === 4)) {
        // Source unsupported or decode failure => fallback
        playFallbackBeep();
      }
    });
  }
  return audioEl;
}

function decodeMediaError(code) {
  switch (code) {
    case 1: return 'MEDIA_ERR_ABORTED';
    case 2: return 'MEDIA_ERR_NETWORK';
    case 3: return 'MEDIA_ERR_DECODE';
    case 4: return 'MEDIA_ERR_SRC_NOT_SUPPORTED';
    default: return 'UNKNOWN_MEDIA_ERROR';
  }
}

async function verifySource() {
  if (sourceVerified || verifying) return sourceOk;
  verifying = true;
  try {
    const res = await fetch(AUDIO_SRC, { method: 'HEAD', cache: 'no-cache' });
    sourceOk = res.ok;
    clientLogger.debug('notificationSound: HEAD check', { status: res.status, ok: res.ok, ct: res.headers.get('content-type') });
    if (!res.ok) {
      clientLogger.warn('notificationSound: audio HEAD failed');
    }
  } catch (err) {
    clientLogger.warn('notificationSound: audio HEAD error', { error: err?.message });
    sourceOk = false;
  } finally {
    sourceVerified = true;
    verifying = false;
  }
  return sourceOk;
}

export function primeNotificationSound() {
  try {
    const a = ensureAudio();
    verifySource(); // start async verification
    // Attempt a muted play to satisfy some browser gesture requirements
    a.muted = true;
    const playPromise = a.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
        primed = true;
        clientLogger.debug('notificationSound: primed successfully');
      }).catch(err => {
        a.muted = false;
        clientLogger.debug('notificationSound: prime attempt blocked', { error: err?.message });
      });
    }
  } catch (err) {
    clientLogger.warn('notificationSound: prime failed', { error: err?.message });
  }
}

export function playNotificationSound({ force = false } = {}) {
  try {
    const now = Date.now();
    if (!force && now - lastPlayTs < MIN_INTERVAL_MS) {
      clientLogger.debug('notificationSound: throttled');
      return;
    }
    const a = ensureAudio();
    verifySource();
    // Some browsers require user gesture - if not primed we still try
    const playPromise = a.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        lastPlayTs = Date.now();
        if (!firstPlayLogged) {
          clientLogger.info('notificationSound: première lecture réussie');
          firstPlayLogged = true;
        } else {
          clientLogger.debug('notificationSound: played');
        }
      }).catch(err => {
        clientLogger.warn('notificationSound: play blocked', { error: err?.message });
        // If we already know source is bad or decode failed before, beep
        if (sourceVerified && !sourceOk) {
          playFallbackBeep();
        }
      });
    }
  } catch (err) {
    clientLogger.error('notificationSound: unexpected error', { error: err?.message });
  }
}

export function isNotificationSoundPrimed() {
  return primed;
}

// Optional: auto-prime on first user interaction
if (typeof window !== 'undefined') {
  const handler = () => {
    primeNotificationSound();
    window.removeEventListener('pointerdown', handler);
    window.removeEventListener('keydown', handler);
  };
  window.addEventListener('pointerdown', handler, { once: true });
  window.addEventListener('keydown', handler, { once: true });
}
