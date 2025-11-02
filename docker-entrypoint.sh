#!/bin/sh

# Docker 容器启动脚本
# 用于处理运行时环境变量注入

set -e

echo "🐳 启动 AI Travel Planner..."
echo "📊 环境信息:"
echo "  - Node.js: $(node --version)"
echo "  - 环境: $NODE_ENV"
echo "  - 端口: $PORT"

# 检查必需的环境变量
check_env_var() {
    local var_name=$1
    local var_value=$(eval echo \$$var_name)
    
    if [ -z "$var_value" ] || [ "$var_value" = "placeholder" ]; then
        echo "❌ 环境变量 $var_name 未配置或为占位符"
        return 1
    else
        echo "✅ $var_name: 已配置"
        return 0
    fi
}

echo "🔍 检查环境变量配置:"

# 检查所有必需的环境变量
missing_vars=""

if ! check_env_var "NEXT_PUBLIC_SUPABASE_URL"; then
    missing_vars="$missing_vars NEXT_PUBLIC_SUPABASE_URL"
fi

if ! check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
    missing_vars="$missing_vars NEXT_PUBLIC_SUPABASE_ANON_KEY"
fi

if ! check_env_var "DEEPSEEK_API_KEY"; then
    missing_vars="$missing_vars DEEPSEEK_API_KEY"
fi

if ! check_env_var "NEXT_PUBLIC_XFYUN_APP_ID"; then
    missing_vars="$missing_vars NEXT_PUBLIC_XFYUN_APP_ID"
fi

if ! check_env_var "NEXT_PUBLIC_XFYUN_API_KEY"; then
    missing_vars="$missing_vars NEXT_PUBLIC_XFYUN_API_KEY"
fi

if ! check_env_var "NEXT_PUBLIC_XFYUN_API_SECRET"; then
    missing_vars="$missing_vars NEXT_PUBLIC_XFYUN_API_SECRET"
fi

if ! check_env_var "NEXT_PUBLIC_AMAP_KEY"; then
    missing_vars="$missing_vars NEXT_PUBLIC_AMAP_KEY"
fi

if ! check_env_var "AMAP_WEB_SERVICE_KEY"; then
    missing_vars="$missing_vars AMAP_WEB_SERVICE_KEY"
fi

# 如果有缺失的环境变量，显示错误信息
if [ -n "$missing_vars" ]; then
    echo ""
    echo "❌ 发现缺失的环境变量:$missing_vars"
    echo ""
    echo "📋 请确保在启动容器时提供所有必需的环境变量："
    echo ""
    echo "使用 docker run:"
    echo "  docker run -p 3000:3000 --env-file .env ai-travel-planner:latest"
    echo ""
    echo "使用 docker-compose:"
    echo "  docker-compose up -d"
    echo ""
    echo "📖 详细配置说明请参考 BUILD_AND_RUN.md"
    echo ""
    exit 1
fi

echo ""
echo "✅ 所有环境变量配置正确"
echo "🚀 启动应用..."
echo ""

# 启动 Next.js 应用
exec "$@"
