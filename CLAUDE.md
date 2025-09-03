# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Think carefully and implement the most concise solution that changes as little code as possible.

## Architecture Overview

**ZtbAi智能投标助手** is a full-stack AI-powered bidding system with:
- **Backend**: FastAPI Python server with AI agents for bid analysis and strategy
- **Frontend**: React TypeScript application with Ant Design and Monaco Editor
- **Database**: SQLite with Alembic migrations
- **Electron**: Desktop application packaging

### Core Services
- **AIService**: OpenAI integration for content generation
- **ValidationService**: Document validation and compliance checking
- **ProjectService**: Project management with SQLite persistence
- **BidAnalysisService**: AI-powered bid document analysis

### Agent System
- **BidAnalysisAgent**: Document analysis and requirement extraction
- **BidStrategyAgent**: Competitive analysis and strategy generation
- **Performance monitoring** with detailed metrics collection

## Development Commands

### Full Stack Development
```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start FastAPI server on port 9958
npm run dev:frontend     # Start React dev server on port 3000
```

### Build Commands
```bash
npm run build            # Build frontend for development
npm run build:production # Production build with optimizations
npm run dist            # Build Electron desktop application
```

### Testing
```bash
npm test                 # Run all tests
npm run test:backend     # Run Python backend tests
npm run test:frontend    # Run React frontend tests

# Run specific test files
cd backend && python -m pytest tests/test_file.py -v
cd frontend && npm test -- --testNamePattern="test pattern"
```

### Linting and Code Quality
```bash
npm run lint             # Run both backend and frontend linting
npm run lint:backend     # Python flake8 linting
npm run lint:frontend    # TypeScript ESLint

# Frontend specific
cd frontend && npm run format    # Prettier code formatting
cd frontend && npm run lint:fix # Auto-fix linting issues
```

### Database Management
```bash
# Alembic migrations
cd backend
alembic upgrade head     # Apply all pending migrations
alembic revision --autogenerate -m "description" # Create new migration
```

### API Compliance and Validation
```bash
npm run check:api-compliance    # Validate API route consistency
npm run check:routes           # Detect route conflicts
npm run check:errors           # Analyze error handling
npm run validate:step-api      # Validate Step API compliance
```

## Project Management System

This repository uses the **Claude Code PM** system for spec-driven development:

### Key Commands
```bash
/pm:init                 # Initialize PM system with GitHub integration
/pm:prd-new feature-name # Create Product Requirements Document
/pm:prd-parse feature-name # Convert PRD to technical epic
/pm:epic-oneshot feature-name # Decompose and sync to GitHub
/pm:issue-start 1234     # Start work on GitHub issue
/pm:next                 # Get next priority task
```

### Context Management
```bash
/context:create          # Create comprehensive project context
/context:update          # Update context with recent changes
/context:prime           # Load context into current conversation
```

### Testing with Agents
```bash
/testing:prime           # Configure testing framework
/testing:run             # Run tests with intelligent analysis
```

## File Structure Conventions

- **Backend APIs**: `backend/app/api/` with modular step-based endpoints
- **Frontend components**: `frontend/src/components/` with TypeScript
- **Database models**: SQLite with Alembic migrations in `backend/alembic/`
- **AI Agents**: `Agent/` directory with base and specialized implementations
- **Project context**: `.claude/context/` for AI-assisted development

## API Architecture

The backend uses a **Step API** pattern with these core modules:
- `service_mode.py` - Service configuration and health checks
- `bid_analysis.py` - Document analysis and AI processing
- `file_formatting.py` - Document formatting and template management
- `material_management.py` - Content and resource management
- `framework_generation.py` - Bid framework structure generation
- `content_generation.py` - AI-powered content creation
- `format_config.py` - Formatting configuration and validation
- `document_export.py` - Final document export and packaging

All APIs follow REST conventions with consistent error handling and response formats.

## Performance Considerations

- **Backend**: Uses performance middleware for request monitoring
- **Database**: SQLite with proper connection management
- **Frontend**: React with Redux for state management
- **Build**: Webpack optimization for production bundles

## Development Workflow

1. **Start services**: `npm run dev` for full stack development
2. **Run tests**: `npm test` before committing changes
3. **Lint code**: `npm run lint` to maintain code quality
4. **API validation**: `npm run check:api-compliance` for consistency
5. **Database**: Use Alembic for schema migrations

Follow existing patterns in the codebase for consistency across frontend and backend implementations.