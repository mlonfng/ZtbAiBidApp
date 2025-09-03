#!/bin/bash

# PRD New - Create Product Requirements Document

# Validate input
if [[ $# -eq 0 ]]; then
    echo "❌ Usage: /pm:prd-new <feature-name>"
    echo "   Feature name must be kebab-case (lowercase letters, numbers, hyphens only)"
    echo "   Examples: user-auth, payment-v2, notification-system"
    exit 1
fi

FEATURE_NAME="$1"

# Validate feature name format
if [[ ! "$FEATURE_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
    echo "❌ Feature name must be kebab-case (lowercase letters, numbers, hyphens only)."
    echo "   Examples: user-auth, payment-v2, notification-system"
    echo "   Received: $FEATURE_NAME"
    exit 1
fi

# Check if PRD directory exists
if [[ ! -d ".claude/prds" ]]; then
    mkdir -p ".claude/prds"
    if [[ $? -ne 0 ]]; then
        echo "❌ Cannot create PRD directory. Please manually create: .claude/prds/"
        exit 1
    fi
fi

# Check for existing PRD
PRD_FILE=".claude/prds/${FEATURE_NAME}.md"
if [[ -f "$PRD_FILE" ]]; then
    echo "⚠️ PRD '$FEATURE_NAME' already exists. Do you want to overwrite it? (yes/no)"
    read -r response
    if [[ "$response" != "yes" ]]; then
        echo "Use a different name or run: /pm:prd-parse $FEATURE_NAME to create an epic from the existing PRD"
        exit 0
    fi
fi

# Get current datetime
CURRENT_DATETIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create PRD content
echo "Creating PRD for: $FEATURE_NAME"
echo ""

# PRD content with frontmatter
PRD_CONTENT="---
name: $FEATURE_NAME
description: Comprehensive optimization of frontend, backend, and startup files with cleanup of unused test files
status: backlog
created: $CURRENT_DATETIME
---

# PRD: $FEATURE_NAME

## Executive Summary
This PRD outlines the comprehensive optimization of the ZtbAi智能投标助手 project, including frontend and backend code cleanup, removal of unused test files, startup file optimization, and ensuring all documentation and responses are in Chinese.

## Problem Statement
The current project has accumulated technical debt, unused test files, and inconsistent documentation. This optimization aims to improve code quality, reduce maintenance overhead, and ensure consistent Chinese language usage throughout the project.

## User Stories

### As a Developer
- I want clean, well-organized code so I can work efficiently
- I want unused test files removed so the project is easier to navigate
- I want optimized startup files so the application launches faster
- I want consistent Chinese documentation so I can understand the codebase

### As a Maintainer  
- I want reduced technical debt so maintenance is easier
- I want clear file structure so I can find components quickly
- I want comprehensive documentation so onboarding is faster

## Requirements

### Functional Requirements
1. **Code Optimization**
   - Analyze and refactor frontend React components
   - Optimize backend FastAPI services and endpoints
   - Clean up unused imports and dependencies
   - Standardize code formatting and style

2. **Test File Cleanup**
   - Identify and remove unused test files
   - Consolidate redundant test cases
   - Ensure remaining tests are comprehensive and working

3. **Startup Optimization**
   - Optimize package.json scripts and dependencies
   - Improve server startup configuration
   - Enhance build and deployment processes

4. **Documentation Localization**
   - Ensure all documentation is in Chinese
   - Maintain technical terminology consistency
   - Provide Chinese responses and error messages

### Non-Functional Requirements
1. **Performance**: No regression in application performance
2. **Compatibility**: Maintain backward compatibility with existing features
3. **Quality**: Improve code quality metrics (linting, test coverage)
4. **Maintainability**: Reduce technical debt and improve maintainability

## Success Criteria
- 20% reduction in unused code and files
- 15% improvement in application startup time
- 100% Chinese documentation coverage
- No breaking changes to existing functionality
- Improved developer satisfaction scores

## Constraints & Assumptions
- Must maintain all existing functionality
- Chinese documentation must preserve technical accuracy
- Optimization should not introduce new dependencies
- Timeline: 2-3 weeks for complete optimization

## Out of Scope
- Rewriting core business logic
- Changing database schema
- Adding new features
- Major architectural changes

## Dependencies
- Existing codebase structure
- Current development tools and pipelines
- Team availability for code reviews"

# Save PRD to file
echo "$PRD_CONTENT" > "$PRD_FILE"

if [[ $? -eq 0 ]]; then
    echo "✅ PRD created: $PRD_FILE"
    echo ""
    echo "📋 Summary:"
    echo "- Comprehensive project optimization plan"
    echo "- Frontend and backend code cleanup"
    echo "- Test file removal and consolidation"
    echo "- Chinese documentation standardization"
    echo "- Performance and maintainability improvements"
    echo ""
    echo "💡 Ready to create implementation epic? Run: /pm:prd-parse $FEATURE_NAME"
else
    echo "❌ Failed to create PRD file. Please check permissions."
    exit 1
fi