import { create } from 'zustand';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize from localStorage
  initialize: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      set({
        token,
        user: JSON.parse(user),
        isAuthenticated: true,
      });
      
      // Connect WebSocket
      try {
        socketService.connect(JSON.parse(user).id);
      } catch (wsError) {
        console.error('WebSocket init error:', wsError);
      }
    }
  },

  // Login action
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Attempting login for:', email);
      const response = await authAPI.login({ email, password });
      console.log('Login response:', response);
      const { token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('Saved to localStorage:', { token: token?.substring(0, 20) + '...', user });
      
      // Update store
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Connect WebSocket
      try {
        socketService.connect(user.id);
      } catch (wsError) {
        console.error('WebSocket connection error:', wsError);
        // Continue anyway, WebSocket is not critical for login
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      return { success: false, error: error.response?.data?.error };
    }
  },

  // Register action
  register: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.register(data);
      const { token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update store
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Connect WebSocket
      try {
        socketService.connect(user.id);
      } catch (wsError) {
        console.error('WebSocket register error:', wsError);
      }
      
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        isLoading: false,
      });
      return { success: false, error: error.response?.data?.error };
    }
  },

  // Logout action
  logout: () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Disconnect WebSocket
    socketService.disconnect();
    
    // Clear store
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Update user profile
  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update store
      set({
        user: updatedUser,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Update failed',
        isLoading: false,
      });
      return { success: false, error: error.response?.data?.error };
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
