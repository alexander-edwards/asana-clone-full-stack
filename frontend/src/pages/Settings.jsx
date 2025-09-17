import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import useAuthStore from '../store/authStore';
import { FiSettings } from 'react-icons/fi';

export default function Settings() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-asana-gray-100">
      <Sidebar workspaces={[]} selectedWorkspace={null} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-asana-gray-700">Settings</h1>
              <p className="text-asana-gray-500 mt-2">
                Manage your account and preferences
              </p>
            </div>

            <div className="card p-12 text-center">
              <FiSettings className="text-6xl text-asana-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-asana-gray-600 mb-2">
                Settings coming soon
              </h3>
              <p className="text-asana-gray-500">
                Account settings will be available soon
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
