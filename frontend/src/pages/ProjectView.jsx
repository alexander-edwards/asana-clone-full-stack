import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { projectAPI, taskAPI } from '../services/api';
import socketService from '../services/socket';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TaskModal from '../components/TaskModal';
import useAuthStore from '../store/authStore';
import { FiPlus, FiMoreHorizontal, FiGrid, FiList } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState(null);
  const [sections, setSections] = useState([]);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  useEffect(() => {
    fetchProjectData();
    socketService.joinProject(id);

    // Set up real-time listeners
    const unsubscribeTaskUpdate = socketService.on('task-updated', handleTaskUpdate);
    
    return () => {
      socketService.leaveProject(id);
      unsubscribeTaskUpdate();
    };
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // Fetch project details, sections, and tasks in parallel
      const [projectRes, sectionsRes, tasksRes] = await Promise.all([
        projectAPI.getById(id),
        projectAPI.getSections(id),
        taskAPI.getAll({ project_id: id }),
      ]);

      setProject(projectRes.data);
      setSections(sectionsRes.data);
      
      // Group tasks by section
      const tasksBySection = {};
      sectionsRes.data.forEach(section => {
        tasksBySection[section.id] = [];
      });
      tasksBySection['no-section'] = [];

      tasksRes.data.forEach(task => {
        if (task.section_id && tasksBySection[task.section_id]) {
          tasksBySection[task.section_id].push(task);
        } else {
          tasksBySection['no-section'].push(task);
        }
      });

      // Sort tasks by position
      Object.keys(tasksBySection).forEach(sectionId => {
        tasksBySection[sectionId].sort((a, b) => a.position - b.position);
      });

      setTasks(tasksBySection);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (data) => {
    // Real-time task update from WebSocket
    if (data.projectId === id) {
      fetchProjectData();
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Get the task being moved
    const taskId = draggableId;
    const sourceSectionId = source.droppableId;
    const destSectionId = destination.droppableId;

    // Update local state optimistically
    const newTasks = { ...tasks };
    const sourceList = [...newTasks[sourceSectionId]];
    const [movedTask] = sourceList.splice(source.index, 1);
    
    if (sourceSectionId === destSectionId) {
      // Moving within the same section
      sourceList.splice(destination.index, 0, movedTask);
      newTasks[sourceSectionId] = sourceList;
    } else {
      // Moving to a different section
      const destList = [...newTasks[destSectionId]];
      destList.splice(destination.index, 0, movedTask);
      newTasks[sourceSectionId] = sourceList;
      newTasks[destSectionId] = destList;
    }

    setTasks(newTasks);

    // Update on server
    try {
      await taskAPI.move(taskId, {
        section_id: destSectionId === 'no-section' ? null : destSectionId,
        position: destination.index,
      });

      // Emit real-time update
      socketService.emitTaskUpdate(id, taskId, {
        section_id: destSectionId,
        position: destination.index,
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
      // Revert on error
      fetchProjectData();
    }
  };

  const handleAddTask = async (sectionId) => {
    const title = prompt('Enter task title:');
    if (!title) return;

    try {
      const newTask = await taskAPI.create({
        title,
        project_id: id,
        section_id: sectionId === 'no-section' ? null : sectionId,
      });

      // Update local state
      const newTasks = { ...tasks };
      newTasks[sectionId] = [...(newTasks[sectionId] || []), newTask.data];
      setTasks(newTasks);

      toast.success('Task created');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleAddSection = async () => {
    const name = prompt('Enter section name:');
    if (!name) return;

    try {
      const newSection = await projectAPI.createSection(id, { name });
      setSections([...sections, newSection.data]);
      setTasks({ ...tasks, [newSection.data.id]: [] });
      toast.success('Section created');
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-asana-gray-100">
        <Sidebar workspaces={workspaces} selectedWorkspace={selectedWorkspace} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-asana-coral mx-auto"></div>
            <p className="mt-4 text-asana-gray-500">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-asana-gray-100">
      <Sidebar 
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />

        {/* Project Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-asana-gray-700">
                {project?.name}
              </h1>
              {project?.description && (
                <p className="text-asana-gray-500 mt-1">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewType('board')}
                className={`p-2 rounded ${viewType === 'board' ? 'bg-asana-gray-200' : 'hover:bg-asana-gray-100'}`}
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`p-2 rounded ${viewType === 'list' ? 'bg-asana-gray-200' : 'hover:bg-asana-gray-100'}`}
              >
                <FiList />
              </button>
              <button className="p-2 hover:bg-asana-gray-100 rounded">
                <FiMoreHorizontal />
              </button>
            </div>
          </div>
        </div>

        {/* Board View */}
        {viewType === 'board' && (
          <div className="flex-1 overflow-x-auto p-6">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-4 h-full">
                {sections.map((section) => (
                  <div key={section.id} className="flex-shrink-0 w-80">
                    <div className="bg-asana-gray-200 rounded-lg p-4 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-asana-gray-700">
                          {section.name}
                        </h3>
                        <span className="text-sm text-asana-gray-500">
                          {tasks[section.id]?.length || 0}
                        </span>
                      </div>

                      <Droppable droppableId={section.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 space-y-2 min-h-[100px] ${
                              snapshot.isDraggingOver ? 'bg-asana-gray-300 rounded' : ''
                            }`}
                          >
                            {tasks[section.id]?.map((task, index) => (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => handleTaskClick(task)}
                                    className={`task-card ${
                                      snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                    }`}
                                  >
                                    <h4 className="font-medium text-asana-gray-700">
                                      {task.title}
                                    </h4>
                                    {task.assignee_name && (
                                      <p className="text-sm text-asana-gray-500 mt-1">
                                        {task.assignee_name}
                                      </p>
                                    )}
                                    {task.due_date && (
                                      <p className="text-xs text-asana-gray-400 mt-2">
                                        Due {new Date(task.due_date).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      <button
                        onClick={() => handleAddTask(section.id)}
                        className="mt-4 w-full p-2 text-asana-gray-600 hover:bg-asana-gray-300 rounded-lg flex items-center justify-center"
                      >
                        <FiPlus className="mr-2" />
                        Add task
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Section Button */}
                <div className="flex-shrink-0 w-80">
                  <button
                    onClick={handleAddSection}
                    className="w-full h-24 border-2 border-dashed border-asana-gray-300 rounded-lg hover:border-asana-gray-400 flex items-center justify-center text-asana-gray-500 hover:text-asana-gray-600"
                  >
                    <FiPlus className="mr-2" />
                    Add section
                  </button>
                </div>
              </div>
            </DragDropContext>
          </div>
        )}

        {/* List View */}
        {viewType === 'list' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              {sections.map((section) => (
                <div key={section.id} className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-asana-gray-700 text-lg">
                      {section.name}
                    </h3>
                    <button
                      onClick={() => handleAddTask(section.id)}
                      className="text-sm text-asana-coral hover:underline"
                    >
                      Add task
                    </button>
                  </div>
                  <div className="space-y-2">
                    {tasks[section.id]?.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="card p-4 hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-asana-gray-700">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-asana-gray-500 mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-asana-gray-500">
                            {task.assignee_name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowTaskModal(false);
            fetchProjectData();
          }}
        />
      )}
    </div>
  );
}
