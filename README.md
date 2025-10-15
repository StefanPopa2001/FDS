# R&F Food Delivery App

R&F Food Delivery is a full-stack food ordering and delivery application. This repository contains frontend, backend, and Docker tooling to run the app locally or in containers.

## Contents
- Frontend: [FDS/R&F-Food-Delivery-App/frontend-R&F-Food-Delivery-App](FDS/R&F-Food-Delivery-App/frontend-R%26F-Food-Delivery-App)
- Backend: [FDS/R&F-Food-Delivery-App/backend-R&F-Food-Delivery-App](FDS/R&F-Food-Delivery-App/backend-R%26F-Food-Delivery-App)
- Docker helpers: [FDS/Docker](FDS/Docker)
- Dev scripts: [start-dev.sh](FDS/R&F-Food-Delivery-App/start-dev.sh), [restart-containers.sh](FDS/R&F-Food-Delivery-App/restart-containers.sh), [rebuild-containers.sh](FDS/R&F-Food-Delivery-App/rebuild-containers.sh)
- Config & logs: [FDS/R&F-Food-Delivery-App/.env](FDS/R&F-Food-Delivery-App/.env), [backend.log](FDS/R&F-Food-Delivery-App/backend.log)
- Project-level ignores: [FDS/.gitignore](FDS/.gitignore)
- Admin setup helper: [backend-R&F-Food-Delivery-App/create-admin.js](FDS/R&F-Food-Delivery-App/backend-R%26F-Food-Delivery-App/create-admin.js)
- Repo guidance: [FDS/R&F-Food-Delivery-App/.github/copilot-instructions.md](FDS/R&F-Food-Delivery-App/.github/copilot-instructions.md)

## Features
- Customer ordering flow (browse menu, add to cart, checkout)
- Restaurant / kitchen order management
- Real-time updates (WebSocket helpers available — see [install-websocket-deps.sh](FDS/R&F-Food-Delivery-App/install-websocket-deps.sh))
- Dockerized DB and services for easy local deployment

## Quickstart (development)
1. Copy environment templates and set secrets:
   - Edit [FDS/R&F-Food-Delivery-App/.env](FDS/R&F-Food-Delivery-App/.env)
2. Start development containers and services:
   - Run the project helper: 
     - ./start-dev.sh — starts services for local development
     - ./restart-containers.sh — restart containers
     - ./rebuild-containers.sh — rebuild and restart containers
3. Backend:
   - See [FDS/R&F-Food-Delivery-App/backend-R&F-Food-Delivery-App](FDS/R&F-Food-Delivery-App/backend-R%26F-Food-Delivery-App) for the backend Dockerfile and startup scripts
   - Use [create-admin.js](FDS/R&F-Food-Delivery-App/backend-R%26F-Food-Delivery-App/create-admin.js) to create an initial admin user
4. Frontend:
   - See [FDS/R&F-Food-Delivery-App/frontend-R&F-Food-Delivery-App](FDS/R&F-Food-Delivery-App/frontend-R%26F-Food-Delivery-App) for build and run instructions

## Deployment
- Docker images and compose files live under [FDS/Docker](FDS/Docker). Use the provided scripts to rebuild and deploy containers.

## Logs & troubleshooting
- Backend logs: [FDS/R&F-Food-Delivery-App/backend.log](FDS/R&F-Food-Delivery-App/backend.log)
- If WebSocket issues occur, run [install-websocket-deps.sh](FDS/R&F-Food-Delivery-App/install-websocket-deps.sh) before starting services.
