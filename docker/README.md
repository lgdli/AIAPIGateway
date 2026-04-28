# Docker Compose 部署指南

## 架构概览

```
                    Internet
                        │
                        ▼
                  ┌──────────┐
                  │  Nginx   │ (HTTPS 443)
                  │ 反向代理  │
                  └────┬─────┘
                       │
            ┌──────────┼──────────┐
            │          │          │
            ▼          ▼          ▼
    ┌───────────┐ ┌───────┐ ┌──────────┐
    │ AI Gateway│ │ MySQL │ │  Redis   │
    │   :3000   │ │ :3306 │ │  :6379   │
    └───────────┘ └───────┘ └──────────┘
```

## 服务组件

| 服务 | 镜像 | 端口 | 说明 |
|-----|------|------|------|
| nginx | nginx:1.25-alpine | 80, 443 | 反向代理，HTTPS |
| aiapi-gateway | xjtu/aiapi-gateway:latest | 3000 (内部) | AI API网关 |
| mysql | mysql:8.0 | 3306 | 数据库 |
| redis | redis:7-alpine | 6379 | 缓存 |
| phpmyadmin | phpmyadmin:latest | 8080 | 数据库管理 |

## 目录结构

```
docker/
├── docker-compose.yml           # Docker Compose 配置
├── .env.example                 # 环境变量示例
├── data/                        # 应用数据目录
├── logs/                        # 应用日志目录
├── nginx/
│   ├── conf.d/
│   │   └── default.conf         # Nginx 配置文件
│   ├── ssl/
│   │   ├── cert.pem             # SSL 证书
│   │   └── key.pem              # SSL 私钥
│   ├── logs/                    # Nginx 日志
│   └── generate-ssl.sh          # SSL 证书生成脚本
├── mysql/
│   ├── conf.d/
│   │   └── my.cnf               # MySQL 配置
│   └── init/                    # 数据库初始化脚本
└── README.md                    # 本文件
```

## 快速部署

### 1. 克隆项目
```bash
git clone https://github.com/lgdli/AIAPIGateway.git
cd AIAPIGateway/docker
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置
vi .env
```

**必须修改的配置：**
```bash
# 生成随机密钥
SESSION_SECRET=$(openssl rand -hex 32)

# 修改数据库密码
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_PASSWORD=your_secure_password
```

### 3. 生成 SSL 证书

**方式A：自签名证书（测试环境）**
```bash
cd nginx
chmod +x generate-ssl.sh
./generate-ssl.sh localhost
cd ..
```

**方式B：Let's Encrypt（生产环境）**
```bash
# 1. 安装 certbot
sudo apt install certbot  # Ubuntu/Debian

# 2. 获取证书（需要域名解析到服务器）
sudo certbot certonly --standalone -d your-domain.com

# 3. 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/*.pem
```

### 4. 修改 Nginx 配置（生产环境）
```bash
# 编辑 nginx/conf.d/default.conf
# 将 server_name _; 改为你的域名
server_name your-domain.com;
```

### 5. 启动服务
```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 6. 验证部署
```bash
# 检查服务健康状态
docker compose ps

# 测试 HTTPS 访问
curl -k https://localhost/api/status

# 测试 HTTP 重定向
curl -I http://localhost
# 应该返回 301 重定向到 HTTPS
```

## 访问地址

### 测试环境（自签名证书）
- **AI API Gateway**: https://localhost
- **phpMyAdmin**: http://127.0.0.1:8080 (仅本地)

### 生产环境
- **AI API Gateway**: https://your-domain.com
- **phpMyAdmin**: http://127.0.0.1:8080 (仅本地访问)

**注意：** 使用自签名证书时，浏览器会显示安全警告，点击"继续访问"即可。

## 配置说明

### Nginx 配置

**主要特性：**
- HTTP 自动重定向到 HTTPS
- TLS 1.2/1.3 支持
- Gzip 压缩
- WebSocket 支持
- 流式响应优化
- 安全头配置

**修改配置后重载：**
```bash
docker compose exec nginx nginx -t          # 测试配置
docker compose exec nginx nginx -s reload   # 重载配置
```

### MySQL 配置

**配置文件：** `mysql/conf.d/my.cnf`

**性能优化（根据服务器内存调整）：**
```ini
# 4GB 内存服务器
innodb_buffer_pool_size = 2G
max_connections = 500

# 8GB 内存服务器
innodb_buffer_pool_size = 4G
max_connections = 1000
```

### Redis 配置

**已启用持久化：**
- AOF (Append Only File)
- 数据自动保存到 `redis-data` 卷

**添加密码（生产环境建议）：**
```yaml
# docker-compose.yml 中 redis 服务
command: redis-server --appendonly yes --requirepass your_redis_password
```

## 常用命令

### 服务管理

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 停止并删除容器
docker compose down

# 停止并删除容器和数据卷（危险！）
docker compose down -v
```

### 日志查看

```bash
# 查看所有日志
docker compose logs

# 实时查看特定服务日志
docker compose logs -f aiapi-gateway
docker compose logs -f nginx
docker compose logs -f mysql

# 查看最近 100 行
docker compose logs --tail 100 aiapi-gateway
```

### 进入容器

```bash
# 进入应用容器
docker compose exec aiapi-gateway sh

# 进入 MySQL
docker compose exec mysql bash

# 进入 Redis
docker compose exec redis sh

# 连接 Redis CLI
docker compose exec redis redis-cli
```

### 数据库操作

```bash
# 备份数据库
docker compose exec mysql mysqldump -u root -p aiapi > backup-$(date +%Y%m%d).sql

# 恢复数据库
docker compose exec -T mysql mysql -u root -p aiapi < backup-20240101.sql

# 查看数据库
docker compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# 查看表
docker compose exec mysql mysql -u root -p aiapi -e "SHOW TABLES;"
```

### SSL 证书管理

```bash
# 查看证书信息
openssl x509 -in nginx/ssl/cert.pem -text -noout

# 测试证书
openssl s_client -connect localhost:443 -servername localhost

# 续期 Let's Encrypt 证书
sudo certbot renew
docker compose restart nginx
```

## 更新部署

### 更新应用镜像

```bash
# 1. 拉取最新镜像
docker pull xjtu/aiapi-gateway:latest

# 2. 重启服务
docker compose down
docker compose up -d

# 或者仅重启应用
docker compose up -d --force-recreate aiapi-gateway
```

### 更新所有服务

```bash
# 拉取最新镜像
docker compose pull

# 重建并启动
docker compose up -d --build
```

## 数据备份

### 备份脚本

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# 备份数据库
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} aiapi > $BACKUP_DIR/database.sql

# 备份应用数据
tar -czf $BACKUP_DIR/data.tar.gz data/ logs/

# 备份 Nginx 配置
tar -czf $BACKUP_DIR/nginx.tar.gz nginx/

echo "Backup completed: $BACKUP_DIR"
```

### 恢复数据

```bash
# 恢复数据库
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} aiapi < backups/20240101_120000/database.sql

# 恢复应用数据
tar -xzf backups/20240101_120000/data.tar.gz
```

## 性能优化

### Nginx 优化

**增大文件上传限制：**
```nginx
client_max_body_size 200M;
```

**增加并发连接：**
```nginx
worker_processes auto;
worker_connections 4096;
```

### MySQL 优化

编辑 `mysql/conf.d/my.cnf`：
```ini
[mysqld]
# 根据服务器内存调整
innodb_buffer_pool_size = 4G      # 物理内存的 50-70%
innodb_log_file_size = 512M
max_connections = 1000
query_cache_size = 256M
```

### Redis 优化

```yaml
# docker-compose.yml
command: >
  redis-server
  --appendonly yes
  --maxmemory 2gb
  --maxmemory-policy allkeys-lru
```

## 故障排查

### 常见问题

**1. Nginx 无法启动 - SSL 证书问题**
```bash
# 检查证书文件
ls -la nginx/ssl/

# 检查证书格式
openssl x509 -in nginx/ssl/cert.pem -text -noout
openssl rsa -in nginx/ssl/key.pem -check

# 测试 Nginx 配置
docker compose exec nginx nginx -t
```

**2. 应用无法连接数据库**
```bash
# 检查 MySQL 状态
docker compose ps mysql
docker compose logs mysql

# 测试网络连通性
docker compose exec aiapi-gateway nc -zv mysql 3306

# 检查数据库连接字符串
docker compose exec aiapi-gateway env | grep SQL_DSN
```

**3. Redis 连接失败**
```bash
# 检查 Redis 状态
docker compose exec redis redis-cli ping

# 查看Redis日志
docker compose logs redis
```

**4. HTTPS 显示不安全**
- 自签名证书：正常现象，点击继续访问
- Let's Encrypt：检查域名解析和证书有效期

**5. 端口被占用**
```bash
# 查看端口占用
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3306

# 修改端口映射
# 编辑 docker-compose.yml 中的 ports 配置
```

### 查看服务状态

```bash
# 查看所有容器状态
docker compose ps

# 查看资源使用
docker stats

# 查看网络
docker network ls
docker network inspect docker_aiapi-network
```

## 安全建议

### 1. 修改默认密码
```bash
# .env 文件
MYSQL_ROOT_PASSWORD=strong_password_here
MYSQL_PASSWORD=strong_password_here
SESSION_SECRET=$(openssl rand -hex 32)
```

### 2. 限制服务暴露
```yaml
# MySQL 和 Redis 仅本地访问
ports:
  - "127.0.0.1:3306:3306"
  - "127.0.0.1:6379:6379"
```

### 3. 配置防火墙
```bash
# 开放端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 限制管理端口
sudo ufw allow from 192.168.1.0/24 to any port 8080
```

### 4. 定期更新
```bash
# 更新镜像
docker compose pull

# 重建容器
docker compose up -d
```

### 5. 启用访问日志
```nginx
# nginx/conf.d/default.conf
access_log /var/log/nginx/access.log;
error_log /var/log/nginx/error.log;
```

## 生产环境检查清单

- [ ] 修改所有默认密码
- [ ] 使用有效的 SSL 证书（Let's Encrypt）
- [ ] 配置域名解析
- [ ] 限制数据库和缓存端口访问
- [ ] 设置日志轮转
- [ ] 配置自动备份
- [ ] 设置监控告警
- [ ] 配置防火墙规则
- [ ] 测试故障恢复流程
- [ ] 文档化部署步骤

## 参考资料

- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)
- [MySQL 8.0 文档](https://dev.mysql.com/doc/refman/8.0/en/)
- [Redis 文档](https://redis.io/docs/)

## 技术支持

- GitHub Issues: https://github.com/lgdli/AIAPIGateway/issues
- 项目地址: https://github.com/lgdli/AIAPIGateway
