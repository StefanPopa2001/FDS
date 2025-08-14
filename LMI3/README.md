# LMI3 Project

## Environment Variables

This project uses a centralized approach for environment variables. All environment variables are stored in a single `.env` file located at the root of the project.

### Key Environment Variables:

- **GOOGLE_MAPS_API_KEY**: API key for Google Maps integration
- **REACT_APP_API_URL**: URL for the backend API
- **REACT_APP_API_URL_FRONTEND**: URL for frontend API requests
- **DATABASE_URL**: Connection string for the PostgreSQL database used in production Docker environment
- **DATABASE_URL_LOCAL**: Connection string for local development database
- **SECRET_KEY**: JWT secret key for authentication
- **NODE_ENV**: Environment mode (development/production)

### Usage in Docker:

The Docker Compose file is configured to use the root `.env` file for both backend and frontend services.

### Local Development:

For local development, you can create a `.env.local` file (which should be git-ignored) to override any values from the main `.env` file.
