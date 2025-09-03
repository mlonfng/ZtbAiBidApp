---
created: 2025-09-03T11:38:30Z
last_updated: 2025-09-03T11:38:30Z
version: 1.0
author: Claude Code PM System
---

# System Patterns: ZtbAi智能投标助手

## Architectural Patterns

### Layered Architecture

The system follows a clean layered architecture:

```
Presentation Layer (Frontend)
    ↓
Application Layer (API Endpoints)  
    ↓
Business Layer (Services)
    ↓
Data Access Layer (ORM/Repository)
    ↓
Persistence Layer (Database)
```

### Backend Patterns

**FastAPI Modular Architecture:**
- **Router Pattern**: Each API domain has its own router module
- **Dependency Injection**: FastAPI's built-in DI for service access
- **Service Layer**: Business logic encapsulated in service classes
- **Repository Pattern**: Data access abstracted from business logic

**Example API Structure:**
```python
# FastAPI Router pattern
from fastapi import APIRouter, Depends
from .services import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/")
async def get_projects(service: ProjectService = Depends()):
    return await service.get_all_projects()
```

### Frontend Patterns

**React Component Architecture:**
- **Container/Presentational**: Separation of logic and presentation
- **Custom Hooks**: Reusable logic encapsulation
- **Context API**: Global state management where appropriate
- **Redux Toolkit**: Predictable state management for complex data

**TypeScript Patterns:**
- **Interface Segregation**: Specific interfaces for props and state
- **Generic Components**: Reusable components with type parameters
- **Utility Types**: Type helpers for common patterns

## Design Patterns in Use

### Factory Pattern
**AI Agent Creation:**
```python
# Agent factory pattern
class AgentFactory:
    @staticmethod
    def create_agent(agent_type: str, config: Dict) -> BaseAgent:
        if agent_type == "bid_analysis":
            return BidAnalysisAgent(config)
        elif agent_type == "bid_strategy":
            return BidStrategyAgent(config)
        # ... other agents
```

### Strategy Pattern
**Validation Strategies:**
```python
# Validation strategy pattern
class ValidationStrategy:
    def validate(self, document: Dict) -> ValidationResult:
        pass

class FormatValidation(ValidationStrategy):
    def validate(self, document: Dict) -> ValidationResult:
        # Format-specific validation logic
        pass
```

### Observer Pattern
**Event System:**
```python
# Event observer pattern
class EventPublisher:
    def __init__(self):
        self._observers = []
    
    def attach(self, observer):
        self._observers.append(observer)
    
    def notify(self, event):
        for observer in self._observers:
            observer.update(event)
```

### Builder Pattern
**Document Generation:**
```python
# Document builder pattern
class DocumentBuilder:
    def __init__(self):
        self.document = {}
    
    def add_section(self, section):
        self.document['sections'].append(section)
        return self
    
    def set_metadata(self, metadata):
        self.document['metadata'] = metadata
        return self
    
    def build(self):
        return self.document
```

## Data Flow Patterns

### Unidirectional Data Flow (Frontend)
```
Action → Reducer → Store → Component → UI
```

**Redux Toolkit Flow:**
1. Components dispatch actions
2. Reducers process actions and update state
3. Selectors extract specific data from state
4. Components re-render with new data

### Request-Response Flow (Backend)
```
HTTP Request → Middleware → Router → Service → Repository → Database
HTTP Response ← Middleware ← Router ← Service ← Repository ← Database
```

**API Request Processing:**
1. Request enters through FastAPI router
2. Middleware processes (auth, logging, etc.)
3. Route handler calls appropriate service
4. Service contains business logic
5. Repository handles data access
6. Response returned through middleware

## Concurrency Patterns

### Async/Await Pattern
**Python Async Operations:**
```python
# Async service pattern
class AIService:
    async def generate_content(self, prompt: str) -> str:
        # Async API call to OpenAI
        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
```

### Fire-and-Forget Pattern
**Background Processing:**
```python
# Fire-and-forget for long-running tasks
def fire_and_forget(coro):
    """Run async coroutine in dedicated daemon thread"""
    def _runner():
        asyncio.run(coro)
    t = threading.Thread(target=_runner, daemon=True)
    t.start()
```

## Error Handling Patterns

### Consistent Error Responses
**Structured Error Format:**
```python
# Standard error response pattern
def create_error_response(message: str, status_code: int = 500):
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
    )
```

### Exception Hierarchy
**Custom Exception Classes:**
```python
# Custom exception hierarchy
class AppException(Exception):
    """Base application exception"""
    pass

class ValidationError(AppException):
    """Validation-related errors"""
    pass

class AI ServiceError(AppException):
    """AI service communication errors"""
    pass
```

## Configuration Patterns

### Environment-based Configuration
**Configuration Management:**
```python
# Environment-aware configuration
class Config:
    def __init__(self):
        self.env = os.getenv("ENVIRONMENT", "development")
        self.load_config()
    
    def load_config(self):
        if self.env == "production":
            self.load_production_config()
        else:
            self.load_development_config()
```

### Dependency Injection Pattern
**FastAPI Dependency Injection:**
```python
# Dependency injection for services
def get_project_service() -> ProjectService:
    return ProjectService()

@router.get("/{project_id}")
async def get_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service)
):
    return await service.get_project(project_id)
```

## Testing Patterns

### Arrange-Act-Assert Pattern
**Test Structure:**
```python
# AAA testing pattern
def test_project_creation():
    # Arrange
    service = ProjectService()
    project_data = {"name": "Test Project"}
    
    # Act
    result = service.create_project(project_data)
    
    # Assert
    assert result.name == "Test Project"
    assert result.id is not None
```

### Mocking Pattern
**Service Mocking:**
```python
# Mocking external dependencies
@pytest.fixture
def mock_ai_service():
    with patch('app.services.ai_service.AIService') as mock:
        mock_instance = mock.return_value
        mock_instance.generate_content.return_value = "Mock content"
        yield mock_instance
```

## Performance Patterns

### Caching Pattern
**Response Caching:**
```python
# Simple caching implementation
class ResponseCache:
    def __init__(self):
        self._cache = {}
    
    def get(self, key):
        return self._cache.get(key)
    
    def set(self, key, value, ttl=300):
        self._cache[key] = {
            'value': value,
            'expires': time.time() + ttl
        }
```

### Connection Pooling
**Database Connection Management:**
```python
# SQLAlchemy connection pooling
engine = create_engine(
    "sqlite:///ztbai.db",
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800
)
```

## Security Patterns

### Input Validation
**Pydantic Validation:**
```python
# Pydantic model validation
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError("Project name cannot be empty")
        return v.strip()
```

### Sanitization Pattern
**Output Sanitization:**
```python
# HTML/XML sanitization
def sanitize_html(content: str) -> str:
    """Remove potentially dangerous HTML tags"""
    allowed_tags = {'p', 'br', 'strong', 'em', 'ul', 'li', 'ol'}
    # Sanitization logic here
    return sanitized_content
```

These patterns provide consistency, maintainability, and scalability across the ZtbAi bidding system architecture.