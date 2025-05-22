# 🚀 GitHub Codespaces Setup Guide

This guide will help you get the QC Standards App running perfectly in GitHub Codespaces.

## 🎯 Quick Start (1-Minute Setup)

1. **Open in Codespaces:**
   - Click `Code` → `Codespaces` → `Create codespace on main`
   - Wait for the environment to initialize (2-3 minutes)

2. **Launch the App:**
   ```bash
   start
   ```
   **or**
   ```bash
   qc
   ```

3. **Access the Application:**
   - Frontend: Click the popup notification or go to `PORTS` tab
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/api/docs`

## 🔧 What Happens During Setup

The improved devcontainer configuration automatically:

- ✅ Installs Python 3.12 and Node.js 20
- ✅ Sets up Docker for database services
- ✅ Copies `.env.example` to `.env`
- ✅ Installs all backend Python dependencies
- ✅ Installs all frontend Node.js dependencies
- ✅ Creates global terminal commands (`start` and `qc`)
- ✅ Configures VS Code with optimal extensions

## 🌐 Available Services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://localhost:5173` | React application |
| **Backend API** | `http://localhost:8000` | FastAPI server |
| **API Docs** | `http://localhost:8000/api/docs` | Interactive API documentation |
| **Database** | `postgresql://postgres:password@localhost:5432/qc_standards` | PostgreSQL database |
| **Redis** | `redis://localhost:6379` | Cache and message queue |

## 🛠️ Development Commands

### Quick Commands (Available Anywhere)
```bash
start    # Launch entire application
qc       # Same as start (shorter alias)
```

### Alternative Methods
```bash
./quick-start.sh        # Direct script execution
./start-dev.sh          # Detailed startup with monitoring
```

### Docker Commands
```bash
# View service status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs

# Restart services
docker-compose -f docker-compose.dev.yml restart

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Manual Development (if needed)
```bash
# Start databases only
docker-compose -f docker-compose.dev.yml up -d

# Start backend manually
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start frontend manually (new terminal)
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

## 🐛 Troubleshooting

### ❌ "Port already in use" Error
```bash
# Kill processes and restart
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
start
```

### ❌ Database Connection Issues
```bash
# Reset database
docker-compose -f docker-compose.dev.yml down -v
start
```

### ❌ Frontend Not Loading
```bash
# Clear npm cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..
start
```

### ❌ Permission Issues
```bash
# Fix file permissions
chmod +x start-dev.sh quick-start.sh bin/qc-start
sudo ln -sf /workspaces/qc-standards-app/bin/qc-start /usr/local/bin/start
sudo ln -sf /workspaces/qc-standards-app/bin/qc-start /usr/local/bin/qc
```

### ❌ Python Dependencies Issues
```bash
# Reinstall Python dependencies
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..
start
```

## 🔍 Health Checks

### Verify Services Are Running
```bash
# Check all services
curl -f http://localhost:8000/health || echo "Backend not ready"
curl -f http://localhost:5173 || echo "Frontend not ready"

# Check database
docker exec qc-standards-app-db-1 pg_isready -U postgres

# Check Redis
docker exec qc-standards-app-redis-1 redis-cli ping
```

## 🚀 VS Code Integration

The improved setup includes these VS Code extensions:

- **Python**: Advanced Python support with Pylance
- **TypeScript**: Enhanced TypeScript/JavaScript development
- **ESLint & Prettier**: Code formatting and linting
- **Tailwind CSS**: CSS utility class support
- **Docker**: Docker container management
- **Path Intellisense**: Intelligent path completion

## 🌟 Pro Tips

1. **Use Port Forwarding**: Codespaces automatically forwards ports, but you can manage them in the `PORTS` tab

2. **Environment Variables**: The setup automatically creates `.env` from `.env.example`. Modify as needed.

3. **Persistent Storage**: Database data persists across Codespace sessions using Docker volumes

4. **Multiple Terminals**: Open multiple terminals for different tasks:
   - Terminal 1: `start` (main application)
   - Terminal 2: `docker-compose logs -f` (view logs)
   - Terminal 3: Development commands

5. **Browser Integration**: Use the "Open in Browser" button in the PORTS tab for the best experience

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ You can access the frontend at the forwarded port
- ✅ API docs load at `http://localhost:8000/api/docs`
- ✅ No error messages in the terminal
- ✅ All ports show as "forwarded" in VS Code PORTS tab

## 📞 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs: `docker-compose -f docker-compose.dev.yml logs`
3. Restart everything: `docker-compose -f docker-compose.dev.yml down && start`
4. Create an issue in the repository

---

**🚀 Happy coding in Codespaces!**