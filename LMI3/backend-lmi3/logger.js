const fs = require('fs');
const path = require('path');

// Determine log file paths
// Dev: write to repo root (../*.log)
// Prod (Docker): write inside backend folder (/app/*.log)
const isProd = process.env.NODE_ENV === 'production';
const LOG_FILE = process.env.LOG_FILE_PATH || (isProd
  ? path.join(__dirname, 'backend.log')
  : path.join(__dirname, '..', 'backend.log'));
// Dedicated backend error/anomaly log
const LOG_ERROR_FILE = process.env.LOG_ERROR_FILE_PATH || (isProd
  ? path.join(__dirname, 'backend-error.log')
  : path.join(__dirname, '..', 'backend-error.log'));
// Dedicated frontend error/anomaly log (received from client)
const LOG_FRONTEND_ERROR_FILE = process.env.LOG_FRONTEND_ERROR_FILE_PATH || (isProd
  ? path.join(__dirname, 'frontend-error.log')
  : path.join(__dirname, '..', 'frontend-error.log'));
// Dedicated frontend main log (all levels from client, optional)
const LOG_FRONTEND_FILE = process.env.LOG_FRONTEND_FILE_PATH || (isProd
  ? path.join(__dirname, 'frontend.log')
  : path.join(__dirname, '..', 'frontend.log'));

const MAX_LINES = parseInt(process.env.LOG_MAX_LINES || '800', 10); // main log retention
const ERROR_MAX_LINES = parseInt(process.env.LOG_ERROR_MAX_LINES || '1000', 10);
const FRONTEND_ERROR_MAX_LINES = parseInt(process.env.LOG_FRONTEND_ERROR_MAX_LINES || '1000', 10);

// Ensure directory exists
try {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
} catch {}

// Load existing lines and normalize to last MAX_LINES
let buffer = [];
let errorBuffer = [];
let frontendErrorBuffer = [];
let frontendBuffer = [];
try {
  if (fs.existsSync(LOG_FILE)) {
    const existing = fs.readFileSync(LOG_FILE, 'utf8');
    buffer = existing.split(/\r?\n/).filter(Boolean);
    if (buffer.length > MAX_LINES) {
      buffer = buffer.slice(-MAX_LINES);
    }
  }
  // Load backend error log
  if (fs.existsSync(LOG_ERROR_FILE)) {
    const existingErr = fs.readFileSync(LOG_ERROR_FILE, 'utf8');
    errorBuffer = existingErr.split(/\r?\n/).filter(Boolean);
    if (errorBuffer.length > ERROR_MAX_LINES) {
      errorBuffer = errorBuffer.slice(-ERROR_MAX_LINES);
    }
  }
  // Load frontend error log
  if (fs.existsSync(LOG_FRONTEND_ERROR_FILE)) {
    const existingFrontErr = fs.readFileSync(LOG_FRONTEND_ERROR_FILE, 'utf8');
    frontendErrorBuffer = existingFrontErr.split(/\r?\n/).filter(Boolean);
    if (frontendErrorBuffer.length > FRONTEND_ERROR_MAX_LINES) {
      frontendErrorBuffer = frontendErrorBuffer.slice(-FRONTEND_ERROR_MAX_LINES);
    }
  }
  // Load frontend main log
  if (fs.existsSync(LOG_FRONTEND_FILE)) {
    const existingFront = fs.readFileSync(LOG_FRONTEND_FILE, 'utf8');
    frontendBuffer = existingFront.split(/\r?\n/).filter(Boolean);
    if (frontendBuffer.length > FRONTEND_ERROR_MAX_LINES) { // reuse same cap (1000)
      frontendBuffer = frontendBuffer.slice(-FRONTEND_ERROR_MAX_LINES);
    }
  }
} catch {
  buffer = [];
  errorBuffer = [];
  frontendErrorBuffer = [];
  frontendBuffer = [];
}

function formatTimestamp(date = new Date()) {
  // ISO with local time and milliseconds
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

function writeOut() {
  try {
    fs.writeFileSync(LOG_FILE, buffer.join('\n') + (buffer.length ? '\n' : ''));
    fs.writeFileSync(LOG_ERROR_FILE, errorBuffer.join('\n') + (errorBuffer.length ? '\n' : ''));
    fs.writeFileSync(LOG_FRONTEND_ERROR_FILE, frontendErrorBuffer.join('\n') + (frontendErrorBuffer.length ? '\n' : ''));
    fs.writeFileSync(LOG_FRONTEND_FILE, frontendBuffer.join('\n') + (frontendBuffer.length ? '\n' : ''));
  } catch (err) {
    // As a last resort, write to stderr
    process.stderr.write(`Failed to write log file: ${err.message}\n`);
  }
}

function appendLine(line) {
  buffer.push(line);
  if (buffer.length > MAX_LINES) buffer = buffer.slice(-MAX_LINES);
  writeOut();
}

function appendErrorLine(line) {
  errorBuffer.push(line);
  if (errorBuffer.length > ERROR_MAX_LINES) errorBuffer = errorBuffer.slice(-ERROR_MAX_LINES);
  writeOut();
}

function appendFrontendErrorLine(line) {
  frontendErrorBuffer.push(line);
  if (frontendErrorBuffer.length > FRONTEND_ERROR_MAX_LINES) frontendErrorBuffer = frontendErrorBuffer.slice(-FRONTEND_ERROR_MAX_LINES);
  writeOut();
}

function appendFrontendLine(line) {
  frontendBuffer.push(line);
  if (frontendBuffer.length > FRONTEND_ERROR_MAX_LINES) frontendBuffer = frontendBuffer.slice(-FRONTEND_ERROR_MAX_LINES);
  writeOut();
}

function serializeArgs(args) {
  return args
    .map((a) => {
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    })
    .join(' ');
}

const logger = {
  filePath: LOG_FILE,
  info: (...args) => appendLine(`[${formatTimestamp()}] [INFO ] ${serializeArgs(args)}`),
  warn: (...args) => {
    const line = `[${formatTimestamp()}] [WARN ] ${serializeArgs(args)}`;
    appendLine(line);
    appendErrorLine(line);
  },
  error: (...args) => {
    const line = `[${formatTimestamp()}] [ERROR] ${serializeArgs(args)}`;
    appendLine(line);
    appendErrorLine(line);
  },
  debug: (...args) => appendLine(`[${formatTimestamp()}] [DEBUG] ${serializeArgs(args)}`),
  // Frontend-originated anomalies/errors
  frontendWarn: (...args) => {
    const line = `[${formatTimestamp()}] [FRONTEND-WARN ] ${serializeArgs(args)}`;
    appendLine(line);
    appendFrontendLine(line);
    appendFrontendErrorLine(line);
  },
  frontendError: (...args) => {
    const line = `[${formatTimestamp()}] [FRONTEND-ERROR] ${serializeArgs(args)}`;
    appendLine(line);
    appendFrontendLine(line);
    appendFrontendErrorLine(line);
  },
  frontendInfo: (...args) => {
    const line = `[${formatTimestamp()}] [FRONTEND-INFO ] ${serializeArgs(args)}`;
    appendLine(line);
    appendFrontendLine(line);
  },
  frontendDebug: (...args) => {
    const line = `[${formatTimestamp()}] [FRONTEND-DEBUG] ${serializeArgs(args)}`;
    appendLine(line);
    appendFrontendLine(line);
  }
};

module.exports = logger;
