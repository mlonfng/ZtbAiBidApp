# 日志管理策略

## 📋 概述

本文档定义了ZtbAi智能投标系统的日志管理策略，确保日志文件不会影响项目结构和版本控制。

## 🗂️ 日志文件分类

### 1. 应用日志
- `backend/logs/api.log` - API请求日志
- `backend/logs/error.log` - 错误日志
- `backend/logs/app.log` - 应用运行日志

### 2. 开发日志
- `logs/api.log` - 开发环境API日志
- `logs/error.log` - 开发环境错误日志
- `debug.log` - 调试日志

### 3. 构建日志
- `npm-debug.log` - npm调试日志
- `yarn-debug.log` - yarn调试日志
- `yarn-error.log` - yarn错误日志

## 🔧 日志配置

### 后端日志配置
```python
# 日志配置建议
LOGGING_CONFIG = {
    "version": 1,
    "handlers": {
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "backend/logs/app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        }
    }
}
```

### 前端日志配置
```javascript
// Console日志在生产环境应该被禁用
if (process.env.NODE_ENV === 'production') {
  console.log = console.warn = console.error = () => {};
}
```

## 🗑️ 日志清理策略

### 自动清理
- 使用日志轮转，单个文件最大10MB
- 保留最近5个备份文件
- 超过30天的日志自动删除

### 手动清理
```bash
# 清理所有日志文件
find . -name "*.log" -type f -delete

# 清理7天前的日志
find . -name "*.log" -type f -mtime +7 -delete
```

## 📁 归档策略

### 开发期间产生的日志文件已移动到：
- `debug_archive/logs/` - 历史日志文件
- `debug_archive/temp_files/` - 临时数据库文件

### 新的日志文件处理：
1. 运行时日志存储在各自的 `logs/` 目录
2. Git忽略所有 `.log` 文件
3. 定期清理或归档旧日志

## ⚙️ 最佳实践

### 开发环境
- 使用详细的日志级别 (DEBUG)
- 日志文件本地存储
- 不提交日志文件到版本控制

### 生产环境
- 使用适当的日志级别 (INFO/WARN/ERROR)
- 考虑使用外部日志服务
- 实施日志轮转和清理

### 日志内容规范
- 不记录敏感信息（密码、API密钥）
- 使用结构化日志格式
- 包含时间戳和请求ID

## 🔍 监控和分析

### 日志分析工具
- 本地：可以使用 `tail`, `grep`, `awk` 等工具
- 集成：考虑集成ELK Stack或类似工具

### 告警机制
- 错误日志监控
- 磁盘空间监控
- 日志量异常监控

---

**创建时间**: 2024-08-30  
**维护者**: ZtbAi开发团队  
**版本**: v1.0