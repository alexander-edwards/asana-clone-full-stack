import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://asana-backend-new-morphvm-s6un9i69.http.cloud.morph.so';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(userId) {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      if (userId) {
        this.authenticate(userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Set up default listeners
    this.setupDefaultListeners();
  }

  authenticate(userId) {
    if (this.socket) {
      this.socket.emit('authenticate', userId);
    }
  }

  joinWorkspace(workspaceId) {
    if (this.socket) {
      this.socket.emit('join-workspace', workspaceId);
    }
  }

  joinProject(projectId) {
    if (this.socket) {
      this.socket.emit('join-project', projectId);
    }
  }

  leaveProject(projectId) {
    if (this.socket) {
      this.socket.emit('leave-project', projectId);
    }
  }

  emitTaskUpdate(projectId, taskId, updates) {
    if (this.socket) {
      this.socket.emit('task-update', {
        projectId,
        taskId,
        updates,
      });
    }
  }

  emitCommentAdded(projectId, taskId, comment) {
    if (this.socket) {
      this.socket.emit('comment-added', {
        projectId,
        taskId,
        comment,
      });
    }
  }

  emitTyping(projectId, taskId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', {
        projectId,
        taskId,
        isTyping,
      });
    }
  }

  setupDefaultListeners() {
    if (!this.socket) return;

    this.socket.on('task-updated', (data) => {
      this.notifyListeners('task-updated', data);
    });

    this.socket.on('new-comment', (data) => {
      this.notifyListeners('new-comment', data);
    });

    this.socket.on('user-typing', (data) => {
      this.notifyListeners('user-typing', data);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }
}

export default new SocketService();
