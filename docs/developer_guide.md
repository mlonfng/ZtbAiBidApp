# ZtbAiBidApp 开发者指南

## 📋 目录

1. [开发环境搭建](#开发环境搭建)
2. [项目架构](#项目架构)
3. [开发规范](#开发规范)
4. [测试指南](#测试指南)
5. [贡献指南](#贡献指南)

## 开发环境搭建

### 前置要求

- **Node.js**: 16.0+
- **Python**: 3.9+
- **Git**: 2.0+
- **IDE**: VS Code (推荐)

### 环境配置

#### 1. 克隆项目
```bash
git clone https://github.com/your-org/ZtbAiBidApp.git
cd ZtbAiBidApp
```

#### 2. 后端环境
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

#### 3. 前端环境
```bash
cd frontend
npm install
```

#### 4. 环境变量
```bash
cp .env.example .env
# 编辑 .env 文件配置必要参数
```

#### 5. 数据库初始化
```bash
python database/init_database.py
```

### VS Code配置

#### 推荐插件
- Python
- Pylance
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint

#### 工作区配置 (.vscode/settings.json)
```json
{
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 项目架构

### 整体架构

```
ZtbAiBidApp/
├── frontend/           # React前端应用
├── agents/            # AI Agent模块
├── workflow/          # 工作流引擎
├── framework/         # 框架构建器
├── database/          # 数据库模块
├── config/           # 配置文件
├── tests/            # 测试文件
└── docs/             # 文档
```

### 前端架构

#### 技术栈
- **React 18**: UI框架
- **TypeScript**: 类型安全
- **Redux Toolkit**: 状态管理
- **Ant Design**: UI组件库
- **React Router**: 路由管理

#### 目录结构
```
frontend/src/
├── components/       # 可复用组件
│   ├── Editor/      # 编辑器组件
│   ├── Workflow/    # 工作流组件
│   ├── Agent/       # Agent组件
│   └── ...
├── pages/           # 页面组件
├── store/           # Redux状态管理
├── utils/           # 工具函数
├── types/           # TypeScript类型
├── hooks/           # 自定义Hooks
└── services/        # API服务
```

### 后端架构

#### 技术栈
- **Python 3.9+**: 主要语言
- **FastAPI**: Web框架
- **SQLAlchemy**: ORM
- **Pydantic**: 数据验证
- **Celery**: 异步任务

#### 模块设计
```python
# agents/base_agent.py
class BaseAgent:
    def __init__(self, config):
        self.config = config
    
    async def execute(self, input_data):
        raise NotImplementedError

# workflow/workflow_engine.py
class WorkflowEngine:
    def __init__(self):
        self.agents = {}
    
    async def execute_workflow(self, workflow_config):
        # 工作流执行逻辑
        pass
```

## 开发规范

### 代码规范

#### Python代码规范
- 遵循 PEP 8 标准
- 使用 Black 格式化代码
- 使用 Pylint 进行代码检查
- 函数和类必须有文档字符串

```python
def analyze_requirements(requirements: str) -> Dict[str, Any]:
    """
    分析投标需求文档
    
    Args:
        requirements: 需求文档内容
        
    Returns:
        Dict[str, Any]: 分析结果
        
    Raises:
        ValueError: 当需求文档为空时
    """
    if not requirements.strip():
        raise ValueError("需求文档不能为空")
    
    # 分析逻辑
    return {"keywords": [], "requirements": []}
```

#### TypeScript代码规范
- 使用严格的TypeScript配置
- 优先使用函数式组件和Hooks
- 组件必须有PropTypes或TypeScript接口
- 使用Prettier格式化代码

```typescript
interface ProjectProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectProps> = ({ project, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  const handleUpdate = useCallback(async () => {
    setLoading(true);
    try {
      await updateProject(project.id, project);
      onUpdate(project);
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  }, [project, onUpdate]);
  
  return (
    <Card loading={loading}>
      {/* 组件内容 */}
    </Card>
  );
};
```

### Git工作流

#### 分支策略
- `main`: 主分支，生产环境代码
- `develop`: 开发分支，集成最新功能
- `feature/*`: 功能分支
- `hotfix/*`: 热修复分支
- `release/*`: 发布分支

#### 提交规范
使用 Conventional Commits 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(editor): 添加拖拽组件功能

- 实现组件拖拽到画布
- 添加拖拽预览效果
- 支持组件位置调整

Closes #123
```

### API设计规范

#### RESTful API设计
- 使用名词表示资源
- 使用HTTP动词表示操作
- 使用复数形式的资源名
- 合理使用HTTP状态码

```
GET    /api/projects        # 获取项目列表
POST   /api/projects        # 创建项目
GET    /api/projects/{id}   # 获取项目详情
PUT    /api/projects/{id}   # 更新项目
DELETE /api/projects/{id}   # 删除项目
```

#### 响应格式标准化
```python
from pydantic import BaseModel
from typing import Optional, Any

class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: str = ""
    error: Optional[dict] = None
    timestamp: str
```

## 测试指南

### 测试策略

#### 测试金字塔
- **单元测试**: 70% - 测试单个函数/组件
- **集成测试**: 20% - 测试模块间交互
- **端到端测试**: 10% - 测试完整用户流程

### 后端测试

#### 单元测试
```python
import pytest
from agents.requirement_analyzer import RequirementAnalyzer

class TestRequirementAnalyzer:
    def setup_method(self):
        self.analyzer = RequirementAnalyzer()
    
    def test_analyze_empty_requirements(self):
        with pytest.raises(ValueError):
            self.analyzer.analyze("")
    
    def test_analyze_valid_requirements(self):
        requirements = "需要开发一个Web应用"
        result = self.analyzer.analyze(requirements)
        
        assert "keywords" in result
        assert "requirements" in result
        assert len(result["keywords"]) > 0
```

#### 集成测试
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestProjectAPI:
    def test_create_project(self):
        project_data = {
            "name": "测试项目",
            "description": "测试描述",
            "type": "commercial"
        }
        
        response = client.post("/api/projects", json=project_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "测试项目"
```

### 前端测试

#### 组件测试
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: 1,
    name: '测试项目',
    description: '测试描述',
    status: 'active'
  };
  
  it('renders project information', () => {
    render(<ProjectCard project={mockProject} onUpdate={jest.fn()} />);
    
    expect(screen.getByText('测试项目')).toBeInTheDocument();
    expect(screen.getByText('测试描述')).toBeInTheDocument();
  });
  
  it('calls onUpdate when update button is clicked', () => {
    const mockOnUpdate = jest.fn();
    render(<ProjectCard project={mockProject} onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('更新'));
    expect(mockOnUpdate).toHaveBeenCalledWith(mockProject);
  });
});
```

### 运行测试

```bash
# 后端测试
pytest tests/ -v --cov=.

# 前端测试
cd frontend
npm test

# 端到端测试
npm run test:e2e
```

## 贡献指南

### 贡献流程

1. **Fork项目**
2. **创建功能分支**
   ```bash
   git checkout -b feature/new-feature
   ```

3. **开发功能**
   - 编写代码
   - 添加测试
   - 更新文档

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```

5. **推送分支**
   ```bash
   git push origin feature/new-feature
   ```

6. **创建Pull Request**

### 代码审查

#### 审查清单
- [ ] 代码符合项目规范
- [ ] 有充分的测试覆盖
- [ ] 文档已更新
- [ ] 没有安全漏洞
- [ ] 性能影响可接受
- [ ] 向后兼容

#### 审查流程
1. 自动化检查通过
2. 至少一个核心开发者审查
3. 所有讨论已解决
4. 合并到目标分支

### 发布流程

1. **创建发布分支**
   ```bash
   git checkout -b release/v1.1.0
   ```

2. **更新版本号**
   - 更新 package.json
   - 更新 __version__.py
   - 更新 CHANGELOG.md

3. **测试验证**
   - 运行完整测试套件
   - 手动测试关键功能
   - 性能测试

4. **合并发布**
   ```bash
   git checkout main
   git merge release/v1.1.0
   git tag v1.1.0
   git push origin main --tags
   ```

5. **部署生产环境**

---

更多开发信息请参考：
- **代码仓库**: https://github.com/your-org/ZtbAiBidApp
- **问题跟踪**: https://github.com/your-org/ZtbAiBidApp/issues
- **开发者社区**: https://discord.gg/ztbaiapp
