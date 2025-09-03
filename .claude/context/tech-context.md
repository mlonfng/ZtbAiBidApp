---
created: 2025-09-03T11:38:30Z
last_updated: 2025-09-03T11:38:30Z
version: 1.0
author: Claude Code PM System
---

# Technology Context: ZtbAi智能投标助手

## Core Technologies

### Backend Stack
- **Python 3.9+**: Primary backend language
- **FastAPI 0.104.0+**: Modern async web framework
- **SQLAlchemy 2.0+**: Database ORM and query building
- **Uvicorn**: ASGI server for FastAPI
- **Pydantic 2.5+**: Data validation and settings management

### Frontend Stack
- **React 18.2.0**: UI framework with hooks
- **TypeScript 4.9.5**: Type-safe JavaScript
- **Ant Design 5.12.8**: UI component library
- **Redux Toolkit 1.9.7**: State management
- **Monaco Editor**: Code editor component

### Development Tools
- **Node.js 16+**: JavaScript runtime for frontend
- **npm**: Package manager for JavaScript
- **pip**: Package manager for Python
- **Alembic**: Database migration tool
- **ESLint & Prettier**: Code linting and formatting

## Dependencies Overview

### Backend Dependencies (`backend/requirements.txt`)

**Core Framework:**
- `fastapi>=0.104.0` - Web framework with OpenAPI
- `uvicorn[standard]>=0.24.0` - ASGI server
- `sqlalchemy>=2.0.0` - Database ORM
- `pydantic>=2.5.0` - Data validation
- `python-multipart>=0.0.6` - File upload support

**AI Integration:**
- `openai>=1.3.0` - OpenAI API client
- `httpx>=0.25.0` - Async HTTP client

**Utilities:**
- `python-dotenv>=1.0.0` - Environment variables
- `requests>=2.31.0` - HTTP requests
- `alembic>=1.13.1` - Database migrations

### Frontend Dependencies (`frontend/package.json`)

**Core Libraries:**
- `react@18.2.0` - UI framework
- `react-dom@18.2.0` - DOM rendering
- `typescript@4.9.5` - Type safety
- `antd@5.12.8` - UI components
- `@reduxjs/toolkit@1.9.7` - State management
- `react-redux@8.1.3` - React bindings

**Editor & UI:**
- `@monaco-editor/react@4.6.0` - Code editor
- `monaco-editor@0.44.0` - Editor engine
- `react-flow-renderer@10.3.17` - Flow diagrams
- `react-dnd@16.0.1` - Drag and drop

**Development:**
- `@typescript-eslint/eslint-plugin@6.13.1` - TS linting
- `eslint@8.54.0` - JavaScript linting
- `prettier@3.1.0` - Code formatting
- `webpack-bundle-analyzer@4.9.0` - Bundle analysis

**Testing:**
- `@testing-library/react@16.3.0` - React testing
- `@testing-library/jest-dom@6.8.0` - DOM testing
- `playwright@1.55.0` - E2E testing
- `@axe-core/react@4.10.2` - Accessibility testing

**Electron Desktop:**
- `electron@28.1.0` - Desktop app framework
- `electron-builder@24.9.1` - App packaging

## Development Environment

### Supported Platforms
- **Windows**: Primary development platform
- **Linux**: Supported for backend development
- **macOS**: Supported for full-stack development

### Runtime Requirements
- **Python**: 3.9 or higher
- **Node.js**: 16.0.0 or higher
- **SQLite**: 3.35+ (bundled with Python)
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Disk**: 2GB free space for dependencies

### Build Tools
- **Frontend Build**: React Scripts (CRA) with Webpack
- **Backend Server**: Uvicorn with hot reload
- **Desktop Build**: Electron Builder
- **Database Migrations**: Alembic

## API Technology Stack

### Server Architecture
- **Protocol**: HTTP/1.1 with RESTful APIs
- **Serialization**: JSON with Pydantic models
- **Authentication**: (To be implemented)
- **CORS**: Enabled for all origins in development
- **Rate Limiting**: (To be implemented)

### Database Technology
- **Database**: SQLite 3.x
- **ORM**: SQLAlchemy 2.0 with async support
- **Migrations**: Alembic with version control
- **Connection Pooling**: SQLAlchemy built-in

### Performance Monitoring
- **Middleware**: Custom performance tracking
- **Metrics**: Response times, error rates, throughput
- **Logging**: Structured logging with rotation
- **Health Checks**: Comprehensive service health monitoring

## Development Workflow Tools

### Code Quality
- **Python Linting**: flake8 with style guides
- **TypeScript Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style
- **Type Checking**: TypeScript compiler and mypy (Python)

### Testing Strategy
- **Unit Tests**: pytest for Python, Jest for TypeScript
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for browser automation
- **Performance Tests**: Lighthouse and custom metrics

### Build & Deployment
- **Development Build**: Hot reload for both frontend and backend
- **Production Build**: Optimized bundles with minification
- **Desktop Packaging**: Electron builder for cross-platform distribution
- **Database Migrations**: Automated schema updates

## Integration Points

### External Services
- **OpenAI API**: For AI content generation and analysis
- **File Processing**: Local file system operations
- **(Future) Cloud Storage**: For document persistence
- **(Future) Authentication**: OAuth2 or JWT-based auth

### Development Integrations
- **GitHub**: Potential source control integration
- **CI/CD**: (To be implemented) GitHub Actions or similar
- **Monitoring**: (To be implemented) Application performance monitoring
- **Logging**: (To be implemented) Centralized log management