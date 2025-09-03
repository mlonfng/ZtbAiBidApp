---
created: 2025-09-03T11:38:30Z
last_updated: 2025-09-03T11:38:30Z
version: 1.0
author: Claude Code PM System
---

# Project Overview: ZtbAi智能投标助手

## High-Level Summary

**ZtbAi智能投标助手** (ZtbAi Intelligent Bidding Assistant) is a full-stack AI-powered bidding system designed to automate and enhance the bidding document creation process. The system combines AI analysis with structured document generation for competitive bidding scenarios.

## Core Features

- **AI-Powered Analysis**: Automated analysis of bidding documents using AI agents
- **Document Generation**: Structured bid document creation with templates
- **Real-time Validation**: Compliance checking and validation services
- **Project Management**: Complete project lifecycle management
- **Desktop Application**: Electron-based desktop app for offline usage

## System Architecture

### Frontend
- **React TypeScript** with Ant Design components
- **Monaco Editor** for rich text editing
- **Redux Toolkit** for state management
- **Electron** for desktop packaging

### Backend  
- **FastAPI** Python server with async capabilities
- **SQLite** database with Alembic migrations
- **AI Agent System** for document analysis and strategy
- **Performance Monitoring** with detailed metrics

### AI Integration
- **OpenAI API** integration for content generation
- **Custom AI Agents** for specialized bidding tasks
- **Performance tracking** with response time monitoring

## Current State

The project is actively developed with:
- Functional backend API server running on port 9958
- React frontend with comprehensive UI components
- Database schema with project and task management
- AI agent system with performance monitoring
- Desktop application build configuration

## Integration Points

- **API Endpoints**: RESTful APIs with consistent error handling
- **Database**: SQLite with migration support via Alembic
- **File Storage**: Local file system for document storage
- **External Services**: OpenAI API integration for AI capabilities

## Development Status

- ✅ Backend API server operational
- ✅ Frontend React application running
- ✅ Database schema implemented
- ✅ AI agent system integrated
- ✅ Desktop packaging configured
- 🔄 Ongoing feature development
- 🔄 Performance optimization
- 🔄 Testing and validation improvements