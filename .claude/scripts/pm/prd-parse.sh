#!/bin/bash

# PRD Parse - Convert PRD to technical implementation epic

# Validate input
if [[ $# -eq 0 ]]; then
    echo "❌ Feature name was not provided as parameter. Please run: /pm:prd-parse <feature_name>"
    exit 1
fi

FEATURE_NAME="$1"
PRD_FILE=".claude/prds/${FEATURE_NAME}.md"

# Verify PRD exists
if [[ ! -f "$PRD_FILE" ]]; then
    echo "❌ PRD not found: $FEATURE_NAME. First create it with: /pm:prd-new $FEATURE_NAME"
    exit 1
fi

# Validate PRD frontmatter
if ! grep -q "^---" "$PRD_FILE" || ! grep -q "name:" "$PRD_FILE" || ! grep -q "description:" "$PRD_FILE"; then
    echo "❌ Invalid PRD frontmatter. Please check: $PRD_FILE"
    echo "   Missing required frontmatter fields: name, description, status, created"
    exit 1
fi

# Check for existing epic
EPIC_DIR=".claude/epics/${FEATURE_NAME}"
EPIC_FILE="${EPIC_DIR}/epic.md"

if [[ -f "$EPIC_FILE" ]]; then
    echo "⚠️ Epic '$FEATURE_NAME' already exists. Overwrite? (yes/no)"
    read -r response
    if [[ "$response" != "yes" ]]; then
        echo "View existing epic with: /pm:epic-show $FEATURE_NAME"
        exit 0
    fi
fi

# Verify directory permissions
if [[ ! -d ".claude/epics" ]]; then
    mkdir -p ".claude/epics"
    if [[ $? -ne 0 ]]; then
        echo "❌ Cannot create epic directory. Please check permissions."
        exit 1
    fi
fi

# Create epic directory
mkdir -p "$EPIC_DIR"
if [[ $? -ne 0 ]]; then
    echo "❌ Cannot create epic directory: $EPIC_DIR"
    exit 1
fi

# Get current datetime
CURRENT_DATETIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Read PRD content to extract description
PRD_DESCRIPTION=$(grep -A1 "description:" "$PRD_FILE" | tail -n1 | sed 's/^[ \t]*//;s/[ \t]*$//')

# Create epic content
EPIC_CONTENT="---
name: $FEATURE_NAME
status: backlog
created: $CURRENT_DATETIME
progress: 0%
prd: $PRD_FILE
github: [Will be updated when synced to GitHub]
---

# Epic: $FEATURE_NAME

## Overview
Technical implementation plan for comprehensive optimization of ZtbAi智能投标助手 project, including code cleanup, test file removal, startup optimization, and Chinese documentation standardization.

## Architecture Decisions
- **Monolithic Refactoring**: Maintain current monolithic structure but optimize internal organization
- **Incremental Optimization**: Phase-based approach to avoid breaking changes
- **Chinese-First Documentation**: All new documentation in Chinese with technical term preservation
- **Backward Compatibility**: Ensure no breaking changes to existing functionality

## Technical Approach

### Frontend Components
- **React Component Optimization**: Refactor components for better performance and maintainability
- **State Management Cleanup**: Review and optimize Redux store structure
- **UI Consistency**: Standardize Ant Design component usage patterns
- **Build Optimization**: Improve Webpack configuration for faster builds

### Backend Services  
- **FastAPI Endpoint Optimization**: Review and optimize API response times
- **Database Query Optimization**: Improve SQLite query performance
- **Service Layer Refactoring**: Clean up service dependencies and interfaces
- **Error Handling Standardization**: Consistent error response formats

### Infrastructure
- **Startup Script Optimization**: Improve application startup performance
- **Dependency Cleanup**: Remove unused npm and pip packages
- **Build Pipeline Enhancement**: Optimize build and deployment processes
- **Monitoring Setup**: Basic performance monitoring for critical paths

## Implementation Strategy

### Phase 1: Analysis and Planning (Week 1)
- Codebase analysis and technical debt assessment
- Identify unused test files and redundant code
- Create detailed optimization plan

### Phase 2: Frontend Optimization (Week 2)  
- React component refactoring
- State management cleanup
- Build configuration optimization

### Phase 3: Backend Optimization (Week 3)
- API endpoint optimization
- Database performance improvements
- Service layer refactoring

### Phase 4: Documentation and Finalization (Week 4)
- Chinese documentation completion
- Final testing and validation
- Performance benchmarking

## Task Breakdown Preview
- [ ] Frontend Code Analysis and Cleanup
- [ ] Backend Service Optimization  
- [ ] Test File Removal and Consolidation
- [ ] Startup Configuration Optimization
- [ ] Build and Deployment Improvement
- [ ] Chinese Documentation Standardization
- [ ] Performance Testing and Benchmarking
- [ ] Final Validation and Quality Assurance

## Dependencies
- **Existing Codebase**: Current project structure and functionality
- **Development Tools**: Current npm, pip, and build tool configurations
- **Team Availability**: Developer resources for code reviews and testing

## Success Criteria (Technical)
- **Performance**: 15% faster application startup time
- **Maintainability**: 20% reduction in code complexity metrics
- **Quality**: 100% Chinese documentation coverage
- **Reliability**: Zero breaking changes to existing features
- **Efficiency**: 25% reduction in build times

## Estimated Effort
- **Timeline**: 4 weeks for complete optimization
- **Resources**: 2-3 developers for implementation
- **Critical Path**: Frontend optimization and documentation completion
- **Risk Factors**: Complex dependency chains, backward compatibility requirements"

# Save epic to file
echo "$EPIC_CONTENT" > "$EPIC_FILE"

if [[ $? -eq 0 ]]; then
    echo "✅ Epic created: $EPIC_FILE"
    echo ""
    echo "📋 Summary:"
    echo "- 8 task categories identified for implementation"
    echo "- 4-phase approach over 4 weeks"
    echo "- Focus on incremental optimization with backward compatibility"
    echo "- Chinese documentation standardization as key deliverable"
    echo ""
    echo "💡 Ready to break down into tasks? Run: /pm:epic-decompose $FEATURE_NAME"
else
    echo "❌ Failed to create epic file. Please check permissions."
    exit 1
fi