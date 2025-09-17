import React from 'react';
import { FiCheckCircle, FiCircle, FiClock, FiUser, FiMessageSquare } from 'react-icons/fi';

export default function TaskList({ tasks, onTaskClick, onTaskUpdate, compact = false }) {
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-400',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colors[priority] || 'text-gray-400';
  };

  const getStatusIcon = (status) => {
    return status === 'completed' ? (
      <FiCheckCircle className="text-green-500" />
    ) : (
      <FiCircle className="text-gray-400" />
    );
  };

  const handleStatusToggle = (e, task) => {
    e.stopPropagation();
    if (onTaskUpdate) {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      onTaskUpdate(task.id, { status: newStatus });
    }
  };

  const formatDueDate = (date) => {
    if (!date) return null;
    const due = new Date(date);
    const today = new Date();
    const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', className: 'text-red-500' };
    if (diffDays === 0) return { text: 'Today', className: 'text-orange-500' };
    if (diffDays === 1) return { text: 'Tomorrow', className: 'text-blue-500' };
    if (diffDays <= 7) return { text: `${diffDays} days`, className: 'text-gray-600' };
    return { text: due.toLocaleDateString(), className: 'text-gray-600' };
  };

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <FiCheckCircle className="text-4xl mx-auto mb-2" />
        <p>No tasks yet</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'divide-y divide-gray-200' : 'space-y-2'}>
      {tasks.map((task) => {
        const dueDate = formatDueDate(task.due_date);
        
        return (
          <div
            key={task.id}
            onClick={() => onTaskClick && onTaskClick(task)}
            className={`
              ${compact ? 'px-4 py-3' : 'p-4 rounded-lg border border-gray-200'}
              hover:bg-gray-50 cursor-pointer transition-colors
              ${task.status === 'completed' ? 'opacity-60' : ''}
            `}
          >
            <div className="flex items-start">
              {/* Status Checkbox */}
              <button
                onClick={(e) => handleStatusToggle(e, task)}
                className="mt-0.5 mr-3 text-lg hover:scale-110 transition-transform"
              >
                {getStatusIcon(task.status)}
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {task.title}
                  </h4>
                  <span className={`text-xs font-medium ml-2 ${getPriorityColor(task.priority)}`}>
                    {task.priority?.toUpperCase()}
                  </span>
                </div>

                {task.description && !compact && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* Task Meta */}
                <div className="flex items-center gap-4 mt-2">
                  {/* Due Date */}
                  {dueDate && (
                    <div className={`flex items-center text-sm ${dueDate.className}`}>
                      <FiClock className="mr-1" />
                      {dueDate.text}
                    </div>
                  )}

                  {/* Assignee */}
                  {task.assignee_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiUser className="mr-1" />
                      {task.assignee_name}
                    </div>
                  )}

                  {/* Comments */}
                  {task.comment_count > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiMessageSquare className="mr-1" />
                      {task.comment_count}
                    </div>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtasks Progress */}
                {task.subtask_count > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span>{task.completed_subtask_count}/{task.subtask_count} subtasks</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-asana-green h-1.5 rounded-full"
                        style={{ width: `${(task.completed_subtask_count / task.subtask_count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
