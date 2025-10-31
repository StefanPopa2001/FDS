const fs = require('fs');
const path = require('path');

// Determine log file paths
// In Docker: __dirname is /app (from Dockerfile WORKDIR), so logs are at /app/logs
// Locally: __dirname is like /path/to/backend-R&F-Food-Delivery-App, logs at ../../logs
// Use explicit check for Docker environment or path detection
const isDocker = __dirname === '/app' || process.env.DOCKER_ENV === 'true';
const LOG_DIR = isDocker
  ? path.join(__dirname, 'logs')  // Docker: /app/logs
  : path.join(__dirname, '../../logs');  // Local: ../../logs from backend folder

console.log(`[LOGGER] Environment: ${isDocker ? 'Docker' : 'Localhost'}`);
console.log(`[LOGGER] __dirname: ${__dirname}`);
console.log(`[LOGGER] LOG_DIR: ${LOG_DIR}`);
const LOG_FILE = path.join(LOG_DIR, 'backend_logs.log');
const LOG_ERROR_FILE = path.join(LOG_DIR, 'backend_error.log');
const LOG_FRONTEND_ERROR_FILE = path.join(LOG_DIR, 'frontend_error.log');
const LOG_FRONTEND_FILE = path.join(LOG_DIR, 'frontend_logs.log');

const MAX_LINES = parseInt(process.env.LOG_MAX_LINES || '800', 10); // main log retention
const ERROR_MAX_LINES = parseInt(process.env.LOG_ERROR_MAX_LINES || '1000', 10);
const FRONTEND_ERROR_MAX_LINES = parseInt(process.env.LOG_FRONTEND_ERROR_MAX_LINES || '1000', 10);

// Ensure directory exists
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  console.log(`[LOGGER] Log directory initialized at: ${LOG_DIR}`);
} catch (err) {
  console.error(`[LOGGER] Failed to create log directory: ${err.message}`);
}

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
  // EU format: dd/mm/yy hh:mm
  const pad = (n, z = 2) => ('' + n).padStart(z, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = String(date.getFullYear()).slice(-2); // Last 2 digits of year
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
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
