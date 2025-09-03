# ZtbAi API使用指南

## 📋 概述

本文档详细介绍ZtbAi投标文件AI智能编辑系统的API接口使用方法，包括Step API统一接口、错误处理、性能监控等核心功能。

## 🚀 快速开始

### 启动API服务器
```bash
cd backend
python new_api_server.py
```
服务器将在 `http://localhost:9958` 启动

### 基础健康检查
```bash
curl http://localhost:9958/health
```

## 📊 Step API统一接口

ZtbAi采用统一的Step API设计模式，所有业务步骤都遵循相同的接口规范。

### 接口模式
```
GET    /api/projects/{project_id}/step/{step_key}/status   # 获取步骤状态
POST   /api/projects/{project_id}/step/{step_key}/execute  # 执行步骤
GET    /api/projects/{project_id}/step/{step_key}/result   # 获取步骤结果
```

### 支持的步骤 (step_key)

| 步骤键名 | 步骤名称 | 描述 |
|---------|---------|------|
| `service-mode` | 服务模式选择 | 选择AI服务模式 |
| `bid-analysis` | 招标文件分析 | 智能分析招标文件 |
| `file-formatting` | 文件格式化 | 格式化文档结构 |
| `format-config` | 格式配置 | 配置文档格式 |
| `framework-generation` | 框架生成 | 生成投标文档框架 |
| `content-generation` | 内容生成 | AI生成投标内容 |
| `material-management` | 资料管理 | 管理投标资料 |
| `document-export` | 文档导出 | 导出最终文档 |

### 使用示例

#### 1. 检查步骤状态
```bash
curl -X GET "http://localhost:9958/api/projects/project123/step/bid-analysis/status"
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取状态成功",
  "data": {
    "status": "ready",
    "progress": 0,
    "last_updated": "2025-01-17T10:30:45.123456"
  },
  "timestamp": "2025-01-17T10:30:45.123456"
}
```

#### 2. 执行步骤
```bash
curl -X POST "http://localhost:9958/api/projects/project123/step/bid-analysis/execute" \
  -H "Content-Type: application/json" \
  -d '{"analysis_type": "comprehensive"}'
```

**响应示例**:
```json
{
  "success": true,
  "message": "步骤执行成功",
  "data": {
    "task_id": "task_abc123",
    "status": "running",
    "estimated_time": 120
  },
  "timestamp": "2025-01-17T10:30:45.123456"
}
```

#### 3. 获取步骤结果
```bash
curl -X GET "http://localhost:9958/api/projects/project123/step/bid-analysis/result"
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取结果成功",
  "data": {
    "status": "completed",
    "result": {
      "analysis_summary": "招标文件分析完成",
      "key_requirements": [...],
      "scoring_criteria": [...]
    },
    "completion_time": "2025-01-17T10:32:45.123456"
  },
  "timestamp": "2025-01-17T10:32:45.123456"
}
```

## 🔧 项目管理API

### 创建项目
```bash
curl -X POST "http://localhost:9958/api/project/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试项目",
    "description": "项目描述",
    "bid_file": "招标文件.pdf"
  }'
```

### 获取项目列表
```bash
curl -X GET "http://localhost:9958/api/project/list"
```

### 获取项目详情
```bash
curl -X GET "http://localhost:9958/api/project/{project_id}"
```

### 删除项目
```bash
curl -X DELETE "http://localhost:9958/api/project/{project_id}"
```

## 📈 监控和管理API

### 性能监控
```bash
# 获取性能统计
curl -X GET "http://localhost:9958/api/monitoring/performance"

# 重置性能统计
curl -X POST "http://localhost:9958/api/monitoring/performance/reset"
```

### Agent系统状态
```bash
# Agent状态
curl -X GET "http://localhost:9958/api/agent/status"

# Agent性能
curl -X GET "http://localhost:9958/api/agent/performance"

# Agent测试
curl -X POST "http://localhost:9958/api/agent/test"
```

### 系统状态
```bash
# 健康检查
curl -X GET "http://localhost:9958/health"

# 详细状态
curl -X GET "http://localhost:9958/api/status"
```

## 📝 统一响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功描述",
  "data": {
    // 具体数据内容
  },
  "timestamp": "2025-01-17T10:30:45.123456"
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述信息",
  "timestamp": "2025-01-17T10:30:45.123456"
}
```

## 🚨 HTTP状态码规范

| 状态码 | 含义 | 使用场景 |
|-------|------|---------|
| 200 | 成功 | 请求成功处理 |
| 400 | 参数错误 | 请求参数不正确 |
| 404 | 资源不存在 | 项目或资源未找到 |
| 409 | 冲突 | 任务已在运行中 |
| 500 | 内部错误 | 服务器内部错误 |
| 502 | 上游服务错误 | AI服务不可用 |

## 🔐 错误处理最佳实践

### 1. 检查响应状态
```javascript
const response = await fetch('/api/project/list');
if (!response.ok) {
  const error = await response.json();
  console.error('API错误:', error.message);
  return;
}
const data = await response.json();
```

### 2. 处理不同错误类型
```javascript
switch (response.status) {
  case 400:
    // 参数错误，检查请求参数
    break;
  case 404:
    // 资源不存在，可能需要刷新列表
    break;
  case 409:
    // 冲突，等待当前操作完成
    break;
  case 502:
    // 服务不可用，可以重试
    break;
  default:
    // 其他错误
}
```

## 📊 性能优化建议

### 1. 请求优化
- 使用适当的HTTP方法
- 避免频繁的状态查询
- 合理设置请求超时时间

### 2. 并发控制
- 避免同时执行多个耗时步骤
- 使用任务队列管理长时间操作
- 实施适当的限流机制

### 3. 缓存策略
- 缓存不经常变化的数据
- 使用条件请求减少数据传输
- 实施客户端缓存策略

## 🧪 测试和调试

### 运行API测试
```bash
cd backend
python tests/simple_e2e_test.py
```

### 性能测试
```bash
cd backend
python tests/performance_test.py
```

### 调试技巧
1. 查看服务器日志
2. 使用性能监控API
3. 检查网络请求和响应
4. 验证请求参数格式

## 📚 SDK和工具

### JavaScript/TypeScript客户端
```javascript
class ZtbAiClient {
  constructor(baseUrl = 'http://localhost:9958') {
    this.baseUrl = baseUrl;
  }
  
  async executeStep(projectId, stepKey, data = {}) {
    const response = await fetch(
      `${this.baseUrl}/api/projects/${projectId}/step/${stepKey}/execute`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    );
    return response.json();
  }
  
  async getStepStatus(projectId, stepKey) {
    const response = await fetch(
      `${this.baseUrl}/api/projects/${projectId}/step/${stepKey}/status`
    );
    return response.json();
  }
}
```

### Python客户端
```python
import requests

class ZtbAiClient:
    def __init__(self, base_url='http://localhost:9958'):
        self.base_url = base_url
    
    def execute_step(self, project_id, step_key, data=None):
        url = f"{self.base_url}/api/projects/{project_id}/step/{step_key}/execute"
        response = requests.post(url, json=data or {})
        return response.json()
    
    def get_step_status(self, project_id, step_key):
        url = f"{self.base_url}/api/projects/{project_id}/step/{step_key}/status"
        response = requests.get(url)
        return response.json()
```

## 🔄 版本更新

### 当前版本: v3.0
- ✅ 统一Step API接口
- ✅ 完整错误处理
- ✅ 性能监控系统
- ✅ Agent系统集成
- ✅ 日志和监控优化

### 更新日志
- **v3.0**: 重构API架构，统一接口规范
- **v2.x**: 添加AI Agent系统
- **v1.x**: 基础功能实现

---

**文档版本**: v3.0  
**最后更新**: 2025-01-17  
**维护团队**: ZtbAi开发团队
