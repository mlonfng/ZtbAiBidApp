# ZtbAiBidApp API 文档

## 📋 目录

1. [API概述](#api概述)
2. [认证授权](#认证授权)
3. [项目管理API](#项目管理api)
4. [工作流API](#工作流api)
5. [模板API](#模板api)
6. [用户管理API](#用户管理api)
7. [文件管理API](#文件管理api)
8. [错误处理](#错误处理)

## API概述

### 基础信息
- **Base URL**: `https://api.ztbaiapp.com/v1`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-08-04T10:30:00Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {}
  },
  "timestamp": "2024-08-04T10:30:00Z"
}
```

## 认证授权

### JWT Token认证

#### 获取Token
```http
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "username": "user@example.com",
      "name": "用户名"
    }
  }
}
```

#### 使用Token
在请求头中添加Authorization字段：
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 项目管理API

### 获取项目列表
```http
GET /projects?page=1&size=10&status=active
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码（默认1）
- `size`: 每页数量（默认10）
- `status`: 项目状态（active/completed/archived）
- `search`: 搜索关键词

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "商务投标项目",
        "description": "项目描述",
        "status": "active",
        "type": "commercial",
        "created_at": "2024-08-01T10:00:00Z",
        "updated_at": "2024-08-04T10:00:00Z",
        "owner": {
          "id": 1,
          "name": "项目负责人"
        }
      }
    ],
    "total": 50,
    "page": 1,
    "size": 10,
    "pages": 5
  }
}
```

### 创建项目
```http
POST /projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "新项目名称",
  "description": "项目描述",
  "type": "commercial",
  "template_id": 1,
  "deadline": "2024-12-31T23:59:59Z",
  "tags": ["投标", "商务"]
}
```

### 获取项目详情
```http
GET /projects/{project_id}
Authorization: Bearer {token}
```

### 更新项目
```http
PUT /projects/{project_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "更新的项目名称",
  "description": "更新的描述",
  "status": "completed"
}
```

### 删除项目
```http
DELETE /projects/{project_id}
Authorization: Bearer {token}
```

## 工作流API

### 获取工作流列表
```http
GET /workflows?project_id=1
Authorization: Bearer {token}
```

### 创建工作流
```http
POST /workflows
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "商务投标工作流",
  "description": "自动生成商务投标文件",
  "project_id": 1,
  "template_id": "commercial_bid",
  "config": {
    "ai_model": "gpt-4",
    "language": "zh-CN",
    "output_format": "docx"
  }
}
```

### 执行工作流
```http
POST /workflows/{workflow_id}/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "input_data": {
    "company_name": "公司名称",
    "project_requirements": "项目需求描述",
    "budget": 1000000
  }
}
```

### 获取工作流状态
```http
GET /workflows/{workflow_id}/status
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "running",
    "progress": 65,
    "current_step": "content_generation",
    "steps": [
      {
        "name": "requirement_analysis",
        "status": "completed",
        "duration": 30000
      },
      {
        "name": "content_generation",
        "status": "running",
        "progress": 65
      }
    ],
    "estimated_completion": "2024-08-04T11:00:00Z"
  }
}
```

## 模板API

### 获取模板列表
```http
GET /templates?category=commercial&page=1&size=12
Authorization: Bearer {token}
```

**查询参数**:
- `category`: 模板分类
- `tags`: 标签筛选
- `search`: 搜索关键词
- `sort`: 排序方式（popular/latest/rating）

### 获取模板详情
```http
GET /templates/{template_id}
Authorization: Bearer {token}
```

### 下载模板
```http
GET /templates/{template_id}/download
Authorization: Bearer {token}
```

### 收藏模板
```http
POST /templates/{template_id}/favorite
Authorization: Bearer {token}
```

### 取消收藏
```http
DELETE /templates/{template_id}/favorite
Authorization: Bearer {token}
```

### 上传模板
```http
POST /templates
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": (binary),
  "title": "模板标题",
  "description": "模板描述",
  "category": "commercial",
  "tags": ["标准", "商务"],
  "is_public": true
}
```

## 用户管理API

### 获取用户信息
```http
GET /users/me
Authorization: Bearer {token}
```

### 更新用户信息
```http
PUT /users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "新用户名",
  "email": "new@example.com",
  "phone": "13800138000",
  "department": "技术部"
}
```

### 修改密码
```http
PUT /users/me/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

### 获取用户项目
```http
GET /users/me/projects
Authorization: Bearer {token}
```

### 获取用户收藏
```http
GET /users/me/favorites
Authorization: Bearer {token}
```

## 文件管理API

### 上传文件
```http
POST /files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": (binary),
  "type": "document",
  "project_id": 1
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "file_123",
    "filename": "document.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "url": "https://files.ztbaiapp.com/file_123.pdf",
    "upload_time": "2024-08-04T10:30:00Z"
  }
}
```

### 获取文件信息
```http
GET /files/{file_id}
Authorization: Bearer {token}
```

### 下载文件
```http
GET /files/{file_id}/download
Authorization: Bearer {token}
```

### 删除文件
```http
DELETE /files/{file_id}
Authorization: Bearer {token}
```

## 错误处理

### 错误代码

| 代码 | HTTP状态 | 描述 |
|------|----------|------|
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

### 错误响应示例

#### 参数验证错误
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "name": ["项目名称不能为空"],
      "email": ["邮箱格式不正确"]
    }
  },
  "timestamp": "2024-08-04T10:30:00Z"
}
```

#### 权限错误
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "您没有权限访问此资源",
    "details": {
      "required_permission": "project:write",
      "user_permissions": ["project:read"]
    }
  },
  "timestamp": "2024-08-04T10:30:00Z"
}
```

### 状态码说明

- **200 OK**: 请求成功
- **201 Created**: 资源创建成功
- **204 No Content**: 请求成功，无返回内容
- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未授权
- **403 Forbidden**: 权限不足
- **404 Not Found**: 资源不存在
- **409 Conflict**: 资源冲突
- **422 Unprocessable Entity**: 请求格式正确但语义错误
- **429 Too Many Requests**: 请求频率超限
- **500 Internal Server Error**: 服务器内部错误
- **503 Service Unavailable**: 服务不可用

### 请求限制

- **频率限制**: 每分钟最多100次请求
- **文件大小**: 单个文件最大50MB
- **并发限制**: 每用户最多10个并发请求

### SDK和示例

#### JavaScript SDK
```javascript
import { ZtbAiClient } from '@ztbai/sdk';

const client = new ZtbAiClient({
  baseURL: 'https://api.ztbaiapp.com/v1',
  token: 'your_access_token'
});

// 获取项目列表
const projects = await client.projects.list();

// 创建项目
const project = await client.projects.create({
  name: '新项目',
  type: 'commercial'
});
```

#### Python SDK
```python
from ztbai_sdk import ZtbAiClient

client = ZtbAiClient(
    base_url='https://api.ztbaiapp.com/v1',
    token='your_access_token'
)

# 获取项目列表
projects = client.projects.list()

# 创建项目
project = client.projects.create(
    name='新项目',
    type='commercial'
)
```

---

更多API文档和示例请访问：
- **在线文档**: https://docs.ztbaiapp.com/api
- **Postman集合**: https://www.postman.com/ztbai/workspace/ztbaiapp
- **SDK下载**: https://github.com/ztbai/sdk
