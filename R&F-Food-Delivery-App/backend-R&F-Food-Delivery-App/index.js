const express = require("express");
const cors = require("cors");
const CryptoJS = require('crypto-js');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const validator = require('validator');
const jwt = require("jsonwebtoken");
require("dotenv").config();
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const logger = require('./logger');

const { PrismaClient } = require("@prisma/client");
let prisma;
try {
  prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  logger.info('Prisma Client initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Prisma Client:', { message: error?.message, code: error?.code, stack: error?.stack });
  process.exit(1);
}

// Input sanitization functions
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return validator.escape(input.trim());
}

function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return validator.normalizeEmail(email.trim()) || '';
}

function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  // Remove all non-numeric characters except + and leading zeros
  return phone.trim().replace(/[^\d+]/g, '');
}

// Enhanced password validation
function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
  }
  if (/(.)\1{2,}/.test(password)) {
    return "Password cannot contain repeated characters";
  }
  // Check for common weak patterns
  const weakPatterns = ['123456', 'password', 'qwerty', 'admin'];
  const lowerPassword = password.toLowerCase();
  for (const pattern of weakPatterns) {
    if (lowerPassword.includes(pattern)) {
      return "Password contains common weak patterns";
    }
  }
  return null;
}

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: ['https://rudyetfanny.be', 'https://82.25.118.116', 'http://localhost:3000'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Store admin socket connections
const adminSockets = new Map();
// Store client socket connections 
const clientSockets = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Socket client connected', { socketId: socket.id });

  // Handle admin joining
  socket.on('join-admin', async (data) => {
    const { token } = data;
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, SECRET_KEY);
      
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (user && user.type === 1) {
        adminSockets.set(socket.id, { socket, userId: user.id });
        socket.join('admin-room');
  logger.info('Admin joined', { socketId: socket.id });
        // Send confirmation
        socket.emit('admin-connected', { success: true });
      } else {
        socket.emit('admin-connected', { 
          success: false, 
          error: 'Unauthorized access' 
        });
      }
    } catch (error) {
  logger.error('Admin join error', { message: error?.message, stack: error?.stack });
      socket.emit('admin-connected', { 
        success: false, 
        error: 'Invalid token' 
      });
    }
  });

  // Handle client joining
  socket.on('join-client', async (data) => {
    const { token } = data;
  logger.info('Client join request', { socketId: socket.id, tokenReceived: !!token });
    
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, SECRET_KEY);
  logger.debug('Token decoded successfully', { userId: decoded.userId });
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (user) {
        clientSockets.set(socket.id, { socket, userId: user.id });
        socket.join(`user-${user.id}`);
  logger.info('Client joined successfully', { userId: user.id, email: user.email, room: `user-${user.id}`, totalClientSockets: clientSockets.size });
        
        // Send confirmation
        socket.emit('client-connected', { success: true });
      } else {
  logger.warn('Client join: user not found');
        socket.emit('client-connected', { 
          success: false, 
          error: 'User not found' 
        });
      }
    } catch (error) {
  logger.error('Client join error', { message: error?.message });
      socket.emit('client-connected', { 
        success: false, 
        error: 'Invalid token' 
      });
    }
  logger.debug('Client join request end', { socketId: socket.id });
  });

  // Handle joining order chat room
  socket.on('join-order-chat', (data) => {
    const { orderId, userId, userType } = data;
    if (orderId) {
      socket.join(`order-chat-${orderId}`);
  logger.info('Joined order chat room', { userId, userType, orderId });
      
      // Emit confirmation back to the client
      socket.emit('join-order-chat', { 
        success: true, 
        orderId, 
        message: `Joined chat room for order ${orderId}` 
      });
    }
  });

  // Handle leaving order chat room
  socket.on('leave-order-chat', (data) => {
    const { orderId } = data;
    if (orderId) {
      socket.leave(`order-chat-${orderId}`);
    }
  });

  // Handle order status updates
  socket.on('order-status-updated', (data) => {
    const { orderId, status, message } = data;
    // Broadcast to the specific order chat room and admin room
    io.to(`order-chat-${orderId}`).emit('order-status-update', {
      orderId,
      status,
      message,
      timestamp: new Date()
    });
    io.to('admin-room').emit('order-status-update', {
      orderId,
      status,
      message,
      timestamp: new Date()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    adminSockets.delete(socket.id);
    clientSockets.delete(socket.id);
  logger.info('Socket client disconnected', { socketId: socket.id });
  });
});

// Function to broadcast order updates to admin clients
function broadcastOrderUpdate(orderData, type = 'orderUpdate') {
  io.to('admin-room').emit(type, orderData);
}

// Helper: notify all admins (type=1) with a notification, excluding optional userId
async function notifyAdmins({ prisma, excludeUserId = null, type, title, message, data }) {
  try {
    const admins = await prisma.user.findMany({ where: { type: 1, enabled: true }, select: { id: true } });
    if (!admins.length) {
      logger.warn('notifyAdmins: aucun admin trouvé');
      return [];
    }
    const created = [];
    for (const admin of admins) {
      if (excludeUserId && admin.id === excludeUserId) continue; // skip self if needed
      const notification = await prisma.notification.create({
        data: {
          userId: admin.id,
          type,
          title,
            message,
          data,
          isRead: false
        }
      });
      const payload = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      };
      io.to('admin-room').emit('new-notification', payload);
      created.push(notification.id);
    }
    logger.info('notifyAdmins: notifications créées', { count: created.length, ids: created });
    return created;
  } catch (err) {
    logger.error('notifyAdmins: erreur', { message: err?.message, stack: err?.stack });
    return [];
  }
}

// Security middleware
// HTTPS enforcement in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// HTTP request logging - only log PATCH, DELETE, POST and errors
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log PATCH, DELETE, POST requests, or any request with error status (>=400)
    if (['PATCH', 'DELETE', 'POST'].includes(method) || res.statusCode >= 400) {
      logger.info('HTTP', { method, url: originalUrl, status: res.statusCode, durationMs: duration, ip });
    }
  });
  next();
});

app.use(express.json());
app.use(cors({
  origin: ['https://rudyetfanny.be', 'https://82.25.118.116', 'http://localhost:3000'],
  methods: ['GET', 'OPTIONS', 'PUT', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
  exposedHeaders: ['*']
}));
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    req.url = req.url.substring(4);
  }
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Endpoint for frontend to push anomaly/error logs
app.post('/client-log', async (req, res) => {
  try {
    const { level = 'info', message, context } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing message' });
    }
    const safeCtx = (context && typeof context === 'object') ? context : {};
    switch (level) {
      case 'error':
        logger.frontendError(message, safeCtx);
        break;
      case 'warn':
        logger.frontendWarn(message, safeCtx);
        break;
      case 'debug':
        logger.frontendDebug(message, safeCtx);
        break;
      case 'log':
        logger.frontendInfo(message, safeCtx);
        break;
      default:
        logger.frontendInfo(message, safeCtx);
    }
    res.json({ ok: true });
  } catch (e) {
    logger.error('Failed to record client log', { message: e?.message });
    res.status(500).json({ ok: false });
  }
});

// Health endpoint for readiness/liveness checks
app.get('/health', (req, res) => {
  logger.debug('Health check');
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

//Works
//Rate limiting configuration (anti brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth routes
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  // Add progressive delays
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

//Middleware for authentication
const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key-change-this-in-production";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // Always use .jpg extension as we'll convert all images to JPEG
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg')
  }
});

const fileFilter = (req, file, cb) => {
  // Accept various image formats including iPhone HEIC
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'image/heic', 'image/heif', 'image/bmp', 'image/tiff', 'image/svg+xml'
  ];
  
  // Check mimetype
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    // Also check file extension as fallback
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.tiff', '.svg'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format. Allowed formats: ${allowedExtensions.join(', ')}`), false);
    }
  }
};

// Middleware to process uploaded images with Sharp
const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const outputPath = req.file.path; // Keep the same path since we named it .jpg already
    
    // Process the image with Sharp (convert to JPEG, resize if needed, optimize)
    await sharp(inputPath)
      .jpeg({ 
        quality: 85, // Good quality compression
        progressive: true 
      })
      .resize(1200, 1200, { 
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true // Don't upscale small images
      })
      .toFile(outputPath + '.temp');
    
    // Replace the original file with the processed one
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath + '.temp', outputPath);
    
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    // Clean up files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (fs.existsSync(req.file.path + '.temp')) {
      fs.unlinkSync(req.file.path + '.temp');
    }
    return res.status(400).json({ error: 'Failed to process image. Please try with a different image.' });
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for HEIC and other formats
  }
});


//Works
//Create a new user
app.post("/users/createUser", async (req, res) => {
  let { name, email, phone, password, salt } = req.body;

  // Sanitize inputs
  name = sanitizeInput(name);
  email = sanitizeEmail(email);
  phone = sanitizePhone(phone);

  // Validate username format (only letters, spaces and numbers)
  const nameRegex = /^[a-zA-Z0-9 ]+$/;
  if (!name || !nameRegex.test(name)) {
    return res.status(400).json({ error: "Invalid name format. Please use only letters, numbers, and spaces" });
  }

  // Validate phone number format (international format)
  const phoneRegex = /^(\+[1-9][0-9]{0,2}|0)[0-9]{9,15}$/;
  if (!phone || !phoneRegex.test(phone)) {
    return res.status(400).json({ error: "Invalid phone number format. Please use a valid format like 048XXXXXXX or +XXXXXXXXXXXX" });
  }

  // Convert email to lowercase for storage and comparisons
  const normalizedEmail = email;

  //Regex to check mail validity - allow only common special characters
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email format. Please use only letters, numbers, and common special characters (._%+-)" });
  }

  //Check if password and salt are provided
  if (!password || !salt) {
    return res.status(400).json({ error: "Password and salt are required" });
  }
  
  // Enhanced password validation - Note: this validates the original password before hashing
  // Since the frontend sends hashed passwords, we'll keep the original validation for now
  // but recommend implementing client-side validation as well
  if (password && password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  try {
    // Check if user with the same name already exists
    const existingUserName = await prisma.user.findFirst({ where: { name } });
    if (existingUserName) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Check if user with the same phone number already exists
    const existingUserPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingUserPhone) {
      return res.status(409).json({ error: "Phone number already exists" });
    }

    //Check if user with the same email already exists (case-insensitive)
    const existingUserEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUserEmail) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Create user with the hashed password and salt and normalized email
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail, // Store email in lowercase
        phone,
        password,
        salt,
      },
    });

    //Generate token
    const token = jwt.sign({ userId: user.id, email: normalizedEmail, type: user.type }, SECRET_KEY, {
      expiresIn: "365d",
    });

    //Return the user data and token
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, type: user.type }, token });
  } catch (err) {
    //Log the actual error for debugging
    console.error("Error creating user:", err);
    //Generic error handling
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user salt for secure login
app.all("/users/getSalt", authLimiter, async (req, res) => {
  const { email } = req.body || req.query;
  
  // Normalize and sanitize the email
  const normalizedEmail = sanitizeEmail(email);

  try {
    //Check if the users email exists
    const user = await prisma.user.findUnique({ 
      where: { email: normalizedEmail },
      select: { salt: true, enabled: true }
    });
    
    if (!user || !user.enabled) {
      // Always return a fake salt to prevent timing attacks and email enumeration
      const fakeSalt = CryptoJS.lib.WordArray.random(32).toString();
      return res.json({ salt: fakeSalt });
    }

    res.json({ salt: user.salt });
  } catch (err) {
    // Return fake salt even on error to prevent timing attacks
    const fakeSalt = CryptoJS.lib.WordArray.random(32).toString();
    res.json({ salt: fakeSalt });
  }
});


//Login user
app.post("/users/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  // Normalize and sanitize the email
  const normalizedEmail = sanitizeEmail(email);

  try {
    //Check if the users email exists
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    // Always perform the same operations regardless of user existence to prevent timing attacks
    let isValidLogin = false;
    
    if (user && user.enabled && password === user.password) {
      isValidLogin = true;
    }
    
    if (isValidLogin) {
      const token = jwt.sign({ userId: user.id, email: user.email, type: user.type }, SECRET_KEY, {
        expiresIn: "365d",
      });

      res.json({ user: { id: user.id, email: user.email, name: user.name, type: user.type }, token });
    } else {
      // Same error message regardless of whether email exists or password is wrong
      res.status(401).json({ error: "Email ou mot de passe invalide" });
    }
  } catch (err) {
    logger.error('Login endpoint error', { message: err?.message, stack: err?.stack });
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Middleware to authenticate requests
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    
    // Fetch complete user information including type
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, type: true, enabled: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.enabled) {
      return res.status(403).json({ error: "Votre compte a été suspendu" });
    }
    
    // Add user type to req.user
    req.user.type = user.type;
    req.user.name = user.name;
    
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Get all users (admin only)
app.get("/users", authenticate, async (req, res) => {
  try {
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!requestingUser || requestingUser.type !== 1) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true,
        enabled: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change password (self, authenticated) - defined BEFORE generic /users/:id
app.put("/users/password", authenticate, async (req, res) => {
  try {
    const { password, salt } = req.body;

    // Validate inputs (expect already-hashed password and a new salt)
    if (!password || !salt) {
      return res.status(400).json({ error: "Password and salt are required" });
    }

    if (typeof password !== 'string' || typeof salt !== 'string') {
      return res.status(400).json({ error: "Invalid input types" });
    }

    // Basic length sanity checks (hashed SHA-256 hex is length 64; salt length can vary)
    if (password.length < 32) {
      return res.status(400).json({ error: "Invalid password format" });
    }
    if (salt.length < 16) {
      return res.status(400).json({ error: "Invalid salt format" });
    }

    // Update password and salt for the authenticated user
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password,salt } 
    });

    // Optionally, we could invalidate other sessions/tokens if we tracked them
    return res.status(200).json({ success: true });
  } catch (error) {

    console.error('Error changing password:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update user (admin only)
app.put("/users/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    let { name, email, phone, type, enabled } = req.body;
    
    // Sanitize inputs
    if (name) name = sanitizeInput(name);
    if (email) email = sanitizeEmail(email);
    if (phone) phone = sanitizePhone(phone);
    
    // Validate username format if provided (only letters, spaces and numbers)
    if (name) {
      const nameRegex = /^[a-zA-Z0-9 ]+$/;
      if (!nameRegex.test(name)) {
        return res.status(400).json({ error: "Invalid name format. Please use only letters, numbers, and spaces" });
      }
    }
    
    // Check if trying to disable an admin account
    if (enabled === false) {
      const userToUpdate = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: { type: true }
      });
      
      if (userToUpdate && userToUpdate.type === 1) {
        return res.status(400).json({ error: "Admin accounts cannot be suspended" });
      }
    }
    
    // Validate phone number format if provided (international format)
    if (phone) {
      const phoneRegex = /^(\+[1-9][0-9]{0,2}|0)[0-9]{9,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: "Invalid phone number format. Please use a valid format like 048XXXXXXX or +XXXXXXXXXXXX" });
      }
    }
    
    // Normalize email if provided
    const normalizedEmail = email || undefined;
    
    // Validate email format if provided
    if (normalizedEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ error: "Invalid email format. Please use only letters, numbers, and common special characters (._%+-)" });
      }
    }

    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!requestingUser || requestingUser.type !== 1) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Check if another user already has this name (if name is being updated)
    if (name) {
      const existingUserName = await prisma.user.findFirst({ 
        where: { 
          name,
          id: { not: parseInt(id) } // Exclude the current user
        }
      });
      if (existingUserName) {
        return res.status(409).json({ error: "Username already exists." });
      }
    }

    // Check if another user already has this phone number (if phone is being updated)
    if (phone) {
      const existingUserPhone = await prisma.user.findFirst({ 
        where: { 
          phone,
          id: { not: parseInt(id) } // Exclude the current user
        }
      });
      if (existingUserPhone) {
        return res.status(409).json({ error: "Phone number already exists" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        email: normalizedEmail, 
        phone, 
        type,
        ...(enabled !== undefined && { enabled }) // Include enabled only if it's provided
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true,
        enabled: true,
        createdAt: true,
      }
    });
    res.json(updatedUser);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete user (admin only)
app.delete("/users/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!requestingUser || requestingUser.type !== 1) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
app.get("/users/profile", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true, // Add type field
        createdAt: true,
        // Explicitly exclude password and salt
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get order count
    const orderCount = await prisma.order.count({
      where: { userId: req.user.userId },
    });

    // Get favorite plat (most ordered)
    const favoritePlatResult = await prisma.orderItem.groupBy({
      by: ['platId'],
      where: {
        order: {
          userId: req.user.userId,
        },
        platId: {
          not: null,
        },
      },
      _count: {
        platId: true,
      },
      orderBy: {
        _count: {
          platId: 'desc',
        },
      },
      take: 1,
    });

    let favoritePlat = null;
    if (favoritePlatResult.length > 0) {
      const plat = await prisma.plat.findUnique({
        where: { id: favoritePlatResult[0].platId },
        select: { name: true },
      });
      favoritePlat = plat ? plat.name : null;
    }

    res.json({ 
      user: {
        ...user,
        orderCount,
        favoritePlat,
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile (self)
app.put("/users/profile", authenticate, async (req, res) => {
  try {
    let { phone } = req.body;

    // Sanitize input
    phone = sanitizePhone(phone);

    // Validate input
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Validate phone number format (international format)
    const phoneRegex = /^(\+[1-9][0-9]{0,2}|0)[0-9]{9,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number format. Please use a valid format like 048XXXXXXX or +XXXXXXXXXXXX" });
    }
    
    // Check if phone number is already in use by another user
    const existingUserPhone = await prisma.user.findFirst({ 
      where: { 
        phone,
        id: { not: req.user.userId } // Exclude the current user
      }
    });
    if (existingUserPhone) {
      return res.status(409).json({ error: "Phone number already exists" });
    }

    // Update the user profile (only phone number)
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true,
        createdAt: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new order
app.post("/orders", authenticate, async (req, res) => {
  try {
  logger.info('Received order request', { body: req.body });
    const { items, deliveryAddress, paymentMethod, notes, OrderType, takeoutTime } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Error: Invalid items array');
      return res.status(400).json({ error: "Items are required" });
    }
    
    // Calculate total price by fetching real prices from database
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      // Ensure versionSizeStr is always in scope for this item
      let versionSizeStr = null;
      // Basic item validation
      if (!item || typeof item !== 'object') {
        return res.status(400).json({ error: "Invalid item format" });
      }

      // Validate quantity
      const quantity = parseInt(item.quantity, 10);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: "Each item must have a valid positive quantity" });
      }

      let itemPrice = 0;

      // Check if this is a dish order (has platId)
      if (item.platId) {
        // Get the plat details
        const plat = await prisma.plat.findUnique({
          where: { id: item.platId },
          include: { versions: true }
        });

        if (!plat) {
          return res.status(400).json({ error: `Plat with id ${item.platId} not found` });
        }

        // Get the version price and store version size as a string
        let basePrice = plat.price; // Use the plat's base price
        if (plat.versions && plat.versions.length > 0) {
          // Determine requested size from payload (string or object)
          const requestedSize = (typeof item.version === 'string'
            ? item.version
            : (item.version && typeof item.version.size === 'string' ? item.version.size : undefined)) || undefined;
          // Choose matching version or fallback to first
          const chosenVersion = (requestedSize
            ? plat.versions.find(v => v.size === requestedSize)
            : undefined) || plat.versions[0];
          basePrice += chosenVersion.extraPrice; // Add the extra price for the version
          versionSizeStr = chosenVersion.size || null;
        }

        itemPrice = basePrice;
      }
      
      // For standalone sauce orders (no platId but has sauceId)
      else if (item.sauceId) {
        // This is a standalone sauce order, itemPrice starts at 0
        itemPrice = 0;
      }
      
      // If neither platId nor sauceId, this is an invalid item
      else {
        return res.status(400).json({ error: "Item must have either platId or sauceId" });
      }

      // Add sauce price if any
      let validatedSauceId = null;
      if (item.sauceId) {
        const sauce = await prisma.sauce.findUnique({ where: { id: item.sauceId } });
        if (!sauce) {
          return res.status(400).json({ error: `Sauce with id ${item.sauceId} not found` });
        }
        validatedSauceId = sauce.id;
        itemPrice += sauce.price;
      }

      // Add extra price if any
      let validatedExtraId = null;
      if (item.extraId) {
        const extra = await prisma.extra.findUnique({ where: { id: item.extraId } });
        if (!extra) {
          return res.status(400).json({ error: `Extra with id ${item.extraId} not found` });
        }
        validatedExtraId = extra.id;
        itemPrice += extra.price;
      }

      // Add plat sauce price if any
      let validatedPlatSauceId = null;
      if (item.platSauceId) {
        const platSauce = await prisma.sauce.findUnique({ where: { id: item.platSauceId } });
        if (!platSauce) {
          return res.status(400).json({ error: `Plat sauce with id ${item.platSauceId} not found` });
        }
        validatedPlatSauceId = platSauce.id;
        itemPrice += platSauce.price;
      }

      // Add prices for added extras
      if (item.addedExtras && item.addedExtras.length > 0) {
        for (const extraId of item.addedExtras) {
          const extra = await prisma.extra.findUnique({ where: { id: extraId } });
          if (!extra) {
            return res.status(400).json({ error: `Added extra with id ${extraId} not found` });
          }
          itemPrice += extra.price;
        }
      }

      // Validate removed ingredients exist to prevent FK errors later
      if (item.removedIngredients && item.removedIngredients.length > 0) {
        for (const ingredientId of item.removedIngredients) {
          const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
          if (!ingredient) {
            return res.status(400).json({ error: `Ingredient with id ${ingredientId} not found` });
          }
        }
      }

      const itemTotal = itemPrice * item.quantity;
      totalPrice += itemTotal;

      orderItems.push({
        platId: item.platId || null,
        quantity,
        unitPrice: itemPrice,
        totalPrice: itemTotal,
        versionSize: versionSizeStr,
        sauceId: validatedSauceId,
        extraId: validatedExtraId,
        platSauceId: validatedPlatSauceId,
        message: item.message ? sanitizeInput(item.message) : null
      });
    }

    // For takeout orders, no delivery fee
    const normalizedOrderType = (OrderType === 'delivery' || OrderType === 'takeout') ? OrderType : 'takeout';
    const deliveryFee = normalizedOrderType === 'takeout' ? 0 : (totalPrice >= 25.00 ? 0 : 2.50);
    const finalTotal = totalPrice + deliveryFee;

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        totalPrice: finalTotal,
        status: 0, // En attente
        clientMessage: notes || null,
        OrderType: normalizedOrderType,
        takeoutTime: takeoutTime ? new Date(takeoutTime) : null,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            plat: true,
            sauce: true,
            extra: true,
            platSauce: true
          }
        }
      }
    });

    // Create initial status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: getStatusText(0), // Convert status number to text
        timestamp: new Date()
      }
    });

    // Handle added extras and removed ingredients
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const orderItem = order.items[i];

      // Add extra items if any
      if (item.addedExtras && item.addedExtras.length > 0) {
        for (const extraId of item.addedExtras) {
          // Get the extra to fetch its price
          const extra = await prisma.extra.findUnique({ where: { id: extraId } });
          if (extra) {
            await prisma.orderItemExtra.create({
              data: {
                orderItemId: orderItem.id,
                extraId: extraId,
                price: extra.price
              }
            });
          }
        }
      }

      // Add removed ingredients if any
      if (item.removedIngredients && item.removedIngredients.length > 0) {
        for (const ingredientId of item.removedIngredients) {
          await prisma.orderItemRemovedIngredient.create({
            data: {
              orderItemId: orderItem.id,
              ingredientId: ingredientId
            }
          });
        }
      }
    }

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order.id,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt
      }
    });
    // Notify admins of new order (French wording) and broadcast, unless the order was created archived
    if (!order.archived) {
      await notifyAdmins({
        prisma,
        excludeUserId: order.userId, // avoid self if admin orders
        type: 'order_new',
        title: 'Nouvelle commande',
        message: `Commande #${order.id} créée`,
        data: { orderId: order.id, totalPrice: order.totalPrice, orderType: order.OrderType }
      });

      // Broadcast new order to admin clients
      broadcastOrderUpdate({
        type: 'newOrder',
        order: {
          id: order.id,
          userId: order.userId,
          totalPrice: order.totalPrice,
          status: order.status,
          OrderType: order.OrderType,
          createdAt: order.createdAt,
          clientMessage: order.clientMessage
        }
      }, 'newOrder');
    } else {
      logger.info('Order created as archived, skipping admin notifications/broadcast', { orderId: order.id });
    }

  } catch (error) {
    // Provide more context in logs for easier debugging
    logger.error('Error creating order', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    // Avoid leaking details to clients in production
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get user orders (authenticated user only)
app.get("/users/orders", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const whereClause = {
      userId: req.user.userId
    };
    
    // Add status filter if provided
    if (status !== undefined && status !== 'all') {
      if (status === 'active') {
        // Active orders: awaiting confirmation (0), confirmed (1), in preparation (2), ready (3), in delivery (4)
        whereClause.status = { in: [0, 1, 2, 3, 4] };
      } else if (status === 'archived') {
        // Archived orders: delivered (5), finished (6), canceled (7) - but only from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        whereClause.AND = [
          { status: { in: [5, 6, 7] } },
          { createdAt: { gte: today, lt: tomorrow } }
        ];
      } else {
        whereClause.status = parseInt(status);
      }
    }
    
    // Get orders with full details
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            plat: {
              include: {
                versions: true
              }
            },
            sauce: true,
            extra: true,
            platSauce: true,
            removedIngredients: {
              include: {
                ingredient: true
              }
            },
            addedExtras: {
              include: {
                extra: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: parseInt(limit)
    });
    
    // Get total count for pagination
    const totalOrders = await prisma.order.count({
      where: whereClause
    });
    
    // Format orders for frontend (strip internal fields such as 'archived' so clients never see it)
    const formattedOrders = orders.map(order => {
      const o = {
        ...order,
        statusText: getStatusText(order.status),
        formattedDate: order.createdAt.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      // Ensure archived is not exposed to clients
      if (o.archived !== undefined) delete o.archived;
      return o;
    });
    
    res.json({
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders,
        hasNextPage: offset + parseInt(limit) < totalOrders,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific order details
app.get("/users/orders/:orderId", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId: req.user.userId // Ensure user can only see their own orders
      },
      include: {
        items: {
          include: {
            plat: {
              include: {
                versions: true
              }
            },
            sauce: true,
            extra: true,
            removedIngredients: {
              include: {
                ingredient: true
              }
            },
            addedExtras: {
              include: {
                extra: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Format order for frontend
    const formattedOrder = {
      ...order,
      statusText: getStatusText(order.status),
      formattedDate: order.createdAt.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    // Ensure archived flag is not exposed to clients
    if (formattedOrder.archived !== undefined) delete formattedOrder.archived;

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to get status text
function getStatusText(status) {
  const statusMap = {
    0: 'En attente de confirmation',
    1: 'Confirmée',
    2: 'En préparation',
    3: 'Prête',
    4: 'En livraison',
    5: 'Livrée',
    6: 'Terminée',
    7: 'Annulée'
  };
  return statusMap[status] || 'Statut inconnu';
}


// Admin order management endpoints
// Get all orders (admin only)
app.get("/admin/orders", authenticate, async (req, res) => {
  try {
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!requestingUser || requestingUser.type !== 1) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const whereClause = {};

    // By default hide archived orders for admin listing, unless includeArchived=true is passed
    const includeArchived = req.query.includeArchived === 'true' || req.query.showArchived === 'true';
    if (!includeArchived) {
      whereClause.archived = false;
    }

    // Add status filter if provided
    if (status !== undefined && status !== 'all') {
      whereClause.status = parseInt(status);
    }
    
    // Get total count for pagination
    const totalOrders = await prisma.order.count({
      where: whereClause
    });
    
    // Get orders with full details
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            plat: {
              include: {
                versions: true
              }
            },
            sauce: true,
            extra: true,
            platSauce: true,
            removedIngredients: {
              include: {
                ingredient: true
              }
            },
            addedExtras: {
              include: {
                extra: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: parseInt(limit)
    });
    
    // Format orders for frontend
    const formattedOrders = orders.map(order => {
      const o = {
        ...order,
        statusText: getStatusText(order.status),
        formattedDate: order.createdAt.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        items: order.items.map(item => ({
          ...item,
          unitPrice: item.totalPrice / item.quantity,
          versionSize: item.versionSize || (item.plat?.versions?.find(v => v.size === item.version)?.size)
        }))
      };
      // Expose archived only to admins if they asked for it; otherwise remove it (though whereClause already filters)
      if (!includeArchived && o.archived !== undefined) delete o.archived;
      return o;
    });
    
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    
    res.json({
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching admin orders', { message: error?.message, stack: error?.stack });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update order status (admin only)
app.put("/admin/orders/:orderId/status", authenticate, async (req, res) => {
  try {
    logger.info('ORDER STATUS UPDATE STARTED', { orderId: req.params.orderId, status: req.body.status, notes: req.body.notes });
    
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!requestingUser || requestingUser.type !== 1) {
      logger.warn('Unauthorized access attempt on status update');
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { orderId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    if (status < 0 || status > 7) {
      logger.warn('Invalid status value', { status });
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Update order status and restaurant message if notes provided
    const updateData = { status: parseInt(status) };
    if (notes && notes.trim()) {
      updateData.restaurantMessage = notes.trim();
    }
    
    logger.debug('Updating order with data', updateData);
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: updateData
    });
    logger.info('Order updated successfully', { orderId: updatedOrder.id, status: updatedOrder.status });

    // Add status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: parseInt(orderId),
        status: getStatusText(parseInt(status)),
        timestamp: new Date(),
        notes: notes || null
      }
    });
  logger.debug('Status history created');

    res.json({
      message: "Status updated successfully",
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        statusText: getStatusText(updatedOrder.status)
      }
    });

    // Get the order with user information
    logger.debug('Fetching order with user information');
    const orderWithUser = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { user: true }
    });
    logger.debug('Order with user', orderWithUser ? { id: orderWithUser.id, userId: orderWithUser.userId, userEmail: orderWithUser.user?.email } : 'Not found');

  // Create notification for the client if the order has a user and is not archived
  if (orderWithUser && orderWithUser.userId && !orderWithUser.archived) {
  logger.info('Creating notification for user', { userId: orderWithUser.userId });
      const notification = await prisma.notification.create({
        data: {
          userId: orderWithUser.userId,
          type: 'order_status',
          title: 'Mise à jour de commande',
          message: `Votre commande #${orderId} est maintenant: ${getStatusText(updatedOrder.status)}`,
          data: {
            orderId: parseInt(orderId),
            status: updatedOrder.status,
            statusText: getStatusText(updatedOrder.status),
            notes: notes || null
          },
          isRead: false
        }
      });
  logger.info('Notification created', { notificationId: notification.id });

  // Send notification via websocket to the specific user
  logger.debug('Emitting notification via websocket', { room: `user-${orderWithUser.userId}` });
      
      const notificationData = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      };
  logger.debug('Notification data to emit', notificationData);
      
      // Emit to the user room
      io.to(`user-${orderWithUser.userId}`).emit('new-notification', notificationData);
  logger.debug('Notification emitted via websocket');
      
  // Also try emitting to all connected client sockets as a fallback
      let notificationSent = false;
      for (const [socketId, clientData] of clientSockets) {
        if (clientData.userId === orderWithUser.userId) {
          logger.debug('Sending notification directly to client socket', { socketId });
          clientData.socket.emit('new-notification', notificationData);
          notificationSent = true;
        }
      }
      logger.debug('Direct socket notification sent', { sent: notificationSent });
    } else {
      if (orderWithUser && orderWithUser.userId && orderWithUser.archived) {
        logger.info('Order is archived, skipping client notification for status update', { orderId: orderWithUser.id });
      } else {
        logger.debug('No user associated with order, skipping notification');
      }
    }

    // Broadcast order status update to admin clients
  logger.debug('Broadcasting to admin clients');
    broadcastOrderUpdate({
      type: 'statusUpdate',
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      statusText: getStatusText(updatedOrder.status),
      notes: updatedOrder.restaurantMessage || null
    }, 'orderStatusUpdate');

    // Emit to the specific order chat room for real-time client notification, but skip if order is archived
  logger.debug('Emitting to order chat room', { room: `order-chat-${updatedOrder.id}` });
    if (!orderWithUser || !orderWithUser.archived) {
      io.to(`order-chat-${updatedOrder.id}`).emit('order-status-update', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        statusText: getStatusText(updatedOrder.status),
        message: updateData.restaurantMessage || null,
        timestamp: new Date()
      });
    } else {
      logger.info('Skipping order chat emit for archived order', { orderId: updatedOrder.id });
    }
    
    logger.info('ORDER STATUS UPDATE COMPLETED', { orderId: parseInt(orderId) });
  } catch (error) {
    logger.error('Error updating order status', { message: error?.message, code: error?.code, meta: error?.meta, stack: error?.stack });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Toggle archived flag on an order (admin only)
app.put("/admin/orders/:orderId/archived", authenticate, async (req, res) => {
  try {
    const requestingUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requestingUser || requestingUser.type !== 1) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { orderId } = req.params;
    const { archived } = req.body;

    if (typeof archived !== 'boolean') {
      return res.status(400).json({ error: 'archived must be a boolean' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { archived }
    });

    // Broadcast to admin clients so UIs can refresh their lists. Do NOT create notifications for clients.
    broadcastOrderUpdate({
      type: 'archivedChange',
      orderId: updatedOrder.id,
      archived: updatedOrder.archived
    }, 'orderArchivedChange');

    res.json({ message: 'Order archived flag updated', order: { id: updatedOrder.id, archived: updatedOrder.archived } });
  } catch (error) {
    logger.error('Error updating archived flag', { message: error?.message, stack: error?.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update specific order item readiness (admin only)
app.put("/admin/orders/:orderId/items/:itemId/ready", authenticate, async (req, res) => {
  try {
    const requestingUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requestingUser || requestingUser.type !== 1) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { orderId, itemId } = req.params;
    const { isReady } = req.body;

    if (typeof isReady !== 'boolean') {
      return res.status(400).json({ error: 'isReady must be a boolean' });
    }

    // Ensure the item belongs to the order
    const orderItem = await prisma.orderItem.findUnique({ where: { id: parseInt(itemId) } });
    if (!orderItem || orderItem.orderId !== parseInt(orderId)) {
      return res.status(404).json({ error: 'Order item not found for this order' });
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: parseInt(itemId) },
      data: { isReady }
    });

    // Broadcast the change to admin room and order chat room
    io.to('admin-room').emit('order-item-updated', { orderId: parseInt(orderId), item: updatedItem });
    io.to(`order-chat-${orderId}`).emit('order-item-updated', { orderId: parseInt(orderId), item: updatedItem });

    res.json({ message: 'Item readiness updated', item: updatedItem });
  } catch (error) {
    console.error('Error updating order item readiness:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific order details for admin
app.get("/admin/orders/:orderId", authenticate, async (req, res) => {
  try {
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!requestingUser || requestingUser.type !== 1) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { orderId } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            plat: {
              include: {
                versions: true
              }
            },
            sauce: true,
            extra: true,
            platSauce: true,
            removedIngredients: {
              include: {
                ingredient: true
              }
            },
            addedExtras: {
              include: {
                extra: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Format order for frontend
    const formattedOrder = {
      ...order,
      statusText: getStatusText(order.status),
      formattedDate: order.createdAt.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      items: order.items.map(item => ({
        ...item,
        unitPrice: item.totalPrice / item.quantity,
        versionSize: item.versionSize || (item.plat?.versions?.find(v => v.size === item.version)?.size)
      }))
    };
    
    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching admin order details:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Tags CRUD endpoints
// Get all tags
app.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.tags.findMany({
      orderBy: {
        nom: 'asc' // Order by name for consistent results
      }
    });
    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Get searchable tags only
app.get('/tags/searchable', async (req, res) => {
  try {
    const tags = await prisma.tags.findMany({
      where: {
        recherchable: true
      },
      orderBy: {
        nom: 'asc'
      }
    });
    res.json(tags);
  } catch (error) {
    console.error('Get searchable tags error:', error);
    res.status(500).json({ error: 'Failed to fetch searchable tags' });
  }
});

// Create tag
app.post('/tags', async (req, res) => {
  try {
    const { nom, description, emoji, recherchable, ordre } = req.body;
    if (!nom) {
      return res.status(400).json({ error: 'Nom is required' });
    }
    const tag = await prisma.tags.create({
      data: { nom, description: description || '', emoji: emoji || '', recherchable: recherchable || false, ordre: ordre || null },
    });
    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "A tag with this name already exists" });
    }
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Update tag
app.put('/tags/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, description, emoji, recherchable, ordre } = req.body;
  try {
    if (!nom) {
      return res.status(400).json({ error: 'Nom is required' });
    }
    const tag = await prisma.tags.update({
      where: { id: parseInt(id) },
      data: { nom, description: description || '', emoji: emoji || '', recherchable: recherchable || false, ordre: ordre || null },
    });
    res.json(tag);
  } catch (error) {
    console.error('Update tag error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Delete tag
app.delete('/tags/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if tag is used by any extras
    const tagWithExtras = await prisma.tags.findUnique({
      where: { id: parseInt(id) },
      include: { extras: true }
    });

    if (!tagWithExtras) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (tagWithExtras.extras.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete tag. It is used by ${tagWithExtras.extras.length} extra(s)` 
      });
    }

    await prisma.tags.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete tag error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});
// Get all sauces
app.get('/sauces', async (req, res) => {
  try {
    const sauces = await prisma.sauce.findMany({
      include: {
        tags: true // Include related tags
      }
    });
    // Add index property for frontend row numbering
    const saucesWithIndex = sauces.map((sauce, idx) => ({ ...sauce, index: idx }));
    res.json(saucesWithIndex);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sauces' });
  }
});

// Create sauce
app.post("/sauces", upload.single('image'), processImage, async (req, res) => {
  try {
    const { name, price, description, available, ordre, tags } = req.body;
    
    // Validate required fields
    if (!name || price === undefined || !description) {
      // Delete the uploaded file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: "Name, price, and description are required" });
    }

    // Generate the image URL if a file was uploaded
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        // Convert to array of connect objects for Prisma
        parsedTags = parsedTags.map(tagId => ({ id: parseInt(tagId) }));
      } catch (e) {
        console.error('Invalid tags format:', e);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Invalid tags format" });
      }
    }

    const sauce = await prisma.sauce.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        image: imageUrl,
        available: typeof available === 'boolean' ? available : available === 'true',
        ordre: ordre || null,
        tags: parsedTags.length > 0 ? {
          connect: parsedTags
        } : undefined
      },
      include: {
        tags: true
      }
    });
    res.status(201).json(sauce);
  } catch (error) {
    console.error('Create sauce error:', error);
    // Delete the uploaded file if it exists
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "A sauce with this name already exists" });
    }
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
    }
    if (error.message && error.message.includes('Unsupported file format')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update sauce
app.put("/sauces/:id", upload.single('image'), processImage, async (req, res) => {
  const { id } = req.params;
  const { name, price, description, keepExistingImage, available, ordre, tags } = req.body;
  try {
    // Validate required fields
    if (!name || price === undefined || !description) {
      // Delete the uploaded file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: "Name, price, and description are required" });
    }

    // Get existing sauce to check if we need to delete old image
    const existingSauce = await prisma.sauce.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingSauce) {
      // Delete the uploaded file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: "Sauce not found" });
    }

    let imageUrl = existingSauce.image;

    // Handle image update
    if (req.file) {
      // New image uploaded, delete old one if it exists
      if (existingSauce.image && existingSauce.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, 'public', existingSauce.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (keepExistingImage === 'false') {
      // User wants to remove the image
      if (existingSauce.image && existingSauce.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, 'public', existingSauce.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = null;
    }

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        // Convert to array of connect objects for Prisma
        parsedTags = parsedTags.map(tagId => ({ id: parseInt(tagId) }));
      } catch (e) {
        console.error('Invalid tags format:', e);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Invalid tags format" });
      }
    }

    const sauce = await prisma.sauce.update({
      where: { id: parseInt(id) },
      data: {
        name,
        price: parseFloat(price),
        description,
        image: imageUrl,
        available: typeof available === 'boolean' ? available : available === 'true',
        ordre: ordre || null,
        tags: {
          set: parsedTags // This replaces all existing tag connections
        }
      },
      include: {
        tags: true
      }
    });
    res.json(sauce);
  } catch (error) {
    console.error('Update sauce error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "A sauce with this name already exists" });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Sauce not found" });
    }
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
    }
    if (error.message && error.message.includes('Unsupported file format')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete sauce
app.delete("/sauces/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Get the sauce to check if it has an image to delete
    const sauce = await prisma.sauce.findUnique({
      where: { id: parseInt(id) },
    });

    if (!sauce) {
      return res.status(404).json({ error: "Sauce not found" });
    }

    // Delete the sauce from the database
    await prisma.sauce.delete({
      where: { id: parseInt(id) },
    });
    
    // If the sauce has an image, delete it from the filesystem
    if (sauce.image && sauce.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, 'public', sauce.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete sauce error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Extra endpoints
app.get("/api/extras", async (req, res) => {
  try {
    const extras = await prisma.extra.findMany({
      include: {
        tags: true // Include related tags
      },
      orderBy: {
        nom: 'asc' // Order by name for consistent results
      }
    });
    res.json(extras);
  } catch (error) {
    console.error('Get extras error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a specific extra by ID
app.get("/api/extras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const extra = await prisma.extra.findUnique({
      where: { id: parseInt(id) },
      include: {
        tags: true // Include related tags
      }
    });

    if (!extra) {
      return res.status(404).json({ error: "Extra not found" });
    }

    res.json(extra);
  } catch (error) {
    console.error('Get extra by ID error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/extras", async (req, res) => {
  try {
    const { nom, description, price, available, availableForDelivery, speciality, tags } = req.body;
    
    // Validate required fields
    if (!nom || !description || price === undefined) {
      return res.status(400).json({ error: "Nom, description, and price are required" });
    }

    // Extract tag IDs from the tags array, ensuring they are valid
    const tagIds = Array.isArray(tags) ? tags
      .filter(tag => tag && tag.id) // Filter out invalid tags
      .map(tag => ({ id: parseInt(tag.id) })) // Ensure ID is integer
      : [];

    const extra = await prisma.extra.create({
      data: {
        nom,
        description,
        price: parseFloat(price),
        available: typeof available === 'boolean' ? available : true,
        availableForDelivery: typeof availableForDelivery === 'boolean' ? availableForDelivery : true,
        speciality: typeof speciality === 'boolean' ? speciality : false,
        tags: tagIds.length > 0 ? {
          connect: tagIds // Connect the extra to existing tags
        } : undefined
      },
      include: {
        tags: true // Include the tags in the response
      }
    });
    
    res.status(201).json(extra);
  } catch (error) {
    console.error('Create extra error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "An extra with this name already exists" });
    }
    if (error.code === 'P2025') {
      return res.status(400).json({ error: "One or more selected tags do not exist" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/extras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, price, available, availableForDelivery, speciality, tags } = req.body;

    // Validate required fields
    if (!nom || !description || price === undefined) {
      return res.status(400).json({ error: "Nom, description, and price are required" });
    }

    // Extract tag IDs from the tags array, ensuring they are valid
    const tagIds = Array.isArray(tags) ? tags
      .filter(tag => tag && tag.id) // Filter out invalid tags
      .map(tag => ({ id: parseInt(tag.id) })) // Ensure ID is integer
      : [];

    // Update the extra with new data and set new tag connections
    const extra = await prisma.extra.update({
      where: { id: parseInt(id) },
      data: {
        nom,
        description,
        price: parseFloat(price),
        available: typeof available === 'boolean' ? available : true,
        availableForDelivery: typeof availableForDelivery === 'boolean' ? availableForDelivery : true,
        speciality: typeof speciality === 'boolean' ? speciality : false,
        tags: {
          set: tagIds // This will replace all existing connections with the new ones
        }
      },
      include: {
        tags: true // Include the tags in the response
      }
    });

    res.json(extra);
  } catch (error) {
    console.error('Update extra error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Extra not found or one or more selected tags do not exist" });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "An extra with this name already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/extras/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Check if the extra exists first
    const existingExtra = await prisma.extra.findUnique({
      where: { id: parseInt(id) },
      include: { tags: true }
    });

    if (!existingExtra) {
      return res.status(404).json({ error: "Extra not found" });
    }

    // Delete the extra (tags will be automatically disconnected due to Prisma's cascade behavior)
    await prisma.extra.delete({
      where: { id: parseInt(id) },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete extra error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Extra not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===============================
// PLAT ENDPOINTS
// ===============================

// Get all plats with their versions
app.get('/plats', async (req, res) => {
  try {
    const plats = await prisma.plat.findMany({
      include: {
        versions: {
          orderBy: { size: 'asc' },
          include: { tags: true }
        },
        tags: {
          include: {
            extras: {
              where: {
                available: true // Only include available extras
              }
            }
          }
        },
        ingredients: {
          include: {
            ingredient: true
          },
          orderBy: { ingredient: { name: 'asc' } }
        }
      }
    });
    // Add index property for frontend row numbering
    const platsWithIndex = plats.map((plat, idx) => ({ ...plat, index: idx }));
    res.json(platsWithIndex);
  } catch (error) {
    console.error('Get plats error:', error);
    res.status(500).json({ error: 'Failed to fetch plats' });
  }
});

// Create plat
app.post("/plats", upload.single('image'), processImage, async (req, res) => {
  try {
    const { 
      name, 
      price, 
      description, 
      ordre,
      availableForDelivery, 
      available, 
      speciality,
      IncludesSauce,
      saucePrice,
      versions, // Array of version objects: [{ size: "M", extraPrice: 0.0 }, ...]
      tags, // Array of tag IDs: [1, 2, 3]
      versionTags // Optional: mapping { [size]: [tagId, ...] }
    } = req.body;
    
    // Validate required fields
    if (!name || price === undefined || !description) {
      // Delete the uploaded file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: "Name, price, and description are required" });
    }

    // Generate the image URL if a file was uploaded
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Parse versions if provided
    let parsedVersions = [];
    if (versions) {
      try {
        parsedVersions = typeof versions === 'string' ? JSON.parse(versions) : versions;
      } catch (e) {
        console.error('Invalid versions format:', e);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Invalid versions format" });
      }
    }

  // Parse tags if provided
    let parsedTags = [];
    // Parse versionTags if provided
    let parsedVersionTags = {};
    if (versionTags) {
      try {
        parsedVersionTags = typeof versionTags === 'string' ? JSON.parse(versionTags) : versionTags;
      } catch (e) {
        console.error('Invalid versionTags format:', e);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Invalid versionTags format" });
      }
    }
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        // Convert to array of connect objects for Prisma
        parsedTags = parsedTags.map(tagId => ({ id: parseInt(tagId) }));
      } catch (e) {
        console.error('Invalid tags format:', e);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Invalid tags format" });
      }
    }

    const plat = await prisma.plat.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        ordre: ordre || "",
        image: imageUrl,
        availableForDelivery: availableForDelivery === 'true' || availableForDelivery === true,
        available: available === 'true' || available === true,
        speciality: speciality === 'true' || speciality === true,
        IncludesSauce: IncludesSauce === 'true' || IncludesSauce === true,
        saucePrice: saucePrice ? parseFloat(saucePrice) : 0.0,
        versions: {
          create: parsedVersions.map(version => ({
            size: version.size,
            extraPrice: parseFloat(version.extraPrice || 0),
            // tags will be attached after create in a follow-up step
          }))
        },
        tags: parsedTags.length > 0 ? {
          connect: parsedTags
        } : undefined
      },
      include: {
        versions: true,
        tags: true
      }
    });
    // Attach tags to versions if provided
    if (plat && plat.versions && Object.keys(parsedVersionTags).length > 0) {
      for (const v of plat.versions) {
        const vTags = parsedVersionTags[v.size];
        if (Array.isArray(vTags) && vTags.length > 0) {
          await prisma.platVersion.update({
            where: { id: v.id },
            data: {
              tags: { set: vTags.map(id => ({ id: parseInt(id) })) }
            }
          });
        }
      }
    }
    const createdPlat = await prisma.plat.findUnique({
      where: { id: plat.id },
      include: { versions: { include: { tags: true }, orderBy: { size: 'asc' } }, tags: true }
    });
    res.status(201).json(createdPlat);
  } catch (error) {
    console.error('Create plat error:', error);
    // Delete the uploaded file if it exists
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "A plat with this name already exists" });
    }
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
    }
    if (error.message && error.message.includes('Unsupported file format')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update plat
app.put("/plats/:id", upload.single('image'), processImage, async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    price, 
    description, 
    ordre,
    keepExistingImage, 
    availableForDelivery, 
    available, 
    speciality,
    IncludesSauce,
    saucePrice,
    versions,
    tags, // Add tags to destructuring
    versionTags // Optional mapping { [size]: [tagIds] }
  } = req.body;
  try {
    // Validate required fields
    if (!name || price === undefined || !description) {
      // Delete the uploaded file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: "Name, price, and description are required" });
    }

    // Get existing plat to check if we need to delete old image
    const existingPlat = await prisma.plat.findUnique({
      where: { id: parseInt(id) },
      include: { versions: true }
    });

    if (!existingPlat) {
      // Delete the uploaded file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: "Plat not found" });
    }

    let imageUrl = existingPlat.image;

    // Handle image update
    if (req.file) {
      // New image uploaded, delete old one if it exists
      if (existingPlat.image && existingPlat.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, 'public', existingPlat.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (keepExistingImage === 'false') {
      // User wants to remove the image
      if (existingPlat.image && existingPlat.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, 'public', existingPlat.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = null;
    }

    // Parse versions if provided
    let parsedVersions = [];
    if (versions) {
      try {
        parsedVersions = typeof versions === 'string' ? JSON.parse(versions) : versions;
      } catch (e) {
        console.error('Invalid versions format:', e);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Invalid versions format" });
      }
    }

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        // Convert to array of connect objects for Prisma
        parsedTags = parsedTags.map(tagId => ({ id: parseInt(tagId) }));
      } catch (e) {
        console.error('Invalid tags format:', e);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Invalid tags format" });
      }
    }

    // Update plat using transaction to handle versions (preserve existing to keep images)
    const updatedPlat = await prisma.$transaction(async (tx) => {
      // Update main plat fields first
      const platUpdated = await tx.plat.update({
        where: { id: parseInt(id) },
        data: {
          name,
          price: parseFloat(price),
          description,
          ordre: ordre || "",
          image: imageUrl,
          availableForDelivery: availableForDelivery === 'true' || availableForDelivery === true,
          available: available === 'true' || available === true,
          speciality: speciality === 'true' || speciality === true,
          IncludesSauce: IncludesSauce === 'true' || IncludesSauce === true,
          saucePrice: saucePrice ? parseFloat(saucePrice) : 0.0,
          tags: {
            set: parsedTags // This replaces all existing tag connections
          }
        }
      });

      // Sync versions: delete removed, update existing, create new
      const existingVersions = await tx.platVersion.findMany({ where: { platId: platUpdated.id } });
      const incomingSizes = (parsedVersions || []).map(v => v.size);

  // Delete versions not present anymore (and remove their images from FS)
      const toDelete = existingVersions.filter(v => !incomingSizes.includes(v.size));
      const toDeleteIds = toDelete.map(v => v.id);
      for (const v of toDelete) {
        if (v.image && v.image.startsWith('/uploads/')) {
          const oldPath = path.join(__dirname, 'public', v.image);
          if (fs.existsSync(oldPath)) {
            try { fs.unlinkSync(oldPath); } catch (e) { console.warn('Failed to delete version image:', oldPath, e.message); }
          }
        }
      }
      if (toDeleteIds.length > 0) {
        await tx.platVersion.deleteMany({ where: { id: { in: toDeleteIds } } });
      }

      // Upsert remaining/new versions by size
      for (const v of (parsedVersions || [])) {
        const match = existingVersions.find(ev => ev.size === v.size);
        if (match) {
          await tx.platVersion.update({
            where: { id: match.id },
            data: { extraPrice: parseFloat(v.extraPrice || 0) }
          });
        } else {
          await tx.platVersion.create({
            data: {
              platId: platUpdated.id,
              size: v.size,
              extraPrice: parseFloat(v.extraPrice || 0)
            }
          });
        }
      }

      // Update tags on versions based on versionTags mapping
      if (versionTags) {
        let parsedVersionTags = {};
        try {
          parsedVersionTags = typeof versionTags === 'string' ? JSON.parse(versionTags) : versionTags;
        } catch (e) {
          throw new Error('Invalid versionTags format');
        }
        const updatedVersions = await tx.platVersion.findMany({ where: { platId: platUpdated.id } });
        for (const v of updatedVersions) {
          const vTags = parsedVersionTags[v.size];
          if (Array.isArray(vTags)) {
            await tx.platVersion.update({
              where: { id: v.id },
              data: { tags: { set: vTags.map(id => ({ id: parseInt(id) })) } }
            });
          }
        }
      }

      // Return plat with relations
      return await tx.plat.findUnique({
        where: { id: platUpdated.id },
  include: { versions: { orderBy: { size: 'asc' }, include: { tags: true } }, tags: true }
      });
    });

    res.json(updatedPlat);
  } catch (error) {
    console.error('Update plat error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "A plat with this name already exists" });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Plat not found" });
    }
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
    }
    if (error.message && error.message.includes('Unsupported file format')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete plat
app.delete("/plats/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Get the plat to check if it has an image to delete
    const plat = await prisma.plat.findUnique({
      where: { id: parseInt(id) },
      include: { versions: true }
    });

    if (!plat) {
      return res.status(404).json({ error: "Plat not found" });
    }

    // Delete the plat from the database (versions will be deleted by cascade)
    await prisma.plat.delete({
      where: { id: parseInt(id) },
    });
    
    // If the plat has an image, delete it from the filesystem
    if (plat.image && plat.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, 'public', plat.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    // Delete version images from filesystem
    if (plat.versions && plat.versions.length > 0) {
      for (const v of plat.versions) {
        if (v.image && v.image.startsWith('/uploads/')) {
          const vPath = path.join(__dirname, 'public', v.image);
          if (fs.existsSync(vPath)) {
            try { fs.unlinkSync(vPath); } catch (e) { console.warn('Failed to delete version image:', vPath, e.message); }
          }
        }
      }
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete plat error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===============================
// PLAT VERSION IMAGE ENDPOINTS
// ===============================

// Upload/replace image for a plat version
app.post('/plat-versions/:id/image', upload.single('image'), processImage, async (req, res) => {
  const { id } = req.params;
  try {
    const version = await prisma.platVersion.findUnique({ where: { id: parseInt(id) } });
    if (!version) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Plat version not found' });
    }

    let imageUrl = version.image;
    if (req.file) {
      // Remove old image if any
      if (version.image && version.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, 'public', version.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imageUrl = `/uploads/${req.file.filename}`;
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }

    const updated = await prisma.platVersion.update({
      where: { id: parseInt(id) },
      data: { image: imageUrl }
    });
    res.json(updated);
  } catch (error) {
    console.error('Update plat version image error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove image from a plat version
app.delete('/plat-versions/:id/image', async (req, res) => {
  const { id } = req.params;
  try {
    const version = await prisma.platVersion.findUnique({ where: { id: parseInt(id) } });
    if (!version) return res.status(404).json({ error: 'Plat version not found' });

    if (version.image && version.image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, 'public', version.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await prisma.platVersion.update({ where: { id: parseInt(id) }, data: { image: null } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete plat version image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// EXTRAS ENDPOINTS
// ===============================

// Get all extras with their tags
app.get('/extras', async (req, res) => {
  try {
    const extras = await prisma.extra.findMany({
      where: {
        available: true
      },
      include: {
        tags: true
      },
      orderBy: {
        nom: 'asc'
      }
    });
    res.json(extras);
  } catch (error) {
    console.error('Get extras error:', error);
    res.status(500).json({ error: 'Failed to fetch extras' });
  }
});

// Restaurant address coordinates (Rue Grande 110, 7301 Boussu)
const RESTAURANT_ADDRESS = {
  street: "Rue Grande 110",
  city: "Boussu",
  postalCode: "7301",
  country: "Belgium",
  lat: 50.4342, // Approximate coordinates for Boussu
  lng: 3.7947
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Enhanced geocoding endpoint with distance calculation
app.post('/api/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !address.street || !address.city || !address.postalCode) {
      return res.status(400).json({ error: 'Complete address is required' });
    }
    
    const fullAddress = `${address.street}, ${address.city} ${address.postalCode}, Belgium`;
    
    // Use the Google Maps API key from environment
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found, using fallback');
      const fallbackCoords = getApproximateCoordinates(address.postalCode);
      const distance = calculateDistance(
        RESTAURANT_ADDRESS.lat, 
        RESTAURANT_ADDRESS.lng, 
        fallbackCoords.lat, 
        fallbackCoords.lng
      );
      return res.json({
        ...fallbackCoords,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        restaurantAddress: RESTAURANT_ADDRESS
      });
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      const distance = calculateDistance(
        RESTAURANT_ADDRESS.lat, 
        RESTAURANT_ADDRESS.lng, 
        lat, 
        lng
      );
      
      res.json({ 
        lat, 
        lng, 
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        restaurantAddress: RESTAURANT_ADDRESS,
        formattedAddress: data.results[0].formatted_address
      });
    } else {
      console.warn('Geocoding failed, using fallback:', data.status);
      const fallbackCoords = getApproximateCoordinates(address.postalCode);
      const distance = calculateDistance(
        RESTAURANT_ADDRESS.lat, 
        RESTAURANT_ADDRESS.lng, 
        fallbackCoords.lat, 
        fallbackCoords.lng
      );
      res.json({
        ...fallbackCoords,
        distance: Math.round(distance * 100) / 100,
        restaurantAddress: RESTAURANT_ADDRESS
      });
    }
    
  } catch (error) {
    console.error('Geocoding error:', error);
    const fallbackCoords = getApproximateCoordinates(req.body.address?.postalCode || '1000');
    const distance = calculateDistance(
      RESTAURANT_ADDRESS.lat, 
      RESTAURANT_ADDRESS.lng, 
      fallbackCoords.lat, 
      fallbackCoords.lng
    );
    res.json({
      ...fallbackCoords,
      distance: Math.round(distance * 100) / 100,
      restaurantAddress: RESTAURANT_ADDRESS
    });
  }
});

// Fallback function for approximate coordinates based on Belgian postal codes
function getApproximateCoordinates(postalCode) {
  const code = parseInt(postalCode);
  
  // Brussels region (1000-1299)
  if (code >= 1000 && code <= 1299) {
    return { 
      lat: 50.8503 + (Math.random() - 0.5) * 0.05, 
      lng: 4.3517 + (Math.random() - 0.5) * 0.05 
    };
  }
  
  // Antwerp region (2000-2999)
  if (code >= 2000 && code <= 2999) {
    return { lat: 51.2194, lng: 4.4025 };
  }
  
  // Ghent region (9000-9999)
  if (code >= 9000 && code <= 9999) {
    return { lat: 51.0543, lng: 3.7174 };
  }
  
  // Liège region (4000-4999)
  if (code >= 4000 && code <= 4999) {
    return { lat: 50.6292, lng: 5.5797 };
  }
  
  // Charleroi region (6000-6999)
  if (code >= 6000 && code <= 6999) {
    return { lat: 50.4108, lng: 4.4446 };
  }
  
  // Default to Brussels center for unknown postal codes
  return { lat: 50.8503, lng: 4.3517 };
}

// ==================== INGREDIENTS ENDPOINTS ====================

// Get all ingredients
app.get('/ingredients', async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(ingredients);
  } catch (error) {
    console.error('Get ingredients error:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

// Create ingredient
app.post('/ingredients', async (req, res) => {
  try {
    const { name, description, allergen } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        description: description || null,
        allergen: allergen === true || allergen === 'true'
      }
    });
    
    res.status(201).json(ingredient);
  } catch (error) {
    console.error('Create ingredient error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An ingredient with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// Update ingredient
app.put('/ingredients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, allergen } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description: description || null,
        allergen: allergen === true || allergen === 'true'
      }
    });
    
    res.json(ingredient);
  } catch (error) {
    console.error('Update ingredient error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An ingredient with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// Delete ingredient
app.delete('/ingredients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.ingredient.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

// ==================== PLAT INGREDIENTS ENDPOINTS ====================

// Get ingredients for a specific plat
app.get('/plats/:id/ingredients', async (req, res) => {
  try {
    const { id } = req.params;
    
    const platIngredients = await prisma.platIngredient.findMany({
      where: { platId: parseInt(id) },
      include: {
        ingredient: true
      },
      orderBy: { ingredient: { name: 'asc' } }
    });
    
    res.json(platIngredients);
  } catch (error) {
    console.error('Get plat ingredients error:', error);
    res.status(500).json({ error: 'Failed to fetch plat ingredients' });
  }
});

// Add ingredient to plat
app.post('/plats/:id/ingredients', async (req, res) => {
  try {
    const { id } = req.params;
    const { ingredientId, removable } = req.body;
    
    if (!ingredientId) {
      return res.status(400).json({ error: 'Ingredient ID is required' });
    }
    
    const platIngredient = await prisma.platIngredient.create({
      data: {
        platId: parseInt(id),
        ingredientId: parseInt(ingredientId),
        removable: removable !== false, // Default to true
      },
      include: {
        ingredient: true
      }
    });
    
    res.status(201).json(platIngredient);
  } catch (error) {
    console.error('Add plat ingredient error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This ingredient is already added to this plat' });
    }
    res.status(500).json({ error: 'Failed to add ingredient to plat' });
  }
});

// Update plat ingredient
app.put('/plats/:platId/ingredients/:ingredientId', async (req, res) => {
  try {
    const { platId, ingredientId } = req.params;
    const { removable } = req.body;
    
    const platIngredient = await prisma.platIngredient.update({
      where: {
        platId_ingredientId: {
          platId: parseInt(platId),
          ingredientId: parseInt(ingredientId)
        }
      },
      data: {
        removable: removable !== false,
      },
      include: {
        ingredient: true
      }
    });
    
    res.json(platIngredient);
  } catch (error) {
    console.error('Update plat ingredient error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Plat ingredient not found' });
    }
    res.status(500).json({ error: 'Failed to update plat ingredient' });
  }
});

// Remove ingredient from plat
app.delete('/plats/:platId/ingredients/:ingredientId', async (req, res) => {
  try {
    const { platId, ingredientId } = req.params;
    
    await prisma.platIngredient.delete({
      where: {
        platId_ingredientId: {
          platId: parseInt(platId),
          ingredientId: parseInt(ingredientId)
        }
      }
    });
    
    res.json({ message: 'Ingredient removed from plat successfully' });
  } catch (error) {
    console.error('Remove plat ingredient error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Plat ingredient not found' });
    }
    res.status(500).json({ error: 'Failed to remove ingredient from plat' });
  }
});

// SETTINGS ROUTES

// Get all settings (public access for basic settings)
app.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.settings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get a specific setting by key (public access)
app.get('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.settings.findUnique({
      where: { key: key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json(setting);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Create or update multiple settings
app.post('/settings', authenticate, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an array' });
    }

    // Use transactions to ensure all settings are saved together
    const result = await prisma.$transaction(async (tx) => {
      const updatedSettings = [];
      
      for (const setting of settings) {
        const { key, value, type, category, description } = setting;
        
        if (!key || value === undefined) {
          throw new Error(`Invalid setting: key and value are required`);
        }

        // Sanitize inputs
        const sanitizedKey = sanitizeInput(key);
        const sanitizedValue = sanitizeInput(value.toString());
        const sanitizedType = sanitizeInput(type || 'string');
        const sanitizedCategory = sanitizeInput(category || 'general');
        const sanitizedDescription = sanitizeInput(description || '');

        const updatedSetting = await tx.settings.upsert({
          where: { key: sanitizedKey },
          update: {
            value: sanitizedValue,
            type: sanitizedType,
            category: sanitizedCategory,
            description: sanitizedDescription,
          },
          create: {
            key: sanitizedKey,
            value: sanitizedValue,
            type: sanitizedType,
            category: sanitizedCategory,
            description: sanitizedDescription,
          },
        });
        
        updatedSettings.push(updatedSetting);
      }
      
      return updatedSettings;
    });

    res.json({ 
      message: 'Settings updated successfully', 
      settings: result 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Update a single setting
app.put('/settings/:key', authenticate, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type, category, description } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Sanitize inputs
    const sanitizedValue = sanitizeInput(value.toString());
    const sanitizedType = sanitizeInput(type || 'string');
    const sanitizedCategory = sanitizeInput(category || 'general');
    const sanitizedDescription = sanitizeInput(description || '');

    const setting = await prisma.settings.upsert({
      where: { key: key },
      update: {
        value: sanitizedValue,
        type: sanitizedType,
        category: sanitizedCategory,
        description: sanitizedDescription,
      },
      create: {
        key: key,
        value: sanitizedValue,
        type: sanitizedType,
        category: sanitizedCategory,
        description: sanitizedDescription,
      },
    });

    res.json(setting);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Delete a setting
app.delete('/settings/:key', authenticate, async (req, res) => {
  try {
    const { key } = req.params;
    
    await prisma.settings.delete({
      where: { key: key }
    });
    
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Return server time (useful for clients that want server-based opening hours)
app.get('/server-time', async (req, res) => {
  try {
    return res.json({ now: new Date().toISOString() });
  } catch (err) {
    console.error('Server time error:', err);
    res.status(500).json({ error: 'Failed to get server time' });
  }
});

// Get restaurant config (public read)
app.get('/restaurant-config', async (req, res) => {
  try {
    const cfg = await prisma.restaurantConfig.findFirst();
    if (!cfg) return res.json({});
    res.json(cfg);
  } catch (err) {
    console.error('Get restaurant config error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant config' });
  }
});

// Update restaurant config (admin)
app.put('/restaurant-config', authenticate, async (req, res) => {
  try {
    const { openMode, openDays, openStart, openEnd, manualOpen } = req.body;
    const up = await prisma.restaurantConfig.upsert({
      where: { id: 1 },
      update: {
        openMode: openMode || 'auto',
        openDays: openDays || [],
        openStart: openStart || '11:00',
        openEnd: openEnd || '22:00',
        manualOpen: typeof manualOpen === 'boolean' ? manualOpen : true,
      },
      create: {
        openMode: openMode || 'auto',
        openDays: openDays || [],
        openStart: openStart || '11:00',
        openEnd: openEnd || '22:00',
        manualOpen: typeof manualOpen === 'boolean' ? manualOpen : true,
      }
    });

    res.json(up);
  } catch (err) {
    console.error('Update restaurant config error:', err);
    res.status(500).json({ error: 'Failed to update restaurant config' });
  }
});

// Order Chat Routes
// Get chat messages for an order
app.get('/orders/:orderId/chat', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Verify user has access to this order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Allow access if user owns the order, it's a guest order, or user is admin
    if (order.userId !== req.user.userId && order.userId !== null && req.user.type !== 1) {
      return res.status(403).json({ error: 'Unauthorized access to this order' });
    }
    
    const messages = await prisma.orderChat.findMany({
      where: { orderId: parseInt(orderId) },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { timestamp: 'asc' }
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Send a chat message
app.post('/orders/:orderId/chat', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message, senderType } = req.body;
    
    if (!message || !senderType) {
      return res.status(400).json({ error: 'Message and senderType are required' });
    }

    // Verify user has access to this order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Allow access if user owns the order, it's a guest order, or user is admin
    if (order.userId !== req.user.userId && order.userId !== null && req.user.type !== 1) {
      return res.status(403).json({ error: 'Unauthorized access to this order' });
    }

    // Validate sender type based on user role
    // Admin users can send messages as either shop or client
    // Regular users can only send as client
    if (req.user.type !== 1 && senderType !== 'client') {
      return res.status(400).json({ error: 'Regular users can only send messages as client' });
    }
    
    const chatMessage = await prisma.orderChat.create({
      data: {
        orderId: parseInt(orderId),
        senderId: req.user.userId,
        senderType: senderType.trim(),
        message: message.trim()
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Notifications logic:
    //  - If sender is 'shop': notify the client (existing behavior retained)
    //  - If sender is 'client': notify all admins (new requirement), DO NOT notify client themselves
    if (order && order.userId) {
      if (senderType === 'shop') {
        const notification = await prisma.notification.create({
          data: {
            userId: order.userId,
            type: 'chat',
            title: 'Nouveau message restaurant',
            message: `Nouveau message concernant la commande #${orderId}`,
            data: {
              orderId: parseInt(orderId),
              chatMessageId: chatMessage.id,
              senderType: senderType,
              message: message
            }
          }
        });
        io.to(`user-${order.userId}`).emit('new-notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        });
      } else if (senderType === 'client') {
        // Notify admins about client message
        await notifyAdmins({
          prisma,
          excludeUserId: null,
          type: 'chat',
          title: 'Nouveau message client',
          message: `Message client pour commande #${orderId}`,
          data: {
            orderId: parseInt(orderId),
            chatMessageId: chatMessage.id,
            senderType: senderType,
            message: message
          }
        });
      }
    }
    
    // Broadcast the new message via Socket.IO to specific room
    io.to(`order-chat-${orderId}`).emit(`chat-message`, chatMessage);
    
    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark chat messages as read
app.put('/orders/:orderId/chat/read', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { senderType } = req.body;
    
    await prisma.orderChat.updateMany({
      where: {
        orderId: parseInt(orderId),
        senderType: { not: senderType },
        isRead: false
      },
      data: { isRead: true }
    });
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Notification endpoints
// Get user notifications
app.get('/notifications', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereClause = {
      userId: req.user.userId
    };
    
    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }
    
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });
    
    const totalCount = await prisma.notification.count({
      where: whereClause
    });
    
    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNextPage: offset + parseInt(limit) < totalCount,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.updateMany({
      where: {
        id: parseInt(id),
        userId: req.user.userId
      },
      data: { isRead: true }
    });
    
    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false
      },
      data: { isRead: true }
    });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get unread notification count
app.get('/notifications/unread-count', authenticate, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        isRead: false
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Delete a specific notification
app.delete('/notifications/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.deleteMany({
      where: {
        id: parseInt(id),
        userId: req.user.userId
      }
    });
    
    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all notifications for a user
app.delete('/notifications', authenticate, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId: req.user.userId
      }
    });
    
    res.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
});

// ORDER HOURS ROUTES

// Get all order hours
app.get('/order-hours', async (req, res) => {
  try {
    // Return all hours (enabled and disabled) so clients can display disabled slots as greyed out
    const orderHours = await prisma.orderHours.findMany({
      orderBy: { time: 'asc' }
    });
    res.json(orderHours);
  } catch (error) {
    console.error('Get order hours error:', error);
    res.status(500).json({ error: 'Failed to fetch order hours' });
  }
});

// Create order hour
app.post('/order-hours', authenticate, async (req, res) => {
  try {
    const { time, enabled } = req.body;
    
    if (!time) {
      return res.status(400).json({ error: 'Time is required' });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM format' });
    }

    const orderHour = await prisma.orderHours.create({
      data: {
        time,
        enabled: enabled !== false
      }
    });
    
    res.status(201).json(orderHour);
  } catch (error) {
    console.error('Create order hour error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An order hour with this time already exists' });
    }
    res.status(500).json({ error: 'Failed to create order hour' });
  }
});

// Update order hour
app.put('/order-hours/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { time, enabled } = req.body;
    
    if (!time) {
      return res.status(400).json({ error: 'Time is required' });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM format' });
    }

    const orderHour = await prisma.orderHours.update({
      where: { id: parseInt(id) },
      data: {
        time,
        enabled: enabled !== false
      }
    });
    
    res.json(orderHour);
  } catch (error) {
    console.error('Update order hour error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order hour not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An order hour with this time already exists' });
    }
    res.status(500).json({ error: 'Failed to update order hour' });
  }
});

// Delete order hour
app.delete('/order-hours/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.orderHours.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Order hour deleted successfully' });
  } catch (error) {
    console.error('Delete order hour error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order hour not found' });
    }
    res.status(500).json({ error: 'Failed to delete order hour' });
  }
});

// Bulk create order hours
app.post('/order-hours/bulk', authenticate, async (req, res) => {
  try {
    const { hours } = req.body;
    
    if (!Array.isArray(hours)) {
      return res.status(400).json({ error: 'Hours must be an array' });
    }

    const createdHours = [];
    
    for (const hour of hours) {
      const { time, enabled } = hour;
      
      if (!time) {
        return res.status(400).json({ error: 'Time is required for all hours' });
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        return res.status(400).json({ error: `Invalid time format for ${time}. Use HH:MM format` });
      }

      const orderHour = await prisma.orderHours.create({
        data: {
          time,
          enabled: enabled !== false
        }
      });
      
      createdHours.push(orderHour);
    }
    
    res.status(201).json({ 
      message: `${createdHours.length} order hours created successfully`,
      hours: createdHours
    });
  } catch (error) {
    console.error('Bulk create order hours error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'One or more order hours with these times already exist' });
    }
    res.status(500).json({ error: 'Failed to create order hours' });
  }
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err?.message, stack: err?.stack });
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: reason && reason.message ? reason.message : String(reason) });
});

server.listen(3001, '0.0.0.0', () => logger.info("Server with Socket.IO running on 0.0.0.0:3001", { port: 3001 }));
