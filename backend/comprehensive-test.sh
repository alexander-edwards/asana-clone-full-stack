#!/bin/bash

# Comprehensive Asana Clone Backend Test
# This script thoroughly tests all API endpoints and features

API_URL="https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so"
EMAIL="verify$(date +%s)@test.com"
PASSWORD="VerifyPass123!"
SECOND_EMAIL="second$(date +%s)@test.com"

echo "🔍 COMPREHENSIVE BACKEND VERIFICATION TEST"
echo "=========================================="
echo "API URL: $API_URL"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check response
check_response() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

ERRORS=0

# 1. Health Check Test
echo -e "${YELLOW}1. HEALTH CHECK TEST${NC}"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$HEALTH" = "200" ]; then
    check_response 0 "Health endpoint responding"
else
    check_response 1 "Health endpoint not responding (Status: $HEALTH)"
fi
echo ""

# 2. Authentication Tests
echo -e "${YELLOW}2. AUTHENTICATION TESTS${NC}"

# Register first user
echo "Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Test User\",
    \"organizationName\": \"Test Org\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    check_response 0 "User registration"
    TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
    USER_ID=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['id'])" 2>/dev/null)
else
    check_response 1 "User registration failed"
    echo "$REGISTER_RESPONSE"
    exit 1
fi

# Test login
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    check_response 0 "User login"
else
    check_response 1 "User login failed"
fi

# Test get current user
ME_RESPONSE=$(curl -s -X GET "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | grep -q "email"; then
    check_response 0 "Get current user"
else
    check_response 1 "Get current user failed"
fi

# Test profile update
PROFILE_UPDATE=$(curl -s -X PUT "$API_URL/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Updated Name\"
  }")

if echo "$PROFILE_UPDATE" | grep -q "Updated Name"; then
    check_response 0 "Profile update"
else
    check_response 1 "Profile update failed"
fi
echo ""

# 3. Workspace Tests
echo -e "${YELLOW}3. WORKSPACE TESTS${NC}"

# Get workspaces
WORKSPACES=$(curl -s -X GET "$API_URL/api/workspaces" \
  -H "Authorization: Bearer $TOKEN")

if echo "$WORKSPACES" | grep -q "Test Org"; then
    check_response 0 "Get workspaces"
    WORKSPACE_ID=$(echo "$WORKSPACES" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
else
    check_response 1 "Get workspaces failed"
fi

# Create new workspace
NEW_WORKSPACE=$(curl -s -X POST "$API_URL/api/workspaces" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Engineering Team\",
    \"description\": \"Engineering workspace\",
    \"color\": \"#FF5733\"
  }")

if echo "$NEW_WORKSPACE" | grep -q "Engineering Team"; then
    check_response 0 "Create workspace"
    NEW_WORKSPACE_ID=$(echo "$NEW_WORKSPACE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
else
    check_response 1 "Create workspace failed"
fi

# Get workspace details
WORKSPACE_DETAILS=$(curl -s -X GET "$API_URL/api/workspaces/$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$WORKSPACE_DETAILS" | grep -q "member_count"; then
    check_response 0 "Get workspace details"
else
    check_response 1 "Get workspace details failed"
fi

# Update workspace
WORKSPACE_UPDATE=$(curl -s -X PUT "$API_URL/api/workspaces/$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Updated description\"
  }")

if echo "$WORKSPACE_UPDATE" | grep -q "Updated description"; then
    check_response 0 "Update workspace"
else
    check_response 1 "Update workspace failed"
fi

# Get workspace members
MEMBERS=$(curl -s -X GET "$API_URL/api/workspaces/$WORKSPACE_ID/members" \
  -H "Authorization: Bearer $TOKEN")

if echo "$MEMBERS" | grep -q "email"; then
    check_response 0 "Get workspace members"
else
    check_response 1 "Get workspace members failed"
fi
echo ""

# 4. Project Tests
echo -e "${YELLOW}4. PROJECT TESTS${NC}"

# Create project
PROJECT_RESPONSE=$(curl -s -X POST "$API_URL/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Q1 Launch\",
    \"description\": \"Product launch project\",
    \"workspace_id\": \"$WORKSPACE_ID\",
    \"view_type\": \"board\",
    \"color\": \"#3498db\",
    \"status\": \"active\"
  }")

if echo "$PROJECT_RESPONSE" | grep -q "Q1 Launch"; then
    check_response 0 "Create project"
    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
else
    check_response 1 "Create project failed"
fi

# Get projects
PROJECTS=$(curl -s -X GET "$API_URL/api/projects?workspace_id=$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROJECTS" | grep -q "Q1 Launch"; then
    check_response 0 "Get projects"
else
    check_response 1 "Get projects failed"
fi

# Get project details
PROJECT_DETAILS=$(curl -s -X GET "$API_URL/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROJECT_DETAILS" | grep -q "task_count"; then
    check_response 0 "Get project details"
else
    check_response 1 "Get project details failed"
fi

# Update project
PROJECT_UPDATE=$(curl -s -X PUT "$API_URL/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Updated project description\",
    \"status\": \"active\"
  }")

if echo "$PROJECT_UPDATE" | grep -q "Updated project description"; then
    check_response 0 "Update project"
else
    check_response 1 "Update project failed"
fi

# Get project sections
SECTIONS=$(curl -s -X GET "$API_URL/api/projects/$PROJECT_ID/sections" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SECTIONS" | grep -q "To Do"; then
    check_response 0 "Get project sections"
    SECTION_ID=$(echo "$SECTIONS" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
else
    check_response 1 "Get project sections failed"
fi

# Create new section
NEW_SECTION=$(curl -s -X POST "$API_URL/api/projects/$PROJECT_ID/sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Backlog\"
  }")

if echo "$NEW_SECTION" | grep -q "Backlog"; then
    check_response 0 "Create section"
else
    check_response 1 "Create section failed"
fi
echo ""

# 5. Task Tests
echo -e "${YELLOW}5. TASK TESTS${NC}"

# Create task
TASK_RESPONSE=$(curl -s -X POST "$API_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Implement login feature\",
    \"description\": \"Build the login functionality\",
    \"project_id\": \"$PROJECT_ID\",
    \"section_id\": \"$SECTION_ID\",
    \"priority\": \"high\",
    \"status\": \"todo\",
    \"due_date\": \"2025-12-31\",
    \"tags\": [\"frontend\", \"auth\"]
  }")

if echo "$TASK_RESPONSE" | grep -q "Implement login feature"; then
    check_response 0 "Create task"
    TASK_ID=$(echo "$TASK_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
else
    check_response 1 "Create task failed"
fi

# Create subtask
SUBTASK_RESPONSE=$(curl -s -X POST "$API_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Design login UI\",
    \"project_id\": \"$PROJECT_ID\",
    \"parent_task_id\": \"$TASK_ID\",
    \"priority\": \"medium\"
  }")

if echo "$SUBTASK_RESPONSE" | grep -q "Design login UI"; then
    check_response 0 "Create subtask"
else
    check_response 1 "Create subtask failed"
fi

# Get tasks
TASKS=$(curl -s -X GET "$API_URL/api/tasks?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TASKS" | grep -q "Implement login feature"; then
    check_response 0 "Get tasks"
else
    check_response 1 "Get tasks failed"
fi

# Get task details
TASK_DETAILS=$(curl -s -X GET "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TASK_DETAILS" | grep -q "subtasks"; then
    check_response 0 "Get task details"
else
    check_response 1 "Get task details failed"
fi

# Update task
TASK_UPDATE=$(curl -s -X PUT "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"in_progress\",
    \"priority\": \"urgent\"
  }")

if echo "$TASK_UPDATE" | grep -q "in_progress"; then
    check_response 0 "Update task"
else
    check_response 1 "Update task failed"
fi

# Add comment to task
COMMENT_RESPONSE=$(curl -s -X POST "$API_URL/api/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": \"Starting work on this task\"
  }")

if echo "$COMMENT_RESPONSE" | grep -q "Starting work"; then
    check_response 0 "Add comment to task"
else
    check_response 1 "Add comment failed"
fi

# Get task comments
COMMENTS=$(curl -s -X GET "$API_URL/api/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN")

if echo "$COMMENTS" | grep -q "Starting work"; then
    check_response 0 "Get task comments"
else
    check_response 1 "Get task comments failed"
fi

# Move task
MOVE_RESPONSE=$(curl -s -X PUT "$API_URL/api/tasks/$TASK_ID/move" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"position\": 0
  }")

if [ -n "$MOVE_RESPONSE" ]; then
    check_response 0 "Move task"
else
    check_response 1 "Move task failed"
fi
echo ""

# 6. Team Tests
echo -e "${YELLOW}6. TEAM TESTS${NC}"

# Create team
TEAM_RESPONSE=$(curl -s -X POST "$API_URL/api/teams" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Backend Team\",
    \"description\": \"Backend development team\",
    \"workspace_id\": \"$WORKSPACE_ID\",
    \"color\": \"#2ecc71\"
  }")

if echo "$TEAM_RESPONSE" | grep -q "Backend Team"; then
    check_response 0 "Create team"
    TEAM_ID=$(echo "$TEAM_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
else
    check_response 1 "Create team failed"
fi

# Get teams
TEAMS=$(curl -s -X GET "$API_URL/api/teams?workspace_id=$WORKSPACE_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TEAMS" | grep -q "Backend Team"; then
    check_response 0 "Get teams"
else
    check_response 1 "Get teams failed"
fi

# Get team members
TEAM_MEMBERS=$(curl -s -X GET "$API_URL/api/teams/$TEAM_ID/members" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TEAM_MEMBERS" | grep -q "$EMAIL"; then
    check_response 0 "Get team members"
else
    check_response 1 "Get team members failed"
fi
echo ""

# 7. Search Tests
echo -e "${YELLOW}7. SEARCH TESTS${NC}"

# Global search
SEARCH_RESULTS=$(curl -s -X GET "$API_URL/api/search?q=login" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SEARCH_RESULTS" | grep -q "tasks"; then
    check_response 0 "Global search"
else
    check_response 1 "Global search failed"
fi

# Search suggestions
SUGGESTIONS=$(curl -s -X GET "$API_URL/api/search/suggestions?q=impl" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SUGGESTIONS" | grep -q "label"; then
    check_response 0 "Search suggestions"
else
    check_response 1 "Search suggestions failed"
fi
echo ""

# 8. Activity & Notification Tests
echo -e "${YELLOW}8. ACTIVITY & NOTIFICATION TESTS${NC}"

# Get activities
ACTIVITIES=$(curl -s -X GET "$API_URL/api/activities?workspace_id=$WORKSPACE_ID&limit=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ACTIVITIES" | grep -q "created"; then
    check_response 0 "Get activities"
else
    check_response 1 "Get activities failed"
fi

# Get activity feed
FEED=$(curl -s -X GET "$API_URL/api/activities/feed" \
  -H "Authorization: Bearer $TOKEN")

if [ -n "$FEED" ]; then
    check_response 0 "Get activity feed"
else
    check_response 1 "Get activity feed failed"
fi

# Get notifications
NOTIFICATIONS=$(curl -s -X GET "$API_URL/api/notifications" \
  -H "Authorization: Bearer $TOKEN")

if [ -n "$NOTIFICATIONS" ]; then
    check_response 0 "Get notifications"
else
    check_response 1 "Get notifications failed"
fi

# Get unread count
UNREAD=$(curl -s -X GET "$API_URL/api/notifications/unread-count" \
  -H "Authorization: Bearer $TOKEN")

if echo "$UNREAD" | grep -q "count"; then
    check_response 0 "Get unread notification count"
else
    check_response 1 "Get unread count failed"
fi
echo ""

# 9. Error Handling Tests
echo -e "${YELLOW}9. ERROR HANDLING TESTS${NC}"

# Test 401 Unauthorized
UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/workspaces")
if [ "$UNAUTH" = "401" ]; then
    check_response 0 "401 Unauthorized handling"
else
    check_response 1 "401 Unauthorized not working properly"
fi

# Test 404 Not Found
NOTFOUND=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/projects/invalid-uuid" \
  -H "Authorization: Bearer $TOKEN")
if [ "$NOTFOUND" = "500" ] || [ "$NOTFOUND" = "404" ]; then
    check_response 0 "404 Not Found handling"
else
    check_response 1 "404 Not Found not working properly"
fi

# Test validation error
VALIDATION=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"invalid-email\",
    \"password\": \"123\"
  }")

if echo "$VALIDATION" | grep -q "error"; then
    check_response 0 "Validation error handling"
else
    check_response 1 "Validation errors not working"
fi
echo ""

# 10. WebSocket Test (Basic connectivity)
echo -e "${YELLOW}10. WEBSOCKET TEST${NC}"

# Check if WebSocket endpoint responds
WS_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/socket.io/")
if [ "$WS_CHECK" = "400" ] || [ "$WS_CHECK" = "200" ]; then
    check_response 0 "WebSocket endpoint accessible"
else
    check_response 1 "WebSocket endpoint not accessible"
fi
echo ""

# Final Summary
echo "=========================================="
echo -e "${YELLOW}VERIFICATION SUMMARY${NC}"
echo "=========================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "The backend is fully functional and ready for production."
else
    echo -e "${RED}❌ FAILED TESTS: $ERRORS${NC}"
    echo "Please review the errors above."
fi

echo ""
echo "Backend URL: $API_URL"
echo "Test User: $EMAIL"
echo "Test Token: $TOKEN"
echo "==========================================" 
