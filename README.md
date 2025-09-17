# 🚀 Asana Clone - Full Stack Application

A fully-featured Asana clone with real-time collaboration, task management, project organization, and team workflows. Built with modern web technologies for a seamless project management experience.

## 🌐 Live Demo

- **Frontend**: https://asana-frontend-morphvm-s6un9i69.http.cloud.morph.so
- **Backend API**: https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so
- **GitHub Repository**: https://github.com/alexander-edwards/asana-clone-full-stack

## 🎯 Features

### Core Functionality
- ✅ **User Authentication**: Secure JWT-based authentication with registration and login
- ✅ **Organizations & Workspaces**: Multi-tenant architecture supporting multiple organizations
- ✅ **Project Management**: Create and manage projects with different view types (List, Board, Timeline, Calendar)
- ✅ **Task Management**: Full task system with subtasks, dependencies, priorities, and due dates
- ✅ **Drag & Drop**: Intuitive drag-and-drop interface for moving tasks between sections
- ✅ **Real-time Updates**: WebSocket-based real-time collaboration using Socket.io
- ✅ **Teams**: Team creation and member management
- ✅ **Comments & Activities**: Task comments with activity tracking
- ✅ **Search**: Global search across tasks, projects, and users
- ✅ **Notifications**: In-app notifications for task assignments and updates
- ✅ **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Advanced Features
- 📊 Dashboard with statistics and recent activity
- 🏷️ Task tagging system
- 👥 Task followers and assignees
- 📎 File attachments support
- 🎨 Custom project colors and icons
- 📈 Progress tracking for projects and tasks
- 🔔 Real-time notifications
- 🔍 Quick search with suggestions

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database (hosted on Neon)
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS v3** - Styling framework
- **React Router v6** - Client-side routing
- **Zustand** - State management
- **React Beautiful DnD** - Drag and drop functionality
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates

### Database
- **PostgreSQL on Neon** - Cloud-hosted PostgreSQL
- **20+ tables** - Comprehensive schema for all features
- **Optimized indexes** - Fast query performance

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or use Neon cloud)
- Git

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/alexander-edwards/asana-clone-full-stack.git
cd asana-clone-full-stack/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

4. Run the backend:
```bash
npm start
```

The backend will be available at `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your backend API URL
```

4. Run the frontend:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🚀 Quick Start (Demo Mode)

### Test Credentials
Use these credentials for quick testing:
- **Email**: demo@asanaclone.com
- **Password**: Demo123456

The login page includes a "Quick Demo Login" button for easy testing.

## 📱 Usage

### 1. Register/Login
- Create a new account with optional organization
- Or use existing credentials to login

### 2. Create Workspace
- Set up workspaces for different teams or departments
- Customize colors and privacy settings

### 3. Create Projects
- Organize work into projects
- Choose between List, Board, Timeline, or Calendar views
- Set project colors, icons, and deadlines

### 4. Manage Tasks
- Create tasks with titles, descriptions, and due dates
- Assign tasks to team members
- Set priorities (Low, Medium, High, Urgent)
- Add subtasks for complex work
- Drag and drop tasks between sections
- Add comments and collaborate in real-time

### 5. Track Progress
- View dashboard for overall statistics
- Monitor project progress with visual indicators
- Track upcoming deadlines and overdue tasks

## 🔌 API Documentation

The backend provides a comprehensive REST API. Key endpoints include:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/move` - Move task between sections
- `POST /api/tasks/:id/comments` - Add comment

For complete API documentation, see `backend/API.md`

## 🧪 Testing

### Backend Testing
```bash
cd backend
./test-api.sh  # Run basic API tests
./comprehensive-test.sh  # Run full test suite
```

### Frontend Testing
- Manual testing through the UI
- Test drag-and-drop functionality
- Verify real-time updates with multiple browser tabs

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with 20+ tables including:
- `organizations`, `users`, `workspaces`
- `projects`, `sections`, `tasks`
- `teams`, `team_members`
- `comments`, `attachments`
- `activities`, `notifications`
- And relationship tables for many-to-many associations

## 🚢 Deployment

### Backend Deployment
The backend is deployed and accessible at:
- API: https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so
- Health Check: https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so/health

### Frontend Deployment
The frontend is deployed and accessible at:
- URL: https://asana-frontend-morphvm-s6un9i69.http.cloud.morph.so

### Database
- Hosted on Neon Cloud PostgreSQL
- Connection pooling enabled for performance

## 🐛 Known Issues & Limitations

1. **Search suggestions** - Minor SQL query optimization needed
2. **File uploads** - Attachment upload UI not yet implemented
3. **Timeline/Calendar views** - UI for these views coming soon
4. **Email notifications** - Email service integration pending
5. **Mobile app** - Progressive Web App support planned

## 🔮 Future Enhancements

- [ ] Timeline and Calendar view implementations
- [ ] File upload functionality
- [ ] Email notifications
- [ ] Mobile application
- [ ] Advanced reporting and analytics
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Time tracking
- [ ] Integration with third-party services
- [ ] Offline support with sync

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by [Asana](https://asana.com)
- Built with modern web technologies
- Icons from React Icons
- UI components from Headless UI

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ as a full-stack Asana clone demonstration**
