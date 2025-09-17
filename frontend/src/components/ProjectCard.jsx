import React from 'react';
import { FiUsers, FiCheckCircle, FiClock, FiMoreHorizontal } from 'react-icons/fi';

export default function ProjectCard({ project, view, onClick }) {
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProjectColor = (color) => {
    return color || '#6D7175';
  };

  const progressPercentage = project.task_count > 0
    ? Math.round((project.completed_task_count / project.task_count) * 100)
    : 0;

  if (view === 'list') {
    return (
      <div
        onClick={onClick}
        className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div
              className="w-10 h-10 rounded-lg mr-4 flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: getProjectColor(project.color) }}
            >
              {project.icon || project.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-700">{project.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 ml-4">
            {/* Progress */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{progressPercentage}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>

            {/* Tasks */}
            <div className="text-center">
              <div className="flex items-center text-gray-600">
                <FiCheckCircle className="mr-1" />
                <span className="font-medium">{project.completed_task_count}/{project.task_count}</span>
              </div>
              <div className="text-xs text-gray-500">Tasks</div>
            </div>

            {/* Members */}
            <div className="text-center">
              <div className="flex items-center text-gray-600">
                <FiUsers className="mr-1" />
                <span className="font-medium">{project.member_count || 0}</span>
              </div>
              <div className="text-xs text-gray-500">Members</div>
            </div>

            {/* Due Date */}
            {project.due_date && (
              <div className="text-center">
                <div className="flex items-center text-gray-600">
                  <FiClock className="mr-1" />
                  <span className="text-sm">{new Date(project.due_date).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div
      onClick={onClick}
      className="card p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Project Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: getProjectColor(project.color) }}
        >
          {project.icon || project.name.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle more options
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <FiMoreHorizontal className="text-gray-400" />
        </button>
      </div>

      {/* Project Name & Status */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 text-lg mb-1">{project.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-asana-green h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-600">
          <FiCheckCircle className="mr-1" />
          <span>{project.completed_task_count}/{project.task_count} tasks</span>
        </div>
        <div className="flex items-center text-gray-600">
          <FiUsers className="mr-1" />
          <span>{project.member_count || 0}</span>
        </div>
      </div>

      {/* Due Date */}
      {project.due_date && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <FiClock className="mr-1" />
            <span>Due {new Date(project.due_date).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
