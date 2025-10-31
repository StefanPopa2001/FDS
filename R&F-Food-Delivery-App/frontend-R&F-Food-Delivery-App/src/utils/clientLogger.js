// Lightweight frontend logger that mirrors backend style and ships important events.
// Retains an in-memory ring buffer (last 200 entries) for potential future UI display.
// Uses shared config.API_URL so production builds point to correct domain instead of localhost fallback.
// Ships all logs to backend which writes to: frontend_logs.log, frontend_error.log, backend_logs.log, backend_error.log

import config from '../config';

const RING_MAX = 200;
let ring = [];

function pushRing(entry) {
  ring.push(entry);
  if (ring.length > RING_MAX) ring = ring.slice(-RING_MAX);
}

function formatTimestamp(date = new Date()) {
  // ISO with local time and milliseconds to match backend format
  const pad = (n, z = 2) => ('' + n).padStart(z, '0');
  const tz = -date.getTimezoneOffset();
  const sign = tz >= 0 ? '+' : '-';
  const tzH = pad(Math.floor(Math.abs(tz) / 60));
  const tzM = pad(Math.abs(tz) % 60);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)} ${sign}${tzH}:${tzM}`
  );
}

// Normalize API base (remove trailing slash). If undefined, fallback to window origin + /api if available.
const deriveApiBase = () => {
  let base = (config && config.API_URL) ? config.API_URL : '';
  if (!base) {
    if (typeof window !== 'undefined') {
      base = window.location.origin + '/api';
    } else {
      base = 'http://localhost:3001';
    }
  }
  return base.replace(/\/$/, '');
};
const API_BASE = deriveApiBase();

// Default levels to ship: log, info, warn, error, debug (all of them)
// Can be controlled via REACT_APP_CLIENT_LOG_LEVELS env var
const DEFAULT_LEVELS = ['log','info','warn','error','debug'];
const rawLevels = (process.env.REACT_APP_CLIENT_LOG_LEVELS || '').split(',').map(s => s.trim()).filter(Boolean);
const ACTIVE_LEVELS = (rawLevels.length ? rawLevels : DEFAULT_LEVELS).map(l => l.toLowerCase());

// Session + user correlation
let sessionId = (() => {
  try {
    const existing = sessionStorage.getItem('clientLoggerSessionId');
    if (existing) return existing;
    const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('clientLoggerSessionId', sid);
    return sid;
  } catch { return 'nosession'; }
})();
let userContext = {};

export function setClientLoggerUser(user) {
  try {
    userContext = user ? { id: user.id, email: user.email, name: user.name, type: user.type } : {};
  } catch { userContext = {}; }
}

async function ship(level, message, context = {}) {
  const finalLevel = level === 'log' ? 'info' : level; // map console.log to info
  const payloadContext = { ...context, sessionId, ...userContext };
  const timestamp = formatTimestamp();
  
  pushRing({ t: timestamp, level: finalLevel, message, context: payloadContext });
  
  if (!ACTIVE_LEVELS.includes(level)) return;
  
  try {
    await fetch(`${API_BASE}/client-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: finalLevel, message, context: payloadContext })
    });
  } catch (e) {
    // Swallow network errors to avoid recursive logging
    // Silently fail - don't log the error to avoid infinite loops
  }
}

export const clientLogger = {
  info: (msg, ctx) => ship('info', msg, ctx),
  warn: (msg, ctx) => ship('warn', msg, ctx),
  error: (msg, ctx) => ship('error', msg, ctx),
  debug: (msg, ctx) => ship('debug', msg, ctx),
  log: (msg, ctx) => ship('log', msg, ctx),
  getBuffer: () => [...ring]
};

// Console interception
if (typeof window !== 'undefined') {
  const original = {
    log: window.console.log.bind(window.console),
    info: window.console.info.bind(window.console),
    warn: window.console.warn.bind(window.console),
    error: window.console.error.bind(window.console),
    debug: window.console.debug ? window.console.debug.bind(window.console) : window.console.log.bind(window.console)
  };
  ['log','info','warn','error','debug'].forEach(level => {
    window.console[level] = function(...args) {
      try {
        const msg = args.map(a => {
          if (typeof a === 'string') return a;
          try { return JSON.stringify(a); } catch { return String(a); }
        }).join(' ');
        clientLogger[level](msg, { raw: true });
      } catch {}
      original[level](...args);
    };
  });
}

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    try {
      clientLogger.error('GLOBAL_ERROR', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error && e.error.stack ? e.error.stack : undefined
      });
    } catch {}
  });

  window.addEventListener('unhandledrejection', (e) => {
    try {
      clientLogger.error('UNHANDLED_REJECTION', {
        reason: e.reason && (e.reason.message || e.reason.toString()),
        stack: e.reason && e.reason.stack ? e.reason.stack : undefined
      });
    } catch {}
  });
}
