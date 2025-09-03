# 依赖管理策略

## 📋 概述

本文档定义了ZtbAi智能投标系统的依赖管理策略，确保项目结构清洁、依赖合理、构建稳定。

## 📦 依赖分类

### 前端依赖 (Frontend)
- **核心框架**: React 18.x, TypeScript 4.x
- **UI组件**: Ant Design 5.x, Monaco Editor
- **状态管理**: Redux Toolkit, React Redux
- **构建工具**: React Scripts, Electron
- **开发工具**: ESLint, Prettier, Playwright

### 后端依赖 (Backend)
- **Web框架**: FastAPI, Uvicorn
- **数据库**: SQLAlchemy, Alembic
- **AI集成**: OpenAI API, HTTPX
- **工具库**: Pydantic, Python-dotenv

## 🗂️ 临时文件管理

### 已清理的临时文件
- ✅ `node18.zip` (28MB) - Node.js安装包
- ✅ `electron-v28.1.0-win32-x64/` (238MB) - Electron预编译文件
- ✅ 根目录数据库文件 `ztbai.db`

### 临时目录结构
```
backend/
├── temp_ocr/          # OCR临时文件 (运行时)
├── temp_pdf_split/    # PDF分割临时文件 (运行时)  
└── temp_uploads/      # 上传临时文件 (运行时)
```

## 🔧 依赖优化建议

### 前端优化
1. **按需加载**: 使用dynamic import减少初始包大小
2. **依赖审计**: 定期运行 `npm audit` 检查安全漏洞
3. **版本锁定**: 使用 `package-lock.json` 锁定依赖版本
4. **包分析**: 使用 `webpack-bundle-analyzer` 分析包大小

### 后端优化
1. **虚拟环境**: 使用 `venv` 或 `conda` 隔离环境
2. **依赖锁定**: 使用 `pip freeze` 生成精确版本
3. **安全扫描**: 使用 `pip-audit` 检查安全问题
4. **轻量化**: 避免安装不必要的依赖

## 📁 文件忽略策略

### Git忽略规则
```gitignore
# 构建产物
dist/
build/
target/
out/

# 依赖目录
node_modules/
__pycache__/

# 压缩包和归档
*.zip
*.tar.gz
node*.zip
electron-v*.zip

# 临时文件
temp_*/
*_temp/
*.tmp
*.temp
```

## 🚀 安装和构建

### 前端环境设置
```bash
cd frontend
npm install                    # 安装依赖
npm run build                  # 构建生产版本
npm run dist                   # 打包Electron应用
```

### 后端环境设置
```bash
cd backend
pip install -r requirements.txt  # 安装依赖
alembic upgrade head              # 数据库迁移
python start_modular_app.py      # 启动服务
```

## 🔍 依赖监控

### 定期检查项目
- [ ] 依赖安全漏洞扫描
- [ ] 过期依赖更新
- [ ] 包大小监控
- [ ] 构建时间优化

### 性能监控
- **前端**: Bundle大小、加载时间
- **后端**: 启动时间、内存使用
- **整体**: 磁盘占用、CI/CD时间

## 📋 最佳实践

### 开发环境
1. 使用精确的版本号而非范围版本
2. 定期清理 `node_modules` 和 `__pycache__`
3. 使用 `.nvmrc` 指定Node.js版本
4. 使用 `requirements-dev.txt` 分离开发依赖

### 生产环境
1. 只安装生产必需的依赖
2. 使用Docker多阶段构建减少镜像大小
3. 定期更新依赖和安全补丁
4. 监控依赖许可证合规性

### 清理命令
```bash
# 前端清理
rm -rf frontend/node_modules frontend/build
npm cache clean --force

# 后端清理
find backend -name "__pycache__" -exec rm -rf {} +
find backend -name "*.pyc" -delete

# 临时文件清理
rm -rf backend/temp_*
```

---

**创建时间**: 2024-08-30  
**维护者**: ZtbAi开发团队  
**版本**: v1.0