---
created: 2025-09-03T11:38:30Z
last_updated: 2025-09-03T11:38:30Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide: ZtbAi智能投标助手

## Code Style Conventions

### Python Code Style

**General Rules:**
- **PEP 8 Compliance**: Follow Python PEP 8 style guide
- **Line Length**: 88 characters maximum (Black-compatible)
- **Indentation**: 4 spaces (no tabs)
- **Imports**: Grouped and ordered correctly

**Naming Conventions:**
- **Variables & Functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private**: `_single_leading_underscore`
- **Module**: `snake_case` for filenames

**Example:**
```python
# Good
def calculate_total_bid_price(unit_prices: List[float]) -> float:
    """Calculate total bid price from unit prices."""
    return sum(unit_prices)

class BidAnalysisAgent:
    MAX_ATTEMPTS = 3
    
    def __init__(self, config: Dict):
        self._config = config
```

### TypeScript/React Style

**General Rules:**
- **TypeScript Strict**: Enable strict mode in tsconfig
- **Functional Components**: Use React hooks and functional components
- **Imports**: Group external, internal, relative imports
- **Formatting**: Prettier with 2 spaces indentation

**Naming Conventions:**
- **Components**: `PascalCase` for files and components
- **Functions/Methods**: `camelCase`
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` with `I` prefix or without
- **Types**: `PascalCase`

**Example:**
```typescript
// Good
interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleClick = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  return (
    <div className="project-card">
      <h3>{project.name}</h3>
      {/* ... */}
    </div>
  );
};
```

## File Structure Patterns

### Python File Organization

**Module Structure:**
```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── projects.py      # API endpoints for projects
│   │   └── analysis.py      # API endpoints for analysis
│   ├── services/
│   │   ├── __init__.py
│   │   ├── project_service.py
│   │   └── analysis_service.py
│   └── models/
│       ├── __init__.py
│       ├── project.py
│       └── task.py
```

**File Content Structure:**
```python
"""
Module docstring describing purpose and usage.
"""

# Standard library imports
import os
from typing import List, Optional

# Third-party imports
from fastapi import APIRouter, Depends
from pydantic import BaseModel

# Local imports
from ..services import ProjectService
from ..models import Project

# Constants
DEFAULT_TIMEOUT = 30

# Router definition
router = APIRouter(prefix="/projects", tags=["Projects"])

# Data models
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

# API endpoints
@router.get("/")
async def get_projects(service: ProjectService = Depends()):
    """Get all projects."""
    return await service.get_all()
```

### React Component Structure

**Component Organization:**
```
frontend/src/
├── components/
│   ├── common/             # Reusable components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   └── Modal/
│   ├── projects/           # Feature-specific components
│   │   ├── ProjectList/
│   │   └── ProjectCard/
│   └── layout/             # Layout components
│       ├── Header/
│       └── Sidebar/
```

**Component File Structure:**
```typescript
// Button.tsx
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

## Documentation Standards

### Python Docstrings

**Function/Method Docstrings:**
```python
def calculate_bid_score(project: Project, bid: Bid) -> float:
    """
    Calculate the score for a bid against project requirements.
    
    Args:
        project: The project being bid on
        bid: The bid submission to score
        
    Returns:
        float: The calculated score between 0.0 and 100.0
        
    Raises:
        ValueError: If project or bid data is invalid
    """
    # Implementation...
```

**Class Docstrings:**
```python
class BidAnalysisAgent:
    """
    AI agent for analyzing bidding documents and requirements.
    
    This agent uses natural language processing to extract key
    requirements from bidding documents and assess compliance.
    
    Attributes:
        model: The AI model used for analysis
        config: Agent configuration settings
    """
    
    def __init__(self, model: str = "gpt-4"):
        """Initialize the agent with specified model."""
        self.model = model
        self.config = {}
```

### TypeScript Documentation

**Interface Documentation:**
```typescript
/**
 * Represents a bidding project with its metadata and status.
 */
interface Project {
  /** Unique identifier for the project */
  id: string;
  
  /** Name of the project */
  name: string;
  
  /** Current status of the project */
  status: ProjectStatus;
  
  /** Optional description of the project */
  description?: string;
}
```

**Component Documentation:**
```typescript
/**
 * Displays a project card with basic information and actions.
 * 
 * @example
 * <ProjectCard 
 *   project={project}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  // Implementation...
};
```

## Error Handling Patterns

### Python Error Handling

**Consistent Error Responses:**
```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse

# Standard error format
def create_error_response(message: str, status_code: int = 500):
    """Create consistent error response format."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
    )

# Custom exceptions
class AppException(Exception):
    """Base application exception."""
    
class ValidationError(AppException):
    """Validation-related errors."""
```

### TypeScript Error Handling

**Error Boundary Pattern:**
```typescript
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

## Testing Standards

### Python Testing

**Test Structure:**
```python
import pytest
from unittest.mock import Mock, patch
from app.services import ProjectService

# Test class organization
class TestProjectService:
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session fixture."""
        return Mock()
    
    def test_create_project_success(self, mock_db):
        """Test successful project creation."""
        # Arrange
        service = ProjectService(mock_db)
        project_data = {"name": "Test Project"}
        
        # Act
        result = service.create_project(project_data)
        
        # Assert
        assert result.name == "Test Project"
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
```

### React Testing

**Component Testing:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  test('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test</Button>);
    
    fireEvent.click(screen.getByText('Test'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Commit Message Convention

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test-related changes
- `chore`: Maintenance tasks

**Examples:**
```
feat(projects): add project deletion functionality

- Implement project delete API endpoint
- Add frontend delete confirmation modal
- Update project service with delete method

Closes #123
```

```
fix(validation): resolve date validation issue

- Fix date parsing in validation service
- Add additional test cases for edge dates
- Update error messages for better clarity
```

## Code Review Guidelines

### What to Look For
1. **Functionality**: Does it work as intended?
2. **Code Quality**: Follows style guide and patterns
3. **Testing**: Adequate test coverage
4. **Documentation**: Clear comments and docstrings
5. **Performance**: Efficient algorithms and data structures
6. **Security**: Proper input validation and error handling
7. **Accessibility**: UI components are accessible

### Review Process
1. **Small PRs**: Keep changes focused and reviewable
2. **Descriptive Titles**: Clear what the change accomplishes
3. **Testing Evidence**: Show that tests pass
4. **Screenshots**: For UI changes, include before/after
5. **Documentation**: Update relevant documentation

This style guide ensures consistency, maintainability, and quality across the ZtbAi codebase, enabling efficient collaboration and long-term project health.