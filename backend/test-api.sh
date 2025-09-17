#!/bin/bash

# Asana Clone API Test Script
# This script tests the main API endpoints

API_URL="https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so"
EMAIL="test$(date +%s)@example.com"
PASSWORD="TestPass123"

echo "🧪 Testing Asana Clone API at $API_URL"
echo "===========================================" 
echo ""

# Test health check
echo "1. Testing Health Check..."
curl -s "$API_URL/health" | python3 -m json.tool
echo ""

# Test registration
echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Test User\",
    \"organizationName\": \"Test Organization\"
  }")

echo "$REGISTER_RESPONSE" | python3 -m json.tool
TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
echo ""

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed. Exiting."
  exit 1
fi

echo "✅ Registration successful! Token obtained."
echo ""

# Test login
echo "3. Testing Login..."
curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }" | python3 -m json.tool
echo ""

# Test getting current user
echo "4. Testing Get Current User..."
curl -s -X GET "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test getting workspaces
echo "5. Testing Get Workspaces..."
WORKSPACES=$(curl -s -X GET "$API_URL/api/workspaces" \
  -H "Authorization: Bearer $TOKEN")
echo "$WORKSPACES" | python3 -m json.tool

WORKSPACE_ID=$(echo "$WORKSPACES" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id']) if data else print('')" 2>/dev/null)
echo ""

if [ ! -z "$WORKSPACE_ID" ]; then
  echo "✅ Found workspace: $WORKSPACE_ID"
  
  # Create a project
  echo "6. Testing Create Project..."
  PROJECT_RESPONSE=$(curl -s -X POST "$API_URL/api/projects" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test Project $(date +%s)\",
      \"description\": \"This is a test project\",
      \"workspace_id\": \"$WORKSPACE_ID\",
      \"view_type\": \"board\"
    }")
  
  echo "$PROJECT_RESPONSE" | python3 -m json.tool
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  echo ""
  
  if [ ! -z "$PROJECT_ID" ]; then
    echo "✅ Project created: $PROJECT_ID"
    
    # Create a task
    echo "7. Testing Create Task..."
    curl -s -X POST "$API_URL/api/tasks" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"title\": \"Test Task $(date +%s)\",
        \"description\": \"This is a test task\",
        \"project_id\": \"$PROJECT_ID\",
        \"priority\": \"high\",
        \"status\": \"todo\"
      }" | python3 -m json.tool
    echo ""
  fi
fi

echo "===========================================" 
echo "✅ API test completed successfully!"
echo ""
echo "You can use this token for further testing:"
echo "Bearer $TOKEN"
echo ""
echo "Test credentials:"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
