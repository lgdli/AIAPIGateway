#!/bin/bash

# ========================================
# SSL 证书生成脚本
# ========================================

SSL_DIR="./ssl"
DOMAIN=${1:-"localhost"}

echo "=========================================="
echo "SSL 证书生成工具"
echo "=========================================="
echo "域名: $DOMAIN"
echo "证书目录: $SSL_DIR"
echo "=========================================="

# 创建SSL目录
mkdir -p $SSL_DIR

# 方式1: 生成自签名证书（用于测试）
generate_self_signed() {
    echo "[1] 生成自签名证书..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $SSL_DIR/key.pem \
        -out $SSL_DIR/cert.pem \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=AI-Gateway/OU=IT/CN=$DOMAIN" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1"
    
    echo "✓ 自签名证书已生成"
    echo "  - 证书: $SSL_DIR/cert.pem"
    echo "  - 私钥: $SSL_DIR/key.pem"
    echo "  注意: 浏览器会显示不安全警告，仅用于测试！"
}

# 方式2: 使用 Let's Encrypt（生产环境）
generate_letsencrypt() {
    echo "[2] 使用 Let's Encrypt..."
    echo "需要安装 certbot 并有公网域名"
    echo ""
    echo "安装 certbot:"
    echo "  Ubuntu/Debian: sudo apt install certbot"
    echo "  CentOS/RHEL:   sudo yum install certbot"
    echo "  macOS:         brew install certbot"
    echo ""
    echo "获取证书:"
    echo "  sudo certbot certonly --standalone -d $DOMAIN"
    echo ""
    echo "证书位置:"
    echo "  /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    echo "  /etc/letsencrypt/live/$DOMAIN/privkey.pem"
    echo ""
    echo "复制证书到项目:"
    echo "  sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/cert.pem"
    echo "  sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/key.pem"
    echo "  sudo chmod 644 $SSL_DIR/*.pem"
    echo ""
    echo "自动续期:"
    echo "  sudo crontab -e"
    echo "  0 0 1 * * certbot renew --quiet && docker compose restart nginx"
}

# 检查参数
case "$1" in
    letsencrypt|le)
        generate_letsencrypt
        ;;
    *)
        generate_self_signed
        ;;
esac

# 设置权限
chmod 644 $SSL_DIR/cert.pem 2>/dev/null
chmod 600 $SSL_DIR/key.pem 2>/dev/null

echo ""
echo "=========================================="
echo "证书生成完成！"
echo "=========================================="
echo "测试配置:"
echo "  docker compose up -d nginx"
echo "  curl -k https://localhost/api/status"
echo "=========================================="
