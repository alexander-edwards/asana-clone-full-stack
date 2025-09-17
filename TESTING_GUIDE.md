# Asana Clone - Testing Guide

## 🧪 Live Application URLs

- **Frontend**: https://asana-frontend-morphvm-s6un9i69.http.cloud.morph.so
- **Backend API**: https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so

## 🚀 Quick Start Testing

### Option 1: Use Demo Account
1. Navigate to the frontend URL
2. Click on "🚀 Quick Demo Login" button
3. Click "Log in" to access the application

**Demo Credentials:**
- Email: `demo@asanaclone.com`
- Password: `Demo123456`

### Option 2: Create New Account
1. Navigate to the frontend URL
2. Click "Create an account"
3. Fill in the registration form:
   - Name: Your name
   - Email: Your email
   - Password: Min 6 chars with uppercase, lowercase, and number
   - Organization (optional): Creates a new organization
4. Click "Sign up"

## 📋 Feature Testing Checklist

### 1. Authentication ✅
- [ ] Registration with new organization
- [ ] Login with credentials
- [ ] Logout functionality
- [ ] Protected routes redirect to login

### 2. Dashboard ✅
- [ ] View statistics cards
- [ ] See recent tasks
- [ ] View project cards
- [ ] Navigate to different sections

### 3. Workspace Management ✅
- [ ] Create new workspace
- [ ] Switch between workspaces (dropdown in sidebar)
- [ ] Edit workspace settings
- [ ] Add workspace members

### 4. Project Management ✅
- [ ] Create new project
- [ ] View project in Board view
- [ ] View project in List view
- [ ] Add project sections
- [ ] Edit project details

### 5. Task Management ✅
- [ ] Create new task
- [ ] Drag and drop tasks between sections
- [ ] Edit task details (click on task)
- [ ] Change task status and priority
- [ ] Add task description
- [ ] Set due dates
- [ ] Assign tasks to users

### 6. Real-time Features ✅
- [ ] Open app in two browser tabs
- [ ] Create/update task in one tab
- [ ] See updates appear in other tab
- [ ] Task position changes sync

### 7. Comments & Collaboration ✅
- [ ] Add comments to tasks
- [ ] View comment history
- [ ] See user avatars and timestamps

### 8. Search & Navigation ✅
- [ ] Use global search bar
- [ ] Navigate through sidebar menu
- [ ] Access My Tasks view
- [ ] View notifications

## 🔍 Testing Scenarios

### Scenario 1: Complete Project Workflow
1. **Login** with demo account
2. **Create a workspace** named "Test Workspace"
3. **Create a project** named "Website Redesign"
4. **Add sections**: "Design", "Development", "Testing"
5. **Create tasks** in each section:
   - Design: "Create mockups", "Review with team"
   - Development: "Build frontend", "Setup backend"
   - Testing: "User testing", "Bug fixes"
6. **Drag tasks** between sections
7. **Mark tasks** as completed
8. **Add comments** to tasks

### Scenario 2: Team Collaboration
1. **Create a team** in your workspace
2. **Invite members** (use different email)
3. **Assign tasks** to team members
4. **Set priorities** (High, Medium, Low)
5. **Add due dates** to tasks
6. **Track progress** on dashboard

### Scenario 3: Task Management
1. Navigate to **My Tasks**
2. Filter by **"Due Today"**
3. **Complete tasks** by clicking checkboxes
4. **Edit task** details
5. **Add subtasks**
6. **Set dependencies**

## 🐛 Known Issues to Test

### Current Limitations:
1. **File uploads** - UI present but upload not functional
2. **Timeline view** - Button present but view not implemented
3. **Calendar view** - Button present but view not implemented
4. **Email invitations** - Add member by email requires existing user

### Edge Cases:
1. **Empty states** - New user with no projects/tasks
2. **Long text** - Task titles and descriptions truncation
3. **Multiple workspaces** - Switching context
4. **Offline behavior** - Network disconnection handling

## 📊 Performance Testing

### Load Testing:
1. Create **50+ tasks** in a project
2. Test drag-and-drop performance
3. Check scrolling smoothness
4. Monitor real-time update speed

### Browser Compatibility:
- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## 🔐 Security Testing

### Authentication:
1. Try accessing protected routes without login
2. Test with invalid credentials
3. Check token expiration
4. Verify logout clears session

### Authorization:
1. Try editing other users' tasks
2. Access workspace you're not member of
3. Delete projects you don't own

## 📱 Responsive Design Testing

### Desktop (1920x1080) ✅
- Full sidebar visible
- Multi-column project board
- All features accessible

### Tablet (768x1024) ✅
- Condensed sidebar
- Responsive grid layout
- Touch-friendly controls

### Mobile (375x667) ✅
- Hamburger menu
- Single column layout
- Swipe gestures for navigation

## 🎯 API Testing

### Using cURL:
```bash
# Test health endpoint
curl https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so/health

# Test registration
curl -X POST https://asana-backend-morphvm-s6un9i69.http.cloud.morph.so/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

### Using the test script:
```bash
cd backend
./test-api.sh
```

## 📈 Metrics to Monitor

1. **Page Load Time**: Should be < 3 seconds
2. **API Response Time**: Should be < 500ms
3. **Real-time Update Latency**: Should be < 1 second
4. **Memory Usage**: Monitor for leaks
5. **Error Rate**: Should be < 1%

## ✅ Success Criteria

The application is considered fully functional when:
- All authentication flows work
- Projects and tasks can be created/edited/deleted
- Drag-and-drop works smoothly
- Real-time updates are instant
- No console errors in browser
- Responsive on all device sizes
- API endpoints return correct data

## 🆘 Troubleshooting

### Common Issues:
1. **"Network Error"** - Check if backend is running
2. **"401 Unauthorized"** - Token expired, login again
3. **Drag-drop not working** - Refresh the page
4. **Real-time not updating** - Check WebSocket connection
5. **Styles not loading** - Clear browser cache

### Debug Mode:
Open browser console (F12) to see:
- Network requests
- WebSocket messages
- Console errors
- Performance metrics

## 📝 Bug Reporting

If you find issues, please note:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and OS
5. Screenshots if applicable
6. Console errors

---

**Happy Testing! 🎉**
