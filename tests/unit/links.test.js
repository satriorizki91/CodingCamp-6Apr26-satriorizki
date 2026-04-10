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

// Helper function for generating unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// QuickLinks class definition for testing
class QuickLinks {
  constructor(containerElement) {
    if (!containerElement) {
      throw new Error('Container element is required');
    }
    this.container = containerElement;
    this.links = [];
    this.storageKey = 'productivity-dashboard-links';
    this.storageAvailable = this.checkStorageAvailability();
  }

  init() {
    this.loadLinks();
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

  loadLinks() {
    if (!this.storageAvailable) {
      this.links = [];
      return;
    }

    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        this.links = JSON.parse(storedData);
      } else {
        this.links = [];
      }
    } catch (error) {
      console.error('Failed to load links from storage:', error);
      this.links = [];
      
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

  saveLinks() {
    // If storage is unavailable, keep data in memory only
    if (!this.storageAvailable) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.links));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        this.showError('Storage limit reached. Please delete some items.');
        throw new Error('Storage limit reached. Please delete some items.');
      } else {
        console.error('Failed to save links to storage:', error);
        this.showError('Failed to save data. Changes may not persist.');
        throw error;
      }
    }
  }

  showError(message) {
    const errorElement = this.container.querySelector('.link-error');
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
    const errorElement = this.container.querySelector('.link-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  validateUrl(url) {
    if (typeof url !== 'string') {
      return false;
    }
    const trimmedUrl = url.trim();
    return trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
  }

  addLink(name, url) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Link name cannot be empty');
    }

    if (!this.validateUrl(url)) {
      throw new Error('URL must start with http:// or https://');
    }

    const link = {
      id: generateId(),
      name: name.trim(),
      url: url.trim(),
      createdAt: Date.now()
    };

    this.links.push(link);
    this.saveLinks();
    this.renderLinks();
    return link;
  }

  deleteLink(id) {
    const index = this.links.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error('Link not found');
    }

    this.links.splice(index, 1);
    this.saveLinks();
    this.renderLinks();
  }

  openLink(url) {
    window.open(url, '_blank');
  }

  render() {
    this.container.innerHTML = `
      <h3>Quick Links</h3>
      <div class="link-input-container">
        <input type="text" class="link-name-input" placeholder="Link name..." />
        <input type="text" class="link-url-input" placeholder="https://..." />
        <button class="add-link-btn">Add</button>
        <div class="error-message link-error" style="display: none;"></div>
      </div>
      <ul class="link-list"></ul>
    `;
  }

  renderLinks() {
    const linkListElement = this.container.querySelector('.link-list');
    if (!linkListElement) {
      return;
    }

    if (this.links.length === 0) {
      linkListElement.innerHTML = '<li class="empty-message">No links yet. Add one above!</li>';
      return;
    }

    linkListElement.innerHTML = this.links.map(link => `
      <li class="link-item" data-id="${link.id}">
        <a href="${this.escapeHtml(link.url)}" class="link-anchor" target="_blank" rel="noopener noreferrer">
          ${this.escapeHtml(link.name)}
        </a>
        <button class="delete-link-btn" title="Delete">🗑️</button>
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

describe('QuickLinks', () => {
    let container;
    let quickLinks;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        
        // Create fresh container
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.innerHTML = '';
        document.body.appendChild(container);
        
        // Create new instance
        quickLinks = new QuickLinks(container);
    });

    describe('constructor', () => {
        it('should throw error if container is not provided', () => {
            expect(() => new QuickLinks(null)).toThrow('Container element is required');
        });

        it('should initialize with empty links array', () => {
            expect(quickLinks.links).toEqual([]);
        });

        it('should set correct storage key', () => {
            expect(quickLinks.storageKey).toBe('productivity-dashboard-links');
        });

        it('should check storage availability', () => {
            expect(quickLinks.storageAvailable).toBe(true);
        });
    });

    describe('checkStorageAvailability', () => {
        it('should return true when localStorage is available', () => {
            expect(quickLinks.checkStorageAvailability()).toBe(true);
        });

        it('should return false when localStorage throws error', () => {
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = vi.fn(() => {
                throw new Error('Storage disabled');
            });

            const result = quickLinks.checkStorageAvailability();
            expect(result).toBe(false);

            localStorage.setItem = originalSetItem;
        });
    });

    describe('validateUrl', () => {
        it('should return true for URLs with http://', () => {
            expect(quickLinks.validateUrl('http://example.com')).toBe(true);
        });

        it('should return true for URLs with https://', () => {
            expect(quickLinks.validateUrl('https://example.com')).toBe(true);
        });

        it('should return false for URLs without protocol', () => {
            expect(quickLinks.validateUrl('example.com')).toBe(false);
        });

        it('should return false for URLs with ftp://', () => {
            expect(quickLinks.validateUrl('ftp://example.com')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(quickLinks.validateUrl('')).toBe(false);
        });

        it('should return false for non-string input', () => {
            expect(quickLinks.validateUrl(123)).toBe(false);
            expect(quickLinks.validateUrl(null)).toBe(false);
            expect(quickLinks.validateUrl(undefined)).toBe(false);
        });

        it('should handle URLs with whitespace', () => {
            expect(quickLinks.validateUrl('  https://example.com  ')).toBe(true);
            expect(quickLinks.validateUrl('  example.com  ')).toBe(false);
        });
    });

    describe('loadLinks', () => {
        it('should load links from localStorage', () => {
            const testLinks = [
                { id: '1', name: 'Google', url: 'https://google.com', createdAt: 123456 }
            ];
            localStorage.setItem('productivity-dashboard-links', JSON.stringify(testLinks));
            
            quickLinks.loadLinks();
            
            expect(quickLinks.links).toEqual(testLinks);
        });

        it('should initialize with empty array if no data in storage', () => {
            quickLinks.loadLinks();
            expect(quickLinks.links).toEqual([]);
        });

        it('should handle corrupted storage data', () => {
            localStorage.setItem('productivity-dashboard-links', 'invalid json');
            
            quickLinks.render();
            quickLinks.loadLinks();
            
            expect(quickLinks.links).toEqual([]);
        });

        it('should clear corrupted data from storage', () => {
            localStorage.setItem('productivity-dashboard-links', 'invalid json {');
            
            quickLinks.render();
            quickLinks.loadLinks();
            
            const stored = localStorage.getItem('productivity-dashboard-links');
            expect(stored).toBeNull();
        });

        it('should handle unavailable storage gracefully', () => {
            const linksWithoutStorage = new QuickLinks(container);
            linksWithoutStorage.storageAvailable = false;
            
            linksWithoutStorage.loadLinks();
            expect(linksWithoutStorage.links).toEqual([]);
        });
    });

    describe('saveLinks', () => {
        it('should save links to localStorage', () => {
            quickLinks.links = [
                { id: '1', name: 'Google', url: 'https://google.com', createdAt: 123456 }
            ];
            
            quickLinks.saveLinks();
            
            const stored = JSON.parse(localStorage.getItem('productivity-dashboard-links'));
            expect(stored).toEqual(quickLinks.links);
        });

        it('should throw error on quota exceeded', () => {
            // Mock localStorage to throw QuotaExceededError
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            };

            quickLinks.render();
            expect(() => quickLinks.saveLinks()).toThrow('Storage limit reached');
            
            // Restore
            localStorage.setItem = originalSetItem;
        });

        it('should not save when storage is unavailable', () => {
            const linksWithoutStorage = new QuickLinks(container);
            linksWithoutStorage.storageAvailable = false;
            linksWithoutStorage.links = [{ id: '1', name: 'Google', url: 'https://google.com', createdAt: 123456 }];
            
            // Should not throw error
            linksWithoutStorage.saveLinks();
            
            // Should not save to storage
            const stored = localStorage.getItem('productivity-dashboard-links');
            expect(stored).toBeNull();
        });
    });

    describe('addLink', () => {
        beforeEach(() => {
            quickLinks.init();
        });

        it('should add a new link with valid data', () => {
            const link = quickLinks.addLink('Google', 'https://google.com');
            
            expect(link).toHaveProperty('id');
            expect(link.name).toBe('Google');
            expect(link.url).toBe('https://google.com');
            expect(link).toHaveProperty('createdAt');
            expect(quickLinks.links).toHaveLength(1);
        });

        it('should trim whitespace from name and url', () => {
            const link = quickLinks.addLink('  Google  ', '  https://google.com  ');
            
            expect(link.name).toBe('Google');
            expect(link.url).toBe('https://google.com');
        });

        it('should throw error for empty name', () => {
            expect(() => quickLinks.addLink('', 'https://google.com')).toThrow('Link name cannot be empty');
        });

        it('should throw error for whitespace-only name', () => {
            expect(() => quickLinks.addLink('   ', 'https://google.com')).toThrow('Link name cannot be empty');
        });

        it('should throw error for invalid URL', () => {
            expect(() => quickLinks.addLink('Google', 'google.com')).toThrow('URL must start with http:// or https://');
        });

        it('should persist link to localStorage', () => {
            quickLinks.addLink('Google', 'https://google.com');
            
            const stored = JSON.parse(localStorage.getItem('productivity-dashboard-links'));
            expect(stored).toHaveLength(1);
            expect(stored[0].name).toBe('Google');
        });
    });

    describe('deleteLink', () => {
        beforeEach(() => {
            quickLinks.init();
        });

        it('should delete a link by id', () => {
            const link = quickLinks.addLink('Google', 'https://google.com');
            
            quickLinks.deleteLink(link.id);
            
            expect(quickLinks.links).toHaveLength(0);
        });

        it('should throw error if link not found', () => {
            expect(() => quickLinks.deleteLink('nonexistent')).toThrow('Link not found');
        });

        it('should persist deletion to localStorage', () => {
            const link = quickLinks.addLink('Google', 'https://google.com');
            
            quickLinks.deleteLink(link.id);
            
            const stored = JSON.parse(localStorage.getItem('productivity-dashboard-links'));
            expect(stored).toHaveLength(0);
        });

        it('should only delete the specified link', () => {
            const link1 = quickLinks.addLink('Google', 'https://google.com');
            const link2 = quickLinks.addLink('GitHub', 'https://github.com');
            
            quickLinks.deleteLink(link1.id);
            
            expect(quickLinks.links).toHaveLength(1);
            expect(quickLinks.links[0].id).toBe(link2.id);
        });
    });

    describe('openLink', () => {
        it('should call window.open with correct parameters', () => {
            const originalOpen = window.open;
            window.open = vi.fn();
            
            quickLinks.openLink('https://google.com');
            
            expect(window.open).toHaveBeenCalledWith('https://google.com', '_blank');
            
            window.open = originalOpen;
        });
    });

    describe('storage round-trip', () => {
        it('should preserve all link properties through save and load', () => {
            const originalLinks = [
                { id: '1', name: 'Google', url: 'https://google.com', createdAt: 123456 },
                { id: '2', name: 'GitHub', url: 'https://github.com', createdAt: 123457 }
            ];
            
            quickLinks.links = originalLinks;
            quickLinks.saveLinks();
            
            const newQuickLinks = new QuickLinks(container);
            newQuickLinks.loadLinks();
            
            expect(newQuickLinks.links).toEqual(originalLinks);
        });
    });
});
