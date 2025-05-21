# QC Standards Application

A comprehensive web application for managing Quality Control standards and checklists in manufacturing environments. This application digitizes and streamlines the QC process by replacing static PDF files with an interactive, version-controlled system.

## Features

- **Template Management**: Create, edit, and version QC templates with full revision history
- **Checklist Execution**: Interactive execution of QC checks with real-time validation
- **Photo Evidence**: Capture and review photo evidence for critical QC steps
- **Offline Support**: Use the app without internet connection and sync when back online
- **Role-Based Access**: Different permission levels for QC engineers, production leaders, operators, etc.
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **PWA Support**: Install as a Progressive Web App for app-like experience

## Technology Stack

### Backend
- [FastAPI](https://fastapi.tiangolo.com/): Modern Python web framework for API development
- [SQLModel](https://sqlmodel.tiangolo.com/): ORM for database interactions
- [PostgreSQL](https://www.postgresql.org/): Robust database for data storage
- [Redis](https://redis.io/): Caching and message queue for synchronization
- [JWT](https://jwt.io/): Authentication mechanism

### Frontend
- [React](https://reactjs.org/): UI library for building component-based interfaces
- [TypeScript](https://www.typescriptlang.org/): Typed JavaScript for safer code
- [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework
- [SWR](https://swr.vercel.app/): React hooks for data fetching and caching
- [Vite](https://vitejs.dev/): Modern build tool for frontend development

### DevOps
- [Docker](https://www.docker.com/): Containerization for consistent environments
- [GitHub Actions](https://github.com/features/actions): CI/CD workflows
- [Nginx](https://nginx.org/): Web server and reverse proxy

## Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads) for version control

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/qc-standards-app.git
   cd qc-standards-app
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Start the development environment:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. The services will be available at:
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:5173
   - API Documentation: http://localhost:8000/api/docs

### GitHub Codespaces

For a consistent development experience, this project is configured for GitHub Codespaces. Simply open the repository in Codespaces to get a fully configured development environment with all dependencies pre-installed.

#### Codespaces Configuration

The project now includes an improved Codespaces configuration that:

1. Uses a dedicated backend service for development
2. Provides proper Docker access via docker-outside-of-docker
3. Automatically forwards all necessary ports

#### Using Codespaces

1. Open the repository in GitHub and click on the "Code" button
2. Select the "Codespaces" tab
3. Click "Create codespace on main"

#### Starting Services in Codespaces

Once your Codespace is running:

1. Start the backend server:
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm run dev -- --host 0.0.0.0
   ```

#### Troubleshooting Codespaces

If you encounter any issues:

1. Check that all services are running:
   ```bash
   docker ps
   ```

2. View logs for specific services:
   ```bash
   docker logs qc-standards-app-db-1
   docker logs qc-standards-app-redis-1
   ```

3. Ensure the database can be accessed:
   ```bash
   psql -h db -U postgres -d qc_standards
   # Password: password
   ```