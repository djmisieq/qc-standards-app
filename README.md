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

## Project Structure

```
qc-standards-app/
├── .github/                       # GitHub Actions workflows
├── .devcontainer/                 # Codespaces configuration
├── backend/                       # Python FastAPI backend
│   ├── app/
│   │   ├── api/                   # API endpoints
│   │   ├── core/                  # Core settings and security
│   │   ├── db/                    # Database models and session
│   │   ├── models/                # Data models
│   │   └── schemas/               # Pydantic schemas
│   ├── alembic/                   # Database migrations
│   ├── tests/                     # Backend tests
│   └── requirements.txt           # Python dependencies
├── frontend/                      # React SPA frontend
│   ├── public/                    # Static files
│   ├── src/
│   │   ├── api/                   # API client
│   │   ├── components/            # React components
│   │   ├── context/               # React context providers
│   │   ├── pages/                 # Page components
│   │   ├── types/                 # TypeScript type definitions
│   │   └── utils/                 # Utility functions
│   └── package.json               # JavaScript dependencies
├── templates/                     # Example QC templates
├── nginx/                         # Nginx configuration
└── docker-compose.yml             # Docker Compose configuration
```

## Using the Application

### User Roles

- **Admin**: Full system access, user management
- **QC Engineer**: Create/edit templates, approve checklists
- **Production Leader**: View templates, approve checklists
- **QC Operator**: Execute checklists
- **Viewer**: Read-only access to templates and checklists

### Workflow

1. **QC Engineer** creates a template with steps and requirements
2. **QC Engineer** publishes the template after review
3. **QC Operator** creates a new checklist based on the template
4. **QC Operator** executes the checklist, providing evidence as required
5. **Production Leader** approves or rejects the checklist
6. **QC Engineer** analyzes results and makes improvements to templates

## Offline Mode

The application supports offline operation with synchronization:

1. Data is cached locally using IndexedDB
2. Changes made offline are queued for synchronization
3. When connection is restored, data is synchronized automatically
4. Conflicts are resolved using a Last-Write-Wins strategy

## Deployment

### Production Setup

1. Set your production environment variables in `.env`
2. Deploy using Docker Compose:
   ```bash
   docker compose up -d
   ```

3. For secure deployments, configure HTTPS using a reverse proxy like Nginx and Let's Encrypt.

### Scaling

For larger deployments, consider:
- Using Docker Swarm or Kubernetes for container orchestration
- Implementing database replication for higher availability
- Setting up a CDN for static assets

## Contributing

### Development Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   ```

3. Push your branch and create a Pull Request to `develop`
4. After review and approval, the PR will be merged
5. Release PRs merge from `develop` to `main`

### Coding Standards

- Backend: Follow PEP 8 style guide for Python code
- Frontend: Use ESLint and Prettier for JavaScript/TypeScript code
- Write tests for all new features and bug fixes
- Use descriptive commit messages following conventional commits style

## License

This project is proprietary and confidential. Unauthorized copying, transferring, or reproduction of the contents of this project, via any medium, is strictly prohibited.

## Contact

For questions or support, please contact [your-team@example.com](mailto:your-team@example.com).
