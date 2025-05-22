# QC Standards Application

A comprehensive web application for managing Quality Control standards and checklists in manufacturing environments. This application digitizes and streamlines the QC process by replacing static PDF files with an interactive, version-controlled system.

## 🚀 Quick Start in GitHub Codespaces

**The fastest way to get started:**

1. Open this repository in GitHub Codespaces
2. Wait for the environment to initialize (2-3 minutes)
3. Run one command in the terminal:

```bash
./quick-start.sh
```

That's it! 🎉 Your development environment will be ready in under a minute.

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

## Development Setup

### Option 1: GitHub Codespaces (Recommended)

1. Click "Code" → "Codespaces" → "Create codespace"
2. Wait for initialization
3. Run: `./quick-start.sh`

#### Available Scripts in Codespaces:

- `./quick-start.sh` - Start all services immediately
- `./start-dev.sh` - Start with detailed output and monitoring
- `docker-compose -f docker-compose.dev.yml down` - Stop all services

### Option 2: Local Development

#### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads) for version control

#### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/djmisieq/qc-standards-app.git
   cd qc-standards-app
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Start the application:
   ```bash
   ./start-dev.sh
   ```

#### Manual Setup (if scripts don't work)

1. Start databases:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. Install and start backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. In a new terminal, install and start frontend:
   ```bash
   cd frontend
   npm install
   npm run dev -- --host 0.0.0.0
   ```

## Service URLs

Once started, access the application at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Database**: postgresql://postgres:password@localhost:5432/qc_standards
- **Redis**: redis://localhost:6379

## Troubleshooting

### Quick Fixes

```bash
# Restart all services
docker-compose -f docker-compose.dev.yml restart

# View service logs
docker-compose -f docker-compose.dev.yml logs

# Clean restart
docker-compose -f docker-compose.dev.yml down
./quick-start.sh
```

### Database Issues

```bash
# Check database connection
docker exec -it qc-standards-app-db-1 psql -U postgres -d qc_standards

# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Port Issues

If ports are already in use:
```bash
# Find and kill processes using ports
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

## Project Structure

```
qc-standards-app/
├── .devcontainer/          # Codespaces configuration
├── .github/                # GitHub Actions workflows
├── backend/                # Python FastAPI backend
│   ├── app/               # Application code
│   ├── requirements.txt   # Python dependencies
│   └── ...
├── frontend/              # React frontend
│   ├── src/              # Source code
│   ├── package.json      # Node dependencies
│   └── ...
├── quick-start.sh         # One-command startup
├── start-dev.sh          # Full development startup
├── docker-compose.dev.yml # Development containers
└── README.md             # This file
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test with `./quick-start.sh`
4. Submit a pull request

## License

This project is proprietary and confidential.

---

**Happy coding! 🚀**