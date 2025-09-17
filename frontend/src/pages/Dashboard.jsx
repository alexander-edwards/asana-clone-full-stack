import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceAPI, projectAPI, taskAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskList from '../components/TaskList';
import ProjectCard from '../components/ProjectCard';
import { FiPlus, FiGrid, FiList, FiCalendar, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [view, setView] = useState('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch workspaces
      const workspaceRes = await workspaceAPI.getAll();
      setWorkspaces(workspaceRes.data);
      
      if (workspaceRes.data.length > 0) {
        const workspace = workspaceRes.data[0];
        setSelectedWorkspace(workspace);
        
        // Fetch projects for the first workspace
        const projectRes = await projectAPI.getAll(workspace.id);
        setProjects(projectRes.data);
        
        // Fetch recent tasks
        const taskRes = await taskAPI.getAll({ 
          assignee_id: user?.id,
          limit: 5 
        });
        setRecentTasks(taskRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const stats = {
    totalProjects: projects.length,
    activeTasks: recentTasks.filter(t => t.status !== 'completed').length,
    completedTasks: recentTasks.filter(t => t.status === 'completed').length,
    upcomingDeadlines: recentTasks.filter(t => t.due_date && new Date(t.due_date) > new Date()).length,
  };

  return (
    <div className="flex h-screen bg-asana-gray-100">
      {/* Sidebar */}
      <Sidebar 
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-asana-coral mx-auto"></div>
                <p className="mt-4 text-asana-gray-500">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-asana-gray-700">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-asana-gray-500 mt-2">
                  Here's what's happening in your workspace today
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-asana-gray-500 text-sm">Total Projects</p>
                      <p className="text-2xl font-bold text-asana-gray-700 mt-1">
                        {stats.totalProjects}
                      </p>
                    </div>
                    <FiGrid className="text-3xl text-asana-purple" />
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-asana-gray-500 text-sm">Active Tasks</p>
                      <p className="text-2xl font-bold text-asana-gray-700 mt-1">
                        {stats.activeTasks}
                      </p>
                    </div>
                    <FiList className="text-3xl text-asana-coral" />
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-asana-gray-500 text-sm">Completed</p>
                      <p className="text-2xl font-bold text-asana-gray-700 mt-1">
                        {stats.completedTasks}
                      </p>
                    </div>
                    <FiCalendar className="text-3xl text-asana-green" />
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-asana-gray-500 text-sm">Due Soon</p>
                      <p className="text-2xl font-bold text-asana-gray-700 mt-1">
                        {stats.upcomingDeadlines}
                      </p>
                    </div>
                    <FiClock className="text-3xl text-asana-yellow" />
                  </div>
                </div>
              </div>

              {/* Projects Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-asana-gray-700">
                    Your Projects
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setView('grid')}
                      className={`p-2 rounded ${view === 'grid' ? 'bg-asana-gray-200' : 'hover:bg-asana-gray-200'}`}
                    >
                      <FiGrid />
                    </button>
                    <button
                      onClick={() => setView('list')}
                      className={`p-2 rounded ${view === 'list' ? 'bg-asana-gray-200' : 'hover:bg-asana-gray-200'}`}
                    >
                      <FiList />
                    </button>
                    <button
                      onClick={handleCreateProject}
                      className="btn btn-primary ml-4"
                    >
                      <FiPlus className="mr-2" />
                      New Project
                    </button>
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="card p-12 text-center">
                    <div className="text-6xl text-asana-gray-300 mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-asana-gray-600 mb-2">
                      No projects yet
                    </h3>
                    <p className="text-asana-gray-500 mb-4">
                      Create your first project to start organizing your work
                    </p>
                    <button onClick={handleCreateProject} className="btn btn-primary">
                      <FiPlus className="mr-2" />
                      Create Project
                    </button>
                  </div>
                ) : (
                  <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                    {projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        view={view}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Tasks Section */}
              {recentTasks.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-asana-gray-700 mb-4">
                    Your Recent Tasks
                  </h2>
                  <div className="card">
                    <TaskList
                      tasks={recentTasks}
                      onTaskClick={(task) => navigate(`/tasks/${task.id}`)}
                      compact
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
