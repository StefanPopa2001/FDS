const express = require("express");
const cors = require("cors");
const CryptoJS = require('crypto-js');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const rateLimit = require('express-rate-limit');


const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

//Works
//Rate limiting configuration (anti brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs for auth routes
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

//Middleware for authentication
//TODO: SECRET_KEY should be stored in an environment variable
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your-secret-key";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});


//Works
//Create a new user
//TODO: Add phone number validation
app.post("/users/createUser", async (req, res) => {
  const { name, email, phone, password, salt } = req.body;

  //Regex to check mail validity
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  //Check if password and salt are provided
  if (!password || !salt) {
    return res.status(400).json({ error: "Password and salt are required" });
  }

  try {

    //Check if user with the same email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Create user with the hashed password and salt
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password,
        salt,
      },
    });

    //Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "365d",
    });

    //Return the user data and token
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, type: user.type }, token });
  } catch (err) {

    //Generic error handling
    res.status(500).json({ error: "Internal server error" });
  }
});


//Login user
app.post("/users/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    //Check if the users email exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    //If user was found
    //Hash the provided password with stored salt
    const hashedPassword = CryptoJS.SHA256(password + user.salt).toString();
    
    //Compare the hashed password
    if (hashedPassword !== user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "365d",
    });

    res.json({ user: { id: user.id, email: user.email, name: user.name, type: user.type }, token });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Middleware to authenticate requests
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
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
        createdAt: true,
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user (admin only)
app.put("/users/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, type } = req.body;

    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!requestingUser || requestingUser.type !== 1) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email, phone, type },
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
        type: true, // Include type field
        createdAt: true,
        // Explicitly exclude password and salt
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
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
    const { nom, description, emoji } = req.body;
    if (!nom || !description || !emoji) {
      return res.status(400).json({ error: 'Nom, description, and emoji are required' });
    }
    const tag = await prisma.tags.create({
      data: { nom, description, emoji },
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
  const { nom, description, emoji } = req.body;
  try {
    if (!nom || !description || !emoji) {
      return res.status(400).json({ error: 'Nom, description, and emoji are required' });
    }
    const tag = await prisma.tags.update({
      where: { id: parseInt(id) },
      data: { nom, description, emoji },
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
app.post("/sauces", upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, availableForDelivery, available, speciality, tags } = req.body;
    
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
        availableForDelivery: typeof availableForDelivery === 'boolean' ? availableForDelivery : availableForDelivery === 'true',
        available: typeof available === 'boolean' ? available : available === 'true',
        speciality: typeof speciality === 'boolean' ? speciality : speciality === 'true',
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
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update sauce
app.put("/sauces/:id", upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, price, description, keepExistingImage, availableForDelivery, available, speciality, tags } = req.body;
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
        availableForDelivery: typeof availableForDelivery === 'boolean' ? availableForDelivery : availableForDelivery === 'true',
        available: typeof available === 'boolean' ? available : available === 'true',
        speciality: typeof speciality === 'boolean' ? speciality : speciality === 'true',
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
          orderBy: { size: 'asc' }
        },
        tags: {
          include: {
            extras: {
              where: {
                available: true // Only include available extras
              }
            }
          }
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
app.post("/plats", upload.single('image'), async (req, res) => {
  try {
    const { 
      name, 
      price, 
      description, 
      type,
      availableForDelivery, 
      available, 
      speciality,
      IncludesSauce,
      saucePrice,
      versions, // Array of version objects: [{ size: "M", extraPrice: 0.0 }, ...]
      tags // Array of tag IDs: [1, 2, 3]
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
        type: type || "snack",
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
            available: typeof version.available === 'boolean' ? version.available : true,
            availableForDelivery: typeof version.availableForDelivery === 'boolean' ? version.availableForDelivery : true,
            speciality: typeof version.speciality === 'boolean' ? version.speciality : false,
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
    res.status(201).json(plat);
  } catch (error) {
    console.error('Create plat error:', error);
    // Delete the uploaded file if it exists
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "A plat with this name already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update plat
app.put("/plats/:id", upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    price, 
    description, 
    type,
    keepExistingImage, 
    availableForDelivery, 
    available, 
    speciality,
    IncludesSauce,
    saucePrice,
    versions,
    tags // Add tags to destructuring
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

    // Update plat using transaction to handle versions
    const updatedPlat = await prisma.$transaction(async (prisma) => {
      // Delete existing versions
      await prisma.platVersion.deleteMany({
        where: { platId: parseInt(id) }
      });

      // Update plat with new versions
      return await prisma.plat.update({
        where: { id: parseInt(id) },
        data: {
          name,
          price: parseFloat(price),
          description,
          type: type || "snack",
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
              available: typeof version.available === 'boolean' ? version.available : true,
              availableForDelivery: typeof version.availableForDelivery === 'boolean' ? version.availableForDelivery : true,
              speciality: typeof version.speciality === 'boolean' ? version.speciality : false,
            }))
          },
          tags: {
            set: parsedTags // This replaces all existing tag connections
          }
        },
        include: {
          versions: true,
          tags: true
        }
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
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete plat error:', error);
    res.status(500).json({ error: "Internal server error" });
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

app.listen(3001, () => console.log("Server running on 3001"));