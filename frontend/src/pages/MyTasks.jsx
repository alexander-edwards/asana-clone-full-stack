import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskList from '../components/TaskList';
import { FiFilter, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyTasks() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = { assignee_id: user?.id };
      
      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.due_date = today;
      } else if (filter === 'upcoming') {
        params.status = 'todo';
      } else if (filter === 'completed') {
        params.status = 'completed';
      }

      const response = await taskAPI.getAll(params);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      await taskAPI.update(taskId, updates);
      fetchTasks();
      toast.success('Task updated');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    dueSoon: tasks.filter(t => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      const today = new Date();
      const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length,
  };

  return (
    <div className="flex h-screen bg-asana-gray-100">
      <Sidebar 
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-asana-gray-700">My Tasks</h1>
              <p className="text-asana-gray-500 mt-2">
                All your assigned tasks in one place
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-asana-gray-500">Total Tasks</p>
                    <p className="text-2xl font-bold text-asana-gray-700">{stats.total}</p>
                  </div>
                  <FiCheckCircle className="text-2xl text-asana-purple" />
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-asana-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-asana-gray-700">{stats.completed}</p>
                  </div>
                  <FiCheckCircle className="text-2xl text-asana-green" />
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-asana-gray-500">Due Soon</p>
                    <p className="text-2xl font-bold text-asana-gray-700">{stats.dueSoon}</p>
                  </div>
                  <FiCalendar className="text-2xl text-asana-coral" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-6">
              <FiFilter className="text-asana-gray-500" />
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-asana-coral text-white' : 'bg-white text-asana-gray-700'}`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setFilter('today')}
                className={`px-4 py-2 rounded-lg ${filter === 'today' ? 'bg-asana-coral text-white' : 'bg-white text-asana-gray-700'}`}
              >
                Due Today
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-lg ${filter === 'upcoming' ? 'bg-asana-coral text-white' : 'bg-white text-asana-gray-700'}`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-asana-coral text-white' : 'bg-white text-asana-gray-700'}`}
              >
                Completed
              </button>
            </div>

            {/* Tasks List */}
            <div className="card">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-asana-coral mx-auto"></div>
                  <p className="mt-4 text-asana-gray-500">Loading tasks...</p>
                </div>
              ) : (
                <TaskList
                  tasks={tasks}
                  onTaskClick={(task) => console.log('Task clicked:', task)}
                  onTaskUpdate={handleTaskUpdate}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
