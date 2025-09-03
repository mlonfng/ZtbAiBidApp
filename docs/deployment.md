# ZtbAiBidApp 部署文档

## 📋 目录

1. [部署概述](#部署概述)
2. [环境要求](#环境要求)
3. [开发环境部署](#开发环境部署)
4. [生产环境部署](#生产环境部署)
5. [Docker部署](#docker部署)
6. [监控和维护](#监控和维护)
7. [故障排除](#故障排除)

## 部署概述

ZtbAiBidApp是一个前后端分离的Web应用，包含以下组件：
- **前端**: React + TypeScript 单页应用
- **后端**: Python FastAPI 服务
- **数据库**: SQLite（开发）/ PostgreSQL（生产）
- **AI服务**: OpenAI API集成
- **文件存储**: 本地存储 / 云存储

## 环境要求

### 硬件要求

#### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 稳定的互联网连接

#### 推荐配置
- **CPU**: 4核心或更多
- **内存**: 8GB RAM或更多
- **存储**: 50GB SSD
- **网络**: 高速互联网连接

### 软件要求

#### 开发环境
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 16.0+
- **Python**: 3.9+
- **Git**: 2.0+

#### 生产环境
- **操作系统**: Ubuntu 20.04 LTS (推荐)
- **Web服务器**: Nginx 1.18+
- **进程管理**: PM2 或 Supervisor
- **SSL证书**: Let's Encrypt 或商业证书

## 开发环境部署

### 1. 克隆代码库

```bash
git clone https://github.com/your-org/ZtbAiBidApp.git
cd ZtbAiBidApp
```

### 2. 后端环境设置

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 前端环境设置

```bash
cd frontend
npm install
```

### 4. 环境变量配置

创建 `.env` 文件：

```env
# 应用配置
APP_NAME=ZtbAiBidApp
APP_VERSION=1.0.0
DEBUG=true
HOST=0.0.0.0
PORT=8000

# 数据库配置
DATABASE_URL=sqlite:///./ztb_ai_bid.db

# AI配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo

# 安全配置
SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# 文件存储
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50MB
```

### 5. 数据库初始化

```bash
python database/init_database.py
```

### 6. 启动服务

```bash
# 启动后端服务
python main.py

# 新终端启动前端服务
cd frontend
npm start
```

### 7. 验证部署

访问 `http://localhost:3000` 验证前端服务
访问 `http://localhost:8000/docs` 验证后端API文档

## 生产环境部署

### 1. 服务器准备

#### 更新系统
```bash
sudo apt update
sudo apt upgrade -y
```

#### 安装基础软件
```bash
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx git
```

#### 创建应用用户
```bash
sudo useradd -m -s /bin/bash ztbapp
sudo usermod -aG sudo ztbapp
```

### 2. 应用部署

#### 切换到应用用户
```bash
sudo su - ztbapp
```

#### 克隆代码
```bash
git clone https://github.com/your-org/ZtbAiBidApp.git
cd ZtbAiBidApp
```

#### 后端部署
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 前端构建
```bash
cd frontend
npm install
npm run build
```

### 3. 生产环境配置

#### 创建生产环境配置文件
```bash
cp .env.example .env.production
```

编辑 `.env.production`：
```env
APP_NAME=ZtbAiBidApp
DEBUG=false
HOST=0.0.0.0
PORT=8000

# 使用PostgreSQL
DATABASE_URL=postgresql://username:password@localhost/ztbaiapp

# 生产环境密钥
SECRET_KEY=your_production_secret_key
OPENAI_API_KEY=your_production_openai_key

# 文件存储
UPLOAD_DIR=/var/www/ztbapp/uploads
```

### 4. 数据库配置

#### 安装PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

#### 创建数据库
```bash
sudo -u postgres psql
CREATE DATABASE ztbaiapp;
CREATE USER ztbapp WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ztbaiapp TO ztbapp;
\q
```

#### 初始化数据库
```bash
python database/init_database.py --env production
```

### 5. Nginx配置

创建Nginx配置文件 `/etc/nginx/sites-available/ztbapp`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /home/ztbapp/ZtbAiBidApp/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # 后端API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传
    location /uploads {
        alias /var/www/ztbapp/uploads;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/ztbapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL证书配置

#### 安装Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 获取SSL证书
```bash
sudo certbot --nginx -d your-domain.com
```

### 7. 进程管理

#### 安装PM2
```bash
sudo npm install -g pm2
```

#### 创建PM2配置文件 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'ztbapp-backend',
    script: 'main.py',
    interpreter: '/home/ztbapp/ZtbAiBidApp/venv/bin/python',
    cwd: '/home/ztbapp/ZtbAiBidApp',
    env: {
      NODE_ENV: 'production'
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: '/var/log/ztbapp/error.log',
    out_file: '/var/log/ztbapp/out.log',
    log_file: '/var/log/ztbapp/combined.log',
    time: true
  }]
};
```

#### 启动应用
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Docker部署

### 1. 创建Dockerfile

#### 后端Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
```

#### 前端Dockerfile
```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### 2. 创建docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ztbaiapp
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=ztbaiapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 3. 部署命令

```bash
# 构建和启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 监控和维护

### 1. 日志管理

#### 配置日志轮转
创建 `/etc/logrotate.d/ztbapp`：
```
/var/log/ztbapp/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ztbapp ztbapp
    postrotate
        pm2 reload all
    endscript
}
```

### 2. 性能监控

#### 安装监控工具
```bash
# 系统监控
sudo apt install -y htop iotop

# 应用监控
pm2 install pm2-server-monit
```

#### 监控脚本
```bash
#!/bin/bash
# monitor.sh

# 检查服务状态
pm2 status

# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 检查数据库连接
psql -h localhost -U ztbapp -d ztbaiapp -c "SELECT 1;"
```

### 3. 备份策略

#### 数据库备份
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/ztbapp"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -h localhost -U ztbapp ztbaiapp > $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/ztbapp/uploads

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

#### 设置定时备份
```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /home/ztbapp/scripts/backup.sh
```

## 故障排除

### 常见问题

#### 1. 服务无法启动
```bash
# 检查端口占用
sudo netstat -tlnp | grep :8000

# 检查日志
pm2 logs ztbapp-backend

# 检查配置文件
python -c "import os; print(os.environ.get('DATABASE_URL'))"
```

#### 2. 数据库连接失败
```bash
# 检查数据库状态
sudo systemctl status postgresql

# 测试连接
psql -h localhost -U ztbapp -d ztbaiapp

# 检查防火墙
sudo ufw status
```

#### 3. 前端页面无法访问
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查Nginx配置
sudo nginx -t

# 查看Nginx日志
sudo tail -f /var/log/nginx/error.log
```

#### 4. SSL证书问题
```bash
# 检查证书状态
sudo certbot certificates

# 续期证书
sudo certbot renew --dry-run

# 重新获取证书
sudo certbot --nginx -d your-domain.com --force-renewal
```

### 性能优化

#### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_templates_category ON templates(category);

-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM projects WHERE user_id = 1;
```

#### 2. 缓存配置
```nginx
# Nginx缓存配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 3. 应用优化
```python
# 使用连接池
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)
```

---

如需更多部署支持，请联系技术团队：
- 邮箱：devops@ztbaiapp.com
- 文档：https://docs.ztbaiapp.com
- 支持：https://support.ztbaiapp.com
