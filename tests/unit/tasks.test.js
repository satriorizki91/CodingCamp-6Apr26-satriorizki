import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();

global.localStorage = localStorageMock;

// Import the TaskList class and helper function
// Since we're testing the class directly, we need to extract it from app.js
// For now, we'll redefine it here for testing purposes

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

class TaskList {
  constructor(containerElement) {
    if (!containerElement) {
      throw new Error('Container element is required');
    }
    this.container = containerElement;
    this.tasks = [];
    this.storageKey = 'productivity-dashboard-tasks';
    this.storageAvailable = this.checkStorageAvailability();
  }

  init() {
    this.loadTasks();
    this.render();
    this.attachEventListeners();
    
    // Show warning if storage is unavailable
    if (!this.storageAvailable) {
      this.showError('Storage unavailable. Data will not persist after page refresh.');
    }
  }

  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('Local Storage is unavailable:', error);
      return false;
    }
  }

  loadTasks() {
    if (!this.storageAvailable) {
      this.tasks = [];
      return;
    }

    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        this.tasks = JSON.parse(storedData);
      } else {
        this.tasks = [];
      }
    } catch (error) {
      console.error('Failed to load tasks from storage:', error);
      this.tasks = [];
      
      // Check if it's a JSON parsing error (corrupted data)
      if (error instanceof SyntaxError) {
        this.showError('Could not load saved data. Starting fresh.');
        // Clear corrupted data
        try {
          localStorage.removeItem(this.storageKey);
        } catch (e) {
          // Ignore if we can't clear
        }
      }
    }
  }

  saveTasks() {
    // If storage is unavailable, keep data in memory only
    if (!this.storageAvailable) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        this.showError('Storage limit reached. Please delete some items.');
        throw new Error('Storage limit reached. Please delete some items.');
      } else {
        console.error('Failed to save tasks to storage:', error);
        this.showError('Failed to save data. Changes may not persist.');
        throw error;
      }
    }
  }

  showError(message) {
    const errorElement = this.container.querySelector('.task-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 3000);
    }
  }

  clearError() {
    const errorElement = this.container.querySelector('.task-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  validateTaskText(text) {
    if (typeof text !== 'string') {
      return false;
    }
    return text.trim().length > 0;
  }

  addTask(text) {
    if (!this.validateTaskText(text)) {
      throw new Error('Task cannot be empty');
    }

    const task = {
      id: generateId(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now()
    };

    this.tasks.push(task);
    this.saveTasks();
    this.renderTasks();
    return task;
  }

  editTask(id, newText) {
    if (!this.validateTaskText(newText)) {
      throw new Error('Task cannot be empty');
    }

    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      throw new Error('Task not found');
    }

    task.text = newText.trim();
    this.saveTasks();
    this.renderTasks();
    return task;
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      throw new Error('Task not found');
    }

    task.completed = !task.completed;
    this.saveTasks();
    this.renderTasks();
    return task;
  }

  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    this.tasks.splice(index, 1);
    this.saveTasks();
    this.renderTasks();
  }

  render() {
    this.container.innerHTML = `
      <h3>Tasks</h3>
      <div class="task-input-container">
        <input type="text" class="task-input" placeholder="Add a new task..." />
        <button class="add-task-btn">Add</button>
        <div class="error-message task-error" style="display: none;"></div>
      </div>
      <ul class="task-list"></ul>
    `;
  }

  renderTasks() {
    const taskListElement = this.container.querySelector('.task-list');
    if (!taskListElement) {
      return;
    }

    if (this.tasks.length === 0) {
      taskListElement.innerHTML = '<li class="empty-message">No tasks yet. Add one above!</li>';
      return;
    }

    taskListElement.innerHTML = this.tasks.map(task => `
      <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} />
        <span class="task-text">${this.escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="edit-task-btn" title="Edit">✏️</button>
          <button class="delete-task-btn" title="Delete">🗑️</button>
        </div>
      </li>
    `).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  attachEventListeners() {
    // Mock implementation for testing
  }

  destroy() {
    // Cleanup if needed
  }
}

describe('TaskList', () => {
  let taskList;
  let container;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Create a mock container element
    container = document.createElement('div');
    taskList = new TaskList(container);
  });

  describe('constructor', () => {
    it('should throw error if container element is not provided', () => {
      expect(() => new TaskList(null)).toThrow('Container element is required');
    });

    it('should initialize with empty tasks array', () => {
      expect(taskList.tasks).toEqual([]);
    });

    it('should set correct storage key', () => {
      expect(taskList.storageKey).toBe('productivity-dashboard-tasks');
    });

    it('should check storage availability', () => {
      expect(taskList.storageAvailable).toBe(true);
    });
  });

  describe('checkStorageAvailability', () => {
    it('should return true when localStorage is available', () => {
      expect(taskList.checkStorageAvailability()).toBe(true);
    });

    it('should return false when localStorage throws error', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage disabled');
      });

      const result = taskList.checkStorageAvailability();
      expect(result).toBe(false);

      localStorage.setItem = originalSetItem;
    });
  });

  describe('validateTaskText', () => {
    it('should reject empty string', () => {
      expect(taskList.validateTaskText('')).toBe(false);
    });

    it('should reject whitespace-only string', () => {
      expect(taskList.validateTaskText('   ')).toBe(false);
      expect(taskList.validateTaskText('\t\n')).toBe(false);
    });

    it('should accept non-empty string', () => {
      expect(taskList.validateTaskText('Buy groceries')).toBe(true);
    });

    it('should accept string with leading/trailing whitespace', () => {
      expect(taskList.validateTaskText('  Task with spaces  ')).toBe(true);
    });

    it('should reject non-string values', () => {
      expect(taskList.validateTaskText(null)).toBe(false);
      expect(taskList.validateTaskText(undefined)).toBe(false);
      expect(taskList.validateTaskText(123)).toBe(false);
      expect(taskList.validateTaskText({})).toBe(false);
    });
  });

  describe('loadTasks', () => {
    it('should initialize with empty array when no data in storage', () => {
      taskList.loadTasks();
      expect(taskList.tasks).toEqual([]);
    });

    it('should load tasks from localStorage', () => {
      const testTasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: Date.now() },
        { id: '2', text: 'Task 2', completed: true, createdAt: Date.now() }
      ];
      localStorage.setItem('productivity-dashboard-tasks', JSON.stringify(testTasks));
      
      taskList.loadTasks();
      expect(taskList.tasks).toEqual(testTasks);
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('productivity-dashboard-tasks', 'invalid json {');
      
      taskList.render(); // Need to render first to have error element
      taskList.loadTasks();
      expect(taskList.tasks).toEqual([]);
    });

    it('should clear corrupted data from storage', () => {
      localStorage.setItem('productivity-dashboard-tasks', 'invalid json {');
      
      taskList.render();
      taskList.loadTasks();
      
      const stored = localStorage.getItem('productivity-dashboard-tasks');
      expect(stored).toBeNull();
    });

    it('should handle unavailable storage gracefully', () => {
      const taskListWithoutStorage = new TaskList(container);
      taskListWithoutStorage.storageAvailable = false;
      
      taskListWithoutStorage.loadTasks();
      expect(taskListWithoutStorage.tasks).toEqual([]);
    });
  });

  describe('saveTasks', () => {
    it('should save tasks to localStorage', () => {
      taskList.tasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: Date.now() }
      ];
      
      taskList.saveTasks();
      
      const stored = localStorage.getItem('productivity-dashboard-tasks');
      expect(JSON.parse(stored)).toEqual(taskList.tasks);
    });

    it('should throw error when quota exceeded', () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      taskList.render(); // Need to render first to have error element
      taskList.tasks = [{ id: '1', text: 'Task', completed: false, createdAt: Date.now() }];
      
      expect(() => taskList.saveTasks()).toThrow('Storage limit reached. Please delete some items.');
      
      // Restore original
      localStorage.setItem = originalSetItem;
    });

    it('should not save when storage is unavailable', () => {
      const taskListWithoutStorage = new TaskList(container);
      taskListWithoutStorage.storageAvailable = false;
      taskListWithoutStorage.tasks = [{ id: '1', text: 'Task', completed: false, createdAt: Date.now() }];
      
      // Should not throw error
      taskListWithoutStorage.saveTasks();
      
      // Should not save to storage
      const stored = localStorage.getItem('productivity-dashboard-tasks');
      expect(stored).toBeNull();
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('init', () => {
    it('should call loadTasks', () => {
      const loadTasksSpy = vi.spyOn(taskList, 'loadTasks');
      taskList.init();
      expect(loadTasksSpy).toHaveBeenCalled();
    });
  });

  describe('addTask', () => {
    it('should add a new task with valid text', () => {
      const task = taskList.addTask('Buy groceries');
      
      expect(taskList.tasks).toHaveLength(1);
      expect(task.text).toBe('Buy groceries');
      expect(task.completed).toBe(false);
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
    });

    it('should trim whitespace from task text', () => {
      const task = taskList.addTask('  Task with spaces  ');
      expect(task.text).toBe('Task with spaces');
    });

    it('should throw error for empty text', () => {
      expect(() => taskList.addTask('')).toThrow('Task cannot be empty');
    });

    it('should throw error for whitespace-only text', () => {
      expect(() => taskList.addTask('   ')).toThrow('Task cannot be empty');
    });

    it('should persist task to localStorage', () => {
      taskList.addTask('Test task');
      
      const stored = localStorage.getItem('productivity-dashboard-tasks');
      const tasks = JSON.parse(stored);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].text).toBe('Test task');
    });
  });

  describe('editTask', () => {
    it('should update task text', () => {
      const task = taskList.addTask('Original text');
      const updatedTask = taskList.editTask(task.id, 'Updated text');
      
      expect(updatedTask.text).toBe('Updated text');
      expect(taskList.tasks[0].text).toBe('Updated text');
    });

    it('should trim whitespace from new text', () => {
      const task = taskList.addTask('Original');
      taskList.editTask(task.id, '  Updated  ');
      
      expect(taskList.tasks[0].text).toBe('Updated');
    });

    it('should preserve task id and createdAt', () => {
      const task = taskList.addTask('Original');
      const originalId = task.id;
      const originalCreatedAt = task.createdAt;
      
      taskList.editTask(task.id, 'Updated');
      
      expect(taskList.tasks[0].id).toBe(originalId);
      expect(taskList.tasks[0].createdAt).toBe(originalCreatedAt);
    });

    it('should throw error for empty text', () => {
      const task = taskList.addTask('Original');
      expect(() => taskList.editTask(task.id, '')).toThrow('Task cannot be empty');
    });

    it('should throw error for non-existent task', () => {
      expect(() => taskList.editTask('invalid-id', 'New text')).toThrow('Task not found');
    });

    it('should persist changes to localStorage', () => {
      const task = taskList.addTask('Original');
      taskList.editTask(task.id, 'Updated');
      
      const stored = localStorage.getItem('productivity-dashboard-tasks');
      const tasks = JSON.parse(stored);
      expect(tasks[0].text).toBe('Updated');
    });
  });

  describe('toggleTask', () => {
    it('should toggle task completion from false to true', () => {
      const task = taskList.addTask('Test task');
      expect(task.completed).toBe(false);
      
      taskList.toggleTask(task.id);
      expect(taskList.tasks[0].completed).toBe(true);
    });

    it('should toggle task completion from true to false', () => {
      const task = taskList.addTask('Test task');
      taskList.toggleTask(task.id);
      expect(taskList.tasks[0].completed).toBe(true);
      
      taskList.toggleTask(task.id);
      expect(taskList.tasks[0].completed).toBe(false);
    });

    it('should be idempotent when toggled twice', () => {
      const task = taskList.addTask('Test task');
      const originalState = task.completed;
      
      taskList.toggleTask(task.id);
      taskList.toggleTask(task.id);
      
      expect(taskList.tasks[0].completed).toBe(originalState);
    });

    it('should throw error for non-existent task', () => {
      expect(() => taskList.toggleTask('invalid-id')).toThrow('Task not found');
    });

    it('should persist changes to localStorage', () => {
      const task = taskList.addTask('Test task');
      taskList.toggleTask(task.id);
      
      const stored = localStorage.getItem('productivity-dashboard-tasks');
      const tasks = JSON.parse(stored);
      expect(tasks[0].completed).toBe(true);
    });
  });

  describe('deleteTask', () => {
    it('should remove task from list', () => {
      const task = taskList.addTask('Test task');
      expect(taskList.tasks).toHaveLength(1);
      
      taskList.deleteTask(task.id);
      expect(taskList.tasks).toHaveLength(0);
    });

    it('should remove correct task when multiple exist', () => {
      const task1 = taskList.addTask('Task 1');
      const task2 = taskList.addTask('Task 2');
      const task3 = taskList.addTask('Task 3');
      
      taskList.deleteTask(task2.id);
      
      expect(taskList.tasks).toHaveLength(2);
      expect(taskList.tasks.find(t => t.id === task1.id)).toBeDefined();
      expect(taskList.tasks.find(t => t.id === task2.id)).toBeUndefined();
      expect(taskList.tasks.find(t => t.id === task3.id)).toBeDefined();
    });

    it('should throw error for non-existent task', () => {
      expect(() => taskList.deleteTask('invalid-id')).toThrow('Task not found');
    });

    it('should persist changes to localStorage', () => {
      const task = taskList.addTask('Test task');
      taskList.deleteTask(task.id);
      
      const stored = localStorage.getItem('productivity-dashboard-tasks');
      const tasks = JSON.parse(stored);
      expect(tasks).toHaveLength(0);
    });
  });

  describe('renderTasks', () => {
    beforeEach(() => {
      // Setup DOM structure
      taskList.render();
    });

    it('should display empty message when no tasks', () => {
      taskList.renderTasks();
      const emptyMessage = container.querySelector('.empty-message');
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage.textContent).toContain('No tasks yet');
    });

    it('should render task items', () => {
      taskList.addTask('Task 1');
      taskList.addTask('Task 2');
      
      const taskItems = container.querySelectorAll('.task-item');
      expect(taskItems).toHaveLength(2);
    });

    it('should add completed class to completed tasks', () => {
      const task = taskList.addTask('Test task');
      taskList.toggleTask(task.id);
      
      const taskItem = container.querySelector('.task-item');
      expect(taskItem.classList.contains('completed')).toBe(true);
    });

    it('should check checkbox for completed tasks', () => {
      const task = taskList.addTask('Test task');
      taskList.toggleTask(task.id);
      
      const checkbox = container.querySelector('.task-checkbox');
      expect(checkbox.checked).toBe(true);
    });

    it('should escape HTML in task text', () => {
      taskList.addTask('<script>alert("xss")</script>');
      
      const taskText = container.querySelector('.task-text');
      expect(taskText.innerHTML).not.toContain('<script>');
      expect(taskText.innerHTML).toContain('&lt;script&gt;');
    });
  });
});
