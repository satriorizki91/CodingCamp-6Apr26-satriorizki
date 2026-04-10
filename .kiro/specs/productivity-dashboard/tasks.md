# Implementation Plan: Productivity Dashboard

## Overview

This plan implements a single-page productivity dashboard with four independent widgets: greeting display, focus timer, task manager, and quick links manager. The implementation uses vanilla HTML, CSS, and JavaScript with Local Storage for persistence. The plan follows an incremental approach, building each widget with its core functionality, then adding property-based tests using fast-check, and finally integrating everything together.

## Tasks

- [x] 1. Set up project structure and HTML foundation
  - Create index.html with semantic HTML5 structure
  - Create css/styles.css file
  - Create js/app.js file
  - Add container elements for all four widgets (greeting, timer, tasks, links)
  - Link stylesheet and script in HTML
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 2. Implement Greeting Widget
  - [x] 2.1 Create GreetingWidget class with time/date formatting
    - Implement formatTime() function for 12-hour format with AM/PM
    - Implement formatDate() function for "Day, Month DD" format
    - Implement getGreeting() function with hour-based logic (morning 5-11, afternoon 12-16, evening 17-20, night 21-4)
    - Implement updateDisplay() to render time, date, and greeting to DOM
    - Implement startClock() with 1-second interval
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 2.2 Write property test for time formatting
    - **Property 1: Time formatting produces valid 12-hour format**
    - **Validates: Requirements 1.1**
    - Generate random Date objects and verify format matches "HH:MM:SS AM/PM" pattern

  - [ ]* 2.3 Write property test for date formatting
    - **Property 2: Date formatting includes all required components**
    - **Validates: Requirements 1.2**
    - Generate random Date objects and verify output contains day name, month name, and day number

  - [ ]* 2.4 Write property test for greeting logic
    - **Property 3: Greeting message matches hour range**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - Generate random hour values (0-23) and verify correct greeting for each range

- [ ] 3. Implement Focus Timer Widget
  - [x] 3.1 Create FocusTimer class with countdown logic
    - Initialize state with 1500 seconds (25 minutes)
    - Implement formatTime() for MM:SS display
    - Implement tick() to decrement seconds and stop at zero
    - Implement start(), stop(), reset() methods
    - Implement updateDisplay() to render timer to DOM
    - Add event listeners for start/stop/reset buttons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.2 Write property test for timer formatting
    - **Property 4: Timer formatting produces valid MM:SS format**
    - **Validates: Requirements 2.6**
    - Generate random second values (0-1500) and verify format matches "MM:SS" pattern

  - [ ]* 3.3 Write property test for timer reset
    - **Property 5: Timer reset restores initial state**
    - **Validates: Requirements 2.4**
    - Generate random timer states and verify reset always returns to 1500 seconds and stopped state

- [ ] 4. Checkpoint - Verify greeting and timer widgets
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Task List Widget - Core CRUD operations
  - [x] 5.1 Create TaskList class with data model and storage
    - Define task data model (id, text, completed, createdAt)
    - Implement generateId() helper function
    - Implement loadTasks() to deserialize from Local Storage
    - Implement saveTasks() to serialize to Local Storage
    - Implement validateTaskText() to reject empty strings
    - _Requirements: 3.6, 3.7_

  - [x] 5.2 Implement task CRUD methods
    - Implement addTask(text) with validation and storage persistence
    - Implement editTask(id, newText) with validation
    - Implement toggleTask(id) to flip completion status
    - Implement deleteTask(id) to remove from list
    - Implement renderTasks() to update DOM with current task list
    - Add visual differentiation for completed tasks (strikethrough, opacity)
    - Add event listeners for add, edit, toggle, delete actions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.3 Write property test for task creation
    - **Property 6: Task creation preserves text**
    - **Validates: Requirements 3.1**
    - Generate random non-empty strings and verify task text field matches input

  - [ ]* 5.4 Write property test for task editing
    - **Property 7: Task editing updates text**
    - **Validates: Requirements 3.2**
    - Generate random tasks and new text values, verify text updates while id and createdAt preserved

  - [ ]* 5.5 Write property test for task toggle idempotence
    - **Property 8: Task toggle is idempotent**
    - **Validates: Requirements 3.3**
    - Generate random tasks and verify toggling twice returns to original state

  - [ ]* 5.6 Write property test for task deletion
    - **Property 9: Task deletion removes task from list**
    - **Validates: Requirements 3.4**
    - Generate random task lists and verify deletion removes correct task and decreases length by one

  - [ ]* 5.7 Write property test for task storage round-trip
    - **Property 10: Task storage round-trip preserves data**
    - **Validates: Requirements 3.7**
    - Generate random task arrays, serialize and deserialize, verify all properties preserved

- [ ] 6. Implement Quick Links Widget - Core CRUD operations
  - [x] 6.1 Create QuickLinks class with data model and storage
    - Define link data model (id, name, url, createdAt)
    - Implement loadLinks() to deserialize from Local Storage
    - Implement saveLinks() to serialize to Local Storage
    - Implement validateUrl() to check for http:// or https:// protocol
    - _Requirements: 4.4, 4.5, 4.6_

  - [x] 6.2 Implement link CRUD methods
    - Implement addLink(name, url) with validation and storage persistence
    - Implement deleteLink(id) to remove from collection
    - Implement openLink(url) to open in new tab using window.open
    - Implement renderLinks() to update DOM with current link list
    - Add event listeners for add, delete, and click actions
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 6.3 Write property test for link creation
    - **Property 11: Link creation preserves data**
    - **Validates: Requirements 4.1**
    - Generate random name and URL strings, verify link object fields match inputs

  - [ ]* 6.4 Write property test for link deletion
    - **Property 12: Link deletion removes link from collection**
    - **Validates: Requirements 4.3**
    - Generate random link collections and verify deletion removes correct link and decreases length by one

  - [ ]* 6.5 Write property test for link storage round-trip
    - **Property 13: Link storage round-trip preserves data**
    - **Validates: Requirements 4.5**
    - Generate random link arrays, serialize and deserialize, verify all properties preserved

  - [ ]* 6.6 Write property test for URL validation
    - **Property 14: URL validation accepts valid protocols**
    - **Validates: Requirements 4.6**
    - Generate random URL strings and verify validator returns true only for http:// or https:// prefixes

- [x] 7. Checkpoint - Verify task and link widgets
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement error handling and edge cases
  - [x] 8.1 Add input validation error handling
    - Add error messages for empty task text
    - Add error messages for invalid URLs (missing protocol)
    - Add error messages for empty link names
    - Display user-friendly error messages in UI
    - _Requirements: 3.1, 4.1, 4.6_

  - [x] 8.2 Add Local Storage error handling
    - Wrap storage writes in try-catch for QuotaExceededError
    - Wrap JSON.parse in try-catch for corrupted data
    - Detect if Local Storage is unavailable (private browsing)
    - Display appropriate error messages for each scenario
    - Gracefully degrade to in-memory state when storage unavailable
    - _Requirements: 3.6, 3.7, 4.4, 4.5, 5.4_

  - [x] 8.3 Add timer edge case handling
    - Prevent multiple intervals when start clicked repeatedly
    - Ensure timer stops at zero and displays "00:00"
    - _Requirements: 2.2, 2.5_

- [x] 9. Implement CSS styling
  - [x] 9.1 Create base styles and layout
    - Add CSS reset and base typography
    - Implement flexbox/grid layout for dashboard container
    - Style each widget container with visual hierarchy
    - Add spacing, padding, and margins for clean layout
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 9.2 Style interactive elements and feedback
    - Style buttons with hover and active states
    - Style form inputs with focus states
    - Add visual differentiation for completed tasks (strikethrough, reduced opacity)
    - Add transition animations for smooth interactions (< 100ms)
    - Ensure sufficient color contrast for accessibility
    - _Requirements: 6.4, 3.5_

- [x] 10. Create Dashboard controller and initialize application
  - [x] 10.1 Implement Dashboard class
    - Create Dashboard class to coordinate all widgets
    - Instantiate GreetingWidget, FocusTimer, TaskList, QuickLinks
    - Call init() on all widgets
    - Add destroy() method for cleanup
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.2 Initialize application on page load
    - Add DOMContentLoaded event listener
    - Create Dashboard instance and call init()
    - Verify all widgets load and display correctly
    - _Requirements: 6.5_

- [x] 11. Final checkpoint and cross-browser testing
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify functionality in Chrome, Firefox, Edge, and Safari
  - _Requirements: 5.6_

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check library with minimum 100 iterations
- All widgets operate independently with their own state management
- Local Storage keys: `productivity-dashboard-tasks` and `productivity-dashboard-links`
- Target browsers: Chrome 60+, Firefox 60+, Edge 79+, Safari 12+
