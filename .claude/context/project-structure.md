---
created: 2025-09-03T11:38:30Z
last_updated: 2025-09-03T11:38:30Z
version: 1.0
author: Claude Code PM System
---

# Project Structure: ZtbAi智能投标助手

## Root Directory Organization

```
ZtbAiBidApp_ClaudeCode/
├── backend/                 # FastAPI Python backend
├── frontend/                # React TypeScript frontend
├── .claude/                 # Claude Code PM system
├── Agent/                   # AI agent implementations
├── ZtbBidPro/               # Project data storage
├── docs/                    # Documentation
├── logs/                    # Application logs
├── scripts/                 # Utility scripts
├── temp_*/                  # Temporary directories
└── Various configuration files
```

## Backend Structure (`backend/`)

```
backend/
├── app/                     # FastAPI application modules
│   ├── api/                 # API endpoint modules
│   │   ├── steps/           # Step-based API endpoints
│   │   └── project.py       # Project management API
│   ├── core/                # Core application components
│   ├── services/            # Business logic services
│   └── shared_state.py      # Shared application state
├── alembic/                 # Database migrations
├── core/                    # Core utilities
├── data/                    # Data files
├── migrations/              # Database schema migrations
├── tests/                   # Backend tests
├── tools/                   # Development tools
├── new_api_server.py        # Main server entry point
├── requirements.txt         # Python dependencies
└── ztbai.db                 # SQLite database
```

## Frontend Structure (`frontend/`)

```
frontend/
├── src/
│   ├── components/          # React components
│   ├── pages/               # Application pages
│   ├── services/            # API service integrations
│   ├── store/               # Redux state management
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript type definitions
│   └── App.tsx              # Main application component
├── public/                  # Static assets
├── build/                   # Production build output
├── e2e-screenshots/         # End-to-end test screenshots
├── playwright-report/       # Playwright test reports
└── package.json             # Node.js dependencies
```

## AI Agent Structure (`Agent/`)

```
Agent/
├── base/                    # Base agent classes
│   ├── agent_manager.py     # Agent management
│   └── base_agent.py        # Base agent implementation
├── analysis/                # Analysis agents
│   ├── bid_analysis_agent.py    # Bid document analysis
│   └── bid_strategy_agent.py    # Bidding strategy
└── Various agent configuration files
```

## Claude Code PM Structure (`.claude/`)

```
.claude/
├── agents/                  # Specialized agent definitions
├── commands/                # Command implementations
├── context/                 # Project context (this directory)
├── epics/                   # Epic planning files
├── prds/                    # Product requirements documents
├── rules/                   # Development rules
├── scripts/                 # Utility scripts
├── CLAUDE.md                # Main instructions
├── COMMANDS.md              # Command reference
└── AGENTS.md                # Agent system documentation
```

## Key Configuration Files

### Root Level
- `package.json` - Main npm configuration with full-stack scripts
- `CLAUDE.md` - Claude Code instructions for this repository
- `README.md` - Comprehensive project documentation
- `COMMANDS.md` - Command reference for PM system
- `AGENTS.md` - Agent system documentation

### Backend Configuration
- `backend/requirements.txt` - Python dependencies
- `backend/alembic.ini` - Database migration configuration
- `backend/ztbai_config.json` - Application configuration

### Frontend Configuration  
- `frontend/package.json` - React application dependencies
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/craco.config.js` - Create React App configuration

## File Naming Conventions

- **Python files**: snake_case (e.g., `bid_analysis_agent.py`)
- **TypeScript files**: camelCase (e.g., `projectService.ts`)
- **Component files**: PascalCase (e.g., `ProjectList.tsx`)
- **Configuration files**: lowercase with extensions (e.g., `package.json`)
- **Test files**: `test_` prefix or `*.spec.ts` pattern

## Module Organization Patterns

- **Backend**: Modular FastAPI routers with service separation
- **Frontend**: Feature-based component organization with Redux
- **AI Agents**: Base classes with specialized implementations
- **Database**: SQLite with Alembic migration management

## Development Directories

- `temp_ocr/` - Temporary OCR processing files
- `temp_uploads/` - Temporary file uploads
- `temp_pdf_split/` - PDF processing temporary files
- `logs/` - Application log files
- `debug_archive/` - Debug information archive