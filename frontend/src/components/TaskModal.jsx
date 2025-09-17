import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { FiX, FiUser, FiCalendar, FiTag, FiMessageSquare, FiPaperclip } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TaskModal({ task, onClose }) {
  const [taskData, setTaskData] = useState(task);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');

  useEffect(() => {
    fetchTaskDetails();
    fetchComments();
  }, [task.id]);

  const fetchTaskDetails = async () => {
    try {
      const response = await taskAPI.getById(task.id);
      setTaskData(response.data);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await taskAPI.getComments(task.id);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSave = async () => {
    try {
      await taskAPI.update(task.id, {
        title: editedTitle,
        description: editedDescription,
      });
      setTaskData({ ...taskData, title: editedTitle, description: editedDescription });
      setIsEditing(false);
      toast.success('Task updated');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await taskAPI.addComment(task.id, {
        content: newComment,
      });
      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await taskAPI.update(task.id, { status });
      setTaskData({ ...taskData, status });
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (priority) => {
    try {
      await taskAPI.update(task.id, { priority });
      setTaskData({ ...taskData, priority });
      toast.success('Priority updated');
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <select
              value={taskData.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={taskData.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex h-[600px]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Title */}
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-2xl font-bold mb-4 p-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <h1
                className="text-2xl font-bold mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => setIsEditing(true)}
              >
                {taskData.title}
              </h1>
            )}

            {/* Task Info */}
            <div className="flex flex-wrap gap-4 mb-6">
              {taskData.assignee_name && (
                <div className="flex items-center text-sm text-gray-600">
                  <FiUser className="mr-2" />
                  {taskData.assignee_name}
                </div>
              )}

              {taskData.due_date && (
                <div className="flex items-center text-sm text-gray-600">
                  <FiCalendar className="mr-2" />
                  Due {new Date(taskData.due_date).toLocaleDateString()}
                </div>
              )}

              {taskData.tags && taskData.tags.length > 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <FiTag className="mr-2" />
                  {taskData.tags.join(', ')}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              {isEditing ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg h-32"
                  placeholder="Add a description..."
                />
              ) : (
                <div
                  className="p-3 bg-gray-50 rounded-lg min-h-[100px] cursor-pointer hover:bg-gray-100"
                  onClick={() => setIsEditing(true)}
                >
                  {taskData.description || <span className="text-gray-400">Add a description...</span>}
                </div>
              )}
            </div>

            {/* Save/Cancel buttons */}
            {isEditing && (
              <div className="flex gap-2 mb-6">
                <button onClick={handleSave} className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTitle(taskData.title);
                    setEditedDescription(taskData.description || '');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Subtasks */}
            {taskData.subtasks && taskData.subtasks.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Subtasks</h3>
                <div className="space-y-2">
                  {taskData.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={subtask.status === 'completed'}
                        className="mr-3"
                        readOnly
                      />
                      <span className={subtask.status === 'completed' ? 'line-through text-gray-500' : ''}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center">
                <FiMessageSquare className="mr-2" />
                Comments ({comments.length})
              </h3>

              {/* Add Comment */}
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg h-24"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="btn btn-primary mt-2"
                >
                  Add Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start">
                    <div className="w-8 h-8 bg-asana-coral rounded-full flex items-center justify-center text-white mr-3">
                      {comment.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.user_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-gray-50 p-6 border-l border-gray-200">
            <h3 className="font-semibold mb-4">Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Project</label>
                <p className="font-medium">{taskData.project_name}</p>
              </div>

              {taskData.section_name && (
                <div>
                  <label className="text-sm text-gray-600">Section</label>
                  <p className="font-medium">{taskData.section_name}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600">Created by</label>
                <p className="font-medium">{taskData.created_by_name}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Created at</label>
                <p className="font-medium">
                  {new Date(taskData.created_at).toLocaleString()}
                </p>
              </div>

              {taskData.completed_at && (
                <div>
                  <label className="text-sm text-gray-600">Completed at</label>
                  <p className="font-medium">
                    {new Date(taskData.completed_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Attachments */}
              <div>
                <label className="text-sm text-gray-600 flex items-center">
                  <FiPaperclip className="mr-1" />
                  Attachments
                </label>
                <button className="text-sm text-asana-coral hover:underline mt-1">
                  Add attachment
                </button>
              </div>

              {/* Followers */}
              {taskData.followers && taskData.followers.length > 0 && (
                <div>
                  <label className="text-sm text-gray-600">Followers</label>
                  <div className="flex -space-x-2 mt-2">
                    {taskData.followers.map((follower) => (
                      <div
                        key={follower.id}
                        className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white border-2 border-white"
                        title={follower.name}
                      >
                        {follower.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
