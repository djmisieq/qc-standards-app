# QC Standards Application

A comprehensive web application for managing Quality Control standards and checklists in manufacturing environments. This application digitizes and streamlines the QC process by replacing static PDF files with an interactive, version-controlled system.

## 🚀 **One-Command Startup in GitHub Codespaces**

**The absolute fastest way to get started:**

1. Open this repository in GitHub Codespaces
2. Wait for initialization (2-3 minutes)
3. Type **ONE command** in the terminal:

```bash
start
```

**or**

```bash
qc
```

**That's it!** 🎉 Your entire development environment launches automatically!

---

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

## Development Setup Options

### 🥇 **Option 1: GitHub Codespaces (Recommended)**

**Super Simple:**
1. Click "Code" → "Codespaces" → "Create codespace"
2. Wait for initialization
3. Type: `start` or `qc`

**Commands available everywhere in terminal:**
- `start` - Launch entire application
- `qc` - Same as start (shorter alias)

### 🥈 **Option 2: Local Development**

#### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads) for version control

#### Setup Steps

1. Clone and start:
   ```bash
   git clone https://github.com/djmisieq/qc-standards-app.git
   cd qc-standards-app
   ./start-dev.sh
   ```

#### Manual Setup (if scripts don't work)

1. Start databases:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. Start backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. Start frontend (new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev -- --host 0.0.0.0
   ```

## 🌐 Service URLs

Once started, access the application at:

- **🎯 Frontend**: http://localhost:5173
- **🔧 Backend API**: http://localhost:8000
- **📚 API Docs**: http://localhost:8000/api/docs
- **🐘 Database**: postgresql://postgres:password@localhost:5432/qc_standards
- **🔴 Redis**: redis://localhost:6379

## 🔐 Default Login Credentials

For development and testing purposes, a default admin account is created automatically:

- **Username**: `admin`
- **Password**: `admin`

You can also login using email:
- **Email**: `admin@example.com`
- **Password**: `admin`

⚠️ **IMPORTANT**: Change these credentials immediately in production environments!

## 🛠️ Available Commands

### In Codespaces Terminal:
```bash
start    # Launch entire application
qc       # Same as start (shorter)
```

### Alternative methods:
```bash
./quick-start.sh    # Direct script execution
./start-dev.sh      # Detailed startup with monitoring
```

### Stop services:
```bash
docker-compose -f docker-compose.dev.yml down
```

## 🐛 Troubleshooting

### Quick Fixes
```bash
# Restart all services
docker-compose -f docker-compose.dev.yml restart

# View service logs
docker-compose -f docker-compose.dev.yml logs

# Clean restart
docker-compose -f docker-compose.dev.yml down
start  # or qc
```

### Database Issues
```bash
# Check database connection
docker exec -it qc-standards-app-db-1 psql -U postgres -d qc_standards

# Reset database
docker-compose -f docker-compose.dev.yml down -v
start  # This will restart everything fresh
```

### Port Issues
```bash
# Find and kill processes using ports
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
start  # Restart after clearing ports
```

## 📁 Project Structure

```
qc-standards-app/
├── .devcontainer/          # Codespaces configuration
├── .github/                # GitHub Actions workflows
├── backend/                # Python FastAPI backend
├── frontend/               # React frontend
├── bin/                   # Global command scripts
│   └── qc-start          # Global terminal command
├── start-dev.sh          # Full development startup
├── quick-start.sh        # Fast startup script
├── docker-compose.dev.yml # Development containers
└── README.md             # This file
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test with `start` command
4. Submit a pull request

## 📄 License

This project is proprietary and confidential.

---

**🚀 Happy coding! Just type `start` and you're ready to go!**