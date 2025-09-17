# Asana Clone API Documentation

Base URL: `https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Authentication

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "organizationName": "My Company" // optional
}

Response:
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "organizationId": "uuid",
    "role": "admin"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "organizationId": "uuid",
    "role": "member"
  }
}
```

### 2. Workspaces

#### List Workspaces
```http
GET /api/workspaces
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "name": "Engineering Team",
    "description": "Engineering workspace",
    "color": "#FF5733",
    "is_private": false,
    "user_role": "admin",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Workspace
```http
POST /api/workspaces
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Design Team",
  "description": "Design and UX workspace",
  "color": "#3498db",
  "is_private": false
}
```

### 3. Projects

#### List Projects
```http
GET /api/projects?workspace_id=<workspace-uuid>
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "name": "Q1 Product Launch",
    "description": "Launch new product features",
    "status": "active",
    "view_type": "board",
    "task_count": 15,
    "completed_task_count": 8,
    "member_count": 5
  }
]
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mobile App Redesign",
  "description": "Redesign the mobile application",
  "workspace_id": "workspace-uuid",
  "status": "active",
  "color": "#2ecc71",
  "view_type": "board",
  "is_public": true,
  "due_date": "2024-03-31"
}
```

### 4. Tasks

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Design new homepage",
  "description": "Create mockups for the new homepage design",
  "project_id": "project-uuid",
  "section_id": "section-uuid",
  "assignee_id": "user-uuid",
  "status": "todo",
  "priority": "high",
  "due_date": "2024-02-15",
  "tags": ["design", "urgent"]
}
```

#### Update Task
```http
PUT /api/tasks/<task-id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "assignee_id": "new-user-uuid",
  "priority": "urgent"
}
```

#### Move Task
```http
PUT /api/tasks/<task-id>/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "section_id": "new-section-uuid",
  "position": 0
}
```

#### Add Comment
```http
POST /api/tasks/<task-id>/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great progress on this task!",
  "parent_comment_id": null
}
```

### 5. Search

#### Global Search
```http
GET /api/search?q=homepage&type=all&workspace_id=<workspace-uuid>
Authorization: Bearer <token>

Response:
{
  "tasks": [...],
  "projects": [...],
  "users": [...],
  "teams": [...]
}
```

#### Search Suggestions
```http
GET /api/search/suggestions?q=design
Authorization: Bearer <token>

Response:
[
  {
    "label": "Design new homepage",
    "type": "task",
    "id": "uuid"
  },
  {
    "label": "Design System Project",
    "type": "project",
    "id": "uuid"
  }
]
```

### 6. Teams

#### Create Team
```http
POST /api/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Frontend Team",
  "description": "Frontend development team",
  "workspace_id": "workspace-uuid",
  "color": "#9b59b6"
}
```

### 7. Notifications

#### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "type": "task_assigned",
    "title": "New task assigned",
    "message": "You have been assigned to: Design homepage",
    "is_read": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Mark as Read
```http
PUT /api/notifications/<notification-id>/read
Authorization: Bearer <token>
```

### 8. Activities

#### Get Activity Feed
```http
GET /api/activities/feed
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "entity_type": "task",
    "entity_id": "task-uuid",
    "action": "updated",
    "details": {
      "status": {
        "from": "todo",
        "to": "in_progress"
      }
    },
    "user_name": "John Doe",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

## WebSocket Events

### Connection
```javascript
const socket = io('wss://asana-backend-morphvm-s6un9i69.http.cloud.morph.so');

// Authenticate
socket.emit('authenticate', userId);

// Join rooms
socket.emit('join-workspace', workspaceId);
socket.emit('join-project', projectId);

// Listen for updates
socket.on('task-updated', (data) => {
  console.log('Task updated:', data);
});

socket.on('new-comment', (data) => {
  console.log('New comment:', data);
});

// Send updates
socket.emit('task-update', {
  projectId: 'project-uuid',
  taskId: 'task-uuid',
  updates: { status: 'completed' }
});
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Please authenticate"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!"
}
```

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15 minutes per IP address
- WebSocket connections are not rate limited

## Testing with cURL

### Register a new user:
```bash
curl -X POST https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "organizationName": "Test Org"
  }'
```

### Login:
```bash
curl -X POST https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Create a project (authenticated):
```bash
curl -X POST https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "workspace_id": "workspace-uuid",
    "view_type": "board"
  }'
```
