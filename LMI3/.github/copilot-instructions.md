# LMI3 Restaurant Management System - AI Coding Guidelines

## Architecture Overview

This is a **dockerized restaurant ordering system** with three main services:
- **Frontend**: React (port 3000) with Material-UI components, nginx-served in production
- **Backend**: Express.js API (port 3001) with Prisma ORM, PostgreSQL, and Socket.IO for real-time updates
- **Reverse Proxy**: Traefik with Let's Encrypt SSL for production deployment

## Real-Time Communication

### WebSocket Implementation
- **Socket.IO**: Real-time bidirectional communication between backend and admin frontend
- **Admin Notifications**: New orders and status updates broadcast instantly to admin panel
- **Audio Alerts**: Notification sound plays when new orders arrive
- **Connection Status**: Visual indicator shows WebSocket connection health

### WebSocket Events
```javascript
// Backend broadcasts:
io.to('admin-room').emit('newOrder', orderData)        // New order created
io.to('admin-room').emit('orderStatusUpdate', data)    // Status changed
io.to('admin-room').emit('orderUpdate', data)          // General updates

// Frontend listens for:
socket.on('newOrder', handleNewOrder)                  // Plays sound + refreshes
socket.on('orderStatusUpdate', updateOrderInList)      // Updates UI in real-time
```

## Development Workflows

### Environment Setup
- **Development**: Use `./start-dev.sh` to run services locally with hot-reload
- **Production**: Use `./rebuild-containers.sh` to rebuild Docker containers  
- **Environment Variables**: Centralized in root `.env` file, copied to service-specific `.env` files by scripts

### Database Management
- **Schema**: Located in `backend-lmi3/prisma/schema.prisma` 
- **Migrations**: Run `npx prisma migrate dev` in backend directory for local changes
- **Models**: User, Order, OrderItem, Plat, Sauce, Extra, Tags, Ingredient with complex relationships

### Authentication Pattern
```javascript
// All protected routes use this pattern:
app.get("/endpoint", authenticate, async (req, res) => {
  // req.user contains authenticated user info
})

// Rate limiting applied to auth endpoints:
app.post("/users/login", authLimiter, async (req, res) => {})
```

## Code Patterns & Conventions

### Backend API Structure
- **Input Sanitization**: Always use `sanitizeInput()`, `sanitizeEmail()`, `sanitizePhone()` 
- **Error Handling**: Return structured JSON errors with HTTP status codes
- **File Uploads**: Use multer with configured storage in `public/uploads/`
- **Security**: HTTPS enforcement, security headers, rate limiting for auth routes
- **WebSocket Broadcasts**: Call `broadcastOrderUpdate()` after order creation/updates

### Frontend Architecture  
- **State Management**: React Context for `AuthContext` and `BasketContext`
- **Routing**: React Router with protected routes pattern
- **Admin Panel**: Tab-based Material-UI interface with real-time WebSocket updates
- **Real-Time Updates**: No polling - pure WebSocket-driven UI updates with audio notifications
- **API Communication**: Centralized config in `src/config.js`

### Component Organization
```
src/
├── components/     # Reusable UI components (Navbar, Basket, etc.)
├── contexts/       # Global state management
├── views/          # Page-level components
└── config.js       # Environment-specific API URLs
```

### Database Entity Relationships
- **Orders**: Complex structure with `OrderItem` linking to `Plat`, `Sauce`, `Extra`
- **Plats**: Support versions (sizes), ingredients, and sauce inclusion
- **Tags**: Many-to-many relationships with Plats, Sauces, and Extras
- **User Types**: `type` field (0=customer, 1=admin) determines access level

## Key Integration Points

### Docker Services Communication
- Services communicate via internal Docker network `app-network`
- Frontend proxied through nginx with React Router fallback
- Backend connects to PostgreSQL via `DATABASE_URL` environment variable

### File Upload Handling
- Images stored in `backend-lmi3/public/uploads/` 
- Accessible via `/uploads/*` static route
- Multer configured with 5MB limit and image-only filter

### Security Implementation
- **JWT Authentication**: Stored in localStorage, verified on protected routes
- **Password Security**: Client-side hashing with salt before transmission
- **Input Validation**: Regex patterns for email, phone, username formats
- **Rate Limiting**: 5 requests per 15 minutes for auth endpoints

## Common Development Tasks

- **Add New API Route**: Follow `app.method("/path", middleware, async (req, res) => {})` pattern
- **Add WebSocket Notification**: Call `broadcastOrderUpdate(data, eventType)` after data changes
- **Database Changes**: Update schema.prisma → run migration → restart backend
- **New Admin Panel**: Add tab to `AdminDashboard.jsx` and create corresponding `admin*.jsx` view
- **Frontend State**: Extend contexts in `src/contexts/` for global state management
- **Real-Time Features**: Use Socket.IO events for instant UI updates without page refreshes
- **Environment Config**: Update root `.env` file, then run appropriate script to propagate changes
