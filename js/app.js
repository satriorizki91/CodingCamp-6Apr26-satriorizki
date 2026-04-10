// Productivity Dashboard Application

// GreetingWidget Class
class GreetingWidget {
    constructor(containerElement) {
        if (!containerElement) {
            throw new Error('Container element is required');
        }
        this.container = containerElement;
        this.currentTime = null;
        this.updateInterval = null;
    }

    init() {
        this.startClock();
    }

    formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const period = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        
        // Pad with zeros
        const hoursStr = String(hours).padStart(2, '0');
        const minutesStr = String(minutes).padStart(2, '0');
        const secondsStr = String(seconds).padStart(2, '0');
        
        return `${hoursStr}:${minutesStr}:${secondsStr} ${period}`;
    }

    formatDate(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        const dayName = days[date.getDay()];
        const monthName = months[date.getMonth()];
        const dayNumber = date.getDate();
        
        return `${dayName}, ${monthName} ${dayNumber}`;
    }

    getGreeting(hour) {
        if (hour >= 5 && hour <= 11) {
            return 'Good morning';
        } else if (hour >= 12 && hour <= 16) {
            return 'Good afternoon';
        } else if (hour >= 17 && hour <= 20) {
            return 'Good evening';
        } else {
            return 'Good night';
        }
    }

    updateDisplay() {
        this.currentTime = new Date();
        const timeStr = this.formatTime(this.currentTime);
        const dateStr = this.formatDate(this.currentTime);
        const greetingStr = this.getGreeting(this.currentTime.getHours());
        
        // Get user name from localStorage, default is 'User'
        const userName = localStorage.getItem('dashboard-user-name') || 'User';
        
        this.container.innerHTML = `
            <h2>${greetingStr}, <span class="user-name" title="Click to change name">${userName}</span></h2>
            <div class="time">${timeStr}</div>
            <div class="date">${dateStr}</div>
        `;

        // Add event listener to change name when clicked
        const nameElement = this.container.querySelector('.user-name');
        if (nameElement) {
            nameElement.style.cursor = 'pointer'; // Beri indikasi bisa diklik
            nameElement.addEventListener('click', () => this.changeName());
        }
    }

    // New method to change name
    changeName() {
        const currentName = localStorage.getItem('dashboard-user-name') || 'User';
        const newName = prompt('Whats your name?', currentName);
    
        if (newName !== null && newName.trim() !== '') {
            localStorage.setItem('dashboard-user-name', newName.trim());
            this.updateDisplay(); // Refresh tampilan setelah nama diubah
    }
}

    startClock() {
        this.updateDisplay();
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// FocusTimer Class
class FocusTimer {
    constructor(containerElement) {
        if (!containerElement) {
            throw new Error('Container element is required');
        }
        this.container = containerElement;
        this.totalSeconds = 1500; // 25 minutes
        this.remainingSeconds = 1500;
        this.isRunning = false;
        this.intervalId = null;
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <h3>Focus Timer</h3>
            <div class="timer-display">${this.formatTime(this.remainingSeconds)}</div>
            <div class="timer-controls">
                <button class="start-btn">Start</button>
                <button class="stop-btn">Stop</button>
                <button class="reset-btn">Reset</button>
            </div>
        `;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const minutesStr = String(minutes).padStart(2, '0');
        const secondsStr = String(secs).padStart(2, '0');
        return `${minutesStr}:${secondsStr}`;
    }

    tick() {
        if (this.remainingSeconds > 0) {
            this.remainingSeconds--;
            this.updateDisplay();
            
            // Stop at zero
            if (this.remainingSeconds === 0) {
                this.stop();
            }
        }
    }

    updateDisplay() {
        const timeDisplay = this.container.querySelector('.timer-display');
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(this.remainingSeconds);
        }
    }

    start() {
        // Prevent multiple intervals
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    reset() {
        this.stop();
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
    }

    attachEventListeners() {
        const startBtn = this.container.querySelector('.start-btn');
        const stopBtn = this.container.querySelector('.stop-btn');
        const resetBtn = this.container.querySelector('.reset-btn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    destroy() {
        this.stop();
    }
}

// Helper function for generating unique IDs
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// TaskList Class
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

    validateTaskText(text) {
        if (typeof text !== 'string') {
            return false;
        }
        // Check if text is empty or only whitespace
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
        // Add task button
        const addBtn = this.container.querySelector('.add-task-btn');
        const taskInput = this.container.querySelector('.task-input');

        if (addBtn && taskInput) {
            addBtn.addEventListener('click', () => {
                const text = taskInput.value;
                try {
                    this.addTask(text);
                    taskInput.value = '';
                    this.clearError();
                } catch (error) {
                    this.showError(error.message);
                }
            });

            // Allow Enter key to add task
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addBtn.click();
                }
            });

            // Clear error on input
            taskInput.addEventListener('input', () => {
                this.clearError();
            });
        }

        // Event delegation for task actions
        const taskListElement = this.container.querySelector('.task-list');
        if (taskListElement) {
            taskListElement.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (!taskItem) return;

                const taskId = taskItem.dataset.id;

                // Toggle task completion
                if (e.target.classList.contains('task-checkbox')) {
                    try {
                        this.toggleTask(taskId);
                        this.clearError();
                    } catch (error) {
                        this.showError(error.message);
                    }
                }

                // Delete task
                if (e.target.classList.contains('delete-task-btn')) {
                    try {
                        this.deleteTask(taskId);
                        this.clearError();
                    } catch (error) {
                        this.showError(error.message);
                    }
                }

                // Edit task
                if (e.target.classList.contains('edit-task-btn')) {
                    const taskTextElement = taskItem.querySelector('.task-text');
                    const currentText = this.tasks.find(t => t.id === taskId)?.text || '';
                    const newText = prompt('Edit task:', currentText);
                    
                    if (newText !== null && newText !== currentText) {
                        try {
                            this.editTask(taskId, newText);
                            this.clearError();
                        } catch (error) {
                            this.showError(error.message);
                        }
                    }
                }
            });
        }
    }

    destroy() {
        // Cleanup if needed
    }
}

// QuickLinks Class
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
            <li class="link-item" data-id="${link.id}" data-url="${this.escapeHtml(link.url)}">
                <span class="link-anchor">
                    ${this.escapeHtml(link.name)}
                </span>
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
        // Add link button
        const addBtn = this.container.querySelector('.add-link-btn');
        const nameInput = this.container.querySelector('.link-name-input');
        const urlInput = this.container.querySelector('.link-url-input');

        if (addBtn && nameInput && urlInput) {
            addBtn.addEventListener('click', () => {
                const name = nameInput.value;
                const url = urlInput.value;
                try {
                    this.addLink(name, url);
                    nameInput.value = '';
                    urlInput.value = '';
                    this.clearError();
                } catch (error) {
                    this.showError(error.message);
                }
            });

            // Allow Enter key to add link
            const handleEnter = (e) => {
                if (e.key === 'Enter') {
                    addBtn.click();
                }
            };
            nameInput.addEventListener('keypress', handleEnter);
            urlInput.addEventListener('keypress', handleEnter);

            // Clear error on input
            nameInput.addEventListener('input', () => {
                this.clearError();
            });
            urlInput.addEventListener('input', () => {
                this.clearError();
            });
        }

        // Event delegation for link actions
        const linkListElement = this.container.querySelector('.link-list');
        if (linkListElement) {
            linkListElement.addEventListener('click', (e) => {
                const linkItem = e.target.closest('.link-item');
                if (!linkItem) return;

                // Delete link
                if (e.target.classList.contains('delete-link-btn')) {
                    const linkId = linkItem.dataset.id;
                    try {
                        this.deleteLink(linkId);
                        this.clearError();
                    } catch (error) {
                        this.showError(error.message);
                    }
                    return;
                }

                // Open link (click on link name or anywhere on the item except delete button)
                if (e.target.classList.contains('link-anchor') || e.target.classList.contains('link-item')) {
                    const url = linkItem.dataset.url;
                    if (url) {
                        this.openLink(url);
                    }
                }
            });
        }
    }

    destroy() {
        // Cleanup if needed
    }
}
// Light/Dark Mode Class - Change theme into light/dark mode
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('dashboard-theme') || 'light';
        this.toggleBtn = document.querySelector('#theme-toggle-btn');
    }

    init() {
        // Terapkan tema yang tersimpan saat load
        this.applyTheme();
        
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('dashboard-theme', this.theme);
        this.applyTheme();
    }

    applyTheme() {
        // Set atribut di level <html> atau <body>
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update teks tombol
        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = this.theme === 'light' ? '🌙' : '☀️';
        }
    }
}
// Dashboard Class - Coordinates all widgets
class Dashboard {
    constructor() {
        this.themeManager = new ThemeManager();
        this.greetingWidget = null;
        this.focusTimer = null;
        this.taskList = null;
        this.quickLinks = null;
    }

    init() {
        //Initialize Theme Manager
        this.themeManager.init();

        // Initialize Greeting Widget
        const greetingContainer = document.querySelector('#greeting-widget .greeting-content');
        if (greetingContainer) {
            this.greetingWidget = new GreetingWidget(greetingContainer);
            this.greetingWidget.init();
        }

        // Initialize Focus Timer
        const timerContainer = document.querySelector('#timer-widget');
        if (timerContainer) {
            this.focusTimer = new FocusTimer(timerContainer);
            this.focusTimer.init();
        }

        // Initialize Task List
        const tasksContainer = document.querySelector('#tasks-widget .tasks-content');
        if (tasksContainer) {
            this.taskList = new TaskList(tasksContainer);
            this.taskList.init();
        }

        // Initialize Quick Links
        const linksContainer = document.querySelector('#links-widget .links-content');
        if (linksContainer) {
            this.quickLinks = new QuickLinks(linksContainer);
            this.quickLinks.init();
        }

        console.log('Productivity Dashboard initialized');
    }

    destroy() {
        // Cleanup all widgets
        if (this.greetingWidget) {
            this.greetingWidget.destroy();
            this.greetingWidget = null;
        }
        if (this.focusTimer) {
            this.focusTimer.destroy();
            this.focusTimer = null;
        }
        if (this.taskList) {
            this.taskList.destroy();
            this.taskList = null;
        }
        if (this.quickLinks) {
            this.quickLinks.destroy();
            this.quickLinks = null;
        }
    }
}

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    dashboard.init();
});
