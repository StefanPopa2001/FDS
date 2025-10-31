# Logging System Documentation

## Overview

This R&F Food Delivery App implements a comprehensive, persistent logging system that works in both development and Docker environments. All logs are centralized in this `logs` folder for easy monitoring and debugging.

## Log Files

The logging system creates four dedicated log files:

### Backend Logs
- **`backend_logs.log`** - General backend logs (info, debug, warnings, and errors)
  - Contains all backend operations, HTTP requests, database queries, and system events
  - Retention: Last 800 lines (configurable via `LOG_MAX_LINES`)
  
- **`backend_error.log`** - Backend errors and warnings only
  - Contains only ERROR and WARN level logs from the backend
  - Retention: Last 1000 lines (configurable via `LOG_ERROR_MAX_LINES`)

### Frontend Logs
- **`frontend_logs.log`** - General frontend logs (info, debug, warnings, and errors)
  - Contains console logs, UI events, and frontend operations
  - Includes both client-side logs and frontend-originated anomalies
  - Retention: Last 1000 lines (configurable via `LOG_FRONTEND_ERROR_MAX_LINES`)

- **`frontend_error.log`** - Frontend errors and warnings only
  - Contains only ERROR and WARN level logs from the frontend
  - Includes uncaught exceptions, promise rejections, and user-triggered errors
  - Retention: Last 1000 lines (configurable via `LOG_FRONTEND_ERROR_MAX_LINES`)

## Log Format

All logs follow a consistent format for easy parsing and analysis:

```
[TIMESTAMP] [LEVEL] MESSAGE CONTEXT
```

Example:
```
[2025-10-31 14:23:45.123 +02:00] [INFO ] Order created successfully {"orderId": 12345}
[2025-10-31 14:23:46.456 +02:00] [ERROR] Failed to process payment {"code": "PAYMENT_FAIL"}
[2025-10-31 14:23:47.789 +02:00] [FRONTEND-ERROR] GLOBAL_ERROR {"message": "Network timeout"}
```

## Log Levels

- **INFO** - General informational messages about normal operations
- **DEBUG** - Detailed debug information for troubleshooting
- **WARN** - Warning messages for potentially problematic situations
- **ERROR** - Error messages for failures and exceptions
- **FRONTEND-INFO** - Frontend-specific informational messages
- **FRONTEND-DEBUG** - Frontend-specific debug messages
- **FRONTEND-WARN** - Frontend-specific warnings
- **FRONTEND-ERROR** - Frontend-specific errors

## Backend Logger Usage

The backend logger is located at `backend-R&F-Food-Delivery-App/logger.js` and is used throughout the Express.js application.

### Basic Usage

```javascript
const logger = require('./logger');

// Log information
logger.info('User logged in', { userId: 123, email: 'user@example.com' });

// Log warnings
logger.warn('High response time detected', { duration: 5000 });

// Log errors
logger.error('Database connection failed', { code: 'ECONNREFUSED', message: 'Connection timeout' });

// Log debug info
logger.debug('Processing order', { orderId: 456, items: 3 });

// Frontend-originated logs (sent via /client-log endpoint)
logger.frontendInfo('Frontend event occurred', { event: 'page_view' });
logger.frontendWarn('Frontend warning detected', { warning: 'deprecated_API' });
logger.frontendError('Frontend error caught', { error: 'Uncaught exception' });
logger.frontendDebug('Frontend debug info', { context: 'detailed_state' });
```

### Context Objects

Always pass relevant context as a second argument for better debugging:

```javascript
logger.error('Failed to create order', {
  userId: req.user.id,
  items: req.body.items?.length || 0,
  totalPrice: req.body.totalPrice,
  error: err.message,
  stack: err.stack
});
```

## Frontend Logger Usage

The frontend logger is located at `frontend-R&F-Food-Delivery-App/src/utils/clientLogger.js`.

### Importing and Using

```javascript
import { clientLogger, setClientLoggerUser } from '../utils/clientLogger';

// Set user context for correlation
setClientLoggerUser({ id: 123, email: 'user@example.com', name: 'John' });

// Log messages
clientLogger.info('Order placed successfully', { orderId: 789 });
clientLogger.warn('Network latency detected', { latency: 2500 });
clientLogger.error('Payment failed', { code: 'PAYMENT_ERROR' });
clientLogger.debug('Component mounted', { component: 'OrderConfirmation' });
clientLogger.log('User action', { action: 'clicked_checkout' });
```

### Global Console Interception

The frontend logger automatically intercepts all `console.log()`, `console.info()`, `console.warn()`, `console.error()`, and `console.debug()` calls and ships them to the backend for logging.

```javascript
// This is automatically captured and logged
console.error('Something went wrong!');
console.log('Debug information:', data);
```

### Global Error Handlers

Uncaught exceptions and unhandled promise rejections are automatically captured:

```javascript
// These are automatically logged as GLOBAL_ERROR or UNHANDLED_REJECTION
throw new Error('Unexpected error');
Promise.reject('Promise failed');
```

## Environment Configuration

### Backend Configuration

In your `.env` file or Docker environment:

```bash
# Log directory (defaults to ../../logs relative to backend)
LOG_DIR=/app/logs

# Maximum lines to retain in each log file
LOG_MAX_LINES=800              # General backend logs
LOG_ERROR_MAX_LINES=1000       # Backend error logs
LOG_FRONTEND_ERROR_MAX_LINES=1000  # Frontend error logs
```

### Frontend Configuration

In your `.env` file or during build:

```bash
# Control which log levels are shipped to backend
REACT_APP_CLIENT_LOG_LEVELS=log,info,warn,error,debug

# Default: all levels are shipped. To disable shipping:
# REACT_APP_CLIENT_LOG_LEVELS=            # Empty = no shipping
```

## Development vs. Docker

### Development Environment

When running locally:

```bash
cd backend-R&F-Food-Delivery-App
npm install
npm start
```

Logs are written to: `/home/popas/Desktop/FDS/R&F-Food-Delivery-App/logs/`

### Docker Environment

When running in Docker:

```bash
docker-compose up -d
```

The `logs` folder is mounted as a volume in Docker containers:
- Backend: `../logs:/app/logs`
- Frontend: `../logs:/app/logs`

This ensures logs persist even when containers stop or restart. Access logs on the host at: `/home/popas/Desktop/FDS/R&F-Food-Delivery-App/logs/`

## Log Flow

### Backend Logs
```
Logger Backend Code → logger.js → Log Files
                   → Socket.IO Broadcasting (admin notifications)
```

### Frontend Logs
```
Frontend Code → console.log() → clientLogger interception
            ↓
      /client-log endpoint (POST)
            ↓
      Backend logger.js → Log Files
```

## Viewing Logs

### Real-time Monitoring (Linux/Mac)

```bash
# Watch backend logs in real-time
tail -f logs/backend_logs.log

# Watch backend errors
tail -f logs/backend_error.log

# Watch frontend logs
tail -f logs/frontend_logs.log

# Watch frontend errors
tail -f logs/frontend_error.log

# Search logs
grep "ERROR" logs/backend_logs.log
grep "orderId:.*12345" logs/backend_logs.log
```

### Within Docker Containers

```bash
# Connect to backend container
docker exec -it backend_container tail -f /app/logs/backend_logs.log

# Connect to frontend container
docker exec -it frontend_container tail -f /app/logs/frontend_logs.log
```

### Log Rotation

The logging system implements automatic retention:
- Older lines are automatically trimmed when log files exceed the configured `MAX_LINES`
- Only the most recent entries are retained
- This prevents logs from consuming excessive disk space

## Common Scenarios

### Debugging an Order Creation Issue

1. Check backend logs for order creation process:
```bash
grep "Received order request" logs/backend_logs.log
grep "Error creating order" logs/backend_error.log
```

2. Check frontend logs for client errors:
```bash
grep "FRONTEND-ERROR" logs/frontend_error.log
```

### Monitoring Order Status Updates

```bash
grep "ORDER STATUS UPDATE" logs/backend_logs.log
```

### Tracking User Actions

```bash
grep "userId:.*123" logs/backend_logs.log
grep "email.*user@example.com" logs/backend_logs.log
```

## Troubleshooting

### Logs Not Being Created

1. **Check directory permissions**:
   ```bash
   ls -la logs/
   ```
   Should show `rwx` permissions.

2. **Verify Docker volume mount**:
   ```bash
   docker volume inspect docker_backend_uploads
   docker exec backend_container ls -la /app/logs
   ```

3. **Check backend logs for initialization messages**:
   ```bash
   grep "LOGGER" logs/backend_logs.log
   ```

### Logs Not Appearing in Docker

1. Ensure `LOG_DIR` environment variable is set:
   ```bash
   docker exec backend_container env | grep LOG_DIR
   ```

2. Verify volume is mounted correctly:
   ```bash
   docker inspect backend_container | grep -A 10 '"Mounts"'
   ```

### Frontend Logs Not Reaching Backend

1. Check network connectivity to `/client-log` endpoint
2. Verify API_URL is correctly configured in frontend
3. Check browser console for fetch errors
4. Ensure backend is running and `/client-log` endpoint is accessible

## Best Practices

1. **Use appropriate log levels**:
   - INFO: Important business operations
   - WARN: Potentially problematic situations
   - ERROR: Actual failures
   - DEBUG: Detailed diagnostic information (only in development)

2. **Always include context**:
   ```javascript
   // ❌ Bad
   logger.error('Failed to process');
   
   // ✅ Good
   logger.error('Failed to process order', {
     orderId: order.id,
     userId: order.userId,
     errorCode: err.code,
     errorMessage: err.message
   });
   ```

3. **Avoid logging sensitive data**:
   ```javascript
   // ❌ Don't log passwords, tokens, or full credit card numbers
   logger.info('User logged in', { password: user.password });
   
   // ✅ Log safe identifiers
   logger.info('User logged in', { userId: user.id, email: user.email });
   ```

4. **Keep log messages concise**:
   ```javascript
   // ❌ Too verbose
   logger.info('The system has successfully completed the action of retrieving user data from the database');
   
   // ✅ Clear and concise
   logger.info('User data retrieved from database', { userId: 123 });
   ```

## Performance Considerations

- Logs are written synchronously (blocking) but are limited by line count
- Large context objects are serialized to JSON
- In-memory buffers are capped to prevent memory leaks
- Frontend logs are batched via HTTP to reduce request overhead
- Consider disabling debug logs in production via `LOG_LEVEL` environment variable

## Next Steps

1. Monitor logs regularly during development
2. Set up log aggregation/analysis tools if needed
3. Configure log rotation for production
4. Integrate with monitoring/alerting systems

For questions or issues, refer to the backend `logger.js` and frontend `clientLogger.js` implementations.
