# Docker 部署指南

## 目录
- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
- [配置说明](#配置说明)
- [数据持久化](#数据持久化)
- [常用命令](#常用命令)
- [故障排查](#故障排查)

---

## 前置要求

### 系统要求
- 操作系统：Linux / macOS / Windows 10+
- 内存：至少 2GB（推荐 4GB+）
- 磁盘：至少 10GB 可用空间

### 软件要求
- Docker 20.10+
- Docker Compose 2.0+（可选）

### 检查安装
```bash
docker --version
docker compose version
```

---

## 快速开始

### 方式一：使用预构建镜像（推荐）
```bash
# 拉取镜像
docker pull lgdli/aiapi-gateway:latest

# 运行容器
docker run -d \
  --name aiapi-gateway \
  -p 3000:3000 \
  -v aiapi-data:/data \
  lgdli/aiapi-gateway:latest

# 访问
# http://localhost:3000
```

### 方式二：从源码构建
```bash
# 克隆代码
git clone https://github.com/lgdli/AIAPIGateway.git
cd AIAPIGateway/new-api

# 构建镜像
docker build -t lgdli/aiapi-gateway:latest .

# 运行容器
docker run -d \
  --name aiapi-gateway \
  -p 3000:3000 \
  -v aiapi-data:/data \
  lgdli/aiapi-gateway:latest
```

---

## 详细步骤

### 1. 构建镜像

#### 1.1 配置Go代理（国内用户必须）
Dockerfile已配置国内代理，如需修改：
```dockerfile
ENV GOPROXY=https://goproxy.cn,direct
```

其他可选代理：
- 七牛云：`https://goproxy.cn`
- 阿里云：`https://mirrors.aliyun.com/goproxy/`
- 官方：`https://proxy.golang.org`

#### 1.2 执行构建
```bash
# 基础构建
sudo docker build -t lgdli/aiapi-gateway:latest .

# 带版本标签
sudo docker build -t lgdli/aiapi-gateway:1.0.0 .

# 多架构构建（需要buildx）
sudo docker buildx build --platform linux/amd64,linux/arm64 -t lgdli/aiapi-gateway:latest .
```

#### 1.3 查看构建结果
```bash
docker images | grep aiapi-gateway
```

### 2. 运行容器

#### 2.1 基础运行
```bash
docker run -d \
  --name aiapi-gateway \
  -p 3000:3000 \
  lgdli/aiapi-gateway:latest
```

#### 2.2 完整配置运行
```bash
docker run -d \
  --name aiapi-gateway \
  -p 3000:3000 \
  -v /opt/aiapi/data:/data \
  -v /opt/aiapi/logs:/data/logs \
  -e SESSION_SECRET=your-secret-key \
  -e SQL_DSN="your-database-dsn" \
  -e REDIS_URL="redis://localhost:6379" \
  --restart unless-stopped \
  lgdli/aiapi-gateway:latest
```

#### 2.3 使用Docker Compose（推荐）
创建 `docker-compose.yml`：
```yaml
version: '3.8'

services:
  aiapi-gateway:
    image: lgdli/aiapi-gateway:latest
    container_name: aiapi-gateway
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
      - ./logs:/data/logs
    environment:
      - SESSION_SECRET=your-secret-key-change-this
      - SQL_DSN=
      - REDIS_URL=
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 可选：Redis缓存
  redis:
    image: redis:7-alpine
    container_name: aiapi-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

启动服务：
```bash
docker compose up -d
```

### 3. 推送到Docker Hub

#### 3.1 登录Docker Hub
```bash
docker login
# 输入用户名和密码
```

#### 3.2 推送镜像
```bash
docker push lgdli/aiapi-gateway:latest
docker push lgdli/aiapi-gateway:1.0.0
```

---

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| SESSION_SECRET | 会话密钥 | 随机生成 | 建议设置 |
| SQL_DSN | 数据库连接串 | SQLite | 否 |
| REDIS_URL | Redis连接串 | 无 | 否 |
| PORT | 服务端口 | 3000 | 否 |

### 数据库配置

#### SQLite（默认）
```bash
# 无需配置，自动创建
# 数据库文件：/data/one-api.db
```

#### MySQL
```bash
-e SQL_DSN="user:password@tcp(host:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
```

#### PostgreSQL
```bash
-e SQL_DSN="host=postgres port=5432 user=user password=password dbname=dbname sslmode=disable"
```

### Redis配置
```bash
-e REDIS_URL="redis://localhost:6379"
# 或带密码
-e REDIS_URL="redis://:password@localhost:6379"
```

---

## 数据持久化

### 重要目录

| 容器路径 | 说明 | 建议挂载 |
|---------|------|---------|
| /data | 数据目录（数据库、配置） | 是 |
| /data/logs | 日志目录 | 是 |

### 挂载示例
```bash
# 使用命名卷
docker run -d \
  -v aiapi-data:/data \
  -v aiapi-logs:/data/logs \
  lgdli/aiapi-gateway:latest

# 使用本地目录
docker run -d \
  -v /opt/aiapi/data:/data \
  -v /opt/aiapi/logs:/data/logs \
  lgdli/aiapi-gateway:latest
```

### 备份数据
```bash
# 备份SQLite数据库
docker cp aiapi-gateway:/data/one-api.db ./backup/

# 备份整个数据目录
docker run --rm \
  -v aiapi-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/aiapi-backup-$(date +%Y%m%d).tar.gz /data
```

### 恢复数据
```bash
# 恢复数据库
docker cp ./backup/one-api.db aiapi-gateway:/data/

# 重启容器
docker restart aiapi-gateway
```

---

## 常用命令

### 容器管理
```bash
# 启动容器
docker start aiapi-gateway

# 停止容器
docker stop aiapi-gateway

# 重启容器
docker restart aiapi-gateway

# 删除容器
docker rm -f aiapi-gateway

# 查看容器状态
docker ps -a | grep aiapi-gateway

# 查看资源使用
docker stats aiapi-gateway
```

### 日志查看
```bash
# 实时日志
docker logs -f aiapi-gateway

# 最近100行
docker logs --tail 100 aiapi-gateway

# 带时间戳
docker logs -f --timestamps aiapi-gateway

# 查看日志文件
docker exec aiapi-gateway ls -lh /data/logs/
docker exec aiapi-gateway tail -f /data/logs/oneapi-*.log
```

### 进入容器
```bash
# 交互式终端
docker exec -it aiapi-gateway /bin/sh

# 执行命令
docker exec aiapi-gateway cat /data/one-api.db
```

### 镜像管理
```bash
# 查看镜像
docker images | grep aiapi-gateway

# 删除镜像
docker rmi lgdli/aiapi-gateway:latest

# 清理未使用镜像
docker image prune -a

# 导出镜像
docker save lgdli/aiapi-gateway:latest > aiapi-gateway.tar

# 导入镜像
docker load < aiapi-gateway.tar
```

### 更新版本
```bash
# 拉取最新镜像
docker pull lgdli/aiapi-gateway:latest

# 停止旧容器
docker stop aiapi-gateway

# 删除旧容器
docker rm aiapi-gateway

# 启动新容器（使用相同配置）
docker run -d \
  --name aiapi-gateway \
  -p 3000:3000 \
  -v aiapi-data:/data \
  lgdli/aiapi-gateway:latest
```

---

## 故障排查

### 1. 权限问题
```bash
# 错误：permission denied
# 解决：使用sudo或将用户加入docker组
sudo usermod -aG docker $USER
newgrp docker
```

### 2. 端口占用
```bash
# 错误：port is already allocated
# 检查端口占用
sudo lsof -i :3000
sudo netstat -tlnp | grep 3000

# 解决：停止占用进程或使用其他端口
docker run -p 3001:3000 lgdli/aiapi-gateway:latest
```

### 3. 容器无法启动
```bash
# 查看详细日志
docker logs aiapi-gateway

# 检查容器状态
docker inspect aiapi-gateway

# 检查健康状态
docker inspect --format='{{.State.Health.Status}}' aiapi-gateway
```

### 4. 网络问题
```bash
# 检查容器网络
docker network ls
docker network inspect bridge

# 创建自定义网络
docker network create aiapi-network
docker run --network aiapi-network lgdli/aiapi-gateway:latest
```

### 5. 存储问题
```bash
# 检查磁盘空间
df -h

# 清理Docker资源
docker system prune -a

# 查看卷使用
docker volume ls
docker volume inspect aiapi-data
```

### 6. 内存不足
```bash
# 限制容器内存
docker run -d \
  --memory="2g" \
  --memory-swap="2g" \
  lgdli/aiapi-gateway:latest

# 监控内存
docker stats aiapi-gateway
```

### 7. Go模块下载超时
```dockerfile
# 在Dockerfile中添加
ENV GOPROXY=https://goproxy.cn,direct
```

### 8. 前端构建失败
```bash
# 检查node版本
docker run --rm -it oven/bun:1 bun --version

# 清理缓存后重新构建
docker build --no-cache -t lgdli/aiapi-gateway:latest .
```

---

## 生产环境建议

### 1. 安全配置
```bash
# 设置强密钥
-e SESSION_SECRET=$(openssl rand -hex 32)

# 限制容器权限
docker run --cap-drop=ALL --cap-add=CHOWN lgdli/aiapi-gateway:latest

# 只读根文件系统
docker run --read-only lgdli/aiapi-gateway:latest
```

### 2. 资源限制
```yaml
services:
  aiapi-gateway:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 3. 健康检查
```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/status"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 4. 日志轮转
```bash
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  lgdli/aiapi-gateway:latest
```

### 5. 自动重启
```bash
docker run -d \
  --restart unless-stopped \
  lgdli/aiapi-gateway:latest
```

### 6. 使用外部数据库
```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: aiapi
    volumes:
      - mysql-data:/var/lib/mysql

  aiapi-gateway:
    depends_on:
      - mysql
      - redis
    environment:
      - SQL_DSN=root:rootpassword@tcp(mysql:3306)/aiapi?charset=utf8mb4&parseTime=True&loc=Local
```

---

## 监控与告警

### Prometheus监控
```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

---

## 参考链接

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/)
- [Go Proxy中国](https://goproxy.cn/)

---

## 联系支持

- GitHub Issues: https://github.com/lgdli/AIAPIGateway/issues
- 项目地址: https://github.com/lgdli/AIAPIGateway
