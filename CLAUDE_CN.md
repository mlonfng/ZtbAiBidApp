# CLAUDE.md

本文件为Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

> 仔细思考并实现最简洁的解决方案，尽可能少地更改代码。

## 架构概述

**ZtbAi智能投标助手** 是一个全栈AI驱动的投标系统，包含：
- **后端**: 基于FastAPI的Python服务器，配备用于投标分析和策略的AI代理
- **前端**: React TypeScript应用程序，使用Ant Design和Monaco Editor
- **数据库**: SQLite配合Alembic迁移
- **Electron**: 桌面应用程序打包

### 核心服务
- **AIService**: OpenAI集成，用于内容生成
- **ValidationService**: 文档验证和合规性检查
- **ProjectService**: 项目管理，支持SQLite持久化
- **BidAnalysisService**: AI驱动的投标文档分析

### 代理系统
- **BidAnalysisAgent**: 文档分析和需求提取
- **BidStrategyAgent**: 竞争分析和策略生成
- **性能监控**，包含详细的指标收集

## 开发命令

### 全栈开发
```bash
npm run dev              # 同时启动后端和前端
npm run dev:backend      # 启动FastAPI服务器，端口9958
npm run dev:frontend     # 启动React开发服务器，端口3000
```

### 构建命令
```bash
npm run build            # 构建前端开发版本
npm run build:production # 生产环境优化构建
npm run dist            # 构建Electron桌面应用程序
```

### 测试
```bash
npm test                 # 运行所有测试
npm run test:backend     # 运行Python后端测试
npm run test:frontend    # 运行React前端测试

# 运行特定测试文件
cd backend && python -m pytest tests/test_file.py -v
cd frontend && npm test -- --testNamePattern="test pattern"
```

### 代码检查和代码质量
```bash
npm run lint             # 同时运行后端和前端代码检查
npm run lint:backend     # Python flake8代码检查
npm run lint:frontend    # TypeScript ESLint检查

# 前端特定命令
cd frontend && npm run format    # Prettier代码格式化
cd frontend && npm run lint:fix # 自动修复代码检查问题
```

### 数据库管理
```bash
# Alembic迁移
cd backend
alembic upgrade head     # 应用所有待处理的迁移
alembic revision --autogenerate -m "description" # 创建新迁移
```

### API合规性和验证
```bash
npm run check:api-compliance    # 验证API路由一致性
npm run check:routes           # 检测路由冲突
npm run check:errors           # 分析错误处理
npm run validate:step-api      # 验证Step API合规性
```

## 项目管理系统

此代码库使用**Claude Code PM**系统进行规范驱动开发：

### 关键命令
```bash
/pm:init                 # 初始化PM系统，集成GitHub
/pm:prd-new feature-name # 创建产品需求文档
/pm:prd-parse feature-name # 将PRD转换为技术史诗
/pm:epic-oneshot feature-name # 分解并同步到GitHub
/pm:issue-start 1234     # 开始处理GitHub issue
/pm:next                 # 获取下一个优先级任务
```

### 上下文管理
```bash
/context:create          # 创建全面的项目上下文
/context:update          # 使用最新更改更新上下文
/context:prime           # 将上下文加载到当前对话中
```

### 使用代理进行测试
```bash
/testing:prime           # 配置测试框架
/testing:run             # 运行测试并进行智能分析
```

## 文件结构约定

- **后端API**: `backend/app/api/` 使用模块化的基于步骤的端点
- **前端组件**: `frontend/src/components/` 使用TypeScript
- **数据库模型**: SQLite配合Alembic迁移，位于 `backend/alembic/`
- **AI代理**: `Agent/` 目录，包含基础和专用实现
- **项目上下文**: `.claude/context/` 用于AI辅助开发

## API架构

后端使用**Step API**模式，包含以下核心模块：
- `service_mode.py` - 服务配置和健康检查
- `bid_analysis.py` - 文档分析和AI处理
- `file_formatting.py` - 文档格式化和模板管理
- `material_management.py` - 内容和资源管理
- `framework_generation.py` - 投标框架结构生成
- `content_generation.py` - AI驱动的内容创建
- `format_config.py` - 格式化配置和验证
- `document_export.py` - 最终文档导出和打包

所有API都遵循REST约定，具有一致的错误处理和响应格式。

## 性能考虑

- **后端**: 使用性能中间件进行请求监控
- **数据库**: SQLite配合适当的连接管理
- **前端**: React配合Redux进行状态管理
- **构建**: Webpack优化生产环境打包

## 开发工作流程

1. **启动服务**: `npm run dev` 进行全栈开发
2. **运行测试**: `npm test` 在提交更改前运行
3. **代码检查**: `npm run lint` 维护代码质量
4. **API验证**: `npm run check:api-compliance` 确保一致性
5. **数据库**: 使用Alembic进行模式迁移

遵循代码库中的现有模式，确保前端和后端实现的一致性。