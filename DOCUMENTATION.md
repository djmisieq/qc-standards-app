# QC Standards Application Documentation

[English](#english) | [Polski](#polski)

<a name="english"></a>
## English

### 1. Project Overview

The QC Standards Application is a comprehensive web-based system for managing Quality Control standards and checklists in manufacturing environments. It replaces static PDF files with an interactive, version-controlled system for defining, executing, and analyzing quality control standards.

### 2. Current Project State

The application has been implemented according to the functional requirements, with the following key features:

- **Authentication and Authorization**: JWT-based authentication with role-based access control
- **Template Management**: Creation, editing, and versioning of QC templates
- **Checklist Execution**: Interactive execution of QC checks with validation
- **Photo Evidence**: Capture and storage of photo evidence for quality control steps
- **Offline Support**: Local caching with synchronization when back online
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 3. Technical Architecture

#### 3.1 Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLModel ORM
- **Authentication**: JWT tokens
- **Caching**: Redis
- **API Documentation**: OpenAPI (Swagger)

#### 3.2 Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Data Fetching**: SWR for caching and revalidation
- **Build Tool**: Vite

#### 3.3 Infrastructure
- **Containerization**: Docker and Docker Compose
- **CI/CD**: GitHub Actions
- **Web Server**: Nginx for static files and API proxy

### 4. Directory Structure

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

### 5. API Endpoints

The API is organized around these main endpoints:

- `/api/v1/auth` - Authentication and user management
- `/api/v1/templates` - Template management
- `/api/v1/steps` - Template steps management
- `/api/v1/checklists` - Checklist execution and review
- `/api/v1/sync` - Offline synchronization

### 6. User Roles

The system implements role-based access control with the following roles:

- **Admin**: Full system access, user management
- **QC Engineer**: Create/edit templates, approve checklists
- **Production Leader**: View templates, approve checklists
- **QC Operator**: Execute checklists
- **Viewer**: Read-only access to templates and checklists

### 7. Workflows

#### 7.1 Template Management Workflow
1. QC Engineer creates a new template
2. QC Engineer adds steps to the template
3. QC Engineer publishes the template
4. Template becomes available for checklist execution

#### 7.2 Checklist Execution Workflow
1. QC Operator selects a template to create a checklist
2. QC Operator executes each step, marking OK/NOK and providing evidence as required
3. QC Operator completes the checklist
4. Production Leader reviews and approves or rejects the checklist

### 8. Setup Instructions

#### 8.1 Prerequisites
- Docker and Docker Compose
- Git

#### 8.2 Development Setup
1. Clone the repository
   ```bash
   git clone https://github.com/your-org/qc-standards-app.git
   cd qc-standards-app
   ```

2. Create environment file
   ```bash
   cp .env.example .env
   ```

3. Start the development environment
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. Install backend dependencies
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

5. Start the backend server
   ```bash
   uvicorn app.main:app --reload
   ```

6. Install frontend dependencies
   ```bash
   cd frontend
   npm install
   ```

7. Start the frontend development server
   ```bash
   npm run dev
   ```

8. Access the application
   - Frontend: http://localhost:5173
   - API Documentation: http://localhost:8000/api/docs

### 9. Future Enhancements

The following features are planned for future development:

- Enhanced analytics dashboard with KPIs
- Integration with ERP/MES systems
- Barcode/QR code scanning for product identification
- Mobile app version with native camera integration
- Multi-language support beyond Polish and English

<a name="polski"></a>
## Polski

### 1. Przegląd Projektu

Aplikacja QC Standards to kompleksowy system internetowy do zarządzania standardami kontroli jakości oraz listami kontrolnymi w środowiskach produkcyjnych. Zastępuje statyczne pliki PDF interaktywnym, wersjonowanym systemem do definiowania, wykonywania i analizowania standardów kontroli jakości.

### 2. Aktualny Stan Projektu

Aplikacja została zaimplementowana zgodnie z wymaganiami funkcjonalnymi, z następującymi kluczowymi funkcjami:

- **Uwierzytelnianie i Autoryzacja**: Uwierzytelnianie oparte na JWT z kontrolą dostępu opartą na rolach
- **Zarządzanie Szablonami**: Tworzenie, edycja i wersjonowanie szablonów QC
- **Wykonywanie List Kontrolnych**: Interaktywne wykonywanie kontroli QC z walidacją
- **Dokumentacja Fotograficzna**: Przechwytywanie i przechowywanie zdjęć jako dowodów dla kroków kontroli jakości
- **Obsługa Trybu Offline**: Lokalne buforowanie z synchronizacją po przywróceniu połączenia
- **Responsywny Design**: Działa na komputerach stacjonarnych, tabletach i urządzeniach mobilnych

### 3. Architektura Techniczna

#### 3.1 Backend
- **Framework**: FastAPI (Python)
- **Baza danych**: PostgreSQL z ORM SQLModel
- **Uwierzytelnianie**: Tokeny JWT
- **Buforowanie**: Redis
- **Dokumentacja API**: OpenAPI (Swagger)

#### 3.2 Frontend
- **Framework**: React z TypeScript
- **Stylizacja**: Tailwind CSS
- **Zarządzanie Stanem**: React Context API
- **Pobieranie Danych**: SWR do buforowania i rewalidacji
- **Narzędzie Budowania**: Vite

#### 3.3 Infrastruktura
- **Konteneryzacja**: Docker i Docker Compose
- **CI/CD**: GitHub Actions
- **Serwer WWW**: Nginx dla plików statycznych i proxy API

### 4. Struktura Katalogów

```
qc-standards-app/
├── .github/                       # Przepływy pracy GitHub Actions
├── .devcontainer/                 # Konfiguracja Codespaces
├── backend/                       # Backend FastAPI (Python)
│   ├── app/
│   │   ├── api/                   # Endpointy API
│   │   ├── core/                  # Ustawienia podstawowe i bezpieczeństwo
│   │   ├── db/                    # Modele bazy danych i sesja
│   │   ├── models/                # Modele danych
│   │   └── schemas/               # Schematy Pydantic
│   ├── alembic/                   # Migracje bazy danych
│   ├── tests/                     # Testy backendu
│   └── requirements.txt           # Zależności Pythona
├── frontend/                      # Frontend React SPA
│   ├── public/                    # Pliki statyczne
│   ├── src/
│   │   ├── api/                   # Klient API
│   │   ├── components/            # Komponenty React
│   │   ├── context/               # Providery kontekstu React
│   │   ├── pages/                 # Komponenty stron
│   │   ├── types/                 # Definicje typów TypeScript
│   │   └── utils/                 # Funkcje narzędziowe
│   └── package.json               # Zależności JavaScript
├── templates/                     # Przykładowe szablony QC
├── nginx/                         # Konfiguracja Nginx
└── docker-compose.yml             # Konfiguracja Docker Compose
```

### 5. Endpointy API

API jest zorganizowane wokół następujących głównych endpointów:

- `/api/v1/auth` - Uwierzytelnianie i zarządzanie użytkownikami
- `/api/v1/templates` - Zarządzanie szablonami
- `/api/v1/steps` - Zarządzanie krokami szablonów
- `/api/v1/checklists` - Wykonywanie i przeglądanie list kontrolnych
- `/api/v1/sync` - Synchronizacja trybu offline

### 6. Role Użytkowników

System implementuje kontrolę dostępu opartą na rolach z następującymi rolami:

- **Admin**: Pełny dostęp do systemu, zarządzanie użytkownikami
- **Inżynier QC**: Tworzenie/edycja szablonów, zatwierdzanie list kontrolnych
- **Lider Produkcji**: Przeglądanie szablonów, zatwierdzanie list kontrolnych
- **Operator QC**: Wykonywanie list kontrolnych
- **Przeglądający**: Dostęp tylko do odczytu dla szablonów i list kontrolnych

### 7. Przepływy Pracy

#### 7.1 Przepływ Zarządzania Szablonami
1. Inżynier QC tworzy nowy szablon
2. Inżynier QC dodaje kroki do szablonu
3. Inżynier QC publikuje szablon
4. Szablon staje się dostępny do wykonywania list kontrolnych

#### 7.2 Przepływ Wykonywania List Kontrolnych
1. Operator QC wybiera szablon do utworzenia listy kontrolnej
2. Operator QC wykonuje każdy krok, oznaczając OK/NOK i dostarczając dowody, jeśli są wymagane
3. Operator QC kończy listę kontrolną
4. Lider Produkcji przegląda i zatwierdza lub odrzuca listę kontrolną

### 8. Instrukcje Konfiguracji

#### 8.1 Wymagania Wstępne
- Docker i Docker Compose
- Git

#### 8.2 Konfiguracja Środowiska Deweloperskiego
1. Klonowanie repozytorium
   ```bash
   git clone https://github.com/your-org/qc-standards-app.git
   cd qc-standards-app
   ```

2. Utworzenie pliku środowiskowego
   ```bash
   cp .env.example .env
   ```

3. Uruchomienie środowiska deweloperskiego
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. Instalacja zależności backendu
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

5. Uruchomienie serwera backendu
   ```bash
   uvicorn app.main:app --reload
   ```

6. Instalacja zależności frontendu
   ```bash
   cd frontend
   npm install
   ```

7. Uruchomienie serwera deweloperskiego frontendu
   ```bash
   npm run dev
   ```

8. Dostęp do aplikacji
   - Frontend: http://localhost:5173
   - Dokumentacja API: http://localhost:8000/api/docs

### 9. Przyszłe Rozszerzenia

Następujące funkcje są planowane do przyszłego rozwoju:

- Rozszerzony dashboard analityczny z KPI
- Integracja z systemami ERP/MES
- Skanowanie kodów kreskowych/QR do identyfikacji produktów
- Wersja aplikacji mobilnej z natywną integracją aparatu
- Wsparcie dla wielu języków poza polskim i angielskim
