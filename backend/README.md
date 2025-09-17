# Asana Clone Backend API

A powerful REST API backend for an Asana clone application, built with Node.js, Express, PostgreSQL, and Socket.io for real-time collaboration.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Organizations & Workspaces**: Multi-tenant architecture supporting organizations and workspaces
- **Project Management**: Create, manage, and organize projects with different views (List, Board, Timeline, Calendar)
- **Task Management**: Comprehensive task system with subtasks, dependencies, and milestones
- **Team Collaboration**: Teams, team members, and role-based permissions
- **Real-time Updates**: WebSocket-based real-time notifications and updates using Socket.io
- **Comments & Activities**: Task comments with threading and activity feeds
- **Search**: Global search across tasks, projects, users, and teams
- **Notifications**: In-app notifications for task assignments, comments, and updates
- **Custom Fields**: Extensible custom field system for tasks
- **File Attachments**: Support for file attachments on tasks and comments

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user with optional organization
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

#### Workspaces
- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create new workspace
- `GET /api/workspaces/:id` - Get workspace details
- `PUT /api/workspaces/:id` - Update workspace
- `GET /api/workspaces/:id/members` - List workspace members
- `POST /api/workspaces/:id/members` - Add workspace member
- `DELETE /api/workspaces/:id/members/:userId` - Remove workspace member

#### Projects
- `GET /api/projects` - List projects (with optional workspace filter)
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/sections` - List project sections
- `POST /api/projects/:id/sections` - Create section
- `GET /api/projects/:id/members` - List project members
- `POST /api/projects/:id/members` - Add project member

#### Tasks
- `GET /api/tasks` - List tasks with filters
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details with subtasks
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/move` - Move task to different section/position
- `POST /api/tasks/:id/comments` - Add comment to task
- `GET /api/tasks/:id/comments` - Get task comments

#### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create new team
- `GET /api/teams/:id/members` - List team members
- `POST /api/teams/:id/members` - Add team member

#### Activities & Notifications
- `GET /api/activities` - Get activity feed
- `GET /api/activities/feed` - Get user's personalized feed
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

#### Search
- `GET /api/search?q=query` - Global search
- `GET /api/search/suggestions?q=query` - Quick search suggestions

## 🏗️ Database Schema

### Core Tables
- `organizations` - Multi-tenant organizations
- `users` - User accounts with authentication
- `workspaces` - Workspace containers
- `projects` - Project management
- `tasks` - Task items with full tracking
- `sections` - Project sections for organization
- `teams` - Team management
- `comments` - Task comments
- `attachments` - File attachments
- `tags` - Tagging system
- `activities` - Activity feed
- `notifications` - User notifications
- `custom_fields` - Extensible field system

### Relationship Tables
- `workspace_members` - Workspace membership
- `project_members` - Project membership
- `team_members` - Team membership
- `task_followers` - Task following
- `task_dependencies` - Task dependencies
- `task_tags` - Task tagging
- `task_custom_fields` - Custom field values

## 🔧 Environment Variables

```env
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=development|production
CORS_ORIGIN=http://localhost:3000
```

## 📦 Installation

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run in production
npm start
```

## 🔌 WebSocket Events

### Client Events
- `authenticate` - Authenticate socket connection
- `join-workspace` - Join workspace room
- `join-project` - Join project room
- `leave-project` - Leave project room
- `task-update` - Broadcast task update
- `comment-added` - Broadcast new comment
- `typing` - Typing indicator

### Server Events
- `task-updated` - Task was updated
- `new-comment` - New comment added
- `user-typing` - User typing indicator

## 🔐 Security Features

- JWT authentication with expiry
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- SQL injection prevention
- Input validation and sanitization
- Role-based access control
- Helmet.js for security headers

## 📊 Performance Features

- Database connection pooling
- Optimized queries with indexes
- Response compression
- Efficient pagination
- Caching strategies
- Real-time updates via WebSockets

## 🛠️ Technologies

- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Database (Neon)
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **Compression** - Response compression
- **CORS** - Cross-origin resource sharing

## 📝 API Response Format

### Success Response
```json
{
  "data": {},
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "errors": [] // Validation errors if applicable
}
```

## 🚀 Deployment

The backend is deployed and accessible at:
- **API Endpoint**: https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so
- **Health Check**: https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so/health

## 📄 License

MIT License

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
