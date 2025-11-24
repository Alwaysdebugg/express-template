#!/bin/bash

# JWT 中间件测试脚本
# 使用方法: bash Doc/test-jwt.sh

BASE_URL="http://127.0.0.1:3000"

echo "🧪 JWT 中间件测试"
echo "=================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 注册用户
echo -e "${YELLOW}1. 测试用户注册...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试用户",
    "email": "test'$(date +%s)'@example.com",
    "password": "123456"
  }')

echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# 提取 token
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 注册失败，无法获取 token${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Token 获取成功: ${TOKEN:0:50}...${NC}"
echo ""

# 2. 测试获取当前用户（需要认证）
echo -e "${YELLOW}2. 测试获取当前用户（需要认证）...${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$ME_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ME_RESPONSE"
echo ""

# 3. 测试验证 token
echo -e "${YELLOW}3. 测试验证 token...${NC}"
VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/verify" \
  -H "Authorization: Bearer $TOKEN")

echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

# 4. 测试无 token 访问（应该失败）
echo -e "${YELLOW}4. 测试无 token 访问（应该返回 401）...${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me")
echo "$NO_TOKEN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$NO_TOKEN_RESPONSE"
echo ""

# 5. 测试无效 token（应该失败）
echo -e "${YELLOW}5. 测试无效 token（应该返回 403）...${NC}"
INVALID_TOKEN_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer invalid.token.here")
echo "$INVALID_TOKEN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$INVALID_TOKEN_RESPONSE"
echo ""

echo -e "${GREEN}✅ 测试完成！${NC}"

