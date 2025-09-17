import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiCheckCircle, FiInbox, FiUsers, FiFolder,
  FiPlus, FiChevronDown, FiChevronRight, FiSettings 
} from 'react-icons/fi';

export default function Sidebar({ workspaces, selectedWorkspace, onWorkspaceChange }) {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    projects: true,
    teams: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const menuItems = [
    { icon: FiHome, label: 'Home', path: '/' },
    { icon: FiCheckCircle, label: 'My Tasks', path: '/my-tasks' },
    { icon: FiInbox, label: 'Inbox', path: '/inbox' },
  ];

  return (
    <div className="w-64 bg-asana-gray-700 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-asana-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-asana-coral rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold">Asana Clone</span>
        </div>
      </div>

      {/* Workspace Selector */}
      {workspaces.length > 0 && (
        <div className="p-4 border-b border-asana-gray-600">
          <select
            value={selectedWorkspace?.id || ''}
            onChange={(e) => {
              const ws = workspaces.find(w => w.id === e.target.value);
              onWorkspaceChange(ws);
            }}
            className="w-full bg-asana-gray-600 text-white px-3 py-2 rounded-lg outline-none"
          >
            {workspaces.map(workspace => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item text-white ${isActive ? 'bg-asana-gray-600' : ''}`
              }
            >
              <item.icon className="mr-3" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Projects Section */}
        <div className="px-4 pb-4">
          <button
            onClick={() => toggleSection('projects')}
            className="w-full flex items-center justify-between py-2 text-sm text-asana-gray-400 hover:text-white"
          >
            <span className="flex items-center">
              {expandedSections.projects ? <FiChevronDown className="mr-2" /> : <FiChevronRight className="mr-2" />}
              Projects
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/projects/new');
              }}
              className="hover:bg-asana-gray-600 p-1 rounded"
            >
              <FiPlus />
            </button>
          </button>

          {expandedSections.projects && (
            <div className="mt-2 space-y-1">
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `sidebar-item text-white text-sm pl-6 ${isActive ? 'bg-asana-gray-600' : ''}`
                }
              >
                <FiFolder className="mr-3" />
                All Projects
              </NavLink>
            </div>
          )}
        </div>

        {/* Teams Section */}
        <div className="px-4 pb-4">
          <button
            onClick={() => toggleSection('teams')}
            className="w-full flex items-center justify-between py-2 text-sm text-asana-gray-400 hover:text-white"
          >
            <span className="flex items-center">
              {expandedSections.teams ? <FiChevronDown className="mr-2" /> : <FiChevronRight className="mr-2" />}
              Teams
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/teams/new');
              }}
              className="hover:bg-asana-gray-600 p-1 rounded"
            >
              <FiPlus />
            </button>
          </button>

          {expandedSections.teams && (
            <div className="mt-2 space-y-1">
              <NavLink
                to="/teams"
                className={({ isActive }) =>
                  `sidebar-item text-white text-sm pl-6 ${isActive ? 'bg-asana-gray-600' : ''}`
                }
              >
                <FiUsers className="mr-3" />
                All Teams
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-asana-gray-600">
        <button
          onClick={() => navigate('/settings')}
          className="sidebar-item text-white w-full"
        >
          <FiSettings className="mr-3" />
          Settings
        </button>
      </div>
    </div>
  );
}
